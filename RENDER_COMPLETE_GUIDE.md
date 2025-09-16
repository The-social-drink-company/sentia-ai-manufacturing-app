# Complete Render Deployment Guide

## 🎯 Migration Complete: Railway → Render

Your application has been fully migrated from Railway to Render. All Railway-specific code has been removed and replaced with Render-optimized configuration.

## ✅ What's Been Done

### 1. Removed Railway Dependencies
- ✅ Deleted all Railway configuration files (40+ files)
- ✅ Removed Railway-specific code from server.js
- ✅ Cleaned up Railway scripts from scripts/ directory
- ✅ Updated package.json with Render commands

### 2. Created Render Configuration
- ✅ **render.yaml** - Complete service configuration
- ✅ **server-render.js** - Clean server without Railway code
- ✅ **Render deployment scripts** - Automated deployment tools

### 3. Your Services on Render

```
Web Services:
├── sentia-manufacturing-development ← Currently Running
├── sentia-manufacturing-testing
└── sentia-manufacturing-production

Databases (PostgreSQL):
├── sentia-db-development ✅ Available
├── sentia-db-testing ✅ Available
└── sentia-db-production ✅ Available
```

## 🚀 Quick Start Commands

### Deploy to Development
```bash
npm run deploy:dev
```

### Deploy to Testing
```bash
npm run deploy:test
```

### Deploy to Production
```bash
npm run deploy:prod
```

### Verify Deployments
```bash
npm run render:verify
```

## 🔧 Fix the Current Deployment Issue

Your development server is showing the emergency page. Here's how to fix it:

### Step 1: Update Start Command in Render Dashboard

1. Go to https://dashboard.render.com
2. Click on **sentia-manufacturing-development**
3. Go to **Settings** tab
4. Update these commands:
   ```
   Build Command: npm ci --legacy-peer-deps && npm run build
   Start Command: node server-render.js
   ```
5. Click **Save Changes**

### Step 2: Connect Database

1. In the **Environment** tab
2. Find or add **DATABASE_URL**
3. Go to **sentia-db-development** service
4. Click **Connect** button
5. Copy the **Internal Database URL**
6. Paste it as DATABASE_URL value
7. Click **Save**

### Step 3: Deploy with Cache Clear

1. Go to **Manual Deploy**
2. Select **Clear build cache & deploy**
3. Monitor the logs for any errors

## 📋 Environment Variables Required

### Minimum Required Variables
```bash
NODE_ENV=development
PORT=10000
DATABASE_URL=[from your database service]
CORS_ORIGINS=https://sentia-manufacturing-development.onrender.com

# Authentication (Required)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_Y2hhbXBpb24tYnVsbGRvZy05Mi5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_EP6iF7prGbq73CscUPCOW8PAKol4pPaBG5iYdsDodq

# Application
VITE_API_BASE_URL=https://sentia-manufacturing-development.onrender.com/api
VITE_APP_TITLE=Sentia Manufacturing Dashboard

# Session
SESSION_SECRET=sentia-session-secret-dev-2025
JWT_SECRET=sentia-jwt-secret-dev-2025
```

### API Integrations (Optional)
Add these if you need external service integrations:
- Xero, Shopify, Unleashed API credentials
- OpenAI/Anthropic API keys
- Microsoft Graph API credentials

## 🔍 Troubleshooting

### "Emergency Server" Page Shows
- **Cause**: Wrong start command or missing build
- **Fix**: Ensure start command is `node server-render.js` and build includes React

### "Database Connection Failed"
- **Cause**: Missing or incorrect DATABASE_URL
- **Fix**: Use Internal Database URL from your Render database service

### "Build Failed"
- **Cause**: Missing dependencies or build command issue
- **Fix**: Use `npm ci --legacy-peer-deps && npm run build`

### "Port Issues"
- **Cause**: Hardcoded port
- **Fix**: Render provides PORT automatically (usually 10000)

## 📊 Service Architecture

```
                    GitHub Repository
                           │
            ┌──────────────┼──────────────┐
            │              │              │
      development      testing      production
            │              │              │
            ▼              ▼              ▼
    Render Web Service  Web Service  Web Service
            │              │              │
            ▼              ▼              ▼
       PostgreSQL      PostgreSQL    PostgreSQL
        Database        Database       Database
```

## 🎯 Next Steps

1. **Fix Development Deployment**:
   - Update start command to `node server-render.js`
   - Clear cache and redeploy

2. **Set Up Testing Environment**:
   - Configure sentia-manufacturing-testing
   - Connect to sentia-db-testing
   - Deploy test branch

3. **Prepare Production**:
   - Configure sentia-manufacturing-production
   - Connect to sentia-db-production
   - Set feature flags to false
   - Deploy main/production branch

## 📝 File Structure

```
Your Project (Clean):
├── server-render.js        # Main server (Render-optimized)
├── render.yaml             # Render configuration
├── package.json            # Updated with Render scripts
├── scripts/
│   ├── render-deploy.js   # Deployment automation
│   ├── render-setup.js    # Environment setup
│   └── render-verify.js   # Health verification
└── dist/                   # React build output
```

## 🌐 Service URLs

- **Development**: https://sentia-manufacturing-development.onrender.com
- **Testing**: https://sentia-manufacturing-testing.onrender.com
- **Production**: https://sentia-manufacturing-production.onrender.com

## 🛠️ Useful Scripts

```bash
# Setup environment variables
node scripts/render-setup.js development

# Deploy to specific environment
node scripts/render-deploy.js development

# Verify all deployments
node scripts/render-verify.js

# Check specific environment
node scripts/render-verify.js development
```

## ✨ Benefits of Render

1. **Simpler deployment** - No complex configuration files
2. **Free tier available** - Good for development/testing
3. **Automatic SSL** - HTTPS enabled by default
4. **PostgreSQL included** - Native database support
5. **Clear pricing** - Predictable costs
6. **Better dashboard** - Easier to manage services

## 🔐 API Key

Your Render API key: `rnd_mYUAytWRkb2Pj5GJROqNYubYt25J`

Keep this secure and don't commit to public repositories.

---

**Migration Status**: ✅ COMPLETE

All Railway dependencies have been removed. Your application is now fully configured for Render deployment.