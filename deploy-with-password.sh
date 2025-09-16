#!/bin/bash

# Interactive deployment script with password prompt

VPS_IP="159.198.37.197"
VPS_USER="root"
VPS_DOMAIN="crowecode.com"

echo "CroweCode VPS Deployment"
echo "========================"
echo ""
echo "This will deploy to: $VPS_USER@$VPS_IP"
echo "You will be prompted for the password multiple times."
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."

echo ""
echo "Step 1: Testing connection (enter password when prompted)..."
ssh ${VPS_USER}@${VPS_IP} "echo 'Connected successfully!'"

if [ $? -ne 0 ]; then
    echo "Connection failed. Please check your credentials."
    exit 1
fi

echo ""
echo "Step 2: Creating deployment package..."
rm -rf .deploy
mkdir -p .deploy
cp -r src app public components lib .deploy/ 2>/dev/null || true
cp package*.json next.config.* tsconfig*.json .deploy/ 2>/dev/null || true

echo ""
echo "Step 3: Uploading files (enter password when prompted)..."
rsync -avz --progress \
    --exclude 'node_modules/' \
    --exclude '.git/' \
    --exclude '.next/' \
    .deploy/ ${VPS_USER}@${VPS_IP}:/home/crowecode/public_html/

echo ""
echo "Step 4: Building application (enter password when prompted)..."
ssh ${VPS_USER}@${VPS_IP} << 'ENDSSH'
cd /home/crowecode/public_html
npm install --production
npm run build
pm2 restart crowecode || pm2 start npm --name "crowecode" -- start
pm2 save
ENDSSH

rm -rf .deploy

echo ""
echo "Deployment complete!"
echo "Access your site at: http://$VPS_DOMAIN"