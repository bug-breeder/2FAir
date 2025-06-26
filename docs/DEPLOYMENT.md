# 2FAir Deployment Guide

**Status**: 🚧 **Phase 3 Complete - PRF Implementation** (Not Yet Production Ready)  
**Last Update**: January 2025  
**Production Readiness**: Phase 4 (Multi-Device & Security Hardening) Required

> ⚠️ **Important**: This guide is for development and staging deployments. Production deployment should wait for Phase 4 completion, which includes comprehensive security audit, performance optimization, and production hardening.

## Current Implementation Status

### ✅ Ready for Development/Staging
- **Enhanced WebAuthn PRF**: Key derivation with fallback compatibility
- **Zero-Knowledge Architecture**: Client-side TOTP generation and encryption
- **OAuth Authentication**: Google login integration
- **Database Schema**: Complete E2E encryption ready schema
- **Docker Support**: Development and staging containers ready

### 🔄 Needed Before Production
- **Security Audit**: Comprehensive penetration testing and code review
- **Performance Testing**: Load testing and optimization
- **Multi-Device Sync**: Cross-device encrypted synchronization
- **Production Hardening**: Monitoring, logging, backup strategies
- **User Documentation**: Complete onboarding and user guides

This deployment guide covers **development and staging environments**. Production deployment recommendations will be added after Phase 4 completion.

## Overview

This guide covers deploying 2FAir, an end-to-end encrypted TOTP vault, to production environments. 2FAir consists of a Go backend and React frontend with PostgreSQL database.

## Architecture Components

- **Frontend**: React + TypeScript + Vite (Static files)
- **Backend**: Go + Gin framework (API server)  
- **Database**: PostgreSQL 14+
- **Authentication**: OAuth 2.0 + WebAuthn
- **Storage**: Encrypted TOTP secrets

## Quick Start with Docker

### 1. Clone and Setup

```bash
git clone <repository-url>
cd 2FAir
```

### 2. Environment Configuration

Create production environment files:

**Backend (`server/.env.production`):**
```bash
# Server Configuration
SERVER_HOST=0.0.0.0
SERVER_PORT=8080
ENVIRONMENT=production
GIN_MODE=release

# Database Configuration  
DB_HOST=postgres
DB_PORT=5432
DB_NAME=twoFAir_prod
DB_USER=postgres
DB_PASSWORD=your-secure-password
DB_SSL_MODE=require

# JWT Configuration
JWT_SIGNING_KEY=your-super-secure-jwt-signing-key-256-bits
JWT_EXPIRATION_TIME=24h

# WebAuthn Configuration
WEBAUTHN_RP_DISPLAY_NAME=2FAir - E2E Encrypted TOTP Vault
WEBAUTHN_RP_ID=yourdomain.com
WEBAUTHN_RP_ORIGINS=https://yourdomain.com
WEBAUTHN_TIMEOUT=60s

# OAuth Configuration - Google
OAUTH_GOOGLE_ENABLED=true
OAUTH_GOOGLE_CLIENT_ID=your-google-client-id
OAUTH_GOOGLE_CLIENT_SECRET=your-google-client-secret
OAUTH_GOOGLE_CALLBACK_URL=https://yourdomain.com/v1/auth/google/callback

# OAuth Configuration - GitHub
OAUTH_GITHUB_ENABLED=true
OAUTH_GITHUB_CLIENT_ID=your-github-client-id
OAUTH_GITHUB_CLIENT_SECRET=your-github-client-secret
OAUTH_GITHUB_CALLBACK_URL=https://yourdomain.com/v1/auth/github/callback
```

**Frontend (`client/.env.production`):**
```bash
VITE_SERVER_URL=https://api.yourdomain.com
```

### 3. Docker Compose Deployment

**`docker-compose.prod.yml`:**
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    container_name: 2fair-postgres
    environment:
      POSTGRES_DB: twoFAir_prod
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: your-secure-password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./server/init.sql:/docker-entrypoint-initdb.d/
    ports:
      - "5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 30s
      timeout: 10s
      retries: 3

  backend:
    build:
      context: ./server
      dockerfile: Dockerfile
    container_name: 2fair-backend
    environment:
      - DB_HOST=postgres
    env_file:
      - ./server/.env.production
    ports:
      - "8080:8080"
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./client
      dockerfile: Dockerfile
      args:
        VITE_SERVER_URL: https://api.yourdomain.com
    container_name: 2fair-frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: 2fair-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
```

### 4. Nginx Configuration

**`nginx.conf`:**
```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:8080;
    }

    upstream frontend {
        server frontend:80;
    }

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS Frontend
    server {
        listen 443 ssl http2;
        server_name yourdomain.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        
        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options DENY always;
        add_header X-Content-Type-Options nosniff always;
        add_header Referrer-Policy strict-origin-when-cross-origin always;
        add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.yourdomain.com" always;

        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }

    # HTTPS API Backend
    server {
        listen 443 ssl http2;
        server_name api.yourdomain.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options DENY always;
        add_header X-Content-Type-Options nosniff always;

        location / {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # CORS headers for WebAuthn
            add_header Access-Control-Allow-Origin "https://yourdomain.com" always;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
            add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
            add_header Access-Control-Allow-Credentials true always;

            if ($request_method = 'OPTIONS') {
                return 204;
            }
        }
    }
}
```

### 5. Deploy

```bash
# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Check service health
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

## Production Considerations

### Security

#### Environment Variables
- **Generate secure JWT signing keys** (256-bit)
- **Use strong database passwords**
- **Configure OAuth apps** with production URLs
- **Set WebAuthn origins** to match production domains

#### SSL/TLS
```bash
# Using Let's Encrypt
certbot certonly --webroot -w /var/www/html -d yourdomain.com -d api.yourdomain.com

# Copy certificates to nginx volume
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./ssl/
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./ssl/
```

#### OAuth Setup

**Google OAuth:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `https://yourdomain.com/v1/auth/google/callback`

**GitHub OAuth:**
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create new OAuth App
3. Set Authorization callback URL: `https://yourdomain.com/v1/auth/github/callback`

### Database

#### Backup Strategy
```bash
# Daily backups
docker exec 2fair-postgres pg_dump -U postgres twoFAir_prod > backup_$(date +%Y%m%d).sql

# Backup script (run via cron)
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
docker exec 2fair-postgres pg_dump -U postgres twoFAir_prod | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
```

#### Performance Tuning
```sql
-- Add indexes for better performance
CREATE INDEX CONCURRENTLY idx_otps_user_id ON otps(user_id) WHERE active = true;
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_webauthn_credentials_user_id ON webauthn_credentials(user_id);
```

### Monitoring

#### Health Checks
```bash
# Backend health
curl https://api.yourdomain.com/health

# Database health  
docker exec 2fair-postgres pg_isready -U postgres

# Frontend health
curl https://yourdomain.com
```

#### Logging
```yaml
# Add to docker-compose.prod.yml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

#### Metrics (Optional)
- **Prometheus** for metrics collection
- **Grafana** for visualization
- **Alertmanager** for notifications

### Scaling

#### Horizontal Scaling
```yaml
# Scale backend replicas
services:
  backend:
    deploy:
      replicas: 3
    
  # Load balancer configuration
  nginx:
    volumes:
      - ./nginx-loadbalanced.conf:/etc/nginx/nginx.conf
```

#### Database Optimization
- **Connection pooling** (built into Go app)
- **Read replicas** for better performance
- **Connection limits** and timeouts

## Deployment Platforms

### AWS
- **ECS/Fargate** for containers
- **RDS** for PostgreSQL
- **ALB** for load balancing
- **Route 53** for DNS
- **ACM** for SSL certificates

### Google Cloud
- **Cloud Run** for containers
- **Cloud SQL** for PostgreSQL  
- **Cloud Load Balancer**
- **Cloud DNS**

### Azure
- **Container Instances**
- **Azure Database for PostgreSQL**
- **Application Gateway**
- **DNS Zone**

### Self-Hosted
- **VPS** with Docker Compose
- **Kubernetes** cluster
- **Dedicated servers**

## Environment Migration

### Development → Staging → Production

1. **Test OAuth flows** in each environment
2. **Verify WebAuthn** with real devices
3. **Test encryption/decryption** end-to-end
4. **Load test** API endpoints
5. **Backup and restore** procedures

### Database Migrations
```bash
# Run migrations on production
docker exec 2fair-backend ./cmd/migrate

# Rollback if needed
docker exec 2fair-backend ./cmd/migrate --down
```

## Troubleshooting

### Common Issues

#### WebAuthn Not Working
- Check **WEBAUTHN_RP_ORIGINS** matches exact domain
- Verify **HTTPS** is working
- Ensure **CORS** headers are correct

#### OAuth Redirects Failing
- Check OAuth app **callback URLs**
- Verify **client IDs** and **secrets**
- Check **CORS** configuration

#### Database Connection Issues
- Verify **database credentials**
- Check **network connectivity**
- Review **SSL/TLS** configuration

### Debug Commands
```bash
# Check container logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres

# Connect to database
docker exec -it 2fair-postgres psql -U postgres -d twoFAir_prod

# Check backend health
docker exec 2fair-backend curl http://localhost:8080/health
```

## Security Checklist

- [ ] **Strong JWT signing keys** (256-bit)
- [ ] **Database credentials** secured
- [ ] **OAuth secrets** properly configured
- [ ] **HTTPS** enforced everywhere
- [ ] **Security headers** implemented
- [ ] **CORS** properly configured
- [ ] **WebAuthn origins** restricted
- [ ] **Database backups** automated
- [ ] **Log monitoring** enabled
- [ ] **Health checks** configured

## Maintenance

### Regular Tasks
- **Update dependencies** monthly
- **Review logs** for errors
- **Monitor disk usage**
- **Test backups** regularly
- **Security updates** promptly

### Performance Monitoring
- **Response times** < 100ms
- **Database connections** < 80% of limit
- **Memory usage** < 80%
- **Disk space** > 20% free 