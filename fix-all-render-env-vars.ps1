# Complete Render Environment Variables Fix
# This script provides copy-paste curl commands to fix all critical issues

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "   RENDER ENVIRONMENT VARIABLES FIX" -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor Cyan

Write-Host "`n🎯 FIXING ALL DEPLOYMENT BLOCKERS:" -ForegroundColor Green
Write-Host "  1. Database P1001 connection error" -ForegroundColor White
Write-Host "  2. Missing Clerk authentication keys" -ForegroundColor White
Write-Host "  3. SSE misconfiguration (API base URL)" -ForegroundColor White
Write-Host "  4. MCP server connection endpoints" -ForegroundColor White

Write-Host "`n" + "="*60 -ForegroundColor White
Write-Host "  CRITICAL ENVIRONMENT VARIABLES TO ADD" -ForegroundColor Yellow
Write-Host "="*60 -ForegroundColor White

# Service IDs (from deploy hooks you provided)
$services = @{
    "development" = "srv-d3cjacvdiees7381l7n0"
    "testing" = "srv-d344tve3jp1c73fips7g"
    "production" = "srv-d344tve3jp1c73fips90"
}

foreach ($env in $services.Keys) {
    $serviceId = $services[$env]

    Write-Host "`n🔧 $($env.ToUpper()) ENVIRONMENT ($serviceId):" -ForegroundColor Green

    # Database URL (external hostname)
    switch ($env) {
        "development" {
            $dbUrl = "postgresql://sentia_dev:nZ4vtXienMAwxahr0GJByc2qXFIFSoYL@dpg-d344rkfdiees73a20c50-a.oregon-postgres.render.com/sentia_manufacturing_dev?sslmode=require"
            $apiBaseUrl = "https://sentia-manufacturing-development.onrender.com/api"
        }
        "testing" {
            $dbUrl = "postgresql://sentia_test:nZ4vtXienMAwxahr0GJByc2qXFIFSoYL@dpg-d344rkfdiees73a20c50-a.oregon-postgres.render.com/sentia_manufacturing_test?sslmode=require"
            $apiBaseUrl = "https://sentia-manufacturing-testing.onrender.com/api"
        }
        "production" {
            $dbUrl = "postgresql://sentia_prod:nZ4vtXienMAwxahr0GJByc2qXFIFSoYL@dpg-d344rkfdiees73a20c50-a.oregon-postgres.render.com/sentia_manufacturing_prod?sslmode=require"
            $apiBaseUrl = "https://sentia-manufacturing-production.onrender.com/api"
        }
    }

    Write-Host "`n  DATABASE_URL:" -ForegroundColor Cyan
    Write-Host "  $dbUrl" -ForegroundColor Yellow

    Write-Host "`n  VITE_API_BASE_URL:" -ForegroundColor Cyan
    Write-Host "  $apiBaseUrl" -ForegroundColor Yellow

    Write-Host "`n  CLERK KEYS:" -ForegroundColor Cyan
    Write-Host "  VITE_CLERK_PUBLISHABLE_KEY=pk_test_Y2hhbXBpb24tYnVsbGRvZy05Mi5jbGVyay5hY2NvdW50cy5kZXYk" -ForegroundColor Yellow
    Write-Host "  CLERK_SECRET_KEY=sk_test_EP6iF7prGbq73CscUPCOW8PAKol4pPaBG5iYdsDodq" -ForegroundColor Yellow

    Write-Host "`n  MCP SERVER:" -ForegroundColor Cyan
    Write-Host "  MCP_SERVER_URL=https://mcp-server-tkyu.onrender.com" -ForegroundColor Yellow
    Write-Host "  MCP_WEBSOCKET_URL=wss://mcp-server-tkyu.onrender.com" -ForegroundColor Yellow
    Write-Host "  VITE_MCP_SERVER_URL=https://mcp-server-tkyu.onrender.com" -ForegroundColor Yellow

    Write-Host "`n" + "-"*40 -ForegroundColor Gray
}

Write-Host "`n" + "="*60 -ForegroundColor White
Write-Host "  MANUAL UPDATE INSTRUCTIONS" -ForegroundColor Yellow
Write-Host "="*60 -ForegroundColor White

Write-Host "`n🔥 STEP 1: Go to Render Dashboard" -ForegroundColor Red
Write-Host "   https://dashboard.render.com" -ForegroundColor White

Write-Host "`n🔥 STEP 2: For EACH service, update these variables:" -ForegroundColor Red

$criticalVars = @(
    "DATABASE_URL",
    "VITE_API_BASE_URL",
    "VITE_CLERK_PUBLISHABLE_KEY",
    "CLERK_SECRET_KEY",
    "MCP_SERVER_URL",
    "VITE_MCP_SERVER_URL"
)

foreach ($var in $criticalVars) {
    Write-Host "   ✓ $var" -ForegroundColor Green
}

Write-Host "`n🔥 STEP 3: Save Changes (auto-redeploys)" -ForegroundColor Red
Write-Host "   Each service will redeploy automatically" -ForegroundColor White

Write-Host "`n🔥 STEP 4: Verify Success" -ForegroundColor Red
Write-Host "   Check logs for:" -ForegroundColor White
Write-Host "   ✓ 'Database: Connected'" -ForegroundColor Green
Write-Host "   ✓ 'Clerk: Initialized'" -ForegroundColor Green
Write-Host "   ✓ 'MCP Server: Connected'" -ForegroundColor Green
Write-Host "   ✓ Frontend loads without JSX errors" -ForegroundColor Green

Write-Host "`n===============================================" -ForegroundColor Cyan
Write-Host "   AFTER UPDATE: EXPECTED RESULTS" -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor Cyan

Write-Host "`n✅ Database P1001 Error: FIXED" -ForegroundColor Green
Write-Host "   - Prisma connects to external hostname" -ForegroundColor White
Write-Host "   - Server starts with 'Database: Connected'" -ForegroundColor White

Write-Host "`n✅ Clerk Authentication: FIXED" -ForegroundColor Green
Write-Host "   - App initializes without boot guard failure" -ForegroundColor White
Write-Host "   - Users can access dashboard" -ForegroundColor White

Write-Host "`n✅ SSE Real-time Updates: FIXED" -ForegroundColor Green
Write-Host "   - Client connects to correct API base URL" -ForegroundColor White
Write-Host "   - Live updates work in production" -ForegroundColor White

Write-Host "`n✅ MCP AI Integration: FIXED" -ForegroundColor Green
Write-Host "   - Assistant widget connects to real MCP server" -ForegroundColor White
Write-Host "   - AI features work instead of mock data" -ForegroundColor White

Write-Host "`n🚀 NEXT: Frontend JSX runtime will need rebuild with React 19 fix" -ForegroundColor Cyan