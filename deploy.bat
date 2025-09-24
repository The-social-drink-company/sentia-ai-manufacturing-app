@echo off
echo Deploying Working Enterprise Dashboard to Railway...
echo.

echo Step 1: Link to Railway project
echo Attempting deployment directly...
railway up --service splendid-warmth --detach

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Deployment failed. Please check Railway connection.
    echo.
    echo Try accessing: https://sentiadeploy.financeflo.ai
    echo.
    pause
) else (
    echo.
    echo Deployment initiated successfully!
    echo Check: https://sentiadeploy.financeflo.ai
    echo.
)