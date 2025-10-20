# Render Deployment Guide - CapLiquify Manufacturing Platform

**Last Updated**: October 20, 2025
**BMAD-METHOD v6a Compliant Documentation**

---

## 🚀 Quick Reference

### Production Services

| Service | URL | Status | Branch |
|---------|-----|--------|--------|
| **Frontend** | https://sentia-frontend-prod.onrender.com | ✅ Active | main |
| **Backend API** | https://sentia-backend-prod.onrender.com | 🔄 Active | main |
| **MCP Server** | https://sentia-mcp-prod.onrender.com | 🔄 Active | main |
| **Database** | Internal (PostgreSQL 17) | ✅ Active | N/A |

### Critical Configuration

```yaml
# ALL services MUST deploy from main branch
services:
  - type: web
    name: sentia-mcp-prod
    branch: main  # ← CRITICAL: Must be specified
```

---

## ⚠️ Common Issues and Solutions

### Issue #1: Services Deploying from Wrong Branch

**Symptoms**:
- Latest code not appearing in production
- Old features still visible after push
- Deploys succeed but show outdated version

**Root Cause**: Missing `branch: main` in render.yaml

**Solution**:
```yaml
# render.yaml - Add to EVERY service
services:
  - type: web
    name: your-service-name
    branch: main  # ← ADD THIS LINE
```

**Verification**:
1. Check Render dashboard → Service → Settings → "Branch"
2. Should show "main" (development branch consolidated October 19, 2025)
3. Trigger manual deploy if needed

---

### Issue #2: Deploy Stuck for 2+ Hours

**Symptoms**:
- Status shows "Deploying..." for extended period
- Normal deploy time is 3-10 minutes
- No error messages visible

**Common Causes**:
1. **Wrong branch** (pulling incompatible code from main)
2. **Build failure** (dependency or compilation error)
3. **Missing environment variables** (service can't start)
4. **Database migration failure** (Prisma schema mismatch)

**Solution Steps**:

**Step 1: Cancel Stuck Deploy**
```bash
# Via Render Dashboard
1. Navigate to service (e.g., sentia-backend-prod)
2. Click "Manual Deploy" dropdown
3. Click "Cancel Deploy"
```

**Step 2: Verify Branch Configuration**
```bash
# Check render.yaml locally
grep -A 3 "name: sentia-mcp-prod" render.yaml
# Should show: branch: development
```

**Step 3: Check Environment Variables**
```bash
# Via Render Dashboard
1. Service → Environment tab
2. Verify all required variables are set
3. Look for variables marked "sync: false" in render.yaml
```

**Step 4: Review Build Logs**
```bash
# Via Render Dashboard
1. Service → Logs tab
2. Filter to "Build" logs
3. Look for error messages (npm ERR!, pnpm ERR!, etc.)
```

**Step 5: Trigger Clean Deploy**
```bash
# Via Render Dashboard
1. Service → Manual Deploy
2. Click "Clear build cache & deploy"
3. Monitor logs for progress
```

---

### Issue #3: Prisma pgvector Version Mismatch

**Symptoms**:
- Deploy logs show `extension "vector" has no installation script nor update path for version "0.5.1"`
- Prisma migrate step fails with error `P3018`
- Render deployment aborts after `prisma migrate deploy`

**Root Cause**: Prisma pinned the pgvector extension to version `0.5.1`, but Render-managed PostgreSQL exposes a different available version.

**Resolution Steps**:
1. Update `prisma/schema.prisma` to remove the version pin: `extensions = [pgvector(map: "vector")]`.
2. Commit the schema change and redeploy (Render reruns `prisma migrate deploy` automatically).
3. If deploy still fails, run `SELECT * FROM pg_available_extensions WHERE name = 'vector';` on the database to confirm available versions.

**Verification**:
- Render deploy logs show `Database schema is up to date!` after the migration step.
- Optional: run `pnpm exec prisma migrate deploy --preview-feature --schema prisma/schema.prisma` against staging/dev database.
- Confirm AI features relying on `vector(1536)` columns remain accessible.
- Reference story: [BMAD-INFRA-004](../bmad/stories/2025-10-bmad-infra-004-pgvector-extension-compatibility.md)
---

### Issue #4: Environment Variables Missing

**Symptoms**:
- Service starts but returns errors
- Integration features not working (Xero, Shopify, etc.)
- Logs show "undefined" or "null" for API keys

**Required Variables by Service**:

#### MCP Server (sentia-mcp-prod)
```bash
# Authentication
XERO_CLIENT_ID=your-xero-client-id
XERO_CLIENT_SECRET=your-xero-client-secret

# Shopify Multi-Store
SHOPIFY_UK_SHOP_DOMAIN=your-uk-domain
SHOPIFY_UK_ACCESS_TOKEN=shpat_xxxxx
SHOPIFY_US_SHOP_DOMAIN=your-us-domain
SHOPIFY_US_ACCESS_TOKEN=shpat_xxxxx

# Amazon SP-API
AMAZON_REFRESH_TOKEN=Atzr|xxxxx
AMAZON_LWA_APP_ID=amzn1.application-oa2-client.xxxxx
AMAZON_LWA_CLIENT_SECRET=your-lwa-secret
AMAZON_AWS_SELLING_PARTNER_ROLE=arn:aws:iam::xxxxx

# Unleashed ERP
UNLEASHED_API_ID=your-unleashed-id
UNLEASHED_API_KEY=your-unleashed-key

# AI Providers (optional)
ANTHROPIC_API_KEY=sk-ant-xxxxx
OPENAI_API_KEY=sk-xxxxx
```

#### Backend API (sentia-backend-prod)
```bash
# Authentication
CLERK_SECRET_KEY=sk_live_xxxxx
VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx

# Database (auto-injected by Render)
DATABASE_URL=postgresql://...

# MCP Server (auto-injected from service reference)
MCP_SERVER_URL=https://capliquify-mcp-prod.onrender.com
```

#### Frontend (sentia-frontend-prod)
```bash
# Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx

# Backend API (auto-injected from service reference)
VITE_API_BASE_URL=https://capliquify-backend-prod.onrender.com
```

**How to Set Variables**:
1. Render Dashboard → Service → Environment
2. Click "Add Environment Variable"
3. Enter key and value
4. Click "Save Changes"
5. Service auto-redeploys with new variables

---

### Issue #5: Database Connection Errors

**Symptoms**:
- Service logs show "ECONNREFUSED" or "Connection refused"
- Error: "Can't reach database server"
- Prisma errors during startup

**Common Causes**:
1. **Free tier database expired** (90 days limit)
2. **DATABASE_URL incorrect** (typo or old connection string)
3. **Database not in same region** (latency/firewall issues)
4. **Prisma schema mismatch** (migrations not applied)

**Solution**:

**Check Database Status**:
```bash
# Via Render Dashboard
1. Navigate to sentia-db-prod
2. Check "Status" (should be "Available")
3. Check "Expires" date
4. Verify region matches services (oregon)
```

**Verify Connection String**:
```bash
# Via Render Dashboard
1. Database → Connection tab
2. Copy "External Database URL"
3. Compare to DATABASE_URL in services
4. Should match exactly (postgresql://user:pass@host/db)
```

**Apply Pending Migrations**:
```bash
# Migrations run automatically via startCommand
# Check backend logs for migration output:
# "Running prisma migrate deploy"
# "Database schema is up to date!"
```

**Database Expiration Warning**:
```
⚠️ Free tier databases expire after 90 days
Current expiration: November 16, 2025 (27 days remaining)

Action Required:
1. Upgrade to paid plan ($7/month) OR
2. Export data and recreate database before expiration
```

---

## 🔧 Manual Deploy Process

### When to Trigger Manual Deploy

- After fixing render.yaml configuration
- After updating environment variables
- When automatic deploy fails
- To force rebuild after code changes

### Step-by-Step Manual Deploy

**Standard Deploy**:
```bash
1. Render Dashboard → Select service
2. Click "Manual Deploy" button (top right)
3. Dropdown: "Deploy latest commit"
4. Monitor "Logs" tab for progress
5. Wait for "Live" status (3-10 minutes)
```

**Clean Deploy (with cache clear)**:
```bash
1. Render Dashboard → Select service
2. Click "Manual Deploy" dropdown
3. Select "Clear build cache & deploy"
4. Monitor logs (will take longer - rebuilding from scratch)
5. Useful for dependency issues or corrupted builds
```

**Deploy Specific Commit**:
```bash
1. Render Dashboard → Service → Manual Deploy
2. Select "Deploy a specific commit"
3. Enter commit SHA (e.g., 6de9e168)
4. Monitor logs
5. Useful for rollbacks or testing specific versions
```

---

## 📋 Deployment Checklist

### Before Pushing to Development Branch

- [ ] All tests pass locally (`pnpm test`)
- [ ] No linter errors (`pnpm lint`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Environment variables documented in .env.template
- [ ] Database migrations created if schema changed (`pnpm prisma migrate dev`)
- [ ] BMAD retrospective created (if completing story)
- [ ] Git agent auto-committed changes

### After Pushing to Development Branch

- [ ] Check Render dashboard for automatic deploy trigger
- [ ] Monitor build logs for errors
- [ ] Verify all 3 services deploy successfully (MCP, Backend, Frontend)
- [ ] Test health endpoints:
  - https://capliquify-mcp-prod.onrender.com/health
  - https://capliquify-backend-prod.onrender.com/api/health
- [ ] Test frontend loads correctly
- [ ] Verify integrations work (if applicable)

### Weekly Maintenance

- [ ] Check database expiration date
- [ ] Review service logs for errors
- [ ] Monitor resource usage (approaching free tier limits?)
- [ ] Verify all environment variables still valid (API keys, tokens)
- [ ] Check for Render platform updates

---

## 🏗️ Infrastructure as Code (render.yaml)

### Critical Sections Explained

**Database Definition**:
```yaml
databases:
  - name: sentia-db-prod
    databaseName: sentia_prod_db
    user: sentia_user
    plan: free  # ⚠️ Expires after 90 days - upgrade before Nov 16, 2025
    region: oregon  # Must match services for best performance
```

**Service with Branch Specification**:
```yaml
services:
  - type: web
    name: sentia-mcp-prod
    branch: development  # ← MUST BE SPECIFIED
    runtime: node
    region: oregon
    rootDir: sentia-mcp-server  # Monorepo subdirectory
```

**Environment Variable Injection**:
```yaml
envVars:
  # Auto-injected from database
  - key: DATABASE_URL
    fromDatabase:
      name: sentia-db-prod
      property: connectionString

  # Auto-injected from another service
  - key: MCP_SERVER_URL
    fromService:
      type: web
      name: sentia-mcp-prod
      envVarKey: RENDER_EXTERNAL_URL

  # Manual entry via dashboard (secrets)
  - key: CLERK_SECRET_KEY
    sync: false  # ← Will NOT sync from .env files

  # Hardcoded values (non-sensitive)
  - key: NODE_ENV
    value: production
```

**Build and Start Commands**:
```yaml
# MCP Server
buildCommand: |
  corepack enable &&
  pnpm install --frozen-lockfile
startCommand: pnpm start

# Backend (with Prisma)
buildCommand: |
  corepack enable &&
  pnpm install --frozen-lockfile &&
  pnpm exec prisma generate
startCommand: |
  corepack enable &&
  pnpm exec prisma migrate deploy &&
  pnpm run start

# Frontend (static site)
buildCommand: |
  corepack enable &&
  pnpm install --frozen-lockfile &&
  pnpm exec vite build
staticPublishPath: dist  # Directory to serve
```

---

## 🔍 Monitoring and Debugging

### Health Check Endpoints

Test these URLs to verify service health:

**MCP Server**:
```bash
curl https://sentia-mcp-prod.onrender.com/health
# Expected: {"status":"healthy","timestamp":"2025-10-19T..."}
```

**Backend API**:
```bash
curl https://sentia-backend-prod.onrender.com/api/health
# Expected: {"status":"healthy","database":"connected","timestamp":"..."}
```

**Frontend**:
```bash
curl -I https://sentia-frontend-prod.onrender.com
# Expected: HTTP/2 200 (HTML page loads)
```

### Log Analysis

**Viewing Logs**:
```bash
1. Render Dashboard → Service → Logs tab
2. Filter by log type:
   - Build: Compilation errors, dependency issues
   - Deploy: Migration errors, startup failures
   - Runtime: Application errors, API failures
3. Search for keywords: "error", "failed", "undefined", "null"
```

**Common Error Patterns**:

**Build Errors**:
```
npm ERR! code ELIFECYCLE
→ Check package.json scripts, ensure all dependencies exist

pnpm ERR! peer dependency issues
→ Check pnpm-lock.yaml is committed, run pnpm install locally

Error: Cannot find module 'xxx'
→ Missing dependency, add to package.json
```

**Deploy Errors**:
```
Error: P1001: Can't reach database server
→ DATABASE_URL incorrect or database not running

Migration failed to apply
→ Prisma schema mismatch, check migrations/

Error: listen EADDRINUSE :::10000
→ Port conflict, check PORT environment variable
```

**Runtime Errors**:
```
TypeError: Cannot read property 'xxx' of undefined
→ Missing environment variable or API response issue

Error: ECONNREFUSED
→ Service trying to connect to unavailable service (check MCP_SERVER_URL)

401 Unauthorized
→ API key invalid or expired (Xero, Shopify, etc.)
```

### Performance Monitoring

**Render Dashboard Metrics**:
- CPU usage (should be < 50% average)
- Memory usage (watch for leaks, should be stable)
- Request count (monitor traffic patterns)
- Response time (should be < 1000ms average)

**Free Tier Limits**:
```
Database: 1GB storage, 97 hours/month compute
Web Services: 750 hours/month total
Bandwidth: Unlimited
Builds: 500 minutes/month
```

---

## 🚨 Emergency Procedures

### Rollback to Previous Version

**If deployment breaks production**:
```bash
1. Identify last working commit:
   git log --oneline -10

2. Deploy specific commit via Render:
   Dashboard → Service → Manual Deploy → "Deploy specific commit"
   Enter commit SHA (e.g., 6de9e168)

3. Verify services recover

4. Fix issue in development branch

5. Re-deploy when ready
```

### Database Recovery

**If database corruption or data loss**:
```bash
1. Check if backup exists (paid plans only)
   Dashboard → Database → Backups tab

2. If no backup, re-run migrations:
   Backend service logs will show migration status

3. Worst case: Export schema, recreate database
   pnpm exec prisma db push --force-reset
   ⚠️ WARNING: Destroys all data!
```

### Service Unresponsive

**If service not responding to requests**:
```bash
1. Check service status (Dashboard → Service)
   Status: "Live" = should be working
   Status: "Deploying" = wait for completion
   Status: "Deploy failed" = check logs

2. Restart service:
   Dashboard → Settings → Restart Service

3. If still unresponsive, check logs for:
   - Memory exhaustion (OOM errors)
   - Unhandled exceptions
   - Infinite loops

4. Manual deploy with cache clear (nuclear option)
```

---

## 📚 Additional Resources

### Official Documentation
- [Render Blueprint Spec](https://render.com/docs/blueprint-spec)
- [Environment Variables](https://render.com/docs/environment-variables)
- [Node.js Deployment](https://render.com/docs/deploy-node-express-app)
- [Static Site Deployment](https://render.com/docs/deploy-vite)

### Internal Documentation
- [.env.template](../.env.template) - All required environment variables
- [render.yaml](../render.yaml) - Infrastructure configuration
- [CLAUDE.md](../CLAUDE.md) - Project overview and architecture

### BMAD-METHOD References
- [BMAD-METHOD-V6A-IMPLEMENTATION.md](../BMAD-METHOD-V6A-IMPLEMENTATION.md)
- Epic tracking: [bmad/epics/](../bmad/epics/)
- Retrospectives: [bmad/retrospectives/](../bmad/retrospectives/)

---

## ✅ Success Criteria

**Deployment is successful when**:
- ✅ All 3 services show "Live" status in Render dashboard
- ✅ Health endpoints return 200 OK
- ✅ Frontend loads without errors
- ✅ API endpoints return expected data
- ✅ External integrations work (if configured)
- ✅ No error logs in Runtime logs
- ✅ Database migrations applied successfully

**Monthly verification**:
- ✅ Database expiration date checked
- ✅ All services deploying from `development` branch
- ✅ Environment variables up to date
- ✅ No stuck deploys or build failures
- ✅ Performance metrics within expected ranges

---

**Document Maintained By**: BMAD-METHOD v6a Framework
**Last Reviewed**: October 19, 2025
**Next Review**: November 19, 2025
