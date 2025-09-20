# Production Monitoring Script
# Continuously monitors production deployment until it's operational

param(
    [int]$CheckInterval = 30,  # Check every 30 seconds
    [int]$MaxAttempts = 60     # Maximum attempts (30 minutes)
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PRODUCTION DEPLOYMENT MONITOR" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Monitoring: https://sentia-manufacturing-production.onrender.com" -ForegroundColor Yellow
Write-Host "Check Interval: $CheckInterval seconds" -ForegroundColor Yellow
Write-Host "Max Duration: $($MaxAttempts * $CheckInterval / 60) minutes" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop monitoring" -ForegroundColor Gray
Write-Host ""

$startTime = Get-Date
$attempt = 0
$lastStatus = ""

function Get-ServiceStatus {
    param([string]$url)

    try {
        $response = Invoke-WebRequest -Uri $url -Method GET -UseBasicParsing -TimeoutSec 10
        return @{
            Code = $response.StatusCode
            Type = $response.Headers["Content-Type"]
            Success = $true
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        return @{
            Code = $statusCode
            Type = ""
            Success = $false
        }
    }
}

function Show-Progress {
    param(
        [int]$current,
        [int]$total,
        [string]$status
    )

    $percentComplete = ($current / $total) * 100
    $progressBar = "[" + ("=" * [Math]::Floor($percentComplete / 5)) + (" " * (20 - [Math]::Floor($percentComplete / 5))) + "]"

    Write-Host -NoNewline "`r$progressBar $([Math]::Round($percentComplete))% | Attempt $current/$total | $status"
}

Write-Host "Starting monitoring at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host ""

while ($attempt -lt $MaxAttempts) {
    $attempt++
    $elapsed = (Get-Date) - $startTime

    # Check health endpoint
    $healthStatus = Get-ServiceStatus "https://sentia-manufacturing-production.onrender.com/health"

    # Format status message
    if ($healthStatus.Success -and $healthStatus.Code -eq 200) {
        if ($healthStatus.Type -like "*json*") {
            $statusMsg = "OK - HEALTHY (JSON Response)"
            $statusColor = "Green"
        } else {
            $statusMsg = "WARNING - Responding (HTML instead of JSON)"
            $statusColor = "Yellow"
        }
    } elseif ($healthStatus.Code -eq 502) {
        $statusMsg = "ERROR - 502 Bad Gateway - Awaiting env vars"
        $statusColor = "Red"
    } elseif ($healthStatus.Code -eq 503) {
        $statusMsg = "WARNING - 503 Service starting up..."
        $statusColor = "Yellow"
    } else {
        $statusMsg = "ERROR - HTTP $($healthStatus.Code)"
        $statusColor = "Red"
    }

    # Show status if changed
    if ($statusMsg -ne $lastStatus) {
        Write-Host ""
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Status: $statusMsg" -ForegroundColor $statusColor
        $lastStatus = $statusMsg

        # If healthy, perform additional checks
        if ($healthStatus.Success -and $healthStatus.Code -eq 200 -and $healthStatus.Type -like "*json*") {
            Write-Host ""
            Write-Host "SUCCESS - PRODUCTION IS OPERATIONAL!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Additional checks:" -ForegroundColor Cyan

            # Check API status
            $apiStatus = Get-ServiceStatus "https://sentia-manufacturing-production.onrender.com/api/status"
            if ($apiStatus.Success) {
                Write-Host "  [OK] API Status: Working" -ForegroundColor Green
            } else {
                Write-Host "  [ERROR] API Status: Failed" -ForegroundColor Red
            }

            # Check main page
            $mainStatus = Get-ServiceStatus "https://sentia-manufacturing-production.onrender.com"
            if ($mainStatus.Success) {
                Write-Host "  [OK] Main Page: Working" -ForegroundColor Green
            } else {
                Write-Host "  [ERROR] Main Page: Failed" -ForegroundColor Red
            }

            Write-Host ""
            Write-Host "Deployment successful! Total time: $([Math]::Round($elapsed.TotalMinutes, 1)) minutes" -ForegroundColor Green
            Write-Host ""

            $openSite = Read-Host "Would you like to open the production site? (Y/N)"
            if ($openSite -eq "Y" -or $openSite -eq "y") {
                Start-Process "https://sentia-manufacturing-production.onrender.com"
            }

            break
        }

        # If 502, show instructions
        if ($healthStatus.Code -eq 502) {
            Write-Host ""
            Write-Host "ACTION REQUIRED:" -ForegroundColor Yellow
            Write-Host "1. Go to: https://dashboard.render.com/web/srv-ctg8hkpu0jms73ab8m00/env" -ForegroundColor Cyan
            Write-Host "2. Add environment variables from render-production-env-vars.txt" -ForegroundColor Cyan
            Write-Host "3. Save changes to trigger deployment" -ForegroundColor Cyan
            Write-Host ""
        }
    } else {
        # Show progress bar for same status
        Show-Progress $attempt $MaxAttempts "Elapsed: $([Math]::Round($elapsed.TotalMinutes, 1))m"
    }

    # Wait before next check
    Start-Sleep -Seconds $CheckInterval
}

if ($attempt -ge $MaxAttempts) {
    Write-Host ""
    Write-Host ""
    Write-Host "MONITORING TIMEOUT" -ForegroundColor Red
    Write-Host "Production did not become healthy after $($MaxAttempts * $CheckInterval / 60) minutes" -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual intervention required:" -ForegroundColor Yellow
    Write-Host "1. Check deployment logs: https://dashboard.render.com/web/srv-ctg8hkpu0jms73ab8m00/logs" -ForegroundColor Cyan
    Write-Host "2. Verify environment variables are set correctly" -ForegroundColor Cyan
    Write-Host "3. Check for build/start errors in the logs" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Monitoring ended at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray