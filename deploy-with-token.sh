#!/bin/bash

# Railway Token-based Deployment
echo "🚂 Railway Token Deployment"
echo "=========================="
echo ""

# Check if token is provided
if [ -z "$1" ]; then
    echo "Please provide your Railway token:"
    echo "Usage: ./deploy-with-token.sh YOUR_RAILWAY_TOKEN"
    echo ""
    echo "Get your token from: https://railway.app/account/tokens"
    exit 1
fi

RAILWAY_TOKEN=$1

# Export token for Railway CLI
export RAILWAY_TOKEN=$RAILWAY_TOKEN

echo "✅ Using provided Railway token"
echo ""

# Test authentication
echo "Testing authentication..."
railway whoami || {
    echo "❌ Invalid token. Please check your token and try again."
    exit 1
}

echo "✅ Authenticated successfully!"
echo ""

# Initialize project
echo "Creating Railway project..."
railway init --name crowecode-platform || {
    echo "Linking to existing project..."
    railway link
}

# Set environment variables
echo "Setting environment variables..."
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set NEXT_PUBLIC_SITE_URL=https://crowecode.com
railway variables set JWT_SECRET=$(openssl rand -hex 32)
railway variables set SESSION_SECRET=$(openssl rand -hex 32)

echo "✅ Environment configured"
echo ""

# Deploy
echo "🚀 Deploying to Railway..."
railway up

# Get deployment info
echo ""
echo "📊 Deployment Status:"
railway status

echo ""
echo "🌐 Your app URL:"
railway domain

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Add custom domain in Railway dashboard"
echo "2. Update DNS at Namecheap"