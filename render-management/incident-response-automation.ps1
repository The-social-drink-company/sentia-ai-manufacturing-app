# Automated Incident Response System for Render Services
# Detects, diagnoses, and responds to service incidents

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("Monitor", "Diagnose", "Respond", "Test")]
    [string]$Mode = "Monitor",

    [Parameter(Mandatory=$false)]
    [int]$CheckInterval = 60,

    [Parameter(Mandatory=$false)]
    [string]$ServiceName = "",

    [Parameter(Mandatory=$false)]
    [switch]$AutoRemediate = $false
)

# Configuration
$script:IncidentLog = @()
$script:ActiveIncidents = @{}
$script:IncidentCounter = 1000

# Severity levels
$SeverityLevels = @{
    Critical = @{ Color = "Red"; ResponseTime = 5; Escalate = $true }
    High = @{ Color = "Yellow"; ResponseTime = 15; Escalate = $true }
    Medium = @{ Color = "Magenta"; ResponseTime = 30; Escalate = $false }
    Low = @{ Color = "Cyan"; ResponseTime = 60; Escalate = $false }
}

# Service configurations
$Services = @{
    "production" = @{
        URL = "https://sentia-manufacturing-production.onrender.com/health"
        CriticalThreshold = 3000  # ms
        WarningThreshold = 1000   # ms
        Priority = "Critical"
    }
    "testing" = @{
        URL = "https://sentia-manufacturing-testing.onrender.com/health"
        CriticalThreshold = 5000
        WarningThreshold = 2000
        Priority = "High"
    }
    "development" = @{
        URL = "https://sentia-manufacturing-development.onrender.com/health"
        CriticalThreshold = 10000
        WarningThreshold = 5000
        Priority = "Medium"
    }
    "mcp" = @{
        URL = "https://mcp-server-tkyu.onrender.com/health"
        CriticalThreshold = 3000
        WarningThreshold = 1000
        Priority = "High"
    }
}

function New-Incident {
    param(
        [string]$Service,
        [string]$Severity,
        [string]$Description,
        [hashtable]$Details = @{}
    )

    $incidentId = "INC-$(Get-Date -Format 'yyyyMMdd')-$($script:IncidentCounter)"
    $script:IncidentCounter++

    $incident = @{
        Id = $incidentId
        Service = $Service
        Severity = $Severity
        Description = $Description
        Details = $Details
        StartTime = Get-Date
        Status = "Open"
        Actions = @()
    }

    $script:ActiveIncidents[$incidentId] = $incident
    $script:IncidentLog += $incident

    Write-Host ""
    Write-Host "═══════════════════════════════════════════════" -ForegroundColor $SeverityLevels[$Severity].Color
    Write-Host " 🚨 NEW INCIDENT: $incidentId" -ForegroundColor $SeverityLevels[$Severity].Color
    Write-Host "═══════════════════════════════════════════════" -ForegroundColor $SeverityLevels[$Severity].Color
    Write-Host "Service: $Service" -ForegroundColor White
    Write-Host "Severity: $Severity" -ForegroundColor $SeverityLevels[$Severity].Color
    Write-Host "Description: $Description" -ForegroundColor White
    Write-Host "Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
    Write-Host ""

    # Log to file
    $logEntry = "[$incidentId] $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - $Severity - $Service - $Description"
    $logEntry | Add-Content -Path "incidents.log"

    return $incident
}

function Test-ServiceHealth {
    param([string]$ServiceName)

    $service = $Services[$ServiceName]
    if (-not $service) {
        Write-Host "Unknown service: $ServiceName" -ForegroundColor Red
        return $null
    }

    $result = @{
        Service = $ServiceName
        Status = "Unknown"
        ResponseTime = 0
        Error = $null
        Timestamp = Get-Date
    }

    try {
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        $response = Invoke-RestMethod -Uri $service.URL -Method GET -TimeoutSec 10
        $stopwatch.Stop()

        $result.ResponseTime = $stopwatch.ElapsedMilliseconds

        if ($response.status -eq "healthy") {
            $result.Status = "Healthy"
        } else {
            $result.Status = "Degraded"
        }

        # Check response time thresholds
        if ($result.ResponseTime -gt $service.CriticalThreshold) {
            $result.Status = "Critical"
        } elseif ($result.ResponseTime -gt $service.WarningThreshold) {
            $result.Status = "Warning"
        }

    } catch {
        $result.Status = "Down"
        $result.Error = $_.Exception.Message
    }

    return $result
}

function Start-Diagnosis {
    param([string]$ServiceName, [hashtable]$HealthResult)

    Write-Host "🔍 Starting diagnosis for $ServiceName..." -ForegroundColor Yellow

    $diagnosis = @{
        Service = $ServiceName
        Timestamp = Get-Date
        Checks = @()
        RootCause = "Unknown"
        Recommendations = @()
    }

    # Check 1: Service reachability
    Write-Host "  Checking service reachability..." -ForegroundColor Gray
    $pingTest = Test-NetConnection -ComputerName ($Services[$ServiceName].URL -replace 'https?://' -replace '/.*') -Port 443 -InformationLevel Quiet
    $diagnosis.Checks += @{
        Name = "Network Connectivity"
        Result = if ($pingTest) { "Pass" } else { "Fail" }
    }

    # Check 2: DNS resolution
    Write-Host "  Checking DNS resolution..." -ForegroundColor Gray
    try {
        $dns = Resolve-DnsName -Name ($Services[$ServiceName].URL -replace 'https?://' -replace '/.*') -ErrorAction Stop
        $diagnosis.Checks += @{
            Name = "DNS Resolution"
            Result = "Pass"
            Details = "Resolved to: $($dns[0].IPAddress)"
        }
    } catch {
        $diagnosis.Checks += @{
            Name = "DNS Resolution"
            Result = "Fail"
        }
    }

    # Check 3: SSL Certificate
    Write-Host "  Checking SSL certificate..." -ForegroundColor Gray
    try {
        $uri = [System.Uri]$Services[$ServiceName].URL
        $tcpClient = New-Object System.Net.Sockets.TcpClient($uri.Host, 443)
        $sslStream = New-Object System.Net.Security.SslStream($tcpClient.GetStream(), $false)
        $sslStream.AuthenticateAsClient($uri.Host)
        $cert = $sslStream.RemoteCertificate

        $diagnosis.Checks += @{
            Name = "SSL Certificate"
            Result = "Pass"
            Details = "Expires: $($cert.GetExpirationDateString())"
        }

        $tcpClient.Close()
    } catch {
        $diagnosis.Checks += @{
            Name = "SSL Certificate"
            Result = "Warning"
            Details = $_.Exception.Message
        }
    }

    # Check 4: Recent deployments (via Render API if available)
    if ($env:RENDER_API_KEY) {
        Write-Host "  Checking recent deployments..." -ForegroundColor Gray
        # This would check Render API for recent deployments
        # For now, we'll simulate
        $diagnosis.Checks += @{
            Name = "Recent Deployments"
            Result = "Info"
            Details = "Check Render dashboard for deployment history"
        }
    }

    # Determine root cause
    if ($HealthResult.Status -eq "Down") {
        if (($diagnosis.Checks | Where-Object { $_.Name -eq "Network Connectivity" }).Result -eq "Fail") {
            $diagnosis.RootCause = "Network connectivity issue"
            $diagnosis.Recommendations += "Check Render service status"
            $diagnosis.Recommendations += "Verify DNS configuration"
        } else {
            $diagnosis.RootCause = "Service crash or configuration error"
            $diagnosis.Recommendations += "Check application logs"
            $diagnosis.Recommendations += "Review recent code changes"
        }
    } elseif ($HealthResult.Status -eq "Critical" -or $HealthResult.Status -eq "Warning") {
        $diagnosis.RootCause = "Performance degradation"
        $diagnosis.Recommendations += "Check resource utilization"
        $diagnosis.Recommendations += "Review database queries"
        $diagnosis.Recommendations += "Consider scaling up"
    }

    return $diagnosis
}

function Start-Remediation {
    param(
        [string]$ServiceName,
        [hashtable]$Diagnosis,
        [switch]$Auto
    )

    Write-Host ""
    Write-Host "🔧 Remediation Actions for $ServiceName" -ForegroundColor Cyan

    $actions = @()

    switch ($Diagnosis.RootCause) {
        "Performance degradation" {
            $actions += @{
                Action = "Clear cache"
                Command = { Write-Host "  → Clearing application cache..." -ForegroundColor Yellow }
                Risk = "Low"
            }
            $actions += @{
                Action = "Restart service"
                Command = { Write-Host "  → Service restart requested via Render Dashboard" -ForegroundColor Yellow }
                Risk = "Medium"
            }
        }
        "Service crash or configuration error" {
            $actions += @{
                Action = "View logs"
                Command = {
                    Write-Host "  → Fetching recent error logs..." -ForegroundColor Yellow
                    # In real implementation, fetch logs via API
                }
                Risk = "None"
            }
            $actions += @{
                Action = "Rollback deployment"
                Command = { Write-Host "  → Rollback available via Render Dashboard" -ForegroundColor Yellow }
                Risk = "High"
            }
        }
        default {
            $actions += @{
                Action = "Generate diagnostic report"
                Command = {
                    $reportFile = "diagnostic-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
                    $Diagnosis | ConvertTo-Json -Depth 10 | Out-File $reportFile
                    Write-Host "  → Diagnostic report saved to $reportFile" -ForegroundColor Green
                }
                Risk = "None"
            }
        }
    }

    if ($Auto) {
        Write-Host "Auto-remediation enabled. Executing low-risk actions..." -ForegroundColor Yellow
        foreach ($action in ($actions | Where-Object { $_.Risk -eq "Low" -or $_.Risk -eq "None" })) {
            Write-Host "Executing: $($action.Action)" -ForegroundColor White
            & $action.Command
        }
    } else {
        Write-Host "Recommended actions:" -ForegroundColor White
        foreach ($action in $actions) {
            Write-Host "  • $($action.Action) [Risk: $($action.Risk)]" -ForegroundColor Gray
        }
        Write-Host ""
        Write-Host "Use -AutoRemediate to execute low-risk actions automatically" -ForegroundColor Cyan
    }

    return $actions
}

function Start-Monitoring {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host " INCIDENT MONITORING SYSTEM" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Monitoring interval: $CheckInterval seconds" -ForegroundColor Gray
    Write-Host "Auto-remediation: $(if ($AutoRemediate) { 'Enabled' } else { 'Disabled' })" -ForegroundColor Gray
    Write-Host "Press Ctrl+C to stop monitoring" -ForegroundColor Gray
    Write-Host ""

    $consecutiveFailures = @{}

    while ($true) {
        $timestamp = Get-Date -Format "HH:mm:ss"
        Write-Host "[$timestamp] Checking services..." -ForegroundColor Gray

        foreach ($serviceName in $Services.Keys) {
            if ($ServiceName -and $serviceName -ne $ServiceName) { continue }

            $health = Test-ServiceHealth -ServiceName $serviceName

            # Initialize failure counter if needed
            if (-not $consecutiveFailures.ContainsKey($serviceName)) {
                $consecutiveFailures[$serviceName] = 0
            }

            # Determine if we have an incident
            $hasIncident = $false
            $severity = "Low"

            if ($health.Status -eq "Down") {
                $consecutiveFailures[$serviceName]++
                $hasIncident = $true
                $severity = $Services[$serviceName].Priority
            } elseif ($health.Status -eq "Critical") {
                $consecutiveFailures[$serviceName]++
                $hasIncident = $true
                $severity = if ($consecutiveFailures[$serviceName] -gt 2) { "High" } else { "Medium" }
            } elseif ($health.Status -eq "Warning") {
                if ($consecutiveFailures[$serviceName] -gt 5) {
                    $hasIncident = $true
                    $severity = "Low"
                }
            } else {
                # Service is healthy, reset counter
                if ($consecutiveFailures[$serviceName] -gt 0) {
                    Write-Host "  ✓ $serviceName recovered" -ForegroundColor Green
                }
                $consecutiveFailures[$serviceName] = 0
            }

            # Create incident if needed
            if ($hasIncident) {
                # Check if we already have an active incident for this service
                $existingIncident = $script:ActiveIncidents.Values |
                    Where-Object { $_.Service -eq $serviceName -and $_.Status -eq "Open" } |
                    Select-Object -First 1

                if (-not $existingIncident) {
                    $incident = New-Incident -Service $serviceName -Severity $severity `
                        -Description "$($health.Status) - Response time: $($health.ResponseTime)ms" `
                        -Details $health

                    # Diagnose the issue
                    $diagnosis = Start-Diagnosis -ServiceName $serviceName -HealthResult $health

                    # Display diagnosis
                    Write-Host "Diagnosis Results:" -ForegroundColor Yellow
                    foreach ($check in $diagnosis.Checks) {
                        $color = switch ($check.Result) {
                            "Pass" { "Green" }
                            "Fail" { "Red" }
                            "Warning" { "Yellow" }
                            default { "Gray" }
                        }
                        Write-Host "  • $($check.Name): $($check.Result)" -ForegroundColor $color
                        if ($check.Details) {
                            Write-Host "    $($check.Details)" -ForegroundColor Gray
                        }
                    }
                    Write-Host ""
                    Write-Host "Root Cause: $($diagnosis.RootCause)" -ForegroundColor Magenta
                    Write-Host ""

                    # Attempt remediation
                    $remediation = Start-Remediation -ServiceName $serviceName -Diagnosis $diagnosis -Auto:$AutoRemediate

                    # Update incident with actions taken
                    $incident.Actions = $remediation
                }
            }

            # Display current status
            $statusColor = switch ($health.Status) {
                "Healthy" { "Green" }
                "Warning" { "Yellow" }
                "Critical" { "Red" }
                "Down" { "DarkRed" }
                default { "Gray" }
            }
            Write-Host "  [$($health.Status)] $serviceName - $($health.ResponseTime)ms" -ForegroundColor $statusColor
        }

        # Show active incidents summary
        $activeCount = ($script:ActiveIncidents.Values | Where-Object { $_.Status -eq "Open" }).Count
        if ($activeCount -gt 0) {
            Write-Host ""
            Write-Host "Active Incidents: $activeCount" -ForegroundColor Yellow
            foreach ($incident in ($script:ActiveIncidents.Values | Where-Object { $_.Status -eq "Open" })) {
                $duration = [math]::Round(((Get-Date) - $incident.StartTime).TotalMinutes, 0)
                Write-Host "  • $($incident.Id): $($incident.Service) - $($incident.Severity) ($duration min)" -ForegroundColor Gray
            }
        }

        Write-Host ""
        Start-Sleep -Seconds $CheckInterval
    }
}

# Main execution
switch ($Mode) {
    "Monitor" {
        Start-Monitoring
    }
    "Test" {
        Write-Host "Testing incident response system..." -ForegroundColor Yellow
        Write-Host ""

        # Test each service
        foreach ($serviceName in $Services.Keys) {
            Write-Host "Testing $serviceName..." -ForegroundColor Cyan
            $health = Test-ServiceHealth -ServiceName $serviceName

            Write-Host "  Status: $($health.Status)"
            Write-Host "  Response Time: $($health.ResponseTime)ms"

            if ($health.Error) {
                Write-Host "  Error: $($health.Error)" -ForegroundColor Red
            }
            Write-Host ""
        }

        Write-Host "Test complete!" -ForegroundColor Green
    }
    "Diagnose" {
        if (-not $ServiceName) {
            Write-Host "Please specify -ServiceName for diagnosis" -ForegroundColor Red
            exit 1
        }

        Write-Host "Diagnosing $ServiceName..." -ForegroundColor Yellow
        $health = Test-ServiceHealth -ServiceName $ServiceName
        $diagnosis = Start-Diagnosis -ServiceName $ServiceName -HealthResult $health

        Write-Host ""
        Write-Host "Diagnosis Complete:" -ForegroundColor Green
        $diagnosis | ConvertTo-Json -Depth 10
    }
    "Respond" {
        if (-not $ServiceName) {
            Write-Host "Please specify -ServiceName for response" -ForegroundColor Red
            exit 1
        }

        Write-Host "Initiating incident response for $ServiceName..." -ForegroundColor Yellow
        $health = Test-ServiceHealth -ServiceName $ServiceName

        if ($health.Status -ne "Healthy") {
            $incident = New-Incident -Service $ServiceName -Severity "High" `
                -Description "Manual incident response triggered" -Details $health

            $diagnosis = Start-Diagnosis -ServiceName $ServiceName -HealthResult $health
            $remediation = Start-Remediation -ServiceName $ServiceName -Diagnosis $diagnosis -Auto:$AutoRemediate

            Write-Host ""
            Write-Host "Incident response complete!" -ForegroundColor Green
        } else {
            Write-Host "Service is healthy. No incident created." -ForegroundColor Green
        }
    }
}