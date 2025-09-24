# Render API Deployment Script
# Since Render CLI isn't available, we'll use their Dashboard

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   RENDER DEPLOYMENT VIA DASHBOARD" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan

Write-Host "`nSince Render doesn't have a CLI for Windows, we'll use the Dashboard." -ForegroundColor Gray
Write-Host "Opening Render Dashboard now..." -ForegroundColor Green

# Open Render Dashboard
Start-Process "https://dashboard.render.com"

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "   STEP-BY-STEP DEPLOYMENT GUIDE" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan

Write-Host "`n[STEP 1] Check if services exist" -ForegroundColor Green
Write-Host "Look for these services in your dashboard:" -ForegroundColor White
Write-Host "  - sentia-manufacturing-development" -ForegroundColor Gray
Write-Host "  - sentia-manufacturing-testing" -ForegroundColor Gray
Write-Host "  - sentia-manufacturing-production" -ForegroundColor Gray

Write-Host "`nDo you see these services? (Y/N)" -ForegroundColor Cyan
$servicesExist = Read-Host

if ($servicesExist -eq "N" -or $servicesExist -eq "n") {
    Write-Host "`n[CREATING SERVICES] Follow these steps:" -ForegroundColor Yellow
    Write-Host "1. Click 'New +' button" -ForegroundColor White
    Write-Host "2. Select 'Blueprint'" -ForegroundColor White
    Write-Host "3. Choose repository: The-social-drink-company/sentia-manufacturing-dashboard" -ForegroundColor White
    Write-Host "4. Click 'Connect'" -ForegroundColor White
    Write-Host "5. Click 'Apply'" -ForegroundColor White
    Write-Host "`nThis will create all services from render.yaml" -ForegroundColor Green
    Write-Host "Press Enter when services are created..." -ForegroundColor Cyan
    Read-Host
}

Write-Host "`n[STEP 2] Add Environment Variables" -ForegroundColor Green
Write-Host "For EACH service, you need to add environment variables." -ForegroundColor Yellow

$services = @("development", "testing", "production")

foreach ($service in $services) {
    Write-Host "`n----- Setting up $service -----" -ForegroundColor Yellow

    # Open the specific service
    $serviceUrl = "https://dashboard.render.com/web/srv-*" # You'll need to find the actual service ID
    Write-Host "1. Click on 'sentia-manufacturing-$service' service" -ForegroundColor White
    Write-Host "2. Click 'Environment' tab" -ForegroundColor White
    Write-Host "3. Add these MINIMUM variables:" -ForegroundColor White
    Write-Host ""
    Write-Host "   NODE_ENV = $service" -ForegroundColor Cyan
    Write-Host "   PORT = 5000" -ForegroundColor Cyan

    if ($service -eq "development") {
        Write-Host "   DATABASE_URL = postgresql://neondb_owner:npg_2wXVD9gdintm@ep-aged-dust-abpyip0r-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require" -ForegroundColor Cyan
    } elseif ($service -eq "testing") {
        Write-Host "   DATABASE_URL = postgresql://neondb_owner:npg_2wXVD9gdintm@ep-shiny-dream-ab2zho2p-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require" -ForegroundColor Cyan
    } else {
        Write-Host "   DATABASE_URL = postgresql://neondb_owner:npg_2wXVD9gdintm@ep-broad-resonance-ablmx6yo-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require" -ForegroundColor Cyan
    }

    Write-Host "   CLERK_SECRET_KEY = sk_test_EP6iF7prGbq73CscUPCOW8PAKol4pPaBG5iYdsDodq" -ForegroundColor Cyan
    Write-Host "   VITE_CLERK_PUBLISHABLE_KEY = pk_test_Y2hhbXBpb24tYnVsbGRvZy05Mi5jbGVyay5hY2NvdW50cy5kZXYk" -ForegroundColor Cyan
    Write-Host "   JWT_SECRET = jwt_secret_$service" -ForegroundColor Cyan
    Write-Host "   SESSION_SECRET = session_secret_$service" -ForegroundColor Cyan
    Write-Host "   CORS_ORIGINS = https://sentia-manufacturing-$service.onrender.com" -ForegroundColor Cyan

    Write-Host "`n4. Click 'Save' after adding each variable" -ForegroundColor White
    Write-Host "5. Service will auto-redeploy" -ForegroundColor White

    Write-Host "`nPress Enter when done with $service..." -ForegroundColor Yellow
    Read-Host
}

Write-Host "`n[STEP 3] Trigger Manual Deploy if needed" -ForegroundColor Green
Write-Host "If services aren't deploying:" -ForegroundColor Yellow
Write-Host "1. Go to each service" -ForegroundColor White
Write-Host "2. Click 'Manual Deploy' button" -ForegroundColor White
Write-Host "3. Select 'Clear build cache & deploy'" -ForegroundColor White

Write-Host "`nPress Enter when all services are deploying..." -ForegroundColor Cyan
Read-Host

Write-Host "`n[STEP 4] Monitor Deployment" -ForegroundColor Green
Write-Host "Services will take 10-15 minutes to deploy" -ForegroundColor Yellow
Write-Host "Check the 'Logs' tab for each service to see progress" -ForegroundColor White

Write-Host "`nWait for all services to show 'Live' status" -ForegroundColor Gray
Write-Host "Press Enter when ready to verify..." -ForegroundColor Cyan
Read-Host

Write-Host "`n[STEP 5] Verify Deployment" -ForegroundColor Green
& .\verify-render-deployment.ps1

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "   DEPLOYMENT COMPLETE" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan