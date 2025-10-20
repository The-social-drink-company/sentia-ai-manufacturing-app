# MCP Integration Deployment Checklist

## Pre-Deployment Verification

### 1. Code Integration ✅

- [x] MCP Client service created (`services/mcp-client.js`)
- [x] API Integration service created (`services/api-integration-service.js`)
- [x] WebSocket Monitor created (`services/websocket-monitor.js`)
- [x] Auto-Sync Manager created (`services/auto-sync-manager.js`)
- [x] MCP Integration routes added (`api/mcp-integration.js`)
- [x] Server.js updated with MCP routes
- [x] Monitoring dashboard created (`src/pages/MCPMonitoringDashboard.jsx`)

### 2. Database Schema ✅

- [x] ExternalAPIData model added
- [x] MCPServerConnection model added
- [x] SyncStatus model added
- [x] ManufacturingAlert model added

### 3. Environment Configuration ✅

- [x] Development environment file updated (`.env.development.railway`)
- [x] Testing environment file updated (`.env.testing.railway`)
- [x] Production environment file updated (`.env.production.railway`)

### 4. Documentation ✅

- [x] User Guide created (`MCP_USER_GUIDE.md`)
- [x] Troubleshooting Guide created (`MCP_TROUBLESHOOTING.md`)
- [x] Deployment Checklist created (`MCP_DEPLOYMENT_CHECKLIST.md`)

### 5. Scripts and Tools ✅

- [x] API Key configuration script (`scripts/configure-api-keys.ps1`)
- [x] MCP integration test script (`scripts/test-mcp-integration.ps1`)
- [x] Health monitoring script (`scripts/health-monitor.ps1`)
- [x] Database operations script (`scripts/database-operations.ps1`)

---

## Railway Deployment Steps

### Step 1: Deploy MCP Server to Railway

**Project**: MCP Server Project (ID: 3adb1ac4-84d8-473b-885f-3a9790fe6140)
**Service**: sentia-mcp-server (ID: 99691282-de66-45b2-98cf-317083dd11ba)

1. Navigate to Railway project dashboard
2. Deploy MCP Server code from `mcp-server/` directory
3. Verify deployment at: https://web-production-99691282.up.railway.app
4. Test health endpoint: `curl https://web-production-99691282.up.railway.app/health`

### Step 2: Configure Environment Variables in Railway

#### Development Environment

**Service ID**: f97b65ad-c306-410a-9d5d-5f5fdc098620

Required variables:

```
NODE_ENV=development
DATABASE_URL=[Neon development branch URL]
DEV_DATABASE_URL=[Same as DATABASE_URL]
MCP_SERVER_URL=https://web-production-99691282.up.railway.app
MCP_SERVER_SERVICE_ID=99691282-de66-45b2-98cf-317083dd11ba
MCP_JWT_SECRET=[Generate with script]
VITE_CLERK_PUBLISHABLE_KEY=[From Clerk dashboard]
CLERK_SECRET_KEY=[From Clerk dashboard]
SESSION_SECRET=[Generate with script]
JWT_SECRET=[Generate with script]
XERO_CLIENT_ID=[From Xero app]
XERO_CLIENT_SECRET=[From Xero app]
SHOPIFY_API_KEY=[From Shopify app]
SHOPIFY_API_SECRET=[From Shopify app]
AMAZON_SP_API_KEY=[From Amazon SP-API]
AMAZON_SP_API_SECRET=[From Amazon SP-API]
AUTO_SYNC_ENABLED=false
MCP_ENABLE_WEBSOCKET=true
```

#### Testing Environment

**Service ID**: 02e0c7f6-9ca1-4355-af52-ee9eec0b3545

Same as development but with:

```
NODE_ENV=test
DATABASE_URL=[Neon testing branch URL]
TEST_DATABASE_URL=[Same as DATABASE_URL]
AUTO_SYNC_ENABLED=false
```

#### Production Environment

**Service ID**: 3e0053fc-ea90-49ec-9708-e09d58cad4a0

Same as development but with:

```
NODE_ENV=production
DATABASE_URL=[Neon production branch URL]
AUTO_SYNC_ENABLED=true
XERO_SYNC_INTERVAL=*/30 * * * *
SHOPIFY_SYNC_INTERVAL=*/15 * * * *
AMAZON_SYNC_INTERVAL=*/60 * * * *
DATABASE_SYNC_INTERVAL=0 */6 * * *
```

### Step 3: Run Configuration Script

Execute locally to generate secrets:

```powershell
.\scripts\configure-api-keys.ps1 -Environment production
```

Copy generated secrets to Railway environment variables.

### Step 4: Deploy Application Updates

1. Commit changes to development branch:

```bash
git add .
git commit -m "feat: Add MCP Server integration with real-time monitoring

- Integrated MCP Server (Service ID: 99691282-de66-45b2-98cf-317083dd11ba)
- Added WebSocket monitoring for real-time updates
- Implemented auto-sync manager for API synchronization
- Created monitoring dashboard at /mcp-monitor
- Added comprehensive documentation and troubleshooting guides"
git push origin development
```

2. Railway will auto-deploy to development environment

### Step 5: Test Development Deployment

Run test script:

```powershell
.\scripts\test-mcp-integration.ps1 -Environment development
```

Expected results:

- MCP Server: Connected ✅
- WebSocket: Connected ✅
- Database: Connected ✅
- Auto-Sync: Disabled (development) ✅

### Step 6: Promote to Testing

After development testing passes:

```bash
git checkout test
git merge development
git push origin test
```

Run UAT tests:

```powershell
.\scripts\test-mcp-integration.ps1 -Environment testing
```

### Step 7: Production Deployment

After UAT approval:

```bash
git checkout production
git merge test
git push origin production
```

Enable production auto-sync:

```bash
curl -X POST https://sentia-manufacturing-production.up.railway.app/api/mcp/sync/enable
```

---

## Post-Deployment Verification

### 1. Health Checks

```bash
# MCP Server
curl https://web-production-99691282.up.railway.app/health

# Main Application
curl https://sentia-manufacturing-production.up.railway.app/api/health

# MCP Integration
curl https://sentia-manufacturing-production.up.railway.app/api/mcp/status
```

### 2. WebSocket Connection

Navigate to: https://sentia-manufacturing-production.up.railway.app/mcp-monitor

- Check WebSocket status shows "Connected"
- Verify real-time updates are flowing

### 3. API Synchronization

```bash
# Check sync status
curl https://sentia-manufacturing-production.up.railway.app/api/mcp/sync/status

# Trigger manual sync (if needed)
curl -X POST https://sentia-manufacturing-production.up.railway.app/api/mcp/sync/trigger/xero
```

### 4. Database Connectivity

```bash
# Verify database branches
curl https://sentia-manufacturing-production.up.railway.app/api/mcp/database/status
```

---

## Monitoring and Maintenance

### Daily Checks

1. Visit MCP Monitoring Dashboard: `/mcp-monitor`
2. Check all services show "Connected"
3. Review sync history for errors
4. Monitor WebSocket uptime

### Weekly Tasks

1. Review error logs in Railway dashboard
2. Check API rate limits and usage
3. Verify auto-sync is running on schedule
4. Run database optimization if needed

### Monthly Tasks

1. Rotate API keys and secrets
2. Update dependencies if needed
3. Review and optimize sync intervals
4. Backup configuration and logs

---

## Rollback Procedure

If issues occur after deployment:

1. **Quick Rollback**:

```bash
railway rollback [previous-deployment-id] --service [service-id]
```

2. **Manual Rollback**:

```bash
git revert HEAD
git push origin [branch-name]
```

3. **Disable Auto-Sync**:

```bash
curl -X POST https://[domain]/api/mcp/sync/disable
```

4. **Emergency Stop**:

- Go to Railway dashboard
- Stop the affected service
- Investigate logs
- Fix issues before restarting

---

## Support Contacts

- **Railway Support**: https://railway.app/help
- **GitHub Issues**: https://github.com/Capliquify/sentia-manufacturing-dashboard/issues
- **Email**: support@sentia.com

---

## Checklist Summary

### Pre-Deployment ✅

- [x] All code files created and integrated
- [x] Database schema updated
- [x] Environment files configured
- [x] Documentation complete
- [x] Scripts and tools ready

### Deployment 🚀

- [ ] MCP Server deployed to Railway
- [ ] Environment variables configured in Railway
- [ ] Secrets generated and applied
- [ ] Code pushed to development branch
- [ ] Development environment tested

### Testing 🧪

- [ ] Development tests passed
- [ ] UAT environment deployed
- [ ] UAT tests completed
- [ ] Client approval received

### Production 🎯

- [ ] Production deployment completed
- [ ] Auto-sync enabled
- [ ] Health checks passed
- [ ] Monitoring active

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Status**: Ready for Deployment
