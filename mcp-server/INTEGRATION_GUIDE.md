# MCP Server Integration Guide

This guide explains how to integrate the Railway-deployed MCP server with your existing Sentia Manufacturing Dashboard deployments across all branches.

## Overview

The MCP server provides centralized access to:
- **Xero Accounting**: Financial operations and reporting
- **OpenAI**: AI-powered analysis and generation
- **Anthropic**: Advanced manufacturing intelligence

## Integration Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Production    │    │     Staging     │    │   Development   │
│   Dashboard     │    │    Dashboard    │    │    Dashboard    │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │     MCP Server            │
                    │   (Railway Deployed)      │
                    │                           │
                    │  ┌─────┐ ┌─────┐ ┌─────┐  │
                    │  │Xero │ │OpenAI│ │Claude│  │
                    │  └─────┘ └─────┘ └─────┘  │
                    └───────────────────────────┘
```

## Step 1: Deploy MCP Server

### Quick Deployment
```bash
# Navigate to MCP server directory
cd mcp-server

# Deploy to Railway (Linux/Mac)
./deploy-railway.sh

# Deploy to Railway (Windows)
deploy-railway.bat
```

### Manual Deployment
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Create new project
railway new

# Deploy
railway up
```

## Step 2: Configure Environment Variables

In Railway dashboard, set these environment variables:

### Required Variables
```env
# Server Configuration
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Xero Configuration
XERO_CLIENT_ID=9C0CAB921C134476A249E48BBECB8C4B
XERO_CLIENT_SECRET=f0TJpJSRX_B9NI51sknz7TuKbbSfhO4dEhTM4m4fWBlph9F5
XERO_REDIRECT_URI=https://your-mcp-server.railway.app/api/xero/callback
XERO_SCOPE=accounting.transactions,accounting.contacts,accounting.settings

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Anthropic Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key
```

## Step 3: Update Dashboard Deployments

### Add MCP Server Configuration

Add to each branch's environment variables:

```env
# MCP Server Configuration
MCP_SERVER_URL=https://your-mcp-server.railway.app
MCP_HEALTH_URL=https://your-mcp-server.railway.app/health
MCP_PROVIDERS_URL=https://your-mcp-server.railway.app/api/providers
```

### Update Server Configuration

In your main `server.js`, add MCP server integration:

```javascript
// MCP Server Integration
const MCP_SERVER_URL = process.env.MCP_SERVER_URL;

// Health check for MCP server
async function checkMCPServerHealth() {
  try {
    const response = await fetch(`${MCP_SERVER_URL}/health`);
    const health = await response.json();
    console.log('MCP Server Status:', health.status);
    return health.status === 'healthy';
  } catch (error) {
    console.error('MCP Server Health Check Failed:', error);
    return false;
  }
}

// Initialize MCP server connection
checkMCPServerHealth();
```

## Step 4: Create MCP Client Service

Create `services/mcpClient.js`:

```javascript
/**
 * MCP Client Service
 * Handles communication with Railway-deployed MCP server
 */

class MCPClient {
  constructor() {
    this.baseUrl = process.env.MCP_SERVER_URL;
    this.healthUrl = process.env.MCP_HEALTH_URL;
  }

  async checkHealth() {
    try {
      const response = await fetch(this.healthUrl);
      return await response.json();
    } catch (error) {
      throw new Error(`MCP Server health check failed: ${error.message}`);
    }
  }

  async getProviders() {
    try {
      const response = await fetch(`${this.baseUrl}/api/providers`);
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to get providers: ${error.message}`);
    }
  }

  // Xero operations
  async xeroGetOrganizations() {
    // Implementation for Xero operations
  }

  async xeroGetContacts(tenantId, page = 1, limit = 100) {
    // Implementation for Xero contacts
  }

  // OpenAI operations
  async openaiChat(prompt, options = {}) {
    // Implementation for OpenAI chat
  }

  async openaiAnalyzeData(data, analysisType) {
    // Implementation for data analysis
  }

  // Anthropic operations
  async anthropicAnalyzeManufacturing(processData, analysisType) {
    // Implementation for manufacturing analysis
  }
}

module.exports = MCPClient;
```

## Step 5: Configure Cursor Integration

### MCP Server Configuration in Cursor

1. Open Cursor settings
2. Go to Extensions > MCP Servers
3. Add new server:

```json
{
  "name": "sentia-mcp-railway",
  "command": "railway",
  "args": [
    "run",
    "--service",
    "sentia-mcp-server",
    "node",
    "index.js"
  ],
  "env": {
    "RAILWAY_TOKEN": "your_railway_token"
  }
}
```

### Alternative: Direct Connection

If Railway CLI is not available in Cursor environment:

```json
{
  "name": "sentia-mcp-http",
  "command": "curl",
  "args": [
    "-X",
    "POST",
    "https://your-mcp-server.railway.app/mcp",
    "-H",
    "Content-Type: application/json",
    "-d",
    "@-"
  ]
}
```

## Step 6: Test Integration

### Health Check
```bash
# Test MCP server health
curl https://your-mcp-server.railway.app/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "providers": {
    "xero": "configured",
    "openai": "configured",
    "anthropic": "configured"
  }
}
```

### Provider Status
```bash
# Check available providers
curl https://your-mcp-server.railway.app/api/providers

# Expected response:
{
  "xero": "available",
  "openai": "available",
  "anthropic": "available"
}
```

## Step 7: Implement Cross-Branch Features

### Production Dashboard
```javascript
// Use MCP server for production operations
const mcpClient = new MCPClient();

// Financial reporting
async function generateFinancialReport() {
  const organizations = await mcpClient.xeroGetOrganizations();
  const invoices = await mcpClient.xeroGetInvoices(organizations[0].id);
  
  // Generate report using OpenAI
  const report = await mcpClient.openaiAnalyzeData(invoices, 'financial_analysis');
  return report;
}
```

### Staging Dashboard
```javascript
// Use MCP server for testing and validation
const mcpClient = new MCPClient();

// Test manufacturing processes
async function testManufacturingProcess(processData) {
  const analysis = await mcpClient.anthropicAnalyzeManufacturing(
    processData, 
    'process_optimization'
  );
  return analysis;
}
```

### Development Dashboard
```javascript
// Use MCP server for development and experimentation
const mcpClient = new MCPClient();

// Experiment with AI features
async function experimentWithAI(prompt) {
  const response = await mcpClient.openaiChat(prompt, {
    model: 'gpt-4',
    temperature: 0.7
  });
  return response;
}
```

## Step 8: Monitoring and Maintenance

### Health Monitoring
```javascript
// Add to your monitoring system
setInterval(async () => {
  try {
    const health = await mcpClient.checkHealth();
    if (health.status !== 'healthy') {
      console.error('MCP Server is unhealthy:', health);
      // Send alert
    }
  } catch (error) {
    console.error('MCP Server monitoring failed:', error);
  }
}, 60000); // Check every minute
```

### Logging
```javascript
// Add MCP operations to your logging
const logger = winston.createLogger({
  // ... existing config
  defaultMeta: {
    service: 'mcp-client',
    environment: process.env.NODE_ENV
  }
});
```

## Troubleshooting

### Common Issues

1. **Connection Timeout**
   - Check Railway deployment status
   - Verify environment variables
   - Check network connectivity

2. **Authentication Errors**
   - Verify API keys are correct
   - Check token expiration
   - Ensure proper scopes

3. **Service Unavailable**
   - Check Railway logs
   - Verify service health
   - Check resource limits

### Debug Commands
```bash
# Check Railway service status
railway status

# View logs
railway logs --follow

# Check environment variables
railway variables

# Restart service
railway restart
```

## Security Considerations

1. **API Key Management**: Store all keys in Railway environment variables
2. **HTTPS Only**: Use HTTPS for all communications
3. **Rate Limiting**: Implement rate limiting for production use
4. **Access Control**: Restrict access to authorized services only
5. **Monitoring**: Set up alerts for security events

## Performance Optimization

1. **Connection Pooling**: Reuse connections when possible
2. **Caching**: Cache frequently accessed data
3. **Async Operations**: Use async/await for non-blocking operations
4. **Error Handling**: Implement proper error handling and retries
5. **Monitoring**: Monitor performance metrics

## Cost Management

1. **Resource Monitoring**: Monitor Railway resource usage
2. **API Usage**: Track API usage and costs
3. **Optimization**: Optimize queries and operations
4. **Scaling**: Scale resources based on demand

This integration provides a robust, scalable solution for accessing Xero, OpenAI, and Anthropic services across all your Railway deployments while maintaining security and performance.
