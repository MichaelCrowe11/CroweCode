#!/bin/bash

# Production Configuration Script for CroweCode Platform
# This script helps configure API keys and secrets for production

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🔧 CroweCode Production Configuration${NC}"
echo -e "${GREEN}========================================${NC}"

# Function to generate secure random strings
generate_secret() {
    openssl rand -base64 32
}

# Check if running on production server
if [ ! -f /var/www/crowecode/.env.production ]; then
    echo -e "${RED}Error: Production environment file not found!${NC}"
    echo "This script should be run on the production server."
    exit 1
fi

cd /var/www/crowecode

# Backup existing configuration
cp .env.production .env.production.backup.$(date +%Y%m%d_%H%M%S)

echo -e "${YELLOW}Current configuration backed up${NC}"

# Generate secrets if not set
echo -e "${YELLOW}Generating secure secrets...${NC}"

NEXTAUTH_SECRET=$(generate_secret)
JWT_SECRET=$(generate_secret)
DB_PASSWORD=$(generate_secret | tr -d '/' | tr -d '+' | cut -c1-16)
REDIS_PASSWORD=$(generate_secret | tr -d '/' | tr -d '+' | cut -c1-16)

# Update configuration
cat > .env.production.temp << EOF
# Production Environment Configuration
# Generated on $(date)

# Application
NODE_ENV=production
NEXTAUTH_URL=https://crowecode.com
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
JWT_SECRET=${JWT_SECRET}

# Database
DB_HOST=postgres
DB_PORT=5432
DB_USER=crowe
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=crowe_platform
DATABASE_URL=postgresql://crowe:${DB_PASSWORD}@postgres:5432/crowe_platform

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=${REDIS_PASSWORD}
REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379

EOF

echo -e "${GREEN}Base configuration generated${NC}"

# Prompt for API keys
echo ""
echo -e "${YELLOW}Enter your API keys (press Enter to skip):${NC}"

read -p "Anthropic API Key (sk-ant-api...): " ANTHROPIC_KEY
read -p "OpenAI API Key (sk-...): " OPENAI_KEY
read -p "GitHub Client ID: " GITHUB_CLIENT_ID
read -p "GitHub Client Secret: " GITHUB_CLIENT_SECRET
read -p "GitHub Access Token (ghp_...): " GITHUB_TOKEN

# Add API keys if provided
echo "" >> .env.production.temp
echo "# AI API Keys" >> .env.production.temp
echo "ANTHROPIC_API_KEY=${ANTHROPIC_KEY}" >> .env.production.temp
echo "OPENAI_API_KEY=${OPENAI_KEY}" >> .env.production.temp
echo "" >> .env.production.temp
echo "# GitHub OAuth" >> .env.production.temp
echo "GITHUB_CLIENT_ID=${GITHUB_CLIENT_ID}" >> .env.production.temp
echo "GITHUB_CLIENT_SECRET=${GITHUB_CLIENT_SECRET}" >> .env.production.temp
echo "GITHUB_ACCESS_TOKEN=${GITHUB_TOKEN}" >> .env.production.temp

# Optional services
echo ""
echo -e "${YELLOW}Optional Services (press Enter to skip):${NC}"

read -p "SendGrid API Key: " SENDGRID_KEY
read -p "Sentry DSN: " SENTRY_DSN
read -p "Cloudflare Zone ID: " CF_ZONE_ID
read -p "Cloudflare API Token: " CF_TOKEN

# Add optional services
echo "" >> .env.production.temp
echo "# Email Configuration" >> .env.production.temp
echo "EMAIL_PROVIDER=sendgrid" >> .env.production.temp
echo "SENDGRID_API_KEY=${SENDGRID_KEY}" >> .env.production.temp
echo "EMAIL_FROM=noreply@crowecode.com" >> .env.production.temp
echo "" >> .env.production.temp
echo "# Analytics & Monitoring" >> .env.production.temp
echo "SENTRY_DSN=${SENTRY_DSN}" >> .env.production.temp
echo "" >> .env.production.temp
echo "# CDN & Storage" >> .env.production.temp
echo "CLOUDFLARE_ZONE_ID=${CF_ZONE_ID}" >> .env.production.temp
echo "CLOUDFLARE_API_TOKEN=${CF_TOKEN}" >> .env.production.temp

# Feature flags
echo "" >> .env.production.temp
echo "# Feature Flags" >> .env.production.temp
echo "ENABLE_AI_FEATURES=$([ -n \"$ANTHROPIC_KEY\" ] && echo 'true' || echo 'false')" >> .env.production.temp
echo "ENABLE_COLLABORATION=true" >> .env.production.temp
echo "ENABLE_GITHUB_INTEGRATION=$([ -n \"$GITHUB_CLIENT_ID\" ] && echo 'true' || echo 'false')" >> .env.production.temp
echo "ENABLE_ANALYTICS=$([ -n \"$SENTRY_DSN\" ] && echo 'true' || echo 'false')" >> .env.production.temp

# Move temp file to production
mv .env.production.temp .env.production

echo ""
echo -e "${GREEN}✅ Configuration updated successfully!${NC}"
echo ""
echo -e "${YELLOW}Generated Secrets (save these securely):${NC}"
echo "Database Password: ${DB_PASSWORD}"
echo "Redis Password: ${REDIS_PASSWORD}"
echo ""
echo -e "${YELLOW}Restarting services...${NC}"

# Restart Docker services
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Configuration Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Your platform is now configured with:"
echo "- Secure secrets generated"
echo "- API keys configured"
echo "- Services restarted"
echo ""
echo "Visit https://crowecode.com to test the features!"