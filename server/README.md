# 2FAir Backend - E2E Encrypted TOTP Vault

**Status**: ✅ **Phase 3 Complete - Clean Architecture + PRF Implementation** (Core Complete, Not Production Ready)

A secure, end-to-end encrypted TOTP (Time-based One-Time Password) vault backend built with **clean architecture principles**, Go, PostgreSQL, WebAuthn PRF (Pseudo-Random Function), and zero-knowledge encryption.

## 🏗️ Clean Architecture Implementation ✅

### ✅ Architectural Layers

**2FAir follows Uncle Bob's Clean Architecture with strict dependency rules:**

```
┌─────────────────────────────────────────────────────────────┐
│                   External Systems                         │
│  HTTP Clients  │  PostgreSQL  │  OAuth Providers │  WebAuthn │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│              interfaces/ (Interface Layer)                 │
│  • HTTP Handlers    • Middleware    • Server Setup         │
│  • Request/Response • Error Handling • Route Management    │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│           application/usecases/ (Application Layer)        │
│  • Auth Service     • OTP Service    • Business Logic      │
│  • Use Case Orchestration    • Application-specific Logic │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                  domain/ (Domain Layer)                    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │  entities/  │ │ interfaces/ │ │         dto/            │ │
│  │ • User      │ │ • Services  │ │ • Data Transfer Objects │ │
│  │ • OTP       │ │ • Repos     │ │ • Request/Response      │ │
│  │ • WebAuthn  │ │ • Contracts │ │ • Validation            │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│            infrastructure/ (Infrastructure Layer)          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────────┐ │
│  │ crypto/ │ │ totp/   │ │webauthn/│ │     database/       │ │
│  │ • AES   │ │ • TOTP  │ │ • PRF   │ │ • PostgreSQL        │ │
│  │ • HKDF  │ │ • Codes │ │ • Auth  │ │ • SQLC              │ │
│  │ • PBKDF2│ │ • Config│ │ • Creds │ │ • Repositories      │ │
│  └─────────┘ └─────────┘ └─────────┘ │ • Migrations        │ │
│                                     └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 🎯 Architectural Benefits

- ✅ **Dependency Inversion**: All dependencies point inward to domain
- ✅ **Interface Segregation**: Clean contracts between layers  
- ✅ **Single Responsibility**: Each package has one clear purpose
- ✅ **Open/Closed Principle**: Easy to extend without modification
- ✅ **Testability**: All dependencies injected via interfaces
- ✅ **Maintainability**: Clear separation enables safe changes

## 📁 Project Structure (Phase 3 Clean Architecture)

```
server/
├── cmd/server/                    # Application entry point
│   └── main.go                   # Dependency injection & startup
├── internal/
│   ├── application/              # 🔵 Application Layer
│   │   └── usecases/             # Business logic orchestration
│   │       ├── auth_service.go   # Authentication use cases
│   │       └── otp_service.go    # OTP management use cases
│   │
│   ├── domain/                   # 🟡 Domain Layer (Core Business)
│   │   ├── entities/             # Business entities
│   │   │   ├── user.go          # User aggregate root
│   │   │   ├── otp.go           # OTP value object
│   │   │   └── webauthn.go      # WebAuthn entities
│   │   ├── interfaces/           # Domain contracts
│   │   │   ├── auth.go          # Auth service contracts
│   │   │   ├── crypto_service.go # Crypto service interface
│   │   │   ├── totp_service.go  # TOTP service interface
│   │   │   └── *_repository.go  # Repository interfaces
│   │   └── dto/                 # Data transfer objects
│   │
│   ├── infrastructure/           # 🟢 Infrastructure Layer
│   │   ├── crypto/               # Cryptographic implementations
│   │   │   ├── crypto_service.go # AES-GCM, HKDF, PBKDF2
│   │   │   └── crypto_service_test.go
│   │   ├── totp/                 # TOTP implementations
│   │   │   ├── totp_service.go   # TOTP generation & validation
│   │   │   └── totp_service_test.go
│   │   ├── webauthn/             # WebAuthn implementations
│   │   │   ├── webauthn_service.go # PRF support & auth
│   │   │   └── webauthn_service_test.go
│   │   ├── database/             # Database implementations
│   │   │   ├── migrations/       # Goose SQL migrations
│   │   │   ├── queries/          # SQLC SQL queries
│   │   │   ├── sqlc/             # Generated SQLC code
│   │   │   ├── postgres.go       # DB connection
│   │   │   └── *_repository.go   # Repository implementations
│   │   ├── config/               # Configuration management
│   │   ├── jwt/                  # JWT token service
│   │   └── oauth/                # OAuth implementations
│   │
│   └── interfaces/               # 🔴 Interface Layer
│       └── http/                 # HTTP delivery mechanism
│           ├── handlers/         # HTTP request handlers
│           │   ├── auth.go      # Auth endpoints
│           │   ├── otp.go       # OTP endpoints
│           │   ├── webauthn.go  # WebAuthn endpoints
│           │   └── health.go    # Health check endpoints
│           ├── middleware/       # HTTP middleware
│           │   ├── auth.go      # JWT authentication
│           │   ├── cors.go      # CORS configuration
│           │   └── security.go  # Security headers
│           └── server.go         # HTTP server setup
│
├── docs/                         # API documentation (Swagger)
├── Dockerfile                    # Production Docker image
├── docker-compose.dev.yaml       # Development environment
├── Makefile                      # Development commands
├── go.mod & go.sum              # Go dependencies
└── sqlc.yaml                     # SQLC configuration
```

## 🚀 Quick Start

### Prerequisites
- **Go 1.22+** with module support
- **Docker & Docker Compose** for databases
- **Make** for convenient command execution

### 🔧 Development Setup

```bash
# 1. Navigate to server directory
cd server

# 2. Install dependencies
make deps

# 3. Start databases via Docker
make db-up

# 4. Generate SQLC code from SQL queries
make generate

# 5. Build and run application
make build
make run
# Server starts at http://localhost:8080
```

### ✅ Verify Installation

```bash
# Health check
curl http://localhost:8080/health

# API status
curl http://localhost:8080/v1/public/status
```

## 🛠️ Development Commands

```bash
# Application Lifecycle
make help           # Show all available commands
make deps           # Install/update dependencies  
make generate       # Generate SQLC code from SQL
make build          # Compile application binary
make run            # Start development server
make test           # Run all tests
make test-cover     # Run tests with coverage

# Database Management
make db-up          # Start PostgreSQL via Docker
make db-down        # Stop database services
make db-reset       # Reset database

# Code Quality
make lint           # Run linter
make fmt            # Format code
make check          # Run format + lint + test

# Docker Operations
make docker-run     # Start development environment
make docker-down    # Stop Docker containers
```

## 🔐 Security Features

- **Zero-Knowledge Architecture**: Server never sees plaintext TOTP seeds
- **Clean Architecture**: Security enforced at domain layer
- **WebAuthn PRF**: Enhanced key derivation when available
- **Fallback Compatibility**: Works with all WebAuthn devices
- **End-to-End Encryption**: AES-256-GCM with authenticated encryption
- **Audit Logging**: All security events tracked
- **Security Headers**: CSP, HSTS, CORS protection

## 📚 Documentation

- **[Main README](../README.md)** - Complete project overview
- **[API Documentation](../docs/API.md)** - API reference
- **[Deployment Guide](../docs/DEPLOYMENT.md)** - Production setup
- **[System Architecture](../docs/design/system-architecture.md)** - Architecture details

## 🤝 Contributing

Follow clean architecture principles:
1. Domain layer has no external dependencies
2. All dependencies injected via interfaces  
3. Each layer has single responsibility
4. Write tests for new functionality
5. Update documentation for changes

---

**Phase 3 Complete ✅ - Clean Architecture + PRF Implementation**
