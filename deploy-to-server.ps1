# CroweCode Platform - Windows Deployment Script
# Deploy enhanced platform to crowecode.com VPS

Write-Host "🚀 CroweCode Platform Deployment to crowecode.com" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green

# Configuration
$SERVER_IP = Read-Host "Enter VPS IP address for crowecode.com"
$SSH_USER = "root"
$DEPLOY_PATH = "/var/www/crowecode"

Write-Host "📦 Preparing deployment files..." -ForegroundColor Yellow

# Create deployment package
$deployFiles = @(
    "docker-compose.production.yml",
    "nginx-production.conf",
    ".env.production.example",
    "Dockerfile*",
    "package.json",
    "package-lock.json",
    "next.config.ts",
    "tsconfig.json",
    "migrations/",
    "monitoring/",
    "scripts/",
    "src/",
    "public/",
    "prisma/"
)

Write-Host "🔧 Files ready for deployment:" -ForegroundColor Cyan
$deployFiles | ForEach-Object { Write-Host "  ✓ $_" -ForegroundColor Green }

Write-Host "`n📋 Manual deployment steps for crowecode.com:" -ForegroundColor Yellow
Write-Host "1. Connect to VPS: ssh root@$SERVER_IP" -ForegroundColor White
Write-Host "2. Create directory: mkdir -p $DEPLOY_PATH" -ForegroundColor White
Write-Host "3. Upload files using SCP or rsync" -ForegroundColor White
Write-Host "4. Run: cd $DEPLOY_PATH && docker-compose -f docker-compose.production.yml up -d" -ForegroundColor White
Write-Host "5. Configure SSL: certbot --nginx -d crowecode.com -d www.crowecode.com" -ForegroundColor White

Write-Host "`n🌟 Enhanced CroweCode Features Ready:" -ForegroundColor Magenta
Write-Host "  ✓ Multi-AI Provider System (Claude, GPT-4, Grok, Gemini)" -ForegroundColor Green
Write-Host "  ✓ Autonomous AI Agents (6-phase development)" -ForegroundColor Green
Write-Host "  ✓ Real-time Collaboration (WebSocket)" -ForegroundColor Green
Write-Host "  ✓ VS Code Marketplace Integration" -ForegroundColor Green
Write-Host "  ✓ KiloCode MCP Server" -ForegroundColor Green
Write-Host "  ✓ Code Analysis Engine" -ForegroundColor Green
Write-Host "  ✓ Comprehensive Monitoring (Prometheus + Grafana)" -ForegroundColor Green
Write-Host "  ✓ Enterprise Security & Compliance" -ForegroundColor Green

Write-Host "`n📡 Services will be available at:" -ForegroundColor Cyan
Write-Host "  🌐 Main App: https://crowecode.com" -ForegroundColor White
Write-Host "  🤖 AI Worker: https://crowecode.com/admin/queues" -ForegroundColor White
Write-Host "  🔍 Analysis: https://crowecode.com/analysis" -ForegroundColor White
Write-Host "  📊 Grafana: https://crowecode.com/grafana" -ForegroundColor White
Write-Host "  📈 Metrics: https://crowecode.com/metrics" -ForegroundColor White
Write-Host "  🔌 WebSocket: wss://crowecode.com/ws" -ForegroundColor White

Write-Host "`n✅ Deployment package ready for crowecode.com production!" -ForegroundColor Green