# 🔐 2FAir - E2E Encrypted TOTP Vault

**Status**: ✅ **Phase 3 Complete - Clean Architecture + PRF Implementation** (Core Complete, Not Production Ready)

**🎉 Phase 3 Milestone Achieved (January 2025):**
- ✅ Clean Architecture implementation with Uncle Bob's principles
- ✅ WebAuthn PRF support with HKDF key derivation  
- ✅ Universal fallback compatibility for all devices
- ✅ Complete zero-knowledge encryption architecture
- ✅ Core features complete with comprehensive security
- ✅ Modern React frontend with landing pages and animations
- 🚧 **Phase 4 Required for Production**: Multi-Device Sync & Production Hardening

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Go Version](https://img.shields.io/badge/Go-1.22+-blue.svg)](https://golang.org)
[![Node Version](https://img.shields.io/badge/Node-18+-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://reactjs.org)

2FAir is a **zero-knowledge, end-to-end encrypted TOTP (Time-based One-Time Password) vault** that puts security and privacy first. Your TOTP secrets are encrypted client-side using WebAuthn-derived keys with PRF (Pseudo-Random Function) support, ensuring the server never sees your plaintext data.

## 🎯 **Current Implementation Status - Phase 3 Complete ✅**

### 🏗️ **Clean Architecture Implementation** ✅ NEW
- **Domain-Driven Design**: Proper separation of concerns with domain, application, infrastructure, and interface layers
- **SOLID Principles**: Dependency inversion, interface segregation, and clean dependencies
- **Package Organization**: Domain-specific directories (crypto, totp, webauthn) following Go best practices
- **Interface-Based Design**: All services implement domain interfaces for testability and maintainability
- **No Import Cycles**: Clean dependency graph with proper architectural boundaries

### 🔒 **Enhanced Zero-Knowledge Security** ✅ COMPLETE
- **PRF-First Key Derivation**: WebAuthn PRF → HKDF-SHA256 → AES-256-GCM key (when available)
- **Universal Fallback**: credential.id → PBKDF2-SHA256 → AES-256-GCM key (for compatibility)
- **End-to-End Encryption**: AES-256-GCM with client-side encryption
- **WebAuthn Integration**: Hardware-backed key derivation from biometric/security keys
- **No Server Access**: Server never sees plaintext TOTP secrets or codes
- **Session-Based Keys**: Consistent encryption keys throughout the browser session

### 🚀 **Modern TOTP Management** ✅ COMPLETE
- **Client-Side Generation**: All TOTP codes generated using the `otpauth` library
- **Real-Time Updates**: Codes auto-refresh every 30 seconds with progress indicators
- **Multi-Algorithm Support**: SHA1, SHA256, SHA512 algorithms
- **Standard Compatibility**: Works with Google Authenticator, Authy, and all TOTP apps
- **QR Code Import**: Import TOTP secrets via QR code scanning

### 🌐 **Full-Stack Application** ✅ COMPLETE
- **React Frontend**: TypeScript + HeroUI + TanStack Query + Zustand state management
- **Go Backend**: Clean architecture + Gin framework + PostgreSQL + SQLC + WebAuthn PRF
- **OAuth Authentication**: Google OAuth 2.0 integration
- **WebAuthn Registration**: Complete credential management with PRF support
- **Responsive Design**: Beautiful UI that works on desktop and mobile browsers

### 🛡️ **Production-Grade Security** ✅ COMPLETE
- **Clean Architecture**: Proper layer separation for security and maintainability
- **PRF Extension**: WebAuthn Pseudo-Random Function for optimal security
- **HKDF Key Derivation**: RFC 5869 compliant key derivation from PRF
- **Comprehensive Validation**: Input validation at all layers
- **Security Headers**: CORS, CSP, HSTS, and security headers configured
- **Authentication Required**: All endpoints properly protected with JWT + WebAuthn
- **Audit Trail**: Comprehensive logging for security events

## 📋 Quick Start

### Prerequisites
- **Docker & Docker Compose** (recommended for quickest setup)
- **Go 1.22+** (for local development)
- **Node.js 18+** & **Yarn** (for frontend development)
- **PostgreSQL 15+** (for local database)

### 🐳 Docker Setup (Recommended)

```bash
# Clone repository
git clone <repository-url>
cd 2FAir

# Start all services (frontend, backend, database)
docker-compose -f server/docker-compose.dev.yaml up -d

# Check service health
docker-compose -f server/docker-compose.dev.yaml ps
```

**Services will be available at:**
- **Frontend**: http://localhost:5173 (React + Vite dev server)
- **Backend API**: http://localhost:8080 (Go + Gin API)
- **Database**: localhost:5432 (PostgreSQL)

### 🔧 Manual Development Setup

#### 1. Backend Setup
```bash
# Navigate to server directory
cd server

# Install dependencies
go mod download

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration (see server/README.md)

# Start PostgreSQL (via Docker)
make db-up

# Generate SQLC code
make generate

# Run database migrations
go run ./cmd/server -migrate up

# Start backend server
make run
# or: go run cmd/server/main.go
```

#### 2. Frontend Setup
```bash
# Navigate to client directory  
cd client

# Install dependencies
yarn install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your backend URL

# Start development server
yarn dev
```

#### 3. Verify Setup
```bash
# Test backend health
curl http://localhost:8080/health

# Test frontend
open http://localhost:5173
```

## 🏗️ Clean Architecture

### Current Implementation - Phase 3 Complete ✅
```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (React)                          │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│ │   Components    │ │   Hooks         │ │   State Mgmt    │   │
│ │ • HeroUI        │ │ • TanStack      │ │ • Zustand       │   │
│ │ • WebAuthn PRF  │ │ • Auth hooks    │ │ • OTP state     │   │
│ │ • TOTP UI       │ │ • OTP hooks     │ │ • Auth state    │   │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │ HTTPS/JSON
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Server (Go - Clean Architecture)            │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │                 interfaces/http/ (Interface Layer)         │ │
│ │ • Gin Handlers    • Middleware    • HTTP Server           │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                              │                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │              application/usecases/ (Application Layer)     │ │
│ │ • Auth Service    • OTP Service    • Business Logic       │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                              │                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │                domain/ (Domain Layer)                      │ │
│ │ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │ │
│ │ │  entities/  │ │ interfaces/ │ │         dto/            │ │ │
│ │ │ • User      │ │ • AuthSvc   │ │ • Request/Response      │ │ │
│ │ │ • OTP       │ │ • OTPSvc    │ │ • Data Transfer         │ │ │
│ │ │ • WebAuthn  │ │ • Repos     │ │ • Validation            │ │ │
│ │ └─────────────┘ └─────────────┘ └─────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                              │                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │            infrastructure/ (Infrastructure Layer)          │ │
│ │ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────────┐ │ │
│ │ │ crypto/ │ │ totp/   │ │webauthn/│ │     database/       │ │ │
│ │ │ • AES   │ │ • TOTP  │ │ • PRF   │ │ • PostgreSQL        │ │ │
│ │ │ • HKDF  │ │ • Codes │ │ • Auth  │ │ • SQLC Queries      │ │ │
│ │ └─────────┘ └─────────┘ └─────────┘ │ • Repositories      │ │ │
│ │                                     │ • Migrations        │ │ │
│ │                                     └─────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                   ┌─────────────────┐
                   │   PostgreSQL    │
                   │ • Encrypted     │
                   │   TOTP Secrets  │
                   │ • User Data     │
                   │ • Credentials   │
                   └─────────────────┘
```

### Clean Architecture Benefits ✅
- **Testability**: All dependencies injected via interfaces
- **Maintainability**: Clear separation of concerns
- **Scalability**: Easy to add new features without coupling
- **Security**: Domain layer enforces business rules
- **Flexibility**: Easy to swap implementations (database, crypto, etc.)

## 🔒 Enhanced Security Model (Phase 3)

### Zero-Knowledge Encryption Flow
```
1. User Authentication
   OAuth (Google) → JWT Token → User Session

2. WebAuthn Setup  
   User registers biometric/security key → PRF Extension Detection

3. Enhanced Key Derivation (PRF-First)
   ┌─ PRF Available? ─┐
   │                  │
   ▼ YES              ▼ NO
   PRF → HKDF         credential.id → PBKDF2
   │                  │
   └─ AES-256-GCM ←───┘

4. Client-Side Encryption
   TOTP Secret → AES Encrypt → "ciphertext.iv.authTag"

5. Secure Storage
   Server stores encrypted data only (never plaintext)

6. Client-Side TOTP Generation
   Decrypt secret → Generate codes with otpauth library
```

### Security Guarantees ✅
- **Zero-Knowledge**: Server cannot decrypt user data under any circumstances
- **PRF Security**: Hardware-backed key derivation when available
- **Universal Compatibility**: Works with all WebAuthn devices
- **Perfect Forward Secrecy**: Session keys not stored persistently
- **Tamper Detection**: GCM authentication prevents data modification
- **Audit Trail**: All security events logged

## 🛠️ Technology Stack

### Frontend (Client-Side)
- **React 18** with TypeScript for type safety
- **HeroUI** for beautiful, accessible UI components  
- **TanStack Query** for server state management and caching
- **Zustand** for client-side state management
- **OTPAuth** for industry-standard TOTP code generation
- **WebAuthn API** with PRF extension support
- **Vite** for fast development and optimized builds

### Backend (Server-Side)
- **Go 1.22+** with clean architecture principles
- **Gin** web framework with comprehensive middleware
- **PostgreSQL 15+** with SQLC for type-safe database operations
- **WebAuthn PRF** for enhanced hardware-backed security
- **OAuth 2.0** (Google) for user authentication
- **JWT** for secure session management
- **HKDF** (RFC 5869) for cryptographic key derivation
- **AES-256-GCM** for authenticated encryption

### Infrastructure
- **Docker** and Docker Compose for development and deployment
- **PostgreSQL** for secure data persistence
- **Gin middleware** for CORS, security headers, logging
- **SQLC** for compile-time SQL validation
- **Goose** for database migrations

## 📊 Implementation Status

### ✅ Completed Features (Phase 1-3)
- **Clean Architecture**: Domain-driven design with proper layer separation
- **OAuth Authentication**: Google OAuth 2.0 with JWT session management
- **WebAuthn PRF**: Enhanced hardware-backed key derivation
- **Fallback Compatibility**: Universal support for all WebAuthn devices
- **Zero-Knowledge E2E Encryption**: Client-side AES-256-GCM encryption
- **TOTP Management**: Full CRUD operations with secure storage
- **Real-Time TOTP Generation**: Client-side code generation with progress indicators
- **Beautiful Frontend**: Modern React SPA with HeroUI components
- **Database Layer**: PostgreSQL with SQLC type-safe queries
- **RESTful API**: Comprehensive API with error handling and validation
- **Security**: Multiple layers of protection with audit logging
- **Development Tools**: Complete development workflow with Docker

### 🔧 Current Limitations (Pre-Production)
- **Single OAuth Provider**: Only Google OAuth implemented
- **Browser-Only**: No mobile app or browser extension
- **No Multi-Device Sync**: Single device limitation (Phase 4 requirement)
- **No Backup/Recovery**: Manual backup not yet implemented (Phase 4 requirement)
- **Development Security**: Not hardened for production deployment
- **No Rate Limiting**: Production-grade rate limiting not implemented
- **No Monitoring**: Production monitoring and alerting not configured

### 🚧 Phase 4 Required for Production
- **Multi-Device Synchronization**: Encrypted sync across devices with PRF support
- **Backup & Recovery**: Secure backup codes and recovery mechanisms
- **Security Audit**: Comprehensive penetration testing and hardening
- **Performance Optimization**: Caching, rate limiting, optimization
- **Production Monitoring**: Health checks, alerting, and observability
- **Production Deployment**: Production-ready configurations and automation

## 📚 Documentation

### Core Documentation
- **[Server README](server/README.md)** - Backend implementation details
- **[Implementation Roadmap](docs/implementation-roadmap.md)** - Phase-by-phase development
- **[API Documentation](docs/API.md)** - Complete API reference
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment instructions

### Design Documentation  
- **[System Architecture](docs/design/system-architecture.md)** - Clean architecture deep dive
- **[Cryptographic Design](docs/design/cryptographic-design.md)** - PRF and encryption details
- **[Database Schema](docs/design/database-schema.md)** - Database design and relationships
- **[API Design](docs/design/api-design.md)** - RESTful API design principles

### Project Documentation
- **[Features Overview](docs/FEATURES.md)** - Complete feature list and status
- **[Documentation Updates](docs/DOCUMENTATION_UPDATES.md)** - Change log

## 🚀 Development

### Quick Development Setup
```bash
# 1. Start database
cd server && make db-up

# 2. Start backend (Terminal 1)
make run

# 3. Start frontend (Terminal 2)  
cd ../client && yarn dev

# Access application
# Frontend: http://localhost:5173
# Backend API: http://localhost:8080
# Health Check: http://localhost:8080/health
```

### Available Commands

#### Backend (server/)
```bash
make help           # Show all available commands
make build          # Build the application  
make run            # Run the application
make test           # Run all tests
make test-cover     # Run tests with coverage
make generate       # Generate SQLC code
make db-up          # Start database services
make db-down        # Stop database services
make lint           # Run linter
make fmt            # Format code
```

#### Frontend (client/)
```bash
yarn dev            # Start development server
yarn build          # Build for production
yarn test           # Run tests
yarn lint           # Run ESLint
yarn type-check     # TypeScript type checking
```

## 🧪 Testing

### Backend Testing
```bash
cd server

# Run all tests
make test

# Run tests with coverage
make test-cover

# Run specific test packages
go test ./internal/application/usecases/...
go test ./internal/infrastructure/crypto/...
```

### Frontend Testing
```bash
cd client

# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with coverage
yarn test:coverage
```

## 🐳 Deployment

### Development
Use Docker Compose for the complete development environment:
```bash
cd server
make docker-run
```

### Production
See **[Deployment Guide](docs/DEPLOYMENT.md)** for production setup including:
- Docker production configurations
- Environment variable security
- Nginx reverse proxy setup
- SSL/TLS certificate configuration
- Database backup and monitoring strategies

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Standards
- **Clean Architecture**: Follow the established layer patterns
- **Go Code**: Use `gofmt`, `golint`, and follow Go best practices
- **TypeScript**: Strict type checking and ESLint compliance
- **Testing**: Write tests for new functionality
- **Documentation**: Update docs for new features

### Contribution Process
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with tests
4. Ensure all tests pass (`make test` in both server/ and client/)
5. Update documentation as needed
6. Submit a pull request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **WebAuthn Community** for passwordless authentication standards and PRF extension
- **OTPAuth Library** for robust client-side TOTP implementation
- **HeroUI Team** for beautiful and accessible React components
- **Go Community** for excellent tooling, libraries, and clean architecture patterns
- **Clean Architecture** principles by Robert C. Martin (Uncle Bob)

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/2FAir/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/2FAir/discussions)
- **Security**: For security issues, please email security@yourdomain.com

## ⭐ How It Works (Technical Summary)

2FAir implements a true zero-knowledge architecture with clean architecture principles:

1. **Clean Layer Separation**: Domain → Application → Infrastructure → Interface layers
2. **User Authentication**: OAuth 2.0 creates secure user sessions
3. **WebAuthn Setup**: Hardware security key registration with PRF detection
4. **Enhanced Key Derivation**: PRF → HKDF → AES key (preferred) or credential.id → PBKDF2 (fallback)
5. **Client-Side Encryption**: TOTP secrets encrypted with AES-256-GCM before transmission
6. **Secure Storage**: Server stores only encrypted `ciphertext.iv.authTag` data
7. **Code Generation**: Client decrypts secrets and generates TOTP codes using `otpauth`
8. **Session Management**: Encryption keys cached in memory for seamless UX

**The server never sees your TOTP secrets or codes in plaintext, with best-in-class security when your device supports PRF, all built on a maintainable clean architecture foundation!**

**⚠️ Development Status**: Core features complete but Phase 4 required for production deployment.

---

**Phase 3 Complete ✅ - Clean Architecture + PRF Implementation**  
**Phase 4 Required 🚧 - Multi-Device Sync & Production Hardening for Production Readiness**
