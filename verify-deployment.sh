#!/bin/bash

echo "🔍 Verifying CroweCode Deployment"
echo "================================="
echo ""

# Function to check URL
check_url() {
    local url=$1
    local name=$2

    echo -n "Checking $name... "
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")

    if [ "$response" = "200" ] || [ "$response" = "301" ] || [ "$response" = "302" ]; then
        echo "✅ OK (HTTP $response)"
        return 0
    else
        echo "❌ Failed (HTTP $response)"
        return 1
    fi
}

# Get Railway URL from user
echo "Enter your Railway URL (e.g., crowecode-platform-production-xyz.up.railway.app):"
read railway_url

if [ -z "$railway_url" ]; then
    echo "No URL provided, using default pattern..."
    railway_url="crowecode-platform-production.up.railway.app"
fi

echo ""
echo "📊 Deployment Status:"
echo "--------------------"

# Check Railway deployment
check_url "https://$railway_url" "Railway deployment"
check_url "https://$railway_url/api/health" "Health endpoint"

# Check custom domain (after DNS propagation)
echo ""
echo "📡 Custom Domain Status (may take 24h for DNS):"
echo "-----------------------------------------------"
check_url "https://crowecode.com" "crowecode.com"
check_url "https://www.crowecode.com" "www.crowecode.com"

echo ""
echo "🔧 Quick Fixes:"
echo "--------------"
echo "If Railway URL fails:"
echo "  - Check build logs in Railway dashboard"
echo "  - Ensure environment variables are set"
echo ""
echo "If custom domain fails:"
echo "  - DNS propagation takes 1-24 hours"
echo "  - Verify CNAME records in Namecheap"
echo "  - Ensure domain is added in Railway settings"
echo ""
echo "📚 Useful Links:"
echo "----------------"
echo "Railway Dashboard: https://railway.app/dashboard"
echo "Namecheap DNS: https://ap.www.namecheap.com/domains/domaincontrolpanel/crowecode.com/advancedns"
echo "Your App: https://$railway_url"