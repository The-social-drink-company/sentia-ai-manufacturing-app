#!/bin/bash

# SENTIA MANUFACTURING DASHBOARD - RAILWAY DEPLOYMENT SCRIPT
# Deploys to production with MCP server and all features enabled

echo "🚀 Sentia Manufacturing Dashboard - Production Deployment"
echo "=================================================="

# Railway Project Configuration
PROJECT_ID="b9ca1af1-13c5-4ced-9ab6-68fddd73fc8f"
PRODUCTION_TOKEN="3e0053fc-ea90-49ec-9708-e09d58cad4a0"
MCP_SERVER_TOKEN="99691282-de66-45b2-98cf-317083dd11ba"

# Set Railway CLI token for production
export RAILWAY_TOKEN=$PRODUCTION_TOKEN

echo "📦 Step 1: Installing Railway CLI (if needed)..."
which railway > /dev/null || npm install -g @railway/cli

echo "🔐 Step 2: Authenticating with Railway..."
railway login --token $PRODUCTION_TOKEN

echo "🌍 Step 3: Setting production environment..."
railway environment production

echo "⚙️ Step 4: Configuring environment variables..."

# Core Configuration
railway variables set NODE_ENV=production
railway variables set PORT=5000
railway variables set MCP_PORT=3001

# Database
railway variables set DATABASE_URL="postgresql://neondb_owner:npg_2wXVD9gdintm@ep-broad-resonance-ablmx6yo-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require"
railway variables set DATABASE_CONNECTION_TIMEOUT=60000

# Authentication
railway variables set VITE_CLERK_PUBLISHABLE_KEY="pk_live_Y2xlcmsuc2VudGlhLW1hbnVmYWN0dXJpbmcuYWkk"
railway variables set CLERK_SECRET_KEY="sk_live_CLERK_SECRET_HERE"

# AI Provider Keys (CRITICAL FOR MCP)
railway variables set ANTHROPIC_API_KEY="sk-ant-api03-YOUR_KEY"
railway variables set OPENAI_API_KEY="sk-YOUR_KEY"
railway variables set GOOGLE_AI_API_KEY="AIzaSy_YOUR_KEY"

# External APIs
railway variables set XERO_CLIENT_ID="YOUR_XERO_CLIENT_ID"
railway variables set XERO_CLIENT_SECRET="YOUR_XERO_SECRET"
railway variables set SHOPIFY_API_KEY="YOUR_SHOPIFY_KEY"
railway variables set SHOPIFY_API_SECRET="YOUR_SHOPIFY_SECRET"
railway variables set AMAZON_SP_API_CLIENT_ID="amzn1.application"
railway variables set AMAZON_SP_API_CLIENT_SECRET="YOUR_AMAZON_SECRET"

# Redis Cache
railway variables set REDIS_URL="redis://default:password@redis-server:6379"

# Security
railway variables set JWT_SECRET="sentia-jwt-secret-production-2025"
railway variables set SESSION_SECRET="sentia-session-secret-production-2025"

# Feature Flags
railway variables set ENABLE_MCP_SERVER=true
railway variables set ENABLE_AI_FEATURES=true
railway variables set ENABLE_WEBSOCKET=true
railway variables set ENABLE_SSE=true
railway variables set ENABLE_REDIS_CACHE=true
railway variables set ENABLE_MONITORING=true

# CORS
railway variables set CORS_ORIGINS="https://sentia-manufacturing-dashboard-production.up.railway.app,https://sentiaprod.financeflo.ai"

echo "🚀 Step 5: Deploying MCP Server as separate service..."
railway link $PROJECT_ID --environment production
railway service create --name sentia-mcp-server

# Switch to MCP server service
railway service sentia-mcp-server

# Set MCP server specific variables
railway variables set RAILWAY_SERVICE_NAME=sentia-mcp-server
railway variables set MCP_SERVER_MODE=true
railway variables set PORT=3001

echo "📦 Step 6: Deploying main application..."
railway service sentia-manufacturing-dashboard
railway up --detach

echo "🔄 Step 7: Starting MCP server..."
railway service sentia-mcp-server
railway up --detach

echo "✅ Step 8: Verifying deployment..."
sleep 10

# Check health endpoints
echo "Checking main app health..."
curl -s https://sentia-manufacturing-dashboard-production.up.railway.app/api/health | jq .

echo "Checking MCP server health..."
curl -s https://sentia-mcp-server-production.up.railway.app/health | jq .

echo "=================================================="
echo "✨ Deployment Complete!"
echo "Main App: https://sentia-manufacturing-dashboard-production.up.railway.app"
echo "MCP Server: https://sentia-mcp-server-production.up.railway.app"
echo "=================================================="