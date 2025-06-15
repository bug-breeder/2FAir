-- +goose Up
-- Initial schema for E2E encrypted TOTP vault

-- Users table - stores basic user information
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

-- WebAuthn credentials for PRF-based key derivation
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

-- User encryption keys - stores wrapped DEKs per user
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

-- Encrypted TOTP seeds - the core E2E encrypted storage
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

-- Device sessions for multi-device sync
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

-- Sync operations log for conflict resolution
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

-- Backup recovery codes for account recovery
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

-- Audit log for security monitoring
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

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_webauthn_credentials_user_id ON webauthn_credentials(user_id);
CREATE INDEX idx_webauthn_credentials_credential_id ON webauthn_credentials(credential_id);
CREATE INDEX idx_user_encryption_keys_user_id_active ON user_encryption_keys(user_id) WHERE is_active = TRUE;
CREATE INDEX idx_encrypted_totp_seeds_user_id ON encrypted_totp_seeds(user_id);
CREATE INDEX idx_encrypted_totp_seeds_issuer ON encrypted_totp_seeds(issuer);
CREATE INDEX idx_encrypted_totp_seeds_updated_at ON encrypted_totp_seeds(updated_at);
CREATE INDEX idx_device_sessions_user_id_active ON device_sessions(user_id) WHERE is_active = TRUE;
CREATE INDEX idx_sync_operations_user_id_timestamp ON sync_operations(user_id, timestamp_vector);
CREATE INDEX idx_backup_recovery_codes_user_id_active ON backup_recovery_codes(user_id) WHERE is_active = TRUE;
CREATE INDEX idx_audit_logs_user_id_created_at ON audit_logs(user_id, created_at);

-- Note: Triggers for updated_at can be added in a future migration
-- For now we'll handle updated_at manually in the application code

-- +goose Down
-- Drop everything in reverse order

DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS backup_recovery_codes;
DROP TABLE IF EXISTS sync_operations;
DROP TABLE IF EXISTS device_sessions;
DROP TABLE IF EXISTS encrypted_totp_seeds;
DROP TABLE IF EXISTS user_encryption_keys;
DROP TABLE IF EXISTS webauthn_credentials;
DROP TABLE IF EXISTS users; 