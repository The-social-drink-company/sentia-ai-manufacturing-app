# Railway Environment Variables Configuration

## How to Add Variables in Railway

1. Go to your Railway project dashboard
2. Select the environment (Development/Testing/Production)
3. Click on the service
4. Go to "Variables" tab
5. Click "Raw Editor" for bulk paste OR add one by one
6. Save changes

---

## 🔵 DEVELOPMENT ENVIRONMENT
**Service ID**: f97b65ad-c306-410a-9d5d-5f5fdc098620
**URL**: https://sentia-manufacturing-dashboard-development.up.railway.app

### Copy and paste these variables:

```env
# Core Configuration
NODE_ENV=development
PORT=3000
CORS_ORIGINS=http://localhost:3000,http://localhost:5000,https://sentia-manufacturing-dashboard-development.up.railway.app

# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://neondb_owner:RkdOBTlexFfK@ep-aged-cake-a5erf8rx-pooler.us-east-2.aws.neon.tech/sentia_manufacturing_dev?sslmode=require
DEV_DATABASE_URL=postgresql://neondb_owner:RkdOBTlexFfK@ep-aged-cake-a5erf8rx-pooler.us-east-2.aws.neon.tech/sentia_manufacturing_dev?sslmode=require

# MCP Server Integration
MCP_SERVER_URL=https://web-production-99691282.up.railway.app
MCP_SERVER_SERVICE_ID=99691282-de66-45b2-98cf-317083dd11ba
MCP_JWT_SECRET=dev_mcp_jwt_secret_change_this_in_production_xK9mP2nQ8vL4jF6tR3yW
MCP_ENABLE_WEBSOCKET=true
MCP_SERVER_PORT=3001

# Authentication (Clerk)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_cHJvdWQtcGFuZ29saW4tNjcuY2xlcmsuYWNjb3VudHMuZGV2JA
CLERK_SECRET_KEY=sk_test_YOUR_CLERK_SECRET_KEY
CLERK_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# Session & JWT
SESSION_SECRET=dev_session_secret_change_this_in_production_aB3dE5gH7jK9mN2pQ4rS
JWT_SECRET=dev_jwt_secret_change_this_in_production_xY9zA3bC5dE7fG2hJ4kL

# Xero Integration (Optional - Configure if you have credentials)
XERO_CLIENT_ID=YOUR_XERO_CLIENT_ID
XERO_CLIENT_SECRET=YOUR_XERO_CLIENT_SECRET
XERO_REDIRECT_URI=https://sentia-manufacturing-dashboard-development.up.railway.app/api/xero/callback
XERO_TENANT_ID=YOUR_XERO_TENANT_ID

# Shopify Integration (Optional - Configure if you have credentials)
SHOPIFY_API_KEY=YOUR_SHOPIFY_API_KEY
SHOPIFY_API_SECRET=YOUR_SHOPIFY_API_SECRET
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=YOUR_SHOPIFY_ACCESS_TOKEN
SHOPIFY_WEBHOOK_SECRET=YOUR_SHOPIFY_WEBHOOK_SECRET

# Amazon SP-API (Optional - Configure if you have credentials)
AMAZON_SP_API_KEY=YOUR_AMAZON_API_KEY
AMAZON_SP_API_SECRET=YOUR_AMAZON_API_SECRET
AMAZON_REFRESH_TOKEN=YOUR_AMAZON_REFRESH_TOKEN
AMAZON_MARKETPLACE_ID=ATVPDKIKX0DER
AMAZON_SELLER_ID=YOUR_SELLER_ID

# Unleashed ERP (Optional - Configure if you have credentials)
UNLEASHED_API_ID=YOUR_UNLEASHED_API_ID
UNLEASHED_API_KEY=YOUR_UNLEASHED_API_KEY

# AI Services (Optional - Configure if you have API keys)
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
ANTHROPIC_API_KEY=YOUR_ANTHROPIC_API_KEY

# Auto-Sync Configuration
AUTO_SYNC_ENABLED=false
XERO_SYNC_INTERVAL=*/30 * * * *
SHOPIFY_SYNC_INTERVAL=*/15 * * * *
AMAZON_SYNC_INTERVAL=*/60 * * * *
DATABASE_SYNC_INTERVAL=0 */6 * * *

# Redis Cache (Optional)
REDIS_URL=redis://default:password@redis-server:6379

# Monitoring (Optional)
SENTRY_DSN=YOUR_SENTRY_DSN
LOG_LEVEL=debug

# Feature Flags
ENABLE_AUTONOMOUS_TESTING=true
AUTO_FIX_ENABLED=true
AUTO_DEPLOY_ENABLED=false

# Development Settings
VITE_API_BASE_URL=https://sentia-manufacturing-dashboard-development.up.railway.app/api
VITE_APP_TITLE=Sentia Manufacturing Dashboard - Development
VITE_APP_VERSION=1.0.0-dev
```

---

## 🟡 TESTING ENVIRONMENT
**Service ID**: 02e0c7f6-9ca1-4355-af52-ee9eec0b3545
**URL**: https://sentiatest.financeflo.ai

### Copy and paste these variables:

```env
# Core Configuration
NODE_ENV=test
PORT=3000
CORS_ORIGINS=https://sentiatest.financeflo.ai,http://localhost:3000

# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://neondb_owner:RkdOBTlexFfK@ep-aged-cake-a5erf8rx-pooler.us-east-2.aws.neon.tech/sentia_manufacturing_test?sslmode=require
TEST_DATABASE_URL=postgresql://neondb_owner:RkdOBTlexFfK@ep-aged-cake-a5erf8rx-pooler.us-east-2.aws.neon.tech/sentia_manufacturing_test?sslmode=require

# MCP Server Integration
MCP_SERVER_URL=https://web-production-99691282.up.railway.app
MCP_SERVER_SERVICE_ID=99691282-de66-45b2-98cf-317083dd11ba
MCP_JWT_SECRET=test_mcp_jwt_secret_pL9kM3nB7vX2qW5eR8tY4uI6oP1aS3dF
MCP_ENABLE_WEBSOCKET=true
MCP_SERVER_PORT=3001

# Authentication (Clerk)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_cHJvdWQtcGFuZ29saW4tNjcuY2xlcmsuYWNjb3VudHMuZGV2JA
CLERK_SECRET_KEY=sk_test_YOUR_CLERK_SECRET_KEY
CLERK_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# Session & JWT
SESSION_SECRET=test_session_secret_nM8kL2jH5gF3dC1aZ9xW7vB4qE6rT3yU
JWT_SECRET=test_jwt_secret_sD4fG6hJ8kL2mN5pQ7rT9vX3bZ1cE5aW

# Xero Integration (Optional - Configure if you have credentials)
XERO_CLIENT_ID=YOUR_XERO_CLIENT_ID
XERO_CLIENT_SECRET=YOUR_XERO_CLIENT_SECRET
XERO_REDIRECT_URI=https://sentiatest.financeflo.ai/api/xero/callback
XERO_TENANT_ID=YOUR_XERO_TENANT_ID

# Shopify Integration (Optional - Configure if you have credentials)
SHOPIFY_API_KEY=YOUR_SHOPIFY_API_KEY
SHOPIFY_API_SECRET=YOUR_SHOPIFY_API_SECRET
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=YOUR_SHOPIFY_ACCESS_TOKEN
SHOPIFY_WEBHOOK_SECRET=YOUR_SHOPIFY_WEBHOOK_SECRET

# Amazon SP-API (Optional - Configure if you have credentials)
AMAZON_SP_API_KEY=YOUR_AMAZON_API_KEY
AMAZON_SP_API_SECRET=YOUR_AMAZON_API_SECRET
AMAZON_REFRESH_TOKEN=YOUR_AMAZON_REFRESH_TOKEN
AMAZON_MARKETPLACE_ID=ATVPDKIKX0DER
AMAZON_SELLER_ID=YOUR_SELLER_ID

# Unleashed ERP (Optional - Configure if you have credentials)
UNLEASHED_API_ID=YOUR_UNLEASHED_API_ID
UNLEASHED_API_KEY=YOUR_UNLEASHED_API_KEY

# AI Services (Optional - Configure if you have API keys)
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
ANTHROPIC_API_KEY=YOUR_ANTHROPIC_API_KEY

# Auto-Sync Configuration
AUTO_SYNC_ENABLED=false
XERO_SYNC_INTERVAL=*/30 * * * *
SHOPIFY_SYNC_INTERVAL=*/15 * * * *
AMAZON_SYNC_INTERVAL=*/60 * * * *
DATABASE_SYNC_INTERVAL=0 */6 * * *

# Redis Cache (Optional)
REDIS_URL=redis://default:password@redis-server:6379

# Monitoring (Optional)
SENTRY_DSN=YOUR_SENTRY_DSN
LOG_LEVEL=info

# Feature Flags
ENABLE_AUTONOMOUS_TESTING=true
AUTO_FIX_ENABLED=true
AUTO_DEPLOY_ENABLED=false

# Testing Settings
VITE_API_BASE_URL=https://sentiatest.financeflo.ai/api
VITE_APP_TITLE=Sentia Manufacturing Dashboard - Testing
VITE_APP_VERSION=1.0.0-test
```

---

## 🟢 PRODUCTION ENVIRONMENT
**Service ID**: 3e0053fc-ea90-49ec-9708-e09d58cad4a0
**URL**: https://sentia-manufacturing-production.up.railway.app

### Copy and paste these variables:

```env
# Core Configuration
NODE_ENV=production
PORT=3000
CORS_ORIGINS=https://sentia-manufacturing-production.up.railway.app,https://web-production-1f10.up.railway.app

# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://neondb_owner:RkdOBTlexFfK@ep-aged-cake-a5erf8rx-pooler.us-east-2.aws.neon.tech/sentia_manufacturing?sslmode=require

# MCP Server Integration
MCP_SERVER_URL=https://web-production-99691282.up.railway.app
MCP_SERVER_SERVICE_ID=99691282-de66-45b2-98cf-317083dd11ba
MCP_JWT_SECRET=GENERATE_SECURE_SECRET_HERE_USE_OPENSSL_RAND_BASE64_32
MCP_ENABLE_WEBSOCKET=true
MCP_SERVER_PORT=3001

# Authentication (Clerk) - REQUIRED
VITE_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_CLERK_KEY
CLERK_SECRET_KEY=sk_live_YOUR_PRODUCTION_CLERK_SECRET
CLERK_WEBHOOK_SECRET=whsec_YOUR_PRODUCTION_WEBHOOK_SECRET

# Session & JWT - GENERATE SECURE SECRETS
SESSION_SECRET=GENERATE_SECURE_SECRET_HERE_USE_OPENSSL_RAND_BASE64_32
JWT_SECRET=GENERATE_SECURE_SECRET_HERE_USE_OPENSSL_RAND_BASE64_32

# Xero Integration (Configure with your production credentials)
XERO_CLIENT_ID=YOUR_PRODUCTION_XERO_CLIENT_ID
XERO_CLIENT_SECRET=YOUR_PRODUCTION_XERO_CLIENT_SECRET
XERO_REDIRECT_URI=https://sentia-manufacturing-production.up.railway.app/api/xero/callback
XERO_TENANT_ID=YOUR_PRODUCTION_XERO_TENANT_ID

# Shopify Integration (Configure with your production credentials)
SHOPIFY_API_KEY=YOUR_PRODUCTION_SHOPIFY_API_KEY
SHOPIFY_API_SECRET=YOUR_PRODUCTION_SHOPIFY_API_SECRET
SHOPIFY_STORE_DOMAIN=your-production-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=YOUR_PRODUCTION_SHOPIFY_ACCESS_TOKEN
SHOPIFY_WEBHOOK_SECRET=YOUR_PRODUCTION_SHOPIFY_WEBHOOK_SECRET

# Amazon SP-API (Configure with your production credentials)
AMAZON_SP_API_KEY=YOUR_PRODUCTION_AMAZON_API_KEY
AMAZON_SP_API_SECRET=YOUR_PRODUCTION_AMAZON_API_SECRET
AMAZON_REFRESH_TOKEN=YOUR_PRODUCTION_AMAZON_REFRESH_TOKEN
AMAZON_MARKETPLACE_ID=ATVPDKIKX0DER
AMAZON_SELLER_ID=YOUR_PRODUCTION_SELLER_ID

# Unleashed ERP (Configure with your production credentials)
UNLEASHED_API_ID=YOUR_PRODUCTION_UNLEASHED_API_ID
UNLEASHED_API_KEY=YOUR_PRODUCTION_UNLEASHED_API_KEY

# AI Services (Configure with your production API keys)
OPENAI_API_KEY=YOUR_PRODUCTION_OPENAI_API_KEY
ANTHROPIC_API_KEY=YOUR_PRODUCTION_ANTHROPIC_API_KEY

# Auto-Sync Configuration - ENABLED FOR PRODUCTION
AUTO_SYNC_ENABLED=true
XERO_SYNC_INTERVAL=*/30 * * * *
SHOPIFY_SYNC_INTERVAL=*/15 * * * *
AMAZON_SYNC_INTERVAL=*/60 * * * *
DATABASE_SYNC_INTERVAL=0 */6 * * *

# Redis Cache (Optional but recommended for production)
REDIS_URL=redis://default:password@your-redis-server:6379

# Monitoring (Highly recommended for production)
SENTRY_DSN=YOUR_PRODUCTION_SENTRY_DSN
LOG_LEVEL=error

# Feature Flags
ENABLE_AUTONOMOUS_TESTING=false
AUTO_FIX_ENABLED=false
AUTO_DEPLOY_ENABLED=false

# Production Settings
VITE_API_BASE_URL=https://sentia-manufacturing-production.up.railway.app/api
VITE_APP_TITLE=Sentia Manufacturing Dashboard
VITE_APP_VERSION=1.0.0
```

---

## 🔐 GENERATING SECURE SECRETS

For production, generate secure secrets using one of these methods:

### Option 1: OpenSSL (Recommended)
```bash
# Generate a secure 32-byte secret
openssl rand -base64 32
```

### Option 2: Node.js
```javascript
// Run in Node.js console
require('crypto').randomBytes(32).toString('base64')
```

### Option 3: PowerShell
```powershell
# Generate secure secret in PowerShell
[Convert]::ToBase64String((1..32 | ForEach {Get-Random -Maximum 256}))
```

### Option 4: Online Generator
Use a secure password generator and ensure it's at least 32 characters long.

---

## 📋 REQUIRED vs OPTIONAL Variables

### REQUIRED (Must be set for basic operation):
- NODE_ENV
- PORT
- DATABASE_URL
- MCP_SERVER_URL
- MCP_SERVER_SERVICE_ID
- MCP_JWT_SECRET
- VITE_CLERK_PUBLISHABLE_KEY
- CLERK_SECRET_KEY
- SESSION_SECRET
- JWT_SECRET

### OPTIONAL (Set when you have the credentials):
- XERO_* (Xero integration)
- SHOPIFY_* (Shopify integration)
- AMAZON_* (Amazon integration)
- UNLEASHED_* (Unleashed ERP)
- OPENAI_API_KEY (AI features)
- ANTHROPIC_API_KEY (AI features)
- REDIS_URL (Caching)
- SENTRY_DSN (Error monitoring)

---

## 🚀 DEPLOYMENT STEPS

### Step 1: Add Variables to Railway
1. Go to https://railway.app
2. Select your project
3. Choose the environment (Development/Testing/Production)
4. Click on the service
5. Go to "Variables" tab
6. Click "Raw Editor"
7. Paste the appropriate variables from above
8. Click "Save"

### Step 2: Generate Secure Secrets for Production
```bash
# Generate all secrets at once (PowerShell)
Write-Host "MCP_JWT_SECRET=$(openssl rand -base64 32)"
Write-Host "SESSION_SECRET=$(openssl rand -base64 32)"
Write-Host "JWT_SECRET=$(openssl rand -base64 32)"
```

### Step 3: Configure API Keys
Replace all placeholders starting with "YOUR_" with actual API credentials:
- Get Xero credentials from: https://developer.xero.com
- Get Shopify credentials from: https://partners.shopify.com
- Get Amazon SP-API from: https://developer.amazonservices.com
- Get Clerk keys from: https://dashboard.clerk.com

### Step 4: Verify Deployment
After adding variables, Railway will automatically redeploy. Check:
```bash
# Test health endpoint
curl https://[your-environment-url]/api/health

# Test MCP integration
curl https://[your-environment-url]/api/mcp/health
```

---

## ⚠️ IMPORTANT NOTES

1. **Security**: Never commit these variables to Git
2. **Secrets**: Always use generated secrets for production
3. **API Keys**: Use test/sandbox keys for development/testing
4. **Database**: Each environment uses a different database branch
5. **Auto-Sync**: Only enabled in production by default
6. **Clerk**: You must have valid Clerk keys for authentication to work

---

## 🆘 TROUBLESHOOTING

If the application doesn't start after adding variables:
1. Check Railway deployment logs for errors
2. Verify DATABASE_URL is correct and accessible
3. Ensure Clerk keys are valid
4. Check that PORT is set to 3000
5. Verify NODE_ENV matches the environment

---

**Last Updated**: December 2024
**For**: Sentia Manufacturing Dashboard MCP Integration