#!/bin/bash

# Render Environment Variable Update Script for Sentia Manufacturing Dashboard
# This script helps you update Clerk authentication keys across all environments

echo "🔐 Sentia Manufacturing Dashboard - Clerk Environment Setup"
echo "=========================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}This script will help you configure Clerk authentication keys for all environments.${NC}"
echo ""

# Function to display environment variables for copying
display_env_vars() {
    local env_name=$1
    local pub_key=$2
    local secret_key=$3
    
    echo -e "${GREEN}=== $env_name Environment Variables ===${NC}"
    echo "Copy these to your Render dashboard for the $env_name service:"
    echo ""
    echo "VITE_CLERK_PUBLISHABLE_KEY=$pub_key"
    echo "CLERK_SECRET_KEY=$secret_key"
    echo "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$pub_key"
    echo "VITE_CLERK_SIGN_IN_URL=/sign-in"
    echo "VITE_CLERK_SIGN_UP_URL=/sign-up"
    echo "VITE_CLERK_AFTER_SIGN_IN_URL=/dashboard"
    echo "VITE_CLERK_AFTER_SIGN_UP_URL=/dashboard"
    echo "CLERK_ENVIRONMENT=${env_name,,}"
    echo ""
}

# Development Environment (Test Keys)
echo -e "${YELLOW}📋 DEVELOPMENT ENVIRONMENT${NC}"
display_env_vars "DEVELOPMENT" \
    "pk_test_Y2hhbXBpb24tYnVsbGRvZy05Mi5jbGVyay5hY2NvdW50cy5kZXYk" \
    "sk_test_EP6iF7prGbq73CscUPCOW8PAKol4pPaBG5iYdsDodq"

echo -e "${BLUE}Render Service: sentia-manufacturing-development${NC}"
echo "URL: https://dashboard.render.com/web/[your-service-id]"
echo ""
echo "Press Enter to continue to Testing environment..."
read

# Testing Environment (Test Keys)
echo -e "${YELLOW}📋 TESTING ENVIRONMENT${NC}"
display_env_vars "TESTING" \
    "pk_test_Y2hhbXBpb24tYnVsbGRvZy05Mi5jbGVyay5hY2NvdW50cy5kZXYk" \
    "sk_test_EP6iF7prGbq73CscUPCOW8PAKol4pPaBG5iYdsDodq"

echo -e "${BLUE}Render Service: sentia-manufacturing-testing${NC}"
echo "URL: https://dashboard.render.com/web/[your-service-id]"
echo ""
echo "Press Enter to continue to Production environment..."
read

# Production Environment (Live Keys - User Input Required)
echo -e "${YELLOW}📋 PRODUCTION ENVIRONMENT${NC}"
echo -e "${RED}⚠️  IMPORTANT: You need to get your LIVE production keys from Clerk Dashboard first!${NC}"
echo ""
echo "Steps to get production keys:"
echo "1. Go to https://dashboard.clerk.dev"
echo "2. Switch to your Production instance (top of page)"
echo "3. Go to Configure > API Keys"
echo "4. Copy your pk_live_ and sk_live_ keys"
echo ""

echo "Do you have your production keys ready? (y/n)"
read -r has_prod_keys

if [[ $has_prod_keys =~ ^[Yy]$ ]]; then
    echo "Enter your production publishable key (starts with pk_live_):"
    read -r prod_pub_key
    
    echo "Enter your production secret key (starts with sk_live_):"
    read -r -s prod_secret_key  # -s hides input for security
    
    echo ""
    display_env_vars "PRODUCTION" "$prod_pub_key" "$prod_secret_key"
    
    echo -e "${BLUE}Render Service: sentia-manufacturing-production${NC}"
    echo "URL: https://dashboard.render.com/web/[your-service-id]"
else
    echo -e "${YELLOW}Production keys not ready. Here's the template:${NC}"
    echo ""
    display_env_vars "PRODUCTION" \
        "pk_live_YOUR_PRODUCTION_PUBLISHABLE_KEY_HERE" \
        "sk_live_YOUR_PRODUCTION_SECRET_KEY_HERE"
    
    echo -e "${RED}⚠️  Remember to replace the placeholder keys with your actual production keys!${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Environment variable configuration complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Copy the environment variables to each Render service"
echo "2. Save changes in Render (this will trigger redeployment)"
echo "3. Wait for deployments to complete (2-3 minutes each)"
echo "4. Test authentication on each environment"
echo ""
echo "Environment URLs:"
echo "• Development: https://sentia-manufacturing-development.onrender.com"
echo "• Testing: https://sentia-manufacturing-testing.onrender.com"
echo "• Production: https://sentia-manufacturing-production.onrender.com"
echo ""
echo -e "${BLUE}For detailed instructions, see: clerk-render-setup-guide.md${NC}"
