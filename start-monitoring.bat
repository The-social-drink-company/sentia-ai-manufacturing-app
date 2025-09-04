@echo off
REM Comprehensive Monitoring System Startup Script for Windows
REM This script starts the monitoring agent and ensures all dependencies are ready

echo ========================================
echo Sentia Manufacturing Dashboard
echo Comprehensive Monitoring ^& Self-Correction System
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js not found. Please install Node.js 18+ and try again.
    pause
    exit /b 1
)

REM Check Node.js version
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [INFO] Node.js found: %NODE_VERSION%

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm not found. Please install npm and try again.
    pause
    exit /b 1
)

REM Check npm version
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo [INFO] npm found: %NPM_VERSION%

REM Check if node_modules exists
if not exist "node_modules" (
    echo [INFO] Installing npm dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
    echo [SUCCESS] Dependencies installed successfully
) else (
    echo [SUCCESS] Dependencies already installed
)

REM Check environment files
if exist ".env" (
    echo [SUCCESS] Environment file found: .env
) else if exist ".env.template" (
    echo [WARNING] No .env file found, but template exists
    echo [INFO] Creating .env from template...
    copy ".env.template" ".env" >nul
    echo [SUCCESS] Environment file created
) else (
    echo [WARNING] No environment files found
)

REM Start monitoring agent
echo.
echo [INFO] Starting monitoring agent...
echo.
echo The monitoring agent will:
echo   * Check all URLs every 5 minutes
echo   * Detect Phase 4 features (PredictiveMaintenanceWidget, SmartInventoryWidget)
echo   * Automatically fix deployment issues
echo   * Log all activities to monitoring.log
echo   * Save status to monitoring-status.json
echo.
echo Monitored URLs:
echo   * Railway Production: sentia-manufacturing-dashboard-production.up.railway.app
echo   * Railway Development: sentia-manufacturing-dashboard-development.up.railway.app
echo   * Railway Test: sentiatest.financeflo.ai
echo   * Localhost: http://localhost:3000, :3002, :3003
echo.
echo [INFO] Press Ctrl+C to stop monitoring
echo.

REM Handle command line arguments
if "%1"=="status" (
    echo [INFO] Checking monitoring status...
    if exist "monitoring-status.json" (
        type "monitoring-status.json"
    ) else (
        echo [WARNING] No monitoring status file found. Agent may not be running.
    )
    pause
    exit /b 0
)

if "%1"=="stop" (
    echo [INFO] Stopping monitoring agent...
    taskkill /f /im node.exe >nul 2>nul
    echo [SUCCESS] Monitoring agent stopped
    pause
    exit /b 0
)

if "%1"=="help" (
    echo Sentia Manufacturing Dashboard - Monitoring System
    echo.
    echo Usage: %~nx0 [command]
    echo.
    echo Commands:
    echo   start     Start the monitoring agent (default)
    echo   status    Show current monitoring status
    echo   stop      Stop the monitoring agent
    echo   help      Show this help message
    echo.
    pause
    exit /b 0
)

REM Start the monitoring agent
node monitoring-agent.js

pause