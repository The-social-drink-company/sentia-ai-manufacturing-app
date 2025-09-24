#!/bin/bash

# Render MCP Server Environment Variables Setup Script
# Service ID: srv-d34fefur433s73cifuv0
#
# This script sets up environment variables for the MCP server on Render
# Run with: bash scripts/setup-mcp-render-env.sh

SERVICE_ID="srv-d34fefur433s73cifuv0"

echo "Setting up environment variables for MCP Server on Render..."
echo "Service ID: $SERVICE_ID"
echo ""

# Check if Render CLI is installed
if ! command -v render &> /dev/null; then
    echo "Render CLI is not installed. Please install it first:"
    echo "npm install -g @render-oss/render-cli"
    exit 1
fi

# Core environment variables
echo "Setting core environment variables..."

# Application settings
render env:set NODE_ENV=production --service $SERVICE_ID
render env:set PORT=10000 --service $SERVICE_ID
render env:set LOG_LEVEL=info --service $SERVICE_ID

# Security
render env:set JWT_SECRET=sentia-mcp-secret-$(openssl rand -hex 16) --service $SERVICE_ID

# CORS configuration for all Render deployments
render env:set CORS_ORIGINS="https://sentia-manufacturing-dashboard-development.onrender.com,https://sentia-manufacturing-dashboard-testing.onrender.com,https://sentia-manufacturing-dashboard-production.onrender.com" --service $SERVICE_ID

# Database URL (will be automatically set if using Render PostgreSQL)
# render env:set DATABASE_URL="your-database-url-here" --service $SERVICE_ID

# AI/LLM Provider Keys (REQUIRED - Replace with your actual keys)
echo ""
echo "IMPORTANT: You need to set the following AI provider keys manually:"
echo "1. ANTHROPIC_API_KEY - For Claude 3.5 Sonnet"
echo "2. OPENAI_API_KEY - For GPT-4 Turbo"
echo ""
echo "Example commands:"
echo "render env:set ANTHROPIC_API_KEY=your-anthropic-key --service $SERVICE_ID"
echo "render env:set OPENAI_API_KEY=your-openai-key --service $SERVICE_ID"

# Optional: Google AI
# render env:set GOOGLE_AI_API_KEY=your-google-ai-key --service $SERVICE_ID

# Xero Integration (Financial Data)
echo ""
echo "For Xero integration, set these variables:"
echo "render env:set XERO_CLIENT_ID=your-xero-client-id --service $SERVICE_ID"
echo "render env:set XERO_CLIENT_SECRET=your-xero-client-secret --service $SERVICE_ID"
echo "render env:set XERO_REDIRECT_URI=https://mcp-server-tkyu.onrender.com/xero/callback --service $SERVICE_ID"

# Unleashed ERP Integration
echo ""
echo "For Unleashed ERP integration, set these variables:"
echo "render env:set UNLEASHED_API_ID=your-unleashed-api-id --service $SERVICE_ID"
echo "render env:set UNLEASHED_API_KEY=your-unleashed-api-key --service $SERVICE_ID"

# Amazon SP-API (Optional)
echo ""
echo "Optional: For Amazon SP-API integration:"
echo "render env:set AMAZON_SP_API_CLIENT_ID=your-amazon-client-id --service $SERVICE_ID"
echo "render env:set AMAZON_SP_API_CLIENT_SECRET=your-amazon-secret --service $SERVICE_ID"
echo "render env:set AMAZON_SP_API_REFRESH_TOKEN=your-refresh-token --service $SERVICE_ID"
echo "render env:set AMAZON_MARKETPLACE_ID=your-marketplace-id --service $SERVICE_ID"

# Shopify Integration (Optional)
echo ""
echo "Optional: For Shopify integration:"
echo "render env:set SHOPIFY_API_KEY=your-shopify-key --service $SERVICE_ID"
echo "render env:set SHOPIFY_API_SECRET=your-shopify-secret --service $SERVICE_ID"
echo "render env:set SHOPIFY_ACCESS_TOKEN=your-access-token --service $SERVICE_ID"
echo "render env:set SHOPIFY_SHOP_DOMAIN=your-shop.myshopify.com --service $SERVICE_ID"

# Clerk Authentication (shared with main app)
echo ""
echo "For Clerk authentication (same as main app):"
echo "render env:set CLERK_SECRET_KEY=your-clerk-secret-key --service $SERVICE_ID"

echo ""
echo "Setup script completed!"
echo "Don't forget to set the required API keys listed above."
echo ""
echo "To verify environment variables are set:"
echo "render env:list --service $SERVICE_ID"
echo ""
echo "To trigger a manual deploy after setting variables:"
echo "render deploy --service $SERVICE_ID"