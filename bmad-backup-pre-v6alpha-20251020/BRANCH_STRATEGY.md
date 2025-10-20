# Branch Strategy - Updated October 19, 2025

## Current Branch Configuration

As of October 19, 2025, the project has transitioned to using **`main`** as the primary development branch.

### Active Branches

- **`main`** - Primary development branch (default)
  - All new development work happens here
  - Auto-deploys to Render production services
  - GitHub default branch

- **`test`** - Testing environment branch
  - For user acceptance testing
  - Currently not actively used
  - Reserved for future multi-environment setup

- **`production`** - Production environment branch
  - For production-ready releases
  - Currently not actively used
  - Reserved for future multi-environment setup

- **`development`** - Legacy development branch
  - Historical development work (pre-October 19, 2025)
  - No longer actively used
  - Kept for reference and historical purposes
  - **Do not commit new work here**

## Render Deployment Configuration

All three Render services deploy from the **`main`** branch:
- **Frontend** (`sentia-frontend-prod`) → deploys from `main`
- **Backend API** (`sentia-backend-prod`) → deploys from `main`
- **MCP Server** (`sentia-mcp-prod`) → deploys from `main`

Auto-deploy is enabled on push to `main` branch.

## Git Workflow

### Daily Development

```bash
# All work happens on main branch
git checkout main
git pull origin main

# Make changes, commit
git add .
git commit -m "feat: Your feature description"

# Push to trigger deployment
git push origin main
```

### Autonomous Git Agent

The autonomous git agent follows these rules:
- Auto-commits completed tasks to `main` branch
- Auto-pushes to `origin/main` every 5 commits or 1 hour
- Suggests PRs when epic/feature milestones reached
- Only operates on `main` branch (unless explicitly told otherwise)

## Historical Note

Prior to October 19, 2025, the project used `development` as the primary branch. All historical BMAD documentation and retrospectives that reference "development branch" should be understood as referring to what is now the `main` branch.

### Why the Change?

1. **Align with Render**: Render services were already configured to deploy from `main`
2. **GitHub Convention**: `main` is the standard default branch name
3. **Simplification**: Single primary branch reduces complexity
4. **Industry Standard**: Most modern projects use `main` as default

## Future Multi-Environment Strategy

When multi-environment deployment is implemented:
- `main` → Development/Staging environment
- `test` → UAT environment
- `production` → Live production environment

Until then, `main` serves as the single deployment branch for all Render services.

---

**Last Updated**: October 19, 2025
**Status**: Active
**Related Docs**: See CLAUDE.md, .claude-git-agent-rules.md
