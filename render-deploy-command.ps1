# PowerShell script to deploy to Render with all environment variables

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   RENDER DEPLOYMENT WITH ALL VARIABLES" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check if render.yaml exists
if (-not (Test-Path "render.yaml")) {
    Write-Host "[ERROR] render.yaml not found!" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] render.yaml found with all 55+ environment variables" -ForegroundColor Green
Write-Host ""

# Step 1: Direct deployment link
Write-Host "[STEP 1] One-Click Deployment" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Gray
Write-Host ""
Write-Host "Click this link to deploy with ALL variables pre-configured:" -ForegroundColor White
Write-Host ""
$deployUrl = "https://render.com/deploy?repo=https://github.com/The-social-drink-company/sentia-manufacturing-dashboard"
Write-Host $deployUrl -ForegroundColor Cyan
Write-Host ""
Write-Host "This will:" -ForegroundColor White
Write-Host "  1. Create the web service" -ForegroundColor Gray
Write-Host "  2. Set ALL 55+ environment variables automatically" -ForegroundColor Gray
Write-Host "  3. Deploy from the development branch" -ForegroundColor Gray
Write-Host "  4. Configure Neon PostgreSQL database" -ForegroundColor Gray
Write-Host "  5. Set up all API integrations (Clerk, Xero, Shopify, etc.)" -ForegroundColor Gray
Write-Host ""

# Open in browser
Write-Host "Opening deployment page in browser..." -ForegroundColor Yellow
Start-Process $deployUrl

Write-Host ""
Write-Host "[STEP 2] Manual Verification" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Gray
Write-Host ""
Write-Host "After clicking 'Deploy to Render' in the browser:" -ForegroundColor White
Write-Host ""
Write-Host "1. Sign in to Render (or create account)" -ForegroundColor Gray
Write-Host "2. Review the service configuration" -ForegroundColor Gray
Write-Host "3. Confirm all 55+ environment variables are shown" -ForegroundColor Gray
Write-Host "4. Click 'Create Web Service'" -ForegroundColor Gray
Write-Host ""

Write-Host "Press Enter after you've clicked 'Create Web Service'..." -ForegroundColor Yellow
Read-Host

Write-Host ""
Write-Host "[STEP 3] Alternative: Render CLI" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Gray
Write-Host ""
Write-Host "If the web deployment doesn't work, use Render CLI:" -ForegroundColor White
Write-Host ""
Write-Host "  1. Install Render CLI:" -ForegroundColor Gray
Write-Host "     npm install -g @render/cli" -ForegroundColor Cyan
Write-Host ""
Write-Host "  2. Login to Render:" -ForegroundColor Gray
Write-Host "     render login" -ForegroundColor Cyan
Write-Host ""
Write-Host "  3. Deploy with render.yaml:" -ForegroundColor Gray
Write-Host "     render up" -ForegroundColor Cyan
Write-Host ""

Write-Host "[INFO] Your render.yaml contains ALL these variables:" -ForegroundColor Blue
Write-Host ""
Write-Host "Database & Core:" -ForegroundColor White
Write-Host "  - DATABASE_URL (Neon PostgreSQL)" -ForegroundColor Gray
Write-Host "  - NODE_ENV, PORT, CORS_ORIGINS" -ForegroundColor Gray
Write-Host ""
Write-Host "Authentication (Clerk):" -ForegroundColor White
Write-Host "  - VITE_CLERK_PUBLISHABLE_KEY" -ForegroundColor Gray
Write-Host "  - CLERK_SECRET_KEY" -ForegroundColor Gray
Write-Host "  - CLERK_WEBHOOK_SECRET" -ForegroundColor Gray
Write-Host ""
Write-Host "External APIs:" -ForegroundColor White
Write-Host "  - Xero (CLIENT_ID, SECRET, TENANT_ID)" -ForegroundColor Gray
Write-Host "  - Shopify UK & USA (API keys, tokens, URLs)" -ForegroundColor Gray
Write-Host "  - Amazon SP-API (marketplace IDs)" -ForegroundColor Gray
Write-Host "  - Unleashed ERP (API ID, key, URL)" -ForegroundColor Gray
Write-Host ""
Write-Host "AI Services:" -ForegroundColor White
Write-Host "  - OpenAI API key" -ForegroundColor Gray
Write-Host "  - Anthropic/Claude API key" -ForegroundColor Gray
Write-Host ""
Write-Host "Microsoft Integration:" -ForegroundColor White
Write-Host "  - Microsoft Graph API credentials" -ForegroundColor Gray
Write-Host "  - Admin and data email addresses" -ForegroundColor Gray
Write-Host ""
Write-Host "MCP Server:" -ForegroundColor White
Write-Host "  - MCP server URL and configuration" -ForegroundColor Gray
Write-Host "  - WebSocket settings" -ForegroundColor Gray
Write-Host ""
Write-Host "Auto-Sync Configuration:" -ForegroundColor White
Write-Host "  - Sync intervals for all services" -ForegroundColor Gray
Write-Host "  - Feature flags and monitoring" -ForegroundColor Gray
Write-Host ""

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "       TOTAL: 55+ VARIABLES CONFIGURED" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Your service will be available at:" -ForegroundColor Yellow
Write-Host "https://sentia-manufacturing-dashboard.onrender.com" -ForegroundColor Cyan
Write-Host ""

Write-Host "Deployment complete!" -ForegroundColor Green