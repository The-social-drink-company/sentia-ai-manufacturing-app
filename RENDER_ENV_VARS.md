# Render Environment Variables Configuration

## CRITICAL: Production Clerk Authentication (NO MOCK MODE)

These environment variables MUST be set in Render Dashboard for the development branch:

### Required Clerk Production Keys

```env
# Clerk Authentication - PRODUCTION ONLY
VITE_CLERK_PUBLISHABLE_KEY=pk_live_REDACTED
CLERK_SECRET_KEY=sk_live_REDACTED
CLERK_WEBHOOK_SECRET=whsec_REDACTED
VITE_CLERK_DOMAIN=clerk.financeflo.ai
CLERK_ENVIRONMENT=production

# CRITICAL: Ensure NO MOCK MODE
VITE_FORCE_MOCK_AUTH=false
```

### Application Settings

```env
NODE_ENV=development
VITE_API_BASE_URL=https://sentia-manufacturing-development.onrender.com/api
VITE_APP_TITLE=CapLiquify Manufacturing Platform
VITE_APP_VERSION=2.0.0
```

### Database (Auto-configured by Render)

```env
DATABASE_URL=[Automatically provided by Render PostgreSQL]
```

### CORS Configuration

```env
CORS_ORIGINS=https://sentia-manufacturing-development.onrender.com,http://localhost:3000
```

## To Update Render Environment Variables:

1. Go to https://dashboard.render.com
2. Select `sentia-manufacturing-development` service
3. Click "Environment" tab
4. Add/Update each variable above
5. Click "Save Changes" (triggers auto-redeploy)

## Deployment URLs:

- **Development**: https://sentia-manufacturing-development.onrender.com
- **Testing**: https://sentia-manufacturing-testing.onrender.com
- **Production**: https://sentia-manufacturing-production.onrender.com

## Auto-Deployment:

- Pushing to `development` branch → Auto-deploys to development environment
- Pushing to `test` branch → Auto-deploys to testing environment
- Pushing to `production` branch → Auto-deploys to production environment

## Verification:

After deployment, verify at: https://sentia-manufacturing-development.onrender.com

1. Landing page should show "Sign In" and "Get Started" buttons
2. Clicking buttons should redirect to Clerk (clerk.financeflo.ai)
3. After authentication, should redirect to /dashboard
4. NO MOCK AUTH - Real users only

