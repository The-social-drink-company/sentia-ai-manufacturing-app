# Disaster Recovery Procedures

## Table of Contents
1. [Emergency Contacts](#emergency-contacts)
2. [Incident Classification](#incident-classification)
3. [Recovery Procedures](#recovery-procedures)
4. [Backup & Restore](#backup--restore)
5. [Rollback Procedures](#rollback-procedures)
6. [Communication Plan](#communication-plan)
7. [Post-Incident Review](#post-incident-review)

## Emergency Contacts

### Primary Contacts
- **Infrastructure Lead**: [Contact via Railway dashboard]
- **Database Admin**: [Neon console access required]
- **Security Team**: [Via GitHub security tab]
- **Customer Success**: [Internal escalation]

### Escalation Path
1. On-call engineer
2. Team lead
3. Infrastructure team
4. CTO/VP Engineering

## Incident Classification

### Severity Levels

#### SEV 1 - Critical
- Complete service outage
- Data loss or corruption
- Security breach
- Payment processing failure

**Response Time**: Immediate
**Team Required**: All hands

#### SEV 2 - Major
- Partial service degradation
- Key feature unavailable
- Performance < 50% normal
- Authentication issues

**Response Time**: Within 30 minutes
**Team Required**: On-call + Lead

#### SEV 3 - Minor
- Single feature affected
- Performance 50-80% normal
- Non-critical API errors

**Response Time**: Within 2 hours
**Team Required**: On-call engineer

#### SEV 4 - Low
- Cosmetic issues
- Documentation errors
- Non-blocking bugs

**Response Time**: Next business day
**Team Required**: Regular rotation

## Recovery Procedures

### 1. Service Outage Recovery

```bash
# Step 1: Assess the situation
railway status
railway logs --service web --tail 100

# Step 2: Check health endpoints
curl https://sentia-manufacturing.railway.app/api/health
curl https://sentia-manufacturing.railway.app/api/metrics

# Step 3: If unhealthy, restart services
railway restart --service web --environment production
railway restart --service worker --environment production

# Step 4: If still failing, rollback
railway rollback --service web --environment production

# Step 5: Scale horizontally if needed
railway scale --service web --replicas 3
```

### 2. Database Recovery

```bash
# Step 1: Check database status
psql $DATABASE_URL -c "SELECT 1;"

# Step 2: Check connection pool
railway logs --service web | grep "database"

# Step 3: If connection issues, restart pool
railway restart --service web

# Step 4: If data issues, restore from backup
# Connect to Neon console
neon branches create --name recovery-$(date +%Y%m%d)
neon restore --branch recovery-$(date +%Y%m%d) --timestamp "2024-01-01 12:00:00"

# Step 5: Verify data integrity
npm run db:validate

# Step 6: Switch to recovery branch
railway env --set DATABASE_URL=$RECOVERY_DATABASE_URL
```

### 3. Redis Recovery

```bash
# Step 1: Check Redis status
redis-cli -u $REDIS_URL ping

# Step 2: Check memory usage
redis-cli -u $REDIS_URL info memory

# Step 3: If memory issues, flush non-critical data
redis-cli -u $REDIS_URL --scan --pattern "cache:*" | xargs redis-cli -u $REDIS_URL del

# Step 4: Restart Redis if needed
railway restart --service redis

# Step 5: Warm up cache
npm run cache:warm
```

### 4. Queue Recovery

```bash
# Step 1: Check queue status
curl https://sentia-manufacturing.railway.app/api/queues/status

# Step 2: If backed up, pause processing
npm run queue:pause

# Step 3: Clear failed jobs
npm run queue:clear-failed

# Step 4: Resume processing with lower concurrency
QUEUE_CONCURRENCY=1 npm run queue:resume

# Step 5: Monitor progress
npm run queue:monitor
```

## Backup & Restore

### Automated Backups

#### Database (Neon)
- **Frequency**: Every 4 hours
- **Retention**: 30 days (production), 7 days (test)
- **Type**: Point-in-time recovery
- **Location**: Neon cloud storage

#### Redis
- **Frequency**: Every hour
- **Retention**: 24 hours
- **Type**: RDB snapshots + AOF
- **Location**: Railway persistent volume

#### Application Data
- **Frequency**: Daily
- **Retention**: 30 days
- **Type**: File system snapshots
- **Location**: S3 bucket

### Manual Backup Procedures

```bash
# Database backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql
aws s3 cp backup-*.sql s3://sentia-backups-prod/database/

# Redis backup
redis-cli -u $REDIS_URL BGSAVE
redis-cli -u $REDIS_URL --rdb dump.rdb
aws s3 cp dump.rdb s3://sentia-backups-prod/redis/

# Application files backup
tar -czf app-backup-$(date +%Y%m%d).tar.gz ./uploads ./temp
aws s3 cp app-backup-*.tar.gz s3://sentia-backups-prod/files/
```

### Restore Procedures

```bash
# Database restore
aws s3 cp s3://sentia-backups-prod/database/backup-20240101.sql .
psql $DATABASE_URL < backup-20240101.sql

# Redis restore
aws s3 cp s3://sentia-backups-prod/redis/dump.rdb .
redis-cli -u $REDIS_URL --pipe < dump.rdb

# Application files restore
aws s3 cp s3://sentia-backups-prod/files/app-backup-20240101.tar.gz .
tar -xzf app-backup-20240101.tar.gz
```

## Rollback Procedures

### Application Rollback

```bash
# Step 1: Identify last known good deployment
railway deployments list --service web

# Step 2: Rollback to specific deployment
railway rollback --service web --deployment-id <deployment-id>

# Step 3: Verify rollback
curl https://sentia-manufacturing.railway.app/api/health

# Step 4: Rollback worker service if needed
railway rollback --service worker --deployment-id <deployment-id>
```

### Database Migration Rollback

```bash
# Step 1: Check migration status
npx prisma migrate status

# Step 2: Rollback last migration
npx prisma migrate resolve --rolled-back <migration-name>

# Step 3: Apply down migration
npx prisma migrate deploy --preview-feature

# Step 4: Verify schema
npx prisma db pull
```

### Infrastructure Rollback

```yaml
# Use GitHub Actions to revert
- name: Revert to previous infrastructure
  run: |
    git revert HEAD
    git push origin production
```

## Communication Plan

### Internal Communication

1. **Immediate**: Post in #incidents Slack channel
2. **Updates**: Every 30 minutes during incident
3. **Resolution**: Final summary in #incidents

### Customer Communication

#### SEV 1-2 Incidents
1. **T+0**: Status page update
2. **T+15min**: Email to affected customers
3. **T+30min**: Detailed update
4. **Resolution**: Full RCA within 24 hours

#### SEV 3-4 Incidents
1. **Status page**: Update if customer-facing
2. **Email**: Include in weekly update

### Status Page Updates

```markdown
## Template: Investigating
We are currently investigating reports of [issue description].
Our team is actively working on identifying the cause.

Last updated: [timestamp]

## Template: Identified
We have identified the issue affecting [service/feature].
A fix is being implemented.

Impact: [describe impact]
Workaround: [if available]

Last updated: [timestamp]

## Template: Resolved
The issue affecting [service/feature] has been resolved.
All systems are operational.

Duration: [start] - [end]
Root cause: [brief description]

A full post-mortem will be available within 24 hours.
```

## Post-Incident Review

### Timeline Documentation

```markdown
## Incident Timeline

**Incident ID**: INC-YYYYMMDD-XXX
**Severity**: SEV X
**Duration**: XX minutes
**Services Affected**: [list]

### Timeline
- HH:MM - Alert triggered
- HH:MM - Engineer acknowledged
- HH:MM - Issue identified
- HH:MM - Fix deployed
- HH:MM - Service restored
- HH:MM - Monitoring confirmed stable

### Impact
- Users affected: XXX
- Requests failed: XXX
- Data loss: None/Description
- Revenue impact: $XXX
```

### Root Cause Analysis

1. **What happened?**
   - Technical description
   - User impact

2. **Why did it happen?**
   - Root cause
   - Contributing factors

3. **How was it resolved?**
   - Immediate fix
   - Long-term solution

4. **What will prevent recurrence?**
   - Process improvements
   - Technical improvements
   - Monitoring improvements

### Action Items

- [ ] Update monitoring alerts
- [ ] Improve documentation
- [ ] Add automated tests
- [ ] Update runbooks
- [ ] Schedule follow-up review

## Maintenance Mode

### Enabling Maintenance Mode

```bash
# Set maintenance flag
railway env --set MAINTENANCE_MODE=true

# Deploy maintenance page
railway up --service web --environment production

# Verify maintenance page
curl https://sentia-manufacturing.railway.app
```

### Disabling Maintenance Mode

```bash
# Remove maintenance flag
railway env --unset MAINTENANCE_MODE

# Deploy normal service
railway up --service web --environment production

# Verify service restored
curl https://sentia-manufacturing.railway.app/api/health
```

## Recovery Testing

### Monthly Drills

1. **Backup restoration test**
   - Restore database to test environment
   - Verify data integrity

2. **Failover test**
   - Simulate service failure
   - Test automatic recovery

3. **Rollback test**
   - Deploy bad version to test
   - Practice rollback procedure

### Quarterly Reviews

1. Review and update this document
2. Update emergency contacts
3. Test communication channels
4. Review incident metrics
5. Update automation scripts

## Automation Scripts

Scripts are located in `/scripts/disaster-recovery/`:
- `backup.sh` - Manual backup script
- `restore.sh` - Restoration script
- `health-check.sh` - Health validation
- `rollback.sh` - Automated rollback
- `scale.sh` - Emergency scaling
- `maintenance.sh` - Maintenance mode toggle

---

**Last Updated**: January 2025
**Review Schedule**: Quarterly
**Owner**: Infrastructure Team