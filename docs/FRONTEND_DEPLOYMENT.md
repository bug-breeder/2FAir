# Frontend Deployment Guide - Firebase Hosting & Google Cloud Storage

**Complete guide for deploying the 2FAir frontend with static pages optimized deployment**

## 🎯 Overview

The 2FAir frontend is a React SPA with static pages that can be deployed using:
- **Firebase Hosting** (Recommended) - Optimized for static sites and SPAs
- **Google Cloud Storage + Load Balancer** - Full Google Cloud integration

### Deployment Targets
- **Staging**: `https://staging.2fair.app`
- **Production**: `https://2fair.app`
- **Static Pages**: Landing, Pricing, About (pre-rendered with SSG)
- **CDN**: Global content delivery with caching optimization

## 📋 Prerequisites

### Tools Required
```bash
# Firebase CLI
npm install -g firebase-tools

# Google Cloud CLI (for GCS option)
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init

# Node.js & Yarn
# Install from https://nodejs.org and https://yarnpkg.com
```

### Environment Setup
```bash
# Set your Google Cloud project
export GOOGLE_CLOUD_PROJECT="your-project-id"

# Authenticate with Firebase
firebase login

# Authenticate with Google Cloud (for GCS option)
gcloud auth login
```

## 🔧 Project Setup

### Environment Configuration
```bash
cd client

# Check available environments
ls .env.*

# Available:
# .env.development  - Local development
# .env.staging      - Staging environment  
# .env.production   - Production environment
```

### Environment Variables per Environment

#### Development
```bash
VITE_SERVER_URL=http://localhost:8080
VITE_ENVIRONMENT=development
VITE_ENABLE_DEBUG=true
VITE_SHOW_DEV_TOOLS=true
```

#### Staging
```bash
VITE_SERVER_URL=https://api-staging.2fair.app
VITE_ENVIRONMENT=staging
VITE_ENABLE_DEBUG=false
VITE_ENABLE_ANALYTICS=true
```

#### Production
```bash
VITE_SERVER_URL=https://api.2fair.app
VITE_ENVIRONMENT=production
VITE_ENABLE_DEBUG=false
VITE_ENABLE_ANALYTICS=true
VITE_FORCE_HTTPS=true
```

## 🚀 Option 1: Firebase Hosting (Recommended)

### Why Firebase Hosting?
- ✅ **Automatic SSL** certificates
- ✅ **Global CDN** with edge caching
- ✅ **SPA routing** support out-of-the-box
- ✅ **Static site optimization** 
- ✅ **Deploy previews** for testing
- ✅ **Easy custom domain** setup

### 1. Firebase Setup

```bash
cd client

# Initialize Firebase (if not done)
firebase init hosting

# Configuration prompts:
# ? Select a default Firebase project: [your-project-id]
# ? What do you want to use as your public directory? dist
# ? Configure as a single-page app (rewrite all urls to /index.html)? Yes
# ? Set up automatic builds and deploys with GitHub? No
```

### 2. Firebase Configuration

The `firebase.json` is already configured with:

```json
{
  "hosting": [
    {
      "site": "2fair-staging",
      "public": "dist",
      "rewrites": [{"source": "**", "destination": "/index.html"}],
      "headers": [
        {
          "source": "/assets/**",
          "headers": [{"key": "Cache-Control", "value": "public, max-age=31536000, immutable"}]
        },
        {
          "source": "**",
          "headers": [
            {"key": "X-Content-Type-Options", "value": "nosniff"},
            {"key": "X-Frame-Options", "value": "DENY"}
          ]
        }
      ]
    }
  ]
}
```

### 3. Automated Deployment

#### Staging Deployment
```bash
cd client

# Build and deploy staging
./scripts/deploy-firebase.sh staging
```

#### Production Deployment
```bash
cd client

# Build and deploy production (with confirmation)
./scripts/deploy-firebase.sh production
```

### 4. Manual Firebase Deployment

```bash
# Build for specific environment
yarn build:ssg:staging     # For staging
yarn build:ssg:production  # For production

# Deploy to specific site
firebase deploy --only hosting:2fair-staging
firebase deploy --only hosting:2fair-production
```

### 5. Custom Domain Setup (Firebase)

#### Add Custom Domain
1. **Firebase Console** → Hosting → Add custom domain
2. **Add domains**:
   - Staging: `staging.2fair.app`
   - Production: `2fair.app` and `www.2fair.app`
3. **Follow verification steps**
4. **SSL certificates** will be automatically provisioned

#### DNS Configuration (Porkbun)
After domain verification, add these records:

**Staging:**
```
Type: A
Name: staging
Content: [IP provided by Firebase]
TTL: 300
```

**Production:**
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

## 🗂️ Option 2: Google Cloud Storage + Load Balancer

### Why Google Cloud Storage?
- ✅ **Full Google Cloud integration**
- ✅ **Custom load balancer configuration**
- ✅ **Advanced caching control**
- ✅ **Cloud CDN integration**

### 1. Automated GCS Deployment

#### Staging Deployment
```bash
cd client

# Deploy to Google Cloud Storage
./scripts/deploy-staging.sh
```

#### Production Deployment
```bash
cd client

# Deploy to Google Cloud Storage (with confirmation)
./scripts/deploy-production.sh
```

### 2. Manual GCS Deployment

#### Create Storage Buckets
```bash
# Enable required APIs
gcloud services enable storage.googleapis.com compute.googleapis.com

# Create staging bucket
gsutil mb -p $GOOGLE_CLOUD_PROJECT -c STANDARD -l us-central1 gs://2fair-frontend-staging

# Create production bucket
gsutil mb -p $GOOGLE_CLOUD_PROJECT -c STANDARD -l us-central1 gs://2fair-frontend-production
```

#### Configure for Web Hosting
```bash
# Configure staging bucket
gsutil web set -m index.html -e 404.html gs://2fair-frontend-staging
gsutil iam ch allUsers:objectViewer gs://2fair-frontend-staging

# Configure production bucket
gsutil web set -m index.html -e 404.html gs://2fair-frontend-production
gsutil iam ch allUsers:objectViewer gs://2fair-frontend-production
```

#### Build and Upload
```bash
# Build for staging
yarn build:ssg:staging

# Upload to staging bucket
gsutil -m rsync -r -d -c dist/ gs://2fair-frontend-staging/

# Set cache headers
gsutil -m setmeta -h "Cache-Control:public, max-age=31536000" gs://2fair-frontend-staging/assets/**
gsutil -m setmeta -h "Cache-Control:public, max-age=3600" gs://2fair-frontend-staging/*.html
```

### 3. Load Balancer Setup

#### Create HTTPS Load Balancer
1. **Google Cloud Console** → Network Services → Load Balancing
2. **Create Load Balancer** → HTTP(S) Load Balancer
3. **Backend configuration**:
   - Backend type: Cloud Storage bucket
   - Bucket: `2fair-frontend-staging`
   - Enable Cloud CDN
4. **Host and path rules**:
   - Hosts: `staging.2fair.app`
   - Paths: `/*`
5. **Frontend configuration**:
   - Protocol: HTTPS
   - Create managed SSL certificate for `staging.2fair.app`

#### DNS Configuration for GCS
```
Type: A
Name: staging
Content: [Load Balancer IP]
TTL: 300

Type: A
Name: @
Content: [Load Balancer IP]
TTL: 300
```

## 🏗️ Build Process Details

### Environment-Specific Builds

#### Development Build
```bash
# Switch to development environment
./scripts/set-env.sh development

# Regular build (no SSG)
yarn build:development
```

#### Staging Build with SSG
```bash
# Switch to staging environment
./scripts/set-env.sh staging

# Build with static site generation
yarn build:ssg:staging

# What this includes:
# - Pre-rendered landing page
# - Pre-rendered pricing page  
# - Pre-rendered about page
# - Optimized assets with staging API endpoints
```

#### Production Build with SSG
```bash
# Switch to production environment
./scripts/set-env.sh production

# Build with static site generation
yarn build:ssg:production

# What this includes:
# - Pre-rendered static pages for SEO
# - Optimized and minified assets
# - Production API endpoints
# - Service worker (if configured)
# - Maximum security headers
```

### Static Site Generation (SSG)

The SSG process pre-renders these pages:
- **Landing page** (`/`) - Marketing content
- **Pricing page** (`/pricing`) - Pricing information
- **About page** (`/about`) - Company information

Benefits:
- ✅ **SEO optimization** - Search engines can crawl content
- ✅ **Faster initial load** - No client-side rendering needed
- ✅ **Better performance** - Instant page display
- ✅ **CDN caching** - Static files cached globally

## 🔍 Deployment Verification

### 1. Basic Functionality Test
```bash
# Test staging
curl -I https://staging.2fair.app
curl https://staging.2fair.app/health

# Test production
curl -I https://2fair.app
curl https://2fair.app/health
```

### 2. Static Pages Test
```bash
# Test static pages load correctly
curl https://staging.2fair.app/
curl https://staging.2fair.app/pricing
curl https://staging.2fair.app/about

# Check for pre-rendered content (should contain actual HTML, not just loading)
curl -s https://staging.2fair.app/ | grep -o '<title>.*</title>'
```

### 3. SPA Routing Test
```bash
# Test SPA routes (should return index.html)
curl https://staging.2fair.app/login
curl https://staging.2fair.app/dashboard
curl https://staging.2fair.app/settings
```

### 4. Cache Headers Test
```bash
# Check cache headers
curl -I https://staging.2fair.app/assets/index.js
curl -I https://staging.2fair.app/
```

### 5. Security Headers Test
```bash
# Check security headers
curl -I https://staging.2fair.app/ | grep -E "(X-Content-Type-Options|X-Frame-Options|Strict-Transport-Security)"
```

## 🛠️ Troubleshooting

### Build Issues
```bash
# Clear cache and rebuild
rm -rf node_modules dist .vite
yarn install
yarn build:ssg:staging

# Check environment variables
cat .env.local
grep VITE_ .env.local

# Test build locally
yarn preview:staging
```

### Firebase Deployment Issues
```bash
# Check Firebase project
firebase projects:list
firebase use --add

# Check hosting sites
firebase hosting:sites:list

# Deploy with debug
firebase deploy --only hosting --debug

# Check deployment status
firebase hosting:sites:get staging
```

### Domain Issues
```bash
# Check DNS propagation
dig staging.2fair.app
nslookup 2fair.app

# Check SSL certificate
openssl s_client -connect staging.2fair.app:443 -servername staging.2fair.app

# Test from different locations
curl -I -H "Host: staging.2fair.app" https://[IP_ADDRESS]/
```

### Performance Issues
```bash
# Check Lighthouse scores
npx lighthouse https://staging.2fair.app --output=html --output-path=./lighthouse-staging.html

# Check Core Web Vitals
# Use Google PageSpeed Insights or Firebase Performance monitoring
```

### Static Site Generation Issues
```bash
# Check prerender script
cat scripts/prerender.js

# Test prerender manually
yarn build:staging
yarn prerender

# Check generated files
ls -la dist/
```

## 📊 Monitoring & Performance

### Firebase Analytics (Recommended)
```javascript
// Already configured in environment files
VITE_ENABLE_ANALYTICS=true // staging and production
```

### Performance Monitoring
- **Firebase Performance**: Automatic performance tracking
- **Google Analytics**: User behavior analytics
- **Core Web Vitals**: Loading, interactivity, visual stability
- **Lighthouse CI**: Automated performance audits

### CDN Performance
- **Firebase Hosting**: Global CDN with automatic optimization
- **Google Cloud CDN**: Advanced caching rules and compression
- **Cache hit ratio**: Monitor CDN effectiveness
- **Time to first byte**: Measure response times globally

## 🔒 Security Configuration

### Content Security Policy (CSP)
```javascript
// Configured in environment files
VITE_ENABLE_CSP=true  // production only
```

### Security Headers
All deployments include:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains` (production)

### HTTPS Enforcement
- **Firebase Hosting**: Automatic HTTPS redirect
- **Google Cloud Load Balancer**: Configurable HTTPS redirect
- **HSTS Headers**: Force HTTPS for returning visitors

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] **Environment variables** configured for target environment
- [ ] **API endpoints** pointing to correct backend
- [ ] **OAuth configuration** matches environment
- [ ] **Build process** completes successfully
- [ ] **Static pages** generate correctly

### Firebase Hosting
- [ ] **Firebase project** configured
- [ ] **Hosting sites** created for staging and production
- [ ] **Custom domains** added and verified
- [ ] **SSL certificates** provisioned
- [ ] **DNS records** configured in Porkbun
- [ ] **Cache headers** configured properly

### Google Cloud Storage (if used)
- [ ] **Storage buckets** created and configured
- [ ] **Web hosting** enabled on buckets
- [ ] **Load balancer** created and configured
- [ ] **SSL certificates** created for custom domains
- [ ] **Cloud CDN** enabled
- [ ] **DNS records** pointing to load balancer

### Final Verification
- [ ] **All pages** load correctly
- [ ] **Static pages** pre-rendered with content
- [ ] **SPA routing** works for all routes
- [ ] **Backend API** connectivity verified
- [ ] **OAuth flow** working end-to-end
- [ ] **Performance** scores acceptable (Lighthouse > 90)
- [ ] **Security headers** configured
- [ ] **Analytics** tracking working (if enabled)

---

**🎉 Your 2FAir frontend is now deployed with optimized static pages and global CDN delivery!**

The deployment includes proper caching, security headers, and pre-rendered static pages for optimal SEO and performance. 