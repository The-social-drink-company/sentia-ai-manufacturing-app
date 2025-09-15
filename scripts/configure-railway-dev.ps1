# Railway Development Environment Configuration Script
# Project: Sentia Manufacturing Analysis
# Environment: Development

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Railway Development Environment Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Core Configuration
railway variables set NODE_ENV=development
railway variables set PORT=3000
railway variables set CORS_ORIGINS="https://sentiadeploy.financeflo.ai,http://localhost:3000"

# Database (Neon PostgreSQL - Development Branch)
railway variables set DATABASE_URL="postgresql://neondb_owner:npg_2wXVD9gdintm@ep-shiny-dream-ab2zho2p-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
railway variables set DEV_DATABASE_URL="postgresql://neondb_owner:npg_2wXVD9gdintm@ep-shiny-dream-ab2zho2p-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# MCP Server Integration
railway variables set MCP_SERVER_URL="https://web-production-99691282.up.railway.app"
railway variables set MCP_SERVER_SERVICE_ID="99691282-de66-45b2-98cf-317083dd11ba"
railway variables set MCP_JWT_SECRET="dev_mcp_jwt_secret_aB3dE5fG7hJ9kL2mN4pQ6rS8tU0vW1xY"
railway variables set MCP_ENABLE_WEBSOCKET="true"
railway variables set MCP_SERVER_PORT="3001"

# Authentication (Clerk) - CONFIGURED
railway variables set VITE_CLERK_PUBLISHABLE_KEY="pk_test_Y2hhbXBpb24tYnVsbGRvZy05Mi5jbGVyay5hY2NvdW50cy5kZXYk"
railway variables set CLERK_SECRET_KEY="sk_test_EP6iF7prGbq73CscUPCOW8PAKol4pPaBG5iYdsDodq"
railway variables set CLERK_WEBHOOK_SECRET="whsec_CdtHP4SJICjWeYEJgLL3Wjnsppu8sUyy"

# Session & JWT
railway variables set SESSION_SECRET="dev_session_secret_xY9wV3uT1rS8pQ6nM4kL2jH5gF3dC1aZ"
railway variables set JWT_SECRET="dev_jwt_secret_bN8mK6jH4gF2dC0aZ9xW7vB5rT3qE1pL"

# Xero Integration (Configured)
railway variables set XERO_CLIENT_ID="9C0CAB921C134476A249E48BBECB8C4B"
railway variables set XERO_CLIENT_SECRET="f0TJpJSRX_B9NI51sknz7TuKbbSfhO4dEhTM4m4fWBlph9F5"
railway variables set XERO_REDIRECT_URI="https://sentiadeploy.financeflo.ai/api/xero/callback"
railway variables set XERO_TENANT_ID="YOUR_XERO_TENANT_ID"

# Shopify Integration (Configured - Multiple Regions)
# UK Store
railway variables set SHOPIFY_UK_API_KEY="7a30cd84e7a106b852c8e0fb789de10e"
railway variables set SHOPIFY_UK_SECRET="8b2d61745c506970c70d8c892f5f977e"
railway variables set SHOPIFY_UK_ACCESS_TOKEN="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"
railway variables set SHOPIFY_UK_SHOP_URL="sentiaspirits.myshopify.com"

# USA Store
railway variables set SHOPIFY_USA_API_KEY="83b8903fd8b509ef8bf93d1dbcd6079c"
railway variables set SHOPIFY_USA_SECRET="d01260e58adb00198cddddd1bd9a9490"
railway variables set SHOPIFY_USA_ACCESS_TOKEN="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"
railway variables set SHOPIFY_USA_SHOP_URL="us-sentiaspirits.myshopify.com"
railway variables set SHOPIFY_WEBHOOK_SECRET="YOUR_SHOPIFY_WEBHOOK_SECRET"

# Amazon SP-API (Configured)
railway variables set AMAZON_SP_API_CLIENT_ID="YOUR_AMAZON_CLIENT_ID"
railway variables set AMAZON_SP_API_CLIENT_SECRET="YOUR_AMAZON_CLIENT_SECRET"
railway variables set AMAZON_SP_API_REFRESH_TOKEN="YOUR_AMAZON_REFRESH_TOKEN"
railway variables set AMAZON_UK_MARKETPLACE_ID="A1F83G8C2ARO7P"
railway variables set AMAZON_USA_MARKETPLACE_ID="ATVPDKIKX0DER"
railway variables set AMAZON_SELLER_ID="YOUR_SELLER_ID"

# Unleashed ERP (Configured)
railway variables set UNLEASHED_API_ID="d5313df6-db35-430c-a69e-ae27dffe0c5a"
railway variables set UNLEASHED_API_KEY="2bJcHlDhIV04ScdqT60c3zlnG7hOER7aoPSh2IF2hWQluOi7ZaGkeu4SGeseYexAqOGfcRmyl9c6QYueJHyQ=="
railway variables set UNLEASHED_API_URL="https://api.unleashedsoftware.com"

# AI Services (Configured)
railway variables set OPENAI_API_KEY="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"
railway variables set ANTHROPIC_API_KEY="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"

# Auto-Sync Configuration
railway variables set AUTO_SYNC_ENABLED="true"
railway variables set XERO_SYNC_INTERVAL="*/30 * * * *"
railway variables set SHOPIFY_SYNC_INTERVAL="*/15 * * * *"
railway variables set AMAZON_SYNC_INTERVAL="*/60 * * * *"
railway variables set DATABASE_SYNC_INTERVAL="0 */6 * * *"

# Microsoft Graph API (For Excel/Spreadsheet Integration)
railway variables set MICROSOFT_CLIENT_ID="c16d6fba-0e6b-45ea-a016-eb697ff7a7ae"
railway variables set MICROSOFT_CLIENT_SECRET="peI8Q~4QJG.ax3ekxtWrv.PXVENVQ3vw_Br1qayM"
railway variables set MICROSOFT_TENANT_ID="common"
railway variables set MICROSOFT_ADMIN_EMAIL="admin@app.sentiaspirits.com"
railway variables set MICROSOFT_DATA_EMAIL="data@app.sentiaspirits.com"

# Redis Cache (Optional)
railway variables set REDIS_URL="redis://default:password@redis-server:6379"

# Monitoring (Optional)
railway variables set SENTRY_DSN="YOUR_SENTRY_DSN"
railway variables set LOG_LEVEL="debug"

# Feature Flags
railway variables set ENABLE_AUTONOMOUS_TESTING="true"
railway variables set AUTO_FIX_ENABLED="true"
railway variables set AUTO_DEPLOY_ENABLED="false"

# Development Settings
railway variables set VITE_API_BASE_URL="https://sentiadeploy.financeflo.ai/api"
railway variables set VITE_APP_TITLE="Sentia Manufacturing Dashboard - Development"
railway variables set VITE_APP_VERSION="1.0.0-dev"

# Build Configuration for Nixpacks
railway variables set NIXPACKS_NODE_VERSION="20"
railway variables set NIXPACKS_BUILD_CMD="npm ci && npm run build"
railway variables set NIXPACKS_START_CMD="npm start"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Environment Variables Set Successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Deployment will restart automatically with new configuration." -ForegroundColor Yellow
Write-Host ""
Write-Host "To verify deployment status, run:" -ForegroundColor Cyan
Write-Host "  railway logs" -ForegroundColor White
Write-Host ""
Write-Host "To check deployment URL, run:" -ForegroundColor Cyan
Write-Host "  railway open" -ForegroundColor White