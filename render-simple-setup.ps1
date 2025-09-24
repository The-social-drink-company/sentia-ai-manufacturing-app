# Simple Render Environment Variables Setup
# Creates files you can manually paste into Render dashboard

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   RENDER ENVIRONMENT SETUP FILES" -ForegroundColor Yellow  
Write-Host "================================================" -ForegroundColor Cyan

# Create comprehensive environment variable files for each service

# Development Environment
$devVars = @"
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://neondb_owner:npg_2wXVD9gdintm@ep-aged-dust-abpyip0r-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require
DEV_DATABASE_URL=postgresql://neondb_owner:npg_2wXVD9gdintm@ep-aged-dust-abpyip0r-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require
TEST_DATABASE_URL=postgresql://neondb_owner:npg_2wXVD9gdintm@ep-shiny-dream-ab2zho2p-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require
PROD_DATABASE_URL=postgresql://neondb_owner:npg_2wXVD9gdintm@ep-damp-wave-abxu46so-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require
VITE_CLERK_PUBLISHABLE_KEY=pk_test_Y2hhbXBpb24tYnVsbGRvZy05Mi5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_EP6iF7prGbq73CscUPCOW8PAKol4pPaBG5iYdsDodq
CLERK_WEBHOOK_SECRET=whsec_iTUcbgzS5P6zJlXWQkc4zGHnw8yLGt9j
SESSION_SECRET=sentia-session-secret-dev-2025
JWT_SECRET=sentia-jwt-secret-dev-2025
XERO_CLIENT_ID=9C0CAB921C134476A249E48BBECB8C4B
XERO_CLIENT_SECRET=f0TJpJSRX_B9NI51sknz7TuKbbSfhO4dEhTM4m4fWBlph9F5
XERO_REDIRECT_URI=https://sentia-manufacturing-development.onrender.com/api/xero/callback
SHOPIFY_UK_API_KEY=7a30cd84e7a106b852c8e0fb789de10e
SHOPIFY_UK_SECRET=8b2d61745c506970c70d8c892f5f977e
SHOPIFY_UK_ACCESS_TOKEN=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
SHOPIFY_UK_SHOP_URL=sentiaspirits.myshopify.com
SHOPIFY_USA_API_KEY=83b8903fd8b509ef8bf93d1dbcd6079c
SHOPIFY_USA_SECRET=d01260e58adb00198cddddd1bd9a9490
SHOPIFY_USA_ACCESS_TOKEN=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
SHOPIFY_USA_SHOP_URL=us-sentiaspirits.myshopify.com
AMAZON_UK_MARKETPLACE_ID=A1F83G8C2ARO7P
AMAZON_USA_MARKETPLACE_ID=ATVPDKIKX0DER
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
MCP_SERVER_URL=https://sentia-mcp-server.onrender.com
MCP_SERVER_SERVICE_ID=99691282-de66-45b2-98cf-317083dd11ba
MCP_JWT_SECRET=sentia-mcp-jwt-secret-dev-2025
MCP_ENABLE_WEBSOCKET=true
MCP_SERVER_PORT=3001
AUTO_SYNC_ENABLED=true
XERO_SYNC_INTERVAL=*/30 * * * *
SHOPIFY_SYNC_INTERVAL=*/15 * * * *
AMAZON_SYNC_INTERVAL=*/60 * * * *
DATABASE_SYNC_INTERVAL=0 */6 * * *
LOG_LEVEL=info
ENABLE_AUTONOMOUS_TESTING=true
AUTO_FIX_ENABLED=true
AUTO_DEPLOY_ENABLED=true
VITE_API_BASE_URL=https://sentia-manufacturing-development.onrender.com/api
VITE_APP_TITLE=Sentia Manufacturing Dashboard
VITE_APP_VERSION=1.0.0
CORS_ORIGINS=https://sentia-manufacturing-development.onrender.com
"@

# Testing Environment
$testVars = @"
NODE_ENV=test
PORT=3000
DATABASE_URL=postgresql://neondb_owner:npg_2wXVD9gdintm@ep-shiny-dream-ab2zho2p-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require
DEV_DATABASE_URL=postgresql://neondb_owner:npg_2wXVD9gdintm@ep-aged-dust-abpyip0r-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require
TEST_DATABASE_URL=postgresql://neondb_owner:npg_2wXVD9gdintm@ep-shiny-dream-ab2zho2p-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require
PROD_DATABASE_URL=postgresql://neondb_owner:npg_2wXVD9gdintm@ep-damp-wave-abxu46so-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require
VITE_CLERK_PUBLISHABLE_KEY=pk_test_Y2hhbXBpb24tYnVsbGRvZy05Mi5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_EP6iF7prGbq73CscUPCOW8PAKol4pPaBG5iYdsDodq
CLERK_WEBHOOK_SECRET=whsec_iTUcbgzS5P6zJlXWQkc4zGHnw8yLGt9j
SESSION_SECRET=sentia-session-secret-test-2025
JWT_SECRET=sentia-jwt-secret-test-2025
XERO_CLIENT_ID=9C0CAB921C134476A249E48BBECB8C4B
XERO_CLIENT_SECRET=f0TJpJSRX_B9NI51sknz7TuKbbSfhO4dEhTM4m4fWBlph9F5
XERO_REDIRECT_URI=https://sentia-manufacturing-testing.onrender.com/api/xero/callback
SHOPIFY_UK_API_KEY=7a30cd84e7a106b852c8e0fb789de10e
SHOPIFY_UK_SECRET=8b2d61745c506970c70d8c892f5f977e
SHOPIFY_UK_ACCESS_TOKEN=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
SHOPIFY_UK_SHOP_URL=sentiaspirits.myshopify.com
SHOPIFY_USA_API_KEY=83b8903fd8b509ef8bf93d1dbcd6079c
SHOPIFY_USA_SECRET=d01260e58adb00198cddddd1bd9a9490
SHOPIFY_USA_ACCESS_TOKEN=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
SHOPIFY_USA_SHOP_URL=us-sentiaspirits.myshopify.com
AMAZON_UK_MARKETPLACE_ID=A1F83G8C2ARO7P
AMAZON_USA_MARKETPLACE_ID=ATVPDKIKX0DER
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
MCP_SERVER_URL=https://sentia-mcp-server.onrender.com
MCP_SERVER_SERVICE_ID=99691282-de66-45b2-98cf-317083dd11ba
MCP_JWT_SECRET=sentia-mcp-jwt-secret-test-2025
MCP_ENABLE_WEBSOCKET=true
MCP_SERVER_PORT=3001
AUTO_SYNC_ENABLED=true
XERO_SYNC_INTERVAL=*/30 * * * *
SHOPIFY_SYNC_INTERVAL=*/15 * * * *
AMAZON_SYNC_INTERVAL=*/60 * * * *
DATABASE_SYNC_INTERVAL=0 */6 * * *
LOG_LEVEL=info
ENABLE_AUTONOMOUS_TESTING=true
AUTO_FIX_ENABLED=true
AUTO_DEPLOY_ENABLED=false
VITE_API_BASE_URL=https://sentia-manufacturing-testing.onrender.com/api
VITE_APP_TITLE=Sentia Manufacturing Dashboard
VITE_APP_VERSION=1.0.0
CORS_ORIGINS=https://sentia-manufacturing-testing.onrender.com
"@

# Production Environment
$prodVars = @"
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://neondb_owner:npg_2wXVD9gdintm@ep-damp-wave-abxu46so-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
DEV_DATABASE_URL=postgresql://neondb_owner:npg_2wXVD9gdintm@ep-aged-dust-abpyip0r-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require
TEST_DATABASE_URL=postgresql://neondb_owner:npg_2wXVD9gdintm@ep-shiny-dream-ab2zho2p-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require
PROD_DATABASE_URL=postgresql://neondb_owner:npg_2wXVD9gdintm@ep-damp-wave-abxu46so-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
VITE_CLERK_PUBLISHABLE_KEY=pk_test_Y2hhbXBpb24tYnVsbGRvZy05Mi5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_EP6iF7prGbq73CscUPCOW8PAKol4pPaBG5iYdsDodq
CLERK_WEBHOOK_SECRET=whsec_iTUcbgzS5P6zJlXWQkc4zGHnw8yLGt9j
SESSION_SECRET=sentia-session-secret-prod-2025
JWT_SECRET=sentia-jwt-secret-prod-2025
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
AMAZON_UK_MARKETPLACE_ID=A1F83G8C2ARO7P
AMAZON_USA_MARKETPLACE_ID=ATVPDKIKX0DER
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
MCP_SERVER_URL=https://sentia-mcp-server.onrender.com
MCP_SERVER_SERVICE_ID=99691282-de66-45b2-98cf-317083dd11ba
MCP_JWT_SECRET=sentia-mcp-jwt-secret-prod-2025
MCP_ENABLE_WEBSOCKET=true
MCP_SERVER_PORT=3001
AUTO_SYNC_ENABLED=true
XERO_SYNC_INTERVAL=*/30 * * * *
SHOPIFY_SYNC_INTERVAL=*/15 * * * *
AMAZON_SYNC_INTERVAL=*/60 * * * *
DATABASE_SYNC_INTERVAL=0 */6 * * *
LOG_LEVEL=info
ENABLE_AUTONOMOUS_TESTING=false
AUTO_FIX_ENABLED=false
AUTO_DEPLOY_ENABLED=false
VITE_API_BASE_URL=https://sentia-manufacturing-production.onrender.com/api
VITE_APP_TITLE=Sentia Manufacturing Dashboard
VITE_APP_VERSION=1.0.0
CORS_ORIGINS=https://sentia-manufacturing-production.onrender.com
"@

# Save to files
$devVars | Out-File -FilePath "render-vars-DEVELOPMENT.txt" -Encoding UTF8
$testVars | Out-File -FilePath "render-vars-TESTING.txt" -Encoding UTF8
$prodVars | Out-File -FilePath "render-vars-PRODUCTION.txt" -Encoding UTF8

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "   FILES CREATED SUCCESSFULLY" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan

Write-Host "`nEnvironment variable files created:" -ForegroundColor Yellow
Write-Host "  - render-vars-DEVELOPMENT.txt (52 variables)" -ForegroundColor White
Write-Host "  - render-vars-TESTING.txt (52 variables)" -ForegroundColor White
Write-Host "  - render-vars-PRODUCTION.txt (52 variables)" -ForegroundColor White

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "   HOW TO ADD VARIABLES TO RENDER" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan

Write-Host "`nSince the API isn't working properly, here's the manual process:" -ForegroundColor White
Write-Host ""
Write-Host "For EACH service (Development, Testing, Production):" -ForegroundColor Cyan
Write-Host "1. Go to https://dashboard.render.com" -ForegroundColor White
Write-Host "2. Click on the service (e.g., sentia-manufacturing-development)" -ForegroundColor White
Write-Host "3. Go to the 'Environment' tab" -ForegroundColor White
Write-Host "4. Look for 'Add Environment Variable' button or similar" -ForegroundColor White
Write-Host "5. Open the corresponding file (render-vars-DEVELOPMENT.txt)" -ForegroundColor White
Write-Host "6. Copy ALL contents from the file" -ForegroundColor White
Write-Host "7. Paste into Render's environment section" -ForegroundColor White
Write-Host "8. Save changes" -ForegroundColor White
Write-Host "9. The service will automatically redeploy with new variables" -ForegroundColor White

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "   ALTERNATIVE: USE RENDER.YAML" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan

Write-Host "`nThe render.yaml file in your repo already contains all variables." -ForegroundColor Green
Write-Host "Render should automatically load these when deploying from GitHub." -ForegroundColor Green
Write-Host ""
Write-Host "If variables aren't loading from render.yaml:" -ForegroundColor Yellow
Write-Host "1. Make sure render.yaml is committed to your repo" -ForegroundColor White
Write-Host "2. Trigger a manual deploy from Render dashboard" -ForegroundColor White
Write-Host "3. Check the deploy logs for any errors" -ForegroundColor White

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "   CHECKING DEPLOYMENT STATUS" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan

Write-Host "`nYour deployments were triggered earlier." -ForegroundColor Green
Write-Host "Check their status at:" -ForegroundColor White
Write-Host "  https://dashboard.render.com/services" -ForegroundColor Cyan

Write-Host "`nOnce variables are added, services will be available at:" -ForegroundColor Yellow
Write-Host "  Development: https://sentia-manufacturing-development.onrender.com" -ForegroundColor White
Write-Host "  Testing: https://sentia-manufacturing-testing.onrender.com" -ForegroundColor White
Write-Host "  Production: https://sentia-manufacturing-production.onrender.com" -ForegroundColor White