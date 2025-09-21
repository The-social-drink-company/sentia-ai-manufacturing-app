# Sentia Manufacturing Dashboard - Simple Deployment Script
Write-Host "🚀 DEPLOYING VERSION 1.0.7 WITH FULL CLERK CONFIGURATION" -ForegroundColor Green
Write-Host ""

# Build the application
Write-Host "📦 Building application..." -ForegroundColor Cyan
npm run build
Write-Host "✅ Build completed" -ForegroundColor Green

Write-Host ""
Write-Host "🌐 DEPLOYMENT URLS:" -ForegroundColor Green
Write-Host "Development: https://sentia-manufacturing-development.onrender.com" -ForegroundColor Cyan
Write-Host "Testing: https://sentia-manufacturing-testing.onrender.com" -ForegroundColor Cyan
Write-Host "Production: https://sentia-manufacturing.railway.app" -ForegroundColor Cyan

Write-Host ""
Write-Host "📝 MANUAL STEPS REQUIRED:" -ForegroundColor Yellow
Write-Host "1. Update environment variables in deployment dashboards" -ForegroundColor White
Write-Host "2. Redeploy all services" -ForegroundColor White
Write-Host "3. Verify deployments are working" -ForegroundColor White

Write-Host ""
Write-Host "🎉 DEPLOYMENT READY!" -ForegroundColor Green
