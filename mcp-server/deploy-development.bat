@echo off
echo =========================================
echo Deploying MCP Server to Development
echo =========================================

REM Switch to development environment
echo Switching to development environment...
railway environment development

REM Copy development environment variables
echo Setting up development environment variables...
copy .env.development .env

REM Deploy to Railway
echo Deploying to Railway Development...
railway up --environment development

REM Check deployment status
echo Checking deployment status...
railway status

REM View deployment URL
echo Getting deployment URL...
railway open

echo =========================================
echo Development deployment complete!
echo MCP Server URL: https://dev-sentia-mcp-server.railway.app
echo Health Check: https://dev-sentia-mcp-server.railway.app/health
echo =========================================
pause