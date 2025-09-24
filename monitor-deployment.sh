#!/bin/bash

echo "=========================================="
echo "MONITORING RENDER DEPLOYMENT STATUS"
echo "=========================================="
echo ""
echo "Git push completed at: $(date)"
echo "Deployment usually takes 2-5 minutes"
echo ""

# Function to check endpoint
check_endpoint() {
    local url=$1
    local name=$2
    echo -n "Checking $name: "

    # Get HTTP status code
    status=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)

    if [ "$status" == "200" ]; then
        echo "✅ OK (200)"
        # Try to get JSON response
        response=$(curl -s "$url" 2>/dev/null | head -1)
        if [[ $response == *"{"* ]]; then
            echo "  Response: $response"
        fi
    elif [ "$status" == "502" ]; then
        echo "❌ Bad Gateway (502) - Server not ready yet"
    else
        echo "⚠️  Status: $status"
    fi
}

echo "Monitoring every 30 seconds (Ctrl+C to stop)..."
echo "=========================================="

while true; do
    echo ""
    echo "Check at: $(date '+%H:%M:%S')"
    echo "---"
    check_endpoint "https://sentia-manufacturing-production.onrender.com/health" "Production"
    check_endpoint "https://sentia-manufacturing-development.onrender.com/health" "Development"
    check_endpoint "https://mcp-server-tkyu.onrender.com/health" "MCP Server"

    echo ""
    echo "Waiting 30 seconds... (Ctrl+C to stop)"
    sleep 30
done