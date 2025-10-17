# Environment Variables Configuration Guide

## Quick Setup for Railway

### Required Variables (All Environments)

```bash
# Core Configuration
PORT=5000                           # Must be 5000 for Railway
NODE_ENV=development|test|production # Environment mode
RAILWAY_ENVIRONMENT=development|test|production

# Database (Required)
DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require

# Authentication (Required)
CLERK_PUBLISHABLE_KEY=pk_test_xxxxx # Get from Clerk Dashboard
CLERK_SECRET_KEY=sk_test_xxxxx      # Get from Clerk Dashboard
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx # Same as CLERK_PUBLISHABLE_KEY
```

## Environment-Specific Templates

### Development (.env.development)

```bash
PORT=5000
NODE_ENV=development
DATABASE_URL=your_dev_database_url
CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
LOG_LEVEL=debug
```

### Test (.env.test)

```bash
PORT=5000
NODE_ENV=test
DATABASE_URL=your_test_database_url
CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
LOG_LEVEL=info
```

### Production (.env.production)

```bash
PORT=5000
NODE_ENV=production
DATABASE_URL=your_production_database_url
CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
CLERK_SECRET_KEY=sk_live_xxxxx
LOG_LEVEL=error
```

## Railway Dashboard Setup

### Step 1: Navigate to Variables Tab

1. Open your Railway project
2. Click on your service
3. Go to "Variables" tab

### Step 2: Add Variables (Copy & Paste)

#### For Development Environment:

```
PORT=5000
NODE_ENV=development
RAILWAY_ENVIRONMENT=development
DATABASE_URL=postgresql://neondb_owner:password@ep-host.region.aws.neon.tech/neondb?sslmode=require
CLERK_PUBLISHABLE_KEY=pk_test_your_key
CLERK_SECRET_KEY=sk_test_your_secret
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key
```

#### For Test Environment:

```
PORT=5000
NODE_ENV=test
RAILWAY_ENVIRONMENT=test
DATABASE_URL=postgresql://neondb_owner:password@ep-host.region.aws.neon.tech/test_db?sslmode=require
CLERK_PUBLISHABLE_KEY=pk_test_your_key
CLERK_SECRET_KEY=sk_test_your_secret
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key
```

#### For Production Environment:

```
PORT=5000
NODE_ENV=production
RAILWAY_ENVIRONMENT=production
DATABASE_URL=postgresql://neondb_owner:password@ep-host.region.aws.neon.tech/prod_db?sslmode=require
CLERK_PUBLISHABLE_KEY=pk_live_your_key
CLERK_SECRET_KEY=sk_live_your_secret
VITE_CLERK_PUBLISHABLE_KEY=pk_live_your_key
```

## Optional Variables (Add as Needed)

### External Services

```bash
# Xero Integration
XERO_CLIENT_ID=your_xero_client_id
XERO_CLIENT_SECRET=your_xero_client_secret

# Shopify Integration
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret

# Amazon SP-API
AMAZON_SP_API_KEY=your_amazon_api_key
AMAZON_SP_API_SECRET=your_amazon_api_secret

# Unleashed ERP
UNLEASHED_API_ID=your_unleashed_api_id
UNLEASHED_API_KEY=your_unleashed_api_key
```

### AI Services

```bash
# OpenAI
OPENAI_API_KEY=sk-your_openai_key

# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-your_anthropic_key
```

### Redis & Caching

```bash
REDIS_URL=redis://default:password@host:6379
```

### Monitoring

```bash
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
LOG_LEVEL=debug|info|warn|error
```

### Feature Flags

```bash
ENABLE_AI_FEATURES=true
ENABLE_SSE=true
ENABLE_WEBSOCKETS=false
```

### Security

```bash
SESSION_SECRET=random_32_char_string
JWT_SECRET=random_32_char_string
CORS_ORIGINS=https://your-domain.com
```

## Getting Your Keys

### Neon Database

1. Go to https://neon.tech
2. Create a project
3. Copy connection string from dashboard
4. Create separate branches for dev/test/prod

### Clerk Authentication

1. Go to https://clerk.com
2. Create application
3. Get keys from API Keys section
4. Use test keys for dev/test, live keys for production

### Railway Deployment

1. Go to Railway project
2. Click service → Variables tab
3. Paste all required variables
4. Click "Deploy" to apply changes

## Verification

After setting variables, verify with:

```bash
# Check locally
node -e "console.log(process.env.PORT)"

# Check on Railway
curl https://your-app.up.railway.app/api/health
```

## Common Issues

### Port Not Working

- Ensure PORT=5000 is set (not auto)
- Check Networking tab shows Port: 5000

### Database Connection Failed

- Verify DATABASE_URL has ?sslmode=require
- Check database is accessible from Railway

### Authentication Not Working

- Ensure VITE_CLERK_PUBLISHABLE_KEY matches CLERK_PUBLISHABLE_KEY
- Use correct keys (test vs live)

## Security Notes

⚠️ **Never commit .env files to Git**
⚠️ **Use different keys for each environment**
⚠️ **Rotate secrets regularly**
⚠️ **Use Railway's secret management**

## Files Provided

- `.env.development` - Development template
- `.env.test` - Test template
- `.env.production` - Production template
- `.env.example` - Generic example

Copy the appropriate file to `.env.local` and fill in your actual values.
