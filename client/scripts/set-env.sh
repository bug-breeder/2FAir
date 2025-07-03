#!/bin/bash
# =============================================================================
# 2FAir Frontend - Environment Switcher
# =============================================================================
# This script switches between different environment configurations
# Usage: ./scripts/set-env.sh [development|staging|production]
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

ENV=${1:-development}

echo -e "${BLUE}🔄 Switching frontend to ${ENV} environment${NC}"

# Validate environment
case $ENV in
    development|staging|production)
        ;;
    *)
        echo -e "${RED}❌ Invalid environment: ${ENV}${NC}"
        echo -e "${YELLOW}Usage: $0 [development|staging|production]${NC}"
        exit 1
        ;;
esac

# Check if environment file exists
ENV_FILE=".env.${ENV}"
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ Environment file not found: ${ENV_FILE}${NC}"
    exit 1
fi

# Backup current .env files if they exist
if [ -f ".env" ]; then
    cp .env ".env.backup.$(date +%Y%m%d_%H%M%S)"
    echo -e "${YELLOW}📋 Backed up current .env file${NC}"
fi

if [ -f ".env.local" ]; then
    cp .env.local ".env.local.backup.$(date +%Y%m%d_%H%M%S)"
    echo -e "${YELLOW}📋 Backed up current .env.local file${NC}"
fi

# Copy environment file to both .env and .env.local (Vite priority)
cp "$ENV_FILE" ".env"
cp "$ENV_FILE" ".env.local"
echo -e "${GREEN}✅ Switched to ${ENV} environment${NC}"

# Show current environment info
echo ""
echo -e "${BLUE}📋 Current Frontend Environment Configuration:${NC}"
echo -e "${BLUE}Environment: $(grep VITE_ENVIRONMENT .env | cut -d'=' -f2)${NC}"
echo -e "${BLUE}Server URL: $(grep VITE_SERVER_URL .env | cut -d'=' -f2)${NC}"
echo -e "${BLUE}App Name: $(grep VITE_APP_NAME .env | cut -d'=' -f2)${NC}"
echo -e "${BLUE}Debug Mode: $(grep VITE_ENABLE_DEBUG .env | cut -d'=' -f2)${NC}"

if [ "$ENV" = "development" ]; then
    echo ""
    echo -e "${GREEN}🚀 Ready for local development!${NC}"
    echo -e "${BLUE}Run: yarn dev${NC}"
elif [ "$ENV" = "staging" ]; then
    echo ""
    echo -e "${YELLOW}⚠️  Staging environment configured${NC}"
    echo -e "${BLUE}Run: yarn build:staging${NC}"
elif [ "$ENV" = "production" ]; then
    echo ""
    echo -e "${RED}⚠️  PRODUCTION environment configured${NC}"
    echo -e "${RED}Use with extreme caution!${NC}"
    echo -e "${BLUE}Run: yarn build:production${NC}"
fi

