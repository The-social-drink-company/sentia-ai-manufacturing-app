# ✅ RENDER DEPLOYMENT CHECKLIST

## FILES CREATED FOR YOU:

- ✅ `render.yaml` - Infrastructure configuration (all services & databases)
- ✅ `render-env-complete.json` - All environment variables organized
- ✅ `render-env-development.txt` - Ready to paste for Development
- ✅ `render-env-testing.txt` - Ready to paste for Testing
- ✅ `render-env-production.txt` - Ready to paste for Production
- ✅ `render-env-mcp.txt` - Ready to paste for MCP Server

## YOUR ACTION ITEMS:

### 📋 Step 1: Deploy Blueprint (2 minutes)

- [ ] Go to https://dashboard.render.com
- [ ] Click "New +" → "Blueprint"
- [ ] Select repository: `The-social-drink-company/sentia-manufacturing-dashboard`
- [ ] Click "Apply" to create all services

### 📋 Step 2: Add Environment Variables (5 minutes per service)

#### Development Service:

- [ ] Click `sentia-manufacturing-development` service
- [ ] Go to "Environment" tab
- [ ] Click "Bulk Edit"
- [ ] Copy ALL contents from `render-env-development.txt`
- [ ] Paste and click "Save Changes"

#### Testing Service:

- [ ] Click `sentia-manufacturing-testing` service
- [ ] Go to "Environment" tab
- [ ] Click "Bulk Edit"
- [ ] Copy ALL contents from `render-env-testing.txt`
- [ ] Paste and click "Save Changes"

#### Production Service:

- [ ] Click `sentia-manufacturing-production` service
- [ ] Go to "Environment" tab
- [ ] Click "Bulk Edit"
- [ ] Copy ALL contents from `render-env-production.txt`
- [ ] Paste and click "Save Changes"

#### MCP Server:

- [ ] Click `sentia-mcp-server` service
- [ ] Go to "Environment" tab
- [ ] Click "Bulk Edit"
- [ ] Copy ALL contents from `render-env-mcp.txt`
- [ ] Paste and click "Save Changes"

### 📋 Step 3: Wait for Deployment (10-15 minutes)

- [ ] Services will auto-redeploy after adding variables
- [ ] Check "Logs" tab for any errors
- [ ] Wait for status to show "Live"

### 📋 Step 4: Test Your Deployments

- [ ] Test Development: https://sentia-manufacturing-development.onrender.com
- [ ] Test API Health: https://sentia-manufacturing-development.onrender.com/api/health
- [ ] Test Testing Environment: https://sentia-manufacturing-testing.onrender.com
- [ ] Test Production: https://sentia-manufacturing-production.onrender.com

### 📋 Step 5: Update Local Development

- [ ] Update your `.env` file with new Render URLs
- [ ] Test local development against Render backend

## 🎯 QUICK COPY REFERENCE

### Your New URLs:

```
Development: https://sentia-manufacturing-development.onrender.com
Testing: https://sentia-manufacturing-testing.onrender.com
Production: https://sentia-manufacturing-production.onrender.com
MCP Server: https://sentia-mcp-server.onrender.com
```

### API Endpoints:

```
Dev API: https://sentia-manufacturing-development.onrender.com/api
Test API: https://sentia-manufacturing-testing.onrender.com/api
Prod API: https://sentia-manufacturing-production.onrender.com/api
MCP API: https://sentia-mcp-server.onrender.com/mcp
```

## 💰 COST SUMMARY

- Development: $7/month (Starter plan)
- Testing: Free
- Production: $7/month (Starter plan)
- MCP Server: Free
- **Total: $14/month** (first 90 days)
- After 90 days: +$21 for databases if kept separate

## ⚠️ IMPORTANT NOTES:

1. **Environment Variables**: Must be added BEFORE services will work
2. **First Deploy**: Takes 10-15 minutes to build and start
3. **Database**: Using existing Neon database (no migration needed)
4. **Auto-Deploy**: Enabled for dev/test, manual for production

## 🆘 IF SOMETHING GOES WRONG:

1. Check service Logs for specific errors
2. Verify all environment variables are set
3. Ensure DATABASE_URL is correct
4. Wait 2-3 minutes if showing "502 Bad Gateway"

---

**TIME ESTIMATE**: 30 minutes total

- 2 minutes: Create blueprint
- 20 minutes: Add environment variables
- 10 minutes: Wait for deployment
- 5 minutes: Testing

**READY TO START?** Open https://dashboard.render.com and follow the checklist!
