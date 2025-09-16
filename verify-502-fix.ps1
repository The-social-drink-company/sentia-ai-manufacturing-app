# PowerShell script to verify 502 fix on Render deployments

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Verifying 502 Bad Gateway Fix" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Wait a moment for deployment to complete
Write-Host "Waiting 30 seconds for Render deployment to complete..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Test all three environments
$environments = @(
    @{Name="Development"; URL="https://sentia-manufacturing-development.onrender.com/health"},
    @{Name="Testing"; URL="https://sentia-manufacturing-testing.onrender.com/health"},
    @{Name="Production"; URL="https://sentia-manufacturing-production.onrender.com/health"}
)

foreach ($env in $environments) {
    Write-Host ""
    Write-Host "Testing $($env.Name) Environment:" -ForegroundColor Green
    Write-Host "URL: $($env.URL)" -ForegroundColor White

    try {
        $response = Invoke-WebRequest -Uri $env.URL -Method GET -TimeoutSec 10 -UseBasicParsing

        if ($response.StatusCode -eq 200) {
            Write-Host "SUCCESS: Health check returned 200 OK" -ForegroundColor Green

            # Parse JSON response
            $healthData = $response.Content | ConvertFrom-Json
            Write-Host "Status: $($healthData.status)" -ForegroundColor White
            Write-Host "Server: $($healthData.server)" -ForegroundColor White
            Write-Host "Environment: $($healthData.environment)" -ForegroundColor White
            Write-Host "Uptime: $($healthData.uptime) seconds" -ForegroundColor White
        }
    }
    catch {
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
            if ($statusCode -eq 502) {
                Write-Host "FAILED: Still getting 502 Bad Gateway" -ForegroundColor Red
                Write-Host "The fix may not have deployed yet or additional issues remain" -ForegroundColor Yellow
            }
            elseif ($statusCode -eq 503) {
                Write-Host "WARNING: Service unavailable (503) - Deployment in progress" -ForegroundColor Yellow
            }
            else {
                Write-Host "ERROR: HTTP $statusCode" -ForegroundColor Red
            }
        }
        else {
            Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing Root URL Responses" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Test root URLs to ensure React app is served
$rootUrls = @(
    @{Name="Development"; URL="https://sentia-manufacturing-development.onrender.com/"}
)

foreach ($env in $rootUrls) {
    Write-Host ""
    Write-Host "Testing $($env.Name) Root URL:" -ForegroundColor Green
    Write-Host "URL: $($env.URL)" -ForegroundColor White

    try {
        $response = Invoke-WebRequest -Uri $env.URL -Method GET -TimeoutSec 10 -UseBasicParsing

        if ($response.StatusCode -eq 200) {
            Write-Host "SUCCESS: Root URL returned 200 OK" -ForegroundColor Green

            # Check if it's HTML (React app)
            if ($response.Content -like "*<!DOCTYPE html>*") {
                Write-Host "React app is being served correctly" -ForegroundColor Green
            }
            else {
                Write-Host "WARNING: Response doesn't look like HTML" -ForegroundColor Yellow
            }
        }
    }
    catch {
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
            Write-Host "ERROR: HTTP $statusCode" -ForegroundColor Red
        }
        else {
            Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Verification Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "If deployments are still showing 502:" -ForegroundColor Yellow
Write-Host "1. Wait 2-3 more minutes for deployment to complete" -ForegroundColor White
Write-Host "2. Check Render dashboard for build/deploy status" -ForegroundColor White
Write-Host "3. View Render logs for any startup errors" -ForegroundColor White
Write-Host ""