#!/bin/bash
# Deployment Verification Script for Sentia Manufacturing Dashboard
# Tests all health endpoints across all Railway environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_header() {
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_test() {
    echo -e "${BLUE}▶ Testing: $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to test a URL
test_url() {
    local url=$1
    local env_name=$2
    
    print_test "$env_name - $url"
    
    # Test with curl
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if [ "$response" = "200" ]; then
        print_success "HTTP 200 OK - $env_name is healthy!"
        return 0
    elif [ "$response" = "000" ]; then
        print_error "Connection failed - $env_name might be down"
        return 1
    else
        print_warning "HTTP $response - $env_name returned unexpected status"
        return 1
    fi
}

# Function to test with detailed output
test_url_detailed() {
    local url=$1
    local env_name=$2
    
    echo ""
    print_test "$env_name Health Check (Detailed)"
    echo "URL: $url"
    echo ""
    
    # Get full response with headers
    response=$(curl -i -s "$url" 2>/dev/null | head -n 20)
    
    if echo "$response" | grep -q "200 OK\|200 OK"; then
        print_success "Health check passed!"
        echo "$response" | head -n 5
    else
        print_error "Health check failed!"
        echo "$response"
    fi
    echo ""
}

# Main verification process
clear
echo ""
print_header "🚀 SENTIA MANUFACTURING DASHBOARD - DEPLOYMENT VERIFICATION"
echo ""
echo "Testing all Railway deployment health endpoints..."
echo "Date: $(date)"
echo ""

# Define health check URLs
PROD_CUSTOM="https://sentiaprod.financeflo.ai/health"
PROD_RAILWAY="https://sentia-manufacturing-dashboard-production.up.railway.app/health"

TEST_CUSTOM="https://sentiatest.financeflo.ai/health"
TEST_RAILWAY="https://courageous-insight-testing.up.railway.app/health"

DEV_CUSTOM="https://sentiadeploy.financeflo.ai/health"
DEV_RAILWAY="https://sentia-manufacturing-dashboard-development.up.railway.app/health"

# Summary variables
total_tests=0
passed_tests=0
failed_tests=0

print_header "📊 QUICK HEALTH CHECKS"

# Production Environment
echo -e "\n${YELLOW}PRODUCTION ENVIRONMENT:${NC}"
if test_url "$PROD_CUSTOM" "Production (Custom Domain)"; then
    ((passed_tests++))
else
    ((failed_tests++))
fi
((total_tests++))

if test_url "$PROD_RAILWAY" "Production (Railway)"; then
    ((passed_tests++))
else
    ((failed_tests++))
fi
((total_tests++))

# Testing Environment
echo -e "\n${YELLOW}TESTING ENVIRONMENT:${NC}"
if test_url "$TEST_CUSTOM" "Testing (Custom Domain)"; then
    ((passed_tests++))
else
    ((failed_tests++))
fi
((total_tests++))

if test_url "$TEST_RAILWAY" "Testing (Railway)"; then
    ((passed_tests++))
else
    ((failed_tests++))
fi
((total_tests++))

# Development Environment
echo -e "\n${YELLOW}DEVELOPMENT ENVIRONMENT:${NC}"
if test_url "$DEV_CUSTOM" "Development (Custom Domain)"; then
    ((passed_tests++))
else
    ((failed_tests++))
fi
((total_tests++))

if test_url "$DEV_RAILWAY" "Development (Railway)"; then
    ((passed_tests++))
else
    ((failed_tests++))
fi
((total_tests++))

# Detailed tests for debugging
if [ "$1" = "--detailed" ] || [ "$1" = "-d" ]; then
    print_header "🔍 DETAILED HEALTH CHECKS"
    
    test_url_detailed "$PROD_CUSTOM" "PRODUCTION"
    test_url_detailed "$TEST_CUSTOM" "TESTING"
    test_url_detailed "$DEV_CUSTOM" "DEVELOPMENT"
fi

# Summary
echo ""
print_header "📈 VERIFICATION SUMMARY"
echo ""
echo "Total Tests: $total_tests"
echo -e "${GREEN}Passed: $passed_tests${NC}"
echo -e "${RED}Failed: $failed_tests${NC}"
echo ""

if [ $failed_tests -eq 0 ]; then
    print_success "🎉 ALL DEPLOYMENTS ARE HEALTHY!"
    echo ""
    echo "Your Sentia Manufacturing Dashboard is fully operational across all environments!"
else
    print_warning "Some health checks failed. Please check the Railway logs for more details."
    echo ""
    echo "Troubleshooting steps:"
    echo "1. Check Railway build logs for deployment errors"
    echo "2. Verify environment variables are set correctly"
    echo "3. Ensure Caddyfile is being used (not server.js)"
    echo "4. Check that dist/ folder exists with index.html"
fi

echo ""
print_header "🔗 QUICK ACCESS LINKS"
echo ""
echo "Production Dashboard: https://sentiaprod.financeflo.ai"
echo "Testing Dashboard:    https://sentiatest.financeflo.ai"
echo "Development Dashboard: https://sentiadeploy.financeflo.ai"
echo ""
echo "GitHub Repository: https://github.com/The-social-drink-company/sentia-manufacturing-dashboard"
echo ""
echo "Run with --detailed or -d flag for verbose output"
echo ""