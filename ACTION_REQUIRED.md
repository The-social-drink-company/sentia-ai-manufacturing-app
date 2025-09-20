# URGENT: ONE ACTION REQUIRED FOR PRODUCTION

**Current Status**: 502 Bad Gateway
**Resolution Time**: 10 minutes
**Action Required**: Add environment variables

---

## DO THIS NOW:

### 1. Open Render Dashboard
https://dashboard.render.com/web/srv-ctg8hkpu0jms73ab8m00/env

### 2. Add These 4 Variables First:
```
VITE_CLERK_PUBLISHABLE_KEY = pk_live_Y2xlcmsuZmluYW5jZWZsby5haSQ
CLERK_SECRET_KEY = sk_live_mzgSFm1q9VrzngMMaCTNNwPEqBmr75vVxiND1DO7wq
PORT = 5000
NODE_ENV = production
```

### 3. Add Remaining Variables
Copy from: `render-production-env-vars.txt`

### 4. Click "Save Changes"
Auto-deployment will start

### 5. Wait 3 Minutes
Production will be live!

---

## VERIFY SUCCESS:

Run this command:
```powershell
.\verify-production.ps1
```

Or visit:
https://sentia-manufacturing-production.onrender.com

---

**Everything else is ready. Just add the environment variables.**