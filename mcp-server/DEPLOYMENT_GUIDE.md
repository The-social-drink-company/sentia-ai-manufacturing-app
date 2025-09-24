# Sentia MCP Server - Railway Deployment Guide

## 🚀 **RAILWAY DASHBOARD DEPLOYMENT**

### **Step 1: Create Railway Service**

1. **Go to Railway Dashboard**: https://railway.app/dashboard
2. **Click "New Project"** → "Deploy from GitHub repo"
3. **Select Repository**: `sentia-manufacturing-dashboard`
4. **🎯 CRITICAL**: Set **Root Directory** to: `mcp-server`
5. **Service Name**: `sentia-mcp-server-production`

### **Step 2: Environment Variables**

Copy these variables to Railway Dashboard → Settings → Environment:

```env
# Core Configuration
NODE_ENV=production
LOG_LEVEL=info
JWT_SECRET=sentia-mcp-railway-secret-2025

# AI Integration (REQUIRED)
ANTHROPIC_API_KEY=sk-ant-your-actual-claude-key
OPENAI_API_KEY=sk-your-actual-openai-key
GOOGLE_AI_API_KEY=your-actual-gemini-key

# CORS (Update with your actual domains)
CORS_ORIGINS=https://sentia-manufacturing-dashboard-production.up.railway.app,http://localhost:3000
```

### **Step 3: Verify Deployment**

Railway will automatically:
- ✅ Use `mcp-server/package.json`
- ✅ Run `npm install` for dependencies
- ✅ Start with `npm start` → `node enterprise-server-simple.js`
- ✅ Assign dynamic port via `${{ RAILWAY_PORT }}`
- ✅ Enable health checks at `/health`

## 🧪 **Testing Deployed MCP Server**

Once deployed, test these endpoints:

```bash
# Health check (should return JSON status)
curl https://your-mcp-server.up.railway.app/health

# MCP protocol info
curl https://your-mcp-server.up.railway.app/mcp/info

# AI chat test
curl -X POST https://your-mcp-server.up.railway.app/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What can you help me with?", "context": {}}'

# Available MCP tools
curl https://your-mcp-server.up.railway.app/mcp/tools
```

## ✅ **Expected Success Indicators**

**Healthy Deployment Logs:**
```
🚀 Sentia Enterprise MCP Server started on port XXXX
✅ AI Central Nervous System initialized successfully
✅ Unified API Interface integrated successfully
✅ 10 enterprise MCP tools registered
```

**Health Endpoint Response:**
```json
{
  "status": "healthy",
  "server": "sentia-enterprise-mcp-server",
  "version": "2.0.0-enterprise-simple",
  "features": {
    "manufacturing": true,
    "aiIntegration": true,
    "realTime": true
  }
}
```

## 🔧 **Frontend Integration**

Update your frontend to use the Railway MCP server:

```javascript
// In SentiaAIChatbot.jsx - already configured
const MCP_SERVER_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-mcp-server.up.railway.app'
  : 'http://localhost:9001';
```

## 📋 **Available MCP Tools**

1. **ai_manufacturing_request** - Natural language manufacturing queries
2. **ai_system_status** - AI system health monitoring
3. **unified_api_call** - Centralized API management
4. **inventory_optimize** - AI-powered inventory optimization
5. **demand_forecast** - 4-model ensemble forecasting
6. **working_capital_analyze** - Financial optimization
7. **ai_manufacturing_insights** - Intelligent recommendations
8. **sync_service_data** - Manual data synchronization
9. **get_api_system_status** - External service monitoring
10. **get_system_health** - Complete system diagnostics

## 🚨 **Troubleshooting**

### Common Issues:

1. **502 Bad Gateway**: Check Railway logs for startup errors
2. **Environment Variables**: Ensure all required API keys are set
3. **CORS Issues**: Verify CORS_ORIGINS includes your frontend domain
4. **Service Unhealthy**: Some services may show as unhealthy without API keys (normal)

### Railway Logs Access:
- Railway Dashboard → Your Service → Deployments → View Logs
- Look for "🚀 Sentia Enterprise MCP Server started" message

## 🎯 **Success Criteria**

- ✅ MCP server starts without errors
- ✅ Health endpoint returns JSON response
- ✅ AI endpoints respond to requests
- ✅ Frontend can connect and communicate
- ✅ WebSocket connections work for real-time features

Your MCP server is now deployed and ready to provide AI-powered manufacturing intelligence!