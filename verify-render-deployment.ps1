# Render Deployment Verification Script
# This script tests all your Render deployments to ensure they're working

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Render Deployment Verification" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Cyan

$environments = @(
    @{
        Name = "Development"
        URL = "https://sentia-manufacturing-development.onrender.com"
        Color = "Green"
    },
    @{
        Name = "Testing"
        URL = "https://sentia-manufacturing-testing.onrender.com"
        Color = "Yellow"
    },
    @{
        Name = "Production"
        URL = "https://sentia-manufacturing-production.onrender.com"
        Color = "Magenta"
    }
)

$results = @()

foreach ($env in $environments) {
    Write-Host "`nTesting $($env.Name) Environment..." -ForegroundColor $env.Color
    Write-Host "URL: $($env.URL)" -ForegroundColor Gray

    # Test main site
    try {
        $response = Invoke-WebRequest -Uri $env.URL -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "  [OK] Main site is accessible" -ForegroundColor Green
            $mainStatus = "OK"
        } else {
            Write-Host "  [WARN] Main site returned status: $($response.StatusCode)" -ForegroundColor Yellow
            $mainStatus = "Status: $($response.StatusCode)"
        }
    } catch {
        Write-Host "  [FAIL] Main site is not accessible" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor DarkRed
        $mainStatus = "FAIL"
    }

    # Test API health endpoint
    $apiUrl = "$($env.URL)/api/health"
    try {
        $apiResponse = Invoke-RestMethod -Uri $apiUrl -TimeoutSec 10
        if ($apiResponse.status -eq "ok") {
            Write-Host "  [OK] API health check passed" -ForegroundColor Green
            $apiStatus = "OK"
        } else {
            Write-Host "  [WARN] API health returned unexpected response" -ForegroundColor Yellow
            $apiStatus = "Unexpected"
        }
    } catch {
        Write-Host "  [FAIL] API health check failed" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor DarkRed
        $apiStatus = "FAIL"
    }

    $results += @{
        Environment = $env.Name
        URL = $env.URL
        MainSite = $mainStatus
        API = $apiStatus
    }
}

# Test MCP Server
Write-Host "`nTesting MCP Server..." -ForegroundColor Cyan
$mcpUrl = "https://sentia-mcp-server.onrender.com/health"
try {
    $mcpResponse = Invoke-RestMethod -Uri $mcpUrl -TimeoutSec 10
    Write-Host "  [OK] MCP Server is running" -ForegroundColor Green
    $mcpStatus = "OK"
} catch {
    Write-Host "  [INFO] MCP Server endpoint not accessible (worker service)" -ForegroundColor Yellow
    $mcpStatus = "Worker Service"
}

Write-Host "`n=====================================" -ForegroundColor Cyan
Write-Host "         DEPLOYMENT SUMMARY" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Cyan

foreach ($result in $results) {
    Write-Host "`n$($result.Environment):" -ForegroundColor White
    Write-Host "  URL: $($result.URL)" -ForegroundColor Gray

    if ($result.MainSite -eq "OK") {
        Write-Host "  Main Site: OK" -ForegroundColor Green
    } elseif ($result.MainSite -eq "FAIL") {
        Write-Host "  Main Site: FAILED" -ForegroundColor Red
    } else {
        Write-Host "  Main Site: $($result.MainSite)" -ForegroundColor Yellow
    }

    if ($result.API -eq "OK") {
        Write-Host "  API: OK" -ForegroundColor Green
    } elseif ($result.API -eq "FAIL") {
        Write-Host "  API: FAILED" -ForegroundColor Red
    } else {
        Write-Host "  API: $($result.API)" -ForegroundColor Yellow
    }
}

Write-Host "`nMCP Server: $mcpStatus" -ForegroundColor $(if ($mcpStatus -eq "OK") { "Green" } else { "Yellow" })

Write-Host "`n=====================================" -ForegroundColor Cyan

# Check if all passed
$allOk = $true
foreach ($result in $results) {
    if ($result.MainSite -ne "OK" -or $result.API -ne "OK") {
        $allOk = $false
        break
    }
}

if ($allOk) {
    Write-Host "  ALL DEPLOYMENTS SUCCESSFUL!" -ForegroundColor Green
    Write-Host "=====================================" -ForegroundColor Cyan
} else {
    Write-Host "  SOME DEPLOYMENTS NEED ATTENTION" -ForegroundColor Yellow
    Write-Host "=====================================" -ForegroundColor Cyan
    Write-Host "`nTroubleshooting Tips:" -ForegroundColor White
    Write-Host "1. Check if services are still deploying (first deploy takes 10-15 min)" -ForegroundColor Gray
    Write-Host "2. Verify environment variables are set in Render Dashboard" -ForegroundColor Gray
    Write-Host "3. Check service logs in Render Dashboard for errors" -ForegroundColor Gray
    Write-Host "4. Ensure DATABASE_URL is correctly configured" -ForegroundColor Gray
}