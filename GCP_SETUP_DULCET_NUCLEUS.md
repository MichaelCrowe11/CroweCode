# 🚀 GCP Deployment Guide for dulcet-nucleus-450804-a3

## Your Project-Specific Setup Guide

This guide is customized for your GCP project: **dulcet-nucleus-450804-a3**

---

## 📋 Pre-Deployment Checklist

- [ ] GCP Project ID confirmed: `dulcet-nucleus-450804-a3`
- [ ] Billing is enabled on the project
- [ ] gcloud CLI is installed and authenticated
- [ ] Docker is installed (for local builds)

---

## 🎯 Quick Start (5 Minutes)

### Option 1: One-Command Deployment

```bash
# Make the script executable
chmod +x deploy-to-dulcet-nucleus.sh

# Run the deployment
./deploy-to-dulcet-nucleus.sh
```

This script will automatically:
- ✅ Set your project as active
- ✅ Enable all required APIs
- ✅ Create service accounts
- ✅ Build and deploy your application

---

## 📝 Step-by-Step Manual Setup

### Step 1: Set Your Project

```bash
gcloud config set project dulcet-nucleus-450804-a3
```

### Step 2: Enable Required APIs

```bash
gcloud services enable \
  aiplatform.googleapis.com \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  sqladmin.googleapis.com \
  redis.googleapis.com \
  secretmanager.googleapis.com \
  speech.googleapis.com \
  texttospeech.googleapis.com
```

### Step 3: Create Service Account

```bash
# Create service account
gcloud iam service-accounts create vertex-ai-sa \
  --display-name="Vertex AI Service Account"

# Grant permissions
gcloud projects add-iam-policy-binding dulcet-nucleus-450804-a3 \
  --member="serviceAccount:vertex-ai-sa@dulcet-nucleus-450804-a3.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"

# Create key
gcloud iam service-accounts keys create vertex-ai-key.json \
  --iam-account=vertex-ai-sa@dulcet-nucleus-450804-a3.iam.gserviceaccount.com
```

### Step 4: Set Up Cloud SQL

```bash
# Create PostgreSQL instance
gcloud sql instances create crowe-db \
  --database-version=POSTGRES_15 \
  --tier=db-g1-small \
  --region=us-central1 \
  --project=dulcet-nucleus-450804-a3

# Create database
gcloud sql databases create crowe_platform --instance=crowe-db

# Set password (replace with secure password)
gcloud sql users set-password postgres \
  --instance=crowe-db \
  --password=YOUR_SECURE_PASSWORD
```

### Step 5: Set Up Redis

```bash
gcloud redis instances create crowe-redis \
  --size=1 \
  --region=us-central1 \
  --redis-version=redis_7_0 \
  --project=dulcet-nucleus-450804-a3
```

### Step 6: Create Secrets

```bash
# JWT Secret
echo -n "$(openssl rand -base64 64)" | \
  gcloud secrets create jwt-secret --data-file=-

# NextAuth Secret
echo -n "$(openssl rand -base64 64)" | \
  gcloud secrets create nextauth-secret --data-file=-

# Database Password
echo -n "YOUR_DB_PASSWORD" | \
  gcloud secrets create db-password --data-file=-

# Vertex AI Credentials
gcloud secrets create vertex-ai-credentials \
  --data-file=vertex-ai-key.json
```

### Step 7: Build and Deploy

```bash
# Build container
gcloud builds submit --tag gcr.io/dulcet-nucleus-450804-a3/crowe-logic-platform:latest

# Deploy to Cloud Run
gcloud run deploy crowe-logic-platform \
  --image=gcr.io/dulcet-nucleus-450804-a3/crowe-logic-platform:latest \
  --platform=managed \
  --region=us-central1 \
  --allow-unauthenticated \
  --add-cloudsql-instances=dulcet-nucleus-450804-a3:us-central1:crowe-db \
  --set-env-vars="GCP_PROJECT_ID=dulcet-nucleus-450804-a3" \
  --set-env-vars="GCP_LOCATION=us-central1" \
  --set-secrets="JWT_SECRET=jwt-secret:latest" \
  --set-secrets="NEXTAUTH_SECRET=nextauth-secret:latest" \
  --memory=2Gi \
  --cpu=2 \
  --min-instances=1 \
  --max-instances=100
```

---

## 🔧 Environment Variables

Create a `.env.production.local` file:

```env
GCP_PROJECT_ID=dulcet-nucleus-450804-a3
GCP_LOCATION=us-central1
DATABASE_URL=postgresql://postgres:PASSWORD@/crowe_platform?host=/cloudsql/dulcet-nucleus-450804-a3:us-central1:crowe-db
GOOGLE_APPLICATION_CREDENTIALS=vertex-ai-key.json
```

---

## 🌐 Access Your Services

Once deployed, you can access:

### Application URL
```
https://crowe-logic-platform-[HASH]-uc.a.run.app
```

### GCP Console Links
- **Project Dashboard**: https://console.cloud.google.com/home/dashboard?project=dulcet-nucleus-450804-a3
- **Cloud Run**: https://console.cloud.google.com/run?project=dulcet-nucleus-450804-a3
- **Vertex AI**: https://console.cloud.google.com/vertex-ai?project=dulcet-nucleus-450804-a3
- **Cloud SQL**: https://console.cloud.google.com/sql?project=dulcet-nucleus-450804-a3
- **Secret Manager**: https://console.cloud.google.com/security/secret-manager?project=dulcet-nucleus-450804-a3

---

## 🤖 Vertex AI Model Garden Setup

### Enable Models

1. Go to [Vertex AI Model Garden](https://console.cloud.google.com/vertex-ai/model-garden?project=dulcet-nucleus-450804-a3)

2. Enable these recommended models:
   - **Gemini 1.5 Pro** - Most capable
   - **Gemini 1.5 Flash** - Fast responses
   - **Code Bison** - Code generation
   - **Claude 3.5** (if available in Model Garden)

3. The application will automatically use these models once enabled.

---

## 📊 Monitoring

### View Logs
```bash
# Cloud Run logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=crowe-logic-platform" \
  --project=dulcet-nucleus-450804-a3 \
  --limit=50

# Vertex AI logs
gcloud logging read "resource.type=aiplatform.googleapis.com/Endpoint" \
  --project=dulcet-nucleus-450804-a3 \
  --limit=50
```

### View Metrics
```bash
# Cloud Run metrics
gcloud monitoring metrics-descriptors list \
  --filter="metric.type:run.googleapis.com" \
  --project=dulcet-nucleus-450804-a3
```

---

## 💰 Cost Optimization

### Estimated Monthly Costs
- **Cloud Run**: ~$50-100 (based on usage)
- **Cloud SQL (db-g1-small)**: ~$25
- **Redis (1GB)**: ~$35
- **Vertex AI**: Pay-per-use
  - Gemini Flash: $0.00005/1K input tokens
  - Gemini Pro: $0.00125/1K input tokens

### Cost Saving Tips
1. Use Cloud Run minimum instances = 0 for development
2. Use Cloud SQL with automatic shutdown for dev
3. Implement caching to reduce Vertex AI calls
4. Use Gemini Flash for simple queries

---

## 🔒 Security Best Practices

1. **Enable VPC Service Controls**
```bash
gcloud access-context-manager perimeters create crowe-perimeter \
  --resources=projects/450804 \
  --restricted-services=aiplatform.googleapis.com \
  --project=dulcet-nucleus-450804-a3
```

2. **Set up IAM properly**
```bash
# Remove default permissions
gcloud projects remove-iam-policy-binding dulcet-nucleus-450804-a3 \
  --member="allUsers" \
  --role="roles/run.invoker"
```

3. **Enable audit logging**
```bash
gcloud logging sinks create crowe-audit-sink \
  storage.googleapis.com/dulcet-nucleus-450804-a3-audit-logs \
  --log-filter='protoPayload.@type="type.googleapis.com/google.cloud.audit.AuditLog"' \
  --project=dulcet-nucleus-450804-a3
```

---

## 🚨 Troubleshooting

### Common Issues and Solutions

#### 1. APIs not enabled
```bash
# Re-run API enablement
gcloud services enable aiplatform.googleapis.com --project=dulcet-nucleus-450804-a3
```

#### 2. Permission denied errors
```bash
# Check your current account
gcloud auth list

# Ensure you have Owner or Editor role
gcloud projects add-iam-policy-binding dulcet-nucleus-450804-a3 \
  --member="user:YOUR_EMAIL" \
  --role="roles/editor"
```

#### 3. Cloud SQL connection issues
```bash
# Get connection name
gcloud sql instances describe crowe-db --project=dulcet-nucleus-450804-a3

# Update Cloud Run with correct connection
gcloud run services update crowe-logic-platform \
  --add-cloudsql-instances=dulcet-nucleus-450804-a3:us-central1:crowe-db \
  --region=us-central1
```

#### 4. Vertex AI not working
```bash
# Check service account permissions
gcloud projects get-iam-policy dulcet-nucleus-450804-a3 \
  --flatten="bindings[].members" \
  --filter="bindings.members:vertex-ai-sa@dulcet-nucleus-450804-a3.iam.gserviceaccount.com"
```

---

## 📞 Support & Next Steps

1. **Test your deployment**
   ```bash
   curl https://YOUR_CLOUD_RUN_URL/api/health
   ```

2. **Set up CI/CD** (optional)
   - Connect GitHub repository
   - Set up Cloud Build triggers

3. **Configure custom domain** (optional)
   - Add domain mapping in Cloud Run
   - Update DNS records

4. **Production readiness**
   - Upgrade Cloud SQL to production tier
   - Enable high availability for Redis
   - Set up backup policies

---

## ✅ Deployment Validation

Run this script to validate your deployment:

```bash
#!/bin/bash
PROJECT="dulcet-nucleus-450804-a3"

echo "Checking deployment status..."

# Check APIs
echo -n "APIs enabled: "
gcloud services list --enabled --project=$PROJECT | grep -E "(aiplatform|run|sql)" | wc -l

# Check Cloud Run
echo -n "Cloud Run service: "
gcloud run services describe crowe-logic-platform --region=us-central1 --project=$PROJECT &> /dev/null && echo "✓" || echo "✗"

# Check Cloud SQL
echo -n "Cloud SQL instance: "
gcloud sql instances describe crowe-db --project=$PROJECT &> /dev/null && echo "✓" || echo "✗"

# Check Redis
echo -n "Redis instance: "
gcloud redis instances describe crowe-redis --region=us-central1 --project=$PROJECT &> /dev/null && echo "✓" || echo "✗"

# Get service URL
URL=$(gcloud run services describe crowe-logic-platform --region=us-central1 --project=$PROJECT --format="value(status.url)" 2>/dev/null)
if [ ! -z "$URL" ]; then
  echo "Service URL: $URL"
  echo "Testing health endpoint..."
  curl -s "$URL/api/health" | head -1
fi
```

---

## 🎉 Congratulations!

Your Crowe Logic Platform is now deployed on GCP with Vertex AI integration!

**Project ID**: `dulcet-nucleus-450804-a3`
**Region**: `us-central1`
**AI Provider**: Google Vertex AI Model Garden

All AI operations are now powered by Google's state-of-the-art models.
