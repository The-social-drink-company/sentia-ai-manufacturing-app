# Deploy to Production Environment

Deploy tested changes to the live production environment.

## 🔴 PRODUCTION DEPLOYMENT - MAXIMUM CAUTION

**This command deploys to the LIVE PRODUCTION environment.**

According to CLAUDE.md deployment rules:
- Production deployments require explicit user instruction
- Must have passed UAT in test environment
- Requires stakeholder approval
- Follow enterprise quality gates

## Pre-Production Verification

### 1. Prerequisites Check
- [ ] Changes successfully deployed to test environment
- [ ] UAT completed and approved by stakeholders
- [ ] All critical issues resolved
- [ ] No known bugs in test environment
- [ ] Stakeholder sign-off obtained

### 2. User Confirmation Required

Ask the user to confirm EACH of these:
1. "Has UAT been completed successfully in the test environment?"
2. "Have stakeholders approved this production deployment?"
3. "Are you authorized to deploy to production?"
4. "Have you taken a backup of production data (if applicable)?"
5. "Type 'DEPLOY TO PRODUCTION' to confirm"

**DO NOT PROCEED** unless ALL confirmations are received.

## Deployment Process

Once all confirmations received:

1. **Create Release Tag**
   ```bash
   # Create semantic version tag
   git tag -a v[version] -m "Production release [version]"
   ```

2. **Merge Test to Production**
   ```bash
   git checkout production
   git pull origin production
   git merge test
   ```

3. **Push to Production**
   ```bash
   git push origin production
   git push origin v[version]
   ```

4. **Monitor Deployment**
   - Watch Render dashboard closely
   - Monitor application logs
   - Check for errors

## Deployment Monitoring

Watch for:
- Build completion (3-5 minutes)
- Application startup
- Health check response
- No error logs

## Rollback Plan

If deployment fails:
```bash
# Revert to previous commit
git revert HEAD
git push origin production
```

Or contact Render support to rollback to previous deployment.

## Post-Deployment Verification

### Critical Checks (Execute Immediately)
1. ✅ Application loads at production URL
2. ✅ Health endpoint responds: /health
3. ✅ Authentication works
4. ✅ Dashboard displays correctly
5. ✅ API endpoints functional
6. ✅ No JavaScript console errors
7. ✅ Database connections working
8. ✅ External integrations operational (Xero, Shopify)

### Monitoring (First 30 Minutes)
- Watch Render logs for errors
- Monitor application performance
- Check error tracking (if configured)
- Verify user reports (if any)

## Output Format

```
🚀 PRODUCTION DEPLOYMENT INITIATED

⚠️  LIVE ENVIRONMENT - MONITORING REQUIRED

✅ Deployment Steps:
1. ✅ Release tag created: v[version]
2. ✅ Merged test → production
3. ✅ Pushed to origin/production
4. ✅ Render auto-deploy triggered

🔗 Production Environment:
- URL: https://sentia-manufacturing-dashboard-production.onrender.com
- Render Dashboard: https://dashboard.render.com
- Health Check: https://sentia-manufacturing-dashboard-production.onrender.com/health

⏱️  Estimated Deployment Time: 3-5 minutes

📊 Post-Deployment Monitoring:
[checklist items above]

🔄 Rollback Available:
If issues occur, execute: /rollback-production

📧 NOTIFY STAKEHOLDERS:
Send production deployment notification to stakeholders with:
- Deployment time
- Version deployed
- Changes included
- Known issues (if any)
```

## Emergency Contacts

If critical issues arise:
- Render Support: https://render.com/support
- Repository: https://github.com/financeflo-ai/capliquify-ai-dashboard-app
- Document all issues immediately

Remember: Production deployments are serious. Follow all quality gates and never skip verification steps.
