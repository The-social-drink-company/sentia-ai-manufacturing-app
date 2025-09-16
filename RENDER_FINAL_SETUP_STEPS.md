# Render Final Setup Steps - Complete Your Deployment

## ✅ Completed
- Deleted duplicate `sentia-manufacturing-dashboard` service
- Server is running at https://sentia-manufacturing-development.onrender.com/
- Emergency server confirmed working

## 🔧 Next Steps to Complete Full Setup

### Step 1: Connect Database to Development Service

1. **Get Database Connection String**:
   - Go to https://dashboard.render.com
   - Click on `sentia-db-development`
   - Click **"Connect"** button
   - Copy the **"Internal Database URL"** (for same-region connections)
   - It will look like: `postgresql://user:password@dpg-xxxxx:5432/database_name`

2. **Add Database URL to Service**:
   - Go back to services list
   - Click on `sentia-manufacturing-development`
   - Go to **"Environment"** tab
   - Find or add `DATABASE_URL`
   - Paste the Internal Database URL
   - Click **"Save Changes"**

### Step 2: Run Environment Variables Setup Script

**Option A - Windows PowerShell:**
```powershell
# Run this in your project directory
.\render-env-setup.ps1
```

**Option B - Manual Setup:**
Go to your service environment tab and add these critical variables:

```bash
# Required for Application to Work
NODE_ENV=development
PORT=10000
DATABASE_URL=[paste from Step 1]
CORS_ORIGINS=https://sentia-manufacturing-development.onrender.com

# Authentication (Required)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_Y2hhbXBpb24tYnVsbGRvZy05Mi5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_EP6iF7prGbq73CscUPCOW8PAKol4pPaBG5iYdsDodq

# Session (Required)
SESSION_SECRET=sentia-session-secret-dev-2025
JWT_SECRET=sentia-jwt-secret-dev-2025

# Application URLs (Required)
VITE_API_BASE_URL=https://sentia-manufacturing-development.onrender.com/api
VITE_APP_TITLE=Sentia Manufacturing Dashboard
```

### Step 3: Trigger New Deployment

After adding environment variables:
1. Go to your service dashboard
2. Click **"Manual Deploy"**
3. Select **"Clear build cache & deploy"**
4. Monitor the deployment logs

### Step 4: Verify Full Application

Once deployed, test these endpoints:

1. **Main Application**: https://sentia-manufacturing-development.onrender.com
2. **Health Check**: https://sentia-manufacturing-development.onrender.com/health
3. **API Status**: https://sentia-manufacturing-development.onrender.com/api/health

Expected results:
- Main app shows login page (Clerk authentication)
- Health check returns JSON with status "healthy"
- API returns service information

### Step 5: Set Up Other Environments (Testing & Production)

Repeat the same process for:

#### Testing Environment:
- Service: `sentia-manufacturing-testing`
- Database: `sentia-db-testing`
- URL: https://sentia-manufacturing-testing.onrender.com
- Set `NODE_ENV=test`

#### Production Environment:
- Service: `sentia-manufacturing-production`
- Database: `sentia-db-production`
- URL: https://sentia-manufacturing-production.onrender.com
- Set `NODE_ENV=production`
- Set feature flags to `false`:
  ```
  ENABLE_AUTONOMOUS_TESTING=false
  AUTO_FIX_ENABLED=false
  AUTO_DEPLOY_ENABLED=false
  ```

## 🚀 Quick Checklist

### Development Environment
- [ ] Database URL configured
- [ ] Environment variables added
- [ ] Manual deployment triggered
- [ ] Health check returns healthy
- [ ] Login page accessible
- [ ] API endpoints working

### Testing Environment
- [ ] Service configured
- [ ] Database connected
- [ ] Environment variables set
- [ ] Deployment successful

### Production Environment
- [ ] Service configured
- [ ] Database connected
- [ ] Environment variables set
- [ ] Feature flags disabled
- [ ] Deployment successful

## 🔍 Troubleshooting

### "Database connection failed"
- Verify DATABASE_URL is using Internal URL (not External)
- Check database service is running
- Ensure SSL mode: `?sslmode=require`

### "Build failed"
- Check build logs for missing dependencies
- Ensure build command: `npm ci --legacy-peer-deps && npm run build`
- Try "Clear build cache & deploy"

### "Application not loading"
- Check environment variables are set
- Verify VITE variables are present
- Check browser console for errors

### "Port issues"
- Render provides PORT automatically
- Don't hardcode port numbers
- Use: `process.env.PORT || 3000`

## 📝 Important Notes

1. **Database URLs**: Always use Internal URLs for same-region connections
2. **Environment Variables**: Render requires manual "Deploy" after changing env vars
3. **Build Cache**: Clear cache if dependencies change
4. **Logs**: Monitor service logs during deployment for errors

## ✨ Success Indicators

When everything is working:
- ✅ Service shows "Live" status
- ✅ No errors in deployment logs
- ✅ Health check returns 200 OK
- ✅ Can log in with Clerk authentication
- ✅ Dashboard loads with data
- ✅ API endpoints respond with JSON

## 🎯 Final Architecture

```
Your Render Services:
├── Web Services
│   ├── sentia-manufacturing-development ✅
│   ├── sentia-manufacturing-testing
│   └── sentia-manufacturing-production
└── Databases
    ├── sentia-db-development ✅
    ├── sentia-db-testing ✅
    └── sentia-db-production ✅
```

---

**Support**: If you encounter issues, check:
- Service Logs: Dashboard → Service → Logs
- Build Logs: Dashboard → Service → Events
- Health Status: https://[service-name].onrender.com/health