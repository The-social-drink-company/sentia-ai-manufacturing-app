# Development Environment Configuration

This document contains the environment configuration for the Sentia Manufacturing Dashboard development environment deployed on Render.

## Environment Details
- **Environment**: Development
- **Platform**: Render
- **Last Updated**: September 2025

## Database Configuration
```
DATABASE_URL=postgresql://sentia_dev:nZ4vtXienMAwxahr0GJByc2qXFIFSoYL@dpg-d344rkfdiees73a20c50-a:5432/sentia_manufacturing_dev
```

## Authentication Configuration

### Development Authentication Bypass
```
VITE_DEVELOPMENT_MODE=true  # Bypasses Clerk authentication for development
```

### Clerk Authentication (Production Keys - Used when VITE_DEVELOPMENT_MODE=false)
```
CLERK_ENVIRONMENT=production
CLERK_SECRET_KEY=sk_live_REDACTED
CLERK_WEBHOOK_SECRET=whsec_REDACTED
VITE_CLERK_PUBLISHABLE_KEY=pk_live_REDACTED
VITE_CLERK_DOMAIN=clerk.financeflo.ai
VITE_CLERK_AFTER_SIGN_IN_URL=/dashboard
VITE_CLERK_AFTER_SIGN_UP_URL=/dashboard
VITE_CLERK_SIGN_IN_URL=/sign-in
VITE_CLERK_SIGN_UP_URL=/sign-up
VITE_DISABLE_AUTH_FALLBACK=true
VITE_FORCE_CLERK_AUTH=true
```

### Session Management
```
JWT_SECRET=wF08R/0kITl5rsQkgJhDef9otQ/3KERqlHRnjdpKavg=
SESSION_SECRET=JtjquFaltrbuQ+8YAwUEJ5kKEvn6LElVPKuBvQ0imKE=
```

## API Integrations

### Amazon SP-API
```
AMAZON_USA_MARKETPLACE_ID=ATVPDKIKX0DER
AMAZON_UK_MARKETPLACE_ID=A1F83G8C2ARO7P
AMAZON_SYNC_INTERVAL=*/60 * * * *
```

### Shopify Configuration

#### UK Store
```
SHOPIFY_UK_SHOP_URL=sentiaspirits.myshopify.com
SHOPIFY_UK_ACCESS_TOKEN=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
SHOPIFY_UK_API_KEY=7a30cd84e7a106b852c8e0fb789de10e
SHOPIFY_UK_SECRET=8b2d61745c506970c70d8c892f5f977e
```

#### USA Store
```
SHOPIFY_USA_SHOP_URL=us-sentiaspirits.myshopify.com
SHOPIFY_USA_ACCESS_TOKEN=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
SHOPIFY_USA_API_KEY=83b8903fd8b509ef8bf93d1dbcd6079c
SHOPIFY_USA_SECRET=d01260e58adb00198cddddd1bd9a9490
```

#### Sync Settings
```
SHOPIFY_SYNC_INTERVAL=*/15 * * * *
```

### Xero Accounting
```
XERO_CLIENT_ID=9C0CAB921C134476A249E48BBECB8C4B
XERO_CLIENT_SECRET=f0TJpJSRX_B9NI51sknz7TuKbbSfhO4dEhTM4m4fWBlph9F5
XERO_REDIRECT_URI=https://sentia-manufacturing-development.onrender.com/api/xero/callback
XERO_SYNC_INTERVAL=*/30 * * * *
```

### Unleashed Inventory Management
```
UNLEASHED_API_URL=https://api.unleashedsoftware.com
UNLEASHED_API_ID=d5313df6-db35-430c-a69e-ae27dffe0c5a
UNLEASHED_API_KEY=2bJcHlDhIV04ScdqT60c3zlnG7hOER7aoPSh2IF2hWQluOi7ZaGkeu4SGeseYexAqOGfcRmyl9c6QYueJHyQ==
```

### Microsoft Azure AD
```
MICROSOFT_TENANT_ID=common
MICROSOFT_CLIENT_ID=c16d6fba-0e6b-45ea-a016-eb697ff7a7ae
MICROSOFT_CLIENT_SECRET=peI8Q~4QJG.ax3ekxtWrv.PXVENVQ3vw_Br1qayM
MICROSOFT_ADMIN_EMAIL=admin@app.sentiaspirits.com
MICROSOFT_DATA_EMAIL=data@app.sentiaspirits.com
```

### AI Services
```
OPENAI_API_KEY=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
ANTHROPIC_API_KEY=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
```

## MCP Server Configuration
```
MCP_SERVER_PORT=3001
MCP_SERVER_URL=https://mcp-server-tkyu.onrender.com
MCP_JWT_SECRET=UCL2hGcrBa4GdF32izKAd2dTBDJ5WidLVuV5r3uPTOc=
MCP_SERVER_HEALTH_CHECK_INTERVAL=30000
MCP_ENABLE_WEBSOCKET=true
```

## Application Configuration
```
NODE_ENV=development
LOG_LEVEL=info
CORS_ORIGINS=https://sentia-manufacturing-development.onrender.com
```

## Frontend Configuration
```
VITE_API_BASE_URL=https://sentia-manufacturing-development.onrender.com/api
VITE_APP_TITLE=Sentia Manufacturing Dashboard
VITE_APP_VERSION=1.0.0
```

## Automation Settings
```
ENABLE_AUTONOMOUS_TESTING=true
AUTO_FIX_ENABLED=true
AUTO_DEPLOY_ENABLED=false
AUTO_SYNC_ENABLED=true
DATABASE_SYNC_INTERVAL=0 */6 * * *
```

## Important Notes

1. **Security**: This file contains sensitive credentials and should never be committed to version control
2. **Environment**: This is specifically for the development environment on Render
3. **Sync Intervals**: Various services have different sync intervals configured using cron syntax
4. **Authentication**: Using production Clerk keys even in development environment
5. **Database**: PostgreSQL database hosted on Render with pgvector extension

## Usage

These environment variables should be configured in the Render dashboard for the development service:
- Navigate to https://dashboard.render.com
- Select the sentia-manufacturing-development service
- Go to the Environment tab
- Add all these variables

The variables are automatically injected into the application at runtime by Render.