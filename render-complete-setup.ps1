# Render Complete Environment Setup Script
# Sets up ALL environment variables for ALL three environments

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("development", "testing", "production", "all")]
    [string]$Environment = "all"
)

$RENDER_API_KEY = "rnd_mYUAytWRkb2Pj5GJROqNYubYt25J"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Render Complete Environment Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Service mapping
$services = @{
    "development" = @{
        "name" = "sentia-manufacturing-development"
        "db" = "sentia-db-development"
        "url" = "https://sentia-manufacturing-development.onrender.com"
    }
    "testing" = @{
        "name" = "sentia-manufacturing-testing"
        "db" = "sentia-db-testing"
        "url" = "https://sentia-manufacturing-testing.onrender.com"
    }
    "production" = @{
        "name" = "sentia-manufacturing-production"
        "db" = "sentia-db-production"
        "url" = "https://sentia-manufacturing-production.onrender.com"
    }
}

function Get-ServiceId {
    param($ServiceName)

    $headers = @{
        "Authorization" = "Bearer $RENDER_API_KEY"
        "Accept" = "application/json"
    }

    try {
        $response = Invoke-RestMethod -Uri "https://api.render.com/v1/services?limit=20" -Headers $headers -Method Get
        $service = $response | Where-Object { $_.service.name -eq $ServiceName }

        if ($service) {
            return $service.service.id
        }
    } catch {
        Write-Host "Error getting service ID for $ServiceName" -ForegroundColor Red
    }

    return $null
}

function Set-EnvironmentVariables {
    param(
        [string]$ServiceId,
        [string]$EnvName,
        [hashtable]$Variables
    )

    Write-Host "`nSetting environment variables for $EnvName..." -ForegroundColor Yellow

    $envArray = @()
    foreach ($key in $Variables.Keys) {
        $envArray += @{
            key = $key
            value = $Variables[$key].ToString()
        }
        Write-Host "  - $key" -ForegroundColor Gray
    }

    $body = $envArray | ConvertTo-Json
    $headers = @{
        "Authorization" = "Bearer $RENDER_API_KEY"
        "Accept" = "application/json"
        "Content-Type" = "application/json"
    }

    try {
        $response = Invoke-RestMethod -Uri "https://api.render.com/v1/services/$ServiceId/env-vars" `
                                      -Headers $headers `
                                      -Method Patch `
                                      -Body $body

        Write-Host "Successfully updated $($envArray.Count) variables" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "Error updating variables: $_" -ForegroundColor Red
        return $false
    }
}

function Setup-Environment {
    param([string]$EnvName)

    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "Setting up $EnvName environment" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan

    $serviceInfo = $services[$EnvName]
    $serviceName = $serviceInfo.name
    $dbName = $serviceInfo.db
    $serviceUrl = $serviceInfo.url

    # Get service ID
    Write-Host "Finding service: $serviceName" -ForegroundColor Yellow
    $serviceId = Get-ServiceId -ServiceName $serviceName

    if (-not $serviceId) {
        Write-Host "Service $serviceName not found!" -ForegroundColor Red
        Write-Host "Please create the service in Render dashboard first" -ForegroundColor Yellow
        return
    }

    Write-Host "Service ID: $serviceId" -ForegroundColor Green

    # Define all environment variables
    $envVars = @{
        # Core Configuration
        "NODE_ENV" = $EnvName -eq "testing" ? "test" : $EnvName
        "PORT" = "10000"
        "CORS_ORIGINS" = $serviceUrl

        # Database - UPDATE THIS
        "DATABASE_URL" = "postgresql://UPDATE_ME@dpg-xxx.render.com:5432/$dbName"

        # Authentication (Clerk)
        "VITE_CLERK_PUBLISHABLE_KEY" = "pk_test_Y2hhbXBpb24tYnVsbGRvZy05Mi5jbGVyay5hY2NvdW50cy5kZXYk"
        "CLERK_SECRET_KEY" = "sk_test_EP6iF7prGbq73CscUPCOW8PAKol4pPaBG5iYdsDodq"
        "CLERK_WEBHOOK_SECRET" = "whsec_iTUcbgzS5P6zJlXWQkc4zGHnw8yLGt9j"

        # Session & Security
        "SESSION_SECRET" = "sentia-session-secret-$EnvName-2025"
        "JWT_SECRET" = "sentia-jwt-secret-$EnvName-2025"

        # Application Settings
        "VITE_API_BASE_URL" = "$serviceUrl/api"
        "VITE_APP_TITLE" = "Sentia Manufacturing Dashboard"
        "VITE_APP_VERSION" = "1.0.0"

        # Xero Integration
        "XERO_CLIENT_ID" = "9C0CAB921C134476A249E48BBECB8C4B"
        "XERO_CLIENT_SECRET" = "f0TJpJSRX_B9NI51sknz7TuKbbSfhO4dEhTM4m4fWBlph9F5"
        "XERO_REDIRECT_URI" = "$serviceUrl/api/xero/callback"

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

        # Amazon Marketplaces
        "AMAZON_UK_MARKETPLACE_ID" = "A1F83G8C2ARO7P"
        "AMAZON_USA_MARKETPLACE_ID" = "ATVPDKIKX0DER"

        # Unleashed ERP
        "UNLEASHED_API_ID" = "d5313df6-db35-430c-a69e-ae27dffe0c5a"
        "UNLEASHED_API_KEY" = "2bJcHlDhIV04ScdqT60c3zlnG7hOER7aoPSh2IF2hWQluOi7ZaGkeu4SGeseYexAqOGfcRmyl9c6QYueJHyQ=="
        "UNLEASHED_API_URL" = "https://api.unleashedsoftware.com"

        # Microsoft Graph
        "MICROSOFT_CLIENT_ID" = "c16d6fba-0e6b-45ea-a016-eb697ff7a7ae"
        "MICROSOFT_CLIENT_SECRET" = "peI8Q~4QJG.ax3ekxtWrv.PXVENVQ3vw_Br1qayM"
        "MICROSOFT_TENANT_ID" = "common"
        "MICROSOFT_ADMIN_EMAIL" = "admin@app.sentiaspirits.com"
        "MICROSOFT_DATA_EMAIL" = "data@app.sentiaspirits.com"

        # AI Services
        "OPENAI_API_KEY" = "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"
        "ANTHROPIC_API_KEY" = "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"

        # MCP Server
        "MCP_SERVER_URL" = "https://mcp-server-tkyu.onrender.com"
        "MCP_JWT_SECRET" = "sentia-mcp-jwt-secret-$EnvName-2025"
        "MCP_ENABLE_WEBSOCKET" = "true"
        "MCP_SERVER_PORT" = "3001"
        "MCP_SERVER_HEALTH_CHECK_INTERVAL" = "30000"

        # Auto-Sync Configuration
        "AUTO_SYNC_ENABLED" = "true"
        "XERO_SYNC_INTERVAL" = "*/30 * * * *"
        "SHOPIFY_SYNC_INTERVAL" = "*/15 * * * *"
        "AMAZON_SYNC_INTERVAL" = "*/60 * * * *"
        "DATABASE_SYNC_INTERVAL" = "0 */6 * * *"

        # Logging
        "LOG_LEVEL" = "info"
    }

    # Environment-specific settings
    if ($EnvName -eq "development") {
        $envVars["ENABLE_AUTONOMOUS_TESTING"] = "true"
        $envVars["AUTO_FIX_ENABLED"] = "true"
        $envVars["AUTO_DEPLOY_ENABLED"] = "true"
        $envVars["DEBUG_MODE"] = "true"
    } elseif ($EnvName -eq "testing") {
        $envVars["ENABLE_AUTONOMOUS_TESTING"] = "true"
        $envVars["AUTO_FIX_ENABLED"] = "true"
        $envVars["AUTO_DEPLOY_ENABLED"] = "false"
        $envVars["DEBUG_MODE"] = "false"
    } else {
        # Production
        $envVars["ENABLE_AUTONOMOUS_TESTING"] = "false"
        $envVars["AUTO_FIX_ENABLED"] = "false"
        $envVars["AUTO_DEPLOY_ENABLED"] = "false"
        $envVars["DEBUG_MODE"] = "false"
    }

    # Set the environment variables
    $success = Set-EnvironmentVariables -ServiceId $serviceId -EnvName $EnvName -Variables $envVars

    if ($success) {
        Write-Host "`n✅ $EnvName environment configured successfully!" -ForegroundColor Green
        Write-Host "Service URL: $serviceUrl" -ForegroundColor Cyan

        Write-Host "`n⚠️  IMPORTANT: Manual steps required:" -ForegroundColor Yellow
        Write-Host "1. Update DATABASE_URL with actual connection string from $dbName" -ForegroundColor Yellow
        Write-Host "2. Add any missing API keys (Amazon SP-API, etc.)" -ForegroundColor Yellow
        Write-Host "3. Trigger a manual deploy to apply changes" -ForegroundColor Yellow
    } else {
        Write-Host "`n❌ Failed to configure $EnvName environment" -ForegroundColor Red
    }
}

# Main execution
if ($Environment -eq "all") {
    Write-Host "Setting up ALL environments..." -ForegroundColor Cyan
    Setup-Environment -EnvName "development"
    Setup-Environment -EnvName "testing"
    Setup-Environment -EnvName "production"
} else {
    Setup-Environment -EnvName $Environment
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "1. Go to https://dashboard.render.com" -ForegroundColor White
Write-Host "2. For each service, update DATABASE_URL with the Internal Database URL" -ForegroundColor White
Write-Host "3. Add any missing API credentials (Amazon SP-API if needed)" -ForegroundColor White
Write-Host "4. Deploy each service to apply the changes" -ForegroundColor White
Write-Host "`nVerify with: node scripts/render-verify.js" -ForegroundColor Cyan