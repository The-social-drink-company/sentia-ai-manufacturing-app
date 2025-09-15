# Railway Health Monitoring Script
# Continuously monitors the deployment until it's healthy

param(
    [int]$CheckInterval = 30,  # Seconds between checks
    [int]$MaxAttempts = 60     # Maximum attempts before giving up (30 minutes default)
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Railway Health Monitor" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$healthUrl = "https://sentiadeploy.financeflo.ai/health"
$attempt = 0
$isHealthy = $false
$startTime = Get-Date

Write-Host "Monitoring: $healthUrl" -ForegroundColor Yellow
Write-Host "Check interval: $CheckInterval seconds" -ForegroundColor Gray
Write-Host "Max attempts: $MaxAttempts" -ForegroundColor Gray
Write-Host "`nPress Ctrl+C to stop monitoring`n" -ForegroundColor Gray
Write-Host "----------------------------------------" -ForegroundColor DarkGray

while ($attempt -lt $MaxAttempts -and -not $isHealthy) {
    $attempt++
    $timestamp = Get-Date -Format "HH:mm:ss"

    Write-Host "[$timestamp] Attempt $attempt/$MaxAttempts - " -NoNewline

    try {
        $response = Invoke-WebRequest -Uri $healthUrl -Method GET -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
        $statusCode = $response.StatusCode

        if ($statusCode -eq 200) {
            Write-Host "✓ HEALTHY" -ForegroundColor Green

            try {
                $health = $response.Content | ConvertFrom-Json
                Write-Host "  Status: $($health.status)" -ForegroundColor Green
                Write-Host "  Environment: $($health.environment)" -ForegroundColor Gray
                Write-Host "  Port: $($health.port)" -ForegroundColor Gray
                Write-Host "  Timestamp: $($health.timestamp)" -ForegroundColor Gray
            } catch {
                Write-Host "  Response received (Status: $statusCode)" -ForegroundColor Green
            }

            $isHealthy = $true
            break
        } else {
            Write-Host "✗ Unhealthy (Status: $statusCode)" -ForegroundColor Yellow
        }
    } catch {
        $errorMessage = $_.Exception.Message

        if ($errorMessage -like "*502*" -or $errorMessage -like "*Bad Gateway*") {
            Write-Host "✗ 502 Bad Gateway" -ForegroundColor Red

            # Every 5th attempt, show helpful message
            if ($attempt % 5 -eq 0) {
                Write-Host "`n  ⚠ Deployment is not responding. Possible causes:" -ForegroundColor Yellow
                Write-Host "    1. Environment variables not set in Railway" -ForegroundColor Gray
                Write-Host "    2. Build is still in progress" -ForegroundColor Gray
                Write-Host "    3. Application failed to start" -ForegroundColor Gray
                Write-Host "    → Check Railway dashboard for details`n" -ForegroundColor Cyan
            }
        } elseif ($errorMessage -like "*503*") {
            Write-Host "⚠ 503 Service Starting..." -ForegroundColor Yellow
        } elseif ($errorMessage -like "*timeout*" -or $errorMessage -like "*timed out*") {
            Write-Host "✗ Timeout" -ForegroundColor Red
        } else {
            Write-Host "✗ Error: $($errorMessage.Split("`n")[0])" -ForegroundColor Red
        }
    }

    if (-not $isHealthy -and $attempt -lt $MaxAttempts) {
        Write-Host "  Waiting $CheckInterval seconds before next check..." -ForegroundColor DarkGray
        Start-Sleep -Seconds $CheckInterval
    }
}

$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host "`n========================================" -ForegroundColor Cyan

if ($isHealthy) {
    Write-Host "✓ DEPLOYMENT IS HEALTHY!" -ForegroundColor Green
    Write-Host "`nApplication is running successfully at:" -ForegroundColor Cyan
    Write-Host "https://sentiadeploy.financeflo.ai" -ForegroundColor White
    Write-Host "`nTime to healthy: $($duration.ToString('mm\:ss'))" -ForegroundColor Gray

    Write-Host "`nQuick Links:" -ForegroundColor Cyan
    Write-Host "  Dashboard: https://sentiadeploy.financeflo.ai/dashboard" -ForegroundColor White
    Write-Host "  API Health: https://sentiadeploy.financeflo.ai/api/health" -ForegroundColor White
    Write-Host "  Admin Panel: https://sentiadeploy.financeflo.ai/admin" -ForegroundColor White
} else {
    Write-Host "✗ DEPLOYMENT HEALTH CHECK FAILED" -ForegroundColor Red
    Write-Host "`nMonitoring stopped after $($duration.ToString('mm\:ss'))" -ForegroundColor Gray

    Write-Host "`nNext Steps:" -ForegroundColor Yellow
    Write-Host "1. Go to Railway Dashboard:" -ForegroundColor White
    Write-Host "   https://railway.app/project/6d1ca9b2-75e2-46c6-86a8-ed05161112fe" -ForegroundColor Cyan

    Write-Host "`n2. Check the Variables tab and ensure these are set:" -ForegroundColor White
    Write-Host "   - NODE_ENV=development" -ForegroundColor Gray
    Write-Host "   - PORT=3000" -ForegroundColor Gray
    Write-Host "   - DATABASE_URL" -ForegroundColor Gray
    Write-Host "   - CLERK_SECRET_KEY" -ForegroundColor Gray
    Write-Host "   - VITE_CLERK_PUBLISHABLE_KEY" -ForegroundColor Gray

    Write-Host "`n3. Check Deployment Logs for errors" -ForegroundColor White
    Write-Host "`n4. Run verification script:" -ForegroundColor White
    Write-Host "   .\scripts\verify-railway-deployment.ps1" -ForegroundColor Cyan
}

Write-Host "========================================`n" -ForegroundColor Cyan