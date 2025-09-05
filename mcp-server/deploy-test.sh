#!/bin/bash

echo "========================================="
echo "Deploying MCP Server to Test Environment"
echo "========================================="

# Switch to test environment
echo "Switching to test environment..."
railway environment test

# Copy test environment variables
echo "Setting up test environment variables..."
cp .env.test .env

# Deploy to Railway
echo "Deploying to Railway Test..."
railway up --environment test

# Check deployment status
echo "Checking deployment status..."
railway status

# View deployment URL
echo "Getting deployment URL..."
railway open

echo "========================================="
echo "Test deployment complete!"
echo "MCP Server URL: https://test-sentia-mcp-server.railway.app"
echo "Health Check: https://test-sentia-mcp-server.railway.app/health"
echo "========================================="