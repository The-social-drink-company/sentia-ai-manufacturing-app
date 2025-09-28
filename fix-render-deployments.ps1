# FIX RENDER DEPLOYMENT ISSUES
# This script helps fix common Render deployment problems

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "    RENDER DEPLOYMENT TROUBLESHOOTING" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan

# Check current status
Write-Host "`n[CHECKING] Current deployment status..." -ForegroundColor Green
$testResults = @{}

# Test each environment
$environments = @(
    @{Name="Development"; URL="https://sentia-manufacturing-development.onrender.com"},
    @{Name="Testing"; URL="https://sentia-manufacturing-testing.onrender.com"},
    @{Name="Production"; URL="https://sentia-manufacturing-production.onrender.com"}
)

foreach ($env in $environments) {
    Write-Host "`nTesting $($env.Name)..." -ForegroundColor Gray
    try {
        $response = Invoke-WebRequest -Uri "$($env.URL)/api/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        Write-Host "  [OK] $($env.Name) is working!" -ForegroundColor Green
        $testResults[$env.Name] = "OK"
    } catch {
        Write-Host "  [FAIL] $($env.Name) is not responding" -ForegroundColor Red
        $testResults[$env.Name] = "FAIL"
    }
}

# Identify problems
$failedEnvironments = @()
foreach ($key in $testResults.Keys) {
    if ($testResults[$key] -eq "FAIL") {
        $failedEnvironments += $key
    }
}

if ($failedEnvironments.Count -eq 0) {
    Write-Host "`n================================================" -ForegroundColor Green
    Write-Host "  ALL ENVIRONMENTS ARE WORKING!" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Green
    exit
}

Write-Host "`n================================================" -ForegroundColor Yellow
Write-Host "  FIXING FAILED ENVIRONMENTS" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Yellow

Write-Host "`nFailed environments: $($failedEnvironments -join ', ')" -ForegroundColor Red

Write-Host "`n[FIX 1] Ensure Environment Variables Are Set" -ForegroundColor Green

foreach ($env in $failedEnvironments) {
    $envFile = "render-env-$($env.ToLower()).txt"

    Write-Host "`n----- Fixing $env -----" -ForegroundColor Yellow

    if (Test-Path $envFile) {
        $content = Get-Content $envFile -Raw
        $content | Set-Clipboard

        Write-Host "Environment variables for $env copied to clipboard!" -ForegroundColor Green
        Write-Host "`nGo to Render Dashboard:" -ForegroundColor White
        Write-Host "1. Click on 'sentia-manufacturing-$($env.ToLower())' service" -ForegroundColor Gray
        Write-Host "2. Go to 'Environment' tab" -ForegroundColor Gray
        Write-Host "3. Click 'Bulk Edit'" -ForegroundColor Gray
        Write-Host "4. Select all (Ctrl+A) and delete existing content" -ForegroundColor Gray
        Write-Host "5. Paste (Ctrl+V) the new variables" -ForegroundColor Gray
        Write-Host "6. Click 'Save Changes'" -ForegroundColor Gray
        Write-Host "7. Service will auto-redeploy" -ForegroundColor Gray

        Write-Host "`nPress Enter when done with $env..." -ForegroundColor Cyan
        Read-Host
    }
}

Write-Host "`n[FIX 2] Clear Build Cache and Redeploy" -ForegroundColor Green
Write-Host "For each failed service:" -ForegroundColor Yellow
Write-Host "1. Go to the service in Render Dashboard" -ForegroundColor White
Write-Host "2. Click 'Settings' tab" -ForegroundColor White
Write-Host "3. Scroll to 'Build & Deploy' section" -ForegroundColor White
Write-Host "4. Click 'Clear build cache & deploy'" -ForegroundColor White

Write-Host "`nPress Enter when redeployments are triggered..." -ForegroundColor Cyan
Read-Host

Write-Host "`n[FIX 3] Check Service Logs" -ForegroundColor Green
Write-Host "While services are deploying, check logs for errors:" -ForegroundColor Yellow
Write-Host "1. Click on the service" -ForegroundColor White
Write-Host "2. Go to 'Logs' tab" -ForegroundColor White
Write-Host "3. Look for error messages" -ForegroundColor White

Write-Host "`nCommon errors and fixes:" -ForegroundColor Yellow
Write-Host "- 'Cannot find module': Build failed - clear cache and redeploy" -ForegroundColor Gray
Write-Host "- 'ECONNREFUSED': Database connection issue - check DATABASE_URL" -ForegroundColor Gray
Write-Host "- 'Missing environment variable': Add the missing variable" -ForegroundColor Gray
Write-Host "- 'Port already in use': Change PORT variable to 5000" -ForegroundColor Gray

Write-Host "`nWould you like to wait 5 minutes and verify again? (Y/N)" -ForegroundColor Cyan
$verify = Read-Host

if ($verify -eq "Y" -or $verify -eq "y") {
    Write-Host "`nWaiting 5 minutes for deployments..." -ForegroundColor Yellow
    Start-Sleep -Seconds 300

    Write-Host "`nVerifying deployments..." -ForegroundColor Green
    & .\verify-render-deployment.ps1
}

Write-Host "`n[FIX 4] If Still Failing - Manual Service Creation" -ForegroundColor Green
Write-Host "If a service won't deploy, try creating it manually:" -ForegroundColor Yellow
Write-Host "1. Delete the failing service in Render" -ForegroundColor White
Write-Host "2. Click 'New +' -> 'Web Service'" -ForegroundColor White
Write-Host "3. Connect your repository" -ForegroundColor White
Write-Host "4. Configure:" -ForegroundColor White
Write-Host "   - Name: sentia-manufacturing-[environment]" -ForegroundColor Gray
Write-Host "   - Branch: [development/test/production]" -ForegroundColor Gray
Write-Host "   - Build Command: npm install && npm run build" -ForegroundColor Gray
Write-Host "   - Start Command: npm start" -ForegroundColor Gray
Write-Host "   - Plan: Standard ($25/month)" -ForegroundColor Gray
Write-Host "5. Add environment variables from the txt file" -ForegroundColor White
Write-Host "6. Deploy" -ForegroundColor White

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "         TROUBLESHOOTING COMPLETE" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan