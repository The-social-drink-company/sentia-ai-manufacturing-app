# Railway Environment Variables Setup Script
# This script sets all environment variables for Railway using the CLI

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("development", "testing", "production")]
    [string]$Environment,

    [switch]$DryRun = $false
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Railway Environment Variables Setup" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Railway CLI is installed
try {
    $railwayVersion = railway --version 2>&1
    Write-Host "Railway CLI version: $railwayVersion" -ForegroundColor Green
} catch {
    Write-Host "Railway CLI is not installed. Please install it first:" -ForegroundColor Red
    Write-Host "npm install -g @railway/cli" -ForegroundColor Yellow
    exit 1
}

# Define environment-specific service IDs
$serviceIds = @{
    "development" = "f97b65ad-c306-410a-9d5d-5f5fdc098620"
    "testing" = "02e0c7f6-9ca1-4355-af52-ee9eec0b3545"
    "production" = "3e0053fc-ea90-49ec-9708-e09d58cad4a0"
}

$serviceId = $serviceIds[$Environment]

# Link to the correct service
Write-Host "Linking to Railway service: $serviceId" -ForegroundColor Gray
if (-not $DryRun) {
    railway link --service $serviceId 2>&1 | Out-Null
    Write-Host "Linked successfully" -ForegroundColor Green
}

# Define common variables for all environments
$commonVariables = @{
    # MCP Server Integration
    "MCP_SERVER_URL" = "https://web-production-99691282.up.railway.app"
    "MCP_SERVER_SERVICE_ID" = "99691282-de66-45b2-98cf-317083dd11ba"
    "MCP_ENABLE_WEBSOCKET" = "true"
    "MCP_SERVER_PORT" = "3001"

    # Clerk Authentication
    "VITE_CLERK_PUBLISHABLE_KEY" = "pk_test_Y2hhbXBpb24tYnVsbGRvZy05Mi5jbGVyay5hY2NvdW50cy5kZXYk"
    "CLERK_SECRET_KEY" = "sk_test_EP6iF7prGbq73CscUPCOW8PAKol4pPaBG5iYdsDodq"

    # Xero Integration
    "XERO_CLIENT_ID" = "9C0CAB921C134476A249E48BBECB8C4B"
    "XERO_CLIENT_SECRET" = "f0TJpJSRX_B9NI51sknz7TuKbbSfhO4dEhTM4m4fWBlph9F5"
    "XERO_TENANT_ID" = "YOUR_XERO_TENANT_ID"

    # Shopify UK Store
    "SHOPIFY_UK_API_KEY" = "7a30cd84e7a106b852c8e0fb789de10e"
    "SHOPIFY_UK_SECRET" = "8b2d61745c506970c70d8c892f5f977e"
    "SHOPIFY_UK_ACCESS_TOKEN" = "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"
    "SHOPIFY_UK_SHOP_URL" = "sentiaspirits.myshopify.com"

    # Shopify USA Store
    "SHOPIFY_USA_API_KEY" = "83b8903fd8b509ef8bf93d1dbcd6079c"
    "SHOPIFY_USA_SECRET" = "d01260e58adb00198cddddd1bd9a9490"
    "SHOPIFY_USA_ACCESS_TOKEN" = "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"
    "SHOPIFY_USA_SHOP_URL" = "us-sentiaspirits.myshopify.com"

    # Unleashed ERP
    "UNLEASHED_API_ID" = "d5313df6-db35-430c-a69e-ae27dffe0c5a"
    "UNLEASHED_API_KEY" = "2bJcHlDhIV04ScdqT60c3zlnG7hOER7aoPSh2IF2hWQluOi7ZaGkeu4SGeseYexAqOGfcRmyl9c6QYueJHyQ=="
    "UNLEASHED_API_URL" = "https://api.unleashedsoftware.com"

    # AI Services
    "OPENAI_API_KEY" = "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"
    "ANTHROPIC_API_KEY" = "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"

    # Amazon Marketplaces
    "AMAZON_SP_API_CLIENT_ID" = "YOUR_AMAZON_CLIENT_ID"
    "AMAZON_SP_API_CLIENT_SECRET" = "YOUR_AMAZON_CLIENT_SECRET"
    "AMAZON_SP_API_REFRESH_TOKEN" = "YOUR_AMAZON_REFRESH_TOKEN"
    "AMAZON_UK_MARKETPLACE_ID" = "A1F83G8C2ARO7P"
    "AMAZON_USA_MARKETPLACE_ID" = "ATVPDKIKX0DER"
    "AMAZON_SELLER_ID" = "YOUR_SELLER_ID"

    # Microsoft Graph API
    "MICROSOFT_CLIENT_ID" = "c16d6fba-0e6b-45ea-a016-eb697ff7a7ae"
    "MICROSOFT_CLIENT_SECRET" = "peI8Q~4QJG.ax3ekxtWrv.PXVENVQ3vw_Br1qayM"
    "MICROSOFT_TENANT_ID" = "common"
    "MICROSOFT_ADMIN_EMAIL" = "admin@app.sentiaspirits.com"
    "MICROSOFT_DATA_EMAIL" = "data@app.sentiaspirits.com"

    # Sync Intervals
    "XERO_SYNC_INTERVAL" = "*/30 * * * *"
    "SHOPIFY_SYNC_INTERVAL" = "*/15 * * * *"
    "AMAZON_SYNC_INTERVAL" = "*/60 * * * *"
    "DATABASE_SYNC_INTERVAL" = "0 */6 * * *"

    # Monitoring
    "LOG_LEVEL" = "info"

    # Feature Flags
    "ENABLE_AUTONOMOUS_TESTING" = "false"
    "AUTO_FIX_ENABLED" = "false"
    "AUTO_DEPLOY_ENABLED" = "false"
}

# Environment-specific variables
$envSpecificVariables = @{
    "development" = @{
        "NODE_ENV" = "development"
        "PORT" = "3000"
        "DATABASE_URL" = "postgresql://neondb_owner:npg_2wXVD9gdintm@ep-aged-dust-abpyip0r-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
        "DEV_DATABASE_URL" = "postgresql://neondb_owner:npg_2wXVD9gdintm@ep-aged-dust-abpyip0r-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
        "CORS_ORIGINS" = "http://localhost:3000,http://localhost:5000,https://sentia-manufacturing-dashboard-development.up.railway.app"
        "CLERK_WEBHOOK_SECRET" = "whsec_Wo9P2o1EvXcxuvu1XNTqV+ICP32nB88c"
        "MCP_JWT_SECRET" = "dev_mcp_jwt_secret_change_this_in_production_xK9mP2nQ8vL4jF6tR3yW"
        "SESSION_SECRET" = "dev_session_secret_change_this_in_production_aB3dE5gH7jK9mN2pQ4rS"
        "JWT_SECRET" = "dev_jwt_secret_change_this_in_production_xY9zA3bC5dE7fG2hJ4kL"
        "AUTO_SYNC_ENABLED" = "false"
        "XERO_REDIRECT_URI" = "https://sentia-manufacturing-dashboard-development.up.railway.app/api/xero/callback"
        "VITE_API_BASE_URL" = "https://sentia-manufacturing-dashboard-development.up.railway.app/api"
        "VITE_APP_TITLE" = "Sentia Manufacturing Dashboard - Development"
        "VITE_APP_VERSION" = "1.0.0-dev"
        "ENABLE_AUTONOMOUS_TESTING" = "true"
        "AUTO_FIX_ENABLED" = "true"
        "LOG_LEVEL" = "debug"
    }
    "testing" = @{
        "NODE_ENV" = "test"
        "PORT" = "3000"
        "DATABASE_URL" = "postgresql://neondb_owner:npg_2wXVD9gdintm@ep-shiny-dream-ab2zho2p-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
        "TEST_DATABASE_URL" = "postgresql://neondb_owner:npg_2wXVD9gdintm@ep-shiny-dream-ab2zho2p-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
        "CORS_ORIGINS" = "https://sentiatest.financeflo.ai,http://localhost:3000"
        "CLERK_WEBHOOK_SECRET" = "whsec_CdtHP4SJICjWeYEJgLL3Wjnsppu8sUyy"
        "MCP_JWT_SECRET" = "test_mcp_jwt_secret_pL9kM3nB7vX2qW5eR8tY4uI6oP1aS3dF"
        "SESSION_SECRET" = "test_session_secret_nM8kL2jH5gF3dC1aZ9xW7vB4qE6rT3yU"
        "JWT_SECRET" = "test_jwt_secret_sD4fG6hJ8kL2mN5pQ7rT9vX3bZ1cE5aW"
        "AUTO_SYNC_ENABLED" = "false"
        "XERO_REDIRECT_URI" = "https://sentiatest.financeflo.ai/api/xero/callback"
        "VITE_API_BASE_URL" = "https://sentiatest.financeflo.ai/api"
        "VITE_APP_TITLE" = "Sentia Manufacturing Dashboard - Testing"
        "VITE_APP_VERSION" = "1.0.0-test"
        "ENABLE_AUTONOMOUS_TESTING" = "true"
        "AUTO_FIX_ENABLED" = "true"
    }
    "production" = @{
        "NODE_ENV" = "production"
        "PORT" = "3000"
        "DATABASE_URL" = "postgresql://neondb_owner:npg_2wXVD9gdintm@ep-broad-resonance-ablmx6yo-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
        "CORS_ORIGINS" = "https://sentia-manufacturing-production.up.railway.app,https://web-production-1f10.up.railway.app"
        "CLERK_WEBHOOK_SECRET" = "whsec_a+WOvJWRP3wTbqRyqVCaAJTWw1CgxiPE"
        "MCP_JWT_SECRET" = $(New-Guid).ToString().Replace("-", "") + "prod"
        "SESSION_SECRET" = $(New-Guid).ToString().Replace("-", "") + "session"
        "JWT_SECRET" = $(New-Guid).ToString().Replace("-", "") + "jwt"
        "AUTO_SYNC_ENABLED" = "true"
        "XERO_REDIRECT_URI" = "https://sentia-manufacturing-production.up.railway.app/api/xero/callback"
        "VITE_API_BASE_URL" = "https://sentia-manufacturing-production.up.railway.app/api"
        "VITE_APP_TITLE" = "Sentia Manufacturing Dashboard"
        "VITE_APP_VERSION" = "1.0.0"
        "LOG_LEVEL" = "error"
    }
}

# Merge common and environment-specific variables
$allVariables = $commonVariables.Clone()
foreach ($key in $envSpecificVariables[$Environment].Keys) {
    $allVariables[$key] = $envSpecificVariables[$Environment][$key]
}

# Sort variables for better readability
$sortedKeys = $allVariables.Keys | Sort-Object

Write-Host ""
Write-Host "Setting $($sortedKeys.Count) environment variables..." -ForegroundColor Cyan
Write-Host ""

$successCount = 0
$failCount = 0

foreach ($key in $sortedKeys) {
    $value = $allVariables[$key]

    # Mask sensitive values in output
    $displayValue = $value
    if ($key -like "*SECRET*" -or $key -like "*KEY*" -or $key -like "*TOKEN*" -or $key -like "*PASSWORD*") {
        if ($value.Length -gt 8) {
            $displayValue = $value.Substring(0, 4) + "****"
        } else {
            $displayValue = "****"
        }
    }

    Write-Host "Setting $key = $displayValue" -ForegroundColor Gray -NoNewline

    if (-not $DryRun) {
        try {
            # Use Railway CLI to set the variable
            $result = railway variables set "$key=$value" 2>&1

            if ($LASTEXITCODE -eq 0) {
                Write-Host " [OK]" -ForegroundColor Green
                $successCount++
            } else {
                Write-Host " [FAILED]" -ForegroundColor Red
                Write-Host "  Error: $result" -ForegroundColor Red
                $failCount++
            }
        } catch {
            Write-Host " [ERROR]" -ForegroundColor Red
            Write-Host "  Error: $_" -ForegroundColor Red
            $failCount++
        }
    } else {
        Write-Host " [DRY RUN]" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if (-not $DryRun) {
    Write-Host "Successfully set: $successCount variables" -ForegroundColor Green
    if ($failCount -gt 0) {
        Write-Host "Failed to set: $failCount variables" -ForegroundColor Red
    }

    Write-Host ""
    Write-Host "Environment: $Environment" -ForegroundColor Yellow
    Write-Host "Service ID: $serviceId" -ForegroundColor Gray

    # Show deployment URL
    $urls = @{
        "development" = "https://sentia-manufacturing-dashboard-development.up.railway.app"
        "testing" = "https://sentiatest.financeflo.ai"
        "production" = "https://sentia-manufacturing-production.up.railway.app"
    }

    Write-Host "URL: $($urls[$Environment])" -ForegroundColor Cyan

    Write-Host ""
    Write-Host "Railway will automatically redeploy your service." -ForegroundColor Gray
    Write-Host "Check deployment status at: https://railway.app" -ForegroundColor Gray
} else {
    Write-Host "DRY RUN completed - no variables were actually set" -ForegroundColor Yellow
    Write-Host "Run without -DryRun flag to apply changes" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Green