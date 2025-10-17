# 🚨 IMMEDIATE DATABASE CONNECTION FIX

**Problem**: Prisma P1001 error - cannot reach database host
**Root Cause**: Using internal hostname instead of external hostname

## ⚡ IMMEDIATE ACTION REQUIRED

Go to Render Dashboard and update these **exact values**:

### 1. Development Service: `sentia-manufacturing-development`

**Navigate to**: Environment Variables tab
**Find**: `DATABASE_URL`
**Replace with**:

```
postgresql://sentia_dev:nZ4vtXienMAwxahr0GJByc2qXFIFSoYL@dpg-d344rkfdiees73a20c50-a.oregon-postgres.render.com/sentia_manufacturing_dev?sslmode=require
```

### 2. Testing Service: `sentia-manufacturing-testing`

**Navigate to**: Environment Variables tab
**Find**: `DATABASE_URL`
**Replace with**:

```
postgresql://sentia_test:nZ4vtXienMAwxahr0GJByc2qXFIFSoYL@dpg-d344rkfdiees73a20c50-a.oregon-postgres.render.com/sentia_manufacturing_test?sslmode=require
```

### 3. Production Service: `sentia-manufacturing-production`

**Navigate to**: Environment Variables tab
**Find**: `DATABASE_URL`
**Replace with**:

```
postgresql://sentia_prod:nZ4vtXienMAwxahr0GJByc2qXFIFSoYL@dpg-d344rkfdiees73a20c50-a.oregon-postgres.render.com/sentia_manufacturing_prod?sslmode=require
```

## 🔧 CRITICAL FIXES MADE:

1. **External Hostname**: Changed from `dpg-d344rkfdiees73a20c50-a` to `dpg-d344rkfdiees73a20c50-a.oregon-postgres.render.com`
2. **SSL Mode**: Added `?sslmode=require` for secure connections
3. **Environment-Specific Databases**: Different credentials for each environment

## ✅ VERIFICATION STEPS:

After updating each environment variable in Render:

1. **Save Changes** (service will auto-redeploy)
2. **Check Logs** for "Database: Connected" message
3. **Verify API endpoints** return JSON instead of HTML
4. **Test application** loads without P1001 errors

## 🎯 SUCCESS INDICATORS:

- ✅ Startup logs show: `Database: Connected`
- ✅ No P1001 errors in deployment logs
- ✅ API endpoints accessible and returning data
- ✅ Prisma can successfully query the database

---

**NEXT**: Once database is connected, tackle JSX runtime error in frontend build.
