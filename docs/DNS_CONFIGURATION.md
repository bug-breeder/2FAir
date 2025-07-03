# DNS Configuration Guide - Porkbun Setup for 2fair.app

**Complete DNS setup for 2fair.app domain with staging and production environments**

## 🎯 Overview

This guide covers DNS configuration for your `2fair.app` domain purchased from Porkbun, supporting:
- **Production**: `2fair.app` (frontend) and `api.2fair.app` (backend)
- **Staging**: `staging.2fair.app` (frontend) and `api-staging.2fair.app` (backend)
- **SSL/TLS**: Automatic certificates via Firebase Hosting and Google Cloud Run
- **CDN**: Global content delivery optimization

## 🌐 Domain Architecture

```
2fair.app                    → Frontend (Production)
├── www.2fair.app           → Redirect to 2fair.app  
├── api.2fair.app           → Backend API (Production)
├── staging.2fair.app       → Frontend (Staging)
└── api-staging.2fair.app   → Backend API (Staging)
```

## 📋 Prerequisites

### Domain Access
- **Domain**: `2fair.app` purchased from Porkbun
- **Porkbun Account**: Access to DNS management
- **Verification**: Domain ownership verified with cloud providers

### Deployment Status
- **Backend**: Deployed to Google Cloud Run
- **Frontend**: Deployed to Firebase Hosting or Google Cloud Storage
- **SSL Certificates**: Provisioned through cloud providers

## 🔧 DNS Records Configuration

### 1. Production Environment

#### Frontend (Firebase Hosting)
```
Type: A
Name: @
Content: 151.101.1.195
TTL: 300
Proxy Status: DNS Only

Type: A  
Name: @
Content: 151.101.65.195
TTL: 300
Proxy Status: DNS Only

Type: AAAA
Name: @
Content: 2a04:4e42::645
TTL: 300
Proxy Status: DNS Only

Type: AAAA
Name: @  
Content: 2a04:4e42:200::645
TTL: 300
Proxy Status: DNS Only
```

#### WWW Redirect
```
Type: CNAME
Name: www
Content: 2fair.app
TTL: 300
```

#### Backend API (Google Cloud Run)
```
Type: CNAME
Name: api
Content: ghs.googlehosted.com
TTL: 300
```

### 2. Staging Environment

#### Frontend (Firebase Hosting)
```
Type: A
Name: staging
Content: 151.101.1.195
TTL: 300
Proxy Status: DNS Only

Type: A
Name: staging  
Content: 151.101.65.195
TTL: 300
Proxy Status: DNS Only
```

#### Backend API (Google Cloud Run)
```
Type: CNAME
Name: api-staging
Content: ghs.googlehosted.com
TTL: 300
```

### 3. Alternative: Google Cloud Storage + Load Balancer

If using Google Cloud Storage instead of Firebase Hosting:

#### Replace Frontend Records
```
Type: A
Name: @
Content: [Your Load Balancer IP]
TTL: 300

Type: A
Name: staging
Content: [Your Staging Load Balancer IP]  
TTL: 300
```

## 🛠️ Step-by-Step Setup Process

### Step 1: Access Porkbun DNS Management

1. **Login to Porkbun** → Domain Management
2. **Select** `2fair.app` domain
3. **Navigate to** DNS Records section
4. **Clear existing records** (if any) that conflict

### Step 2: Add Production Records

#### Add Root Domain (Frontend)
```bash
# Record 1
Type: A
Name: @ (or leave blank)
Content: 151.101.1.195
TTL: 300

# Record 2  
Type: A
Name: @ (or leave blank)
Content: 151.101.65.195
TTL: 300
```

#### Add API Subdomain (Backend)
```bash
Type: CNAME
Name: api
Content: ghs.googlehosted.com
TTL: 300
```

#### Add WWW Redirect
```bash
Type: CNAME
Name: www
Content: 2fair.app
TTL: 300
```

### Step 3: Add Staging Records

#### Add Staging Frontend
```bash
Type: A
Name: staging
Content: 151.101.1.195
TTL: 300
```

#### Add Staging API
```bash
Type: CNAME  
Name: api-staging
Content: ghs.googlehosted.com
TTL: 300
```

### Step 4: Optional IPv6 Support

#### Add IPv6 Records (Production)
```bash
Type: AAAA
Name: @
Content: 2a04:4e42::645
TTL: 300

Type: AAAA
Name: @
Content: 2a04:4e42:200::645
TTL: 300
```

### Step 5: Verify DNS Propagation

```bash
# Check DNS propagation
dig 2fair.app
dig staging.2fair.app
dig api.2fair.app
dig api-staging.2fair.app

# Check from multiple locations
nslookup 2fair.app 8.8.8.8
nslookup staging.2fair.app 1.1.1.1
```

## 🔍 Verification & Testing

### 1. DNS Propagation Check

```bash
# Test all domains resolve correctly
dig +short 2fair.app
dig +short www.2fair.app
dig +short staging.2fair.app
dig +short api.2fair.app
dig +short api-staging.2fair.app

# Expected results:
# 2fair.app → 151.101.1.195, 151.101.65.195
# www.2fair.app → 2fair.app
# staging.2fair.app → 151.101.1.195, 151.101.65.195  
# api.2fair.app → ghs.googlehosted.com
# api-staging.2fair.app → ghs.googlehosted.com
```

### 2. HTTP/HTTPS Connectivity

```bash
# Test frontend connectivity
curl -I https://2fair.app
curl -I https://www.2fair.app
curl -I https://staging.2fair.app

# Test backend API connectivity
curl -I https://api.2fair.app/health
curl -I https://api-staging.2fair.app/health

# Expected: 200 OK responses with proper SSL
```

### 3. SSL Certificate Verification

```bash
# Check SSL certificates
openssl s_client -connect 2fair.app:443 -servername 2fair.app
openssl s_client -connect staging.2fair.app:443 -servername staging.2fair.app
openssl s_client -connect api.2fair.app:443 -servername api.2fair.app

# Verify certificate details
curl -vI https://2fair.app 2>&1 | grep -E "(SSL|TLS|certificate)"
```

### 4. Global DNS Propagation

Use online tools to verify worldwide propagation:
- **DNS Checker**: https://dnschecker.org/
- **What's My DNS**: https://www.whatsmydns.net/
- **DNS Propagation Checker**: https://www.dnsmap.io/

## 🚨 Common Issues & Solutions

### Issue 1: DNS Not Propagating

**Symptoms**: Domain doesn't resolve after 24+ hours

**Solutions**:
```bash
# Clear local DNS cache
sudo dscacheutil -flushcache  # macOS
ipconfig /flushdns             # Windows

# Check with different DNS servers
dig @8.8.8.8 2fair.app
dig @1.1.1.1 2fair.app

# Verify TTL settings (should be 300 seconds)
dig 2fair.app | grep TTL
```

### Issue 2: SSL Certificate Issues

**Symptoms**: SSL warnings or certificate errors

**Solutions**:
1. **Verify domain mapping** in Firebase Console or Google Cloud Console
2. **Check certificate status** in hosting provider dashboard
3. **Wait for provisioning** (can take up to 24 hours)
4. **Verify DNS records** are pointing correctly

```bash
# Check certificate chain
curl -vI https://2fair.app 2>&1 | grep -A 10 "SSL certificate"

# Test SSL configuration
openssl s_client -connect 2fair.app:443 -showcerts
```

### Issue 3: WWW Redirect Not Working

**Symptoms**: www.2fair.app doesn't redirect to 2fair.app

**Solutions**:
```bash
# Verify CNAME record
dig www.2fair.app

# Should return:
# www.2fair.app. 300 IN CNAME 2fair.app.

# Test redirect manually
curl -I https://www.2fair.app
# Should return: 301 or 302 redirect to https://2fair.app
```

### Issue 4: API Subdomain Issues

**Symptoms**: api.2fair.app not resolving

**Solutions**:
```bash
# Verify CNAME record
dig api.2fair.app

# Should return:
# api.2fair.app. 300 IN CNAME ghs.googlehosted.com.

# Check Cloud Run domain mapping
gcloud run domain-mappings list --region=us-central1

# Verify service is running
curl https://api.2fair.app/health
```

## 🔧 Advanced Configuration

### Custom TTL Settings

For different use cases, adjust TTL values:

```bash
# Fast updates (development/testing)
TTL: 60    # 1 minute

# Standard (recommended)  
TTL: 300   # 5 minutes

# Long caching (stable production)
TTL: 3600  # 1 hour
```

### Additional Subdomains

For future expansion:

```bash
# Admin panel
Type: CNAME
Name: admin
Content: ghs.googlehosted.com
TTL: 300

# Documentation
Type: CNAME  
Name: docs
Content: ghs.googlehosted.com
TTL: 300

# Status page
Type: CNAME
Name: status
Content: statuspage.io
TTL: 300
```

### Security Records

#### CAA Records (Certificate Authority Authorization)
```bash
Type: CAA
Name: @
Content: 0 issue "letsencrypt.org"
TTL: 300

Type: CAA
Name: @
Content: 0 issue "google.com"
TTL: 300
```

#### DMARC Record (Email Security)
```bash
Type: TXT
Name: _dmarc
Content: v=DMARC1; p=reject; rua=mailto:dmarc@2fair.app
TTL: 300
```

## 📊 Monitoring & Maintenance

### DNS Health Monitoring

Setup monitoring for:
- **DNS resolution time**
- **SSL certificate expiry**
- **Domain availability**
- **Propagation status**

### Automated Checks

```bash
#!/bin/bash
# dns-health-check.sh

domains=(
    "2fair.app"
    "www.2fair.app"
    "staging.2fair.app"  
    "api.2fair.app"
    "api-staging.2fair.app"
)

for domain in "${domains[@]}"; do
    echo "Checking $domain..."
    
    # DNS resolution
    if dig +short $domain > /dev/null; then
        echo "✅ DNS: $domain resolves"
    else
        echo "❌ DNS: $domain failed to resolve"
    fi
    
    # HTTPS connectivity
    if curl -sSf https://$domain > /dev/null 2>&1; then
        echo "✅ HTTPS: $domain is accessible"
    else
        echo "❌ HTTPS: $domain is not accessible"
    fi
    
    echo "---"
done
```

### SSL Certificate Monitoring

```bash
# Check certificate expiry
for domain in 2fair.app staging.2fair.app api.2fair.app; do
    echo "Certificate for $domain:"
    echo | openssl s_client -connect $domain:443 -servername $domain 2>/dev/null | \
    openssl x509 -noout -dates
done
```

## 📋 DNS Configuration Checklist

### Initial Setup
- [ ] **Porkbun account** access verified
- [ ] **Domain ownership** confirmed
- [ ] **Cloud providers** ready (Firebase/Google Cloud)
- [ ] **SSL certificates** provisioning started

### Production DNS Records
- [ ] **Root domain** (A records for 2fair.app)
- [ ] **WWW redirect** (CNAME www → 2fair.app)
- [ ] **API subdomain** (CNAME api → ghs.googlehosted.com)
- [ ] **IPv6 support** (AAAA records, optional)

### Staging DNS Records  
- [ ] **Staging frontend** (A record for staging.2fair.app)
- [ ] **Staging API** (CNAME api-staging → ghs.googlehosted.com)

### Verification
- [ ] **DNS propagation** complete (24-48 hours)
- [ ] **SSL certificates** active and valid
- [ ] **HTTP redirects** to HTTPS working
- [ ] **WWW redirects** to root domain working
- [ ] **API endpoints** responding correctly
- [ ] **Global accessibility** confirmed

### Security (Optional)
- [ ] **CAA records** configured
- [ ] **DMARC records** configured  
- [ ] **Security monitoring** enabled

---

**🎉 Your DNS configuration for 2fair.app is now complete!**

All subdomains should be resolving correctly with SSL certificates automatically provisioned. Your application is ready for production traffic. 