# BMAD-DEPLOY-001: Backend & MCP Server 502 Error Investigation

**Story ID**: BMAD-DEPLOY-001
**Epic**: EPIC-005 - Production Deployment Hardening
**Priority**: 🚨 **CRITICAL**
**Status**: ⏳ IN PROGRESS
**Created**: 2025-10-19
**Estimated Effort**: 2 hours → **30 minutes** (projected with 4.1x velocity)

---

## User Story

**As a** DevOps engineer
**I want** to investigate and resolve the 502 Bad Gateway errors on backend and MCP production services
**So that** the application can serve live data and function properly in production

---

## Acceptance Criteria

- [ ] Backend API health endpoint returns 200 OK
- [ ] MCP Server health endpoint returns 200 OK
- [ ] Root cause identified and documented
- [ ] Fix implemented and deployed
- [ ] All endpoints tested and verified working
- [ ] Retrospective documentation created

---

## Current Status

### Deployment Health Check (2025-10-19)

| Service | URL | Status | HTTP Code |
|---------|-----|--------|-----------|
| **Frontend** | https://sentia-frontend-prod.onrender.com | ✅ Healthy | 200 |
| **Backend API** | https://sentia-backend-prod.onrender.com/api/health | ⚠️ **DOWN** | **502** |
| **MCP Server** | https://sentia-mcp-prod.onrender.com/health | ⚠️ **DOWN** | **502** |

### Impact Assessment

**Severity**: CRITICAL
**User Impact**: 100% - Application cannot fetch real-time data
**Business Impact**: Production deployment blocked

**Affected Functionality**:
- All API endpoints unavailable
- Real-time data streaming (SSE) non-functional
- External integrations (Xero, Shopify, Amazon, Unleashed) inaccessible
- Dashboard displays empty states

---

## Investigation Plan

### Phase 1: Render Dashboard Investigation (15 min)

**Actions**:
1. Access Render dashboard: https://dashboard.render.com
2. Check service status for:
   - `sentia-backend-prod`
   - `sentia-mcp-prod`
3. Review deployment logs (last 1000 lines)
4. Check environment variables configuration
5. Verify build success/failure

**Expected Findings**:
- Service startup errors
- Missing environment variables
- Database connection failures
- Port binding issues
- Prisma migration errors

### Phase 2: Environment Configuration Audit (10 min)

**Critical Environment Variables to Verify**:

**Backend API**:
- `DATABASE_URL` - PostgreSQL connection string
- `CLERK_SECRET_KEY` - Authentication secret
- `REDIS_URL` - Cache connection
- `NODE_ENV` - Should be `production`
- `PORT` - Should be auto-assigned by Render

**MCP Server**:
- `DATABASE_URL` - PostgreSQL connection string
- `NODE_ENV` - Should be `production`
- `PORT` - Should be auto-assigned by Render

### Phase 3: Build Configuration Audit (5 min)

**Files to Check**:
- `render.yaml` - Deployment configuration
- `server.js` - Main production server
- `package.json` - Start scripts
- `prisma/schema.prisma` - Database schema

**Known Issues to Check**:
1. ~~`render-start.js` override~~ - FIXED (removed October 2025)
2. Prisma P3009 migration errors
3. Tailwind v4 CSS compilation errors
4. Server file path mismatches

---

## Root Cause Hypothesis

### Most Likely Causes (Ranked by Probability)

1. **Database Connection Failure** (60% probability)
   - PostgreSQL free tier expiring November 16, 2025
   - Connection string misconfigured
   - Prisma migration not applied

2. **Environment Variable Missing** (25% probability)
   - `CLERK_SECRET_KEY` not set
   - `DATABASE_URL` not propagated to services
   - Redis URL missing

3. **Server Startup Error** (10% probability)
   - Port binding failure
   - Dependency installation failure
   - Node.js version mismatch

4. **Build Failure** (5% probability)
   - Prisma generate failed
   - Vite build failed
   - TypeScript errors

---

## Resolution Steps

### Step 1: Access Render Dashboard

```bash
# Navigate to Render services
https://dashboard.render.com

# Services to check:
- sentia-backend-prod
- sentia-mcp-prod
```

### Step 2: Check Logs

**Backend Logs**:
```
Render Dashboard → sentia-backend-prod → Logs
Look for:
- "Server listening on port..."
- Database connection errors
- Prisma migration errors
- Environment variable errors
```

**MCP Logs**:
```
Render Dashboard → sentia-mcp-prod → Logs
Look for:
- "MCP Server started on port..."
- Tool registration errors
- Database connection errors
```

### Step 3: Fix Common Issues

**Issue 1: Prisma Migration Not Applied**
```bash
# render.yaml should include:
startCommand: "prisma migrate resolve --rolled-back 20251017171256_init || true && prisma generate && node server.js"
```

**Issue 2: Database URL Not Set**
```bash
# Verify environment variable:
DATABASE_URL=postgresql://user:password@host:port/database
```

**Issue 3: Port Binding**
```javascript
// server.js should use:
const PORT = process.env.PORT || 5000;
```

### Step 4: Trigger Manual Redeploy

```bash
# In Render Dashboard:
1. Go to service
2. Click "Manual Deploy"
3. Select branch: main
4. Deploy latest commit
```

---

## Testing Plan

### Health Check Tests

```bash
# 1. Backend API Health
curl -I https://sentia-backend-prod.onrender.com/api/health
# Expected: HTTP/1.1 200 OK

# 2. MCP Server Health
curl -I https://sentia-mcp-prod.onrender.com/health
# Expected: HTTP/1.1 200 OK

# 3. Frontend (Control Test)
curl -I https://sentia-frontend-prod.onrender.com
# Expected: HTTP/1.1 200 OK (already passing)
```

### Endpoint Tests

```bash
# Test dashboard API
curl https://sentia-backend-prod.onrender.com/api/dashboard/kpi

# Test Xero integration
curl https://sentia-backend-prod.onrender.com/api/dashboard/working-capital

# Test Shopify integration
curl https://sentia-backend-prod.onrender.com/api/dashboard/shopify-orders
```

---

## Documentation Requirements

### Incident Report

**Format**:
```markdown
# Incident Report: Backend 502 Error (2025-10-19)

## Timeline
- 00:00 - Issue detected
- 00:15 - Investigation started
- 00:30 - Root cause identified
- 00:45 - Fix deployed
- 01:00 - Services restored

## Root Cause
[Description of what caused the 502 error]

## Fix Applied
[Description of the fix]

## Prevention Measures
[How to prevent this in the future]
```

### Retrospective

**File**: `bmad/retrospectives/2025-10-19-BMAD-DEPLOY-001-retrospective.md`

**Sections**:
1. What went wrong
2. What went well
3. Lessons learned
4. Action items for future deployments

---

## Success Metrics

- [ ] Backend API uptime: 100%
- [ ] MCP Server uptime: 100%
- [ ] Response time: <500ms for health endpoints
- [ ] Zero 502 errors after fix
- [ ] All integration tests passing

---

## Related Stories

- **BMAD-DEPLOY-002**: Database Migration to Paid Plan (Nov 16 deadline)
- **BMAD-DEPLOY-003**: Monitoring & Alerting Setup
- **BMAD-DEPLOY-004**: Production Deployment Checklist

---

**Story Status**: ⏳ IN PROGRESS
**Next Action**: Access Render dashboard and check service logs
**Assigned To**: Claude (BMAD Developer Agent)
**Created**: 2025-10-19
