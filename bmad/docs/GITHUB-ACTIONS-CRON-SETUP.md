# GitHub Actions Cron Setup Guide

**Epic**: EPIC-TRIAL-001 - Trial Automation System
**Component**: GitHub Actions Scheduled Workflow
**Date**: October 20, 2025
**Status**: ✅ Workflow Created, ⏳ Secrets Configuration Pending
**Author**: BMAD Agent (Autonomous)

---

## Overview

The trial automation system uses GitHub Actions scheduled workflows to run hourly cron jobs that check trial expirations and trigger email notifications. This guide covers the setup, configuration, and testing of the GitHub Actions cron system.

---

## Architecture

```
GitHub Actions (hourly cron)
  └─> workflow-dispatch (manual trigger option)
       └─> Job 1: check-trial-expirations
            └─> POST /api/cron/trial-expiration
                 └─> Check all trial tenants
                     └─> Create email records
                          └─> Return statistics
       └─> Job 2: health-check
            └─> GET /api/health
                 └─> Verify API is reachable
```

---

## Prerequisites

### 1. GitHub Repository Access

- **Required Permission**: Repository admin or write access
- **Action**: Settings → Secrets and variables → Actions

### 2. Backend API Operational

- **Endpoint**: `/api/cron/trial-expiration`
- **Method**: POST
- **Authentication**: X-Cron-Secret header
- **Base URL**: `https://sentia-backend-prod.onrender.com` or `https://api.capliquify.com`

### 3. Cron Secret Generated

Generate a secure random secret for cron authentication:

```bash
# Option 1: Using OpenSSL
openssl rand -hex 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 3: Using Python
python -c "import secrets; print(secrets.token_hex(32))"
```

**Expected Output**: 64-character hexadecimal string (e.g., `a1b2c3d4...`)

---

## Configuration Steps

### Step 1: Add GitHub Secrets

Navigate to your GitHub repository:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add the following secrets:

#### Secret 1: CRON_SECRET_KEY

- **Name**: `CRON_SECRET_KEY`
- **Value**: Generated secret from prerequisites (64-character hex)
- **Purpose**: Authenticates GitHub Actions to backend cron endpoints
- **Example**: `a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456`

#### Secret 2: CAPLIQUIFY_API_URL (Optional)

- **Name**: `CAPLIQUIFY_API_URL`
- **Value**: `https://api.capliquify.com` or `https://sentia-backend-prod.onrender.com`
- **Purpose**: Override default backend API URL
- **Default**: If not set, workflow uses `https://sentia-backend-prod.onrender.com`

### Step 2: Add Secret to Backend

The backend also needs the cron secret for validation:

1. Go to **Render Dashboard** → Your backend service
2. Navigate to **Environment** tab
3. Add environment variable:
   - **Key**: `CRON_SECRET`
   - **Value**: Same 64-character hex string from CRON_SECRET_KEY
4. Click **Save Changes** (service will redeploy)

### Step 3: Verify Workflow File

Ensure the workflow file exists at `.github/workflows/trial-expiration.yml`:

```yaml
name: Trial Expiration Monitor

on:
  schedule:
    - cron: '0 * * * *'  # Runs every hour at minute 0
  workflow_dispatch:     # Allow manual trigger
    inputs:
      dry_run:
        description: 'Dry run (no emails sent)'
        required: false
        default: 'false'
        type: choice
        options:
          - 'true'
          - 'false'

jobs:
  check-trial-expirations:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - name: Check trial expirations
        env:
          API_BASE_URL: ${{ secrets.CAPLIQUIFY_API_URL || 'https://sentia-backend-prod.onrender.com' }}
          CRON_SECRET: ${{ secrets.CRON_SECRET_KEY }}
          DRY_RUN: ${{ github.event.inputs.dry_run || 'false' }}
        run: |
          curl -X POST \
            -H "Content-Type: application/json" \
            -H "X-Cron-Secret: $CRON_SECRET" \
            -d "{\"dryRun\": $DRY_RUN}" \
            "$API_BASE_URL/api/cron/trial-expiration"
```

---

## Testing the Workflow

### Manual Trigger Test (Dry Run)

1. Go to **Actions** tab in GitHub repository
2. Select **Trial Expiration Monitor** workflow
3. Click **Run workflow** button (right side)
4. Select branch: **main**
5. Choose dry_run: **true**
6. Click **Run workflow**

**Expected Results**:
- ✅ Workflow starts running
- ✅ Job completes in <1 minute
- ✅ HTTP 200 response from API
- ✅ Job summary shows statistics:
  - Total tenants checked: 0-1
  - Day 1 emails: 0
  - Day 7 emails: 0
  - Day 12 emails: 0
  - Day 14 emails: 0
  - Errors: 0

### Manual Trigger Test (Real Run)

**⚠️ Only after dry run succeeds**

1. Go to **Actions** tab
2. Select **Trial Expiration Monitor** workflow
3. Click **Run workflow**
4. Select branch: **main**
5. Choose dry_run: **false**
6. Click **Run workflow**

**Expected Results**:
- ✅ Workflow completes successfully
- ✅ Email records created in database (check `/api/cron/status`)
- ✅ No actual emails sent (unless you have trial tenants in database)

### Direct API Test (Before Workflow)

Test the cron endpoint directly to verify it's working:

```bash
# Set your cron secret
CRON_SECRET="your-64-character-hex-secret-here"

# Test trial expiration endpoint (dry run)
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-Cron-Secret: $CRON_SECRET" \
  -d '{"dryRun": true}' \
  https://sentia-backend-prod.onrender.com/api/cron/trial-expiration

# Expected response:
# {
#   "success": true,
#   "stats": {
#     "totalChecked": 0,
#     "day1Sent": 0,
#     "day7Sent": 0,
#     "day12Sent": 0,
#     "day14Sent": 0,
#     "gracePeriodExpiring": 0,
#     "errors": 0
#   },
#   "message": "Trial expiration check complete (dry run)"
# }
```

---

## Troubleshooting

### Issue 1: Workflow Fails with 401 Unauthorized

**Symptoms**:
- Workflow runs but fails immediately
- Error message: "Unauthorized: Invalid cron secret"
- HTTP 401 response

**Causes**:
1. CRON_SECRET_KEY GitHub secret not set
2. CRON_SECRET environment variable not set in Render
3. Secrets don't match (GitHub vs Render)

**Solution**:
```bash
# 1. Check GitHub secret exists
# Go to Settings → Secrets → Actions → CRON_SECRET_KEY

# 2. Check Render environment variable
# Go to Render → Service → Environment → CRON_SECRET

# 3. Regenerate secret and update both locations
openssl rand -hex 32
```

### Issue 2: Workflow Can't Reach Backend

**Symptoms**:
- Workflow fails with connection timeout
- Error message: "Could not resolve host" or "Connection refused"
- HTTP 502/503 response

**Causes**:
1. Backend service is sleeping (Render free tier)
2. Wrong API URL in CAPLIQUIFY_API_URL secret
3. Backend deployment failed

**Solution**:
```bash
# 1. Wake up backend (if on free tier)
curl https://sentia-backend-prod.onrender.com/api/health

# 2. Verify correct URL in GitHub secret
# Should be: https://sentia-backend-prod.onrender.com
# OR: https://api.capliquify.com

# 3. Check Render deployment logs
# Go to Render → Service → Logs
```

### Issue 3: Workflow Runs But No Emails Sent

**Symptoms**:
- Workflow completes successfully (HTTP 200)
- Statistics show 0 emails sent
- No emails received

**Causes**:
1. No trial tenants in database
2. SendGrid API keys not configured
3. Email queue processor not running
4. Dry run mode enabled

**Solution**:
```bash
# 1. Check if any tenants are in trial
curl -H "X-Cron-Secret: $CRON_SECRET" \
  https://sentia-backend-prod.onrender.com/api/cron/status

# 2. Verify SendGrid configuration
# Go to Render → Service → Environment
# Check: SENDGRID_API_KEY_PRIMARY, SENDGRID_FROM_EMAIL

# 3. Check email queue
curl -H "X-Cron-Secret: $CRON_SECRET" \
  https://sentia-backend-prod.onrender.com/api/cron/status
# Look for "pendingEmails" count

# 4. Verify dry_run is false
# Check workflow input or API request body
```

### Issue 4: Workflow Doesn't Run on Schedule

**Symptoms**:
- Manual trigger works
- Hourly cron doesn't execute automatically
- No workflow runs shown in Actions tab

**Causes**:
1. Workflow file not in main/default branch
2. GitHub Actions disabled for repository
3. Cron syntax incorrect
4. Repository inactive (GitHub pauses workflows after 60 days of inactivity)

**Solution**:
```yaml
# 1. Verify workflow is in .github/workflows/trial-expiration.yml

# 2. Check GitHub Actions are enabled
# Go to Settings → Actions → General → "Allow all actions"

# 3. Verify cron syntax
# cron: '0 * * * *' means "every hour at minute 0"
# Test at: https://crontab.guru/#0_*_*_*_*

# 4. Push a commit to reactivate workflows
```

---

## Monitoring & Maintenance

### Workflow Run History

1. Go to **Actions** tab
2. Select **Trial Expiration Monitor**
3. View all workflow runs (successful, failed, in progress)

### Job Summaries

Each workflow run creates a job summary showing:
- Timestamp of execution
- HTTP status code
- Statistics (tenants checked, emails sent, errors)
- Execution duration

### Email Queue Status

Check email queue status via API:

```bash
curl -H "X-Cron-Secret: $CRON_SECRET" \
  https://sentia-backend-prod.onrender.com/api/cron/status

# Response:
# {
#   "success": true,
#   "stats": {
#     "trialTenants": 5,
#     "pendingEmails": 12,
#     "sentToday": 8,
#     "failedToday": 0,
#     "sendGridDailyLimit": 100
#   }
# }
```

### Cron Schedule

**Current Schedule**: Every hour at minute 0 (00:00, 01:00, 02:00, ...)

**To Change Schedule**:
1. Edit `.github/workflows/trial-expiration.yml`
2. Update `cron:` line
3. Use https://crontab.guru/ to verify syntax
4. Commit and push

**Common Cron Patterns**:
```yaml
# Every hour
cron: '0 * * * *'

# Every 30 minutes
cron: '*/30 * * * *'

# Every day at 9am UTC
cron: '0 9 * * *'

# Every Monday at 9am UTC
cron: '0 9 * * 1'
```

---

## Security Best Practices

### 1. Cron Secret Rotation

Rotate the cron secret every 90 days:

```bash
# 1. Generate new secret
NEW_SECRET=$(openssl rand -hex 32)

# 2. Update GitHub secret
# Go to Settings → Secrets → CRON_SECRET_KEY → Update

# 3. Update Render environment variable
# Go to Render → Service → Environment → CRON_SECRET → Update

# 4. Wait for Render redeploy to complete

# 5. Test with new secret
curl -X POST \
  -H "X-Cron-Secret: $NEW_SECRET" \
  -d '{"dryRun": true}' \
  https://sentia-backend-prod.onrender.com/api/cron/trial-expiration
```

### 2. Rate Limiting

The cron endpoint has built-in rate limiting:
- Max 1 request per minute per IP
- Max 100 emails per day (SendGrid free tier)
- Automatic backoff on errors

### 3. Error Notifications

GitHub Actions will:
- Email repository admins on workflow failures
- Create annotations in PR/commit checks
- Log all errors in workflow run details

---

## Related Documentation

- [Trial Expiration Workflow](.github/workflows/trial-expiration.yml)
- [Cron Routes](../../server/routes/cron.routes.ts)
- [SendGrid Service](../../server/services/email/sendgrid.service.ts)
- [EPIC-TRIAL-001 Retrospective](../retrospectives/2025-10-20-EPIC-TRIAL-001-trial-automation-complete.md)

---

## Quick Reference

### Manual Workflow Trigger

```bash
# Via GitHub UI
1. Actions → Trial Expiration Monitor → Run workflow
2. Select branch: main
3. Choose dry_run: true/false
4. Run workflow

# Via GitHub API
curl -X POST \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/The-social-drink-company/capliquify-ai-dashboard-app/actions/workflows/trial-expiration.yml/dispatches \
  -d '{"ref":"main","inputs":{"dry_run":"true"}}'
```

### Check Workflow Status

```bash
# Via GitHub UI
Actions → Trial Expiration Monitor → Latest run

# Via GitHub API
curl -H "Authorization: Bearer $GITHUB_TOKEN" \
  https://api.github.com/repos/The-social-drink-company/capliquify-ai-dashboard-app/actions/workflows/trial-expiration.yml/runs
```

---

**Status**: ✅ **DOCUMENTED** - Ready for secret configuration
**Last Updated**: 2025-10-20
**Maintained By**: BMAD Agent
**Framework**: BMAD-METHOD v6-alpha

**Next Steps**:
1. Add CRON_SECRET_KEY GitHub secret
2. Add CRON_SECRET Render environment variable
3. Run manual dry-run test
4. Monitor hourly executions
5. Verify email delivery (when trial tenants exist)
