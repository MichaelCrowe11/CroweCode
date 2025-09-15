#!/bin/bash

# VPS Security Hardening Script for CroweCode Platform
# Run this on your production server to enhance security

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🔐 CroweCode Security Hardening${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root${NC}"
    exit 1
fi

# 1. Install fail2ban
echo -e "${YELLOW}Installing fail2ban...${NC}"
if command -v apt-get &> /dev/null; then
    apt-get update
    apt-get install -y fail2ban
elif command -v dnf &> /dev/null; then
    dnf install -y fail2ban fail2ban-systemd
fi

# Configure fail2ban for SSH and Docker
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
destemail = admin@crowecode.com
action = %(action_mwl)s

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

[nginx-noscript]
enabled = true
port = http,https
filter = nginx-noscript
logpath = /var/log/nginx/access.log
maxretry = 6

[nginx-badbots]
enabled = true
port = http,https
filter = nginx-badbots
logpath = /var/log/nginx/access.log
maxretry = 2

[nginx-noproxy]
enabled = true
port = http,https
filter = nginx-noproxy
logpath = /var/log/nginx/error.log
maxretry = 2

[docker]
enabled = true
port = http,https
filter = docker
logpath = /var/lib/docker/containers/*/*-json.log
maxretry = 10
EOF

# Create Docker filter
cat > /etc/fail2ban/filter.d/docker.conf << 'EOF'
[Definition]
failregex = ^.*Failed password for .* from <HOST> port \d+ ssh2$
            ^.*Invalid user .* from <HOST>$
            ^.*authentication failure.*rhost=<HOST>.*$
ignoreregex =
EOF

# Start fail2ban
systemctl enable fail2ban
systemctl restart fail2ban

echo -e "${GREEN}✓ fail2ban configured${NC}"

# 2. Configure firewall with UFW
echo -e "${YELLOW}Configuring firewall...${NC}"
if ! command -v ufw &> /dev/null; then
    if command -v apt-get &> /dev/null; then
        apt-get install -y ufw
    elif command -v dnf &> /dev/null; then
        dnf install -y ufw
    fi
fi

# Configure UFW
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw allow 3000/tcp comment 'Development server'
ufw --force enable

echo -e "${GREEN}✓ Firewall configured${NC}"

# 3. Secure SSH configuration
echo -e "${YELLOW}Hardening SSH configuration...${NC}"
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

cat >> /etc/ssh/sshd_config.d/99-crowecode-hardening.conf << 'EOF'
# CroweCode SSH Hardening
PermitRootLogin prohibit-password
PasswordAuthentication no
PubkeyAuthentication yes
ChallengeResponseAuthentication no
X11Forwarding no
PrintMotd no
PrintLastLog yes
MaxAuthTries 3
MaxSessions 10
ClientAliveInterval 300
ClientAliveCountMax 2
LoginGraceTime 60
Protocol 2
StrictModes yes
IgnoreRhosts yes
HostbasedAuthentication no
PermitEmptyPasswords no
UsePAM yes
EOF

systemctl restart sshd

echo -e "${GREEN}✓ SSH hardened${NC}"

# 4. Set up automatic security updates
echo -e "${YELLOW}Configuring automatic security updates...${NC}"
if command -v apt-get &> /dev/null; then
    apt-get install -y unattended-upgrades
    dpkg-reconfigure --priority=low unattended-upgrades
elif command -v dnf &> /dev/null; then
    dnf install -y dnf-automatic
    systemctl enable --now dnf-automatic.timer
fi

echo -e "${GREEN}✓ Automatic updates configured${NC}"

# 5. Create backup script
echo -e "${YELLOW}Setting up automated backups...${NC}"
mkdir -p /root/scripts

cat > /root/scripts/backup-crowecode.sh << 'EOF'
#!/bin/bash

# Backup script for CroweCode
BACKUP_DIR="/backups/crowecode"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="crowecode_backup_${TIMESTAMP}"

# Create backup directory
mkdir -p ${BACKUP_DIR}

# Backup database
docker exec crowe-db pg_dump -U crowe crowe_platform | gzip > ${BACKUP_DIR}/db_${TIMESTAMP}.sql.gz

# Backup application files
tar -czf ${BACKUP_DIR}/app_${TIMESTAMP}.tar.gz /var/www/crowecode --exclude=/var/www/crowecode/node_modules

# Backup Docker volumes
docker run --rm -v crowecode_postgres_data:/data -v ${BACKUP_DIR}:/backup alpine tar -czf /backup/postgres_data_${TIMESTAMP}.tar.gz /data
docker run --rm -v crowecode_redis_data:/data -v ${BACKUP_DIR}:/backup alpine tar -czf /backup/redis_data_${TIMESTAMP}.tar.gz /data

# Keep only last 7 days of backups
find ${BACKUP_DIR} -type f -mtime +7 -delete

echo "Backup completed: ${BACKUP_NAME}"
EOF

chmod +x /root/scripts/backup-crowecode.sh

# Add to crontab (daily at 3 AM)
(crontab -l 2>/dev/null; echo "0 3 * * * /root/scripts/backup-crowecode.sh >> /var/log/crowecode-backup.log 2>&1") | crontab -

echo -e "${GREEN}✓ Automated backups configured${NC}"

# 6. Set up log rotation
echo -e "${YELLOW}Configuring log rotation...${NC}"
cat > /etc/logrotate.d/crowecode << 'EOF'
/var/www/crowecode/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 640 root adm
    sharedscripts
    postrotate
        docker-compose -f /var/www/crowecode/docker-compose.production.yml kill -USR1 nginx
    endscript
}
EOF

echo -e "${GREEN}✓ Log rotation configured${NC}"

# 7. Install and configure monitoring
echo -e "${YELLOW}Installing monitoring tools...${NC}"
if command -v apt-get &> /dev/null; then
    apt-get install -y htop iotop nethogs ncdu
elif command -v dnf &> /dev/null; then
    dnf install -y htop iotop nethogs ncdu
fi

# Install netdata for monitoring
if ! command -v netdata &> /dev/null; then
    bash <(curl -Ss https://my-netdata.io/kickstart.sh) --dont-wait
fi

echo -e "${GREEN}✓ Monitoring tools installed${NC}"

# 8. Create security audit script
cat > /root/scripts/security-audit.sh << 'EOF'
#!/bin/bash

echo "=== CroweCode Security Audit ==="
echo "Date: $(date)"
echo ""

# Check for failed login attempts
echo "Failed SSH attempts (last 24h):"
grep "Failed password" /var/log/auth.log | tail -10

echo ""
echo "Fail2ban status:"
fail2ban-client status

echo ""
echo "Open ports:"
netstat -tulpn | grep LISTEN

echo ""
echo "Docker container status:"
docker ps -a

echo ""
echo "Disk usage:"
df -h

echo ""
echo "Memory usage:"
free -h

echo ""
echo "Recent system logins:"
last -10

echo "=== Audit Complete ==="
EOF

chmod +x /root/scripts/security-audit.sh

echo -e "${GREEN}✓ Security audit script created${NC}"

# 9. Set secure file permissions
echo -e "${YELLOW}Setting secure file permissions...${NC}"
chmod 700 /root
chmod 644 /etc/passwd
chmod 600 /etc/shadow
chmod 600 /etc/gshadow
chmod 644 /etc/group
find /var/www/crowecode -type d -exec chmod 755 {} \;
find /var/www/crowecode -type f -exec chmod 644 {} \;
chmod +x /var/www/crowecode/scripts/*.sh

echo -e "${GREEN}✓ File permissions secured${NC}"

# 10. Generate security report
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Security Hardening Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Security measures implemented:"
echo "✓ fail2ban installed and configured"
echo "✓ UFW firewall enabled"
echo "✓ SSH hardened"
echo "✓ Automatic security updates enabled"
echo "✓ Daily backups configured (3 AM)"
echo "✓ Log rotation configured"
echo "✓ Monitoring tools installed"
echo "✓ Security audit script created"
echo "✓ File permissions secured"
echo ""
echo "Important files:"
echo "- Backup script: /root/scripts/backup-crowecode.sh"
echo "- Security audit: /root/scripts/security-audit.sh"
echo "- Backups location: /backups/crowecode"
echo ""
echo "Run security audit: /root/scripts/security-audit.sh"
echo "View fail2ban status: fail2ban-client status"
echo "View firewall status: ufw status"
echo ""
echo -e "${YELLOW}Remember to:${NC}"
echo "1. Set up SSH keys for all users"
echo "2. Disable root login completely after setting up admin user"
echo "3. Configure external backup storage (S3, etc.)"
echo "4. Set up monitoring alerts"
echo "5. Review and update security regularly"