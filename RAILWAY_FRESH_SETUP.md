# Railway Fresh Project Setup Guide

## Prerequisites
- GitHub repository: https://github.com/The-social-drink-company/sentia-manufacturing-dashboard
- Railway account: https://railway.app

## Step 1: Create New Railway Project

1. Go to https://railway.app/new
2. Click "Deploy from GitHub repo"
3. Select your repository: `The-social-drink-company/sentia-manufacturing-dashboard`
4. Name your project: `sentia-manufacturing-fresh`

## Step 2: Configure Services

### Create Three Environments
1. In Railway dashboard, click "Settings" → "Environments"
2. Create environments:
   - `development` (default)
   - `test`
   - `production`

### Configure Each Environment

#### Development Environment
1. Click on `development` environment
2. Go to "Variables" tab
3. Add these variables:
```
PORT=5000
NODE_ENV=development
RAILWAY_ENVIRONMENT=development
DATABASE_URL=<your-neon-dev-database-url>
CLERK_PUBLISHABLE_KEY=<your-clerk-publishable-key>
CLERK_SECRET_KEY=<your-clerk-secret-key>
```

#### Test Environment
1. Click on `test` environment
2. Add variables:
```
PORT=5000
NODE_ENV=test
RAILWAY_ENVIRONMENT=test
DATABASE_URL=<your-neon-test-database-url>
CLERK_PUBLISHABLE_KEY=<your-clerk-publishable-key>
CLERK_SECRET_KEY=<your-clerk-secret-key>
```

#### Production Environment
1. Click on `production` environment
2. Add variables:
```
PORT=5000
NODE_ENV=production
RAILWAY_ENVIRONMENT=production
DATABASE_URL=<your-neon-prod-database-url>
CLERK_PUBLISHABLE_KEY=<your-clerk-publishable-key>
CLERK_SECRET_KEY=<your-clerk-secret-key>
```

## Step 3: Configure Service Settings

1. Go to your service settings
2. Click "Settings" tab
3. Configure:
   - **Start Command**: Leave empty (uses Dockerfile CMD)
   - **Build Command**: Leave empty (uses Dockerfile)
   - **Root Directory**: `/`
   - **Watch Paths**: Leave default

## Step 4: Configure Networking

1. Go to "Networking" tab
2. Set:
   - **Port**: `5000` (not auto)
   - **Health Check Path**: `/health`
   - **Health Check Timeout**: `30`

## Step 5: Deploy

### Deploy to Development
1. Make sure you're in `development` environment
2. Click "Deploy" → "Deploy from GitHub"
3. Select branch: `development`
4. Click "Deploy"

### Deploy to Test
1. Switch to `test` environment
2. Click "Deploy" → "Deploy from GitHub"
3. Select branch: `test`
4. Click "Deploy"

### Deploy to Production
1. Switch to `production` environment
2. Click "Deploy" → "Deploy from GitHub"
3. Select branch: `production`
4. Click "Deploy"

## Step 6: Set Up Custom Domains (Optional)

### Development
- Default: `<service-name>-development.up.railway.app`
- Custom: `dev.yourdomain.com`

### Test
- Default: `<service-name>-test.up.railway.app`
- Custom: `test.yourdomain.com`

### Production
- Default: `<service-name>-production.up.railway.app`
- Custom: `app.yourdomain.com`

## Step 7: Verify Deployment

1. Check build logs for any errors
2. Visit the URL provided by Railway
3. Test health endpoint: `https://your-url.railway.app/health`
4. Test API endpoint: `https://your-url.railway.app/api/health`

## Troubleshooting

### 502 Bad Gateway
- Check PORT is set to 5000 in environment variables
- Verify networking tab shows Port: 5000
- Check build logs for errors
- Restart the service

### Build Failures
- Check npm dependencies are installing
- Verify Dockerfile is using `--legacy-peer-deps`
- Check build logs for specific errors

### Application Not Starting
- Check start command in logs
- Verify PORT environment variable is set
- Check for runtime errors in logs

## Git Workflow

```bash
# Development
git checkout development
git add .
git commit -m "Your changes"
git push origin development

# Test (after development is stable)
git checkout test
git merge development
git push origin test

# Production (after test approval)
git checkout production
git merge test
git push origin production
```

## Environment Variables Reference

### Required Variables
- `PORT`: 5000 (Railway will override if needed)
- `NODE_ENV`: development|test|production
- `DATABASE_URL`: PostgreSQL connection string
- `CLERK_PUBLISHABLE_KEY`: Clerk authentication
- `CLERK_SECRET_KEY`: Clerk authentication

### Optional Variables
- `REDIS_URL`: Redis connection for caching
- `XERO_CLIENT_ID`: Xero integration
- `XERO_CLIENT_SECRET`: Xero integration
- `SHOPIFY_API_KEY`: Shopify integration
- `SHOPIFY_API_SECRET`: Shopify integration
- `OPENAI_API_KEY`: OpenAI integration
- `ANTHROPIC_API_KEY`: Anthropic Claude integration

## Success Indicators

✅ Build completes without errors
✅ Container starts successfully
✅ Health check passes (returns 200)
✅ Application accessible via Railway URL
✅ API endpoints responding with JSON
✅ Frontend loads correctly

## Support

- Railway Documentation: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- GitHub Issues: https://github.com/The-social-drink-company/sentia-manufacturing-dashboard/issues