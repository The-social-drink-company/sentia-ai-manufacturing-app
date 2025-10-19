# Lint Backlog Tracker

_Last updated: 2025-10-20 (Command: `pnpm run lint`)_

Summary:
- **0 findings** (0 errors, 0 warnings)

## Issue Clusters
- None — lint is clean.

## Recently Resolved
- 2025-10-20: Added `clerkKey` dependency and removed unused retry state in `src/auth/BulletproofAuthProvider.jsx`, clearing `react-hooks/exhaustive-deps` warning.
- 2025-10-19: Removed unused admin approval aliases from `server/controllers/admin/index.js` and `server/routes/admin/index.js`.
- 2025-10-19: Cleared `no-unused-vars` in `server/queues/syncJobQueue.js` by removing unused event handler parameters and ensuring sync stubs log integration context.

## Tracking & Next Actions
1. Keep lint clean as admin/auth refactors progress.
2. Re-run `pnpm run lint` after major merges to catch regressions early.
