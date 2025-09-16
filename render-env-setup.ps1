# Render Environment Variables Setup Script for Windows
# Sets up all required environment variables for sentia-manufacturing-development

$RENDER_API_KEY = "rnd_mYUAytWRkb2Pj5GJROqNYubYt25J"
$SERVICE_NAME = "sentia-manufacturing-development"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Render Environment Variables Setup" -ForegroundColor Cyan
Write-Host "Service: $SERVICE_NAME" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

# Get service ID
Write-Host "`nFinding service ID..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $RENDER_API_KEY"
    "Accept" = "application/json"
}

$services = Invoke-RestMethod -Uri "https://api.render.com/v1/services?limit=20" -Headers $headers -Method Get
$service = $services | Where-Object { $_.service.name -eq $SERVICE_NAME }

if (-not $service) {
    Write-Host "Error: Service '$SERVICE_NAME' not found" -ForegroundColor Red
    exit 1
}

$SERVICE_ID = $service.service.id
Write-Host "Service ID: $SERVICE_ID" -ForegroundColor Green

# Define environment variables
$envVars = @{
    # Core Configuration
    "NODE_ENV" = "development"
    "PORT" = "10000"
    "CORS_ORIGINS" = "https://sentia-manufacturing-development.onrender.com"

    # Database - UPDATE THIS with your actual database URL
    "DATABASE_URL" = "postgresql://YOUR_DB_USER:YOUR_DB_PASSWORD@YOUR_DB_HOST/YOUR_DB_NAME"

    # Authentication
    "VITE_CLERK_PUBLISHABLE_KEY" = "pk_test_Y2hhbXBpb24tYnVsbGRvZy05Mi5jbGVyay5hY2NvdW50cy5kZXYk"
    "CLERK_SECRET_KEY" = "sk_test_EP6iF7prGbq73CscUPCOW8PAKol4pPaBG5iYdsDodq"
    "CLERK_WEBHOOK_SECRET" = "whsec_iTUcbgzS5P6zJlXWQkc4zGHnw8yLGt9j"

    # Session & Security
    "SESSION_SECRET" = "sentia-session-secret-dev-2025"
    "JWT_SECRET" = "sentia-jwt-secret-dev-2025"

    # Application Settings
    "VITE_API_BASE_URL" = "https://sentia-manufacturing-development.onrender.com/api"
    "VITE_APP_TITLE" = "Sentia Manufacturing Dashboard"
    "VITE_APP_VERSION" = "1.0.0"

    # AI Services
    "ANTHROPIC_API_KEY" = "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"
    "OPENAI_API_KEY" = "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"

    # Xero Integration
    "XERO_CLIENT_ID" = "9C0CAB921C134476A249E48BBECB8C4B"
    "XERO_CLIENT_SECRET" = "f0TJpJSRX_B9NI51sknz7TuKbbSfhO4dEhTM4m4fWBlph9F5"
    "XERO_REDIRECT_URI" = "https://sentia-manufacturing-development.onrender.com/api/xero/callback"

    # Shopify UK
    "SHOPIFY_UK_API_KEY" = "7a30cd84e7a106b852c8e0fb789de10e"
    "SHOPIFY_UK_SECRET" = "8b2d61745c506970c70d8c892f5f977e"
    "SHOPIFY_UK_ACCESS_TOKEN" = "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"
    "SHOPIFY_UK_SHOP_URL" = "sentiaspirits.myshopify.com"

    # Shopify USA
    "SHOPIFY_USA_API_KEY" = "83b8903fd8b509ef8bf93d1dbcd6079c"
    "SHOPIFY_USA_SECRET" = "d01260e58adb00198cddddd1bd9a9490"
    "SHOPIFY_USA_ACCESS_TOKEN" = "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"
    "SHOPIFY_USA_SHOP_URL" = "us-sentiaspirits.myshopify.com"

    # Unleashed ERP
    "UNLEASHED_API_ID" = "d5313df6-db35-430c-a69e-ae27dffe0c5a"
    "UNLEASHED_API_KEY" = "2bJcHlDhIV04ScdqT60c3zlnG7hOER7aoPSh2IF2hWQluOi7ZaGkeu4SGeseYexAqOGfcRmyl9c6QYueJHyQ=="
    "UNLEASHED_API_URL" = "https://api.unleashedsoftware.com"

    # Microsoft
    "MICROSOFT_CLIENT_ID" = "c16d6fba-0e6b-45ea-a016-eb697ff7a7ae"
    "MICROSOFT_CLIENT_SECRET" = "peI8Q~4QJG.ax3ekxtWrv.PXVENVQ3vw_Br1qayM"
    "MICROSOFT_TENANT_ID" = "common"

    # Feature Flags for Development
    "ENABLE_AUTONOMOUS_TESTING" = "true"
    "AUTO_FIX_ENABLED" = "true"
    "AUTO_DEPLOY_ENABLED" = "true"
    "LOG_LEVEL" = "info"
}

# Add environment variables
Write-Host "`nAdding environment variables..." -ForegroundColor Yellow

$envArray = @()
foreach ($key in $envVars.Keys) {
    $envArray += @{
        key = $key
        value = $envVars[$key]
    }
}

# Send all variables in one request
$body = $envArray | ConvertTo-Json
$headers["Content-Type"] = "application/json"

try {
    $response = Invoke-RestMethod -Uri "https://api.render.com/v1/services/$SERVICE_ID/env-vars" `
                                  -Headers $headers `
                                  -Method Patch `
                                  -Body $body

    Write-Host "Environment variables updated successfully!" -ForegroundColor Green
} catch {
    Write-Host "Error updating environment variables: $_" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "IMPORTANT - Database Configuration Required!" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host @"

You need to update DATABASE_URL with your actual database connection:

1. Go to https://dashboard.render.com
2. Click on 'sentia-db-development' database
3. Click on 'Connect' button
4. Copy the 'Internal Database URL'
5. Go to your service 'sentia-manufacturing-development'
6. Go to 'Environment' tab
7. Update DATABASE_URL with the copied URL

The URL should look like:
postgresql://username:password@dpg-xxxxx.oregon-postgres.render.com/database_name

"@ -ForegroundColor Cyan

Write-Host "After updating the database URL, trigger a manual deploy to apply changes." -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Setup script completed!" -ForegroundColor Green
Write-Host "Service URL: https://sentia-manufacturing-development.onrender.com" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan