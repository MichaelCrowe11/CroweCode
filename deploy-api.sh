#!/bin/bash

echo "🚂 Attempting Railway Deployment with API"
echo "========================================="

TOKEN="58dfc6d5-5414-4fa3-857d-7b0c9f418f05"

# Try setting token as environment variable
export RAILWAY_TOKEN="${TOKEN}"

# Check current directory
echo "Current directory: $(pwd)"
echo "Project files:"
ls -la package.json next.config.ts

# Try to initialize with token
echo ""
echo "Attempting to initialize Railway project..."

# Method 1: Environment variable
RAILWAY_TOKEN="${TOKEN}" railway init --name crowecode-platform 2>&1 || {
    echo "Method 1 failed, trying alternative..."

    # Method 2: Direct token flag (if exists)
    railway init --name crowecode-platform --token "${TOKEN}" 2>&1 || {
        echo "Method 2 failed, trying config file..."

        # Method 3: Config file
        echo "${TOKEN}" > ~/.railway/config.json
        railway init --name crowecode-platform 2>&1 || {
            echo "All methods failed."
        }
    }
}

echo ""
echo "If authentication failed, please:"
echo "1. Go to https://railway.app/new"
echo "2. Click 'Deploy from GitHub repo'"
echo "3. Select your crowecode-platform repository"
echo "4. Railway will auto-deploy your app"