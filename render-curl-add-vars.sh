#!/bin/bash
# Render API Environment Variables Setup using curl
# Uses proper PATCH method for updating environment variables

echo "================================================"
echo "   RENDER ENVIRONMENT VARIABLES SETUP"
echo "================================================"

RENDER_API_KEY="rnd_mYUAytWRkb2Pj5GJROqNYubYt25J"

# Service IDs
DEV_SERVICE="srv-d344tve3jp1c73fips80"
TEST_SERVICE="srv-d344tve3jp1c73fips90"
PROD_SERVICE="srv-d344tve3jp1c73fips7g"

# Function to update environment variables for a service
update_env_vars() {
    local SERVICE_ID=$1
    local SERVICE_NAME=$2
    local NODE_ENV_VALUE=$3
    
    echo ""
    echo "Updating $SERVICE_NAME environment variables..."
    
    # Create JSON payload with all variables
    cat > /tmp/render_vars.json <<EOF
[
  {"key": "NODE_ENV", "value": "$NODE_ENV_VALUE"},
  {"key": "PORT", "value": "3000"},
  {"key": "DATABASE_URL", "value": "postgresql://neondb_owner:npg_2wXVD9gdintm@ep-damp-wave-abxu46so-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require"},
  {"key": "VITE_CLERK_PUBLISHABLE_KEY", "value": "pk_test_Y2hhbXBpb24tYnVsbGRvZy05Mi5jbGVyay5hY2NvdW50cy5kZXYk"},
  {"key": "CLERK_SECRET_KEY", "value": "sk_test_EP6iF7prGbq73CscUPCOW8PAKol4pPaBG5iYdsDodq"},
  {"key": "CLERK_WEBHOOK_SECRET", "value": "whsec_iTUcbgzS5P6zJlXWQkc4zGHnw8yLGt9j"},
  {"key": "XERO_CLIENT_ID", "value": "9C0CAB921C134476A249E48BBECB8C4B"},
  {"key": "XERO_CLIENT_SECRET", "value": "f0TJpJSRX_B9NI51sknz7TuKbbSfhO4dEhTM4m4fWBlph9F5"},
  {"key": "XERO_REDIRECT_URI", "value": "https://sentia-manufacturing-dashboard.onrender.com/api/xero/callback"},
  {"key": "SHOPIFY_UK_API_KEY", "value": "7a30cd84e7a106b852c8e0fb789de10e"},
  {"key": "SHOPIFY_UK_SECRET", "value": "8b2d61745c506970c70d8c892f5f977e"},
  {"key": "SHOPIFY_UK_ACCESS_TOKEN", "value": "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"},
  {"key": "SHOPIFY_UK_SHOP_URL", "value": "sentiaspirits.myshopify.com"},
  {"key": "SHOPIFY_USA_API_KEY", "value": "83b8903fd8b509ef8bf93d1dbcd6079c"},
  {"key": "SHOPIFY_USA_SECRET", "value": "d01260e58adb00198cddddd1bd9a9490"},
  {"key": "SHOPIFY_USA_ACCESS_TOKEN", "value": "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"},
  {"key": "SHOPIFY_USA_SHOP_URL", "value": "us-sentiaspirits.myshopify.com"},
  {"key": "AMAZON_UK_MARKETPLACE_ID", "value": "A1F83G8C2ARO7P"},
  {"key": "AMAZON_USA_MARKETPLACE_ID", "value": "ATVPDKIKX0DER"},
  {"key": "UNLEASHED_API_ID", "value": "d5313df6-db35-430c-a69e-ae27dffe0c5a"},
  {"key": "UNLEASHED_API_KEY", "value": "2bJcHlDhIV04ScdqT60c3zlnG7hOER7aoPSh2IF2hWQluOi7ZaGkeu4SGeseYexAqOGfcRmyl9c6QYueJHyQ=="},
  {"key": "UNLEASHED_API_URL", "value": "https://api.unleashedsoftware.com"},
  {"key": "OPENAI_API_KEY", "value": "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"},
  {"key": "ANTHROPIC_API_KEY", "value": "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"},
  {"key": "MICROSOFT_CLIENT_ID", "value": "c16d6fba-0e6b-45ea-a016-eb697ff7a7ae"},
  {"key": "MICROSOFT_CLIENT_SECRET", "value": "peI8Q~4QJG.ax3ekxtWrv.PXVENVQ3vw_Br1qayM"},
  {"key": "MICROSOFT_TENANT_ID", "value": "common"},
  {"key": "MICROSOFT_ADMIN_EMAIL", "value": "admin@app.sentiaspirits.com"},
  {"key": "MICROSOFT_DATA_EMAIL", "value": "data@app.sentiaspirits.com"},
  {"key": "MCP_SERVER_URL", "value": "https://sentia-mcp-server.onrender.com"},
  {"key": "MCP_ENABLE_WEBSOCKET", "value": "true"},
  {"key": "MCP_SERVER_PORT", "value": "3001"},
  {"key": "AUTO_SYNC_ENABLED", "value": "true"},
  {"key": "XERO_SYNC_INTERVAL", "value": "*/30 * * * *"},
  {"key": "SHOPIFY_SYNC_INTERVAL", "value": "*/15 * * * *"},
  {"key": "AMAZON_SYNC_INTERVAL", "value": "*/60 * * * *"},
  {"key": "DATABASE_SYNC_INTERVAL", "value": "0 */6 * * *"},
  {"key": "LOG_LEVEL", "value": "info"},
  {"key": "ENABLE_AUTONOMOUS_TESTING", "value": "false"},
  {"key": "AUTO_FIX_ENABLED", "value": "false"},
  {"key": "AUTO_DEPLOY_ENABLED", "value": "false"},
  {"key": "VITE_API_BASE_URL", "value": "https://sentia-manufacturing-dashboard.onrender.com/api"},
  {"key": "VITE_APP_TITLE", "value": "Sentia Manufacturing Dashboard"},
  {"key": "VITE_APP_VERSION", "value": "1.0.0"},
  {"key": "CORS_ORIGINS", "value": "https://sentia-manufacturing-dashboard.onrender.com"}
]
EOF
    
    # Use PATCH method to update environment variables
    curl -X PATCH "https://api.render.com/v1/services/$SERVICE_ID/env-vars" \
        -H "Authorization: Bearer $RENDER_API_KEY" \
        -H "Content-Type: application/json" \
        -d @/tmp/render_vars.json
    
    echo ""
    echo "$SERVICE_NAME environment variables updated!"
}

# Update each environment
update_env_vars "$DEV_SERVICE" "Development" "development"
update_env_vars "$TEST_SERVICE" "Testing" "test"
update_env_vars "$PROD_SERVICE" "Production" "production"

echo ""
echo "================================================"
echo "   ALL ENVIRONMENT VARIABLES CONFIGURED"
echo "================================================"
echo ""
echo "Services will be available at:"
echo "  Development: https://sentia-manufacturing-development.onrender.com"
echo "  Testing: https://sentia-manufacturing-testing.onrender.com"
echo "  Production: https://sentia-manufacturing-production.onrender.com"
echo ""
echo "Please allow 5-10 minutes for deployments to complete."