# 2FAir Deployment Documentation Overview

**Complete deployment documentation suite for Google Cloud Platform with 2fair.app domain**

## 📚 Documentation Structure

This deployment documentation provides everything needed to deploy the 2FAir application to production on Google Cloud Platform with your `2fair.app` domain.

### 📖 Available Guides

| Guide | Purpose | Time Required |
|-------|---------|---------------|
| **[Quick Start Deployment](QUICK_START_DEPLOYMENT.md)** | Fast-track 30-minute deployment | ~30 minutes |
| **[Troubleshooting Guide](TROUBLESHOOTING.md)** | Common issues and solutions | Reference |
| **[Backend Deployment](BACKEND_DEPLOYMENT.md)** | Detailed Google Cloud Run setup | ~45 minutes |  
| **[Frontend Deployment](FRONTEND_DEPLOYMENT.md)** | Firebase Hosting & static pages | ~30 minutes |
| **[DNS Configuration](DNS_CONFIGURATION.md)** | Porkbun DNS setup for 2fair.app | ~15 minutes |
| **[Phase 3.5 Deployment](PHASE_3_5_DEPLOYMENT.md)** | Complete environment setup | Reference |

## 🎯 Deployment Overview

### Architecture
```
🌐 Internet
├── 2fair.app (Production Frontend - Firebase Hosting)
├── staging.2fair.app (Staging Frontend - Firebase Hosting)  
├── api.2fair.app (Production Backend - Google Cloud Run)
└── api-staging.2fair.app (Staging Backend - Google Cloud Run)

📊 Infrastructure
├── Google Cloud Run (Backend containers)
├── Firebase Hosting (Frontend CDN)
├── Google Cloud Secret Manager (Secrets)
├── Neon PostgreSQL (Database)
└── Porkbun DNS (Domain management)
```

### Security Model
- **Zero-Knowledge Encryption**: Client-side AES-256-GCM
- **WebAuthn PRF**: Hardware-backed key derivation
- **OAuth 2.0**: Google authentication
- **SSL/TLS**: Automatic certificates
- **Secret Manager**: Encrypted secret storage
- **Environment Separation**: Dev/staging/production isolation

## 🚀 Deployment Paths

### Option 1: Quick Start (Recommended for First Time)
**Time**: ~30 minutes | **Complexity**: Low

1. **[Quick Start Deployment](QUICK_START_DEPLOYMENT.md)** - Follow this guide first
2. Covers all essential steps in order
3. Gets you to production quickly
4. Includes troubleshooting

**Best for**: First deployment, getting started quickly

### Option 2: Detailed Setup (Recommended for Production)
**Time**: ~2 hours | **Complexity**: Medium  

1. **[Backend Deployment](BACKEND_DEPLOYMENT.md)** - Detailed backend setup
2. **[Frontend Deployment](FRONTEND_DEPLOYMENT.md)** - Comprehensive frontend guide
3. **[DNS Configuration](DNS_CONFIGURATION.md)** - Complete DNS setup
4. **[Phase 3.5 Deployment](PHASE_3_5_DEPLOYMENT.md)** - Reference architecture

**Best for**: Production deployments, understanding the system

### Option 3: Component-by-Component
**Time**: Variable | **Complexity**: High

Use individual guides based on what you need to deploy or troubleshoot.

**Best for**: Partial deployments, troubleshooting, updates

## 📋 Pre-Deployment Checklist

### Required Accounts & Services
- [ ] **Google Cloud Platform** account with billing enabled
- [ ] **Firebase** project created (can be same as GCP project)
- [ ] **Porkbun** account with `2fair.app` domain purchased
- [ ] **Git** repository access

### Required Tools
- [ ] **Google Cloud CLI** installed and authenticated
- [ ] **Firebase CLI** installed and authenticated  
- [ ] **Docker** installed (for backend deployment)
- [ ] **Node.js 18+** and **Yarn** installed
- [ ] **Go 1.22+** installed (for local testing)

### Domain & DNS
- [ ] **Domain ownership** verified in Google Cloud Console
- [ ] **Porkbun DNS** management access
- [ ] **SSL certificate** provisioning ready

## 🌍 Environment Architecture

### Development (Local)
```
Frontend: http://localhost:5173
Backend: http://localhost:8080  
Database: Neon PostgreSQL (development instance)
Features: Debug mode, hot reload, relaxed CORS
```

### Staging (Cloud)
```
Frontend: https://staging.2fair.app
Backend: https://api-staging.2fair.app
Database: Neon PostgreSQL (staging instance)  
Features: Production-like, analytics, error reporting
```

### Production (Cloud)
```
Frontend: https://2fair.app
Backend: https://api.2fair.app
Database: Neon PostgreSQL (production instance)
Features: Maximum security, monitoring, CDN, caching
```

## 🔧 Key Configuration Files

### Backend Environment Files
```
server/
├── .env.development      # Local development config
├── .env.staging         # Staging environment config
├── .env.production      # Production environment config
├── deploy/gcp/
│   ├── staging.yaml     # Cloud Run staging deployment
│   └── production.yaml  # Cloud Run production deployment
└── scripts/
    ├── deploy-staging.sh    # Automated staging deployment
    ├── deploy-production.sh # Automated production deployment
    └── setup-gcp-secrets.sh # Secret Manager setup
```

### Frontend Environment Files  
```
client/
├── .env.development      # Local development config
├── .env.staging         # Staging environment config
├── .env.production      # Production environment config
├── firebase.json        # Firebase Hosting configuration
└── scripts/
    ├── deploy-staging.sh      # GCS staging deployment
    ├── deploy-production.sh   # GCS production deployment
    └── deploy-firebase.sh     # Firebase deployment
```

## 📊 Deployment Commands Reference

### Environment Switching
```bash
# Backend
cd server
./scripts/set-env.sh [development|staging|production]

# Frontend  
cd client
./scripts/set-env.sh [development|staging|production]
```

### Building Applications
```bash
# Backend (single binary for all environments)
cd server
make build

# Frontend (environment-specific builds)
cd client
yarn build:development    # Local build
yarn build:ssg:staging    # Staging with SSG
yarn build:ssg:production # Production with SSG
```

### Deployment Commands
```bash
# Backend deployment
cd server
./scripts/deploy-staging.sh     # Deploy to staging
./scripts/deploy-production.sh  # Deploy to production

# Frontend deployment (Firebase)
cd client  
./scripts/deploy-firebase.sh staging     # Deploy to staging
./scripts/deploy-firebase.sh production  # Deploy to production

# Frontend deployment (Google Cloud Storage)
cd client
./scripts/deploy-staging.sh     # Deploy to GCS staging
./scripts/deploy-production.sh  # Deploy to GCS production
```

### Health Checks
```bash
# Backend health
curl https://api-staging.2fair.app/health
curl https://api.2fair.app/health

# Frontend accessibility
curl -I https://staging.2fair.app
curl -I https://2fair.app

# DNS verification
dig 2fair.app
dig staging.2fair.app
```

## 🛠️ Common Operations

### Update Deployment
```bash
# Test in staging first
cd server && ./scripts/deploy-staging.sh
cd client && ./scripts/deploy-firebase.sh staging

# Verify staging works
curl https://api-staging.2fair.app/health
open https://staging.2fair.app

# Deploy to production
cd server && ./scripts/deploy-production.sh  
cd client && ./scripts/deploy-firebase.sh production
```

### Rollback (Emergency)
```bash
# Backend rollback
gcloud run services update 2fair-backend-production \
    --image=gcr.io/PROJECT_ID/2fair-backend:previous-tag

# Frontend rollback  
firebase hosting:rollback
```

### Scale Services
```bash
# Scale up for traffic
gcloud run services update 2fair-backend-production \
    --max-instances=100

# Scale down (maintenance)  
gcloud run services update 2fair-backend-production \
    --max-instances=1
```

## 🚨 Troubleshooting Quick Reference

### Backend Issues
```bash
# Check logs
gcloud logging read 'resource.type=cloud_run_revision' --limit=20

# Check service status
gcloud run services describe 2fair-backend-production --region=us-central1

# Test locally
cd server && ./scripts/set-env.sh staging && make run
```

### Frontend Issues  
```bash
# Check Firebase status
firebase hosting:sites:list

# Check build  
cd client && yarn build:ssg:production

# Test locally
cd client && yarn preview:production
```

### DNS/Domain Issues
```bash
# Check DNS propagation
dig 2fair.app
nslookup staging.2fair.app

# Check SSL certificates
curl -vI https://2fair.app

# Check domain mapping
gcloud run domain-mappings list --region=us-central1
```

## 📈 Monitoring & Maintenance

### Health Monitoring
- **Backend**: `/health` endpoints with JSON responses
- **Frontend**: HTTP status checks and Lighthouse audits
- **Database**: Connection health via backend health checks
- **DNS**: Resolution time and propagation monitoring

### Performance Monitoring  
- **Google Cloud Monitoring**: Automatic metrics for Cloud Run
- **Firebase Performance**: Frontend performance tracking
- **Lighthouse CI**: Automated performance audits
- **Core Web Vitals**: User experience metrics

### Security Monitoring
- **SSL certificate expiry**: Automatic renewal monitoring
- **Secret rotation**: Regular secret updates
- **Access logs**: Request monitoring and analysis
- **Error rates**: 4xx/5xx error tracking

## 🎯 Production Readiness

### Security Checklist
- [ ] **HTTPS** enforced for all domains
- [ ] **Security headers** configured (CSP, HSTS, etc.)
- [ ] **OAuth applications** configured per environment
- [ ] **Secrets** stored in Google Cloud Secret Manager
- [ ] **Database connections** encrypted and authenticated
- [ ] **Rate limiting** enabled and configured

### Performance Checklist  
- [ ] **CDN caching** optimized for static assets
- [ ] **Static site generation** for landing pages
- [ ] **Image optimization** and compression
- [ ] **Database connection pooling** configured
- [ ] **Auto-scaling** configured for traffic spikes
- [ ] **Health checks** responding under 1 second

### Reliability Checklist
- [ ] **Multi-region deployment** (future enhancement)
- [ ] **Database backups** automated
- [ ] **Error handling** comprehensive
- [ ] **Graceful degradation** for service failures
- [ ] **Monitoring alerts** configured
- [ ] **Incident response** procedures documented

## 📞 Support & Resources

### Documentation
- **Google Cloud Run**: https://cloud.google.com/run/docs
- **Firebase Hosting**: https://firebase.google.com/docs/hosting
- **Porkbun DNS**: https://porkbun.com/support
- **Let's Encrypt SSL**: https://letsencrypt.org/docs/

### Monitoring Tools
- **Google Cloud Console**: https://console.cloud.google.com
- **Firebase Console**: https://console.firebase.google.com  
- **DNS Propagation**: https://dnschecker.org
- **SSL Testing**: https://www.ssllabs.com/ssltest/

### Emergency Contacts
- **Google Cloud Support**: Available through Cloud Console
- **Firebase Support**: Available through Firebase Console
- **Porkbun Support**: Available through Porkbun dashboard

---

**🎉 Your 2FAir application is now production-ready with comprehensive deployment documentation!**

This documentation suite provides everything needed to deploy, maintain, and scale your 2FAir application on Google Cloud Platform with enterprise-grade security and performance. 