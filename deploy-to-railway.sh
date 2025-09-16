#!/bin/bash

echo "🚂 Deploying CroweCode to Railway"
echo "================================="

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Login to Railway
echo "Logging into Railway..."
railway login

# Initialize Railway project
echo "Initializing Railway project..."
railway init --name crowecode-platform

# Set environment variables
echo "Setting environment variables..."
railway variables set NODE_ENV=production
railway variables set NEXT_PUBLIC_SITE_URL=https://crowecode.com
railway variables set JWT_SECRET=$(openssl rand -hex 32)
railway variables set SESSION_SECRET=$(openssl rand -hex 32)

# Link GitHub repo
echo "Linking GitHub repository..."
railway link

# Deploy
echo "Deploying to Railway..."
railway up

# Get deployment URL
echo ""
echo "✅ Deployment complete!"
echo "========================"
railway status

echo ""
echo "Next steps:"
echo "1. Add custom domain in Railway dashboard"
echo "2. Update DNS records at Namecheap:"
echo "   - Type: CNAME"
echo "   - Host: @"
echo "   - Value: [your-app].up.railway.app"
echo ""
echo "3. Your app will be live at:"
echo "   - https://[your-app].up.railway.app"
echo "   - https://crowecode.com (after DNS update)"