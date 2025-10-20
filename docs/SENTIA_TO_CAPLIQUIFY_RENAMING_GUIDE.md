# Sentia → CapLiquify Renaming Guide

**Objective**: Rename all "Sentia" references to "CapLiquify" to align with existing Clerk credentials
**Created**: 2025-10-19
**Status**: 📋 READY TO EXECUTE

---

## 🎯 **WHY THIS SOLVES AUTHENTICATION (Issue #12)**

**Current Problem**:
- Clerk key is for `capliquify.com` domain
- Render services use `sentia-frontend-prod.onrender.com`
- Domain mismatch → Authentication fails (400 Bad Request)

**Solution**:
- Rename Render services to `capliquify-*` URLs
- Update Clerk allowed domains to include new URLs
- ✅ **Authentication will work immediately with existing Clerk key!**

---

## 📋 **PART 1: RENDER SERVICE RENAMING**

### **Step 1.1: Rename Frontend Service**

1. Go to: https://dashboard.render.com/web/srv-d3p789umcj7s739rfnf0
2. Click **Settings** tab
3. Scroll to **Service Name** section
4. **Current Name**: `sentia-frontend-prod`
5. **New Name**: `capliquify-frontend-prod`
6. Click **Save Changes**
7. **New URL will be**: `https://capliquify-frontend-prod.onrender.com`

### **Step 1.2: Rename Backend Service**

1. Go to: https://dashboard.render.com/web/srv-d3p77vripnbc739pc2n0
2. Click **Settings** tab
3. Scroll to **Service Name** section
4. **Current Name**: `sentia-backend-prod`
5. **New Name**: `capliquify-backend-prod`
6. Click **Save Changes**
7. **New URL will be**: `https://capliquify-backend-prod.onrender.com`

### **Step 1.3: Rename MCP Service** (If exists)

**Note**: MCP service may not exist or may be named differently. Check dashboard.

If it exists:
1. Go to Render Dashboard → Services
2. Find MCP service (likely `sentia-mcp-prod`)
3. Rename to: `capliquify-mcp-prod`
4. Save changes

### **Step 1.4: Update Environment Variables**

After renaming services, update the **Frontend** environment variables:

1. Go to: https://dashboard.render.com/web/srv-d3p789umcj7s739rfnf0/env
2. Find `VITE_API_BASE_URL`
3. **Update** from: `https://sentia-backend-prod.onrender.com/api`
4. **Update** to: `https://capliquify-backend-prod.onrender.com/api`
5. Click **Save Changes** (triggers auto-deploy)

---

## 📋 **PART 2: CLERK DOMAIN CONFIGURATION**

### **Step 2.1: Add CapLiquify Render Domains to Clerk**

1. Go to: https://dashboard.clerk.com
2. Select your **CapLiquify** application
3. Navigate to: **Settings → Domains** (or **Allowed origins**)
4. **Add** these domains:
   - `capliquify-frontend-prod.onrender.com`
   - `https://capliquify-frontend-prod.onrender.com`
   - `localhost` (for local development)
5. Click **Save**

### **Step 2.2: Verify Clerk Publishable Key**

The existing Clerk key should now work:
```
VITE_CLERK_PUBLISHABLE_KEY=pk_live_Y2xlcmsuY2FwbGlxdWlmeS5jb20k
```

This key is already configured for the CapLiquify domain, so **no changes needed** once Render domains are updated!

---

## 📋 **PART 3: CODEBASE UPDATES**

### **Files to Update** (After Render renaming is complete)

#### **3.1: Documentation Files**

**Files to update**:
- `CLAUDE.md` (main project docs)
- `README.md` (if exists)
- `docs/CLERK_SENTIA_SETUP_GUIDE.md` → Rename or archive
- `docs/render-deployment-guide.md` (update URLs)
- All files in `bmad/` directory (stories, epics, retrospectives)

**Find and replace**:
```bash
# Search for:
sentia-frontend-prod.onrender.com
sentia-backend-prod.onrender.com
sentia-mcp-prod.onrender.com
Sentia Manufacturing

# Replace with:
capliquify-frontend-prod.onrender.com
capliquify-backend-prod.onrender.com
capliquify-mcp-prod.onrender.com
CapLiquify
```

#### **3.2: Environment Variable Templates**

**Files to update**:
- `.env.template`
- `.env.example`
- `.env.production.template`
- `.env.development.template`

**Update**:
```bash
# OLD:
VITE_APP_TITLE=Sentia Manufacturing Dashboard
# NEW:
VITE_APP_TITLE=CapLiquify Dashboard

# Verify VITE_CLERK_PUBLISHABLE_KEY uses CapLiquify key
```

#### **3.3: Render Configuration**

**File**: `render.yaml`

**Update service names and environment variables**:
```yaml
# OLD:
- type: web
  name: sentia-frontend-prod

# NEW:
- type: web
  name: capliquify-frontend-prod
```

#### **3.4: Application Metadata**

**File**: `package.json`

**Update**:
```json
{
  "name": "capliquify-manufacturing-dashboard",
  "description": "CapLiquify - AI-Powered Manufacturing Intelligence Platform",
  // ...
}
```

#### **3.5: UI Components (Optional - Low Priority)**

**Files with "Sentia" in UI text**:
- `src/pages/LandingPage.jsx` (Hero section text)
- `src/components/layout/Header.jsx` (App title)
- Various documentation pages

**Update text references**:
```javascript
// OLD:
<h1>Sentia Manufacturing Enterprise Dashboard</h1>

// NEW:
<h1>CapLiquify Manufacturing Enterprise Dashboard</h1>
```

---

## 📋 **PART 4: VERIFICATION CHECKLIST**

After completing all steps above, verify:

### **Render Services**
- [ ] Frontend service renamed to `capliquify-frontend-prod`
- [ ] Backend service renamed to `capliquify-backend-prod`
- [ ] MCP service renamed (if exists)
- [ ] New URLs accessible:
  - [ ] https://capliquify-frontend-prod.onrender.com (HTTP 200)
  - [ ] https://capliquify-backend-prod.onrender.com/api/health (HTTP 200)
- [ ] Environment variables updated (`VITE_API_BASE_URL`)
- [ ] Deployments completed successfully

### **Clerk Configuration**
- [ ] CapLiquify Render domains added to Clerk
- [ ] Clerk publishable key configured in Render env vars
- [ ] No domain mismatch errors in browser console

### **Authentication Testing**
- [ ] Navigate to https://capliquify-frontend-prod.onrender.com
- [ ] Click "Sign In" button
- [ ] Clerk modal appears (no 400 error)
- [ ] Can successfully sign in
- [ ] Redirected to dashboard
- [ ] User avatar appears in header
- [ ] Sign out works

### **Codebase Updates**
- [ ] Documentation updated (CLAUDE.md, README.md)
- [ ] Environment templates updated
- [ ] render.yaml updated
- [ ] package.json updated
- [ ] UI text updated (optional)
- [ ] All changes committed to git
- [ ] Changes pushed to main branch

---

## 🚀 **EXECUTION ORDER (RECOMMENDED)**

**Phase 1: Render Renaming** (15 minutes)
1. Rename Frontend service → `capliquify-frontend-prod`
2. Rename Backend service → `capliquify-backend-prod`
3. Rename MCP service (if exists)
4. Update `VITE_API_BASE_URL` environment variable
5. Wait for auto-deployment (~2 minutes)
6. Verify new URLs are accessible

**Phase 2: Clerk Configuration** (5 minutes)
1. Go to Clerk dashboard
2. Add CapLiquify Render domains to allowed origins
3. Verify Clerk key is configured in Render env vars
4. Save changes

**Phase 3: Test Authentication** (5 minutes)
1. Visit https://capliquify-frontend-prod.onrender.com
2. Click "Sign In"
3. Verify Clerk modal appears
4. Sign in successfully
5. ✅ **ISSUE #12 RESOLVED!**

**Phase 4: Codebase Updates** (30 minutes)
1. Update documentation files
2. Update environment templates
3. Update render.yaml
4. Update package.json
5. Update UI text (optional)
6. Commit all changes
7. Push to main branch
8. Verify deployment

---

## 💡 **BENEFITS OF THIS APPROACH**

1. ✅ **Authentication Works Immediately**: Existing CapLiquify Clerk key will work
2. ✅ **No New Clerk App Needed**: Saves setup time
3. ✅ **Consistent Branding**: All services use same naming
4. ✅ **Cleaner Architecture**: Aligns naming with existing credentials
5. ✅ **Issue #12 Resolved**: Domain mismatch problem eliminated

---

## ⚠️ **IMPORTANT NOTES**

### **Render Service Renaming**
- ⚠️ **Service renaming changes the URL permanently**
- ⚠️ **Old URLs will stop working** (sentia-*.onrender.com)
- ⚠️ **Deployments will trigger automatically** after renaming
- ⚠️ **No downtime expected** (Render handles gracefully)

### **Bookmarks & Links**
- Update any bookmarks to new URLs
- Update any external links pointing to old URLs
- Update documentation in other projects referencing Sentia URLs

### **Git Repository Name**
- **Optional**: You can rename the GitHub repository from `sentia-ai-manufacturing-app` to `capliquify-ai-manufacturing-app`
- This is **cosmetic only** and doesn't affect functionality
- To rename: GitHub → Repository Settings → Rename

---

## 🔗 **USEFUL LINKS**

- **Render Dashboard**: https://dashboard.render.com
- **Clerk Dashboard**: https://dashboard.clerk.com
- **Frontend Service (OLD)**: https://dashboard.render.com/web/srv-d3p789umcj7s739rfnf0
- **Backend Service (OLD)**: https://dashboard.render.com/web/srv-d3p77vripnbc739pc2n0
- **Frontend URL (NEW)**: https://capliquify-frontend-prod.onrender.com (after renaming)
- **Backend URL (NEW)**: https://capliquify-backend-prod.onrender.com (after renaming)

---

## 📝 **RELATED DOCUMENTATION**

- **Issue #12**: Sign In/Sign Out Not Working
- **BMAD-DEPLOY-001**: Backend 502 Investigation
- **Clerk Setup Guide**: docs/CLERK_SENTIA_SETUP_GUIDE.md (will be deprecated after renaming)

---

## ✅ **NEXT STEPS**

1. **Review this guide** thoroughly
2. **Execute Phase 1**: Render service renaming (15 min)
3. **Execute Phase 2**: Clerk domain configuration (5 min)
4. **Execute Phase 3**: Test authentication (5 min)
5. **Execute Phase 4**: Update codebase (30 min)
6. **Verify checklist items** above
7. ✅ **Authentication will work!**

---

**Last Updated**: 2025-10-19
**Created By**: Claude (BMAD Developer Agent)
**Status**: 📋 Ready to execute
**Estimated Time**: ~1 hour total
