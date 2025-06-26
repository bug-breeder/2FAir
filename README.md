# 🔐 2FAir - E2E Encrypted TOTP Vault

**Status**: 🚧 **Phase 3 Complete** - PRF Key Derivation Implementation (Not Production Ready)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Go Version](https://img.shields.io/badge/Go-1.21+-blue.svg)](https://golang.org)
[![Node Version](https://img.shields.io/badge/Node-18+-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://reactjs.org)

2FAir is a **zero-knowledge, end-to-end encrypted TOTP (Time-based One-Time Password) vault** that puts security and privacy first. Your TOTP secrets are encrypted client-side using WebAuthn-derived keys, ensuring the server never sees your plaintext data.

## 🎯 **Current Implementation Status - Phase 3 Complete**

### ✅ **Recently Completed - Phase 3: PRF Key Derivation**
- **WebAuthn PRF Support**: Pseudo-Random Function for enhanced key derivation  
- **HKDF Implementation**: Cryptographically strong key derivation from PRF
- **Fallback Compatibility**: Graceful fallback to credential.id + PBKDF2
- **Enhanced Security**: Best-in-class key derivation when authenticator supports PRF
- **Backward Compatibility**: Works with all existing WebAuthn devices

### 🔒 **Enhanced Zero-Knowledge Security** ✅ IMPLEMENTED
- **PRF-First Key Derivation**: WebAuthn PRF → HKDF → AES-256-GCM key (when available)
- **Universal Fallback**: credential.id → PBKDF2 → AES-256-GCM key (for compatibility)
- **End-to-End Encryption**: AES-256-GCM with client-side encryption
- **WebAuthn Integration**: Hardware-backed key derivation from biometric/security keys
- **No Server Access**: Server never sees plaintext TOTP secrets or codes
- **Session-Based Keys**: Consistent encryption keys throughout the browser session

### 🚀 **Modern TOTP Management** ✅ IMPLEMENTED
- **Client-Side Generation**: All TOTP codes generated using the `otpauth` library
- **Real-Time Updates**: Codes auto-refresh every 30 seconds
- **Multi-Algorithm Support**: SHA1, SHA256, SHA512 algorithms
- **Standard Compatibility**: Works with Google Authenticator, Authy, and all TOTP apps
- **Visual Progress**: Time-remaining indicators for each code

### 🌐 **Full-Stack Application** ✅ IMPLEMENTED
- **React Frontend**: TypeScript + HeroUI + TanStack Query + Zustand
- **Go Backend**: Gin framework + PostgreSQL + SQLC + WebAuthn PRF
- **OAuth Authentication**: Google login support
- **WebAuthn Registration**: Complete credential management UI with PRF support
- **Responsive Design**: Works on desktop and mobile browsers

### 🛡️ **Advanced Security** ✅ IMPLEMENTED
- **PRF Extension**: WebAuthn Pseudo-Random Function for optimal security
- **HKDF Key Derivation**: RFC 5869 compliant key derivation from PRF
- **Comprehensive Error Handling**: User-friendly error messages
- **Secure Headers**: CORS, CSP configured
- **Input Validation**: Server-side validation for all inputs
- **Authentication Required**: All endpoints properly protected
- **Session Management**: Secure JWT and WebAuthn session handling

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
- **Frontend**: http://localhost:5173 (Vite dev server)
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
go run cmd/server/main.go
```

#### Frontend Setup
```bash
# Navigate to client directory  
cd client

# Install dependencies (including otpauth package)
yarn install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
yarn dev
```

## 🏗️ Architecture

### Current Implementation - Phase 3 PRF Enhanced
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React SPA     │    │   Go API Server  │    │   PostgreSQL    │
│                 │    │                  │    │                 │
│ • HeroUI        │◄──►│ • Gin Framework  │◄──►│ • Encrypted     │
│ • TanStack Query│    │ • SQLC           │    │   TOTP Secrets  │
│ • Zustand       │    │ • WebAuthn PRF   │    │ • User Data     │
│ • OTPAuth       │    │ • OAuth 2.0      │    │ • Credentials   │
│ • WebAuthn PRF  │    │ • JWT Auth       │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Enhanced Zero-Knowledge Flow (Phase 3)
```
1. User logs in via OAuth (Google)
2. WebAuthn registration creates hardware-backed credential with PRF support
3. Key derivation: PRF → HKDF → AES key (preferred) OR credential.id → PBKDF2 → AES key (fallback)
4. TOTP secret encrypted client-side using derived key
5. Encrypted data sent to server (format: ciphertext.iv.authTag)
6. Server stores encrypted data without modification
7. TOTP codes generated entirely on client using otpauth library
8. Server never sees plaintext secrets or codes
```

### Tech Stack

**Frontend:**
- **React 18** with TypeScript
- **HeroUI** for beautiful, accessible components
- **TanStack Query** for server state management
- **Zustand** for client state management
- **OTPAuth** for industry-standard TOTP generation
- **WebAuthn API** for hardware security integration with PRF support
- **Vite** for fast development and building

**Backend:**
- **Go 1.21+** with Gin web framework
- **PostgreSQL** with SQLC for type-safe queries
- **WebAuthn** for hardware security keys with PRF extension support
- **OAuth 2.0** for authentication (Google)
- **JWT** for session management
- **AES-256-GCM** encryption with PRF/HKDF or PBKDF2 key derivation

## 🔒 Enhanced Security Model (Phase 3)

### Key Derivation (PRF-First Approach)
- **Primary**: WebAuthn PRF → HKDF-SHA256 → AES-256-GCM key
- **Fallback**: WebAuthn credential.id → PBKDF2-SHA256 → AES-256-GCM key
- **Detection**: Automatic PRF support detection with graceful fallback
- **Session Management**: Keys cached in memory for session duration
- **IV Generation**: Cryptographically secure random (12 bytes)
- **Authentication**: GCM authentication tags prevent tampering

### Zero-Knowledge Principles
1. **Client-Side Encryption**: All TOTP secrets encrypted before leaving the client
2. **Server Blindness**: Server stores only encrypted `ciphertext.iv.authTag` format
3. **Enhanced Key Derivation**: PRF when available, credential.id fallback for compatibility
4. **TOTP Generation**: All code generation happens client-side using `otpauth`
5. **No Decryption**: Server cannot decrypt user data under any circumstances
6. **Session Consistency**: Same encryption key used throughout browser session

### Current Security Flow (Phase 3)
```
WebAuthn Authentication
         │
         ▼
   Check PRF Support
         │
    ┌────▼────┐
    │ PRF?    │
    └────┬────┘
         │
    ┌────▼────────────────────────┐
    │ YES: PRF → HKDF → AES Key   │ ⭐⭐⭐⭐⭐ Enhanced Security
    └─────────────────────────────┘
         │
    ┌────▼─────────────────────────────┐
    │ NO: credential.id → PBKDF2 → Key │ ⭐⭐⭐⭐ Universal Compatibility
    └──────────────────────────────────┘
         │
         ▼
    Store encrypted: "ciphertext.iv.authTag"
         │
         ▼
    Retrieve & decrypt client-side → Generate TOTP codes
```

## 📚 Documentation

- **[API Documentation](docs/API.md)** - Complete API reference
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment instructions
- **[System Architecture](docs/design/system-architecture.md)** - Technical deep dive
- **[Cryptographic Design](docs/design/cryptographic-design.md)** - PRF implementation details
- **[Features Overview](docs/FEATURES.md)** - Complete feature list
- **[Implementation Roadmap](docs/implementation-roadmap.md)** - Development phases

## 🧪 Testing

### Backend Tests
```bash
cd server

# Run all tests
go test ./...

# Run tests with coverage
go test -v -cover ./...
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

### ✅ Completed Features (Phase 1-3)
- **Authentication System**: OAuth 2.0 + WebAuthn integration
- **WebAuthn PRF Support**: Enhanced key derivation with PRF extension
- **Fallback Compatibility**: Universal support for all WebAuthn devices
- **E2E Encryption**: AES-256-GCM with zero-knowledge architecture
- **TOTP Management**: Full CRUD operations with client-side encryption
- **TOTP Generation**: Real-time client-side code generation using `otpauth`
- **Database Layer**: PostgreSQL with SQLC integration
- **API Layer**: RESTful API with comprehensive error handling
- **Frontend**: Modern React SPA with HeroUI components
- **Session Management**: Consistent encryption keys throughout session
- **Error Handling**: User-friendly messages for all failure scenarios

### 🔧 Known Limitations (Pre-Production)
- **Single OAuth Provider**: Only Google login implemented
- **Browser-Only**: No mobile app or browser extension
- **No Backup/Recovery**: Manual backup not yet implemented  
- **Single Device**: No cross-device synchronization
- **Testing Needed**: Comprehensive security audit pending
- **Documentation**: User guides need completion

### 🚧 Next Phase (Phase 4): Multi-Device & Production Hardening
- **Multi-Device Sync**: Encrypted synchronization across devices
- **Backup & Recovery**: Secure backup codes and recovery options
- **Security Audit**: Comprehensive security testing and hardening
- **Performance Optimization**: Large vault handling and caching
- **Production Deployment**: Production-ready configurations
- **User Documentation**: Complete user guides and onboarding

### 🚀 Future Enhancements (Phase 5+)
- **Additional OAuth Providers**: GitHub, Microsoft, Apple
- **Mobile Apps**: React Native or Progressive Web App
- **Browser Extensions**: Chrome/Firefox extensions
- **Enterprise Features**: Team management, audit logs

## 🚀 Deployment

### Development
```bash
# Start both frontend and backend
# Terminal 1 - Backend
cd server && go run cmd/server/main.go

# Terminal 2 - Frontend  
cd client && yarn dev

# Access at:
# Frontend: http://localhost:5173
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

We welcome contributions! Please follow these guidelines:

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Ensure all tests pass
5. Submit a pull request

### Code Standards
- **Go**: Follow `gofmt` and `golint` standards
- **TypeScript**: Use strict type checking
- **React**: Functional components with hooks
- **Security**: All user inputs must be validated

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **WebAuthn Community** for passwordless authentication standards and PRF extension
- **OTPAuth Library** for client-side TOTP implementation  
- **HeroUI Team** for beautiful React components
- **Go Community** for excellent tooling and libraries

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/2FAir/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/2FAir/discussions)
- **Security**: For security issues, please email security@yourdomain.com

## ⭐ How It Works (Technical Summary - Phase 3)

2FAir implements a true zero-knowledge architecture with enhanced PRF security:

1. **User Authentication**: OAuth login creates user account
2. **WebAuthn Setup**: User registers biometric/security key with PRF support
3. **Enhanced Key Derivation**: Client derives AES key using PRF (preferred) or credential.id (fallback)
4. **Secret Encryption**: TOTP secrets encrypted client-side with AES-256-GCM
5. **Secure Storage**: Server stores only encrypted `ciphertext.iv.authTag` data
6. **Code Generation**: Client decrypts secrets and generates TOTP codes using `otpauth`
7. **Session Management**: Encryption keys cached in memory for seamless UX

**The server never sees your TOTP secrets or codes in plaintext, with the best possible security when your device supports PRF!**

---

**Phase 3 Complete ✅ - Ready for Multi-Device Sync & Production Hardening**
