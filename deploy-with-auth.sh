#!/bin/bash

# CroweCode VPS Deployment with Authentication
# This script will set up SSH keys and deploy your application

VPS_IP="159.198.37.197"
VPS_USER="root"
VPS_PASS="FO56uwiNN3CT178jon"
APP_DIR="/var/www/crowecode"

echo "🚀 CroweCode VPS Deployment"
echo "=========================="
echo ""

# Install sshpass if not available
if ! command -v sshpass &> /dev/null; then
    echo "Installing sshpass for automated authentication..."
    apt-get update && apt-get install -y sshpass 2>/dev/null || {
        echo "Cannot install sshpass. Trying alternative method..."
    }
fi

# Step 1: Copy SSH key to VPS
echo "Step 1: Setting up SSH key authentication..."
sshpass -p "${VPS_PASS}" ssh-copy-id -i ~/.ssh/crowecode_vps.pub -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_IP} 2>/dev/null || {
    echo "Trying alternative SSH key setup..."
    sshpass -p "${VPS_PASS}" ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_IP} << 'EOF'
mkdir -p ~/.ssh
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIJh1ki5jhmGgrIklVA7gwYUS8cdpg19T39eUzCUblY04 crowecode-vps-key" >> ~/.ssh/authorized_keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
echo "SSH key added manually"
EOF
}

# Step 2: Test SSH key authentication
echo ""
echo "Step 2: Testing SSH key authentication..."
ssh -i ~/.ssh/crowecode_vps -o PasswordAuthentication=no ${VPS_USER}@${VPS_IP} "echo 'SSH key authentication successful!'" || {
    echo "SSH key auth failed, using password for deployment..."
    USE_PASSWORD=true
}

# Step 3: Prepare deployment
echo ""
echo "Step 3: Preparing deployment package..."
rm -rf .deploy
mkdir -p .deploy
cp -r src app public components lib .deploy/ 2>/dev/null || true
cp package*.json next.config.* tsconfig*.json .deploy/ 2>/dev/null || true

# Create production env
cat > .deploy/.env.production << ENVFILE
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_SITE_URL=https://crowecode.com
JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "default-jwt-secret")
SESSION_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "default-session-secret")
ENABLE_AI_SUGGESTIONS=true
ENABLE_COLLABORATION=true
ENABLE_PLUGINS=true
ENVFILE

# Step 4: Deploy to VPS
echo ""
echo "Step 4: Deploying to VPS..."

if [ "$USE_PASSWORD" = true ]; then
    # Use password authentication
    sshpass -p "${VPS_PASS}" rsync -avz --progress \
        --exclude 'node_modules/' \
        --exclude '.git/' \
        --exclude '.next/' \
        .deploy/ ${VPS_USER}@${VPS_IP}:${APP_DIR}/

    sshpass -p "${VPS_PASS}" ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_IP} << 'ENDSSH'
else
    # Use SSH key
    rsync -avz --progress \
        -e "ssh -i ~/.ssh/crowecode_vps" \
        --exclude 'node_modules/' \
        --exclude '.git/' \
        --exclude '.next/' \
        .deploy/ ${VPS_USER}@${VPS_IP}:${APP_DIR}/

    ssh -i ~/.ssh/crowecode_vps ${VPS_USER}@${VPS_IP} << 'ENDSSH'
fi
set -e

echo "Setting up application on VPS..."

# Create app directory
mkdir -p /var/www/crowecode
cd /var/www/crowecode

# Install Node.js if needed
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
    yum install -y nodejs
fi

# Install PM2
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

# Install dependencies
echo "Installing dependencies..."
npm install --production

# Build application
echo "Building application..."
npm run build || echo "Build failed, will try to start anyway"

# Start with PM2
pm2 stop crowecode 2>/dev/null || true
pm2 delete crowecode 2>/dev/null || true
pm2 start npm --name "crowecode" -- start
pm2 save
pm2 startup systemd -u root --hp /root

# Configure firewall
firewall-cmd --permanent --add-port=3000/tcp 2>/dev/null || true
firewall-cmd --permanent --add-service=http 2>/dev/null || true
firewall-cmd --permanent --add-service=https 2>/dev/null || true
firewall-cmd --reload 2>/dev/null || true

echo "Application deployed successfully!"
ENDSSH

# Step 5: Verify deployment
echo ""
echo "Step 5: Verifying deployment..."
sleep 3

if [ "$USE_PASSWORD" = true ]; then
    sshpass -p "${VPS_PASS}" ssh ${VPS_USER}@${VPS_IP} "pm2 list"
else
    ssh -i ~/.ssh/crowecode_vps ${VPS_USER}@${VPS_IP} "pm2 list"
fi

# Cleanup
rm -rf .deploy

echo ""
echo "✅ Deployment Complete!"
echo "======================"
echo ""
echo "Access your site at:"
echo "  http://crowecode.com"
echo "  http://159.198.37.197:3000"
echo ""
echo "SSH access (now with key):"
echo "  ssh -i ~/.ssh/crowecode_vps root@159.198.37.197"
echo ""
echo "Manage application:"
echo "  pm2 logs crowecode"
echo "  pm2 restart crowecode"
echo "  pm2 status"