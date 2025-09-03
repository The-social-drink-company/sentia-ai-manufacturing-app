# Railway Deployment Fix Guide

## Issues Identified

1. **Missing Environment Variables**: `CLERK_SECRET_KEY` and `VITE_CLERK_PUBLISHABLE_KEY` not set
2. **Blank Screen**: Frontend not loading due to missing environment variables
3. **Unleashed API**: Missing API credentials causing service limitations

## Required Environment Variables for Railway

### For ALL Environments (Development, Test, Production):

#### Required Variables:
```bash
# Clerk Authentication (CRITICAL - without these, app shows blank screen)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here

# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Node.js
NODE_ENV=production
PORT=5000
```

#### Optional Variables:
```bash
# Unleashed API (for inventory integration)
UNLEASHED_API_ID=your_api_id
UNLEASHED_API_KEY=your_api_key

# CORS (adjust for your domains)
CORS_ORIGINS=https://sentiaprod.financeflo.ai,https://sentiatest.financeflo.ai,https://sentiadeploy.financeflo.ai

# Logging
LOG_LEVEL=info
```

## Railway Setup Instructions

### 1. Access Railway Dashboard
- Go to [Railway Dashboard](https://railway.app/dashboard)
- Navigate to your project: `sentia-manufacturing-dashboard`

### 2. Configure Environment Variables

#### For Development Environment (sentiadeploy.financeflo.ai):
1. Go to the development service
2. Click on "Variables" tab
3. Add these variables:

```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_development_key
CLERK_SECRET_KEY=sk_test_your_development_key
DATABASE_URL=your_development_database_url
NODE_ENV=production
PORT=5000
CORS_ORIGINS=https://sentiadeploy.financeflo.ai
```

#### For Test Environment (sentiatest.financeflo.ai):
1. Go to the test service
2. Click on "Variables" tab
3. Add these variables:

```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_test_key
CLERK_SECRET_KEY=sk_test_your_test_key
DATABASE_URL=your_test_database_url
NODE_ENV=production
PORT=5000
CORS_ORIGINS=https://sentiatest.financeflo.ai
```

#### For Production Environment (sentiaprod.financeflo.ai):
1. Go to the production service
2. Click on "Variables" tab
3. Add these variables:

```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_live_your_production_key
CLERK_SECRET_KEY=sk_live_your_production_key
DATABASE_URL=your_production_database_url
NODE_ENV=production
PORT=5000
CORS_ORIGINS=https://sentiaprod.financeflo.ai
```

### 3. Get Clerk Keys

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your project
3. Go to "API Keys" section
4. Copy:
   - **Publishable Key** (starts with `pk_test_` or `pk_live_`)
   - **Secret Key** (starts with `sk_test_` or `sk_live_`)

### 4. Database Setup

If you don't have databases set up:

1. Go to [Neon Console](https://console.neon.tech)
2. Create three databases:
   - `sentia-dev-db`
   - `sentia-test-db`
   - `sentia-prod-db`
3. Copy connection strings to Railway environment variables

### 5. Redeploy Services

After setting environment variables:

1. Go to each service in Railway
2. Click "Deploy" to trigger a new deployment
3. Monitor the deployment logs

## Verification Steps

### 1. Check Health Endpoints
Visit these URLs to verify the backend is working:
- `https://sentiadeploy.financeflo.ai/health`
- `https://sentiatest.financeflo.ai/health`
- `https://sentiaprod.financeflo.ai/health`

### 2. Check API Endpoints
- `https://sentiadeploy.financeflo.ai/api/test`
- `https://sentiatest.financeflo.ai/api/test`
- `https://sentiaprod.financeflo.ai/api/test`

### 3. Check Frontend
- `https://sentiadeploy.financeflo.ai/` (should show dashboard, not blank screen)
- `https://sentiatest.financeflo.ai/`
- `https://sentiaprod.financeflo.ai/`

## Troubleshooting

### If Still Getting Blank Screen:
1. Check browser console for JavaScript errors
2. Verify `VITE_CLERK_PUBLISHABLE_KEY` is set correctly
3. Check Railway deployment logs for build errors

### If Authentication Not Working:
1. Verify both `VITE_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` are set
2. Ensure keys match between frontend and backend
3. Check Clerk dashboard for any configuration issues

### If Database Errors:
1. Verify `DATABASE_URL` is correctly formatted
2. Check database connection from Railway logs
3. Ensure database is accessible from Railway's IP ranges

## Expected Results

After fixing environment variables:
- ✅ No more "CLERK_SECRET_KEY missing" warnings
- ✅ No more "Unleashed API credentials not found" warnings
- ✅ Frontend loads properly (no blank screen)
- ✅ Authentication works
- ✅ All three environments accessible

## Next Steps

1. Set up the environment variables as described above
2. Redeploy all three services
3. Test each environment
4. Set up monitoring and alerts
5. Configure domain names if needed
