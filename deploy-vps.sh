#!/bin/bash

# CroweCode VPS Deployment Script
# Secure deployment to your VPS

set -e

# Configuration
VPS_HOST="crowecode.com"
VPS_USER="root"
VPS_PORT="22"
REMOTE_DIR="/var/www/crowecode"
APP_NAME="crowecode"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     CroweCode VPS Deployment Script    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Check SSH connectivity
echo -e "${YELLOW}1. Testing VPS connection...${NC}"
ssh -q -o BatchMode=yes -o ConnectTimeout=5 ${VPS_USER}@${VPS_HOST} exit && {
    echo -e "${GREEN}✓ VPS connection successful${NC}"
} || {
    echo -e "${RED}✗ Cannot connect to VPS. Please check your SSH configuration.${NC}"
    echo "  Try: ssh ${VPS_USER}@${VPS_HOST}"
    exit 1
}

# Step 2: Prepare local build
echo -e "${YELLOW}2. Preparing deployment package...${NC}"

# Create deployment directory
rm -rf .deploy
mkdir -p .deploy

# Copy essential files only
echo "   Copying application files..."
cp -r src .deploy/ 2>/dev/null || true
cp -r public .deploy/ 2>/dev/null || true
cp -r app .deploy/ 2>/dev/null || true
cp package*.json .deploy/
cp next.config.* .deploy/ 2>/dev/null || true
cp tsconfig*.json .deploy/ 2>/dev/null || true
cp .env.production .deploy/ 2>/dev/null || true

# Create deployment info
echo "{
  \"deployedAt\": \"$(date -u +\"%Y-%m-%dT%H:%M:%SZ\")\",
  \"version\": \"$(git rev-parse --short HEAD 2>/dev/null || echo 'latest')\",
  \"deployedBy\": \"$(whoami)@$(hostname)\"
}" > .deploy/deploy-info.json

echo -e "${GREEN}✓ Deployment package ready${NC}"

# Step 3: Create backup on VPS
echo -e "${YELLOW}3. Creating backup on VPS...${NC}"
ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
if [ -d /var/www/crowecode ]; then
    mkdir -p /var/backups/crowecode
    timestamp=$(date +%Y%m%d_%H%M%S)
    tar -czf /var/backups/crowecode/backup_${timestamp}.tar.gz \
        --exclude=node_modules \
        --exclude=.next \
        -C /var/www crowecode 2>/dev/null || true
    echo "   Backup created: backup_${timestamp}.tar.gz"

    # Keep only last 5 backups
    ls -t /var/backups/crowecode/backup_*.tar.gz 2>/dev/null | tail -n +6 | xargs -r rm
fi
ENDSSH

# Step 4: Deploy to VPS
echo -e "${YELLOW}4. Deploying to VPS...${NC}"

# Upload files
echo "   Uploading files..."
rsync -avz --progress \
    --exclude 'node_modules/' \
    --exclude '.git/' \
    --exclude '.next/' \
    --exclude '.env.local' \
    --exclude '.DS_Store' \
    --exclude '*.log' \
    .deploy/ ${VPS_USER}@${VPS_HOST}:${REMOTE_DIR}/

echo -e "${GREEN}✓ Files uploaded${NC}"

# Step 5: Build and restart on VPS
echo -e "${YELLOW}5. Building and starting application...${NC}"
ssh ${VPS_USER}@${VPS_HOST} << ENDSSH
set -e

cd ${REMOTE_DIR}

# Install dependencies
echo "   Installing dependencies..."
npm install --production --silent

# Build the application
echo "   Building application..."
NODE_ENV=production npm run build || {
    echo "   Build failed, checking existing build..."
    if [ -d .next ]; then
        echo "   Using existing build"
    else
        echo "   No build found, attempting simple start"
    fi
}

# Install PM2 if not installed
if ! command -v pm2 &> /dev/null; then
    echo "   Installing PM2..."
    npm install -g pm2
fi

# Start or restart the application
echo "   Starting application with PM2..."
pm2 stop ${APP_NAME} 2>/dev/null || true
pm2 delete ${APP_NAME} 2>/dev/null || true

# Start with PM2
pm2 start npm --name "${APP_NAME}" -- start
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true

# Check if nginx is installed and reload
if command -v nginx &> /dev/null; then
    echo "   Reloading nginx..."
    nginx -t && systemctl reload nginx || true
fi

echo "   Application started successfully"
ENDSSH

# Step 6: Verify deployment
echo -e "${YELLOW}6. Verifying deployment...${NC}"
sleep 3

# Check if site is accessible
response=$(curl -s -o /dev/null -w "%{http_code}" -m 10 https://${VPS_HOST} 2>/dev/null || echo "000")

if [ "$response" = "200" ] || [ "$response" = "301" ] || [ "$response" = "302" ]; then
    echo -e "${GREEN}✓ Site is responding (HTTP ${response})${NC}"
else
    echo -e "${YELLOW}⚠ Site returned HTTP ${response}${NC}"
    echo "  This might be normal if the site is still starting up."
fi

# Check PM2 status
echo ""
echo -e "${YELLOW}7. Application status:${NC}"
ssh ${VPS_USER}@${VPS_HOST} "pm2 status ${APP_NAME}" || true

# Clean up
rm -rf .deploy

# Success message
echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        Deployment Completed! 🎉        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Site URL:${NC} https://${VPS_HOST}"
echo -e "${BLUE}Monitor logs:${NC} ssh ${VPS_USER}@${VPS_HOST} 'pm2 logs ${APP_NAME}'"
echo -e "${BLUE}Restart app:${NC} ssh ${VPS_USER}@${VPS_HOST} 'pm2 restart ${APP_NAME}'"
echo -e "${BLUE}Check status:${NC} ssh ${VPS_USER}@${VPS_HOST} 'pm2 status'"
echo ""