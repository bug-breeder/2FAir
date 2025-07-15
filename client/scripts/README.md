# 2FAir Frontend Scripts

This directory contains automated scripts for building, deploying, and managing the 2FAir frontend application.

## 📋 Available Scripts

### 🚀 Deployment Scripts

#### `deploy-firebase.sh`
**Primary deployment script** for Firebase hosting with comprehensive error handling and logging.

```bash
# Deploy to staging (default)
./scripts/deploy-firebase.sh staging

# Deploy to production (with confirmation prompt)
./scripts/deploy-firebase.sh production
```

**Features:**
- ✅ Environment validation and prerequisites checking
- ✅ Automated build process with validation
- ✅ Firebase project management
- ✅ Deployment timing and comprehensive logging
- ✅ Production deployment confirmation
- ✅ Build size reporting and deployment summary

**Prerequisites:**
- Firebase CLI installed and authenticated
- Yarn package manager
- Proper environment configuration

### 🔧 Environment Scripts

#### `set-env.sh`
Environment switcher that manages configuration files for different deployment targets.

```bash
# Switch to staging environment
./scripts/set-env.sh staging

# Switch to production environment
./scripts/set-env.sh production

# Switch to development environment (default)
./scripts/set-env.sh development
```

**What it does:**
- Backs up current environment files
- Copies environment-specific configuration
- Updates both `.env` and `.env.local` files
- Displays current configuration summary

## 🏗️ Build Process

The deployment process follows this workflow:

1. **Environment Validation** - Checks prerequisites and validates target environment
2. **Environment Setup** - Configures environment variables via `set-env.sh`
3. **TypeScript Compilation** - Compiles TypeScript files with strict checking
4. **Vite Build** - Creates optimized production bundle
5. **Build Validation** - Verifies build output and reports size
6. **Firebase Deployment** - Uploads to Firebase hosting with appropriate site targeting

## 🌍 Environment Configuration

### Staging Environment
- **API URL**: `https://api-staging.2fair.app`
- **Firebase Site**: `2fair-staging`
- **Custom Domain**: `https://staging.2fair.app`
- **Debug Mode**: Enabled

### Production Environment
- **API URL**: `https://api.2fair.app`
- **Firebase Site**: `2fair-production`
- **Custom Domain**: `https://2fair.app`
- **Debug Mode**: Disabled

## 📦 Package.json Integration

The scripts integrate with package.json for convenient access:

```bash
# Quick commands
yarn deploy                    # Deploy to staging
yarn deploy:prod              # Deploy to production

# Explicit commands
yarn deploy:firebase:staging   # Deploy to staging
yarn deploy:firebase:production # Deploy to production

# Build commands
yarn build:staging            # Build for staging
yarn build:production         # Build for production
```

## 🛡️ Best Practices

### Script Development
- **Use strict mode**: `set -euo pipefail`
- **Validate inputs**: Check all parameters and prerequisites
- **Comprehensive logging**: Use structured logging functions
- **Error handling**: Provide clear error messages and exit codes
- **Documentation**: Document all functions and complex logic

### Deployment Safety
- **Production confirmation**: Always require confirmation for production deploys
- **Environment validation**: Verify correct environment configuration
- **Build validation**: Ensure build output is complete and valid
- **Rollback preparation**: Keep deployment logs for troubleshooting

### Security Considerations
- **Environment isolation**: Separate staging and production configurations
- **Credential management**: Use Firebase CLI authentication
- **Build verification**: Validate build output before deployment
- **Access control**: Restrict production deployment access

## 🔍 Troubleshooting

### Common Issues

**Firebase CLI not authenticated:**
```bash
firebase login
```

**Wrong directory:**
```bash
cd client
./scripts/deploy-firebase.sh staging
```

**Build failures:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules yarn.lock
yarn install
```

**Environment issues:**
```bash
# Check current environment
cat .env

# Reset environment
./scripts/set-env.sh staging
```

### Debugging Deployment

1. **Check Prerequisites**: Ensure all tools are installed and authenticated
2. **Verify Environment**: Confirm correct environment configuration
3. **Test Build Locally**: Run build commands manually to isolate issues
4. **Check Logs**: Review deployment logs for specific error messages
5. **Validate Firebase Project**: Ensure correct Firebase project and sites exist

## 📈 Performance Optimization

### Build Optimization
- **Code Splitting**: Vite automatically splits code for optimal loading
- **Asset Optimization**: Images and assets are optimized during build
- **Tree Shaking**: Unused code is automatically removed
- **Bundle Analysis**: Build reports show bundle sizes for monitoring

### Deployment Optimization
- **Incremental Deployments**: Firebase only uploads changed files
- **CDN Caching**: Firebase CDN provides global edge caching
- **Compression**: Assets are automatically compressed for faster loading
- **SSL/TLS**: HTTPS is enforced with automatic certificate management

## 🔗 Related Documentation

- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
- [Vite Build Configuration](https://vitejs.dev/config/build-options.html)
- [Environment Variables Guide](../README.md#environment-configuration)
- [Deployment Guide](../DEPLOYMENT.md)

---

**Note**: Always test deployments in staging before promoting to production. The staging environment provides an exact replica of production for thorough testing. 