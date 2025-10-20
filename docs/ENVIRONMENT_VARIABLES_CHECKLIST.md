# Environment Variables Checklist - CapLiquify Renaming

**Created**: 2025-10-20
**Purpose**: Verify all environment variables after Sentia → CapLiquify renaming
**Status**: ✅ Code Updated, ⏳ Render Configuration Pending

---

## 🎯 **CRITICAL RENDER ENVIRONMENT VARIABLES TO UPDATE**

After renaming Render services from `sentia-*` to `capliquify-*`, you MUST update these environment variables in the Render Dashboard.

### **Frontend Service** (capliquify-frontend-prod)

**Dashboard URL**: https://dashboard.render.com/web/srv-d3p789umcj7s739rfnf0/env

| Variable Name | Current Value | Required New Value | Status |
|---------------|---------------|-------------------|--------|
| `VITE_API_BASE_URL` | Auto-set from backend service | Should auto-update to `https://capliquify-backend-prod.onrender.com/api` | ⏳ Verify |
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_live_Y2xlcmsuY2FwbGlxdWlmeS5jb20k` | ✅ Already correct (CapLiquify key) | ✅ OK |
| `VITE_DEVELOPMENT_MODE` | `false` | `false` (production) | ✅ OK |
| `VITE_APP_TITLE` | Not set (optional) | `CapLiquify Manufacturing Platform` | 📝 Optional |

**Action Required**:
1. Go to: https://dashboard.render.com/web/srv-d3p789umcj7s739rfnf0/env
2. Verify `VITE_API_BASE_URL` shows `https://capliquify-backend-prod.onrender.com/api`
3. If not, it should auto-update after backend service rename completes
4. Save and trigger re-deploy

---

### **Backend Service** (capliquify-backend-prod)

**Dashboard URL**: https://dashboard.render.com/web/srv-d3p77vripnbc739pc2n0/env

| Variable Name | Current Value | Required New Value | Status |
|---------------|---------------|-------------------|--------|
| `DATABASE_URL` | Auto-injected from DB | Should show `capliquify-db-prod` connection | ⏳ Verify |
| `MCP_SERVER_URL` | Auto-set from MCP service | Should auto-update to `https://capliquify-mcp-prod.onrender.com` | ⏳ Verify |
| `CLERK_SECRET_KEY` | `sk_live_xxx` | ✅ Already correct (CapLiquify key) | ✅ OK |
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_live_Y2xlcmsuY2FwbGlxdWlmeS5jb20k` | ✅ Already correct | ✅ OK |
| `NODE_ENV` | `production` | `production` | ✅ OK |

**Action Required**:
1. Go to: https://dashboard.render.com/web/srv-d3p77vripnbc739pc2n0/env
2. Verify `MCP_SERVER_URL` auto-updated to new MCP service URL
3. Verify `DATABASE_URL` references `capliquify-db-prod`
4. No manual changes needed if services renamed correctly

---

### **MCP Service** (capliquify-mcp-prod)

**Dashboard URL**: https://dashboard.render.com/web/[MCP_SERVICE_ID]/env

| Variable Name | Required Value | Status |
|---------------|----------------|--------|
| `DATABASE_URL` | Auto-injected from `capliquify-db-prod` | ⏳ Verify |
| `NODE_ENV` | `production` | ✅ OK |
| External API keys | Same as before (Xero, Shopify, Amazon, Unleashed) | ✅ OK |

**Action Required**:
1. Find MCP service in Render Dashboard
2. Verify `DATABASE_URL` references `capliquify-db-prod`
3. Verify all external API keys still configured

---

## 📋 **CLERK CONFIGURATION**

### **Step 1: Add CapLiquify Render Domains to Clerk**

**Action**: Add allowed origins in Clerk Dashboard

1. Go to: https://dashboard.clerk.com
2. Select your **CapLiquify** application
3. Navigate to: **Configure** → **Domains** (or **Allowed origins**)
4. **Add these domains**:
   ```
   https://capliquify-frontend-prod.onrender.com
   capliquify-frontend-prod.onrender.com
   https://capliquify-backend-prod.onrender.com
   http://localhost:3000
   http://localhost:10000
   http://localhost:5173
   ```
5. Click **Save**

**Reference**: https://clerk.com/docs/guides/sessions/sync-host#add-the-extensions-id-to-your-web-apps-allowed-origins

### **Step 2: Verify Clerk Keys**

The existing Clerk keys are **already configured for CapLiquify**:

```bash
# ✅ Correct - Already using CapLiquify keys
VITE_CLERK_PUBLISHABLE_KEY=pk_live_Y2xlcmsuY2FwbGlxdWlmeS5jb20k
CLERK_SECRET_KEY=sk_live_[your_secret_key]
```

**No changes needed** - Keys already reference `capliquify.com` domain!

---

## 🔍 **VERIFICATION CHECKLIST**

After completing Render service renaming and environment variable updates:

### **Render Services**
- [ ] Frontend renamed to `capliquify-frontend-prod`
- [ ] Backend renamed to `capliquify-backend-prod`
- [ ] MCP renamed to `capliquify-mcp-prod`
- [ ] Database named `capliquify-db-prod`

### **Frontend Environment Variables**
- [ ] `VITE_API_BASE_URL` = `https://capliquify-backend-prod.onrender.com/api`
- [ ] `VITE_CLERK_PUBLISHABLE_KEY` configured
- [ ] `VITE_DEVELOPMENT_MODE` = `false`

### **Backend Environment Variables**
- [ ] `DATABASE_URL` references `capliquify-db-prod`
- [ ] `MCP_SERVER_URL` = `https://capliquify-mcp-prod.onrender.com`
- [ ] `CLERK_SECRET_KEY` configured
- [ ] `NODE_ENV` = `production`

### **MCP Environment Variables**
- [ ] `DATABASE_URL` references `capliquify-db-prod`
- [ ] `NODE_ENV` = `production`
- [ ] All external API keys configured (Xero, Shopify, Amazon, Unleashed)

### **Clerk Configuration**
- [ ] CapLiquify domains added to allowed origins
- [ ] Clerk keys verified (should already be CapLiquify keys)

### **Service Health**
- [ ] https://capliquify-frontend-prod.onrender.com loads (HTTP 200)
- [ ] https://capliquify-backend-prod.onrender.com/health returns healthy (HTTP 200)
- [ ] https://capliquify-mcp-prod.onrender.com/health returns healthy (HTTP 200)

### **Authentication Testing**
- [ ] Navigate to https://capliquify-frontend-prod.onrender.com
- [ ] Click "Sign In" button
- [ ] Clerk modal appears (no CORS errors)
- [ ] Can successfully sign in
- [ ] Redirected to dashboard
- [ ] User data loads correctly

---

## 📝 **LOCAL DEVELOPMENT ENVIRONMENT VARIABLES**

If you're running locally, update your `.env.local` file:

```bash
# ============================================================
# CAPLIQUIFY MANUFACTURING PLATFORM - LOCAL DEVELOPMENT
# ============================================================

# Database (use Render production DB for development)
DATABASE_URL=postgresql://capliquify_user:YOUR_PASSWORD@dpg-xxxxx-a.oregon-postgres.render.com:5432/capliquify_prod_db

# Clerk (use test keys for local development)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_TEST_KEY
CLERK_SECRET_KEY=sk_test_YOUR_TEST_KEY

# API Configuration
NODE_ENV=development
PORT=10000
VITE_API_BASE_URL=http://localhost:10000/api

# Application
VITE_APP_TITLE=CapLiquify Manufacturing Platform
VITE_DEVELOPMENT_MODE=true

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:10000,http://localhost:5173

# External APIs (same as production)
XERO_CLIENT_ID=YOUR_XERO_CLIENT_ID
SHOPIFY_UK_ACCESS_TOKEN=YOUR_SHOPIFY_TOKEN
# ... etc
```

---

## 🚨 **COMMON ISSUES & FIXES**

### **Issue 1: CORS Errors After Renaming**

**Symptom**: `CORS policy blocked...` in browser console

**Fix**:
1. Verify Clerk allowed origins include new CapLiquify domains
2. Check backend `server.js` CORS configuration (already updated ✅)
3. Clear browser cache and hard reload

### **Issue 2: Authentication 400 Bad Request**

**Symptom**: Clerk modal shows "400 Bad Request"

**Fix**:
1. Add CapLiquify Render domains to Clerk allowed origins
2. Verify `VITE_CLERK_PUBLISHABLE_KEY` is set in Frontend service
3. Check that Clerk key matches CapLiquify domain (not Sentia)

### **Issue 3: Backend Can't Connect to Database**

**Symptom**: Backend health check shows `database: { connected: false }`

**Fix**:
1. Verify `DATABASE_URL` in Backend service references `capliquify-db-prod`
2. Check database is running in Render Dashboard
3. Verify database credentials haven't changed

### **Issue 4: MCP Service Not Found**

**Symptom**: `MCP_SERVER_URL` shows old Sentia URL or returns 404

**Fix**:
1. Verify MCP service renamed to `capliquify-mcp-prod`
2. Check `MCP_SERVER_URL` in Backend service auto-updated
3. Manually update if needed to: `https://capliquify-mcp-prod.onrender.com`

---

## ✅ **CODE CHANGES COMPLETED**

The following files have been updated in this commit:

1. **server.js**
   - ✅ CORS configuration updated with CapLiquify domains
   - ✅ Startup banner changed to "CAPLIQUIFY MANUFACTURING PLATFORM"
   - ✅ Health check service name: `capliquify-backend-api`
   - ✅ API status service name: `CapLiquify Manufacturing API`
   - ✅ WebSocket welcome message updated

2. **.env.template**
   - ✅ Header updated to "CAPLIQUIFY MANUFACTURING PLATFORM"
   - ✅ Database references updated to `capliquify_prod_db`
   - ✅ App title: `CapLiquify Manufacturing Platform`

3. **.env.production.template**
   - ✅ Database updated to `capliquify_prod_db`
   - ✅ API URL: `https://capliquify-backend-prod.onrender.com/api`
   - ✅ CORS origins updated with CapLiquify domains
   - ✅ MCP URL: `https://capliquify-mcp-prod.onrender.com`

4. **.env.development.template**
   - ✅ Database updated to `capliquify_prod_db`
   - ✅ API URL: `http://localhost:10000/api`
   - ✅ CORS origins updated
   - ✅ MCP URL: `http://localhost:3001` (local)

5. **render.yaml**
   - ✅ Already configured with `capliquify-*` service names
   - ✅ Database: `capliquify-db-prod`

---

## 🚀 **NEXT STEPS**

1. **Review this checklist** thoroughly
2. **Commit and push** the code changes (server.js, .env templates)
3. **Verify Render services** are renamed correctly
4. **Check environment variables** in Render Dashboard match checklist
5. **Add CapLiquify domains** to Clerk allowed origins
6. **Test authentication** at https://capliquify-frontend-prod.onrender.com
7. **Verify all services** are healthy and communicating

---

**Last Updated**: 2025-10-20
**Created By**: Claude (BMAD Developer Agent)
**Related Docs**:
- [SENTIA_TO_CAPLIQUIFY_RENAMING_GUIDE.md](SENTIA_TO_CAPLIQUIFY_RENAMING_GUIDE.md)
- [render.yaml](../render.yaml)
