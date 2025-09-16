#!/bin/bash

# Render Setup Script for Development Environment
# This script helps set up environment variables on Render

RENDER_API_KEY="rnd_mYUAytWRkb2Pj5GJROqNYubYt25J"

echo "========================================"
echo "Render Development Environment Setup"
echo "Target: sentia-manufacturing-development.onrender.com"
echo "========================================"

# First, check if service exists and get its ID
echo ""
echo "[1/3] Checking for existing service..."

SERVICE_ID=$(curl -s -H "Authorization: Bearer $RENDER_API_KEY" \
  https://api.render.com/v1/services?limit=20 | \
  jq -r '.[] | select(.name=="sentia-manufacturing-development") | .id')

if [ -z "$SERVICE_ID" ]; then
  echo "Service 'sentia-manufacturing-development' not found."
  echo ""
  echo "Please create the service first through Render Dashboard:"
  echo "1. Go to https://dashboard.render.com"
  echo "2. Click 'New +' -> 'Web Service'"
  echo "3. Connect GitHub repo: The-social-drink-company/sentia-manufacturing-dashboard"
  echo "4. Select 'development' branch"
  echo "5. Name it: sentia-manufacturing-development"
  echo ""
  exit 1
fi

echo "Service found with ID: $SERVICE_ID"

# Update environment variables
echo ""
echo "[2/3] Updating environment variables..."

# Read variables from render-vars-DEVELOPMENT.txt and update them
while IFS='=' read -r key value; do
  # Skip empty lines and comments
  [[ -z "$key" || "$key" == \#* ]] && continue

  # Remove BOM if present
  key=$(echo "$key" | sed 's/^\xEF\xBB\xBF//')

  echo "Setting $key..."

  curl -s -X PUT \
    -H "Authorization: Bearer $RENDER_API_KEY" \
    -H "Content-Type: application/json" \
    "https://api.render.com/v1/services/$SERVICE_ID/env-vars/$key" \
    -d "{\"value\": \"$value\"}" > /dev/null 2>&1

done < render-vars-DEVELOPMENT.txt

echo ""
echo "[3/3] Triggering deployment..."

# Trigger a new deployment
DEPLOY_ID=$(curl -s -X POST \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  "https://api.render.com/v1/services/$SERVICE_ID/deploys" \
  -d '{"clearCache": "do_not_clear"}' | jq -r '.id')

if [ ! -z "$DEPLOY_ID" ]; then
  echo "Deployment triggered successfully!"
  echo "Deploy ID: $DEPLOY_ID"
  echo "Monitor at: https://dashboard.render.com/web/$SERVICE_ID/deploys/$DEPLOY_ID"
else
  echo "Failed to trigger deployment"
fi

echo ""
echo "========================================"
echo "Setup Complete!"
echo "========================================"
echo "Development URL: https://sentia-manufacturing-development.onrender.com"
echo "Health Check: https://sentia-manufacturing-development.onrender.com/health"
echo "Dashboard: https://dashboard.render.com"