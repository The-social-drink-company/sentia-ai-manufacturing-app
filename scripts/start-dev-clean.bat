@echo off
echo 🚀 Starting Sentia Manufacturing Dashboard - Clean Development Mode

echo 🔄 Cleaning up processes...
taskkill /f /im node.exe >nul 2>&1

echo ⏳ Waiting for ports to be freed...
timeout /t 3 /nobreak >nul

echo 📋 Starting services in correct order...

echo 🗄️ Starting backend API server...
start "Sentia Backend" cmd /k "cd /d %~dp0.. && npm run dev:server"

echo ⏳ Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

echo 🖥️ Starting frontend development server...
start "Sentia Frontend" cmd /k "cd /d %~dp0.. && npm run dev:client"

echo ✅ Development environment started successfully!
echo 📖 Access your application at: http://localhost:3000
echo 🔧 API server running at: http://localhost:5000
echo.
pause