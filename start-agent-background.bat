@echo off
title Sentia 24/7 Self-Healing Agent - Starting...
echo ========================================
echo 24/7 Self-Healing Agent - Background Mode
echo CapLiquify Manufacturing Platform  
echo ========================================
echo.

:: Check if Node.js is available
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERROR: Node.js not found. Please install Node.js first.
    pause
    exit /b 1
)

:: Change to project directory
cd /d "%~dp0"

:: Create logs directory
if not exist "logs" mkdir logs
if not exist "logs\self-healing-agent" mkdir logs\self-healing-agent

echo Starting 24/7 Self-Healing Agent in background mode...
echo.
echo The agent will monitor continuously:
echo - Health checks every 10 minutes
echo - Deep scans every 60 minutes
echo - Auto-fix enabled with circuit breaker protection
echo - Enterprise logging to: logs\self-healing-agent\
echo.
echo Agent process will run in background.
echo Check logs for monitoring activity.
echo.

:: Start the agent in background with output redirection
start "Sentia Self-Healing Agent" /min node scripts/24-7-self-healing-agent.js start

echo.
echo ========================================
echo Agent started in background mode!
echo ========================================
echo.
echo To monitor the agent:
echo 1. Check logs in: logs\self-healing-agent\
echo 2. Run: node scripts/24-7-self-healing-agent.js status
echo 3. Look for "Sentia Self-Healing Agent" in Task Manager
echo.
echo To stop the agent:
echo 1. Find "Sentia Self-Healing Agent" in Task Manager
echo 2. End the Node.js process
echo.
echo Press any key to continue...
pause >nul
