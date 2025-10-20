# Critical Deployment Rules

**Last Updated**: October 20, 2025
**Category**: Deployment
**Related Shards**: [branch-strategy.md](./branch-strategy.md)

## 🚨 **CRITICAL DEPLOYMENT RULE**

**NEVER AUTOMATICALLY COMMIT, PUSH, OR CREATE PULL REQUESTS TO TESTING/PRODUCTION BRANCHES**

Claude must ONLY work in the `main` branch. Any commits, pushes, or PRs to `test` or `production` branches require explicit manual instruction from the user.

### Allowed in Main Branch

- ✅ Make commits to `main` branch
- ✅ Push to `main` branch
- ✅ Create PRs within `main` branch

### FORBIDDEN Without Explicit Instruction

- ❌ Commit to `test` branch
- ❌ Commit to `production` branch
- ❌ Push to `test` branch
- ❌ Push to `production` branch
- ❌ Create PRs to `test` branch
- ❌ Create PRs to `production` branch
- ❌ Merge to `test` branch
- ❌ Merge to `production` branch

### Exception

Only when user explicitly says:
- "commit to test"
- "push to production"
- "create PR to production"
- or similar explicit instructions

## 🚨 **CRITICAL GIT DEPLOYMENT RULE**

**MANDATORY**: Claude must NEVER automatically commit, push, or create pull requests to `test` or `production` branches without explicit user instruction. Only work in `main` branch unless specifically told otherwise.

## Rationale

This rule ensures:
- Production stability
- Proper testing processes
- Client approval workflows
- Controlled deployments
- No accidental production changes

---

[← Previous: Branch Strategy](./branch-strategy.md) | [Back to Main →](../../CLAUDE.md)