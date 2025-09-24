# PR Preview Guide for Render Deployments

## Overview
This repository is configured to automatically create preview deployments for all pull requests on Render. This allows reviewers to test changes in a live environment before merging.

## How It Works

### Automatic Preview Creation
- **Default Behavior**: Every pull request automatically triggers a preview deployment
- **Preview URL**: Render will comment on the PR with the preview URL once deployment is complete
- **Lifespan**: Previews expire after 3 days of inactivity
- **Updates**: Previews automatically redeploy when new commits are pushed to the PR

### Preview URLs Format
```
https://sentia-manufacturing-pr-{number}.onrender.com
```

## Skipping PR Previews

Sometimes you may want to skip creating a preview for a PR (e.g., documentation-only changes). You have two options:

### Option 1: PR Title
Include `[skip preview]` in your PR title:
```
[skip preview] Update README documentation
```

### Option 2: GitHub Label
Add the `render-preview-skip` label to your PR:
1. Open your PR on GitHub
2. Click on Labels in the sidebar
3. Add the `render-preview-skip` label

## PR Preview Features

### Environment Variables
PR previews have special environment variables:
- `IS_PREVIEW=true` - Indicates this is a preview environment
- `NODE_ENV=preview` - Different from production/development
- `PREVIEW_URL` - The URL of the preview deployment

### Resource Allocation
- PR previews use the **starter** plan (lower resources than production)
- This keeps costs down while still providing functional previews

### Health Checks
- Health endpoint: `/health`
- Timeout: 30 seconds
- Automatic monitoring and status reporting

## Status Indicators

### GitHub PR Status Checks
- ✅ **Green check**: Preview deployed successfully
- 🔄 **Yellow circle**: Preview is building/deploying
- ❌ **Red X**: Preview deployment failed

### Automatic Labels
- `preview-ready`: Added when preview is successfully deployed
- `preview-failed`: Added if preview deployment fails

## Best Practices

### 1. Test in Preview Before Approval
Always test the preview URL before approving a PR to ensure:
- The application builds and starts correctly
- New features work as expected
- No regressions in existing functionality

### 2. Include Preview URL in Reviews
When reviewing, reference the preview URL:
```markdown
Tested on preview: https://sentia-manufacturing-pr-89.onrender.com
✅ Working Capital page loads correctly
✅ Navigation menu functions properly
```

### 3. Clean Commit History
Since each commit triggers a new preview deployment:
- Squash small fixes before pushing
- Use meaningful commit messages
- Avoid excessive "WIP" commits

### 4. Preview-Specific Testing
Test features that might behave differently in preview:
- Authentication flows
- API integrations
- Database connections
- Performance under limited resources

## Troubleshooting

### Preview Not Created
1. Check if `[skip preview]` is in the title
2. Verify no `render-preview-skip` label
3. Check Render dashboard for build logs

### Preview Fails to Deploy
1. Check build logs in Render dashboard
2. Verify `render.yaml` configuration
3. Ensure all environment variables are set
4. Check for missing dependencies in `package.json`

### Preview URL Not Working
1. Wait for deployment to complete (can take 5-10 minutes)
2. Check health endpoint: `{preview-url}/health`
3. Review application logs in Render dashboard

## Command Reference

### Creating a PR with Preview
```bash
# Standard PR creation (preview will be created)
gh pr create --title "Feature: Add new dashboard widget" --body "..."

# Skip preview for documentation changes
gh pr create --title "[skip preview] Update API documentation" --body "..."
```

### Adding Skip Label via CLI
```bash
# Add skip label to existing PR
gh pr edit {pr-number} --add-label "render-preview-skip"

# Remove skip label to enable preview
gh pr edit {pr-number} --remove-label "render-preview-skip"
```

## Cost Considerations

- Each PR preview uses resources (starter plan)
- Previews auto-expire after 3 days
- Skip previews for non-functional changes
- Clean up old PRs to free resources

## Security Notes

### Preview Isolation
- Each preview runs in its own isolated environment
- Previews use separate databases (if configured)
- No production data in previews

### Access Control
- Preview URLs are public by default
- Consider adding basic auth for sensitive previews
- Use environment-specific API keys

## Support

For issues with PR previews:
1. Check the [Render Status Page](https://status.render.com)
2. Review [Render PR Preview Docs](https://render.com/docs/pull-request-previews)
3. Contact team lead for Render account issues

---

**Remember**: PR previews are a powerful tool for maintaining code quality. Use them wisely to catch issues before they reach production!