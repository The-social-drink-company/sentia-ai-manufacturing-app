# 🚀 Render Go-Live Runbook

## Executive Summary

This runbook provides step-by-step instructions for migrating Sentia Manufacturing Dashboard from Railway to Render with zero downtime.

**Target Date**: **\*\***\_**\*\***
**Maintenance Window**: **\*\***\_**\*\***
**Rollback Deadline**: **\*\***\_**\*\***

## 📋 Pre-Migration Checklist (T-7 Days)

### Infrastructure Ready

- [ ] All Render services deployed (dev, test, prod)
- [ ] Render PostgreSQL databases created
- [ ] MCP Server operational at https://mcp-server-tkyu.onrender.com
- [ ] Environment variables configured (55+ variables)
- [ ] SSL certificates issued

### Testing Complete

- [ ] Development environment tested
- [ ] Testing environment UAT complete
- [ ] Production smoke tests passed
- [ ] Performance benchmarks met
- [ ] Security scan completed

### Data Prepared

- [ ] Database migration tested
- [ ] Backup strategy implemented
- [ ] Rollback procedure tested
- [ ] Data validation scripts ready

## 📅 Timeline

### T-48 Hours

- [ ] Final code freeze
- [ ] Reduce DNS TTL to 300 seconds
- [ ] Team notification sent
- [ ] Support team briefed
- [ ] Backup Railway data

### T-24 Hours

- [ ] Final data sync test
- [ ] Load testing completed
- [ ] Monitoring alerts configured
- [ ] Customer notification sent
- [ ] Rollback tested

### T-12 Hours

- [ ] Go/No-Go meeting
- [ ] Final backup taken
- [ ] Team standby confirmed
- [ ] Communication channels open

## 🎯 Migration Day Execution

### Phase 1: Pre-Migration (T-2 Hours)

```powershell
# 1. Take final Railway backup
.\database-migration-render.ps1 -Operation backup -Environment production

# 2. Verify Render services
.\validate-render-complete.ps1 -Environment all

# 3. Test MCP integration
.\test-mcp-integration-e2e.ps1 -Environment production
```

**Checkpoints:**

- [ ] All services green
- [ ] Backup completed
- [ ] Team ready

### Phase 2: Data Migration (T-1 Hour)

```powershell
# 1. Put Railway in read-only mode (if possible)
# Update Railway environment variable:
# READ_ONLY_MODE=true

# 2. Final data export from Railway/Neon
.\database-migration-render.ps1 -Operation export `
  -SourceDB "postgresql://neondb_owner:..." `
  -BackupFile "final-migration-backup.sql"

# 3. Import to Render PostgreSQL
.\database-migration-render.ps1 -Operation import `
  -TargetDB "[Render PostgreSQL External URL]" `
  -BackupFile "final-migration-backup.sql"

# 4. Validate data integrity
.\database-migration-render.ps1 -Operation validate `
  -SourceDB "[Render PostgreSQL URL]"
```

**Checkpoints:**

- [ ] Data exported successfully
- [ ] Data imported to Render
- [ ] Row counts match
- [ ] Test queries successful

### Phase 3: DNS Cutover (T-0)

#### For Custom Domain Users:

```yaml
# Update DNS Records
Old:
  A Record: @ → Railway IP
  CNAME: www → railway.app

New:
  A Record: @ → 216.24.57.1 (Render IP)
  CNAME: www → sentia-manufacturing-production.onrender.com
```

#### For Direct Access Users:

```yaml
# Update application URLs
Old: https://sentia-manufacturing.up.railway.app
New: https://sentia-manufacturing-production.onrender.com
```

**Checkpoints:**

- [ ] DNS updated
- [ ] Propagation started
- [ ] Old service still accessible

### Phase 4: Verification (T+30 Minutes)

```powershell
# 1. Test new production URL
Invoke-WebRequest https://sentia-manufacturing-production.onrender.com/health

# 2. Run full validation
.\validate-render-complete.ps1 -Environment production

# 3. Test critical workflows
# - User login
# - Dashboard load
# - Data import
# - Report generation

# 4. Monitor services
.\monitor-render-services.ps1 -IntervalSeconds 60
```

**Checkpoints:**

- [ ] Health checks passing
- [ ] Users can login
- [ ] Data visible
- [ ] APIs responding

### Phase 5: Monitoring (T+2 Hours)

**Active Monitoring Dashboard:**

```powershell
# Run continuous monitoring
.\monitor-render-services.ps1
```

**Key Metrics to Watch:**
| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Uptime | >99.9% | **_% | ⬜ |
| Response Time | <500ms | _**ms | ⬜ |
| Error Rate | <0.1% | **_% | ⬜ |
| Active Users | >0 | _** | ⬜ |
| DB Connections | <80% | \_\_\_% | ⬜ |

## 🔄 Rollback Procedure

### Trigger Conditions

Execute rollback if ANY occur:

- [ ] Services down >5 minutes
- [ ] Data corruption detected
- [ ] Authentication broken
- [ ] Performance degraded >50%
- [ ] Critical features non-functional

### Rollback Steps

```powershell
# 1. Revert DNS (immediate)
# Point back to Railway:
# A Record: @ → Railway IP
# CNAME: www → railway.app

# 2. Restore Railway data (if modified)
.\database-migration-render.ps1 -Operation restore `
  -Environment production `
  -RestoreFile "railway-backup-final.sql"

# 3. Re-enable Railway services
# Remove READ_ONLY_MODE variable

# 4. Verify Railway operational
curl https://sentia-manufacturing.up.railway.app/health
```

## 📊 Success Criteria

### Immediate (T+1 Hour)

- ✅ All services operational
- ✅ Users can access system
- ✅ Core features working
- ✅ No critical errors

### Short-term (T+24 Hours)

- ✅ Performance metrics normal
- ✅ No data loss reported
- ✅ Error rate <0.1%
- ✅ User feedback positive

### Long-term (T+7 Days)

- ✅ System stable
- ✅ Cost within budget
- ✅ Railway decommissioned
- ✅ Documentation updated

## 🔧 Post-Migration Tasks

### Day 1

- [ ] Update all documentation with Render URLs
- [ ] Configure automated backups
- [ ] Set up monitoring alerts
- [ ] Review logs for issues

### Week 1

- [ ] Performance optimization
- [ ] Cost analysis
- [ ] User feedback collection
- [ ] Security audit

### Week 2

- [ ] Railway service cleanup
- [ ] Cancel Railway subscription
- [ ] Archive Railway backups
- [ ] Team retrospective

## 📞 Communication Plan

### Internal Communications

**Slack Channels:**

- #deployment-status
- #engineering
- #support

**Status Updates:**

- T-24h: "Migration starting tomorrow"
- T-2h: "Migration beginning soon"
- T-0: "Migration in progress"
- T+1h: "Migration complete"

### Customer Communications

**Email Template:**

```
Subject: System Maintenance Notice

Dear Customer,

We are upgrading our infrastructure to provide better performance and reliability.

Maintenance Window: [DATE/TIME]
Expected Impact: Minimal to none
New URL: https://sentia-manufacturing-production.onrender.com

No action required on your part. Your login credentials remain the same.

Thank you for your patience.
```

## 🚨 Emergency Contacts

| Role            | Name       | Contact             | Availability   |
| --------------- | ---------- | ------------------- | -------------- |
| Technical Lead  | **\_\_\_** | **\_\_\_**          | Primary        |
| DevOps Engineer | **\_\_\_** | **\_\_\_**          | Primary        |
| Database Admin  | **\_\_\_** | **\_\_\_**          | On-call        |
| Render Support  | Support    | support@render.com  | 24/7           |
| Railway Support | Support    | support@railway.app | Business hours |

## 📝 Sign-off Requirements

### Pre-Migration Approval

- [ ] Technical Lead
- [ ] Project Manager
- [ ] Client Representative
- [ ] Security Officer

### Go-Live Approval

- [ ] All services verified
- [ ] Data migration confirmed
- [ ] Performance acceptable
- [ ] Security validated

### Post-Migration Sign-off

- [ ] 24-hour stability confirmed
- [ ] User acceptance received
- [ ] Performance metrics met
- [ ] Documentation updated

## 🎯 Quick Reference Commands

```powershell
# Full deployment
.\deploy-all-render-environments.ps1

# Validate everything
.\validate-render-complete.ps1 -Environment all

# Database migration
.\database-migration-render.ps1 -Operation sync `
  -SourceDB "[Neon/Railway URL]" `
  -TargetDB "[Render URL]"

# Monitor services
.\monitor-render-services.ps1

# Backup production
.\render-backup-restore.ps1 -Operation backup -Environment production

# Emergency rollback
.\RENDER_ROLLBACK_PROCEDURES.md
```

## ✅ Final Checklist

**Before Going Live:**

- [ ] All services deployed
- [ ] Databases migrated
- [ ] APIs configured
- [ ] MCP server connected
- [ ] SSL certificates valid
- [ ] Backups taken
- [ ] Team ready
- [ ] Rollback tested

**After Going Live:**

- [ ] DNS propagated
- [ ] Users notified
- [ ] Monitoring active
- [ ] Logs reviewed
- [ ] Performance verified
- [ ] Feedback collected
- [ ] Railway decommissioned
- [ ] Documentation updated

---

**Remember:** Stay calm, follow the runbook, and communicate frequently. You've got this! 🚀
