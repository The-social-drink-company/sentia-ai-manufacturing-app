# Render MCP Integration Setup Guide

## 🎯 Overview

Your Sentia Manufacturing Dashboard now includes **complete Render MCP integration**, allowing you to manage your Render services, databases, and deployments directly through the MCP server.

## ✅ What's Already Implemented

### **Enterprise MCP Server with Render Integration**
- **23 Total MCP Tools** (10 for Render integration)
- **AI-Powered Infrastructure Management** with Claude 3.5 Sonnet
- **Real-time Service Monitoring** and health checks
- **Complete API Integration** with Render.com services

### **10 Render MCP Tools Available**
1. **`render_list_services`** - List all Render services in your account
2. **`render_get_service_details`** - Get detailed service information and deployments
3. **`render_list_databases`** - List all PostgreSQL databases
4. **`render_get_database_details`** - Get database connection and configuration details
5. **`render_deploy_service`** - Trigger deployments with optional cache clearing
6. **`render_update_env_vars`** - Update environment variables for services
7. **`render_get_service_logs`** - Fetch service logs with filtering options
8. **`render_get_service_metrics`** - Get performance metrics and monitoring data
9. **`render_health_check`** - Comprehensive health check across all resources
10. **`render_ai_insights`** - AI-powered infrastructure analysis and recommendations

## 🔑 Required Setup - Your Render API Key

To activate the Render MCP integration, you need to add your **Render API Key**.

### **Get Your Render API Key:**
1. Go to https://dashboard.render.com/account/api-keys
2. Click **"Create API Key"**
3. Give it a name like "Sentia MCP Server"
4. Copy the generated API key

### **Add to Environment Variables:**

#### **For Local Development:**
Update `mcp-server/.env`:
```env
RENDER_API_KEY=your-render-api-key-here
```

#### **For Render Deployment:**
Update `mcp-server/render.yaml`:
```yaml
envVars:
  - key: RENDER_API_KEY
    value: your-render-api-key-here
```

## 🚀 Deployment Options

### **Option 1: Deploy MCP Server to Render (Recommended)**

Your `render.yaml` is already configured. Simply:

1. **Add your Render API key** to the environment variables
2. **Push to GitHub** (when ready)
3. **Deploy automatically** via Render

The MCP server will be available at:
- **Production**: `https://sentia-mcp-server.onrender.com`
- **Health Check**: `https://sentia-mcp-server.onrender.com/health`
- **MCP Tools**: `https://sentia-mcp-server.onrender.com/mcp/tools`

### **Option 2: Run Locally for Development**

```bash
cd mcp-server
npm install
npm start
```

Server will be available at:
- **HTTP**: `http://localhost:9000`
- **WebSocket**: `ws://localhost:9000/mcp/ws`
- **Health Check**: `http://localhost:9000/health`

## 🔧 Using the Render MCP Tools

### **Example: List All Services**
```bash
curl -X POST http://localhost:9000/mcp/tools/execute \
  -H "Content-Type: application/json" \
  -d '{"name": "render_list_services", "arguments": {"includeDetails": true}}'
```

### **Example: Deploy a Service**
```bash
curl -X POST http://localhost:9000/mcp/tools/execute \
  -H "Content-Type: application/json" \
  -d '{
    "name": "render_deploy_service", 
    "arguments": {
      "serviceId": "srv-your-service-id", 
      "clearCache": true
    }
  }'
```

### **Example: Get AI Insights**
```bash
curl -X POST http://localhost:9000/mcp/tools/execute \
  -H "Content-Type: application/json" \
  -d '{
    "name": "render_ai_insights", 
    "arguments": {
      "resourceType": "services"
    }
  }'
```

## 🌟 AI-Powered Features

### **Infrastructure Insights**
The MCP server includes **AI-powered analysis** using Claude 3.5 Sonnet to provide:
- **Performance optimization recommendations**
- **Cost optimization suggestions**
- **Scaling recommendations**
- **Risk assessment and mitigation**
- **Best practices guidance**

### **Real-time Monitoring**
- **WebSocket notifications** for deployments and health changes
- **Automated health checks** across all Render resources
- **Performance metrics collection** and analysis

## 📊 Integration with Main Application

### **Frontend Integration**
Your main application can connect to the MCP server via:

```javascript
// WebSocket connection for real-time updates
const ws = new WebSocket('ws://localhost:9000/mcp/ws');

// HTTP API calls
const response = await fetch('http://localhost:9000/mcp/tools/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'render_health_check',
    arguments: { includeDetails: true }
  })
});
```

### **Available Endpoints**
- **Health Check**: `GET /health`
- **MCP Tools List**: `GET /mcp/tools`
- **Execute Tool**: `POST /mcp/tools/execute`
- **AI Chat Support**: `POST /ai/chat`
- **WebSocket**: `ws://server/mcp/ws`

## 🔒 Security & Authentication

### **Enterprise Security Features**
- **Rate limiting** (1000 requests per 15 minutes)
- **CORS protection** with configurable origins
- **Helmet.js security headers**
- **JWT token support** for authentication
- **Request logging** and audit trails

### **Production Security Checklist**
- ✅ **API Keys secured** in environment variables
- ✅ **CORS origins configured** for production domains
- ✅ **HTTPS enforced** via Render
- ✅ **Rate limiting active** for API endpoints
- ✅ **Audit logging enabled** for all operations

## 📈 Monitoring & Observability

### **Built-in Monitoring**
- **Structured logging** with Winston
- **Performance metrics** collection
- **Health check endpoints** for uptime monitoring
- **AI-powered insights** for infrastructure analysis

### **Log Files**
- **Application logs**: `logs/enterprise-mcp.log`
- **Render integration logs**: `logs/render-mcp.log`
- **Console output**: Structured JSON format

## 🤖 AI Central Nervous System

Your MCP server includes the **AI Central Nervous System** with:
- **Multi-LLM orchestration** (Claude, GPT-4, Gemini)
- **Manufacturing intelligence** capabilities
- **Automated decision making** for infrastructure
- **Learning system** that improves over time

## 🛠️ Troubleshooting

### **Common Issues**

#### **"Render API key not found"**
```bash
# Set your API key
export RENDER_API_KEY=your-key-here
# or update .env file
```

#### **Connection timeout**
```bash
# Check if server is running
curl http://localhost:9000/health
```

#### **CORS errors**
Update `CORS_ORIGINS` in environment variables to include your frontend domain.

### **Debug Mode**
```bash
LOG_LEVEL=debug npm start
```

## 📞 Support & Documentation

### **MCP Protocol Documentation**
- **Official Docs**: https://docs.anthropic.com/en/docs/mcp
- **Render API Docs**: https://render.com/docs/api

### **Custom Support Chatbot**
Your MCP server includes an AI-powered support chatbot at `/ai/chat` endpoint for 24/7 assistance with:
- Manufacturing workflows
- Infrastructure management
- Troubleshooting guidance
- Best practices recommendations

---

## 🎉 Conclusion

Your **Sentia Manufacturing Dashboard** now has **world-class Render MCP integration** with:

✅ **10 Render management tools**  
✅ **AI-powered infrastructure insights**  
✅ **Real-time monitoring and alerts**  
✅ **Enterprise-grade security**  
✅ **Complete deployment automation**  

**Next Step**: Add your Render API key and start managing your infrastructure through the MCP server!