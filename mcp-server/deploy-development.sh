#!/bin/bash

echo "========================================="
echo "Deploying MCP Server to Development"
echo "========================================="

# Switch to development environment
echo "Switching to development environment..."
railway environment development

# Copy development environment variables
echo "Setting up development environment variables..."
cp .env.development .env

# Deploy to Railway
echo "Deploying to Railway Development..."
railway up --environment development

# Check deployment status
echo "Checking deployment status..."
railway status

# View deployment URL
echo "Getting deployment URL..."
railway open

echo "========================================="
echo "Development deployment complete!"
echo "MCP Server URL: https://dev-sentia-mcp-server.railway.app"
echo "Health Check: https://dev-sentia-mcp-server.railway.app/health"
echo "========================================="