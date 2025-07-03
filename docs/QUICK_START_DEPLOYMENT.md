# Quick Start Deployment Guide

**Fast-track deployment for 2FAir to Google Cloud Platform with 2fair.app domain**

## 🚀 30-Minute Deployment

This guide gets your 2FAir application deployed to production in ~30 minutes with your `2fair.app` domain.

## 📋 Prerequisites Checklist

```bash
# Required tools
□ Google Cloud CLI installed
□ Firebase CLI installed  
□ Docker installed
□ Node.js 18+ & Yarn installed
□ Git repository access
□ Google Cloud Project created
□ 2fair.app domain purchased from Porkbun
```

## ⚡ Step 1: Initial Setup (5 minutes)

### 1.1 Environment Setup
```bash
# Set your project ID
export GOOGLE_CLOUD_PROJECT="your-project-id"

# Authenticate with Google Cloud
gcloud auth login
gcloud auth application-default login
gcloud config set project $GOOGLE_CLOUD_PROJECT

# Authenticate with Firebase
firebase login
```

### 1.2 Enable APIs
```bash
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    containerregistry.googleapis.com \
    secretmanager.googleapis.com \
    storage.googleapis.com \
    firebase.googleapis.com
```

## 🔒 Step 2: Security Setup (5 minutes)

### 2.1 Create Service Accounts
```bash
# Create staging service account (names must start with letter)
gcloud iam service-accounts create twofair-staging-sa \
    --description="2FAir Staging Service Account"

# Create production service account
gcloud iam service-accounts create twofair-production-sa \
    --description="2FAir Production Service Account"

# Grant permissions
gcloud projects add-iam-policy-binding $GOOGLE_CLOUD_PROJECT \
    --member="serviceAccount:twofair-staging-sa@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding $GOOGLE_CLOUD_PROJECT \
    --member="serviceAccount:twofair-production-sa@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
```

### 2.2 Setup Secrets
```bash
cd server

# Automated secrets setup
./scripts/setup-gcp-secrets.sh
```

## 🎨 Step 3: OAuth Setup (5 minutes)

### 3.1 Create OAuth Apps
1. Go to **Google Cloud Console** → APIs & Services → Credentials
2. Create **OAuth 2.0 Client IDs**:

#### Staging OAuth App
- **Name**: 2FAir Staging
- **Authorized origins**: `https://staging.2fair.app`
- **Redirect URIs**: `https://api-staging.2fair.app/api/v1/auth/google/callback`

#### Production OAuth App  
- **Name**: 2FAir Production
- **Authorized origins**: `https://2fair.app`
- **Redirect URIs**: `https://api.2fair.app/api/v1/auth/google/callback`

### 3.2 Update OAuth Secrets
```bash
# Create credential files with your actual values
cat > staging-oauth.json << EOF
{
  "client_id": "your-staging-client-id",
  "client_secret": "your-staging-client-secret"
}
EOF

cat > production-oauth.json << EOF
{
  "client_id": "your-production-client-id",
  "client_secret": "your-production-client-secret"
}
EOF

# Update secrets
gcloud secrets versions add google-oauth-staging --data-file=staging-oauth.json
gcloud secrets versions add google-oauth-production --data-file=production-oauth.json

# Clean up
rm staging-oauth.json production-oauth.json
```

## 🚀 Step 4: Backend Deployment (5 minutes)

### 4.1 Update Project Configuration
```bash
cd server

# Update project ID in deployment configs
sed -i "s/YOUR-PROJECT-ID/$GOOGLE_CLOUD_PROJECT/g" deploy/gcp/staging.yaml
sed -i "s/YOUR-PROJECT-ID/$GOOGLE_CLOUD_PROJECT/g" deploy/gcp/production.yaml
```

### 4.2 Deploy Backend
```bash
# Deploy to staging
./scripts/deploy-staging.sh

# Deploy to production
./scripts/deploy-production.sh
```

## 🎨 Step 5: Frontend Deployment (5 minutes)

### 5.1 Firebase Setup
```bash
cd client

# Initialize Firebase (choose your project)
firebase init hosting
```

### 5.2 Deploy Frontend
```bash
# Deploy to staging
./scripts/deploy-firebase.sh staging

# Deploy to production
./scripts/deploy-firebase.sh production
```

## 🌐 Step 6: DNS Configuration (5 minutes)

### 6.1 Add DNS Records in Porkbun

**Production Records:**
```
Type: A, Name: @, Content: 151.101.1.195, TTL: 300
Type: A, Name: @, Content: 151.101.65.195, TTL: 300
Type: CNAME, Name: www, Content: 2fair.app, TTL: 300
Type: CNAME, Name: api, Content: ghs.googlehosted.com, TTL: 300
```

**Staging Records:**
```
Type: A, Name: staging, Content: 151.101.1.195, TTL: 300
Type: CNAME, Name: api-staging, Content: ghs.googlehosted.com, TTL: 300
```

### 6.2 Custom Domain Setup

#### Firebase Console
1. **Hosting** → Add custom domain
2. Add `2fair.app` and `staging.2fair.app`
3. Follow verification steps

#### Google Cloud Console
1. **Cloud Run** → Manage Custom Domains
2. Add `api.2fair.app` and `api-staging.2fair.app`
3. Map to respective services

## ✅ Step 7: Verification (5 minutes)

### 7.1 Health Checks
```bash
# Backend health
curl https://api-staging.2fair.app/health
curl https://api.2fair.app/health

# Frontend accessibility
curl -I https://staging.2fair.app
curl -I https://2fair.app
```

### 7.2 End-to-End Test
1. **Visit** `https://staging.2fair.app`
2. **Click** "Login with Google"
3. **Complete** OAuth flow
4. **Verify** dashboard loads

## 🚨 Quick Troubleshooting

### Backend Issues
```bash
# Check logs
gcloud logging read 'resource.type=cloud_run_revision' --limit=10

# Check service status
gcloud run services list
```

### Frontend Issues
```bash
# Check Firebase deployment
firebase hosting:sites:list

# Redeploy if needed
./scripts/deploy-firebase.sh staging
```

### DNS Issues
```bash
# Check propagation
dig 2fair.app
dig staging.2fair.app

# Wait up to 24 hours for full propagation
```

## 📚 Complete Guides

For detailed information, refer to:
- **[Backend Deployment Guide](BACKEND_DEPLOYMENT.md)**
- **[Frontend Deployment Guide](FRONTEND_DEPLOYMENT.md)**
- **[DNS Configuration Guide](DNS_CONFIGURATION.md)**

## 🔄 Daily Operations

### Deploy Updates
```bash
# Backend updates
cd server
./scripts/deploy-staging.sh     # Test in staging
./scripts/deploy-production.sh  # Deploy to production

# Frontend updates  
cd client
./scripts/deploy-firebase.sh staging
./scripts/deploy-firebase.sh production
```

### Environment Switching
```bash
# Backend environment
cd server
./scripts/set-env.sh development  # Local dev
./scripts/set-env.sh staging      # Staging
./scripts/set-env.sh production   # Production

# Frontend environment
cd client  
./scripts/set-env.sh development  # Local dev
./scripts/set-env.sh staging      # Staging
./scripts/set-env.sh production   # Production
```

### Health Monitoring
```bash
# Quick health check script
curl -s https://api.2fair.app/health | jq
curl -s https://api-staging.2fair.app/health | jq
curl -I https://2fair.app
curl -I https://staging.2fair.app
```

## 🎯 Production Checklist

After deployment, verify:

### Security
- [ ] **HTTPS** working for all domains
- [ ] **OAuth flow** working end-to-end
- [ ] **API authentication** working
- [ ] **CORS** configured correctly

### Performance  
- [ ] **CDN caching** working
- [ ] **Static pages** pre-rendered
- [ ] **Health checks** responding < 1s
- [ ] **Lighthouse score** > 90

### Functionality
- [ ] **User registration** working
- [ ] **TOTP management** working
- [ ] **WebAuthn registration** working
- [ ] **Database connectivity** stable

### Monitoring
- [ ] **Cloud Run metrics** available
- [ ] **Firebase Analytics** tracking
- [ ] **Error reporting** configured
- [ ] **SSL certificates** auto-renewing

## 🆘 Emergency Procedures

### Rollback Deployment
```bash
# Backend rollback
gcloud run services update 2fair-backend-production \
    --image=gcr.io/$GOOGLE_CLOUD_PROJECT/2fair-backend:previous-tag \
    --region=us-central1

# Frontend rollback
firebase hosting:rollback
```

### Scale Down (Emergency)
```bash
# Scale down backend to 0 instances
gcloud run services update 2fair-backend-production \
    --max-instances=0 \
    --region=us-central1
```

### Check Service Status
```bash
# Backend status
gcloud run services describe 2fair-backend-production --region=us-central1

# Firebase status  
firebase hosting:sites:get production
```

---

**🎉 Congratulations! Your 2FAir application is now live at https://2fair.app!**

Your deployment includes:
- ✅ **Production-ready** backend on Google Cloud Run
- ✅ **Global CDN** frontend on Firebase Hosting  
- ✅ **SSL certificates** automatically managed
- ✅ **DNS configuration** for 2fair.app domain
- ✅ **Multi-environment** support (staging/production)
- ✅ **Zero-knowledge** TOTP encryption with WebAuthn

Users can now securely store and manage their TOTP codes with enterprise-grade security! 