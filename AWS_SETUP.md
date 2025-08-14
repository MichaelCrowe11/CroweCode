# 🌩️ CroweCode AWS Auto-Setup Guide

## **Yes! We can create AWS accounts and buckets from the CLI!**

CroweCode includes automated AWS setup tools that create and configure everything you need for cloud storage.

## 🚀 One-Command Setup

### **Super Simple Setup**
```bash
# Just specify a bucket name - everything else is automatic!
./setup-aws.sh --bucket my-crowecode-models
```

### **Full Production Setup**
```bash
# Create bucket + IAM user + access keys
./setup-aws.sh --bucket my-crowecode-models --region us-west-2 --create-user
```

### **Complete Installation (if AWS CLI not installed)**
```bash
# Install AWS CLI + create everything
./setup-aws.sh --bucket my-crowecode-models --install-deps --create-user
```

## 📋 What Gets Created

### 🪣 **S3 Bucket Configuration**
- ✅ **Secure bucket** with public access blocked
- ✅ **Versioning enabled** for model safety
- ✅ **Encryption enabled** (AES256) 
- ✅ **Lifecycle policies** for cost optimization:
  - 30 days → Standard-IA (cheaper)
  - 90 days → Glacier (cheapest)

### 👤 **IAM User & Permissions** (with `--create-user`)
- ✅ **IAM user** with programmatic access
- ✅ **Minimal permissions** (only CroweCode models folder)
- ✅ **Access keys** for authentication
- ✅ **Secure policies** (least privilege)

### 🔐 **Security Features**
- ✅ **Private buckets** (no public access)
- ✅ **Encrypted storage** at rest
- ✅ **IAM policies** with minimal permissions
- ✅ **Resource-specific access** (only model folders)

## 📖 Step-by-Step Guide

### **Prerequisites**
1. **AWS Account** (free tier works fine)
2. **Admin access** (to create resources)

### **Step 1: Get AWS Credentials**
```bash
# Option A: Use AWS CLI configure
aws configure

# Option B: Use environment variables
export AWS_ACCESS_KEY_ID="your-admin-key"
export AWS_SECRET_ACCESS_KEY="your-admin-secret"
export AWS_DEFAULT_REGION="us-east-1"
```

### **Step 2: Run CroweCode Setup**
```bash
# Basic setup (uses your existing AWS credentials)
./setup-aws.sh --bucket my-crowecode-models

# Or with dedicated user creation
./setup-aws.sh --bucket my-crowecode-models --create-user
```

### **Step 3: Configure CroweCode**
```bash
# The script outputs something like this:
export CROWECODE_CLOUD_CONFIG_B64='eyJlbmFibGVkIjp0cnVlLCJwcm92aWRlciI6InMzIiwiY29uZmlnIjp7ImJ1Y2tldCI6Im15LWNyb3dlY29kZS1tb2RlbHMiLCJyZWdpb24iOiJ1cy1lYXN0LTEiLCJwcmVmaXgiOiJjcm93ZWNvZGUtbW9kZWxzLyJ9fQ=='

# If you created a user, also set:
export AWS_ACCESS_KEY_ID='AKIA...'
export AWS_SECRET_ACCESS_KEY='xyz...'
```

### **Step 4: Upload Models**
```bash
# Download models locally first
python crowecode/download_models.py --dev

# Upload to your new AWS bucket
python crowecode/cloud_models.py upload Alpha Beta
```

## 🎛️ Advanced Options

### **Custom Regions**
```bash
# Use specific AWS region
./setup-aws.sh --bucket my-models --region us-west-2
./setup-aws.sh --bucket my-models --region eu-west-1
./setup-aws.sh --bucket my-models --region ap-southeast-1
```

### **Production Deployment**
```bash
# Create bucket + user + access keys
./setup-aws.sh --bucket prod-crowecode-models --region us-west-2 --create-user

# Use the generated credentials in your production environment
export AWS_ACCESS_KEY_ID='...'
export AWS_SECRET_ACCESS_KEY='...'
export CROWECODE_CLOUD_CONFIG_B64='...'
```

### **Team Setup**
```bash
# Each team member can use the same bucket
./setup-aws.sh --bucket team-crowecode-models --create-user

# Different users get different access keys
# All can access the same models
```

## 💰 Cost Optimization

### **Automatic Lifecycle Management**
The setup automatically configures cost optimization:

```
Day 1-29:   Standard storage    ($0.023/GB/month)
Day 30-89:  Standard-IA        ($0.0125/GB/month) 
Day 90+:    Glacier            ($0.004/GB/month)
```

### **Storage Costs Example**
```
CroweCode Development Setup (Alpha + Beta):
- Total: ~75GB
- Month 1: $1.73
- Month 2: $0.94 (after moving to IA)
- Month 3+: $0.30 (after moving to Glacier)
```

### **Multi-Region Strategy**
```bash
# Use region close to your compute for faster downloads
./setup-aws.sh --bucket us-west-models --region us-west-2     # US West Coast
./setup-aws.sh --bucket eu-west-models --region eu-west-1     # Europe
./setup-aws.sh --bucket ap-models --region ap-southeast-1     # Asia Pacific
```

## 🔧 Manual Setup (Alternative)

If you prefer manual setup or need custom configuration:

### **Using Python Tool**
```bash
# Full control with Python script
python crowecode/aws_setup.py --bucket my-models --auto

# Just bucket creation
python crowecode/aws_setup.py --bucket my-models --bucket-only

# Custom IAM setup
python crowecode/aws_setup.py --bucket my-models --create-user --create-role
```

### **Manual AWS CLI Commands**
```bash
# Create bucket
aws s3api create-bucket --bucket my-crowecode-models --region us-west-2 \
    --create-bucket-configuration LocationConstraint=us-west-2

# Configure security
aws s3api put-public-access-block --bucket my-crowecode-models \
    --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

# Enable encryption
aws s3api put-bucket-encryption --bucket my-crowecode-models \
    --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
```

## 🚀 Production Deployment Examples

### **Docker Deployment**
```dockerfile
FROM python:3.11-slim

# Install AWS dependencies
RUN pip install boto3

# Copy CroweCode
COPY crowecode/ /app/crowecode/

# Set environment variables
ENV CROWECODE_CLOUD_CONFIG_B64="your-config-here"
ENV AWS_ACCESS_KEY_ID="your-key"
ENV AWS_SECRET_ACCESS_KEY="your-secret"
ENV CROWECODE_BACKEND="qwen"

# Models will download from S3 automatically
CMD ["uvicorn", "crowecode.api:app", "--host", "0.0.0.0", "--port", "8000"]
```

### **Kubernetes Deployment**
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: crowecode-aws
type: Opaque
stringData:
  access-key-id: "AKIA..."
  secret-access-key: "xyz..."
  cloud-config: "eyJlbmFibGVkIjp0cnVlLCJwcm92aWRlciI6InMzIiwi..."

---
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
              name: crowecode-aws
              key: cloud-config
        - name: AWS_ACCESS_KEY_ID
          valueFrom:
            secretKeyRef:
              name: crowecode-aws
              key: access-key-id
        - name: AWS_SECRET_ACCESS_KEY
          valueFrom:
            secretKeyRef:
              name: crowecode-aws
              key: secret-access-key
```

### **Terraform (Infrastructure as Code)**
```hcl
resource "aws_s3_bucket" "crowecode_models" {
  bucket = "my-crowecode-models"
}

resource "aws_s3_bucket_public_access_block" "crowecode_models" {
  bucket = aws_s3_bucket.crowecode_models.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_iam_user" "crowecode_user" {
  name = "crowecode-user"
}

resource "aws_iam_access_key" "crowecode_user" {
  user = aws_iam_user.crowecode_user.name
}

output "aws_access_key_id" {
  value = aws_iam_access_key.crowecode_user.id
}

output "aws_secret_access_key" {
  value = aws_iam_access_key.crowecode_user.secret
  sensitive = true
}
```

## 🔍 Troubleshooting

### **Setup Issues**

**❌ AWS CLI not found**
```bash
./setup-aws.sh --bucket my-models --install-deps
```

**❌ Insufficient permissions**
```bash
# Make sure your AWS user has admin permissions
aws iam attach-user-policy --user-name your-user --policy-arn arn:aws:iam::aws:policy/AdministratorAccess
```

**❌ Bucket name already taken**
```bash
# S3 bucket names are globally unique - try a different name
./setup-aws.sh --bucket my-unique-crowecode-models-2024
```

### **Runtime Issues**

**❌ Models not downloading from cloud**
```bash
# Check configuration
python crowecode/cloud_models.py status

# Check AWS credentials
aws sts get-caller-identity
```

**❌ Permission denied**
```bash
# Verify IAM policy allows S3 access
aws iam get-user-policy --user-name crowecode-user --policy-name CroweCodeS3Access
```

## 📊 Monitoring & Logging

### **CloudWatch Metrics**
```bash
# Monitor S3 usage
aws cloudwatch get-metric-statistics \
    --namespace AWS/S3 \
    --metric-name BucketSizeBytes \
    --dimensions Name=BucketName,Value=my-crowecode-models \
    --start-time 2024-01-01T00:00:00Z \
    --end-time 2024-01-31T23:59:59Z \
    --period 86400 \
    --statistics Average
```

### **Cost Monitoring**
```bash
# Check S3 costs
aws ce get-cost-and-usage \
    --time-period Start=2024-01-01,End=2024-01-31 \
    --granularity MONTHLY \
    --metrics BlendedCost \
    --group-by Type=DIMENSION,Key=SERVICE
```

---

## 🎉 Summary

**YES! CroweCode can automatically create and configure AWS resources from the CLI!**

### **One Command Setup:**
```bash
./setup-aws.sh --bucket my-crowecode-models --create-user
```

### **What You Get:**
- ✅ Secure S3 bucket with encryption
- ✅ IAM user with minimal permissions  
- ✅ Access keys for authentication
- ✅ Cost optimization policies
- ✅ Ready-to-use CroweCode configuration

**Perfect for teams and production deployments!** 🚀
