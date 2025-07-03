# Phase 3.5: Environment Separation & Google Cloud Deployment

**Status**: ✅ **Complete - Multi-Environment Setup with Google Cloud Integration**

This phase implements proper environment separation (development, staging, production) and Google Cloud Platform deployment configurations for the 2FAir application using your `2fair.app` domain.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Development Environment                      │
│ Frontend: http://localhost:5173                                 │
│ Backend: http://localhost:8080                                  │
│ Database: Neon PostgreSQL (Development Instance)               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Staging Environment                        │
│ Frontend: https://staging.2fair.app                            │
│ Backend: https://api-staging.2fair.app                         │
│ Database: Neon PostgreSQL (Staging Instance)                   │
│ Deployment: Google Cloud Run + Storage/Firebase                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Production Environment                      │
│ Frontend: https://2fair.app                                    │
│ Backend: https://api.2fair.app                                 │
│ Database: Neon PostgreSQL (Production Instance)                │
│ Deployment: Google Cloud Run + Storage/Firebase                │
└─────────────────────────────────────────────────────────────────┘
```

## 📁 Environment Configuration Structure

### Backend (`server/`)
```
server/
├── .env.example              # Environment template
├── .env.development          # Local development config
├── .env.staging             # Staging environment config  
├── .env.production          # Production environment config
├── deploy/
│   └── gcp/
│       ├── staging.yaml     # Cloud Run staging config
│       └── production.yaml  # Cloud Run production config
└── scripts/
    ├── set-env.sh          # Environment switcher
    ├── setup-gcp-secrets.sh # Google Cloud secrets setup
    ├── deploy-staging.sh   # Staging deployment
    └── deploy-production.sh # Production deployment
```

### Frontend (`client/`)
```
client/
├── .env.example              # Environment template
├── .env.development          # Local development config
├── .env.staging             # Staging environment config
├── .env.production          # Production environment config
├── firebase.json            # Firebase Hosting config
└── scripts/
    ├── set-env.sh          # Environment switcher
    ├── deploy-staging.sh   # GCS staging deployment
    ├── deploy-production.sh # GCS production deployment
    └── deploy-firebase.sh  # Firebase deployment (alternative)
```

## 🚀 Quick Start Guide

### 1. Backend Setup

#### Switch Environment
```bash
cd server

# Switch to development (default)
./scripts/set-env.sh development

# Switch to staging
./scripts/set-env.sh staging

# Switch to production
./scripts/set-env.sh production
```

#### Local Development
```bash
# Use development environment
./scripts/set-env.sh development
make run
```

#### Deploy to Google Cloud
```bash
# Set up secrets (one-time)
./scripts/setup-gcp-secrets.sh

# Deploy to staging
./scripts/deploy-staging.sh

# Deploy to production
./scripts/deploy-production.sh
```

### 2. Frontend Setup

#### Switch Environment
```bash
cd client

# Switch to development (default)
./scripts/set-env.sh development

# Switch to staging
./scripts/set-env.sh staging

# Switch to production  
./scripts/set-env.sh production
```

#### Local Development
```bash
# Use development environment
./scripts/set-env.sh development
yarn dev
```

#### Build for Environments
```bash
# Build for development
yarn build:development

# Build for staging (includes static pages)
yarn build:ssg:staging

# Build for production (includes static pages)
yarn build:ssg:production
```

#### Deploy Frontend
```bash
# Option 1: Google Cloud Storage + CDN
./scripts/deploy-staging.sh
./scripts/deploy-production.sh

# Option 2: Firebase Hosting (recommended for static sites)
./scripts/deploy-firebase.sh staging
./scripts/deploy-firebase.sh production
```

## 🌐 Domain Configuration (Porkbun DNS)

### DNS Records Setup

#### Staging Environment
```
Type: CNAME
Name: staging
Content: ghs.googlehosted.com (Firebase) or your-lb-ip (GCS)

Type: CNAME  
Name: api-staging
Content: ghs.googlehosted.com (Cloud Run custom domain)
```

#### Production Environment
```
Type: A
Name: @
Content: YOUR_LOAD_BALANCER_IP

Type: CNAME
Name: www
Content: 2fair.app

Type: CNAME
Name: api
Content: ghs.googlehosted.com (Cloud Run custom domain)
```

## ✅ Phase 3.5 Features Implemented

- [x] Environment configuration files created
- [x] Google Cloud deployment configurations  
- [x] Automated deployment scripts
- [x] Security configurations with Secret Manager
- [x] Domain setup for 2fair.app
- [x] Firebase Hosting alternative for static pages
- [x] Multi-environment build processes
- [x] Comprehensive deployment documentation

## 🎯 Next Steps: Phase 4

After completing Phase 3.5 setup:

1. **Multi-Device Synchronization**: Implement encrypted sync across devices
2. **Backup & Recovery**: Secure backup codes and recovery mechanisms  
3. **Production Hardening**: Security audit and penetration testing
4. **Performance Optimization**: Caching, CDN optimization, monitoring

---

**Phase 3.5 Complete ✅ - Multi-Environment Setup Ready for Production Deployment**
