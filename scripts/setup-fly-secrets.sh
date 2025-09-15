#!/bin/bash

# Fly.io Secrets Setup Script for Crowe Code Platform
# This script sets up all required secrets for production deployment

echo "Setting up Fly.io secrets for Crowe Code Platform..."

# Check if fly CLI is installed
if ! command -v fly &> /dev/null; then
    echo "Error: Fly CLI not installed. Please install it first:"
    echo "curl -L https://fly.io/install.sh | sh"
    exit 1
fi

# App name
APP_NAME="crowe-code-platform"

echo "Configuring secrets for app: $APP_NAME"

# Database
echo "Setting database secrets..."
fly secrets set DATABASE_URL="postgresql://user:pass@host:5432/crowe_code_db" \
    DIRECT_URL="postgresql://user:pass@host:5432/crowe_code_db" \
    --app $APP_NAME

# Authentication
echo "Setting authentication secrets..."
fly secrets set JWT_SECRET="$(openssl rand -base64 32)" \
    NEXTAUTH_SECRET="$(openssl rand -base64 32)" \
    NEXTAUTH_URL="https://crowe-code-platform.fly.dev" \
    --app $APP_NAME

# AI API Keys
echo "Setting AI provider secrets..."
fly secrets set ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY}" \
    OPENAI_API_KEY="${OPENAI_API_KEY}" \
    GROQ_API_KEY="${GROQ_API_KEY}" \
    XAI_API_KEY="${XAI_API_KEY}" \
    --app $APP_NAME

# Google Cloud Services
echo "Setting Google Cloud secrets..."
fly secrets set GOOGLE_CLOUD_PROJECT_ID="${GOOGLE_CLOUD_PROJECT_ID}" \
    GOOGLE_APPLICATION_CREDENTIALS_JSON="${GOOGLE_APPLICATION_CREDENTIALS_JSON}" \
    VERTEX_AI_LOCATION="${VERTEX_AI_LOCATION:-us-central1}" \
    --app $APP_NAME

# Redis Cache
echo "Setting Redis secrets..."
fly secrets set REDIS_URL="redis://default:password@host:6379" \
    KV_URL="redis://default:password@host:6379" \
    --app $APP_NAME

# GitHub Integration
echo "Setting GitHub secrets..."
fly secrets set GITHUB_TOKEN="${GITHUB_TOKEN}" \
    GITHUB_CLIENT_ID="${GITHUB_CLIENT_ID}" \
    GITHUB_CLIENT_SECRET="${GITHUB_CLIENT_SECRET}" \
    --app $APP_NAME

# Oracle Cloud (if needed)
echo "Setting Oracle Cloud secrets (optional)..."
if [ ! -z "$ORACLE_USER" ]; then
    fly secrets set ORACLE_USER="${ORACLE_USER}" \
        ORACLE_PASSWORD="${ORACLE_PASSWORD}" \
        ORACLE_CONNECTION_STRING="${ORACLE_CONNECTION_STRING}" \
        --app $APP_NAME
fi

# Email Service
echo "Setting email service secrets..."
fly secrets set EMAIL_SERVER="${EMAIL_SERVER}" \
    EMAIL_PORT="${EMAIL_PORT}" \
    EMAIL_USER="${EMAIL_USER}" \
    EMAIL_PASSWORD="${EMAIL_PASSWORD}" \
    EMAIL_FROM="${EMAIL_FROM}" \
    --app $APP_NAME

# Monitoring & Analytics
echo "Setting monitoring secrets..."
fly secrets set SENTRY_DSN="${SENTRY_DSN}" \
    DATADOG_API_KEY="${DATADOG_API_KEY}" \
    NEW_RELIC_LICENSE_KEY="${NEW_RELIC_LICENSE_KEY}" \
    --app $APP_NAME

# Storage (Cloudinary/S3)
echo "Setting storage secrets..."
fly secrets set CLOUDINARY_URL="${CLOUDINARY_URL}" \
    AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID}" \
    AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY}" \
    AWS_REGION="${AWS_REGION}" \
    S3_BUCKET="${S3_BUCKET}" \
    --app $APP_NAME

# Payment Processing
echo "Setting payment secrets..."
fly secrets set STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY}" \
    STRIPE_WEBHOOK_SECRET="${STRIPE_WEBHOOK_SECRET}" \
    --app $APP_NAME

echo ""
echo "Secrets configuration complete!"
echo ""
echo "To view current secrets:"
echo "  fly secrets list --app $APP_NAME"
echo ""
echo "To deploy the application:"
echo "  fly deploy --app $APP_NAME"
echo ""
echo "To open the deployed app:"
echo "  fly open --app $APP_NAME"