# 2FAir Deployment Guide

**Status**: ✅ **Phase 3 Complete** (Core Complete, Not Production Ready)  
**Note**: For development and testing only. Production deployment requires Phase 4 completion.

## Development Deployment

### Local Development
```bash
git clone <repository-url>
cd 2FAir/server
docker-compose -f docker-compose.dev.yaml up -d

# Available at:
# Frontend: http://localhost:5173
# Backend: http://localhost:8080
# Database: localhost:5432
```

### Testing Environment
```bash
# Backend
cd server && make build

# Frontend  
cd client && yarn build

# Deploy for testing
docker-compose -f docker-compose.test.yaml up -d
```

## Environment Variables

**Required for Development:**
```bash
# Database
DB_HOST=localhost
DB_NAME=2fair_dev
DB_USER=2fair_user
DB_PASSWORD=dev_password

# Security
JWT_SIGNING_KEY=dev_256_bit_secret

# WebAuthn
WEBAUTHN_RP_ID=localhost
WEBAUTHN_RP_ORIGINS=http://localhost:5173

# OAuth
OAUTH_GOOGLE_CLIENT_ID=your_dev_client_id
OAUTH_GOOGLE_CLIENT_SECRET=your_dev_client_secret
```

## Development Health Checks

```bash
curl http://localhost:8080/health
curl http://localhost:8080/api/v1/public/status
```

## Production Readiness

🚧 **Phase 4 Required for Production:**
- Multi-device synchronization
- Security audit and hardening
- Performance optimization
- Production monitoring
- Backup and recovery systems
- Rate limiting and abuse prevention

---

**Current**: ✅ Phase 3 Complete (Core Features)  
**Next**: 🚧 Phase 4 - Production Hardening Required
