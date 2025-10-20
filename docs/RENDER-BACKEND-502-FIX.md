# Render Backend 502 Fix Guide

**Issue**: Backend deployment failing with Prisma migration error P3018
**Error**: `ERROR: relation "users" already exists`
**Status**: ⚠️ **REQUIRES MANUAL RENDER DASHBOARD ACTION**

---

## 🔍 Root Cause Analysis

### The Problem

The backend service is failing to deploy because:

1. **Prisma migration `20251017171256_init` is trying to create tables that already exist**
2. **Render dashboard has a manual override** of the start command
3. **The override uses the old broken command**: `--rolled-back` instead of `--applied`

### Evidence from Deployment Logs

```
Migration 20251017171256_init marked as rolled back.
...
Applying migration `20251017171256_init`
Error: P3018
Database error: ERROR: relation "users" already exists
```

**Key Issue**: Migration marked as "rolled back" but then tries to apply it again, causing P3018 error.

### Why This Happened

The production database already has the tables from previous deployments. The migration system is in an inconsistent state where:
- The `_prisma_migrations` table thinks the migration was rolled back
- The actual database has all the tables created
- Re-running the migration tries to create tables that already exist
- PostgreSQL rejects duplicate table creation (error code 42P07)

---

## ✅ Solution: Two Options

### **Option A: Remove Manual Override (RECOMMENDED)**

**Why Recommended**:
- ✅ Uses the sophisticated `prisma-safe-migrate.sh` script already in the repo
- ✅ More robust error handling
- ✅ Automatically handles future migration issues
- ✅ Matches the render.yaml configuration

**Steps**:

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Navigate to Service**: Click on `sentia-backend-prod`
3. **Go to Settings Tab**: Click "Settings" in left sidebar
4. **Find Start Command**: Scroll to "Start Command" section
5. **Check for Override**: If there's a manual override that looks like:
   ```
   corepack enable && pnpm exec prisma migrate resolve --rolled-back 20251017171256_init || true && pnpm exec prisma migrate deploy && pnpm run start:render
   ```
6. **Remove Override**: Delete the manual override (leave it blank to use render.yaml)
7. **Save Changes**: Click "Save Changes"
8. **Trigger Deploy**: Click "Manual Deploy" → "Deploy latest commit"
9. **Monitor Logs**: Watch the deployment logs for success

**Expected Outcome**:
```
═══════════════════════════════════════════════════════
  Prisma Safe Migration Script
  Environment: production
  Database: postgresql://...
═══════════════════════════════════════════════════════

🔧 [Prisma Safe Migrate] Checking for known migration issues...
🔍 Checking migration status for 20251017171256_init...
⚠  Migration 20251017171256_init is pending or failed, marking as applied...
✓ Successfully marked 20251017171256_init as applied

🚀 [Prisma Safe Migrate] Attempting to deploy migrations...
✓ All migrations deployed successfully

✓ [Prisma Safe Migrate] Migration process completed successfully
═══════════════════════════════════════════════════════

> sentia-ai-manufacturing-app@1.0.0 start:render
> node server.js

Server listening on port 10000
Health check endpoint: /api/health
```

---

### **Option B: Update Manual Override**

**Use If**: You prefer to keep the manual override for some reason

**Steps**:

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Navigate to Service**: Click on `sentia-backend-prod`
3. **Go to Settings Tab**: Click "Settings" in left sidebar
4. **Find Start Command**: Scroll to "Start Command" section
5. **Update Override**: Change from:
   ```bash
   corepack enable && pnpm exec prisma migrate resolve --rolled-back 20251017171256_init || true && pnpm exec prisma migrate deploy && pnpm run start:render
   ```
   To:
   ```bash
   corepack enable && pnpm exec prisma migrate resolve --applied 20251017171256_init && pnpm exec prisma migrate deploy && pnpm run start:render
   ```
6. **Key Changes**:
   - `--rolled-back` → `--applied` (tells Prisma the migration already ran)
   - Remove `|| true` (we want to catch errors, not hide them)
7. **Save Changes**: Click "Save Changes"
8. **Trigger Deploy**: Click "Manual Deploy" → "Deploy latest commit"
9. **Monitor Logs**: Watch for successful deployment

---

## 🎯 Verification Steps

### After Deployment

1. **Check Deployment Logs**: Should show:
   ```
   ✔ Migration 20251017171256_init marked as applied.
   ✔ No pending migrations to apply.
   > sentia-ai-manufacturing-app@1.0.0 start:render
   > node server.js
   Server listening on port 10000
   ```

2. **Test Health Endpoint**:
   ```bash
   curl https://capliquify-backend-prod.onrender.com/api/health
   ```
   Expected response:
   ```json
   {
     "status": "healthy",
     "timestamp": "2025-10-19T...",
     "service": "backend"
   }
   ```

3. **Check Render Dashboard**:
   - Service status: "Active" (green)
   - No errors in logs
   - Health checks passing

4. **Test API Endpoints**:
   ```bash
   # Test a few endpoints
   curl https://capliquify-backend-prod.onrender.com/api/financial/working-capital
   curl https://capliquify-backend-prod.onrender.com/api/inventory
   ```

---

## 🔧 Technical Details

### What is `prisma migrate resolve`?

**Documentation**: https://www.prisma.io/docs/orm/reference/prisma-cli-reference#migrate-resolve

**Purpose**: Marks a migration as having a specific state without running the SQL

**Flags**:
- `--applied`: "This migration already ran successfully" (updates metadata only)
- `--rolled-back`: "This migration was rolled back" (for cleanup)

**Why `--applied` is correct here**:
- The database tables already exist
- The migration SQL would fail if we tried to run it
- We just need to update Prisma's migration tracking table (`_prisma_migrations`)
- No data modification - just metadata update

### The Migration Script Improvements

The updated `scripts/prisma-safe-migrate.sh` now:

1. **Checks migration status** before attempting resolution
2. **Automatically detects** pending/failed migrations
3. **Marks as applied** when tables already exist (P3018 scenario)
4. **Gracefully handles errors** and continues deployment
5. **Exits with 0** even if warnings occur (allows service to start)

**Key Features**:
- Color-coded output (Green = success, Yellow = warning, Red = error)
- Comprehensive error checking
- Safe default behavior (always tries to start the service)
- Detailed logging for debugging

---

## 📚 Reference: Prisma Migration States

### Migration States in `_prisma_migrations` Table

| State | Meaning | What Happens Next |
|-------|---------|-------------------|
| `applied` | Migration ran successfully | Skip this migration in future deploys |
| `failed` | Migration started but errored | Requires manual resolution |
| `rolled-back` | Migration was undone | Can be re-applied |
| (not in table) | Migration never attempted | Will be applied on next deploy |

**Our Situation**:
- State: `rolled-back` (incorrect)
- Reality: Migration already applied (tables exist)
- Solution: Change state to `applied` (matches reality)

---

## 🚨 Common Errors & Solutions

### Error: "Migration not found"

**Cause**: Trying to resolve a migration that doesn't exist in `prisma/migrations/`

**Solution**: Verify migration name matches exactly:
```bash
ls -la prisma/migrations/
# Should show: 20251017171256_init/
```

### Error: "Database connection failed"

**Cause**: DATABASE_URL environment variable incorrect

**Solution**:
1. Check Render dashboard environment variables
2. Verify DATABASE_URL is set from `sentia-db-prod` connection string
3. Test connection: `pnpm exec prisma db pull --force`

### Error: "Permission denied: scripts/prisma-safe-migrate.sh"

**Cause**: Script not executable

**Solution**: The `chmod +x` in render.yaml should fix this, but if not:
```bash
git update-index --chmod=+x scripts/prisma-safe-migrate.sh
git commit -m "fix: Make prisma-safe-migrate.sh executable"
git push
```

---

## 📈 Success Metrics

**Deployment Successful When**:
- ✅ Render build completes without errors
- ✅ Migration marked as applied (no P3018 error)
- ✅ Server starts and listens on port 10000
- ✅ Health endpoint returns 200 OK
- ✅ Backend service shows "Active" in Render dashboard
- ✅ No 502 errors when accessing API endpoints

**Service Health**:
- Frontend: ✅ 200 OK (https://capliquify-frontend-prod.onrender.com)
- Backend: ✅ 200 OK (https://capliquify-backend-prod.onrender.com/api/health) ← **Target**
- MCP: ✅ 200 OK (https://capliquify-mcp-prod.onrender.com/health)
- **Overall**: ✅ **100%** (all services healthy)

---

## 🎓 Lessons Learned

### Why This Issue Occurred

1. **Manual overrides in Render dashboard** can diverge from render.yaml
2. **Migration state inconsistency** between `_prisma_migrations` table and actual database schema
3. **Deployment failures leave database in intermediate state** requiring manual resolution

### Prevention for Future

1. **Always use render.yaml configuration** (avoid manual overrides)
2. **Use the safe migration script** (`prisma-safe-migrate.sh`) which handles edge cases
3. **Test migrations in staging** before production deployment
4. **Monitor migration state** after each deployment
5. **Document manual interventions** in retrospectives

### The Safe Migration Pattern

```bash
# 1. Resolve any known issues first
prisma migrate resolve --applied <migration-name>

# 2. Deploy remaining migrations
prisma migrate deploy

# 3. Verify schema sync
prisma db pull --force

# 4. Start the service
node server.js
```

---

## 📋 Post-Fix Actions

### After Backend is Healthy

1. **Update Status Documentation**:
   - Update [RENDER_DEPLOYMENT_STATUS.md](../RENDER_DEPLOYMENT_STATUS.md)
   - Mark backend as healthy (100% service health)

2. **Create Retrospective**:
   - Document the incident in `bmad/retrospectives/`
   - Capture learnings about migration state management
   - Update deployment best practices

3. **Continue Development**:
   - Resume EPIC-003 (Frontend Polish)
   - Integrate setup prompts into dashboards
   - Polish UX and accessibility

---

## 📞 Support Resources

**Prisma Documentation**:
- Migration Resolve: https://www.prisma.io/docs/orm/reference/prisma-cli-reference#migrate-resolve
- Migration Troubleshooting: https://pris.ly/d/migrate-resolve
- Production Best Practices: https://www.prisma.io/docs/orm/prisma-migrate/workflows/production-troubleshooting

**Render Documentation**:
- Deploy Troubleshooting: https://render.com/docs/troubleshooting-deploys
- Environment Variables: https://render.com/docs/environment-variables
- Build & Deploy: https://render.com/docs/deploys

**Project Documentation**:
- [BMAD-WORKFLOW-STATUS.md](../bmad/status/BMAD-WORKFLOW-STATUS.md)
- [PROJECT-STATUS-2025-10-19.md](../PROJECT-STATUS-2025-10-19.md)
- [RENDER_DEPLOYMENT_STATUS.md](../RENDER_DEPLOYMENT_STATUS.md)

---

**Document Created**: 2025-10-19
**Issue**: Backend 502 (Prisma P3018)
**Solution**: Remove manual override OR update to `--applied`
**Status**: ⚠️ Awaiting manual Render dashboard action
**Next**: After fix, continue with EPIC-003 Frontend Polish

