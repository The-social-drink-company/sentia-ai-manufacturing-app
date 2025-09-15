# Railway Environment Configuration Guide

## Project Information
- **Project Name**: Sentia Manufacturing Dashboard
- **Project ID**: `6d1ca9b2-75e2-46c6-86a8-ed05161112fe`
- **Repository**: https://github.com/The-social-drink-company/sentia-manufacturing-dashboard

## Service IDs & URLs

| Environment | Service ID | URL | Branch |
|------------|------------|-----|--------|
| Development | e985e174-ebed-4043-81f8-7b1ab2e86cd2 | https://sentia-manufacturing-development.up.railway.app | development |
| Testing | 92f7cd2f-3dc7-44f4-abd9-1714003c389f | https://sentia-manufacturing-testing.up.railway.app | test |
| Production | 9fd67b0e-7883-4973-85a5-639d9513d343 | https://sentia-manufacturing-production.up.railway.app | production |

## How to Configure Environment Variables in Railway

### Step 1: Access Railway Dashboard
1. Go to https://railway.app
2. Navigate to your project
3. Select the environment service you want to configure

### Step 2: Add Environment Variables
1. Click on the service (Development/Testing/Production)
2. Go to the "Variables" tab
3. Click "Raw Editor" for bulk import
4. Copy the contents from the appropriate file:
   - Development: `.env.development.railway`
   - Testing: `.env.testing.railway`
   - Production: `.env.production.railway`
5. Paste and click "Save"

### Step 3: Update Production Keys (IMPORTANT)
For production environment, replace these placeholder values with real keys:

#### Authentication
- `VITE_CLERK_PUBLISHABLE_KEY`: Get from Clerk Dashboard
- `CLERK_SECRET_KEY`: Get from Clerk Dashboard
- `CLERK_WEBHOOK_SECRET`: Generate in Clerk Dashboard

#### Database
- `DATABASE_URL`: Your production Neon PostgreSQL URL
- `DATABASE_POOL_URL`: Your production Neon pool URL

#### External APIs
- `XERO_CLIENT_ID`: From Xero Developer App
- `XERO_CLIENT_SECRET`: From Xero Developer App
- `SHOPIFY_API_KEY`: From Shopify Partner Dashboard
- `SHOPIFY_API_SECRET`: From Shopify Partner Dashboard
- `AMAZON_SP_API_KEY`: From Amazon Seller Central
- `UNLEASHED_API_ID`: From Unleashed Software

#### AI Services
- `OPENAI_API_KEY`: From OpenAI Platform
- `ANTHROPIC_API_KEY`: From Anthropic Console
- `GOOGLE_AI_API_KEY`: From Google Cloud Console

#### Security (Generate New Values)
- `SESSION_SECRET`: Generate random 32+ character string
- `JWT_SECRET`: Generate random 32+ character string
- `MCP_JWT_SECRET`: Generate random 32+ character string

## Critical Environment Variables by Service

### All Environments Must Have:
```env
NODE_ENV=[development|test|production]
PORT=5000
DATABASE_URL=postgresql://...
VITE_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
VITE_API_BASE_URL=https://[your-domain]/api
```

### Development Specific:
```env
ENABLE_DEBUG_MODE=true
ENABLE_AUTONOMOUS_TESTING=true
LOG_LEVEL=debug
```

### Testing Specific:
```env
ENABLE_TEST_MODE=true
ENABLE_AUTONOMOUS_TESTING=true
LOG_LEVEL=info
```

### Production Specific:
```env
ENABLE_DEBUG_MODE=false
ENABLE_AUTONOMOUS_TESTING=false
LOG_LEVEL=error
ENABLE_CACHE=true
```

## Verification Commands

### Check Deployment Health
```bash
# Development
curl https://sentia-manufacturing-development.up.railway.app/api/health

# Testing
curl https://sentia-manufacturing-testing.up.railway.app/api/health

# Production
curl https://sentia-manufacturing-production.up.railway.app/api/health
```

### View Environment Variables (Railway CLI)
```bash
railway variables --service [service-id] --environment [environment]
```

### Update Single Variable
```bash
railway variables set KEY=value --service [service-id] --environment [environment]
```

## Common Issues & Solutions

### Issue: Environment variables not loading
**Solution**: Redeploy the service after setting variables
```bash
railway up --service [service-id] --environment [environment]
```

### Issue: Database connection failing
**Solution**: Verify DATABASE_URL format
```
postgresql://user:password@host:port/database?sslmode=require
```

### Issue: CORS errors
**Solution**: Update CORS_ORIGINS variable
```env
CORS_ORIGINS=https://your-domain.com,https://another-domain.com
```

### Issue: Authentication failing
**Solution**: Ensure Clerk keys match environment
- Test keys for development/testing
- Live keys for production

## Security Best Practices

1. **Never commit .env files** - Use Railway dashboard for secrets
2. **Use different keys per environment** - Don't share production keys
3. **Rotate secrets regularly** - Update JWT_SECRET, SESSION_SECRET quarterly
4. **Enable 2FA on Railway** - Protect your deployment platform
5. **Restrict CORS origins** - Only allow necessary domains

## Monitoring

### Check Logs
```bash
railway logs --service [service-id] --environment [environment]
```

### Monitor Usage
- Visit Railway dashboard → Metrics tab
- Set up alerts for high CPU/memory usage
- Configure uptime monitoring

## Support

- Railway Status: https://status.railway.app
- Railway Docs: https://docs.railway.app
- Project Issues: https://github.com/The-social-drink-company/sentia-manufacturing-dashboard/issues