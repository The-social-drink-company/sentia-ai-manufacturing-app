# Production Deployment Guide

## Table of Contents
- [Deployment Overview](#deployment-overview)
- [Environment Configuration](#environment-configuration)
- [Deployment Process](#deployment-process)
- [Health Checks & Monitoring](#health-checks--monitoring)
- [Rollback Procedures](#rollback-procedures)
- [Incident Runbook](#incident-runbook)
- [Scaling & Performance](#scaling--performance)
- [Security Checklist](#security-checklist)

## Deployment Overview

### Branch → Environment Mapping
- `development` → dev.sentia-manufacturing.railway.app (Auto-deploy)
- `test` → test.sentia-manufacturing.railway.app (Auto-deploy)
- `production` → sentia-manufacturing.railway.app (Manual approval required)

### Deployment Architecture
```
GitHub Actions → Railway → Multiple Services
                      ├── Web Service (Node.js/Express)
                      ├── Worker Service (BullMQ)
                      ├── PostgreSQL (Neon)
                      └── Redis (Railway)
```

## Environment Configuration

### Critical Environment Variables
```bash
# Required for all environments
NODE_VERSION=20
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
CLERK_SECRET_KEY=...
VITE_CLERK_PUBLISHABLE_KEY=...

# Production-specific
NODE_ENV=production
LOG_LEVEL=info
API_MIN_INSTANCES=2
API_MAX_INSTANCES=10
ENABLE_HSTS=true
PII_REDACTION_ENABLED=true
ENABLE_PITR=true
```

### Secret Rotation Schedule
- **Database credentials**: Quarterly
- **API keys**: Monthly
- **JWT secrets**: Quarterly
- **Webhook secrets**: As needed

Rotation command:
```bash
railway secrets rotate --environment production --secret DATABASE_URL
```

## Deployment Process

### Pre-deployment Checklist
- [ ] All tests passing
- [ ] Security scan completed
- [ ] Database migrations reviewed
- [ ] Environment variables configured
- [ ] Rollback plan documented

### Deployment Steps

#### 1. Development Deployment
```bash
git checkout development
git merge feature/your-feature
git push origin development
# Automatic deployment triggered
```

#### 2. Test Deployment
```bash
git checkout test
git merge development
git push origin test
# Automatic deployment + E2E tests
```

#### 3. Production Deployment
```bash
git checkout production
git merge test
git push origin production
# Requires manual approval in GitHub Actions
```

### Post-deployment Verification

1. **Health Checks**
```bash
curl https://sentia-manufacturing.railway.app/health
curl https://sentia-manufacturing.railway.app/ready
curl https://sentia-manufacturing.railway.app/metrics
```

2. **Smoke Tests**
```bash
# API endpoints
curl https://sentia-manufacturing.railway.app/api/status
curl https://sentia-manufacturing.railway.app/api/admin/health

# Critical user flows
npm run test:smoke -- --env production
```

3. **Performance Validation**
```bash
# Check response times
curl -w "@curl-format.txt" -o /dev/null -s https://sentia-manufacturing.railway.app/api/health

# Monitor metrics
curl https://sentia-manufacturing.railway.app/api/performance
```

## Health Checks & Monitoring

### Endpoints

| Endpoint | Purpose | Expected Response |
|----------|---------|-------------------|
| `/health` | Liveness probe | `{"status":"healthy"}` |
| `/ready` | Readiness probe | `{"ready":true}` |
| `/metrics` | Prometheus metrics | Metrics in text format |
| `/api/status` | Detailed status | JSON with component status |
| `/api/slo-dashboard` | SLO monitoring | Current SLO compliance |

### SLO Targets
- Data freshness: < 30 minutes
- Forecast success rate: > 99%
- Working capital recency: < 24 hours
- API p95 latency: < 500ms
- Error rate: < 1%
- Availability: > 99.9%

### Alert Thresholds
```yaml
Critical:
  - Error rate > 5%
  - Response time p95 > 5s
  - Database connection failures
  - Queue depth > 5000

Warning:
  - Error rate > 1%
  - Response time p95 > 2s
  - Memory usage > 85%
  - Queue depth > 1000
```

## Rollback Procedures

### Automatic Rollback
Triggered when:
- Health checks fail after deployment
- Smoke tests fail
- Error rate exceeds threshold

### Manual Rollback

#### Via Railway CLI
```bash
# List recent deployments
railway deployments list --environment production

# Rollback to specific deployment
railway rollback --deployment-id <deployment-id> --environment production
```

#### Via GitHub Actions
```bash
# Revert the merge commit
git checkout production
git revert HEAD
git push origin production
```

#### Emergency Rollback
```bash
# If automated systems fail
railway up --service web --environment production --ref <previous-commit-sha>
```

### Rollback Verification
```bash
# Verify service health
curl https://sentia-manufacturing.railway.app/health

# Check deployed version
curl https://sentia-manufacturing.railway.app/api/status | jq .version

# Monitor error rates
curl https://sentia-manufacturing.railway.app/metrics | grep error_rate
```

## Incident Runbook

### Severity Levels
- **P1 (Critical)**: Complete outage, data loss risk
- **P2 (Major)**: Significant functionality impaired
- **P3 (Minor)**: Non-critical features affected
- **P4 (Low)**: Cosmetic issues

### Incident Response Process

#### 1. Initial Assessment (0-5 minutes)
```bash
# Check service status
curl https://sentia-manufacturing.railway.app/health
railway logs --service web --tail 100

# Check metrics
curl https://sentia-manufacturing.railway.app/metrics
```

#### 2. Triage (5-15 minutes)
- [ ] Identify affected components
- [ ] Determine severity level
- [ ] Notify stakeholders
- [ ] Create incident channel/ticket

#### 3. Mitigation (15-30 minutes)

**Service Down:**
```bash
# Restart service
railway restart --service web --environment production

# Scale up if needed
railway scale --service web --replicas 5
```

**High Error Rate:**
```bash
# Check recent deployments
railway deployments list

# Rollback if deployment-related
railway rollback --environment production
```

**Database Issues:**
```bash
# Check connection pool
curl https://sentia-manufacturing.railway.app/api/admin/health | jq .database

# Reset connections if needed
railway restart --service web
```

**Queue Backlog:**
```bash
# Check queue status
curl https://sentia-manufacturing.railway.app/api/queues/status

# Scale workers
railway scale --service worker --replicas 5
```

#### 4. Resolution & Recovery
- [ ] Verify fix effectiveness
- [ ] Monitor for stability (30 minutes)
- [ ] Scale down if scaled up
- [ ] Document root cause

#### 5. Post-Incident
- [ ] Create post-mortem document
- [ ] Update runbooks
- [ ] Implement preventive measures
- [ ] Share learnings with team

### Common Issues & Solutions

| Issue | Symptoms | Solution |
|-------|----------|----------|
| Memory leak | Increasing memory usage, OOM errors | Restart service, investigate leak |
| Connection pool exhaustion | Database timeout errors | Increase pool size, restart service |
| Rate limiting | 429 errors | Scale service, adjust limits |
| Disk space | Write failures | Clean logs, increase storage |
| SSL certificate | SSL errors | Renew certificate |
| CORS errors | Browser console errors | Check CORS_ALLOWED_ORIGINS |

### Emergency Contacts
- On-call Engineer: Check PagerDuty
- Infrastructure Team: #infrastructure-alerts
- Database Team: #database-support
- Security Team: security@company.com

## Scaling & Performance

### Auto-scaling Configuration
```yaml
Production:
  Web Service:
    Min: 2, Max: 10
    Target CPU: 70%
    Target Memory: 80%
  
  Worker Service:
    Min: 1, Max: 5
    Queue depth trigger: 100 jobs
```

### Manual Scaling
```bash
# Scale web service
railway scale --service web --replicas 5 --environment production

# Scale worker service
railway scale --service worker --replicas 3 --environment production
```

### Performance Optimization
- Enable compression: `ENABLE_COMPRESSION=true`
- Enable caching: `ENABLE_CACHE=true`
- Optimize database queries
- Use CDN for static assets
- Enable connection pooling

## Security Checklist

### Pre-deployment
- [ ] Security scan passed
- [ ] No secrets in code
- [ ] Dependencies updated
- [ ] OWASP top 10 reviewed

### Configuration
- [ ] HTTPS enforced
- [ ] HSTS enabled
- [ ] CSP configured
- [ ] CORS restricted
- [ ] Rate limiting active
- [ ] Input validation
- [ ] SQL injection prevention
- [ ] XSS protection

### Monitoring
- [ ] Security alerts configured
- [ ] Audit logging enabled
- [ ] Failed auth attempts tracked
- [ ] Suspicious activity alerts

### Compliance
- [ ] GDPR compliance (EU)
- [ ] PII redaction enabled
- [ ] Data retention policies
- [ ] Right to deletion implemented

## Maintenance Mode

### Enable Maintenance Mode
```bash
railway env set MAINTENANCE_MODE=true --environment production
railway env set MAINTENANCE_MESSAGE="Scheduled maintenance until 3 PM UTC"
railway env set MAINTENANCE_ALLOWED_IPS="10.0.0.1,10.0.0.2"
```

### Disable Maintenance Mode
```bash
railway env unset MAINTENANCE_MODE --environment production
```

## Monitoring URLs

- Health: https://sentia-manufacturing.railway.app/health
- Metrics: https://sentia-manufacturing.railway.app/metrics
- Status: https://sentia-manufacturing.railway.app/api/status
- SLO Dashboard: https://sentia-manufacturing.railway.app/api/slo-dashboard
- Performance: https://sentia-manufacturing.railway.app/api/performance

## Useful Commands

```bash
# View logs
railway logs --service web --tail 100 --environment production

# View environment variables
railway variables --environment production

# SSH into service (if enabled)
railway shell --service web --environment production

# Database backup
railway run --service database pg_dump > backup.sql

# Redis CLI
railway run --service redis redis-cli

# Queue inspection
railway run --service worker node scripts/inspect-queue.js
```

## References
- [Railway Documentation](https://docs.railway.app)
- [Neon Documentation](https://neon.tech/docs)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [OWASP Security Guidelines](https://owasp.org)