@echo off
REM Render Monitor Agent - Stop Service Script

echo ========================================
echo  STOPPING RENDER MONITOR AGENT
echo ========================================
echo.

cd /d "C:\Projects\CapLiquify Manufacturing Platform\sentia-manufacturing-dashboard"

REM Check if PID file exists
if not exist "scripts\render-monitor.pid" (
    echo No PID file found. The agent may not be running.
    pause
    exit /b 0
)

REM Read PID from file
set /p PID=<scripts\render-monitor.pid
echo Found Render Monitor Agent PID: %PID%

REM Kill the process
echo Stopping process...
taskkill /F /PID %PID% 2>nul

if %errorlevel% eq 0 (
    echo SUCCESS: Render Monitor Agent stopped
    REM Clean up PID file
    del scripts\render-monitor.pid
) else (
    echo WARNING: Could not stop process. It may have already been stopped.
    REM Clean up PID file anyway
    del scripts\render-monitor.pid
)

echo.
echo Render Monitor Agent has been stopped.
pause