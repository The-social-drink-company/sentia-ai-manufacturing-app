#!/bin/bash

echo "=========================================="
echo "PRODUCTION FIX VERIFICATION"
echo "=========================================="
echo ""
echo "Timestamp: $(date)"
echo ""

# Check Git status
echo "1. GIT STATUS"
echo "-------------------------------------------"
git fetch origin production 2>/dev/null
local_commit=$(git rev-parse production)
remote_commit=$(git rev-parse origin/production)

if [ "$local_commit" = "$remote_commit" ]; then
    echo "✓ Production branch synced with origin"
else
    echo "✗ Production branch differs from origin"
fi

echo ""
echo "2. SERVICE STATUS"
echo "-------------------------------------------"

# Check production
prod_status=$(curl -s -o /dev/null -w "%{http_code}" https://sentia-manufacturing-production.onrender.com/health)
echo -n "Production: "
if [ "$prod_status" == "200" ]; then
    echo "✓ OK (200)"
elif [ "$prod_status" == "502" ]; then
    echo "✗ Bad Gateway (502) - NEEDS ENV VARS"
else
    echo "Status: $prod_status"
fi

# Check development
dev_status=$(curl -s -o /dev/null -w "%{http_code}" https://sentia-manufacturing-development.onrender.com/health)
echo -n "Development: "
if [ "$dev_status" == "200" ]; then
    echo "✓ OK (200)"
else
    echo "Status: $dev_status"
fi

# Check MCP
mcp_status=$(curl -s -o /dev/null -w "%{http_code}" https://mcp-server-tkyu.onrender.com/health)
echo -n "MCP Server: "
if [ "$mcp_status" == "200" ]; then
    echo "✓ OK (200)"
else
    echo "Status: $mcp_status"
fi

echo ""
echo "3. DIAGNOSIS"
echo "-------------------------------------------"

if [ "$prod_status" == "502" ]; then
    echo "ISSUE: Production returning 502"
    echo ""
    echo "REQUIRED ACTIONS:"
    echo "1. Open https://dashboard.render.com"
    echo "2. Go to sentia-manufacturing-production service"
    echo "3. Add these environment variables:"
    echo "   VITE_CLERK_PUBLISHABLE_KEY=pk_live_Y2xlcmsuZmluYW5jZWZsby5haSQ"
    echo "   CLERK_SECRET_KEY=sk_live_mzgSFm1q9VrzngMMaCTNNwPEqBmr75vVxiND1DO7wq"
    echo "   VITE_API_BASE_URL=https://sentia-manufacturing-production.onrender.com/api"
    echo "4. Click Save Changes"
    echo "5. Wait 2-5 minutes for deployment"
else
    echo "SUCCESS: Production is operational!"
fi
