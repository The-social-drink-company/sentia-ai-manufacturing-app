@echo off
cls
color 0A
echo.
echo ============================================================
echo        SENTIA AUTONOMOUS 24/7 SELF-HEALING SYSTEM
echo                      Version 4.0
echo ============================================================
echo.
echo     [ACTIVATING AUTONOMOUS REPAIR MODE]
echo.
echo     Features:
echo     - Automatic 502 Bad Gateway recovery
echo     - Database connection auto-repair
echo     - Environment variable injection
echo     - Intelligent error pattern learning
echo     - Automatic build and deployment
echo     - 24/7 unattended operation
echo.
echo ============================================================
echo.

:: Set critical environment variables
set NODE_ENV=production
set AUTO_FIX_ENABLED=true
set AUTO_DEPLOY_ENABLED=true
set AUTO_RESTART_ENABLED=true
set ENABLE_LEARNING=true

:: Set Render configuration
set RENDER_API_KEY=%RENDER_API_KEY%
set RENDER_DEV_URL=https://sentia-manufacturing-development.onrender.com
set RENDER_TEST_URL=https://sentia-manufacturing-testing.onrender.com
set RENDER_PROD_URL=https://sentia-manufacturing-production.onrender.com
set MCP_SERVER_URL=https://mcp-server-tkyu.onrender.com

:: Create logs directory if not exists
if not exist logs mkdir logs
if not exist logs\self-healing mkdir logs\self-healing

echo [%date% %time%] Starting Autonomous Healer... >> logs\self-healing\startup.log
echo.
echo Starting autonomous 24/7 monitoring and repair system...
echo.
echo Press Ctrl+C to stop (not recommended for production)
echo.
echo ============================================================
echo.

:: Run the autonomous healer
node scripts/autonomous-24-7-healer.js

:: If the script exits, restart it automatically
echo.
echo [WARNING] Autonomous healer stopped unexpectedly!
echo Restarting in 10 seconds...
timeout /t 10 /nobreak
goto :restart

:restart
echo.
echo [AUTO-RESTART] Restarting autonomous healer...
echo.
node scripts/autonomous-24-7-healer.js
goto :restart