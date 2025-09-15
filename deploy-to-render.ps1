# Render Deployment Script
# This script guides you through deploying to Render

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "   RENDER DEPLOYMENT AUTOMATION" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Cyan

# Step 1: Open Render Dashboard
Write-Host "`n[STEP 1] Opening Render Dashboard..." -ForegroundColor Green
Start-Process "https://dashboard.render.com/select-repo?type=blueprint"

Write-Host "Please follow these steps in your browser:" -ForegroundColor Yellow
Write-Host "1. Select repository: The-social-drink-company/sentia-manufacturing-dashboard" -ForegroundColor White
Write-Host "2. Click 'Connect'" -ForegroundColor White
Write-Host "3. Review services (3 web services with Standard plan)" -ForegroundColor White
Write-Host "4. Click 'Apply' to create all services" -ForegroundColor White

Write-Host "`nPress Enter when you've clicked 'Apply'..." -ForegroundColor Cyan
Read-Host

# Step 2: Wait for services to be created
Write-Host "`n[STEP 2] Waiting for services to be created..." -ForegroundColor Green
Write-Host "This usually takes 1-2 minutes." -ForegroundColor Gray
Write-Host "Press Enter when services are created..." -ForegroundColor Cyan
Read-Host

# Step 3: Copy environment variables to clipboard for each service
Write-Host "`n[STEP 3] Setting up environment variables..." -ForegroundColor Green

$services = @(
    @{Name="Development"; File="render-env-development.txt"; URL="https://dashboard.render.com/web/srv-*/env"},
    @{Name="Testing"; File="render-env-testing.txt"; URL="https://dashboard.render.com/web/srv-*/env"},
    @{Name="Production"; File="render-env-production.txt"; URL="https://dashboard.render.com/web/srv-*/env"},
    @{Name="MCP Server"; File="render-env-mcp.txt"; URL="https://dashboard.render.com/background/srv-*/env"}
)

foreach ($service in $services) {
    Write-Host "`n----- $($service.Name) Service -----" -ForegroundColor Yellow

    # Read and copy env vars to clipboard
    $envContent = Get-Content $service.File -Raw
    $envContent | Set-Clipboard

    Write-Host "Environment variables for $($service.Name) copied to clipboard!" -ForegroundColor Green
    Write-Host "1. Go to your $($service.Name) service in Render Dashboard" -ForegroundColor White
    Write-Host "2. Click 'Environment' tab" -ForegroundColor White
    Write-Host "3. Click 'Bulk Edit'" -ForegroundColor White
    Write-Host "4. Press Ctrl+V to paste" -ForegroundColor White
    Write-Host "5. Click 'Save Changes'" -ForegroundColor White

    Write-Host "`nPress Enter when done with $($service.Name)..." -ForegroundColor Cyan
    Read-Host
}

# Step 4: Monitor deployment
Write-Host "`n[STEP 4] Monitoring deployment..." -ForegroundColor Green
Write-Host "Services will auto-deploy after adding environment variables." -ForegroundColor Gray
Write-Host "This takes 10-15 minutes for first deployment." -ForegroundColor Gray

Write-Host "`nWould you like to open the services to monitor? (Y/N)" -ForegroundColor Cyan
$monitor = Read-Host
if ($monitor -eq "Y" -or $monitor -eq "y") {
    Start-Process "https://dashboard.render.com"
}

# Step 5: Wait for deployment
Write-Host "`n[STEP 5] Waiting for deployment to complete..." -ForegroundColor Green
Write-Host "Check each service for 'Live' status." -ForegroundColor Gray
Write-Host "Press Enter when all services show 'Live'..." -ForegroundColor Cyan
Read-Host

# Step 6: Verify deployment
Write-Host "`n[STEP 6] Verifying deployment..." -ForegroundColor Green

# Run verification script
if (Test-Path ".\verify-render-deployment.ps1") {
    Write-Host "Running verification script..." -ForegroundColor Gray
    & .\verify-render-deployment.ps1
} else {
    Write-Host "Manual verification - checking endpoints..." -ForegroundColor Yellow

    $urls = @(
        "https://sentia-manufacturing-development.onrender.com",
        "https://sentia-manufacturing-testing.onrender.com",
        "https://sentia-manufacturing-production.onrender.com"
    )

    foreach ($url in $urls) {
        Write-Host "`nTesting: $url" -ForegroundColor Gray
        try {
            $response = Invoke-WebRequest -Uri "$url/api/health" -UseBasicParsing -TimeoutSec 10
            if ($response.StatusCode -eq 200) {
                Write-Host "  [OK] $url is live!" -ForegroundColor Green
            }
        } catch {
            Write-Host "  [PENDING] $url not ready yet" -ForegroundColor Yellow
        }
    }
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