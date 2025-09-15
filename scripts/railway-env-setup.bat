@echo off
echo ========================================
echo Setting Railway Environment Variables
echo for Development Environment
echo ========================================
echo.
echo NOTE: You must manually set these variables in Railway Dashboard
echo Go to: https://railway.app/project/6d1ca9b2-75e2-46c6-86a8-ed05161112fe/service/e985e174-ebed-4043-81f8-7b1ab2e86cd2/settings
echo.
echo Copy and paste these variables into Railway:
echo.
echo # Core Configuration
echo NODE_ENV=development
echo PORT=3000
echo CORS_ORIGINS=https://sentiadeploy.financeflo.ai,http://localhost:3000
echo.
echo # Database (Neon PostgreSQL - Development Branch)
echo DATABASE_URL=postgresql://neondb_owner:npg_2wXVD9gdintm@ep-shiny-dream-ab2zho2p-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require^&channel_binding=require
echo DEV_DATABASE_URL=postgresql://neondb_owner:npg_2wXVD9gdintm@ep-shiny-dream-ab2zho2p-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require^&channel_binding=require
echo.
echo # Authentication (Clerk)
echo VITE_CLERK_PUBLISHABLE_KEY=pk_test_Y2hhbXBpb24tYnVsbGRvZy05Mi5jbGVyay5hY2NvdW50cy5kZXYk
echo CLERK_SECRET_KEY=sk_test_EP6iF7prGbq73CscUPCOW8PAKol4pPaBG5iYdsDodq
echo.
echo # Xero Integration
echo XERO_CLIENT_ID=9C0CAB921C134476A249E48BBECB8C4B
echo XERO_CLIENT_SECRET=f0TJpJSRX_B9NI51sknz7TuKbbSfhO4dEhTM4m4fWBlph9F5
echo XERO_REDIRECT_URI=https://sentiadeploy.financeflo.ai/api/xero/callback
echo.
echo # Shopify UK Store
echo SHOPIFY_UK_API_KEY=7a30cd84e7a106b852c8e0fb789de10e
echo SHOPIFY_UK_SECRET=8b2d61745c506970c70d8c892f5f977e
echo SHOPIFY_UK_ACCESS_TOKEN=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
echo SHOPIFY_UK_SHOP_URL=sentiaspirits.myshopify.com
echo.
echo # Shopify USA Store
echo SHOPIFY_USA_API_KEY=83b8903fd8b509ef8bf93d1dbcd6079c
echo SHOPIFY_USA_SECRET=d01260e58adb00198cddddd1bd9a9490
echo SHOPIFY_USA_ACCESS_TOKEN=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
echo SHOPIFY_USA_SHOP_URL=us-sentiaspirits.myshopify.com
echo.
echo # Unleashed ERP
echo UNLEASHED_API_ID=d5313df6-db35-430c-a69e-ae27dffe0c5a
echo UNLEASHED_API_KEY=2bJcHlDhIV04ScdqT60c3zlnG7hOER7aoPSh2IF2hWQluOi7ZaGkeu4SGeseYexAqOGfcRmyl9c6QYueJHyQ==
echo UNLEASHED_API_URL=https://api.unleashedsoftware.com
echo.
echo # AI Services
echo OPENAI_API_KEY=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
echo ANTHROPIC_API_KEY=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
echo.
echo # Microsoft Graph API
echo MICROSOFT_CLIENT_ID=c16d6fba-0e6b-45ea-a016-eb697ff7a7ae
echo MICROSOFT_CLIENT_SECRET=peI8Q~4QJG.ax3ekxtWrv.PXVENVQ3vw_Br1qayM
echo MICROSOFT_TENANT_ID=common
echo.
echo # Development Settings
echo VITE_API_BASE_URL=https://sentiadeploy.financeflo.ai/api
echo VITE_APP_TITLE=Sentia Manufacturing Dashboard - Development
echo VITE_APP_VERSION=1.0.0-dev
echo.
echo # Feature Flags
echo ENABLE_AUTONOMOUS_TESTING=true
echo AUTO_FIX_ENABLED=true
echo AUTO_DEPLOY_ENABLED=false
echo.
echo ========================================
echo Please copy all variables above and
echo paste them into Railway Dashboard
echo ========================================
pause