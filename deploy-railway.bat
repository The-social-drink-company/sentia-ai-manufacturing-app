@echo off
echo ========================================
echo Railway 3-Branch Deployment Script
echo ========================================
echo.

echo Checking Railway CLI...
railway --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing Railway CLI...
    npm install -g @railway/cli
)

echo.
echo Checking Railway authentication...
railway whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo Please login to Railway first:
    echo railway login
    pause
    exit /b 1
)

echo.
echo Setting up environment variables...
call node scripts/setup-railway-env.js

echo.
echo Deploying to all environments...
call node scripts/railway-deploy.js

echo.
echo Verifying deployments...
call node scripts/verify-deployments.js

echo.
echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo URLs:
echo Development:  https://dev.sentia-manufacturing.railway.app
echo Testing:      https://test.sentia-manufacturing.railway.app
echo Production:   https://sentia-manufacturing.railway.app
echo.
pause
