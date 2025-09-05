#!/bin/bash

echo "========================================="
echo "Deploying MCP Server to Production"
echo "========================================="

# Switch to production environment
echo "Switching to production environment..."
railway environment production

# Copy production environment variables
echo "Setting up production environment variables..."
cp .env.production .env

# Deploy to Railway
echo "Deploying to Railway Production..."
railway up --environment production

# Check deployment status
echo "Checking deployment status..."
railway status

# View deployment URL
echo "Getting deployment URL..."
railway open

echo "========================================="
echo "Production deployment complete!"
echo "MCP Server URL: https://sentia-mcp-server.railway.app"
echo "Health Check: https://sentia-mcp-server.railway.app/health"
echo "========================================="