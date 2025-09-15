# Railway Deployment Verification Script
# Run this after adding environment variables to Railway

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Railway Deployment Verification" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$baseUrl = "https://sentiadeploy.financeflo.ai"
$testUrls = @(
    @{Name="Health Check"; Url="$baseUrl/health"; Expected=200},
    @{Name="API Health"; Url="$baseUrl/api/health"; Expected=200},
    @{Name="Main App"; Url="$baseUrl"; Expected=200},
    @{Name="API Test"; Url="$baseUrl/api/test-simple"; Expected=200},
    @{Name="Services Status"; Url="$baseUrl/api/services/status"; Expected=200}
)

$allPassed = $true

Write-Host "Testing endpoints at $baseUrl`n" -ForegroundColor Yellow

foreach ($test in $testUrls) {
    Write-Host "Testing: $($test.Name)" -NoNewline
    Write-Host " [$($test.Url)]" -ForegroundColor Gray

    try {
        $response = Invoke-WebRequest -Uri $test.Url -Method GET -UseBasicParsing -ErrorAction Stop
        $statusCode = $response.StatusCode

        if ($statusCode -eq $test.Expected) {
            Write-Host "  ✓ PASS" -ForegroundColor Green -NoNewline
            Write-Host " (Status: $statusCode)" -ForegroundColor Gray

            # Show response content for health checks
            if ($test.Name -like "*Health*") {
                try {
                    $content = $response.Content | ConvertFrom-Json | ConvertTo-Json -Compress
                    Write-Host "  Response: $content" -ForegroundColor DarkGray
                } catch {
                    Write-Host "  Response: $($response.Content.Substring(0, [Math]::Min(100, $response.Content.Length)))..." -ForegroundColor DarkGray
                }
            }
        } else {
            Write-Host "  ✗ FAIL" -ForegroundColor Red -NoNewline
            Write-Host " (Expected: $($test.Expected), Got: $statusCode)" -ForegroundColor Red
            $allPassed = $false
        }
    } catch {
        $errorMessage = $_.Exception.Message

        if ($errorMessage -like "*502*" -or $errorMessage -like "*Bad Gateway*") {
            Write-Host "  ✗ 502 Bad Gateway" -ForegroundColor Red
            Write-Host "  → Environment variables not configured in Railway" -ForegroundColor Yellow
        } elseif ($errorMessage -like "*503*") {
            Write-Host "  ✗ 503 Service Unavailable" -ForegroundColor Red
            Write-Host "  → Service is starting up, please wait..." -ForegroundColor Yellow
        } elseif ($errorMessage -like "*404*") {
            Write-Host "  ⚠ 404 Not Found" -ForegroundColor Yellow
            Write-Host "  → Endpoint may not be implemented" -ForegroundColor Gray
        } else {
            Write-Host "  ✗ ERROR" -ForegroundColor Red
            Write-Host "  → $errorMessage" -ForegroundColor Red
        }
        $allPassed = $false
    }

    Start-Sleep -Milliseconds 500
}

Write-Host "`n========================================" -ForegroundColor Cyan

# Check Railway CLI status
Write-Host "`nRailway CLI Status:" -ForegroundColor Cyan
try {
    $railwayStatus = railway status 2>$null
    if ($railwayStatus) {
        Write-Host $railwayStatus -ForegroundColor Gray
    } else {
        Write-Host "Railway CLI not configured or not linked to project" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Railway CLI not installed or not configured" -ForegroundColor Yellow
}

# Final status
Write-Host "`n========================================" -ForegroundColor Cyan
if ($allPassed) {
    Write-Host "✓ DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
    Write-Host "All endpoints are responding correctly." -ForegroundColor Green
    Write-Host "`nYour application is live at:" -ForegroundColor Cyan
    Write-Host "$baseUrl" -ForegroundColor White
} else {
    Write-Host "✗ DEPLOYMENT VERIFICATION FAILED" -ForegroundColor Red
    Write-Host "`nTroubleshooting Steps:" -ForegroundColor Yellow
    Write-Host "1. Check Railway Dashboard for deployment status" -ForegroundColor White
    Write-Host "2. Ensure all environment variables are added" -ForegroundColor White
    Write-Host "3. Check Railway deployment logs for errors" -ForegroundColor White
    Write-Host "4. Wait 2-3 minutes if deployment just started" -ForegroundColor White
    Write-Host "`nRailway Dashboard:" -ForegroundColor Cyan
    Write-Host "https://railway.app/project/6d1ca9b2-75e2-46c6-86a8-ed05161112fe" -ForegroundColor White
}
Write-Host "========================================`n" -ForegroundColor Cyan