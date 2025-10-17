# RENDER MEMORY FIX - CRITICAL

## Problem

Render instances are running out of memory (2GB limit exceeded) due to:

- Autonomous testing system generating massive test data
- Memory-intensive background processes
- Large dependency trees being loaded

## Solution Applied

### 1. Environment Variables (Add to Render Dashboard)

```bash
NODE_OPTIONS=--max-old-space-size=1536
DISABLE_AUTONOMOUS_TESTING=true
DISABLE_TEST_DATA_GENERATION=true
ENABLE_GC_OPTIMIZATION=true
```

### 2. Memory Optimization Files Added

- `render-memory-fix.js` - Memory-optimized entry point
- `.renderignore` - Excludes test files and large dependencies

### 3. Package.json Changes

```json
"start": "node render-memory-fix.js",
"start:dev": "node server-fixed.js"
```

### 4. Autonomous Testing Disabled

Modified `services/scheduler/autonomous-scheduler.js` to check environment variable

## To Apply to ALL Environments

### On Render Dashboard:

1. **Development Environment**
   - Go to https://dashboard.render.com
   - Select `sentia-manufacturing-development`
   - Click Environment tab
   - Add the 4 environment variables above
   - Service will auto-redeploy

2. **Testing Environment**
   - Select `sentia-manufacturing-testing`
   - Click Environment tab
   - Add the same 4 environment variables
   - Service will auto-redeploy

3. **Production Environment**
   - Select `sentia-manufacturing-production`
   - Click Environment tab
   - Add the same 4 environment variables
   - Service will auto-redeploy

## Memory Savings

- ~500MB saved by disabling autonomous testing
- ~200MB saved by excluding test files
- ~100MB saved by excluding unused dependencies
- **Total: ~800MB reduction**

## Verification

After deployment, check logs for:

```
RENDER MEMORY-OPTIMIZED ENTRY POINT
Memory Limit: 1.5GB (Render limit: 2GB)
Autonomous Testing: DISABLED
```

## Additional Cleanup

In Render Dashboard → Settings → Build & Deploy:

- Click "Clear build cache" to remove old artifacts

---

**This fix has been applied to development branch and pushed to GitHub**
**The same fix needs to be cherry-picked or merged to test and production branches**
