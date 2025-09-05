#!/bin/bash

# Sentia MCP Server Railway Deployment Script
# This script automates the deployment process to Railway

set -e

echo "🚀 Starting Sentia MCP Server Railway Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    print_error "Railway CLI is not installed. Please install it first:"
    echo "npm install -g @railway/cli"
    exit 1
fi

# Check if user is logged in to Railway
if ! railway whoami &> /dev/null; then
    print_error "Not logged in to Railway. Please login first:"
    echo "railway login"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "nixpacks.toml" ]; then
    print_error "Please run this script from the mcp-server directory"
    exit 1
fi

# Check for required environment variables
print_status "Checking environment variables..."

required_vars=("XERO_CLIENT_ID" "XERO_CLIENT_SECRET" "OPENAI_API_KEY" "ANTHROPIC_API_KEY")
missing_vars=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    print_warning "Missing environment variables: ${missing_vars[*]}"
    print_status "Please set these variables in Railway dashboard after deployment"
fi

# Install dependencies
print_status "Installing dependencies..."
npm ci --only=production

# Create logs directory
print_status "Creating logs directory..."
mkdir -p logs

# Deploy to Railway
print_status "Deploying to Railway..."
railway up

# Get deployment URL
print_status "Getting deployment URL..."
DEPLOYMENT_URL=$(railway domain)

if [ -n "$DEPLOYMENT_URL" ]; then
    print_success "Deployment successful!"
    print_success "MCP Server URL: https://$DEPLOYMENT_URL"
    print_success "Health Check: https://$DEPLOYMENT_URL/health"
    print_success "Provider Status: https://$DEPLOYMENT_URL/api/providers"
    
    echo ""
    print_status "Next steps:"
    echo "1. Set environment variables in Railway dashboard"
    echo "2. Configure MCP server in Cursor"
    echo "3. Test the deployment"
    
    echo ""
    print_status "Environment variables to set in Railway:"
    echo "XERO_CLIENT_ID=9C0CAB921C134476A249E48BBECB8C4B"
    echo "XERO_CLIENT_SECRET=f0TJpJSRX_B9NI51sknz7TuKbbSfhO4dEhTM4m4fWBlph9F5"
    echo "XERO_REDIRECT_URI=https://$DEPLOYMENT_URL/api/xero/callback"
    echo "OPENAI_API_KEY=your_openai_api_key"
    echo "ANTHROPIC_API_KEY=your_anthropic_api_key"
    
else
    print_error "Failed to get deployment URL"
    print_status "Check Railway dashboard for deployment status"
fi

print_success "Deployment script completed!"
