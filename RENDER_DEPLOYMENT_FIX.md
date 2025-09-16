# Render Deployment Fix - Quick Guide

## Current Issues & Solutions

### 1. ❌ Database Tables Missing
**Error**: `The table 'public.users' does not exist`

**Solution**:
1. Go to Render Dashboard → `sentia-manufacturing-development`
2. Update **Build Command** to include database setup:
   ```
   npm ci --legacy-peer-deps && npm run build && npx prisma generate && npx prisma db push --skip-generate
   ```
3. Make sure **DATABASE_URL** is set in Environment variables
4. Redeploy with **Clear build cache & deploy**

### 2. ✅ Module Import Error (Fixed)
**Error**: `require is not defined`
- Already fixed in code - will work after next deployment

### 3. ✅ MCP Server URL Updated
Your MCP server is now live at: `https://mcp-server-tkyu.onrender.com`

## Quick Fix Steps

### Option A: Via Render Dashboard (Recommended)

1. **Update Build Command**:
   - Go to Settings
   - Change Build Command to:
   ```
   npm ci --legacy-peer-deps && npm run build && npx prisma generate && npx prisma db push --skip-generate
   ```

2. **Verify Environment Variables**:
   ```
   DATABASE_URL=[Your database connection string]
   NODE_ENV=development
   PORT=10000
   ```

3. **Deploy**:
   - Manual Deploy → Clear build cache & deploy
   - Monitor logs for any errors

### Option B: Run Database Setup Locally First

1. **Set DATABASE_URL locally**:
   ```bash
   export DATABASE_URL="your-render-database-url"
   ```

2. **Run setup script**:
   ```bash
   node scripts/render-db-setup.js
   ```

3. **Then deploy**:
   ```bash
   git add .
   git commit -m "Fix deployment issues"
   git push origin development
   ```

## What the Fix Does

1. **Prisma Generate**: Creates the Prisma client
2. **Prisma DB Push**: Creates all database tables
3. **Fixed Imports**: ES modules instead of CommonJS
4. **MCP Integration**: Connected to live MCP server

## Verify Success

After deployment, check:

1. **Main Site**: https://sentia-manufacturing-development.onrender.com
   - Should show login page (not emergency server)

2. **Health Check**: https://sentia-manufacturing-development.onrender.com/health
   - Should show `"status": "healthy"`
   - Database should show `"connected"`

3. **API**: https://sentia-manufacturing-development.onrender.com/api/health
   - Should return proper JSON response

## If Still Having Issues

### Database Connection Failed
- Copy **Internal Database URL** from `sentia-db-development`
- Format: `postgresql://user:password@dpg-xxx.render.com/dbname`
- Don't use External URL

### Build Timeout
- Split build command if needed
- Run database setup separately

### Application Not Loading
- Check if `dist/` folder was created
- Verify React build completed
- Check browser console for errors

## Success Indicators

✅ No database errors in logs
✅ Health check returns 200 OK
✅ Login page displays
✅ No "emergency server" message
✅ API endpoints respond with JSON

---

**Status**: Ready to deploy with fixes
**Next Step**: Update build command in Render Dashboard