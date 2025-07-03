# 2FAir Deployment Troubleshooting Guide

## 🚨 Common Google Cloud Deployment Issues

### 1. Service Account Name Validation Error

**Error:**
```
ERROR: (gcloud.iam.service-accounts.create) INVALID_ARGUMENT: 2fair-staging-sa does not match [a-zA-Z][a-zA-Z\d\-]*[a-zA-Z\d].
```

**Cause:** Service account names must start with a letter, not a number.

**Solution:**
```bash
# ❌ Wrong (starts with number)
gcloud iam service-accounts create 2fair-staging-sa

# ✅ Correct (starts with letter)
gcloud iam service-accounts create twofair-staging-sa
```

**Service Account Naming Rules:**
- Must start with a letter (a-z, A-Z)
- Can contain letters, numbers, and hyphens
- Must end with a letter or number
- Length: 6-30 characters

### 2. IAM Permission Denied

**Error:**
```
ERROR: (gcloud.projects.add-iam-policy-binding) [user@gmail.com] does not have permission to access projects instance [project-id:getIamPolicy]
```

**Cause:** Your account lacks the necessary IAM permissions.

**Solution:**
```bash
# Check your current permissions
gcloud projects get-iam-policy $GOOGLE_CLOUD_PROJECT \
    --filter="bindings.members:user:YOUR-EMAIL" \
    --format="table(bindings.role)"

# You need these roles:
# - roles/owner OR roles/editor
# - roles/iam.serviceAccountAdmin
# - roles/iam.securityAdmin
```

**To fix:**
1. **Option A**: Ask project owner to grant you the required roles
2. **Option B**: Use a different project where you have owner permissions
3. **Option C**: Create a new project

### 3. Project ID Issues

**Error:**
```
ERROR: (gcloud.projects.add-iam-policy-binding) [user@gmail.com] does not have permission to access projects instance [2fair:getIamPolicy]
```

**Cause:** Project ID is incorrect or doesn't exist.

**Solution:**
```bash
# Check current project
gcloud config get-value project

# List all your projects
gcloud projects list

# Set correct project
export GOOGLE_CLOUD_PROJECT="your-actual-project-id"
gcloud config set project $GOOGLE_CLOUD_PROJECT
```

**Create New Project (if needed):**
```bash
# Create new project
export GOOGLE_CLOUD_PROJECT="twofair-app-2025"
gcloud projects create $GOOGLE_CLOUD_PROJECT --name="2FAir Application"

# Set as active project
gcloud config set project $GOOGLE_CLOUD_PROJECT

# Enable billing (required for Cloud Run)
echo "Enable billing at: https://console.cloud.google.com/billing/projects"
```

### 4. Billing Account Required

**Error:**
```
ERROR: (gcloud.run.deploy) Cloud Run requires a billing account
```

**Solution:**
1. Go to [Google Cloud Console Billing](https://console.cloud.google.com/billing/projects)
2. Link your project to a billing account
3. Enable the billing account for your project

### 5. API Not Enabled

**Error:**
```
ERROR: (gcloud.run.deploy) The Cloud Run API is not enabled for project [project-id]
```

**Solution:**
```bash
# Enable required APIs
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    containerregistry.googleapis.com \
    secretmanager.googleapis.com
```

## 🔧 Step-by-Step Resolution

### For Service Account Issues:

1. **Check Current Configuration:**
   ```bash
   gcloud config list
   gcloud auth list
   ```

2. **Verify Project Access:**
   ```bash
   gcloud projects describe $GOOGLE_CLOUD_PROJECT
   ```

3. **Create Service Accounts with Correct Names:**
   ```bash
   # Use corrected service account names
   gcloud iam service-accounts create twofair-staging-sa \
       --description="2FAir Staging Service Account" \
       --display-name="2FAir Staging"
   
   gcloud iam service-accounts create twofair-production-sa \
       --description="2FAir Production Service Account" \
       --display-name="2FAir Production"
   ```

4. **Grant Permissions:**
   ```bash
   gcloud projects add-iam-policy-binding $GOOGLE_CLOUD_PROJECT \
       --member="serviceAccount:twofair-staging-sa@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com" \
       --role="roles/secretmanager.secretAccessor"
   
   gcloud projects add-iam-policy-binding $GOOGLE_CLOUD_PROJECT \
       --member="serviceAccount:twofair-production-sa@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com" \
       --role="roles/secretmanager.secretAccessor"
   ```

### For Project Setup Issues:

1. **Create New Project (if needed):**
   ```bash
   export GOOGLE_CLOUD_PROJECT="twofair-app-$(date +%Y%m%d)"
   gcloud projects create $GOOGLE_CLOUD_PROJECT --name="2FAir Application"
   gcloud config set project $GOOGLE_CLOUD_PROJECT
   ```

2. **Enable Billing:**
   - Visit [Google Cloud Console](https://console.cloud.google.com/billing/projects)
   - Select your project
   - Link to a billing account

3. **Enable Required APIs:**
   ```bash
   gcloud services enable \
       cloudbuild.googleapis.com \
       run.googleapis.com \
       containerregistry.googleapis.com \
       secretmanager.googleapis.com
   ```

## 🔍 Verification Commands

### Check Service Accounts:
```bash
# List service accounts
gcloud iam service-accounts list

# Check specific service account
gcloud iam service-accounts describe twofair-staging-sa@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com
```

### Check Project Status:
```bash
# Project info
gcloud projects describe $GOOGLE_CLOUD_PROJECT

# Enabled services
gcloud services list --enabled

# Billing status
gcloud billing accounts list
```

### Check Permissions:
```bash
# Your permissions
gcloud projects get-iam-policy $GOOGLE_CLOUD_PROJECT \
    --filter="bindings.members:user:$(gcloud config get-value account)" \
    --format="table(bindings.role)"
```

## 📞 Additional Help

### Google Cloud Support:
- [Google Cloud Console](https://console.cloud.google.com)
- [Google Cloud Documentation](https://cloud.google.com/docs)
- [Cloud Run Documentation](https://cloud.google.com/run/docs)

### Project-Specific Help:
- Check [2FAir Documentation](./DEPLOYMENT_OVERVIEW.md)
- Review [Backend Deployment Guide](./BACKEND_DEPLOYMENT.md)
- Follow [Quick Start Guide](./QUICK_START_DEPLOYMENT.md)

### Common Command Reference:
```bash
# Reset gcloud configuration
gcloud config configurations create 2fair-deployment
gcloud config set project YOUR-PROJECT-ID
gcloud auth login

# Check everything is working
gcloud projects describe $GOOGLE_CLOUD_PROJECT
gcloud iam service-accounts list
gcloud secrets list
```

---

**💡 Pro Tip:** Always test commands in a development environment first before running them in production! 