# Render 502 Error Diagnostic Script
# Comprehensive diagnostics and fix recommendations

param(
    [string]$Environment = "production",
    [switch]$Verbose
)

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " RENDER 502 ERROR DIAGNOSTICS" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Target Environment: $Environment" -ForegroundColor White
Write-Host "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host ""

# Define URLs based on environment
$baseUrl = switch ($Environment) {
    "production" { "https://sentia-manufacturing-production.onrender.com" }
    "testing" { "https://sentia-manufacturing-testing.onrender.com" }
    "development" { "https://sentia-manufacturing-development.onrender.com" }
    default { "https://sentia-manufacturing-production.onrender.com" }
}

# Test endpoints
$endpoints = @(
    @{Path="/health"; Name="Health Check"; Critical=$true},
    @{Path="/"; Name="Main Application"; Critical=$true},
    @{Path="/api/status"; Name="API Status"; Critical=$false},
    @{Path="/api/health"; Name="API Health"; Critical=$false}
)

# Function to test endpoint
function Test-Endpoint {
    param([string]$Url, [string]$Name, [bool]$Critical)

    $result = @{
        URL = $Url
        Name = $Name
        Status = "Unknown"
        ResponseTime = -1
        StatusCode = 0
        Critical = $Critical
        Error = $null
    }

    try {
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        $response = Invoke-WebRequest -Uri $Url -Method GET -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
        $stopwatch.Stop()

        $result.Status = "OK"
        $result.StatusCode = $response.StatusCode
        $result.ResponseTime = $stopwatch.ElapsedMilliseconds

        # Check response content for health endpoint
        if ($Name -eq "Health Check" -and $response.Content) {
            try {
                $json = $response.Content | ConvertFrom-Json
                if ($json.status) {
                    $result.Status = "HEALTHY"
                }
            } catch {
                # Not JSON, might be HTML
                if ($response.Content -like "*<!DOCTYPE*") {
                    $result.Status = "HTML_RESPONSE"
                    $result.Error = "Returning HTML instead of JSON"
                }
            }
        }
    } catch {
        $result.Status = "FAILED"
        $result.Error = $_.Exception.Message

        if ($_.Exception.Response) {
            $result.StatusCode = $_.Exception.Response.StatusCode.Value__

            if ($result.StatusCode -eq 502) {
                $result.Status = "502_BAD_GATEWAY"
            } elseif ($result.StatusCode -eq 503) {
                $result.Status = "503_SERVICE_UNAVAILABLE"
            } elseif ($result.StatusCode -eq 504) {
                $result.Status = "504_GATEWAY_TIMEOUT"
            }
        }
    }

    return $result
}

# Run diagnostics
Write-Host "STEP 1: Testing Endpoints" -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Gray

$results = @()
foreach ($endpoint in $endpoints) {
    $url = "$baseUrl$($endpoint.Path)"
    Write-Host "Testing: $($endpoint.Name)..." -NoNewline

    $result = Test-Endpoint -Url $url -Name $endpoint.Name -Critical $endpoint.Critical
    $results += $result

    $color = switch ($result.Status) {
        "OK" { "Green" }
        "HEALTHY" { "Green" }
        "HTML_RESPONSE" { "Yellow" }
        "502_BAD_GATEWAY" { "Red" }
        "503_SERVICE_UNAVAILABLE" { "Red" }
        "504_GATEWAY_TIMEOUT" { "Red" }
        "FAILED" { "Red" }
        default { "Yellow" }
    }

    Write-Host " $($result.Status)" -ForegroundColor $color

    if ($Verbose -or $result.Status -ne "OK") {
        if ($result.ResponseTime -ge 0) {
            Write-Host "  Response Time: $($result.ResponseTime)ms" -ForegroundColor Gray
        }
        if ($result.Error) {
            Write-Host "  Error: $($result.Error)" -ForegroundColor DarkRed
        }
    }
}

Write-Host ""
Write-Host "STEP 2: Analyzing Results" -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Gray

# Count issues
$issues = @{
    "502_Errors" = ($results | Where-Object { $_.Status -eq "502_BAD_GATEWAY" }).Count
    "503_Errors" = ($results | Where-Object { $_.Status -eq "503_SERVICE_UNAVAILABLE" }).Count
    "504_Errors" = ($results | Where-Object { $_.Status -eq "504_GATEWAY_TIMEOUT" }).Count
    "HTML_Responses" = ($results | Where-Object { $_.Status -eq "HTML_RESPONSE" }).Count
    "Failed" = ($results | Where-Object { $_.Status -eq "FAILED" }).Count
    "OK" = ($results | Where-Object { $_.Status -in @("OK", "HEALTHY") }).Count
}

foreach ($issue in $issues.GetEnumerator()) {
    if ($issue.Value -gt 0) {
        $color = if ($issue.Name -eq "OK") { "Green" }
                 elseif ($issue.Name -like "*502*" -or $issue.Name -like "*503*") { "Red" }
                 else { "Yellow" }

        Write-Host "$($issue.Name): $($issue.Value)" -ForegroundColor $color
    }
}

Write-Host ""
Write-Host "STEP 3: Root Cause Analysis" -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Gray

if ($issues["502_Errors"] -gt 0) {
    Write-Host "502 BAD GATEWAY DETECTED" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common Causes:" -ForegroundColor Yellow
    Write-Host "  1. Application failed to start within timeout period" -ForegroundColor White
    Write-Host "  2. Application crashed during startup" -ForegroundColor White
    Write-Host "  3. Port mismatch between application and Render" -ForegroundColor White
    Write-Host "  4. Memory or resource limits exceeded" -ForegroundColor White
    Write-Host "  5. Dependency installation failed" -ForegroundColor White
    Write-Host ""

    Write-Host "RECOMMENDED FIXES:" -ForegroundColor Green
    Write-Host ""

    Write-Host "Fix 1: Check Server Configuration" -ForegroundColor Yellow
    Write-Host @"
  - Verify render-entry.js imports minimal-server.js
  - Ensure minimal-server.js uses PORT environment variable
  - Check package.json start script points to correct file
"@ -ForegroundColor Gray

    Write-Host ""
    Write-Host "Fix 2: Simplify Server Startup" -ForegroundColor Yellow
    Write-Host @"
  - Remove complex initialization from server startup
  - Defer database connections to after server starts
  - Remove synchronous operations from startup path
"@ -ForegroundColor Gray

    Write-Host ""
    Write-Host "Fix 3: Update Render Configuration" -ForegroundColor Yellow
    Write-Host @"
  - Add SKIP_ENTERPRISE_INIT=true to environment variables
  - Increase INIT_TIMEOUT_MS to 10000
  - Ensure healthCheckPath is set to /health
"@ -ForegroundColor Gray

    Write-Host ""
    Write-Host "Fix 4: Check Build Process" -ForegroundColor Yellow
    Write-Host @"
  - Ensure npm run build completes successfully
  - Verify dist folder contains index.html
  - Check for missing dependencies in package.json
"@ -ForegroundColor Gray
}

if ($issues["HTML_Responses"] -gt 0) {
    Write-Host ""
    Write-Host "HTML RESPONSES DETECTED" -ForegroundColor Yellow
    Write-Host "Server is returning HTML instead of expected JSON/API responses" -ForegroundColor Gray
    Write-Host "This usually indicates the frontend is being served for all routes" -ForegroundColor Gray
}

Write-Host ""
Write-Host "STEP 4: Quick Fix Commands" -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Gray

Write-Host "Run these commands to apply fixes:" -ForegroundColor White
Write-Host ""

Write-Host "1. Ensure correct server is used:" -ForegroundColor Yellow
Write-Host @"
  cd sentia-manufacturing-dashboard
  git checkout production
  # Edit render-entry.js to use minimal-server.js
  # Edit package.json start script to use minimal-server.js
  git add -A
  git commit -m "fix: Use minimal-server for production"
  git push origin production
"@ -ForegroundColor DarkGray

Write-Host ""
Write-Host "2. Force redeploy on Render:" -ForegroundColor Yellow
Write-Host @"
  # Go to https://dashboard.render.com
  # Select your service
  # Click "Manual Deploy" > "Deploy latest commit"
"@ -ForegroundColor DarkGray

Write-Host ""
Write-Host "3. Monitor deployment logs:" -ForegroundColor Yellow
Write-Host @"
  # In Render dashboard, go to Logs tab
  # Look for startup errors or timeout messages
"@ -ForegroundColor DarkGray

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " DIAGNOSTICS COMPLETE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

if ($issues["502_Errors"] -gt 0) {
    Write-Host ""
    Write-Host "ACTION REQUIRED: 502 errors detected!" -ForegroundColor Red
    Write-Host "Follow the recommended fixes above to resolve." -ForegroundColor Yellow
}