@echo off
echo ========================================
echo 24/7 Self-Healing Agent Launcher
echo Sentia Manufacturing Dashboard
echo ========================================
echo.

:: Check if Node.js is available
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERROR: Node.js not found. Please install Node.js first.
    pause
    exit /b 1
)

:: Display Node.js version
echo Node.js version:
node --version
echo.

:: Change to project directory
cd /d "%~dp0"

:: Install dependencies if needed
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    echo.
)

:: Check if the agent script exists
if not exist "scripts\24-7-self-healing-agent.js" (
    echo ERROR: Agent script not found at scripts\24-7-self-healing-agent.js
    pause
    exit /b 1
)

echo Starting 24/7 Self-Healing Agent...
echo.
echo The agent will monitor:
echo - Local Development (localhost:3000, localhost:5000, localhost:3001)
echo - Railway Development (sentia-manufacturing-dashboard-development.up.railway.app)
echo - Railway Test/UAT (sentiatest.financeflo.ai)
echo - Railway Production (sentia-manufacturing-dashboard-production.up.railway.app)
echo.
echo Health checks every 10 minutes
echo Deep scans every 60 minutes
echo Auto-fix enabled with circuit breaker protection
echo.
echo Press Ctrl+C to stop the agent
echo.

:: Start the agent
node scripts/24-7-self-healing-agent.js start