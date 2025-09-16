# Dashboard Data Generator for Render Services
# Generates real-time JSON data for the monitoring dashboard

param(
    [switch]$Continuous = $false,
    [int]$Interval = 30
)

# Ensure API key is set
if (-not $env:RENDER_API_KEY) {
    Write-Host "ERROR: RENDER_API_KEY not set. Run setup-environment.ps1 first." -ForegroundColor Red
    exit 1
}

$apiKey = $env:RENDER_API_KEY

function Get-ServiceHealth {
    param([string]$ServiceUrl, [string]$ServiceName)

    $result = @{
        name = $ServiceName
        status = "unknown"
        responseTime = 0
        lastChecked = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        error = $null
    }

    try {
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        $response = Invoke-RestMethod -Uri $ServiceUrl -Method GET -TimeoutSec 5
        $stopwatch.Stop()

        $result.status = if ($response.status -eq "healthy") { "healthy" } else { "warning" }
        $result.responseTime = $stopwatch.ElapsedMilliseconds

        # Add extra data if available
        if ($response.version) {
            $result.version = $response.version
        }
        if ($response.uptime) {
            $result.uptime = $response.uptime
        }

    } catch {
        $result.status = "critical"
        $result.error = $_.Exception.Message
    }

    return $result
}

function Get-RenderServicesData {
    $headers = @{
        "Authorization" = "Bearer $apiKey"
        "Accept" = "application/json"
    }

    $servicesData = @{
        timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        services = @{}
        databases = @{}
        metrics = @{}
        alerts = @()
    }

    # Check health endpoints
    $healthChecks = @(
        @{url="https://sentia-manufacturing-production.onrender.com/health"; name="production"},
        @{url="https://sentia-manufacturing-testing.onrender.com/health"; name="testing"},
        @{url="https://sentia-manufacturing-development.onrender.com/health"; name="development"},
        @{url="https://mcp-server-tkyu.onrender.com/health"; name="mcp"}
    )

    foreach ($check in $healthChecks) {
        Write-Host "Checking $($check.name)..." -ForegroundColor Gray
        $servicesData.services[$check.name] = Get-ServiceHealth -ServiceUrl $check.url -ServiceName $check.name
    }

    # Get Render API data
    try {
        Write-Host "Fetching Render API data..." -ForegroundColor Gray
        $apiServices = Invoke-RestMethod -Uri "https://api.render.com/v1/services?limit=20" -Headers $headers -Method GET

        # Process API data
        foreach ($service in $apiServices) {
            $serviceName = $service.service.name
            if ($serviceName -match "sentia-") {
                # Enrich our data with API info
                if ($servicesData.services.ContainsKey($serviceName -replace "sentia-manufacturing-", "")) {
                    $key = $serviceName -replace "sentia-manufacturing-", ""
                    $servicesData.services[$key].id = $service.service.id
                    $servicesData.services[$key].type = $service.service.type
                    $servicesData.services[$key].suspended = $service.service.suspended
                    $servicesData.services[$key].createdAt = $service.service.createdAt
                    $servicesData.services[$key].updatedAt = $service.service.updatedAt
                }
            }
        }

        # Get databases info
        $databases = $apiServices | Where-Object { $_.service.type -eq "postgres" }
        foreach ($db in $databases) {
            $servicesData.databases[$db.service.name] = @{
                id = $db.service.id
                status = if ($db.service.suspended) { "suspended" } else { "active" }
                createdAt = $db.service.createdAt
            }
        }

    } catch {
        Write-Host "Warning: Could not fetch Render API data" -ForegroundColor Yellow
        $servicesData.alerts += @{
            level = "warning"
            message = "Could not fetch Render API data"
            timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        }
    }

    # Calculate metrics
    $healthyCount = ($servicesData.services.Values | Where-Object { $_.status -eq "healthy" }).Count
    $totalCount = $servicesData.services.Count

    $servicesData.metrics = @{
        uptime = if ($totalCount -gt 0) { [math]::Round(($healthyCount / $totalCount) * 100, 2) } else { 0 }
        totalServices = $totalCount
        healthyServices = $healthyCount
        averageResponseTime = if ($totalCount -gt 0) {
            $responseTimes = $servicesData.services.Values | Where-Object { $_.responseTime -gt 0 } | Select-Object -ExpandProperty responseTime
            if ($responseTimes) {
                [math]::Round(($responseTimes | Measure-Object -Average).Average, 0)
            } else { 0 }
        } else { 0 }
        errorRate = if ($totalCount -gt 0) { [math]::Round(((($totalCount - $healthyCount) / $totalCount) * 100), 2) } else { 0 }
    }

    # Check for critical issues
    $criticalServices = $servicesData.services.Values | Where-Object { $_.status -eq "critical" }
    foreach ($critical in $criticalServices) {
        $servicesData.alerts += @{
            level = "critical"
            message = "$($critical.name) service is down"
            timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        }
    }

    # Check for slow response times
    $slowServices = $servicesData.services.Values | Where-Object { $_.responseTime -gt 1000 }
    foreach ($slow in $slowServices) {
        $servicesData.alerts += @{
            level = "warning"
            message = "$($slow.name) service is slow ($($slow.responseTime)ms)"
            timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        }
    }

    return $servicesData
}

function Export-DashboardData {
    param($Data)

    $jsonData = $Data | ConvertTo-Json -Depth 10
    $outputFile = "dashboard-data.json"
    $jsonData | Out-File -FilePath $outputFile -Encoding UTF8

    Write-Host "Dashboard data saved to: $outputFile" -ForegroundColor Green

    # Also create a simplified HTML file that auto-refreshes
    $htmlContent = @"
<!DOCTYPE html>
<html>
<head>
    <title>Service Status</title>
    <meta http-equiv="refresh" content="30">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .healthy { color: green; }
        .warning { color: orange; }
        .critical { color: red; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>Render Services Status - $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")</h1>
    <h2>Metrics</h2>
    <ul>
        <li>Overall Uptime: $($Data.metrics.uptime)%</li>
        <li>Healthy Services: $($Data.metrics.healthyServices)/$($Data.metrics.totalServices)</li>
        <li>Average Response Time: $($Data.metrics.averageResponseTime)ms</li>
        <li>Error Rate: $($Data.metrics.errorRate)%</li>
    </ul>
    <h2>Services</h2>
    <table>
        <tr><th>Service</th><th>Status</th><th>Response Time</th><th>Last Checked</th></tr>
"@

    foreach ($service in $Data.services.Values) {
        $statusClass = $service.status
        $htmlContent += "<tr><td>$($service.name)</td><td class='$statusClass'>$($service.status)</td><td>$($service.responseTime)ms</td><td>$($service.lastChecked)</td></tr>"
    }

    $htmlContent += @"
    </table>
    <p>This page auto-refreshes every 30 seconds</p>
</body>
</html>
"@

    $htmlContent | Out-File -FilePath "dashboard-simple.html" -Encoding UTF8
}

# Main execution
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " RENDER DASHBOARD DATA GENERATOR" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($Continuous) {
    Write-Host "Running in continuous mode (Ctrl+C to stop)" -ForegroundColor Yellow
    Write-Host "Interval: $Interval seconds" -ForegroundColor Gray
    Write-Host ""

    while ($true) {
        $data = Get-RenderServicesData
        Export-DashboardData -Data $data

        # Display summary
        Write-Host ""
        Write-Host "Summary at $(Get-Date -Format 'HH:mm:ss'):" -ForegroundColor Cyan
        Write-Host "  Uptime: $($data.metrics.uptime)%" -ForegroundColor White
        Write-Host "  Healthy: $($data.metrics.healthyServices)/$($data.metrics.totalServices)" -ForegroundColor White
        Write-Host "  Avg Response: $($data.metrics.averageResponseTime)ms" -ForegroundColor White
        Write-Host "  Alerts: $($data.alerts.Count)" -ForegroundColor $(if ($data.alerts.Count -gt 0) { "Yellow" } else { "Green" })
        Write-Host ""

        if ($data.alerts.Count -gt 0) {
            Write-Host "Alerts:" -ForegroundColor Yellow
            foreach ($alert in $data.alerts) {
                Write-Host "  [$($alert.level.ToUpper())] $($alert.message)" -ForegroundColor $(
                    switch ($alert.level) {
                        "critical" { "Red" }
                        "warning" { "Yellow" }
                        default { "Gray" }
                    }
                )
            }
            Write-Host ""
        }

        Write-Host "Next update in $Interval seconds..." -ForegroundColor Gray
        Start-Sleep -Seconds $Interval
    }
} else {
    # Single run
    $data = Get-RenderServicesData
    Export-DashboardData -Data $data

    # Display results
    Write-Host ""
    Write-Host "Dashboard Data Generated:" -ForegroundColor Green
    Write-Host "  JSON Data: dashboard-data.json" -ForegroundColor White
    Write-Host "  Simple HTML: dashboard-simple.html" -ForegroundColor White
    Write-Host ""
    Write-Host "Metrics:" -ForegroundColor Yellow
    Write-Host "  Uptime: $($data.metrics.uptime)%" -ForegroundColor White
    Write-Host "  Healthy Services: $($data.metrics.healthyServices)/$($data.metrics.totalServices)" -ForegroundColor White
    Write-Host "  Average Response Time: $($data.metrics.averageResponseTime)ms" -ForegroundColor White
    Write-Host "  Error Rate: $($data.metrics.errorRate)%" -ForegroundColor White

    if ($data.alerts.Count -gt 0) {
        Write-Host ""
        Write-Host "Alerts ($($data.alerts.Count)):" -ForegroundColor Yellow
        foreach ($alert in $data.alerts) {
            Write-Host "  [$($alert.level.ToUpper())] $($alert.message)" -ForegroundColor $(
                switch ($alert.level) {
                    "critical" { "Red" }
                    "warning" { "Yellow" }
                    default { "Gray" }
                }
            )
        }
    }

    Write-Host ""
    Write-Host "To run continuously, use: .\dashboard-data-generator.ps1 -Continuous" -ForegroundColor Cyan
}