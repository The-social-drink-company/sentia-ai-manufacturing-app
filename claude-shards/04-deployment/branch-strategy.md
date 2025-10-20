# Branch and Deployment Strategy

**Last Updated**: October 19, 2025
**Category**: Deployment
**Related Shards**: [deployment-infrastructure.md](./deployment-infrastructure.md), [critical-deployment-rules.md](./critical-deployment-rules.md), [../01-methodology/autonomous-git.md](../01-methodology/autonomous-git.md)

## Branch Structure

- `main` - **Primary development branch (default)** - All development work happens here
- `test` - User acceptance testing environment
- `production` - Live production environment

**NOTE**: The `development` branch has been consolidated into `main` as of October 19, 2025.

## Development Workflow (Implemented)

**Enterprise Git Workflow**: All development work happens in the `main` branch, which deploys to the production Render services:

1. **Main Branch**: All coding, fixing, and development work happens in `main` branch
   - Auto-deploys to: `sentia-frontend-prod`, `sentia-backend-prod`, `sentia-mcp-prod`
   - Custom domains: app.capliquify.com, api.capliquify.com, mcp.capliquify.com

2. **Test Branch**: Push to `test` branch for user acceptance testing (future separate environment)

3. **Production Branch**: Production-ready releases (future dedicated environment)

**Quality Gates**: Formal UAT process with client approval required before production deployment.

## 🤖 **AUTONOMOUS GIT AGENT SYSTEM** ✅ **ACTIVE**

**Status**: Operational since October 17, 2025

An intelligent autonomous system that automatically manages git commit, push, and PR operations during development, eliminating the "GitHub mess" problem.

### How It Works

**Three-Tier Trigger System:**

1. **PRIMARY (Task-Based)**: Auto-commits when TodoWrite tasks are completed
2. **SECONDARY (Change-Based)**: Auto-commits when 5+ files modified OR 150+ lines changed
3. **TERTIARY (Time-Based)**: Safety WIP commits every 30 minutes if uncommitted changes exist

### Automatic Operations

- ✅ **Smart Commits**: Auto-generated commit messages from task content and file analysis
- ✅ **Conventional Format**: Follows `type: subject` format (feat, fix, docs, refactor, etc.)
- ✅ **Auto-Push**: Pushes to main branch every 5 commits OR 1 hour (whichever first)
- ✅ **PR Suggestions**: Asks user when feature/epic milestones are reached

### Key Benefits

- Never lose work (automatic safety checkpoints)
- Clean, meaningful commit history
- Small, reviewable commits
- No manual git operations needed
- Eliminates "GitHub mess" problem permanently

### Safety Rules

- ❌ NEVER auto-commits to `test` or `production` branches
- ❌ NEVER creates PRs without asking first
- ❌ NEVER pushes if merge conflicts exist
- ✅ ONLY operates on `main` branch (unless explicitly told otherwise)

### Session Example

```
User works on feature → Claude completes tasks → Auto-commits after each task
After 5 commits → Auto-pushes to main
After epic complete → Asks: "Create PR with 12 commits?"
```

## Documentation

- **Complete Specification**: [docs/AUTONOMOUS_GIT_AGENT.md](../../docs/AUTONOMOUS_GIT_AGENT.md) (500+ lines)
- **Quick Reference**: [.claude-git-agent-rules.md](../../.claude-git-agent-rules.md)
- **Summary**: [AUTONOMOUS_GIT_SUMMARY.md](../../AUTONOMOUS_GIT_SUMMARY.md)

---

[← Previous: Environment Setup](./environment-setup.md) | [Next: Critical Deployment Rules →](./critical-deployment-rules.md) | [Back to Main →](../../CLAUDE.md)