#!/bin/bash

# Render Environment Setup Script
# This script helps you quickly set environment variables in Render

echo "Render Environment Variable Setup Script"
echo "========================================"
echo ""
echo "This script will generate commands to set your environment variables in Render CLI"
echo ""

# Function to set environment variable
set_env_var() {
    local service=$1
    local key=$2
    local value=$3
    echo "render env set $key=\"$value\" --service $service"
}

echo "# Development Environment Variables"
echo "# Run these commands after logging into Render CLI:"
echo ""

# Development Service
SERVICE="sentia-manufacturing-development"
echo "# For $SERVICE:"
set_env_var $SERVICE "CLERK_SECRET_KEY" "your-clerk-secret-key"
set_env_var $SERVICE "VITE_CLERK_PUBLISHABLE_KEY" "your-clerk-publishable-key"
set_env_var $SERVICE "XERO_CLIENT_ID" "your-xero-client-id"
set_env_var $SERVICE "XERO_CLIENT_SECRET" "your-xero-client-secret"
set_env_var $SERVICE "SHOPIFY_API_KEY" "your-shopify-api-key"
set_env_var $SERVICE "SHOPIFY_API_SECRET" "your-shopify-api-secret"
set_env_var $SERVICE "AMAZON_SP_CLIENT_ID" "your-amazon-sp-client-id"
set_env_var $SERVICE "AMAZON_SP_CLIENT_SECRET" "your-amazon-sp-client-secret"
set_env_var $SERVICE "UNLEASHED_API_ID" "your-unleashed-api-id"
set_env_var $SERVICE "UNLEASHED_API_KEY" "your-unleashed-api-key"
set_env_var $SERVICE "DEAR_API_KEY" "your-dear-api-key"
set_env_var $SERVICE "OPENAI_API_KEY" "your-openai-api-key"
set_env_var $SERVICE "ANTHROPIC_API_KEY" "your-anthropic-api-key"

echo ""
echo "# Testing Environment Variables"
SERVICE="sentia-manufacturing-testing"
echo "# For $SERVICE:"
echo "# Copy the same commands as above but change the service name to: $SERVICE"

echo ""
echo "# Production Environment Variables"
SERVICE="sentia-manufacturing-production"
echo "# For $SERVICE:"
echo "# Copy the same commands as above but change the service name to: $SERVICE"

echo ""
echo "# MCP Server Environment Variables"
SERVICE="sentia-mcp-server"
echo "# For $SERVICE:"
set_env_var $SERVICE "ANTHROPIC_API_KEY" "your-anthropic-api-key"
set_env_var $SERVICE "OPENAI_API_KEY" "your-openai-api-key"
set_env_var $SERVICE "GOOGLE_AI_API_KEY" "your-google-ai-api-key"

echo ""
echo "========================================"
echo "Instructions:"
echo "1. Install Render CLI: npm install -g @render/cli"
echo "2. Login: render login"
echo "3. Replace 'your-xxx' values with actual keys"
echo "4. Run each command to set the environment variables"
echo "5. Or use Render Dashboard UI for easier setup"