# 2FAir Deployment Guide

**Status**: ✅ **Phase 3 Complete - Clean Architecture + PRF Implementation**  
**Last Updated**: January 2025  
**Production Readiness**: Core features complete, ready for production hardening

## Overview

This guide covers deploying 2FAir's zero-knowledge TOTP vault with clean architecture implementation. The system includes a Go backend with clean architecture, React frontend, PostgreSQL database, and WebAuthn PRF support for enhanced security.

## Quick Start

### Development Environment

```bash
# Clone repository
git clone <repository-url>
cd 2FAir

# Start complete development environment
cd server
docker-compose -f docker-compose.dev.yaml up -d

# Services available at:
# Frontend: http://localhost:5173
# Backend: http://localhost:8080
# Database: localhost:5432
```

### Production Deployment

```bash
# Build backend
cd server
make build-prod

# Build frontend
cd ../client
yarn install
yarn build

# Configure environment variables
cp .env.example .env.production
# Edit .env.production with your settings

# Start with Docker Compose
docker-compose -f docker-compose.prod.yaml up -d
```

## Environment Configuration

### Required Environment Variables

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=2fair_prod
DB_USER=2fair_user
DB_PASSWORD=your_secure_db_password

# JWT
JWT_SIGNING_KEY=your_256_bit_secret_key_here

# WebAuthn
WEBAUTHN_RP_ID=yourdomain.com
WEBAUTHN_RP_ORIGINS=https://yourdomain.com

# OAuth
OAUTH_GOOGLE_CLIENT_ID=your_google_client_id
OAUTH_GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## Security Considerations

- SSL/TLS required for production
- Secure environment variable storage
- Regular security updates
- Database backups
- Rate limiting enabled

## Monitoring

```bash
# Health checks
curl https://yourdomain.com/health

# API status
curl https://yourdomain.com/api/v1/public/status
```

---

**Deployment Status**: ✅ **Phase 3 Complete - Clean Architecture + PRF Implementation**
