# Render MCP Server Migration Guide

## Overview
This guide walks through migrating your MCP Server from Railway (ID: 99691282-de66-45b2-98cf-317083dd11ba) to Render.

## Key Differences: Railway vs Render

### Railway
- Single project with multiple services
- Environment-based deployments
- Built-in Nixpacks builder
- Railway-specific configuration (railway.json/toml)

### Render
- Each service is deployed separately
- Blueprint-based deployments (render.yaml)
- Native Node.js runtime
- More granular service control

## Migration Steps

### Step 1: Deploy MCP Server to Render

The MCP server already has a `render.yaml` configuration in `mcp-server/render.yaml`.

#### Option A: Deploy via Render Dashboard (Recommended)
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository: `The-social-drink-company/sentia-manufacturing-dashboard`
4. Configure:
   - **Name**: `sentia-mcp-server`
   - **Root Directory**: `mcp-server`
   - **Branch**: `development` (or your preferred branch)
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Start with Free, upgrade to Standard for production

#### Option B: Deploy via Blueprint
1. Copy the `mcp-server/render.yaml` to root directory
2. Push to GitHub
3. In Render Dashboard: "New +" → "Blueprint"
4. Select your repository and the render.yaml

### Step 2: Configure Environment Variables

All API keys and configurations from Railway are already in `mcp-server/render.yaml`:

```yaml
# Already configured in render.yaml:
- ANTHROPIC_API_KEY (Claude AI)
- OPENAI_API_KEY (GPT-4)
- DATABASE_URL (Neon PostgreSQL)
- XERO_CLIENT_ID/SECRET
- SHOPIFY_UK/USA credentials
- UNLEASHED_API credentials
- JWT_SECRET (auto-generated)
```

### Step 3: Update Main Application

Update your main app's environment variables to point to the new Render MCP server:

```yaml
# In main app's render.yaml:
- key: MCP_SERVER_URL
  value: https://sentia-mcp-server.onrender.com  # Your Render MCP URL
```

### Step 4: Verify Deployment

Test the MCP server endpoints:

```bash
# Health check
curl https://sentia-mcp-server.onrender.com/health

# MCP status
curl https://sentia-mcp-server.onrender.com/mcp/status

# Test AI endpoint (requires JWT)
curl -X POST https://sentia-mcp-server.onrender.com/mcp/ai/request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"prompt": "Test AI request"}'
```

### Step 5: Update CORS Origins

Ensure the MCP server allows your Render app domains:

```yaml
# Already in mcp-server/render.yaml:
- key: CORS_ORIGINS
  value: https://sentia-manufacturing-development.onrender.com,https://sentia-manufacturing-testing.onrender.com,https://sentia-manufacturing-production.onrender.com
```

## Environment-Specific Deployments

### Development Environment
```yaml
# mcp-server-dev
- Branch: development
- URL: https://sentia-mcp-dev.onrender.com
- Connected to: sentia-manufacturing-development.onrender.com
```

### Testing Environment
```yaml
# mcp-server-test
- Branch: test
- URL: https://sentia-mcp-test.onrender.com
- Connected to: sentia-manufacturing-testing.onrender.com
```

### Production Environment
```yaml
# mcp-server-prod
- Branch: production
- URL: https://sentia-mcp-prod.onrender.com
- Connected to: sentia-manufacturing-production.onrender.com
```

## MCP Server Features on Render

Your MCP server includes:
- **AI Orchestration**: Multi-LLM management (Claude, GPT-4, Gemini)
- **Unified API Interface**: All external service integrations
- **WebSocket Support**: Real-time AI responses
- **Vector Database**: Manufacturing intelligence storage
- **Decision Engine**: Automated rule processing
- **10 Enterprise Tools**: Complete MCP tool suite

## Post-Migration Checklist

- [ ] MCP server deployed to Render
- [ ] Health endpoint responding (https://sentia-mcp-server.onrender.com/health)
- [ ] Environment variables configured
- [ ] Main app updated with new MCP_SERVER_URL
- [ ] CORS origins include all app domains
- [ ] WebSocket connections working
- [ ] AI endpoints responding
- [ ] External API integrations verified (Xero, Shopify, etc.)
- [ ] Database connection established
- [ ] Logs showing successful initialization

## Monitoring

### Render Dashboard
- View logs in real-time
- Monitor CPU and memory usage
- Set up alerts for failures
- Configure auto-deploy from GitHub

### Health Monitoring
```bash
# Simple health check script
while true; do
  curl -s https://sentia-mcp-server.onrender.com/health
  sleep 60
done
```

## Rollback Plan

If issues arise:
1. Railway MCP server remains at: web-production-99691282.up.railway.app
2. Update MCP_SERVER_URL back to Railway endpoint
3. Investigate Render deployment issues
4. Fix and redeploy

## Cost Comparison

### Railway
- Usage-based pricing
- ~$5-20/month for MCP server

### Render
- **Free Tier**: 750 hours/month (sufficient for development)
- **Starter**: $7/month (for testing)
- **Standard**: $25/month (recommended for production)

## Support

- Render Documentation: https://docs.render.com
- Render Status: https://status.render.com
- Support: support@render.com

## Notes

- Render automatically handles SSL certificates
- Automatic deploys trigger on GitHub push
- Free tier services spin down after 15 minutes of inactivity
- Use Standard plan for production to avoid cold starts