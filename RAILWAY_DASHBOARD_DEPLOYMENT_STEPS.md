# Exact Steps: Railway Dashboard Deployment Guide
## Sentia Manufacturing Dashboard

**Project ID**: `b9ca1af1-13c5-4ced-9ab6-68fddd73fc8f`  
**Repository**: `The-social-drink-company/sentia-manufacturing-dashboard`  
**Branch**: `development`  

---

## Step 1: Access Railway Dashboard

1. **Open your web browser** and navigate to:
   ```
   https://railway.app/dashboard
   ```

2. **Sign in to Railway** using your existing account credentials

3. **Verify you're logged in** - you should see your Railway dashboard with existing projects

---

## Step 2: Navigate to Your Existing Project

1. **Locate your project** in the dashboard
   - Look for the project with ID: `b9ca1af1-13c5-4ced-9ab6-68fddd73fc8f`
   - The project name might be displayed as "feisty-delight" or similar

2. **Click on the project** to enter the project dashboard

3. **Verify you're in the correct project** by checking:
   - Project ID matches: `b9ca1af1-13c5-4ced-9ab6-68fddd73fc8f`
   - Environment shows "development"

---

## Step 3: Add New Service to Project

1. **Look for the "Add Service" button** or "+" icon in your project dashboard
   - This is usually prominently displayed in the center or top of the project view

2. **Click "Add Service"** or the "+" button

3. **Select deployment source** from the options presented:
   - Choose **"Deploy from GitHub repo"**
   - Do NOT choose "Empty Service" or "Database"

---

## Step 4: Connect GitHub Repository

1. **Repository Selection Screen** will appear

2. **Search for your repository**:
   - Type: `sentia-manufacturing-dashboard`
   - Or look for: `The-social-drink-company/sentia-manufacturing-dashboard`

3. **Select the repository** by clicking on:
   ```
   The-social-drink-company/sentia-manufacturing-dashboard
   ```

4. **If repository is not visible**:
   - Click "Configure GitHub App" or "Install GitHub App"
   - Grant Railway access to the organization: `The-social-drink-company`
   - Return to repository selection

---

## Step 5: Configure Branch and Settings

1. **Branch Selection**:
   - Ensure **"development"** branch is selected
   - If not visible, type "development" in the branch field

2. **Service Name** (if prompted):
   - Enter: `sentia-manufacturing-dashboard`
   - Or accept the auto-generated name

3. **Root Directory** (if prompted):
   - Leave as **"/"** (root directory)
   - Do not change this unless specifically needed

---

## Step 6: Verify Build Configuration

Railway will automatically detect the configuration. Verify these settings:

1. **Build Command** should show:
   ```
   npm ci && npm run build
   ```

2. **Start Command** should show:
   ```
   node railway-ultimate.js
   ```

3. **If these are not detected**:
   - Railway should read from `railway.toml` file
   - The configuration is already in the repository

---

## Step 7: Deploy the Service

1. **Click "Deploy"** button to start the deployment

2. **Monitor the deployment process**:
   - You'll see a build log window
   - Watch for any errors or warnings
   - The process typically takes 3-5 minutes

3. **Build stages you'll see**:
   ```
   ✓ Cloning repository
   ✓ Installing dependencies (npm ci)
   ✓ Building application (npm run build)
   ✓ Starting service (node railway-ultimate.js)
   ```

---

## Step 8: Verify Environment Variables

1. **While deployment is running**, click on the **"Variables"** tab

2. **Verify these critical variables are set**:
   ```
   NODE_ENV=production
   PORT=$PORT
   DATABASE_URL=[your-neon-database-url]
   OPENAI_API_KEY=[your-openai-key]
   ANTHROPIC_API_KEY=[your-claude-key]
   JWT_SECRET=[your-jwt-secret]
   ```

3. **If variables are missing**:
   - Click "New Variable"
   - Add the missing environment variables
   - Redeploy the service

---

## Step 9: Monitor Deployment Completion

1. **Watch the deployment logs** until you see:
   ```
   ✅ Build completed successfully
   ✅ Service started
   ✅ Health check passed
   ```

2. **Check for the service URL**:
   - Railway will provide a URL like: `https://[service-name].railway.app`
   - This appears in the service overview

3. **Verify deployment status**:
   - Status should show "Running" or "Healthy"
   - No error indicators should be present

---

## Step 10: Test the Deployed Application

1. **Access the health check endpoint**:
   ```
   https://[your-service-url].railway.app/api/health
   ```
   
   **Expected response**:
   ```json
   {
     "status": "healthy",
     "timestamp": "2025-09-15T...",
     "version": "1.0.5",
     "environment": "production"
   }
   ```

2. **Access the main application**:
   ```
   https://[your-service-url].railway.app/
   ```

3. **Test key endpoints**:
   - `/api/test` - Basic API test
   - `/api/auth/status` - Authentication status
   - Main dashboard should load

---

## Step 11: Configure Custom Domain (Optional)

1. **In the service dashboard**, click on **"Settings"** tab

2. **Find "Domains" section**

3. **Click "Add Domain"**

4. **Enter your custom domain**:
   ```
   sentiadeploy.financeflo.ai
   ```

5. **Configure DNS** as instructed by Railway:
   - Add CNAME record pointing to Railway's provided URL
   - Wait for SSL certificate provisioning (5-15 minutes)

---

## Step 12: Verify All Features

### Test AI Services
1. **Navigate to forecasting section** in the dashboard
2. **Verify AI responses** are working
3. **Check forecast generation** functionality

### Test Integrations
1. **Unleashed Software**: Check inventory data sync
2. **Shopify**: Verify store connections (UK, USA, EU)
3. **Amazon SP-API**: Test marketplace data
4. **Xero**: Check accounting integration

### Test Security
1. **Login functionality** should work
2. **JWT tokens** should be generated
3. **HTTPS** should be enforced

---

## Troubleshooting Common Issues

### Issue: Build Fails
**Solution**:
1. Check build logs for specific errors
2. Verify Node.js version compatibility
3. Clear build cache in Railway settings
4. Redeploy the service

### Issue: Service Won't Start
**Solution**:
1. Check start command: `node railway-ultimate.js`
2. Verify environment variables are set
3. Check application logs for startup errors
4. Ensure PORT variable is set to `$PORT`

### Issue: Health Check Fails
**Solution**:
1. Verify `/api/health` endpoint exists
2. Check if service is listening on correct port
3. Increase health check timeout in settings
4. Review application startup logs

### Issue: Environment Variables Missing
**Solution**:
1. Go to Variables tab in Railway
2. Add missing variables one by one
3. Redeploy after adding variables
4. Verify variable names match exactly

---

## Expected Deployment Timeline

- **Repository connection**: 30 seconds
- **Build process**: 3-5 minutes
- **Service startup**: 1-2 minutes
- **Health check verification**: 30 seconds
- **Total deployment time**: 5-8 minutes

---

## Success Indicators

✅ **Build completed without errors**  
✅ **Service status shows "Running"**  
✅ **Health check endpoint responds**  
✅ **Main application loads**  
✅ **AI services are functional**  
✅ **Database connection established**  
✅ **All integrations working**  

---

## Post-Deployment Actions

1. **Save the service URL** for future reference
2. **Test all major features** thoroughly
3. **Set up monitoring alerts** if needed
4. **Document the deployment** for team reference
5. **Plan for ongoing maintenance** and updates

---

## Quick Reference

**Project ID**: `b9ca1af1-13c5-4ced-9ab6-68fddd73fc8f`  
**Repository**: `The-social-drink-company/sentia-manufacturing-dashboard`  
**Branch**: `development`  
**Start Command**: `node railway-ultimate.js`  
**Health Check**: `/api/health`  
**Build Command**: `npm ci && npm run build`  

**Service URL Format**: `https://[service-name].railway.app`  
**Custom Domain**: `sentiadeploy.financeflo.ai` (if configured)

---

This completes the exact step-by-step deployment process for the Sentia Manufacturing Dashboard on Railway using the web dashboard.

