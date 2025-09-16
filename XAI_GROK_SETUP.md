# ⚡ xAI Grok Code Fast Setup Guide

## 🚀 Platform Updated for Grok Code Fast!

Your Crowe Logic Platform has been configured to use **xAI's Grok Code Fast** model instead of Claude. This model excels at agentic coding with:

- **256,000 token context window** - Handle massive codebases
- **Reasoning capabilities** - The model thinks before responding
- **Function calling** - Connect to external tools and systems
- **Structured outputs** - Get organized, formatted responses
- **Fast performance** - Optimized for speed

## 💰 Pricing Advantage

Grok Code Fast is very economical:
- **Input**: $0.20 per 1M tokens
- **Cached Input**: $0.02 per 1M tokens (90% cheaper!)
- **Output**: $1.50 per 1M tokens

## 🔑 Quick Setup Instructions

### Step 1: Get Your xAI API Key

1. **Go to**: https://console.x.ai/
2. **Sign in** or create an account
3. **Navigate to** API Keys section
4. **Click** "Create API Key"
5. **Copy** your API key

### Step 2: Add Your API Key

Edit the `.env.local` file:

```bash
# Location
C:\Users\micha\crowe-logic-platform\.env.local

# Find this line (line 19):
XAI_API_KEY=your_xai_api_key_here

# Replace with your actual key:
XAI_API_KEY=xai-xxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 3: Restart Development Server

```bash
# Stop current server (Ctrl+C)
# Restart
npm run dev
```

## ✅ What's Been Updated

1. **Environment Configuration** - `.env.local` now expects XAI_API_KEY
2. **API Route** - `/api/ai` route updated to use xAI's Grok endpoint
3. **AI Chat Interface** - Welcome message mentions Grok Code Fast
4. **Model Configuration** - Default model set to `grok-code-fast-1`

## 🎯 Features Available

Once you add your API key, you'll have access to:

### In the IDE (`/ide`):
- **AI Code Assistant** - Generate and debug code
- **Code Analysis** - Get refactoring suggestions
- **Autonomous Coding** - Multi-step task execution
- **Performance Optimization** - Speed improvements
- **Test Generation** - Comprehensive test suites

### Model Capabilities:
- **Function Calling** - Integrate with external tools
- **Structured Outputs** - Get formatted JSON responses
- **Reasoning Mode** - Model thinks through problems
- **256K Context** - Analyze entire projects

## 📊 Rate Limits

Your xAI account includes generous limits:
- **480 requests per minute**
- **2,000,000 tokens per minute**

## 🧪 Testing Your Setup

After adding your API key:

1. Open the IDE: http://localhost:3000/ide
2. Click on the AI panel (brain icon)
3. Try asking: "Generate a Python function to calculate fibonacci numbers"
4. You should get a response from Grok!

## 🔧 Troubleshooting

### API Key Not Working?
- Ensure no quotes or spaces around the key
- Verify the key starts with `xai-`
- Check that the key is active in your xAI console

### Still Getting Errors?
Check the console for error messages:
```bash
# In your terminal running npm run dev
# Look for "xAI API error" messages
```

## 📚 API Documentation

- **xAI Docs**: https://docs.x.ai/
- **Model Info**: https://x.ai/models/grok-code-fast-1
- **API Reference**: https://docs.x.ai/api

## 🔄 Switching Back to Claude (Optional)

If you want to switch back to Claude later:

1. Edit `.env.local`:
   - Comment out: `# XAI_API_KEY=...`
   - Uncomment: `ANTHROPIC_API_KEY=...`

2. Revert `/src/app/api/ai/route.ts` to the Claude version

## 🎉 Ready to Code!

Your platform is now powered by Grok Code Fast. Add your API key and experience:
- ⚡ Lightning-fast code generation
- 🧠 Reasoning-powered debugging
- 🤖 Autonomous multi-step coding
- 📊 256K token context window

---

**Need Help?**
- xAI Support: https://x.ai/support
- API Status: https://status.x.ai/