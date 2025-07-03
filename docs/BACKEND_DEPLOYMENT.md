# Backend Deployment Guide - Google Cloud Run

**Complete guide for deploying the 2FAir backend to Google Cloud Run**

## 🎯 Overview

The 2FAir backend is deployed as a containerized service on Google Cloud Run with:
- **Staging**: `https://api-staging.2fair.app`
- **Production**: `https://api.2fair.app`
- **Database**: Neon PostgreSQL (separate instances per environment)
- **Secrets**: Google Cloud Secret Manager
- **Authentication**: Google OAuth 2.0

## 📋 Prerequisites

### Tools Required
```bash
# Google Cloud CLI
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init

# Docker
# Install from https://docker.com

# Go 1.22+ (for local testing)
# Install from https://golang.org
```

### Environment Setup
```bash
# Set your Google Cloud project
export GOOGLE_CLOUD_PROJECT="your-project-id"
gcloud config set project $GOOGLE_CLOUD_PROJECT

# Authenticate
gcloud auth login
gcloud auth application-default login
```

## 🔧 Initial Setup

### 1. Enable Required APIs
```bash
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    containerregistry.googleapis.com \
    secretmanager.googleapis.com
```

### 2. Create Service Accounts
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

### 3. Setup Secrets
```bash
cd server

# Automated secrets setup
./scripts/setup-gcp-secrets.sh

# Manual secrets setup (alternative)
echo "npg_IUcf4vkrYK0h" | gcloud secrets create neon-db-password --data-file=-

# JWT keys (from environment files)
grep JWT_SIGNING_KEY .env.staging | cut -d'=' -f2 | gcloud secrets create jwt-signing-key-staging --data-file=-
grep JWT_SIGNING_KEY .env.production | cut -d'=' -f2 | gcloud secrets create jwt-signing-key-production --data-file=-
```

## 🚀 Deployment Process

### 1. Automated Deployment (Recommended)

#### Staging Deployment
```bash
cd server

# Update project ID in configurations
sed -i "s/YOUR-PROJECT-ID/$GOOGLE_CLOUD_PROJECT/g" deploy/gcp/staging.yaml

# Deploy to staging
./scripts/deploy-staging.sh
```

#### Production Deployment
```bash
cd server

# Update project ID in configurations  
sed -i "s/YOUR-PROJECT-ID/$GOOGLE_CLOUD_PROJECT/g" deploy/gcp/production.yaml

# Deploy to production (with confirmation)
./scripts/deploy-production.sh
```

### 2. Manual Deployment Process

#### Build and Push Image
```bash
# Build production Docker image
docker build -f Dockerfile.production -t gcr.io/$GOOGLE_CLOUD_PROJECT/2fair-backend:staging .

# Push to Google Container Registry
docker push gcr.io/$GOOGLE_CLOUD_PROJECT/2fair-backend:staging

# For production
docker build -f Dockerfile.production -t gcr.io/$GOOGLE_CLOUD_PROJECT/2fair-backend:production .
docker push gcr.io/$GOOGLE_CLOUD_PROJECT/2fair-backend:production
```

#### Deploy to Cloud Run
```bash
# Deploy staging
gcloud run services replace deploy/gcp/staging.yaml --region=us-central1

# Deploy production
gcloud run services replace deploy/gcp/production.yaml --region=us-central1
```

## 🌐 Custom Domain Setup

### 1. Map Custom Domains
```bash
# Staging domain
gcloud run domain-mappings create \
    --service=2fair-backend-staging \
    --domain=api-staging.2fair.app \
    --region=us-central1

# Production domain
gcloud run domain-mappings create \
    --service=2fair-backend-production \
    --domain=api.2fair.app \
    --region=us-central1
```

### 2. DNS Configuration (Porkbun)
Add these CNAME records in your Porkbun DNS:

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

## 🔒 OAuth Configuration

### 1. Create OAuth Applications

#### Staging OAuth App
1. Go to **Google Cloud Console** → APIs & Services → Credentials
2. Create **OAuth 2.0 Client ID**:
   - **Application type**: Web application
   - **Name**: 2FAir Staging
   - **Authorized origins**: `https://staging.2fair.app`
   - **Authorized redirect URIs**: `https://api-staging.2fair.app/api/v1/auth/google/callback`

#### Production OAuth App  
1. Create **OAuth 2.0 Client ID**:
   - **Application type**: Web application
   - **Name**: 2FAir Production
   - **Authorized origins**: `https://2fair.app`
   - **Authorized redirect URIs**: `https://api.2fair.app/api/v1/auth/google/callback`

### 2. Update OAuth Secrets
```bash
# Create OAuth credential files
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

# Update secrets in Google Cloud
gcloud secrets versions add google-oauth-staging --data-file=staging-oauth.json
gcloud secrets versions add google-oauth-production --data-file=production-oauth.json

# Clean up files
rm staging-oauth.json production-oauth.json
```

## 🔍 Deployment Verification

### 1. Health Checks
```bash
# Test staging health endpoint
curl https://api-staging.2fair.app/health

# Test production health endpoint  
curl https://api.2fair.app/health

# Expected response:
# {"status":"ok","timestamp":"2025-01-01T00:00:00Z","environment":"staging"}
```

### 2. Database Connectivity
```bash
# Check Cloud Run logs
gcloud logging read 'resource.type=cloud_run_revision AND resource.labels.service_name=2fair-backend-staging' --limit=10

# Test database connection locally
cd server
./scripts/set-env.sh staging
go run cmd/server/main.go -health-check
```

### 3. OAuth Flow Test
1. Visit `https://staging.2fair.app` or `https://2fair.app`
2. Click "Login with Google"
3. Should redirect to Google OAuth
4. After authorization, should redirect back successfully

## 🛠️ Troubleshooting

### Build Issues
```bash
# Check build logs
gcloud builds list --limit=5
gcloud builds log [BUILD_ID]

# Test build locally
docker build -f Dockerfile.production -t test-build .
docker run -p 8080:8080 test-build
```

### Runtime Issues
```bash
# Check service logs
gcloud logging read 'resource.type=cloud_run_revision' --limit=50 --format=json

# Check service status  
gcloud run services describe 2fair-backend-staging --region=us-central1

# Test service locally
cd server
./scripts/set-env.sh staging
make run
```

### Secret Access Issues
```bash
# List secrets
gcloud secrets list

# Test secret access
gcloud secrets versions access latest --secret=neon-db-password

# Check service account permissions
gcloud iam service-accounts get-iam-policy 2fair-staging-sa@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com
```

### Domain Issues
```bash
# Check domain mapping status
gcloud run domain-mappings list --region=us-central1

# Check DNS propagation
dig api-staging.2fair.app
nslookup api.2fair.app

# Check SSL certificate
curl -I https://api-staging.2fair.app
```

## 📊 Monitoring & Maintenance

### Performance Monitoring
- **Cloud Run Metrics**: Automatic in Google Cloud Console
- **Request latency**: Monitor p95/p99 response times
- **Error rates**: Track 4xx/5xx error percentages
- **Resource usage**: CPU/Memory utilization

### Log Analysis
```bash
# Recent errors
gcloud logging read 'resource.type=cloud_run_revision AND severity>=ERROR' --limit=20

# Performance logs
gcloud logging read 'resource.type=cloud_run_revision AND textPayload:"slow request"' --limit=20

# Database connection logs
gcloud logging read 'resource.type=cloud_run_revision AND textPayload:"database"' --limit=20
```

### Scaling Configuration
The Cloud Run services are configured with:
- **Staging**: 1-10 instances, 1 CPU, 512Mi memory
- **Production**: 2-100 instances, 2 CPU, 1Gi memory
- **Auto-scaling**: Based on request volume and CPU usage

## 🔄 Environment Management

### Switch Local Environment
```bash
cd server

# Development
./scripts/set-env.sh development

# Staging  
./scripts/set-env.sh staging

# Production
./scripts/set-env.sh production
```

### Environment Variables per Environment

#### Development
- **Database**: Neon development instance
- **CORS**: Permissive for localhost
- **Logging**: Debug level, text format
- **Rate limiting**: Relaxed

#### Staging  
- **Database**: Neon staging instance
- **CORS**: Restricted to staging.2fair.app
- **Logging**: Info level, JSON format
- **Rate limiting**: Production-like

#### Production
- **Database**: Neon production instance
- **CORS**: Restricted to 2fair.app only
- **Logging**: Warn level, JSON format  
- **Rate limiting**: Strict limits
- **Security headers**: Maximum security

## 📋 Deployment Checklist

- [ ] **Environment secrets** configured in Google Cloud Secret Manager
- [ ] **OAuth applications** created for staging and production
- [ ] **Service accounts** created with proper permissions
- [ ] **Docker images** built and pushed to Container Registry
- [ ] **Cloud Run services** deployed and running
- [ ] **Custom domains** mapped and SSL certificates active
- [ ] **DNS records** configured in Porkbun
- [ ] **Health checks** passing for all endpoints
- [ ] **Database connectivity** verified
- [ ] **OAuth flow** working end-to-end
- [ ] **CORS configuration** tested with frontend
- [ ] **Error monitoring** configured
- [ ] **Performance monitoring** enabled

---

**🎉 Your 2FAir backend is now deployed and ready for production traffic!** 