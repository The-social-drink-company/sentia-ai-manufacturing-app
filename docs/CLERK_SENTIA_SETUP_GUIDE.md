# Clerk Authentication Setup Guide for Sentia Manufacturing App

**Issue**: BMAD-DEPLOY-001 Issue #12 - Sign In/Sign Out Not Working
**Root Cause**: CapLiquify Clerk application cannot be used with Sentia domain
**Created**: 2025-10-19
**Status**: ⏳ BLOCKED - Requires new Clerk application creation

---

## 🚨 **CRITICAL PROBLEM**

The Sentia Manufacturing application is currently using a Clerk publishable key from the **CapLiquify.com** domain:

```
VITE_CLERK_PUBLISHABLE_KEY=pk_live_Y2xlcmsuY2FwbGlxdWlmeS5jb20k
```

**Decoded**: `clerk.capliquify.com$`

**This key CANNOT work** with the Sentia application because:
1. Clerk enforces strict domain restrictions on publishable keys
2. The CapLiquify key only allows requests from `*.capliquify.com` domains
3. Sentia application runs on `capliquify-frontend-prod.onrender.com`
4. Result: **All authentication requests fail with 400 Bad Request**

---

## ✅ **SOLUTION: Create New Clerk Application for Sentia**

You need to create a **NEW Clerk application** specifically for the Sentia domain.

### **Step 1: Create New Clerk Application**

1. Go to: https://dashboard.clerk.com
2. Sign in to your Clerk account
3. Click "Add Application" (or "+ Create Application")
4. **Application Name**: `Sentia Manufacturing` (or your preferred name)
5. **Authentication Methods**: Select what you want to allow:
   - ✅ Email (recommended)
   - ✅ Password (recommended)
   - ✅ Google OAuth (optional)
   - ✅ GitHub OAuth (optional)
   - Add others as needed
6. Click "Create Application"

### **Step 2: Configure Allowed Domains**

1. In the new Sentia Clerk application, go to **Settings → Domains**
2. Add the following allowed domains:
   - `capliquify-frontend-prod.onrender.com` (production)
   - `localhost` (for local development - optional)
3. Save changes

### **Step 3: Get the Publishable Key**

1. In Clerk dashboard, go to **API Keys**
2. Find **Publishable key** section
3. Copy the key that starts with `pk_live_...` (for production)
   - OR `pk_test_...` (for development/testing)
4. **IMPORTANT**: This key should be for the **Sentia** application, NOT CapLiquify!

### **Step 4: Update Render Environment Variable**

1. Go to: https://dashboard.render.com/web/srv-d3p789umcj7s739rfnf0/env
2. Find the `VITE_CLERK_PUBLISHABLE_KEY` variable
3. **Replace** the old CapLiquify key with the NEW Sentia key
4. Click "Save Changes"
5. Render will automatically trigger a new deployment

### **Step 5: Wait for Deployment**

1. Deployment usually takes ~2 minutes
2. Monitor at: https://dashboard.render.com/web/srv-d3p789umcj7s739rfnf0
3. Once deployment shows "Live", the application is updated

### **Step 6: Test Authentication**

1. Navigate to: https://capliquify-frontend-prod.onrender.com
2. Click "Sign In" button
3. **Expected**: Clerk sign-in modal appears
4. Complete sign-in
5. **Expected**: Redirected to `/app/dashboard`
6. Check header for user avatar (Clerk UserButton)
7. Click avatar → "Sign Out" should be visible

---

## 🎯 **VERIFICATION CHECKLIST**

After completing the steps above, verify:

- [ ] New Clerk application created for Sentia
- [ ] Allowed domain includes `capliquify-frontend-prod.onrender.com`
- [ ] New publishable key copied from Sentia Clerk app
- [ ] `VITE_CLERK_PUBLISHABLE_KEY` updated in Render
- [ ] Render deployment completed successfully
- [ ] Landing page loads without errors
- [ ] Sign In button opens Clerk modal (no 400 error)
- [ ] Can successfully sign in
- [ ] Redirected to dashboard after sign in
- [ ] User avatar appears in header
- [ ] Sign Out button visible in avatar dropdown
- [ ] Browser console has NO Clerk errors

---

## 🔍 **DEBUGGING TIPS**

### **Check if Correct Key is Deployed**

Run this command to see what Clerk key is in the deployed bundle:

```bash
curl -s "https://capliquify-frontend-prod.onrender.com/" | grep -o 'pk_[a-zA-Z0-9_]*' | head -1
```

**Expected**: Should show your NEW Sentia Clerk key
**Problem**: If still shows `pk_live_Y2xlcmsuY2FwbGlxdWlmeS5jb20k`, env var wasn't updated

### **Decode a Clerk Publishable Key**

To see what domain a Clerk key is for:

```bash
echo "pk_live_Y2xlcmsuY2FwbGlxdWlmeS5jb20k" | sed 's/pk_live_//' | base64 -d
# Output: clerk.capliquify.com$
```

Replace `pk_live_...` with your key to verify it's for the correct domain.

### **Check Browser Console for Errors**

1. Open DevTools (F12)
2. Go to Console tab
3. Look for Clerk-related errors

**Bad Sign**:
```
clerk.capliquify.com/v1/client: 400 Bad Request
Clerk: Production Keys are only allowed for domain "capliquify.com"
```

**Good Sign**:
```
[useEnvironmentAuth] Clerk loaded successfully
```

---

## 📋 **CURRENT STATUS**

| Component | Status | Notes |
|-----------|--------|-------|
| **Landing Page** | ✅ Working | Beautiful blue-purple gradients visible |
| **Tailwind CSS** | ✅ Fixed | Issue #10 resolved (v4→v3 downgrade) |
| **Sign In Button** | ❌ Blocked | Requires Sentia Clerk app |
| **Sign Out Button** | ❌ Blocked | Requires Sentia Clerk app |
| **Clerk Integration** | ✅ Code Ready | Just needs correct API key |
| **Development Bypass** | ❌ Disabled | Per user requirement |

---

## 💰 **CLERK PRICING (As of 2025)**

**Free Tier**:
- 10,000 monthly active users (MAUs)
- All authentication methods
- Perfect for Sentia Manufacturing app

**Pro Tier** ($25/month):
- 1,000 MAUs included
- Additional MAUs: $0.02/user

For Sentia's use case, **Free Tier is sufficient**.

---

## 🔗 **HELPFUL LINKS**

- **Clerk Dashboard**: https://dashboard.clerk.com
- **Clerk Documentation**: https://clerk.com/docs
- **Clerk React Guide**: https://clerk.com/docs/quickstarts/react
- **Render Dashboard** (Sentia Frontend): https://dashboard.render.com/web/srv-d3p789umcj7s739rfnf0/env
- **Sentia Frontend URL**: https://capliquify-frontend-prod.onrender.com

---

## 📝 **RELATED DOCUMENTATION**

- **Issue**: BMAD-DEPLOY-001 Issue #12 (Sign In/Sign Out Not Working)
- **Story**: [bmad/stories/2025-10-BMAD-DEPLOY-001-backend-502-investigation.md](../bmad/stories/2025-10-BMAD-DEPLOY-001-backend-502-investigation.md)
- **Authentication Config**: [context/authentication-config.md](../context/authentication-config.md)

---

## ❓ **FAQ**

### **Q: Can I use the CapLiquify Clerk app for both projects?**
**A**: No. Clerk enforces domain restrictions. Each domain needs its own Clerk application.

### **Q: Will this cost extra?**
**A**: No. Clerk's free tier (10,000 MAUs) is sufficient for both projects.

### **Q: What happens to existing CapLiquify users?**
**A**: They're unaffected. CapLiquify continues to use its own Clerk app.

### **Q: Can I test this locally first?**
**A**: Yes! Create a Clerk app with `localhost` as an allowed domain, use `pk_test_...` key, set `VITE_DEVELOPMENT_MODE=false`, and run locally.

### **Q: Why not use development mode bypass?**
**A**: Per user requirement: "NEVER Enable Development Mode Bypass - we must ALWAYS be production ready regarding Clerk authentication"

---

## ✅ **NEXT STEPS**

1. **Create Sentia Clerk application** (Steps 1-3 above)
2. **Update Render environment variable** (Step 4 above)
3. **Wait for deployment** (Step 5 above)
4. **Test authentication** (Step 6 above)
5. **Verify checklist items** (Verification section above)

Once complete, **sign in/sign out will work perfectly** with production-grade Clerk authentication! 🎉

---

**Last Updated**: 2025-10-19
**Created By**: Claude (BMAD Developer Agent)
**Status**: ⏳ Awaiting Clerk application creation
