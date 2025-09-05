@echo off
echo 🚀 Starting Xero MCP Server...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if xero-mcp is installed globally
xero-mcp --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ xero-mcp is not installed globally
    echo Installing xero-mcp...
    npm install -g xero-mcp
    if %errorlevel% neq 0 (
        echo ❌ Failed to install xero-mcp
        pause
        exit /b 1
    )
)

REM Start the Xero MCP server
echo ✅ Starting Xero MCP server...
node scripts/start-xero-mcp.js

pause
