# System Architecture - 2FAir E2E Encrypted TOTP Vault

## Overview

2FAir is a cloud-synced, multi-device TOTP (Time-based One-Time Password) vault that implements end-to-end encryption using WebAuthn PRF (Pseudo-Random Function) for key derivation. The system ensures that TOTP seeds are never stored in plaintext on the server while providing seamless multi-device synchronization.

## Architecture Principles

### Security-First Design
- **Zero-Knowledge Architecture**: Server never sees TOTP seeds in plaintext
- **End-to-End Encryption**: All sensitive data encrypted client-side
- **Defense in Depth**: Multiple security layers (encryption, authentication, authorization)
- **Principle of Least Privilege**: Minimal data exposure and access rights

### Modern Standards
- **WebAuthn PRF**: Industry-standard passkey-based key derivation
- **FIDO2 Compliance**: Full support for modern authenticators
- **Progressive Enhancement**: Graceful fallback for older browsers
- **Mobile-First**: Optimized for smartphone usage patterns

### Scalability & Performance
- **Stateless API Design**: Horizontal scaling capability
- **Efficient Sync**: Delta-based synchronization
- **Local-First**: Offline functionality with local caching
- **Edge-Compatible**: CDN and edge deployment ready

## High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Apps   │    │   API Gateway   │    │   Core Services │
│                 │    │                 │    │                 │
│ • Web App       │◄──►│ • Rate Limiting │◄──►│ • Auth Service  │
│ • Mobile Apps   │    │ • Load Balancer │    │ • Vault Service │
│ • Extensions    │    │ • TLS Term.     │    │ • Sync Service  │
│                 │    │ • CORS/CSP      │    │ • Backup Svc    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Client Crypto   │    │   Middleware    │    │   Data Layer    │
│                 │    │                 │    │                 │
│ • WebAuthn PRF  │    │ • Auth Verify   │    │ • PostgreSQL    │
│ • AES-GCM       │    │ • Audit Log     │    │ • Redis Cache   │
│ • HKDF          │    │ • Error Handle  │    │ • File Storage  │
│ • IndexedDB     │    │ • Metrics       │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Component Architecture

### Frontend Components

#### Crypto Layer
- **WebAuthn Manager**: Handles passkey creation, authentication, and PRF
- **Encryption Service**: AES-GCM encryption/decryption of TOTP seeds
- **Key Derivation**: HKDF-based KEK to DEK derivation
- **Storage Manager**: IndexedDB and OPFS for offline caching

#### Application Layer
- **Vault Manager**: TOTP seed CRUD operations
- **Sync Manager**: Multi-device synchronization logic
- **Device Manager**: Device registration and session management
- **Backup Manager**: Recovery code generation and restoration

#### UI Components
- **Authentication Flow**: WebAuthn registration and login
- **Vault Interface**: TOTP display, search, and management
- **Settings Panel**: Security settings and device management
- **Onboarding Flow**: First-time setup and device pairing

### Backend Components

#### API Services
- **Authentication Service**: WebAuthn credential verification
- **Vault Service**: Encrypted TOTP seed management
- **Sync Service**: Multi-device synchronization coordination
- **Backup Service**: Recovery code management
- **Admin Service**: User and system administration

#### Infrastructure Services
- **Database Service**: PostgreSQL with connection pooling
- **Cache Service**: Redis for session and frequently accessed data
- **Storage Service**: Encrypted blob storage for large payloads
- **Monitoring Service**: Metrics, logging, and alerting

## Data Flow Overview

### Registration Flow
```
User ──► WebAuthn Create ──► PRF Generate ──► HKDF(KEK→DEK) ──► Store Wrapped DEK
```

### Login Flow
```
User ──► WebAuthn Auth ──► PRF Reproduce ──► HKDF(KEK→DEK) ──► Unwrap DEK
```

### TOTP Operations
```
Add: Plaintext Seed ──► AES-GCM(DEK) ──► Store {ct, iv, tag}
Read: Fetch {ct, iv, tag} ──► AES-GCM⁻¹(DEK) ──► Generate TOTP
```

### Multi-Device Sync
```
Device A: Change ──► Encrypt ──► Upload ──► Sync Event
Device B: Poll ──► Download ──► Decrypt ──► Local Update
```

## Security Architecture

### Encryption Layers

1. **Transport Security**: TLS 1.3 for all communications
2. **Application Security**: E2E encryption of sensitive data
3. **Storage Security**: Encrypted at rest with separate keys
4. **Access Security**: Multi-factor authentication required

### Key Management

```
WebAuthn PRF (32B) ──HKDF──► KEK (32B) ──AES-Wrap──► Wrapped DEK
                                │
                                ▼
                         DEK (32B) ──AES-GCM──► Encrypted TOTP Seeds
```

### Trust Model

- **Client-Side Trust**: User's device and passkey
- **Zero Server Trust**: Server cannot decrypt user data
- **Network Distrust**: All communications encrypted
- **Backup Trust**: User-controlled recovery keys only

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **UI Library**: HeroUI with Tailwind CSS
- **Build Tool**: Vite with Yarn
- **State Management**: Zustand + TanStack Query
- **Crypto**: Web Crypto API + WebAuthn
- **Storage**: IndexedDB + OPFS

### Backend
- **Language**: Go 1.22+
- **Framework**: Gin with middleware ecosystem
- **Database**: PostgreSQL 15+ with SQLC
- **Cache**: Redis 7+ for sessions and sync
- **Authentication**: WebAuthn library
- **Deployment**: Docker with Kubernetes

### Infrastructure
- **Database**: PostgreSQL with read replicas
- **Cache**: Redis Cluster for high availability
- **Storage**: S3-compatible object storage
- **CDN**: CloudFlare for static assets
- **Monitoring**: Prometheus + Grafana
- **Logging**: Structured JSON logs with ELK stack

## Deployment Architecture

### Production Environment
```
Internet ──► CDN ──► Load Balancer ──► API Gateway ──► Services
                                                        │
                                                        ▼
                                              ┌─────────────────┐
                                              │  Data Layer     │
                                              │                 │
                                              │ • Primary DB    │
                                              │ • Read Replicas │
                                              │ • Redis Cluster │
                                              │ • Blob Storage  │
                                              └─────────────────┘
```

### Development Environment
```
Local Dev ──► Docker Compose ──► Local Services + Local DB
```

## Scalability Considerations

### Horizontal Scaling
- **Stateless Services**: All services can be horizontally scaled
- **Database Sharding**: User-based sharding strategy
- **Cache Distribution**: Redis Cluster for distributed caching
- **CDN Utilization**: Global content distribution

### Performance Optimization
- **Connection Pooling**: Database connection management
- **Query Optimization**: Indexed queries and prepared statements
- **Caching Strategy**: Multi-level caching (Redis, CDN, browser)
- **Compression**: gzip/brotli for API responses

## Security Considerations

### Threat Model
- **Threat**: Database breach ➤ **Mitigation**: E2E encryption
- **Threat**: Network interception ➤ **Mitigation**: TLS 1.3
- **Threat**: Client compromise ➤ **Mitigation**: Limited plaintext exposure
- **Threat**: Phishing attacks ➤ **Mitigation**: WebAuthn domain binding

### Security Controls
- **CSP**: Strict Content Security Policy
- **HSTS**: HTTP Strict Transport Security
- **CSRF**: Token-based CSRF protection
- **Rate Limiting**: API and authentication rate limits
- **Audit Logging**: Comprehensive security event logging

## Monitoring & Observability

### Metrics
- **API Metrics**: Request rates, response times, error rates
- **Business Metrics**: User registrations, TOTP additions, sync events
- **Security Metrics**: Failed auth attempts, suspicious activities
- **Performance Metrics**: Database query times, cache hit rates

### Alerting
- **High Priority**: Security incidents, service outages
- **Medium Priority**: Performance degradation, error rate spikes
- **Low Priority**: Resource usage, maintenance reminders

### Logging
- **Structured Logging**: JSON format with correlation IDs
- **Security Events**: Authentication, authorization, data access
- **Audit Trail**: All user actions with device identification
- **Error Tracking**: Exception monitoring and alerting

## Compliance & Privacy

### Data Protection
- **GDPR Compliance**: Right to erasure, data portability
- **CCPA Compliance**: California privacy regulations
- **SOC 2**: Security and availability controls
- **Privacy by Design**: Minimal data collection

### Regulatory Considerations
- **Encryption Standards**: FIPS 140-2 Level 1 compatibility
- **Key Management**: Proper key lifecycle management
- **Data Residency**: Geographic data location controls
- **Incident Response**: Security incident procedures

This architecture provides a robust foundation for implementing the E2E encrypted TOTP vault while maintaining security, scalability, and user experience standards. 