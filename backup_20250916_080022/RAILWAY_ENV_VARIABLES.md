# RAILWAY ENVIRONMENT VARIABLES CONFIGURATION

## REQUIRED FOR MCP SERVER DEPLOYMENT

Copy these variables to **Railway Dashboard → Settings → Environment Variables:**

### CORE CONFIGURATION
```
NODE_ENV=production
LOG_LEVEL=info
PORT=$PORT
JWT_SECRET=sentia-mcp-secret-key
RAILWAY_ENVIRONMENT=production
```

### AI PROVIDERS (REQUIRED)
```
ANTHROPIC_API_KEY=sk-ant-[YOUR-ACTUAL-ANTHROPIC-KEY]
OPENAI_API_KEY=sk-proj-[YOUR-ACTUAL-OPENAI-KEY]
GOOGLE_AI_API_KEY=[YOUR-ACTUAL-GOOGLE-KEY]
```

### API INTEGRATIONS (FROM MAIN PROJECT)
```
XERO_CLIENT_ID=[FROM-MAIN-ENV]
XERO_CLIENT_SECRET=[FROM-MAIN-ENV]
DATABASE_URL=[FROM-NEON-DATABASE]
REDIS_URL=[IF-USING-REDIS]
```

### CORS CONFIGURATION
```
CORS_ORIGINS=https://sentia-manufacturing-dashboard-production.up.railway.app,https://sentia-mcp-server.railway.app
```

## CRITICAL NOTES

1. **API Keys Required**: The MCP server WILL NOT work without proper AI provider API keys
2. **$PORT Variable**: Railway automatically provides this - use exactly `$PORT` (with dollar sign)
3. **Database URL**: Should match the main application's database connection
4. **CORS Origins**: Must include both the main app and MCP server URLs

## DEPLOYMENT CHECKLIST

- [ ] All environment variables added to Railway dashboard
- [ ] Railway service root directory set to `/mcp-server`
- [ ] Build command: `npm ci --production=false`
- [ ] Start command: `npm start`
- [ ] Health check path: `/health`
- [ ] Force redeploy triggered
- [ ] Endpoints tested and working

## TEST COMMANDS

After deployment:
```bash
# Should return JSON health status
curl https://sentia-mcp-server.railway.app/health

# Should return MCP server info (not Railway ASCII art)
curl https://sentia-mcp-server.railway.app/
```