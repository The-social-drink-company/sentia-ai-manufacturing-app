# MCP Integration Troubleshooting Guide

## Quick Diagnostics

Run this command to check overall system health:

```bash
.\scripts\test-mcp-integration.ps1 -Environment production
```

---

## Common Issues & Solutions

### 1. MCP Server Connection Issues

#### Problem: "MCP Server unreachable"

**Symptoms:**

- Dashboard shows "Disconnected"
- API calls return 503 errors
- No real-time updates

**Diagnosis:**

```bash
# Check MCP Server health
curl https://web-production-99691282.up.railway.app/health

# Check application endpoint
curl https://sentia-manufacturing-production.up.railway.app/api/mcp/health
```

**Solutions:**

1. **Verify MCP Server is deployed:**
   - Check Railway project: https://railway.app/project/3adb1ac4-84d8-473b-885f-3a9790fe6140
   - Ensure service is running
   - Check deployment logs

2. **Check environment variables:**

   ```powershell
   .\scripts\configure-api-keys.ps1 -Environment production -CheckOnly
   ```

3. **Restart services:**
   ```bash
   railway restart --service 99691282-de66-45b2-98cf-317083dd11ba
   ```

---

### 2. WebSocket Connection Drops

#### Problem: Frequent disconnections

**Symptoms:**

- "WebSocket disconnected" messages
- Missed real-time updates
- Auto-reconnect failures

**Diagnosis:**

```javascript
// Check in browser console
fetch('/api/mcp/websocket/stats')
  .then(r => r.json())
  .then(console.log)
```

**Solutions:**

1. **Enable auto-reconnect:**
   - Set `MCP_ENABLE_WEBSOCKET=true` in environment
   - Increase reconnect attempts in configuration

2. **Check network stability:**

   ```bash
   # Monitor connection
   .\scripts\health-monitor.ps1 -Mode continuous
   ```

3. **Force reconnection:**
   ```bash
   curl -X POST https://[domain]/api/mcp/websocket/reconnect
   ```

---

### 3. API Synchronization Failures

#### Problem: Data not syncing

**Symptoms:**

- Old data displayed
- "Last sync: Never" in dashboard
- Sync errors in logs

**Diagnosis:**

```bash
# Check sync status
curl https://[domain]/api/mcp/sync/status

# View sync logs
railway logs --service [service-id] | grep -i sync
```

**Solutions by Service:**

#### Xero Sync Issues

1. **Check credentials:**
   - Verify `XERO_CLIENT_ID` and `XERO_CLIENT_SECRET`
   - Ensure OAuth token is valid
   - Check tenant ID is correct

2. **Re-authenticate:**
   ```bash
   # Trigger OAuth flow
   curl https://[domain]/api/xero/auth/refresh
   ```

#### Shopify Sync Issues

1. **Verify API access:**
   - Check `SHOPIFY_API_KEY` and `SHOPIFY_API_SECRET`
   - Confirm store domain is correct
   - Verify access scopes

2. **Test connection:**
   ```bash
   curl https://[store].myshopify.com/admin/api/2024-01/shop.json \
     -H "X-Shopify-Access-Token: [token]"
   ```

#### Amazon SP-API Issues

1. **Check credentials:**
   - Verify AWS credentials
   - Confirm IAM role permissions
   - Check marketplace IDs

2. **Test API access:**
   ```bash
   # Use AWS CLI to test
   aws sts get-caller-identity
   ```

---

### 4. Database Connection Issues

#### Problem: "Database connection failed"

**Symptoms:**

- 500 errors on API calls
- "Database: disconnected" in monitoring
- Timeout errors

**Diagnosis:**

```bash
# Test database connection
psql "postgresql://[connection-string]" -c "SELECT 1"

# Check database status
.\scripts\database-operations.ps1 -Operation status -Environment production
```

**Solutions:**

1. **Verify connection string:**
   - Check `DATABASE_URL` format
   - Ensure SSL mode is set: `?sslmode=require`
   - Verify Neon branch exists

2. **Check connection pool:**

   ```sql
   -- Check active connections
   SELECT count(*) FROM pg_stat_activity;

   -- Kill idle connections
   SELECT pg_terminate_backend(pid)
   FROM pg_stat_activity
   WHERE state = 'idle'
   AND query_start < now() - interval '10 minutes';
   ```

3. **Reset connection pool:**
   ```bash
   railway restart --service [service-id]
   ```

---

### 5. Performance Issues

#### Problem: Slow response times

**Symptoms:**

- API calls take >3 seconds
- Dashboard loads slowly
- Timeout errors

**Diagnosis:**

```bash
# Check response times
curl -w "@curl-format.txt" -o /dev/null -s https://[domain]/api/health

# Monitor metrics
curl https://[domain]/api/mcp/metrics
```

**Solutions:**

1. **Optimize sync intervals:**

   ```javascript
   // Reduce sync frequency
   {
     "xero": "*/60 * * * *",      // Every hour
     "shopify": "*/30 * * * *",    // Every 30 min
     "amazon": "0 */2 * * *"       // Every 2 hours
   }
   ```

2. **Clear cache:**

   ```bash
   # Reset Redis cache
   railway run --service [service-id] redis-cli FLUSHALL
   ```

3. **Scale resources:**
   - Increase Railway service resources
   - Enable horizontal scaling
   - Optimize database queries

---

### 6. Authentication Errors

#### Problem: "Authentication failed"

**Symptoms:**

- 401/403 errors
- "Unauthorized" messages
- Login failures

**Diagnosis:**

```bash
# Check Clerk status
curl https://api.clerk.dev/v1/health

# Verify JWT
curl -H "Authorization: Bearer [token]" https://[domain]/api/health
```

**Solutions:**

1. **Update Clerk keys:**

   ```bash
   railway variables set CLERK_SECRET_KEY=[key] --service [service-id]
   railway variables set VITE_CLERK_PUBLISHABLE_KEY=[key] --service [service-id]
   ```

2. **Rotate JWT secrets:**
   ```powershell
   # Generate new secrets
   .\scripts\configure-api-keys.ps1 -Environment production
   ```

---

## Error Code Reference

| Code   | Message            | Cause                 | Solution                            |
| ------ | ------------------ | --------------------- | ----------------------------------- |
| MCP001 | Server unreachable | MCP Server down       | Check Railway deployment            |
| MCP002 | WebSocket failed   | Connection error      | Reconnect WebSocket                 |
| MCP003 | Sync timeout       | Large dataset         | Increase timeout, reduce batch size |
| MCP004 | Rate limit         | Too many requests     | Reduce sync frequency               |
| MCP005 | Auth expired       | Token timeout         | Refresh authentication              |
| MCP006 | Database error     | Connection issue      | Check connection string             |
| MCP007 | API error          | External service      | Check service status                |
| MCP008 | Cache miss         | No cached data        | Trigger manual sync                 |
| MCP009 | Config error       | Missing variables     | Configure environment               |
| MCP010 | Version mismatch   | Incompatible versions | Update dependencies                 |

---

## Debugging Tools

### 1. Health Check Script

```powershell
# Comprehensive health check
.\scripts\health-monitor.ps1 -Mode once

# Continuous monitoring
.\scripts\health-monitor.ps1 -Mode continuous -IntervalSeconds 30
```

### 2. Log Analysis

```bash
# View recent errors
railway logs --service [service-id] | grep ERROR | tail -20

# Monitor real-time logs
railway logs --service [service-id] --follow

# Search specific issues
railway logs --service [service-id] | grep -i "mcp\|sync\|websocket"
```

### 3. Database Diagnostics

```powershell
# Check database status
.\scripts\database-operations.ps1 -Operation status -Environment production

# Run maintenance
.\scripts\database-operations.ps1 -Operation maintenance -Environment production

# Create backup
.\scripts\database-operations.ps1 -Operation backup -Environment production
```

### 4. API Testing

```bash
# Test all endpoints
for endpoint in health status metrics; do
  echo "Testing /api/mcp/$endpoint"
  curl -s https://[domain]/api/mcp/$endpoint | jq .
done

# Test specific service
curl -X POST https://[domain]/api/mcp/sync/trigger/xero
```

---

## Recovery Procedures

### Complete System Reset

```bash
# 1. Stop all services
railway down --service [service-id]

# 2. Clear cache
redis-cli FLUSHALL

# 3. Reset database
.\scripts\database-operations.ps1 -Operation reset -Environment development -Force

# 4. Redeploy
.\deploy-railway.ps1 production

# 5. Verify
.\scripts\test-mcp-integration.ps1 -Environment production
```

### Emergency Rollback

```bash
# 1. List deployments
railway deployments --service [service-id]

# 2. Rollback to previous
railway rollback [deployment-id] --service [service-id]

# 3. Verify rollback
curl https://[domain]/api/health
```

### Data Recovery

```powershell
# 1. Restore from backup
.\scripts\database-operations.ps1 -Operation restore -Environment production -BackupFile [file]

# 2. Re-sync all services
curl -X POST https://[domain]/api/mcp/sync/full

# 3. Verify data integrity
.\scripts\database-operations.ps1 -Operation status -Environment production
```

---

## Prevention Strategies

### 1. Monitoring Setup

- Enable continuous health monitoring
- Set up alerts for critical services
- Monitor error rates and response times
- Track sync success rates

### 2. Regular Maintenance

- Weekly database optimization
- Monthly API key rotation
- Quarterly dependency updates
- Annual disaster recovery drills

### 3. Configuration Best Practices

- Use environment-specific configs
- Document all API keys
- Enable auto-sync for critical services
- Set appropriate timeout values

### 4. Backup Strategy

- Daily automated backups
- Test restore procedures
- Keep 30-day backup history
- Store backups off-site

---

## Getting Help

### Log Collection

When reporting issues, collect:

```bash
# System status
.\scripts\test-mcp-integration.ps1 -Environment production > status.txt

# Recent logs
railway logs --service [service-id] --since 1h > logs.txt

# Database status
.\scripts\database-operations.ps1 -Operation status -Environment production > db-status.txt
```

### Support Channels

1. **GitHub Issues**: https://github.com/financeflo-ai/sentia-manufacturing-dashboard/issues
2. **Railway Support**: https://railway.app/help
3. **Email**: support@sentia.com

### Information to Provide

- Environment (development/testing/production)
- Error messages and codes
- Time of occurrence
- Steps to reproduce
- Screenshots of monitoring dashboard
- Log files

---

## Appendix

### Environment Variables Checklist

```
Required:
□ DATABASE_URL
□ VITE_CLERK_PUBLISHABLE_KEY
□ CLERK_SECRET_KEY
□ SESSION_SECRET
□ JWT_SECRET
□ MCP_JWT_SECRET
□ MCP_SERVER_URL
□ MCP_SERVER_SERVICE_ID

Service-Specific:
□ XERO_CLIENT_ID
□ XERO_CLIENT_SECRET
□ SHOPIFY_API_KEY
□ SHOPIFY_API_SECRET
□ AMAZON_SP_API_KEY
□ AMAZON_SP_API_SECRET

Optional:
□ OPENAI_API_KEY
□ ANTHROPIC_API_KEY
□ REDIS_URL
□ SENTRY_DSN
```

### Quick Commands

```bash
# Health check
curl https://[domain]/api/health

# MCP status
curl https://[domain]/api/mcp/status

# Trigger sync
curl -X POST https://[domain]/api/mcp/sync/trigger/[service]

# WebSocket reconnect
curl -X POST https://[domain]/api/mcp/websocket/reconnect

# Enable auto-sync
curl -X POST https://[domain]/api/mcp/sync/enable
```

---

**Last Updated**: December 2024
**Version**: 1.0.0
