#!/bin/bash

# CroweCode Platform Deployment Script
# Usage: ./deploy.sh [production|staging]

set -e

# Configuration
ENVIRONMENT=${1:-production}
PROJECT_NAME="crowecode-platform"
DOMAIN="crowecode.com"
VPS_USER="root"
VPS_HOST="crowecode.com"
REMOTE_DIR="/var/www/crowecode"
BACKUP_DIR="/var/backups/crowecode"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🚀 Starting CroweCode deployment to ${ENVIRONMENT}${NC}"

# Step 1: Build the application locally
echo -e "${YELLOW}📦 Building application...${NC}"
npm run build

# Step 2: Run tests
echo -e "${YELLOW}🧪 Running tests...${NC}"
npm test -- --passWithNoTests

# Step 3: Create deployment package
echo -e "${YELLOW}📦 Creating deployment package...${NC}"
rm -rf .deploy
mkdir -p .deploy

# Copy necessary files
cp -r .next .deploy/
cp -r public .deploy/
cp package*.json .deploy/
cp next.config.js .deploy/
cp -r src .deploy/

# Create .env.production
cat > .deploy/.env.production << EOF
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.${DOMAIN}
NEXT_PUBLIC_WEBSOCKET_URL=wss://ws.${DOMAIN}
NEXT_PUBLIC_SITE_URL=https://${DOMAIN}
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
DATABASE_URL=${DATABASE_URL}
REDIS_URL=${REDIS_URL}
JWT_SECRET=${JWT_SECRET}
EOF

# Step 4: Backup current deployment
echo -e "${YELLOW}💾 Creating backup on server...${NC}"
ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
if [ -d /var/www/crowecode ]; then
  mkdir -p /var/backups/crowecode
  timestamp=$(date +%Y%m%d_%H%M%S)
  tar -czf /var/backups/crowecode/backup_${timestamp}.tar.gz -C /var/www crowecode
  echo "Backup created: backup_${timestamp}.tar.gz"

  # Keep only last 5 backups
  ls -t /var/backups/crowecode/backup_*.tar.gz | tail -n +6 | xargs -r rm
fi
ENDSSH

# Step 5: Upload new deployment
echo -e "${YELLOW}📤 Uploading to server...${NC}"
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '.env.local' \
  --exclude '.deploy' \
  .deploy/ ${VPS_USER}@${VPS_HOST}:${REMOTE_DIR}/

# Step 6: Install dependencies and restart on server
echo -e "${YELLOW}🔧 Installing dependencies and restarting services...${NC}"
ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
cd /var/www/crowecode

# Install production dependencies
npm ci --only=production

# Build if needed (for any runtime compilation)
npm run build || true

# Restart PM2 process
pm2 restart crowecode || pm2 start npm --name "crowecode" -- start

# Save PM2 configuration
pm2 save
pm2 startup systemd -u root --hp /root || true

# Restart nginx to ensure latest configuration
nginx -t && systemctl reload nginx

# Clear CDN cache if applicable
# curl -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/purge_cache" \
#   -H "X-Auth-Email: ${CF_EMAIL}" \
#   -H "X-Auth-Key: ${CF_API_KEY}" \
#   -H "Content-Type: application/json" \
#   --data '{"purge_everything":true}'

echo "✅ Deployment complete!"
ENDSSH

# Step 7: Health check
echo -e "${YELLOW}🏥 Running health check...${NC}"
sleep 5
curl -f https://${DOMAIN}/health || {
  echo -e "${RED}❌ Health check failed!${NC}"
  echo -e "${YELLOW}🔄 Rolling back...${NC}"
  ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
    cd /var/backups/crowecode
    latest_backup=$(ls -t backup_*.tar.gz | head -1)
    if [ -n "$latest_backup" ]; then
      rm -rf /var/www/crowecode
      tar -xzf $latest_backup -C /var/www
      cd /var/www/crowecode
      pm2 restart crowecode
      echo "Rollback complete"
    fi
ENDSSH
  exit 1
}

echo -e "${GREEN}✅ Deployment successful!${NC}"
echo -e "${GREEN}🌐 Site is live at https://${DOMAIN}${NC}"

# Cleanup
rm -rf .deploy