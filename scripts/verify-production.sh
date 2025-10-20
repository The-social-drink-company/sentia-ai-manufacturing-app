#!/bin/bash

# Production Verification Script for CapLiquify Manufacturing Platform
# This script verifies that production deployment is working correctly
# Usage: ./scripts/verify-production.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEV_URL="https://sentia-manufacturing-development.onrender.com"
PROD_URL="https://sentia-manufacturing-production.onrender.com"
MCP_URL="https://mcp-server-tkyu.onrender.com"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE} CapLiquify Manufacturing Platform${NC}"
echo -e "${BLUE} Production Verification Script${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Function to test endpoint
test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_code="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -n "Testing $name... "
    
    # Make request and capture response code
    response_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" --max-time 10)
    
    if [ "$response_code" = "$expected_code" ]; then
        echo -e "${GREEN}PASS${NC} (HTTP $response_code)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}FAIL${NC} (Expected $expected_code, got $response_code)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Function to check response content
check_content() {
    local name="$1"
    local url="$2"
    local search_string="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -n "Checking $name... "
    
    # Fetch content and search for string
    if curl -s "$url" --max-time 10 | grep -q "$search_string"; then
        echo -e "${GREEN}PASS${NC} (Found: $search_string)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}FAIL${NC} (Not found: $search_string)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Function to measure response time
check_performance() {
    local name="$1"
    local url="$2"
    local max_time="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -n "Performance $name... "
    
    # Measure total time
    response_time=$(curl -s -o /dev/null -w "%{time_total}" "$url" --max-time 10)
    response_ms=$(echo "$response_time * 1000" | bc | cut -d'.' -f1)
    
    if [ "$response_ms" -lt "$max_time" ]; then
        echo -e "${GREEN}PASS${NC} (${response_ms}ms < ${max_time}ms)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${YELLOW}SLOW${NC} (${response_ms}ms > ${max_time}ms)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

echo -e "${YELLOW}1. Health Check Tests${NC}"
echo "=============================="
test_endpoint "Development Health" "$DEV_URL/health" "200"
test_endpoint "Production Health" "$PROD_URL/health" "200"
test_endpoint "MCP Server Health" "$MCP_URL/health" "200"
echo ""

echo -e "${YELLOW}2. API Endpoint Tests${NC}"
echo "=============================="
test_endpoint "Dev API Status" "$DEV_URL/api/status" "200"
test_endpoint "Prod API Status" "$PROD_URL/api/status" "200"
echo ""

echo -e "${YELLOW}3. Page Load Tests${NC}"
echo "=============================="
test_endpoint "Development Homepage" "$DEV_URL" "200"
test_endpoint "Production Homepage" "$PROD_URL" "200"
test_endpoint "Dev Dashboard" "$DEV_URL/dashboard" "200"
test_endpoint "Prod Dashboard" "$PROD_URL/dashboard" "200"
echo ""

echo -e "${YELLOW}4. Feature Page Tests${NC}"
echo "=============================="
test_endpoint "Working Capital (Dev)" "$DEV_URL/working-capital" "200"
test_endpoint "Working Capital (Prod)" "$PROD_URL/working-capital" "200"
test_endpoint "What-If Analysis (Dev)" "$DEV_URL/what-if" "200"
test_endpoint "What-If Analysis (Prod)" "$PROD_URL/what-if" "200"
echo ""

echo -e "${YELLOW}5. Authentication Tests${NC}"
echo "=============================="
check_content "Clerk Key (Dev)" "$DEV_URL" "pk_live_"
check_content "Clerk Key (Prod)" "$PROD_URL" "pk_live_"
check_content "Sign In Link (Dev)" "$DEV_URL" "sign-in"
check_content "Sign In Link (Prod)" "$PROD_URL" "sign-in"
echo ""

echo -e "${YELLOW}6. Performance Tests${NC}"
echo "=============================="
check_performance "Dev Homepage" "$DEV_URL" "3000"
check_performance "Prod Homepage" "$PROD_URL" "3000"
check_performance "Dev API" "$DEV_URL/api/status" "1000"
check_performance "Prod API" "$PROD_URL/api/status" "1000"
echo ""

echo -e "${YELLOW}7. Static Asset Tests${NC}"
echo "=============================="
test_endpoint "Dev JavaScript" "$DEV_URL/js/index.js" "200"
test_endpoint "Prod JavaScript" "$PROD_URL/js/index.js" "200"
test_endpoint "Dev CSS" "$DEV_URL/js/index.css" "200"
test_endpoint "Prod CSS" "$PROD_URL/js/index.css" "200"
echo ""

echo -e "${YELLOW}8. Error Handling Tests${NC}"
echo "=============================="
test_endpoint "404 Page (Dev)" "$DEV_URL/non-existent-page" "404"
test_endpoint "404 Page (Prod)" "$PROD_URL/non-existent-page" "404"
echo ""

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE} TEST SUMMARY${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}ALL TESTS PASSED!${NC} Production deployment verified successfully."
    exit 0
else
    echo -e "\n${RED}$FAILED_TESTS TESTS FAILED!${NC} Please review the failures above."
    exit 1
fi