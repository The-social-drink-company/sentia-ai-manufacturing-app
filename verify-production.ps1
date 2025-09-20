# PowerShell Production Deployment Verification Script
# This script checks if the production deployment is working correctly

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "PRODUCTION DEPLOYMENT VERIFICATION" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$PROD_URL = "https://sentia-manufacturing-production.onrender.com"

# Function to check endpoint
function Check-Endpoint {
    param(
        [string]$url,
        [string]$expectedType,
        [string]$description
    )

    Write-Host -NoNewline "Checking $description... "

    try {
        $response = Invoke-WebRequest -Uri $url -Method GET -UseBasicParsing -TimeoutSec 10
        $statusCode = $response.StatusCode
        $contentType = $response.Headers["Content-Type"]

        if ($statusCode -eq 200) {
            if ($expectedType -eq "json") {
                if ($contentType -like "*application/json*") {
                    Write-Host "✓ OK (JSON)" -ForegroundColor Green
                    return $true
                } else {
                    Write-Host "⚠ Returns HTML instead of JSON" -ForegroundColor Yellow
                    return $false
                }
            } else {
                Write-Host "✓ OK (HTTP $statusCode)" -ForegroundColor Green
                return $true
            }
        } else {
            Write-Host "✗ HTTP $statusCode" -ForegroundColor Red
            return $false
        }
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 502) {
            Write-Host "✗ 502 Bad Gateway - Server timeout" -ForegroundColor Red
        } elseif ($_.Exception.Response.StatusCode.value__ -eq 503) {
            Write-Host "✗ 503 Service Unavailable" -ForegroundColor Red
        } else {
            Write-Host "✗ Error: $_" -ForegroundColor Red
        }
        return $false
    }
}

# Main verification
Write-Host "1. ENDPOINT CHECKS" -ForegroundColor White
Write-Host "===================" -ForegroundColor White
$healthOk = Check-Endpoint "$PROD_URL/health" "json" "Health endpoint"
$apiOk = Check-Endpoint "$PROD_URL/api/status" "json" "API status endpoint"
$mainOk = Check-Endpoint $PROD_URL "html" "Main application"
$dashboardOk = Check-Endpoint "$PROD_URL/dashboard" "html" "Dashboard page"

Write-Host ""
Write-Host "2. AUTHENTICATION CHECK" -ForegroundColor White
Write-Host "=======================" -ForegroundColor White
Write-Host -NoNewline "Checking Clerk authentication... "

try {
    $authResponse = Invoke-WebRequest -Uri "$PROD_URL/sign-in" -Method HEAD -UseBasicParsing -TimeoutSec 10
    if ($authResponse.StatusCode -in @(200, 301, 302)) {
        Write-Host "✓ Sign-in page accessible" -ForegroundColor Green
        $authOk = $true
    } else {
        Write-Host "✗ Sign-in page not accessible" -ForegroundColor Red
        $authOk = $false
    }
} catch {
    Write-Host "✗ Sign-in page not accessible" -ForegroundColor Red
    $authOk = $false
}

Write-Host ""
Write-Host "3. DEPLOYMENT CONFIGURATION" -ForegroundColor White
Write-Host "============================" -ForegroundColor White
Write-Host "Service: sentia-manufacturing-production"
Write-Host "URL: $PROD_URL"
Write-Host "Server: minimal-server.js (optimized for fast startup)"
Write-Host "Entry: render-entry.js -> minimal-server.js"
Write-Host ""

Write-Host "Critical Environment Variables Status:" -ForegroundColor Yellow
Write-Host "--------------------------------------" -ForegroundColor Yellow
Write-Host "Note: Environment variables must be verified in Render Dashboard" -ForegroundColor Yellow
Write-Host ""
Write-Host "Required variables:"
Write-Host "  - VITE_CLERK_PUBLISHABLE_KEY"
Write-Host "  - CLERK_SECRET_KEY"
Write-Host "  - PORT=5000"
Write-Host "  - NODE_ENV=production"
Write-Host "  - DATABASE_URL (auto-set by Render)"
Write-Host ""

Write-Host "4. RECENT CHANGES" -ForegroundColor White
Write-Host "=================" -ForegroundColor White
Write-Host "✓ Updated to use minimal-server.js for faster startup" -ForegroundColor Green
Write-Host "✓ Environment variable documentation created" -ForegroundColor Green
Write-Host "✓ PowerShell update script available" -ForegroundColor Green
Write-Host ""

Write-Host "5. NEXT STEPS" -ForegroundColor White
Write-Host "=============" -ForegroundColor White

if ($healthOk -and $apiOk) {
    Write-Host "✓ Production is responding correctly" -ForegroundColor Green
    Write-Host ""
    Write-Host "Recommended actions:"
    Write-Host "1. Verify all environment variables are set in Render Dashboard"
    Write-Host "2. Test authentication flow"
    Write-Host "3. Monitor logs for any errors"
} else {
    Write-Host "✗ Production needs attention" -ForegroundColor Red
    Write-Host ""
    Write-Host "IMMEDIATE ACTIONS REQUIRED:" -ForegroundColor Red
    Write-Host "1. Add missing environment variables via Render Dashboard" -ForegroundColor Yellow
    Write-Host "   - Go to: https://dashboard.render.com/web/srv-ctg8hkpu0jms73ab8m00"
    Write-Host "   - Click 'Environment' tab"
    Write-Host "   - Add variables from render-production-env-vars.txt"
    Write-Host ""
    Write-Host "2. Wait for auto-deployment to complete (2-3 minutes)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "3. Run this script again to verify" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Verification complete!" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Open browser to check manually
$openBrowser = Read-Host "Would you like to open the production site in browser? (Y/N)"
if ($openBrowser -eq "Y" -or $openBrowser -eq "y") {
    Start-Process $PROD_URL
}

# Open Render dashboard
$openDashboard = Read-Host "Would you like to open Render Dashboard? (Y/N)"
if ($openDashboard -eq "Y" -or $openDashboard -eq "y") {
    Start-Process "https://dashboard.render.com/web/srv-ctg8hkpu0jms73ab8m00/env"
}