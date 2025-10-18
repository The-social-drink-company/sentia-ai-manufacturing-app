# Lint Backlog Tracker

_Last updated: 2025-02-15 00:00 UTC_

Command executed: `npx eslint src server --ext .js,.jsx`

Summary:
- 178 total issues (161 errors, 17 warnings)
- Blocking rules (need fixes before CI passes):
  1. `no-undef` – 108 hits
  2. `no-unused-vars` – 51 hits
- Advisory warnings for hot reload and hooks hygiene remain but do not break builds.

## Issue Clusters

### 1. Missing Runtime Globals (`no-undef`)
- Concentrated in `src/config/server-config.js` (83 spots), `src/server.js` (23), and `src/services/mcpClient.js`.
- All references are to `process.*`, indicating the Node environment globals are not declared in ESLint.
- **Follow-up**: decide between adding `eslint-env node` blocks (preferred for server-only files) or extending the config to recognize Node globals.

### 2. Unused Variables and Parameters (`no-unused-vars`)
- Spread across worker and API scaffolding: `server/workers/{AnalyticsWorker.js,ForecastWorker.js,NotificationWorker.js}`, `server/api/dashboard.js`, `server/routes/auth.js`.
- UI layers also flag unused data helpers (`src/components/widgets/StockLevelsWidget.jsx`, `src/components/financial/FinancialInsights.jsx`, `src/pages/forecasting/*.jsx`).
- **Follow-up**: prune placeholder variables or prefix intentional placeholders with `_`. Review generated sample-data helpers for actual usage before removal.

### 3. Hook Dependency Hygiene (`react-hooks/exhaustive-deps`, `react-hooks/rules-of-hooks`)
- Missing dependencies in `src/auth/BulletproofAuthProvider.jsx`, `src/pages/WhatIfAnalysisComprehensive.jsx`, `src/pages/WorkingCapitalComprehensive.jsx`.
- One `react-hooks/rules-of-hooks` hit in `src/hooks/useAuthRole.jsx` where `useAuth()` is called inside a non-hook helper.
- **Follow-up**: refactor helper composition—either rename to `useLoadAuth` and treat as hook, or move hook usage into components.

### 4. Fast Refresh Export Shape (`react-refresh/only-export-components`)
- Providers (`src/auth/BulletproofAuthProvider.jsx`, `src/auth/DevelopmentAuthProvider.jsx`) and shared primitives (`src/components/ErrorBoundary.jsx`, `src/components/ui/{badge.jsx,button.jsx}`) export helper constants alongside components.
- **Follow-up**: split helpers into adjacent utility files or colocate them inside the component where possible.

## Tracking & Next Actions
- This document is the living tracker for lint remediation across working-capital + forecasting surfaces.
- Suggested sequencing:
  1. Update ESLint config or per-file directives for server-side `process` globals to unblock the bulk of errors.
  2. Sweep through unused vars in API/worker scaffolding before touching UI (low risk, high signal).
  3. Schedule a dedicated pass on hook hygiene before enabling hot reload warnings as errors.
- When a cluster is resolved, annotate the relevant section with the commit hash and date.
