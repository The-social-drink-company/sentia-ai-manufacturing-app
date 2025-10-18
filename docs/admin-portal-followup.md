# Admin Portal Follow-up Plan

_Last updated: 2025-02-15 00:00 UTC_

## Immediate Code Hygiene
- 2025-02-15: `src/pages/admin/AdminDashboard.jsx` linted clean (removed unused `useState` import, normalized icon props).
- 2025-02-15: `src/pages/supply-chain/SupplierPerformance.jsx` linted clean after replacing non-ASCII star glyphs.
- Re-run `npx eslint src/pages/admin/AdminDashboard.jsx src/services/api/adminApi.js` before major UI updates.
- 2025-02-15: `src/components/widgets/StockLevelsWidget.jsx`, `src/services/pdfService.js`, and `src/services/mcpClient.js` linted clean (fixed component closure, unused widths, and unused subscription args).
- 2025-02-15: `src/hooks/useAuthRole.jsx` now exposes a `useSafeClerkAuth` helper to avoid hook misuse while preserving development fallbacks.
- 2025-02-15: High-priority module sweep (FinancialInsights, ProductionJobBoard, pdfService, reportGenerator, dashboard API, error-handler) linted clean to keep `feature/import-export-foundation` stable.
- 2025-02-15: Admin navigation updated with /app/admin/users route and in-panel CTA.
- 2025-02-15: Mirrored `/app/admin/users` routing in App-environment-aware shell for deployment parity.
- 2025-02-15: App-root now lazy-loads the environment-aware shell so marketing -> app hand-off keeps admin routes accessible.
- 2025-02-15: `/app/admin/feature-flags` and `/app/admin/integrations` routes added across app shells for consistency.

## Frontend Component Roadmap
- UserManagement.jsx implemented with React Query backed CRUD, MFA prompts, and session insights.
- RoleManagement.jsx implemented with permission matrix editing, MFA gating, and assignment audit trail.
- FeatureFlags.jsx implemented with environment-aware toggles and live audit history.
- IntegrationManagement.jsx implemented for health monitoring, manual syncs, and credential rotation.
1. **QueueManagement.jsx** - Connect to BullMQ status endpoints for depth and throughput insights.
2. **AuditLogs.jsx** - Render immutable log stream with filters and export flow.
3. **SystemHealth.jsx** - Expand metrics into dedicated page with alert configuration.
4. **EnvironmentConfig.jsx** - Secure configuration editor with secret masking and step-up MFA.
5. **ApprovalRequest.jsx** - Form to initiate multi-step approval workflows.
6. **ApprovalQueue.jsx** - Reviewer dashboard with approve/deny actions and audit trail updates.

## Backend Dependencies
- Implement the admin API endpoints mapped in `src/services/api/adminApi.js`.
- Add MFA service (code generation/validation) with SMS or email providers.
- Create immutable audit logging middleware and persistence schema.
- Stand up approval workflow engine (state machine plus persistence).
- Extend SSE server with admin-focused channels for health, queue, and audit events.
- Provision database tables: `admin_users`, `admin_roles`, `admin_permissions`, `admin_feature_flags`, `admin_audit_logs`, `admin_approvals`, `admin_integrations`, `admin_queue_metrics`.

## Testing and Deployment
- Draft Vitest suites for admin API hooks and component interactions (mock SSE and MFA flows).
- Plan integration tests covering approval paths and destructive actions with MFA challenges.
- Document deployment prerequisites: environment variables for MFA providers, queue endpoints, and SSE origins.
