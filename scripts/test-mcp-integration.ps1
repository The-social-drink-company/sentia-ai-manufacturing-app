# Test MCP Server Integration
# Verifies connectivity to Railway-hosted MCP Server and all API integrations

param(
    [Parameter()]
    [ValidateSet("development", "testing", "production")]
    [string]$Environment = "development"
)

Write-Host "=========================================" -ForegroundColor Blue
Write-Host "MCP Server Integration Test" -ForegroundColor Blue
Write-Host "=========================================" -ForegroundColor Blue
Write-Host "Environment: $Environment" -ForegroundColor Cyan
Write-Host ""

# MCP Server Configuration
$MCP_SERVER_URL = "https://web-production-99691282.up.railway.app"
$MCP_SERVICE_ID = "99691282-de66-45b2-98cf-317083dd11ba"

# Neon Database Configuration
$NEON_PROJECT_ID = "dry-mud-a5j3t7xw"
$NEON_BRANCHES = @{
    development = "sentia_development"
    testing = "sentia_testing"
    production = "sentia_production"
}

# Railway Service URLs
$RAILWAY_URLS = @{
    development = "https://sentia-manufacturing-development.up.railway.app"
    testing = "https://sentia-manufacturing-testing.up.railway.app"
    production = "https://sentia-manufacturing-production.up.railway.app"
}

# Function to test endpoint
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$URL,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [string]$Body = ""
    )

    Write-Host "Testing $Name..." -ForegroundColor Yellow

    try {
        $params = @{
            Uri = $URL
            Method = $Method
            Headers = $Headers
            TimeoutSec = 10
            ErrorAction = "Stop"
        }

        if ($Method -eq "POST" -and $Body) {
            $params.Body = $Body
            $params.ContentType = "application/json"
        }

        $response = Invoke-WebRequest @params -UseBasicParsing

        if ($response.StatusCode -eq 200) {
            Write-Host "  ✓ $Name is operational (Status: $($response.StatusCode))" -ForegroundColor Green

            # Try to parse JSON response
            try {
                $content = $response.Content | ConvertFrom-Json
                if ($content.status) {
                    Write-Host "    Status: $($content.status)" -ForegroundColor Gray
                }
                if ($content.version) {
                    Write-Host "    Version: $($content.version)" -ForegroundColor Gray
                }
                return $true
            }
            catch {
                # Not JSON, that's okay
                return $true
            }
        }
        else {
            Write-Host "  ✗ $Name returned status $($response.StatusCode)" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "  ✗ $Name failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Test Results
$results = @{
    MCPServer = $false
    Application = $false
    Database = $false
    APIs = @{}
}

Write-Host "1. Testing MCP Server Connection" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Gray

# Test MCP Server Health
$results.MCPServer = Test-Endpoint `
    -Name "MCP Server Health" `
    -URL "$MCP_SERVER_URL/health"

# Test MCP Server Status
Test-Endpoint `
    -Name "MCP Server Status" `
    -URL "$MCP_SERVER_URL/mcp/status"

Write-Host ""
Write-Host "2. Testing Application Deployment" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Gray

# Test Application Health
$appUrl = $RAILWAY_URLS[$Environment]
$results.Application = Test-Endpoint `
    -Name "$Environment Application" `
    -URL "$appUrl/api/health"

Write-Host ""
Write-Host "3. Testing Database Connectivity" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Gray

# Test database through MCP Server
$dbTestBody = @{
    query = "SELECT 1 as test"
    branch = $NEON_BRANCHES[$Environment]
    projectId = $NEON_PROJECT_ID
} | ConvertTo-Json

$results.Database = Test-Endpoint `
    -Name "Neon Database ($($NEON_BRANCHES[$Environment]))" `
    -URL "$MCP_SERVER_URL/mcp/database/query" `
    -Method "POST" `
    -Body $dbTestBody

Write-Host ""
Write-Host "4. Testing API Integrations" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Gray

# Test Xero Integration
$xeroBody = @{
    service = "xero"
    method = "GET"
    endpoint = "/health"
} | ConvertTo-Json

$results.APIs.Xero = Test-Endpoint `
    -Name "Xero API Integration" `
    -URL "$MCP_SERVER_URL/mcp/tools/unified-api-call" `
    -Method "POST" `
    -Body $xeroBody

# Test Shopify Integration
$shopifyBody = @{
    service = "shopify"
    method = "GET"
    endpoint = "/health"
} | ConvertTo-Json

$results.APIs.Shopify = Test-Endpoint `
    -Name "Shopify API Integration" `
    -URL "$MCP_SERVER_URL/mcp/tools/unified-api-call" `
    -Method "POST" `
    -Body $shopifyBody

# Test Amazon Integration
$amazonBody = @{
    service = "amazon"
    method = "GET"
    endpoint = "/health"
} | ConvertTo-Json

$results.APIs.Amazon = Test-Endpoint `
    -Name "Amazon SP-API Integration" `
    -URL "$MCP_SERVER_URL/mcp/tools/unified-api-call" `
    -Method "POST" `
    -Body $amazonBody

Write-Host ""
Write-Host "5. Testing AI Services" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Gray

# Test AI Manufacturing Request
$aiBody = @{
    request = "Test manufacturing analysis"
    timestamp = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
    environment = $Environment
} | ConvertTo-Json

Test-Endpoint `
    -Name "AI Manufacturing Request" `
    -URL "$MCP_SERVER_URL/mcp/tools/ai-manufacturing-request" `
    -Method "POST" `
    -Body $aiBody

# Test Inventory Optimization
$inventoryBody = @{
    database = $NEON_BRANCHES[$Environment]
    parameters = @{
        test = $true
    }
} | ConvertTo-Json

Test-Endpoint `
    -Name "Inventory Optimization" `
    -URL "$MCP_SERVER_URL/mcp/tools/optimize-inventory" `
    -Method "POST" `
    -Body $inventoryBody

Write-Host ""
Write-Host "=========================================" -ForegroundColor Blue
Write-Host "Test Summary" -ForegroundColor Blue
Write-Host "=========================================" -ForegroundColor Blue

# Calculate overall status
$allPassed = $true

if ($results.MCPServer) {
    Write-Host "✓ MCP Server: CONNECTED" -ForegroundColor Green
    Write-Host "  Service ID: $MCP_SERVICE_ID" -ForegroundColor Gray
    Write-Host "  URL: $MCP_SERVER_URL" -ForegroundColor Gray
}
else {
    Write-Host "✗ MCP Server: DISCONNECTED" -ForegroundColor Red
    $allPassed = $false
}

if ($results.Application) {
    Write-Host "✓ Application: DEPLOYED" -ForegroundColor Green
    Write-Host "  Environment: $Environment" -ForegroundColor Gray
    Write-Host "  URL: $appUrl" -ForegroundColor Gray
}
else {
    Write-Host "✗ Application: NOT ACCESSIBLE" -ForegroundColor Red
    $allPassed = $false
}

if ($results.Database) {
    Write-Host "✓ Database: CONNECTED" -ForegroundColor Green
    Write-Host "  Branch: $($NEON_BRANCHES[$Environment])" -ForegroundColor Gray
    Write-Host "  Project: $NEON_PROJECT_ID" -ForegroundColor Gray
}
else {
    Write-Host "✗ Database: DISCONNECTED" -ForegroundColor Red
    $allPassed = $false
}

# API Integration Summary
$apiCount = 0
$apiConnected = 0
foreach ($api in $results.APIs.Keys) {
    $apiCount++
    if ($results.APIs[$api]) {
        $apiConnected++
    }
}

if ($apiConnected -eq $apiCount) {
    Write-Host "✓ API Integrations: ALL CONNECTED ($apiConnected/$apiCount)" -ForegroundColor Green
}
elseif ($apiConnected -gt 0) {
    Write-Host "⚠ API Integrations: PARTIAL ($apiConnected/$apiCount)" -ForegroundColor Yellow
}
else {
    Write-Host "✗ API Integrations: NONE CONNECTED" -ForegroundColor Red
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Blue

if ($allPassed) {
    Write-Host "OVERALL STATUS: ALL SYSTEMS OPERATIONAL" -ForegroundColor Green
}
else {
    Write-Host "OVERALL STATUS: ISSUES DETECTED" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting Steps:" -ForegroundColor Yellow
    Write-Host "1. Check Railway deployment status at:" -ForegroundColor Yellow
    Write-Host "   https://railway.app/project/6d1ca9b2-75e2-46c6-86a8-ed05161112fe" -ForegroundColor Gray
    Write-Host "2. Verify MCP Server is running at:" -ForegroundColor Yellow
    Write-Host "   https://railway.app/project/3adb1ac4-84d8-473b-885f-3a9790fe6140" -ForegroundColor Gray
    Write-Host "3. Check environment variables are set correctly" -ForegroundColor Yellow
    Write-Host "4. Review logs using: railway logs --service [service-id]" -ForegroundColor Yellow
}

Write-Host "=========================================" -ForegroundColor Blue

# Export results for automation
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$resultFile = "mcp-test-results-$timestamp.json"
$results | ConvertTo-Json -Depth 3 | Out-File $resultFile
Write-Host "Results saved to: $resultFile" -ForegroundColor Gray