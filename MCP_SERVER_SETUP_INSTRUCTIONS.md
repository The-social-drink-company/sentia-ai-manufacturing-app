# MCP Server Setup Instructions for Render

## Overview
The MCP Server (AI Central Nervous System) has been configured for deployment on Render with all necessary environment variables and API integrations.

## Deployment Status
- **Service ID**: srv-d34fefur433s73cifuv0
- **URL**: https://mcp-server-tkyu.onrender.com
- **Branch**: development
- **Status**: Deployment triggered (check Render dashboard for progress)

## Configuration Completed

### 1. render.yaml Configuration ✅
Added complete MCP server configuration to render.yaml with:
- All AI provider keys (Anthropic, OpenAI)
- Xero integration credentials
- Unleashed ERP credentials
- Shopify multi-store configurations
- Amazon SP-API placeholders
- Database connection from shared Render PostgreSQL
- CORS origins for all environments

### 2. Bug Fix Applied ✅
Fixed syntax error in `mcp-server/api-integrations/xero-integration.js`:
- Added missing `async` keyword to `verifyWebhookSignature` method
- This was causing deployment failures with "SyntaxError: Unexpected reserved word"

### 3. Environment Variables Setup Script ✅
Created `scripts/setup-mcp-render-env.sh` for manual CLI configuration if needed.

## Required Manual Actions

### 1. Verify Deployment
Check the Render dashboard to ensure deployment completes successfully:
1. Go to https://dashboard.render.com
2. Navigate to the mcp-server service
3. Check deployment logs for any errors

### 2. Set Sensitive Variables (if not in render.yaml)
Some variables marked as `sync: false` need manual configuration:
- `XERO_TENANT_ID` - Get from Xero after OAuth connection
- `AMAZON_SP_API_CLIENT_ID` - Amazon Selling Partner credentials
- `AMAZON_SP_API_CLIENT_SECRET`
- `AMAZON_SP_API_REFRESH_TOKEN`
- `AMAZON_SELLER_ID`

### 3. Test MCP Server Health
Once deployed, verify the server is running:
```bash
curl https://mcp-server-tkyu.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "2.0.0-enterprise-simple",
  "timestamp": "...",
  "services": {
    "ai": "connected",
    "database": "connected",
    "xero": "configured"
  }
}
```

## Environment Variables Reference

### Critical (Required for Operation)
- `ANTHROPIC_API_KEY` ✅ Set in render.yaml
- `OPENAI_API_KEY` ✅ Set in render.yaml
- `DATABASE_URL` ✅ Auto-configured from Render PostgreSQL
- `JWT_SECRET` ✅ Auto-generated
- `CORS_ORIGINS` ✅ Set for all environments

### API Integrations (Configured)
- Xero: ✅ All credentials set
- Unleashed: ✅ All credentials set
- Shopify UK: ✅ All credentials set
- Shopify USA: ✅ All credentials set
- Microsoft Graph: ✅ All credentials set
- Clerk Auth: ✅ Shared with main app

### Optional Services
- Google AI API Key (not set - optional)
- Amazon SP-API (placeholders only)
- Local LLM endpoint (not configured)

## Troubleshooting

### If deployment fails:
1. Check logs in Render dashboard
2. Verify all required environment variables are set
3. Ensure the fix for xero-integration.js is deployed

### If API connections fail:
1. Verify CORS_ORIGINS includes your frontend URLs
2. Check API keys are valid and not expired
3. Ensure DATABASE_URL is correctly configured

### Common Issues:
- **Port binding**: Render auto-assigns PORT, don't override
- **Build failures**: Check npm dependencies in mcp-server/package.json
- **Syntax errors**: Ensure all async functions are properly declared

## Next Steps
1. Monitor deployment progress in Render dashboard
2. Once deployed, test all API endpoints
3. Integrate MCP server URL with main application
4. Test AI features and manufacturing intelligence

## Deploy Hook
To trigger manual deployment:
```bash
curl -X POST "https://api.render.com/deploy/srv-d34fefur433s73cifuv0?key=ANE5o0AJZjg"
```

## Support
For issues, check:
- Render deployment logs
- MCP server logs at `/logs/enterprise-mcp.log`
- Main application integration at MCP_SERVER_URL endpoints