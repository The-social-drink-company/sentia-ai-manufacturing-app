@echo off
echo =========================================
echo MCP Server Health Monitor
echo =========================================

REM Check if environment is specified
if "%1"=="" (
    echo Checking all environments...
    node monitor-health.js
) else (
    echo Checking %1 environment...
    node monitor-health.js %1
)

pause