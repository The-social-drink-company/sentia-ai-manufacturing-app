# 🚨 IMMEDIATE ACTION REQUIRED - PRODUCTION IS DOWN

**Time to Fix**: 5 minutes
**Current Status**: 502 Bad Gateway
**Root Cause**: Missing environment variables

---

## FASTEST METHOD: Copy & Paste (2 minutes)

### Step 1: Open Render Dashboard

Click this link: https://dashboard.render.com/web/srv-ctg8hkpu0jms73ab8m00/env

### Step 2: Click "Bulk Edit" Button

Look for the "Bulk Edit" button on the environment variables page

### Step 3: Copy ALL Text Below

```
NODE_ENV=production
PORT=5000
VITE_CLERK_PUBLISHABLE_KEY=pk_live_REDACTED
CLERK_SECRET_KEY=sk_live_REDACTED
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_REDACTED
CLERK_PUBLISHABLE_KEY=pk_live_REDACTED
VITE_CLERK_DOMAIN=clerk.financeflo.ai
VITE_CLERK_SIGN_IN_URL=/sign-in
VITE_CLERK_SIGN_UP_URL=/sign-up
VITE_CLERK_AFTER_SIGN_IN_URL=/dashboard
VITE_CLERK_AFTER_SIGN_UP_URL=/dashboard
CLERK_WEBHOOK_SECRET=whsec_REDACTED
CLERK_ENVIRONMENT=production
VITE_FORCE_CLERK_AUTH=true
VITE_DISABLE_AUTH_FALLBACK=true
VITE_API_BASE_URL=/api
API_BASE_URL=/api
VITE_APP_TITLE=Sentia Manufacturing Dashboard
VITE_APP_VERSION=1.0.5
CORS_ORIGINS=https://sentia-manufacturing-production.onrender.com
MCP_SERVER_URL=https://mcp-server-tkyu.onrender.com
VITE_MCP_SERVER_URL=https://mcp-server-tkyu.onrender.com
MCP_JWT_SECRET=production-mcp-jwt-secret-2025
MCP_ENABLE_WEBSOCKET=true
XERO_CLIENT_ID=9C0CAB921C134476A249E48BBECB8C4B
XERO_CLIENT_SECRET=f0TJpJSRX_B9NI51sknz7TuKbbSfhO4dEhTM4m4fWBlph9F5
XERO_REDIRECT_URI=https://sentia-manufacturing-production.onrender.com/api/xero/callback
SHOPIFY_UK_API_KEY=7a30cd84e7a106b852c8e0fb789de10e
SHOPIFY_UK_SECRET=8b2d61745c506970c70d8c892f5f977e
SHOPIFY_UK_ACCESS_TOKEN=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
SHOPIFY_UK_SHOP_URL=sentiaspirits.myshopify.com
SHOPIFY_USA_API_KEY=83b8903fd8b509ef8bf93d1dbcd6079c
SHOPIFY_USA_SECRET=d01260e58adb00198cddddd1bd9a9490
SHOPIFY_USA_ACCESS_TOKEN=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
SHOPIFY_USA_SHOP_URL=us-sentiaspirits.myshopify.com
UNLEASHED_API_ID=d5313df6-db35-430c-a69e-ae27dffe0c5a
UNLEASHED_API_KEY=2bJcHlDhIV04ScdqT60c3zlnG7hOER7aoPSh2IF2hWQluOi7ZaGkeu4SGeseYexAqOGfcRmyl9c6QYueJHyQ==
UNLEASHED_API_URL=https://api.unleashedsoftware.com
OPENAI_API_KEY=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
ANTHROPIC_API_KEY=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
MICROSOFT_CLIENT_ID=c16d6fba-0e6b-45ea-a016-eb697ff7a7ae
MICROSOFT_CLIENT_SECRET=peI8Q~4QJG.ax3ekxtWrv.PXVENVQ3vw_Br1qayM
MICROSOFT_TENANT_ID=common
MICROSOFT_ADMIN_EMAIL=admin@app.sentiaspirits.com
MICROSOFT_DATA_EMAIL=data@app.sentiaspirits.com
AUTO_DEPLOY_ENABLED=false
AUTO_FIX_ENABLED=false
ENABLE_AUTONOMOUS_TESTING=false
ENABLE_AI_FEATURES=true
ENABLE_SSE=true
ENABLE_WEBSOCKETS=true
AUTO_SYNC_ENABLED=true
SESSION_SECRET=production-session-secret-2025-sentia
JWT_SECRET=production-jwt-secret-2025-sentia
JWT_EXPIRES_IN=24h
LOG_LEVEL=error
ERROR_TRACKING_ENABLED=true
XERO_SYNC_INTERVAL=*/30 * * * *
SHOPIFY_SYNC_INTERVAL=*/15 * * * *
AMAZON_SYNC_INTERVAL=*/60 * * * *
DATABASE_SYNC_INTERVAL=0 */6 * * *
RENDER_SERVICE_NAME=sentia-manufacturing-production
RENDER_EXTERNAL_URL=https://sentia-manufacturing-production.onrender.com
```

### Step 4: Paste in Bulk Edit Mode

Paste all the above text into the bulk edit text area

### Step 5: Click "Save Changes"

The deployment will start automatically

---

## ALTERNATIVE: Automated Script (3 minutes)

If you have a Render API key, run:

```powershell
.\apply-render-env-from-file.ps1
```

To get API key:

1. Go to: https://dashboard.render.com/u/settings
2. Find "API Keys" section
3. Create or copy key

---

## VERIFY SUCCESS (After 3 minutes)

Run this command:

```powershell
.\quick-test-production.ps1
```

Or visit: https://sentia-manufacturing-production.onrender.com

**Success = No more 502 errors!**

---

## MONITOR DEPLOYMENT

Watch the deployment progress:

```powershell
.\monitor-production.ps1
```

Or view in dashboard:
https://dashboard.render.com/web/srv-ctg8hkpu0jms73ab8m00/deploys

---

## TROUBLESHOOTING

If still getting 502 after adding variables:

1. Check logs: https://dashboard.render.com/web/srv-ctg8hkpu0jms73ab8m00/logs
2. Verify PORT=5000 is set
3. Verify NODE_ENV=production is set
4. Check that deployment completed successfully

---

**TIME IS CRITICAL - PRODUCTION IS DOWN**
**Follow Step 1-5 above to restore service immediately!**
