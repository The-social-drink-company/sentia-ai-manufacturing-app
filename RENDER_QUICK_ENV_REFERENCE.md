# Render Quick Environment Reference

## Copy-Paste Ready Variables for All Environments

---

## 🚀 QUICK SETUP: Run This First!

```powershell
# Setup ALL environments at once
.\render-complete-setup.ps1 -Environment all

# Or individually
.\render-complete-setup.ps1 -Environment development
.\render-complete-setup.ps1 -Environment testing
.\render-complete-setup.ps1 -Environment production
```

---

## 📋 COPY-PASTE VARIABLES BY ENVIRONMENT

### DEVELOPMENT

```
NODE_ENV=development
PORT=10000
DATABASE_URL=[GET FROM sentia-db-development]
CORS_ORIGINS=https://sentia-manufacturing-development.onrender.com
VITE_API_BASE_URL=https://sentia-manufacturing-development.onrender.com/api
VITE_APP_TITLE=Sentia Manufacturing Dashboard
VITE_APP_VERSION=1.0.0

# Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_Y2hhbXBpb24tYnVsbGRvZy05Mi5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_EP6iF7prGbq73CscUPCOW8PAKol4pPaBG5iYdsDodq
CLERK_WEBHOOK_SECRET=whsec_REDACTED
SESSION_SECRET=sentia-session-secret-development-2025
JWT_SECRET=sentia-jwt-secret-development-2025

# Xero
XERO_CLIENT_ID=9C0CAB921C134476A249E48BBECB8C4B
XERO_CLIENT_SECRET=f0TJpJSRX_B9NI51sknz7TuKbbSfhO4dEhTM4m4fWBlph9F5
XERO_REDIRECT_URI=https://sentia-manufacturing-development.onrender.com/api/xero/callback

# Shopify UK
SHOPIFY_UK_API_KEY=7a30cd84e7a106b852c8e0fb789de10e
SHOPIFY_UK_SECRET=8b2d61745c506970c70d8c892f5f977e
SHOPIFY_UK_ACCESS_TOKEN=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
SHOPIFY_UK_SHOP_URL=sentiaspirits.myshopify.com

# Shopify USA
SHOPIFY_USA_API_KEY=83b8903fd8b509ef8bf93d1dbcd6079c
SHOPIFY_USA_SECRET=d01260e58adb00198cddddd1bd9a9490
SHOPIFY_USA_ACCESS_TOKEN=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
SHOPIFY_USA_SHOP_URL=us-sentiaspirits.myshopify.com

# Unleashed
UNLEASHED_API_ID=d5313df6-db35-430c-a69e-ae27dffe0c5a
UNLEASHED_API_KEY=2bJcHlDhIV04ScdqT60c3zlnG7hOER7aoPSh2IF2hWQluOi7ZaGkeu4SGeseYexAqOGfcRmyl9c6QYueJHyQ==
UNLEASHED_API_URL=https://api.unleashedsoftware.com

# AI Services
OPENAI_API_KEY=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
ANTHROPIC_API_KEY=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

# MCP Server
MCP_SERVER_URL=https://mcp-server-tkyu.onrender.com
MCP_JWT_SECRET=sentia-mcp-jwt-secret-development-2025
MCP_ENABLE_WEBSOCKET=true

# Microsoft
MICROSOFT_CLIENT_ID=c16d6fba-0e6b-45ea-a016-eb697ff7a7ae
MICROSOFT_CLIENT_SECRET=peI8Q~4QJG.ax3ekxtWrv.PXVENVQ3vw_Br1qayM
MICROSOFT_TENANT_ID=common

# Dev Settings
ENABLE_AUTONOMOUS_TESTING=true
AUTO_FIX_ENABLED=true
AUTO_DEPLOY_ENABLED=true
DEBUG_MODE=true
LOG_LEVEL=debug

# Sync
AUTO_SYNC_ENABLED=true
XERO_SYNC_INTERVAL=*/30 * * * *
SHOPIFY_SYNC_INTERVAL=*/15 * * * *
```

### TESTING

```
NODE_ENV=test
PORT=10000
DATABASE_URL=[GET FROM sentia-db-testing]
CORS_ORIGINS=https://sentia-manufacturing-testing.onrender.com
VITE_API_BASE_URL=https://sentia-manufacturing-testing.onrender.com/api

# Copy all other variables from DEVELOPMENT except:
SESSION_SECRET=sentia-session-secret-testing-2025
JWT_SECRET=sentia-jwt-secret-testing-2025
XERO_REDIRECT_URI=https://sentia-manufacturing-testing.onrender.com/api/xero/callback
MCP_JWT_SECRET=sentia-mcp-jwt-secret-testing-2025

# Testing Settings (Different)
ENABLE_AUTONOMOUS_TESTING=true
AUTO_FIX_ENABLED=true
AUTO_DEPLOY_ENABLED=false
DEBUG_MODE=false
LOG_LEVEL=info
```

### PRODUCTION

```
NODE_ENV=production
PORT=10000
DATABASE_URL=[GET FROM sentia-db-production]
CORS_ORIGINS=https://sentia-manufacturing-production.onrender.com
VITE_API_BASE_URL=https://sentia-manufacturing-production.onrender.com/api

# Copy all other variables from DEVELOPMENT except:
SESSION_SECRET=[GENERATE NEW SECURE SECRET]
JWT_SECRET=[GENERATE NEW SECURE SECRET]
XERO_REDIRECT_URI=https://sentia-manufacturing-production.onrender.com/api/xero/callback
MCP_JWT_SECRET=[GENERATE NEW SECURE SECRET]

# Production Settings (Critical!)
ENABLE_AUTONOMOUS_TESTING=false
AUTO_FIX_ENABLED=false
AUTO_DEPLOY_ENABLED=false
DEBUG_MODE=false
LOG_LEVEL=warn

# Add Production Monitoring
SENTRY_DSN=[Your Sentry DSN]
```

---

## 🔑 MISSING API KEYS TO ADD

These need to be obtained and added manually:

### Amazon SP-API (If using Amazon integration)

```
AMAZON_SP_API_CLIENT_ID=
AMAZON_SP_API_CLIENT_SECRET=
AMAZON_SP_API_REFRESH_TOKEN=
AMAZON_SELLER_ID=
```

### Xero (After first connection)

```
XERO_TENANT_ID=
```

### Optional Services

```
REDIS_URL=
STRIPE_SECRET_KEY=
TWILIO_ACCOUNT_SID=
SMTP_HOST=
```

---

## ✅ VERIFICATION COMMANDS

```bash
# Check all environments
node scripts/render-verify.js

# Check specific environment
curl https://sentia-manufacturing-development.onrender.com/health
curl https://sentia-manufacturing-testing.onrender.com/health
curl https://sentia-manufacturing-production.onrender.com/health
```

---

## 🚨 CRITICAL REMINDERS

1. **DATABASE_URL**: Must use Internal Database URL from Render
2. **Production Secrets**: Generate new SESSION_SECRET and JWT_SECRET for production
3. **Feature Flags**: Production must have all testing flags set to FALSE
4. **API Keys**: Some APIs need manual setup (Amazon, Stripe, etc.)
5. **Deploy After Changes**: Always trigger manual deploy after updating variables

---

**Quick Help**: If something's not working, check:

1. Database URL is correct (Internal URL)
2. All required variables are set
3. Service has been deployed after changes
4. Check logs for specific error messages
