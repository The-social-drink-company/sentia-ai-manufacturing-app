@echo off
REM Sentia MCP Server Railway Deployment Script for Windows
REM This script automates the deployment process to Railway

echo 🚀 Starting Sentia MCP Server Railway Deployment...

REM Check if Railway CLI is installed
railway --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Railway CLI is not installed. Please install it first:
    echo npm install -g @railway/cli
    pause
    exit /b 1
)

REM Check if user is logged in to Railway
railway whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Not logged in to Railway. Please login first:
    echo railway login
    pause
    exit /b 1
)

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Please run this script from the mcp-server directory
    pause
    exit /b 1
)

if not exist "nixpacks.toml" (
    echo ❌ Please run this script from the mcp-server directory
    pause
    exit /b 1
)

echo ✅ Environment checks passed

REM Install dependencies
echo 📦 Installing dependencies...
call npm ci --only=production
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

REM Create logs directory
echo 📁 Creating logs directory...
if not exist "logs" mkdir logs

REM Deploy to Railway
echo 🚀 Deploying to Railway...
railway up
if %errorlevel% neq 0 (
    echo ❌ Deployment failed
    pause
    exit /b 1
)

REM Get deployment URL
echo 🌐 Getting deployment URL...
for /f "tokens=*" %%i in ('railway domain') do set DEPLOYMENT_URL=%%i

if defined DEPLOYMENT_URL (
    echo ✅ Deployment successful!
    echo ✅ MCP Server URL: https://%DEPLOYMENT_URL%
    echo ✅ Health Check: https://%DEPLOYMENT_URL%/health
    echo ✅ Provider Status: https://%DEPLOYMENT_URL%/api/providers
    
    echo.
    echo 📋 Next steps:
    echo 1. Set environment variables in Railway dashboard
    echo 2. Configure MCP server in Cursor
    echo 3. Test the deployment
    
    echo.
    echo 🔧 Environment variables to set in Railway:
    echo XERO_CLIENT_ID=9C0CAB921C134476A249E48BBECB8C4B
    echo XERO_CLIENT_SECRET=f0TJpJSRX_B9NI51sknz7TuKbbSfhO4dEhTM4m4fWBlph9F5
    echo XERO_REDIRECT_URI=https://%DEPLOYMENT_URL%/api/xero/callback
    echo OPENAI_API_KEY=your_openai_api_key
    echo ANTHROPIC_API_KEY=your_anthropic_api_key
    
) else (
    echo ❌ Failed to get deployment URL
    echo 📋 Check Railway dashboard for deployment status
)

echo ✅ Deployment script completed!
pause
