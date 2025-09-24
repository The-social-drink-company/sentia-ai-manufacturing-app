#!/bin/bash
# Post-Deployment Health Check Script for All Environments
# Runs comprehensive health checks on all three Render environments

echo "========================================="
echo "Render Post-Deployment Health Check"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Environment URLs
DEV_URL="https://sentia-manufacturing-development.onrender.com"
TEST_URL="https://sentia-manufacturing-testing.onrender.com"
PROD_URL="https://sentia-manufacturing-production.onrender.com"

# Function to check endpoint
check_endpoint() {
    local url=$1
    local endpoint=$2
    local full_url="${url}${endpoint}"

    response=$(curl -s -o /dev/null -w "%{http_code}" "$full_url")

    if [ "$response" -eq 200 ] || [ "$response" -eq 201 ]; then
        echo -e "  ${GREEN}✓${NC} ${endpoint}: OK (${response})"
        return 0
    else
        echo -e "  ${RED}✗${NC} ${endpoint}: Failed (${response})"
        return 1
    fi
}

# Function to check environment
check_environment() {
    local env_name=$1
    local env_url=$2

    echo -e "${BLUE}Checking ${env_name} Environment${NC}"
    echo "URL: ${env_url}"
    echo ""

    local all_good=true

    # Check health endpoint
    echo "Health Endpoints:"
    check_endpoint "$env_url" "/health" || all_good=false
    check_endpoint "$env_url" "/api/health/database" || all_good=false

    # Check API endpoints
    echo ""
    echo "API Endpoints:"
    check_endpoint "$env_url" "/api/integrations/status" || all_good=false
    check_endpoint "$env_url" "/api/auth/status" || all_good=false
    check_endpoint "$env_url" "/api/mcp/health" || all_good=false

    # Check frontend
    echo ""
    echo "Frontend:"
    check_endpoint "$env_url" "/" || all_good=false

    # Summary for this environment
    echo ""
    if [ "$all_good" = true ]; then
        echo -e "${GREEN}✓ ${env_name} is HEALTHY${NC}"
    else
        echo -e "${YELLOW}⚠ ${env_name} has issues${NC}"
    fi

    echo "========================================="
    echo ""
}

# Function to check database migration status
check_database_migration() {
    echo -e "${BLUE}Database Migration Status${NC}"
    echo ""

    # Check if Neon is still accessible (for comparison)
    NEON_URL="postgresql://neondb_owner:npg_2wXVD9gdintm@ep-aged-dust-abpyip0r-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require"

    echo "Checking Neon database (old)..."
    if psql "$NEON_URL" -c "SELECT COUNT(*) FROM information_schema.tables;" > /dev/null 2>&1; then
        echo -e "  ${YELLOW}⚠${NC} Neon database still active (remember to cancel after migration)"
    else
        echo -e "  ${GREEN}✓${NC} Neon database not accessible (possibly already migrated)"
    fi

    echo ""
    echo "Note: Check Render Dashboard for new database connection status"
    echo "========================================="
    echo ""
}

# Main execution
echo -e "${BLUE}Starting comprehensive health check...${NC}"
echo ""

# Check each environment
check_environment "DEVELOPMENT" "$DEV_URL"
check_environment "TESTING" "$TEST_URL"
check_environment "PRODUCTION" "$PROD_URL"

# Check database migration
check_database_migration

# Final summary
echo -e "${BLUE}HEALTH CHECK SUMMARY${NC}"
echo "========================================="

# Count healthy environments
healthy_count=0

# Quick check for each environment
for env_url in "$DEV_URL" "$TEST_URL" "$PROD_URL"; do
    if curl -s -o /dev/null -w "%{http_code}" "${env_url}/health" | grep -q "200"; then
        ((healthy_count++))
    fi
done

echo "Healthy Environments: ${healthy_count}/3"

if [ "$healthy_count" -eq 3 ]; then
    echo -e "${GREEN}✓ All environments are operational!${NC}"
    echo -e "${GREEN}You can proceed with canceling Neon subscription.${NC}"
elif [ "$healthy_count" -gt 0 ]; then
    echo -e "${YELLOW}⚠ Some environments need attention.${NC}"
    echo "Please check the logs above for details."
else
    echo -e "${RED}✗ No environments are responding.${NC}"
    echo "Please check your Render deployment status."
fi

echo "========================================="
echo ""
echo "Run 'npm run render:verify' for detailed verification"
echo "Run 'npm run render:validate' to check environment variables"