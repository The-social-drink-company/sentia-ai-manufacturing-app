#!/bin/bash
# Render start script - Prioritizes integrated MCP server

echo "==========================================="
echo "RENDER DEPLOYMENT START SCRIPT"
echo "==========================================="
echo "Date: $(date)"
echo "PWD: $(pwd)"
echo "NODE_ENV: $NODE_ENV"
echo "BRANCH: $BRANCH"
echo "PORT: $PORT"
echo "DATABASE_URL: ${DATABASE_URL:0:30}..."
echo "==========================================="

# Check which server files exist
echo "Available server files:"
ls -la server*.js 2>/dev/null || echo "No server files found!"

# Priority order: integrated-mcp > ultra-light > minimal > default
if [ -f "server-integrated-mcp.js" ]; then
    echo "✅ Found server-integrated-mcp.js - Starting FULL INTEGRATED server with MCP and Database"
    exec node server-integrated-mcp.js
elif [ -f "server-ultra-light.js" ]; then
    echo "⚠️  Fallback to server-ultra-light.js (memory optimized but no MCP)"
    exec node --expose-gc --max-old-space-size=128 server-ultra-light.js
elif [ -f "server-minimal.js" ]; then
    echo "⚠️  Fallback to server-minimal.js (basic server)"
    exec node server-minimal.js
elif [ -f "server.js" ]; then
    echo "⚠️  Fallback to server.js (default server)"
    exec node server.js
else
    echo "❌ ERROR: No server file found!"
    exit 1
fi