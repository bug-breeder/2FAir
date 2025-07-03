#!/bin/bash
# =============================================================================
# 2FAir Frontend - Deploy to Google Cloud Storage (Staging)
# =============================================================================
# This script builds and deploys the frontend to Google Cloud Storage + CDN
# for the staging environment, including static pages (landing, pricing, about)
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
BUCKET_NAME="2fair-frontend-staging"
CDN_DISTRIBUTION="2fair-staging-cdn"
DOMAIN="staging.2fair.app"

echo -e "${BLUE}🚀 Deploying 2FAir Frontend to Google Cloud (Staging)${NC}"
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

# Build the application with staging environment
echo -e "${YELLOW}🏗️  Building application for staging...${NC}"
yarn build:ssg:staging

# Upload files to bucket
echo -e "${YELLOW}📦 Uploading files to Google Cloud Storage...${NC}"
gsutil -m rsync -r -d -c dist/ gs://$BUCKET_NAME/

# Set proper cache headers for different file types
echo -e "${YELLOW}⚡ Setting cache headers...${NC}"

# Long cache for assets with hashes (JS, CSS with hashes)
gsutil -m setmeta -h "Cache-Control:public, max-age=31536000" gs://$BUCKET_NAME/assets/**

# Short cache for HTML files (for updates)
gsutil -m setmeta -h "Cache-Control:public, max-age=3600" gs://$BUCKET_NAME/*.html

# Medium cache for static assets
gsutil -m setmeta -h "Cache-Control:public, max-age=86400" \
    gs://$BUCKET_NAME/*.ico \
    gs://$BUCKET_NAME/*.png \
    gs://$BUCKET_NAME/*.jpg \
    gs://$BUCKET_NAME/*.svg \
    gs://$BUCKET_NAME/*.webp

# Set proper content types
gsutil -m setmeta -h "Content-Type:text/html" gs://$BUCKET_NAME/*.html
gsutil -m setmeta -h "Content-Type:application/javascript" gs://$BUCKET_NAME/assets/*.js
gsutil -m setmeta -h "Content-Type:text/css" gs://$BUCKET_NAME/assets/*.css

echo ""
echo -e "${GREEN}🎉 Frontend deployment completed successfully!${NC}"
echo -e "${GREEN}Bucket URL: https://storage.googleapis.com/${BUCKET_NAME}/index.html${NC}"
echo ""
echo -e "${BLUE}Next steps for custom domain setup:${NC}"
echo -e "${BLUE}1. Set up Load Balancer in Google Cloud Console:${NC}"
echo -e "${BLUE}   - Create HTTPS Load Balancer${NC}"
echo -e "${BLUE}   - Backend: Cloud Storage bucket${NC}"
echo -e "${BLUE}   - Frontend: SSL certificate for ${DOMAIN}${NC}"
echo -e "${BLUE}2. Configure DNS with Porkbun:${NC}"
echo -e "${BLUE}   - Create A record: ${DOMAIN} → Load Balancer IP${NC}"
echo -e "${BLUE}3. Enable CDN (Cloud CDN) for better performance${NC}"
echo -e "${BLUE}4. Test the deployment: https://${DOMAIN}${NC}"

# Instructions for load balancer setup
cat << 'INSTRUCTIONS'

📋 Load Balancer Setup Instructions:

1. In Google Cloud Console, go to Network Services > Load Balancing
2. Create a new HTTPS Load Balancer
3. Backend configuration:
   - Backend type: Cloud Storage bucket
   - Bucket name: 2fair-frontend-staging
4. Host and path rules:
   - Hosts: staging.2fair.app
   - Paths: /* (all paths)
5. Frontend configuration:
   - Protocol: HTTPS
   - IP version: IPv4
   - Certificate: Create managed SSL certificate for staging.2fair.app
6. Enable Cloud CDN for better performance
7. Create the load balancer and note the IP address
8. In Porkbun DNS, create A record: staging.2fair.app → IP address

INSTRUCTIONS

