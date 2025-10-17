# Incident Response Playbook

## 🚨 Emergency Contacts

### Primary Response Team

| Role               | Name   | Phone   | Email   | Slack      |
| ------------------ | ------ | ------- | ------- | ---------- |
| Incident Commander | [Name] | [Phone] | [Email] | @commander |
| DevOps Lead        | [Name] | [Phone] | [Email] | @devops    |
| Backend Lead       | [Name] | [Phone] | [Email] | @backend   |
| Frontend Lead      | [Name] | [Phone] | [Email] | @frontend  |
| Database Admin     | [Name] | [Phone] | [Email] | @dba       |

### Escalation Chain

1. **Level 1** (0-15 min): On-call Engineer
2. **Level 2** (15-30 min): Team Lead
3. **Level 3** (30-60 min): Engineering Manager
4. **Level 4** (60+ min): CTO

---

## 📊 Incident Severity Levels

### P1 - Critical 🔴

**Response Time**: 15 minutes
**Examples**:

- Complete system outage
- Data breach or security incident
- Payment processing failure
- Data loss or corruption

### P2 - High 🟠

**Response Time**: 1 hour
**Examples**:

- Major feature unavailable
- Authentication system down
- Performance degradation >50%
- Integration failures (Xero, Shopify)

### P3 - Medium 🟡

**Response Time**: 4 hours
**Examples**:

- Minor feature broken
- Slow API responses
- Non-critical integration issues
- UI/UX bugs affecting workflow

### P4 - Low 🟢

**Response Time**: 24 hours
**Examples**:

- Cosmetic issues
- Minor bugs
- Documentation errors
- Non-blocking improvements

---

## 🎯 Incident Response Process

### Phase 1: Detection & Alert (0-5 minutes)

#### Automatic Detection

```bash
# Health monitoring alert
.\scripts\health-monitor.ps1 -Mode continuous

# Check alert source
- Railway alerts
- Sentry errors
- Uptime monitoring
- User reports
```

#### Initial Assessment

1. **Verify the incident**

   ```bash
   curl https://sentia-manufacturing-production.up.railway.app/api/health
   ```

2. **Determine severity**
   - How many users affected?
   - Which features impacted?
   - Is data at risk?

3. **Create incident**

   ```bash
   # Create Slack channel
   /incident create [title]

   # Log incident
   echo "$(date): Incident detected - [description]" >> incidents.log
   ```

### Phase 2: Response & Communication (5-15 minutes)

#### Immediate Actions

1. **Assign roles**
   - Incident Commander
   - Technical Lead
   - Communications Lead

2. **Start incident timeline**

   ```markdown
   ## Incident Timeline

   - [TIME] Alert received
   - [TIME] Incident confirmed
   - [TIME] Team assembled
   ```

3. **Initial communication**

   ```markdown
   Subject: [P1] System Issue Detected

   We are aware of an issue affecting [service].
   Impact: [description]
   Status: Investigating
   Next update: In 15 minutes
   ```

### Phase 3: Diagnosis (15-30 minutes)

#### System Health Checks

```bash
# 1. Check all environments
.\scripts\health-monitor.ps1 -Mode once

# 2. Review recent deployments
railway deployments --service 9fd67b0e-7883-4973-85a5-639d9513d343

# 3. Check error logs
railway logs --service 9fd67b0e-7883-4973-85a5-639d9513d343 --since 1h | grep ERROR

# 4. Database status
.\scripts\database-operations.ps1 -Operation status -Environment production

# 5. External service status
curl https://api.clerk.dev/v1/health
curl https://api.xero.com/health
```

#### Common Diagnosis Patterns

**High Error Rate**

```bash
# Check error patterns
railway logs --service [service-id] | grep -E "ERROR|FATAL|CRITICAL" | head -50

# Check Sentry for error clustering
# Review error trends in monitoring dashboard
```

**Performance Issues**

```bash
# Check response times
curl -w "@curl-format.txt" -o /dev/null https://[domain]/api/health

# Review database slow queries
# Check memory/CPU usage
railway metrics --service [service-id]
```

**Connection Issues**

```bash
# Test database connection
psql $DATABASE_URL -c "SELECT 1"

# Check external APIs
curl -I https://api.xero.com
curl -I https://api.shopify.com
```

### Phase 4: Mitigation (30+ minutes)

#### Quick Fixes

**1. Service Restart**

```bash
railway restart --service 9fd67b0e-7883-4973-85a5-639d9513d343 --environment production
```

**2. Scale Resources**

```bash
# Increase replicas via Railway dashboard
# Increase memory/CPU limits
```

**3. Feature Toggle**

```bash
# Disable problematic feature
railway variables set ENABLE_FEATURE=false --service [service-id]
```

**4. Rollback Deployment**

```bash
# List recent deployments
railway deployments --service [service-id]

# Rollback to last known good
railway rollback [deployment-id] --service [service-id]
```

**5. Database Recovery**

```bash
# Restore from backup
.\scripts\database-operations.ps1 -Operation restore -Environment production -BackupFile [file]
```

### Phase 5: Resolution

#### Verification Steps

1. **Confirm fix deployed**

   ```bash
   railway status --service [service-id]
   ```

2. **Test critical paths**
   - User login
   - Dashboard loading
   - API responses
   - Data integrity

3. **Monitor for 30 minutes**
   ```bash
   .\scripts\health-monitor.ps1 -Mode continuous -IntervalSeconds 60
   ```

#### Communication

```markdown
Subject: [RESOLVED] System Issue Resolved

The issue affecting [service] has been resolved.
Duration: [start] - [end]
Impact: [description]
Resolution: [what was done]
Next steps: Monitoring for stability
```

### Phase 6: Post-Mortem (Within 48 hours)

#### Post-Mortem Template

```markdown
# Incident Post-Mortem: [Title]

Date: [Date]
Severity: P[1-4]
Duration: [Duration]

## Summary

Brief description of what happened.

## Timeline

- [TIME]: Event
- [TIME]: Event

## Root Cause

Detailed explanation of why it happened.

## Impact

- Users affected: [number]
- Features impacted: [list]
- Data loss: [yes/no]

## Resolution

How the issue was resolved.

## Lessons Learned

What we learned from this incident.

## Action Items

- [ ] Action item 1 (Owner)
- [ ] Action item 2 (Owner)

## Prevention

How we'll prevent this in the future.
```

---

## 📋 Incident Type Playbooks

### 🔴 Complete Outage

**Symptoms**: Site returns 502/503, health check fails

**Immediate Actions**:

```bash
# 1. Check Railway status
https://status.railway.app

# 2. Check service status
railway status --service 9fd67b0e-7883-4973-85a5-639d9513d343

# 3. Restart service
railway restart --service 9fd67b0e-7883-4973-85a5-639d9513d343

# 4. If restart fails, redeploy
railway up --service 9fd67b0e-7883-4973-85a5-639d9513d343

# 5. If redeploy fails, rollback
railway rollback --service 9fd67b0e-7883-4973-85a5-639d9513d343
```

### 🔐 Security Incident

**Symptoms**: Unauthorized access, data breach, suspicious activity

**Immediate Actions**:

```bash
# 1. Isolate affected systems
railway variables set MAINTENANCE_MODE=true --service [service-id]

# 2. Rotate all secrets
railway variables set SESSION_SECRET=[new] --service [service-id]
railway variables set JWT_SECRET=[new] --service [service-id]

# 3. Force logout all users
# Clear all sessions from database

# 4. Review audit logs
railway logs --service [service-id] | grep -E "auth|login|access"

# 5. Enable additional logging
railway variables set LOG_LEVEL=debug --service [service-id]
```

### 💾 Database Issues

**Symptoms**: Connection errors, slow queries, data inconsistency

**Immediate Actions**:

```bash
# 1. Check database status
.\scripts\database-operations.ps1 -Operation status -Environment production

# 2. Check connection pool
railway logs --service [service-id] | grep "pool"

# 3. Kill long-running queries
psql $DATABASE_URL -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'active' AND query_start < now() - interval '5 minutes';"

# 4. If corrupted, restore from backup
.\scripts\database-operations.ps1 -Operation restore -Environment production -BackupFile latest

# 5. Run maintenance
.\scripts\database-operations.ps1 -Operation maintenance -Environment production
```

### ⚡ Performance Degradation

**Symptoms**: Slow response times, timeouts, high CPU/memory

**Immediate Actions**:

```bash
# 1. Check metrics
railway metrics --service [service-id]

# 2. Identify bottlenecks
railway logs --service [service-id] | grep -E "slow|timeout|performance"

# 3. Clear cache
railway variables set CACHE_CLEAR=true --service [service-id]
railway restart --service [service-id]

# 4. Scale horizontally
# Increase replicas in Railway dashboard

# 5. Optimize database
.\scripts\database-operations.ps1 -Operation maintenance -Environment production
```

### 🔗 Integration Failure

**Symptoms**: External API errors, sync failures

**Immediate Actions**:

```bash
# 1. Check external service status
curl https://api.xero.com/health
curl https://api.shopify.com/health

# 2. Verify API keys
railway variables get XERO_CLIENT_ID --service [service-id]

# 3. Enable fallback mode
railway variables set USE_FALLBACK=true --service [service-id]

# 4. Clear integration cache
railway variables set CLEAR_INTEGRATION_CACHE=true --service [service-id]

# 5. Retry failed operations
# Run retry script for failed webhooks
```

---

## 🛠️ Tools & Commands

### Essential Commands

```bash
# Health check
curl https://sentia-manufacturing-production.up.railway.app/api/health

# View logs
railway logs --service 9fd67b0e-7883-4973-85a5-639d9513d343 --since 1h

# Restart service
railway restart --service 9fd67b0e-7883-4973-85a5-639d9513d343

# Rollback
railway rollback --service 9fd67b0e-7883-4973-85a5-639d9513d343

# Database backup
.\scripts\database-operations.ps1 -Operation backup -Environment production

# Monitor health
.\scripts\health-monitor.ps1 -Mode continuous
```

### Useful Queries

```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity;

-- Long running queries
SELECT pid, query, state, query_start
FROM pg_stat_activity
WHERE state = 'active'
AND query_start < now() - interval '5 minutes';

-- Table sizes
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Recent errors
SELECT * FROM error_logs
WHERE created_at > now() - interval '1 hour'
ORDER BY created_at DESC
LIMIT 50;
```

---

## 📝 Communication Templates

### Initial Alert

```
🚨 INCIDENT DETECTED 🚨
Severity: P[1-4]
Service: [Service Name]
Impact: [Brief description]
Status: Investigating
IC: @[name]
Thread: [Link to incident channel]
```

### Status Update

```
📊 INCIDENT UPDATE
Time: [Current time]
Status: [Investigating/Mitigating/Monitoring]
Progress: [What's been done]
Next: [What's next]
ETA: [Estimate if available]
```

### Resolution

```
✅ INCIDENT RESOLVED
Duration: [Start - End time]
Root Cause: [Brief explanation]
Resolution: [What fixed it]
Follow-up: [Post-mortem scheduled]
```

---

## 📚 References

- [Railway Documentation](https://docs.railway.app)
- [Operational Runbook](./OPERATIONAL_RUNBOOK.md)
- [Database Operations](./scripts/database-operations.ps1)
- [Health Monitor](./scripts/health-monitor.ps1)
- [Production Readiness](./PRODUCTION_READINESS.md)

---

**Last Updated**: December 15, 2024
**Version**: 1.0.0
**Review Cycle**: Monthly
