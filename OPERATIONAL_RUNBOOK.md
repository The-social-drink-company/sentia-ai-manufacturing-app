# CapLiquify Manufacturing Platform - Operational Runbook

## Table of Contents

1. [System Overview](#system-overview)
2. [Daily Operations](#daily-operations)
3. [Common Tasks](#common-tasks)
4. [Troubleshooting Guide](#troubleshooting-guide)
5. [Incident Response](#incident-response)
6. [Maintenance Procedures](#maintenance-procedures)
7. [Emergency Procedures](#emergency-procedures)

---

## System Overview

### Architecture

- **Frontend**: React + Vite (Port 3000)
- **Backend**: Node.js + Express (Port 5000)
- **Database**: Neon PostgreSQL
- **Hosting**: Railway Platform
- **Authentication**: Clerk
- **MCP Server**: AI Orchestration (Port 3001)

### Environments

| Environment | URL                                                     | Purpose            | Branch      |
| ----------- | ------------------------------------------------------- | ------------------ | ----------- |
| Development | https://sentia-manufacturing-development.up.railway.app | Active development | development |
| Testing     | https://sentia-manufacturing-testing.up.railway.app     | UAT testing        | test        |
| Production  | https://sentia-manufacturing-production.up.railway.app  | Live system        | production  |

### Key Services

- **Railway Project ID**: `6d1ca9b2-75e2-46c6-86a8-ed05161112fe`
- **GitHub Repository**: https://github.com/The-social-drink-company/sentia-manufacturing-dashboard
- **Database**: Neon PostgreSQL (connection pooling enabled)
- **External APIs**: Xero, Shopify, Amazon SP-API, Unleashed

---

## Daily Operations

### Morning Checklist (9:00 AM)

```bash
# 1. Check system health
.\scripts\health-monitor.ps1 -Mode once

# 2. Review overnight logs
railway logs --service 9fd67b0e-7883-4973-85a5-639d9513d343 --environment production --since 12h

# 3. Check error rates
# Review Sentry dashboard for new errors

# 4. Verify database health
# Check Neon dashboard for slow queries

# 5. Review monitoring alerts
# Check email/Slack for overnight alerts
```

### Evening Checklist (5:00 PM)

```bash
# 1. Review daily metrics
# - User activity
# - API performance
# - Error rates

# 2. Check scheduled jobs
# Verify all scheduled tasks completed

# 3. Review resource usage
railway metrics --service 9fd67b0e-7883-4973-85a5-639d9513d343

# 4. Backup verification
# Confirm daily backup completed
```

---

## Common Tasks

### 1. Deploy Code Changes

#### Development Deployment

```bash
git checkout development
git pull origin development
.\deploy-railway.ps1 development
```

#### Testing Deployment

```bash
git checkout test
git merge development
git push origin test
.\deploy-railway.ps1 testing
```

#### Production Deployment

```bash
git checkout production
git merge test
git push origin production
.\deploy-railway.ps1 production
# Type 'yes' when prompted
```

### 2. View Logs

#### Real-time Logs

```bash
railway logs --service [service-id] --environment [env] --follow
```

#### Historical Logs

```bash
railway logs --service [service-id] --environment [env] --since 24h
```

#### Error Logs Only

```bash
railway logs --service [service-id] --environment [env] | grep ERROR
```

### 3. Database Operations

#### Connect to Database

```bash
# Use connection string from Railway dashboard
psql "postgresql://user:pass@host/database?sslmode=require"
```

#### Run Migrations

```bash
npx prisma migrate deploy
```

#### Database Backup

```bash
pg_dump "postgresql://..." > backup_$(date +%Y%m%d).sql
```

#### Database Restore

```bash
psql "postgresql://..." < backup_20240101.sql
```

### 4. Environment Variables

#### View All Variables

```bash
railway variables --service [service-id] --environment [env]
```

#### Set Variable

```bash
railway variables set KEY=value --service [service-id] --environment [env]
```

#### Remove Variable

```bash
railway variables remove KEY --service [service-id] --environment [env]
```

### 5. Restart Services

#### Restart Service

```bash
railway restart --service [service-id] --environment [env]
```

#### Hard Restart (Redeploy)

```bash
railway up --service [service-id] --environment [env]
```

---

## Troubleshooting Guide

### Issue: Application Not Loading

**Symptoms**: White screen, 502 error

**Diagnosis**:

```bash
# Check service status
railway status --service [service-id]

# Check logs for errors
railway logs --service [service-id] --environment [env] --since 1h

# Test health endpoint
curl https://[domain]/api/health
```

**Resolution**:

1. Check Railway dashboard for deployment status
2. Verify environment variables are set
3. Restart service if needed
4. Check database connectivity

### Issue: Database Connection Failed

**Symptoms**: "Database connection failed" errors

**Diagnosis**:

```bash
# Test database connection
psql "postgresql://..." -c "SELECT 1"

# Check connection pool status
railway logs --service [service-id] | grep "pool"
```

**Resolution**:

1. Verify DATABASE_URL is correct
2. Check Neon dashboard for database status
3. Reset connection pool
4. Increase pool size if needed

### Issue: High Memory Usage

**Symptoms**: Service crashes, OOM errors

**Diagnosis**:

```bash
# Check memory usage
railway metrics --service [service-id]

# Find memory leaks
railway logs --service [service-id] | grep "heap"
```

**Resolution**:

1. Restart service to clear memory
2. Increase memory limits in Railway
3. Investigate memory leaks in code
4. Optimize queries and caching

### Issue: Slow API Response

**Symptoms**: API calls taking >2 seconds

**Diagnosis**:

```bash
# Check response times
curl -w "@curl-format.txt" -o /dev/null -s https://[domain]/api/health

# Review slow queries
# Check Neon dashboard for slow query log
```

**Resolution**:

1. Check database query performance
2. Review API endpoint code
3. Enable caching if not active
4. Scale service if needed

### Issue: Authentication Failures

**Symptoms**: Users can't log in

**Diagnosis**:

```bash
# Check Clerk status
curl https://api.clerk.dev/v1/health

# Review auth logs
railway logs --service [service-id] | grep "auth"
```

**Resolution**:

1. Verify Clerk keys are correct
2. Check Clerk dashboard for issues
3. Clear session storage
4. Update redirect URLs if needed

---

## Incident Response

### Severity Levels

| Level         | Description                | Response Time | Examples                       |
| ------------- | -------------------------- | ------------- | ------------------------------ |
| P1 - Critical | Complete outage            | 15 minutes    | Site down, data loss           |
| P2 - High     | Major functionality broken | 1 hour        | Login failures, payment issues |
| P3 - Medium   | Degraded performance       | 4 hours       | Slow responses, minor bugs     |
| P4 - Low      | Minor issues               | 24 hours      | UI glitches, typos             |

### Incident Response Process

#### 1. Detection (0-5 minutes)

- Alert received (monitoring/user report)
- Verify incident is real
- Determine severity level

#### 2. Response (5-15 minutes)

- Create incident channel in Slack
- Assign incident commander
- Begin investigation
- Update status page

#### 3. Diagnosis (15-30 minutes)

```bash
# Quick diagnosis commands
.\scripts\health-monitor.ps1 -Mode once
railway logs --service [service-id] --since 30m
curl https://[domain]/api/health
```

#### 4. Mitigation (30+ minutes)

- Implement temporary fix if possible
- Consider rollback if necessary
- Scale resources if needed
- Update stakeholders

#### 5. Resolution

- Deploy permanent fix
- Verify resolution
- Update status page
- Close incident

#### 6. Post-Mortem (Within 48 hours)

- Document timeline
- Identify root cause
- List action items
- Share learnings

### Rollback Procedure

```bash
# 1. Identify last working deployment
railway deployments --service [service-id]

# 2. Rollback to specific deployment
railway rollback [deployment-id] --service [service-id]

# 3. Verify rollback
curl https://[domain]/api/health

# 4. Investigate issue in development
git checkout development
git revert [commit-hash]
```

---

## Maintenance Procedures

### Weekly Maintenance

#### Monday - Performance Review

```bash
# Review performance metrics
# Check Lighthouse scores
# Analyze slow queries
# Review error rates
```

#### Wednesday - Security Check

```bash
# Run security audit
npm audit

# Review access logs
railway logs --service [service-id] | grep "unauthorized"

# Check for suspicious activity
```

#### Friday - Backup Verification

```bash
# Test backup restoration
# Verify backup completeness
# Check backup storage usage
```

### Monthly Maintenance

#### First Monday - Dependency Updates

```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Test thoroughly
npm test

# Deploy to development first
```

#### Second Monday - Database Maintenance

```sql
-- Analyze tables
ANALYZE;

-- Vacuum database
VACUUM ANALYZE;

-- Check index usage
SELECT * FROM pg_stat_user_indexes;
```

#### Third Monday - Security Audit

```bash
# Full security scan
npm audit fix

# Review user permissions
# Check API key rotation
# Update secrets if needed
```

#### Fourth Monday - Disaster Recovery Test

```bash
# Test backup restoration
# Verify failover procedures
# Update runbook if needed
```

---

## Emergency Procedures

### Complete Outage

**Immediate Actions**:

1. Check Railway status: https://status.railway.app
2. Check GitHub status: https://www.githubstatus.com
3. Check Neon status: https://status.neon.tech

**If Railway is down**:

- Wait for Railway to resolve
- Communicate with users via status page
- Prepare rollback plan

**If application is down**:

```bash
# 1. Restart all services
railway restart --service [service-id] --environment production

# 2. If restart fails, redeploy
railway up --service [service-id] --environment production

# 3. If redeploy fails, rollback
railway rollback --service [service-id]
```

### Data Loss

**Immediate Actions**:

1. Stop all write operations
2. Assess extent of data loss
3. Initiate recovery procedure

**Recovery Steps**:

```bash
# 1. Restore from latest backup
psql "postgresql://..." < backup_latest.sql

# 2. Replay transaction logs if available
# 3. Verify data integrity
# 4. Resume operations
```

### Security Breach

**Immediate Actions**:

1. Isolate affected systems
2. Revoke compromised credentials
3. Enable emergency access controls

**Response Steps**:

```bash
# 1. Rotate all secrets
railway variables set SESSION_SECRET=[new] --service [service-id]
railway variables set JWT_SECRET=[new] --service [service-id]

# 2. Force logout all users
# 3. Review audit logs
# 4. Implement additional security measures
```

---

## Contact Information

### Technical Team

- **On-Call Engineer**: Check PagerDuty
- **DevOps Lead**: [Contact]
- **Backend Lead**: [Contact]
- **Frontend Lead**: [Contact]
- **Database Admin**: [Contact]

### External Support

- **Railway Support**: https://railway.app/help
- **Neon Support**: https://neon.tech/docs
- **Clerk Support**: https://clerk.dev/support
- **GitHub Support**: https://support.github.com

### Escalation Path

1. On-call engineer (0-15 min)
2. Team lead (15-30 min)
3. Engineering manager (30-60 min)
4. CTO (60+ min)

---

## Quick Reference

### Service IDs

```
Development: e985e174-ebed-4043-81f8-7b1ab2e86cd2
Testing: 92f7cd2f-3dc7-44f4-abd9-1714003c389f
Production: 9fd67b0e-7883-4973-85a5-639d9513d343
```

### Health Check URLs

```
Development: https://sentia-manufacturing-development.up.railway.app/api/health
Testing: https://sentia-manufacturing-testing.up.railway.app/api/health
Production: https://sentia-manufacturing-production.up.railway.app/api/health
```

### Monitoring Commands

```bash
# Quick health check
.\scripts\health-monitor.ps1 -Mode once

# View logs
railway logs --service [service-id] --environment [env]

# Check metrics
railway metrics --service [service-id]

# Restart service
railway restart --service [service-id] --environment [env]
```

---

**Document Version**: 1.0.0
**Last Updated**: December 15, 2024
**Next Review**: January 15, 2025

