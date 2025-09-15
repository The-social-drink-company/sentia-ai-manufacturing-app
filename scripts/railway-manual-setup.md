# Railway Manual Environment Variable Setup

## CRITICAL: Add These Variables to Railway Dashboard

Go to: https://railway.app/project/6d1ca9b2-75e2-46c6-86a8-ed05161112fe/service/e985e174-ebed-4043-81f8-7b1ab2e86cd2/settings

Click on the **Variables** tab and add these one by one:

### Step 1: Core Variables (MUST ADD FIRST)
```
NODE_ENV=development
PORT=3000
CORS_ORIGINS=https://sentiadeploy.financeflo.ai,http://localhost:3000
```

### Step 2: Database (CRITICAL)
```
DATABASE_URL=postgresql://neondb_owner:npg_2wXVD9gdintm@ep-shiny-dream-ab2zho2p-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
DEV_DATABASE_URL=postgresql://neondb_owner:npg_2wXVD9gdintm@ep-shiny-dream-ab2zho2p-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### Step 3: Authentication (CRITICAL)
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_Y2hhbXBpb24tYnVsbGRvZy05Mi5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_EP6iF7prGbq73CscUPCOW8PAKol4pPaBG5iYdsDodq
CLERK_WEBHOOK_SECRET=whsec_CdtHP4SJICjWeYEJgLL3Wjnsppu8sUyy
```

### Step 4: Session & JWT (CRITICAL)
```
SESSION_SECRET=dev_session_secret_xY9wV3uT1rS8pQ6nM4kL2jH5gF3dC1aZ
JWT_SECRET=dev_jwt_secret_bN8mK6jH4gF2dC0aZ9xW7vB5rT3qE1pL
```

### Step 5: Frontend Config (CRITICAL)
```
VITE_API_BASE_URL=https://sentiadeploy.financeflo.ai/api
VITE_APP_TITLE=Sentia Manufacturing Dashboard - Development
VITE_APP_VERSION=1.0.0-dev
```

### Step 6: Xero Integration
```
XERO_CLIENT_ID=9C0CAB921C134476A249E48BBECB8C4B
XERO_CLIENT_SECRET=f0TJpJSRX_B9NI51sknz7TuKbbSfhO4dEhTM4m4fWBlph9F5
XERO_REDIRECT_URI=https://sentiadeploy.financeflo.ai/api/xero/callback
XERO_TENANT_ID=YOUR_XERO_TENANT_ID
```

### Step 7: Shopify UK
```
SHOPIFY_UK_API_KEY=7a30cd84e7a106b852c8e0fb789de10e
SHOPIFY_UK_SECRET=8b2d61745c506970c70d8c892f5f977e
SHOPIFY_UK_ACCESS_TOKEN=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
SHOPIFY_UK_SHOP_URL=sentiaspirits.myshopify.com
```

### Step 8: Shopify USA
```
SHOPIFY_USA_API_KEY=83b8903fd8b509ef8bf93d1dbcd6079c
SHOPIFY_USA_SECRET=d01260e58adb00198cddddd1bd9a9490
SHOPIFY_USA_ACCESS_TOKEN=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
SHOPIFY_USA_SHOP_URL=us-sentiaspirits.myshopify.com
SHOPIFY_WEBHOOK_SECRET=YOUR_SHOPIFY_WEBHOOK_SECRET
```

### Step 9: Amazon SP-API
```
AMAZON_SP_API_CLIENT_ID=YOUR_AMAZON_CLIENT_ID
AMAZON_SP_API_CLIENT_SECRET=YOUR_AMAZON_CLIENT_SECRET
AMAZON_SP_API_REFRESH_TOKEN=YOUR_AMAZON_REFRESH_TOKEN
AMAZON_UK_MARKETPLACE_ID=A1F83G8C2ARO7P
AMAZON_USA_MARKETPLACE_ID=ATVPDKIKX0DER
AMAZON_SELLER_ID=YOUR_SELLER_ID
```

### Step 10: Unleashed ERP
```
UNLEASHED_API_ID=d5313df6-db35-430c-a69e-ae27dffe0c5a
UNLEASHED_API_KEY=2bJcHlDhIV04ScdqT60c3zlnG7hOER7aoPSh2IF2hWQluOi7ZaGkeu4SGeseYexAqOGfcRmyl9c6QYueJHyQ==
UNLEASHED_API_URL=https://api.unleashedsoftware.com
```

### Step 11: AI Services
```
OPENAI_API_KEY=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
ANTHROPIC_API_KEY=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
```

### Step 12: Microsoft Graph
```
MICROSOFT_CLIENT_ID=c16d6fba-0e6b-45ea-a016-eb697ff7a7ae
MICROSOFT_CLIENT_SECRET=peI8Q~4QJG.ax3ekxtWrv.PXVENVQ3vw_Br1qayM
MICROSOFT_TENANT_ID=common
MICROSOFT_ADMIN_EMAIL=admin@app.sentiaspirits.com
MICROSOFT_DATA_EMAIL=data@app.sentiaspirits.com
```

### Step 13: MCP Server Integration
```
MCP_SERVER_URL=https://web-production-99691282.up.railway.app
MCP_SERVER_SERVICE_ID=99691282-de66-45b2-98cf-317083dd11ba
MCP_JWT_SECRET=dev_mcp_jwt_secret_aB3dE5fG7hJ9kL2mN4pQ6rS8tU0vW1xY
MCP_ENABLE_WEBSOCKET=true
MCP_SERVER_PORT=3001
```

### Step 14: Auto-Sync Configuration
```
AUTO_SYNC_ENABLED=true
XERO_SYNC_INTERVAL=*/30 * * * *
SHOPIFY_SYNC_INTERVAL=*/15 * * * *
AMAZON_SYNC_INTERVAL=*/60 * * * *
DATABASE_SYNC_INTERVAL=0 */6 * * *
```

### Step 15: Redis Cache (Optional)
```
REDIS_URL=redis://default:password@redis-server:6379
```

### Step 16: Monitoring
```
SENTRY_DSN=YOUR_SENTRY_DSN
LOG_LEVEL=debug
```

### Step 17: Feature Flags
```
ENABLE_AUTONOMOUS_TESTING=true
AUTO_FIX_ENABLED=true
AUTO_DEPLOY_ENABLED=false
```

## After Adding Variables:

1. Click **"Deploy"** button in Railway to trigger a new deployment
2. Watch the build logs for any errors
3. Once deployed, test these endpoints:
   - https://sentiadeploy.financeflo.ai/health
   - https://sentiadeploy.financeflo.ai/api/health
   - https://sentiadeploy.financeflo.ai

## Expected Response from /health:
```json
{
  "status": "healthy",
  "timestamp": "2025-09-15T...",
  "port": 3000,
  "server": "server.js",
  "environment": "development"
}
```

## If Still Getting 502 Error:
1. Check Railway build logs for errors
2. Ensure all CRITICAL variables are set
3. Check that DATABASE_URL is properly formatted
4. Verify Clerk keys are correct
5. Check Railway deployment logs for startup errors