# MCP Post-Deployment Monitoring Guide

## 🔍 Overview

This guide provides comprehensive monitoring procedures for the MCP integration after deployment to Railway. Follow these procedures to ensure optimal performance and quickly identify issues.

---

## 📊 Monitoring Dashboard

### Access Points

| Environment | Dashboard URL |
|------------|---------------|
| **Production** | https://sentia-manufacturing-production.up.railway.app/mcp-monitor |
| **Testing** | https://sentiatest.financeflo.ai/mcp-monitor |
| **Development** | https://sentia-manufacturing-dashboard-development.up.railway.app/mcp-monitor |

### Dashboard Sections

#### 1. Status Cards
Monitor these key indicators:
- **MCP Server**: Should show "Connected" (green)
- **WebSocket**: Should show "Active" (green)
- **Database**: Should show branch name (green)
- **Auto-Sync**: Should show "Enabled" in production (yellow/green)

#### 2. WebSocket Tab
Key metrics to monitor:
- **Uptime**: Should increase continuously
- **Messages Received**: Should increment regularly
- **Success Rate**: Should be >95%
- **Reconnections**: Should be <5 per day

#### 3. Synchronization Tab
Check sync status:
- **Last Sync Time**: Should be within configured interval
- **Error Count**: Should be 0
- **Status**: Should be "success" for each service

#### 4. API Status Tab
Verify service health:
- **Xero**: Connected/Configured
- **Shopify**: Connected/Configured
- **Amazon**: Connected/Configured
- **Database**: Connected

---

## 🚨 Alert Thresholds

### Critical Alerts (Immediate Action)
| Metric | Threshold | Action |
|--------|-----------|--------|
| MCP Server Disconnected | >5 minutes | Check server deployment |
| WebSocket Success Rate | <80% | Investigate connection issues |
| API Sync Failures | >3 consecutive | Check API credentials |
| Database Connection Lost | Any | Verify connection string |
| Error Rate | >10/minute | Review error logs |

### Warning Alerts (Monitor Closely)
| Metric | Threshold | Action |
|--------|-----------|--------|
| WebSocket Reconnections | >10/hour | Monitor network stability |
| Sync Delay | >2x interval | Check service performance |
| Response Time | >2 seconds | Review server resources |
| Memory Usage | >80% | Consider scaling |

---

## 📈 Health Check Procedures

### 1. Quick Health Check (Every Hour)
```bash
# Check all environments
curl https://sentia-manufacturing-production.up.railway.app/api/mcp/health
curl https://sentiatest.financeflo.ai/api/mcp/health
curl https://sentia-manufacturing-dashboard-development.up.railway.app/api/mcp/health
```

Expected response:
```json
{
  "status": "ok",
  "mcp": {
    "connected": true,
    "healthy": true
  }
}
```

### 2. Comprehensive Status Check (Every 4 Hours)
```bash
# Get detailed status
curl https://[domain]/api/mcp/status
```

Review:
- All services should be "connected"
- Auto-sync should show active jobs
- WebSocket should have high uptime

### 3. WebSocket Health (Every 2 Hours)
```bash
# Check WebSocket statistics
curl https://[domain]/api/mcp/websocket/stats
```

Verify:
- Success rate >95%
- Messages flowing (increasing count)
- Low error count

### 4. Sync Status Check (Every 6 Hours)
```bash
# Check synchronization status
curl https://[domain]/api/mcp/sync/status
```

Ensure:
- All services synced within their intervals
- No persistent errors
- Sync times are reasonable

---

## 🔧 Monitoring Scripts

### Automated Monitoring Script
```powershell
# Run continuous monitoring
.\scripts\health-monitor.ps1 -Mode continuous -IntervalSeconds 300
```

### Quick Status Check
```powershell
# One-time comprehensive check
.\scripts\test-mcp-integration.ps1 -Environment production
```

### Environment Validation
```powershell
# Validate configuration
.\scripts\validate-environment.ps1 -Environment production
```

---

## 📝 Log Monitoring

### Railway Logs

#### View Live Logs
```bash
# Follow logs in real-time
railway logs --follow

# View recent logs
railway logs | tail -50
```

#### What to Look For
✅ **Healthy Indicators:**
- "MCP Server connected successfully"
- "WebSocket connection established"
- "Sync completed for [service]"
- "Health check passed"

❌ **Error Indicators:**
- "Connection timeout"
- "Authentication failed"
- "Rate limit exceeded"
- "Database connection error"
- "Sync failed"

### Application Logs

#### Key Log Patterns
```bash
# Search for errors
railway logs | grep -i error

# Monitor sync operations
railway logs | grep -i sync

# Check WebSocket activity
railway logs | grep -i websocket

# Review API calls
railway logs | grep -i "api\|request"
```

---

## 📊 Metrics to Track

### Daily Metrics
- Total API calls
- Sync success rate
- WebSocket uptime percentage
- Average response time
- Error count by type

### Weekly Metrics
- Total data synchronized
- API rate limit usage
- Memory/CPU trends
- User activity patterns
- System availability

### Monthly Metrics
- Cost optimization opportunities
- Performance trends
- Capacity planning needs
- Security audit results

---

## 🛠️ Troubleshooting Procedures

### Issue: MCP Server Disconnected

1. **Check server status:**
   ```bash
   curl https://web-production-99691282.up.railway.app/health
   ```

2. **Verify environment variables:**
   ```bash
   railway variables | grep MCP
   ```

3. **Force reconnection:**
   ```bash
   curl -X POST https://[domain]/api/mcp/websocket/reconnect
   ```

### Issue: Sync Failures

1. **Check specific service:**
   ```bash
   curl https://[domain]/api/mcp/sync/status
   ```

2. **Trigger manual sync:**
   ```bash
   curl -X POST https://[domain]/api/mcp/sync/trigger/[service]
   ```

3. **Review API credentials:**
   ```powershell
   .\scripts\validate-environment.ps1 -Environment production
   ```

### Issue: High Error Rate

1. **Identify error types:**
   ```bash
   railway logs | grep ERROR | tail -20
   ```

2. **Check rate limits:**
   ```bash
   curl https://[domain]/api/mcp/status
   ```

3. **Review recent changes:**
   ```bash
   git log --oneline -10
   ```

---

## 📅 Maintenance Schedule

### Daily Tasks (5 minutes)
- [ ] Check MCP Monitor dashboard
- [ ] Review error counts
- [ ] Verify sync status
- [ ] Check WebSocket connection

### Weekly Tasks (30 minutes)
- [ ] Review Railway logs for patterns
- [ ] Check API rate limit usage
- [ ] Validate all services connected
- [ ] Run comprehensive health check
- [ ] Review performance metrics

### Monthly Tasks (2 hours)
- [ ] Rotate API keys and secrets
- [ ] Update dependencies if needed
- [ ] Optimize sync intervals
- [ ] Performance analysis
- [ ] Security audit
- [ ] Backup configuration

---

## 🚀 Performance Optimization

### Quick Wins
1. **Adjust sync intervals based on usage:**
   ```env
   XERO_SYNC_INTERVAL=*/45 * * * *  # Reduce frequency if not critical
   ```

2. **Enable caching for static data:**
   ```javascript
   CACHE_TTL=3600  # 1 hour cache
   ```

3. **Optimize WebSocket reconnection:**
   ```env
   WS_RECONNECT_INTERVAL=5000
   WS_MAX_RECONNECT_ATTEMPTS=10
   ```

### Advanced Optimization
1. **Database query optimization**
2. **API response caching**
3. **Batch sync operations**
4. **Horizontal scaling**

---

## 📞 Escalation Procedures

### Level 1: Self-Service (0-15 minutes)
1. Check monitoring dashboard
2. Review recent logs
3. Run health check script
4. Try manual reconnection

### Level 2: Technical Support (15-60 minutes)
1. Review comprehensive logs
2. Check Railway deployment status
3. Validate all configurations
4. Test individual components

### Level 3: Engineering Team (>60 minutes)
1. Database investigation
2. Code debugging
3. Infrastructure issues
4. Security incidents

### Contact Information
- **GitHub Issues**: [Create Issue](https://github.com/The-social-drink-company/sentia-manufacturing-dashboard/issues)
- **Railway Support**: [Get Help](https://railway.app/help)
- **Emergency**: support@sentia.com

---

## 📋 Monitoring Checklist

### Every Hour
- [ ] Dashboard shows all green
- [ ] No new error alerts
- [ ] WebSocket connected

### Every Day
- [ ] Review sync history
- [ ] Check error logs
- [ ] Verify API connections

### Every Week
- [ ] Performance analysis
- [ ] Security review
- [ ] Capacity check

### Every Month
- [ ] Full system audit
- [ ] Update documentation
- [ ] Optimize configuration

---

## 🔐 Security Monitoring

### What to Monitor
- Failed authentication attempts
- Unusual API activity patterns
- Rate limit violations
- Unauthorized access attempts
- Configuration changes

### Security Commands
```bash
# Check for authentication failures
railway logs | grep -i "auth.*fail"

# Monitor rate limits
railway logs | grep -i "rate.*limit"

# Review access patterns
railway logs | grep -i "unauthorized\|forbidden"
```

---

## 📈 Success Metrics

### Key Performance Indicators
- **Uptime**: >99.9%
- **Sync Success Rate**: >95%
- **API Response Time**: <500ms
- **WebSocket Stability**: <5 reconnects/day
- **Error Rate**: <1%

### Business Metrics
- Data freshness (within sync interval)
- User satisfaction scores
- Automation efficiency
- Cost per transaction

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Status**: Active Monitoring Required