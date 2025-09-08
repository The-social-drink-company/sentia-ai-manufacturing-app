@echo off
echo Attempting to find correct Railway project for web-production-1f10.up.railway.app...

echo.
echo Trying My Projects workspace...
echo.

REM Create a temp config to bypass interactive prompts
echo [workspace] > railway_temp.toml
echo name = "My Projects" >> railway_temp.toml

REM Force deployment with project/service IDs we know
railway up --service confident-energy --detach

echo.
echo Deployment attempt completed. Check if web-production-1f10.up.railway.app is updated...