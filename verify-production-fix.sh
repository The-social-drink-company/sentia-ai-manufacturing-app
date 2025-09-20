#!/bin/bash

# Production Deployment Verification Script
# Run this after adding environment variables to Render

echo "=========================================="
echo "PRODUCTION DEPLOYMENT VERIFICATION"
echo "=========================================="
echo ""

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PROD_URL="https://sentia-manufacturing-production.onrender.com"

echo "Checking production status..."
echo ""

# Function to check endpoint
check_endpoint() {
    local endpoint=$1
    local description=$2

    echo -n "Testing $description: "

    response=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL$endpoint" 2>/dev/null)

    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✓ SUCCESS${NC} (HTTP $response)"
        return 0
    elif [ "$response" = "502" ]; then
        echo -e "${RED}✗ FAILED${NC} (HTTP 502 - Still deploying or missing env vars)"
        return 1
    else
        echo -e "${YELLOW}⚠ WARNING${NC} (HTTP $response)"
        return 1
    fi
}

# Check various endpoints
check_endpoint "/health" "Health Check"
HEALTH_STATUS=$?

check_endpoint "/" "Main Application"
MAIN_STATUS=$?

check_endpoint "/api/status" "API Status"
API_STATUS=$?

echo ""
echo "=========================================="

# Check if we can get JSON from health endpoint
echo "Detailed Health Check:"
health_response=$(curl -s "$PROD_URL/health" 2>/dev/null)

# Check if response is JSON
if echo "$health_response" | grep -q '"status"'; then
    echo -e "${GREEN}✓ Health endpoint returning valid JSON:${NC}"
    echo "$health_response" | python -m json.tool 2>/dev/null || echo "$health_response"
    echo ""
    echo -e "${GREEN}✅ PRODUCTION IS OPERATIONAL!${NC}"
else
    echo -e "${RED}✗ Health endpoint not returning JSON${NC}"
    echo "Response preview: $(echo "$health_response" | head -c 100)"
    echo ""
    echo -e "${RED}❌ PRODUCTION STILL DOWN${NC}"
    echo ""
    echo "Possible causes:"
    echo "1. Environment variables not yet added"
    echo "2. Deployment still in progress (wait 2-5 minutes)"
    echo "3. Build failed - check Render dashboard logs"
fi

echo ""
echo "=========================================="
echo "Next steps if still failing:"
echo "1. Verify all Clerk env vars are added in Render"
echo "2. Check deployment logs in Render dashboard"
echo "3. Trigger manual deploy if needed"
echo "=========================================="