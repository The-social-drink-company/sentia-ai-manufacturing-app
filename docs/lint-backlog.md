# Lint Backlog Tracker

_Last updated: 2025-10-19 (Command: `pnpm run lint`)_

Summary:
- **3 total findings** (2 errors, 1 warning)
- Errors: `no-unused-vars` (2) in `server/routes/admin/index.js`
- Warnings: `react-hooks/exhaustive-deps` (1) in `src/auth/BulletproofAuthProvider.jsx`

## Issue Clusters

### 1. Admin Route Stubs (`no-unused-vars`)
- File: `server/routes/admin/index.js`
- Context: Placeholder handlers `listApprovals` and `submitApproval` remain unused while the admin API surface is still scaffold-only.
- **Follow-up**: Implement the endpoints or remove the unused stubs once routing strategy is finalised.

### 2. Hook Dependency Hygiene (`react-hooks/exhaustive-deps`)
- File: `src/auth/BulletproofAuthProvider.jsx:157`
- Context: `initialize` callback closes over `clerkKey`; add it to the dependency array or restructure the setup flow.
- **Follow-up**: Align with the upcoming auth hardening story so the callback and key validation are centralised.

## Recently Resolved
- 2025-10-19: Eliminated Fast Refresh warnings across `BulletproofAuthProvider`, `DevelopmentAuthProvider`, `ErrorBoundary`, and `XeroContext` by extracting shared hooks/utilities into dedicated modules.
- 2025-10-19: Split shared variant helpers out of `src/components/ui/{button.jsx,badge.jsx}` and replaced the `process.env` gate in `XeroSetupPrompt` with `import.meta.env` checks.

## Tracking & Next Actions
1. Wire the admin approvals router to real controllers (or trim the placeholders) to clear `no-unused-vars`.
2. Update the `initialize` callback in `BulletproofAuthProvider` so dependency analysis stays clean.
3. Continue documenting BMAD lint progress after tackling the remaining auth dependency warning.
