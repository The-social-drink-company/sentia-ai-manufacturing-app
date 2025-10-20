# Render Synchronization Workflow

## Overview

This document outlines the complete workflow for keeping Render deployments synchronized with localhost development, ensuring continuous deployment across all environments.

## Deployment Environments

### Current Status (2025-09-26)

| Environment | URL                                                   | Status     | Uptime    |
| ----------- | ----------------------------------------------------- | ---------- | --------- |
| Development | https://sentia-manufacturing-development.onrender.com | ✅ Healthy | 91 min    |
| Testing     | https://sentia-manufacturing-testing.onrender.com     | ✅ Healthy | 1.9 hours |
| Production  | https://sentia-manufacturing-production.onrender.com  | ✅ Healthy | 3.6 days  |

## Synchronization Workflow

### 1. Development Branch (Primary Work)

```bash
# Always work on development branch
git checkout development

# Make changes and commit
git add -A
git commit -m "feat: description of changes"

# Pull latest and push
git pull origin development
git push origin development
```

**Auto-Deploy**: Pushing to `development` automatically triggers Render deployment

### 2. Create PR to Test Environment

```bash
# Create PR from development to test
gh pr create --title "Deploy: Feature to test" --body "Description" --base test --head development

# View PR
gh pr list --state open
```

**PR #129**: Created successfully - https://github.com/Capliquify/sentia-manufacturing-dashboard/pull/129

### 3. Merge to Test (After Review)

```bash
# Option 1: Merge via GitHub UI
# Option 2: Merge via CLI (if you have permissions)
gh pr merge 129 --merge

# After merge, test branch auto-deploys to Render
```

### 4. Create PR to Production

```bash
# After test validation, create PR from test to production
gh pr create --title "Deploy: Tested features to production" --body "Description" --base production --head test
```

### 5. Production Deployment

```bash
# Merge to production after approval
gh pr merge [PR_NUMBER] --merge

# Production auto-deploys to Render
```

## Conflict Resolution

### When Conflicts Occur

```bash
# Fetch all branches
git fetch --all

# If merging development to test has conflicts
git checkout test
git merge development

# Resolve conflicts in editor
# Then commit
git add -A
git commit -m "fix: resolve merge conflicts"
git push origin test
```

## Regular Sync Schedule

### Daily Workflow

1. **Morning**: Pull latest from all branches
2. **During Development**: Commit and push regularly to development
3. **End of Day**: Create PR to test if features are ready

### Weekly Workflow

1. **Monday**: Review all open PRs
2. **Wednesday**: Deploy tested features to production
3. **Friday**: Full environment health check

## Monitoring Deployments

### Check Deployment Status

```bash
# Health checks
curl https://sentia-manufacturing-development.onrender.com/health
curl https://sentia-manufacturing-testing.onrender.com/health
curl https://sentia-manufacturing-production.onrender.com/health

# View GitHub PRs
gh pr list --state open

# View recent commits
git log --oneline -10
```

### Render Dashboard

- Visit https://dashboard.render.com
- Monitor build logs
- Check deployment status
- Review environment variables

## Best Practices

### Commit Messages

- Use conventional commits: `feat:`, `fix:`, `docs:`, `chore:`
- Be descriptive but concise
- Reference issue numbers when applicable

### PR Descriptions

- Include summary of changes
- List any breaking changes
- Add deployment notes
- Include testing steps

### Environment Variables

- Never commit `.env` files
- Update variables in Render dashboard
- Document required variables in README

## Automated Features

### Auto-Deploy Triggers

- **Development**: Push to `development` branch
- **Test**: Merge PR to `test` branch
- **Production**: Merge PR to `production` branch

### Service Worker Updates

- Automatically notifies users of new versions
- Handles cache invalidation
- Smooth update process

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Render logs
   - Verify package.json scripts
   - Ensure all dependencies are listed

2. **Environment Variables Missing**
   - Check Render dashboard
   - Verify variable names match code
   - Restart service after adding variables

3. **Merge Conflicts**
   - Pull latest before pushing
   - Resolve conflicts locally
   - Test after resolution

## Current Open PRs

- PR #129: Deploy enterprise dashboard to test
- PR #128: Major codebase restructuring
- PR #127: Production to development sync
- PR #126: Test to development sync

## Security Notes

- 6 vulnerabilities detected (4 high, 2 low)
- Review at: https://github.com/Capliquify/sentia-manufacturing-dashboard/security/dependabot
- Run `npm audit` regularly

## Contact & Support

- GitHub Issues: Report bugs and feature requests
- Render Support: For deployment issues
- Team Communication: Use agreed channels

---

Last Updated: 2025-09-26
Generated with Claude Code (https://claude.ai/code)
