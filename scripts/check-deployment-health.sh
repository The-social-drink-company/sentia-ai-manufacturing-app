#!/bin/bash
# Deployment Health Check Script
# Usage: ./scripts/check-deployment-health.sh
# Purpose: Verify all Render services are operational
# Related: EPIC-DEPLOY-CRISIS

set -e

FRONTEND="https://sentia-frontend-prod.onrender.com"
BACKEND="https://sentia-backend-prod.onrender.com/api/health"
MCP="https://sentia-mcp-prod.onrender.com/health"

echo "🔍 Checking deployment health..."
echo ""

# Check Frontend
echo -n "Frontend: "
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND" --max-time 10)
if [ "$FRONTEND_STATUS" = "200" ]; then
  echo "✅ $FRONTEND_STATUS OK"
  FRONTEND_OK=1
else
  echo "❌ $FRONTEND_STATUS FAILED"
  FRONTEND_OK=0
fi

# Check Backend
echo -n "Backend:  "
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND" --max-time 10)
if [ "$BACKEND_STATUS" = "200" ]; then
  echo "✅ $BACKEND_STATUS OK"
  BACKEND_OK=1
else
  echo "❌ $BACKEND_STATUS FAILED"
  BACKEND_OK=0
fi

# Check MCP
echo -n "MCP:      "
MCP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$MCP" --max-time 10)
if [ "$MCP_STATUS" = "200" ]; then
  echo "✅ $MCP_STATUS OK"
  MCP_OK=1
else
  echo "❌ $MCP_STATUS FAILED"
  MCP_OK=0
fi

echo ""

# Calculate health percentage
TOTAL_OK=$((FRONTEND_OK + BACKEND_OK + MCP_OK))
HEALTH_PERCENT=$((TOTAL_OK * 100 / 3))

echo "📊 Deployment Health: $HEALTH_PERCENT% ($TOTAL_OK/3 services)"

if [ $TOTAL_OK -eq 3 ]; then
  echo "🎉 All services operational!"
  exit 0
else
  echo "⚠️  Some services are down. Check Render dashboard for details."
  exit 1
fi
