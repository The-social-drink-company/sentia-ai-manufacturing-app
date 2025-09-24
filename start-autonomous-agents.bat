@echo off
REM 24/7 Autonomous Agent System Startup Script (Windows)
REM This script launches the autonomous agent orchestrator that manages all agents

echo ==========================================
echo    24/7 AUTONOMOUS AGENT SYSTEM v2.0    
echo ==========================================
echo.
echo Starting autonomous agent orchestrator...
echo - Commits every 5 minutes
echo - Auto-fixes across all branches
echo - Self-healing and recovery
echo - Railway/Nixpacks deployment
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Node.js is not installed
    exit /b 1
)

REM Check if git is configured
git config user.name >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Configuring git user...
    git config user.name "Autonomous Agent"
    git config user.email "agent@sentia-manufacturing.ai"
)

REM Check if Railway CLI is installed (optional)
where railway >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo √ Railway CLI detected
    set RAILWAY_DEPLOYMENT=true
) else (
    echo Warning: Railway CLI not found - deployment features limited
    set RAILWAY_DEPLOYMENT=false
)

REM Create logs directory
if not exist "agents\logs" mkdir "agents\logs"

REM Set environment variables
if "%NODE_ENV%"=="" set NODE_ENV=development
set AGENT_MODE=autonomous
set AUTO_MERGE_ENABLED=true
if "%CYCLE_INTERVAL%"=="" set CYCLE_INTERVAL=300000

REM Start the orchestrator
echo Launching orchestrator...
cd agents
start /b node autonomous-orchestrator.js

echo.
echo =====================================
echo  Autonomous Agent System is running!
echo =====================================
echo.
echo Logs: agents\logs\
echo.
echo Press Ctrl+C to stop
echo.

REM Keep the window open
pause >nul