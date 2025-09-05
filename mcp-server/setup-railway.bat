@echo off
echo =========================================
echo Railway MCP Server Initial Setup
echo =========================================
echo.
echo This script will help you set up the MCP Server on Railway.
echo.
echo Prerequisites:
echo - Railway CLI installed (v4.6.3 detected)
echo - Railway account created
echo - API keys ready
echo.
pause

echo.
echo Step 1: Login to Railway
echo -------------------------
railway login

echo.
echo Step 2: Link or Create Railway Project
echo ---------------------------------------
echo Creating new project named 'sentia-mcp-server'...
railway link

echo.
echo Step 3: Set up environments
echo ----------------------------
echo Creating production environment...
railway environment production

echo Creating test environment...
railway environment test

echo Creating development environment...
railway environment development

echo.
echo Step 4: Initial deployment
echo --------------------------
echo Switching to development environment for initial deployment...
railway environment development

echo.
echo Deploying MCP Server to development...
railway up

echo.
echo =========================================
echo Setup Complete!
echo =========================================
echo.
echo Next steps:
echo 1. Go to Railway dashboard: https://railway.app/dashboard
echo 2. Add environment variables for each environment
echo 3. Deploy to other environments using:
echo    - deploy-production.bat
echo    - deploy-test.bat
echo    - deploy-development.bat
echo.
echo 4. Monitor health using:
echo    - monitor-health.bat
echo.
pause