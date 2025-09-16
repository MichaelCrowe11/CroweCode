#!/bin/bash

# Quick Redeploy Script for CroweCode Platform
# This script helps redeploy the latest changes to your VPS

set -e

echo "🚀 CroweCode Quick Redeploy Script"
echo "=================================="

# Configuration - Update these with your actual values
VPS_HOST="crowecode.com"
VPS_USER="root"  # Update with your VPS username
REMOTE_DIR="/var/www/crowecode"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}📦 Building application locally...${NC}"
npm run build || {
    echo -e "${RED}❌ Build failed! Fix errors before deploying.${NC}"
    exit 1
}

echo -e "${GREEN}✅ Build successful!${NC}"

echo -e "${YELLOW}📤 Deploying to VPS...${NC}"

# SSH into the VPS and perform deployment
ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
    set -e

    echo "📍 Connected to VPS"

    # Navigate to project directory
    cd /var/www/crowecode || {
        echo "❌ Project directory not found!"
        exit 1
    }

    # Create backup
    echo "💾 Creating backup..."
    mkdir -p /var/backups/crowecode
    timestamp=$(date +%Y%m%d_%H%M%S)
    tar -czf /var/backups/crowecode/backup_${timestamp}.tar.gz \
        --exclude=node_modules \
        --exclude=.git \
        .next public package.json next.config.js

    # Pull latest changes from git
    echo "📥 Pulling latest changes..."
    git pull origin main || echo "⚠️ Git pull failed or not a git repo"

    # Install dependencies
    echo "📦 Installing dependencies..."
    npm ci --only=production

    # Build the application
    echo "🔨 Building application..."
    npm run build

    # Restart PM2 process
    echo "🔄 Restarting application..."
    pm2 restart crowecode || pm2 start npm --name "crowecode" -- start

    # Save PM2 configuration
    pm2 save

    # Reload nginx
    echo "🌐 Reloading nginx..."
    nginx -t && systemctl reload nginx

    echo "✅ Deployment complete on VPS!"
ENDSSH

echo -e "${YELLOW}🏥 Running health check...${NC}"
sleep 5

# Health check
response=$(curl -s -o /dev/null -w "%{http_code}" https://${VPS_HOST}/health)
if [ "$response" -eq 200 ]; then
    echo -e "${GREEN}✅ Health check passed!${NC}"
    echo -e "${GREEN}🎉 Redeployment successful!${NC}"
    echo -e "${GREEN}🌐 Site is live at https://${VPS_HOST}${NC}"
else
    echo -e "${RED}❌ Health check failed with status $response${NC}"
    echo -e "${YELLOW}⚠️  You may need to check the server logs${NC}"
    echo -e "${YELLOW}Run: ssh ${VPS_USER}@${VPS_HOST} 'pm2 logs crowecode'${NC}"
fi

echo ""
echo "📊 Quick commands for monitoring:"
echo "  - View logs: ssh ${VPS_USER}@${VPS_HOST} 'pm2 logs crowecode'"
echo "  - Check status: ssh ${VPS_USER}@${VPS_HOST} 'pm2 status'"
echo "  - Restart app: ssh ${VPS_USER}@${VPS_HOST} 'pm2 restart crowecode'"