# Database Schema Design - 2FAir E2E Encrypted TOTP Vault

## Overview

This document describes the PostgreSQL database schema design for 2FAir's end-to-end encrypted TOTP vault. The schema is designed to support zero-knowledge architecture, multi-device synchronization, and secure backup/recovery while maintaining high performance and data integrity.

## Design Principles

### Zero-Knowledge Architecture
- **No Plaintext Secrets**: TOTP seeds are never stored in plaintext
- **Encrypted Blobs**: All sensitive data stored as encrypted ciphertext
- **Metadata Separation**: Searchable metadata separated from encrypted content
- **Server Blindness**: Server operations require no access to plaintext data

### Multi-Device Support
- **Device Sessions**: Track active devices per user
- **Sync Operations**: Log all changes for conflict resolution
- **Timestamp Vectors**: Logical clocks for ordering operations
- **Session Management**: Secure device authentication and authorization

### Performance & Scalability
- **Indexed Queries**: All common queries have supporting indexes
- **Partitioning Ready**: Schema supports future table partitioning
- **Connection Efficiency**: Optimized for connection pooling
- **Query Optimization**: Designed for PostgreSQL query planner

## Schema Overview

```sql
-- Core user management
users
├── webauthn_credentials (1:N)
└── user_encryption_keys (1:N)
    └── encrypted_totp_seeds (1:N)

-- Multi-device support
users
├── device_sessions (1:N)
└── sync_operations (1:N)

-- Backup & Recovery
users
├── backup_recovery_codes (1:N)
└── audit_logs (1:N)
```

## Table Definitions

### users
Core user account information.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);
```

**Design Rationale:**
- **UUID Primary Key**: Avoids enumeration attacks, globally unique
- **Unique Constraints**: Prevent duplicate usernames/emails
- **Timezone Aware**: All timestamps include timezone information
- **Soft Delete**: `is_active` flag for account deactivation
- **Display Name**: Separate from username for UI purposes

**Indexes:**
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
```

### webauthn_credentials
WebAuthn/FIDO2 credentials for PRF-based authentication.

```sql
CREATE TABLE webauthn_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    credential_id BYTEA UNIQUE NOT NULL,
    public_key BYTEA NOT NULL,
    aaguid UUID,
    clone_warning BOOLEAN DEFAULT FALSE,
    attachment VARCHAR(50), -- platform, cross-platform
    transport TEXT[], -- usb, nfc, ble, internal
    backup_eligible BOOLEAN DEFAULT FALSE,
    backup_state BOOLEAN DEFAULT FALSE,
    sign_count BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE
);
```

**Design Rationale:**
- **Credential ID**: Unique identifier from WebAuthn
- **Public Key**: Stores the credential's public key for verification
- **AAGUID**: Authenticator Attestation GUID for device identification
- **Transport Methods**: Array of supported transport methods
- **Backup State**: Tracks if credential is backed up (synced passkey)
- **Sign Counter**: Anti-cloning protection
- **Clone Warning**: Flag for suspicious sign count decreases

**Indexes:**
```sql
CREATE INDEX idx_webauthn_credentials_user_id ON webauthn_credentials(user_id);
CREATE INDEX idx_webauthn_credentials_credential_id ON webauthn_credentials(credential_id);
```

### user_encryption_keys
Key-Encryption-Key (KEK) wrapped Data-Encryption-Keys (DEK) per user.

```sql
CREATE TABLE user_encryption_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key_version INTEGER NOT NULL DEFAULT 1,
    wrapped_dek BYTEA NOT NULL, -- DEK encrypted with KEK from WebAuthn PRF
    salt BYTEA NOT NULL, -- Salt used in HKDF for KEK->DEK derivation
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, key_version)
);
```

**Design Rationale:**
- **Key Versioning**: Supports key rotation without data loss
- **Wrapped DEK**: Never stores plaintext keys
- **Salt**: Unique salt per key version for HKDF
- **Active Flag**: Allows multiple key versions during rotation
- **Unique Constraint**: Prevents duplicate key versions

**Indexes:**
```sql
CREATE INDEX idx_user_encryption_keys_user_id_active ON user_encryption_keys(user_id) WHERE is_active = TRUE;
```

### encrypted_totp_seeds
End-to-end encrypted TOTP seeds with searchable metadata.

```sql
CREATE TABLE encrypted_totp_seeds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key_version INTEGER NOT NULL DEFAULT 1,
    
    -- Encrypted payload
    ciphertext BYTEA NOT NULL, -- AES-GCM encrypted TOTP seed + metadata
    iv BYTEA NOT NULL, -- AES-GCM initialization vector (96 bits)
    auth_tag BYTEA NOT NULL, -- AES-GCM authentication tag
    
    -- Searchable metadata (never encrypted for UX)
    issuer VARCHAR(255) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    icon_url TEXT,
    tags TEXT[],
    
    -- Timestamps and sync
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    FOREIGN KEY (user_id, key_version) REFERENCES user_encryption_keys(user_id, key_version)
);
```

**Design Rationale:**
- **Encrypted Payload**: Three-part AES-GCM ciphertext, IV, and auth tag
- **Searchable Metadata**: Issuer and account name for UI search
- **Icon URL**: For displaying service icons (not encrypted)
- **Tags Array**: PostgreSQL array for flexible categorization
- **Sync Timestamps**: Track creation, updates, and sync status
- **Foreign Key**: Links to specific key version

**Indexes:**
```sql
CREATE INDEX idx_encrypted_totp_seeds_user_id ON encrypted_totp_seeds(user_id);
CREATE INDEX idx_encrypted_totp_seeds_issuer ON encrypted_totp_seeds(issuer);
CREATE INDEX idx_encrypted_totp_seeds_updated_at ON encrypted_totp_seeds(updated_at);
```

### device_sessions
Multi-device session management for synchronization.

```sql
CREATE TABLE device_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id VARCHAR(255) NOT NULL, -- Client-generated stable device identifier
    device_name VARCHAR(255) NOT NULL,
    device_type VARCHAR(50) NOT NULL, -- mobile, desktop, web
    user_agent TEXT,
    ip_address INET,
    last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, device_id)
);
```

**Design Rationale:**
- **Device ID**: Client-generated stable identifier
- **Device Type**: Categorization for UI and security policies
- **IP Address**: INET type for efficient storage and queries
- **Expiration**: Time-based session expiration
- **Last Sync**: Track device activity for cleanup
- **Unique Constraint**: One active session per device per user

**Indexes:**
```sql
CREATE INDEX idx_device_sessions_user_id_active ON device_sessions(user_id) WHERE is_active = TRUE;
```

### sync_operations
Log of all synchronization operations for conflict resolution.

```sql
CREATE TABLE sync_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_session_id UUID REFERENCES device_sessions(id) ON DELETE SET NULL,
    operation_type VARCHAR(50) NOT NULL, -- create, update, delete
    resource_type VARCHAR(50) NOT NULL, -- totp_seed
    resource_id UUID NOT NULL,
    timestamp_vector BIGINT NOT NULL, -- Logical timestamp for ordering
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Design Rationale:**
- **Operation Types**: CRUD operations for conflict resolution
- **Resource Types**: Extensible for different data types
- **Timestamp Vector**: Logical clock for operation ordering
- **Device Reference**: Track which device made the change
- **Cascading**: SET NULL on device deletion preserves history

**Indexes:**
```sql
CREATE INDEX idx_sync_operations_user_id_timestamp ON sync_operations(user_id, timestamp_vector);
```

### backup_recovery_codes
Encrypted backup blobs for account recovery.

```sql
CREATE TABLE backup_recovery_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    encrypted_recovery_blob BYTEA NOT NULL, -- User's encrypted backup containing wrapped DEK
    salt BYTEA NOT NULL, -- Salt used with user passphrase
    hint TEXT, -- Optional hint for user's passphrase
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);
```

**Design Rationale:**
- **Encrypted Blob**: Contains wrapped DEK encrypted with user passphrase
- **Salt**: Unique salt for PBKDF2 key derivation
- **Hint**: Optional reminder for user (not security-sensitive)
- **Usage Tracking**: When recovery code was used
- **Active Flag**: Only one active recovery code per user

**Indexes:**
```sql
CREATE INDEX idx_backup_recovery_codes_user_id_active ON backup_recovery_codes(user_id) WHERE is_active = TRUE;
```

### audit_logs
Comprehensive audit trail for security monitoring.

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    device_session_id UUID REFERENCES device_sessions(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    event_details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Design Rationale:**
- **JSONB Details**: Flexible structure for event-specific data
- **Event Types**: Categorized security events
- **Optional References**: Events may not always have user context
- **IP Tracking**: Network forensics capability
- **Immutable**: No updates, append-only logging

**Indexes:**
```sql
CREATE INDEX idx_audit_logs_user_id_created_at ON audit_logs(user_id, created_at);
```

## Database Functions and Triggers

### Auto-Update Timestamps
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_encrypted_totp_seeds_updated_at BEFORE UPDATE ON encrypted_totp_seeds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Query Patterns and Performance

### Common Query Patterns

#### User Authentication
```sql
-- Get user by email for login
SELECT u.*, wc.credential_id, wc.public_key
FROM users u
JOIN webauthn_credentials wc ON u.id = wc.user_id
WHERE u.email = ? AND u.is_active = TRUE;
```

#### Vault Synchronization
```sql
-- Get user's TOTP seeds since last sync
SELECT * FROM encrypted_totp_seeds
WHERE user_id = ? AND updated_at > ?
ORDER BY updated_at ASC;
```

#### Device Management
```sql
-- Get active devices for user
SELECT * FROM device_sessions
WHERE user_id = ? AND is_active = TRUE AND expires_at > NOW()
ORDER BY last_sync_at DESC;
```

#### Search TOTP Seeds
```sql
-- Search by issuer or account name
SELECT * FROM encrypted_totp_seeds
WHERE user_id = ?
    AND (
        issuer ILIKE '%' || ? || '%'
        OR account_name ILIKE '%' || ? || '%'
        OR ? = ANY(tags)
    )
ORDER BY created_at DESC;
```

### Performance Optimizations

#### Index Usage
- All foreign keys have indexes
- Commonly filtered columns are indexed
- Partial indexes for boolean flags
- Composite indexes for multi-column queries

#### Query Optimization
- Use prepared statements for repeated queries
- Limit result sets with LIMIT clauses
- Use connection pooling
- Regular VACUUM and ANALYZE

#### Monitoring
```sql
-- Monitor slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
WHERE mean_time > 100
ORDER BY mean_time DESC;

-- Monitor index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
FROM pg_stat_user_indexes
WHERE idx_scan = 0;
```

## Security Considerations

### Data Protection
- **No Plaintext Secrets**: TOTP seeds never stored in plaintext
- **Encrypted at Rest**: Database-level encryption for additional protection
- **Access Control**: Role-based access with minimal privileges
- **Audit Trail**: All access logged for forensics

### Connection Security
- **TLS Required**: All connections use TLS 1.3
- **Certificate Validation**: Proper certificate verification
- **Connection Limits**: Prevent connection exhaustion attacks
- **IP Restrictions**: Optional IP allowlisting for admin access

### Backup Security
- **Encrypted Backups**: Database backups are encrypted
- **Secure Storage**: Backups stored in secure, separate location
- **Regular Testing**: Backup restoration regularly tested
- **Retention Policy**: Old backups securely deleted

## Migration Strategy

### Schema Versioning
```sql
CREATE TABLE schema_migrations (
    version INTEGER PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Migration Best Practices
- **Backwards Compatible**: New migrations don't break existing code
- **Rollback Plan**: Every migration has a rollback strategy
- **Testing**: Migrations tested on production-like data
- **Zero Downtime**: Use techniques like Blue-Green deployment

### Example Migration
```sql
-- Migration: Add tags column to encrypted_totp_seeds
BEGIN;

-- Add column with default
ALTER TABLE encrypted_totp_seeds 
ADD COLUMN tags TEXT[] DEFAULT '{}';

-- Create index
CREATE INDEX CONCURRENTLY idx_encrypted_totp_seeds_tags 
ON encrypted_totp_seeds USING GIN (tags);

-- Record migration
INSERT INTO schema_migrations (version) VALUES (2);

COMMIT;
```

This database schema provides a robust foundation for the E2E encrypted TOTP vault while maintaining security, performance, and scalability requirements. 