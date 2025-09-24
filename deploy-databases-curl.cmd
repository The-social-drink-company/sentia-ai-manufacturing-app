@echo off
echo ========================================
echo RENDER DATABASE DEPLOYMENT USING CURL
echo ========================================
echo.

set RENDER_API_KEY=rnd_mYUAytWRkb2Pj5GJROqNYubYt25J

echo Creating Development Database...
curl -X POST https://api.render.com/v1/services ^
  -H "Authorization: Bearer %RENDER_API_KEY%" ^
  -H "Content-Type: application/json" ^
  -d "{\"type\":\"postgres\",\"name\":\"sentia-db-development\",\"plan\":\"free\",\"region\":\"oregon\",\"databaseName\":\"sentia_manufacturing_dev\",\"databaseUser\":\"sentia_dev_user\",\"ipAllowList\":[]}"

echo.
echo Creating Testing Database...
curl -X POST https://api.render.com/v1/services ^
  -H "Authorization: Bearer %RENDER_API_KEY%" ^
  -H "Content-Type: application/json" ^
  -d "{\"type\":\"postgres\",\"name\":\"sentia-db-testing\",\"plan\":\"free\",\"region\":\"oregon\",\"databaseName\":\"sentia_manufacturing_test\",\"databaseUser\":\"sentia_test_user\",\"ipAllowList\":[]}"

echo.
echo Creating Production Database...
curl -X POST https://api.render.com/v1/services ^
  -H "Authorization: Bearer %RENDER_API_KEY%" ^
  -H "Content-Type: application/json" ^
  -d "{\"type\":\"postgres\",\"name\":\"sentia-db-production\",\"plan\":\"starter\",\"region\":\"oregon\",\"databaseName\":\"sentia_manufacturing_prod\",\"databaseUser\":\"sentia_prod_user\",\"ipAllowList\":[]}"

echo.
echo ========================================
echo DATABASE DEPLOYMENT COMPLETE
echo ========================================
echo.
echo Check your databases at:
echo https://dashboard.render.com/services
echo.
echo Expected databases:
echo 1. sentia-db-development (free)
echo 2. sentia-db-testing (free)
echo 3. sentia-db-production (starter - $7/month)
echo.
pause