#!/bin/bash
# Railway MCP Server Deployment Script
# Run this from the mcp-server directory

echo "🚀 Deploying MCP Server to Railway from correct directory..."

# Ensure we're in the MCP server directory
if [ ! -f "enterprise-server-simple.js" ]; then
    echo "❌ Error: enterprise-server-simple.js not found. Run from mcp-server directory."
    exit 1
fi

echo "✅ Confirmed: In MCP server directory"
echo "📦 Package: $(cat package.json | grep '"name"' | head -1)"

# Deploy using Railway CLI from MCP directory
echo "🚀 Starting Railway deployment..."
railway up --detach

echo "✅ MCP Server deployment initiated from correct directory"
echo "🔍 Check Railway dashboard for build logs"