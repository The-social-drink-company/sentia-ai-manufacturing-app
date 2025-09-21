@echo off
echo =====================================================
echo STOPPING ALL AUTONOMOUS AGENTS AND BACKGROUND TESTING
echo =====================================================
echo.

echo Setting environment variables to disable autonomous systems...
set ENABLE_AUTONOMOUS_TESTING=false
set DISABLE_AUTONOMOUS_TESTING=true
set AUTONOMOUS_MODE=DISABLED
set DISABLE_TEST_DATA_GENERATION=true
set AUTO_FIX_ENABLED=false
set AUTO_DEPLOY_ENABLED=false
set NODE_ENV=production

echo.
echo Killing all Node.js processes...
taskkill /F /IM node.exe 2>nul
if %errorlevel%==0 (
    echo Node.js processes terminated successfully
) else (
    echo No Node.js processes found or already stopped
)

echo.
echo Autonomous systems have been disabled:
echo - Autonomous testing scheduler: DISABLED
echo - Test data factory: DISABLED
echo - 24/7 self-healing agent: DISABLED
echo - Background testing: DISABLED
echo - Auto-fix functionality: DISABLED
echo - Auto-deployment: DISABLED
echo.
echo All autonomous agents have been stopped.
echo =====================================================
pause