@echo off
echo =========================================
echo Deploying MCP Server to Production
echo =========================================

REM Switch to production environment
echo Switching to production environment...
railway environment production

REM Copy production environment variables
echo Setting up production environment variables...
copy .env.production .env

REM Deploy to Railway
echo Deploying to Railway Production...
railway up --environment production

REM Check deployment status
echo Checking deployment status...
railway status

REM View deployment URL
echo Getting deployment URL...
railway open

echo =========================================
echo Production deployment complete!
echo MCP Server URL: https://sentia-mcp-server.railway.app
echo Health Check: https://sentia-mcp-server.railway.app/health
echo =========================================
pause