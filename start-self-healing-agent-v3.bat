@echo off
echo ========================================
echo SENTIA SELF-HEALING TEST AGENT v3.0
echo ========================================
echo.
echo Starting comprehensive monitoring...
echo Press Ctrl+C to stop
echo.

:: Set environment variables for Render deployments
set RENDER_DEV_URL=https://sentia-manufacturing-development.onrender.com
set RENDER_TEST_URL=https://sentia-manufacturing-testing.onrender.com
set RENDER_PROD_URL=https://sentia-manufacturing-production.onrender.com
set MCP_SERVER_URL=https://mcp-server-tkyu.onrender.com

:: Enable all testing features
set AUTO_FIX_ENABLED=true
set SECURITY_SCAN_ENABLED=true
set PERFORMANCE_MONITORING=true
set PROMETHEUS_ENABLED=true

:: Set testing intervals (in milliseconds)
set HEALTH_CHECK_INTERVAL=600000
set DEEP_SCAN_INTERVAL=3600000
set MCP_CHECK_INTERVAL=300000

:: Run the self-healing agent
node scripts/enterprise-self-healing-agent-v3.js

pause