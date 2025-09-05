# Railway MCP Server Deployment Guide

This guide explains how to deploy the Sentia MCP Server to Railway for cross-branch access to Xero, OpenAI, and Anthropic services.

## Overview

The MCP Server provides:
- **Xero Integration**: Accounting operations, contacts, invoices, items
- **OpenAI Integration**: Text generation, embeddings, data analysis
- **Anthropic Integration**: Manufacturing analysis, process optimization
- **Cross-Branch Access**: Available to all Railway deployments

## Prerequisites

1. Railway account with project access
2. API keys for all services:
   - Xero API credentials
   - OpenAI API key
   - Anthropic API key

## Deployment Steps

### 1. Create Railway Project

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Create new project
railway new

# Select "Empty Project" and name it "sentia-mcp-server"
```

### 2. Deploy MCP Server

```bash
# Navigate to MCP server directory
cd mcp-server

# Deploy to Railway
railway up

# This will automatically:
# - Detect Node.js project
# - Use Nixpacks builder
# - Deploy to Railway infrastructure
```

### 3. Configure Environment Variables

In Railway dashboard, go to your project → Variables tab and add:

#### Server Configuration
```
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
```

#### Xero Configuration
```
XERO_CLIENT_ID=9C0CAB921C134476A249E48BBECB8C4B
XERO_CLIENT_SECRET=f0TJpJSRX_B9NI51sknz7TuKbbSfhO4dEhTM4m4fWBlph9F5
XERO_REDIRECT_URI=https://your-mcp-server.railway.app/api/xero/callback
XERO_SCOPE=accounting.transactions,accounting.contacts,accounting.settings
```

#### OpenAI Configuration
```
OPENAI_API_KEY=your_openai_api_key_here
```

#### Anthropic Configuration
```
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### 4. Configure for Multiple Branches

#### Production Branch
- Set `RAILWAY_ENVIRONMENT=production`
- Use production API keys
- Set `LOG_LEVEL=info`

#### Staging Branch
- Set `RAILWAY_ENVIRONMENT=staging`
- Use staging/test API keys
- Set `LOG_LEVEL=debug`

#### Development Branch
- Set `RAILWAY_ENVIRONMENT=development`
- Use development API keys
- Set `LOG_LEVEL=debug`

## Railway Configuration Files

### nixpacks.toml
```toml
[phases.setup]
nixPkgs = ["nodejs_18", "npm"]

[phases.install]
cmds = ["npm ci --only=production"]

[phases.build]
cmds = ["mkdir -p logs"]

[start]
cmd = "node index.js"

[variables]
NODE_ENV = "production"
LOG_LEVEL = "info"
```

### railway.json
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node index.js",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## Accessing the MCP Server

### Health Check
```bash
curl https://your-mcp-server.railway.app/health
```

### Provider Status
```bash
curl https://your-mcp-server.railway.app/api/providers
```

### MCP Protocol Access
The server runs on stdio for MCP protocol communication. To connect from Cursor:

1. Open Cursor settings
2. Go to Extensions > MCP Servers
3. Add new server:
   - **Name**: `sentia-mcp-railway`
   - **Command**: `railway`
   - **Args**: `["run", "--service", "sentia-mcp-server", "node", "index.js"]`

## Environment-Specific Configuration

### Production Environment
```bash
# Set production environment
railway environment production

# Deploy with production config
railway up --environment production
```

### Staging Environment
```bash
# Set staging environment
railway environment staging

# Deploy with staging config
railway up --environment staging
```

### Development Environment
```bash
# Set development environment
railway environment development

# Deploy with development config
railway up --environment development
```

## Monitoring and Logs

### View Logs
```bash
# View real-time logs
railway logs

# View logs for specific service
railway logs --service sentia-mcp-server
```

### Monitor Health
```bash
# Check service status
railway status

# View metrics
railway metrics
```

## Cross-Branch Integration

### From Main Dashboard
```javascript
// Connect to MCP server from any branch
const mcpServerUrl = process.env.MCP_SERVER_URL || 'https://sentia-mcp-server.railway.app';

// Use MCP tools
const response = await fetch(`${mcpServerUrl}/api/providers`);
const providers = await response.json();
```

### Environment Variables for Integration
Add to each branch's environment:

```
# MCP Server URL
MCP_SERVER_URL=https://sentia-mcp-server.railway.app

# MCP Server Health Check
MCP_HEALTH_URL=https://sentia-mcp-server.railway.app/health
```

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify package.json dependencies
   - Check nixpacks.toml configuration

2. **Runtime Errors**
   - Verify environment variables
   - Check logs: `railway logs`
   - Ensure all API keys are valid

3. **Health Check Failures**
   - Verify PORT environment variable
   - Check if server is binding to 0.0.0.0
   - Ensure health endpoint is accessible

### Debug Commands
```bash
# Check service status
railway status

# View detailed logs
railway logs --follow

# Check environment variables
railway variables

# Restart service
railway restart
```

## Security Considerations

1. **API Keys**: Store all API keys in Railway environment variables
2. **HTTPS**: Railway provides HTTPS by default
3. **CORS**: Configure CORS for your domains
4. **Rate Limiting**: Implement rate limiting for production use
5. **Monitoring**: Set up alerts for service health

## Scaling

### Horizontal Scaling
```bash
# Scale to multiple instances
railway scale 3
```

### Vertical Scaling
- Upgrade Railway plan for more resources
- Configure resource limits in railway.json

## Cost Optimization

1. **Environment Management**: Use different environments for different purposes
2. **Resource Monitoring**: Monitor CPU and memory usage
3. **Auto-scaling**: Configure auto-scaling based on demand
4. **Sleep Mode**: Configure sleep mode for development environments

## Support

For issues related to:
- **Railway Deployment**: Check Railway documentation
- **MCP Protocol**: Check MCP SDK documentation
- **API Integration**: Check respective API documentation
- **Service Issues**: Check logs and health endpoints
