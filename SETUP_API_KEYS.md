# 🔑 API Keys Setup Guide for CroweCode

## Required API Keys

### 1. Anthropic Claude API (Required for AI Features)
- **Get Key**: https://console.anthropic.com/
- **Cost**: Pay-as-you-go (~$0.015 per 1K tokens)
- **Key Format**: `sk-ant-api03-...`

### 2. OpenAI API (Optional - Alternative AI)
- **Get Key**: https://platform.openai.com/api-keys
- **Cost**: Pay-as-you-go (~$0.002 per 1K tokens)
- **Key Format**: `sk-...`

### 3. GitHub OAuth (Required for GitHub Integration)
- **Setup**: https://github.com/settings/developers
- **Create OAuth App**:
  - Application name: `CroweCode`
  - Homepage URL: `https://crowecode.com`
  - Authorization callback URL: `https://crowecode.com/api/auth/callback/github`
- **Get**: Client ID and Client Secret

### 4. GitHub Personal Access Token (For Git Operations)
- **Create**: https://github.com/settings/tokens
- **Permissions Needed**:
  - repo (full control)
  - workflow
  - write:packages
  - read:org

## Quick Setup Commands

### On Your VPS:
```bash
# SSH to your server
ssh root@159.198.37.197

# Navigate to project
cd /var/www/crowecode

# Edit environment file
nano .env.production

# Add your keys:
ANTHROPIC_API_KEY=sk-ant-api03-YOUR-KEY-HERE
OPENAI_API_KEY=sk-YOUR-OPENAI-KEY
GITHUB_CLIENT_ID=YOUR-GITHUB-CLIENT-ID
GITHUB_CLIENT_SECRET=YOUR-GITHUB-CLIENT-SECRET
GITHUB_ACCESS_TOKEN=ghp_YOUR-TOKEN

# Save (Ctrl+O, Enter, Ctrl+X)

# Restart services
docker-compose -f docker-compose.production.yml restart app
```

## Optional Services

### SendGrid (Email)
- **Sign Up**: https://sendgrid.com/
- **Free Tier**: 100 emails/day
- **Get API Key**: Settings → API Keys

### Cloudflare (CDN)
- **Sign Up**: https://cloudflare.com/
- **Add Site**: Add crowecode.com
- **Get**: Zone ID and API Token

### Sentry (Error Tracking)
- **Sign Up**: https://sentry.io/
- **Create Project**: Node.js
- **Get DSN**: Settings → Client Keys

## Test Your Configuration

After adding keys, test each service:

1. **AI Features**: Go to /ide and try code completion
2. **GitHub**: Go to /crowehub and connect your GitHub
3. **Email**: Register a new account
4. **CDN**: Check response headers for CF-Cache-Status

## Security Notes

- Never commit API keys to Git
- Rotate keys regularly
- Use environment variables only
- Set up billing alerts on all services
- Monitor usage dashboards

## Troubleshooting

If features aren't working after adding keys:

1. Check logs: `docker-compose -f docker-compose.production.yml logs app`
2. Verify environment: `docker-compose -f docker-compose.production.yml exec app env | grep API`
3. Restart all services: `docker-compose -f docker-compose.production.yml restart`

## Support

Need help? 
- Check logs first
- Verify key format
- Ensure services are enabled in .env.production
- Test with curl/Postman

---
Remember: Most features work without all keys. Start with Anthropic API for AI features!