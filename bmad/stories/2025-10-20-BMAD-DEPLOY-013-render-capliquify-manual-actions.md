# BMAD-DEPLOY-013: Manual Render & Clerk CapLiquify Configuration

**Story ID**: BMAD-DEPLOY-013
**Epic**: EPIC-005 - Production Deployment Hardening
**Parent**: BMAD-DEPLOY-001 (Issue #12 - Clerk domain mismatch)
**Created**: 2025-10-20
**Priority**: HIGH
**Estimate**: 25 minutes
**Status**: ⏳ PENDING USER ACTION

---

## 📋 **Story Description**

**As a** Platform Administrator
**I want to** rename Render services and update Clerk domains to match the CapLiquify codebase
**So that** authentication functionality works correctly without domain mismatch errors

---

## 🎯 **Acceptance Criteria**

1. **Render Services Renamed**:
   - ✅ Frontend service renamed to `capliquify-frontend-prod`
   - ✅ Backend service renamed to `capliquify-backend-prod`
   - ✅ MCP service renamed to `capliquify-mcp-prod`
   - ✅ Database renamed to `capliquify-db-prod`

2. **Clerk Domains Updated**:
   - ✅ `https://capliquify-frontend-prod.onrender.com` added to allowed domains
   - ✅ `https://capliquify-backend-prod.onrender.com` added to allowed domains
   - ✅ Clerk configuration saved and active

3. **Authentication Verified**:
   - ✅ Sign In functionality works without 400 errors
   - ✅ Sign Out functionality works correctly
   - ✅ User authentication flow end-to-end functional

---

## 🛠️ **Implementation Steps**

### Step 1: Rename Render Services (15 minutes)

**Prerequisites**:
- Access to Render dashboard: https://dashboard.render.com
- Account permissions to rename services

**Actions**:
1. Navigate to Render dashboard
2. For each service, go to **Settings → Service Name**:
   - `sentia-frontend-prod` → **`capliquify-frontend-prod`**
   - `sentia-backend-prod` → **`capliquify-backend-prod`**
   - `sentia-mcp-prod` → **`capliquify-mcp-prod`**
3. Navigate to Database settings:
   - `sentia-db-prod` → **`capliquify-db-prod`**
4. Save each change
5. Wait for services to update (no redeployment required)

**Expected Result**:
- All service URLs change to `https://capliquify-*-prod.onrender.com`
- Services continue running without interruption
- Environment variables with `fromService` references auto-update

---

### Step 2: Update Clerk Allowed Domains (5 minutes)

**Prerequisites**:
- Access to Clerk dashboard: https://dashboard.clerk.com
- CapLiquify application selected

**Actions**:
1. Navigate to Clerk dashboard
2. Select CapLiquify application
3. Go to **Settings → Domains**
4. Add new allowed domains:
   - `https://capliquify-frontend-prod.onrender.com`
   - `https://capliquify-backend-prod.onrender.com`
5. Save configuration

**Expected Result**:
- Clerk accepts authentication requests from new CapLiquify Render URLs
- No 400 Bad Request errors on authentication attempts
- Clerk publishable key works with new domains

---

### Step 3: Verify Authentication (5 minutes)

**Prerequisites**:
- Steps 1 and 2 completed
- Access to frontend URL

**Actions**:
1. Visit: `https://capliquify-frontend-prod.onrender.com`
2. Click **Sign In** button
3. Complete authentication flow
4. Verify successful login
5. Click **Sign Out** button
6. Verify successful logout

**Expected Result**:
- Sign In works without errors
- User successfully authenticated
- Sign Out completes successfully
- No 400 errors in browser console
- Clerk authentication fully functional

---

## 🔗 **Related Documentation**

**Renaming Guides**:
- [SENTIA_TO_CAPLIQUIFY_RENAMING_GUIDE.md](../../docs/SENTIA_TO_CAPLIQUIFY_RENAMING_GUIDE.md) (450+ lines)
- [CAPLIQUIFY_RENAMING_COMPLETE.md](../../CAPLIQUIFY_RENAMING_COMPLETE.md)

**Retrospectives**:
- [2025-10-20-BMAD-DEPLOY-001-capliquify-renaming.md](../retrospectives/2025-10-20-BMAD-DEPLOY-001-capliquify-renaming.md)
- [2025-10-19-BMAD-DEPLOY-001-backend-502-incident.md](../retrospectives/2025-10-19-BMAD-DEPLOY-001-backend-502-incident.md)

**Issue Tracker**:
- Parent Issue: BMAD-DEPLOY-001 Issue #12 (Clerk domain mismatch)

---

## ✅ **Definition of Done**

- [ ] All Render services renamed to CapLiquify naming
- [ ] All Render database renamed to CapLiquify naming
- [ ] Clerk allowed domains include new CapLiquify Render URLs
- [ ] Authentication Sign In tested and working
- [ ] Authentication Sign Out tested and working
- [ ] No 400 errors from Clerk API
- [ ] Manual action completion documented in story
- [ ] DEPLOYMENT-BLOCKER-STATUS.md updated to "RESOLVED"

---

## 📊 **Success Metrics**

### Before (Blocked State):
- ❌ Sign In: 400 Bad Request (Clerk domain mismatch)
- ❌ Sign Out: Non-functional
- ❌ Authentication Success Rate: 0%

### After (Target State):
- ✅ Sign In: 200 OK (successful authentication)
- ✅ Sign Out: Functional
- ✅ Authentication Success Rate: 100%

---

## 🚨 **Blockers & Dependencies**

**Blockers**:
- None (codebase renaming complete)

**Dependencies**:
- ✅ Codebase Sentia → CapLiquify renaming complete (commit 8ec536a6)
- ✅ render.yaml configuration updated
- ✅ Documentation created

**Manual Actions Required**:
- ⏳ User has Render dashboard access
- ⏳ User has Clerk dashboard access
- ⏳ User performs manual renaming steps

---

## 🎬 **Verification Commands**

After completing manual steps, verify with:

```bash
# Check service health
curl -s https://capliquify-frontend-prod.onrender.com | head
curl -s https://capliquify-backend-prod.onrender.com/api/health
curl -s https://capliquify-mcp-prod.onrender.com/health

# Expected: All return 200 OK
```

**Browser Verification**:
1. Open: `https://capliquify-frontend-prod.onrender.com`
2. Open browser DevTools (F12)
3. Go to Console tab
4. Click "Sign In"
5. Verify: No 400 errors in console
6. Complete authentication
7. Verify: Successful login
8. Click "Sign Out"
9. Verify: Successful logout

---

## ⏱️ **Time Tracking**

**Estimated**: 25 minutes total
- Render service renaming: 15 minutes
- Clerk domain configuration: 5 minutes
- Authentication verification: 5 minutes

**Actual**: (To be filled after completion)

---

**Story Created**: 2025-10-20
**Assigned To**: Platform Administrator / Product Owner
**Status**: Awaiting manual action
**Next Action**: User performs Render service renaming
