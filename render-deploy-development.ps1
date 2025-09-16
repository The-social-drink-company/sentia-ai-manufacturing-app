# Render Deployment Script for Sentia Manufacturing Development
# This script deploys the application to sentia-manufacturing-development.onrender.com

$RENDER_API_KEY = "rnd_mYUAytWRkb2Pj5GJROqNYubYt25J"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Render Development Deployment Script" -ForegroundColor Cyan
Write-Host "Target: sentia-manufacturing-development.onrender.com" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

# Step 1: Push to GitHub
Write-Host "`n[1/4] Pushing code to GitHub development branch..." -ForegroundColor Yellow
git push origin development

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to push to GitHub. Please resolve any conflicts and try again." -ForegroundColor Red
    exit 1
}

Write-Host "Code pushed successfully!" -ForegroundColor Green

# Step 2: Deploy using render.yaml
Write-Host "`n[2/4] Deploying to Render using render.yaml..." -ForegroundColor Yellow

# Create the service if it doesn't exist, or update if it does
$headers = @{
    "Authorization" = "Bearer $RENDER_API_KEY"
    "Accept" = "application/json"
    "Content-Type" = "application/json"
}

# Check if service exists
Write-Host "Checking if service exists..." -ForegroundColor Cyan
$services = Invoke-RestMethod -Uri "https://api.render.com/v1/services?limit=20" -Headers $headers -Method Get

$serviceExists = $false
$serviceId = ""

foreach ($service in $services) {
    if ($service.name -eq "sentia-manufacturing-development") {
        $serviceExists = $true
        $serviceId = $service.id
        Write-Host "Service found with ID: $serviceId" -ForegroundColor Green
        break
    }
}

if (-not $serviceExists) {
    Write-Host "Service doesn't exist. Creating new service..." -ForegroundColor Yellow

    # Create service from render.yaml
    # This requires connecting your GitHub repo first through Render Dashboard
    Write-Host @"

IMPORTANT: First-time deployment requires manual setup:

1. Go to https://dashboard.render.com
2. Click "New +" -> "Web Service"
3. Connect your GitHub repository: The-social-drink-company/sentia-manufacturing-dashboard
4. Select the 'development' branch
5. Use these settings:
   - Name: sentia-manufacturing-development
   - Environment: Node
   - Build Command: npm ci --legacy-peer-deps && npm run build
   - Start Command: node server.js
   - Auto-Deploy: Yes (for development branch)
6. Click "Advanced" and add environment variables from render-vars-DEVELOPMENT.txt

Once created, run this script again to trigger deployments.
"@ -ForegroundColor Cyan

} else {
    Write-Host "Service exists. Triggering manual deployment..." -ForegroundColor Yellow

    # Trigger a manual deployment
    $deployBody = @{
        "clearCache" = "do_not_clear"
    } | ConvertTo-Json

    try {
        $deploy = Invoke-RestMethod -Uri "https://api.render.com/v1/services/$serviceId/deploys" -Headers $headers -Method Post -Body $deployBody
        Write-Host "Deployment triggered successfully!" -ForegroundColor Green
        Write-Host "Deploy ID: $($deploy.id)" -ForegroundColor Cyan
        Write-Host "Deploy URL: https://dashboard.render.com/web/$serviceId/deploys/$($deploy.id)" -ForegroundColor Cyan
    } catch {
        Write-Host "Error triggering deployment: $_" -ForegroundColor Red
    }
}

# Step 3: Monitor deployment
Write-Host "`n[3/4] Monitoring deployment status..." -ForegroundColor Yellow
Write-Host "You can monitor the deployment at: https://dashboard.render.com" -ForegroundColor Cyan

# Step 4: Verify deployment
Write-Host "`n[4/4] Deployment information:" -ForegroundColor Yellow
Write-Host "Development URL: https://sentia-manufacturing-development.onrender.com" -ForegroundColor Green
Write-Host "Health Check: https://sentia-manufacturing-development.onrender.com/health" -ForegroundColor Green
Write-Host "API Endpoint: https://sentia-manufacturing-development.onrender.com/api" -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Deployment script completed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan