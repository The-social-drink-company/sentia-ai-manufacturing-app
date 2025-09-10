# MCP SERVER RAILWAY DEPLOYMENT FIX

## CRITICAL: Railway Environment Variables Required

### **Step 1: Add to Railway Dashboard → Settings → Environment**

Copy these variables to Railway Dashboard (replace placeholders with actual values):

```env
# CORE CONFIGURATION
NODE_ENV=production
LOG_LEVEL=info
JWT_SECRET=sentia-mcp-railway-secret-2025

# AI INTEGRATION (REQUIRED - GET ACTUAL KEYS)
ANTHROPIC_API_KEY=sk-ant-api03-your-actual-claude-key-here
OPENAI_API_KEY=sk-proj-your-actual-openai-key-here
GOOGLE_AI_API_KEY=your-actual-gemini-key-here

# CORS CONFIGURATION
CORS_ORIGINS=https://sentia-manufacturing-dashboard-production.up.railway.app,https://sentia-manufacturing-dashboard-development.up.railway.app,https://sentia-manufacturing-dashboard-testing.up.railway.app

# RAILWAY SPECIFIC
RAILWAY_ENVIRONMENT=production
```

### **Step 2: Verify Railway Service Configuration**

1. **Service Name**: `sentia-mcp-server-production`
2. **Root Directory**: `mcp-server` ✅ 
3. **Branch**: `production` ✅
4. **Start Command**: `npm start` ✅
5. **Health Check**: `/health` ✅

### **Step 3: Force Redeploy After Environment Variables Added**

After adding environment variables to Railway Dashboard:

1. Go to Railway Dashboard → Deployments
2. Click "Redeploy" on latest deployment
3. Wait for build to complete
4. Test health endpoint

### **Expected Results After Fix**

#### Health Endpoint Should Return:
```json
{
  "status": "healthy",
  "server": "sentia-enterprise-mcp-server",
  "version": "2.0.0-enterprise-simple",
  "protocol": "2024-11-05",
  "uptime": 123.456,
  "connections": 0,
  "features": {
    "manufacturing": true,
    "multiProvider": true,
    "aiIntegration": true,
    "realTime": true,
    "enterprise": true
  },
  "timestamp": "2025-09-10T07:30:00.000Z"
}
```

#### Available Endpoints After Fix:
- ✅ `GET /health` - Server health status
- ✅ `GET /mcp/info` - MCP protocol information  
- ✅ `GET /mcp/tools` - Available AI tools
- ✅ `POST /ai/chat` - AI chatbot interface
- ✅ `WebSocket /mcp/ws` - Real-time MCP protocol

### **Debugging Steps**

If deployment still fails:

1. **Check Railway Logs**:
   - Build logs for compilation errors
   - Application logs for runtime errors
   - Environment variable loading

2. **Verify Dependencies**:
   ```bash
   npm install --production=false
   ```

3. **Test Locally First**:
   ```bash
   cd mcp-server
   NODE_ENV=production PORT=9000 npm start
   curl http://localhost:9000/health
   ```

### **Success Criteria**

MCP Server deployment is successful when:

- ✅ Health endpoint returns proper JSON (not "OK")
- ✅ All MCP endpoints return 200 (not 404)
- ✅ AI chat functionality works
- ✅ WebSocket connections accepted
- ✅ Environment variables properly loaded

**Current Status**: Configuration files updated, environment variables need to be added to Railway Dashboard.