# Lint Backlog Tracker

_Last updated: 2025-10-20 (Command: `pnpm run lint`)_

Summary:
- **1 total finding** (0 errors, 1 warning)
- Warning: `react-hooks/exhaustive-deps` in `src/auth/BulletproofAuthProvider.jsx`

## Issue Clusters

### Hook Dependency Hygiene (`react-hooks/exhaustive-deps`)
- File: `src/auth/BulletproofAuthProvider.jsx:157`
- Context: `initialize` callback closes over `clerkKey`; add it to the dependency array or restructure the setup flow.
- **Follow-up**: Align with the upcoming auth hardening story so the callback and key validation are centralised.

## Recently Resolved
- 2025-10-19: Removed unused admin approval aliases from `server/controllers/admin/index.js` and `server/routes/admin/index.js`.
- 2025-10-19: Cleared `no-unused-vars` in `server/queues/syncJobQueue.js` by removing unused event handler parameters and ensuring sync stubs log integration context.

## Tracking & Next Actions
1. Update the `initialize` callback in `BulletproofAuthProvider` so dependency analysis stays clean.
2. Continue documenting BMAD lint progress after tackling the remaining auth dependency warning.
