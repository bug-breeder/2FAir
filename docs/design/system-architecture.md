# System Architecture - 2FAir E2E Encrypted TOTP Vault

**Status**: ✅ **Phase 3 Complete - Clean Architecture Implementation**  
**Last Updated**: January 2025  
**Architecture Pattern**: Clean Architecture (Uncle Bob) with Domain-Driven Design

## Overview

2FAir implements **Clean Architecture** principles with strict layer separation and dependency inversion. The system ensures zero-knowledge encryption where the server never accesses plaintext TOTP secrets, while maintaining excellent code quality, testability, and maintainability through domain-driven design.

## 🏗️ Clean Architecture Implementation

### Architectural Layers

```
┌─────────────────────────────────────────────────────────────┐
│                   External Systems                         │
│  Web Browsers │  PostgreSQL  │  OAuth Providers │  WebAuthn │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│              🔴 Interface Layer                             │
│  • HTTP Handlers    • Middleware    • Server Setup         │
│  • Request/Response • Error Handling • Route Management    │
└─────────────────────────────────────────────────────────────┘
                              │ (Depends on ↓)
┌─────────────────────────────────────────────────────────────┐
│           🔵 Application Layer (Use Cases)                  │
│  • Auth Service     • OTP Service    • Business Logic      │
│  • Use Case Orchestration    • Application-specific Logic │
└─────────────────────────────────────────────────────────────┘
                              │ (Depends on ↓)
┌─────────────────────────────────────────────────────────────┐
│                🟡 Domain Layer (Core Business)             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │  entities/  │ │ interfaces/ │ │         dto/            │ │
│  │ • User      │ │ • Services  │ │ • Data Transfer Objects │ │
│  │ • OTP       │ │ • Repos     │ │ • Request/Response      │ │
│  │ • WebAuthn  │ │ • Contracts │ │ • Validation Rules      │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
│                    No External Dependencies                │
└─────────────────────────────────────────────────────────────┘
                              ↑ (Implements ↑)
┌─────────────────────────────────────────────────────────────┐
│            🟢 Infrastructure Layer                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────────┐ │
│  │ crypto/ │ │ totp/   │ │webauthn/│ │     database/       │ │
│  │ • AES   │ │ • TOTP  │ │ • PRF   │ │ • PostgreSQL        │ │
│  │ • HKDF  │ │ • Codes │ │ • Auth  │ │ • SQLC              │ │
│  │ • PBKDF2│ │ • Config│ │ • Creds │ │ • Repositories      │ │
│  └─────────┘ └─────────┘ └─────────┘ │ • Migrations        │ │
│                                     └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Dependency Rules ✅

1. **Inward Dependencies Only**: Dependencies point toward the center (domain)
2. **No Outward Dependencies**: Domain layer has zero external dependencies
3. **Interface Segregation**: All external dependencies accessed via domain interfaces
4. **Dependency Inversion**: Infrastructure implements domain contracts

## 📁 Directory Structure (Clean Architecture)

```
server/
├── cmd/server/                    # 🚀 Entry Point
│   └── main.go                   # Dependency injection & startup
│
├── internal/
│   ├── application/              # 🔵 Application Layer
│   │   └── usecases/             # Business logic orchestration
│   │       ├── auth_service.go   # Authentication use cases
│   │       └── otp_service.go    # OTP management use cases
│   │
│   ├── domain/                   # 🟡 Domain Layer (Pure Business Logic)
│   │   ├── entities/             # Business entities & value objects
│   │   ├── interfaces/           # Domain service contracts
│   │   └── dto/                 # Data transfer objects
│   │
│   ├── infrastructure/           # 🟢 Infrastructure Layer
│   │   ├── crypto/               # AES-GCM, HKDF, PBKDF2
│   │   ├── totp/                 # TOTP generation & validation
│   │   ├── webauthn/             # WebAuthn PRF implementation
│   │   ├── database/             # PostgreSQL + SQLC repositories
│   │   ├── config/               # Configuration management
│   │   ├── jwt/                  # JWT token service
│   │   └── oauth/                # OAuth implementations
│   │
│   └── interfaces/               # 🔴 Interface Layer
│       └── http/                 # HTTP delivery mechanism
│           ├── handlers/         # HTTP request handlers
│           ├── middleware/       # Authentication, CORS, security
│           └── server.go         # HTTP server setup
│
├── docs/                         # Documentation
├── Dockerfile                    # Production Docker image
├── docker-compose.dev.yaml       # Development environment
├── Makefile                      # Development commands
├── go.mod & go.sum              # Go dependencies
└── sqlc.yaml                     # SQLC configuration
```

## 🔒 Security Architecture

### Zero-Knowledge Encryption Flow

```
1. User Authentication
   OAuth (Google) → JWT Token → User Session

2. WebAuthn Registration (Clean Architecture)
   HTTP Handler → Application Use Case → Domain Validation → Infrastructure WebAuthn

3. Enhanced Key Derivation
   ┌─ PRF Available? ─┐
   │                  │
   ▼ YES              ▼ NO
   PRF → HKDF         credential.id → PBKDF2
   │                  │
   └─ AES-256-GCM ←───┘

4. Client-Side Encryption (Zero-Knowledge)
   TOTP Secret → AES-256-GCM → "ciphertext.iv.authTag"

5. Server Storage (Domain Layer Enforcement)
   Domain Entity Validation → Repository → PostgreSQL
```

### Security Layers

1. **Transport Security**: HTTPS/TLS encryption
2. **Authentication Security**: OAuth + WebAuthn multi-factor
3. **Session Security**: JWT with proper expiration
4. **Encryption Security**: Client-side AES-256-GCM with PRF
5. **Storage Security**: Zero-knowledge server storage
6. **Domain Security**: Business rules enforced at domain layer

## 🗄️ Database Design

### Schema Overview

```sql
-- Clean Architecture Database Schema
-- All tables support zero-knowledge encryption

users (
    id UUID PRIMARY KEY,
    username VARCHAR UNIQUE NOT NULL,
    email VARCHAR UNIQUE NOT NULL,
    display_name VARCHAR,
    oauth_provider VARCHAR NOT NULL,
    oauth_provider_id VARCHAR NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

webauthn_credentials (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    credential_id BYTEA UNIQUE NOT NULL,
    public_key BYTEA NOT NULL,
    aaguid UUID,
    sign_count BIGINT DEFAULT 0,
    backup_eligible BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

encrypted_totp_seeds (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    service_name VARCHAR NOT NULL,
    account_identifier VARCHAR,
    encrypted_secret BYTEA NOT NULL,        -- Zero-knowledge encrypted
    algorithm VARCHAR DEFAULT 'SHA1',
    digits INTEGER DEFAULT 6,
    period INTEGER DEFAULT 30,
    issuer VARCHAR,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);
```

## 🔄 API Design (Clean Architecture)

### Request Flow

```
Client Request → Interface Layer → Application Layer → Domain Layer → Infrastructure Layer → Database
```

### Key Endpoints

```go
// Authentication
POST /api/v1/auth/google                    // OAuth initiation
GET  /api/v1/auth/google/callback           // OAuth callback
POST /api/v1/auth/logout                    // User logout
GET  /api/v1/auth/profile                   // User profile

// WebAuthn
POST /api/v1/webauthn/register/begin        // Start registration
POST /api/v1/webauthn/register/finish       // Complete registration

// OTP Management
GET    /api/v1/otp                          // List user's OTPs
POST   /api/v1/otp                          // Create new OTP
PUT    /api/v1/otp/{id}                     // Update OTP
DELETE /api/v1/otp/{id}                     // Delete OTP

// Health
GET /health                                 // Health check
```

## 🧪 Testing Strategy

### Test Architecture by Layer

1. **Domain Layer**: 100% unit test coverage (no external dependencies)
2. **Application Layer**: Use case integration tests with mocked dependencies
3. **Infrastructure Layer**: Integration tests with real external systems
4. **Interface Layer**: HTTP endpoint tests with full request/response cycles

### Test Examples

```go
// Domain layer unit test
func TestUser_Validate(t *testing.T) {
    user := &entities.User{Email: "test@example.com"}
    err := user.Validate()
    assert.NoError(t, err)
}

// Infrastructure integration test
func TestUserRepository_Create(t *testing.T) {
    db := setupTestDB(t)
    repo := database.NewUserRepository(db)
    
    user := &entities.User{Email: "test@example.com"}
    err := repo.Create(context.Background(), user)
    assert.NoError(t, err)
}
```

## 🎯 Architectural Principles

### SOLID Principles ✅

1. **Single Responsibility**: Each package has one clear responsibility
2. **Open/Closed**: Easy to extend without modification
3. **Liskov Substitution**: Interface implementations are interchangeable
4. **Interface Segregation**: Focused, specific interfaces
5. **Dependency Inversion**: Depend on abstractions, not concretions

### Domain-Driven Design ✅

1. **Bounded Contexts**: Clear boundaries between business areas
2. **Entities**: Business objects with identity (`User`, `OTPSeed`)
3. **Value Objects**: Immutable objects (`TOTPCode`, `EncryptedData`)
4. **Domain Services**: Business logic (`AuthService`, `CryptoService`)

## 🚀 Performance & Scalability

### Response Time Targets

- **Authentication**: <500ms
- **WebAuthn Operations**: <1s
- **OTP CRUD**: <200ms
- **TOTP Generation**: <50ms (client-side)

### Scalability Patterns

1. **Stateless Design**: All services stateless for horizontal scaling
2. **Connection Pooling**: PostgreSQL connection pooling
3. **Caching Strategy**: JWT validation caching
4. **Database Indexing**: Optimized indexes for common queries

## 🔧 Configuration Management

### Environment-Based Configuration

```go
type Config struct {
    Server   ServerConfig   `json:"server"`
    Database DatabaseConfig `json:"database"`
    JWT      JWTConfig      `json:"jwt"`
    OAuth    OAuthConfig    `json:"oauth"`
    WebAuthn WebAuthnConfig `json:"webauthn"`
    Security SecurityConfig `json:"security"`
}
```

All configuration validated at startup using domain validation rules.

## 📊 Monitoring & Observability

### Structured Logging

```go
logger.Info("User authentication successful",
    slog.String("user_id", user.ID.String()),
    slog.String("action", "auth_success"),
    slog.Duration("duration", time.Since(start)),
)
```

### Health Checks

```go
// Application health
GET /health
{
    "status": "healthy",
    "environment": "development",
    "timestamp": "2025-01-28T14:30:00Z"
}
```

## 🛡️ Security Considerations

### Threat Model & Mitigations

1. **Client-Side Threats**: XSS, CSRF → CSP headers, CORS policy
2. **Server-Side Threats**: Injection → Input validation, prepared statements
3. **Cryptographic Threats**: Key compromise → PRF key derivation, rotation
4. **Application Threats**: Logic flaws → Domain validation, audit logging

### Security Controls

1. **Input Validation**: All inputs validated at domain layer
2. **Authentication**: Multi-factor authentication required
3. **Authorization**: Resource-based access control
4. **Encryption**: End-to-end with zero-knowledge storage
5. **Auditing**: All security events logged
6. **Rate Limiting**: Request throttling and abuse prevention

## 🔮 Future Architecture

### Phase 4: Multi-Device Synchronization

```
New Components:
├── domain/entities/sync_operation.go
├── infrastructure/sync/sync_service.go
└── interfaces/websocket/sync_handler.go
```

### Scalability Improvements

1. **Horizontal Scaling**: Load balancing
2. **Database Sharding**: User-based sharding
3. **Caching Layer**: Redis integration
4. **CDN Integration**: Static asset optimization

---

**Architecture Status**: ✅ **Phase 3 Complete - Clean Architecture Implementation**  
**Next Phase**: Multi-Device Synchronization & Production Hardening
