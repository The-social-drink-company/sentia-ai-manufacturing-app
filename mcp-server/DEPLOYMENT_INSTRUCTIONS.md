# MCP Server Railway Deployment Instructions

## Prerequisites

1. **Railway Account**: Sign up at https://railway.app
2. **Railway CLI**: Already installed (v4.6.3)
3. **API Keys Ready**:
   - Xero Client ID and Secret
   - OpenAI API Key
   - Anthropic API Key

## Step-by-Step Deployment Guide

### 1. Login to Railway

Open a new terminal and run:
```bash
railway login
```
This will open your browser for authentication.

### 2. Create New Railway Project

```bash
# Navigate to MCP server directory
cd mcp-server

# Create new Railway project
railway link
# Select "Create New Project"
# Name it: sentia-mcp-server
```

### 3. Deploy to Each Environment

#### Deploy to Production
```bash
# Switch to production branch
git checkout production

# Run deployment script
./deploy-production.sh

# Or manually:
railway environment production
railway up --environment production
```

#### Deploy to Test Environment
```bash
# Switch to test branch
git checkout test

# Run deployment script
./deploy-test.sh

# Or manually:
railway environment test
railway up --environment test
```

#### Deploy to Development
```bash
# Switch to development branch
git checkout development

# Run deployment script
./deploy-development.sh

# Or manually:
railway environment development
railway up --environment development
```

### 4. Configure Environment Variables in Railway Dashboard

1. Go to https://railway.app/dashboard
2. Select your `sentia-mcp-server` project
3. Click on the service
4. Go to "Variables" tab
5. Add the following for each environment:

#### Production Variables
```
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
RAILWAY_ENVIRONMENT=production

# Xero
XERO_CLIENT_ID=9C0CAB921C134476A249E48BBECB8C4B
XERO_CLIENT_SECRET=f0TJpJSRX_B9NI51sknz7TuKbbSfhO4dEhTM4m4fWBlph9F5
XERO_REDIRECT_URI=https://sentia-mcp-server.railway.app/api/xero/callback
XERO_SCOPE=accounting.transactions,accounting.contacts,accounting.settings

# OpenAI (Replace with actual key)
OPENAI_API_KEY=your_production_openai_api_key

# Anthropic (Replace with actual key)
ANTHROPIC_API_KEY=your_production_anthropic_api_key

# CORS
CORS_ORIGINS=https://sentia-manufacturing.railway.app
```

#### Test Environment Variables
Same as production but with:
- `NODE_ENV=test`
- `RAILWAY_ENVIRONMENT=test`
- `LOG_LEVEL=debug`
- `XERO_REDIRECT_URI=https://test-sentia-mcp-server.railway.app/api/xero/callback`
- `CORS_ORIGINS=https://test.sentia-manufacturing.railway.app`
- Use test API keys

#### Development Environment Variables
Same as production but with:
- `NODE_ENV=development`
- `RAILWAY_ENVIRONMENT=development`
- `LOG_LEVEL=debug`
- `XERO_REDIRECT_URI=https://dev-sentia-mcp-server.railway.app/api/xero/callback`
- `CORS_ORIGINS=https://dev.sentia-manufacturing.railway.app,http://localhost:3000,http://localhost:5000`
- Use development API keys

### 5. Verify Deployment

After deployment, check each environment:

#### Production
```bash
# Health check
curl https://sentia-mcp-server.railway.app/health

# Provider status
curl https://sentia-mcp-server.railway.app/api/providers
```

#### Test
```bash
# Health check
curl https://test-sentia-mcp-server.railway.app/health

# Provider status
curl https://test-sentia-mcp-server.railway.app/api/providers
```

#### Development
```bash
# Health check
curl https://dev-sentia-mcp-server.railway.app/health

# Provider status
curl https://dev-sentia-mcp-server.railway.app/api/providers
```

### 6. Update Main Application

Add to your main application's `.env` file:

#### For Production
```
MCP_SERVER_URL=https://sentia-mcp-server.railway.app
MCP_HEALTH_URL=https://sentia-mcp-server.railway.app/health
```

#### For Test
```
MCP_SERVER_URL=https://test-sentia-mcp-server.railway.app
MCP_HEALTH_URL=https://test-sentia-mcp-server.railway.app/health
```

#### For Development
```
MCP_SERVER_URL=https://dev-sentia-mcp-server.railway.app
MCP_HEALTH_URL=https://dev-sentia-mcp-server.railway.app/health
```

## Monitoring and Management

### View Logs
```bash
# Real-time logs
railway logs --environment production

# Follow logs
railway logs --follow --environment production
```

### Restart Service
```bash
railway restart --environment production
```

### Scale Service
```bash
# Scale to 3 instances
railway scale 3 --environment production
```

### Check Status
```bash
railway status
```

## Troubleshooting

### Common Issues and Solutions

1. **Build Failures**
   - Check Node.js version in package.json matches Railway's Node 18
   - Verify all dependencies are in package.json
   - Check nixpacks.toml configuration

2. **Connection Errors**
   - Verify CORS_ORIGINS includes your domain
   - Check API keys are correctly set in Railway variables
   - Ensure PORT is set to 3000

3. **Health Check Failures**
   - Verify the server is binding to 0.0.0.0:$PORT
   - Check logs for startup errors
   - Ensure all required environment variables are set

4. **Provider Connection Issues**
   - Verify API keys are valid
   - Check provider-specific configurations
   - Review logs for authentication errors

### Debug Commands
```bash
# Check all variables
railway variables --environment production

# View detailed logs
railway logs --lines 100 --environment production

# Open Railway dashboard
railway open
```

## Security Notes

1. **Never commit API keys** to the repository
2. **Use environment-specific keys** for each deployment
3. **Enable HTTPS** (Railway provides this by default)
4. **Configure CORS** to only allow your domains
5. **Implement rate limiting** for production use
6. **Monitor logs** for suspicious activity

## Support Resources

- **Railway Documentation**: https://docs.railway.app
- **Railway Status**: https://status.railway.app
- **MCP Protocol Docs**: https://modelcontextprotocol.org
- **Support Issues**: Create issue in repository

## Next Steps

1. Test all endpoints after deployment
2. Set up monitoring alerts
3. Configure auto-scaling if needed
4. Implement backup strategies
5. Document API usage for team

## Quick Reference

### URLs by Environment

| Environment | MCP Server URL | Health Check URL |
|-------------|---------------|------------------|
| Production | https://sentia-mcp-server.railway.app | https://sentia-mcp-server.railway.app/health |
| Test | https://test-sentia-mcp-server.railway.app | https://test-sentia-mcp-server.railway.app/health |
| Development | https://dev-sentia-mcp-server.railway.app | https://dev-sentia-mcp-server.railway.app/health |

### Environment Variables Template

Copy the appropriate `.env.{environment}` file:
- `.env.production` for production
- `.env.test` for test environment  
- `.env.development` for development

### Deployment Scripts

Use the provided scripts for easy deployment:
- `./deploy-production.sh` - Deploy to production
- `./deploy-test.sh` - Deploy to test
- `./deploy-development.sh` - Deploy to development