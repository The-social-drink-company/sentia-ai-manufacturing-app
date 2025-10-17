# 📋 PRODUCTION DEPLOYMENT FIX CHECKLIST

## Current Status: 🔴 PRODUCTION DOWN (502 Error)

### Root Cause: Missing Clerk Authentication Environment Variables

---

## ✅ Step-by-Step Fix Process:

### 1️⃣ Access Render Dashboard

- [ ] Go to: https://dashboard.render.com
- [ ] Login with your credentials
- [ ] Select: `sentia-manufacturing-production` service

### 2️⃣ Navigate to Environment Variables

- [ ] Click on the `Environment` tab
- [ ] You should see existing variables like:
  - DATABASE_URL
  - NODE_ENV
  - PORT
  - CORS_ORIGINS

### 3️⃣ Add Critical Clerk Variables (MOST IMPORTANT)

Add these variables ONE BY ONE:

- [ ] `VITE_CLERK_PUBLISHABLE_KEY` = `pk_live_REDACTED`
- [ ] `CLERK_SECRET_KEY` = `sk_live_REDACTED`
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` = `pk_live_REDACTED`
- [ ] `VITE_CLERK_DOMAIN` = `clerk.financeflo.ai`
- [ ] `CLERK_WEBHOOK_SECRET` = `whsec_REDACTED`

### 4️⃣ Add API Configuration Variables

- [ ] `VITE_API_BASE_URL` = `/api`
- [ ] `API_BASE_URL` = `/api`
- [ ] `VITE_CLERK_SIGN_IN_URL` = `/sign-in`
- [ ] `VITE_CLERK_SIGN_UP_URL` = `/sign-up`
- [ ] `VITE_CLERK_AFTER_SIGN_IN_URL` = `/dashboard`
- [ ] `VITE_CLERK_AFTER_SIGN_UP_URL` = `/dashboard`

### 5️⃣ Add MCP Server Variables

- [ ] `MCP_SERVER_URL` = `https://mcp-server-tkyu.onrender.com`
- [ ] `VITE_MCP_SERVER_URL` = `https://mcp-server-tkyu.onrender.com`
- [ ] `MCP_JWT_SECRET` = `production-mcp-jwt-secret-2025`

### 6️⃣ Add Security Variables

- [ ] `SESSION_SECRET` = `production-session-secret-2025-sentia`
- [ ] `JWT_SECRET` = `production-jwt-secret-2025-sentia`
- [ ] `JWT_EXPIRES_IN` = `24h`

### 7️⃣ Save and Deploy

- [ ] Click the `Save Changes` button
- [ ] Render will show "Environment variables updated"
- [ ] Automatic deployment will start (check Events tab)

### 8️⃣ Monitor Deployment

- [ ] Go to the `Events` tab
- [ ] Look for "Deploy live" status
- [ ] Deployment takes 2-5 minutes
- [ ] Wait for "Deploy succeeded" message

### 9️⃣ Verify Fix

- [ ] Run: `./verify-production-fix.sh`
- [ ] Or manually check: https://sentia-manufacturing-production.onrender.com/health
- [ ] Should return JSON: `{"status":"ok","timestamp":"..."}`

---

## 🔍 Troubleshooting:

### If still showing 502 after adding variables:

1. **Check deployment logs**:
   - Go to Logs tab in Render
   - Look for error messages
   - Common issues: Missing npm packages, build failures

2. **Verify all variables were saved**:
   - Go back to Environment tab
   - Ensure all Clerk variables are present
   - Check for typos in variable names

3. **Manual deployment trigger**:
   - Go to Settings tab
   - Click "Manual Deploy"
   - Select "production" branch
   - Click "Deploy"

4. **Check server configuration**:
   - Ensure `render-entry.js` uses `minimal-server.js`
   - Ensure `package.json` start script uses `minimal-server.js`
   - These should already be committed

---

## ✅ Success Indicators:

When production is fixed, you'll see:

1. **Health endpoint returns JSON**:

```json
{
  "status": "ok",
  "timestamp": "2025-09-20T18:30:00.000Z"
}
```

2. **Main site loads**: https://sentia-manufacturing-production.onrender.com

3. **No more 502 errors** in browser

4. **Verification script shows all green**:

```
✓ SUCCESS Health Check
✓ SUCCESS Main Application
✓ SUCCESS API Status
```

---

## 📞 Need Help?

If the above steps don't resolve the issue:

1. Check Render Status: https://status.render.com
2. Review deployment logs for specific errors
3. Ensure GitHub repo has latest changes
4. Verify database connection is working

---

**Time Estimate**: 10-15 minutes total

- Adding variables: 5 minutes
- Deployment: 2-5 minutes
- Verification: 1 minute

**Current Time**: Please start the fix process now to restore production!
