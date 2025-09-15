# Deploy to Railway Script
# Deploys the Sentia Manufacturing Dashboard to Railway

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("development", "testing", "production")]
    [string]$Environment
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deploying to Railway - $Environment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Switch to the correct environment
Write-Host "Switching to $Environment environment..." -ForegroundColor Yellow
railway environment $Environment

# Deploy the application
Write-Host "Deploying application..." -ForegroundColor Yellow
railway up --detach

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment initiated for $Environment" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Check deployment status at: https://railway.app" -ForegroundColor Cyan