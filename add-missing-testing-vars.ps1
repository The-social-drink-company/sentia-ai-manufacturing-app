# PowerShell script to add missing environment variables to Render testing environment
# These are the variables that are missing from render.yaml but present in development.env

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "ADD MISSING TESTING ENVIRONMENT VARIABLES" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Missing variables that need to be added to testing environment
$missingVars = @{
    # API URLs
    "VITE_API_BASE_URL" = "https://sentia-manufacturing-dashboard-test.onrender.com/api"
    "VITE_APP_TITLE" = "CapLiquify Manufacturing Platform"
    "VITE_APP_VERSION" = "1.0.0"

    # Authentication fallback settings
    "VITE_DISABLE_AUTH_FALLBACK" = "true"
    "VITE_FORCE_CLERK_AUTH" = "true"

    # MCP Server Configuration
    "MCP_SERVER_PORT" = "3001"
    "MCP_SERVER_URL" = "https://sentia-mcp-production.onrender.com"
    "MCP_JWT_SECRET" = "UCL2hGcrBa4GdF32izKAd2dTBDJ5WidLVuV5r3uPTOc="
    "MCP_SERVER_HEALTH_CHECK_INTERVAL" = "30000"
    "MCP_ENABLE_WEBSOCKET" = "true"

    # Sync intervals
    "AMAZON_SYNC_INTERVAL" = "*/60 * * * *"
    "SHOPIFY_SYNC_INTERVAL" = "*/15 * * * *"
    "XERO_SYNC_INTERVAL" = "*/30 * * * *"
    "DATABASE_SYNC_INTERVAL" = "0 */6 * * *"

    # Microsoft configuration
    "MICROSOFT_TENANT_ID" = "common"
    "MICROSOFT_CLIENT_ID" = "c16d6fba-0e6b-45ea-a016-eb697ff7a7ae"
    "MICROSOFT_CLIENT_SECRET" = "peI8Q~4QJG.ax3ekxtWrv.PXVENVQ3vw_Br1qayM"
    "MICROSOFT_ADMIN_EMAIL" = "admin@app.sentiaspirits.com"
    "MICROSOFT_DATA_EMAIL" = "data@app.sentiaspirits.com"

    # Automation settings
    "ENABLE_AUTONOMOUS_TESTING" = "true"
    "AUTO_FIX_ENABLED" = "true"
    "AUTO_DEPLOY_ENABLED" = "false"
    "AUTO_SYNC_ENABLED" = "true"

    # Logging
    "LOG_LEVEL" = "info"
}

Write-Host "The following environment variables need to be added to the testing environment:" -ForegroundColor Yellow
Write-Host ""

foreach ($key in $missingVars.Keys) {
    Write-Host "  $key = $($missingVars[$key])" -ForegroundColor White
}

Write-Host ""
Write-Host "To add these variables to Render:" -ForegroundColor Green
Write-Host "1. Go to https://dashboard.render.com" -ForegroundColor White
Write-Host "2. Navigate to your 'sentia-manufacturing-testing' service" -ForegroundColor White
Write-Host "3. Click on the 'Environment' tab" -ForegroundColor White
Write-Host "4. Add each variable above" -ForegroundColor White
Write-Host "5. Click 'Save Changes'" -ForegroundColor White
Write-Host ""
Write-Host "The service will automatically redeploy with the new variables." -ForegroundColor Yellow

# Export to a file for easy copy/paste
$outputFile = "missing-testing-vars.env"
$missingVars.GetEnumerator() | ForEach-Object {
    "$($_.Key)=$($_.Value)"
} | Out-File -FilePath $outputFile -Encoding UTF8

Write-Host ""
Write-Host "Variables also saved to: $outputFile" -ForegroundColor Green
Write-Host "You can copy and paste from this file into Render." -ForegroundColor Green
