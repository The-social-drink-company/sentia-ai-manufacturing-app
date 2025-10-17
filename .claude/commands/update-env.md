# Update Environment Variables

Manage and update environment variables across all deployment environments.

## Overview

Environment variables control application configuration across development, test, and production environments on Render.

## Important Security Notes

⚠️ **NEVER commit actual environment variable values to git**
- Only update .env.template with variable names
- Actual values must be set in Render Dashboard
- Never include secrets in code or commits

## Process

### 1. Identify Variables to Update

Ask user to specify:
- **Variable Name**: What environment variable?
- **Purpose**: What does it configure?
- **Environments**: Dev / Test / Prod / All?
- **Value**: What is the new value? (Don't display sensitive values)
- **Type**: String / Number / Boolean / Secret

### 2. Update .env.template

Add or update the template (NO actual values):

```bash
# Open template
code .env.template

# Add variable with description
# [Category] - [Purpose]
VARIABLE_NAME=example_value_placeholder
```

Example:
```env
# External APIs
VITE_XERO_CLIENT_ID=your_xero_client_id_here
VITE_XERO_CLIENT_SECRET=your_xero_client_secret_here
VITE_SHOPIFY_UK_ACCESS_TOKEN=your_shopify_token_here

# Application Configuration
VITE_APP_TITLE=Sentia Manufacturing Dashboard
VITE_API_BASE_URL=http://localhost:5000/api

# Feature Flags
VITE_ENABLE_AI_ANALYTICS=true
VITE_ENABLE_XERO_INTEGRATION=true
```

### 3. Update Render Environment Variables

Provide instructions for each environment:

```
📝 RENDER ENVIRONMENT VARIABLE UPDATE

For each environment, follow these steps:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔹 DEVELOPMENT ENVIRONMENT

1. Go to: https://dashboard.render.com
2. Navigate to: sentia-manufacturing-dashboard-621h
3. Click: "Environment" tab
4. Find variable: [VARIABLE_NAME]
5. Update value to: [REDACTED]
6. Click: "Save Changes"
7. Service will automatically redeploy

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔹 TEST ENVIRONMENT

[Same steps for test environment]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔹 PRODUCTION ENVIRONMENT

[Same steps for production environment]
```

### 4. Common Environment Variables

#### Frontend (VITE_ prefix)

```env
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# API Configuration
VITE_API_BASE_URL=https://your-api.onrender.com/api
VITE_MCP_SERVER_URL=https://your-mcp.onrender.com

# External Services
VITE_XERO_CLIENT_ID=your_client_id
VITE_SHOPIFY_UK_SHOP_URL=https://yourstore.myshopify.com
VITE_SHOPIFY_UK_ACCESS_TOKEN=shpat_...

# Feature Flags
VITE_DEVELOPMENT_MODE=false
VITE_AI_ANALYTICS_ENABLED=true

# Application Config
VITE_APP_TITLE=Sentia Manufacturing Dashboard
VITE_APP_VERSION=2.0.0
```

#### Backend (Node.js)

```env
# Environment
NODE_ENV=production
PORT=10000  # Render auto-sets this

# Database
DATABASE_URL=postgresql://...  # Render auto-injects this

# Authentication
CLERK_SECRET_KEY=sk_...

# External APIs
XERO_CLIENT_ID=...
XERO_CLIENT_SECRET=...
SHOPIFY_API_KEY=...
SHOPIFY_API_SECRET=...

# Redis (if used)
REDIS_URL=redis://...

# Logging
LOG_LEVEL=info
```

### 5. Verification

After updating, verify:

```bash
# For each environment, check:

# 1. Variable is set correctly
curl https://[environment-url]/health

# 2. Application redeployed successfully
# Check Render logs

# 3. Feature using variable works
# Test the functionality
```

## Environment-Specific Values

### Development
- Use test/sandbox API credentials
- Enable debug logging
- Enable development mode features
- Use development database

### Test
- Use test API credentials
- Standard logging
- Mirror production config where possible
- Use test database

### Production
- Use production API credentials
- Minimal logging (info/error only)
- All features production-ready
- Use production database

## Troubleshooting

### Variable Not Taking Effect

1. **Check Render Redeploy**
   - Render should auto-redeploy after env var change
   - If not, manually trigger redeploy

2. **Check Variable Name**
   - Frontend vars MUST start with `VITE_`
   - Backend vars have no prefix requirement
   - Names are case-sensitive

3. **Check Build Process**
   - Frontend: Vite injects vars at build time
   - Backend: Vars loaded at runtime
   - Clear build cache if needed

4. **Check Application Code**
   - Frontend: Use `import.meta.env.VITE_VARIABLE_NAME`
   - Backend: Use `process.env.VARIABLE_NAME`

### Common Issues

**Issue**: Variable undefined in frontend
```javascript
// ❌ Wrong
console.log(process.env.VITE_API_URL)

// ✅ Correct
console.log(import.meta.env.VITE_API_URL)
```

**Issue**: Variable not updating
- Solution: Force redeploy in Render
- Solution: Clear browser cache
- Solution: Verify env var saved in Render

## Documentation Update

After changing variables:

1. Update .env.template (no secrets!)
2. Update README.md if new variables added
3. Update ENVIRONMENT_VARIABLES.md documentation
4. Notify team of changes

## Output Template

```
✅ ENVIRONMENT VARIABLES UPDATED

📝 Variables Updated:
1. VITE_API_BASE_URL
   - Development: Updated ✅
   - Test: Updated ✅
   - Production: Updated ✅

2. VITE_XERO_CLIENT_ID
   - Development: Updated ✅
   - Test: Updated ✅
   - Production: Updated ✅

📁 Files Modified:
- .env.template (updated with placeholders)

🔄 Deployment Status:
- Development: Redeploying... (2-3 minutes)
- Test: Redeploying... (2-3 minutes)
- Production: Redeploying... (2-3 minutes)

⏱️  Wait 5 minutes for all deployments to complete

✅ Verification Steps:
1. Check Render dashboard for successful deploys
2. Test affected features in each environment
3. Verify no errors in application logs

📖 Documentation:
- .env.template updated ✅
- README.md updated (if needed) ✅
- Team notified ✅
```

Execute environment variable updates safely across all environments.
