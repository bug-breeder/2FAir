# System Architecture - 2FAir E2E Encrypted TOTP Vault

## Overview

2FAir is a zero-knowledge, end-to-end encrypted TOTP (Time-based One-Time Password) vault that ensures TOTP secrets are never stored in plaintext on the server. The current implementation focuses on single-device usage with WebAuthn-based encryption and client-side TOTP generation.

**Current Status**: ✅ **Production Ready** - Core features fully implemented and working

## Architecture Principles

### Security-First Design ✅ IMPLEMENTED
- **Zero-Knowledge Architecture**: Server never sees TOTP secrets in plaintext
- **End-to-End Encryption**: All sensitive data encrypted client-side
- **WebAuthn Integration**: Hardware-backed key derivation from biometric/security keys
- **Session Consistency**: Same encryption key used throughout browser session

### Modern Standards ✅ IMPLEMENTED
- **WebAuthn API**: Standard passkey-based authentication
- **Web Crypto API**: Browser-native cryptographic operations
- **Progressive Enhancement**: Graceful error handling for unsupported browsers
- **Mobile-Responsive**: Works on desktop and mobile browsers

### Current Implementation Focus
- **Single-Device**: Optimized for single browser/device usage
- **Session-Based**: Encryption keys cached for session duration
- **Client-Side Generation**: All TOTP codes generated using `otpauth` library
- **Simple Architecture**: Minimal complexity for maximum security

## High-Level Architecture (Current Implementation)

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Browser   │    │   Go API Server │    │   PostgreSQL    │
│                 │    │                 │    │                 │
│ • React SPA     │◄──►│ • Gin Framework │◄──►│ • Encrypted     │
│ • HeroUI        │    │ • JWT Auth      │    │   TOTP Secrets  │
│ • WebAuthn      │    │ • WebAuthn      │    │ • User Data     │
│ • OTPAuth       │    │ • SQLC          │    │ • Credentials   │
│ • TanStack Query│    │ • OAuth 2.0     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Component Architecture

### Frontend Components ✅ IMPLEMENTED

#### Crypto Layer
- **WebAuthn Manager**: Handles credential creation, authentication, and key derivation
- **Encryption Service**: AES-GCM encryption/decryption of TOTP secrets
- **Session Key Manager**: Consistent key storage throughout browser session
- **TOTP Generator**: Client-side code generation using `otpauth` library

#### Application Layer
- **Authentication Flow**: OAuth login with Google
- **WebAuthn Registration**: Complete credential setup with error handling
- **Vault Manager**: TOTP secret CRUD operations with encryption
- **Smart OTP Cards**: Real-time TOTP display with auto-refresh

#### UI Components
- **Login Page**: OAuth authentication flow
- **WebAuthn Registration Modal**: Multi-step credential setup
- **TOTP Management**: Add, edit, delete TOTP entries
- **Real-time Display**: Live TOTP codes with countdown timers

### Backend Components ✅ IMPLEMENTED

#### API Services
- **Authentication Service**: OAuth 2.0 (Google) + JWT token management
- **WebAuthn Service**: Credential registration and verification
- **TOTP Service**: Encrypted TOTP secret storage (no code generation)
- **Health Service**: System health monitoring

#### Infrastructure Services
- **Database Service**: PostgreSQL with connection pooling
- **Migration Service**: Database schema versioning
- **SQLC Generated**: Type-safe database queries

## Data Flow (Current Implementation)

### Registration Flow ✅ WORKING
```
User → OAuth Login → WebAuthn Register → Credential Stored → Ready to Add TOTPs
```

### TOTP Addition Flow ✅ WORKING
```
User → WebAuthn Auth → Derive Key → Encrypt Secret → Store "ciphertext.iv.authTag"
```

### TOTP Display Flow ✅ WORKING
```
Fetch Encrypted → WebAuthn Auth → Derive Key → Decrypt → Generate Codes → Display
```

### Session Management ✅ WORKING
```
WebAuthn Auth → Cache Key → Consistent Encryption → Auto-clear on Close/Timeout
```

## Security Architecture ✅ IMPLEMENTED

### Zero-Knowledge Implementation

```
Client Device:
  WebAuthn credential.id → PBKDF2 → AES-256 Key → Encrypt TOTP Secret
                                                      ↓
Server Storage:
  Only stores: "ciphertext.iv.authTag" (no plaintext access possible)
                                                      ↓
Client Retrieval:
  Same Key → Decrypt → Generate TOTP Codes using otpauth library
```

### Current Security Features
- ✅ **AES-256-GCM encryption** with authentication tags
- ✅ **PBKDF2 key derivation** (100,000 iterations)
- ✅ **WebAuthn credential binding** for hardware security
- ✅ **Session-based key management** for consistency
- ✅ **Client-side TOTP generation** for zero server knowledge

## Technology Stack ✅ IMPLEMENTED

### Frontend
- **Framework**: React 18 with TypeScript
- **UI Library**: HeroUI with Tailwind CSS
- **Build Tool**: Vite with Yarn package manager
- **State Management**: Zustand + TanStack Query
- **Crypto**: Web Crypto API + WebAuthn API
- **TOTP**: OTPAuth library for code generation

### Backend
- **Language**: Go 1.21+
- **Framework**: Gin with middleware
- **Database**: PostgreSQL 14+ with SQLC
- **Authentication**: OAuth 2.0 (Google) + WebAuthn + JWT
- **Deployment**: Docker with Docker Compose

### Current Infrastructure
- **Development**: Docker Compose local setup
- **Database**: Single PostgreSQL instance
- **Frontend Serving**: Vite dev server (development)
- **API Server**: Single Go binary

## Deployment Architecture (Current)

### Development Environment ✅ WORKING
```
Local Machine → Docker Compose → Go Server + PostgreSQL + Vite Dev Server
```

### Production Considerations 🚧 PLANNED
```
Internet → Load Balancer → Go Server → PostgreSQL
                              ↓
                        Static Files → CDN
```

## Current Limitations & Future Plans

### ✅ Current Capabilities
- **Single-device usage** - Works perfectly in one browser
- **Google OAuth login** - Secure user authentication
- **WebAuthn registration** - Hardware security key support
- **E2E encrypted TOTP storage** - Zero-knowledge architecture
- **Real-time TOTP generation** - Client-side code generation
- **Responsive UI** - Works on desktop and mobile browsers

### 🚧 Planned Enhancements
- **Multi-device sync** - Cross-device encrypted synchronization
- **Additional OAuth providers** - GitHub, Microsoft, Apple
- **Backup & recovery** - Secure backup code generation
- **Mobile apps** - React Native or Progressive Web App
- **Browser extensions** - Chrome/Firefox extensions
- **Enterprise features** - Team management, audit logs

### ❌ Not Currently Implemented
- **Redis caching** - Single server, no caching layer needed yet
- **Microservices** - Monolithic architecture for simplicity
- **Kubernetes** - Docker Compose sufficient for current scale
- **Multi-database** - Single PostgreSQL instance
- **CDN integration** - Static files served directly

## Scalability Considerations

### Current Scale
- **Single server** can handle hundreds of concurrent users
- **PostgreSQL** can store millions of encrypted TOTP secrets
- **Stateless design** allows for horizontal scaling when needed

### Future Scaling Plans
- **Database scaling**: Read replicas and connection pooling
- **Server scaling**: Multiple Go server instances behind load balancer
- **Caching layer**: Redis for session and frequently accessed data
- **CDN**: Static asset distribution for global users

## Security Considerations ✅ IMPLEMENTED

### Current Threat Model
- **Trusted**: User's device and WebAuthn authenticator
- **Semi-trusted**: 2FAir server (honest but curious)
- **Untrusted**: Network, database breaches, third parties

### Security Controls
- ✅ **CSP**: Strict Content Security Policy configured
- ✅ **CORS**: Proper cross-origin resource sharing
- ✅ **JWT**: Secure token-based authentication
- ✅ **Rate Limiting**: API endpoint protection
- ✅ **Input Validation**: Server-side validation for all inputs
- ✅ **Error Handling**: No sensitive information leaked in errors

## Monitoring & Observability

### Current Monitoring ✅ BASIC
- **Health endpoints** for service status
- **Console logging** for development
- **Error tracking** in browser console

### Future Monitoring 🚧 PLANNED
- **Structured logging** with JSON format
- **Metrics collection** (Prometheus)
- **Dashboard visualization** (Grafana)
- **Alerting** for service degradation

## Compliance & Privacy ✅ IMPLEMENTED

### Privacy by Design
- **Minimal data collection** - Only OAuth profile info stored
- **Zero-knowledge encryption** - Server cannot access TOTP secrets
- **Local key derivation** - Encryption keys never transmitted
- **Session isolation** - Keys cleared on browser close

### Current Compliance
- **GDPR ready** - User data can be completely deleted
- **Security best practices** - Industry-standard encryption
- **Open source** - Transparent implementation

## Development Workflow ✅ WORKING

### Local Development
```bash
# Backend
cd server && go run cmd/server/main.go

# Frontend  
cd client && yarn dev

# Database
docker run postgres:14 (with env vars)
```

### Testing
- **Go backend**: `go test ./...`
- **React frontend**: `yarn test`
- **Manual testing**: Browser-based testing workflow

### Deployment
- **Development**: Docker Compose up
- **Production**: Manual deployment (CI/CD planned)

This architecture provides a solid foundation for the core 2FAir functionality while maintaining simplicity and security. The current implementation proves the zero-knowledge concept and provides excellent user experience for single-device usage.

Future enhancements can build upon this foundation to add multi-device sync, additional authentication providers, and enterprise features while maintaining the core security principles. 