# 🚂 Railway Quick Start Guide - 5 Minutes to Deploy!

## Prerequisites ✅
- GitHub repository connected
- Railway account created
- Database URL ready (Neon/PostgreSQL)

## Step 1: Create New Railway Project (1 minute)

1. Go to: https://railway.app/new
2. Click **"Deploy from GitHub repo"**
3. Select: `The-social-drink-company/sentia-manufacturing-dashboard`
4. Choose branch: `development`

## Step 2: Configure Service (2 minutes)

### A. Go to Settings Tab
- **Start Command**: Leave empty (uses Dockerfile)
- **Build Command**: Leave empty (uses Dockerfile)
- **Root Directory**: `/`

### B. Go to Networking Tab
- Click **"Generate Domain"**
- Set **Port**: `5000` (⚠️ NOT auto - type 5000)
- Set **Health Check Path**: `/health`

### C. Go to Variables Tab
Add these environment variables:
```
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://...your-neon-url...
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

## Step 3: Deploy (2 minutes)

1. Click **"Deploy"** button
2. Watch build logs for any errors
3. Wait for "Deployment live" message
4. Click on generated URL to test

## Expected Results ✅

### Success Indicators:
- Build completes in ~2 minutes
- No red errors in logs
- URL shows Sentia dashboard
- `/health` returns JSON response
- `/api/health` returns status "ok"

### Common Issues & Fixes:

**502 Bad Gateway**
- Check PORT is set to 5000 in Variables
- Check Networking tab shows Port: 5000
- Restart service from Settings

**Build Failures**
- Check for npm errors in logs
- Verify Dockerfile exists
- Check package.json is valid

**Application Not Loading**
- Wait 30 seconds after deploy
- Check browser console for errors
- Verify database is connected

## Test Your Deployment

Visit these URLs (replace with your domain):
- `https://your-app.up.railway.app` - Main dashboard
- `https://your-app.up.railway.app/health` - Health check
- `https://your-app.up.railway.app/api/health` - API health

## Multiple Environments

### For Test Environment:
1. Create new service in same project
2. Connect to `test` branch
3. Change NODE_ENV to `test`
4. Use test database URL

### For Production:
1. Create new service
2. Connect to `production` branch
3. Change NODE_ENV to `production`
4. Use production database URL

## Troubleshooting Commands

Check deployment locally:
```bash
# Test server
PORT=5000 node railway-ultimate.js

# Build locally
npm run build

# Check for errors
npm audit
```

## Need Help?

1. Check build logs in Railway dashboard
2. Verify all environment variables are set
3. Ensure PORT is 5000 everywhere
4. Try redeploying from Railway dashboard

## Success! 🎉

Once deployed, you'll have:
- Live dashboard at your Railway URL
- Automatic deploys on git push
- SSL certificate included
- Global CDN distribution

---

**Time to deploy: ~5 minutes**
**Time to configure: ~2 minutes**
**Total: Less than 10 minutes to production!**