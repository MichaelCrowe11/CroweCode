#!/bin/bash

# Quick Fix Script for CroweCode VPS Deployment
set -e

echo "🔧 CroweCode Quick Fix Script"
echo "============================="

# Navigate to project directory
cd /var/www/crowecode

# 1. Clean up failed migrations
echo "1. Cleaning up database migrations..."
docker-compose -f docker-compose.production.yml exec -T postgres psql -U crowe -d crowe_platform -c "DELETE FROM _prisma_migrations WHERE migration_name LIKE '%add_indexes%';" 2>/dev/null || true

# 2. Remove problematic migration files
echo "2. Removing problematic migration files..."
rm -rf prisma/migrations/20250110_add_indexes

# 3. Create minimal environment file if not exists
echo "3. Setting up environment..."
if [ ! -f .env.production ]; then
    cat > .env.production << 'EOF'
NODE_ENV=production
NEXTAUTH_URL=https://crowecode.com
NEXTAUTH_SECRET=temp-secret-replace-me
JWT_SECRET=temp-jwt-replace-me

# Database
DB_HOST=postgres
DB_PORT=5432
DB_USER=crowe
DB_PASSWORD=CroweDB2025
DB_NAME=crowe_platform
DATABASE_URL=postgresql://crowe:CroweDB2025@postgres:5432/crowe_platform

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=RedisPass2025
REDIS_URL=redis://:RedisPass2025@redis:6379

# Feature Flags
ENABLE_AI_FEATURES=false
ENABLE_COLLABORATION=true
ENABLE_GITHUB_INTEGRATION=false
ENABLE_ANALYTICS=false
EOF
fi

# 4. Stop all containers
echo "4. Stopping containers..."
docker-compose -f docker-compose.production.yml down

# 5. Pull latest changes
echo "5. Pulling latest code..."
git fetch origin main
git reset --hard origin/main

# 6. Rebuild the app container
echo "6. Rebuilding application..."
docker-compose -f docker-compose.production.yml build app

# 7. Start services
echo "7. Starting services..."
docker-compose -f docker-compose.production.yml up -d postgres redis
sleep 10

# 8. Start app without migrations
echo "8. Starting application..."
docker-compose -f docker-compose.production.yml up -d app nginx backup

# 9. Wait and check status
echo "9. Waiting for services to start..."
sleep 20

# 10. Show status
echo ""
echo "✅ Quick Fix Complete!"
echo "====================="
docker-compose -f docker-compose.production.yml ps

echo ""
echo "Test your site: https://crowecode.com"
echo ""
echo "If still having issues, check logs:"
echo "docker-compose -f docker-compose.production.yml logs app"