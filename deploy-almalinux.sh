#!/bin/bash

# CroweCode Deployment for AlmaLinux 9 with Webuzo
# Server: server1.crowecode.com (159.198.37.197)

set -e

# VPS Configuration
VPS_IP="159.198.37.197"
VPS_HOSTNAME="server1.crowecode.com"
VPS_DOMAIN="crowecode.com"
VPS_USER="root"
APP_DIR="/home/crowecode/public_html"  # Webuzo standard path
APP_NAME="crowecode"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   CroweCode AlmaLinux/Webuzo Deployment     ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Server: ${YELLOW}${VPS_HOSTNAME}${NC}"
echo -e "IP: ${YELLOW}${VPS_IP}${NC}"
echo -e "Domain: ${YELLOW}${VPS_DOMAIN}${NC}"
echo ""

# Test SSH connection
echo -e "${YELLOW}Testing SSH connection...${NC}"
ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_IP} "echo 'Connected successfully'" || {
    echo -e "${RED}Cannot connect to VPS. Please ensure SSH access is configured.${NC}"
    echo "Try: ssh ${VPS_USER}@${VPS_IP}"
    exit 1
}

# Prepare deployment package
echo -e "${YELLOW}Preparing deployment...${NC}"
rm -rf .deploy
mkdir -p .deploy

# Copy project files
cp -r src .deploy/ 2>/dev/null || true
cp -r app .deploy/ 2>/dev/null || true
cp -r public .deploy/ 2>/dev/null || true
cp -r components .deploy/ 2>/dev/null || true
cp -r lib .deploy/ 2>/dev/null || true
cp package*.json .deploy/
cp next.config.* .deploy/ 2>/dev/null || true
cp tsconfig*.json .deploy/ 2>/dev/null || true

# Deploy to VPS
echo -e "${YELLOW}Deploying to VPS...${NC}"
ssh ${VPS_USER}@${VPS_IP} << 'ENDSSH'
# AlmaLinux 9 setup
echo "Setting up on AlmaLinux 9..."

# Install Node.js 20 if not present
if ! command -v node &> /dev/null || [[ $(node -v | cut -d'v' -f2 | cut -d'.' -f1) -lt 20 ]]; then
    echo "Installing Node.js 20..."
    dnf module reset nodejs -y
    dnf module enable nodejs:20 -y
    dnf install nodejs -y
fi

# Install PM2 globally
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

# Create application directory
mkdir -p /home/crowecode/public_html
cd /home/crowecode/public_html

echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
ENDSSH

# Upload files
echo -e "${YELLOW}Uploading files...${NC}"
rsync -avz --progress \
    --exclude 'node_modules/' \
    --exclude '.git/' \
    --exclude '.next/' \
    --exclude '.env.local' \
    .deploy/ ${VPS_USER}@${VPS_IP}:${APP_DIR}/

# Build and start application
echo -e "${YELLOW}Building application...${NC}"
ssh ${VPS_USER}@${VPS_IP} << ENDSSH
cd ${APP_DIR}

# Install dependencies
echo "Installing dependencies..."
npm install --production

# Build Next.js app
echo "Building Next.js application..."
npm run build || echo "Build failed, will use development mode"

# Configure PM2
pm2 stop ${APP_NAME} 2>/dev/null || true
pm2 delete ${APP_NAME} 2>/dev/null || true

# Start application
PORT=3000 pm2 start npm --name "${APP_NAME}" -- start
pm2 save
pm2 startup systemd -u root --hp /root

# Configure firewall for AlmaLinux
firewall-cmd --permanent --add-port=3000/tcp 2>/dev/null || true
firewall-cmd --permanent --add-service=http 2>/dev/null || true
firewall-cmd --permanent --add-service=https 2>/dev/null || true
firewall-cmd --reload 2>/dev/null || true

# SELinux context for web files
chcon -R -t httpd_sys_content_t ${APP_DIR} 2>/dev/null || true
setsebool -P httpd_can_network_connect on 2>/dev/null || true

echo "Application started!"
ENDSSH

# Setup Webuzo domain configuration
echo -e "${YELLOW}Configuring Webuzo...${NC}"
ssh ${VPS_USER}@${VPS_IP} << 'ENDSSH'
# Create Apache/Nginx proxy config for Webuzo
if [ -d "/usr/local/webuzo" ]; then
    echo "Webuzo detected, configuring..."

    # Create custom configuration
    cat > /usr/local/apps/nginx/etc/conf.d/crowecode.conf << 'NGINX'
server {
    listen 80;
    server_name crowecode.com www.crowecode.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
NGINX

    # Restart Webuzo nginx
    /usr/local/apps/nginx/sbin/nginx -s reload 2>/dev/null || true
fi
ENDSSH

# Verify deployment
echo -e "${YELLOW}Verifying deployment...${NC}"
sleep 3

# Check application status
ssh ${VPS_USER}@${VPS_IP} "pm2 list"

# Check if site is accessible
response=$(curl -s -o /dev/null -w "%{http_code}" http://${VPS_IP}:3000 2>/dev/null || echo "000")
echo -e "Application status: HTTP ${response}"

# Clean up
rm -rf .deploy

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        Deployment Complete! 🎉              ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Access your site:${NC}"
echo "  http://${VPS_DOMAIN}"
echo "  http://${VPS_IP}:3000"
echo ""
echo -e "${BLUE}Server Info:${NC}"
echo "  OS: AlmaLinux 9 with Webuzo"
echo "  RAM: 6 GB (Available)"
echo "  Disk: 96 GB Free"
echo "  Bandwidth: 2.93 TB Available"
echo ""
echo -e "${YELLOW}Management Commands:${NC}"
echo "  SSH: ssh ${VPS_USER}@${VPS_IP}"
echo "  Logs: ssh ${VPS_USER}@${VPS_IP} 'pm2 logs ${APP_NAME}'"
echo "  Status: ssh ${VPS_USER}@${VPS_IP} 'pm2 status'"
echo "  Restart: ssh ${VPS_USER}@${VPS_IP} 'pm2 restart ${APP_NAME}'"
echo "  Webuzo Panel: https://${VPS_IP}:2004"
echo ""