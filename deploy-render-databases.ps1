# Render Database Deployment Script
# Deploys all three PostgreSQL databases to Render

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RENDER DATABASE DEPLOYMENT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Render CLI is installed
$renderCLI = Get-Command render -ErrorAction SilentlyContinue
if (-not $renderCLI) {
    Write-Host "Render CLI not found. Installing..." -ForegroundColor Yellow
    Write-Host "Please install Render CLI from: https://render.com/docs/cli" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Or deploy via Render Dashboard:" -ForegroundColor Green
    Write-Host "1. Go to https://dashboard.render.com" -ForegroundColor Green
    Write-Host "2. Click 'New +' -> 'PostgreSQL'" -ForegroundColor Green
    Write-Host "3. Create each database as defined below" -ForegroundColor Green
    Write-Host ""
}

# Render API Key (you provided this earlier)
$env:RENDER_API_KEY = "rnd_mYUAytWRkb2Pj5GJROqNYubYt25J"

Write-Host "Creating PostgreSQL Databases on Render..." -ForegroundColor Green
Write-Host ""

# Database configurations
$databases = @(
    @{
        Name = "sentia-db-development"
        DatabaseName = "sentia_manufacturing_dev"
        User = "sentia_dev_user"
        Plan = "free"
        Region = "oregon"
        Description = "Development database for CapLiquify Platform"
    },
    @{
        Name = "sentia-db-testing"
        DatabaseName = "sentia_manufacturing_test"
        User = "sentia_test_user"
        Plan = "free"
        Region = "oregon"
        Description = "Testing/UAT database for CapLiquify Platform"
    },
    @{
        Name = "sentia-db-production"
        DatabaseName = "sentia_manufacturing_prod"
        User = "sentia_prod_user"
        Plan = "starter"
        Region = "oregon"
        Description = "Production database with daily backups"
    }
)

# Create databases using Render API
foreach ($db in $databases) {
    Write-Host "----------------------------------------" -ForegroundColor Gray
    Write-Host "Creating: $($db.Name)" -ForegroundColor Yellow
    Write-Host "Plan: $($db.Plan)" -ForegroundColor Gray
    Write-Host "Region: $($db.Region)" -ForegroundColor Gray
    Write-Host ""

    $body = @{
        type = "postgres"
        name = $db.Name
        plan = $db.Plan
        region = $db.Region
        databaseName = $db.DatabaseName
        databaseUser = $db.User
        ipAllowList = @()  # Allow all IPs initially
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod `
            -Uri "https://api.render.com/v1/services" `
            -Method POST `
            -Headers @{
                "Authorization" = "Bearer $env:RENDER_API_KEY"
                "Content-Type" = "application/json"
            } `
            -Body $body

        Write-Host "✓ Database created successfully!" -ForegroundColor Green
        Write-Host "  ID: $($response.service.id)" -ForegroundColor Gray
        Write-Host "  Status: $($response.service.status)" -ForegroundColor Gray
        Write-Host ""
    }
    catch {
        Write-Host "✗ Failed to create database" -ForegroundColor Red
        Write-Host "  Error: $_" -ForegroundColor Red
        Write-Host ""
        Write-Host "Manual creation required in Render Dashboard" -ForegroundColor Yellow
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DATABASE DEPLOYMENT SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Expected databases:" -ForegroundColor Green
Write-Host "1. sentia-db-development (free)" -ForegroundColor White
Write-Host "2. sentia-db-testing (free)" -ForegroundColor White
Write-Host "3. sentia-db-production (starter - $7/month)" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Verify databases in Render Dashboard" -ForegroundColor White
Write-Host "2. Wait for databases to be available (2-3 minutes)" -ForegroundColor White
Write-Host "3. Deploy web services using render.yaml" -ForegroundColor White
Write-Host "4. Services will auto-connect to databases" -ForegroundColor White
Write-Host ""
Write-Host "Dashboard: https://dashboard.render.com/services" -ForegroundColor Cyan
