# RENDER PRODUCTION ENVIRONMENT VARIABLES UPDATE INSTRUCTIONS

## URGENT: Environment Variables Need to be Added to Production

The production deployment is failing because critical environment variables are missing, particularly the Clerk authentication keys.

## Method 1: Manual Update via Render Dashboard (Recommended)

1. **Login to Render Dashboard**
   - Go to: https://dashboard.render.com
   - Sign in with your credentials

2. **Navigate to Production Service**
   - Find service: `sentia-manufacturing-production`
   - Or go directly to: https://dashboard.render.com/web/srv-ctg8hkpu0jms73ab8m00

3. **Access Environment Tab**
   - Click on the "Environment" tab in the service dashboard

4. **Add Missing Environment Variables**
   - Copy the variables from `render-production-env-vars.txt`
   - Add each variable one by one, or use bulk edit mode
   - **CRITICAL VARIABLES TO ADD FIRST:**
     ```
     VITE_CLERK_PUBLISHABLE_KEY=pk_live_REDACTED
     CLERK_SECRET_KEY=sk_live_REDACTED
     PORT=5000
     NODE_ENV=production
     ```

5. **Save and Deploy**
   - Click "Save Changes"
   - The service will automatically redeploy with new environment variables

## Method 2: PowerShell Script (Automated)

1. **Get your Render API Key**
   - Go to: https://dashboard.render.com/u/settings
   - Create or copy an API key

2. **Run the PowerShell Script**

   ```powershell
   cd "C:\Projects\CapLiquify Manufacturing Platform\sentia-manufacturing-dashboard"
   .\update-render-env-vars.ps1
   ```

3. **Enter your API Key when prompted**
   - The script will automatically update all environment variables
   - It will trigger a new deployment

## Method 3: Using Render CLI (Once Installed)

1. **Download Render CLI**
   - Visit: https://github.com/render-oss/cli/releases
   - Download `render-windows-amd64.exe`
   - Rename to `render.exe` and add to PATH

2. **Login to Render**

   ```bash
   render login
   ```

3. **Update Environment Variables**
   ```bash
   render env:set VITE_CLERK_PUBLISHABLE_KEY=pk_live_REDACTED --service srv-ctg8hkpu0jms73ab8m00
   render env:set CLERK_SECRET_KEY=sk_live_REDACTED --service srv-ctg8hkpu0jms73ab8m00
   # Continue for all variables...
   ```

## Critical Environment Variables Status

### ❌ MISSING (Must Add Immediately)

- VITE_CLERK_PUBLISHABLE_KEY
- CLERK_SECRET_KEY
- CLERK_PUBLISHABLE_KEY
- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
- VITE_CLERK_DOMAIN
- VITE_CLERK_SIGN_IN_URL
- VITE_CLERK_SIGN_UP_URL
- VITE_CLERK_AFTER_SIGN_IN_URL
- VITE_CLERK_AFTER_SIGN_UP_URL

### ✅ Already Set (Verify Values)

- DATABASE_URL (automatically set by Render PostgreSQL)
- PORT (may be auto-set to 10000, should be 5000)
- Some feature flags

## Verification Steps

After updating environment variables:

1. **Check Deployment Logs**
   - Watch for successful startup messages
   - Ensure no authentication errors

2. **Test Production Site**
   - Visit: https://sentia-manufacturing-production.onrender.com
   - Verify authentication works
   - Check that dashboard loads properly

3. **Monitor Health Endpoint**
   - Test: https://sentia-manufacturing-production.onrender.com/health
   - Should return JSON: `{"status":"ok","timestamp":"..."}`

## Important Notes

- The production deployment is using `minimal-server.js` for fast startup
- Environment variables are critical for Clerk authentication to work
- Database URL is automatically managed by Render
- After adding variables, the service will auto-redeploy

## Support

If you encounter issues:

1. Check deployment logs in Render Dashboard
2. Verify all critical environment variables are set
3. Ensure the latest code from production branch is deployed
4. Check that the build command and start command are correct

