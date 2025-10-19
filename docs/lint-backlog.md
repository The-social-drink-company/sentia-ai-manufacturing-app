# Lint Backlog Tracker

_Last updated: 2025-10-19 (Command: `pnpm run lint`)_

Summary:
- **12 total findings** (0 errors, 12 warnings)
- Warning buckets: `react-refresh/only-export-components` (11), `react-hooks/exhaustive-deps` (1)

## Issue Clusters

### 1. Fast Refresh Export Hygiene (`react-refresh/only-export-components`)
- Files: `src/auth/BulletproofAuthProvider.jsx`, `src/auth/DevelopmentAuthProvider.jsx`, `src/components/ErrorBoundary.jsx`, `src/contexts/XeroContext.jsx`.
- Context: Files export helper constants or hooks alongside components, breaking Fast Refresh expectations.
- **Follow-up**: Extract helper logic into colocated modules (auth providers, error boundary utilities) or wrap helpers inside component scope.

### 2. Hook Dependency Hygiene (`react-hooks/exhaustive-deps`)
- File: `src/auth/BulletproofAuthProvider.jsx:178`
- Context: `useCallback` omits `clerkKey` from its dependency list.
- **Follow-up**: Add `clerkKey` to the dependency array or refactor to avoid stale closures.

## Recently Resolved
- 2025-10-19: Cleared Fast Refresh warnings in `src/components/ui/{button.jsx,badge.jsx}` by moving shared variant exports into `button-variants.js` / new `badge-variants.js` modules.
- 2025-10-19: Replaced `process.env` check in `src/components/integrations/XeroSetupPrompt.jsx` with Vite-friendly `import.meta.env` usage to satisfy lint.

## Tracking & Next Actions
1. Schedule a refactor for auth providers to relocate MFA helpers and exported constants.
2. Patch the remaining hook dependency warning in `BulletproofAuthProvider` once auth refactor work resumes.
3. Evaluate `ErrorBoundary` and `XeroContext` for companion utility modules so Fast Refresh warnings clear globally.
