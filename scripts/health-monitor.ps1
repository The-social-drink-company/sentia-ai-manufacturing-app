# CapLiquify Manufacturing Platform - Health Monitoring Script
# Monitors all Railway deployments and sends alerts if issues detected

param(
    [Parameter()]
    [ValidateSet("once", "continuous")]
    [string]$Mode = "once",

    [Parameter()]
    [int]$IntervalSeconds = 60
)

# Configuration
$environments = @(
    @{
        Name = "Development"
        URL = "https://sentia-manufacturing-development.up.railway.app"
        HealthEndpoint = "/api/health"
        Critical = $false
    },
    @{
        Name = "Testing"
        URL = "https://sentia-manufacturing-testing.up.railway.app"
        HealthEndpoint = "/api/health"
        Critical = $false
    },
    @{
        Name = "Production"
        URL = "https://sentia-manufacturing-production.up.railway.app"
        HealthEndpoint = "/api/health"
        Critical = $true
    }
)

# Colors for output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor $Color
}

# Function to check health endpoint
function Test-HealthEndpoint {
    param(
        [string]$URL,
        [string]$Endpoint
    )

    $fullUrl = "$URL$Endpoint"

    try {
        $response = Invoke-WebRequest -Uri $fullUrl -Method GET -TimeoutSec 10 -UseBasicParsing

        if ($response.StatusCode -eq 200) {
            $content = $response.Content | ConvertFrom-Json

            return @{
                Success = $true
                StatusCode = $response.StatusCode
                Status = $content.status
                Server = $content.server
                Version = $content.version
                ResponseTime = 0
            }
        }
        else {
            return @{
                Success = $false
                StatusCode = $response.StatusCode
                Error = "Non-200 status code"
            }
        }
    }
    catch {
        return @{
            Success = $false
            Error = $_.Exception.Message
        }
    }
}

# Function to check frontend
function Test-Frontend {
    param(
        [string]$URL
    )

    try {
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        $response = Invoke-WebRequest -Uri $URL -Method GET -TimeoutSec 10 -UseBasicParsing
        $stopwatch.Stop()

        if ($response.StatusCode -eq 200) {
            return @{
                Success = $true
                StatusCode = $response.StatusCode
                ResponseTime = $stopwatch.ElapsedMilliseconds
                ContentLength = $response.Content.Length
            }
        }
        else {
            return @{
                Success = $false
                StatusCode = $response.StatusCode
            }
        }
    }
    catch {
        return @{
            Success = $false
            Error = $_.Exception.Message
        }
    }
}

# Function to generate status report
function Get-StatusReport {
    param(
        [array]$Environments
    )

    Write-ColorOutput "=========================================" -Color Blue
    Write-ColorOutput "CapLiquify Manufacturing Platform Health Check" -Color Blue
    Write-ColorOutput "=========================================" -Color Blue

    $allHealthy = $true
    $results = @()

    foreach ($env in $Environments) {
        Write-Host ""
        Write-ColorOutput "Checking $($env.Name) Environment..." -Color Yellow

        # Check health endpoint
        $healthResult = Test-HealthEndpoint -URL $env.URL -Endpoint $env.HealthEndpoint

        # Check frontend
        $frontendResult = Test-Frontend -URL $env.URL

        # Display results
        if ($healthResult.Success) {
            Write-ColorOutput "  Health Check: PASS (Status: $($healthResult.Status))" -Color Green
        }
        else {
            Write-ColorOutput "  Health Check: FAIL ($($healthResult.Error))" -Color Red
            $allHealthy = $false

            if ($env.Critical) {
                Write-ColorOutput "  CRITICAL: Production environment is down!" -Color Red
            }
        }

        if ($frontendResult.Success) {
            Write-ColorOutput "  Frontend: PASS (Response Time: $($frontendResult.ResponseTime)ms)" -Color Green
        }
        else {
            Write-ColorOutput "  Frontend: FAIL ($($frontendResult.Error))" -Color Red
            $allHealthy = $false
        }

        # Add to results
        $results += @{
            Environment = $env.Name
            URL = $env.URL
            HealthCheck = $healthResult
            Frontend = $frontendResult
            Critical = $env.Critical
        }
    }

    Write-Host ""
    Write-ColorOutput "=========================================" -Color Blue

    if ($allHealthy) {
        Write-ColorOutput "Overall Status: ALL SYSTEMS OPERATIONAL" -Color Green
    }
    else {
        Write-ColorOutput "Overall Status: ISSUES DETECTED" -Color Red
    }

    Write-ColorOutput "=========================================" -Color Blue

    return @{
        AllHealthy = $allHealthy
        Results = $results
        Timestamp = Get-Date
    }
}

# Function to send alert (placeholder for actual implementation)
function Send-Alert {
    param(
        [string]$Environment,
        [string]$Issue,
        [bool]$Critical
    )

    # In a real implementation, this would:
    # - Send email via SendGrid
    # - Post to Slack webhook
    # - Create incident in PagerDuty
    # - Log to monitoring service

    Write-ColorOutput "ALERT: $Environment - $Issue" -Color Red

    if ($Critical) {
        Write-ColorOutput "CRITICAL ALERT TRIGGERED - Immediate action required!" -Color Red
    }
}

# Function to generate HTML report
function Export-HTMLReport {
    param(
        [object]$Report
    )

    $html = @"
<!DOCTYPE html>
<html>
<head>
    <title>Sentia Health Report - $(Get-Date -Format 'yyyy-MM-dd HH:mm')</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; }
        .status-pass { color: green; font-weight: bold; }
        .status-fail { color: red; font-weight: bold; }
        .critical { background-color: #ffcccc; padding: 10px; }
        table { border-collapse: collapse; width: 100%; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .timestamp { color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <h1>CapLiquify Manufacturing Platform - Health Report</h1>
    <p class="timestamp">Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')</p>

    <h2>Overall Status: $(if($Report.AllHealthy){'<span class="status-pass">OPERATIONAL</span>'}else{'<span class="status-fail">ISSUES DETECTED</span>'})</h2>

    <table>
        <tr>
            <th>Environment</th>
            <th>URL</th>
            <th>Health Check</th>
            <th>Frontend</th>
            <th>Response Time</th>
        </tr>
"@

    foreach ($result in $Report.Results) {
        $healthStatus = if($result.HealthCheck.Success){"PASS"}else{"FAIL"}
        $frontendStatus = if($result.Frontend.Success){"PASS"}else{"FAIL"}
        $responseTime = if($result.Frontend.ResponseTime){"$($result.Frontend.ResponseTime)ms"}else{"N/A"}
        $rowClass = if($result.Critical -and -not $result.HealthCheck.Success){"critical"}else{""}

        $html += @"
        <tr class="$rowClass">
            <td>$($result.Environment)</td>
            <td><a href="$($result.URL)">$($result.URL)</a></td>
            <td class="$(if($result.HealthCheck.Success){'status-pass'}else{'status-fail'})">$healthStatus</td>
            <td class="$(if($result.Frontend.Success){'status-pass'}else{'status-fail'})">$frontendStatus</td>
            <td>$responseTime</td>
        </tr>
"@
    }

    $html += @"
    </table>
</body>
</html>
"@

    $reportPath = "health-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').html"
    $html | Out-File -FilePath $reportPath -Encoding UTF8
    Write-ColorOutput "HTML report saved to: $reportPath" -Color Green

    return $reportPath
}

# Main execution
function Start-Monitoring {
    Write-ColorOutput "Starting CapLiquify Manufacturing Platform Monitoring" -Color Cyan
    Write-ColorOutput "Mode: $Mode" -Color Cyan

    if ($Mode -eq "continuous") {
        Write-ColorOutput "Interval: $IntervalSeconds seconds" -Color Cyan
        Write-ColorOutput "Press Ctrl+C to stop monitoring" -Color Yellow
        Write-Host ""
    }

    $iterationCount = 0

    do {
        $iterationCount++

        if ($Mode -eq "continuous") {
            Write-ColorOutput "Iteration #$iterationCount" -Color Cyan
        }

        # Run health checks
        $report = Get-StatusReport -Environments $environments

        # Check for critical issues
        foreach ($result in $report.Results) {
            if ($result.Critical -and -not $result.HealthCheck.Success) {
                Send-Alert -Environment $result.Environment -Issue "Health check failed" -Critical $true
            }
            elseif (-not $result.HealthCheck.Success) {
                Send-Alert -Environment $result.Environment -Issue "Health check failed" -Critical $false
            }
        }

        # Export report every 10 iterations in continuous mode
        if ($Mode -eq "continuous" -and $iterationCount % 10 -eq 0) {
            Export-HTMLReport -Report $report
        }
        elseif ($Mode -eq "once") {
            Export-HTMLReport -Report $report
        }

        if ($Mode -eq "continuous") {
            Write-Host ""
            Write-ColorOutput "Next check in $IntervalSeconds seconds..." -Color Gray
            Start-Sleep -Seconds $IntervalSeconds
        }

    } while ($Mode -eq "continuous")

    Write-Host ""
    Write-ColorOutput "Monitoring completed" -Color Green
}

# Run the monitoring
Start-Monitoring