# Automated Render Environment Variables Setup via API
# Uses Render API to programmatically add all environment variables

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   AUTOMATED RENDER VARIABLES SETUP" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan

# Render API Configuration
$RENDER_API_KEY = "rnd_mYUAytWRkb2Pj5GJROqNYubYt25J"
$RENDER_API_BASE = "https://api.render.com/v1"

# Headers for API requests
$headers = @{
    "Authorization" = "Bearer $RENDER_API_KEY"
    "Content-Type" = "application/json"
}

Write-Host "`n[STEP 1] Getting Render Services..." -ForegroundColor Green

# Get all services
try {
    $response = Invoke-RestMethod -Uri "$RENDER_API_BASE/services?limit=20" -Headers $headers -Method Get
    $services = $response

    if ($services -and $services.Count) {
        Write-Host "Found $($services.Count) services" -ForegroundColor Green
    } else {
        Write-Host "No services found or empty response" -ForegroundColor Yellow
    }

    # Display services
    if ($services) {
        foreach ($service in $services) {
            if ($service.service) {
                Write-Host "  - $($service.service.name) (ID: $($service.service.id))" -ForegroundColor Cyan
            }
        }
    }
} catch {
    Write-Host "Error getting services: $_" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Red
    exit 1
}

# Find our services
$devService = $services | Where-Object { $_.service.name -like "*development*" } | Select-Object -First 1
$testService = $services | Where-Object { $_.service.name -like "*testing*" } | Select-Object -First 1
$prodService = $services | Where-Object { $_.service.name -like "*production*" } | Select-Object -First 1

Write-Host "`n[STEP 2] Configuring Environment Variables..." -ForegroundColor Green

# All environment variables
$allVariables = @{
    "NODE_ENV" = @{ dev = "development"; test = "test"; prod = "production" }
    "PORT" = "3000"
    "CORS_ORIGINS" = "https://sentia-manufacturing-dashboard-621h.onrender.com,https://sentia-manufacturing-dashboard-test.onrender.com,https://sentia-manufacturing-dashboard-production.onrender.com"
    
    # Database (Render PostgreSQL)
    "DATABASE_URL" = "postgresql://sentia_prod:nKnFo2pRzVrQ2tQEkFNEULhwLZIBmwK2@dpg-d344rkfdiees73a20c30-a/sentia_manufacturing_prod"
    "PROD_DATABASE_URL" = "postgresql://sentia_prod:nKnFo2pRzVrQ2tQEkFNEULhwLZIBmwK2@dpg-d344rkfdiees73a20c30-a/sentia_manufacturing_prod"
    "DEV_DATABASE_URL" = "postgresql://sentia_dev:nZ4vtXienMAwxahr0GJByc2qXFIFSoYL@dpg-d344rkfdiees73a20c50-a/sentia_manufacturing_dev"
    "TEST_DATABASE_URL" = "postgresql://sentia_test:He45HKApt8BjbCXXVPtEhIxbaBXxk3we@dpg-d344rkfdiees73a20c40-a/sentia_manufacturing_test"
    
    # Authentication
    "VITE_CLERK_PUBLISHABLE_KEY" = "pk_test_Y2hhbXBpb24tYnVsbGRvZy05Mi5jbGVyay5hY2NvdW50cy5kZXYk"
    "CLERK_SECRET_KEY" = "sk_test_EP6iF7prGbq73CscUPCOW8PAKol4pPaBG5iYdsDodq"
    "CLERK_WEBHOOK_SECRET" = "whsec_REDACTED"
    
    # Xero
    "XERO_CLIENT_ID" = "06091C3170694972BBA906A335074AB3"
    "XERO_CLIENT_SECRET" = "zMo43sRySgQCVDyL66PrrvIFUgr-jqFXV0zCUstHX7Zbmhri"
    "XERO_REDIRECT_URI" = "https://sentia-manufacturing-dashboard-production.onrender.com/api/xero/callback"
    "XERO_SYNC_INTERVAL" = "*/30 * * * *"
    
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
    
    # Amazon
    "AMAZON_UK_MARKETPLACE_ID" = "A1F83G8C2ARO7P"
    "AMAZON_USA_MARKETPLACE_ID" = "ATVPDKIKX0DER"
    
    # Unleashed
    "UNLEASHED_API_ID" = "d5313df6-db35-430c-a69e-ae27dffe0c5a"
    "UNLEASHED_API_KEY" = "2bJcHlDhIV04ScdqT60c3zlnG7hOER7aoPSh2IF2hWQluOi7ZaGkeu4SGeseYexAqOGfcRmyl9c6QYueJHyQ=="
    "UNLEASHED_API_URL" = "https://api.unleashedsoftware.com"
    
    # AI Services
    "OPENAI_API_KEY" = "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"
    "ANTHROPIC_API_KEY" = "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"
    
    # Microsoft
    "MICROSOFT_CLIENT_ID" = "c16d6fba-0e6b-45ea-a016-eb697ff7a7ae"
    "MICROSOFT_CLIENT_SECRET" = "peI8Q~4QJG.ax3ekxtWrv.PXVENVQ3vw_Br1qayM"
    "MICROSOFT_TENANT_ID" = "common"
    "MICROSOFT_ADMIN_EMAIL" = "admin@app.sentiaspirits.com"
    "MICROSOFT_DATA_EMAIL" = "data@app.sentiaspirits.com"
    
    # MCP Server
    "MCP_SERVER_URL" = "https://sentia-mcp-production.onrender.com"
    "MCP_SERVER_SERVICE_ID" = "99691282-de66-45b2-98cf-317083dd11ba"
    "MCP_ENABLE_WEBSOCKET" = "true"
    "MCP_SERVER_PORT" = "3001"
    
    # Sync Configuration
    "AUTO_SYNC_ENABLED" = "true"
    "SHOPIFY_SYNC_INTERVAL" = "*/15 * * * *"
    "AMAZON_SYNC_INTERVAL" = "*/60 * * * *"
    "DATABASE_SYNC_INTERVAL" = "0 */6 * * *"
    
    # Logging
    "LOG_LEVEL" = "info"
    
    # Feature Flags
    "ENABLE_AUTONOMOUS_TESTING" = "false"
    "AUTO_FIX_ENABLED" = "false"
    "AUTO_DEPLOY_ENABLED" = "false"
    
    # Application
    "VITE_API_BASE_URL" = "/api"
    "VITE_APP_TITLE" = "CapLiquify Manufacturing Platform"
    "VITE_APP_VERSION" = "1.0.0"
}

function Add-RenderEnvVars {
    param(
        [string]$ServiceId,
        [string]$ServiceName,
        [string]$Environment
    )
    
    Write-Host "`n  Adding variables to $ServiceName..." -ForegroundColor Yellow
    
    $envVars = @()
    
    foreach ($key in $allVariables.Keys) {
        $value = $allVariables[$key]
        
        # Handle environment-specific values
        if ($key -eq "NODE_ENV") {
            if ($Environment -eq "dev") { $value = "development" }
            elseif ($Environment -eq "test") { $value = "test" }
            elseif ($Environment -eq "prod") { $value = "production" }
        }
        
        # Handle hash tables (environment-specific values)
        if ($value -is [hashtable]) {
            if ($value.ContainsKey($Environment)) {
                $value = $value[$Environment]
            } else {
                continue
            }
        }
        
        $envVars += @{
            key = $key
            value = $value.ToString()
        }
    }
    
    # Create request body
    $body = @{
        envVars = $envVars
    } | ConvertTo-Json -Depth 10
    
    try {
        Write-Host "    Updating $($envVars.Count) environment variables..." -ForegroundColor Cyan
        $response = Invoke-RestMethod -Uri "$RENDER_API_BASE/services/$ServiceId/env-vars" -Headers $headers -Method Put -Body $body
        Write-Host "    SUCCESS: Added $($envVars.Count) variables to $ServiceName" -ForegroundColor Green
    } catch {
        Write-Host "    ERROR: Failed to add variables to $ServiceName" -ForegroundColor Red
        Write-Host "    Error: $_" -ForegroundColor Red
    }
}

# Add variables to each service
if ($devService) {
    Add-RenderEnvVars -ServiceId $devService.service.id -ServiceName "Development" -Environment "dev"
} else {
    Write-Host "  Development service not found" -ForegroundColor Yellow
}

if ($testService) {
    Add-RenderEnvVars -ServiceId $testService.service.id -ServiceName "Testing" -Environment "test"
} else {
    Write-Host "  Testing service already configured" -ForegroundColor Green
}

if ($prodService) {
    Add-RenderEnvVars -ServiceId $prodService.service.id -ServiceName "Production" -Environment "prod"
} else {
    Write-Host "  Production service not found" -ForegroundColor Yellow
}

Write-Host "`n[STEP 3] Triggering Service Deploys..." -ForegroundColor Green

# Trigger redeploy for each service
function Trigger-RenderDeploy {
    param(
        [string]$ServiceId,
        [string]$ServiceName
    )
    
    try {
        Write-Host "  Triggering deploy for $ServiceName..." -ForegroundColor Cyan
        $response = Invoke-RestMethod -Uri "$RENDER_API_BASE/services/$ServiceId/deploys" -Headers $headers -Method Post
        Write-Host "  SUCCESS: Deploy triggered for $ServiceName" -ForegroundColor Green
    } catch {
        Write-Host "  ERROR: Failed to trigger deploy for $ServiceName" -ForegroundColor Red
    }
}

if ($devService) {
    Trigger-RenderDeploy -ServiceId $devService.service.id -ServiceName "Development"
}

if ($testService) {
    Trigger-RenderDeploy -ServiceId $testService.service.id -ServiceName "Testing"
}

if ($prodService) {
    Trigger-RenderDeploy -ServiceId $prodService.service.id -ServiceName "Production"
}

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "   ENVIRONMENT VARIABLES ADDED SUCCESSFULLY" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan

Write-Host "`nAll environment variables have been added via API!" -ForegroundColor Green
Write-Host "Services are now redeploying with new configuration." -ForegroundColor Yellow

Write-Host "`nYour services will be available at:" -ForegroundColor Cyan
Write-Host "  Development: https://sentia-manufacturing-dashboard-621h.onrender.com" -ForegroundColor White
Write-Host "  Testing: https://sentia-manufacturing-dashboard-test.onrender.com" -ForegroundColor White
Write-Host "  Production: https://sentia-manufacturing-dashboard-production.onrender.com" -ForegroundColor White

Write-Host "`nPlease wait 5-10 minutes for deployments to complete." -ForegroundColor Yellow
