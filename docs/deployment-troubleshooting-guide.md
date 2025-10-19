# Deployment Troubleshooting Guide

**Version**: 1.0.0
**Last Updated**: 2025-10-20
**Author**: Claude (BMAD-METHOD v6a)
**Related Epic**: [EPIC-DEPLOY-CRISIS](../bmad/epics/2025-10-EPIC-DEPLOY-CRISIS.md)

---

## 🎯 **PURPOSE**

This guide provides quick-reference solutions for common deployment issues encountered on the Render platform, based on real incidents from EPIC-DEPLOY-CRISIS.

---

## 📋 **COMMON ERROR PATTERNS**

### **1. Prisma Migration Errors (P3018)**

#### **Symptom**
```
Error: P3018
A migration failed to apply. New migrations cannot be applied before the error is recovered from.
Database error code: 42P07 or 42710
ERROR: relation "table_name" already exists
```

#### **Root Causes**
1. Migration marked as "failed" but tables actually exist
2. Database extension version mismatch
3. Deployment crashed during migration execution
4. Migration state corruption in `_prisma_migrations` table

#### **Solutions**

**Solution A: Mark Migration as Applied** (Most Common)
```yaml
# In render.yaml startCommand:
pnpm exec prisma migrate resolve --applied MIGRATION_NAME || true
```

**Solution B: Remove Version Specification**
```prisma
// In prisma/schema.prisma:
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  extensions = [pgvector(map: "vector")] // Remove version: "X.X.X"
}
```

**Solution C: Reset Migration State** (Nuclear Option)
```bash
# Only use if database is empty/test environment
pnpm exec prisma migrate reset --force
```

#### **Prevention**
- Always add `|| true` to migration commands in production
- Never specify extension versions (use provider defaults)
- Add migration state checks to pre-deployment validation

#### **Related Incidents**
- [BMAD-DEPLOY-001](../bmad/retrospectives/2025-10-19-BMAD-DEPLOY-001-backend-502-incident.md) - pgvector version
- [BMAD-DEPLOY-004](../bmad/retrospectives/2025-10-20-BMAD-DEPLOY-004-backend-502.md) - migration state

---

### **2. Port Configuration Errors (502 Bad Gateway)**

#### **Symptom**
```
==> Port scan timeout reached, failed to detect open port XXXX from PORT environment variable
==> HTTP server listening on port YYYY (wrong port)
```

#### **Root Cause**
Application reads custom environment variable instead of standard `PORT` variable set by Render.

#### **Solution**
```javascript
// ❌ WRONG - Custom env var only:
const port = parseInt(process.env.CUSTOM_PORT) || 3000

// ✅ CORRECT - Standard PORT first, then fallback:
const port = parseInt(process.env.PORT || process.env.CUSTOM_PORT) || 3000
```

#### **Prevention**
- Always read `process.env.PORT` first
- Custom port env vars should be fallbacks only
- Add port configuration checks to startup logs:
  ```javascript
  logger.info(`Starting server on port ${port} (from ${process.env.PORT ? 'PORT' : 'DEFAULT'})`)
  ```

#### **Related Incidents**
- [BMAD-DEPLOY-003](../bmad/epics/2025-10-EPIC-DEPLOY-CRISIS.md#bmad-deploy-003-mcp-server-port-configuration) - MCP server port mismatch

---

### **3. Vite Build Failures (Missing Modules)**

#### **Symptom**
```
[vite:load-fallback] Could not load /path/to/component
ENOENT: no such file or directory
```

#### **Root Cause**
Component imported but file doesn't exist. Works in dev (Vite dev server ignores some errors) but fails in production build.

#### **Solution**
```javascript
// ❌ REMOVE - Component doesn't exist:
import MissingComponent from '@/pages/MissingComponent'

// ✅ COMMENT OUT - Add TODO:
// import MissingComponent from '@/pages/MissingComponent' // TODO: Create component
```

#### **Prevention**
- Run `pnpm run build` locally before pushing
- Add ESLint rule to catch missing imports:
  ```json
  {
    "rules": {
      "import/no-unresolved": "error"
    }
  }
  ```
- Use TypeScript for compile-time import validation

#### **Related Incidents**
- [BMAD-DEPLOY-002](../bmad/epics/2025-10-EPIC-DEPLOY-CRISIS.md#bmad-deploy-002-missing-importwizard-component) - ImportWizard missing

---

### **4. Database Connection Failures**

#### **Symptom**
```
Error: Can't reach database server at `host:port`
PrismaClientInitializationError: Connection timeout
```

#### **Root Causes**
1. DATABASE_URL not set or incorrect
2. Database service not started
3. Firewall blocking connections
4. Database plan expired (free tier limits)

#### **Solutions**

**Check Environment Variables**
```bash
# In Render dashboard:
Dashboard → Service → Environment → DATABASE_URL
# Should be: postgresql://user:pass@host:port/db
```

**Add Connection Retry Logic**
```javascript
async function connectWithRetry(maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await prisma.$connect()
      return true
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)))
    }
  }
}
```

**Verify Database Plan**
- Check Render dashboard for database expiration
- Free tier expires after 90 days
- Upgrade to paid plan if needed

#### **Prevention**
- Add database health checks to startup sequence
- Log connection attempts and failures
- Set up monitoring alerts for connection failures

---

### **5. Memory/CPU Limits (503 Service Unavailable)**

#### **Symptom**
```
==> Your service is using too much memory/CPU
==> Service stopped due to resource limits
```

#### **Root Causes**
1. Free tier limits exceeded (512 MB RAM)
2. Memory leaks in application code
3. Too many concurrent requests
4. Large bundle sizes

#### **Solutions**

**Optimize Bundle Size**
```bash
# Analyze bundle:
pnpm run build -- --mode production --analyze

# Reduce dependencies:
pnpm remove unused-package
pnpm add -D lightweight-alternative
```

**Implement Lazy Loading**
```javascript
// ✅ Lazy load large components:
const HeavyComponent = lazy(() => import('./HeavyComponent'))

// ✅ Split routes:
const AdminPanel = lazy(() => import('@/pages/AdminPanel'))
```

**Upgrade Render Plan**
- Free tier: 512 MB RAM, 0.1 CPU
- Starter: 1 GB RAM, 0.5 CPU
- Standard: 2 GB RAM, 1 CPU

#### **Prevention**
- Monitor memory usage in Render dashboard
- Implement request rate limiting
- Use proper dependency management (no duplicate packages)
- Regular bundle size audits

---

## 🔧 **DIAGNOSTIC COMMANDS**

### **Check Deployment Status**
```bash
# View service status:
# Dashboard → Service → Events

# Check health endpoints:
curl -I https://service-name.onrender.com/health

# View logs:
# Dashboard → Service → Logs
```

### **Local Verification**
```bash
# Build locally (catches Vite errors):
pnpm run build

# Run linter:
pnpm run lint

# Type check (TypeScript):
pnpm run type-check

# Test Prisma migrations:
pnpm exec prisma migrate deploy --preview-feature
```

### **Database Inspection**
```bash
# Connect to database:
# Dashboard → Database → Connect → Copy connection string
psql "postgresql://..."

# Check migration status:
SELECT * FROM _prisma_migrations ORDER BY finished_at DESC;

# Check pgvector version:
SELECT extversion FROM pg_extension WHERE extname = 'vector';

# List tables:
\dt
```

---

## 📊 **PRE-DEPLOYMENT CHECKLIST**

Use this checklist before every production deployment:

```markdown
## Pre-Deployment Checklist

### Code Validation
- [ ] `pnpm run lint` passes with zero errors
- [ ] `pnpm run build` completes successfully
- [ ] `pnpm run test` (if tests exist) passes
- [ ] No console errors in browser dev tools
- [ ] All component imports reference existing files

### Configuration Validation
- [ ] `.env.template` matches required environment variables
- [ ] `render.yaml` specifies correct branch (main/test/production)
- [ ] PORT configuration uses `process.env.PORT` first
- [ ] Database URL configured in Render dashboard
- [ ] All API keys set in Render environment variables

### Database Validation
- [ ] Prisma schema is up to date
- [ ] No version specifications on database extensions
- [ ] Migration commands include `|| true` safety flag
- [ ] `_prisma_migrations` table shows clean state (no failed migrations)

### Service Health
- [ ] Current deployment is healthy (no 502/503 errors)
- [ ] All health endpoints return 200 OK
- [ ] Database connection is operational
- [ ] No recent deployment failures

### Documentation
- [ ] CHANGELOG.md updated with changes
- [ ] README.md reflects current setup
- [ ] API documentation is current
- [ ] Deployment notes added to Git commit message
```

---

## 🚀 **EMERGENCY ROLLBACK PROCEDURE**

If deployment fails and service is down:

### **Step 1: Identify Last Good Commit**
```bash
# View recent commits:
git log --oneline -10

# Check which commit was last deployed successfully:
# Dashboard → Service → Events → Find last successful deploy
```

### **Step 2: Revert Changes**
```bash
# Option A: Revert last commit (creates new commit):
git revert HEAD
git push origin main

# Option B: Hard reset to last good commit (dangerous):
git reset --hard LAST_GOOD_COMMIT
git push -f origin main  # ⚠️ Force push required
```

### **Step 3: Verify Rollback**
```bash
# Check health endpoints:
curl -I https://service-name.onrender.com/health

# Monitor logs for startup success:
# Dashboard → Service → Logs
```

### **Step 4: Document Incident**
```bash
# Create incident report:
touch bmad/retrospectives/$(date +%Y-%m-%d)-incident-description.md

# Update project status:
# Note rollback in bmad/status/ document
```

---

## 📈 **MONITORING & ALERTING**

### **Health Check Script**

Create `scripts/check-deployment-health.sh`:

```bash
#!/bin/bash
# Deployment Health Check Script
# Usage: ./scripts/check-deployment-health.sh

set -e

FRONTEND="https://sentia-frontend-prod.onrender.com"
BACKEND="https://sentia-backend-prod.onrender.com/api/health"
MCP="https://sentia-mcp-prod.onrender.com/health"

echo "🔍 Checking deployment health..."
echo ""

# Check Frontend
echo -n "Frontend: "
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND" --max-time 10)
if [ "$FRONTEND_STATUS" = "200" ]; then
  echo "✅ $FRONTEND_STATUS OK"
else
  echo "❌ $FRONTEND_STATUS FAILED"
  exit 1
fi

# Check Backend
echo -n "Backend:  "
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND" --max-time 10)
if [ "$BACKEND_STATUS" = "200" ]; then
  echo "✅ $BACKEND_STATUS OK"
else
  echo "❌ $BACKEND_STATUS FAILED"
  exit 1
fi

# Check MCP
echo -n "MCP:      "
MCP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$MCP" --max-time 10)
if [ "$MCP_STATUS" = "200" ]; then
  echo "✅ $MCP_STATUS OK"
else
  echo "❌ $MCP_STATUS FAILED"
  exit 1
fi

echo ""
echo "🎉 All services operational!"
```

### **Post-Deployment Verification**

Add to CI/CD pipeline or run manually after deployment:

```bash
# Wait for deployment to complete
sleep 60

# Run health check
./scripts/check-deployment-health.sh

# If failed, trigger rollback
if [ $? -ne 0 ]; then
  echo "❌ Health check failed, rolling back..."
  git revert HEAD
  git push origin main
fi
```

---

## 🔗 **ADDITIONAL RESOURCES**

### **Official Documentation**
- [Render Deployment Docs](https://render.com/docs/deploys)
- [Prisma Migration Troubleshooting](https://pris.ly/d/migrate-resolve)
- [Vite Build Troubleshooting](https://vitejs.dev/guide/troubleshooting.html)

### **Internal Documentation**
- [EPIC-DEPLOY-CRISIS](../bmad/epics/2025-10-EPIC-DEPLOY-CRISIS.md) - Complete incident history
- [Render Deployment Guide](./render-deployment-guide.md) - Platform-specific setup
- [Environment Variables](../context/technical-specifications/environment-variables.md) - Configuration reference

### **BMAD Retrospectives**
- [BMAD-DEPLOY-001](../bmad/retrospectives/2025-10-19-BMAD-DEPLOY-001-backend-502-incident.md) - pgvector
- [BMAD-DEPLOY-004](../bmad/retrospectives/2025-10-20-BMAD-DEPLOY-004-backend-502.md) - Migration state

---

## 📞 **SUPPORT CONTACTS**

**Render Platform Support**:
- Email: support@render.com
- Dashboard: https://dashboard.render.com/support

**Database Issues**:
- Render PostgreSQL: Check dashboard for database status
- Free tier: Upgrade required for extended support

**BMAD-METHOD Questions**:
- Framework: https://github.com/bmad-code-org/BMAD-METHOD
- Documentation: See `bmad/docs/` folder

---

**Last Updated**: 2025-10-20
**Version**: 1.0.0
**Maintainer**: Claude (BMAD-METHOD v6a)
**Related Epic**: EPIC-DEPLOY-CRISIS
