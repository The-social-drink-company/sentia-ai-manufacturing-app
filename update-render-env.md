# Update Render Environment Variables - Development

## CRITICAL: Add these variables to Render Dashboard immediately

### Navigate to: https://dashboard.render.com
### Service: sentia-manufacturing-development
### Go to: Environment tab

## Required Environment Variables to Add/Update:

```bash
# CLERK AUTHENTICATION - CRITICAL FOR FIXING REACT ERROR
VITE_CLERK_PUBLISHABLE_KEY=pk_live_Y2xlcmsuZmluYW5jZWZsby5haSQ
CLERK_SECRET_KEY=sk_live_mzgSFm1q9VrzngMMaCTNNwPEqBmr75vVxiND1DO7wq
CLERK_PUBLISHABLE_KEY=pk_live_Y2xlcmsuZmluYW5jZWZsby5haSQ
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_Y2xlcmsuZmluYW5jZWZsby5haSQ
CLERK_WEBHOOK_SECRET=whsec_iTUcbgzS5P6zJlXWQkc4zGHnw8yLGt9j

# API CONFIGURATION
VITE_API_BASE_URL=https://sentia-manufacturing-development.onrender.com/api
API_BASE_URL=https://sentia-manufacturing-development.onrender.com/api

# MCP SERVER
VITE_MCP_SERVER_URL=https://mcp-server-tkyu.onrender.com
MCP_SERVER_URL=https://mcp-server-tkyu.onrender.com

# DATABASE (if not already set)
DATABASE_URL=postgresql://sentia_dev:nZ4vtXienMAwxahr0GJByc2qXFIFSoYL@dpg-d344rkfdiees73a20c50-a/sentia_manufacturing_dev

# CORE SETTINGS
NODE_ENV=development
PORT=3000
```

## Steps to Update:

1. Open https://dashboard.render.com
2. Click on "sentia-manufacturing-development" service
3. Navigate to "Environment" tab
4. Click "Add Environment Variable" for each missing variable
5. Copy and paste the variable name and value
6. Click "Save Changes"
7. Service will automatically redeploy

## Verification After Deployment:

1. Check health endpoint: https://sentia-manufacturing-development.onrender.com/health
2. Visit main site: https://sentia-manufacturing-development.onrender.com
3. Verify no React context errors in browser console
4. Confirm authentication is working

## Expected Result:

- Loading screen should disappear
- React application should load successfully
- Authentication should work with Clerk
- No JavaScript errors in console

## If Issues Persist:

1. Clear browser cache
2. Check Render logs for any build errors
3. Verify all environment variables are saved
4. Trigger manual deploy if needed

---

Date: 2025-09-20
Purpose: Fix development environment React context error
Status: Ready for implementation