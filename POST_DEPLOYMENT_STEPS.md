# Post-Deployment Steps for Render

## Immediate Actions (After Deployment)

### 1. Verify Deployments Are Live
Run the verification script:
```powershell
.\verify-render-deployment.ps1
```

Expected results:
- All environments should show "OK" for main site and API
- If showing "FAIL", wait 5-10 more minutes for deployment to complete

### 2. Update Local Development Environment
```bash
# Backup current .env
cp .env .env.railway.backup

# Use Render backend
cp .env.render .env

# Test local development
npm run dev
```

Visit http://localhost:3000 - should connect to Render backend

### 3. Test Critical Features

#### Login Flow
1. Go to https://sentia-manufacturing-development.onrender.com
2. Click "Sign In"
3. Login with your Clerk credentials
4. Verify dashboard loads

#### Data Connections
1. Check Working Capital page loads
2. Verify What-If Analysis sliders work
3. Test data export functionality
4. Confirm navigation menu works

## Day 1-3: Stabilization

### Monitor Logs
1. Go to Render Dashboard
2. Click each service
3. Check "Logs" tab for errors
4. Common issues to watch for:
   - Database connection timeouts
   - Missing environment variables
   - CORS errors
   - Memory limit warnings

### Performance Tuning
If slow performance:
1. Upgrade to Standard plan ($25/month) for 1GB RAM
2. Enable auto-scaling (Team plan required)
3. Add caching with Redis (optional)

### Fix Common Issues

#### 502 Bad Gateway
- Service still starting (wait 2-3 minutes)
- Check environment variables are set
- Verify build succeeded in logs

#### CORS Errors
Update CORS_ORIGINS in environment variables to include your domain

#### Database Connection Failed
- Check DATABASE_URL is correct
- Verify SSL mode is set to "require"
- Test connection with psql command

## Week 1: Integration Updates

### Update External Services

#### Clerk (Authentication)
1. Go to https://dashboard.clerk.com
2. Add Render URLs to:
   - Allowed origins
   - Redirect URLs
3. Test login/logout on each environment

#### Xero Integration
1. Go to https://developer.xero.com
2. Update OAuth redirect URLs:
   ```
   https://sentia-manufacturing-development.onrender.com/api/xero/callback
   https://sentia-manufacturing-testing.onrender.com/api/xero/callback
   https://sentia-manufacturing-production.onrender.com/api/xero/callback
   ```

#### Shopify Webhooks
Update webhook URLs if configured:
```javascript
// Old Railway URL
https://sentia-manufacturing-development.up.railway.app/api/webhooks/shopify

// New Render URL
https://sentia-manufacturing-development.onrender.com/api/webhooks/shopify
```

### Update Git Repository

1. Update README.md with new URLs:
```markdown
## Deployment URLs
- Development: https://sentia-manufacturing-development.onrender.com
- Testing: https://sentia-manufacturing-testing.onrender.com
- Production: https://sentia-manufacturing-production.onrender.com
```

2. Update any hardcoded URLs in code:
```bash
# Search for Railway URLs
grep -r "railway.app" src/
grep -r "railway.app" *.json
```

3. Commit changes:
```bash
git add .
git commit -m "chore: Update deployment URLs from Railway to Render"
git push origin development
```

## Week 2: Production Preparation

### Load Testing (Optional)
```bash
# Install k6 for load testing
choco install k6

# Run basic load test
k6 run -u 10 -d 30s https://sentia-manufacturing-testing.onrender.com
```

### Security Checklist
- [ ] SSL certificates active (automatic on Render)
- [ ] Environment variables not exposed in logs
- [ ] API rate limiting configured
- [ ] CORS properly configured
- [ ] Authentication required on all protected routes

### Backup Strategy
1. Enable automatic database backups in Render
2. Set up daily database exports:
```bash
# Add to cron/scheduled task
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

## Month 1: Optimization

### Cost Optimization
Monitor usage and optimize:
1. Check bandwidth usage
2. Review CPU/memory metrics
3. Consider combining test/dev on free tier
4. Use single database with schemas

### Performance Optimization
1. Enable Render's CDN for static assets
2. Implement Redis caching (optional)
3. Optimize build process:
   - Use .dockerignore
   - Cache node_modules
   - Minimize bundle size

### Documentation Updates
1. Create runbook for common issues
2. Document deployment process
3. Update onboarding guide for new developers

## Ongoing Maintenance

### Weekly Tasks
- [ ] Check error logs
- [ ] Review performance metrics
- [ ] Test critical user flows
- [ ] Backup database

### Monthly Tasks
- [ ] Review costs
- [ ] Update dependencies
- [ ] Security patches
- [ ] Performance review

### Quarterly Tasks
- [ ] Disaster recovery test
- [ ] Load testing
- [ ] Security audit
- [ ] Cost optimization review

## Emergency Contacts

### Critical Issues
1. Check Render Status: https://status.render.com
2. Render Support: https://render.com/support
3. Community Help: https://community.render.com

### Rollback Procedure
If critical issues:
1. Railway is still running (if not decommissioned)
2. Update DNS/URLs back to Railway
3. Fix issues in development
4. Re-deploy to Render

## Success Metrics

### Week 1 Goals
- ✅ All environments deployed
- ✅ No critical errors in logs
- ✅ Authentication working
- ✅ API endpoints responding

### Month 1 Goals
- All integrations migrated
- Performance acceptable (<3s page load)
- Zero unplanned downtime
- Cost within budget ($14-25/month)

### Quarter 1 Goals
- Railway fully decommissioned
- Automated monitoring in place
- Disaster recovery tested
- Team trained on Render

---

**Remember**: Migration is a process, not an event. Take time to ensure stability before decommissioning Railway.