# Lint Backlog Tracker

_Last updated: 2025-10-18 (Commit: 135da490)_

Command executed: `npx eslint src server --ext .js,.jsx`

Summary:
- **83 total issues** (66 errors, 17 warnings) - down from 90 issues
- Dominant rule: `no-unused-vars` – 64 hits (down from 70)
- Warning-only rules: `react-refresh/only-export-components` (13), `react-hooks/exhaustive-deps` (4)

## Issue Clusters

### 1. Unused Variables and Parameters (`no-unused-vars`)
- Concentrated in long-form pages (`src/pages/WhatIfAnalysisComprehensive.jsx`, `src/pages/dashboard/DrilldownModal.jsx`), production workflow screens, and server workers.
- Generated data helpers (e.g., `src/services/pdfService.js`) and placeholder state in new production components inflate the count.
- **Follow-up**: trim unused mock data, or prefix intentional placeholders with `_`. Prioritise server workers to unblock API lint gates before UI sweeps.

### 2. Fast Refresh Export Shape (`react-refresh/only-export-components`)
- Providers and shared primitives still export helper constants alongside components (`src/auth/BulletproofAuthProvider.jsx`, `src/auth/DevelopmentAuthProvider.jsx`, `src/components/ErrorBoundary.jsx`, `src/components/ui/{badge.jsx,button.jsx}`).
- **Follow-up**: extract shared helpers to adjacent utility files or colocate them inside component bodies.

### 3. Hook Dependency Hygiene (`react-hooks/exhaustive-deps`, `react-hooks/rules-of-hooks`)
- Missing deps in `src/auth/BulletproofAuthProvider.jsx` and working-capital mega-pages.
- One rules-of-hooks violation persists in `src/hooks/useAuthRole.jsx` (hook invoked in helper function).
- **Follow-up**: refactor helper composition; either convert helpers into proper hooks or pass required dependencies.

### 4. Syntax/Parsing Issues (ESLint `unknown`)
- ✅ **RESOLVED**: `src/pages/supply-chain/SupplierPerformance.jsx` line 382 parsing error fixed (escaped `<` character in JSX)

## Recently Resolved (Commit: 135da490)
- ✅ `no-undef` (`process` references) eliminated by importing Node built-in `process` in server-side modules and updating ESLint globals
- ✅ **SupplierPerformance.jsx parsing error** - Fixed JSX syntax error at line 382 (changed `<3★` to `&lt;3★`)
- ✅ **Worker unused variables** - Cleaned up unused parameters in:
  - `server/workers/AnalyticsWorker.js` - Added eslint-disable for unused params
  - `server/workers/ForecastWorker.js` - Prefixed unused destructured params with underscores
  - `server/workers/NotificationWorker.js` - Added eslint-disable for message parameter

## Tracking & Next Actions
- Continue using this doc to log progress; annotate sections with commit hashes as clusters are cleared.
- Suggested sequencing:
  1. ✅ ~~Fix parsing error in Supplier Performance to restore linting on that page~~ (Done: 135da490)
  2. ✅ ~~Clean unused vars in server/workers~~ (Done: 135da490)
  3. Clean remaining unused vars in server/API files (`server/api/dashboard.js`, `server/queues/QueueManager.js`, `server/routes/auth.js`)
  4. Clean unused vars in UI components (64 remaining, concentrated in comprehensive pages)
  5. Address hook dependency warnings (4 total) in auth providers and working capital pages
  6. Tackle fast-refresh export warnings (13 total) once logic is stable
