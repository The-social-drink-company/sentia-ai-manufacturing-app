@echo off
echo ===============================================
echo Railway Environment Auto-Setup for Windows
echo ===============================================
echo.

REM Check if Node.js is available
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js is available
echo.

REM Check if Railway CLI is available
railway --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Railway CLI not found. Installing...
    npm install -g @railway/cli
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install Railway CLI
        pause
        exit /b 1
    )
    echo Railway CLI installed successfully
    echo.
)

echo Railway CLI is available
echo.

REM Check authentication
echo Checking Railway authentication...
railway whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo You are not logged in to Railway
    echo Opening Railway login...
    railway login
    if %errorlevel% neq 0 (
        echo ERROR: Railway login failed
        pause
        exit /b 1
    )
)

echo You are authenticated with Railway
echo.

REM Run the environment setup script
echo Running Railway environment setup...
echo.

if "%1"=="" (
    echo Setting up all environments (development, test, production)
    node scripts/railway-env-setup.js
) else (
    echo Setting up %1 environment only
    node scripts/railway-env-setup.js %1
)

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Railway environment setup failed
    echo Check the error messages above
    pause
    exit /b 1
)

echo.
echo ===============================================
echo Railway Setup Complete!
echo ===============================================
echo.
echo Next steps:
echo 1. Wait 2-3 minutes for deployments to complete
echo 2. Test health endpoints:
echo    - Development: https://sentia-manufacturing-dashboard-development.up.railway.app/api/health
echo    - Test: https://sentiatest.financeflo.ai/api/health  
echo    - Production: https://sentia-manufacturing-dashboard-production.up.railway.app/api/health
echo 3. Verify admin panel works on each environment
echo.
echo Deployment URLs:
echo - Development: https://sentia-manufacturing-dashboard-development.up.railway.app
echo - Test: https://sentiatest.financeflo.ai
echo - Production: https://sentia-manufacturing-dashboard-production.up.railway.app
echo.

pause