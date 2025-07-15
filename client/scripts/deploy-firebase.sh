#!/bin/bash
# =============================================================================
# 2FAir Frontend - Firebase Hosting Deployment
# =============================================================================
# Automated deployment script for Firebase hosting with proper error handling,
# environment validation, and comprehensive logging
# =============================================================================

set -euo pipefail # Exit on error, undefined vars, pipe failures

# Configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
readonly FIREBASE_PROJECT="twofair-hosting"

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m' # No Color

# Environment configuration
get_env_config() {
    local env="$1"
    case "$env" in
        "development")
            echo "http://localhost:8080|2fair-development|http://localhost:5173"
            ;;
        "staging")
            echo "https://api-staging.2fair.app|2fair-staging|https://staging.2fair.app"
            ;;
        "production") 
            echo "https://api.2fair.app|2fair-production|https://2fair.app"
            ;;
        *)
            return 1
            ;;
    esac
}

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}" >&2
}

log_step() {
    echo -e "${CYAN}🔄 $1${NC}"
}

# Validation functions
validate_environment() {
    local env="$1"
    if ! get_env_config "$env" >/dev/null 2>&1; then
        log_error "Invalid environment: $env"
        echo "Valid environments: development, staging, production"
        exit 1
    fi
}

check_prerequisites() {
    log_step "Checking prerequisites..."
    
    # Check if we're in the right directory
    if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
        log_error "Must be run from the client directory"
        exit 1
    fi

    # Check if Firebase CLI is available
if ! command -v firebase &> /dev/null; then
        log_error "Firebase CLI not found. Install with: npm install -g firebase-tools"
    exit 1
fi

# Check if authenticated
if ! firebase projects:list &>/dev/null; then
        log_error "Please authenticate with Firebase: firebase login"
        exit 1
    fi
    
    # Check if yarn is available
    if ! command -v yarn &> /dev/null; then
        log_error "Yarn not found. Please install yarn package manager."
    exit 1
fi

    log_success "All prerequisites met"
}

parse_environment_config() {
    local env="$1"
    local config
    config=$(get_env_config "$env")
    
    IFS='|' read -r API_URL FIREBASE_SITE CUSTOM_DOMAIN <<< "$config"
    
    # Export for use in other functions
    export API_URL FIREBASE_SITE CUSTOM_DOMAIN
}

confirm_production_deployment() {
    if [[ "$1" == "production" ]]; then
        echo ""
        log_warning "PRODUCTION DEPLOYMENT WARNING"
        log_warning "This will deploy to the LIVE production environment!"
        log_warning "All users will see these changes immediately."
        echo ""
    echo -e "${YELLOW}Press Ctrl+C to cancel, or Enter to continue...${NC}"
        read -r
    fi
}

build_application() {
    local env="$1"
    
    log_step "Building application for $env environment..."
    
    cd "$PROJECT_ROOT"
    
    # Clean previous build
    if [[ -d "dist" ]]; then
        rm -rf dist
        log_info "Cleaned previous build"
    fi
    
    # Create environment configuration dynamically
    local env_file=".env.${env}"
    log_info "Creating environment configuration for $env"
    
    # Set environment-specific variables
    local app_name
    local debug_mode
    case "$env" in
        "staging")
            app_name="2FAir - Staging"
            debug_mode="true"
            ;;
        "production")
            app_name="2FAir"
            debug_mode="false"
            ;;
        "development")
            app_name="2FAir - Development" 
            debug_mode="true"
            ;;
    esac
    
    # Create environment file
    cat > "$env_file" << EOF
# Frontend $env Environment Configuration
VITE_ENVIRONMENT=$env
VITE_SERVER_URL=$API_URL
VITE_APP_NAME=$app_name
VITE_ENABLE_DEBUG=$debug_mode
EOF
    
    log_info "Environment file created: $env_file"
    log_info "API URL: $API_URL"
    
    # Build with appropriate environment
    if ! yarn "build:$env"; then
        log_error "Build failed for $env environment"
        exit 1
    fi
    
    # Clean up environment file after build
    rm -f "$env_file"
    
    # Verify build output
    if [[ ! -d "dist" ]] || [[ ! -f "dist/index.html" ]]; then
        log_error "Build output validation failed"
        exit 1
    fi
    
    local build_size=$(du -sh dist | cut -f1)
    log_success "Build completed successfully (Size: $build_size)"
}

deploy_to_firebase() {
    local env="$1"
    local firebase_site="$2"
    
    log_step "Deploying to Firebase hosting ($firebase_site)..."
    
    # Set Firebase project
    firebase use "$FIREBASE_PROJECT" > /dev/null
    
    # Deploy with proper error handling
    if ! firebase deploy --only "hosting:$firebase_site"; then
        log_error "Firebase deployment failed"
        exit 1
    fi
    
    log_success "Firebase deployment completed successfully"
}

display_deployment_summary() {
    local env="$1"
    local firebase_site="$2"
    local custom_domain="$3"
    
    echo ""
    log_success "🎉 Deployment Summary"
    echo -e "${GREEN}Environment: $(echo "${env:0:1}" | tr '[:lower:]' '[:upper:]')${env:1}${NC}"
    echo -e "${GREEN}Firebase URL: https://$firebase_site.web.app${NC}"
    echo -e "${GREEN}Custom Domain: $custom_domain${NC}"
    echo ""
    
    log_info "✨ Firebase Hosting Benefits:"
    echo "  • Automatic SSL certificates"
    echo "  • Global CDN with edge caching"  
    echo "  • Instant cache invalidation"
    echo "  • SPA routing support"
    echo "  • Deploy previews and rollbacks"
echo ""
    
    if [[ "$env" == "production" ]]; then
        log_info "🚀 Production deployment complete!"
        log_info "Monitor your app: https://console.firebase.google.com/project/$FIREBASE_PROJECT/hosting"
    else
        log_info "🧪 Staging deployment complete!"
        log_info "Test your changes before promoting to production."
    fi
}

# Main execution
main() {
    local env="${1:-staging}"
    
    # Header
    echo -e "${BLUE}🚀 2FAir Frontend - Firebase Hosting Deployment${NC}"
    echo -e "${BLUE}Environment: $(echo "${env:0:1}" | tr '[:lower:]' '[:upper:]')${env:1}${NC}"
echo ""
    
    # Validation
    validate_environment "$env"
    check_prerequisites
    parse_environment_config "$env"
    
    # Deployment confirmation
    confirm_production_deployment "$env"
    
    # Start deployment timer
    local start_time=$(date +%s)
    
    # Execute deployment steps
    build_application "$env"
    deploy_to_firebase "$env" "$FIREBASE_SITE"
    
    # Calculate deployment time
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # Display summary
    display_deployment_summary "$env" "$FIREBASE_SITE" "$CUSTOM_DOMAIN"
    
    echo -e "${CYAN}⏱️  Total deployment time: ${duration}s${NC}"
    
    # Next steps for domain setup
    if [[ "$env" == "production" ]] && [[ "$CUSTOM_DOMAIN" != "https://2fair.app" ]]; then
        echo ""
        log_info "📋 Next steps for custom domain setup:"
        echo "1. Open Firebase Console: https://console.firebase.google.com/project/$FIREBASE_PROJECT/hosting/sites/$FIREBASE_SITE"
        echo "2. Add custom domain: ${CUSTOM_DOMAIN#https://}"
        echo "3. Update DNS in Porkbun with Firebase's A records"
    fi
}

# Script entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi

