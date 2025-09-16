#!/bin/bash

# Simple deployment script to push updates to VPS
# This assumes the project is already set up on the VPS

set -e

echo "🚀 Deploying CroweCode to VPS"
echo "=============================="

# Configuration
VPS_HOST="crowecode.com"
VPS_USER="root"
REMOTE_DIR="/var/www/crowecode"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}📤 Syncing files to VPS...${NC}"

# Use rsync to sync files (excluding node_modules and other unnecessary files)
rsync -avz --delete \
  --exclude 'node_modules/' \
  --exclude '.git/' \
  --exclude '.next/' \
  --exclude '.env.local' \
  --exclude '.env.development' \
  --exclude 'deploy*.sh' \
  --exclude '.DS_Store' \
  --exclude 'npm-debug.log' \
  --exclude '.vscode/' \
  --exclude '.idea/' \
  --exclude '*.log' \
  . ${VPS_USER}@${VPS_HOST}:${REMOTE_DIR}/

echo -e "${YELLOW}🔧 Building and restarting on VPS...${NC}"

# SSH into VPS and rebuild
ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
  set -e

  echo "📍 Connected to VPS"
  cd /var/www/crowecode

  echo "📦 Installing dependencies..."
  npm ci --only=production || npm install --production

  echo "🔨 Building application..."
  npm run build || echo "Build failed, continuing with existing build"

  echo "🔄 Restarting PM2..."
  pm2 restart crowecode || pm2 start npm --name "crowecode" -- start
  pm2 save

  echo "🌐 Reloading nginx..."
  nginx -t && systemctl reload nginx || echo "Nginx reload failed"

  echo "✅ Deployment complete on VPS!"
ENDSSH

echo -e "${GREEN}✅ Deployment successful!${NC}"
echo -e "${GREEN}🌐 Site should be live at https://${VPS_HOST}${NC}"

# Health check
echo -e "${YELLOW}🏥 Running health check...${NC}"
sleep 5
response=$(curl -s -o /dev/null -w "%{http_code}" https://${VPS_HOST}/health || echo "000")

if [ "$response" -eq 200 ]; then
  echo -e "${GREEN}✅ Health check passed!${NC}"
else
  echo -e "${YELLOW}⚠️ Health check returned status: $response${NC}"
  echo "Check logs with: ssh ${VPS_USER}@${VPS_HOST} 'pm2 logs crowecode'"
fi