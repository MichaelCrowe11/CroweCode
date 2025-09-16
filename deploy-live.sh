#!/bin/bash

# CroweCode Platform - Live Deployment to crowecode.com
# VPS: 159.198.37.197
# Password: FO56uwiNN3CT178jon-crowecode

set -e

SERVER_IP="159.198.37.197"
SERVER_USER="root"
SERVER_PASS="FO56uwiNN3CT178jon-crowecode"
DEPLOY_PATH="/var/www/crowecode"

echo "🚀 Deploying Enhanced CroweCode Platform to crowecode.com"
echo "=========================================================="
echo "Server: $SERVER_IP"
echo "Deploy Path: $DEPLOY_PATH"
echo ""

# First, let's test the connection
echo "🔌 Testing VPS connection..."
sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "echo 'Connection successful to crowecode.com VPS'"

# Create deployment directory
echo "📁 Creating deployment directory..."
sshpass -p "$SERVER_PASS" ssh $SERVER_USER@$SERVER_IP "mkdir -p $DEPLOY_PATH"

# Upload enhanced platform files
echo "📦 Uploading enhanced CroweCode platform files..."
sshpass -p "$SERVER_PASS" scp -r docker-compose.production.yml $SERVER_USER@$SERVER_IP:$DEPLOY_PATH/
sshpass -p "$SERVER_PASS" scp -r nginx-production.conf $SERVER_USER@$SERVER_IP:$DEPLOY_PATH/
sshpass -p "$SERVER_PASS" scp -r .env.production.example $SERVER_USER@$SERVER_IP:$DEPLOY_PATH/
sshpass -p "$SERVER_PASS" scp -r Dockerfile* $SERVER_USER@$SERVER_IP:$DEPLOY_PATH/
sshpass -p "$SERVER_PASS" scp -r package*.json $SERVER_USER@$SERVER_IP:$DEPLOY_PATH/
sshpass -p "$SERVER_PASS" scp -r next.config.ts $SERVER_USER@$SERVER_IP:$DEPLOY_PATH/
sshpass -p "$SERVER_PASS" scp -r tsconfig.json $SERVER_USER@$SERVER_IP:$DEPLOY_PATH/
sshpass -p "$SERVER_PASS" scp -r migrations/ $SERVER_USER@$SERVER_IP:$DEPLOY_PATH/
sshpass -p "$SERVER_PASS" scp -r monitoring/ $SERVER_USER@$SERVER_IP:$DEPLOY_PATH/
sshpass -p "$SERVER_PASS" scp -r src/ $SERVER_USER@$SERVER_IP:$DEPLOY_PATH/
sshpass -p "$SERVER_PASS" scp -r public/ $SERVER_USER@$SERVER_IP:$DEPLOY_PATH/
sshpass -p "$SERVER_PASS" scp -r prisma/ $SERVER_USER@$SERVER_IP:$DEPLOY_PATH/

# Deploy and start services
echo "🐳 Deploying enhanced services to crowecode.com..."
sshpass -p "$SERVER_PASS" ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
cd /var/www/crowecode

# Stop any existing services
docker-compose -f docker-compose.production.yml down 2>/dev/null || true

# Update system and install requirements
apt-get update
apt-get install -y docker.io docker-compose certbot nginx

# Copy environment file
cp .env.production.example .env.production

# Update environment for crowecode.com
sed -i 's/NEXTAUTH_URL=.*/NEXTAUTH_URL=https:\/\/crowecode.com/' .env.production
sed -i 's/NEXT_PUBLIC_APP_URL=.*/NEXT_PUBLIC_APP_URL=https:\/\/crowecode.com/' .env.production

# Create necessary directories
mkdir -p uploads credentials ssl backups logs

# Set permissions
chown -R root:root /var/www/crowecode
chmod -R 755 /var/www/crowecode

# Start enhanced CroweCode platform
echo "🚀 Starting enhanced CroweCode platform services..."
docker-compose -f docker-compose.production.yml pull
docker-compose -f docker-compose.production.yml up -d

# Wait for services to start
sleep 10

# Setup SSL certificate
echo "🔒 Setting up SSL certificate for crowecode.com..."
certbot certonly --standalone -d crowecode.com -d www.crowecode.com --non-interactive --agree-tos --email admin@crowecode.com || true

# Copy SSL certificates
if [ -f /etc/letsencrypt/live/crowecode.com/fullchain.pem ]; then
    cp /etc/letsencrypt/live/crowecode.com/fullchain.pem ssl/
    cp /etc/letsencrypt/live/crowecode.com/privkey.pem ssl/
fi

# Configure nginx with enhanced platform
cp nginx-production.conf /etc/nginx/sites-available/crowecode
ln -sf /etc/nginx/sites-available/crowecode /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Check service status
echo "📊 Checking enhanced platform services..."
docker-compose -f docker-compose.production.yml ps

echo ""
echo "✅ Enhanced CroweCode Platform Deployed Successfully!"
echo "=================================================="
echo "🌐 Main App: https://crowecode.com"
echo "🤖 AI Worker: https://crowecode.com/admin/queues"
echo "🔍 Analysis: https://crowecode.com/analysis"
echo "📊 Grafana: https://crowecode.com/grafana"
echo "📈 Metrics: https://crowecode.com/metrics"
echo "🔌 WebSocket: wss://crowecode.com/ws"
echo ""
echo "🌟 Enhanced Features Now Live:"
echo "  ✓ Multi-AI Provider System"
echo "  ✓ Autonomous AI Agents"
echo "  ✓ Real-time Collaboration"
echo "  ✓ VS Code Integration"
echo "  ✓ Advanced Code Analysis"
echo "  ✓ Comprehensive Monitoring"

ENDSSH

echo ""
echo "🎉 Enhanced CroweCode Platform successfully deployed to crowecode.com!"
echo "Visit https://crowecode.com to access your enhanced AI development platform!"