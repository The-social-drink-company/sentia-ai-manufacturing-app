# MCP Server Railway Deployment Script
# Automates the deployment of MCP integration to Railway

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("development", "testing", "production")]
    [string]$Environment,

    [switch]$ConfigureVariables = $false,
    [switch]$DeployMCPServer = $false,
    [switch]$EnableAutoSync = $false,
    [switch]$RunTests = $false,
    [switch]$All = $false
)

# If -All flag is set, enable all options
if ($All) {
    $ConfigureVariables = $true
    $DeployMCPServer = $true
    $EnableAutoSync = $true
    $RunTests = $true
}

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   MCP Railway Deployment Script" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host ""

# Configuration
$config = @{
    "development" = @{
        "url" = "https://sentia-manufacturing-dashboard-development.up.railway.app"
        "serviceId" = "f97b65ad-c306-410a-9d5d-5f5fdc098620"
        "branch" = "development"
        "autoSync" = $false
    }
    "testing" = @{
        "url" = "https://sentiatest.financeflo.ai"
        "serviceId" = "02e0c7f6-9ca1-4355-af52-ee9eec0b3545"
        "branch" = "test"
        "autoSync" = $false
    }
    "production" = @{
        "url" = "https://sentia-manufacturing-production.up.railway.app"
        "serviceId" = "3e0053fc-ea90-49ec-9708-e09d58cad4a0"
        "branch" = "production"
        "autoSync" = $true
    }
}

$mcpServerConfig = @{
    "serviceId" = "99691282-de66-45b2-98cf-317083dd11ba"
    "url" = "https://web-production-99691282.up.railway.app"
    "projectId" = "3adb1ac4-84d8-473b-885f-3a9790fe6140"
}

# Function to check if Railway CLI is installed
function Test-RailwayCLI {
    try {
        $version = & railway --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] Railway CLI installed: $version" -ForegroundColor Green
            return $true
        }
    } catch {
        Write-Host "[ERROR] Railway CLI not installed" -ForegroundColor Red
        Write-Host "       Install with: npm install -g @railway/cli" -ForegroundColor Yellow
        return $false
    }
}

# Function to check Railway connection
function Test-RailwayConnection {
    try {
        $status = & railway status 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] Railway connected" -ForegroundColor Green
            Write-Host "     $status" -ForegroundColor Gray
            return $true
        } else {
            Write-Host "[ERROR] Not connected to Railway" -ForegroundColor Red
            Write-Host "        Run: railway link" -ForegroundColor Yellow
            return $false
        }
    } catch {
        return $false
    }
}

# Function to generate secure secret
function New-SecureSecret {
    param([int]$Length = 32)

    $bytes = New-Object byte[] $Length
    $rng = [System.Security.Cryptography.RNGCryptoServiceProvider]::Create()
    $rng.GetBytes($bytes)
    return [Convert]::ToBase64String($bytes)
}

# Function to set Railway environment variables
function Set-RailwayVariables {
    param([string]$Environment)

    Write-Host ""
    Write-Host "Configuring Railway Environment Variables..." -ForegroundColor Cyan
    Write-Host "================================================" -ForegroundColor Gray

    $variables = @{
        "NODE_ENV" = $Environment
        "MCP_SERVER_URL" = $mcpServerConfig.url
        "MCP_SERVER_SERVICE_ID" = $mcpServerConfig.serviceId
        "MCP_JWT_SECRET" = New-SecureSecret
        "SESSION_SECRET" = New-SecureSecret
        "JWT_SECRET" = New-SecureSecret
        "AUTO_SYNC_ENABLED" = if ($config[$Environment].autoSync) { "true" } else { "false" }
        "MCP_ENABLE_WEBSOCKET" = "true"
    }

    if ($Environment -eq "production") {
        $variables["XERO_SYNC_INTERVAL"] = "*/30 * * * *"
        $variables["SHOPIFY_SYNC_INTERVAL"] = "*/15 * * * *"
        $variables["AMAZON_SYNC_INTERVAL"] = "*/60 * * * *"
        $variables["DATABASE_SYNC_INTERVAL"] = "0 */6 * * *"
    }

    foreach ($key in $variables.Keys) {
        $value = $variables[$key]

        # Mask sensitive values in output
        if ($key -like "*SECRET*" -or $key -like "*KEY*") {
            $displayValue = "****" + $value.Substring([Math]::Max(0, $value.Length - 4))
        } else {
            $displayValue = $value
        }

        Write-Host "  Setting $key = $displayValue" -ForegroundColor Gray

        try {
            & railway variables set "$key=$value" 2>&1 | Out-Null
            Write-Host "    [OK]" -ForegroundColor Green
        } catch {
            Write-Host "    [FAILED]" -ForegroundColor Red
        }
    }

    Write-Host ""
    Write-Host "[COMPLETE] Variables configured" -ForegroundColor Green
}

# Function to deploy MCP Server
function Deploy-MCPServer {
    Write-Host ""
    Write-Host "Deploying MCP Server..." -ForegroundColor Cyan
    Write-Host "================================================" -ForegroundColor Gray

    if (-not (Test-Path "mcp-server")) {
        Write-Host "[ERROR] MCP Server directory not found" -ForegroundColor Red
        return $false
    }

    Push-Location "mcp-server"

    try {
        Write-Host "  Linking to MCP Server service..." -ForegroundColor Gray
        & railway link --service $mcpServerConfig.serviceId 2>&1 | Out-Null

        Write-Host "  Deploying to Railway..." -ForegroundColor Gray
        $output = & railway up 2>&1

        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] MCP Server deployment initiated" -ForegroundColor Green
            Write-Host "     URL: $($mcpServerConfig.url)" -ForegroundColor Gray
            return $true
        } else {
            Write-Host "[ERROR] Deployment failed" -ForegroundColor Red
            Write-Host "        $output" -ForegroundColor Gray
            return $false
        }
    } finally {
        Pop-Location
    }
}

# Function to enable auto-sync
function Enable-AutoSync {
    param([string]$Environment)

    Write-Host ""
    Write-Host "Enabling Auto-Sync..." -ForegroundColor Cyan
    Write-Host "================================================" -ForegroundColor Gray

    $url = "$($config[$Environment].url)/api/mcp/sync/enable"

    try {
        Write-Host "  Sending request to: $url" -ForegroundColor Gray
        $response = Invoke-RestMethod -Uri $url -Method POST -TimeoutSec 10

        if ($response.success) {
            Write-Host "[OK] Auto-sync enabled" -ForegroundColor Green
            Write-Host "     Active jobs: $($response.activeJobs)" -ForegroundColor Gray
            return $true
        } else {
            Write-Host "[ERROR] Failed to enable auto-sync" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "[ERROR] Could not enable auto-sync: $_" -ForegroundColor Red
        return $false
    }
}

# Function to run integration tests
function Test-MCPIntegration {
    param([string]$Environment)

    Write-Host ""
    Write-Host "Running Integration Tests..." -ForegroundColor Cyan
    Write-Host "================================================" -ForegroundColor Gray

    $baseUrl = $config[$Environment].url
    $testResults = @()

    # Test endpoints
    $endpoints = @(
        @{ Path = "/api/health"; Name = "Health Check" }
        @{ Path = "/api/mcp/health"; Name = "MCP Health" }
        @{ Path = "/api/mcp/status"; Name = "MCP Status" }
        @{ Path = "/api/mcp/websocket/stats"; Name = "WebSocket Stats" }
        @{ Path = "/api/mcp/sync/status"; Name = "Sync Status" }
    )

    foreach ($endpoint in $endpoints) {
        $url = "$baseUrl$($endpoint.Path)"
        Write-Host "  Testing: $($endpoint.Name)" -ForegroundColor Gray -NoNewline

        try {
            $response = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 5 -UseBasicParsing

            if ($response.StatusCode -eq 200) {
                Write-Host " [OK]" -ForegroundColor Green
                $testResults += @{ Test = $endpoint.Name; Result = "PASS" }
            } else {
                Write-Host " [FAIL] Status: $($response.StatusCode)" -ForegroundColor Red
                $testResults += @{ Test = $endpoint.Name; Result = "FAIL" }
            }
        } catch {
            Write-Host " [ERROR] Connection failed" -ForegroundColor Red
            $testResults += @{ Test = $endpoint.Name; Result = "ERROR" }
        }
    }

    # Summary
    $passed = ($testResults | Where-Object { $_.Result -eq "PASS" }).Count
    $total = $testResults.Count

    Write-Host ""
    Write-Host "Test Results: $passed/$total passed" -ForegroundColor $(if ($passed -eq $total) { "Green" } else { "Yellow" })

    return $testResults
}

# Function to check deployment status
function Get-DeploymentStatus {
    Write-Host ""
    Write-Host "Checking Deployment Status..." -ForegroundColor Cyan
    Write-Host "================================================" -ForegroundColor Gray

    try {
        $logs = & railway logs --tail 5 2>&1

        if ($logs -match "Server started|Listening on port|Ready") {
            Write-Host "[OK] Application is running" -ForegroundColor Green
        } else {
            Write-Host "[WARNING] Application may still be starting" -ForegroundColor Yellow
        }

        Write-Host ""
        Write-Host "Recent logs:" -ForegroundColor Gray
        $logs | ForEach-Object { Write-Host "  $_" -ForegroundColor DarkGray }
    } catch {
        Write-Host "[ERROR] Could not fetch logs" -ForegroundColor Red
    }
}

# Main execution
Write-Host "Starting MCP Railway Deployment..." -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
if (-not (Test-RailwayCLI)) {
    Write-Host ""
    Write-Host "Please install Railway CLI first" -ForegroundColor Red
    exit 1
}

if (-not (Test-RailwayConnection)) {
    Write-Host ""
    Write-Host "Please connect to Railway first" -ForegroundColor Red
    exit 1
}

# Execute requested operations
$success = $true

if ($ConfigureVariables) {
    Set-RailwayVariables -Environment $Environment
}

if ($DeployMCPServer) {
    if (-not (Deploy-MCPServer)) {
        $success = $false
    }
}

# Wait for deployment to stabilize
if ($DeployMCPServer) {
    Write-Host ""
    Write-Host "Waiting for deployment to stabilize..." -ForegroundColor Gray
    Start-Sleep -Seconds 30
}

if ($EnableAutoSync -and $Environment -eq "production") {
    if (-not (Enable-AutoSync -Environment $Environment)) {
        $success = $false
    }
} elseif ($EnableAutoSync) {
    Write-Host ""
    Write-Host "[INFO] Auto-sync is only enabled in production" -ForegroundColor Yellow
}

if ($RunTests) {
    $testResults = Test-MCPIntegration -Environment $Environment
}

# Check deployment status
Get-DeploymentStatus

# Final summary
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   Deployment Summary" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "URL: $($config[$Environment].url)" -ForegroundColor Gray
Write-Host "MCP Server: $($mcpServerConfig.url)" -ForegroundColor Gray
Write-Host ""

if ($success) {
    Write-Host "DEPLOYMENT SUCCESSFUL" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "  1. Visit MCP Monitor: $($config[$Environment].url)/mcp-monitor" -ForegroundColor Gray
    Write-Host "  2. Configure API keys if needed" -ForegroundColor Gray
    Write-Host "  3. Monitor logs: railway logs --follow" -ForegroundColor Gray
    exit 0
} else {
    Write-Host "DEPLOYMENT COMPLETED WITH WARNINGS" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Some operations may have failed. Please review the output above." -ForegroundColor Yellow
    exit 1
}