# RENDER FULL DEPLOYMENT SCRIPT - ALL THREE ENVIRONMENTS
# This script ensures complete deployment of Development, Testing, and Production

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   RENDER COMPLETE DEPLOYMENT - ALL BRANCHES" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan

# Step 1: Ensure render.yaml is in all branches
Write-Host "`n[STEP 1] Pushing render.yaml to all branches..." -ForegroundColor Green

# Save current branch
$currentBranch = git branch --show-current
Write-Host "Current branch: $currentBranch" -ForegroundColor Gray

# Update development branch
Write-Host "`nUpdating development branch..." -ForegroundColor Yellow
git add render.yaml render-env-*.txt
git commit -m "feat: Complete Render deployment configuration for all environments" 2>$null
git push origin development

# Update test branch
Write-Host "`nUpdating test branch..." -ForegroundColor Yellow
git checkout test
git pull origin test
git merge development --no-edit
git push origin test

# Update production branch
Write-Host "`nUpdating production branch..." -ForegroundColor Yellow
git checkout production
git pull origin production
git merge test --no-edit
git push origin production

# Return to original branch
git checkout $currentBranch

Write-Host "`n[STEP 2] Opening Render Dashboard for deployment..." -ForegroundColor Green
Write-Host "Please ensure you're logged into Render" -ForegroundColor Yellow

# Open Render Dashboard
Start-Process "https://dashboard.render.com"

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "   MANUAL STEPS REQUIRED IN RENDER DASHBOARD" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan

Write-Host "`nIf services already exist, we need to update them:" -ForegroundColor Green

Write-Host "`n1. FOR EACH SERVICE (Development, Testing, Production):" -ForegroundColor Yellow
Write-Host "   a. Click on the service name" -ForegroundColor White
Write-Host "   b. Go to 'Settings' tab" -ForegroundColor White
Write-Host "   c. Scroll to 'Build & Deploy' section" -ForegroundColor White
Write-Host "   d. Click 'Clear build cache & deploy'" -ForegroundColor White
Write-Host "   e. Wait for deployment to complete" -ForegroundColor White

Write-Host "`n2. IF SERVICES DON'T EXIST YET:" -ForegroundColor Yellow
Write-Host "   a. Click 'New +' -> 'Blueprint'" -ForegroundColor White
Write-Host "   b. Select repository: The-social-drink-company/sentia-manufacturing-dashboard" -ForegroundColor White
Write-Host "   c. Click 'Connect' and 'Apply'" -ForegroundColor White

Write-Host "`nPress Enter when ready to set environment variables..." -ForegroundColor Cyan
Read-Host

Write-Host "`n[STEP 3] Setting Environment Variables..." -ForegroundColor Green

# Function to copy env vars to clipboard
function Set-EnvVars {
    param($ServiceName, $EnvFile)

    Write-Host "`n----- $ServiceName -----" -ForegroundColor Yellow

    if (Test-Path $EnvFile) {
        $content = Get-Content $EnvFile -Raw
        $content | Set-Clipboard

        Write-Host "Environment variables copied to clipboard!" -ForegroundColor Green
        Write-Host "1. Go to $ServiceName service in Render" -ForegroundColor White
        Write-Host "2. Click 'Environment' tab" -ForegroundColor White
        Write-Host "3. Click 'Bulk Edit'" -ForegroundColor White
        Write-Host "4. Clear existing content" -ForegroundColor White
        Write-Host "5. Press Ctrl+V to paste" -ForegroundColor White
        Write-Host "6. Click 'Save Changes'" -ForegroundColor White
        Write-Host "`nPress Enter when done..." -ForegroundColor Cyan
        Read-Host
    } else {
        Write-Host "Warning: $EnvFile not found!" -ForegroundColor Red
    }
}

# Set environment variables for each service
Set-EnvVars "Development (sentia-manufacturing-development)" "render-env-development.txt"
Set-EnvVars "Testing (sentia-manufacturing-testing)" "render-env-testing.txt"
Set-EnvVars "Production (sentia-manufacturing-production)" "render-env-production.txt"
Set-EnvVars "MCP Server (sentia-mcp-server)" "render-env-mcp.txt"

Write-Host "`n[STEP 4] Triggering Manual Deployments..." -ForegroundColor Green
Write-Host "For each service that's not deploying:" -ForegroundColor Yellow
Write-Host "1. Click on the service" -ForegroundColor White
Write-Host "2. Click 'Manual Deploy' button" -ForegroundColor White
Write-Host "3. Select 'Clear build cache & deploy'" -ForegroundColor White

Write-Host "`nPress Enter when all deployments are triggered..." -ForegroundColor Cyan
Read-Host

Write-Host "`n[STEP 5] Monitoring Deployments..." -ForegroundColor Green
Write-Host "Deployments typically take 10-15 minutes for first deploy" -ForegroundColor Gray
Write-Host "Watch the logs for each service to ensure successful deployment" -ForegroundColor Gray

Write-Host "`nWould you like to wait and verify? (Y/N)" -ForegroundColor Cyan
$wait = Read-Host

if ($wait -eq "Y" -or $wait -eq "y") {
    Write-Host "`nWaiting 5 minutes before first check..." -ForegroundColor Yellow
    Start-Sleep -Seconds 300

    Write-Host "`nRunning verification..." -ForegroundColor Green
    & .\verify-render-deployment.ps1

    Write-Host "`nIf any services failed, check:" -ForegroundColor Yellow
    Write-Host "1. Service logs in Render Dashboard" -ForegroundColor White
    Write-Host "2. Environment variables are correctly set" -ForegroundColor White
    Write-Host "3. DATABASE_URL is valid" -ForegroundColor White
}

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "         DEPLOYMENT PROCESS COMPLETE" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan

Write-Host "`nYour Render services:" -ForegroundColor Yellow
Write-Host "Development: https://sentia-manufacturing-development.onrender.com" -ForegroundColor White
Write-Host "Testing: https://sentia-manufacturing-testing.onrender.com" -ForegroundColor White
Write-Host "Production: https://sentia-manufacturing-production.onrender.com" -ForegroundColor White

Write-Host "`nRun verification anytime with:" -ForegroundColor Gray
Write-Host ".\verify-render-deployment.ps1" -ForegroundColor White