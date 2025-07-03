#!/bin/bash
# =============================================================================
# 2FAir Frontend - Deploy to Google Cloud Storage (Production)
# =============================================================================
# This script builds and deploys the frontend to Google Cloud Storage + CDN
# for the production environment, including static pages (landing, pricing, about)
# WARNING: This deploys to production. Use with caution!
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=${GOOGLE_CLOUD_PROJECT:-"your-gcp-project-id"}
BUCKET_NAME="2fair-frontend-production"
CDN_DISTRIBUTION="2fair-production-cdn"
DOMAIN="2fair.app"

echo -e "${RED}⚠️  PRODUCTION DEPLOYMENT WARNING ⚠️${NC}"
echo -e "${RED}This will deploy to the production environment!${NC}"
echo -e "${YELLOW}Press Ctrl+C to cancel, or Enter to continue...${NC}"
read

echo -e "${BLUE}🚀 Deploying 2FAir Frontend to Google Cloud (Production)${NC}"
echo -e "${BLUE}Domain: ${DOMAIN}${NC}"
echo -e "${BLUE}Bucket: ${BUCKET_NAME}${NC}"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${RED}❌ Please authenticate with gcloud: gcloud auth login${NC}"
    exit 1
fi

# Set project
echo -e "${YELLOW}📋 Setting Google Cloud project...${NC}"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo -e "${YELLOW}🔧 Enabling required APIs...${NC}"
gcloud services enable \
    storage.googleapis.com \
    compute.googleapis.com \
    cloudresourcemanager.googleapis.com

# Create storage bucket (if it doesn't exist)
echo -e "${YELLOW}🗂️  Creating storage bucket...${NC}"
if ! gsutil ls -b gs://$BUCKET_NAME &>/dev/null; then
    gsutil mb -p $PROJECT_ID -c STANDARD -l us-central1 gs://$BUCKET_NAME
    echo -e "${GREEN}✅ Created storage bucket: gs://$BUCKET_NAME${NC}"
else
    echo -e "${YELLOW}⚠️  Bucket already exists: gs://$BUCKET_NAME${NC}"
fi

# Configure bucket for web hosting
echo -e "${YELLOW}🌐 Configuring bucket for web hosting...${NC}"
gsutil web set -m index.html -e 404.html gs://$BUCKET_NAME

# Make bucket publicly readable
gsutil iam ch allUsers:objectViewer gs://$BUCKET_NAME

# Build the application with production environment
echo -e "${YELLOW}��️  Building application for production...${NC}"
yarn build:ssg:production

# Upload files to bucket
echo -e "${YELLOW}📦 Uploading files to Google Cloud Storage...${NC}"
gsutil -m rsync -r -d -c dist/ gs://$BUCKET_NAME/

# Set proper cache headers for different file types
echo -e "${YELLOW}⚡ Setting cache headers for production...${NC}"

# Long cache for assets with hashes (JS, CSS with hashes) - 1 year
gsutil -m setmeta -h "Cache-Control:public, max-age=31536000, immutable" gs://$BUCKET_NAME/assets/**

# Short cache for HTML files (for updates) - 1 hour
gsutil -m setmeta -h "Cache-Control:public, max-age=3600, must-revalidate" gs://$BUCKET_NAME/*.html

# Medium cache for static assets - 1 day
gsutil -m setmeta -h "Cache-Control:public, max-age=86400" \
    gs://$BUCKET_NAME/*.ico \
    gs://$BUCKET_NAME/*.png \
    gs://$BUCKET_NAME/*.jpg \
    gs://$BUCKET_NAME/*.svg \
    gs://$BUCKET_NAME/*.webp

# Set proper content types
gsutil -m setmeta -h "Content-Type:text/html; charset=utf-8" gs://$BUCKET_NAME/*.html
gsutil -m setmeta -h "Content-Type:application/javascript; charset=utf-8" gs://$BUCKET_NAME/assets/*.js
gsutil -m setmeta -h "Content-Type:text/css; charset=utf-8" gs://$BUCKET_NAME/assets/*.css

# Set security headers for HTML files
gsutil -m setmeta \
    -h "X-Content-Type-Options:nosniff" \
    -h "X-Frame-Options:DENY" \
    -h "X-XSS-Protection:1; mode=block" \
    -h "Referrer-Policy:strict-origin-when-cross-origin" \
    -h "Permissions-Policy:geolocation=(), microphone=(), camera=()" \
    gs://$BUCKET_NAME/*.html

echo ""
echo -e "${GREEN}🎉 Production frontend deployment completed successfully!${NC}"
echo -e "${GREEN}Bucket URL: https://storage.googleapis.com/${BUCKET_NAME}/index.html${NC}"
echo ""
echo -e "${BLUE}Next steps for custom domain setup:${NC}"
echo -e "${BLUE}1. Set up Load Balancer in Google Cloud Console:${NC}"
echo -e "${BLUE}   - Create HTTPS Load Balancer${NC}"
echo -e "${BLUE}   - Backend: Cloud Storage bucket${NC}"
echo -e "${BLUE}   - Frontend: SSL certificate for ${DOMAIN}${NC}"
echo -e "${BLUE}2. Configure DNS with Porkbun:${NC}"
echo -e "${BLUE}   - Create A record: ${DOMAIN} → Load Balancer IP${NC}"
echo -e "${BLUE}   - Create CNAME record: www.${DOMAIN} → ${DOMAIN}${NC}"
echo -e "${BLUE}3. Enable CDN (Cloud CDN) for better performance${NC}"
echo -e "${BLUE}4. Test the deployment: https://${DOMAIN}${NC}"
echo -e "${BLUE}5. Monitor performance and logs${NC}"

# Instructions for load balancer setup
cat << 'INSTRUCTIONS'

📋 Production Load Balancer Setup Instructions:

1. In Google Cloud Console, go to Network Services > Load Balancing
2. Create a new HTTPS Load Balancer
3. Backend configuration:
   - Backend type: Cloud Storage bucket
   - Bucket name: 2fair-frontend-production
   - Enable Cloud CDN
   - CDN cache mode: Cache static content
4. Host and path rules:
   - Hosts: 2fair.app, www.2fair.app
   - Paths: /* (all paths)
5. Frontend configuration:
   - Protocol: HTTPS
   - IP version: IPv4 and IPv6
   - Certificate: Create managed SSL certificate for 2fair.app and www.2fair.app
6. Security settings:
   - Enable Cloud Armor (optional)
   - Configure rate limiting
7. Create the load balancer and note the IP addresses
8. In Porkbun DNS:
   - Create A record: 2fair.app → IPv4 address
   - Create AAAA record: 2fair.app → IPv6 address  
   - Create CNAME record: www.2fair.app → 2fair.app

INSTRUCTIONS

