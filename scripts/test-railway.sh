#!/bin/bash

# Railway Deployment Test Script
echo "========================================="
echo "Railway Deployment Test"
echo "========================================="
echo ""

BASE_URL="https://sentiadeploy.financeflo.ai"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo "Testing endpoints at $BASE_URL"
echo ""

# Test health endpoint
echo -n "Testing /health endpoint... "
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/health" 2>/dev/null)
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
BODY=$(echo "$HEALTH_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC} (Status: $HTTP_CODE)"
    echo "Response: $BODY" | head -c 100
    echo ""
elif [ "$HTTP_CODE" = "502" ]; then
    echo -e "${RED}✗ 502 Bad Gateway${NC}"
    echo -e "${YELLOW}→ Environment variables not configured in Railway${NC}"
else
    echo -e "${RED}✗ FAIL${NC} (Status: $HTTP_CODE)"
fi

echo ""

# Test API health endpoint
echo -n "Testing /api/health endpoint... "
API_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/health" 2>/dev/null)
API_CODE=$(echo "$API_RESPONSE" | tail -n1)

if [ "$API_CODE" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC} (Status: $API_CODE)"
elif [ "$API_CODE" = "502" ]; then
    echo -e "${RED}✗ 502 Bad Gateway${NC}"
else
    echo -e "${RED}✗ FAIL${NC} (Status: $API_CODE)"
fi

echo ""

# Test main application
echo -n "Testing main application... "
MAIN_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" 2>/dev/null)

if [ "$MAIN_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC} (Status: $MAIN_RESPONSE)"
elif [ "$MAIN_RESPONSE" = "502" ]; then
    echo -e "${RED}✗ 502 Bad Gateway${NC}"
else
    echo -e "${RED}✗ FAIL${NC} (Status: $MAIN_RESPONSE)"
fi

echo ""
echo "========================================="

if [ "$HTTP_CODE" = "502" ] || [ "$API_CODE" = "502" ] || [ "$MAIN_RESPONSE" = "502" ]; then
    echo -e "${RED}✗ DEPLOYMENT NEEDS CONFIGURATION${NC}"
    echo ""
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "1. Go to Railway Dashboard Variables section:"
    echo -e "${CYAN}https://railway.app/project/6d1ca9b2-75e2-46c6-86a8-ed05161112fe/service/e985e174-ebed-4043-81f8-7b1ab2e86cd2/settings${NC}"
    echo ""
    echo "2. Copy all variables from: RAILWAY_ENV_COPY_PASTE.txt"
    echo ""
    echo "3. Paste into Railway's Raw Editor"
    echo ""
    echo "4. Click Deploy to trigger redeployment"
elif [ "$HTTP_CODE" = "200" ] && [ "$API_CODE" = "200" ] && [ "$MAIN_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ DEPLOYMENT SUCCESSFUL!${NC}"
    echo ""
    echo "Your application is live at:"
    echo -e "${CYAN}$BASE_URL${NC}"
else
    echo -e "${YELLOW}⚠ PARTIAL SUCCESS${NC}"
    echo "Some endpoints are not responding correctly."
    echo "Check Railway logs for details."
fi

echo "========================================="