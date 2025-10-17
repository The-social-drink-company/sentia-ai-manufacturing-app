# Rollback Production Deployment

Emergency rollback procedure for production environment issues.

## 🚨 EMERGENCY USE ONLY

This command should only be used when:
- Production deployment has critical bugs
- Application is non-functional
- Data integrity is at risk
- Security vulnerability discovered

## Pre-Rollback Assessment

### 1. Severity Check

Confirm the issue severity:
- **P0 - Critical**: Application completely down, data loss risk
- **P1 - High**: Major functionality broken, affecting all users
- **P2 - Medium**: Specific features broken, workarounds exist
- **P3 - Low**: Minor issues, can wait for proper fix

**Only proceed with rollback for P0 or P1 issues.**

### 2. Issue Documentation

Before rollback, document:
- What is broken?
- When was it discovered?
- What was the last working state?
- Error messages/logs
- Steps to reproduce

### 3. Stakeholder Notification

Alert:
- Technical team
- Product owner
- Customer support
- Affected users (if necessary)

## Rollback Options

### Option A: Git Revert (Recommended)

Safer approach - creates new commit that undoes changes:

```bash
# 1. Check production history
git checkout production
git log --oneline -5

# 2. Identify bad commit
# 3. Revert it
git revert [commit-sha]

# 4. Push revert
git push origin production
```

### Option B: Reset to Previous Commit (Nuclear Option)

More dangerous - rewrites history:

```bash
# 1. Find last known good commit
git log --oneline -10

# 2. Reset to that commit
git reset --hard [good-commit-sha]

# 3. Force push (DANGEROUS)
git push origin production --force
```

⚠️ **WARNING**: Option B rewrites history. Only use if Option A fails.

### Option C: Render Dashboard Rollback

Use Render's built-in rollback:

1. Go to https://dashboard.render.com
2. Select production service
3. Go to "Events" tab
4. Find last successful deployment
5. Click "Rollback" button

## Rollback Execution

### Phase 1: Preparation

```
🚨 PRODUCTION ROLLBACK INITIATED

Current Status:
- Production: ❌ Issues detected
- Issue: [description]
- Severity: P[0-1]
- Time Detected: [timestamp]

Rollback Target:
- Commit: [sha]
- Deployed: [timestamp]
- Version: [tag]
```

### Phase 2: Execute Rollback

Follow chosen option above, then monitor:

```bash
# Watch Render logs
# Check application health
curl https://sentia-manufacturing-dashboard-production.onrender.com/health

# Verify critical endpoints
curl https://sentia-manufacturing-dashboard-production.onrender.com/api/status
```

### Phase 3: Verification

Check that rolled-back version:
- ✅ Application loads
- ✅ Health check passes
- ✅ Authentication works
- ✅ Critical features functional
- ✅ No error logs
- ✅ Database connectivity OK

## Post-Rollback Actions

### 1. Immediate

- ✅ Confirm production is stable
- ✅ Notify stakeholders of resolution
- ✅ Document what was rolled back
- ✅ Update status page (if applicable)

### 2. Investigation

Create incident report:
```
PRODUCTION INCIDENT REPORT

Date: [date]
Duration: [start] - [end]
Severity: P[level]

What Happened:
[Description of issue]

Root Cause:
[What caused the problem]

Resolution:
Rolled back to commit [sha]

Impact:
- Users Affected: [number/percentage]
- Features Impacted: [list]
- Data Loss: Yes/No

Timeline:
- [time] - Issue deployed
- [time] - Issue detected
- [time] - Rollback initiated
- [time] - Production restored

Prevention:
[What will prevent this in future]
```

### 3. Fix Forward

After rollback:
1. Identify root cause in development
2. Create fix
3. Test thoroughly in development
4. Deploy to test environment
5. Extensive UAT before production retry

## Deployment Pipeline Pause

After rollback, add gate:
```
⛔ PRODUCTION DEPLOYMENT PAUSED

Reason: Investigating recent rollback
Next Deployment: Requires explicit approval

Before next production deployment:
[ ] Root cause identified
[ ] Fix implemented and tested
[ ] Deployed to test environment
[ ] UAT completed
[ ] Code review completed
[ ] Stakeholder approval obtained
```

## Communication Templates

### To Stakeholders
```
Subject: Production Issue Resolved - [Feature] Rolled Back

We experienced a production issue with [feature] deployed at [time].

Issue: [Brief description]
Impact: [User impact]
Resolution: Rolled back to previous stable version
Status: Production now stable

Timeline:
- Issue detected: [time]
- Rollback initiated: [time]
- Production restored: [time]
Total downtime: [duration]

Next Steps:
We are investigating the root cause and will implement a proper fix before attempting redeployment.

Apologies for any inconvenience.
```

### To Users (if needed)
```
We briefly experienced technical difficulties but service has been restored. We apologize for any inconvenience.
```

## Output Format

```
✅ PRODUCTION ROLLBACK COMPLETE

🔄 Rollback Details:
- Method: [Git revert / Reset / Render dashboard]
- From: [bad-commit-sha]
- To: [good-commit-sha]
- Duration: [X minutes]

✅ Verification Complete:
- ✅ Application operational
- ✅ Health checks passing
- ✅ Critical features working
- ✅ No error logs

📊 Current Status:
- Production: ✅ STABLE
- Users: Can access application
- Data: Intact

📝 Actions Taken:
1. ✅ Rolled back production
2. ✅ Verified application stability
3. ✅ Notified stakeholders
4. ✅ Documented incident

🔜 Next Steps:
1. Complete incident report
2. Investigate root cause in development
3. Implement fix
4. Deploy to test for verification
5. Schedule production retry with approval

⛔ Production deployments paused pending investigation
```

Execute emergency rollback safely and document thoroughly.
