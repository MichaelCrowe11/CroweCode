# 🚀 Quick Deploy Guide for crowecode.com

## ✅ Pre-Deployment Checklist

### What You Need:
- [ ] VPS IP Address (from Namecheap email/dashboard)
- [ ] Root password or SSH key
- [ ] GitHub repository: https://github.com/MichaelCrowe11/crowe-logic-platform ✅

## 📝 Step-by-Step Deployment

### 1️⃣ Update DNS (5 minutes)
```
1. Go to: Namecheap → Domain List → Manage (crowecode.com) → Advanced DNS
2. Remove: CNAME and URL Redirect records
3. Add:
   - A Record: @ → [YOUR_VPS_IP]
   - A Record: www → [YOUR_VPS_IP]
   - TTL: 30 min for both
```

### 2️⃣ Connect to VPS (2 minutes)
```bash
# From your terminal (Git Bash, WSL, or PowerShell)
ssh root@YOUR_VPS_IP

# Accept fingerprint: yes
# Enter password from email
```

### 3️⃣ Deploy Application (15 minutes)
```bash
# ONE COMMAND DEPLOYMENT:
curl -fsSL https://raw.githubusercontent.com/MichaelCrowe11/crowe-logic-platform/main/vps-setup.sh | bash
```

**OR Manual Steps:**
```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose
apt update && apt install docker-compose -y

# Clone repository
git clone https://github.com/MichaelCrowe11/crowe-logic-platform.git /var/www/crowecode
cd /var/www/crowecode

# Run deployment
./deploy-full-stack.sh crowecode.com
```

### 4️⃣ Add API Keys (5 minutes)
```bash
# Edit environment file
nano /var/www/crowecode/.env.production

# Add your keys:
ANTHROPIC_API_KEY=sk-ant-api-xxx
OPENAI_API_KEY=sk-xxx  # Optional
GITHUB_CLIENT_ID=xxx    # For Git features
GITHUB_CLIENT_SECRET=xxx

# Save: Ctrl+O, Enter, Ctrl+X

# Restart services
cd /var/www/crowecode
docker-compose -f docker-compose.production.yml restart
```

## 🔍 Verify Deployment

### Check Services:
```bash
docker-compose -f docker-compose.production.yml ps
```

### View Logs:
```bash
docker-compose -f docker-compose.production.yml logs -f
```

### Test Website:
1. Wait 5-10 minutes for DNS propagation
2. Visit: https://crowecode.com
3. Test features:
   - [ ] Homepage loads
   - [ ] IDE works (/ide)
   - [ ] Login/Register
   - [ ] AI features (if API keys added)

## 🚨 Troubleshooting

### If site doesn't load:
```bash
# Check if services are running
docker ps

# Check nginx logs
docker-compose -f docker-compose.production.yml logs nginx

# Restart everything
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d
```

### SSL Certificate Issues:
```bash
# Generate manually
certbot certonly --standalone -d crowecode.com -d www.crowecode.com
cp /etc/letsencrypt/live/crowecode.com/*.pem /var/www/crowecode/ssl/
docker-compose -f docker-compose.production.yml restart nginx
```

### Database Issues:
```bash
# Reset database
docker-compose -f docker-compose.production.yml down -v
docker-compose -f docker-compose.production.yml up -d
```

## 📞 Quick Commands Reference

```bash
# SSH to VPS
ssh root@YOUR_VPS_IP

# Go to app directory
cd /var/www/crowecode

# View status
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f

# Restart services
docker-compose -f docker-compose.production.yml restart

# Stop everything
docker-compose -f docker-compose.production.yml down

# Start everything
docker-compose -f docker-compose.production.yml up -d

# Update from GitHub
git pull origin main
docker-compose -f docker-compose.production.yml build
docker-compose -f docker-compose.production.yml up -d
```

## 🎉 Success Indicators

✅ All services show "Up" status
✅ No errors in logs
✅ Site loads with HTTPS
✅ Can access /ide, /crowehub, /repositories
✅ Login/register works
✅ AI features work (if keys added)

## 📱 Mobile Check

Test on your phone:
- Visit https://crowecode.com
- Should work on mobile browsers
- Responsive design active

---

**Need Help?**
- Check logs first: `docker-compose -f docker-compose.production.yml logs`
- DNS not working? Wait 30 minutes or use https://www.whatsmydns.net
- Services not starting? Check VPS has 2GB+ RAM

**Your platform will be live at https://crowecode.com! 🚀**