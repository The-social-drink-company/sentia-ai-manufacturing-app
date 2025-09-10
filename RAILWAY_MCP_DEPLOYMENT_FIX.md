# RAILWAY MCP SERVER DEPLOYMENT FIX

## CRITICAL ISSUE IDENTIFIED
Railway is deploying from the ROOT directory instead of the `mcp-server` subdirectory, causing it to serve the main Express server instead of the MCP server.

## IMMEDIATE ACTIONS REQUIRED

### Step 1: Railway Dashboard Configuration
**URGENT: Configure Railway Service Settings**

1. **Go to Railway Dashboard**: https://railway.app/project/[your-project-id]
2. **Select MCP Server Service**
3. **Settings Tab → Deploy → Source**
4. **Set Root Directory**: `/mcp-server` (CRITICAL)
5. **Set Build Command**: `npm ci --production=false`
6. **Set Start Command**: `npm start`

### Step 2: Environment Variables
**Add these to Railway Dashboard → Settings → Environment Variables:**

```env
NODE_ENV=production
LOG_LEVEL=info
JWT_SECRET=sentia-mcp-secret-key
ANTHROPIC_API_KEY=sk-ant-[YOUR-ACTUAL-KEY]
OPENAI_API_KEY=sk-proj-[YOUR-ACTUAL-KEY]
GOOGLE_AI_API_KEY=[YOUR-ACTUAL-KEY]
```

### Step 3: Force Redeploy
After configuration changes:
1. **Settings → Deploy → Triggers**
2. **Click "Deploy" button** to force redeploy
3. **Monitor deployment logs** for successful startup

## VERIFICATION TESTS

After deployment completes, test these endpoints:

```bash
# Health check - should return JSON with server status
curl https://sentia-mcp-server.railway.app/health

# MCP server info - should return server details
curl https://sentia-mcp-server.railway.app/

# AI Central Nervous System status
curl https://sentia-mcp-server.railway.app/mcp/status
```

## EXPECTED RESPONSES

**Health endpoint should return:**
```json
{
  "status": "healthy",
  "timestamp": "2025-09-10T...",
  "services": {
    "ai_central_nervous_system": "connected",
    "unified_api_interface": "connected"
  }
}
```

**Root endpoint should return:**
```json
{
  "name": "Sentia MCP Server",
  "version": "2.0.0-enterprise-simple",
  "protocol_version": "2024-11-05"
}
```

## CURRENT STATUS
- ✅ Local MCP server working perfectly (all features functional)
- ❌ Railway deployment serving wrong application
- ✅ Configuration files updated and committed
- ⏳ Railway dashboard configuration required

## ROOT CAUSE
Railway is using the root-level nixpacks.toml which starts `node server.js` instead of the mcp-server configuration which should start the MCP server.

The fix requires setting the Railway service root directory to `/mcp-server` so it uses the correct configuration files.