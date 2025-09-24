# End-to-End MCP Integration Test
# Tests complete flow: Main App → MCP Server → AI Services → Response

param(
    [Parameter(Mandatory=$false)]
    [string]$Environment = "local",
    [Parameter(Mandatory=$false)]
    [string]$MCPServer = "https://mcp-server-tkyu.onrender.com"
)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " MCP END-TO-END INTEGRATION TEST" -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$config = @{
    local = @{
        url = "http://localhost:5000"
        name = "Local Development"
    }
    development = @{
        url = "https://sentia-manufacturing-development.onrender.com"
        name = "Render Development"
    }
    testing = @{
        url = "https://sentia-manufacturing-testing.onrender.com"
        name = "Render Testing"
    }
    production = @{
        url = "https://sentia-manufacturing-production.onrender.com"
        name = "Render Production"
    }
}

$appConfig = $config[$Environment]
Write-Host "Testing Environment: $($appConfig.name)" -ForegroundColor Yellow
Write-Host "App URL: $($appConfig.url)" -ForegroundColor Gray
Write-Host "MCP Server: $MCPServer" -ForegroundColor Gray
Write-Host ""

# Test results storage
$results = @()

# Helper function for API calls
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [object]$Body = $null
    )

    Write-Host "Testing: $Name" -ForegroundColor Yellow
    Write-Host "  URL: $Url" -ForegroundColor Gray

    try {
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
            UseBasicParsing = $true
            TimeoutSec = 10
        }

        if ($Body) {
            $params.Body = $Body | ConvertTo-Json
            $params.ContentType = "application/json"
        }

        $response = Invoke-WebRequest @params

        if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 201) {
            Write-Host "  [PASS] Status: $($response.StatusCode)" -ForegroundColor Green

            # Try to parse JSON response
            try {
                $content = $response.Content | ConvertFrom-Json
                Write-Host "  Response: $($content | ConvertTo-Json -Compress)" -ForegroundColor Gray
            } catch {
                Write-Host "  Response: $($response.Content.Substring(0, [Math]::Min(100, $response.Content.Length)))..." -ForegroundColor Gray
            }

            return @{
                Name = $Name
                Status = "PASS"
                Code = $response.StatusCode
                Response = $response.Content
            }
        } else {
            Write-Host "  [WARNING] Status: $($response.StatusCode)" -ForegroundColor Yellow
            return @{
                Name = $Name
                Status = "WARNING"
                Code = $response.StatusCode
                Response = $response.Content
            }
        }
    } catch {
        Write-Host "  [FAIL] Error: $($_.Exception.Message)" -ForegroundColor Red
        return @{
            Name = $Name
            Status = "FAIL"
            Error = $_.Exception.Message
        }
    }
}

Write-Host "PHASE 1: MCP Server Direct Tests" -ForegroundColor Cyan
Write-Host "---------------------------------" -ForegroundColor Gray
Write-Host ""

# Test 1: MCP Server Health
$results += Test-Endpoint -Name "MCP Server Health" -Url "$MCPServer/health"

# Test 2: MCP Server Info
$results += Test-Endpoint -Name "MCP Server Info" -Url "$MCPServer/mcp/info"

# Test 3: MCP Tools List
$results += Test-Endpoint -Name "MCP Tools List" -Url "$MCPServer/mcp/tools"

Write-Host ""
Write-Host "PHASE 2: Main Application Tests" -ForegroundColor Cyan
Write-Host "--------------------------------" -ForegroundColor Gray
Write-Host ""

# Test 4: App Health
$results += Test-Endpoint -Name "App Health" -Url "$($appConfig.url)/health"

# Test 5: App API Status
$results += Test-Endpoint -Name "App API Status" -Url "$($appConfig.url)/api/status"

Write-Host ""
Write-Host "PHASE 3: MCP Integration Tests" -ForegroundColor Cyan
Write-Host "-------------------------------" -ForegroundColor Gray
Write-Host ""

# Test 6: MCP Status through App
$results += Test-Endpoint -Name "MCP Status via App" -Url "$($appConfig.url)/api/mcp/status"

# Test 7: Test AI Request (if endpoint exists)
$aiTestBody = @{
    prompt = "Test AI request from integration test"
    context = "manufacturing"
}

$results += Test-Endpoint `
    -Name "AI Request Test" `
    -Url "$($appConfig.url)/api/ai/request" `
    -Method "POST" `
    -Body $aiTestBody

Write-Host ""
Write-Host "PHASE 4: WebSocket Connection Test" -ForegroundColor Cyan
Write-Host "----------------------------------" -ForegroundColor Gray
Write-Host ""

# Test WebSocket endpoint availability
$wsUrl = $MCPServer -replace "https://", "wss://"
Write-Host "Testing WebSocket: $wsUrl" -ForegroundColor Yellow

try {
    # Simple HTTP check for WebSocket upgrade capability
    $wsTest = Test-Endpoint -Name "WebSocket Endpoint" -Url "$MCPServer/ws"
    $results += $wsTest
} catch {
    Write-Host "  WebSocket endpoint test requires actual WS client" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "PHASE 5: Service Integration Tests" -ForegroundColor Cyan
Write-Host "----------------------------------" -ForegroundColor Gray
Write-Host ""

# Test external service connectivity through MCP
$services = @("xero", "shopify", "neon", "openai", "claude")
foreach ($service in $services) {
    $results += Test-Endpoint `
        -Name "$service Integration" `
        -Url "$MCPServer/api/$service/status" `
        -Method "GET"
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " TEST RESULTS SUMMARY" -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Calculate statistics
$passed = ($results | Where-Object { $_.Status -eq "PASS" }).Count
$failed = ($results | Where-Object { $_.Status -eq "FAIL" }).Count
$warnings = ($results | Where-Object { $_.Status -eq "WARNING" }).Count
$total = $results.Count

# Display results table
Write-Host "Test Results:" -ForegroundColor White
Write-Host "-------------" -ForegroundColor Gray
foreach ($result in $results) {
    $color = switch ($result.Status) {
        "PASS" { "Green" }
        "FAIL" { "Red" }
        "WARNING" { "Yellow" }
        default { "Gray" }
    }

    $status = switch ($result.Status) {
        "PASS" { "[PASS]" }
        "FAIL" { "[FAIL]" }
        "WARNING" { "[WARN]" }
        default { "[UNKNOWN]" }
    }

    Write-Host "$status $($result.Name)" -ForegroundColor $color
}

Write-Host ""
Write-Host "Statistics:" -ForegroundColor White
Write-Host "-----------" -ForegroundColor Gray
Write-Host "Total Tests: $total" -ForegroundColor White
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor Red
Write-Host "Warnings: $warnings" -ForegroundColor Yellow
Write-Host "Success Rate: $([Math]::Round(($passed / $total) * 100, 2))%" -ForegroundColor Cyan

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan

# Overall status
if ($failed -eq 0) {
    Write-Host " INTEGRATION TEST: PASSED" -ForegroundColor Green
    Write-Host " MCP Server is fully integrated!" -ForegroundColor Green
} elseif ($passed -gt $total / 2) {
    Write-Host " INTEGRATION TEST: PARTIAL SUCCESS" -ForegroundColor Yellow
    Write-Host " Some endpoints need configuration" -ForegroundColor Yellow
} else {
    Write-Host " INTEGRATION TEST: FAILED" -ForegroundColor Red
    Write-Host " Check configuration and logs" -ForegroundColor Red
}

Write-Host "=========================================" -ForegroundColor Cyan

# Export results to file
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$resultsFile = "mcp-test-results-$timestamp.json"
$results | ConvertTo-Json -Depth 3 | Out-File $resultsFile
Write-Host ""
Write-Host "Results saved to: $resultsFile" -ForegroundColor Gray

# Recommendations
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
if ($failed -gt 0) {
    Write-Host "1. Check failed endpoints in application logs" -ForegroundColor White
    Write-Host "2. Verify environment variables are set correctly" -ForegroundColor White
    Write-Host "3. Ensure MCP_SERVER_URL points to $MCPServer" -ForegroundColor White
    Write-Host "4. Check CORS configuration allows your domain" -ForegroundColor White
} else {
    Write-Host "1. Deploy to production environment" -ForegroundColor White
    Write-Host "2. Set up monitoring alerts" -ForegroundColor White
    Write-Host "3. Configure rate limiting" -ForegroundColor White
    Write-Host "4. Enable production logging" -ForegroundColor White
}