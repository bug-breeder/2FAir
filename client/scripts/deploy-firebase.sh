#!/bin/bash
# =============================================================================
# 2FAir Frontend - Deploy to Firebase Hosting (Alternative)
# =============================================================================
# This script builds and deploys the frontend to Firebase Hosting
# Firebase Hosting is optimized for static sites and SPA deployment
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

ENV=${1:-staging}

echo -e "${BLUE}🚀 Deploying 2FAir Frontend to Firebase Hosting (${ENV})${NC}"

# Validate environment
case $ENV in
    staging|production)
        ;;
    *)
        echo -e "${RED}❌ Invalid environment: ${ENV}${NC}"
        echo -e "${YELLOW}Usage: $0 [staging|production]${NC}"
        exit 1
        ;;
esac

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}❌ Firebase CLI is not installed.${NC}"
    echo -e "${YELLOW}Install with: npm install -g firebase-tools${NC}"
    exit 1
fi

# Check if authenticated
if ! firebase projects:list &>/dev/null; then
    echo -e "${RED}❌ Please authenticate with Firebase: firebase login${NC}"
    exit 1
fi

# Build the application for the specified environment
echo -e "${YELLOW}🏗️  Building application for ${ENV}...${NC}"
yarn build:ssg:${ENV}

# Deploy to Firebase
echo -e "${YELLOW}🚀 Deploying to Firebase Hosting...${NC}"

if [ "$ENV" = "staging" ]; then
    # Deploy to staging
    firebase use staging 2>/dev/null || echo -e "${YELLOW}⚠️  Add staging project to Firebase${NC}"
    firebase deploy --only hosting:staging
    SITE_URL="https://staging.2fair.app"
elif [ "$ENV" = "production" ]; then
    # Production confirmation
    echo -e "${RED}⚠️  PRODUCTION DEPLOYMENT WARNING ⚠️${NC}"
    echo -e "${RED}This will deploy to the production environment!${NC}"
    echo -e "${YELLOW}Press Ctrl+C to cancel, or Enter to continue...${NC}"
    read
    
    firebase use production 2>/dev/null || echo -e "${YELLOW}⚠️  Add production project to Firebase${NC}"
    firebase deploy --only hosting:production
    SITE_URL="https://2fair.app"
fi

echo ""
echo -e "${GREEN}🎉 Firebase deployment completed successfully!${NC}"
echo -e "${GREEN}Site URL: ${SITE_URL}${NC}"
echo ""
echo -e "${BLUE}Firebase Hosting provides:${NC}"
echo -e "${BLUE}• Automatic SSL certificates${NC}"
echo -e "${BLUE}• Global CDN${NC}"
echo -e "${BLUE}• Automatic cache optimization${NC}"
echo -e "${BLUE}• SPA routing support${NC}"
echo -e "${BLUE}• Deploy previews${NC}"

