# 🔐 2FAir - E2E Encrypted TOTP Vault

**Status**: ✅ **Production Ready** - Zero-Knowledge Architecture with WebAuthn Integration

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Go Version](https://img.shields.io/badge/Go-1.21+-blue.svg)](https://golang.org)
[![Node Version](https://img.shields.io/badge/Node-18+-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://reactjs.org)

2FAir is a **zero-knowledge, end-to-end encrypted TOTP (Time-based One-Time Password) vault** that puts security and privacy first. Your TOTP secrets are encrypted client-side using WebAuthn-derived keys, ensuring the server never sees your plaintext data.

## ✨ Current Features

### 🔒 **Zero-Knowledge Security** ✅ IMPLEMENTED
- **End-to-End Encryption**: AES-256-GCM with client-side encryption
- **WebAuthn Integration**: Hardware-backed key derivation from biometric/security keys
- **No Server Access**: Server never sees plaintext TOTP secrets or codes
- **Session-Based Keys**: Consistent encryption keys throughout the browser session
- **PBKDF2 Key Derivation**: Secure key generation from WebAuthn credentials

### 🚀 **Modern TOTP Management** ✅ IMPLEMENTED
- **Client-Side Generation**: All TOTP codes generated using the `otpauth` library
- **Real-Time Updates**: Codes auto-refresh every 30 seconds
- **Multi-Algorithm Support**: SHA1, SHA256, SHA512 algorithms
- **Standard Compatibility**: Works with Google Authenticator, Authy, and all TOTP apps
- **Visual Progress**: Time-remaining indicators for each code

### 🌐 **Full-Stack Application** ✅ IMPLEMENTED
- **React Frontend**: TypeScript + HeroUI + TanStack Query + Zustand
- **Go Backend**: Gin framework + PostgreSQL + SQLC
- **OAuth Authentication**: Google login support
- **WebAuthn Registration**: Complete credential management UI
- **Responsive Design**: Works on desktop and mobile browsers

### 🛡️ **Production Security** ✅ IMPLEMENTED
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

### Current Implementation
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React SPA     │    │   Go API Server  │    │   PostgreSQL    │
│                 │    │                  │    │                 │
│ • HeroUI        │◄──►│ • Gin Framework  │◄──►│ • Encrypted     │
│ • TanStack Query│    │ • SQLC           │    │   TOTP Secrets  │
│ • Zustand       │    │ • WebAuthn       │    │ • User Data     │
│ • OTPAuth       │    │ • OAuth 2.0      │    │ • Credentials   │
│ • WebAuthn      │    │ • JWT Auth       │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Zero-Knowledge Flow (As Implemented)
```
1. User logs in via OAuth (Google)
2. WebAuthn registration creates hardware-backed credential
3. TOTP secret encrypted client-side using WebAuthn-derived key
4. Encrypted data sent to server (format: ciphertext.iv.authTag)
5. Server stores encrypted data without modification (no double encryption)
6. TOTP codes generated entirely on client using otpauth library
7. Server never sees plaintext secrets or codes
```

### Tech Stack

**Frontend:**
- **React 18** with TypeScript
- **HeroUI** for beautiful, accessible components
- **TanStack Query** for server state management
- **Zustand** for client state management
- **OTPAuth** for industry-standard TOTP generation
- **WebAuthn API** for hardware security integration
- **Vite** for fast development and building

**Backend:**
- **Go 1.21+** with Gin web framework
- **PostgreSQL** with SQLC for type-safe queries
- **WebAuthn** for hardware security keys
- **OAuth 2.0** for authentication (Google)
- **JWT** for session management
- **AES-256-GCM** encryption with PBKDF2 key derivation

## 🔒 Security Model (Current Implementation)

### Encryption Details
- **Algorithm**: AES-256-GCM (authenticated encryption)
- **Key Derivation**: PBKDF2 with SHA-256 (100,000 iterations)
- **Key Source**: WebAuthn credential.id (consistent across sessions)
- **Session Management**: Keys cached in memory for session duration
- **IV Generation**: Cryptographically secure random (12 bytes)
- **Authentication**: GCM authentication tags prevent tampering

### Zero-Knowledge Principles
1. **Client-Side Encryption**: All TOTP secrets encrypted before leaving the client
2. **Server Blindness**: Server stores only encrypted `ciphertext.iv.authTag` format
3. **Key Derivation**: Encryption keys derived from WebAuthn, never transmitted
4. **TOTP Generation**: All code generation happens client-side using `otpauth`
5. **No Decryption**: Server cannot decrypt user data under any circumstances
6. **Session Consistency**: Same encryption key used throughout browser session

### Current Security Flow
```
WebAuthn credential.id → PBKDF2 → AES-256-GCM key → Encrypt TOTP secret
                    ↓
            Store encrypted: "ciphertext.iv.authTag"
                    ↓
            Retrieve & decrypt client-side → Generate TOTP codes
```

## 📚 Documentation

- **[API Documentation](docs/API.md)** - Complete API reference
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment instructions
- **[System Architecture](docs/design/system-architecture.md)** - Technical deep dive
- **[Cryptographic Design](docs/design/cryptographic-design.md)** - Encryption details
- **[Features Overview](docs/FEATURES.md)** - Complete feature list

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

### ✅ Completed Features
- **Authentication System**: OAuth 2.0 + WebAuthn integration
- **WebAuthn Registration**: Complete UI flow with error handling
- **E2E Encryption**: AES-256-GCM with zero-knowledge architecture
- **TOTP Management**: Full CRUD operations with client-side encryption
- **TOTP Generation**: Real-time client-side code generation using `otpauth`
- **Database Layer**: PostgreSQL with SQLC integration
- **API Layer**: RESTful API with comprehensive error handling
- **Frontend**: Modern React SPA with HeroUI components
- **Session Management**: Consistent encryption keys throughout session
- **Error Handling**: User-friendly messages for all failure scenarios

### 🔧 Current Limitations
- **Single OAuth Provider**: Only Google login implemented
- **Browser-Only**: No mobile app or browser extension
- **No Backup/Recovery**: Manual backup not yet implemented
- **Single Device**: No cross-device synchronization

### 🚧 Future Enhancements
- **Additional OAuth Providers**: GitHub, Microsoft, Apple
- **Backup & Recovery**: Secure backup codes and recovery options
- **Multi-Device Sync**: Cross-device encrypted synchronization
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

- **WebAuthn Community** for passwordless authentication standards
- **OTPAuth Library** for client-side TOTP implementation  
- **HeroUI Team** for beautiful React components
- **Go Community** for excellent tooling and libraries

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/2FAir/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/2FAir/discussions)
- **Security**: For security issues, please email security@yourdomain.com

## ⭐ How It Works (Technical Summary)

2FAir implements a true zero-knowledge architecture:

1. **User Authentication**: OAuth login creates user account
2. **WebAuthn Setup**: User registers biometric/security key
3. **Key Derivation**: Client derives AES key from WebAuthn credential
4. **Secret Encryption**: TOTP secrets encrypted client-side with AES-256-GCM
5. **Secure Storage**: Server stores only encrypted `ciphertext.iv.authTag` data
6. **Code Generation**: Client decrypts secrets and generates TOTP codes using `otpauth`
7. **Session Management**: Encryption keys cached in memory for seamless UX

**The server never sees your TOTP secrets or codes in plaintext!**

---

**Built with ❤️ for privacy and security**
