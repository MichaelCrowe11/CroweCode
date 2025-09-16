# 🔑 API Setup Guide for Crowe Logic Platform

## Current Issue
The AI features are showing a 401 authentication error because the API keys are not configured.

## Quick Fix Instructions

### 1. Get Your Claude API Key
1. Go to https://console.anthropic.com/
2. Sign in or create an account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-ant-api...`)

### 2. Update Your Environment Variables
Edit the `.env.local` file and replace the placeholder with your actual key:

```env
# BEFORE (current state)
ANTHROPIC_API_KEY=your_claude_api_key_here

# AFTER (with your actual key)
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxx
```

### 3. Optional: Add OpenAI API Key
If you want to use GPT models as well:
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Add it to `.env.local`:
```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
```

### 4. Restart the Development Server
After updating the `.env.local` file:

```bash
# Stop the current server (Ctrl+C)
# Then restart it
npm run dev
```

## Features That Will Work After Setup

Once you add the API keys, these features will become available:

1. **AI Code Assistant** in the IDE
   - Code completion suggestions
   - Bug detection and fixes
   - Refactoring recommendations
   - Documentation generation

2. **AI Chat Panel**
   - Ask questions about your code
   - Get explanations
   - Request code examples
   - Debug assistance

3. **Smart Code Analysis**
   - Performance optimization suggestions
   - Security vulnerability detection
   - Best practices recommendations

## Troubleshooting

### Still Getting 401 Error?
- Make sure there are no spaces or quotes around your API key
- Verify the key starts with `sk-ant-api` for Claude
- Check that the key is active in your Anthropic console

### Model Deprecation Warning
The current code uses `claude-3-opus-20240229` which shows a deprecation warning. 
To fix this, update the model in `/src/app/api/ai/route.ts`:

```typescript
// Change from:
const { messages, model = "claude-3-opus-20240229", temperature = 0.7, action, code, language, filePath } = await request.json();

// To (using newer model):
const { messages, model = "claude-3-opus-20240229", temperature = 0.7, action, code, language, filePath } = await request.json();
// Or use: "claude-3-sonnet-20240229" for a faster, cheaper option
```

## Testing the API

After setup, you can test the AI features:

1. Open the IDE: http://localhost:3000/ide
2. Click on the AI panel (brain icon)
3. Type a question or request
4. If it works, you'll get a response from Claude!

## Environment Variables Reference

```env
# Required for AI features
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxx

# Optional - for GPT models
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx

# Already configured for Oracle
ORACLE_CLIENT_PATH=C:\Users\micha\oracle\instantclient_23_9
ORACLE_DB_USER=your_oracle_username
ORACLE_DB_PASSWORD=your_oracle_password
ORACLE_DB_CONNECTION_STRING=hostname:1521/servicename
```

## Security Notes

⚠️ **IMPORTANT**: 
- Never commit your `.env.local` file to git
- Never share your API keys publicly
- The `.gitignore` file already excludes `.env.local`
- Consider using environment variables in production deployments

## Next Steps

1. Add your API key(s) to `.env.local`
2. Restart the development server
3. Test the AI features in the IDE
4. Enjoy your AI-powered development environment!

---
Need an API key? Visit:
- Claude: https://console.anthropic.com/
- OpenAI: https://platform.openai.com/