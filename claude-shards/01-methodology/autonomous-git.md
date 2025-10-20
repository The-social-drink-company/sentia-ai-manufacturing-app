# Autonomous Git Agent System

**Last Updated**: October 17, 2025
**Category**: Methodology
**Related Shards**: [bmad-method.md](./bmad-method.md), [../04-deployment/branch-strategy.md](../04-deployment/branch-strategy.md)

## 🤖 **AUTONOMOUS GIT AGENT SYSTEM** ✅ **ACTIVE**

**Status**: Operational since October 17, 2025

An intelligent autonomous system that automatically manages git commit, push, and PR operations during development, eliminating the "GitHub mess" problem.

### Documentation

- **Complete Specification**: [docs/AUTONOMOUS_GIT_AGENT.md](../../docs/AUTONOMOUS_GIT_AGENT.md) (500+ lines)
- **Quick Reference**: [.claude-git-agent-rules.md](../../.claude-git-agent-rules.md)
- **Summary**: [AUTONOMOUS_GIT_SUMMARY.md](../../AUTONOMOUS_GIT_SUMMARY.md)

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

---

[← Previous: BMAD Auto-Update](./bmad-auto-update.md) | [Back to Main →](../../CLAUDE.md)