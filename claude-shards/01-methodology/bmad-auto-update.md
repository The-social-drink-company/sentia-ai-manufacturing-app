# BMAD Auto-Update Agent

**Last Updated**: October 21, 2025
**Category**: Methodology
**Related Shards**: [bmad-method.md](./bmad-method.md), [autonomous-git.md](./autonomous-git.md)

## 🤖 **BMAD Auto-Update Agent** ✅ **ACTIVE** (NEW - 2025-10-21)

**Status**: Operational - Autonomous daily framework updates
**Version**: 1.0.0

An autonomous system that automatically keeps your BMAD-METHOD framework up-to-date with the latest v6-alpha releases while **preserving 100% of your project work**.

### Key Features

- ✅ **Fully Autonomous**: Runs daily at 3:00 AM via Windows Task Scheduler
- ✅ **Smart Detection**: Only updates when new v6-alpha commits available
- ✅ **100% Safe**: Automatic backups before every update
- ✅ **Project Preservation**: Never loses epics, stories, retrospectives (141 files preserved)
- ✅ **Git Integration**: Automatic commits with descriptive messages
- ✅ **Rollback Capable**: Automatic rollback on failure
- ✅ **Zero Configuration**: Works out of the box with sensible defaults

### Quick Commands

```bash
# Test in dry-run mode
node scripts/bmad-auto-update.cjs --dry-run

# Manual update trigger
node scripts/bmad-auto-update.cjs --force

# Run test suite
node scripts/test-update.cjs --verbose

# Setup scheduled task (PowerShell as Admin)
powershell -ExecutionPolicy Bypass -File scripts/setup-task-scheduler.ps1
```

### Documentation

- [Auto-Update Guide](../../docs/BMAD-AUTO-UPDATE.md) - Complete usage documentation
- [Workflow Integration](../../bmad/BMAD-AUTO-UPDATE-AGENT.md) - BMAD workflow integration
- Configuration: `scripts/bmad-update-config.json`

**What Gets Updated**: Framework files only (bmad/core/, bmad/bmm/)
**What's Preserved**: All project files (epics/, stories/, retrospectives/, planning/, etc.)
**Logs**: `logs/bmad-updates/` | **Reports**: `bmad/status/auto-update-*.md`

---

[← Previous: BMAD Method](./bmad-method.md) | [Next: Autonomous Git →](./autonomous-git.md) | [Back to Main →](../../CLAUDE.md)