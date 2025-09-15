# Railway Deployment Checklist
## Sentia Manufacturing Dashboard

Use this checklist to ensure a successful deployment:

## Pre-Deployment Checklist

### Repository Preparation
- [ ] Code pushed to `development` branch
- [ ] Repository: `The-social-drink-company/sentia-manufacturing-dashboard`
- [ ] `railway.toml` configuration file present
- [ ] `package.json` start script points to `railway-ultimate.js`
- [ ] All dependencies listed in `package.json`

### Railway Project Setup
- [ ] Railway account accessible
- [ ] Project ID available: `b9ca1af1-13c5-4ced-9ab6-68fddd73fc8f`
- [ ] Environment variables documented
- [ ] Database connection string ready

## Deployment Steps Checklist

### Step 1: Access Railway
- [ ] Navigate to https://railway.app/dashboard
- [ ] Successfully logged into Railway account
- [ ] Can see existing projects in dashboard

### Step 2: Project Navigation
- [ ] Located project with ID: `b9ca1af1-13c5-4ced-9ab6-68fddd73fc8f`
- [ ] Clicked on the correct project
- [ ] Verified environment shows "development"

### Step 3: Add Service
- [ ] Clicked "Add Service" or "+" button
- [ ] Selected "Deploy from GitHub repo"
- [ ] Avoided selecting "Empty Service" or "Database"

### Step 4: Repository Connection
- [ ] Found repository: `The-social-drink-company/sentia-manufacturing-dashboard`
- [ ] Selected the correct repository
- [ ] GitHub permissions granted (if required)

### Step 5: Branch Configuration
- [ ] Selected "development" branch
- [ ] Service name set to: `sentia-manufacturing-dashboard`
- [ ] Root directory set to "/" (default)

### Step 6: Build Configuration
- [ ] Build command detected: `npm ci && npm run build`
- [ ] Start command detected: `node railway-ultimate.js`
- [ ] Railway.toml configuration recognized

### Step 7: Deployment Initiation
- [ ] Clicked "Deploy" button
- [ ] Build process started successfully
- [ ] Monitoring deployment logs

### Step 8: Environment Variables
- [ ] Accessed "Variables" tab
- [ ] Verified NODE_ENV=production
- [ ] Verified PORT=$PORT
- [ ] Verified DATABASE_URL is set
- [ ] Verified OPENAI_API_KEY is set
- [ ] Verified ANTHROPIC_API_KEY is set
- [ ] Verified JWT_SECRET is set
- [ ] All other required variables present

### Step 9: Deployment Monitoring
- [ ] Build completed successfully
- [ ] Service started without errors
- [ ] Health check passed
- [ ] Service status shows "Running"

### Step 10: Application Testing
- [ ] Health endpoint responds: `/api/health`
- [ ] Main application loads: `/`
- [ ] Test endpoint works: `/api/test`
- [ ] Authentication status accessible: `/api/auth/status`

## Post-Deployment Verification

### Basic Functionality
- [ ] Application loads without errors
- [ ] Navigation works correctly
- [ ] User interface is responsive
- [ ] No console errors in browser

### AI Services
- [ ] OpenAI integration working
- [ ] Claude integration working
- [ ] Forecasting functionality operational
- [ ] AI model orchestration active

### External Integrations
- [ ] Unleashed Software connection established
- [ ] Shopify UK store integration working
- [ ] Shopify USA store integration working
- [ ] Shopify EU store integration working
- [ ] Amazon SP-API functionality operational
- [ ] Xero accounting integration active
- [ ] Microsoft Email services working

### Database Operations
- [ ] Database connection established
- [ ] Data retrieval working
- [ ] Data persistence functional
- [ ] Query performance acceptable

### Security Features
- [ ] HTTPS enforced
- [ ] JWT authentication working
- [ ] Session management functional
- [ ] Security headers present
- [ ] CORS properly configured

### Performance Metrics
- [ ] Response times under 2 seconds
- [ ] Health checks consistently passing
- [ ] Resource usage within limits
- [ ] No memory leaks detected

## Optional Configuration

### Custom Domain Setup
- [ ] Domain added in Railway settings
- [ ] DNS CNAME record configured
- [ ] SSL certificate provisioned
- [ ] Custom domain accessible
- [ ] CORS updated for custom domain

### Monitoring Setup
- [ ] Application logs accessible
- [ ] Performance metrics visible
- [ ] Error tracking enabled
- [ ] Alert thresholds configured

## Troubleshooting Checklist

### If Build Fails
- [ ] Check build logs for specific errors
- [ ] Verify Node.js version compatibility
- [ ] Clear build cache and retry
- [ ] Check package.json dependencies

### If Service Won't Start
- [ ] Verify start command: `node railway-ultimate.js`
- [ ] Check environment variables
- [ ] Review application startup logs
- [ ] Ensure PORT variable is $PORT

### If Health Check Fails
- [ ] Verify `/api/health` endpoint exists
- [ ] Check service port configuration
- [ ] Increase health check timeout
- [ ] Review application logs

### If Features Don't Work
- [ ] Verify all environment variables
- [ ] Check API key validity
- [ ] Test database connectivity
- [ ] Review integration configurations

## Success Criteria

The deployment is successful when ALL of the following are true:

✅ **Build Process**
- Build completes without errors
- All dependencies installed correctly
- Application bundle created successfully

✅ **Service Status**
- Service shows "Running" status
- Health checks pass consistently
- No restart loops occurring

✅ **Application Functionality**
- Main dashboard loads correctly
- AI forecasting features work
- All integrations respond properly
- Authentication system functional

✅ **Performance Standards**
- Response times under 2 seconds
- Memory usage stable
- CPU usage reasonable
- No error spikes in logs

✅ **Security Compliance**
- HTTPS enforced
- Authentication working
- Security headers present
- CORS properly configured

## Final Verification Commands

Test these URLs after deployment:

```bash
# Health Check
curl https://[your-service-url].railway.app/api/health

# Basic API Test
curl https://[your-service-url].railway.app/api/test

# Authentication Status
curl https://[your-service-url].railway.app/api/auth/status

# Main Application
# Open in browser: https://[your-service-url].railway.app/
```

## Deployment Complete

- [ ] All checklist items completed
- [ ] Application fully functional
- [ ] Team notified of successful deployment
- [ ] Documentation updated with new URLs
- [ ] Monitoring and maintenance scheduled

---

**Deployment Date**: ___________  
**Service URL**: ___________  
**Deployed By**: ___________  
**Status**: ___________

