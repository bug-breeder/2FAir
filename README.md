# 🔐 2FAir - E2E Encrypted TOTP Vault

**Phase 3 Complete**: End-to-End Encryption & TOTP Management with Zero-Knowledge Architecture

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Go Version](https://img.shields.io/badge/Go-1.21+-blue.svg)](https://golang.org)
[![Node Version](https://img.shields.io/badge/Node-18+-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://reactjs.org)

2FAir is a **zero-knowledge, end-to-end encrypted TOTP (Time-based One-Time Password) vault** that puts security and privacy first. Your TOTP secrets are encrypted client-side using WebAuthn-derived keys, ensuring the server never sees your plaintext data.

## ✨ Features

### 🔒 **Zero-Knowledge Security**
- **End-to-End Encryption**: AES-256-GCM with client-side encryption
- **WebAuthn Integration**: Hardware-backed key derivation
- **No Server Access**: Server never sees plaintext TOTP secrets
- **PBKDF2 Key Derivation**: Secure key generation from WebAuthn credentials

### 🚀 **Modern Architecture**
- **React Frontend**: TypeScript + HeroUI + TanStack Query + Zustand
- **Go Backend**: Gin framework + PostgreSQL + SQLC
- **OAuth Authentication**: Google & GitHub login support
- **Multi-Algorithm TOTP**: SHA1, SHA256, SHA512 support

### 🛡️ **Production Ready**
- **Comprehensive Testing**: Unit tests with 90%+ coverage
- **Docker Support**: Full containerization
- **Security Headers**: CORS, CSP, HSTS configured
- **Health Monitoring**: Built-in health checks
- **Rate Limiting**: API protection

## 📋 Quick Start

### Prerequisites
- **Docker & Docker Compose** (recommended)
- **Go 1.21+** (for local development)
- **Node.js 18+** & **Yarn** (for frontend development)
- **PostgreSQL 14+** (for local database)

### 🐳 Docker Setup (Recommended)

```bash
# Clone repository
git clone <repository-url>
cd 2FAir

# Start all services
docker-compose up -d

# Check service health
docker-compose ps
```

**Services will be available at:**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Database**: localhost:5432

### 🔧 Manual Setup

#### Backend Setup
```bash
# Navigate to server directory
cd server

# Install dependencies
go mod download

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Start PostgreSQL (via Docker)
docker run --name 2fair-postgres -e POSTGRES_DB=2fair -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:14

# Run database migrations
go run ./cmd/migrate

# Start server
go run ./cmd/server
```

#### Frontend Setup
```bash
# Navigate to client directory  
cd client

# Install dependencies
yarn install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
yarn dev
```

## 🏗️ Architecture

### System Overview
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React SPA     │    │   Go API Server  │    │   PostgreSQL    │
│                 │    │                  │    │                 │
│ • HeroUI        │◄──►│ • Gin Framework  │◄──►│ • Encrypted     │
│ • TanStack Query│    │ • SQLC           │    │   TOTP Secrets  │
│ • Zustand       │    │ • WebAuthn       │    │ • User Data     │
│ • OTPAuth       │    │ • OAuth 2.0      │    │ • Credentials   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Zero-Knowledge Flow
```
1. User logs in via OAuth (Google/GitHub)
2. WebAuthn registration creates hardware-backed credential
3. TOTP secret encrypted client-side using WebAuthn-derived key
4. Encrypted data sent to server for storage
5. TOTP codes generated entirely on client
6. Server never sees plaintext secrets
```

### Tech Stack

**Frontend:**
- **React 18** with TypeScript
- **HeroUI** for beautiful, accessible components
- **TanStack Query** for server state management
- **Zustand** for client state management
- **OTPAuth** for client-side TOTP generation
- **Vite** for fast development and building

**Backend:**
- **Go 1.21+** with Gin web framework
- **PostgreSQL** with SQLC for type-safe queries
- **WebAuthn** for hardware security keys
- **OAuth 2.0** for authentication (Google/GitHub)
- **AES-256-GCM** encryption with PBKDF2 key derivation

## 🔒 Security Model

### Encryption Details
- **Algorithm**: AES-256-GCM (authenticated encryption)
- **Key Derivation**: PBKDF2 with SHA-256 (100,000 iterations)
- **Key Source**: WebAuthn credential + user passphrase
- **IV Generation**: Cryptographically secure random
- **Authentication**: GCM authentication tags prevent tampering

### Zero-Knowledge Principles
1. **Client-Side Encryption**: All TOTP secrets encrypted before leaving the client
2. **Server Blindness**: Server stores only encrypted ciphertext + metadata
3. **Key Derivation**: Encryption keys derived from WebAuthn, never transmitted
4. **TOTP Generation**: All code generation happens client-side using `otpauth`
5. **No Decryption**: Server cannot decrypt user data under any circumstances

## 📚 Documentation

- **[API Documentation](docs/API.md)** - Complete API reference
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment instructions
- **[Architecture Overview](docs/ARCHITECTURE.md)** - Technical deep dive
- **[Security Model](docs/SECURITY.md)** - Cryptographic details
- **[Contributing Guide](docs/CONTRIBUTING.md)** - Development guidelines

## 🧪 Testing

### Backend Tests
```bash
cd server

# Run all tests
make test

# Run tests with coverage
make test-coverage

# View coverage report
make coverage-html
```

### Frontend Tests
```bash
cd client

# Run all tests
yarn test

# Run tests with coverage
yarn test:coverage

# Run tests in watch mode
yarn test:watch
```

## 📊 Current Status

### ✅ Completed (Phase 3)
- **Authentication System**: OAuth 2.0 + WebAuthn
- **E2E Encryption**: AES-256-GCM with zero-knowledge architecture
- **TOTP Management**: Full CRUD operations with encryption
- **Database Layer**: PostgreSQL with SQLC integration
- **API Layer**: RESTful API with comprehensive error handling
- **Frontend Integration**: React SPA with modern UI/UX
- **Testing Suite**: Comprehensive unit tests (90%+ coverage)
- **Documentation**: API docs, deployment guide, architecture overview

### 🚧 Next Phase (Phase 4)
- **Advanced Features**: Backup/recovery, multi-device sync
- **Enhanced Security**: Hardware security module integration
- **Performance**: Caching, optimization, monitoring
- **Mobile Support**: React Native app or PWA
- **Enterprise Features**: Team management, audit logs

## 🚀 Deployment

### Development
```bash
# Both frontend and backend
docker-compose up -d

# Access at:
# Frontend: http://localhost:3000
# Backend: http://localhost:8080
```

### Production
See **[Deployment Guide](docs/DEPLOYMENT.md)** for detailed production setup including:
- Docker Compose production configuration
- Nginx reverse proxy setup  
- SSL/TLS certificate configuration
- Environment variable security
- Database backup strategies
- Monitoring and logging

## 🤝 Contributing

We welcome contributions! Please see our **[Contributing Guide](docs/CONTRIBUTING.md)** for details on:
- Code style and standards
- Development workflow
- Testing requirements
- Pull request process

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Run the test suite
5. Submit a pull request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **WebAuthn Community** for passwordless authentication standards
- **OTPAuth Library** for client-side TOTP implementation
- **HeroUI Team** for beautiful React components
- **Go Community** for excellent tooling and libraries

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/2FAir/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/2FAir/discussions)
- **Security**: For security issues, please email security@yourdomain.com

## ⭐ Star History

If you find 2FAir useful, please consider giving it a star! ⭐

---

**Built with ❤️ for privacy and security**
