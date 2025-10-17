# Render Rollback Procedures

## Overview

This document provides step-by-step procedures for rolling back deployments on Render in case of issues.

## Rollback Scenarios

### 1. Application Code Rollback

#### Immediate Rollback (Last Working Version)

1. **Go to Render Dashboard**
   - Navigate to the affected service
   - Click on "Events" tab

2. **Find Last Successful Deploy**
   - Look for the last deployment marked as "Live"
   - Note the commit hash

3. **Rollback via Dashboard**
   - Click on the last working deployment
   - Click "Rollback to this version"
   - Confirm the rollback

#### Git-Based Rollback

```bash
# Revert the last commit
git revert HEAD
git push origin <branch>

# Or reset to specific commit
git reset --hard <commit-hash>
git push --force origin <branch>
```

### 2. Database Rollback

#### Using Render Backups (Paid Plans)

1. **Access Database Dashboard**
   - Go to your database service
   - Click "Backups" tab

2. **Restore from Backup**
   - Select the backup point
   - Click "Restore"
   - Choose "Restore to new database" (safer)
   - Update DATABASE_URL in application

#### Manual Database Rollback

```powershell
# If you have a backup file
.\database-migration-render.ps1 -Operation import `
  -TargetDB "postgresql://..." `
  -BackupFile "backup-before-deployment.sql"
```

### 3. Environment Variable Rollback

#### Quick Revert

1. **Go to Environment Tab**
   - Open the affected service
   - Click "Environment"

2. **View History**
   - Click "View history" (if available)
   - Or manually revert changed values

#### Backup-Based Restore

```powershell
# If you saved environment variables
# Copy from your backup files:
# - render-env-development.txt
# - render-env-testing.txt
# - render-env-production.txt
```

## Rollback Decision Matrix

| Issue Type              | Severity | Rollback Method     | Time to Recovery |
| ----------------------- | -------- | ------------------- | ---------------- |
| App crash on startup    | Critical | Dashboard rollback  | 2-5 minutes      |
| API errors (>50%)       | Critical | Dashboard rollback  | 2-5 minutes      |
| Performance degradation | High     | Git revert + deploy | 10-15 minutes    |
| UI bugs                 | Medium   | Git fix + deploy    | 15-30 minutes    |
| Database corruption     | Critical | Backup restore      | 30-60 minutes    |
| Wrong env variables     | High     | Manual update       | 5-10 minutes     |

## Emergency Rollback Script

```powershell
# emergency-rollback.ps1
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("development", "testing", "production")]
    [string]$Environment,

    [Parameter(Mandatory=$true)]
    [ValidateSet("code", "database", "full")]
    [string]$RollbackType
)

Write-Host "EMERGENCY ROLLBACK INITIATED" -ForegroundColor Red
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Type: $RollbackType" -ForegroundColor Yellow

switch ($RollbackType) {
    "code" {
        Write-Host "1. Go to Render Dashboard" -ForegroundColor White
        Write-Host "2. Select service: sentia-manufacturing-$Environment" -ForegroundColor White
        Write-Host "3. Click Events → Find last working deploy → Rollback" -ForegroundColor White

        # Open dashboard
        Start-Process "https://dashboard.render.com/web/sentia-manufacturing-$Environment/events"
    }

    "database" {
        Write-Host "1. Stop application to prevent data changes" -ForegroundColor Red
        Write-Host "2. Restore database from backup" -ForegroundColor White
        Write-Host "3. Update DATABASE_URL if using new database" -ForegroundColor White
        Write-Host "4. Restart application" -ForegroundColor White
    }

    "full" {
        Write-Host "FULL ROLLBACK SEQUENCE:" -ForegroundColor Red
        Write-Host "1. Rollback application code" -ForegroundColor White
        Write-Host "2. Restore database" -ForegroundColor White
        Write-Host "3. Revert environment variables" -ForegroundColor White
        Write-Host "4. Clear caches" -ForegroundColor White
        Write-Host "5. Verify all services" -ForegroundColor White
    }
}
```

## Pre-Deployment Backup Checklist

Before any deployment, ensure:

- [ ] Database backup taken

  ```powershell
  .\database-migration-render.ps1 -Operation export `
    -SourceDB $env:DATABASE_URL `
    -BackupFile "backup-$(Get-Date -Format 'yyyy-MM-dd').sql"
  ```

- [ ] Environment variables documented

  ```powershell
  # Save current env vars
  render envs > "env-backup-$(Get-Date -Format 'yyyy-MM-dd').txt"
  ```

- [ ] Current commit hash noted

  ```bash
  git rev-parse HEAD > last-working-commit.txt
  ```

- [ ] Health metrics baseline captured
  ```powershell
  .\monitor-render-services.ps1 -MaxIterations 1
  ```

## Rollback Communication Template

### Internal Team Notification

```
Subject: [ROLLBACK] Sentia Manufacturing - [Environment]

Team,

We are initiating a rollback due to [issue description].

Environment: [development/testing/production]
Issue: [brief description]
Impact: [user impact]
Rollback Start: [time]
ETA: [estimated completion]

Updates will follow every 15 minutes.
```

### User Notification (if needed)

```
Subject: Temporary Service Interruption

Dear Users,

We are performing maintenance to ensure optimal performance.

Expected Duration: [X] minutes
Impact: [what users might experience]

We apologize for any inconvenience.
```

## Post-Rollback Checklist

After rollback:

- [ ] Verify service is operational
- [ ] Run health checks
- [ ] Check error logs cleared
- [ ] Test critical user paths
- [ ] Monitor for 30 minutes
- [ ] Document root cause
- [ ] Create fix plan
- [ ] Schedule retry (if needed)

## Automated Health Verification

```powershell
# verify-rollback.ps1
Write-Host "Verifying rollback success..." -ForegroundColor Yellow

# Test endpoints
$endpoints = @(
    "https://sentia-manufacturing-$env.onrender.com/health",
    "https://sentia-manufacturing-$env.onrender.com/api/status",
    "https://mcp-server-tkyu.onrender.com/health"
)

foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-WebRequest -Uri $endpoint -TimeoutSec 5
        Write-Host "[OK] $endpoint" -ForegroundColor Green
    } catch {
        Write-Host "[FAIL] $endpoint" -ForegroundColor Red
    }
}
```

## Rollback Prevention Strategies

1. **Staged Deployments**
   - Deploy to development first
   - Wait 24 hours before testing
   - Wait 48 hours before production

2. **Feature Flags**
   - Use environment variables to toggle features
   - Roll out gradually

3. **Blue-Green Deployments**
   - Maintain two production environments
   - Switch traffic between them

4. **Canary Releases**
   - Deploy to subset of users first
   - Monitor metrics before full rollout

## Recovery Time Objectives (RTO)

| Service        | Target RTO | Maximum RTO |
| -------------- | ---------- | ----------- |
| Production App | 5 minutes  | 15 minutes  |
| MCP Server     | 5 minutes  | 15 minutes  |
| Database       | 30 minutes | 60 minutes  |
| Full System    | 45 minutes | 90 minutes  |

## Support Contacts

- **Render Support**: support@render.com
- **Render Status**: https://status.render.com
- **Technical Lead**: [Your contact]
- **On-Call Engineer**: [Rotation schedule]

## Lessons Learned Log

Document each rollback:

| Date | Environment | Issue | Resolution | Prevention |
| ---- | ----------- | ----- | ---------- | ---------- |
|      |             |       |            |            |
|      |             |       |            |            |

---

**Remember**: A successful rollback is better than a prolonged outage. Don't hesitate to rollback if issues arise.
