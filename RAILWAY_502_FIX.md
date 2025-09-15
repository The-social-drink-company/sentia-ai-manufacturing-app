# Railway 502 Bad Gateway Fix Guide

## Current Issue
The application at https://sentiadeploy.financeflo.ai is returning 502 Bad Gateway

## Root Causes & Solutions

### 1. ✅ Docker Removed - Using Nixpacks
- **Status**: FIXED
- Removed Dockerfile, .dockerignore, railway-ultimate.js
- Railway now uses Nixpacks builder
- package.json start script points to server.js

### 2. ⚠️ Environment Variables Not Set
- **Status**: NEEDS ACTION
- **Solution**: Add all required environment variables in Railway Dashboard

### Required Environment Variables Checklist

Go to: https://railway.app/project/6d1ca9b2-75e2-46c6-86a8-ed05161112fe/service/e985e174-ebed-4043-81f8-7b1ab2e86cd2/settings

Navigate to the **Variables** tab and add these:

#### Minimum Required for App to Start:
```
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://neondb_owner:npg_2wXVD9gdintm@ep-shiny-dream-ab2zho2p-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
VITE_CLERK_PUBLISHABLE_KEY=pk_test_Y2hhbXBpb24tYnVsbGRvZy05Mi5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_EP6iF7prGbq73CscUPCOW8PAKol4pPaBG5iYdsDodq
SESSION_SECRET=dev_session_secret_xY9wV3uT1rS8pQ6nM4kL2jH5gF3dC1aZ
JWT_SECRET=dev_jwt_secret_bN8mK6jH4gF2dC0aZ9xW7vB5rT3qE1pL
VITE_API_BASE_URL=https://sentiadeploy.financeflo.ai/api
VITE_APP_TITLE=Sentia Manufacturing Dashboard - Development
```

## Troubleshooting Steps

### Step 1: Check Railway Build Logs
1. Go to Railway Dashboard
2. Click on your service
3. Go to **Deployments** tab
4. Click on the latest deployment
5. Check **Build Logs** for errors

Common Build Issues:
- Missing dependencies → Check package.json
- Build command failed → Verify npm run build works locally
- Out of memory → Contact Railway support

### Step 2: Check Railway Deploy Logs
1. In the same deployment view
2. Check **Deploy Logs** tab
3. Look for startup errors

Common Deploy Issues:
- "Cannot connect to database" → Check DATABASE_URL
- "Missing required environment variable" → Add missing variables
- "Port already in use" → Railway provides PORT automatically
- "Module not found" → Dependencies not installed properly

### Step 3: Verify Nixpacks Configuration
Railway should automatically detect:
- **Build Command**: `npm ci && npm run build`
- **Start Command**: `npm start` (runs server.js)

If not detected:
1. Go to Settings → Build & Deploy
2. Set Build Command: `npm ci && npm run build`
3. Set Start Command: `npm start`

### Step 4: Test Health Endpoints
Once deployed, test:
```bash
# Basic health check
curl https://sentiadeploy.financeflo.ai/health

# API health check
curl https://sentiadeploy.financeflo.ai/api/health

# Main application
curl https://sentiadeploy.financeflo.ai
```

### Step 5: If Still 502 After Variables Added

1. **Restart the service**:
   - Go to Settings → Danger Zone
   - Click "Restart Service"

2. **Redeploy from GitHub**:
   - Push a small change to trigger redeploy:
   ```bash
   git commit --allow-empty -m "Trigger Railway redeploy"
   git push origin development
   ```

3. **Check Custom Domain**:
   - Verify sentiadeploy.financeflo.ai is properly configured
   - Check DNS settings point to Railway

4. **Check Service Resources**:
   - Ensure service has enough memory/CPU
   - Default should be sufficient for Node.js app

## Files Configured for Railway

✅ **package.json**
- start script: `"start": "node server.js"`

✅ **railway.json**
- Builder: NIXPACKS
- Health check path: /health
- Domain: sentiadeploy.financeflo.ai

✅ **server.js**
- Listens on process.env.PORT
- Health endpoints at /health and /api/health
- Binds to 0.0.0.0 (required for Railway)

❌ **Removed Files**
- Dockerfile (forces Nixpacks)
- .dockerignore
- railway-ultimate.js

## Quick Commands

### Check deployment status locally:
```bash
# Test health endpoint
curl -I https://sentiadeploy.financeflo.ai/health

# Check if server is responding
curl https://sentiadeploy.financeflo.ai/api/health
```

### Railway CLI commands:
```bash
# Link to project (already done)
railway link --project 6d1ca9b2-75e2-46c6-86a8-ed05161112fe

# Check status
railway status

# Open Railway dashboard
railway open
```

## Expected Working State

When properly configured, you should see:

1. **Build logs**:
   - "Installing dependencies..."
   - "Building application..."
   - "Build successful"

2. **Deploy logs**:
   - "Starting server on 0.0.0.0:3000"
   - "Server listening on http://0.0.0.0:3000"
   - "Database connected"

3. **Health endpoint response**:
   ```json
   {
     "status": "healthy",
     "timestamp": "2025-09-15T...",
     "port": 3000,
     "environment": "development"
   }
   ```

## Contact for Help

If issues persist after following all steps:
1. Check Railway Status: https://status.railway.app/
2. Railway Discord: https://discord.gg/railway
3. Review deployment logs for specific errors

---

**Last Updated**: 2025-09-15
**Current Status**: Awaiting environment variables to be added in Railway Dashboard
**Next Action**: Add all required environment variables listed above