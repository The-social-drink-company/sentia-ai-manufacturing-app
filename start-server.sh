#!/bin/bash
# Render start script to ensure correct server is used

echo "==========================================="
echo "RENDER DEPLOYMENT START SCRIPT"
echo "==========================================="
echo "Date: $(date)"
echo "PWD: $(pwd)"
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"
echo "==========================================="

# Check which server files exist
echo "Available server files:"
ls -la server*.js 2>/dev/null || echo "No server files found!"

# Check if ultra-light server exists
if [ -f "server-ultra-light.js" ]; then
    echo "✅ Found server-ultra-light.js - Starting optimized server"
    exec node --expose-gc --max-old-space-size=128 server-ultra-light.js
elif [ -f "server-minimal.js" ]; then
    echo "⚠️  Fallback to server-minimal.js"
    exec node server-minimal.js
elif [ -f "server.js" ]; then
    echo "⚠️  Fallback to server.js"
    exec node server.js
else
    echo "❌ ERROR: No server file found!"
    exit 1
fi