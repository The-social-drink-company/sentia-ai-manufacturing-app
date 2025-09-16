# Render Environment Variables Verification Checklist
## Complete Checklist for All Three Environments

Use this checklist to verify that each environment has ALL required variables for 100% functionality.

---

## 📋 DEVELOPMENT ENVIRONMENT
**Service**: `sentia-manufacturing-development`
**URL**: https://sentia-manufacturing-development.onrender.com
**Database**: `sentia-db-development`

### ✅ Critical Variables (App Won't Start Without These)
- [ ] `NODE_ENV` = `development`
- [ ] `PORT` = `10000` (or let Render auto-assign)
- [ ] `DATABASE_URL` = Connection string from `sentia-db-development`
- [ ] `VITE_CLERK_PUBLISHABLE_KEY` = `pk_test_Y2hhbXBpb24tYnVsbGRvZy05Mi5jbGVyay5hY2NvdW50cy5kZXYk`
- [ ] `CLERK_SECRET_KEY` = `sk_test_EP6iF7prGbq73CscUPCOW8PAKol4pPaBG5iYdsDodq`
- [ ] `SESSION_SECRET` = `sentia-session-secret-development-2025`
- [ ] `JWT_SECRET` = `sentia-jwt-secret-development-2025`
- [ ] `CORS_ORIGINS` = `https://sentia-manufacturing-development.onrender.com`
- [ ] `VITE_API_BASE_URL` = `https://sentia-manufacturing-development.onrender.com/api`
- [ ] `VITE_APP_TITLE` = `Sentia Manufacturing Dashboard`

### ✅ API Integrations (Required for Full Features)
- [ ] `XERO_CLIENT_ID` = `9C0CAB921C134476A249E48BBECB8C4B`
- [ ] `XERO_CLIENT_SECRET` = `f0TJpJSRX_B9NI51sknz7TuKbbSfhO4dEhTM4m4fWBlph9F5`
- [ ] `XERO_REDIRECT_URI` = `https://sentia-manufacturing-development.onrender.com/api/xero/callback`
- [ ] `SHOPIFY_UK_ACCESS_TOKEN` = `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`
- [ ] `SHOPIFY_UK_SHOP_URL` = `sentiaspirits.myshopify.com`
- [ ] `SHOPIFY_USA_ACCESS_TOKEN` = `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`
- [ ] `SHOPIFY_USA_SHOP_URL` = `us-sentiaspirits.myshopify.com`
- [ ] `UNLEASHED_API_ID` = `d5313df6-db35-430c-a69e-ae27dffe0c5a`
- [ ] `UNLEASHED_API_KEY` = `2bJcHlDhIV04ScdqT60c3zlnG7hOER7aoPSh2IF2hWQluOi7ZaGkeu4SGeseYexAqOGfcRmyl9c6QYueJHyQ==`
- [ ] `UNLEASHED_API_URL` = `https://api.unleashedsoftware.com`

### ✅ AI Services
- [ ] `OPENAI_API_KEY` = Your OpenAI key
- [ ] `ANTHROPIC_API_KEY` = Your Anthropic key
- [ ] `MCP_SERVER_URL` = `https://mcp-server-tkyu.onrender.com`
- [ ] `MCP_JWT_SECRET` = `sentia-mcp-jwt-secret-development-2025`

### ✅ Development-Specific Settings
- [ ] `ENABLE_AUTONOMOUS_TESTING` = `true`
- [ ] `AUTO_FIX_ENABLED` = `true`
- [ ] `AUTO_DEPLOY_ENABLED` = `true`
- [ ] `DEBUG_MODE` = `true`
- [ ] `LOG_LEVEL` = `debug`

### ✅ Sync Configuration
- [ ] `AUTO_SYNC_ENABLED` = `true`
- [ ] `XERO_SYNC_INTERVAL` = `*/30 * * * *`
- [ ] `SHOPIFY_SYNC_INTERVAL` = `*/15 * * * *`

---

## 📋 TESTING ENVIRONMENT
**Service**: `sentia-manufacturing-testing`
**URL**: https://sentia-manufacturing-testing.onrender.com
**Database**: `sentia-db-testing`

### ✅ Critical Variables
- [ ] `NODE_ENV` = `test`
- [ ] `PORT` = `10000`
- [ ] `DATABASE_URL` = Connection string from `sentia-db-testing`
- [ ] `VITE_CLERK_PUBLISHABLE_KEY` = `pk_test_Y2hhbXBpb24tYnVsbGRvZy05Mi5jbGVyay5hY2NvdW50cy5kZXYk`
- [ ] `CLERK_SECRET_KEY` = `sk_test_EP6iF7prGbq73CscUPCOW8PAKol4pPaBG5iYdsDodq`
- [ ] `SESSION_SECRET` = `sentia-session-secret-testing-2025`
- [ ] `JWT_SECRET` = `sentia-jwt-secret-testing-2025`
- [ ] `CORS_ORIGINS` = `https://sentia-manufacturing-testing.onrender.com`
- [ ] `VITE_API_BASE_URL` = `https://sentia-manufacturing-testing.onrender.com/api`
- [ ] `VITE_APP_TITLE` = `Sentia Manufacturing Dashboard`

### ✅ API Integrations
- [ ] All Xero variables (same as development)
- [ ] All Shopify variables (same as development)
- [ ] All Unleashed variables (same as development)
- [ ] All Microsoft Graph variables (if using)

### ✅ Testing-Specific Settings
- [ ] `ENABLE_AUTONOMOUS_TESTING` = `true`
- [ ] `AUTO_FIX_ENABLED` = `true`
- [ ] `AUTO_DEPLOY_ENABLED` = `false` ⚠️ Different from development
- [ ] `DEBUG_MODE` = `false` ⚠️ Different from development
- [ ] `LOG_LEVEL` = `info`

---

## 📋 PRODUCTION ENVIRONMENT
**Service**: `sentia-manufacturing-production`
**URL**: https://sentia-manufacturing-production.onrender.com
**Database**: `sentia-db-production`

### ✅ Critical Variables
- [ ] `NODE_ENV` = `production`
- [ ] `PORT` = `10000`
- [ ] `DATABASE_URL` = Connection string from `sentia-db-production`
- [ ] `VITE_CLERK_PUBLISHABLE_KEY` = Production Clerk key (if different)
- [ ] `CLERK_SECRET_KEY` = Production Clerk secret (if different)
- [ ] `SESSION_SECRET` = `sentia-session-secret-production-2025` (or generate new)
- [ ] `JWT_SECRET` = `sentia-jwt-secret-production-2025` (or generate new)
- [ ] `CORS_ORIGINS` = `https://sentia-manufacturing-production.onrender.com`
- [ ] `VITE_API_BASE_URL` = `https://sentia-manufacturing-production.onrender.com/api`
- [ ] `VITE_APP_TITLE` = `Sentia Manufacturing Dashboard`

### ✅ Production-Specific Settings
- [ ] `ENABLE_AUTONOMOUS_TESTING` = `false` ⚠️ Must be false
- [ ] `AUTO_FIX_ENABLED` = `false` ⚠️ Must be false
- [ ] `AUTO_DEPLOY_ENABLED` = `false` ⚠️ Must be false
- [ ] `DEBUG_MODE` = `false` ⚠️ Must be false
- [ ] `LOG_LEVEL` = `warn` or `error`

### ✅ Production Monitoring (Recommended)
- [ ] `SENTRY_DSN` = Your Sentry DSN for error tracking
- [ ] `NEW_RELIC_LICENSE_KEY` = New Relic key (if using)
- [ ] `LOGTAIL_SOURCE_TOKEN` = Logtail token (if using)

---

## 🔍 VERIFICATION STEPS

### 1. Check Variable Count
Each environment should have approximately:
- **Minimum Required**: 40+ variables
- **Full Integration**: 60+ variables
- **With Optional Services**: 80+ variables

### 2. Test Endpoints After Setup

#### Development
```bash
curl https://sentia-manufacturing-development.onrender.com/health
curl https://sentia-manufacturing-development.onrender.com/api/health
curl https://sentia-manufacturing-development.onrender.com/api/integrations/status
```

#### Testing
```bash
curl https://sentia-manufacturing-testing.onrender.com/health
curl https://sentia-manufacturing-testing.onrender.com/api/health
```

#### Production
```bash
curl https://sentia-manufacturing-production.onrender.com/health
curl https://sentia-manufacturing-production.onrender.com/api/health
```

### 3. Check Service Logs
Look for these success indicators:
- ✅ "Database connected successfully"
- ✅ "Clerk authentication initialized"
- ✅ "Xero service configured"
- ✅ "Shopify stores connected"
- ✅ "MCP server connected"
- ✅ "Server started on port"

Look for these error indicators:
- ❌ "Database connection failed"
- ❌ "Missing required environment variable"
- ❌ "API key not configured"
- ❌ "Failed to connect to"

---

## 🚨 COMMON MISSING VARIABLES

If features aren't working, check these often-missed variables:

### Authentication Issues
- Missing: `CLERK_WEBHOOK_SECRET`
- Missing: `SESSION_SECRET`
- Wrong: Using development Clerk keys in production

### API Integration Issues
- Missing: `XERO_TENANT_ID` (get after first connection)
- Missing: `AMAZON_SP_API_CLIENT_ID` and `AMAZON_SP_API_CLIENT_SECRET`
- Missing: `SHOPIFY_WEBHOOK_SECRET` (for webhooks)

### Database Issues
- Wrong: Using external URL instead of internal
- Missing: `?sslmode=require` in connection string
- Wrong: Database name doesn't match

### CORS Issues
- Wrong: `CORS_ORIGINS` doesn't match actual domain
- Missing: Additional allowed origins

---

## 🎯 QUICK SETUP COMMANDS

### Setup All Environments at Once
```powershell
# Windows PowerShell
.\render-complete-setup.ps1 -Environment all

# Or setup individually
.\render-complete-setup.ps1 -Environment development
.\render-complete-setup.ps1 -Environment testing
.\render-complete-setup.ps1 -Environment production
```

### Verify All Environments
```bash
node scripts/render-verify.js
```

### Check Specific Environment
```bash
node scripts/render-verify.js development
node scripts/render-verify.js testing
node scripts/render-verify.js production
```

---

## ✅ FINAL VERIFICATION

### All Environments Should Have:
1. ✅ Unique `DATABASE_URL` pointing to correct database
2. ✅ Unique `SESSION_SECRET` and `JWT_SECRET`
3. ✅ Correct `NODE_ENV` setting
4. ✅ Correct `CORS_ORIGINS` and `VITE_API_BASE_URL`
5. ✅ All API integration credentials
6. ✅ Appropriate feature flags for environment

### Production Must Have:
1. ✅ All testing/debug flags set to `false`
2. ✅ Production API keys (not test keys)
3. ✅ Monitoring/logging services configured
4. ✅ Secure session secrets (not default ones)

---

**Last Updated**: September 2025
**Total Checkpoints**: 150+ across all environments