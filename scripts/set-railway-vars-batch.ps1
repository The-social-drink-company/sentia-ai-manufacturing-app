# Railway Variables Batch Setup Script
# Sets all variables for Sentia Manufacturing Analysis project

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("development", "testing", "production")]
    [string]$Environment
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Railway Variables Setup - $Environment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Sentia Manufacturing Analysis Project
$projectId = "6d1ca9b2-75e2-46c6-86a8-ed05161112fe"

# Service IDs
$serviceIds = @{
    "development" = "e985e174-ebed-4043-81f8-7b1ab2e86cd2"
    "testing" = "92f7cd2f-3dc7-44f4-abd9-1714003c389f"
    "production" = "9fd67b0e-7883-4973-85a5-639d9513d343"
}

# First link to the project and environment
Write-Host "Linking to project and environment..." -ForegroundColor Yellow
$linkCmd = "railway link --project $projectId --environment $Environment"
Write-Host "Command: $linkCmd" -ForegroundColor Gray
Invoke-Expression $linkCmd

# Common variables for all environments
$commonVars = @{
    # Clerk Authentication
    "VITE_CLERK_PUBLISHABLE_KEY" = "pk_test_Y2hhbXBpb24tYnVsbGRvZy05Mi5jbGVyay5hY2NvdW50cy5kZXYk"
    "CLERK_SECRET_KEY" = "sk_test_EP6iF7prGbq73CscUPCOW8PAKol4pPaBG5iYdsDodq"

    # MCP Server
    "MCP_SERVER_URL" = "https://web-production-99691282.up.railway.app"
    "MCP_SERVER_SERVICE_ID" = "99691282-de66-45b2-98cf-317083dd11ba"
    "MCP_ENABLE_WEBSOCKET" = "true"
    "MCP_SERVER_PORT" = "3001"

    # Xero
    "XERO_CLIENT_ID" = "9C0CAB921C134476A249E48BBECB8C4B"
    "XERO_CLIENT_SECRET" = "f0TJpJSRX_B9NI51sknz7TuKbbSfhO4dEhTM4m4fWBlph9F5"
    "XERO_TENANT_ID" = "YOUR_XERO_TENANT_ID"

    # Unleashed
    "UNLEASHED_API_ID" = "d5313df6-db35-430c-a69e-ae27dffe0c5a"
    "UNLEASHED_API_KEY" = "2bJcHlDhIV04ScdqT60c3zlnG7hOER7aoPSh2IF2hWQluOi7ZaGkeu4SGeseYexAqOGfcRmyl9c6QYueJHyQ=="
    "UNLEASHED_API_URL" = "https://api.unleashedsoftware.com"

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

    # AI APIs
    "OPENAI_API_KEY" = "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"
    "ANTHROPIC_API_KEY" = "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"

    # Microsoft Graph
    "MICROSOFT_CLIENT_ID" = "c16d6fba-0e6b-45ea-a016-eb697ff7a7ae"
    "MICROSOFT_CLIENT_SECRET" = "peI8Q~4QJG.ax3ekxtWrv.PXVENVQ3vw_Br1qayM"
    "MICROSOFT_TENANT_ID" = "common"
    "MICROSOFT_ADMIN_EMAIL" = "admin@app.sentiaspirits.com"
    "MICROSOFT_DATA_EMAIL" = "data@app.sentiaspirits.com"

    # Amazon
    "AMAZON_SP_API_CLIENT_ID" = "YOUR_AMAZON_CLIENT_ID"
    "AMAZON_SP_API_CLIENT_SECRET" = "YOUR_AMAZON_CLIENT_SECRET"
    "AMAZON_SP_API_REFRESH_TOKEN" = "YOUR_AMAZON_REFRESH_TOKEN"
    "AMAZON_UK_MARKETPLACE_ID" = "A1F83G8C2ARO7P"
    "AMAZON_USA_MARKETPLACE_ID" = "ATVPDKIKX0DER"
    "AMAZON_SELLER_ID" = "YOUR_SELLER_ID"

    # Sync Intervals
    "XERO_SYNC_INTERVAL" = "*/30 * * * *"
    "SHOPIFY_SYNC_INTERVAL" = "*/15 * * * *"
    "AMAZON_SYNC_INTERVAL" = "*/60 * * * *"
    "DATABASE_SYNC_INTERVAL" = "0 */6 * * *"

    # Monitoring
    "LOG_LEVEL" = "info"
}

# Environment-specific variables
$envVars = @{
    "development" = @{
        "NODE_ENV" = "development"
        "PORT" = "3000"
        "DATABASE_URL" = "postgresql://neondb_owner:npg_2wXVD9gdintm@ep-aged-dust-abpyip0r-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
        "DEV_DATABASE_URL" = "postgresql://neondb_owner:npg_2wXVD9gdintm@ep-aged-dust-abpyip0r-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
        "CLERK_WEBHOOK_SECRET" = "whsec_Wo9P2o1EvXcxuvu1XNTqV+ICP32nB88c"
        "MCP_JWT_SECRET" = "dev_mcp_jwt_secret_change_this_in_production_xK9mP2nQ8vL4jF6tR3yW"
        "SESSION_SECRET" = "dev_session_secret_change_this_in_production_aB3dE5gH7jK9mN2pQ4rS"
        "JWT_SECRET" = "dev_jwt_secret_change_this_in_production_xY9zA3bC5dE7fG2hJ4kL"
        "CORS_ORIGINS" = "http://localhost:3000,http://localhost:5000,https://sentia-manufacturing-dashboard-development.up.railway.app"
        "XERO_REDIRECT_URI" = "https://sentia-manufacturing-dashboard-development.up.railway.app/api/xero/callback"
        "VITE_API_BASE_URL" = "https://sentia-manufacturing-dashboard-development.up.railway.app/api"
        "VITE_APP_TITLE" = "Sentia Manufacturing Dashboard - Development"
        "VITE_APP_VERSION" = "1.0.0-dev"
        "AUTO_SYNC_ENABLED" = "false"
        "ENABLE_AUTONOMOUS_TESTING" = "true"
        "AUTO_FIX_ENABLED" = "true"
        "AUTO_DEPLOY_ENABLED" = "false"
        "LOG_LEVEL" = "debug"
    }
    "testing" = @{
        "NODE_ENV" = "test"
        "PORT" = "3000"
        "DATABASE_URL" = "postgresql://neondb_owner:npg_2wXVD9gdintm@ep-shiny-dream-ab2zho2p-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
        "TEST_DATABASE_URL" = "postgresql://neondb_owner:npg_2wXVD9gdintm@ep-shiny-dream-ab2zho2p-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
        "CLERK_WEBHOOK_SECRET" = "whsec_CdtHP4SJICjWeYEJgLL3Wjnsppu8sUyy"
        "MCP_JWT_SECRET" = "test_mcp_jwt_secret_pL9kM3nB7vX2qW5eR8tY4uI6oP1aS3dF"
        "SESSION_SECRET" = "test_session_secret_nM8kL2jH5gF3dC1aZ9xW7vB4qE6rT3yU"
        "JWT_SECRET" = "test_jwt_secret_sD4fG6hJ8kL2mN5pQ7rT9vX3bZ1cE5aW"
        "CORS_ORIGINS" = "https://sentiatest.financeflo.ai,http://localhost:3000"
        "XERO_REDIRECT_URI" = "https://sentiatest.financeflo.ai/api/xero/callback"
        "VITE_API_BASE_URL" = "https://sentiatest.financeflo.ai/api"
        "VITE_APP_TITLE" = "Sentia Manufacturing Dashboard - Testing"
        "VITE_APP_VERSION" = "1.0.0-test"
        "AUTO_SYNC_ENABLED" = "false"
        "ENABLE_AUTONOMOUS_TESTING" = "true"
        "AUTO_FIX_ENABLED" = "true"
        "AUTO_DEPLOY_ENABLED" = "false"
    }
    "production" = @{
        "NODE_ENV" = "production"
        "PORT" = "3000"
        "DATABASE_URL" = "postgresql://neondb_owner:npg_2wXVD9gdintm@ep-broad-resonance-ablmx6yo-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
        "CLERK_WEBHOOK_SECRET" = "whsec_a+WOvJWRP3wTbqRyqVCaAJTWw1CgxiPE"
        "MCP_JWT_SECRET" = "prod_mcp_jwt_secret_" + (New-Guid).ToString().Replace("-", "")
        "SESSION_SECRET" = "prod_session_secret_" + (New-Guid).ToString().Replace("-", "")
        "JWT_SECRET" = "prod_jwt_secret_" + (New-Guid).ToString().Replace("-", "")
        "CORS_ORIGINS" = "https://sentia-manufacturing-production.up.railway.app,https://web-production-1f10.up.railway.app"
        "XERO_REDIRECT_URI" = "https://sentia-manufacturing-production.up.railway.app/api/xero/callback"
        "VITE_API_BASE_URL" = "https://sentia-manufacturing-production.up.railway.app/api"
        "VITE_APP_TITLE" = "Sentia Manufacturing Dashboard"
        "VITE_APP_VERSION" = "1.0.0"
        "AUTO_SYNC_ENABLED" = "true"
        "ENABLE_AUTONOMOUS_TESTING" = "false"
        "AUTO_FIX_ENABLED" = "false"
        "AUTO_DEPLOY_ENABLED" = "false"
        "LOG_LEVEL" = "error"
    }
}

# Merge common and environment-specific variables
$allVars = $commonVars.Clone()
foreach ($key in $envVars[$Environment].Keys) {
    $allVars[$key] = $envVars[$Environment][$key]
}

Write-Host ""
Write-Host "Setting $($allVars.Count) variables..." -ForegroundColor Cyan

# Build the railway variables command
$setCommands = @()
foreach ($key in $allVars.Keys) {
    $value = $allVars[$key]
    $setCommands += "--set `"$key=$value`""
}

# Execute in batches of 10 to avoid command line length limits
$batchSize = 10
$batches = [Math]::Ceiling($setCommands.Count / $batchSize)

for ($i = 0; $i -lt $batches; $i++) {
    $start = $i * $batchSize
    $end = [Math]::Min($start + $batchSize, $setCommands.Count)
    $batch = $setCommands[$start..($end - 1)]

    Write-Host "Setting batch $($i + 1) of $batches..." -ForegroundColor Yellow
    $cmd = "railway variables $($batch -join ' ') --skip-deploys"

    try {
        Invoke-Expression $cmd
        Write-Host "Batch $($i + 1) completed" -ForegroundColor Green
    } catch {
        Write-Host "Error in batch $($i + 1): $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Variables set for $Environment environment" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan