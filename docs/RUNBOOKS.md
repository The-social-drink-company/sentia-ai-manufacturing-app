# Production Runbooks

## Overview
This document contains operational procedures and troubleshooting guides for the Sentia Manufacturing Dashboard production environment.

## Table of Contents
1. [Emergency Procedures](#emergency-procedures)
2. [Monitoring & Alerting](#monitoring--alerting)
3. [Deployment Procedures](#deployment-procedures)
4. [Incident Response](#incident-response)
5. [Performance Troubleshooting](#performance-troubleshooting)
6. [Database Operations](#database-operations)
7. [Security Incidents](#security-incidents)
8. [Backup & Recovery](#backup--recovery)

---

## Emergency Procedures

### 🚨 System Down - Critical Outage

**Immediate Actions (0-5 minutes):**
1. **Acknowledge the incident**
   ```bash
   # Check system health
   curl -f https://sentia-manufacturing.com/health
   
   # Check Railway services
   railway status --environment production
   ```

2. **Assess impact**
   - Check error rates in monitoring dashboard
   - Verify if database is accessible
   - Check external API dependencies

3. **Emergency rollback if needed**
   ```bash
   # Get last known good deployment
   railway deployments --limit 5
   
   # Rollback to previous version
   railway rollback [DEPLOYMENT_ID]
   ```

**Communication (Within 10 minutes):**
```bash
# Notify team via Slack
curl -X POST $SLACK_WEBHOOK_URL -d '{
  "text": "🚨 CRITICAL: Production system outage detected",
  "attachments": [{
    "color": "danger",
    "fields": [
      {"title": "Status", "value": "Investigating", "short": true},
      {"title": "ETA", "value": "TBD", "short": true}
    ]
  }]
}'
```

### 🔥 High Error Rate Alert

**Investigation Steps:**
1. **Check recent deployments**
   ```bash
   # Review last 3 deployments
   railway deployments --limit 3
   
   # Check deployment logs
   railway logs --deployment [DEPLOYMENT_ID]
   ```

2. **Analyze error patterns**
   ```bash
   # Check application logs
   railway logs --filter "ERROR" --tail 100
   
   # Review Sentry dashboard for error trends
   open https://sentry.io/organizations/sentia/issues/
   ```

3. **Database health check**
   ```bash
   # Check database connections
   railway connect postgres
   SELECT count(*) FROM pg_stat_activity;
   
   # Check slow queries
   SELECT query, calls, mean_exec_time 
   FROM pg_stat_statements 
   ORDER BY mean_exec_time DESC LIMIT 10;
   ```

**Resolution Actions:**
- If recent deployment caused issues: Rollback
- If database issues: Scale up or optimize queries
- If external API issues: Enable circuit breaker

---

## Monitoring & Alerting

### Dashboard Access
- **Production Monitoring**: https://dashboard.sentia-manufacturing.com/ops
- **Sentry**: https://sentry.io/organizations/sentia/
- **Railway Logs**: https://railway.app/project/[PROJECT_ID]

### Key Metrics to Monitor

#### System Health Metrics
```yaml
CPU Usage: < 80% (Alert at 90%)
Memory Usage: < 85% (Alert at 95%)
Disk Usage: < 80% (Alert at 90%)
Response Time: < 2000ms (Alert at 3000ms)
Error Rate: < 1% (Alert at 5%)
Uptime: > 99.9% (Alert at 99.5%)
```

#### Business Metrics
```yaml
Active Users: Monitor for 50% drops
Conversion Rate: Alert if < 2%
Revenue Per Hour: Alert on 2σ deviation
Critical Inventory Items: Alert if > 0
API Success Rate: Alert if < 99%
```

### Alert Escalation Matrix

| Severity | Initial | 15 min | 30 min | 1 hour |
|----------|---------|--------|--------|--------|
| Critical | On-call + Slack | Engineering Lead | CTO | CEO |
| High | Slack + Email | On-call | Engineering Lead | - |
| Medium | Slack | Email | - | - |
| Low | Email | - | - | - |

---

## Deployment Procedures

### Standard Deployment
```bash
# 1. Pre-deployment checks
git checkout production
git pull origin production
npm run build
npm test

# 2. Deploy to staging first
railway deploy --environment staging

# 3. Run smoke tests on staging
curl -f https://staging.sentia-manufacturing.com/health
npm run test:e2e:staging

# 4. Deploy to production
railway deploy --environment production

# 5. Post-deployment verification
sleep 120  # Wait for metrics to stabilize
npm run verify:production
```

### Hotfix Deployment
```bash
# 1. Create hotfix branch from production
git checkout production
git checkout -b hotfix/critical-fix

# 2. Apply minimal fix
# Make necessary changes...
git commit -m "hotfix: critical fix description"

# 3. Fast-track deployment
railway deploy --environment production --force

# 4. Immediate verification
curl -f https://sentia-manufacturing.com/health
npm run test:critical-path

# 5. Notify team
echo "Hotfix deployed: [description]" | \
  curl -X POST $SLACK_WEBHOOK_URL -d @-
```

### Rollback Procedure
```bash
# 1. Identify target deployment
railway deployments --limit 10

# 2. Execute rollback
railway rollback [DEPLOYMENT_ID]

# 3. Verify rollback success
sleep 60
curl -f https://sentia-manufacturing.com/health

# 4. Update monitoring
curl -X POST https://api.sentry.io/organizations/sentia/releases/[VERSION]/deploys/ \
  -H "Authorization: Bearer $SENTRY_TOKEN" \
  -d '{"environment": "production", "rollback": true}'
```

---

## Incident Response

### Incident Severity Classification

#### P0 - Critical (15 min response)
- Complete system outage
- Data loss or corruption
- Security breach
- Revenue-impacting issues

#### P1 - High (1 hour response)
- Significant performance degradation
- Feature completely broken
- High error rates (>10%)

#### P2 - Medium (4 hour response)
- Minor performance issues
- Non-critical feature broken
- Elevated error rates (5-10%)

#### P3 - Low (24 hour response)
- Minor bugs
- UI/UX issues
- Documentation errors

### Incident Response Process

#### 1. Initial Response (0-15 minutes)
```bash
# Create incident in tracking system
curl -X POST $INCIDENT_API \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Production Issue: [Description]",
    "severity": "P0",
    "status": "investigating"
  }'

# Join incident channel
# #incident-[timestamp] in Slack

# Begin investigation
railway logs --tail 1000 | grep ERROR
```

#### 2. Investigation (15-60 minutes)
- Gather logs and metrics
- Identify root cause
- Assess impact and affected users
- Communicate findings to stakeholders

#### 3. Resolution (varies)
- Implement fix or workaround
- Deploy solution
- Verify resolution
- Monitor for recurrence

#### 4. Post-Incident (24-48 hours)
- Write incident report
- Conduct blameless post-mortem
- Identify prevention measures
- Update runbooks and monitoring

### Communication Templates

#### Initial Alert
```
🚨 **INCIDENT ALERT**
**Severity**: P[0-3]
**Status**: Investigating
**Impact**: [Brief description]
**ETA**: Investigating
**Lead**: @[username]
```

#### Status Update
```
📊 **INCIDENT UPDATE**
**Status**: [Investigating/Mitigating/Resolved]
**Progress**: [What has been done]
**Next Steps**: [What will be done next]
**ETA**: [Updated timeline]
```

#### Resolution
```
✅ **INCIDENT RESOLVED**
**Duration**: [X minutes]
**Root Cause**: [Brief explanation]
**Resolution**: [What was done]
**Follow-up**: [Any necessary actions]
```

---

## Performance Troubleshooting

### High CPU Usage

**Investigation Steps:**
```bash
# Check process usage in Railway logs
railway logs --filter "CPU" --tail 100

# Review slow endpoints
curl -s https://sentia-manufacturing.com/api/metrics/slow-queries

# Check for infinite loops or heavy operations
railway exec -- top -p $(pgrep node)
```

**Common Causes & Solutions:**
- **Heavy computations**: Move to background jobs
- **Inefficient algorithms**: Profile and optimize code
- **Memory leaks**: Check for unclosed connections/listeners
- **High traffic**: Scale horizontally

### Database Performance Issues

**Slow Query Analysis:**
```sql
-- Find slow queries
SELECT query, calls, total_exec_time, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Check for missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public'
AND n_distinct > 100
AND correlation < 0.1;

-- Monitor active connections
SELECT count(*), state
FROM pg_stat_activity
GROUP BY state;
```

**Performance Optimizations:**
```bash
# Enable connection pooling
# Add to DATABASE_URL: ?pgbouncer=true&connection_limit=10

# Optimize queries with EXPLAIN ANALYZE
railway connect postgres
EXPLAIN ANALYZE SELECT * FROM orders WHERE status = 'pending';

# Add indexes for common queries
CREATE INDEX CONCURRENTLY idx_orders_status ON orders(status);
```

### Memory Issues

**Investigation:**
```bash
# Check memory usage patterns
railway logs --filter "memory" --tail 200

# Monitor heap usage
curl -s https://sentia-manufacturing.com/api/metrics/memory
```

**Common Solutions:**
- Implement proper caching strategies
- Fix memory leaks (unclosed DB connections, event listeners)
- Optimize large data processing
- Increase memory limits if needed

---

## Database Operations

### Backup Procedures

**Automated Daily Backups:**
```bash
# Verify backup schedule
railway variables get BACKUP_SCHEDULE
# Should be: "0 2 * * *" (daily at 2 AM)

# Manual backup
railway exec -- pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Upload to S3
aws s3 cp backup_*.sql s3://sentia-backups/database/
```

**Backup Verification:**
```bash
# Test backup integrity
railway exec -- pg_restore --list backup_latest.sql

# Verify backup size and date
aws s3 ls s3://sentia-backups/database/ --recursive --human-readable
```

### Database Maintenance

**Weekly Tasks:**
```sql
-- Update table statistics
ANALYZE;

-- Rebuild indexes if needed
REINDEX DATABASE sentia_production;

-- Clean up old data (if applicable)
DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '90 days';
```

**Monthly Tasks:**
```sql
-- Vacuum full (schedule during low-traffic)
VACUUM FULL;

-- Update extensions
-- (Coordinate with Railway support)
```

### Data Recovery

**Point-in-Time Recovery:**
```bash
# Create new database from backup
railway database create --from-backup [BACKUP_ID]

# Switch application to use recovery database
railway variables set DATABASE_URL=[RECOVERY_URL]

# Deploy with new database URL
railway deploy
```

---

## Security Incidents

### Suspected Security Breach

**Immediate Actions (0-10 minutes):**
1. **Do NOT shut down systems** (preserve evidence)
2. **Change all service passwords/tokens**
   ```bash
   # Rotate Clerk keys
   # Rotate database passwords
   # Rotate API keys
   railway variables set CLERK_SECRET_KEY=[NEW_KEY]
   ```
3. **Enable enhanced logging**
4. **Block suspicious IPs** (if identified)

**Investigation (10-60 minutes):**
```bash
# Review access logs
railway logs --filter "unauthorized\|failed\|blocked" --tail 1000

# Check for unusual patterns
grep -E "(sql injection|xss|rce)" logs/security.log

# Review user account activities
SELECT * FROM audit_logs 
WHERE action IN ('login', 'password_change', 'privilege_escalation')
AND created_at > NOW() - INTERVAL '24 hours';
```

**Containment:**
- Isolate affected systems
- Revoke compromised credentials
- Apply security patches
- Implement additional monitoring

### Data Breach Response

**Within 1 Hour:**
1. Contain the breach
2. Assess scope of compromised data
3. Document everything
4. Notify legal team and leadership

**Within 24 Hours:**
1. Prepare breach notification (if PII affected)
2. Coordinate with legal counsel
3. Prepare customer communications
4. Implement additional security measures

**Within 72 Hours:**
1. Submit required breach notifications (GDPR, etc.)
2. Conduct forensic analysis
3. Implement permanent fixes
4. Update security policies

---

## Backup & Recovery

### Disaster Recovery Plan

**RTO (Recovery Time Objective)**: 4 hours
**RPO (Recovery Point Objective)**: 1 hour

### Full System Recovery

**Step 1: Infrastructure Recovery**
```bash
# Create new Railway project
railway project create sentia-dashboard-recovery

# Configure environment variables
railway variables set DATABASE_URL=[BACKUP_DATABASE_URL]
railway variables set REDIS_URL=[NEW_REDIS_URL]
# ... all other environment variables

# Deploy from last known good commit
git checkout production
railway deploy
```

**Step 2: Database Recovery**
```bash
# Restore from most recent backup
railway database restore --from-backup [LATEST_BACKUP_ID]

# Verify data integrity
railway connect postgres
SELECT count(*) FROM users;
SELECT count(*) FROM orders;
```

**Step 3: Verification & Cutover**
```bash
# Run smoke tests
npm run test:e2e -- --baseUrl=https://recovery.sentia-manufacturing.com

# Update DNS to point to recovery environment
# (Coordinate with DNS provider)

# Monitor system health
curl -f https://sentia-manufacturing.com/health
```

### Recovery Testing

**Monthly Recovery Drills:**
1. Create recovery environment
2. Restore from backup
3. Test critical functionality
4. Measure recovery time
5. Document lessons learned
6. Clean up test environment

**Annual Disaster Recovery Tests:**
1. Full system failover
2. Team communication test
3. Customer notification process
4. Complete recovery verification
5. Business continuity validation

---

## Maintenance Windows

### Scheduled Maintenance

**Monthly Maintenance (First Sunday of each month, 2-4 AM EST):**
```bash
# 1. Pre-maintenance checklist
# - Notify users 48 hours in advance
# - Prepare rollback plan
# - Backup database

# 2. Maintenance activities
# - Apply security updates
# - Database maintenance
# - Performance optimizations
# - Update dependencies

# 3. Post-maintenance verification
# - Run full test suite
# - Verify all services
# - Monitor metrics for 2 hours
```

### Emergency Maintenance

**Process for unplanned maintenance:**
1. Assess urgency and impact
2. Notify stakeholders immediately
3. Prepare maintenance plan
4. Execute with rollback ready
5. Communicate completion

---

## Contact Information

### On-Call Rotation
- **Primary**: [Phone] [Email] [Slack]
- **Secondary**: [Phone] [Email] [Slack]
- **Escalation**: Engineering Lead

### External Contacts
- **Railway Support**: support@railway.app
- **Neon Support**: support@neon.tech  
- **Clerk Support**: support@clerk.dev

### Internal Escalation
1. **Engineering Lead**: 15 minutes
2. **VP Engineering**: 30 minutes
3. **CTO**: 1 hour
4. **CEO**: 2 hours (P0 only)

---

## Appendix

### Useful Commands

```bash
# Check system health
curl -f https://sentia-manufacturing.com/health

# View recent logs
railway logs --tail 100

# Check deployment status
railway status

# Scale service
railway service scale --replicas 3

# Update environment variable
railway variables set KEY=value

# Connect to database
railway connect postgres

# Execute command in container
railway exec -- [command]

# View metrics
curl -s https://sentia-manufacturing.com/api/metrics
```

### Log Analysis Commands

```bash
# Find errors in last hour
railway logs --since 1h --filter ERROR

# Count errors by type
railway logs --since 1h | grep ERROR | cut -d' ' -f5 | sort | uniq -c

# Monitor specific endpoint
railway logs --follow --filter "/api/orders"

# Find slow requests
railway logs | grep "response_time" | awk '$NF > 1000'
```

### Performance Commands

```bash
# CPU and memory usage
railway exec -- ps aux

# Network connections
railway exec -- netstat -an

# Disk usage
railway exec -- df -h

# Process tree
railway exec -- pstree

# Top processes
railway exec -- top -n 1
```

---

*Last Updated: January 2025*
*Version: 1.0.0*
*Next Review: April 2025*