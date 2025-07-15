# DNS Setup Guide for 2FAir

This guide will help you configure DNS for your 2FAir application deployed on Google Cloud.

## 🎯 Domain Configuration Overview

### Target URLs:
- **Production Frontend**: `https://2fair.app`
- **Production Backend**: `https://api.2fair.app`
- **Staging Frontend**: `https://staging.2fair.app`
- **Staging Backend**: `https://api-staging.2fair.app`

### Current Google Cloud Resources:
- **Production Frontend**: `gs://fair-430204-frontend-production`
- **Production Backend**: `https://twofair-backend-production-k3zvzefzqa-uc.a.run.app`
- **Staging Frontend**: `gs://fair-430204-frontend-staging`
- **Staging Backend**: `https://twofair-backend-staging-474220992748.us-central1.run.app`

## 📋 Step-by-Step DNS Setup

### Step 1: Domain Verification in Google Cloud Console

1. **Go to Google Cloud Console**:
   - Navigate to: https://console.cloud.google.com/appengine/settings/domains
   - Select your project: `fair-430204`

2. **Add Custom Domain**:
   - Click "Add a custom domain"
   - Enter your domain: `2fair.app`
   - Follow the verification process

3. **Verify Domain Ownership**:
   - Google will provide a TXT record for verification
   - Add this TXT record to your Porkbun DNS settings
   - Wait for verification (can take up to 24 hours)

### Step 2: DNS Records Configuration in Porkbun

Login to your Porkbun account and add the following DNS records:

#### A. Frontend DNS Records (CNAME to Google Cloud Storage)

```
# Production Frontend
Type: CNAME
Name: @
Value: c.storage.googleapis.com
TTL: 300

# Staging Frontend
Type: CNAME
Name: staging
Value: c.storage.googleapis.com
TTL: 300
```

#### B. Backend DNS Records (CNAME to Cloud Run)

```
# Production Backend API
Type: CNAME
Name: api
Value: ghs.googlehosted.com
TTL: 300

# Staging Backend API
Type: CNAME
Name: api-staging
Value: ghs.googlehosted.com
TTL: 300
```

#### C. Domain Verification Record

```
# Google Domain Verification (you'll get this from Step 1)
Type: TXT
Name: @
Value: google-site-verification=<your-verification-code>
TTL: 300
```

### Step 3: Configure Google Cloud Storage for Custom Domains

Run these commands to configure your buckets:

```bash
# Make buckets publicly readable
gsutil iam ch allUsers:objectViewer gs://fair-430204-frontend-production
gsutil iam ch allUsers:objectViewer gs://fair-430204-frontend-staging

# Set bucket names to match domains
gsutil mb gs://2fair.app
gsutil mb gs://staging.2fair.app

# Copy content to domain-named buckets
gsutil cp -r gs://fair-430204-frontend-production/* gs://2fair.app/
gsutil cp -r gs://fair-430204-frontend-staging/* gs://staging.2fair.app/

# Configure web hosting
gsutil web set -m index.html -e index.html gs://2fair.app
gsutil web set -m index.html -e index.html gs://staging.2fair.app
```

### Step 4: Create Cloud Run Domain Mappings

After domain verification is complete, run these commands:

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

### Step 5: SSL Certificate Setup

Google Cloud automatically provisions SSL certificates for:
- ✅ Cloud Run services (backend APIs)
- ✅ Cloud Storage buckets (frontend)

This usually takes 15-60 minutes after DNS records are active.

## 🔧 Alternative: Manual Bucket Creation

If you prefer to create domain-named buckets manually:

```bash
# Create domain-named buckets
gsutil mb -p fair-430204 gs://2fair.app
gsutil mb -p fair-430204 gs://staging.2fair.app

# Configure for web hosting
gsutil web set -m index.html -e index.html gs://2fair.app
gsutil web set -m index.html -e index.html gs://staging.2fair.app

# Make publicly readable
gsutil iam ch allUsers:objectViewer gs://2fair.app
gsutil iam ch allUsers:objectViewer gs://staging.2fair.app

# Update deployment scripts to use domain buckets
```

## 🔍 DNS Verification

After setup, verify your DNS records:

```bash
# Check DNS propagation
dig 2fair.app CNAME
dig staging.2fair.app CNAME
dig api.2fair.app CNAME
dig api-staging.2fair.app CNAME

# Test endpoints
curl -I https://2fair.app
curl -I https://staging.2fair.app
curl -I https://api.2fair.app/health
curl -I https://api-staging.2fair.app/health
```

## 📝 Expected Results

After successful setup:
- `https://2fair.app` → Production frontend
- `https://staging.2fair.app` → Staging frontend
- `https://api.2fair.app` → Production backend
- `https://api-staging.2fair.app` → Staging backend

## 🚨 Troubleshooting

### Common Issues:

1. **DNS Propagation**: Can take 24-48 hours
2. **SSL Certificate**: Takes 15-60 minutes to provision
3. **Domain Verification**: Must be completed before Cloud Run mapping
4. **Bucket Names**: Must match domain exactly (`2fair.app`, not `2fair-app`)

### Debug Commands:

```bash
# Check domain verification status
gcloud domains list-user-verified

# Check SSL certificate status
gcloud compute ssl-certificates list

# Check Cloud Run domain mappings
gcloud beta run domain-mappings list
```

## 🔄 Environment Update

After DNS setup, update your environment files:

**Production (.env.production):**
```
VITE_SERVER_URL=https://api.2fair.app
```

**Staging (.env.staging):**
```
VITE_SERVER_URL=https://api-staging.2fair.app
```

Then redeploy your frontend applications.

## 📞 Support

If you encounter issues:
1. Check DNS propagation: https://whatsmydns.net/
2. Verify SSL certificates in Google Cloud Console
3. Check Cloud Run logs for backend issues
4. Review Porkbun DNS settings for typos

---

**Note**: This setup assumes you're using Porkbun as your DNS provider. Adjust the DNS record setup instructions if you're using a different provider. 