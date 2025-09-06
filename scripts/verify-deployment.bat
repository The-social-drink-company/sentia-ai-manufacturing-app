@echo off
REM Deployment Verification Script for Sentia Manufacturing Dashboard (Windows)
REM Tests all health endpoints across all Railway environments

setlocal enabledelayedexpansion

REM Clear screen
cls

echo.
echo ==============================================================
echo    SENTIA MANUFACTURING DASHBOARD - DEPLOYMENT VERIFICATION
echo ==============================================================
echo.
echo Testing all Railway deployment health endpoints...
echo Date: %date% %time%
echo.

REM Define health check URLs
set "PROD_CUSTOM=https://sentiaprod.financeflo.ai/health"
set "PROD_RAILWAY=https://sentia-manufacturing-dashboard-production.up.railway.app/health"

set "TEST_CUSTOM=https://sentiatest.financeflo.ai/health"
set "TEST_RAILWAY=https://courageous-insight-testing.up.railway.app/health"

set "DEV_CUSTOM=https://sentiadeploy.financeflo.ai/health"
set "DEV_RAILWAY=https://sentia-manufacturing-dashboard-development.up.railway.app/health"

REM Initialize counters
set /a total_tests=0
set /a passed_tests=0
set /a failed_tests=0

echo ==============================================================
echo                    QUICK HEALTH CHECKS
echo ==============================================================
echo.

REM Production Environment
echo PRODUCTION ENVIRONMENT:
echo ----------------------
call :test_url "%PROD_CUSTOM%" "Production (Custom Domain)"
call :test_url "%PROD_RAILWAY%" "Production (Railway)"
echo.

REM Testing Environment
echo TESTING ENVIRONMENT:
echo -------------------
call :test_url "%TEST_CUSTOM%" "Testing (Custom Domain)"
call :test_url "%TEST_RAILWAY%" "Testing (Railway)"
echo.

REM Development Environment
echo DEVELOPMENT ENVIRONMENT:
echo -----------------------
call :test_url "%DEV_CUSTOM%" "Development (Custom Domain)"
call :test_url "%DEV_RAILWAY%" "Development (Railway)"
echo.

REM Summary
echo ==============================================================
echo                    VERIFICATION SUMMARY
echo ==============================================================
echo.
echo Total Tests: %total_tests%
echo Passed: %passed_tests%
echo Failed: %failed_tests%
echo.

if %failed_tests%==0 (
    echo SUCCESS: ALL DEPLOYMENTS ARE HEALTHY!
    echo.
    echo Your Sentia Manufacturing Dashboard is fully operational across all environments!
) else (
    echo WARNING: Some health checks failed. Please check the Railway logs for more details.
    echo.
    echo Troubleshooting steps:
    echo 1. Check Railway build logs for deployment errors
    echo 2. Verify environment variables are set correctly
    echo 3. Ensure Caddyfile is being used ^(not server.js^)
    echo 4. Check that dist/ folder exists with index.html
)

echo.
echo ==============================================================
echo                     QUICK ACCESS LINKS
echo ==============================================================
echo.
echo Production Dashboard: https://sentiaprod.financeflo.ai
echo Testing Dashboard:    https://sentiatest.financeflo.ai
echo Development Dashboard: https://sentiadeploy.financeflo.ai
echo.
echo GitHub Repository: 
echo https://github.com/The-social-drink-company/sentia-manufacturing-dashboard
echo.
echo Press any key to open Production Dashboard in browser...
pause >nul
start https://sentiaprod.financeflo.ai
echo.
echo Press any key to exit...
pause >nul
exit /b

REM Function to test a URL
:test_url
set "url=%~1"
set "env_name=%~2"
set /a total_tests+=1

echo Testing: %env_name%
echo URL: %url%

REM Use PowerShell to test the URL
powershell -Command "try { $response = Invoke-WebRequest -Uri '%url%' -UseBasicParsing -TimeoutSec 10; if ($response.StatusCode -eq 200) { Write-Host 'PASS: HTTP 200 OK - %env_name% is healthy!' -ForegroundColor Green; exit 0 } else { Write-Host 'FAIL: HTTP' $response.StatusCode '- %env_name% returned unexpected status' -ForegroundColor Yellow; exit 1 } } catch { Write-Host 'FAIL: Connection failed - %env_name% might be down' -ForegroundColor Red; exit 1 }"

if %errorlevel%==0 (
    set /a passed_tests+=1
) else (
    set /a failed_tests+=1
)
echo.
exit /b