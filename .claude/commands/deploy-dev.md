# Deploy to Development Environment

Deploy the current changes to the development environment on Render.

## Pre-Deployment Checks

1. **Verify Current Branch**
   - Confirm we're on the `development` branch
   - If not, warn and ask for confirmation to proceed

2. **Check Working Directory**
   - Run `git status` to check for uncommitted changes
   - If uncommitted changes exist, ask whether to:
     - Commit them first
     - Stash them
     - Proceed without them

3. **Verify Remote Connection**
   - Check git remote is correctly configured
   - Verify we can connect to origin

## Deployment Process

1. **Run Pre-Flight Checks**
   - Run quick lint check (don't block on warnings)
   - Verify package.json and package-lock.json are in sync

2. **Git Operations**
   - Pull latest changes from origin/development
   - Resolve any conflicts if they exist
   - Push to origin/development

3. **Monitor Deployment**
   - Provide the Render dashboard URL: https://dashboard.render.com
   - Show the development deployment URL: https://sentia-frontend-prod.onrender.com
   - Remind to check Render logs for deployment status

4. **Post-Deployment Verification**
   - Wait 30 seconds (for Render to start building)
   - Provide curl command to test health endpoint
   - Provide instructions to verify deployment

## Output

After deployment, provide:
```
✅ Deployment Initiated Successfully

📋 Deployment Details:
- Branch: development
- Commit: [short SHA] [commit message]
- Environment: Development
- Render Service: sentia-manufacturing-dashboard-621h

🔗 URLs:
- Dashboard: https://dashboard.render.com
- Live App: https://sentia-frontend-prod.onrender.com
- Health Check: https://sentia-frontend-prod.onrender.com/health

⏱️  Estimated Deployment Time: 3-5 minutes

📝 Next Steps:
1. Monitor deployment at Render dashboard
2. Check build logs for any errors
3. Verify application loads correctly
4. Test critical functionality
```

Execute the deployment process following the git workflow documented in CLAUDE.md.
