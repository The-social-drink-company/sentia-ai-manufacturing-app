# Git Workflow Guide

This guide explains how we commit, push, raise pull requests, and resolve merge conflicts in the Sentia AI Manufacturing Platform repository. It complements the branch strategy already defined in `docs/developer/DEVELOPMENT_WORKFLOW.md` and the enterprise requirements captured in `ENTERPRISE_GIT_WORKFLOW.md`.

## 1. Daily Baseline

1. Ensure your local git is clean before pulling updates:
   ```bash
   git status
   ```
2. Sync the integration branch we work from (`development` unless otherwise noted):
   ```bash
   git checkout development
   git pull --ff-only origin development
   ```
3. Create a task-focused branch following the Git Flow naming rules:
   ```bash
   git switch -c feature/TICKET-123-short-summary
   ```

> Tip: Use `git fetch --prune` daily to keep your remote-tracking branches tidy.

## 2. Preparing a Commit

1. Run formatting and quality gates before staging files:
   ```bash
   pnpm run format
   pnpm run lint
   pnpm run typecheck
   pnpm test          # add --coverage or --runInBand when needed
   ```
2. Review what changed:
   ```bash
   git status
   git diff
   ```
3. Stage intentional changes only (avoid `git add .` when possible):
   ```bash
   git add path/to/file.tsx
   git add path/to/related.test.ts
   ```
4. Craft a Conventional Commit message with an optional body and SpecKit issue reference:
   ```bash
   git commit
   # Example message:
   # feat(inventory): surface daily bottling throughput
   # 
   # - add production KPI card with SSE updates
   # - guard against missing telemetry values
   #
   # Closes SPEC-482
   ```
5. If you catch a mistake immediately after committing, prefer `git commit --amend` before pushing.

## 3. Pushing Your Branch

1. Push the branch to origin with upstream tracking the first time:
   ```bash
   git push -u origin feature/TICKET-123-short-summary
   ```
2. Subsequent pushes require only `git push`.
3. If the push is rejected because the tip is behind remote, fetch and rebase:
   ```bash
   git fetch origin
   git rebase origin/development
   # resolve conflicts, then
   git push --force-with-lease
   ```

`--force-with-lease` protects teammates’ work by refusing the push when the remote branch has new commits you have not incorporated.

## 4. Creating a Pull Request

1. Confirm local quality gates still pass (lint, typecheck, relevant tests, and `pnpm run build` when touching build paths).
2. Push the latest changes and open a PR targeting the appropriate base branch (`development` by default, `test` or `production` only when following the staged promotion plan in `ENTERPRISE_GIT_WORKFLOW.md`).
3. Populate the PR description with:
   - Short summary of the change and affected features.
   - Linked SpecKit issue IDs.
   - Before/after screenshots or Render preview URLs for UI work.
   - Checklist confirming `pnpm run lint`, `pnpm run format:check`, `pnpm run test`, and other relevant commands.
4. Request reviewers and wait for automated GitHub Actions checks to pass before merging.

## 5. Handling Merge Conflicts

Conflicts appear when Git cannot automatically combine commits. The workflow differs slightly depending on the operation:

### During `git merge` or `git pull`

1. Identify conflicted files:
   ```bash
   git status
   ```
2. Open each file, search for conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`), and decide how to combine the competing changes.
3. After editing, run lint/tests if the conflict touched executable code.
4. Mark files as resolved and continue:
   ```bash
   git add path/to/conflicted-file.ts
   git commit            # completes a merge, no extra message needed
   ```

### During `git rebase`

1. Resolve conflicts as above, then continue the rebase:
   ```bash
   git add path/to/conflicted-file.ts
   git rebase --continue
   ```
2. To abort and return to the pre-rebase state:
   ```bash
   git rebase --abort
   ```

### Keeping Track of Complex Resolutions

- Use `git mergetool` (configured with VS Code, Beyond Compare, etc.) for large diffs.
- `git diff --staged` verifies resolved content before committing.
- If you inadvertently introduce regressions during a conflict resolution, revert the problematic commit (`git revert <sha>`) instead of rewriting shared history.

## 6. Common Merge & Push Errors

| Symptom | Cause | Resolution |
| --- | --- | --- |
| `fatal: Not possible to fast-forward, aborting.` | Remote branch advanced while you were working. | `git fetch origin && git rebase origin/<branch>` then `git push --force-with-lease`. |
| `Updates were rejected because the remote contains work that you do not have locally.` | Same as above. | Rebase or merge the remote branch, resolve conflicts, push again. |
| `error: Your local changes to the following files would be overwritten by checkout` | Uncommitted work blocks `git checkout`. | Commit, stash, or discard changes (`git stash push`, `git restore --source=HEAD -- <file>`). |
| `Merge made by the 'ort' strategy.` followed by unintended files | Accidental merge into the wrong branch. | `git reset --hard HEAD~1` (if not pushed) or `git revert` (if pushed). |

## 7. Quick Reference Commands

- Inspect history: `git log --oneline --graph --decorate`
- Undo last local commit (keep changes staged): `git reset --soft HEAD~1`
- Move uncommitted changes aside: `git stash push -m "context"`
- Restore a single file from HEAD: `git restore path/to/file.ts`
- List tracked branches: `git branch -vv`

## 8. Related Documentation

- `docs/developer/DEVELOPMENT_WORKFLOW.md` – detailed branch strategy and coding standards.
- `ENTERPRISE_GIT_WORKFLOW.md` – environment promotion steps (development → test → production).
- `docs/TESTING_GUIDE.md` – test suite expectations before merging.

Following the steps above keeps branches rebased, PRs reviewable, and the deployment pipeline healthy while leaving a clean audit trail for compliance audits.


