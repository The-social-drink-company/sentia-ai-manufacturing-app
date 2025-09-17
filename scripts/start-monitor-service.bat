@echo off
REM Render Monitor Agent - Windows Service Startup Script
REM Runs the Render Monitor Agent as a 24/7 autonomous service

echo ========================================
echo  RENDER MONITOR AGENT - 24/7 SERVICE
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    pause
    exit /b 1
)

REM Navigate to project directory
cd /d "C:\Projects\Sentia Manufacturing Dashboard\sentia-manufacturing-dashboard"

REM Check if PID file exists (agent already running)
if exist "scripts\render-monitor.pid" (
    echo WARNING: Render Monitor Agent may already be running
    echo Checking PID file...

    set /p PID=<scripts\render-monitor.pid
    echo Found existing PID: %PID%

    REM Try to check if process is actually running
    tasklist /FI "PID eq %PID%" 2>nul | find /i "node.exe" >nul
    if %errorlevel% eq 0 (
        echo.
        echo Render Monitor Agent is already running with PID %PID%
        echo To stop it, use: npm run render:stop
        pause
        exit /b 1
    ) else (
        echo Process not found, removing stale PID file...
        del scripts\render-monitor.pid
    )
)

REM Create logs directory if it doesn't exist
if not exist "scripts\logs" (
    mkdir scripts\logs
)

echo Starting Render Monitor Agent in 24/7 autonomous mode...
echo.
echo Configuration:
echo - Target: https://sentia-manufacturing-development.onrender.com
echo - Auto-fix: ENABLED
echo - Auto-deploy: ENABLED
echo - Check interval: 60 seconds
echo - Log file: scripts\deployment-monitor.log
echo.

REM Start the monitor in the background using START command
echo Launching monitor process...
start "Render Monitor Agent" /B cmd /c "node scripts\render-deployment-agent.js --monitor 2>&1 | tee scripts\logs\monitor-output.log"

REM Wait a moment for the process to start
timeout /t 3 /nobreak >nul

REM Check if PID file was created
if exist "scripts\render-monitor.pid" (
    set /p PID=<scripts\render-monitor.pid
    echo.
    echo SUCCESS: Render Monitor Agent started successfully!
    echo Process ID: %PID%
    echo.
    echo The agent is now running in the background.
    echo.
    echo Commands:
    echo - View logs: tail -f scripts\deployment-monitor.log
    echo - Check status: npm run render:status
    echo - Stop agent: npm run render:stop
    echo.
) else (
    echo.
    echo ERROR: Failed to start Render Monitor Agent
    echo Check scripts\logs\monitor-output.log for details
    echo.
)

echo Press any key to close this window...
pause >nul