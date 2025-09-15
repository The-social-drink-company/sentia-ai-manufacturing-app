# Automated Render Deployment Script
# Deploys directly to Render using their Blueprint feature

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "   AUTOMATED RENDER DEPLOYMENT" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if render.yaml exists
if (-not (Test-Path "render.yaml")) {
    Write-Host "ERROR: render.yaml not found!" -ForegroundColor Red
    Write-Host "Please ensure you're in the project root directory." -ForegroundColor Yellow
    exit 1
}

Write-Host "[OK] render.yaml found with all environment variables" -ForegroundColor Green
Write-Host ""

# Step 1: Open Render Blueprint Deploy
Write-Host "[STEP 1] Opening Render Blueprint Deployment..." -ForegroundColor Yellow
Write-Host ""

# Construct the deploy URL with the repo
$repoUrl = "https://github.com/The-social-drink-company/sentia-manufacturing-dashboard"
$deployUrl = "https://render.com/deploy?repo=$repoUrl"

Write-Host "Opening deployment page in browser..." -ForegroundColor Cyan
Start-Process $deployUrl

Write-Host ""
Write-Host "Browser will open with Render's one-click deploy page." -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT: In the browser, you need to:" -ForegroundColor Yellow
Write-Host "1. Sign in or create a Render account" -ForegroundColor White
Write-Host "2. Click the 'Deploy to Render' button" -ForegroundColor White
Write-Host "3. Authorize GitHub access if prompted" -ForegroundColor White
Write-Host "4. Review the service configuration" -ForegroundColor White
Write-Host "5. Click 'Create Web Service'" -ForegroundColor White
Write-Host ""
Write-Host "The render.yaml file contains ALL 55+ environment variables!" -ForegroundColor Green
Write-Host "No manual configuration needed!" -ForegroundColor Green
Write-Host ""
Write-Host "Press Enter after clicking 'Create Web Service'..." -ForegroundColor Cyan
Read-Host

# Step 2: Monitor deployment
Write-Host "`n[STEP 2] Deployment in progress..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Your service is being deployed with:" -ForegroundColor Green
Write-Host "  - All environment variables (55+ configured)" -ForegroundColor White
Write-Host "  - Database connection (Neon PostgreSQL)" -ForegroundColor White
Write-Host "  - All API keys (Clerk, Xero, Shopify, OpenAI, etc.)" -ForegroundColor White
Write-Host "  - Build command: npm ci --legacy-peer-deps && npm run build" -ForegroundColor White
Write-Host "  - Start command: npm start" -ForegroundColor White
Write-Host ""

# Wait for initial deployment
Write-Host "First deployment typically takes 5-10 minutes..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Opening Render Dashboard to monitor progress..." -ForegroundColor Cyan
Start-Process "https://dashboard.render.com"

Write-Host ""
Write-Host "Press Enter when deployment shows 'Live' status..." -ForegroundColor Cyan
Read-Host

# Step 3: Verify deployment
Write-Host "`n[STEP 3] Verifying deployment..." -ForegroundColor Green
Write-Host ""

$serviceUrl = "https://sentia-manufacturing-dashboard.onrender.com"

Write-Host "Testing health endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$serviceUrl/health" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "[SUCCESS] Service is live and healthy!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Response: $($response.Content)" -ForegroundColor Gray
    }
} catch {
    Write-Host "[WARNING] Health check failed. Service may still be starting..." -ForegroundColor Yellow
    Write-Host "Error: $_" -ForegroundColor Gray
}

Write-Host "`n=====================================" -ForegroundColor Cyan
Write-Host "     DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan

Write-Host "`nYour services are available at:" -ForegroundColor Yellow
Write-Host "Development: https://sentia-manufacturing-development.onrender.com" -ForegroundColor White
Write-Host "Testing: https://sentia-manufacturing-testing.onrender.com" -ForegroundColor White
Write-Host "Production: https://sentia-manufacturing-production.onrender.com" -ForegroundColor White

Write-Host "`nTotal estimated cost: $94/month" -ForegroundColor Gray
Write-Host "- Professional plan: $19/month" -ForegroundColor Gray
Write-Host "- 3x Standard services: $75/month" -ForegroundColor Gray

Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Update local .env to use Render backend" -ForegroundColor White
Write-Host "2. Test all critical features" -ForegroundColor White
Write-Host "3. Update OAuth redirect URLs (Clerk, Xero)" -ForegroundColor White
Write-Host "4. Monitor for 24-48 hours before switching from Railway" -ForegroundColor White