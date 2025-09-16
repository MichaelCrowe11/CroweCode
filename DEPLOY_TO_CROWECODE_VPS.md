# 🚀 Deploy Enhanced CroweCode Platform to crowecode.com

## Server Details
- **VPS IP**: 159.198.37.197
- **Username**: root
- **Password**: FO56uwiNN3CT178jon-crowecode
- **Domain**: crowecode.com

## Step 1: Connect to VPS
```bash
# Connect via SSH (use PowerShell, Git Bash, or WSL)
ssh root@159.198.37.197
# Password: FO56uwiNN3CT178jon-crowecode
```

## Step 2: Prepare Server Environment
```bash
# Update system
apt-get update && apt-get upgrade -y

# Install Docker and Docker Compose
curl -fsSL https://get.docker.com | sh
apt-get install -y docker-compose

# Install additional tools
apt-get install -y nginx certbot python3-certbot-nginx git curl

# Create deployment directory
mkdir -p /var/www/crowecode
cd /var/www/crowecode
```

## Step 3: Download Enhanced Platform
```bash
# Option A: Clone from repository (if pushed to GitHub)
git clone https://github.com/MichaelCrowe11/crowecode-platform.git .

# Option B: Manual upload (use SCP or similar)
# Upload the following files from your local machine:
# - docker-compose.production.yml
# - nginx-production.conf
# - .env.production.example
# - All Dockerfile.*
# - package.json, package-lock.json
# - next.config.ts, tsconfig.json
# - src/, public/, prisma/, migrations/, monitoring/ directories
```

## Step 4: Configure Environment
```bash
# Copy and edit environment file
cp .env.production.example .env.production

# Edit with your API keys
nano .env.production

# Essential variables to set:
NEXTAUTH_URL=https://crowecode.com
NEXT_PUBLIC_APP_URL=https://crowecode.com
ANTHROPIC_API_KEY=your-claude-api-key
OPENAI_API_KEY=your-openai-key  # Optional
DATABASE_URL=postgresql://crowe:CroweDB2025@postgres:5432/crowe_platform
REDIS_URL=redis://redis:6379
```

## Step 5: Deploy Enhanced Platform
```bash
# Create necessary directories
mkdir -p uploads credentials ssl backups logs monitoring/prometheus monitoring/grafana/dashboards

# Set permissions
chown -R root:root /var/www/crowecode
chmod -R 755 /var/www/crowecode

# Start enhanced CroweCode services
docker-compose -f docker-compose.production.yml pull
docker-compose -f docker-compose.production.yml up -d

# Check all services are running
docker-compose -f docker-compose.production.yml ps
```

## Step 6: Configure SSL Certificate
```bash
# Stop nginx temporarily for certificate generation
systemctl stop nginx

# Generate SSL certificate
certbot certonly --standalone \
    -d crowecode.com \
    -d www.crowecode.com \
    --non-interactive \
    --agree-tos \
    --email admin@crowecode.com

# Copy certificates to application
cp /etc/letsencrypt/live/crowecode.com/fullchain.pem ssl/
cp /etc/letsencrypt/live/crowecode.com/privkey.pem ssl/
```

## Step 7: Configure Nginx
```bash
# Copy enhanced nginx configuration
cp nginx-production.conf /etc/nginx/sites-available/crowecode

# Enable site
ln -sf /etc/nginx/sites-available/crowecode /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload nginx
nginx -t
systemctl start nginx
systemctl enable nginx
```

## Step 8: Verify Deployment
```bash
# Check all services
docker-compose -f docker-compose.production.yml ps

# Check logs
docker-compose -f docker-compose.production.yml logs

# Test endpoints
curl -I https://crowecode.com/health
curl -I https://crowecode.com/api/health
```

## Step 9: Set Up Monitoring
```bash
# Start monitoring stack
docker-compose -f monitoring/docker-compose.monitoring.yml up -d

# Check monitoring services
docker ps | grep crowecode
```

## ✅ Enhanced Features Now Live

After successful deployment, the following services will be available:

### 🌐 **Main Services**
- **Main App**: https://crowecode.com
- **API Health**: https://crowecode.com/api/health
- **IDE Interface**: https://crowecode.com/ide

### 🤖 **AI Services**
- **AI Worker Admin**: https://crowecode.com/admin/queues
- **Code Analysis**: https://crowecode.com/analysis
- **MCP Server**: https://crowecode.com/mcp

### 📊 **Monitoring**
- **Grafana Dashboard**: https://crowecode.com/grafana (admin/admin)
- **Prometheus Metrics**: https://crowecode.com/metrics
- **System Health**: https://crowecode.com/health

### 🔌 **Real-time Services**
- **WebSocket Endpoint**: wss://crowecode.com/ws
- **Collaboration Hub**: https://crowecode.com/collaborate

## 🎯 Enhanced Platform Features

✅ **Multi-AI Provider System**
- Claude Opus 4.1 (Primary)
- GPT-4 Turbo, Grok, Gemini Pro (Fallbacks)
- Intelligent load balancing and failover

✅ **Autonomous AI Agents**
- 6-phase development cycle
- Orchestrator → Architect → Coder → Debugger → Reviewer → Tester

✅ **Real-time Collaboration**
- WebSocket-based shared editing
- Voice/video integration ready
- Conflict resolution with CRDTs

✅ **VS Code Integration**
- Full marketplace compatibility
- Extension search and installation
- Security verification

✅ **Advanced Code Analysis**
- 15+ programming languages
- Complexity metrics and technical debt analysis
- AI-powered refactoring suggestions

✅ **Enterprise Monitoring**
- Prometheus + Grafana stack
- 20+ alert rules with multi-channel notifications
- Performance metrics and health monitoring

✅ **Enterprise Security**
- SOC 2, HIPAA, GDPR compliant architecture
- JWT authentication with comprehensive middleware
- Rate limiting and malicious activity detection

## 🔧 Maintenance Commands

```bash
# Restart all services
cd /var/www/crowecode
docker-compose -f docker-compose.production.yml restart

# View logs
docker-compose -f docker-compose.production.yml logs -f

# Update platform
git pull origin main
docker-compose -f docker-compose.production.yml up -d --build

# Backup database
docker-compose -f docker-compose.production.yml exec postgres pg_dump -U crowe crowe_platform > backup.sql

# Renew SSL certificate (automated via cron)
certbot renew --quiet
```

## 🎉 Success!

Your enhanced CroweCode platform is now live at **https://crowecode.com** with all AI-powered development features, real-time collaboration, and enterprise monitoring capabilities!