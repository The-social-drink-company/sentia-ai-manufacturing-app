# Quick Render Status Check
# Shows all services and their current status

$apiKey = "rnd_N8ATSXMmmARD8dOlWdiuKkdvzhLO"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " RENDER SERVICES STATUS CHECK" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check all known services
$services = @(
    @{Name="Production App"; URL="https://sentia-manufacturing-production.onrender.com/health"},
    @{Name="Testing App"; URL="https://sentia-manufacturing-testing.onrender.com/health"},
    @{Name="Development App"; URL="https://sentia-manufacturing-development.onrender.com/health"},
    @{Name="MCP AI Server"; URL="https://mcp-server-tkyu.onrender.com/health"}
)

Write-Host "Checking service health endpoints..." -ForegroundColor White
Write-Host ""

foreach ($service in $services) {
    Write-Host "$($service.Name): " -NoNewline
    try {
        $response = Invoke-RestMethod -Uri $service.URL -Method GET -TimeoutSec 5
        Write-Host "HEALTHY" -ForegroundColor Green
        if ($response.version) {
            Write-Host "  Version: $($response.version)" -ForegroundColor Gray
        }
        if ($response.uptime) {
            Write-Host "  Uptime: $($response.uptime)" -ForegroundColor Gray
        }
    } catch {
        Write-Host "UNHEALTHY or UNREACHABLE" -ForegroundColor Red
        Write-Host "  Error: $_" -ForegroundColor Gray
    }
    Write-Host ""
}

# Get service list from API
Write-Host "Fetching service details from Render API..." -ForegroundColor White
Write-Host ""

try {
    $headers = @{
        "Authorization" = "Bearer $apiKey"
        "Accept" = "application/json"
    }

    $response = Invoke-RestMethod -Uri "https://api.render.com/v1/services?limit=20" -Headers $headers -Method GET

    if ($response -and $response.Length -gt 0) {
        Write-Host "Found $($response.Length) services:" -ForegroundColor Green
        Write-Host ""

        foreach ($service in $response) {
            $statusColor = switch($service.service.suspended) {
                $false { "Green" }
                $true { "Red" }
                default { "Yellow" }
            }

            Write-Host "Service: $($service.service.name)" -ForegroundColor White
            Write-Host "  ID: $($service.service.id)" -ForegroundColor Gray
            Write-Host "  Type: $($service.service.type)" -ForegroundColor Gray
            Write-Host "  Status: $(if ($service.service.suspended) {'Suspended'} else {'Active'})" -ForegroundColor $statusColor
            Write-Host "  URL: https://$($service.service.name).onrender.com" -ForegroundColor Cyan
            Write-Host "  Last Deploy: $($service.service.updatedAt)" -ForegroundColor Gray
            Write-Host ""
        }
    } else {
        Write-Host "No services found or unable to retrieve service list" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Error accessing Render API:" -ForegroundColor Red
    Write-Host $_
    Write-Host ""
    Write-Host "Please verify your API key is correct and has proper permissions" -ForegroundColor Yellow
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " CHECK COMPLETE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan