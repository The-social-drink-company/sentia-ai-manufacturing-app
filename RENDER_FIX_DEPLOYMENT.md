# Fix Render Deployment - Show React Application

## Problem

The deployment is showing the emergency server page instead of your React application.

## Solution

### Option 1: Update Start Command in Render Dashboard (Quickest Fix)

1. **Go to Render Dashboard**:
   - https://dashboard.render.com
   - Click on `sentia-manufacturing-development`

2. **Update Settings**:
   - Go to **Settings** tab
   - Find **Start Command**
   - Change from any emergency command to:

   ```
   node server.js
   ```

3. **Update Build Command** (ensure it builds React):

   ```
   npm ci --legacy-peer-deps && npm run build
   ```

4. **Deploy Changes**:
   - Click **Save Changes**
   - Go to **Manual Deploy**
   - Click **Clear build cache & deploy**

### Option 2: Check Environment Variables

Make sure these are NOT set (they might override normal startup):

- Remove or set to false: `RAILWAY_EMERGENCY_MODE`
- Remove or set to false: `USE_EMERGENCY_SERVER`
- Remove: Any reference to `railway-emergency.js`

### Option 3: Verify Build Output

The build should create:

- `dist/` folder with your React build
- `dist/index.html` - main HTML file
- `dist/assets/` - JavaScript and CSS files

### Option 4: Complete Fix Script

Create and push this fix to ensure proper deployment:

**render-fix.js** (create this file):

```javascript
// Render deployment fix - ensures main server runs
import './server.js'
```

Then update start command to:

```
node render-fix.js
```

## Verification Steps

After deploying the fix:

1. **Check Main Page**:
   - https://sentia-manufacturing-development.onrender.com
   - Should show Clerk login or dashboard (not emergency message)

2. **Check API**:
   - https://sentia-manufacturing-development.onrender.com/api/health
   - Should return proper health check JSON

3. **Check Static Assets**:
   - View page source
   - Should load `/assets/index-*.js` files
   - Should have React application code

## Current File Structure (Correct)

```
Your project has:
✅ server.js - Main Express server (serves React build)
✅ dist/ folder - React build output
✅ dist/index.html - React entry point
❌ railway-emergency.js - Emergency server (should NOT be used)
```

## What server.js Does

Your `server.js` correctly:

1. Serves static files from `dist/` folder
2. Handles API routes at `/api/*`
3. Returns index.html for React routing
4. Includes health check endpoint

## Quick Command Reference

If you can SSH or have console access:

```bash
# Check what's running
ps aux | grep node

# Check current start command
echo $npm_start

# Manually start correct server
node server.js
```

## Final Checklist

- [ ] Start command is `node server.js`
- [ ] Build command includes `npm run build`
- [ ] dist/ folder is created during build
- [ ] No emergency mode variables set
- [ ] Clear build cache before deploy

---

**Important**: The emergency server was useful for testing, but now you need the real application. Make sure Render is starting `server.js`, not `railway-emergency.js`.
