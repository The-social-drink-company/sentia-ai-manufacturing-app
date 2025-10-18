# Lint Backlog Tracker

_Last updated: 2025-02-15 00:00 UTC_

Command executed: `npx eslint src server --ext .js,.jsx`

Summary:
- 90 total issues (73 errors, 17 warnings)
- Dominant rule: `no-unused-vars` – 70 hits across analytics, production, and PDF helpers.
- Warning-only rules remain (`react-refresh/only-export-components`, `react-hooks/exhaustive-deps`).

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
- `src/pages/supply-chain/SupplierPerformance.jsx` throws a parsing error at line 382 (likely stray character in mock data).
- **Follow-up**: inspect the offending block and correct JSX/JSON syntax to restore lint coverage.

## Recently Resolved
- `no-undef` (`process` references) eliminated by importing Node built-in `process` in server-side modules and updating ESLint globals.

## Tracking & Next Actions
- Continue using this doc to log progress; annotate sections with commit hashes as clusters are cleared.
- Suggested sequencing:
  1. Fix parsing error in Supplier Performance to restore linting on that page.
  2. Clean unused vars in server/API workers (`server/workers/*.js`, `server/api/dashboard.js`).
  3. Address hook warnings, then tackle fast-refresh exports once logic is stable.
