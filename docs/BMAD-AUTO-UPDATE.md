# BMAD-METHOD Autonomous Update Agent

**Version**: 1.0.0
**Created**: 2025-10-21
**Status**: Production Ready

---

## Overview

The BMAD Auto-Update Agent is an autonomous system that automatically keeps your BMAD-METHOD framework up-to-date with the latest v6-alpha releases from GitHub while **preserving 100% of your project-specific work**.

### Key Features

- ✅ **Fully Autonomous**: Runs unattended on schedule (daily at 3 AM)
- ✅ **Smart Detection**: Only updates when new commits available
- ✅ **100% Safe**: Automatic backups before every update
- ✅ **Project Preservation**: Never loses epics, stories, retrospectives, etc.
- ✅ **Git Integration**: Automatic commits with descriptive messages
- ✅ **Rollback Capable**: Automatic rollback on failure
- ✅ **Zero Configuration**: Works out of the box with sensible defaults
- ✅ **Dry-Run Testing**: Test updates without making changes

---

## Quick Start

### 1. Test the System (Recommended)

```bash
# Test in dry-run mode (no changes made)
node scripts/test-update.cjs --verbose

# If test passes, continue to setup
```

### 2. Setup Automatic Updates

```powershell
# Run PowerShell as Administrator
powershell -ExecutionPolicy Bypass -File scripts/setup-task-scheduler.ps1

# Task will run daily at 3:00 AM
```

### 3. Manual Test Run

```bash
# Test update manually
node scripts/bmad-auto-update.cjs --dry-run

# Run actual update manually (if desired)
node scripts/bmad-auto-update.cjs
```

---

## How It Works

### Update Process

1. **Check for Updates**
   - Queries GitHub API for latest v6-alpha commit
   - Compares with local installation
   - Only proceeds if update available

2. **Create Backup**
   - Full backup of `bmad/` directory
   - Timestamped for easy identification
   - Keeps last 5 backups (configurable)

3. **Perform Update**
   - Clones latest v6-alpha from GitHub
   - Updates framework files (core, BMM module)
   - **Preserves all project files** (epics, stories, etc.)
   - **Preserves configurations** (config.yaml, core-config.yaml)

4. **Validate**
   - Checks critical files exist
   - Verifies project files intact
   - Automatic rollback if validation fails

5. **Commit & Report**
   - Creates git commit (if enabled)
   - Generates update report
   - Logs all actions

### What Gets Updated

**Framework Files** (Updated):
- `bmad/core/` - Core framework (agents, tasks, workflows)
- `bmad/bmm/` - BMM module (method agents and workflows)
- `bmad/_cfg/` - Customization configurations
- `bmad/docs/` - Framework documentation

**Project Files** (Preserved):
- `bmad/epics/` - Your epic documents
- `bmad/stories/` - Your story implementations
- `bmad/retrospectives/` - Your retrospectives
- `bmad/planning/` - Your planning documents
- `bmad/solutioning/` - Your solution architecture
- `bmad/status/` - Your status reports
- `bmad/progress/` - Your progress tracking
- `bmad/reports/` - Your project reports
- `bmad/audit/` - Your audit files
- `bmad/guides/` - Your project guides
- `bmad/context/` - Your context documentation

**Configuration Files** (Preserved):
- `bmad/config.yaml` - Master configuration
- `bmad/core/core-config.yaml` - Project-specific settings
- `bmad/bmm/config.yaml` - BMM module configuration

---

## Configuration

### Location
`scripts/bmad-update-config.json`

### Key Settings

```json
{
  "enabled": true,              // Enable/disable auto-updates
  "autoCommit": true,           // Auto-commit changes to git
  "backupRetention": 5,         // Number of backups to keep
  "dryRun": false,              // Test mode (no actual changes)

  "schedule": {
    "time": "03:00",            // Daily run time
    "skipIfMissed": true        // Skip if computer was off
  },

  "git": {
    "autoCommit": true,         // Create git commits
    "autoPush": false           // Auto-push to remote (disabled by default)
  }
}
```

### Customizing Preserved Directories

Edit `projectFiles.preserveDirectories` in config to add/remove directories:

```json
"projectFiles": {
  "preserveDirectories": [
    "epics",
    "stories",
    "retrospectives",
    "planning",
    "solutioning",
    "status",
    "progress",
    "reports",
    "audit",
    "guides",
    "context"
  ]
}
```

---

## Usage

### Manual Commands

```bash
# Dry-run (test without changes)
node scripts/bmad-auto-update.cjs --dry-run

# Force update (even if no changes detected)
node scripts/bmad-auto-update.cjs --force

# Update without git commit
node scripts/bmad-auto-update.cjs --no-commit

# Combined options
node scripts/bmad-auto-update.cjs --dry-run --force
```

### Windows Task Scheduler Commands

```powershell
# View task status
Get-ScheduledTask -TaskName "BMAD-Auto-Update-Daily"

# Run task immediately
Start-ScheduledTask -TaskName "BMAD-Auto-Update-Daily"

# Disable task
Disable-ScheduledTask -TaskName "BMAD-Auto-Update-Daily"

# Enable task
Enable-ScheduledTask -TaskName "BMAD-Auto-Update-Daily"

# Remove task
Unregister-ScheduledTask -TaskName "BMAD-Auto-Update-Daily" -Confirm:$false
```

### Testing Commands

```bash
# Full test suite
node scripts/test-update.cjs --verbose

# Quick test
node scripts/test-update.cjs
```

---

## Logs & Reports

### Log Files

**Location**: `logs/bmad-updates/`

Each run creates a timestamped log file:
```
logs/bmad-updates/update-2025-10-21T03-00-00.log
```

### Update Reports

**Location**: `bmad/status/auto-update-YYYY-MM-DD.md`

Reports include:
- Update status (updated/no update)
- Current and latest versions
- Actions taken
- Full execution log

### Viewing Recent Logs

```bash
# View last 5 update logs
ls -lt logs/bmad-updates/ | head -6

# View latest log
cat logs/bmad-updates/$(ls -t logs/bmad-updates/ | head -1)

# View latest report
cat bmad/status/$(ls -t bmad/status/auto-update-* | head -1)
```

---

## Backup & Rollback

### Backup Location

**Directory**: `bmad-backups/`

Backups are automatically created before each update:
```
bmad-backups/bmad-backup-2025-10-21-1729486800000/
```

### Manual Rollback

```bash
# List available backups
ls -lt bmad-backups/

# Restore from backup
rm -rf bmad
cp -r bmad-backups/bmad-backup-YYYY-MM-DD-TIMESTAMP bmad

# Commit rollback
git add bmad/
git commit -m "chore: Rollback BMAD to previous version"
```

### Automatic Rollback

The agent automatically rolls back if:
- Validation fails
- Critical files missing
- Update process errors

---

## Troubleshooting

### Update Agent Not Running

**Check Task Scheduler**:
```powershell
Get-ScheduledTask -TaskName "BMAD-Auto-Update-Daily"
```

**Check Task History**:
1. Open Task Scheduler
2. Navigate to Task Scheduler Library
3. Find "BMAD-Auto-Update-Daily"
4. View History tab

**Common Issues**:
- Computer was off at scheduled time
- Task disabled
- Node.js not in PATH

**Solution**:
```powershell
# Re-create task
powershell -ExecutionPolicy Bypass -File scripts/setup-task-scheduler.ps1
```

### Update Failed

**Check Logs**:
```bash
cat logs/bmad-updates/$(ls -t logs/bmad-updates/ | head -1)
```

**Common Issues**:
- Network connection failed
- GitHub API rate limit
- Disk space full
- Git conflicts

**Solutions**:
- Check internet connection
- Wait 1 hour (GitHub API rate limit reset)
- Free up disk space
- Resolve git conflicts manually

### Project Files Missing After Update

**This should never happen** due to automatic rollback, but if it does:

```bash
# Restore from backup
rm -rf bmad
cp -r bmad-backups/$(ls -t bmad-backups/ | head -1) bmad
```

### Disable Auto-Updates

**Temporary** (keep scheduled task):
```powershell
Disable-ScheduledTask -TaskName "BMAD-Auto-Update-Daily"
```

**Permanent** (remove scheduled task):
```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-task-scheduler.ps1 -Uninstall
```

**Or edit config**:
```json
{
  "enabled": false
}
```

---

## Advanced Usage

### Custom Schedule

```powershell
# Setup with custom time
powershell -ExecutionPolicy Bypass -File scripts/setup-task-scheduler.ps1 -Time "02:00"
```

### Notifications

Edit `scripts/bmad-update-config.json`:

```json
"notifications": {
  "enabled": true,
  "onSuccess": false,
  "onFailure": true,
  "webhook": {
    "enabled": true,
    "url": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
    "method": "POST"
  }
}
```

### Multiple Backup Retention

```json
"backupRetention": 10  // Keep last 10 backups
```

---

## Security Considerations

### What the Agent Does

✅ **Safe Operations**:
- Reads from GitHub API (read-only)
- Updates local files
- Creates backups
- Creates git commits

❌ **Never Does**:
- Push to remote repository (disabled by default)
- Delete project files
- Modify files outside `bmad/` directory
- Access network except GitHub

### Permissions Required

- **Read**: GitHub API access
- **Write**: Local `bmad/` directory
- **Git**: Create commits (local only)

### Audit Trail

Every action logged:
- `logs/bmad-updates/` - Detailed execution logs
- `bmad/status/` - Update reports
- Git commits - Change history

---

## FAQ

### Q: Will my project work break if BMAD updates?

**A**: No. The agent only updates framework files. Your project files (epics, stories, configurations) are preserved. If an update breaks something, automatic rollback occurs.

### Q: Can I customize what gets preserved?

**A**: Yes. Edit `projectFiles.preserveDirectories` in `scripts/bmad-update-config.json`.

### Q: What if I'm working when update runs?

**A**: Updates run at 3 AM when you're likely not working. If you're working, git will detect conflicts and the agent won't commit.

### Q: Can I disable auto-commit?

**A**: Yes. Set `"autoCommit": false` in config or use `--no-commit` flag.

### Q: What if GitHub is down?

**A**: Update check fails gracefully. Logs error and exits. Retries next scheduled run.

### Q: Can I run on Linux/Mac?

**A**: The Node.js scripts work cross-platform. Use `cron` instead of Windows Task Scheduler for scheduling.

---

## Support

### Documentation
- [BMAD-METHOD Repository](https://github.com/bmad-code-org/BMAD-METHOD)
- [v6-Alpha Documentation](https://github.com/bmad-code-org/BMAD-METHOD/tree/v6-alpha)
- [BMAD Discord](https://discord.gg/gk8jAdXWmj)

### Project Integration
- [BMAD Workflow Integration](../bmad/BMAD-AUTO-UPDATE-AGENT.md)
- [CLAUDE.md](../CLAUDE.md) - Development guidelines

### Logs & Reports
- `logs/bmad-updates/` - Execution logs
- `bmad/status/` - Update reports
- Git history - Change tracking

---

## Changelog

### v1.0.0 (2025-10-21)
- Initial release
- Autonomous daily updates
- Smart update detection
- Automatic backups
- Project file preservation
- Git integration
- Windows Task Scheduler setup
- Comprehensive testing
- Full documentation

---

**Created**: 2025-10-21
**Updated**: 2025-10-21
**Version**: 1.0.0
**Status**: Production Ready
