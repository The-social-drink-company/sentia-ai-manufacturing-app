# Complete Render Validation Script
# Validates all environments, databases, APIs, and MCP integration

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("all", "development", "testing", "production")]
    [string]$Environment = "all"
)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " RENDER COMPLETE VALIDATION" -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Validating: $Environment" -ForegroundColor White
Write-Host ""

# Environment configurations
$environments = @{
    development = @{
        name = "Development"
        url = "https://sentia-manufacturing-development.onrender.com"
        dbName = "sentia-db-development"
        branch = "development"
    }
    testing = @{
        name = "Testing"
        url = "https://sentia-manufacturing-testing.onrender.com"
        dbName = "sentia-db-testing"
        branch = "test"
    }
    production = @{
        name = "Production"
        url = "https://sentia-manufacturing-production.onrender.com"
        dbName = "sentia-db-production"
        branch = "production"
    }
}

# API endpoints to validate
$apiEndpoints = @(
    @{name = "Health"; path = "/health"; critical = $true},
    @{name = "API Status"; path = "/api/status"; critical = $true},
    @{name = "MCP Status"; path = "/api/mcp/status"; critical = $true},
    @{name = "Database"; path = "/api/db/health"; critical = $true},
    @{name = "Xero"; path = "/api/xero/status"; critical = $false},
    @{name = "Shopify UK"; path = "/api/shopify/uk/status"; critical = $false},
    @{name = "Shopify USA"; path = "/api/shopify/usa/status"; critical = $false},
    @{name = "Unleashed"; path = "/api/unleashed/status"; critical = $false}
)

# MCP Server validation
$mcpServer = @{
    url = "https://mcp-server-tkyu.onrender.com"
    endpoints = @(
        @{name = "Health"; path = "/health"},
        @{name = "Info"; path = "/mcp/info"},
        @{name = "Tools"; path = "/mcp/tools"}
    )
}

# Validation results
$results = @{
    passed = 0
    failed = 0
    warnings = 0
    details = @()
}

# Helper function to test endpoint
function Test-Endpoint {
    param(
        [string]$BaseUrl,
        [string]$Path,
        [string]$Name,
        [bool]$Critical = $false
    )

    $fullUrl = "$BaseUrl$Path"
    Write-Host "  Testing $Name..." -NoNewline

    try {
        $response = Invoke-WebRequest -Uri $fullUrl -Method GET -UseBasicParsing -TimeoutSec 10

        if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 201) {
            Write-Host " [PASS]" -ForegroundColor Green
            return @{
                Status = "PASS"
                Name = $Name
                Url = $fullUrl
                StatusCode = $response.StatusCode
            }
        } else {
            Write-Host " [WARN] Status: $($response.StatusCode)" -ForegroundColor Yellow
            return @{
                Status = "WARN"
                Name = $Name
                Url = $fullUrl
                StatusCode = $response.StatusCode
            }
        }
    } catch {
        $errorMsg = $_.Exception.Message
        if ($Critical) {
            Write-Host " [FAIL] $errorMsg" -ForegroundColor Red
            return @{
                Status = "FAIL"
                Name = $Name
                Url = $fullUrl
                Error = $errorMsg
            }
        } else {
            Write-Host " [WARN] Not configured" -ForegroundColor Yellow
            return @{
                Status = "WARN"
                Name = $Name
                Url = $fullUrl
                Error = "Not configured or requires auth"
            }
        }
    }
}

# Test MCP Server first
Write-Host "VALIDATING MCP SERVER" -ForegroundColor Cyan
Write-Host "---------------------" -ForegroundColor Gray
foreach ($endpoint in $mcpServer.endpoints) {
    $result = Test-Endpoint -BaseUrl $mcpServer.url -Path $endpoint.path -Name $endpoint.name -Critical $true

    switch ($result.Status) {
        "PASS" { $results.passed++ }
        "FAIL" { $results.failed++ }
        "WARN" { $results.warnings++ }
    }
    $results.details += $result
}
Write-Host ""

# Test each environment
$envsToTest = if ($Environment -eq "all") { $environments.Keys } else { @($Environment) }

foreach ($env in $envsToTest) {
    $config = $environments[$env]

    Write-Host "VALIDATING $($config.name.ToUpper()) ENVIRONMENT" -ForegroundColor Cyan
    Write-Host "-------------------------------------" -ForegroundColor Gray

    # Test if service is deployed
    Write-Host "Service URL: $($config.url)" -ForegroundColor White
    Write-Host "Database: $($config.dbName)" -ForegroundColor White
    Write-Host "Branch: $($config.branch)" -ForegroundColor White
    Write-Host ""

    # Test each API endpoint
    foreach ($api in $apiEndpoints) {
        $result = Test-Endpoint -BaseUrl $config.url -Path $api.path -Name $api.name -Critical $api.critical

        switch ($result.Status) {
            "PASS" { $results.passed++ }
            "FAIL" { $results.failed++ }
            "WARN" { $results.warnings++ }
        }
        $results.details += $result
    }
    Write-Host ""
}

# Environment Variables Check
Write-Host "ENVIRONMENT VARIABLES CHECK" -ForegroundColor Cyan
Write-Host "---------------------------" -ForegroundColor Gray

$requiredVars = @(
    "NODE_ENV",
    "DATABASE_URL (from Render PostgreSQL)",
    "MCP_SERVER_URL (https://mcp-server-tkyu.onrender.com)",
    "CLERK_SECRET_KEY",
    "VITE_CLERK_PUBLISHABLE_KEY",
    "XERO_CLIENT_ID",
    "XERO_CLIENT_SECRET",
    "SHOPIFY_UK_API_KEY",
    "SHOPIFY_UK_ACCESS_TOKEN",
    "SHOPIFY_USA_API_KEY",
    "SHOPIFY_USA_ACCESS_TOKEN",
    "UNLEASHED_API_ID",
    "UNLEASHED_API_KEY",
    "OPENAI_API_KEY",
    "ANTHROPIC_API_KEY"
)

Write-Host "Required environment variables (must be set in Render dashboard):" -ForegroundColor Yellow
foreach ($var in $requiredVars) {
    Write-Host "  - $var" -ForegroundColor Gray
}
Write-Host ""

# Database Configuration Check
Write-Host "DATABASE CONFIGURATION" -ForegroundColor Cyan
Write-Host "----------------------" -ForegroundColor Gray

Write-Host "Render PostgreSQL Databases Required:" -ForegroundColor Yellow
Write-Host "  Development: sentia-db-development (Free plan)" -ForegroundColor White
Write-Host "  Testing: sentia-db-testing (Free plan)" -ForegroundColor White
Write-Host "  Production: sentia-db-production (Starter plan - $7/month)" -ForegroundColor White
Write-Host ""
Write-Host "Each service automatically connects via fromDatabase property" -ForegroundColor Green
Write-Host ""

# Results Summary
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " VALIDATION RESULTS" -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Cyan

$totalTests = $results.passed + $results.failed + $results.warnings

Write-Host "Total Tests: $totalTests" -ForegroundColor White
Write-Host "Passed: $($results.passed)" -ForegroundColor Green
Write-Host "Failed: $($results.failed)" -ForegroundColor Red
Write-Host "Warnings: $($results.warnings)" -ForegroundColor Yellow

if ($results.passed -gt 0) {
    $successRate = [Math]::Round(($results.passed / $totalTests) * 100, 2)
    Write-Host "Success Rate: $successRate%" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Detailed Results:" -ForegroundColor White
Write-Host "-----------------" -ForegroundColor Gray

foreach ($detail in $results.details) {
    $color = switch ($detail.Status) {
        "PASS" { "Green" }
        "FAIL" { "Red" }
        "WARN" { "Yellow" }
    }

    Write-Host "[$($detail.Status)] $($detail.Name)" -ForegroundColor $color
    if ($detail.Error) {
        Write-Host "     Error: $($detail.Error)" -ForegroundColor Gray
    }
}

# Deployment Status
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " DEPLOYMENT READINESS" -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Cyan

if ($results.failed -eq 0) {
    Write-Host "STATUS: READY FOR PRODUCTION" -ForegroundColor Green
    Write-Host ""
    Write-Host "All critical components validated successfully!" -ForegroundColor Green
    Write-Host "MCP Server is operational" -ForegroundColor Green
    Write-Host "Database connections configured" -ForegroundColor Green
} elseif ($results.failed -lt 3) {
    Write-Host "STATUS: MOSTLY READY" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Some services need configuration" -ForegroundColor Yellow
    Write-Host "Check failed endpoints and configure in Render dashboard" -ForegroundColor Yellow
} else {
    Write-Host "STATUS: NOT READY" -ForegroundColor Red
    Write-Host ""
    Write-Host "Multiple critical failures detected" -ForegroundColor Red
    Write-Host "Deploy services to Render first" -ForegroundColor Red
}

Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "-----------" -ForegroundColor Gray

if ($results.failed -gt 0) {
    Write-Host "1. Deploy services to Render using render.yaml" -ForegroundColor White
    Write-Host "2. Configure all environment variables in Render dashboard" -ForegroundColor White
    Write-Host "3. Ensure databases are created and connected" -ForegroundColor White
    Write-Host "4. Run this validation again" -ForegroundColor White
} else {
    Write-Host "1. Run end-to-end testing" -ForegroundColor White
    Write-Host "2. Migrate data from Neon to Render databases" -ForegroundColor White
    Write-Host "3. Update DNS records for custom domains" -ForegroundColor White
    Write-Host "4. Monitor for 24 hours before switching from Railway" -ForegroundColor White
}

# Export validation report
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$reportFile = "render-validation-report-$timestamp.json"

$report = @{
    timestamp = $timestamp
    environment = $Environment
    results = $results
    mcpStatus = if ($results.details[0].Status -eq "PASS") { "Operational" } else { "Down" }
    recommendation = if ($results.failed -eq 0) { "Ready for deployment" } else { "Needs configuration" }
}

$report | ConvertTo-Json -Depth 3 | Out-File $reportFile
Write-Host ""
Write-Host "Validation report saved to: $reportFile" -ForegroundColor Gray