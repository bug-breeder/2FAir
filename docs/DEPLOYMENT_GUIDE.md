# 2FAir Deployment Guide

**Complete deployment instructions for staging and production environments**

This guide covers deploying the 2FAir application to Google Cloud Platform using your `2fair.app` domain with proper environment separation.

## 📋 Prerequisites

### Required Tools
```bash
# Google Cloud CLI
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init

# Firebase CLI (for frontend hosting)
npm install -g firebase-tools

# Docker (for backend deployment)
# Install from https://docker.com

# Node.js & Yarn (for frontend)
# Install from https://nodejs.org and https://yarnpkg.com
```

### Domain Setup (Porkbun)
- Domain purchased: `2fair.app`
- DNS management access via Porkbun dashboard

### Google Cloud Project
1. Create a new Google Cloud Project
2. Enable billing (required for Cloud Run and Storage)
3. Note your PROJECT_ID

## 🏗️ Initial Setup

### 1. Google Cloud Project Configuration

```bash
# Set your project ID
export GOOGLE_CLOUD_PROJECT="your-project-id"
gcloud config set project $GOOGLE_CLOUD_PROJECT

# Enable required APIs
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    containerregistry.googleapis.com \
    secretmanager.googleapis.com \
    storage.googleapis.com \
    compute.googleapis.com \
    firebase.googleapis.com
```

### 2. Authentication Setup

```bash
# Authenticate with Google Cloud
gcloud auth login
gcloud auth application-default login

# Authenticate with Firebase
firebase login
```

## 🔒 Security Setup

### 1. Create Service Accounts

```bash
# Staging service account
gcloud iam service-accounts create 2fair-staging-sa \
    --description="2FAir Staging Service Account" \
    --display-name="2FAir Staging"

# Production service account
gcloud iam service-accounts create 2fair-production-sa \
    --description="2FAir Production Service Account" \
    --display-name="2FAir Production"

# Grant Secret Manager access
gcloud projects add-iam-policy-binding $GOOGLE_CLOUD_PROJECT \
    --member="serviceAccount:2fair-staging-sa@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding $GOOGLE_CLOUD_PROJECT \
    --member="serviceAccount:2fair-production-sa@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
```

### 2. Setup Google Cloud Secrets

```bash
cd server

# Run the automated secrets setup
./scripts/setup-gcp-secrets.sh

# Or manually create secrets
echo "npg_IUcf4vkrYK0h" | gcloud secrets create neon-db-password --data-file=-
```

### 3. OAuth Credentials Setup

1. **Go to Google Cloud Console** → APIs & Services → Credentials
2. **Create OAuth 2.0 Client IDs** for each environment:

#### Development OAuth App
- **Application type**: Web application
- **Name**: 2FAir Development
- **Authorized origins**: `http://localhost:5173`
- **Authorized redirect URIs**: `http://localhost:8080/api/v1/auth/google/callback`

#### Staging OAuth App
- **Application type**: Web application
- **Name**: 2FAir Staging
- **Authorized origins**: `https://staging.2fair.app`
- **Authorized redirect URIs**: `https://api-staging.2fair.app/api/v1/auth/google/callback`

#### Production OAuth App
- **Application type**: Web application
- **Name**: 2FAir Production
- **Authorized origins**: `https://2fair.app`
- **Authorized redirect URIs**: `https://api.2fair.app/api/v1/auth/google/callback`

3. **Update secrets with OAuth credentials**:

```bash
# Create JSON files with OAuth credentials
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

# Clean up credential files
rm staging-oauth.json production-oauth.json
```

## 🚀 Backend Deployment

### 1. Staging Deployment

```bash
cd server

# Update deployment configurations with your project ID
sed -i "s/YOUR-PROJECT-ID/$GOOGLE_CLOUD_PROJECT/g" deploy/gcp/staging.yaml
sed -i "s/YOUR-PROJECT-ID/$GOOGLE_CLOUD_PROJECT/g" deploy/gcp/production.yaml

# Deploy to staging
./scripts/deploy-staging.sh
```

**What this does:**
- Builds Docker image with production optimizations
- Pushes to Google Container Registry
- Creates/updates Google Cloud secrets
- Deploys to Cloud Run with auto-scaling
- Configures health checks and monitoring

### 2. Production Deployment

```bash
cd server

# Deploy to production (with confirmation prompt)
./scripts/deploy-production.sh
```

### 3. Manual Backend Deployment (Alternative)

```bash
# Build and tag image
docker build -f Dockerfile.production -t gcr.io/$GOOGLE_CLOUD_PROJECT/2fair-backend:staging .

# Push to Container Registry
docker push gcr.io/$GOOGLE_CLOUD_PROJECT/2fair-backend:staging

# Deploy to Cloud Run
gcloud run services replace deploy/gcp/staging.yaml --region=us-central1
```

### 4. Backend Custom Domain Setup

```bash
# Map custom domain to Cloud Run service
gcloud run domain-mappings create \
    --service=2fair-backend-staging \
    --domain=api-staging.2fair.app \
    --region=us-central1

gcloud run domain-mappings create \
    --service=2fair-backend-production \
    --domain=api.2fair.app \
    --region=us-central1
```

## 🎨 Frontend Deployment

### Option 1: Firebase Hosting (Recommended)

#### 1. Firebase Setup

```bash
cd client

# Initialize Firebase
firebase init hosting

# Select your Google Cloud project
# Choose 'dist' as public directory
# Configure as single-page app: Yes
# Set up automatic builds: No (we'll use scripts)
```

#### 2. Update Firebase Configuration

```bash
# The firebase.json is already configured with:
# - Proper caching headers
# - Security headers
# - SPA routing
# - Staging and production sites
```

#### 3. Deploy to Firebase

```bash
# Deploy to staging
./scripts/deploy-firebase.sh staging

# Deploy to production  
./scripts/deploy-firebase.sh production
```

#### 4. Custom Domain Setup (Firebase)

1. **In Firebase Console** → Hosting → Add custom domain
2. **Add domains**:
   - Staging: `staging.2fair.app`
   - Production: `2fair.app` and `www.2fair.app`
3. **Follow verification steps**
4. **DNS records will be provided**

### Option 2: Google Cloud Storage + Load Balancer

#### 1. Deploy to Cloud Storage

```bash
cd client

# Deploy staging
./scripts/deploy-staging.sh

# Deploy production
./scripts/deploy-production.sh
```

#### 2. Load Balancer Setup

1. **Go to Google Cloud Console** → Network Services → Load Balancing
2. **Create HTTPS Load Balancer**
3. **Backend configuration**:
   - Backend type: Cloud Storage bucket
   - Bucket: `2fair-frontend-staging` or `2fair-frontend-production`
   - Enable Cloud CDN
4. **Frontend configuration**:
   - Protocol: HTTPS
   - Create managed SSL certificate for your domains
5. **Create load balancer**

## 🌐 DNS Configuration (Porkbun)

### Firebase Hosting DNS (Recommended)

After setting up custom domains in Firebase Console, add these records in Porkbun:

#### Staging
```
Type: CNAME
Name: staging
Content: [provided by Firebase]
TTL: 300
```

#### Production
```
Type: A
Name: @
Content: [IP provided by Firebase]
TTL: 300

Type: A  
Name: www
Content: [IP provided by Firebase]
TTL: 300
```

#### Backend API
```
Type: CNAME
Name: api-staging
Content: ghs.googlehosted.com
TTL: 300

Type: CNAME
Name: api
Content: ghs.googlehosted.com  
TTL: 300
```

### Google Cloud Storage DNS (Alternative)

If using Cloud Storage + Load Balancer:

```
Type: A
Name: @
Content: [Load Balancer IP]
TTL: 300

Type: A
Name: staging
Content: [Staging Load Balancer IP]
TTL: 300

Type: CNAME
Name: www
Content: 2fair.app
TTL: 300
```

## 🔧 Environment Management

### Backend Environment Switching

```bash
cd server

# Switch to development
./scripts/set-env.sh development

# Switch to staging  
./scripts/set-env.sh staging

# Switch to production
./scripts/set-env.sh production

# Check current environment
grep ENVIRONMENT .env
```

### Frontend Environment Switching

```bash
cd client

# Switch to development
./scripts/set-env.sh development

# Switch to staging
./scripts/set-env.sh staging  

# Switch to production
./scripts/set-env.sh production

# Check current environment
grep VITE_ENVIRONMENT .env.local
```

### Environment-Specific Builds

```bash
cd client

# Development build
yarn build:development

# Staging build with static site generation
yarn build:ssg:staging

# Production build with static site generation
yarn build:ssg:production

# Preview builds locally
yarn preview:staging
yarn preview:production
```

## 🚨 Production Deployment Checklist

### Pre-Deployment

- [ ] **Google Cloud Project** configured with billing enabled
- [ ] **Domain ownership** verified with DNS provider
- [ ] **OAuth applications** created for each environment
- [ ] **Environment variables** configured and secrets created
- [ ] **SSL certificates** requested (automatic with Firebase/Cloud Run)

### Backend Deployment

- [ ] **Build succeeds** locally with production settings
- [ ] **Database migrations** run successfully
- [ ] **Health check endpoint** returns 200 OK
- [ ] **Environment variables** loaded from Secret Manager
- [ ] **Custom domain** mapped to Cloud Run service
- [ ] **CORS origins** configured for production domain

### Frontend Deployment

- [ ] **Static site generation** completes successfully
- [ ] **Environment variables** set for production API
- [ ] **Build artifacts** optimized and compressed
- [ ] **CDN caching** configured with proper headers
- [ ] **Custom domain** configured and SSL active
- [ ] **SPA routing** working for all pages

### DNS & Domain

- [ ] **DNS records** configured correctly
- [ ] **SSL certificates** issued and active
- [ ] **Domain propagation** complete (check with dig/nslookup)
- [ ] **HTTPS redirect** working
- [ ] **www redirect** configured (if needed)

### Security

- [ ] **OAuth consent screen** published
- [ ] **API keys** restricted to production domains
- [ ] **Security headers** configured (CSP, HSTS, etc.)
- [ ] **Rate limiting** enabled
- [ ] **Error pages** don't expose sensitive information

### Monitoring

- [ ] **Health checks** configured in Cloud Run
- [ ] **Logging** enabled with appropriate levels
- [ ] **Error reporting** configured
- [ ] **Performance monitoring** enabled
- [ ] **Uptime monitoring** configured

## 🛠️ Troubleshooting

### Backend Issues

#### Deployment Fails
```bash
# Check build logs
gcloud builds list --limit=5
gcloud builds log [BUILD_ID]

# Check Cloud Run logs
gcloud logging read 'resource.type=cloud_run_revision AND resource.labels.service_name=2fair-backend-staging' --limit=50 --format=json

# Test locally
cd server
./scripts/set-env.sh staging
make run
curl http://localhost:8080/health
```

#### Database Connection Issues
```bash
# Test database connectivity
go run cmd/server/main.go -health-check

# Check Neon database status
# Visit Neon dashboard and verify instance is running

# Verify connection string
echo $DB_HOST
```

#### Secret Manager Issues
```bash
# List secrets
gcloud secrets list

# Check secret access
gcloud secrets versions access latest --secret=neon-db-password

# Verify service account permissions
gcloud iam service-accounts get-iam-policy 2fair-staging-sa@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com
```

### Frontend Issues

#### Build Fails
```bash
# Check environment variables
cat .env.local

# Clear cache and rebuild
rm -rf node_modules dist .next
yarn install
yarn build:ssg:production
```

#### Deployment Issues with Firebase
```bash
# Check Firebase project
firebase projects:list
firebase use --add

# Check hosting status
firebase hosting:sites:list

# Deploy with debug info
firebase deploy --only hosting --debug
```

#### Domain/DNS Issues
```bash
# Check DNS propagation
dig staging.2fair.app
dig 2fair.app

# Check SSL certificate
curl -I https://staging.2fair.app
openssl s_client -connect staging.2fair.app:443 -servername staging.2fair.app
```

### OAuth Issues

#### Redirect URI Mismatch
1. Check OAuth app configuration in Google Cloud Console
2. Verify redirect URIs match exactly:
   - Development: `http://localhost:8080/api/v1/auth/google/callback`
   - Staging: `https://api-staging.2fair.app/api/v1/auth/google/callback`
   - Production: `https://api.2fair.app/api/v1/auth/google/callback`

#### Invalid Client ID
```bash
# Check environment variables
grep OAUTH_GOOGLE_CLIENT_ID .env

# Verify secret in Google Cloud
gcloud secrets versions access latest --secret=google-oauth-staging
```

## 📊 Monitoring & Maintenance

### Health Checks

```bash
# Backend health
curl https://api-staging.2fair.app/health
curl https://api.2fair.app/health

# Frontend availability
curl -I https://staging.2fair.app
curl -I https://2fair.app
```

### Log Monitoring

```bash
# Cloud Run logs
gcloud logging read 'resource.type=cloud_run_revision' --limit=50

# Firebase Hosting logs (via Firebase Console)
# Cloud Storage access logs (if using GCS)
```

### Performance Monitoring

- **Google Cloud Monitoring**: Automatic metrics for Cloud Run
- **Firebase Performance**: Frontend performance monitoring
- **Lighthouse**: Automated performance audits

### Security Monitoring

- **Cloud Security Command Center**: Security insights
- **Cloud Logging**: Security event monitoring  
- **Certificate expiry**: Automatic renewal with managed certificates

## 🔄 Deployment Automation

### GitHub Actions (Future Enhancement)

```yaml
# .github/workflows/deploy-staging.yml
name: Deploy to Staging
on:
  push:
    branches: [develop]
jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: google-github-actions/setup-gcloud@v0
        with:
          service_account_key: ${{ secrets.GCP_SA_KEY }}
          project_id: ${{ secrets.GCP_PROJECT_ID }}
      - name: Deploy Backend
        run: cd server && ./scripts/deploy-staging.sh
  
  deploy-frontend:
    runs-on: ubuntu-latest  
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Deploy Frontend
        run: cd client && ./scripts/deploy-firebase.sh staging
```

## 📝 Deployment Log Template

Keep a deployment log for tracking:

```markdown
## Deployment Log - [Date]

### Environment: [Staging/Production]
### Deployed by: [Name]
### Commit: [Git commit hash]

#### Backend
- [ ] Environment: [version/commit]
- [ ] Database migrations: [applied/skipped]
- [ ] Health check: [pass/fail]
- [ ] URL: [https://api.2fair.app/health]

#### Frontend  
- [ ] Build: [success/failed]
- [ ] Static pages: [generated/skipped]
- [ ] Deployment: [success/failed]
- [ ] URL: [https://2fair.app]

#### Issues
- [List any issues encountered]

#### Rollback Plan
- [Steps to rollback if needed]
```

---

**🎉 Your 2FAir application is now ready for production deployment!**

This guide provides everything needed to deploy securely and reliably to Google Cloud Platform with your `2fair.app` domain. 