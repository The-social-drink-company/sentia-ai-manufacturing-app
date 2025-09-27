# PowerShell Script to Help Update Render Environment Variables
# This script generates the commands to update Render environment variables

Write-Host "========================================"
Write-Host "RENDER ENVIRONMENT VARIABLE UPDATE GUIDE"
Write-Host "========================================"
Write-Host ""
Write-Host "Since Render CLI is not working, please manually add these variables in the Render Dashboard:"
Write-Host ""
Write-Host "1. Go to: https://dashboard.render.com"
Write-Host "2. Select: sentia-manufacturing-production"
Write-Host "3. Click: Environment tab"
Write-Host "4. Add each variable below:"
Write-Host ""

# Critical Clerk Variables
$criticalVars = @{
    "VITE_CLERK_PUBLISHABLE_KEY" = "pk_live_REDACTED"
    "CLERK_SECRET_KEY" = "sk_live_REDACTED"
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" = "pk_live_REDACTED"
    "VITE_CLERK_DOMAIN" = "clerk.financeflo.ai"
    "VITE_CLERK_SIGN_IN_URL" = "/sign-in"
    "VITE_CLERK_SIGN_UP_URL" = "/sign-up"
    "VITE_CLERK_AFTER_SIGN_IN_URL" = "/dashboard"
    "VITE_CLERK_AFTER_SIGN_UP_URL" = "/dashboard"
    "CLERK_WEBHOOK_SECRET" = "whsec_REDACTED"
    "VITE_API_BASE_URL" = "/api"
    "API_BASE_URL" = "/api"
}

# MCP Server Variables
$mcpVars = @{
    "MCP_SERVER_URL" = "https://mcp-server-tkyu.onrender.com"
    "VITE_MCP_SERVER_URL" = "https://mcp-server-tkyu.onrender.com"
    "MCP_JWT_SECRET" = "production-mcp-jwt-secret-2025"
    "SESSION_SECRET" = "production-session-secret-2025-sentia"
    "JWT_SECRET" = "production-jwt-secret-2025-sentia"
    "JWT_EXPIRES_IN" = "24h"
}

Write-Host "CRITICAL VARIABLES (Add these first):" -ForegroundColor Red
Write-Host "======================================" -ForegroundColor Red
foreach ($key in $criticalVars.Keys) {
    Write-Host "$key = $($criticalVars[$key])" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "MCP/SECURITY VARIABLES (Add these next):" -ForegroundColor Blue
Write-Host "=========================================" -ForegroundColor Blue
foreach ($key in $mcpVars.Keys) {
    Write-Host "$key = $($mcpVars[$key])" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "========================================"
Write-Host "AFTER ADDING VARIABLES:"
Write-Host "========================================"
Write-Host "1. Click 'Save Changes' button"
Write-Host "2. Render will automatically trigger a new deployment"
Write-Host "3. Monitor the deployment in the Events tab"
Write-Host "4. Wait 2-5 minutes for deployment to complete"
Write-Host "5. Test: https://sentia-manufacturing-production.onrender.com/health"
Write-Host ""
Write-Host "Expected response after successful deployment:"
Write-Host '{"status":"ok","timestamp":"..."}' -ForegroundColor Green
Write-Host ""
Write-Host "========================================"