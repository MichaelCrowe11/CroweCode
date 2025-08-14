# 🌩️ CroweCode Cloud Storage Integration

## Overview

CroweCode supports storing and operating models from cloud storage, perfect for:
- **Production deployments** with multiple instances
- **Team sharing** of downloaded models
- **Cost optimization** (download once, use everywhere)
- **Scalable infrastructure** with auto-scaling

## Supported Cloud Providers

### 🪣 Amazon S3
```bash
pip install boto3
export AWS_ACCESS_KEY_ID="your-key"
export AWS_SECRET_ACCESS_KEY="your-secret"
```

### ☁️ Google Cloud Storage
```bash
pip install google-cloud-storage
export GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account.json"
```

### 🔷 Azure Blob Storage
```bash
pip install azure-storage-blob
export AZURE_STORAGE_CONNECTION_STRING="your-connection-string"
```

## Quick Setup

### 1. Configure Cloud Storage
```bash
# Amazon S3
python crowecode/cloud_models.py setup --provider s3 --bucket my-crowecode-models --region us-west-2

# Google Cloud Storage
python crowecode/cloud_models.py setup --provider gcs --bucket my-crowecode-models

# Azure Blob Storage
python crowecode/cloud_models.py setup --provider azure --bucket my-crowecode-models --account myaccount
```

### 2. Set Environment Variable
```bash
# The setup command will output something like:
export CROWECODE_CLOUD_CONFIG_B64='eyJlbmFibGVkIjp0cnVlLCJwcm92aWRlciI6InMzIiwiY29uZmlnIjp7ImJ1Y2tldCI6Im15LWNyb3dlY29kZS1tb2RlbHMiLCJyZWdpb24iOiJ1cy13ZXN0LTIiLCJwcmVmaXgiOiJjcm93ZWNvZGUtbW9kZWxzLyJ9fQ=='
```

### 3. Upload Models to Cloud
```bash
# Download models locally first (if not already done)
python crowecode/download_models.py --dev

# Upload to cloud storage
python crowecode/cloud_models.py upload Alpha Beta
```

### 4. Use Models from Cloud
```bash
# On any instance with cloud access
python crowecode/cloud_models.py download Alpha Beta

# Or let CroweCode auto-download from cloud
python -c "from crowecode.models import CroweCodeAlpha; alpha = CroweCodeAlpha(); print(alpha.generate('Hello'))"
```

## Architecture Benefits

### 📊 Storage Efficiency
```
Traditional: Each instance downloads models
Instance 1: 75GB (Alpha + Beta)
Instance 2: 75GB (Alpha + Beta)  
Instance 3: 75GB (Alpha + Beta)
Total: 225GB

With Cloud Storage: Download once, share everywhere
Cloud Storage: 75GB (Alpha + Beta)
Instance 1: 0GB (streams from cloud)
Instance 2: 0GB (streams from cloud)
Instance 3: 0GB (streams from cloud)
Total: 75GB
```

### 🚀 Deployment Workflow
```
1. Download models to staging server
2. Upload models to cloud storage
3. Deploy application instances
4. Instances auto-download from cloud as needed
5. Local caching for performance
```

## Usage Examples

### Cloud Storage Management
```bash
# Check cloud storage status
python crowecode/cloud_models.py status

# List models in cloud
python crowecode/cloud_models.py list

# Download specific models from cloud
python crowecode/cloud_models.py download Alpha Gamma

# Upload models to cloud
python crowecode/cloud_models.py upload Beta Theta
```

### Programmatic Access
```python
from crowecode.cloud_storage import get_cloud_manager

# Get cloud manager (if configured)
cloud_manager = get_cloud_manager()

if cloud_manager:
    # Download model from cloud
    local_path = cloud_manager.download_model_from_cloud("Alpha")
    
    # Upload model to cloud
    cloud_manager.upload_model_to_cloud("Alpha", "/path/to/local/model")
    
    # List cloud models
    models = cloud_manager.list_cloud_models()
    print(f"Cloud models: {models}")
```

### Automatic Integration
```python
# CroweCode automatically uses cloud storage when configured
from crowecode.models import CroweCodeAlpha

# This will:
# 1. Check local cache
# 2. Check cloud storage
# 3. Download from cloud if available
# 4. Fall back to Kaggle download if needed
alpha = CroweCodeAlpha()
result = alpha.generate("Write a function")
```

## Production Deployment

### Docker with Cloud Storage
```dockerfile
FROM python:3.11-slim

# Install cloud dependencies
RUN pip install boto3 google-cloud-storage azure-storage-blob

# Copy CroweCode
COPY crowecode/ /app/crowecode/

# Set cloud configuration
ENV CROWECODE_CLOUD_CONFIG_B64="your-config-here"
ENV CROWECODE_BACKEND="qwen"

# Models will be downloaded from cloud on first use
CMD ["uvicorn", "crowecode.api:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: crowecode-api
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: crowecode
        image: crowecode:latest
        env:
        - name: CROWECODE_CLOUD_CONFIG_B64
          valueFrom:
            secretKeyRef:
              name: crowecode-config
              key: cloud-config
        - name: AWS_ACCESS_KEY_ID
          valueFrom:
            secretKeyRef:
              name: aws-credentials
              key: access-key-id
        - name: AWS_SECRET_ACCESS_KEY
          valueFrom:
            secretKeyRef:
              name: aws-credentials  
              key: secret-access-key
```

### Auto-Scaling Benefits
```
Scenario: Traffic spike requires 10 new instances

Without Cloud Storage:
- Each instance: 15-20 minutes to download models
- Total download: 750GB (75GB × 10 instances)
- Cold start: Very slow

With Cloud Storage:
- Each instance: 2-3 minutes to download from cloud
- Total download: 75GB (shared from cloud)
- Cold start: Fast
- Cached locally after first download
```

## Cost Optimization

### Storage Costs (Example: AWS S3)
```
CroweCode Model Storage:
- Alpha (7B): ~15GB × $0.023/GB/month = $0.35/month
- Beta (30B): ~60GB × $0.023/GB/month = $1.38/month
- All models: ~2TB × $0.023/GB/month = $47/month

Transfer Costs:
- Download to instances: $0.09/GB (first 10TB/month)
- Internal transfers: Free within same region
```

### Network Optimization
```bash
# Use same region for cloud storage and compute
python crowecode/cloud_models.py setup --provider s3 --bucket models --region us-west-2

# Configure regional endpoints
export AWS_DEFAULT_REGION=us-west-2
```

## Security Considerations

### Access Control
```bash
# S3 Bucket Policy (read-only for instances)
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {"AWS": "arn:aws:iam::account:role/crowecode-role"},
      "Action": ["s3:GetObject", "s3:ListBucket"],
      "Resource": ["arn:aws:s3:::my-crowecode-models/*"]
    }
  ]
}
```

### Encryption
```bash
# S3 Server-side encryption
aws s3 cp model.tar.gz s3://bucket/models/ --sse AES256

# GCS Customer-managed encryption
gsutil cp -o "GSUtil:encryption_key=your-key" model.tar.gz gs://bucket/models/
```

## Monitoring & Troubleshooting

### Check Configuration
```bash
python crowecode/cloud_models.py status
```

### Debug Cloud Access
```python
from crowecode.cloud_storage import get_cloud_config, get_cloud_manager

# Check configuration
config = get_cloud_config()
print(f"Cloud config: {config}")

# Test connection
manager = get_cloud_manager()
if manager:
    models = manager.list_cloud_models()
    print(f"Available models: {models}")
else:
    print("Cloud storage not configured or unavailable")
```

### Common Issues

**❌ Cloud storage not configured**
```bash
# Solution: Run setup command
python crowecode/cloud_models.py setup --provider s3 --bucket my-models
```

**❌ Authentication failed**
```bash
# S3: Check AWS credentials
aws sts get-caller-identity

# GCS: Check service account
gcloud auth application-default print-access-token

# Azure: Check connection string
az storage account show --name myaccount
```

**❌ Models not found in cloud**
```bash
# Solution: Upload models first
python crowecode/download_models.py Alpha Beta
python crowecode/cloud_models.py upload Alpha Beta
```

---

## 🚀 Getting Started

1. **Choose your cloud provider** (S3, GCS, or Azure)
2. **Run setup**: `python crowecode/cloud_models.py setup --provider s3 --bucket my-models`
3. **Set environment variable** (from setup output)
4. **Upload models**: `python crowecode/cloud_models.py upload Alpha Beta`
5. **Deploy and scale** - instances will auto-download from cloud!

**Perfect for production deployments where you want to download models once and share across all instances!**
