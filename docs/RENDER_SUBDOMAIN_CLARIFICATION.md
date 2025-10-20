# Render Subdomain Clarification - CapLiquify

**Created**: 2025-10-20
**Status**: 🚨 **CRITICAL INFORMATION**

---

## 🎯 **KEY FINDING: Render Subdomains Are Permanent**

When you rename a Render service, the **service name** changes but the **Render subdomain does NOT change**.

### **What Changed When You Renamed Services**

| Item | Before | After | Changed? |
|------|--------|-------|----------|
| **Service Name** | `sentia-frontend-prod` | `capliquify-frontend-prod` | ✅ YES |
| **Render Subdomain** | `sentia-frontend-prod.onrender.com` | `sentia-frontend-prod.onrender.com` | ❌ NO (permanent) |
| **Custom Domain** | N/A | Can add `app.capliquify.com` | ✅ Optional |

---

## 📍 **ACTUAL WORKING URLs**

### **Production Services (Confirmed Working)**

| Service | Service Name (Render Dashboard) | Actual Subdomain URL | Custom Domain |
|---------|----------------------------------|----------------------|---------------|
| **Frontend** | `capliquify-frontend-prod` | `https://sentia-frontend-prod.onrender.com` ✅ | Not configured |
| **Backend** | `capliquify-backend-prod` | `https://sentia-backend-prod.onrender.com` ✅ | Can add `api.capliquify.com` |
| **MCP Server** | `capliquify-mcp-prod` | `https://sentia-mcp-prod.onrender.com` ✅ | `mcp.capliquify.com` ✅ |
| **Database** | `capliquify-db-prod` | Internal connection only | N/A |

### **Health Check Endpoints**

```bash
# Backend Health (WORKING)
curl https://sentia-backend-prod.onrender.com/health
# Returns: {"status":"healthy","service":"sentia-manufacturing-dashboard",...}

# Frontend (WORKING)
curl https://sentia-frontend-prod.onrender.com
# Returns: HTML page

# MCP Health (Should work)
curl https://sentia-mcp-prod.onrender.com/health
# OR
curl https://mcp.capliquify.com/health
```

---

## ✅ **UPDATED CORS CONFIGURATION**

The `server.js` file has been updated with the **correct actual URLs**:

```javascript
const allowedOrigins = [
  // CapLiquify custom domains (recommended for production)
  'https://mcp.capliquify.com', // MCP custom domain ✅ configured
  'https://api.capliquify.com', // Backend (if you configure)
  'https://app.capliquify.com', // Frontend (if you configure)
  'https://capliquify.com', // Main domain
  'https://www.capliquify.com', // WWW subdomain

  // Render production subdomains (ACTUAL working URLs)
  'https://sentia-frontend-prod.onrender.com', // ✅ Frontend
  'https://sentia-backend-prod.onrender.com', // ✅ Backend
  'https://sentia-mcp-prod.onrender.com', // ✅ MCP

  // Local development
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:10000',
  'http://localhost:3001',
]
```

---

## 🔄 **CLERK CONFIGURATION UPDATE**

### **Add These Domains to Clerk Allowed Origins**

Since the actual working URLs are `sentia-*-prod.onrender.com`, you need to add these to Clerk:

1. Go to: https://dashboard.clerk.com
2. Navigate to: **Configure** → **Domains** or **Allowed origins**
3. **Add** these domains:

```
https://sentia-frontend-prod.onrender.com
https://sentia-backend-prod.onrender.com
sentia-frontend-prod.onrender.com
sentia-backend-prod.onrender.com
https://mcp.capliquify.com
mcp.capliquify.com
http://localhost:3000
http://localhost:10000
http://localhost:5173
```

4. Click **Save**

**Reference**: https://clerk.com/docs/guides/sessions/sync-host#add-the-extensions-id-to-your-web-apps-allowed-origins

---

## 🎯 **RECOMMENDED: Configure Custom Domains**

Instead of using `sentia-*-prod.onrender.com` subdomains, configure custom domains for a cleaner CapLiquify brand:

### **Step 1: Add Custom Domains in Render**

1. **Frontend**: Add `app.capliquify.com`
   - Go to: https://dashboard.render.com/web/srv-d3p789umcj7s739rfnf0
   - Settings → Custom Domains → Add `app.capliquify.com`

2. **Backend**: Add `api.capliquify.com`
   - Go to: https://dashboard.render.com/web/srv-d3p77vripnbc739pc2n0
   - Settings → Custom Domains → Add `api.capliquify.com`

3. **MCP**: Already configured as `mcp.capliquify.com` ✅

### **Step 2: Configure DNS (Cloudflare/Namecheap/etc)**

Add CNAME records for each subdomain:

| Subdomain | Type | Value |
|-----------|------|-------|
| `app` | CNAME | `sentia-frontend-prod.onrender.com` |
| `api` | CNAME | `sentia-backend-prod.onrender.com` |
| `mcp` | CNAME | `sentia-mcp-prod.onrender.com` |

### **Step 3: Update Environment Variables**

After custom domains are verified, update in Render Dashboard:

**Frontend** (`capliquify-frontend-prod`):
```bash
VITE_API_BASE_URL=https://api.capliquify.com/api
```

**Backend** (`capliquify-backend-prod`):
```bash
MCP_SERVER_URL=https://mcp.capliquify.com
```

### **Step 4: Update Clerk Allowed Origins**

Replace the `sentia-*-prod.onrender.com` domains with:
```
https://app.capliquify.com
https://api.capliquify.com
https://mcp.capliquify.com
app.capliquify.com
api.capliquify.com
mcp.capliquify.com
```

---

## 📊 **COMPARISON: Current vs Recommended**

| Aspect | Current (Sentia Subdomains) | Recommended (Custom Domains) |
|--------|----------------------------|------------------------------|
| **Frontend URL** | `sentia-frontend-prod.onrender.com` | `app.capliquify.com` ✨ |
| **Backend URL** | `sentia-backend-prod.onrender.com` | `api.capliquify.com` ✨ |
| **MCP URL** | `sentia-mcp-prod.onrender.com` | `mcp.capliquify.com` ✅ Done |
| **Branding** | Mixed (Sentia URLs, CapLiquify name) | Consistent CapLiquify ✨ |
| **Professional** | ❌ Confusing brand | ✅ Clean, professional |
| **SSL** | ✅ Auto (Render) | ✅ Auto (Render) |
| **Cost** | ✅ Free | ✅ Free |
| **Setup Time** | Already done | 15-20 minutes |

---

## ⚙️ **ENVIRONMENT VARIABLES SUMMARY**

### **Current Environment Variables (Render Dashboard)**

**Frontend** (`capliquify-frontend-prod`):
```bash
VITE_API_BASE_URL=https://sentia-backend-prod.onrender.com/api  # ✅ Correct (auto-set)
VITE_CLERK_PUBLISHABLE_KEY=pk_live_Y2xlcmsuY2FwbGlxdWlmeS5jb20k  # ✅ Correct
VITE_DEVELOPMENT_MODE=false  # ✅ Correct
```

**Backend** (`capliquify-backend-prod`):
```bash
DATABASE_URL=[auto-injected from capliquify-db-prod]  # ✅ Correct
MCP_SERVER_URL=https://sentia-mcp-prod.onrender.com  # ✅ Correct (or use mcp.capliquify.com)
CLERK_SECRET_KEY=sk_live_xxx  # ✅ Set in Render
NODE_ENV=production  # ✅ Correct
```

**MCP** (`capliquify-mcp-prod`):
```bash
DATABASE_URL=[auto-injected from capliquify-db-prod]  # ✅ Correct
NODE_ENV=production  # ✅ Correct
# All external API keys (Xero, Shopify, Amazon, Unleashed)  # ✅ Set
```

---

## ✅ **VERIFICATION CHECKLIST**

### **Immediate Actions (No Custom Domains)**

- [x] CORS configuration updated with actual `sentia-*-prod.onrender.com` URLs
- [ ] Add `sentia-frontend-prod.onrender.com` to Clerk allowed origins
- [ ] Add `sentia-backend-prod.onrender.com` to Clerk allowed origins
- [ ] Add `mcp.capliquify.com` to Clerk allowed origins
- [ ] Test authentication at `https://sentia-frontend-prod.onrender.com`
- [ ] Verify no CORS errors in browser console
- [ ] Commit and push server.js changes

### **Optional: Custom Domains (Recommended)**

- [ ] Add `app.capliquify.com` custom domain in Render (Frontend)
- [ ] Add `api.capliquify.com` custom domain in Render (Backend)
- [ ] Configure DNS CNAME records
- [ ] Wait for domain verification (5-30 minutes)
- [ ] Update `VITE_API_BASE_URL` to `https://api.capliquify.com/api`
- [ ] Update Clerk allowed origins with custom domains
- [ ] Test authentication at `https://app.capliquify.com`

---

## 🚨 **KEY TAKEAWAYS**

1. **Render subdomains are permanent** - They don't change when you rename a service
2. **Service names changed** - Dashboard shows `capliquify-*-prod` ✅
3. **Actual URLs unchanged** - Still `sentia-*-prod.onrender.com` ✅
4. **CORS updated** - `server.js` now includes actual working URLs ✅
5. **Custom domains recommended** - For consistent CapLiquify branding
6. **Clerk config needed** - Add actual subdomains to allowed origins

---

## 📝 **NEXT STEPS**

### **Option A: Quick Fix (Use Existing Subdomains)**
1. Add `sentia-*-prod.onrender.com` to Clerk allowed origins
2. Commit and push server.js changes
3. Test authentication
4. ✅ **Done in 10 minutes**

### **Option B: Professional Setup (Custom Domains)**
1. Configure custom domains in Render
2. Update DNS records
3. Update environment variables
4. Update Clerk allowed origins
5. ✅ **Done in 20-30 minutes**

**Recommendation**: Start with **Option A** to fix authentication immediately, then do **Option B** when you have time for a professional branded setup.

---

**Last Updated**: 2025-10-20
**Created By**: Claude (BMAD Developer Agent)
**Related Docs**:
- [ENVIRONMENT_VARIABLES_CHECKLIST.md](ENVIRONMENT_VARIABLES_CHECKLIST.md)
- [SENTIA_TO_CAPLIQUIFY_RENAMING_GUIDE.md](SENTIA_TO_CAPLIQUIFY_RENAMING_GUIDE.md)
