#!/bin/bash

# Railway Deployment Script for CroweCode
set -e

echo "🚂 Railway Deployment for CroweCode"
echo "===================================="
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

echo "✅ Railway CLI is installed"
echo ""

# Step 1: Login
echo "📝 Step 1: Login to Railway"
echo "----------------------------"
echo "This will open a browser window to authenticate."
echo "Press Enter to continue..."
read
railway login

echo ""
echo "✅ Logged in to Railway"

# Step 2: Initialize project
echo ""
echo "📦 Step 2: Create Railway Project"
echo "----------------------------------"
echo "Creating new Railway project..."

railway init --name crowecode-platform || {
    echo "Project may already exist. Linking to existing project..."
    railway link
}

# Step 3: Set environment variables
echo ""
echo "🔧 Step 3: Setting Environment Variables"
echo "-----------------------------------------"

# Generate secure secrets
JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "change-this-jwt-secret-$(date +%s)")
SESSION_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "change-this-session-secret-$(date +%s)")

echo "Setting production environment variables..."

railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set NEXT_PUBLIC_SITE_URL=https://crowecode.com
railway variables set NEXT_PUBLIC_APP_NAME="CroweCode Platform"
railway variables set JWT_SECRET=$JWT_SECRET
railway variables set SESSION_SECRET=$SESSION_SECRET
railway variables set ENABLE_AI_SUGGESTIONS=true
railway variables set ENABLE_COLLABORATION=true
railway variables set ENABLE_PLUGINS=true

echo "✅ Environment variables configured"

# Step 4: Add PostgreSQL database (optional)
echo ""
echo "💾 Step 4: Database Setup"
echo "-------------------------"
echo "Would you like to add a PostgreSQL database? (y/n)"
read -n 1 add_db
echo ""

if [[ $add_db == "y" || $add_db == "Y" ]]; then
    echo "Adding PostgreSQL database..."
    railway add
    echo "Select 'PostgreSQL' from the list"
    echo "✅ Database added. DATABASE_URL will be automatically set."
fi

# Step 5: Deploy
echo ""
echo "🚀 Step 5: Deploying to Railway"
echo "--------------------------------"
echo "Starting deployment..."

railway up

echo ""
echo "✅ Deployment initiated!"

# Step 6: Get deployment info
echo ""
echo "📊 Step 6: Deployment Status"
echo "-----------------------------"
railway status

# Get the deployment URL
echo ""
echo "🌐 Your app is deploying to:"
railway domain

echo ""
echo "═══════════════════════════════════════════════"
echo "        🎉 Railway Deployment Complete! 🎉       "
echo "═══════════════════════════════════════════════"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. View your app:"
echo "   railway open"
echo ""
echo "2. Add custom domain (crowecode.com):"
echo "   - Go to Railway Dashboard → Settings → Domains"
echo "   - Add 'crowecode.com' and 'www.crowecode.com'"
echo "   - Update Namecheap DNS:"
echo "     Type: CNAME, Host: @, Value: [your-app].up.railway.app"
echo "     Type: CNAME, Host: www, Value: [your-app].up.railway.app"
echo ""
echo "3. Monitor logs:"
echo "   railway logs"
echo ""
echo "4. Connect GitHub for auto-deploy:"
echo "   railway connect"
echo ""
echo "5. View in dashboard:"
echo "   https://railway.app/dashboard"
echo ""
echo "═══════════════════════════════════════════════"