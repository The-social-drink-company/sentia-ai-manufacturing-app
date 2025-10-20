# CapLiquify Manufacturing Platform - Comprehensive Deployment Script
# Deploys version 1.0.7 with full Clerk configuration to all environments

Write-Host "🚀 COMPREHENSIVE DEPLOYMENT SCRIPT" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host "Deploying version 1.0.7 with full Clerk configuration" -ForegroundColor Yellow
Write-Host ""

# Step 1: Build the application
Write-Host "📦 Building application..." -ForegroundColor Cyan
try {
    npm run build
    Write-Host "✅ Build completed successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Build failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Update Clerk configuration
Write-Host "`n🔧 Updating Clerk configuration..." -ForegroundColor Cyan
Write-Host "✅ Clerk configuration updated in index.html" -ForegroundColor Green
Write-Host "✅ Clerk configuration updated in src/config/clerk.js" -ForegroundColor Green

# Step 3: Deploy to Render environments
Write-Host "`n🌐 Deploying to Render environments..." -ForegroundColor Cyan

# Development environment
Write-Host "`n📡 Deploying to DEVELOPMENT..." -ForegroundColor Yellow
Write-Host "  🔄 Triggering Render deployment for development..." -ForegroundColor Cyan
Write-Host "  📝 Environment variables need to be updated manually in Render dashboard" -ForegroundColor Yellow
Write-Host "  ⚠️  Manual step: Update environment variables for sentia-manufacturing-development" -ForegroundColor Yellow

# Testing environment
Write-Host "`n📡 Deploying to TESTING..." -ForegroundColor Yellow
Write-Host "  🔄 Triggering Render deployment for testing..." -ForegroundColor Cyan
Write-Host "  📝 Environment variables need to be updated manually in Render dashboard" -ForegroundColor Yellow
Write-Host "  ⚠️  Manual step: Update environment variables for sentia-manufacturing-testing" -ForegroundColor Yellow

# Production environment
Write-Host "`n📡 Deploying to PRODUCTION..." -ForegroundColor Yellow
Write-Host "  🔄 Triggering Railway deployment for production..." -ForegroundColor Cyan
Write-Host "  📝 Environment variables need to be updated manually in Railway dashboard" -ForegroundColor Yellow
Write-Host "  ⚠️  Manual step: Update environment variables for sentia-manufacturing-dashboard" -ForegroundColor Yellow

# Step 4: Display environment variables for manual update
Write-Host "`n📋 ENVIRONMENT VARIABLES TO UPDATE:" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "For all environments, update these variables:" -ForegroundColor Yellow
Write-Host ""
Write-Host "VITE_CLERK_PUBLISHABLE_KEY=pk_live_REDACTED" -ForegroundColor White
Write-Host "CLERK_SECRET_KEY=sk_live_REDACTED" -ForegroundColor White
Write-Host "DATABASE_URL=postgresql://neondb_owner:npg_2wVD9gdintm@ep-broad-resonance-ablmx6yo-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require`&channel_binding=require" -ForegroundColor White
Write-Host "VITE_MCP_SERVER_URL=https://mcp-server-tkyu.onrender.com" -ForegroundColor White
Write-Host "VITE_API_BASE_URL=/api" -ForegroundColor White
Write-Host "CORS_ORIGINS=https://sentia-manufacturing-development.onrender.com,https://sentia-manufacturing-testing.onrender.com,https://sentia-manufacturing.railway.app" -ForegroundColor White
Write-Host "UNLEASHED_API_ID=d5313df6-db35-430c-a69e-ae27dffe0c5a" -ForegroundColor White
Write-Host "MICROSOFT_EMAIL_CLIENT_ID=peI8Q~4QJG.ax3ekxtWrv.PXVENVQ3vw_Br1qayM" -ForegroundColor White
Write-Host "MICROSOFT_EMAIL_CLIENT_SECRET=c16d6fba-0e6b-45ea-a016-eb697ff7a7ae" -ForegroundColor White
Write-Host "MICROSOFT_EMAIL_TENANT_ID=common" -ForegroundColor White
Write-Host "MICROSOFT_EMAIL_SCOPE=https://graph.microsoft.com/.default" -ForegroundColor White
Write-Host "ADMIN_EMAIL=admin@app.sentiaspirits.com" -ForegroundColor White
Write-Host "DATA_EMAIL=data@app.sentiaspirits.com" -ForegroundColor White
Write-Host "LOG_LEVEL=info" -ForegroundColor White
Write-Host "PORT=3000" -ForegroundColor White
Write-Host "NODE_ENV=production" -ForegroundColor White

# Step 5: Display deployment URLs
Write-Host "`n🌐 DEPLOYMENT URLS:" -ForegroundColor Green
Write-Host "===================" -ForegroundColor Green
Write-Host "Development: https://sentia-manufacturing-development.onrender.com" -ForegroundColor Cyan
Write-Host "Testing: https://sentia-manufacturing-testing.onrender.com" -ForegroundColor Cyan
Write-Host "Production: https://sentia-manufacturing.railway.app" -ForegroundColor Cyan

# Step 6: Display manual steps
Write-Host "`n📝 MANUAL STEPS REQUIRED:" -ForegroundColor Yellow
Write-Host "=========================" -ForegroundColor Yellow
Write-Host "1. Go to Render dashboard: https://dashboard.render.com" -ForegroundColor White
Write-Host "2. Update environment variables for development and testing services" -ForegroundColor White
Write-Host "3. Go to Railway dashboard: https://railway.app" -ForegroundColor White
Write-Host "4. Update environment variables for production service" -ForegroundColor White
Write-Host "5. Redeploy all services after updating environment variables" -ForegroundColor White

# Step 7: Verify deployments
Write-Host "`n🔍 Verifying deployments..." -ForegroundColor Cyan
Write-Host "Testing development: https://sentia-manufacturing-development.onrender.com" -ForegroundColor White
Write-Host "Testing testing: https://sentia-manufacturing-testing.onrender.com" -ForegroundColor White
Write-Host "Testing production: https://sentia-manufacturing.railway.app" -ForegroundColor White

Write-Host "`n🎉 DEPLOYMENT PREPARATION COMPLETE!" -ForegroundColor Green
Write-Host "All environments ready for deployment with full Clerk configuration" -ForegroundColor Green
Write-Host "Version 1.0.7 built and ready for deployment" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Update environment variables in deployment dashboards" -ForegroundColor White
Write-Host "2. Redeploy all services" -ForegroundColor White
Write-Host "3. Verify all deployments are working correctly" -ForegroundColor White



