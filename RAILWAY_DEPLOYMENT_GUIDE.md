# Railway Deployment Guide for Sentia Manufacturing Dashboard

## Overview

This guide provides step-by-step instructions for deploying the Sentia Manufacturing Dashboard to Railway via GitHub sync. The application is now ready for production deployment with all enterprise features implemented.

## Prerequisites

- Railway account with appropriate permissions
- GitHub repository access: `The-social-drink-company/sentia-manufacturing-dashboard`
- Environment variables and secrets configured

## Deployment Steps

### 1. Access Railway Dashboard

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Sign in with your Railway account
3. Navigate to your projects or create a new project

### 2. Create New Project from GitHub

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose the repository: `The-social-drink-company/sentia-manufacturing-dashboard`
4. Select the `development` branch
5. Railway will automatically detect the `railway.toml` configuration

### 3. Configure Environment Variables

Set the following environment variables in Railway:

#### Core Configuration
```
NODE_ENV=production
PORT=$PORT
```

#### Database Configuration
```
DATABASE_URL=$DATABASE_URL
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20
DATABASE_TIMEOUT=30000
```

#### Security Configuration
```
JWT_SECRET=$JWT_SECRET
ENCRYPTION_KEY=$ENCRYPTION_KEY
SESSION_SECRET=$SESSION_SECRET
```

#### AI Services
```
OPENAI_API_KEY=$OPENAI_API_KEY
OPENAI_API_BASE=$OPENAI_API_BASE
ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY
```

#### Integration APIs
```
UNLEASHED_API_ID=$UNLEASHED_API_ID
UNLEASHED_API_KEY=$UNLEASHED_API_KEY
UNLEASHED_API_URL=$UNLEASHED_API_URL

SHOPIFY_UK_API_KEY=$SHOPIFY_UK_API_KEY
SHOPIFY_UK_SECRET=$SHOPIFY_UK_SECRET
SHOPIFY_UK_ACCESS_TOKEN=$SHOPIFY_UK_ACCESS_TOKEN
SHOPIFY_UK_SHOP_URL=$SHOPIFY_UK_SHOP_URL

SHOPIFY_USA_API_KEY=$SHOPIFY_USA_API_KEY
SHOPIFY_USA_SECRET=$SHOPIFY_USA_SECRET
SHOPIFY_USA_ACCESS_TOKEN=$SHOPIFY_USA_ACCESS_TOKEN
SHOPIFY_USA_SHOP_URL=$SHOPIFY_USA_SHOP_URL

AMAZON_SP_API_CLIENT_ID=$AMAZON_SP_API_CLIENT_ID
AMAZON_SP_API_CLIENT_SECRET=$AMAZON_SP_API_CLIENT_SECRET
AMAZON_SP_API_REFRESH_TOKEN=$AMAZON_SP_API_REFRESH_TOKEN
AMAZON_UK_MARKETPLACE_ID=$AMAZON_UK_MARKETPLACE_ID
AMAZON_USA_MARKETPLACE_ID=$AMAZON_USA_MARKETPLACE_ID

XERO_API_KEY=$XERO_API_KEY
XERO_SECRET=$XERO_SECRET
```

#### Communication Services
```
SLACK_BOT_TOKEN=$SLACK_BOT_TOKEN
MS_ADMIN_EMAIL=admin@app.sentiaspirits.com
MS_DATA_EMAIL=data@app.sentiaspirits.com
MS_API_KEY=$MS_API_KEY
MS_API_SECRET=$MS_API_SECRET
```

#### Performance & Monitoring
```
MONITORING_ENABLED=true
PERFORMANCE_OPTIMIZATION=true
AUTO_SCALING=true
CACHE_ENABLED=true
REDIS_URL=$REDIS_URL
```

### 4. Configure Custom Domain (Optional)

1. In Railway project settings, go to "Domains"
2. Add custom domain: `sentiadeploy.financeflo.ai`
3. Configure DNS settings as instructed by Railway
4. Enable HTTPS (automatic with Railway)

### 5. Deploy and Monitor

1. Railway will automatically start the deployment
2. Monitor the build logs for any issues
3. Check the deployment status in the Railway dashboard
4. Verify the application is running at the provided URL

### 6. Health Check Verification

Once deployed, verify the application health:

- Health endpoint: `https://your-app.railway.app/api/health`
- Test endpoint: `https://your-app.railway.app/api/test`
- Main application: `https://your-app.railway.app/`

## Configuration Files

The repository includes the following Railway-specific configuration:

### railway.toml
```toml
[build]
builder = "nixpacks"
buildCommand = "npm ci && npm run build"

[deploy]
startCommand = "node railway-ultimate.js"
healthcheckPath = "/api/health"
healthcheckTimeout = 300
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3

[env]
NODE_ENV = "production"
PORT = "$PORT"
```

### nixpacks.toml
Additional build configuration for Nixpacks builder.

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check build logs in Railway dashboard
   - Verify all dependencies are properly listed in package.json
   - Ensure Node.js version compatibility

2. **Environment Variable Issues**
   - Verify all required environment variables are set
   - Check for typos in variable names
   - Ensure sensitive values are properly escaped

3. **Health Check Failures**
   - Verify the health check endpoint is responding
   - Check application logs for startup errors
   - Ensure the application is listening on the correct port

4. **Database Connection Issues**
   - Verify DATABASE_URL is correctly configured
   - Check database server accessibility
   - Ensure connection pool settings are appropriate

### Support

For additional support:
- Railway Documentation: https://docs.railway.app/
- Railway Community: https://discord.gg/railway
- Project Repository: https://github.com/The-social-drink-company/sentia-manufacturing-dashboard

## Deployment Status

✅ Repository synced to GitHub development branch
✅ Railway configuration files in place
✅ Environment variables documented
✅ Health check endpoints configured
✅ Ready for Railway deployment

The application is now ready for production deployment on Railway with full enterprise features and monitoring capabilities.

