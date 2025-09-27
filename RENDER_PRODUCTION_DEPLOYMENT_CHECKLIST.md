# Render Production Deployment Checklist

## Overview
This checklist ensures all required environment variables are configured in the Render dashboard for the production environment.

**Service:** sentia-manufacturing-production
**URL:** https://dashboard.render.com/web/srv-[service-id]/env
**Total Variables Required:** 51+ environment variables

## ⚠️ CRITICAL MISSING VARIABLES

### 1. Authentication (Clerk) - REQUIRED FOR LOGIN
```
CLERK_ENVIRONMENT=production
CLERK_SECRET_KEY=[PRODUCTION_CLERK_SECRET_KEY]
CLERK_WEBHOOK_SECRET=[PRODUCTION_WEBHOOK_SECRET]
VITE_CLERK_PUBLISHABLE_KEY=[PRODUCTION_CLERK_PUBLISHABLE_KEY]
VITE_CLERK_DOMAIN=clerk.financeflo.ai
VITE_CLERK_AFTER_SIGN_IN_URL=/dashboard
VITE_CLERK_AFTER_SIGN_UP_URL=/dashboard
VITE_CLERK_SIGN_IN_URL=/sign-in
VITE_CLERK_SIGN_UP_URL=/sign-up
VITE_DISABLE_AUTH_FALLBACK=false
VITE_FORCE_CLERK_AUTH=true
```

### 2. Security & Sessions - REQUIRED FOR SECURITY
```
JWT_SECRET=[GENERATE_SECURE_JWT_SECRET]
SESSION_SECRET=[GENERATE_SECURE_SESSION_SECRET]
CORS_ORIGINS=https://sentia-manufacturing-production.onrender.com
```

### 3. Frontend Configuration - REQUIRED FOR UI
```
VITE_API_BASE_URL=https://sentia-manufacturing-production.onrender.com/api
VITE_APP_TITLE=Sentia Manufacturing Dashboard
VITE_APP_VERSION=2.0.0
```

### 4. AI Services - REQUIRED FOR AI FEATURES
```
ANTHROPIC_API_KEY=[PRODUCTION_ANTHROPIC_API_KEY]
OPENAI_API_KEY=[PRODUCTION_OPENAI_API_KEY]
GOOGLE_AI_API_KEY=[PRODUCTION_GOOGLE_AI_KEY]
```

### 5. MCP Server Configuration - REQUIRED FOR AI ORCHESTRATION
```
MCP_SERVER_URL=https://mcp-server-tkyu.onrender.com
MCP_JWT_SECRET=[GENERATE_SECURE_MCP_JWT_SECRET]
MCP_SERVER_HEALTH_CHECK_INTERVAL=30000
MCP_ENABLE_WEBSOCKET=true
```

### 6. Xero Integration - REQUIRED FOR FINANCIAL DATA
```
XERO_CLIENT_ID=[PRODUCTION_XERO_CLIENT_ID]
XERO_CLIENT_SECRET=[PRODUCTION_XERO_CLIENT_SECRET]
XERO_REDIRECT_URI=https://sentia-manufacturing-production.onrender.com/api/xero/callback
XERO_SYNC_INTERVAL=*/30 * * * *
```

### 7. Shopify UK Integration - REQUIRED FOR E-COMMERCE
```
SHOPIFY_UK_ACCESS_TOKEN=[PRODUCTION_SHOPIFY_UK_TOKEN]
SHOPIFY_UK_API_KEY=[PRODUCTION_SHOPIFY_UK_KEY]
SHOPIFY_UK_SECRET=[PRODUCTION_SHOPIFY_UK_SECRET]
SHOPIFY_UK_SHOP_URL=sentiaspirits.myshopify.com
SHOPIFY_SYNC_INTERVAL=*/15 * * * *
```

### 8. Shopify USA Integration - REQUIRED FOR E-COMMERCE
```
SHOPIFY_USA_ACCESS_TOKEN=[PRODUCTION_SHOPIFY_USA_TOKEN]
SHOPIFY_USA_API_KEY=[PRODUCTION_SHOPIFY_USA_KEY]
SHOPIFY_USA_SECRET=[PRODUCTION_SHOPIFY_USA_SECRET]
SHOPIFY_USA_SHOP_URL=us-sentiaspirits.myshopify.com
```

### 9. Amazon Integration - REQUIRED FOR MARKETPLACE
```
AMAZON_UK_MARKETPLACE_ID=A1F83G8C2ARO7P
AMAZON_USA_MARKETPLACE_ID=ATVPDKIKX0DER
AMAZON_SYNC_INTERVAL=*/60 * * * *
```

### 10. Unleashed ERP - REQUIRED FOR INVENTORY
```
UNLEASHED_API_ID=[PRODUCTION_UNLEASHED_API_ID]
UNLEASHED_API_KEY=[PRODUCTION_UNLEASHED_API_KEY]
UNLEASHED_API_URL=https://api.unleashedsoftware.com
```

### 11. Microsoft Integration - REQUIRED FOR ENTERPRISE
```
MICROSOFT_TENANT_ID=common
MICROSOFT_CLIENT_ID=[PRODUCTION_MICROSOFT_CLIENT_ID]
MICROSOFT_CLIENT_SECRET=[PRODUCTION_MICROSOFT_CLIENT_SECRET]
MICROSOFT_ADMIN_EMAIL=admin@app.sentiaspirits.com
MICROSOFT_DATA_EMAIL=data@app.sentiaspirits.com
```

### 12. System Configuration - REQUIRED FOR OPERATIONS
```
NODE_OPTIONS=--expose-gc --max-old-space-size=512
AUTO_SYNC_ENABLED=true
DATABASE_SYNC_INTERVAL=0 */6 * * *
LOG_LEVEL=info
AUTO_DEPLOY_ENABLED=true
AUTO_FIX_ENABLED=false
ENABLE_AUTONOMOUS_TESTING=false
ENABLE_DETAILED_LOGGING=false
DISABLE_TEST_DATA_GENERATION=true
```

## 🔧 Configuration Steps

### Step 1: Access Render Dashboard
1. Go to https://dashboard.render.com
2. Navigate to the `sentia-manufacturing-production` service
3. Click on the "Environment" tab

### Step 2: Add Environment Variables
For each variable above:
1. Click "Add Environment Variable"
2. Enter the **Key** (variable name)
3. Enter the **Value** (replace placeholders with actual production values)
4. Click "Save Changes"

### Step 3: Deploy
After adding all variables:
1. Click "Manual Deploy" or wait for auto-deploy
2. Monitor the deployment logs
3. Verify the application starts successfully

## 🔒 Security Requirements

### Generate Secure Secrets
Use a secure random generator for these values:
- JWT_SECRET (64+ character random string)
- SESSION_SECRET (64+ character random string)
- MCP_JWT_SECRET (64+ character random string)

### API Keys Required
Obtain production API keys from:
- **Clerk:** Production authentication keys from clerk.financeflo.ai
- **Anthropic:** Production Claude API key
- **OpenAI:** Production GPT-4 API key
- **Xero:** Production app credentials
- **Shopify:** Production store API keys (UK & USA)
- **Unleashed:** Production ERP API credentials
- **Microsoft:** Production Azure app credentials

## ✅ Verification Checklist

After deployment, verify:
- [ ] Application loads at https://sentia-manufacturing-production.onrender.com
- [ ] Authentication works (sign in/sign up)
- [ ] Dashboard loads successfully
- [ ] API health check returns 200: `/health`
- [ ] External services show "Connected" status
- [ ] No console errors in browser
- [ ] All navigation links work
- [ ] Working Capital page loads
- [ ] What-If Analysis page loads

## 🚨 Critical Failure Points

The application WILL FAIL if missing:
1. **Clerk Authentication** - Users cannot sign in
2. **Database URL** - Data layer fails completely
3. **VITE_API_BASE_URL** - Frontend cannot connect to backend
4. **JWT_SECRET** - Session management fails

## 📝 Post-Deployment

1. Test complete authentication flow
2. Verify all integrations are working
3. Check monitoring and logging
4. Perform UAT testing
5. Update documentation with any changes