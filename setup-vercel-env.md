# Vercel Environment Variables Setup Guide

## Step 1: Go to Vercel Dashboard
1. Visit https://vercel.com/dashboard
2. Click on your project: **crowe-logic-platform**
3. Navigate to **Settings** → **Environment Variables**

## Step 2: Add These Required Variables

### Essential Variables (Add these first):
```
NEXTAUTH_URL=https://crowe-logic-platform-6qe1yjocm-michael-9927s-projects.vercel.app
NEXTAUTH_SECRET=generate-with-command-below
JWT_SECRET=generate-with-command-below
```

### Generate Secrets (Run these commands):
```bash
# Generate NEXTAUTH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Database (Choose one option):

#### Option A: Use Vercel Postgres (Recommended for quick setup)
- Click "Add New" → "Postgres" in Vercel Dashboard
- It will automatically add DATABASE_URL

#### Option B: Use External Database
```
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

### Optional API Keys (Add as needed):
```
# AI Services
ANTHROPIC_API_KEY=your-key-here
OPENAI_API_KEY=your-key-here

# GitHub Integration
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret

# Email (if using)
EMAIL_FROM=noreply@yourdomain.com
SENDGRID_API_KEY=your-sendgrid-key
```

## Step 3: Configure Environment Scopes
For each variable, select:
- ✅ Production
- ✅ Preview
- ✅ Development

## Step 4: Redeploy
After adding variables:
1. Go to **Deployments** tab
2. Click on the latest deployment
3. Click **Redeploy** → **Redeploy**

## Step 5: Verify
Your app should now be accessible at:
https://crowe-logic-platform-6qe1yjocm-michael-9927s-projects.vercel.app

## Troubleshooting
If still getting errors:
1. Check **Functions** tab for logs
2. Ensure all required variables are set
3. Check build logs in **Deployments** tab