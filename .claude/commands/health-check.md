# Application Health Check

Perform comprehensive health check across all deployment environments.

## Environments to Check

1. **Development**: https://sentia-manufacturing-dashboard-621h.onrender.com
2. **Test**: https://sentia-manufacturing-dashboard-test.onrender.com
3. **Production**: https://sentia-manufacturing-dashboard-production.onrender.com

## Health Check Process

### 1. Service Status Check

For each environment, check:

```bash
# Health endpoint
curl -s https://[environment-url]/health | jq

# API status endpoint
curl -s https://[environment-url]/api/status | jq
```

Report:
- ✅ Responding / ❌ Not responding
- Response time (ms)
- Status code
- Any error messages

### 2. Application Availability

Check each environment:
- Can the homepage load?
- HTTP status code (should be 200)
- Response time
- Any error messages in HTML

### 3. Critical Endpoints Test

Test key API endpoints:
- `/api/health` - Health check
- `/api/status` - Application status
- `/api/working-capital` - Working capital data
- `/api/demand-forecast` - Forecasting data
- `/api/financial-reports` - Financial data

Report status for each.

### 4. Authentication Status

Check:
- Clerk configuration (if applicable)
- Development bypass mode status
- Any auth-related errors

### 5. External Integration Status

If possible, check:
- Xero API connection status
- Shopify API connection status
- Database connectivity
- Redis connectivity (if used)

## Output Format

```
🏥 SENTIA DASHBOARD HEALTH CHECK REPORT
Generated: [timestamp]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 DEVELOPMENT ENVIRONMENT
URL: https://sentia-manufacturing-dashboard-621h.onrender.com
Status: ✅ HEALTHY / ⚠️ DEGRADED / ❌ DOWN

Core Services:
  ✅ Application: Responding (250ms)
  ✅ Health Endpoint: OK
  ✅ API Status: Operational
  ✅ Database: Connected
  ⚠️ External APIs: Partial

Critical Endpoints:
  ✅ /api/health (200) - 150ms
  ✅ /api/working-capital (200) - 380ms
  ✅ /api/demand-forecast (200) - 420ms
  ❌ /api/financial-reports (503) - Timeout

Issues Detected:
  - Financial reports endpoint timing out
  - Xero API returning 429 (rate limit)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 TEST ENVIRONMENT
[Same format as above]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 PRODUCTION ENVIRONMENT
[Same format as above]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 SUMMARY

Overall Status:
  Development: ✅ Healthy
  Test: ✅ Healthy
  Production: ⚠️ Degraded

Critical Issues: 1
  - Production financial reports endpoint down

Warnings: 2
  - Rate limiting on Xero API
  - Slower response times in production

🔧 Recommended Actions:
1. Investigate production financial reports timeout
2. Implement Xero API rate limit handling
3. Optimize production database queries

📊 Performance Metrics:
  Avg Response Time - Dev: 250ms
  Avg Response Time - Test: 280ms
  Avg Response Time - Prod: 320ms
```

## Alerting Thresholds

Define when to alert:
- 🔴 Critical: Service down, >50% endpoints failing
- 🟠 Warning: Degraded performance, >30% endpoints slow
- 🟢 Healthy: All services operational, <500ms response

## Automated Monitoring Recommendation

Suggest setting up:
- Uptime monitoring (UptimeRobot, Pingdom)
- Error tracking (Sentry)
- Performance monitoring (New Relic, Datadog)
- Render's built-in monitoring

Execute comprehensive health check and provide detailed report.
