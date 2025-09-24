# Render Services Monitoring Script
# Monitors all Sentia services on Render including MCP Server

param(
    [Parameter(Mandatory=$false)]
    [int]$IntervalSeconds = 60,
    [Parameter(Mandatory=$false)]
    [int]$MaxIterations = 0,  # 0 = run forever
    [Parameter(Mandatory=$false)]
    [switch]$AlertOnFailure = $false
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " RENDER SERVICES MONITOR" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Check Interval: $IntervalSeconds seconds" -ForegroundColor Gray
if ($MaxIterations -gt 0) {
    Write-Host "Max Iterations: $MaxIterations" -ForegroundColor Gray
} else {
    Write-Host "Max Iterations: Continuous" -ForegroundColor Gray
}
Write-Host ""

# Service endpoints to monitor
$services = @(
    @{
        Name = "MCP Server"
        Url = "https://mcp-server-tkyu.onrender.com/health"
        Critical = $true
    },
    @{
        Name = "Development App"
        Url = "https://sentia-manufacturing-development.onrender.com/health"
        Critical = $false
    },
    @{
        Name = "Testing App"
        Url = "https://sentia-manufacturing-testing.onrender.com/health"
        Critical = $false
    },
    @{
        Name = "Production App"
        Url = "https://sentia-manufacturing-production.onrender.com/health"
        Critical = $true
    }
)

# Statistics tracking
$stats = @{}
foreach ($service in $services) {
    $stats[$service.Name] = @{
        Checks = 0
        Successes = 0
        Failures = 0
        LastStatus = "Unknown"
        LastCheck = $null
        ResponseTimes = @()
        AverageResponseTime = 0
    }
}

# Function to check service health
function Check-ServiceHealth {
    param(
        [hashtable]$Service
    )

    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    $result = @{
        Success = $false
        ResponseTime = 0
        StatusCode = 0
        Message = ""
    }

    try {
        $response = Invoke-WebRequest -Uri $Service.Url -Method GET -UseBasicParsing -TimeoutSec 10
        $stopwatch.Stop()

        $result.Success = $true
        $result.ResponseTime = $stopwatch.ElapsedMilliseconds
        $result.StatusCode = $response.StatusCode

        # Try to parse JSON response
        try {
            $content = $response.Content | ConvertFrom-Json
            $result.Message = "Service: $($content.service), Status: $($content.status)"
        } catch {
            $result.Message = "Health check passed"
        }
    } catch {
        $stopwatch.Stop()
        $result.ResponseTime = $stopwatch.ElapsedMilliseconds
        $result.Message = $_.Exception.Message
    }

    return $result
}

# Function to display status
function Display-Status {
    param(
        [hashtable]$ServiceStats
    )

    Clear-Host
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host " RENDER SERVICES STATUS" -ForegroundColor Yellow
    Write-Host " $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""

    # Display current status
    Write-Host "Current Status:" -ForegroundColor White
    Write-Host "---------------" -ForegroundColor Gray

    foreach ($service in $services) {
        $stat = $ServiceStats[$service.Name]
        $statusColor = if ($stat.LastStatus -eq "UP") { "Green" } else { "Red" }
        $statusIcon = if ($stat.LastStatus -eq "UP") { "[UP]" } else { "[DOWN]" }

        $criticalTag = if ($service.Critical) { "[CRITICAL]" } else { "" }

        Write-Host "$statusIcon $($service.Name) $criticalTag" -NoNewline -ForegroundColor $statusColor

        if ($stat.LastStatus -eq "UP") {
            Write-Host " - Response: $($stat.AverageResponseTime)ms avg" -ForegroundColor Gray
        } else {
            Write-Host " - Last error: $($stat.LastError)" -ForegroundColor Red
        }
    }

    Write-Host ""
    Write-Host "Statistics:" -ForegroundColor White
    Write-Host "-----------" -ForegroundColor Gray

    $totalChecks = 0
    $totalSuccesses = 0
    foreach ($serviceName in $ServiceStats.Keys) {
        $stat = $ServiceStats[$serviceName]
        $totalChecks += $stat.Checks
        $totalSuccesses += $stat.Successes

        $uptime = if ($stat.Checks -gt 0) {
            [Math]::Round(($stat.Successes / $stat.Checks) * 100, 2)
        } else { 0 }

        Write-Host "$serviceName : $uptime% uptime ($($stat.Successes)/$($stat.Checks) checks)" -ForegroundColor White
    }

    $overallUptime = if ($totalChecks -gt 0) {
        [Math]::Round(($totalSuccesses / $totalChecks) * 100, 2)
    } else { 0 }

    Write-Host ""
    Write-Host "Overall Uptime: $overallUptime%" -ForegroundColor Cyan
}

# Function to send alert
function Send-Alert {
    param(
        [string]$ServiceName,
        [string]$Status,
        [string]$Message
    )

    if ($AlertOnFailure) {
        Write-Host ""
        Write-Host "ALERT: $ServiceName is $Status!" -ForegroundColor Red -BackgroundColor Yellow
        Write-Host "Message: $Message" -ForegroundColor Red

        # Here you could add:
        # - Email notification
        # - Slack webhook
        # - PagerDuty alert
        # - SMS via Twilio
    }
}

# Main monitoring loop
$iteration = 0
$running = $true

while ($running) {
    $iteration++

    # Check all services
    foreach ($service in $services) {
        $result = Check-ServiceHealth -Service $service
        $stat = $stats[$service.Name]

        # Update statistics
        $stat.Checks++
        if ($result.Success) {
            $stat.Successes++
            $previousStatus = $stat.LastStatus
            $stat.LastStatus = "UP"

            # Track response times (keep last 10)
            $stat.ResponseTimes += $result.ResponseTime
            if ($stat.ResponseTimes.Count -gt 10) {
                $stat.ResponseTimes = $stat.ResponseTimes[-10..-1]
            }
            $stat.AverageResponseTime = [Math]::Round(($stat.ResponseTimes | Measure-Object -Average).Average, 0)

            # Alert if service recovered
            if ($previousStatus -eq "DOWN" -and $service.Critical) {
                Send-Alert -ServiceName $service.Name -Status "RECOVERED" -Message "Service is back online"
            }
        } else {
            $stat.Failures++
            $previousStatus = $stat.LastStatus
            $stat.LastStatus = "DOWN"
            $stat.LastError = $result.Message

            # Alert if service went down
            if ($previousStatus -eq "UP" -and $service.Critical) {
                Send-Alert -ServiceName $service.Name -Status "DOWN" -Message $result.Message
            }
        }

        $stat.LastCheck = Get-Date
    }

    # Display current status
    Display-Status -ServiceStats $stats

    # Check if we should continue
    if ($MaxIterations -gt 0 -and $iteration -ge $MaxIterations) {
        $running = $false
        Write-Host ""
        Write-Host "Monitoring complete after $iteration iterations" -ForegroundColor Yellow
    } else {
        Write-Host ""
        Write-Host "Next check in $IntervalSeconds seconds... (Press Ctrl+C to stop)" -ForegroundColor Gray
        Start-Sleep -Seconds $IntervalSeconds
    }
}

# Final summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " MONITORING SESSION SUMMARY" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

foreach ($serviceName in $stats.Keys) {
    $stat = $stats[$serviceName]
    $uptime = if ($stat.Checks -gt 0) {
        [Math]::Round(($stat.Successes / $stat.Checks) * 100, 2)
    } else { 0 }

    Write-Host "$serviceName :" -ForegroundColor White
    Write-Host "  Total Checks: $($stat.Checks)" -ForegroundColor Gray
    Write-Host "  Successes: $($stat.Successes)" -ForegroundColor Green
    Write-Host "  Failures: $($stat.Failures)" -ForegroundColor Red
    Write-Host "  Uptime: $uptime%" -ForegroundColor Cyan
    Write-Host "  Avg Response: $($stat.AverageResponseTime)ms" -ForegroundColor Gray
    Write-Host ""
}

# Export monitoring data
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$logFile = "monitoring-log-$timestamp.json"
$stats | ConvertTo-Json -Depth 3 | Out-File $logFile
Write-Host "Monitoring data saved to: $logFile" -ForegroundColor Gray