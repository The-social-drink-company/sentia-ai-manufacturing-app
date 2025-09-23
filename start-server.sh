#!/bin/bash
# ENTERPRISE DEPLOYMENT - NO FALLBACKS, NO COMPROMISES

echo "=================================================="
echo "SENTIA MANUFACTURING ENTERPRISE DEPLOYMENT"
echo "=================================================="
echo "Date: $(date)"
echo "Environment: $NODE_ENV"
echo "Branch: $BRANCH"
echo "Port: $PORT"
echo "Database: sentia-db-$BRANCH"
echo "=================================================="

# ONLY the comprehensive enterprise application is acceptable
if [ ! -f "server-integrated-mcp.js" ]; then
    echo "❌ ERROR: Enterprise server (server-integrated-mcp.js) not found!"
    echo "This deployment requires the full enterprise application."
    echo "No fallbacks or emergency fixes are acceptable."
    exit 1
fi

echo "✅ Starting COMPREHENSIVE ENTERPRISE APPLICATION"
echo "Features:"
echo "  • Full MCP AI Integration"
echo "  • PostgreSQL Database (sentia-db-$BRANCH)"
echo "  • All External API Integrations"
echo "  • Complete Authentication System"
echo "  • Enterprise-grade Security"
echo "  • Real-time Analytics"
echo "=================================================="

# Start the enterprise server - no alternatives
exec node server-integrated-mcp.js