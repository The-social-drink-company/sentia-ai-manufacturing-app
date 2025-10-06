# Update Database URLs for All Render Environments
# This script provides the corrected DATABASE_URL values to fix database connection issues

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "   DATABASE URL UPDATE FOR RENDER ENVIRONMENTS" -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Cyan

Write-Host "`n[ISSUE] Internal hostname unreachable by web services" -ForegroundColor Red
Write-Host "Current DATABASE_URL uses: dpg-d344rkfdiees73a20c50-a:5432"
Write-Host "Web services cannot reach internal hostname" -ForegroundColor Red

Write-Host "`n[SOLUTION] Use external hostname with SSL" -ForegroundColor Green
Write-Host "Updated DATABASE_URL uses: dpg-d344rkfdiees73a20c50-a.oregon-postgres.render.com" -ForegroundColor Green

Write-Host "`n" + "="*80 -ForegroundColor White
Write-Host "  CORRECTED DATABASE_URL VALUES" -ForegroundColor Yellow
Write-Host "="*80 -ForegroundColor White

Write-Host "`n1. DEVELOPMENT ENVIRONMENT:" -ForegroundColor Green
Write-Host "   Service: sentia-manufacturing-development" -ForegroundColor Cyan
$devUrl = "postgresql://sentia_dev:nZ4vtXienMAwxahr0GJByc2qXFIFSoYL@dpg-d344rkfdiees73a20c50-a.oregon-postgres.render.com/sentia_manufacturing_dev?sslmode=require"
Write-Host "   DATABASE_URL=$devUrl" -ForegroundColor White

Write-Host "`n2. TESTING ENVIRONMENT:" -ForegroundColor Green
Write-Host "   Service: sentia-manufacturing-testing" -ForegroundColor Cyan
$testUrl = "postgresql://sentia_test:nZ4vtXienMAwxahr0GJByc2qXFIFSoYL@dpg-d344rkfdiees73a20c50-a.oregon-postgres.render.com/sentia_manufacturing_test?sslmode=require"
Write-Host "   DATABASE_URL=$testUrl" -ForegroundColor White

Write-Host "`n3. PRODUCTION ENVIRONMENT:" -ForegroundColor Green
Write-Host "   Service: sentia-manufacturing-production" -ForegroundColor Cyan
$prodUrl = "postgresql://sentia_prod:nZ4vtXienMAwxahr0GJByc2qXFIFSoYL@dpg-d344rkfdiees73a20c50-a.oregon-postgres.render.com/sentia_manufacturing_prod?sslmode=require"
Write-Host "   DATABASE_URL=$prodUrl" -ForegroundColor White

Write-Host "`n" + "="*80 -ForegroundColor White
Write-Host "  MANUAL UPDATE INSTRUCTIONS" -ForegroundColor Yellow
Write-Host "="*80 -ForegroundColor White

Write-Host "`n[STEP 1] Update Development Environment:" -ForegroundColor Green
Write-Host "1. Go to: https://dashboard.render.com" -ForegroundColor White
Write-Host "2. Find service: sentia-manufacturing-development" -ForegroundColor White
Write-Host "3. Click Environment tab" -ForegroundColor White
Write-Host "4. Find DATABASE_URL and update to:" -ForegroundColor White
Write-Host "   $devUrl" -ForegroundColor Yellow
Write-Host "5. Click Save Changes (service will auto-redeploy)" -ForegroundColor White

Write-Host "`n[STEP 2] Update Testing Environment:" -ForegroundColor Green
Write-Host "1. Find service: sentia-manufacturing-testing" -ForegroundColor White
Write-Host "2. Click Environment tab" -ForegroundColor White
Write-Host "3. Find DATABASE_URL and update to:" -ForegroundColor White
Write-Host "   $testUrl" -ForegroundColor Yellow
Write-Host "4. Click Save Changes (service will auto-redeploy)" -ForegroundColor White

Write-Host "`n[STEP 3] Update Production Environment:" -ForegroundColor Green
Write-Host "1. Find service: sentia-manufacturing-production" -ForegroundColor White
Write-Host "2. Click Environment tab" -ForegroundColor White
Write-Host "3. Find DATABASE_URL and update to:" -ForegroundColor White
Write-Host "   $prodUrl" -ForegroundColor Yellow
Write-Host "4. Click Save Changes (service will auto-redeploy)" -ForegroundColor White

Write-Host "`n" + "="*80 -ForegroundColor White
Write-Host "  VERIFICATION STEPS" -ForegroundColor Yellow
Write-Host "="*80 -ForegroundColor White

Write-Host "`nAfter updating each environment:" -ForegroundColor Green
Write-Host "1. Wait 2-3 minutes for redeploy to complete" -ForegroundColor White
Write-Host "2. Check Logs tab for 'Database: Connected' message" -ForegroundColor White
Write-Host "3. Verify startup banner shows successful database connection" -ForegroundColor White
Write-Host "4. Test API endpoints return JSON (not HTML)" -ForegroundColor White

Write-Host "`n[SUCCESS INDICATORS]" -ForegroundColor Green
Write-Host "✓ Startup logs show: 'Database: Connected'" -ForegroundColor Green
Write-Host "✓ API endpoints return JSON responses" -ForegroundColor Green
Write-Host "✓ No 500 errors in browser console" -ForegroundColor Green
Write-Host "✓ Enterprise dashboard loads without errors" -ForegroundColor Green

Write-Host "`n" + "="*80 -ForegroundColor White
Write-Host "  QUICK COPY-PASTE VALUES" -ForegroundColor Yellow
Write-Host "="*80 -ForegroundColor White

Write-Host "`nDEVELOPMENT DATABASE_URL:" -ForegroundColor Cyan
Write-Host $devUrl -ForegroundColor Yellow

Write-Host "`nTESTING DATABASE_URL:" -ForegroundColor Cyan
Write-Host $testUrl -ForegroundColor Yellow

Write-Host "`nPRODUCTION DATABASE_URL:" -ForegroundColor Cyan
Write-Host $prodUrl -ForegroundColor Yellow

Write-Host "`n================================================================" -ForegroundColor Cyan
Write-Host "   UPDATE COMPLETE - DEPLOY AND VERIFY" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan

Write-Host "`nNext: Update these values in Render dashboard and verify 'Database: Connected' in logs" -ForegroundColor Green