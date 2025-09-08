# 🚨 CRITICAL: Railway Blank Screen Fix Instructions

## Problem
Railway deployments are showing blank screens because **CLERK_SECRET_KEY** and **VITE_CLERK_PUBLISHABLE_KEY** environment variables are missing.

## ✅ Localhost Status: FIXED
- Frontend running on http://localhost:3001/ 
- Backend running on port 5000
- Emergency red app is visible (not blank)
- All fixes have been committed and pushed

## 🔧 Railway Environment Variables - URGENT FIX

### Option 1: Railway Web Dashboard (Recommended)
1. Go to https://railway.app/dashboard
2. Select your project: **Sentia Manufacturing Dashboard**
3. Click on your service
4. Go to **Variables** tab
5. Add these CRITICAL variables:

```bash
CLERK_SECRET_KEY=sk_test_EP6iF7prGbq73CscUPCOW8PAKol4pPaBG5iYdsDodq
VITE_CLERK_PUBLISHABLE_KEY=pk_test_Y2hhbXBpb24tYnVsbGRvZy05Mi5jbGVyay5hY2NvdW50cy5kZXYk
NODE_ENV=production
DATABASE_URL=postgresql://neondb_owner:npg_2wXVD9gdintm@ep-shiny-dream-ab2zho2p-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
CORS_ORIGINS=https://sentiaprod.financeflo.ai,https://sentiatest.financeflo.ai,https://sentiadeploy.financeflo.ai
```

### Option 2: Railway CLI (If Available)
```bash
# Install Railway CLI (if not installed)
npm install -g @railway/cli

# Login to Railway
railway login

# Link to project
railway link

# Set critical environment variables
railway variables set CLERK_SECRET_KEY="sk_test_EP6iF7prGbq73CscUPCOW8PAKol4pPaBG5iYdsDodq"
railway variables set VITE_CLERK_PUBLISHABLE_KEY="pk_test_Y2hhbXBpb24tYnVsbGRvZy05Mi5jbGVyay5hY2NvdW50cy5kZXYk"
railway variables set NODE_ENV="production"
railway variables set DATABASE_URL="postgresql://neondb_owner:npg_2wXVD9gdintm@ep-shiny-dream-ab2zho2p-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

## 🎯 Expected Result After Setting Variables
- **BEFORE**: Blank white screens on all Railway URLs
- **AFTER**: Bright red emergency app visible with "🚨 EMERGENCY WORKING APP 🚨"

## 🔍 Verify Fix
1. Set the environment variables above
2. Trigger new Railway deployment
3. Visit your Railway URLs:
   - Development: https://dev.sentia-manufacturing.railway.app
   - Test: https://test.sentia-manufacturing.railway.app  
   - Production: https://sentia-manufacturing.railway.app
4. You should see the bright red emergency app instead of blank screens

## 📋 All Deployment URLs to Test
Once environment variables are set, test these URLs:
- https://dev.sentia-manufacturing.railway.app/
- https://dev.sentia-manufacturing.railway.app/dashboard
- https://dev.sentia-manufacturing.railway.app/admin
- https://dev.sentia-manufacturing.railway.app/test

## ⚡ Quick Test Commands
```bash
# Test Railway deployments after fix
curl -I https://dev.sentia-manufacturing.railway.app/
curl -I https://test.sentia-manufacturing.railway.app/
curl -I https://sentia-manufacturing.railway.app/
```

## 🚀 Next Steps After Railway Fix
1. ✅ Emergency fixes committed and pushed
2. 🔧 Set Railway environment variables (IN PROGRESS)
3. ✅ Verify all environments show content (not blank)
4. 🔄 Restore full dashboard functionality
5. 📋 Create PRs for test and production branches