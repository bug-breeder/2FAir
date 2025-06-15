# 2FAir Backend - E2E Encrypted TOTP Vault

A secure, end-to-end encrypted TOTP (Time-based One-Time Password) vault backend built with Go, PostgreSQL, and WebAuthn PRF (Pseudo-Random Function) for key derivation.

## 🏗️ Phase 1: Backend Foundation (COMPLETED)

### ✅ What's Implemented

- **Clean Architecture**: Domain-driven design with clear separation of concerns
- **PostgreSQL Database**: SQLC-generated type-safe database operations
- **Migration System**: Goose-based database migrations
- **Gin Web Server**: HTTP server with security middleware
- **Configuration Management**: Environment-based configuration
- **Database Schema**: Complete E2E encryption schema design
- **Health Checks**: Application and database health monitoring
- **Docker Support**: Development environment with Docker Compose

### 🔧 Tech Stack

- **Language**: Go 1.22+
- **Framework**: Gin HTTP framework
- **Database**: PostgreSQL 15+ with SQLC
- **Migrations**: Goose
- **Configuration**: Environment variables with validation
- **Logging**: Structured logging with slog
- **Security**: CORS, CSP, and security headers

## 🚀 Quick Start

### Prerequisites

- Go 1.22+
- Docker and Docker Compose
- Make (optional, for convenience commands)

### Development Setup

1. **Clone and navigate to server directory**:
   ```bash
   cd server
   ```

2. **Install dependencies**:
   ```bash
   make deps
   ```

3. **Start database services**:
   ```bash
   make db-up
   ```

4. **Build and run the application**:
   ```bash
   make build
   make run
   ```

5. **Test the health endpoint**:
   ```bash
   curl http://localhost:8080/health
   ```

### Using Docker

1. **Start everything with Docker Compose**:
   ```bash
   make docker-run
   ```

2. **View logs**:
   ```bash
   make docker-logs
   ```

3. **Stop services**:
   ```bash
   make docker-down
   ```

## 📁 Project Structure

```
server/
├── cmd/server/              # Application entry point
├── internal/
│   ├── domain/              # Business logic and entities
│   │   ├── entities/        # Core domain entities
│   │   └── repositories/    # Repository interfaces
│   ├── usecase/             # Application use cases (business logic)
│   ├── adapter/             # External adapters
│   │   ├── api/             # HTTP handlers and middleware
│   │   └── database/        # Database implementations and migrations
│   └── infrastructure/      # Infrastructure concerns
│       ├── config/          # Configuration management
│       └── database/        # Database connection and migrations
├── docs/                    # API documentation
├── Dockerfile               # Docker image definition
├── docker-compose.dev.yaml  # Development environment
└── Makefile                 # Development commands
```

## 🗄️ Database Schema

The database schema is designed for zero-knowledge, end-to-end encryption:

- **users**: Core user accounts
- **webauthn_credentials**: WebAuthn credentials for PRF-based authentication
- **user_encryption_keys**: Wrapped DEKs (Data Encryption Keys)
- **encrypted_totp_seeds**: E2E encrypted TOTP seeds with searchable metadata
- **device_sessions**: Multi-device session management
- **backup_recovery_codes**: Encrypted backup/recovery system
- **audit_logs**: Security event logging

## 🔐 Security Features

- **Zero-Knowledge Architecture**: Server never sees plaintext TOTP seeds
- **End-to-End Encryption**: AES-256-GCM with WebAuthn PRF key derivation
- **Security Headers**: CSP, HSTS, X-Frame-Options, etc.
- **CORS Protection**: Configurable cross-origin resource sharing
- **Rate Limiting**: Built-in request rate limiting
- **Audit Logging**: Comprehensive security event tracking

## 🛠️ Development Commands

```bash
# Development
make help           # Show all available commands
make build          # Build the application
make run            # Run the application
make dev            # Run with hot reload (requires air)
make clean          # Clean build artifacts

# Dependencies
make deps           # Download and tidy dependencies
make deps-upgrade   # Upgrade all dependencies

# Database
make db-up          # Start database services
make db-down        # Stop database services
make db-reset       # Reset database

# Code Quality
make test           # Run tests
make test-cover     # Run tests with coverage
make lint           # Run linter
make fmt            # Format code
make check          # Run all checks (format, lint, test)

# Code Generation
make generate       # Generate SQLC code

# Docker
make docker-build   # Build Docker image
make docker-run     # Run with Docker Compose
make docker-down    # Stop Docker containers
make docker-logs    # View Docker logs

# Production
make build-prod     # Build for production

# Utilities
make swagger        # Generate Swagger docs
make install-tools  # Install development tools
```

## 🔧 Configuration

The application uses environment variables for configuration. See `docker-compose.dev.yaml` for example values:

### Required Environment Variables

- `JWT_SIGNING_KEY`: Secret key for JWT token signing
- `DB_PASSWORD`: Database password (in production)
- `WEBAUTHN_RP_ID`: WebAuthn Relying Party ID
- `WEBAUTHN_RP_ORIGINS`: Allowed WebAuthn origins

### Optional Environment Variables

- `SERVER_HOST`: Server host (default: localhost)
- `SERVER_PORT`: Server port (default: 8080)
- `ENVIRONMENT`: Environment (development/production)
- `DB_HOST`: Database host (default: localhost)
- Database configuration, CORS settings, security policies, etc.

## 🏥 Health Checks

The application provides several health check endpoints:

- `GET /health`: Overall application health
- `GET /health/ready`: Readiness check (database connectivity)
- `GET /health/live`: Liveness check (application status)

## 🐳 Docker

### Development

The `docker-compose.dev.yaml` includes:
- PostgreSQL database
- Redis cache
- Backend application
- Volume mounting for development

### Production

Use the `Dockerfile` to build a production image:
```bash
docker build -t 2fair-backend:latest .
```

## 📚 API Documentation

API documentation will be generated using Swagger. Run:
```bash
make swagger
```

## 🧪 Testing

Run tests with:
```bash
make test           # Run all tests
make test-cover     # Run with coverage report
```

## 🔄 Next Steps (Phase 2: WebAuthn Authentication)

The next phase will implement:

1. **WebAuthn Integration**: 
   - Registration and authentication flows
   - PRF extension support
   - Credential management

2. **JWT Token System**:
   - Secure token generation
   - Token validation middleware
   - Refresh token mechanism

3. **User Management**:
   - User registration and login
   - Account management
   - Device registration

4. **E2E Crypto Foundation**:
   - Key derivation from WebAuthn PRF
   - DEK wrapping/unwrapping
   - Encryption service setup

## 🤝 Contributing

1. Follow the established clean architecture patterns
2. Write tests for new functionality
3. Run `make check` before committing
4. Update documentation for new features

## 📄 License

GNU General Public License v3.0 - see LICENSE file for details.
