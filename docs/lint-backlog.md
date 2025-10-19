# Lint Backlog Tracker

_Last updated: 2025-10-19 (Command: `pnpm run lint`)_

Summary:
- **16 total findings** (1 error, 15 warnings)
- Blocking error: `no-unused-vars` triggered by the unused `IconComponent` helper in `src/pages/production/ProductionDashboard.jsx:346`
- Warnings: `react-refresh/only-export-components` (14), `react-hooks/exhaustive-deps` (1)

## Issue Clusters

### 1. Unused Variables (`no-unused-vars`)
- Location: `src/pages/production/ProductionDashboard.jsx:346`
- Context: `IconComponent` is exported but never used after dashboard refactor.
- **Follow-up**: Remove `IconComponent` or wire it into the card map before enabling CI lint gate.

### 2. Fast Refresh Export Hygiene (`react-refresh/only-export-components`)
- Files: `src/auth/BulletproofAuthProvider.jsx`, `src/auth/DevelopmentAuthProvider.jsx`, `src/components/ErrorBoundary.jsx`, `src/components/ui/{badge.jsx,button.jsx}`, `src/contexts/XeroContext.jsx`.
- Context: Files export helper constants alongside default components, breaking React Fast Refresh expectations.
- **Follow-up**: Extract helper constants into colocated modules or wrap them inside the component body.

### 3. Hook Dependency Hygiene (`react-hooks/exhaustive-deps`)
- File: `src/auth/BulletproofAuthProvider.jsx:178`
- Context: `useCallback` omits `clerkKey` from its dependency list.
- **Follow-up**: Add `clerkKey` to the dependency array or refactor to avoid stale closures.

## Tracking & Next Actions
1. Resolve the `IconComponent` unused variable so the lint command exits cleanly.
2. Schedule a pass to split helper exports out of auth providers and shared UI primitives (Fast Refresh warnings).
3. Patch the remaining hook dependency warning in `BulletproofAuthProvider` once auth refactor work resumes.

## Historical Snapshot
- 2025-10-18 (Commit 135da490): 83 findings (66 errors, 17 warnings) before large cleanup of worker and supplier pages.
- 2025-10-19: Fast refresh/hook warnings remain; unused variable is sole blocking error.
