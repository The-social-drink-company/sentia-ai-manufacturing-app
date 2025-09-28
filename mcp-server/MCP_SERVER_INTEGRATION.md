# MCP Server Integration Guide

## Deployment Status: ACTIVE ✅

The Sentia MCP (Model Context Protocol) Server is successfully deployed and running on Railway.

## Server Information

### Production Deployment
- **Status**: Running (Since: 2025-09-10 09:52:02 UTC)
- **Port**: 8080 (Internal)
- **Health Check**: Passing
- **Platform**: Railway (Europe-West4)
- **Build Time**: 14.39 seconds

### Core Components Status

#### ✅ Successfully Initialized
- **AI Central Nervous System**: Active with multi-LLM orchestration
- **LLM Providers**: 2 providers (Claude 3.5 Sonnet, GPT-4 Turbo)
- **Vector Database**: 4 categories for manufacturing intelligence
- **Enterprise MCP Tools**: 10 tools registered
- **API Integrations**: 7 external services registered
- **Learning System**: Active (saves patterns every 5 minutes)

#### Registered Services
1. **Xero Accounting API** - Financial data, invoicing, payments
2. **Amazon SP-API** - Inventory, orders, FBA operations
3. **Shopify Multi-Store** - Products, orders, customers
4. **Neon PostgreSQL** - Data storage and analytics
5. **OpenAI GPT-4** - Text generation and analysis
6. **Anthropic Claude** - Reasoning and manufacturing intelligence
7. **Demand Forecasting** - Internal forecasting service

## API Endpoints

### Internal Railway Network
```
Base URL: http://sentia-mcp-server:8080
```

### Available Endpoints

#### Health & Status
- `GET /health` - Server health check
- `GET /mcp/status` - Comprehensive system status

#### AI Features
- `POST /ai/chat` - AI chatbot interface
- `GET /ai/chat` - Test chatbot page
- `WebSocket ws://sentia-mcp-server:8080/mcp/ws` - Real-time updates

#### MCP Protocol Tools
- `POST /mcp/tools/list` - List available tools
- `POST /mcp/tools/call` - Execute MCP tool

## Integration with Main Application

### Backend Integration (server.js)
```javascript
// Add to your Express server
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://sentia-mcp-server:8080';

// Health check endpoint
app.get('/api/mcp/health', async (req, res) => {
  try {
    const response = await fetch(`${MCP_SERVER_URL}/health`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(503).json({ error: 'MCP server unavailable' });
  }
});

// AI chat endpoint
app.post('/api/ai/chat', async (req, res) => {
  try {
    const response = await fetch(`${MCP_SERVER_URL}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(503).json({ error: 'AI service unavailable' });
  }
});
```

### Frontend Integration (React)
```javascript
// AI Chat Service
export const aiChatService = {
  async sendMessage(message) {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    return response.json();
  },
  
  connectWebSocket() {
    // For production, use wss:// with proper domain
    const ws = new WebSocket('ws://localhost:8080/mcp/ws');
    return ws;
  }
};
```

## Environment Variables Required

### Critical (Must Configure)
```env
# AI Provider Keys
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Database
DATABASE_URL=postgresql://...
```

### Optional (For Full Features)
```env
# Xero Accounting
XERO_CLIENT_ID=...
XERO_CLIENT_SECRET=...

# Amazon SP-API
AMAZON_SP_API_CLIENT_ID=...
AMAZON_SP_API_CLIENT_SECRET=...
AMAZON_SP_API_REFRESH_TOKEN=...

# Shopify
SHOPIFY_ACCESS_TOKEN=...
SHOPIFY_SHOP_DOMAIN=...

# Google AI (optional)
GOOGLE_AI_API_KEY=...
```

## Service Health Status

### Currently Active ✅
- Neon PostgreSQL Database
- OpenAI GPT-4 API
- Internal services

### Awaiting Configuration ⚠️
- Anthropic Claude (needs ANTHROPIC_API_KEY)
- Xero Accounting (needs client credentials)
- Amazon SP-API (needs seller credentials)
- Shopify Multi-Store (needs access token)

## Monitoring & Logs

### Log Output
The server uses structured logging with Winston:
- **Info**: Normal operations, connections, health checks
- **Warn**: Service connection issues, fallbacks
- **Error**: Critical failures, exceptions

### Learning System
- Automatically saves interaction patterns every 5 minutes
- Improves response quality over time
- Stores patterns in `./learning/patterns.json`

## Troubleshooting

### Common Issues

1. **External URL Not Accessible**
   - Railway generates internal service names
   - Use `http://sentia-mcp-server:8080` from within Railway network
   - External access requires Railway public domain configuration

2. **Service Shows "Unhealthy"**
   - Check if API credentials are configured in Railway
   - Verify external service is accessible
   - Check logs for specific error messages

3. **AI Features Not Working**
   - Ensure ANTHROPIC_API_KEY or OPENAI_API_KEY is set
   - Check API key validity and quota
   - Review response error messages

## Next Steps

1. **Configure API Keys**: Add missing environment variables in Railway dashboard
2. **Test Integration**: Verify main app can communicate with MCP server
3. **Enable Public Access**: Configure Railway domain if external access needed
4. **Monitor Performance**: Check logs and health endpoints regularly

## Support

For issues or questions:
- Check server logs in Railway dashboard
- Review health endpoint: `/health`
- Check comprehensive status: `/mcp/status`
- Review error messages in application logs

---

Last Updated: 2025-09-10
Status: Production Active ✅