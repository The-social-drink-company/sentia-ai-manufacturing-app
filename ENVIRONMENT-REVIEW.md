# Environment Variables Review & Validation

## 🔍 Issues Found and Corrections Needed

### 1. ❌ INCORRECT: MCP_SERVER_PORT in Development

- **Current**: `MCP_SERVER_PORT=3001`
- **Issue**: Port numbers are not used on Render (auto-assigned)
- **Action**: REMOVE this variable from development environment

### 2. ⚠️ WARNING: AUTO_DEPLOY_ENABLED in Testing

- **Current Testing**: `AUTO_DEPLOY_ENABLED=true`
- **Current Development**: `AUTO_DEPLOY_ENABLED=false`
- **Issue**: Testing shouldn't auto-deploy
- **Action**: Change to `false` in testing environment

### 3. ✅ CORRECT: Environment-Specific URLs

All URLs are correctly configured for each environment:

#### Development URLs (Correct)

- `CORS_ORIGINS=https://sentia-manufacturing-development.onrender.com`
- `VITE_API_BASE_URL=https://sentia-manufacturing-development.onrender.com/api`
- `XERO_REDIRECT_URI=https://sentia-manufacturing-development.onrender.com/api/xero/callback`

#### Testing URLs (Need to be added/verified)

- `CORS_ORIGINS=https://sentia-manufacturing-testing.onrender.com` ✅
- `VITE_API_BASE_URL=https://sentia-manufacturing-testing.onrender.com/api` ✅
- `XERO_REDIRECT_URI=https://sentia-manufacturing-testing.onrender.com/api/xero/callback` (MISSING - needs to be added)

### 4. ✅ CORRECT: NODE_ENV Values

- Development: `NODE_ENV=development` ✅
- Testing: `NODE_ENV=test` ✅

### 5. ✅ CORRECT: Database URLs

- Development: Uses `sentia_manufacturing_dev` database ✅
- Testing: Uses `sentia_manufacturing_test` database ✅

### 6. ❌ MISSING in Testing: Critical Authentication Variables

Testing is missing ALL Clerk authentication variables:

- `CLERK_ENVIRONMENT`
- `CLERK_SECRET_KEY`
- `CLERK_WEBHOOK_SECRET`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `VITE_CLERK_PUBLISHABLE_KEY`
- `VITE_CLERK_DOMAIN`
- `VITE_CLERK_AFTER_SIGN_IN_URL`
- `VITE_CLERK_AFTER_SIGN_UP_URL`
- `VITE_CLERK_SIGN_IN_URL`
- `VITE_CLERK_SIGN_UP_URL`

### 7. ❌ MISSING in Testing: API Integration Credentials

- All Shopify credentials (8 variables)
- All Xero credentials (3 variables)
- All Unleashed credentials (3 variables)
- Amazon Marketplace IDs (2 variables)

### 8. ❌ MISSING in Testing: AI Service Keys

- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`

### 9. ❌ MISSING in Testing: Security Keys

- `JWT_SECRET`
- `SESSION_SECRET`

### 10. ⚠️ MICROSOFT_TENANT_ID

- **Issue**: Missing in testing but present in development
- **Value**: `common` (should be same in both)

## 📋 Complete Corrected Variable Lists

### DEVELOPMENT Environment (Corrected)

```env
# Core Configuration
NODE_ENV=development
LOG_LEVEL=info
CORS_ORIGINS=https://sentia-manufacturing-development.onrender.com

# Database
DATABASE_URL=[Render provides this]

# Clerk Authentication
CLERK_ENVIRONMENT=production
CLERK_SECRET_KEY=sk_live_REDACTED
CLERK_WEBHOOK_SECRET=whsec_REDACTED
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_REDACTED
VITE_CLERK_PUBLISHABLE_KEY=pk_live_REDACTED
VITE_CLERK_DOMAIN=clerk.financeflo.ai
VITE_CLERK_AFTER_SIGN_IN_URL=/dashboard
VITE_CLERK_AFTER_SIGN_UP_URL=/dashboard
VITE_CLERK_SIGN_IN_URL=/sign-in
VITE_CLERK_SIGN_UP_URL=/sign-up
VITE_DISABLE_AUTH_FALLBACK=true
VITE_FORCE_CLERK_AUTH=true

# Security
JWT_SECRET=wF08R/0kITl5rsQkgJhDef9otQ/3KERqlHRnjdpKavg=
SESSION_SECRET=JtjquFaltrbuQ+8YAwUEJ5kKEvn6LElVPKuBvQ0imKE=

# Frontend Configuration
VITE_API_BASE_URL=https://sentia-manufacturing-development.onrender.com/api
VITE_APP_TITLE=Sentia Manufacturing Dashboard
VITE_APP_VERSION=1.0.0

# MCP Server (REMOVE MCP_SERVER_PORT)
MCP_SERVER_URL=https://mcp-server-tkyu.onrender.com
MCP_JWT_SECRET=UCL2hGcrBa4GdF32izKAd2dTBDJ5WidLVuV5r3uPTOc=
MCP_SERVER_HEALTH_CHECK_INTERVAL=30000
MCP_ENABLE_WEBSOCKET=true

# Amazon Configuration
AMAZON_UK_MARKETPLACE_ID=A1F83G8C2ARO7P
AMAZON_USA_MARKETPLACE_ID=ATVPDKIKX0DER
AMAZON_SYNC_INTERVAL=*/60 * * * *

# Shopify Configuration
SHOPIFY_UK_ACCESS_TOKEN=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
SHOPIFY_UK_API_KEY=7a30cd84e7a106b852c8e0fb789de10e
SHOPIFY_UK_SECRET=8b2d61745c506970c70d8c892f5f977e
SHOPIFY_UK_SHOP_URL=sentiaspirits.myshopify.com
SHOPIFY_USA_ACCESS_TOKEN=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
SHOPIFY_USA_API_KEY=83b8903fd8b509ef8bf93d1dbcd6079c
SHOPIFY_USA_SECRET=d01260e58adb00198cddddd1bd9a9490
SHOPIFY_USA_SHOP_URL=us-sentiaspirits.myshopify.com
SHOPIFY_SYNC_INTERVAL=*/15 * * * *

# Xero Configuration
XERO_CLIENT_ID=9C0CAB921C134476A249E48BBECB8C4B
XERO_CLIENT_SECRET=f0TJpJSRX_B9NI51sknz7TuKbbSfhO4dEhTM4m4fWBlph9F5
XERO_REDIRECT_URI=https://sentia-manufacturing-development.onrender.com/api/xero/callback
XERO_SYNC_INTERVAL=*/30 * * * *

# Unleashed Configuration
UNLEASHED_API_ID=d5313df6-db35-430c-a69e-ae27dffe0c5a
UNLEASHED_API_KEY=2bJcHlDhIV04ScdqT60c3zlnG7hOER7aoPSh2IF2hWQluOi7ZaGkeu4SGeseYexAqOGfcRmyl9c6QYueJHyQ==
UNLEASHED_API_URL=https://api.unleashedsoftware.com

# Microsoft Configuration
MICROSOFT_TENANT_ID=common
MICROSOFT_CLIENT_ID=c16d6fba-0e6b-45ea-a016-eb697ff7a7ae
MICROSOFT_CLIENT_SECRET=peI8Q~4QJG.ax3ekxtWrv.PXVENVQ3vw_Br1qayM
MICROSOFT_ADMIN_EMAIL=admin@app.sentiaspirits.com
MICROSOFT_DATA_EMAIL=data@app.sentiaspirits.com

# AI Services
OPENAI_API_KEY=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
ANTHROPIC_API_KEY=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

# Automation Settings
ENABLE_AUTONOMOUS_TESTING=true
AUTO_FIX_ENABLED=true
AUTO_DEPLOY_ENABLED=false
AUTO_SYNC_ENABLED=true
DATABASE_SYNC_INTERVAL=0 */6 * * *
```

### TESTING Environment (Corrected & Complete)

```env
# Core Configuration
NODE_ENV=test
LOG_LEVEL=info
CORS_ORIGINS=https://sentia-manufacturing-testing.onrender.com

# Database
DATABASE_URL=[Render provides this]

# Clerk Authentication (MUST ADD ALL)
CLERK_ENVIRONMENT=production
CLERK_SECRET_KEY=sk_live_REDACTED
CLERK_WEBHOOK_SECRET=whsec_REDACTED
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_REDACTED
VITE_CLERK_PUBLISHABLE_KEY=pk_live_REDACTED
VITE_CLERK_DOMAIN=clerk.financeflo.ai
VITE_CLERK_AFTER_SIGN_IN_URL=/dashboard
VITE_CLERK_AFTER_SIGN_UP_URL=/dashboard
VITE_CLERK_SIGN_IN_URL=/sign-in
VITE_CLERK_SIGN_UP_URL=/sign-up
VITE_DISABLE_AUTH_FALLBACK=true
VITE_FORCE_CLERK_AUTH=true

# Security (MUST ADD)
JWT_SECRET=wF08R/0kITl5rsQkgJhDef9otQ/3KERqlHRnjdpKavg=
SESSION_SECRET=JtjquFaltrbuQ+8YAwUEJ5kKEvn6LElVPKuBvQ0imKE=

# Frontend Configuration
VITE_API_BASE_URL=https://sentia-manufacturing-testing.onrender.com/api
VITE_APP_TITLE=Sentia Manufacturing Dashboard
VITE_APP_VERSION=1.0.0

# MCP Server
MCP_SERVER_URL=https://mcp-server-tkyu.onrender.com
MCP_JWT_SECRET=UCL2hGcrBa4GdF32izKAd2dTBDJ5WidLVuV5r3uPTOc=
MCP_SERVER_HEALTH_CHECK_INTERVAL=30000
MCP_ENABLE_WEBSOCKET=true

# Amazon Configuration (MUST ADD)
AMAZON_UK_MARKETPLACE_ID=A1F83G8C2ARO7P
AMAZON_USA_MARKETPLACE_ID=ATVPDKIKX0DER
AMAZON_SYNC_INTERVAL=*/60 * * * *

# Shopify Configuration (MUST ADD ALL)
SHOPIFY_UK_ACCESS_TOKEN=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
SHOPIFY_UK_API_KEY=7a30cd84e7a106b852c8e0fb789de10e
SHOPIFY_UK_SECRET=8b2d61745c506970c70d8c892f5f977e
SHOPIFY_UK_SHOP_URL=sentiaspirits.myshopify.com
SHOPIFY_USA_ACCESS_TOKEN=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
SHOPIFY_USA_API_KEY=83b8903fd8b509ef8bf93d1dbcd6079c
SHOPIFY_USA_SECRET=d01260e58adb00198cddddd1bd9a9490
SHOPIFY_USA_SHOP_URL=us-sentiaspirits.myshopify.com
SHOPIFY_SYNC_INTERVAL=*/15 * * * *

# Xero Configuration (MUST ADD ALL - NOTE TESTING URL)
XERO_CLIENT_ID=9C0CAB921C134476A249E48BBECB8C4B
XERO_CLIENT_SECRET=f0TJpJSRX_B9NI51sknz7TuKbbSfhO4dEhTM4m4fWBlph9F5
XERO_REDIRECT_URI=https://sentia-manufacturing-testing.onrender.com/api/xero/callback
XERO_SYNC_INTERVAL=*/30 * * * *

# Unleashed Configuration (MUST ADD ALL)
UNLEASHED_API_ID=d5313df6-db35-430c-a69e-ae27dffe0c5a
UNLEASHED_API_KEY=2bJcHlDhIV04ScdqT60c3zlnG7hOER7aoPSh2IF2hWQluOi7ZaGkeu4SGeseYexAqOGfcRmyl9c6QYueJHyQ==
UNLEASHED_API_URL=https://api.unleashedsoftware.com

# Microsoft Configuration (MUST ADD)
MICROSOFT_TENANT_ID=common
MICROSOFT_CLIENT_ID=c16d6fba-0e6b-45ea-a016-eb697ff7a7ae
MICROSOFT_CLIENT_SECRET=peI8Q~4QJG.ax3ekxtWrv.PXVENVQ3vw_Br1qayM
MICROSOFT_ADMIN_EMAIL=admin@app.sentiaspirits.com
MICROSOFT_DATA_EMAIL=data@app.sentiaspirits.com

# AI Services (MUST ADD)
OPENAI_API_KEY=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
ANTHROPIC_API_KEY=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

# Automation Settings (CHANGE AUTO_DEPLOY)
ENABLE_AUTONOMOUS_TESTING=true
AUTO_FIX_ENABLED=true
AUTO_DEPLOY_ENABLED=false  # CHANGED FROM true
AUTO_SYNC_ENABLED=true
DATABASE_SYNC_INTERVAL=0 */6 * * *
```

## 🎯 Summary of Required Actions

### For DEVELOPMENT Environment:

1. ❌ **REMOVE** `MCP_SERVER_PORT=3001` (not needed on Render)
2. ✅ Everything else is correct

### For TESTING Environment:

1. ❌ **ADD** 35 missing variables (all listed above)
2. ⚠️ **CHANGE** `AUTO_DEPLOY_ENABLED` from `true` to `false`
3. ⚠️ **ENSURE** `XERO_REDIRECT_URI` uses testing URL (not development)

## 🔐 Security Notes

- All API keys and secrets are the same across environments (this is OK for dev/test)
- Production should have different keys when deployed
- Clerk is using production keys even in dev/test (this is intentional for real auth)
