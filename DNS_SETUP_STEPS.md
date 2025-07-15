# 🌐 DNS Setup Steps for 2FAir

## 🎯 Quick Setup Guide

Follow these steps **in order**:

**📁 Directory Structure:**
- Frontend commands: Run from `client/` directory
- Backend commands: Run from `server/` directory  
- Google Cloud Storage commands: Run from project root

### Step 1: Domain Verification (Required First!)

1. **Go to Google Search Console**:
   - Visit: https://search.google.com/search-console/welcome
   - Click "Add a property"
   - Choose "Domain" (not URL prefix)
   - Enter: `2fair.app`

2. **Get Verification Code**:
   - Google will give you a TXT record like:
   ```
   google-site-verification=ABC123XYZ789...
   ```

3. **Add TXT Record to Porkbun**:
   - Login to your Porkbun account
   - Go to DNS settings for `2fair.app`
   - Add TXT record:
     - **Type**: TXT
     - **Name**: @ (or leave blank)
     - **Value**: `google-site-verification=ABC123XYZ789...`
     - **TTL**: 300

4. **Wait and Verify**:
   - Click "Verify" in Google Search Console
   - This may take up to 24 hours

### Step 2: Add DNS Records in Porkbun

Once verified, add these DNS records:

```
# Frontend (Root Domain) - Use ALIAS, not CNAME!
Type: ALIAS
Name: @ (or leave blank)
Value: c.storage.googleapis.com
TTL: 300

# Frontend (Staging)
Type: CNAME
Name: staging
Value: c.storage.googleapis.com
TTL: 300

# Backend (Production API)
Type: CNAME
Name: api
Value: ghs.googlehosted.com
TTL: 300

# Backend (Staging API)
Type: CNAME
Name: api-staging
Value: ghs.googlehosted.com
TTL: 300
```

**⚠️ Important:** Use **ALIAS** for the root domain (@), not CNAME. CNAME records are not allowed on root domains.

### Step 3: Create Domain Buckets (After Verification)

Run these commands after domain verification:

```bash
# Create domain-named buckets
gsutil mb -p fair-430204 gs://2fair.app
gsutil mb -p fair-430204 gs://staging.2fair.app

# Copy content from existing buckets
gsutil -m cp -r "gs://fair-430204-frontend-production/*" gs://2fair.app/
gsutil -m cp -r "gs://fair-430204-frontend-staging/*" gs://staging.2fair.app/

# Configure web hosting
gsutil web set -m index.html -e index.html gs://2fair.app
gsutil web set -m index.html -e index.html gs://staging.2fair.app

# Make publicly readable
gsutil iam ch allUsers:objectViewer gs://2fair.app
gsutil iam ch allUsers:objectViewer gs://staging.2fair.app
```

### Step 4: Verify Domain in Google Cloud Console

1. **Go to Google Cloud Console**:
   - Visit: https://console.cloud.google.com/appengine/settings/domains
   - Select project: `fair-430204`

2. **Add Custom Domain**:
   - Click "Add a custom domain"
   - Enter: `2fair.app`
   - Should auto-verify since you did Search Console verification

### Step 5: Create Cloud Run Domain Mappings

```bash
# Production Backend
gcloud beta run domain-mappings create \
  --service=twofair-backend-production \
  --domain=api.2fair.app \
  --region=us-central1 \
  --project=fair-430204

# Staging Backend
gcloud beta run domain-mappings create \
  --service=twofair-backend-staging \
  --domain=api-staging.2fair.app \
  --region=us-central1 \
  --project=fair-430204
```

### Step 6: Update Environment Files

```bash
# Navigate to client directory first
cd client

# Update staging environment
sed -i.bak 's|VITE_SERVER_URL=https://twofair-backend-staging-474220992748.us-central1.run.app|VITE_SERVER_URL=https://api-staging.2fair.app|' .env.staging

# Update production environment
sed -i.bak 's|VITE_SERVER_URL=https://twofair-backend-production-k3zvzefzqa-uc.a.run.app|VITE_SERVER_URL=https://api.2fair.app|' .env.production
```

### Step 7: Update Deployment Scripts

```bash
# Navigate to client directory first
cd client

# Update staging deployment script
sed -i.bak 's/BUCKET_NAME="fair-430204-frontend-staging"/BUCKET_NAME="staging.2fair.app"/' scripts/deploy-staging.sh

# Update production deployment script
sed -i.bak 's/BUCKET_NAME="fair-430204-frontend-production"/BUCKET_NAME="2fair.app"/' scripts/deploy-production.sh
```

### Step 8: Redeploy Frontend

```bash
# Navigate to client directory first (if not already there)
cd client

# Redeploy to new domain buckets
yarn deploy:staging
yarn deploy:production
```

## 🔍 Testing

After setup (and DNS propagation), test:

```bash
# Test frontend
curl -I https://2fair.app
curl -I https://staging.2fair.app

# Test backend APIs
curl -I https://api.2fair.app/health
curl -I https://api-staging.2fair.app/health
```

## ⏱️ Timeline

- **Domain Verification**: 1-24 hours
- **DNS Propagation**: 1-48 hours  
- **SSL Certificate**: 15-60 minutes after DNS active
- **Total Setup Time**: 1-3 days

## 🚨 Important Notes

1. **Do Step 1 FIRST** - Domain verification is required for everything else
2. **Wait for DNS** - Don't skip waiting for DNS propagation
3. **Check Porkbun** - Make sure all DNS records are added correctly
4. **Test Gradually** - Test frontend first, then backend APIs

## 🎯 Expected Final URLs

- **Production**: `https://2fair.app` + `https://api.2fair.app`
- **Staging**: `https://staging.2fair.app` + `https://api-staging.2fair.app`

---

**Start with Step 1 (Domain Verification) and work through in order!** 