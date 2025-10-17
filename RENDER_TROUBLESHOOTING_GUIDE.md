# Render Troubleshooting Guide

## Quick Solutions for Common Issues

---

## 🔴 CRITICAL ISSUES (App Won't Start)

### Issue: "Emergency Server" Page Shows Instead of App

**Symptoms**: You see "Railway Deployment Working!" or emergency page

**Solutions**:

1. Update start command in Render Dashboard:
   ```
   node server-render.js
   ```
2. Ensure build command includes React build:
   ```
   npm ci --legacy-peer-deps && npm run build && npx prisma generate && npx prisma db push --skip-generate
   ```
3. Clear build cache and redeploy

---

### Issue: Database Connection Failed

**Error**: `The table 'public.users' does not exist` or `Database connection failed`

**Solutions**:

1. **Check DATABASE_URL is set**:
   - Go to Service → Environment
   - DATABASE_URL should point to your Render database
   - Use INTERNAL URL format: `postgresql://user:pass@sentia-db-development:5432/dbname`

2. **Run database migrations**:

   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. **Verify database is available**:
   - Check database service status in Render Dashboard
   - Should show "Available" not "Unavailable"

---

### Issue: Build Fails

**Error**: `Build command failed` or timeout

**Solutions**:

1. **Split build command** if too complex:

   ```
   npm ci --legacy-peer-deps && npm run build
   ```

   Then run migrations separately

2. **Check Node version**:
   - Add `engines` to package.json:

   ```json
   "engines": {
     "node": ">=18.0.0"
   }
   ```

3. **Clear build cache**:
   - Manual Deploy → Clear build cache & deploy

---

## 🟡 API & INTEGRATION ISSUES

### Issue: Clerk Authentication Not Working

**Error**: `Clerk is not configured` or login page doesn't appear

**Solutions**:

1. Verify environment variables:
   ```
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   ```
2. Note: Variables starting with `VITE_` must be present during BUILD time

---

### Issue: API Returns HTML Instead of JSON

**Error**: API endpoints return HTML pages

**Solutions**:

1. Check CORS configuration:
   ```
   CORS_ORIGINS=https://your-service.onrender.com
   ```
2. Verify API routes are registered in server
3. Check if static file serving is interfering

---

### Issue: Xero/Shopify Integration Failing

**Error**: `Xero not configured` or sync failures

**Solutions**:

1. Check all required variables are set:
   - `XERO_CLIENT_ID`
   - `XERO_CLIENT_SECRET`
   - `XERO_REDIRECT_URI` (must match your domain)
2. After first connection, add `XERO_TENANT_ID`

---

## 🟢 PERFORMANCE ISSUES

### Issue: Slow Initial Load

**Symptoms**: Application takes long to respond initially

**Solutions**:

1. **Free tier spin-down**: Render free services sleep after 15 minutes
   - Upgrade to paid tier for always-on
   - Use monitoring to keep alive

2. **Cold start optimization**:
   - Reduce bundle size
   - Implement code splitting
   - Cache static assets

---

### Issue: Database Queries Slow

**Symptoms**: API responses take several seconds

**Solutions**:

1. **Use connection pooling**:

   ```javascript
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
     connectionLimit = 5
   }
   ```

2. **Add indexes** to frequently queried columns

3. **Upgrade database plan** if hitting limits

---

## 🔵 DEPLOYMENT ISSUES

### Issue: Auto-Deploy Not Working

**Symptoms**: GitHub pushes don't trigger deployment

**Solutions**:

1. Check auto-deploy is enabled:
   - Service → Settings → Auto-Deploy from Branch
2. Verify branch name matches
3. Check GitHub connection is active

---

### Issue: Environment Variables Not Loading

**Symptoms**: Features not working, services show as "not configured"

**Solutions**:

1. **Redeploy after adding variables**:
   - Environment variables require redeploy to take effect

2. **Check variable format**:
   - No quotes around values in Render Dashboard
   - No trailing spaces

3. **VITE\_ variables need rebuild**:
   - Variables starting with VITE\_ are build-time only
   - Must clear cache and rebuild

---

## 📊 QUICK DIAGNOSTIC COMMANDS

### Check Service Health

```bash
curl https://your-service.onrender.com/health
```

### Check Database Connection

```bash
curl https://your-service.onrender.com/api/database/health
```

### View Environment (from app)

```javascript
// Add this endpoint to debug
app.get('/api/debug/env', (req, res) => {
  res.json({
    nodeEnv: process.env.NODE_ENV,
    hasDb: !!process.env.DATABASE_URL,
    hasClerk: !!process.env.CLERK_SECRET_KEY,
    port: process.env.PORT,
  })
})
```

---

## 🛠️ COMMON FIXES CHECKLIST

### For Development Environment

- [ ] Service name: `sentia-manufacturing-development`
- [ ] Database: `sentia-db-development`
- [ ] NODE_ENV=development
- [ ] DATABASE_URL uses internal connection
- [ ] All API keys configured
- [ ] Build includes Prisma setup
- [ ] Start command: `node server-render.js`

### For Testing Environment

- [ ] Service name: `sentia-manufacturing-testing`
- [ ] Database: `sentia-db-testing`
- [ ] NODE_ENV=test
- [ ] AUTO_DEPLOY_ENABLED=false
- [ ] Separate from development database

### For Production Environment

- [ ] Service name: `sentia-manufacturing-production`
- [ ] Database: `sentia-db-production`
- [ ] NODE_ENV=production
- [ ] All debug flags=false
- [ ] Using paid database plan
- [ ] Monitoring configured

---

## 🚨 EMERGENCY RECOVERY

### If Everything Breaks:

1. **Rollback to last working version**:
   - Dashboard → Deploys → Find working deploy → Rollback

2. **Check all services status**:

   ```powershell
   .\verify-render-deployment.ps1 -Environment all
   ```

3. **Reset database** (CAUTION: Data loss):

   ```bash
   npx prisma migrate reset
   npx prisma db push
   ```

4. **Contact Render Support**:
   - https://render.com/docs
   - Dashboard → Help → Support

---

## 📝 ERROR MESSAGE DECODER

| Error                  | Meaning                           | Solution             |
| ---------------------- | --------------------------------- | -------------------- |
| `ECONNREFUSED`         | Service can't connect to database | Check DATABASE_URL   |
| `P2021`                | Table doesn't exist               | Run migrations       |
| `CORS error`           | Cross-origin request blocked      | Update CORS_ORIGINS  |
| `502 Bad Gateway`      | Service crashed or not running    | Check logs, restart  |
| `ERR_MODULE_NOT_FOUND` | Missing dependency                | Run `npm ci`         |
| `Cannot find module`   | Build issue                       | Clear cache, rebuild |

---

## ✅ SUCCESS INDICATORS

Your deployment is working when:

- Health check returns `{"status": "healthy"}`
- Database shows "connected"
- Login page appears (not emergency page)
- API returns JSON responses
- No errors in service logs

---

## 📞 GET HELP

1. **Check Logs First**:
   - Dashboard → Service → Logs
   - Look for error messages

2. **Run Verification**:

   ```powershell
   .\verify-render-deployment.ps1 -Detailed
   ```

3. **Review Documentation**:
   - `RENDER_COMPLETE_ENV_SETUP.md`
   - `RENDER_DATABASE_MIGRATION_GUIDE.md`

4. **Render Status**:
   - https://status.render.com

---

**Last Updated**: September 2025
**Quick Fix**: Most issues are solved by: Clear cache → Rebuild → Redeploy
