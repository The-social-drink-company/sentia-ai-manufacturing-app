# Render Service Cleanup & Configuration Guide

## Step 1: Remove Duplicate Service

### Delete `sentia-manufacturing-dashboard`
1. Go to https://dashboard.render.com
2. Click on `sentia-manufacturing-dashboard` service
3. Go to **Settings** tab
4. Scroll down to **Delete Service**
5. Type service name to confirm deletion
6. Click **Delete Service**

## Step 2: Fix Failed Deployments

All three environment services are failing. Here's how to fix each one:

### A. Fix `sentia-manufacturing-development`

1. **Go to Service Settings**:
   - https://dashboard.render.com
   - Click `sentia-manufacturing-development`
   - Go to **Settings** tab

2. **Update Build & Start Commands**:
   ```
   Build Command: npm ci --legacy-peer-deps && npm run build
   Start Command: node server.js
   ```

3. **Connect to Database**:
   - Go to **Environment** tab
   - Update/Add these variables:
   ```
   NODE_ENV=development
   PORT=10000
   DATABASE_URL=<copy connection string from sentia-db-development>
   ```

4. **Get Database Connection String**:
   - Click on `sentia-db-development`
   - Go to **Info** tab
   - Copy **Internal Database URL** (for services in same region)
   - Should look like: `postgresql://user:pass@dpg-xxxxx/dbname`

### B. Fix `sentia-manufacturing-testing`

1. **Service Settings**:
   ```
   Build Command: npm ci --legacy-peer-deps && npm run build
   Start Command: node server.js
   ```

2. **Environment Variables**:
   ```
   NODE_ENV=test
   PORT=10000
   DATABASE_URL=<copy from sentia-db-testing>
   ENABLE_AUTONOMOUS_TESTING=true
   AUTO_FIX_ENABLED=true
   AUTO_DEPLOY_ENABLED=false
   ```

### C. Fix `sentia-manufacturing-production`

1. **Service Settings**:
   ```
   Build Command: npm ci --legacy-peer-deps && npm run build
   Start Command: node server.js
   ```

2. **Environment Variables**:
   ```
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=<copy from sentia-db-production>
   ENABLE_AUTONOMOUS_TESTING=false
   AUTO_FIX_ENABLED=false
   AUTO_DEPLOY_ENABLED=false
   ```

## Step 3: Essential Environment Variables for ALL Services

Add these to each service (development, testing, production):

```bash
# Core (REQUIRED)
NODE_ENV=[development|test|production]
PORT=10000
CORS_ORIGINS=https://[service-name].onrender.com

# Authentication (REQUIRED)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_Y2hhbXBpb24tYnVsbGRvZy05Mi5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_EP6iF7prGbq73CscUPCOW8PAKol4pPaBG5iYdsDodq

# Session (REQUIRED)
SESSION_SECRET=sentia-session-secret-2025
JWT_SECRET=sentia-jwt-secret-2025

# Application (REQUIRED)
VITE_API_BASE_URL=https://[service-name].onrender.com/api
VITE_APP_TITLE=Sentia Manufacturing Dashboard

# AI Services (REQUIRED for AI features)
ANTHROPIC_API_KEY=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
OPENAI_API_KEY=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

# External APIs (Add as needed)
XERO_CLIENT_ID=9C0CAB921C134476A249E48BBECB8C4B
XERO_CLIENT_SECRET=f0TJpJSRX_B9NI51sknz7TuKbbSfhO4dEhTM4m4fWBlph9F5
SHOPIFY_UK_ACCESS_TOKEN=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
SHOPIFY_UK_SHOP_URL=sentiaspirits.myshopify.com
UNLEASHED_API_ID=d5313df6-db35-430c-a69e-ae27dffe0c5a
UNLEASHED_API_KEY=2bJcHlDhIV04ScdqT60c3zlnG7hOER7aoPSh2IF2hWQluOi7ZaGkeu4SGeseYexAqOGfcRmyl9c6QYueJHyQ==
```

## Step 4: Connect GitHub Repository

For each service (if not already connected):

1. Go to service **Settings**
2. Under **Source**, click **Connect Repository**
3. Select: `The-social-drink-company/sentia-manufacturing-dashboard`
4. Set appropriate branch:
   - Development service → `development` branch
   - Testing service → `test` branch
   - Production service → `production` or `main` branch

## Step 5: Trigger Manual Deploy

After updating settings for each service:

1. Go to service dashboard
2. Click **Manual Deploy** → **Deploy latest commit**
3. Monitor logs for errors

## Common Deployment Errors & Fixes

### "Cannot find module" Error
- Ensure `package.json` has all dependencies
- Build command includes: `npm ci --legacy-peer-deps`

### "Port already in use" Error
- Render provides PORT automatically
- Use: `const PORT = process.env.PORT || 3000`

### Database Connection Failed
- Use Internal Database URL for same-region connections
- Ensure `?sslmode=require` in connection string

### Build Timeout
- Increase build timeout in Settings
- Optimize build process

## Service URLs After Setup

- **Development**: https://sentia-manufacturing-development.onrender.com
- **Testing**: https://sentia-manufacturing-testing.onrender.com
- **Production**: https://sentia-manufacturing-production.onrender.com

## Verification Checklist

For each environment, verify:
- [ ] Service shows "Live" status
- [ ] `/health` endpoint returns 200
- [ ] Database connection works
- [ ] Authentication (Clerk) works
- [ ] API endpoints respond

## Final Architecture

```
┌─────────────────────────────────────────┐
│         GitHub Repository               │
│  The-social-drink-company/              │
│  sentia-manufacturing-dashboard         │
└──────────┬──────────┬──────────┬───────┘
           │          │          │
    development    test    production
           │          │          │
           ▼          ▼          ▼
┌──────────────┐ ┌──────────┐ ┌──────────┐
│ Development  │ │  Testing │ │Production│
│  Web Service │ │   Web    │ │   Web    │
└──────┬───────┘ └────┬─────┘ └────┬─────┘
       │              │             │
       ▼              ▼             ▼
┌──────────────┐ ┌──────────┐ ┌──────────┐
│   Dev DB     │ │ Test DB  │ │ Prod DB  │
│ PostgreSQL   │ │PostgreSQL│ │PostgreSQL│
└──────────────┘ └──────────┘ └──────────┘
```

---

**IMPORTANT**: Render provides PORT automatically (usually 10000). Don't hardcode it!