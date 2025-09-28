# Deploy MCP Server to Render
# Deploys or updates the MCP Server on Render

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " MCP SERVER DEPLOYMENT TO RENDER" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check current status
Write-Host "Step 1: Checking Current MCP Server Status" -ForegroundColor Yellow
Write-Host "-------------------------------------------" -ForegroundColor Gray

$mcpUrl = "https://mcp-server-tkyu.onrender.com"
Write-Host "Testing: $mcpUrl/health" -ForegroundColor White

try {
    $response = Invoke-RestMethod -Uri "$mcpUrl/health" -Method GET -TimeoutSec 5
    Write-Host "[LIVE] MCP Server is already running!" -ForegroundColor Green
    Write-Host "Version: $($response.version)" -ForegroundColor Gray
    Write-Host "Uptime: $([Math]::Round($response.uptime / 60, 2)) minutes" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Do you want to redeploy/update? (y/n): " -NoNewline -ForegroundColor Yellow
    $redeploy = Read-Host
    if ($redeploy -ne 'y') {
        Write-Host "Using existing MCP server." -ForegroundColor Green
        exit 0
    }
} catch {
    Write-Host "[OFFLINE] MCP Server needs deployment" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 2: Preparing MCP Server for Deployment" -ForegroundColor Yellow
Write-Host "-------------------------------------------" -ForegroundColor Gray

# Check if we're in the right directory
if (-not (Test-Path "mcp-server/package.json")) {
    Write-Host "[ERROR] mcp-server directory not found!" -ForegroundColor Red
    Write-Host "Please run this script from the project root." -ForegroundColor Yellow
    exit 1
}

Write-Host "[OK] MCP server files found" -ForegroundColor Green

# Check git status for MCP server
Write-Host ""
Write-Host "Step 3: Git Status Check" -ForegroundColor Yellow
Write-Host "------------------------" -ForegroundColor Gray

$gitStatus = git status mcp-server --porcelain
if ($gitStatus) {
    Write-Host "Uncommitted changes in mcp-server:" -ForegroundColor Yellow
    Write-Host $gitStatus -ForegroundColor Gray

    Write-Host ""
    Write-Host "Committing MCP server changes..." -ForegroundColor Yellow
    git add mcp-server/
    git commit -m "Update MCP server configuration for Render deployment"
}

# Push to GitHub
Write-Host ""
Write-Host "Step 4: Pushing to GitHub" -ForegroundColor Yellow
Write-Host "-------------------------" -ForegroundColor Gray

git push origin development
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Pushed to GitHub" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Git push failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 5: Deployment Options" -ForegroundColor Yellow
Write-Host "--------------------------" -ForegroundColor Gray

Write-Host @"
MCP Server Deployment Methods:

1. AUTOMATIC DEPLOYMENT (If already set up):
   - The push to GitHub will trigger auto-deploy
   - Check: https://dashboard.render.com
   - Service: sentia-mcp-server
   - Status should change to "Deploying"

2. MANUAL DEPLOYMENT (First time):
   a. Go to https://dashboard.render.com
   b. Click "New +" → "Web Service"
   c. Connect repository: The-social-drink-company/sentia-manufacturing-dashboard
   d. Configure:
      - Name: sentia-mcp-server
      - Root Directory: mcp-server
      - Branch: development
      - Runtime: Node
      - Build Command: npm install
      - Start Command: npm start
      - Plan: Standard ($25/month)
   e. Click "Create Web Service"

3. BLUEPRINT DEPLOYMENT (Using render.yaml):
   a. Go to https://dashboard.render.com
   b. Click "New +" → "Blueprint"
   c. Select repository
   d. Choose mcp-server/render.yaml
   e. Click "Apply"
"@ -ForegroundColor White

Write-Host ""
Write-Host "Step 6: Environment Variables to Verify" -ForegroundColor Yellow
Write-Host "---------------------------------------" -ForegroundColor Gray

$requiredVars = @(
    "ANTHROPIC_API_KEY - Claude AI integration",
    "OPENAI_API_KEY - GPT-4 integration",
    "JWT_SECRET - Auto-generated",
    "CORS_ORIGINS - Should include all app URLs",
    "XERO_CLIENT_ID/SECRET - Xero integration",
    "SHOPIFY credentials - E-commerce integration",
    "UNLEASHED credentials - ERP integration"
)

Write-Host "Ensure these are set in Render dashboard:" -ForegroundColor White
foreach ($var in $requiredVars) {
    Write-Host "  - $var" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Step 7: Deployment Monitoring" -ForegroundColor Yellow
Write-Host "-----------------------------" -ForegroundColor Gray

Write-Host "Opening Render Dashboard..." -ForegroundColor Cyan
Start-Process "https://dashboard.render.com/web/sentia-mcp-server"

Write-Host ""
Write-Host "Press Enter after deployment is complete..." -ForegroundColor Yellow
Read-Host

# Test deployment
Write-Host ""
Write-Host "Step 8: Testing Deployment" -ForegroundColor Yellow
Write-Host "--------------------------" -ForegroundColor Gray

$testEndpoints = @(
    "/health",
    "/mcp/info",
    "/mcp/status"
)

$allPassed = $true
foreach ($endpoint in $testEndpoints) {
    Write-Host "Testing: $mcpUrl$endpoint" -NoNewline
    try {
        $response = Invoke-WebRequest -Uri "$mcpUrl$endpoint" -Method GET -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host " [PASS]" -ForegroundColor Green
        } else {
            Write-Host " [WARN] Status: $($response.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host " [FAIL]" -ForegroundColor Red
        $allPassed = $false
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

if ($allPassed) {
    Write-Host " MCP SERVER DEPLOYED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "MCP Server URL: $mcpUrl" -ForegroundColor White
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Update main application to use: $mcpUrl" -ForegroundColor White
    Write-Host "2. Test AI features in the application" -ForegroundColor White
    Write-Host "3. Monitor logs in Render dashboard" -ForegroundColor White
} else {
    Write-Host " DEPLOYMENT NEEDS ATTENTION" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Some endpoints are not responding." -ForegroundColor Yellow
    Write-Host "Check the Render dashboard for logs." -ForegroundColor Yellow
}

# Update main app configuration
Write-Host ""
Write-Host "Step 9: Update Main Application" -ForegroundColor Yellow
Write-Host "-------------------------------" -ForegroundColor Gray

Write-Host "The main application render.yaml already points to:" -ForegroundColor White
Write-Host "MCP_SERVER_URL = $mcpUrl" -ForegroundColor Green

Write-Host ""
Write-Host "Quick Test Commands:" -ForegroundColor Yellow
Write-Host "-------------------" -ForegroundColor Gray
Write-Host "# Test health:" -ForegroundColor Gray
Write-Host "curl $mcpUrl/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "# Test MCP info:" -ForegroundColor Gray
Write-Host "curl $mcpUrl/mcp/info" -ForegroundColor Cyan
Write-Host ""
Write-Host "# Monitor continuously:" -ForegroundColor Gray
Write-Host ".\monitor-render-services.ps1" -ForegroundColor Cyan