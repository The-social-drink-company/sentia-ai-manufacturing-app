# Clerk Authentication Fix - Domain Mismatch

**Created**: 2025-10-20
**Status**: 🚨 **CRITICAL - ACTION REQUIRED**

---

## 🚨 **CRITICAL ERROR IDENTIFIED**

### **Error Message**
```
Clerk: Production Keys are only allowed for domain "capliquify.com".
API Error: The Request HTTP Origin header must be equal to or a subdomain of the requesting URL.
```

### **Root Cause**

Your Clerk production key is **locked to the `capliquify.com` domain**. When you access the site via:
- ❌ `https://sentia-frontend-prod.onrender.com` → **FAILS** (wrong domain)

Clerk production keys enforce strict domain matching for security.

---

## ✅ **SOLUTION: Add Frontend Custom Domain**

### **Option 1: Quick Fix (Recommended) - Add Custom Domain**

#### **Step 1: Add Custom Domain to Frontend Service** (5 minutes)

1. Go to: https://dashboard.render.com/web/srv-d3p789umcj7s739rfnf0
2. Click **Settings** tab
3. Scroll to **Custom Domains** section
4. Click **Add Custom Domain**
5. Enter: `app.capliquify.com`
6. Click **Save**
7. Render will show DNS instructions

#### **Step 2: Configure DNS** (5 minutes)

In your DNS provider (Cloudflare, Namecheap, etc.):

1. Add a **CNAME record**:
   ```
   Name: app
   Type: CNAME
   Value: sentia-frontend-prod.onrender.com
   TTL: Auto or 3600
   ```

2. Save the record

#### **Step 3: Wait for Verification** (5-30 minutes)

Render will automatically:
- Verify domain ownership
- Issue SSL certificate
- Activate the custom domain

You'll see: ✅ **Domain Verified** and ✅ **Certificate Issued**

#### **Step 4: Update Clerk Allowed Origins** (2 minutes)

1. Go to: https://dashboard.clerk.com
2. Navigate to: **Configure** → **Domains** (or **Allowed origins**)
3. **Add** these domains:
   ```
   https://app.capliquify.com
   app.capliquify.com
   https://api.capliquify.com
   api.capliquify.com
   https://mcp.capliquify.com
   mcp.capliquify.com
   ```
4. Click **Save**

**Reference**: https://clerk.com/docs/guides/sessions/sync-host#add-the-extensions-id-to-your-web-apps-allowed-origins

#### **Step 5: Test Authentication** (1 minute)

1. Visit: `https://app.capliquify.com`
2. Click "Sign In"
3. ✅ **Authentication should work!**

---

### **Option 2: Alternative - Use Test Keys for Render Subdomains** (Not Recommended)

If you want to keep using `sentia-frontend-prod.onrender.com`:

1. Create a **test environment** in Clerk
2. Get test keys that work with any domain
3. Update Frontend environment variables:
   ```bash
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx (allows any domain)
   ```
4. Update Backend:
   ```bash
   CLERK_SECRET_KEY=sk_test_xxx
   ```

**Downside**: Test keys aren't suitable for production use.

---

## 🎯 **RECOMMENDED APPROACH**

**Use custom domains** for all services:

| Service | Custom Domain | Status |
|---------|---------------|--------|
| **Frontend** | `app.capliquify.com` | ⏳ **ADD THIS NOW** |
| **Backend** | `api.capliquify.com` | ✅ Already configured |
| **MCP** | `mcp.capliquify.com` | ✅ Already configured |

**Benefits**:
- ✅ Works with Clerk production keys
- ✅ Professional branding (no "sentia" in URLs)
- ✅ Consistent CapLiquify domain
- ✅ Free SSL certificates from Render
- ✅ No code changes needed

---

## 📋 **COMPLETE CHECKLIST**

### **Immediate Actions (15 minutes total)**

- [ ] Add `app.capliquify.com` to Frontend service in Render
- [ ] Add CNAME record in DNS: `app` → `sentia-frontend-prod.onrender.com`
- [ ] Wait for domain verification (5-30 min, check Render Dashboard)
- [ ] Add `app.capliquify.com` to Clerk allowed origins
- [ ] Add `api.capliquify.com` to Clerk allowed origins
- [ ] Add `mcp.capliquify.com` to Clerk allowed origins
- [ ] Test: Visit `https://app.capliquify.com`
- [ ] Test: Click "Sign In" and verify Clerk modal works
- [ ] Test: Sign in successfully and access dashboard

### **Verification**

After completing the steps:

1. **Frontend Custom Domain**
   - [ ] Shows ✅ **Domain Verified** in Render Dashboard
   - [ ] Shows ✅ **Certificate Issued** in Render Dashboard
   - [ ] `https://app.capliquify.com` loads the application

2. **Clerk Configuration**
   - [ ] `app.capliquify.com` added to allowed origins
   - [ ] `api.capliquify.com` added to allowed origins
   - [ ] `mcp.capliquify.com` added to allowed origins

3. **Authentication Working**
   - [ ] No CORS errors in browser console
   - [ ] Clerk modal appears when clicking "Sign In"
   - [ ] Can sign in successfully
   - [ ] Redirected to dashboard after sign in
   - [ ] User data loads correctly

---

## 🔍 **DNS CONFIGURATION EXAMPLE**

### **In Cloudflare Dashboard**

| Type | Name | Content | Proxy Status | TTL |
|------|------|---------|--------------|-----|
| CNAME | app | sentia-frontend-prod.onrender.com | Proxied (☁️) or DNS only | Auto |
| CNAME | api | sentia-backend-prod.onrender.com | Proxied (☁️) or DNS only | Auto |
| CNAME | mcp | sentia-mcp-prod.onrender.com | Proxied (☁️) or DNS only | Auto |

**Note**: If using Cloudflare proxy (☁️), make sure "Full (strict)" SSL/TLS mode is enabled.

### **In Namecheap Advanced DNS**

| Type | Host | Value | TTL |
|------|------|-------|-----|
| CNAME Record | app | sentia-frontend-prod.onrender.com | Automatic |
| CNAME Record | api | sentia-backend-prod.onrender.com | Automatic |
| CNAME Record | mcp | sentia-mcp-prod.onrender.com | Automatic |

---

## 🚨 **IMPORTANT NOTES**

### **Why This Happens**

Clerk **production keys** (`pk_live_xxx`) are domain-restricted for security:
- Only work on the exact domain configured in Clerk
- Only work on subdomains of that domain

Your key is configured for `capliquify.com`, so it only works on:
- ✅ `capliquify.com`
- ✅ `www.capliquify.com`
- ✅ `app.capliquify.com`
- ✅ `api.capliquify.com`
- ❌ `sentia-frontend-prod.onrender.com` (different domain)

### **Why You Can't Use Render Subdomains**

Render subdomains like `sentia-frontend-prod.onrender.com` are:
- ❌ Not subdomains of `capliquify.com`
- ❌ Blocked by Clerk production keys
- ❌ Would require test keys (not recommended for production)

### **Custom Domains Are Free**

- ✅ No extra cost from Render
- ✅ Free SSL certificates
- ✅ Automatic certificate renewal
- ✅ Works immediately after DNS verification

---

## 📊 **COMPARISON**

| Approach | URL | Clerk Works? | Professional? | Cost |
|----------|-----|--------------|---------------|------|
| **Current** | `sentia-frontend-prod.onrender.com` | ❌ NO | ❌ Mixed branding | Free |
| **Custom Domain** | `app.capliquify.com` | ✅ YES | ✅ Professional | Free |
| **Test Keys** | `sentia-frontend-prod.onrender.com` | ⚠️ Yes (not production-ready) | ❌ Mixed branding | Free |

**Clear Winner**: Custom Domain (`app.capliquify.com`) ✅

---

## ⚡ **QUICK START COMMANDS**

### **1. Check Current DNS**
```bash
# Check if app.capliquify.com exists
nslookup app.capliquify.com

# Check if it points to Render
dig app.capliquify.com CNAME
```

### **2. Test Custom Domains**
```bash
# Test backend (should work - already configured)
curl https://api.capliquify.com/health

# Test MCP (should work - already configured)
curl https://mcp.capliquify.com/health

# Test frontend (after adding custom domain)
curl https://app.capliquify.com
```

### **3. Verify SSL**
```bash
# Check SSL certificate
curl -vI https://app.capliquify.com 2>&1 | grep -i "subject\|issuer"
```

---

## 🎯 **ESTIMATED TIME**

| Task | Time |
|------|------|
| Add custom domain in Render | 2 minutes |
| Add DNS CNAME record | 3 minutes |
| DNS propagation | 5-30 minutes |
| Render domain verification | Automatic (1-5 minutes) |
| SSL certificate issuance | Automatic (1-2 minutes) |
| Update Clerk allowed origins | 2 minutes |
| Test authentication | 2 minutes |
| **Total Active Time** | **~10 minutes** |
| **Total Wait Time** | **5-30 minutes** |

---

## ✅ **AFTER COMPLETION**

Once `app.capliquify.com` is configured, you'll have:

- ✅ **Consistent branding**: All services on `*.capliquify.com`
- ✅ **Working authentication**: Clerk production keys functional
- ✅ **Professional URLs**: No mixed Sentia/CapLiquify naming
- ✅ **Free SSL**: Automatic certificate management
- ✅ **Production-ready**: Proper security with production keys

**Production URLs**:
- Frontend: `https://app.capliquify.com`
- Backend API: `https://api.capliquify.com/api`
- MCP Server: `https://mcp.capliquify.com`

---

## 🆘 **TROUBLESHOOTING**

### **Issue: DNS not propagating**
```bash
# Check DNS propagation globally
https://dnschecker.org/#CNAME/app.capliquify.com

# Flush local DNS cache (Windows)
ipconfig /flushdns

# Flush local DNS cache (macOS)
sudo dscacheutil -flushcache
```

### **Issue: Render not verifying domain**

1. Check CNAME record is correct: `app` → `sentia-frontend-prod.onrender.com`
2. Wait 10-15 minutes for DNS propagation
3. Click "Verify" button in Render Dashboard manually
4. If still failing, check DNS TTL isn't too high (should be 3600 or Auto)

### **Issue: SSL certificate not issued**

1. Domain must be verified first (✅ green checkmark)
2. Wait 2-5 minutes after verification
3. Refresh Render Dashboard
4. SSL is automatic - if domain verified, cert will issue

### **Issue: Clerk still shows error**

1. Verify `app.capliquify.com` is in Clerk allowed origins
2. Clear browser cache and cookies
3. Try incognito/private browsing mode
4. Check browser console for specific error messages

---

**Last Updated**: 2025-10-20
**Created By**: Claude (BMAD Developer Agent)
**Status**: 🚨 **ACTION REQUIRED** - Add `app.capliquify.com` custom domain
**Related Docs**:
- [RENDER_SUBDOMAIN_CLARIFICATION.md](RENDER_SUBDOMAIN_CLARIFICATION.md)
- [ENVIRONMENT_VARIABLES_CHECKLIST.md](ENVIRONMENT_VARIABLES_CHECKLIST.md)
