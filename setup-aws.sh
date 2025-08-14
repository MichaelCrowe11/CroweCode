#!/bin/bash
# CroweCode AWS One-Command Setup
# Creates everything needed for CroweCode cloud storage in AWS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 CroweCode AWS One-Command Setup${NC}"
echo "=================================="

# Default values
BUCKET_NAME=""
REGION="us-east-1"
CREATE_USER=false
INSTALL_DEPS=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --bucket)
            BUCKET_NAME="$2"
            shift 2
            ;;
        --region)
            REGION="$2"
            shift 2
            ;;
        --create-user)
            CREATE_USER=true
            shift
            ;;
        --install-deps)
            INSTALL_DEPS=true
            shift
            ;;
        --help)
            echo "Usage: $0 --bucket BUCKET_NAME [options]"
            echo ""
            echo "Options:"
            echo "  --bucket NAME     S3 bucket name (required)"
            echo "  --region REGION   AWS region (default: us-east-1)"
            echo "  --create-user     Create IAM user with access keys"
            echo "  --install-deps    Install AWS CLI and dependencies"
            echo "  --help           Show this help"
            echo ""
            echo "Examples:"
            echo "  $0 --bucket my-crowecode-models"
            echo "  $0 --bucket my-models --region us-west-2 --create-user"
            echo "  $0 --bucket my-models --install-deps"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

if [ -z "$BUCKET_NAME" ]; then
    echo -e "${RED}❌ Bucket name is required. Use --bucket BUCKET_NAME${NC}"
    exit 1
fi

# Install dependencies if requested
if [ "$INSTALL_DEPS" = true ]; then
    echo -e "${BLUE}📦 Installing dependencies...${NC}"
    
    # Install AWS CLI v2
    if ! command -v aws &> /dev/null; then
        echo "Installing AWS CLI..."
        curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
        unzip -q awscliv2.zip
        sudo ./aws/install
        rm -rf aws awscliv2.zip
        echo -e "${GREEN}✅ AWS CLI installed${NC}"
    else
        echo -e "${GREEN}✅ AWS CLI already installed${NC}"
    fi
    
    # Install boto3 for Python
    pip install boto3 > /dev/null 2>&1 || true
    echo -e "${GREEN}✅ boto3 installed${NC}"
fi

# Check if AWS CLI is available
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found!${NC}"
    echo "Install it with: $0 --bucket $BUCKET_NAME --install-deps"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo -e "${RED}❌ AWS not configured!${NC}"
    echo "Configure with: aws configure"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✅ AWS configured (Account: $ACCOUNT_ID)${NC}"

# Create S3 bucket
echo -e "${BLUE}🪣 Creating S3 bucket: $BUCKET_NAME${NC}"

if aws s3api head-bucket --bucket "$BUCKET_NAME" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Bucket $BUCKET_NAME already exists${NC}"
else
    if [ "$REGION" = "us-east-1" ]; then
        aws s3api create-bucket --bucket "$BUCKET_NAME"
    else
        aws s3api create-bucket --bucket "$BUCKET_NAME" --region "$REGION" \
            --create-bucket-configuration LocationConstraint="$REGION"
    fi
    echo -e "${GREEN}✅ Created S3 bucket: $BUCKET_NAME${NC}"
fi

# Configure bucket security
echo -e "${BLUE}🔒 Configuring bucket security...${NC}"

# Block public access
aws s3api put-public-access-block --bucket "$BUCKET_NAME" \
    --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

# Enable versioning
aws s3api put-bucket-versioning --bucket "$BUCKET_NAME" \
    --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption --bucket "$BUCKET_NAME" \
    --server-side-encryption-configuration '{
        "Rules": [{
            "ApplyServerSideEncryptionByDefault": {
                "SSEAlgorithm": "AES256"
            },
            "BucketKeyEnabled": true
        }]
    }'

echo -e "${GREEN}✅ Bucket security configured${NC}"

# Configure lifecycle policy for cost optimization
echo -e "${BLUE}💰 Configuring lifecycle policies...${NC}"

aws s3api put-bucket-lifecycle-configuration --bucket "$BUCKET_NAME" \
    --lifecycle-configuration '{
        "Rules": [{
            "ID": "CroweCodeModelLifecycle",
            "Status": "Enabled",
            "Filter": {"Prefix": "crowecode-models/"},
            "Transitions": [
                {
                    "Days": 30,
                    "StorageClass": "STANDARD_IA"
                },
                {
                    "Days": 90,
                    "StorageClass": "GLACIER"
                }
            ]
        }]
    }'

echo -e "${GREEN}✅ Lifecycle policies configured (30d → IA, 90d → Glacier)${NC}"

# Create IAM user if requested
if [ "$CREATE_USER" = true ]; then
    echo -e "${BLUE}👤 Creating IAM user...${NC}"
    
    USER_NAME="crowecode-user-$(echo $BUCKET_NAME | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g')"
    
    # Create user
    if aws iam get-user --user-name "$USER_NAME" > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  User $USER_NAME already exists${NC}"
    else
        aws iam create-user --user-name "$USER_NAME"
        echo -e "${GREEN}✅ Created IAM user: $USER_NAME${NC}"
    fi
    
    # Create and attach policy
    POLICY_DOC='{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:DeleteObject",
                    "s3:ListBucket"
                ],
                "Resource": [
                    "arn:aws:s3:::'$BUCKET_NAME'",
                    "arn:aws:s3:::'$BUCKET_NAME'/crowecode-models/*"
                ]
            }
        ]
    }'
    
    aws iam put-user-policy --user-name "$USER_NAME" \
        --policy-name "CroweCodeS3Access" \
        --policy-document "$POLICY_DOC"
    
    # Create access key
    ACCESS_KEY_OUTPUT=$(aws iam create-access-key --user-name "$USER_NAME" 2>/dev/null || echo "ERROR")
    
    if [ "$ACCESS_KEY_OUTPUT" != "ERROR" ]; then
        ACCESS_KEY_ID=$(echo "$ACCESS_KEY_OUTPUT" | jq -r '.AccessKey.AccessKeyId')
        SECRET_ACCESS_KEY=$(echo "$ACCESS_KEY_OUTPUT" | jq -r '.AccessKey.SecretAccessKey')
        
        echo -e "${GREEN}✅ Created access keys for $USER_NAME${NC}"
        echo ""
        echo -e "${YELLOW}🔐 AWS Credentials (save these securely!):${NC}"
        echo "export AWS_ACCESS_KEY_ID='$ACCESS_KEY_ID'"
        echo "export AWS_SECRET_ACCESS_KEY='$SECRET_ACCESS_KEY'"
        echo "export AWS_DEFAULT_REGION='$REGION'"
        echo ""
    else
        echo -e "${YELLOW}⚠️  Access key might already exist for this user${NC}"
    fi
fi

# Generate CroweCode cloud configuration
echo -e "${BLUE}🔧 Generating CroweCode configuration...${NC}"

CONFIG_JSON='{"enabled":true,"provider":"s3","config":{"bucket":"'$BUCKET_NAME'","region":"'$REGION'","prefix":"crowecode-models/"}}'
CONFIG_B64=$(echo -n "$CONFIG_JSON" | base64 -w 0)

echo ""
echo -e "${GREEN}✅ AWS Setup Complete!${NC}"
echo "===================="
echo ""
echo -e "${BLUE}🔧 Add this to your environment:${NC}"
echo "export CROWECODE_CLOUD_CONFIG_B64='$CONFIG_B64'"
echo ""
echo -e "${BLUE}🚀 Next steps:${NC}"
echo "1. Set the environment variables above"
echo "2. Download models: python crowecode/download_models.py --dev"
echo "3. Upload to cloud: python crowecode/cloud_models.py upload Alpha Beta"
echo "4. Deploy your CroweCode instances!"
echo ""
echo -e "${BLUE}💡 Test the setup:${NC}"
echo "python crowecode/cloud_models.py status"
echo ""
echo -e "${GREEN}🎉 Your CroweCode AWS cloud storage is ready!${NC}"
