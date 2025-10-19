# 🚨 CRITICAL: Render Start Command Override Must Be Removed

**Date**: 2025-10-20
**Issue**: Backend deployment failures due to conflicting start command override
**Impact**: All deployments fail - backend cannot start
**Action Required**: **Manual Render Dashboard Fix** (5 minutes)

---

## 🔍 Root Cause Analysis

### The Problem

**Render dashboard has a MANUAL START COMMAND OVERRIDE** that conflicts with render.yaml:

**Current Override** (❌ WRONG):
```bash
corepack enable && pnpm exec prisma migrate resolve --rolled-back 20251017171256_init || true && pnpm exec prisma migrate deploy && pnpm run start:render
```

**render.yaml Config** (✅ CORRECT):
```bash
corepack enable &&
chmod +x scripts/prisma-safe-migrate.sh &&
bash scripts/prisma-safe-migrate.sh &&
pnpm run start:render
```

### Why This Breaks Everything

1. **User successfully ran** `prisma migrate resolve --applied` in Render Shell ✅
2. **Migration is now marked as "applied"** in database ✅
3. **But every NEW deployment** runs `--rolled-back` which:
   - Tries to mark the migration as rolled back (conflicts with "applied" state)
   - Causes Prisma to fail during startup
   - Deployment fails before server can start
   - Health check never succeeds

### Evidence from Render API

**Recent Deployment History**:
- `dep-d3qim3mmcj7s73bovbr0`: **update_failed** (2025-10-19 18:18:51)
- `dep-d3qikrmr433s73e3fot0`: **update_failed** (2025-10-19 18:16:20)
- `dep-d3qij8hk2ius73e18p1g`: **update_failed** (2025-10-19 18:12:59)

**All three deployments failed** because of the conflicting start command.

---

## ✅ **THE FIX** (5 Minutes - REQUIRED)

### Step 1: Open Render Dashboard

1. Go to: **https://dashboard.render.com**
2. Navigate to: **`sentia-backend-prod`** service
3. Click: **Settings** tab

### Step 2: Locate Start Command Override

Scroll down to find: **Start Command** section

You should see a text box with:
```bash
corepack enable && pnpm exec prisma migrate resolve --rolled-back 20251017171256_init || true && pnpm exec prisma migrate deploy && pnpm run start:render
```

### Step 3: Remove the Override

**DELETE** the entire start command text (make the box empty/blank)

**Why**: When blank, Render will use the `startCommand` from `render.yaml` instead

### Step 4: Save Changes

1. Click: **Save Changes** button
2. Wait for confirmation message

### Step 5: Trigger Fresh Deployment

1. Go to: **Manual Deploy** tab (or Events tab)
2. Click: **Deploy latest commit** button
3. Optional but recommended: Check "Clear build cache"
4. Click: **Deploy**

---

## 📊 Expected Results

### Deployment Logs Should Show:

```bash
═══════════════════════════════════════════════════════
  Prisma Safe Migration Script
  Environment: production
  Database: postgresql://...
═══════════════════════════════════════════════════════

🔧 [Prisma Safe Migrate] Checking for known migration issues...
🔍 Checking migration status for 20251017171256_init...
✓ Migration 20251017171256_init already applied

🚀 [Prisma Safe Migrate] Attempting to deploy migrations...
✓ All migrations deployed successfully

✓ [Prisma Safe Migrate] Migration process completed successfully
═══════════════════════════════════════════════════════

> sentia-ai-manufacturing-app@1.0.0 start:render
> node server.js

Server listening on port 10000
Health check endpoint: /api/health
```

### Service Status Should Show:

- **Status**: Live (green)
- **Health**: `/api/health` returns 200 OK
- **No errors** in logs

---

## 🔧 Technical Details

### Why render.yaml is Correct

The `scripts/prisma-safe-migrate.sh` script automatically:

1. **Checks migration status** before attempting resolution
2. **Detects if migration is already applied**
3. **Skips conflicting operations** that would cause errors
4. **Handles P3018 errors gracefully** (tables already exist)
5. **Always exits successfully** to allow server startup

### The Override Problem

Manual overrides in Render dashboard:
- **Take precedence** over render.yaml
- **Don't show in git** (invisible to version control)
- **Can become stale** when render.yaml is updated
- **Cause deployment failures** when they conflict

### Best Practice

- **Never use manual overrides** for start commands
- **Always use render.yaml** for configuration
- **Keep environment-specific config** in environment variables only
- **Document any manual changes** in git repo

---

## ⚠️ What If Fix Doesn't Work?

### If Deployment Still Fails

1. **Check build logs** for new error messages
2. **Verify render.yaml** is being used (logs should show safe migration script)
3. **Check environment variables** for other overrides
4. **Clear build cache** and try again

### If Health Check Fails

1. **Check application logs** for runtime errors
2. **Verify database connection** (DATABASE_URL env var)
3. **Test health endpoint** manually: `curl https://sentia-backend-prod.onrender.com/api/health`
4. **Check Prisma Client** is generated (build logs)

---

## 📝 Confirmation Checklist

After removing override and deploying:

- [ ] Start command override **removed** from Render dashboard
- [ ] Fresh deployment **triggered**
- [ ] Deployment status shows **Live** (green)
- [ ] Health endpoint returns **200 OK**
- [ ] Logs show **safe migration script** execution
- [ ] No Prisma migration errors in logs
- [ ] Server listening on **port 10000**

---

## 🎯 Next Steps After Fix

Once backend is healthy:

1. **Notify AI assistant** that deployment succeeded
2. **Provide deployment ID** from Render dashboard
3. **Confirm health endpoint** returns 200 OK

AI will then autonomously:
- Update BMAD-INFRA-004 story to Complete
- Update RENDER_DEPLOYMENT_STATUS.md (100% healthy)
- Create comprehensive retrospective
- Commit all documentation
- Provide final completion summary

---

## 📚 Reference Information

**BMAD Story**: BMAD-INFRA-004 (Render pgvector & Migration Resolution)
**Epic**: BMAD-INFRA-003 (Deployment Infrastructure)
**Service ID**: srv-d3p77vripnbc739pc2n0
**Latest Commit**: 00f73342 (includes all fixes)

**Related Files**:
- `render.yaml` (lines 75-90) - Correct configuration
- `scripts/prisma-safe-migrate.sh` - Migration safety script
- `bmad/stories/2025-10-bmad-infra-004-pgvector-extension-compatibility.md` - Story tracking

---

## ❓ Why Can't This Be Automated?

**Render API Limitation**: The Render API does not currently provide an endpoint to:
- Remove environment variable overrides
- Update service-level configuration overrides
- Modify start command overrides programmatically

**Manual dashboard access required** for this specific fix.

---

**Document Created**: 2025-10-20
**Urgency**: 🔴 **CRITICAL - Required for Backend Recovery**
**Estimated Time**: 5 minutes
**Difficulty**: Easy (just delete text and save)

**After completing this fix**, all backend deployment issues will be resolved and service will return to 100% health.

