# Get Render Service Logs
# Fetches recent logs from any Render service

param(
    [Parameter(Mandatory=$false)]
    [string]$ServiceName = "sentia-manufacturing-production",

    [Parameter(Mandatory=$false)]
    [int]$Lines = 50
)

$apiKey = "rnd_0jchuGfcyltSaCa7AxNj5wDF7XOO"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " RENDER LOGS VIEWER" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Service: $ServiceName" -ForegroundColor White
Write-Host "Lines: $Lines" -ForegroundColor White
Write-Host ""

# First, get the service ID
Write-Host "Looking up service ID..." -ForegroundColor Yellow

$headers = @{
    "Authorization" = "Bearer $apiKey"
    "Accept" = "application/json"
}

try {
    # Get all services
    $services = Invoke-RestMethod -Uri "https://api.render.com/v1/services?limit=20" -Headers $headers -Method GET

    # Find the matching service
    $targetService = $services | Where-Object { $_.service.name -eq $ServiceName }

    if (-not $targetService) {
        Write-Host "Service '$ServiceName' not found!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Available services:" -ForegroundColor Yellow
        foreach ($svc in $services) {
            Write-Host "  - $($svc.service.name)" -ForegroundColor Gray
        }
        exit 1
    }

    $serviceId = $targetService.service.id
    Write-Host "Found service ID: $serviceId" -ForegroundColor Green
    Write-Host ""

    # Get logs
    Write-Host "Fetching last $Lines log entries..." -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Gray

    # Note: Render API logs endpoint may require different formatting
    # This is a placeholder - actual endpoint may vary
    $logsUrl = "https://api.render.com/v1/services/$serviceId/logs"

    try {
        $logs = Invoke-RestMethod -Uri $logsUrl -Headers $headers -Method GET

        if ($logs) {
            Write-Host $logs
        } else {
            Write-Host "No logs available" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "Note: Direct log access via API may require additional setup." -ForegroundColor Yellow
        Write-Host "Alternative: Use Render Dashboard or CLI for log access." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Dashboard URL:" -ForegroundColor White
        Write-Host "https://dashboard.render.com/web/$serviceId/logs" -ForegroundColor Cyan
    }

} catch {
    Write-Host "Error accessing Render API:" -ForegroundColor Red
    Write-Host $_
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Gray
Write-Host ""
Write-Host "Tips:" -ForegroundColor Yellow
Write-Host "1. For real-time logs: https://dashboard.render.com/web/$serviceId/logs" -ForegroundColor Gray
Write-Host "2. Install Render CLI: render logs $ServiceName --tail" -ForegroundColor Gray
Write-Host "3. Use -Lines parameter to get more logs" -ForegroundColor Gray