# Complete Render Environment Variables Setup

## All Variables Required for 100% Functionality

This guide ensures ALL THREE ENVIRONMENTS (Development, Testing, Production) have every required environment variable for complete functionality.

---

## 🔴 CRITICAL VARIABLES (Required for Basic Operation)

These MUST be set in ALL environments or the application won't start:

### Core Configuration

```bash
NODE_ENV=[development|test|production]  # Environment mode
PORT=10000                               # Render provides this automatically
DATABASE_URL=                            # PostgreSQL connection string (from Render database)
```

### Authentication (Clerk)

```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_Y2hhbXBpb24tYnVsbGRvZy05Mi5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_EP6iF7prGbq73CscUPCOW8PAKol4pPaBG5iYdsDodq
CLERK_WEBHOOK_SECRET=whsec_REDACTED
```

### Session Management

```bash
SESSION_SECRET=sentia-session-secret-[env]-2025
JWT_SECRET=sentia-jwt-secret-[env]-2025
```

### Application URLs

```bash
CORS_ORIGINS=https://sentia-manufacturing-[env].onrender.com
VITE_API_BASE_URL=https://sentia-manufacturing-[env].onrender.com/api
VITE_APP_TITLE=CapLiquify Manufacturing Platform
VITE_APP_VERSION=1.0.0
```

---

## 🟡 API INTEGRATIONS (Required for Full Functionality)

### Xero Accounting Integration

```bash
XERO_CLIENT_ID=9C0CAB921C134476A249E48BBECB8C4B
XERO_CLIENT_SECRET=f0TJpJSRX_B9NI51sknz7TuKbbSfhO4dEhTM4m4fWBlph9F5
XERO_REDIRECT_URI=https://sentia-manufacturing-[env].onrender.com/api/xero/callback
XERO_TENANT_ID=                         # Get from Xero after connection
XERO_WEBHOOK_SECRET=                    # Optional - for webhooks
```

### Shopify Integration (UK Store)

```bash
SHOPIFY_UK_API_KEY=7a30cd84e7a106b852c8e0fb789de10e
SHOPIFY_UK_SECRET=8b2d61745c506970c70d8c892f5f977e
SHOPIFY_UK_ACCESS_TOKEN=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
SHOPIFY_UK_SHOP_URL=sentiaspirits.myshopify.com
SHOPIFY_UK_WEBHOOK_SECRET=              # Optional - for webhooks
```

### Shopify Integration (USA Store)

```bash
SHOPIFY_USA_API_KEY=83b8903fd8b509ef8bf93d1dbcd6079c
SHOPIFY_USA_SECRET=d01260e58adb00198cddddd1bd9a9490
SHOPIFY_USA_ACCESS_TOKEN=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
SHOPIFY_USA_SHOP_URL=us-sentiaspirits.myshopify.com
SHOPIFY_USA_WEBHOOK_SECRET=             # Optional - for webhooks
```

### Amazon SP-API Integration

```bash
AMAZON_SP_API_CLIENT_ID=                # Required for Amazon integration
AMAZON_SP_API_CLIENT_SECRET=            # Required for Amazon integration
AMAZON_SP_API_REFRESH_TOKEN=            # Required for Amazon integration
AMAZON_UK_MARKETPLACE_ID=A1F83G8C2ARO7P
AMAZON_USA_MARKETPLACE_ID=ATVPDKIKX0DER
AMAZON_SELLER_ID=                       # Your seller ID
AMAZON_ROLE_ARN=                        # Optional - for assumed role
```

### Unleashed ERP Integration

```bash
UNLEASHED_API_ID=d5313df6-db35-430c-a69e-ae27dffe0c5a
UNLEASHED_API_KEY=2bJcHlDhIV04ScdqT60c3zlnG7hOER7aoPSh2IF2hWQluOi7ZaGkeu4SGeseYexAqOGfcRmyl9c6QYueJHyQ==
UNLEASHED_API_URL=https://api.unleashedsoftware.com
```

### Microsoft Graph API

```bash
MICROSOFT_CLIENT_ID=c16d6fba-0e6b-45ea-a016-eb697ff7a7ae
MICROSOFT_CLIENT_SECRET=peI8Q~4QJG.ax3ekxtWrv.PXVENVQ3vw_Br1qayM
MICROSOFT_TENANT_ID=common
MICROSOFT_ADMIN_EMAIL=admin@app.sentiaspirits.com
MICROSOFT_DATA_EMAIL=data@app.sentiaspirits.com
MICROSOFT_REDIRECT_URI=https://sentia-manufacturing-[env].onrender.com/auth/microsoft/callback
```

---

## 🟢 AI & ANALYTICS SERVICES

### OpenAI Integration

```bash
OPENAI_API_KEY=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
OPENAI_MODEL=gpt-4-turbo-preview        # Optional - defaults to gpt-3.5-turbo
```

### Anthropic Claude Integration

```bash
ANTHROPIC_API_KEY=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
ANTHROPIC_MODEL=claude-3-opus-20240229  # Optional - defaults to claude-3-sonnet
```

### Google AI (Optional)

```bash
GOOGLE_AI_API_KEY=                      # Optional - for Gemini Pro
GOOGLE_AI_MODEL=gemini-pro              # Optional
```

### MCP Server Integration

```bash
MCP_SERVER_URL=https://mcp-server-tkyu.onrender.com
MCP_JWT_SECRET=sentia-mcp-jwt-secret-[env]-2025
MCP_ENABLE_WEBSOCKET=true
MCP_SERVER_PORT=3001
MCP_SERVER_HEALTH_CHECK_INTERVAL=30000
```

---

## 🔵 OPTIONAL SERVICES

### Redis Cache (Performance Enhancement)

```bash
REDIS_URL=                              # Redis connection string (if using)
REDIS_TLS_URL=                          # TLS Redis connection (production)
CACHE_TTL=3600                          # Cache TTL in seconds
```

### Email Service (Notifications)

```bash
SMTP_HOST=                              # SMTP server
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@sentiaspirits.com
```

### SMS Service (Twilio)

```bash
TWILIO_ACCOUNT_SID=                     # Twilio account SID
TWILIO_AUTH_TOKEN=                      # Twilio auth token
TWILIO_PHONE_NUMBER=                    # Twilio phone number
```

### Payment Processing (Stripe)

```bash
STRIPE_SECRET_KEY=                      # Stripe secret key
STRIPE_PUBLISHABLE_KEY=                 # Stripe public key
STRIPE_WEBHOOK_SECRET=                  # Stripe webhook secret
```

### Monitoring & Logging

```bash
SENTRY_DSN=                             # Sentry error tracking
LOG_LEVEL=info                          # Logging level (debug|info|warn|error)
LOGTAIL_SOURCE_TOKEN=                   # Logtail logging service
NEW_RELIC_LICENSE_KEY=                  # New Relic monitoring
```

### Analytics

```bash
GOOGLE_ANALYTICS_ID=                    # Google Analytics ID
MIXPANEL_TOKEN=                         # Mixpanel analytics token
SEGMENT_WRITE_KEY=                      # Segment analytics key
```

---

## ⚙️ ENVIRONMENT-SPECIFIC SETTINGS

### Development Environment

```bash
NODE_ENV=development
ENABLE_AUTONOMOUS_TESTING=true
AUTO_FIX_ENABLED=true
AUTO_DEPLOY_ENABLED=true
DEBUG_MODE=true
ENABLE_SSE=true
ENABLE_WEBSOCKET=true
```

### Testing Environment

```bash
NODE_ENV=test
ENABLE_AUTONOMOUS_TESTING=true
AUTO_FIX_ENABLED=true
AUTO_DEPLOY_ENABLED=false
DEBUG_MODE=false
ENABLE_SSE=true
ENABLE_WEBSOCKET=true
```

### Production Environment

```bash
NODE_ENV=production
ENABLE_AUTONOMOUS_TESTING=false
AUTO_FIX_ENABLED=false
AUTO_DEPLOY_ENABLED=false
DEBUG_MODE=false
ENABLE_SSE=true
ENABLE_WEBSOCKET=true
```

---

## 🔄 AUTO-SYNC CONFIGURATION

### Sync Intervals (Cron Format)

```bash
AUTO_SYNC_ENABLED=true
XERO_SYNC_INTERVAL=*/30 * * * *        # Every 30 minutes
SHOPIFY_SYNC_INTERVAL=*/15 * * * *     # Every 15 minutes
AMAZON_SYNC_INTERVAL=*/60 * * * *      # Every hour
UNLEASHED_SYNC_INTERVAL=*/45 * * * *   # Every 45 minutes
DATABASE_SYNC_INTERVAL=0 */6 * * *     # Every 6 hours
```

---

## 📊 DATABASE CONFIGURATION

### Primary Database (Required)

```bash
DATABASE_URL=postgresql://user:pass@dpg-xxx.render.com:5432/dbname
DATABASE_CONNECTION_TIMEOUT=30000
DATABASE_POOL_TIMEOUT=30000
DATABASE_POOL_SIZE=20
```

### Database URLs by Environment

```bash
# Development
DEV_DATABASE_URL=postgresql://user:pass@dpg-dev-xxx.render.com:5432/sentia_db_development

# Testing
TEST_DATABASE_URL=postgresql://user:pass@dpg-test-xxx.render.com:5432/sentia_db_testing

# Production
PROD_DATABASE_URL=postgresql://user:pass@dpg-prod-xxx.render.com:5432/sentia_db_production
```

---

## 🚀 DEPLOYMENT CONFIGURATION

### Build & Deploy Settings

```bash
BUILD_TIMEOUT=1800000                   # 30 minutes
DEPLOYMENT_TIMEOUT=600000                # 10 minutes
HEALTH_CHECK_TIMEOUT=30000              # 30 seconds
STARTUP_PROBE_TIMEOUT=300000            # 5 minutes
```

### Feature Flags

```bash
FEATURE_DASHBOARD_V2=true
FEATURE_AI_ANALYTICS=true
FEATURE_REAL_TIME_SYNC=true
FEATURE_ADVANCED_FORECASTING=true
FEATURE_MULTI_WAREHOUSE=true
FEATURE_QUALITY_CONTROL=true
```

---

## 📋 COMPLETE CHECKLIST BY ENVIRONMENT

### ✅ DEVELOPMENT Environment Variables

```bash
# Copy all from CRITICAL section
# Copy all from API INTEGRATIONS section
# Copy all from AI & ANALYTICS section
# Set NODE_ENV=development
# Set CORS_ORIGINS=https://sentia-manufacturing-development.onrender.com
# Set VITE_API_BASE_URL=https://sentia-manufacturing-development.onrender.com/api
# Set DATABASE_URL from sentia-db-development
# Enable all feature flags for testing
```

### ✅ TESTING Environment Variables

```bash
# Copy all from CRITICAL section
# Copy all from API INTEGRATIONS section
# Copy all from AI & ANALYTICS section
# Set NODE_ENV=test
# Set CORS_ORIGINS=https://sentia-manufacturing-testing.onrender.com
# Set VITE_API_BASE_URL=https://sentia-manufacturing-testing.onrender.com/api
# Set DATABASE_URL from sentia-db-testing
# Set AUTO_DEPLOY_ENABLED=false
```

### ✅ PRODUCTION Environment Variables

```bash
# Copy all from CRITICAL section
# Copy all from API INTEGRATIONS section
# Copy all from AI & ANALYTICS section
# Set NODE_ENV=production
# Set CORS_ORIGINS=https://sentia-manufacturing-production.onrender.com
# Set VITE_API_BASE_URL=https://sentia-manufacturing-production.onrender.com/api
# Set DATABASE_URL from sentia-db-production
# Disable all testing/debug flags
# Add monitoring (Sentry, etc.)
```

---

## 🔐 SECURITY NOTES

1. **Never commit API keys** to Git
2. **Use Render's secret generation** for SESSION_SECRET and JWT_SECRET
3. **Rotate API keys** regularly
4. **Use Internal Database URLs** for same-region connections
5. **Enable SSL/TLS** for all external connections

---

## 🛠️ QUICK SETUP SCRIPTS

### Setup All Environments

```bash
# Development
node scripts/render-setup.js development

# Testing
node scripts/render-setup.js testing

# Production
node scripts/render-setup.js production
```

### Verify All Services

```bash
node scripts/render-verify.js
```

---

## ⚠️ MISSING VARIABLE INDICATORS

If you see these errors, add the corresponding variable:

- `"Clerk is not configured"` → Add CLERK_SECRET_KEY
- `"Database connection failed"` → Add DATABASE_URL
- `"Xero not configured"` → Add XERO_CLIENT_ID and XERO_CLIENT_SECRET
- `"Shopify sync failed"` → Add SHOPIFY\_\*\_ACCESS_TOKEN
- `"AI analysis unavailable"` → Add OPENAI_API_KEY or ANTHROPIC_API_KEY
- `"MCP server disconnected"` → Add MCP_SERVER_URL

---

## 📊 VERIFICATION ENDPOINTS

Test these after setting variables:

1. **Health Check**: `/health`
2. **API Status**: `/api/health`
3. **Database**: `/api/database/health`
4. **Integrations**: `/api/integrations/status`
5. **AI Services**: `/api/ai/status`

---

**Last Updated**: September 2025
**Total Variables**: 100+ (40 required, 60+ optional)

