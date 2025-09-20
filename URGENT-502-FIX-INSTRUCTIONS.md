# URGENT: Fix Render Production 502 Error

## Current Status
- **Problem**: Production environment showing 502 Bad Gateway
- **URL**: https://sentia-manufacturing-production.onrender.com
- **Root Cause**: Server startup timeout on Render

## Emergency Fix Applied
I've created an ultra-minimal emergency server that should resolve the 502 error:

1. **render-emergency-server.js** - Zero-dependency server that starts instantly
2. **render-entry.js** - Updated to use emergency server
3. **diagnose-502.ps1** - Diagnostic script to verify fix

## Manual Deployment Required

### Option 1: Force Redeploy on Render Dashboard
1. Go to https://dashboard.render.com
2. Select **sentia-manufacturing-production** service
3. Click **Manual Deploy** → **Deploy latest commit**
4. Monitor the logs for successful startup

### Option 2: Trigger Deployment with Empty Commit
```bash
cd sentia-manufacturing-dashboard
git checkout production
git commit --allow-empty -m "trigger: Force redeploy with emergency server"
git push origin production
```

### Option 3: Update Render Environment Variables
Add these to force simplified startup:
- `SKIP_ENTERPRISE_INIT=true`
- `INIT_TIMEOUT_MS=10000`
- `USE_EMERGENCY_SERVER=true`

## Verification Steps

### 1. Run Diagnostic Script
```powershell
.\render-management\diagnose-502.ps1 -Environment production
```

### 2. Check Health Endpoint
```bash
curl https://sentia-manufacturing-production.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "server": "render-emergency",
  "timestamp": "2025-09-20T...",
  "port": 10000,
  "environment": "production"
}
```

### 3. Check Main Application
Visit: https://sentia-manufacturing-production.onrender.com

## If Emergency Server Works

Once the emergency server is running and 502 is resolved:

1. **Gradually add features back**:
   - First add database connection
   - Then add API routes
   - Finally add authentication

2. **Update to use minimal-server.js**:
   ```javascript
   // In render-entry.js, change:
   import('./render-emergency-server.js');
   // To:
   import('./minimal-server.js');
   ```

## If 502 Persists

### Check Render Logs
1. Go to Render Dashboard → Logs
2. Look for:
   - Build failures
   - Missing dependencies
   - Port binding errors
   - Memory limit exceeded

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Build timeout | Simplify build command in render.yaml |
| Missing dist folder | Ensure `npm run build` runs successfully |
| Port mismatch | Verify server uses `process.env.PORT` |
| Memory exceeded | Upgrade Render plan or optimize server |
| Dependency failure | Use `--legacy-peer-deps` flag |

## Emergency Contacts

### Render Support
- Dashboard: https://dashboard.render.com
- Status: https://status.render.com
- Support: https://render.com/docs

### Quick Test Commands
```bash
# Test locally
node render-emergency-server.js

# Test health endpoint
curl http://localhost:5000/health

# Check if dist exists
ls -la dist/
```

## Files Modified
- `render-entry.js` - Now uses emergency server
- `render-emergency-server.js` - New ultra-minimal server
- `render-management/diagnose-502.ps1` - Diagnostic tool

## Next Steps
1. **Immediate**: Force redeploy on Render
2. **Monitor**: Watch deployment logs
3. **Verify**: Run diagnostic script
4. **Gradual**: Once working, slowly add features back

---
**Priority**: CRITICAL - Production is down
**Time to Fix**: 5-10 minutes after deployment
**Success Metric**: Health endpoint returns JSON, not 502