# Autonomous Git Agent System

## Problem Statement

During active development, git commits, pushes, and PRs are not done frequently enough, leading to:
- Large, hard-to-review commits
- Accumulated changes causing merge conflicts
- Unclear progress tracking
- Risk of lost work
- "GitHub mess" that disrupts workflow

## Solution: Intelligent Autonomous Git Agent

An intelligent system that automatically manages git operations during development using multiple trigger conditions and smart decision-making.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                  AUTONOMOUS GIT AGENT                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   PRIMARY    │  │  SECONDARY   │  │   TERTIARY   │     │
│  │   TRIGGER    │  │   TRIGGER    │  │   TRIGGER    │     │
│  │              │  │              │  │              │     │
│  │ Task-Based   │  │ Change-Based │  │ Time-Based   │     │
│  │ (TodoWrite)  │  │ (File Edits) │  │ (Safety Net) │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│         └─────────┬────────┴──────────────────┘              │
│                   ▼                                          │
│         ┌──────────────────────┐                            │
│         │  COMMIT DECISION     │                            │
│         │  ENGINE              │                            │
│         └──────────┬───────────┘                            │
│                    ▼                                         │
│         ┌──────────────────────┐                            │
│         │  MESSAGE GENERATOR   │                            │
│         └──────────┬───────────┘                            │
│                    ▼                                         │
│         ┌──────────────────────┐                            │
│         │  AUTO-COMMIT         │                            │
│         └──────────┬───────────┘                            │
│                    ▼                                         │
│         ┌──────────────────────┐                            │
│         │  AUTO-PUSH MANAGER   │                            │
│         │  (Every 5 commits    │                            │
│         │   or 1 hour)         │                            │
│         └──────────────────────┘                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Trigger Conditions

### PRIMARY TRIGGER: Task-Boundary Commits ✅ **RECOMMENDED**

**When:** TodoWrite marks a task as "completed"

**Why:** Most reliable signal that a logical unit of work is done

**Rules:**
1. ✅ When a todo status changes from `in_progress` → `completed`
2. ✅ Auto-commit all changed files related to that task
3. ✅ Generate commit message from the todo `content` field
4. ✅ Push after every 5 task completions OR 1 hour (whichever first)

**Example:**
```javascript
// Todo: "Fix authentication bug in login component"
// Auto-generates commit:
// "fix: Fix authentication bug in login component
//
// Completed task: Fix authentication bug in login component
// Files changed: src/components/auth/LoginForm.jsx, src/services/authService.js"
```

**Advantages:**
- Natural, meaningful boundaries
- Clear commit messages
- Only commits complete work
- Aligns with existing TodoWrite workflow

---

### SECONDARY TRIGGER: Significant Change Detection

**When:** Substantial file changes accumulate

**Rules:**
1. ✅ Monitor cumulative changed files
2. ✅ Trigger when ANY of these thresholds met:
   - 5+ files modified
   - 150+ lines changed (additions + deletions)
   - 3+ new files created
   - Critical files modified (package.json, database schema, server.js)
3. ✅ **EXCEPTION:** Do NOT trigger if last commit was < 10 minutes ago
4. ✅ Analyze changes and generate descriptive commit message

**Example:**
```javascript
// After editing 5 related files for inventory feature:
// Auto-generates commit:
// "feat: Add inventory management calculations
//
// - Update InventoryManagement.jsx with reorder point logic
// - Add inventory optimization algorithms
// - Connect to Shopify inventory API
// - Update inventory service with batch optimization
// - Add inventory forecasting utilities"
```

**Advantages:**
- Catches substantial progress even if todos not updated
- Prevents accumulation of too many changes
- Smart analysis creates meaningful messages

---

### TERTIARY TRIGGER: Time-Based Safety Net

**When:** Changes exist but no commit for extended period

**Rules:**
1. ✅ Check every 30 minutes
2. ✅ If uncommitted changes exist AND last commit was > 30 minutes ago
3. ✅ Create "WIP" (Work In Progress) commit as safety checkpoint
4. ✅ Include timestamp and change summary in message

**Example:**
```javascript
// Auto-generates commit:
// "WIP: Development checkpoint - 2025-10-17 14:30
//
// Uncommitted changes:
// - Modified: src/components/Dashboard.jsx (45 lines)
// - Modified: src/services/apiService.js (23 lines)
// - New: src/utils/dataProcessor.js (87 lines)
//
// This is an automatic safety checkpoint."
```

**Advantages:**
- Prevents loss of work
- Creates recovery points
- Doesn't interfere with flow

**Note:** WIP commits can be squashed/cleaned up later with `git rebase -i`

---

## Commit Message Generation

### Smart Message Analysis

The agent analyzes file changes to create meaningful commit messages using:

1. **Conventional Commits Format:**
   ```
   <type>(<scope>): <subject>

   <body>
   ```

2. **Types:**
   - `feat:` - New features
   - `fix:` - Bug fixes
   - `refactor:` - Code restructuring
   - `docs:` - Documentation
   - `style:` - Formatting, whitespace
   - `test:` - Test additions/changes
   - `chore:` - Maintenance, dependencies

3. **Analysis Factors:**
   - File paths changed (determines scope)
   - Lines added/removed (determines magnitude)
   - Todo content (primary source for message)
   - File content analysis (identifies purpose)

### Message Template

```
<type>: <todo content OR change summary>

<detailed description>
- File 1 change summary
- File 2 change summary
- File N change summary

Related task: <todo content>
Files changed: <count>
Lines changed: +<additions> -<deletions>
```

---

## Auto-Push Strategy

### Push Frequency Rules

**Option A: Commit-Based (RECOMMENDED)**
- ✅ Auto-push after every **5 commits** to development branch
- ✅ Keeps remote reasonably up-to-date
- ✅ Batches commits for efficiency

**Option B: Time-Based**
- ✅ Auto-push every **1 hour** if unpushed commits exist
- ✅ Ensures regular synchronization
- ✅ Prevents accumulation

**Hybrid Approach (BEST):**
- ✅ Push after 5 commits **OR** 1 hour, whichever comes first
- ✅ Before any PR creation
- ✅ After completing a major todo (epic/feature)

### Push Safety Checks

Before every auto-push:
1. ✅ Verify on `development` branch (never push to test/production without explicit instruction)
2. ✅ Run `git pull --rebase` first to sync with remote
3. ✅ Resolve conflicts if any (notify user if can't auto-resolve)
4. ✅ Push to origin/development

---

## PR Creation Strategy

### When to Create PRs

**SEMI-AUTONOMOUS:** Ask user before creating PR

**Suggested PR Triggers:**
1. ✅ All todos in an epic/feature are completed
2. ✅ User explicitly requests PR
3. ✅ Significant milestone reached (e.g., "Phase 1 Complete")

**PR Creation Process:**
1. Analyze all commits since last PR
2. Generate comprehensive PR description
3. **ASK USER:** "I've completed [X] tasks with [Y] commits. Ready to create PR to development?"
4. If approved, create PR with rich description

**PR Description Template:**
```markdown
## Summary
Brief overview of changes

## Completed Tasks
- Task 1 from TodoWrite
- Task 2 from TodoWrite
- Task N from TodoWrite

## Technical Changes
- Component modifications
- API changes
- Database updates
- New features

## Test Plan
- [ ] Manual testing completed
- [ ] Integration tests passing
- [ ] No breaking changes

## Related Issues
Closes #123, #456
```

---

## Implementation Instructions for Claude

### Core Agent Behavior Rules

1. **After Every TodoWrite Tool Use:**
   ```
   IF (any todo marked as "completed") THEN
       - Collect all changed files
       - Generate commit message from todo content
       - Create commit
       - Increment commit counter
       - Check if push needed (every 5 commits or 1 hour)
   END IF
   ```

2. **After Every Edit/Write Tool Use:**
   ```
   - Track cumulative changes (files, lines)
   - IF (change threshold met) AND (last commit > 10 min ago) THEN
       - Analyze changes
       - Generate commit message
       - Create commit
       - Increment commit counter
   END IF
   ```

3. **Periodic Check (Mental Timer):**
   ```
   - Every ~10 interactions, mentally check:
       - Is last commit > 30 minutes ago?
       - Are there uncommitted changes?
       - If YES to both: create WIP commit
   ```

4. **Before Task Switch:**
   ```
   IF (starting new major task or epic) THEN
       - Commit any pending changes
       - Consider if PR appropriate
       - Ask user about PR if substantial work complete
   END IF
   ```

### Commit Message Generation Algorithm

```javascript
function generateCommitMessage(context) {
    // 1. Determine type
    const type = determineCommitType(context.files, context.todoContent)

    // 2. Extract subject
    const subject = context.todoContent || analyzeChanges(context.files)

    // 3. Build body
    const body = buildDetailedBody(context.files, context.changes)

    // 4. Construct message
    return `${type}: ${subject}

${body}

Completed task: ${context.todoContent}
Files changed: ${context.files.length}
Lines changed: +${context.additions} -${context.deletions}

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>`
}
```

### Example Session Flow

```
User: "Implement inventory forecasting feature"

Claude:
- Creates TodoWrite tasks
- Marks "Create inventory forecasting component" as in_progress
- Uses Edit tool to create component
- Marks task as completed
- **AUTO-COMMITS:** "feat: Create inventory forecasting component"
- Continues to next task
- Marks "Add forecasting algorithms" as in_progress
- Uses Edit tool to add algorithms
- Marks task as completed
- **AUTO-COMMITS:** "feat: Add forecasting algorithms"
- Continues...
- After 5 commits: **AUTO-PUSHES** to origin/development
- After all tasks complete: **ASKS USER:** "All forecasting tasks complete (7 commits). Create PR?"
```

---

## Benefits Summary

### For User:
✅ Never worry about git hygiene during development
✅ Clear, meaningful commit history
✅ Regular backups (no lost work)
✅ Easy to review changes (small commits)
✅ Clean git graph
✅ Focus on coding, not git commands

### For Collaboration:
✅ Easy code reviews (atomic commits)
✅ Clear progress tracking
✅ Easy to revert specific changes
✅ Better merge conflict resolution

### For Claude:
✅ Natural integration with TodoWrite workflow
✅ Clear rules to follow
✅ Demonstrates proactive assistance
✅ Reduces "GitHub mess" complaints

---

## Configuration Options

### User Preferences (Configurable)

```javascript
// .claude-git-agent-config.json
{
    "enabled": true,
    "triggers": {
        "taskCompletion": true,        // Primary trigger
        "significantChanges": true,     // Secondary trigger
        "timeBased": true,              // Tertiary trigger
        "timeThresholdMinutes": 30
    },
    "changeThresholds": {
        "files": 5,
        "lines": 150,
        "newFiles": 3
    },
    "pushStrategy": {
        "commitCount": 5,
        "timeMinutes": 60,
        "beforePR": true
    },
    "commitMessage": {
        "useConventionalCommits": true,
        "includeFileList": true,
        "includeStats": true,
        "includeClaudeSignature": true
    },
    "prCreation": {
        "autoCreate": false,            // Always ask first
        "askOnEpicComplete": true,
        "askOnMilestone": true
    },
    "safetyRules": {
        "onlyDevelopmentBranch": true,   // CRITICAL
        "pullBeforePush": true,
        "requireCleanBuild": false       // Optional: run tests before commit
    }
}
```

---

## Monitoring & Feedback

### User Visibility

Claude should provide brief notifications:

```
✅ Auto-commit: "feat: Add inventory calculations" (3 files, +87 lines)
⏰ Auto-push: Pushed 5 commits to origin/development
🤔 PR Ready: 12 tasks complete, 15 commits. Create PR to development?
⚠️ Safety commit: WIP checkpoint created (30 min threshold)
```

### Statistics Tracking

Maintain session statistics:
- Commits created: 15
- Changes pushed: 3 pushes (15 commits)
- PRs created: 2
- Time saved: ~45 minutes (estimated manual git time)

---

## Edge Cases & Error Handling

### Merge Conflicts
```
IF (pull --rebase fails with conflicts) THEN
    - Notify user immediately
    - Explain conflict files
    - Offer to help resolve
    - DO NOT auto-push until resolved
END IF
```

### Incomplete Work
```
IF (user interrupts mid-task) THEN
    - Offer WIP commit
    - "Would you like me to create a safety commit before stopping?"
END IF
```

### Branch Protection
```
IF (current branch != "development") THEN
    - HALT auto-commit
    - Warn user: "Not on development branch. Auto-commits disabled."
    - Await explicit instruction
END IF
```

### Build Failures
```
IF (config.requireCleanBuild == true) THEN
    - Run build command before commit
    - IF (build fails) THEN
        - DO NOT commit
        - Notify user: "Build failed, commit deferred"
    END IF
END IF
```

---

## Implementation Checklist

### Phase 1: Core System (Immediate)
- [ ] Implement task-completion commit trigger
- [ ] Build commit message generator
- [ ] Add auto-push every 5 commits
- [ ] Test with simple development session

### Phase 2: Enhanced Triggers (Week 1)
- [ ] Add significant-change detection
- [ ] Implement time-based safety net
- [ ] Add user notifications/feedback
- [ ] Test with complex multi-file changes

### Phase 3: PR Automation (Week 1-2)
- [ ] Build PR description generator
- [ ] Implement "ask before PR" logic
- [ ] Test PR creation workflow
- [ ] Add epic/milestone detection

### Phase 4: Polish & Config (Week 2-3)
- [ ] Create configuration file support
- [ ] Add statistics tracking
- [ ] Improve error handling
- [ ] User documentation

### Phase 5: Advanced Features (Optional)
- [ ] Conflict resolution assistant
- [ ] Pre-commit hooks (linting, testing)
- [ ] Smart squashing of WIP commits
- [ ] Branch management suggestions

---

## Success Metrics

### Quantitative:
- Commits per development session: Target 10-20 (vs current 1-3)
- Average commit size: Target 50-100 lines (vs current 500+)
- Push frequency: Target every 30-60 min (vs current hours/days)
- PR creation time: Target < 5 min (vs current manual effort)

### Qualitative:
- User no longer complains about "GitHub mess"
- Cleaner commit history
- Easier code reviews
- Better collaboration experience
- Reduced stress about losing work

---

## Rollout Plan

### Immediate: Basic Auto-Commit
Start with just task-completion commits:
- Commit after every TodoWrite "completed" status
- Manual push for now
- Test for 2-3 development sessions

### Week 1: Add Auto-Push
Add automatic pushing:
- Push every 5 commits
- Push every hour if pending
- Monitor for issues

### Week 2: Full System
Enable all triggers:
- Significant change detection
- Time-based safety net
- PR automation (with user approval)

### Ongoing: Refinement
- Gather user feedback
- Adjust thresholds
- Improve message generation
- Add requested features

---

## Examples from Real Development

### Example 1: Feature Development
```
Session: Implementing Working Capital Dashboard

09:00 - Start work
        Todo: "Design working capital component layout"
09:15 - Complete layout design
        ✅ AUTO-COMMIT: "feat: Design working capital component layout"
09:20 - Todo: "Implement cash conversion cycle calculations"
09:45 - Complete calculations
        ✅ AUTO-COMMIT: "feat: Implement cash conversion cycle calculations"
10:00 - Todo: "Add Xero API integration"
10:30 - Complete integration
        ✅ AUTO-COMMIT: "feat: Add Xero API integration"
10:35 - Todo: "Create optimization recommendations engine"
11:00 - Complete engine
        ✅ AUTO-COMMIT: "feat: Create optimization recommendations engine"
11:05 - Todo: "Add unit tests for working capital calculations"
11:20 - Complete tests
        ✅ AUTO-COMMIT: "test: Add unit tests for working capital calculations"
        ✅ AUTO-PUSH: 5 commits pushed to origin/development
11:25 - All todos complete
        🤔 ASK USER: "Working capital dashboard complete (5 commits). Create PR?"
```

### Example 2: Bug Fix Session
```
Session: Fixing Authentication Issues

14:00 - Start debugging
        Todo: "Investigate Clerk authentication failure"
14:20 - Identified issue in LoginForm.jsx
        [Changed 1 file, 15 lines - below threshold]
14:25 - Todo marked complete
        ✅ AUTO-COMMIT: "fix: Investigate Clerk authentication failure
                          - Fixed token refresh logic in LoginForm.jsx"
14:30 - Todo: "Update auth service with proper error handling"
14:45 - Multiple files changed (authService.js, LoginForm.jsx, ErrorBoundary.jsx)
        [3 files, 87 lines changed - threshold met]
        ✅ AUTO-COMMIT: "fix: Update auth service with proper error handling
                          - Add retry logic for failed auth attempts
                          - Improve error messages
                          - Add error boundary for auth components"
14:50 - Todo marked complete
        ✅ AUTO-PUSH: 2 commits pushed to origin/development
```

### Example 3: Extended Development (Safety Net)
```
Session: Complex Refactoring

15:00 - Start refactoring inventory management
        Todo: "Refactor inventory service architecture"
15:30 - Making many changes, focused on code
        [No todos completed, but many files changed]
        ⏰ TIME-BASED TRIGGER: 30 minutes elapsed
        ✅ AUTO-COMMIT: "WIP: Development checkpoint - 2025-10-17 15:30
                          - Refactoring inventory service architecture
                          - Modified 8 files, +234 -156 lines
                          This is an automatic safety checkpoint."
16:00 - Continue refactoring
16:30 - Another safety checkpoint
        ✅ AUTO-COMMIT: "WIP: Development checkpoint - 2025-10-17 16:30"
17:00 - Finally complete refactoring
        Todo marked complete
        ✅ AUTO-COMMIT: "refactor: Refactor inventory service architecture
                          - Reorganize service structure
                          - Extract reusable utilities
                          - Improve type safety
                          - Add documentation"
17:05 - ✅ AUTO-PUSH: 3 commits (including 2 WIP) pushed
        📝 NOTE: WIP commits can be squashed later if desired
```

---

## Future Enhancements

### Advanced AI Features
1. **Smart Commit Squashing**
   - Auto-detect and squash related WIP commits
   - Preserve important commits
   - Clean up history before PR

2. **Intelligent Branching**
   - Suggest feature branches for large features
   - Auto-create branches for epics
   - Manage branch lifecycle

3. **Context-Aware Messaging**
   - Learn from user's commit style
   - Adapt message format to project conventions
   - Use project-specific terminology

4. **Predictive Push Timing**
   - Learn optimal push times for user's workflow
   - Predict when user might stop working
   - Optimize network efficiency

5. **Collaboration Intelligence**
   - Detect conflicts with team members' work
   - Suggest optimal times to create PRs
   - Coordinate with team's git activity

---

## Conclusion

This autonomous git agent system solves the "GitHub mess" problem by:

1. **Automating** routine git operations without disrupting flow
2. **Intelligently** deciding when to commit based on multiple signals
3. **Generating** meaningful commit messages automatically
4. **Maintaining** clean git history with atomic commits
5. **Preventing** work loss with safety checkpoints
6. **Respecting** project rules (development-only commits)
7. **Collaborating** by creating well-structured PRs

The system is **proactive but safe**, **intelligent but predictable**, and **autonomous but transparent**.

---

## Getting Started

### For Users:
Simply continue working as normal with TodoWrite. The agent will handle git operations automatically.

### For Claude:
Follow the "Core Agent Behavior Rules" section. Start with task-completion commits, then gradually adopt all triggers.

### Immediate Action:
Enable this system starting with your next development session!

---

**Status**: Ready for Implementation ✅
**Priority**: High 🔥
**Impact**: Eliminates "GitHub mess" problem permanently 🎯

