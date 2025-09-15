# Railway Deployment Guide

## Quick Deploy Steps

### 1. Login to Railway
Open terminal and run:
```bash
railway login
```
This will open your browser for authentication.

### 2. Create New Project
```bash
cd crowecode-platform
railway link
```
Select "Create New Project" when prompted.

### 3. Add PostgreSQL Database
```bash
railway add
```
Select "PostgreSQL" from the list.

### 4. Deploy the Application
```bash
railway up
```

### 5. Set Environment Variables
Open Railway dashboard and add these variables:

#### Required Variables:
```env
# Authentication (Railway auto-generates a strong secret)
JWT_SECRET=<click-generate>
NEXTAUTH_SECRET=<click-generate>

# Stripe (Add your test keys from Stripe Dashboard)
STRIPE_SECRET_KEY=<your-stripe-secret-key>
STRIPE_PUBLISHABLE_KEY=<your-stripe-publishable-key>
STRIPE_WEBHOOK_SECRET=<your-stripe-webhook-secret>

# Security
ALLOWED_ORIGINS=https://your-app.railway.app
RATE_LIMIT=100
```

#### Optional Variables:
```env
# AI Services (if needed)
OPENAI_API_KEY=<your-openai-key>
ANTHROPIC_API_KEY=<your-anthropic-key>

# Email (if needed)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### 6. Get Your App URL
```bash
railway open
```

## Alternative: Deploy via GitHub

1. Push your code to GitHub
2. Go to https://railway.app
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your repository
6. Railway will auto-deploy on every push

## Post-Deployment

### Run Database Migrations
```bash
railway run npx prisma migrate deploy
```

### Check Logs
```bash
railway logs
```

### Open Dashboard
```bash
railway open
```

## Useful Commands

- `railway status` - Check deployment status
- `railway logs` - View application logs
- `railway run <command>` - Run commands in production
- `railway variables` - Manage environment variables
- `railway domain` - Set custom domain

## Database Connection

Railway automatically provides `DATABASE_URL` for your PostgreSQL database. The Prisma schema is already configured to use it.

## Troubleshooting

1. **Build Failures**: Check `railway logs` for detailed errors
2. **Database Issues**: Run `railway run npx prisma migrate deploy`
3. **Environment Variables**: Ensure all required vars are set in Railway dashboard

## Support

- Railway Docs: https://docs.railway.app
- Discord: https://discord.gg/railway
- Status: https://status.railway.app