# FINAL PowerShell Script to Update Render Production Environment Variables
# Uses exact environment variables from verified configuration file

$RENDER_API_KEY = Read-Host -Prompt "Enter your Render API Key"
$SERVICE_ID = "srv-ctg8hkpu0jms73ab8m00"  # Production service ID

# Base URL for Render API
$API_BASE = "https://api.render.com/v1"

# Headers with authentication
$headers = @{
    "Authorization" = "Bearer $RENDER_API_KEY"
    "Accept" = "application/json"
    "Content-Type" = "application/json"
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RENDER ENVIRONMENT VARIABLE UPDATE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Service: sentia-manufacturing-production" -ForegroundColor Yellow
Write-Host "Total Variables to Set: 45" -ForegroundColor Yellow
Write-Host ""

# EXACT environment variables from OneDrive configuration file
$envVars = @(
    # Core Configuration
    @{key="NODE_ENV"; value="production"},
    @{key="PORT"; value="5000"},

    # Clerk Authentication (CRITICAL)
    @{key="VITE_CLERK_PUBLISHABLE_KEY"; value="pk_live_Y2xlcmsuZmluYW5jZWZsby5haSQ"},
    @{key="CLERK_SECRET_KEY"; value="sk_live_mzgSFm1q9VrzngMMaCTNNwPEqBmr75vVxiND1DO7wq"},
    @{key="NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"; value="pk_live_Y2xlcmsuZmluYW5jZWZsby5haSQ"},
    @{key="VITE_CLERK_DOMAIN"; value="clerk.financeflo.ai"},
    @{key="VITE_CLERK_SIGN_IN_URL"; value="/sign-in"},
    @{key="VITE_CLERK_SIGN_UP_URL"; value="/sign-up"},
    @{key="VITE_CLERK_AFTER_SIGN_IN_URL"; value="/dashboard"},
    @{key="VITE_CLERK_AFTER_SIGN_UP_URL"; value="/dashboard"},
    @{key="CLERK_WEBHOOK_SECRET"; value="whsec_iTUcbgzS5P6zJlXWQkc4zGHnw8yLGt9j"},

    # API Configuration
    @{key="VITE_API_BASE_URL"; value="/api"},
    @{key="API_BASE_URL"; value="/api"},

    # CORS Configuration
    @{key="CORS_ORIGINS"; value="https://sentia-manufacturing-production.onrender.com"},

    # MCP Server Integration
    @{key="MCP_SERVER_URL"; value="https://mcp-server-tkyu.onrender.com"},
    @{key="VITE_MCP_SERVER_URL"; value="https://mcp-server-tkyu.onrender.com"},
    @{key="MCP_JWT_SECRET"; value="production-mcp-jwt-secret-2025"},

    # Xero Integration
    @{key="XERO_CLIENT_ID"; value="9C0CAB921C134476A249E48BBECB8C4B"},
    @{key="XERO_CLIENT_SECRET"; value="f0TJpJSRX_B9NI51sknz7TuKbbSfhO4dEhTM4m4fWBlph9F5"},
    @{key="XERO_REDIRECT_URI"; value="https://sentia-manufacturing-production.onrender.com/api/xero/callback"},

    # Shopify UK Store
    @{key="SHOPIFY_UK_API_KEY"; value="7a30cd84e7a106b852c8e0fb789de10e"},
    @{key="SHOPIFY_UK_SECRET"; value="8b2d61745c506970c70d8c892f5f977e"},
    @{key="SHOPIFY_UK_ACCESS_TOKEN"; value="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"},
    @{key="SHOPIFY_UK_SHOP_URL"; value="sentiaspirits.myshopify.com"},

    # Shopify USA Store
    @{key="SHOPIFY_USA_API_KEY"; value="83b8903fd8b509ef8bf93d1dbcd6079c"},
    @{key="SHOPIFY_USA_SECRET"; value="d01260e58adb00198cddddd1bd9a9490"},
    @{key="SHOPIFY_USA_ACCESS_TOKEN"; value="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"},
    @{key="SHOPIFY_USA_SHOP_URL"; value="us-sentiaspirits.myshopify.com"},

    # Unleashed ERP
    @{key="UNLEASHED_API_ID"; value="d5313df6-db35-430c-a69e-ae27dffe0c5a"},
    @{key="UNLEASHED_API_KEY"; value="2bJcHlDhIV04ScdqT60c3zlnG7hOER7aoPSh2IF2hWQluOi7ZaGkeu4SGeseYexAqOGfcRmyl9c6QYueJHyQ=="},
    @{key="UNLEASHED_API_URL"; value="https://api.unleashedsoftware.com"},

    # AI Services
    @{key="OPENAI_API_KEY"; value="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"},
    @{key="ANTHROPIC_API_KEY"; value="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"},

    # Microsoft Graph API
    @{key="MICROSOFT_CLIENT_ID"; value="c16d6fba-0e6b-45ea-a016-eb697ff7a7ae"},
    @{key="MICROSOFT_CLIENT_SECRET"; value="peI8Q~4QJG.ax3ekxtWrv.PXVENVQ3vw_Br1qayM"},
    @{key="MICROSOFT_TENANT_ID"; value="common"},

    # Feature Flags
    @{key="AUTO_DEPLOY_ENABLED"; value="false"},
    @{key="AUTO_FIX_ENABLED"; value="false"},
    @{key="ENABLE_AUTONOMOUS_TESTING"; value="false"},
    @{key="ENABLE_AI_FEATURES"; value="true"},
    @{key="ENABLE_SSE"; value="true"},
    @{key="ENABLE_WEBSOCKETS"; value="true"},

    # Security
    @{key="SESSION_SECRET"; value="production-session-secret-2025-sentia"},
    @{key="JWT_SECRET"; value="production-jwt-secret-2025-sentia"},
    @{key="JWT_EXPIRES_IN"; value="24h"},

    # Monitoring
    @{key="LOG_LEVEL"; value="error"},
    @{key="ERROR_TRACKING_ENABLED"; value="true"}
)

Write-Host "Starting environment variable update..." -ForegroundColor Green
Write-Host ""

$successCount = 0
$failCount = 0

foreach ($envVar in $envVars) {
    Write-Host -NoNewline "Setting $($envVar.key)... "

    $body = @{
        key = $envVar.key
        value = $envVar.value
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "$API_BASE/services/$SERVICE_ID/env-vars" -Method PUT -Headers $headers -Body $body
        Write-Host "[OK]" -ForegroundColor Green
        $successCount++
    } catch {
        Write-Host "[FAILED]" -ForegroundColor Red
        Write-Host "  Error: $_" -ForegroundColor Red
        $failCount++
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "UPDATE COMPLETE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Results:" -ForegroundColor Yellow
Write-Host "  Success: $successCount variables" -ForegroundColor Green
Write-Host "  Failed: $failCount variables" -ForegroundColor $(if ($failCount -gt 0) {"Red"} else {"Green"})
Write-Host ""

if ($failCount -eq 0) {
    Write-Host "All environment variables set successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Triggering deployment..." -ForegroundColor Yellow

    try {
        $deployResponse = Invoke-RestMethod -Uri "$API_BASE/services/$SERVICE_ID/deploys" -Method POST -Headers $headers
        Write-Host "[OK] Deployment triggered!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Monitor deployment at:" -ForegroundColor Cyan
        Write-Host "https://dashboard.render.com/web/$SERVICE_ID/deploys/$($deployResponse.id)" -ForegroundColor White
    } catch {
        Write-Host "[FAILED] Could not trigger deployment" -ForegroundColor Red
        Write-Host "Error: $_" -ForegroundColor Red
    }
} else {
    Write-Host "Some environment variables failed to set." -ForegroundColor Red
    Write-Host "Please check the errors above and try again." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Wait 2-3 minutes for deployment" -ForegroundColor White
Write-Host "2. Run .\verify-production.ps1 to test" -ForegroundColor White
Write-Host "3. Visit https://sentia-manufacturing-production.onrender.com" -ForegroundColor White