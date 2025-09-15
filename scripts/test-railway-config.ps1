# Test Railway Configuration Script
# Verifies that all environments are properly configured

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Railway Configuration Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test each environment
$environments = @("development", "testing", "production")
$results = @{}

foreach ($env in $environments) {
    Write-Host "Testing $env environment..." -ForegroundColor Yellow

    # Switch to environment
    railway environment $env 2>&1 | Out-Null

    # Check if we can get variables (this confirms they're set)
    $varCount = (railway variables 2>&1 | Measure-Object -Line).Lines

    if ($varCount -gt 0) {
        Write-Host "  [OK] Variables configured: $varCount variables found" -ForegroundColor Green
        $results[$env] = "OK"
    } else {
        Write-Host "  [FAIL] No variables found or service not linked" -ForegroundColor Red
        $results[$env] = "FAILED"
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Results Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

foreach ($env in $environments) {
    $status = $results[$env]
    $color = if ($status -eq "OK") { "Green" } else { "Red" }
    Write-Host "$env : $status" -ForegroundColor $color
}

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Check Railway Dashboard: https://railway.app/project/6d1ca9b2-75e2-46c6-86a8-ed05161112fe" -ForegroundColor White
Write-Host "2. Create services if needed" -ForegroundColor White
Write-Host "3. Link services to GitHub branches" -ForegroundColor White
Write-Host "4. Monitor deployment progress" -ForegroundColor White