# 🚀 Google Cloud Platform Deployment Guide with Vertex AI

## Complete Migration Guide to GCP with Vertex AI Model Garden

This guide covers the complete migration of the Crowe Logic Platform from multiple AI providers to Google Cloud Platform with Vertex AI Model Garden integration.

---

## 📋 Prerequisites

1. **Google Cloud Account** with billing enabled
2. **gcloud CLI** installed and configured
3. **Terraform** (optional, for infrastructure as code)
4. **Docker** for containerization
5. **Node.js 18+** for local development

---

## 🎯 Quick Start Deployment

### Step 1: Set Up GCP Project

```bash
# Create new project
gcloud projects create crowe-logic-platform --name="Crowe Logic Platform"

# Set as active project
gcloud config set project crowe-logic-platform

# Enable billing (replace with your billing account ID)
gcloud beta billing projects link crowe-logic-platform \
  --billing-account=BILLING_ACCOUNT_ID

# Enable required APIs
gcloud services enable \
  aiplatform.googleapis.com \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  sqladmin.googleapis.com \
  redis.googleapis.com \
  secretmanager.googleapis.com \
  compute.googleapis.com \
  container.googleapis.com
```

### Step 2: Create Service Account for Vertex AI

```bash
# Create service account
gcloud iam service-accounts create vertex-ai-sa \
  --display-name="Vertex AI Service Account"

# Grant necessary roles
gcloud projects add-iam-policy-binding crowe-logic-platform \
  --member="serviceAccount:vertex-ai-sa@crowe-logic-platform.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"

gcloud projects add-iam-policy-binding crowe-logic-platform \
  --member="serviceAccount:vertex-ai-sa@crowe-logic-platform.iam.gserviceaccount.com" \
  --role="roles/aiplatform.admin"

# Create and download key
gcloud iam service-accounts keys create vertex-ai-key.json \
  --iam-account=vertex-ai-sa@crowe-logic-platform.iam.gserviceaccount.com
```

### Step 3: Deploy Using Cloud Build

```bash
# Submit build
gcloud builds submit \
  --config=gcp-deploy/cloudbuild.yaml \
  --substitutions=_REGION=us-central1
```

---

## 🏗️ Infrastructure Setup (Terraform)

### Option A: Automated with Terraform

```bash
cd gcp-deploy/terraform

# Initialize Terraform
terraform init

# Plan deployment
terraform plan -var="project_id=crowe-logic-platform"

# Apply configuration
terraform apply -var="project_id=crowe-logic-platform" -auto-approve
```

### Option B: Manual Setup

#### 1. Create Cloud SQL Instance

```bash
gcloud sql instances create crowe-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --network=default \
  --database-flags=max_connections=100

# Create database
gcloud sql databases create crowe_platform \
  --instance=crowe-db

# Create user
gcloud sql users create crowe_admin \
  --instance=crowe-db \
  --password=SECURE_PASSWORD
```

#### 2. Create Redis Instance

```bash
gcloud redis instances create crowe-redis \
  --size=1 \
  --region=us-central1 \
  --redis-version=redis_7_0
```

#### 3. Set Up Secrets

```bash
# JWT Secret
echo -n "$(openssl rand -base64 64)" | \
  gcloud secrets create jwt-secret --data-file=-

# NextAuth Secret
echo -n "$(openssl rand -base64 64)" | \
  gcloud secrets create nextauth-secret --data-file=-

# Vertex AI Credentials
gcloud secrets create vertex-ai-credentials \
  --data-file=vertex-ai-key.json
```

---

## 🤖 Vertex AI Model Garden Configuration

### Available Models

The platform now supports these models from Vertex AI Model Garden:

1. **Gemini Models**
   - `gemini-1.5-pro-002` - Most capable, 2M token context
   - `gemini-1.5-flash-002` - Fast and efficient, 1M token context
   - `gemini-2.0-pro-exp` - Latest experimental features

2. **Partner Models**
   - `claude-3-5-sonnet@20241022` - Anthropic Claude via Model Garden
   - `llama-3.2-90b-vision-instruct` - Meta Llama with vision
   - `mistral-large@latest` - Mistral AI large model

3. **Specialized Models**
   - `codechat-bison@002` - Optimized for code generation
   - `code-gecko@latest` - Lightweight code completion

### Configuring Model Access

```bash
# Enable Model Garden models
gcloud ai models list --region=us-central1

# Deploy a model endpoint (example with Llama)
gcloud ai endpoints deploy-model ENDPOINT_ID \
  --model=llama-3.2-90b-vision-instruct \
  --display-name="Llama 3.2 Vision" \
  --machine-type=n1-highmem-2 \
  --accelerator=type=nvidia-tesla-t4,count=1
```

---

## 🚀 Deploy to Cloud Run

### Build and Deploy

```bash
# Build container
docker build -t gcr.io/crowe-logic-platform/app:latest .

# Push to Container Registry
docker push gcr.io/crowe-logic-platform/app:latest

# Deploy to Cloud Run
gcloud run deploy crowe-logic-platform \
  --image gcr.io/crowe-logic-platform/app:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --add-cloudsql-instances crowe-logic-platform:us-central1:crowe-db \
  --set-env-vars NODE_ENV=production \
  --set-env-vars GCP_PROJECT_ID=crowe-logic-platform \
  --set-env-vars GCP_LOCATION=us-central1 \
  --set-secrets JWT_SECRET=jwt-secret:latest \
  --set-secrets NEXTAUTH_SECRET=nextauth-secret:latest \
  --set-secrets GOOGLE_APPLICATION_CREDENTIALS=vertex-ai-credentials:latest \
  --memory 2Gi \
  --cpu 2 \
  --min-instances 1 \
  --max-instances 100
```

---

## 🔧 Environment Variables

Update your `.env.production`:

```env
# GCP Configuration
GCP_PROJECT_ID=crowe-logic-platform
GCP_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=/secrets/vertex-ai-credentials.json

# Database (Cloud SQL)
DATABASE_URL=postgresql://crowe_admin:PASSWORD@/crowe_platform?host=/cloudsql/PROJECT:REGION:INSTANCE

# Redis (Memorystore)
REDIS_URL=redis://REDIS_IP:6379

# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://crowe-logic-platform-abc123-uc.a.run.app

# Remove old AI provider keys (no longer needed)
# ANTHROPIC_API_KEY=REMOVED
# OPENAI_API_KEY=REMOVED
# XAI_API_KEY=REMOVED
```

---

## 📊 Migration Steps from Current Providers

### 1. Update AI Provider Code

The platform has been updated with:
- ✅ New `vertex-ai-provider.ts` module
- ✅ Updated API routes at `/api/vertex-ai`
- ✅ Support for all Model Garden models
- ✅ Streaming responses
- ✅ Code-specific models

### 2. Update Frontend Components

```typescript
// Update AIChat.tsx to use new endpoint
const response = await fetch('/api/vertex-ai', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages,
    model: selectedModel, // Optional: specify model
    stream: true,        // Optional: enable streaming
  }),
});
```

### 3. Migrate Voice Services

```bash
# Enable Speech-to-Text and Text-to-Speech APIs
gcloud services enable \
  speech.googleapis.com \
  texttospeech.googleapis.com

# Update voice routes to use Google Cloud Speech
```

---

## 🎛️ Model Selection in Application

Users can now select models dynamically:

```typescript
// Get available models
const response = await fetch('/api/vertex-ai?action=models');
const { models } = await response.json();

// Switch model
const response = await fetch('/api/vertex-ai', {
  method: 'POST',
  body: JSON.stringify({
    model: 'gemini-1.5-pro-002',
    messages: [...]
  })
});
```

---

## 📈 Monitoring and Logging

### Set Up Cloud Monitoring

```bash
# Create uptime check
gcloud monitoring uptime-checks create https \
  crowe-platform-health \
  --display-name="Crowe Platform Health Check" \
  --uri=https://your-app.run.app/api/health

# Create alert policy
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="High Error Rate" \
  --condition-display-name="Error rate > 1%" \
  --condition-expression="resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_count\""
```

### View Logs

```bash
# Cloud Run logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=crowe-logic-platform" \
  --limit 50 \
  --format json

# Vertex AI logs
gcloud logging read "resource.type=aiplatform.googleapis.com/Endpoint" \
  --limit 50
```

---

## 🔒 Security Best Practices

1. **Enable VPC Service Controls**
```bash
gcloud access-context-manager perimeters create crowe_perimeter \
  --resources=projects/PROJECT_NUMBER \
  --restricted-services=aiplatform.googleapis.com
```

2. **Use Workload Identity**
```bash
gcloud iam service-accounts create workload-identity-sa

kubectl annotate serviceaccount default \
  iam.gke.io/gcp-service-account=workload-identity-sa@PROJECT.iam.gserviceaccount.com
```

3. **Enable Binary Authorization**
```bash
gcloud container binauthz policy import policy.yaml
```

---

## 💰 Cost Optimization

### Vertex AI Pricing
- **Gemini 1.5 Pro**: $0.00125 per 1K input tokens, $0.005 per 1K output tokens
- **Gemini 1.5 Flash**: $0.00005 per 1K input tokens, $0.00015 per 1K output tokens
- **Model Garden Custom Models**: Based on compute resources

### Recommendations
1. Use Gemini Flash for high-volume, simple tasks
2. Reserve Gemini Pro for complex reasoning
3. Implement caching for repeated queries
4. Use batch prediction for large workloads

---

## 🧪 Testing the Deployment

### 1. Test Vertex AI Integration

```bash
curl -X POST https://your-app.run.app/api/vertex-ai \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Hello, Vertex AI!"}]
  }'
```

### 2. Test Model Selection

```bash
curl https://your-app.run.app/api/vertex-ai?action=models
```

### 3. Health Check

```bash
curl https://your-app.run.app/api/vertex-ai?action=health
```

---

## 🔄 Rollback Plan

If issues occur:

```bash
# Rollback Cloud Run to previous revision
gcloud run services update-traffic crowe-logic-platform \
  --to-revisions=PREVIOUS_REVISION=100

# Restore database from backup
gcloud sql backups restore BACKUP_ID \
  --restore-instance=crowe-db
```

---

## 📞 Support

- **GCP Support**: https://cloud.google.com/support
- **Vertex AI Docs**: https://cloud.google.com/vertex-ai/docs
- **Model Garden**: https://cloud.google.com/model-garden

---

## ✅ Post-Deployment Checklist

- [ ] All APIs enabled in GCP Console
- [ ] Service accounts created with proper permissions
- [ ] Vertex AI models accessible
- [ ] Database migrated and accessible
- [ ] Redis cache connected
- [ ] Secrets properly configured
- [ ] Cloud Run service deployed and accessible
- [ ] Custom domain configured (optional)
- [ ] Monitoring and alerts set up
- [ ] Backup strategy in place
- [ ] Cost alerts configured

---

## 🎉 Deployment Complete!

Your Crowe Logic Platform is now running on Google Cloud Platform with Vertex AI Model Garden integration. All AI operations are now powered by Google's state-of-the-art models.

**Access your application at:**
- Cloud Run URL: `https://crowe-logic-platform-[HASH]-uc.a.run.app`
- Custom Domain: Configure in Cloud Run settings
