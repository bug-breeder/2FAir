# Design Overview - 2FAir E2E Encrypted TOTP Vault

## Current Implementation Status

### ✅ Phase 1 Complete: Foundation & Infrastructure
- **Backend**: Go 1.23+ with Gin framework, PostgreSQL, SQLC
- **Architecture**: Clean architecture with domain-driven design
- **Security**: Zero-knowledge database schema, no plaintext secrets
- **Development**: Complete Docker environment and development workflow

### 🔄 Phase 2 Ready: Authentication System
Multiple authentication strategies available based on current dependencies:

#### Option A: WebAuthn PRF (Original E2E Design)
- Pure WebAuthn with PRF extension for key derivation
- True zero-knowledge E2E encryption
- Requires adding WebAuthn library back to dependencies

#### Option B: OAuth First (Faster Implementation)
- Leverage existing Goth OAuth library
- Traditional authentication with Google/Microsoft/GitHub
- Upgrade path to WebAuthn encryption later

#### Option C: Hybrid Approach
- OAuth for user authentication
- WebAuthn for vault encryption keys
- Best of both worlds

## System Architecture

### High-Level Components

```mermaid
graph TB
    subgraph "Client Layer"
        UI[React Frontend]
        SW[Service Worker]
        IDB[IndexedDB Cache]
    end
    
    subgraph "API Gateway"
        CORS[CORS Middleware]
        AUTH[Auth Middleware]
        RATE[Rate Limiting]
        LOG[Request Logging]
    end
    
    subgraph "Backend Services"
        direction TB
        GIN[Gin HTTP Server]
        
        subgraph "Use Cases"
            AUTH_UC[Authentication Service]
            CRYPTO_UC[Cryptography Service]
            TOTP_UC[TOTP Management Service]
            SYNC_UC[Synchronization Service]
        end
        
        subgraph "Infrastructure"
            JWT_SVC[JWT Service]
            OAUTH_SVC[OAuth Service]
            WEBAUTHN_SVC[WebAuthn Service]
            CRYPTO_SVC[Encryption Service]
        end
    end
    
    subgraph "Data Layer"
        POSTGRES[(PostgreSQL)]
        REDIS[(Redis Cache)]
        BACKUP_STORE[Backup Storage]
    end
    
    UI --> CORS
    CORS --> AUTH
    AUTH --> RATE
    RATE --> LOG
    LOG --> GIN
    
    GIN --> AUTH_UC
    GIN --> CRYPTO_UC
    GIN --> TOTP_UC
    GIN --> SYNC_UC
    
    AUTH_UC --> JWT_SVC
    AUTH_UC --> OAUTH_SVC
    AUTH_UC --> WEBAUTHN_SVC
    CRYPTO_UC --> CRYPTO_SVC
    
    AUTH_UC --> POSTGRES
    CRYPTO_UC --> POSTGRES
    TOTP_UC --> POSTGRES
    SYNC_UC --> POSTGRES
    
    AUTH_UC --> REDIS
    CRYPTO_UC --> REDIS
```

### Current Database Schema (Implemented)

```mermaid
erDiagram
    USERS {
        uuid id PK
        string username UK
        string email UK
        string display_name
        timestamp created_at
        timestamp updated_at
        timestamp last_login_at
    }
    
    WEBAUTHN_CREDENTIALS {
        uuid id PK
        uuid user_id FK
        string credential_id UK
        bytea public_key
        bytea attestation_type
        bytea aaguid
        integer sign_count
        jsonb transport
        boolean prf_supported
        timestamp created_at
        timestamp last_used_at
    }
    
    USER_ENCRYPTION_KEYS {
        uuid id PK
        uuid user_id FK
        bytea wrapped_dek
        bytea kek_salt
        string key_version
        timestamp created_at
        timestamp expires_at
    }
    
    ENCRYPTED_TOTP_SEEDS {
        uuid id PK
        uuid user_id FK
        bytea encrypted_seed
        bytea iv
        string issuer
        string account_name
        string algorithm
        integer digits
        integer period
        timestamp created_at
        timestamp updated_at
        timestamp last_used_at
    }
    
    DEVICE_SESSIONS {
        uuid id PK
        uuid user_id FK
        string device_id UK
        string device_name
        string device_type
        string ip_address
        string user_agent
        timestamp created_at
        timestamp last_activity_at
        timestamp expires_at
    }
    
    SYNC_OPERATIONS {
        uuid id PK
        uuid user_id FK
        uuid seed_id FK
        string operation_type
        bytea operation_data
        timestamp created_at
        timestamp applied_at
    }
    
    BACKUP_RECOVERY_CODES {
        uuid id PK
        uuid user_id FK
        string code_hash
        bytea encrypted_backup_data
        boolean used
        timestamp created_at
        timestamp used_at
        timestamp expires_at
    }
    
    AUDIT_LOGS {
        uuid id PK
        uuid user_id FK
        string action
        jsonb details
        string ip_address
        string user_agent
        timestamp created_at
    }
    
    USERS ||--o{ WEBAUTHN_CREDENTIALS : "has"
    USERS ||--o{ USER_ENCRYPTION_KEYS : "has"
    USERS ||--o{ ENCRYPTED_TOTP_SEEDS : "owns"
    USERS ||--o{ DEVICE_SESSIONS : "has"
    USERS ||--o{ SYNC_OPERATIONS : "performs"
    USERS ||--o{ BACKUP_RECOVERY_CODES : "creates"
    USERS ||--o{ AUDIT_LOGS : "generates"
    ENCRYPTED_TOTP_SEEDS ||--o{ SYNC_OPERATIONS : "syncs"
```

## Authentication Flow Options

### Option A: WebAuthn PRF Flow (Original Design)

```mermaid
sequenceDiagram
    participant U as User
    participant C as Client
    participant S as Server
    participant A as Authenticator
    
    Note over U,A: Registration Flow
    U->>C: Register account
    C->>S: POST /auth/webauthn/register/begin
    S->>C: WebAuthn options with PRF
    C->>A: navigator.credentials.create()
    A->>C: PublicKeyCredential with PRF
    C->>S: POST /auth/webauthn/register/complete
    S->>S: Store credential + derive KEK from PRF
    S->>S: Generate DEK + wrap with KEK
    S->>C: Registration success
    
    Note over U,A: Authentication Flow
    U->>C: Login
    C->>S: POST /auth/webauthn/login/begin
    S->>C: WebAuthn options with PRF
    C->>A: navigator.credentials.get()
    A->>C: AuthenticatorAssertionResponse with PRF
    C->>S: POST /auth/webauthn/login/complete
    S->>S: Verify assertion + derive KEK from PRF
    S->>S: Unwrap DEK with KEK
    S->>C: JWT token + wrapped DEK
```

### Option B: OAuth First Flow (Faster Implementation)

```mermaid
sequenceDiagram
    participant U as User
    participant C as Client
    participant S as Server
    participant O as OAuth Provider
    
    Note over U,O: OAuth Authentication
    U->>C: Login with Google/Microsoft
    C->>S: GET /auth/oauth/login/:provider
    S->>C: Redirect to OAuth provider
    C->>O: OAuth authorization
    O->>C: Authorization code
    C->>S: GET /auth/oauth/callback/:provider?code=...
    S->>O: Exchange code for token
    O->>S: Access token + user info
    S->>S: Create/update user record
    S->>S: Generate encryption keys
    S->>C: JWT token + user info
    
    Note over U,S: Key Management
    C->>S: GET /api/keys/wrapped-dek
    S->>C: Wrapped DEK (encrypted with derived KEK)
    C->>C: Derive KEK from password/PIN
    C->>C: Unwrap DEK for encryption
```

### Option C: Hybrid Flow (OAuth + WebAuthn)

```mermaid
sequenceDiagram
    participant U as User
    participant C as Client
    participant S as Server
    participant O as OAuth Provider
    participant A as Authenticator
    
    Note over U,A: Initial Setup
    U->>C: Login with OAuth
    C->>O: OAuth flow
    O->>S: User authenticated
    S->>C: Basic session established
    
    Note over U,A: Vault Key Setup
    U->>C: Setup vault encryption
    C->>S: POST /auth/webauthn/register/begin
    S->>C: WebAuthn options with PRF
    C->>A: navigator.credentials.create()
    A->>C: PublicKeyCredential with PRF
    C->>S: POST /auth/webauthn/register/complete
    S->>S: Store credential + derive vault KEK
    S->>C: Vault ready
    
    Note over U,A: Vault Access
    U->>C: Access vault
    C->>A: navigator.credentials.get() (PRF)
    A->>C: PRF output for vault KEK
    C->>C: Derive vault KEK + unwrap DEK
    C->>C: Decrypt vault data
```

## Security Model

### Implemented Security Features ✅
- **Zero-knowledge database**: No plaintext secrets stored
- **Secure middleware**: CORS, CSP, security headers
- **Encrypted connections**: TLS 1.3 enforced
- **Audit logging**: All operations tracked
- **Rate limiting**: Abuse prevention built-in
- **Input validation**: SQL injection prevention
- **Secure session management**: Device tracking

### Phase 2 Security Options

#### Option A: WebAuthn PRF Security
- **Strongest**: True zero-knowledge E2E encryption
- **Key derivation**: WebAuthn PRF → HKDF → KEK → DEK
- **Multi-device**: Synced passkeys across devices
- **Backup**: Encrypted recovery codes

#### Option B: OAuth Security
- **Traditional**: Server-side key management
- **Key derivation**: User password/PIN → KEK → DEK
- **Multi-device**: Server-side key sharing
- **Backup**: Password-protected exports

#### Option C: Hybrid Security
- **Flexible**: OAuth for auth, WebAuthn for vault
- **Progressive**: Start simple, enhance security
- **User choice**: Optional WebAuthn upgrade
- **Fallback**: OAuth if WebAuthn unavailable

## Current Technology Stack

### Backend (Implemented)
- **Language**: Go 1.23+ with toolchain go1.24.2
- **Framework**: Gin HTTP framework
- **Database**: PostgreSQL 15+ with SQLC
- **Migrations**: Goose v3.24.3
- **Configuration**: Environment variables with validation
- **Logging**: Structured JSON logging with slog
- **Available Libraries**:
  - JWT: `github.com/dgrijalva/jwt-go`
  - OAuth: `github.com/markbates/goth`
  - OTP: `github.com/pquerna/otp`
  - MongoDB: `go.mongodb.org/mongo-driver` (if needed)

### Frontend (Planned)
- **Framework**: React 18+ with TypeScript
- **UI Library**: HeroUI (Tailwind CSS based)
- **State Management**: Zustand for global state
- **Data Fetching**: TanStack Query
- **Build Tool**: Vite
- **Package Manager**: Yarn

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Database**: PostgreSQL with connection pooling
- **Caching**: Redis for session management
- **Development**: Comprehensive Makefile workflow

## Implementation Decision Required

### Phase 2 Authentication Strategy

**Current Dependencies Support:**
- ✅ OAuth (Goth) - Ready to implement
- ✅ JWT (dgrijalva) - Ready to implement  
- ❌ WebAuthn - Would need to add library back
- ✅ TOTP (pquerna/otp) - Ready to implement

**Recommendation**: 
Start with **Option B (OAuth First)** for faster implementation:
1. Implement OAuth authentication with Goth
2. Add traditional key management with user-derived KEK
3. Build core TOTP functionality
4. Add WebAuthn enhancement in later phase

This approach provides:
- ✅ Faster time to market
- ✅ Proven technology stack
- ✅ Good user experience
- ✅ Clear upgrade path to WebAuthn PRF
- ✅ Maintains E2E encryption principles

The foundation is solid and ready for any of these approaches! 🚀 