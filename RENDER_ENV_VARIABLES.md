# Render Environment Variables Setup

## Required Environment Variables for Render Deployment

Copy and paste these environment variables into your Render dashboard:
1. Go to your Render service dashboard
2. Navigate to "Environment" tab
3. Add each variable below
4. Click "Save Changes"
5. Render will automatically redeploy with the new variables

## Core Application Variables

```bash
# Node Environment
NODE_ENV=production

# Application URLs
RENDER_EXTERNAL_URL=https://sentia-manufacturing-development.onrender.com
VITE_API_BASE_URL=https://sentia-manufacturing-development.onrender.com/api

# Authentication (Clerk)
CLERK_SECRET_KEY=sk_test_EP6iF7prGbq73CscUPCOW8PAKol4pPaBG5iYdsDodq
VITE_CLERK_PUBLISHABLE_KEY=pk_test_Y2hhbXBpb24tYnVsbGRvZy05Mi5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_WEBHOOK_SECRET=whsec_Wo9P2o1EvXcxuvu1XNTqV+ICP32nB88c
```

## Database Configuration

```bash
# PostgreSQL Database (Auto-configured by Render PostgreSQL)
# DATABASE_URL will be automatically set by Render when you attach a PostgreSQL database
# No need to manually set DATABASE_URL

# Redis Cache (Optional - attach Render Redis if needed)
# REDIS_URL will be automatically set by Render when you attach a Redis instance
```

## Shopify Integration

```bash
# Primary Shopify Store
SHOPIFY_API_KEY=7a30cd84e7a106b852c8e0fb789de10e
SHOPIFY_API_SECRET=8b2d61745c506970c70d8c892f5f977e
SHOPIFY_ACCESS_TOKEN=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
SHOPIFY_SHOP_DOMAIN=sentiaspirits.myshopify.com
SHOPIFY_SHOP_URL=sentiaspirits.myshopify.com
SHOPIFY_APP_URL=https://sentia-manufacturing-development.onrender.com

# UK Shopify Store
SHOPIFY_UK_API_KEY=7a30cd84e7a106b852c8e0fb789de10e
SHOPIFY_UK_SECRET=8b2d61745c506970c70d8c892f5f977e
SHOPIFY_UK_ACCESS_TOKEN=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
SHOPIFY_UK_SHOP_URL=sentiaspirits.myshopify.com

# USA Shopify Store
SHOPIFY_USA_API_KEY=83b8903fd8b509ef8bf93d1dbcd6079c
SHOPIFY_USA_SECRET=d01260e58adb00198cddddd1bd9a9490
SHOPIFY_USA_ACCESS_TOKEN=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
SHOPIFY_USA_SHOP_URL=us-sentiaspirits.myshopify.com

# EU Shopify Store (Update with actual credentials when available)
SHOPIFY_EU_API_KEY=your-shopify-eu-api-key
SHOPIFY_EU_SECRET=your-shopify-eu-secret
SHOPIFY_EU_ACCESS_TOKEN=your-shopify-eu-access-token
SHOPIFY_EU_SHOP_URL=your-eu-store.myshopify.com
```

## Amazon SP-API Integration

```bash
# Amazon Seller Partner API Credentials
# IMPORTANT: Replace these placeholder values with your actual Amazon SP-API credentials
AMAZON_SP_API_CLIENT_ID=your-amazon-client-id
AMAZON_SP_API_CLIENT_SECRET=your-amazon-client-secret
AMAZON_SP_API_REFRESH_TOKEN=your-amazon-refresh-token
AMAZON_SP_API_ACCESS_TOKEN=your-amazon-access-token
AMAZON_ROLE_ARN=arn:aws:iam::your-account-id:role/your-role-name
AMAZON_REGION=na

# Amazon Marketplace IDs
AMAZON_UK_MARKETPLACE_ID=A1F83G8C2ARO7P
AMAZON_USA_MARKETPLACE_ID=ATVPDKIKX0DER
AMAZON_DEFAULT_MARKETPLACE=uk

# Warehouse Information (for FBA shipments)
WAREHOUSE_NAME=Sentia Manufacturing Warehouse
WAREHOUSE_ADDRESS=Your Warehouse Address
WAREHOUSE_CITY=Your City
WAREHOUSE_STATE=Your State
WAREHOUSE_COUNTRY=GB
WAREHOUSE_POSTAL=Your Postal Code
```

## Xero Integration

```bash
# Xero API Credentials
XERO_CLIENT_ID=9C0CAB921C134476A249E48BBECB8C4B
XERO_CLIENT_SECRET=f0TJpJSRX_B9NI51sknz7TuKbbSfhO4dEhTM4m4fWBlph9F5
XERO_REDIRECT_URI=https://sentia-manufacturing-development.onrender.com/api/xero/callback
```

## Unleashed ERP Integration

```bash
# Unleashed API Credentials
UNLEASHED_API_ID=d5313df6-db35-430c-a69e-ae27dffe0c5a
UNLEASHED_API_KEY=2bJcHlDhIV04ScdqT60c3zlnG7hOER7aoPSh2IF2hWQluOi7ZaGkeu4SGeseYexAqOGfcRmyl9c6QYueJHyQ==
UNLEASHED_API_URL=https://api.unleashedsoftware.com
```

## Microsoft Graph API (Optional)

```bash
# Microsoft Integration (for Excel/SharePoint data)
MICROSOFT_CLIENT_ID=c16d6fba-0e6b-45ea-a016-eb697ff7a7ae
MICROSOFT_CLIENT_SECRET=peI8Q~4QJG.ax3ekxtWrv.PXVENVQ3vw_Br1qayM
MICROSOFT_TENANT_ID=common
MICROSOFT_USER_EMAIL=data@app.sentiaspirits.com
```

## AI/ML Services

```bash
# OpenAI API (for AI features)
OPENAI_API_KEY=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

# Anthropic Claude API (for AI features)
ANTHROPIC_API_KEY=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
CLAUDE_API_KEY=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

# Google AI (Optional)
GOOGLE_AI_API_KEY=your-google-ai-api-key
```

## MCP Server Configuration

```bash
# MCP Server Settings
MCP_SERVER_URL=https://mcp-server-tkyu.onrender.com
VITE_MCP_SERVER_URL=https://mcp-server-tkyu.onrender.com
MCP_PROJECT_ID=3adb1ac4-84d8-473b-885f-3a9790fe6140
MCP_SERVER_ID=mcp-server-tkyu
MCP_WEBSOCKET_URL=wss://mcp-server-tkyu.onrender.com
VITE_MCP_WEBSOCKET_URL=wss://mcp-server-tkyu.onrender.com
MCP_SERVER_VERIFIED=true
```

## Feature Flags

```bash
# Feature Toggles
ENABLE_AI_FEATURES=true
ENABLE_REAL_TIME_STREAMING=true
ENABLE_AUTONOMOUS_MONITORING=true
ENABLE_BUSINESS_INTELLIGENCE=true
ENABLE_AUTONOMOUS_TESTING=false
AUTO_FIX_ENABLED=false
AUTO_DEPLOY_ENABLED=false
VITE_USE_MOCK_DATA=false
```

## Security & Performance

```bash
# CORS Configuration
CORS_ORIGINS=https://sentia-manufacturing-development.onrender.com,https://sentia-manufacturing-testing.onrender.com,https://sentia-manufacturing-production.onrender.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Session Configuration
SESSION_SECRET=your-secure-session-secret-key-here
JWT_SECRET=your-secure-jwt-secret-key-here

# Vector Database Configuration (for AI features)
VECTOR_DIMENSIONS=1536
VECTOR_INDEX_TYPE=ivfflat
VECTOR_SIMILARITY_THRESHOLD=0.7
```

## Deployment Instructions

### Step 1: Add Environment Variables
1. Go to your Render service dashboard
2. Click on "Environment" in the left sidebar
3. Click "Add Environment Variable"
4. Add each variable from above (copy the name and value)
5. Click "Save Changes"

### Step 2: Update Amazon SP-API Credentials
**IMPORTANT**: The Amazon SP-API variables above are placeholders. You need to:
1. Register your app with Amazon Seller Central
2. Get your Client ID and Client Secret from the Amazon Developer Console
3. Generate a refresh token using Amazon's authorization workflow
4. Replace the placeholder values with your actual credentials

### Step 3: Verify Shopify Credentials
The Shopify credentials provided appear to be real. Please verify:
1. Access tokens are still valid
2. API keys match your Shopify app registration
3. Shop domains are correct

### Step 4: Restart Service
After adding all environment variables:
1. Click "Manual Deploy" > "Deploy latest commit"
2. Or wait for automatic deployment (if auto-deploy is enabled)
3. Monitor the deployment logs for any errors

## Testing the Integration

After deployment, test your integrations:

```bash
# Test Shopify Integration
curl https://sentia-manufacturing-development.onrender.com/api/shopify/products

# Test Amazon Integration
curl https://sentia-manufacturing-development.onrender.com/api/amazon/inventory?marketplace=uk

# Test Overall Health
curl https://sentia-manufacturing-development.onrender.com/api/health
```

## Troubleshooting

### Common Issues and Solutions

1. **"API endpoint not found" errors**
   - Ensure the server has restarted after adding environment variables
   - Check deployment logs for startup errors

2. **Authentication failures**
   - Verify all API keys and secrets are correct
   - Check that tokens haven't expired

3. **Database connection issues**
   - Ensure DATABASE_URL is properly set by Render
   - Check PostgreSQL service is running

4. **CORS errors**
   - Update CORS_ORIGINS to include your frontend URL
   - Ensure proper headers are set in the application

## Security Notes

⚠️ **IMPORTANT SECURITY REMINDERS**:
- Never commit these environment variables to Git
- Rotate API keys regularly
- Use Render's secret management for sensitive values
- Enable 2FA on all service provider accounts
- Monitor API usage for unusual activity

## Support

For issues with specific integrations:
- **Shopify**: Check Shopify Partner Dashboard for API status
- **Amazon**: Review Amazon SP-API documentation and quotas
- **Xero**: Verify app permissions in Xero Developer Console
- **Unleashed**: Check API rate limits and subscription status

---

Last Updated: September 2025
Prepared for: Sentia Manufacturing Dashboard on Render