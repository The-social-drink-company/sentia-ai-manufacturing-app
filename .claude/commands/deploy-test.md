# Deploy to Test Environment

Promote development changes to the test environment for UAT (User Acceptance Testing).

## 🚨 CRITICAL SAFETY CHECK

**This command deploys to the TEST environment used for User Acceptance Testing.**

According to CLAUDE.md deployment rules:
- Development work happens in `development` branch
- Test deployments require explicit user approval
- Never automatically push to test without confirmation

## Pre-Deployment Verification

1. **Branch Verification**
   - Confirm current branch is `development`
   - Check that development is stable and tested

2. **User Confirmation**
   - Ask: "Are you ready to promote to TEST environment for UAT?"
   - Explain: This will deploy to https://sentia-manufacturing-dashboard-test.onrender.com
   - Require explicit YES/NO confirmation

3. **Quality Gates**
   - Verify no critical lint errors
   - Confirm build succeeds
   - Check recent commits look correct

## Deployment Process

Once confirmed:

1. **Merge Development to Test**
   ```bash
   git checkout test
   git pull origin test
   git merge development
   ```

2. **Push to Test**
   ```bash
   git push origin test
   ```

3. **Monitor Deployment**
   - Show Render dashboard URL
   - Show test environment URL
   - Provide health check endpoint

## Post-Deployment Checklist

Provide UAT testing checklist:
- [ ] Application loads successfully
- [ ] Authentication works (Clerk or bypass)
- [ ] Dashboard displays data correctly
- [ ] Working Capital page functional
- [ ] Demand Forecasting operational
- [ ] Financial Reports accessible
- [ ] No console errors in browser
- [ ] API endpoints responding

## Output Format

```
🧪 TEST ENVIRONMENT DEPLOYMENT

✅ Deployment Steps Completed:
1. Merged development → test
2. Pushed to origin/test
3. Render auto-deploy triggered

🔗 Test Environment:
- URL: https://sentia-manufacturing-dashboard-test.onrender.com
- Render Dashboard: https://dashboard.render.com
- Health Check: https://sentia-manufacturing-dashboard-test.onrender.com/health

📋 UAT Testing Checklist:
[checklist items above]

⏱️  Estimated Deployment Time: 3-5 minutes

✉️  Notify stakeholders that test environment is ready for UAT.
```

Remember: This follows the enterprise git workflow. After UAT approval, changes can be promoted to production.
