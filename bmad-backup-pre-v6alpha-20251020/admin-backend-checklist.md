# Admin Backend Implementation Checklist (BMAD)

## Phase 1 – Foundation
- [ ] Create `server/routes/admin/index.js` with Express router.
- [ ] Add auth middleware (Clerk session -> internal admin role).
- [ ] Add MFA middleware leveraging `admin_mfa_challenges` table.
- [ ] Generate Prisma migrations for admin tables listed in plan.
- [ ] Scaffold AuditLogger utility and plug into middleware.

## Phase 2 – Core Flows
- [ ] `/admin/users` CRUD controllers using Prisma + Clerk API.
- [ ] `/admin/roles` endpoints (list, permissions, assignment history).
- [ ] `/admin/approvals` endpoints + BullMQ worker + notification hooks.
- [ ] `/admin/audit` endpoints (list, details, export).

## Phase 3 – Operational Modules
- [ ] `/admin/feature-flags` endpoints (store toggles, history, approvals).
- [ ] `/admin/integrations` endpoints (health, manual sync, rotate key).
- [ ] `/admin/queues` endpoints (stats, retry, pause/resume, clean).
- [ ] `/admin/system-health` endpoints (metrics, alerts configuration).

## Phase 4 – Environment Management
- [ ] `/admin/environment` endpoints (config fetch, proposal, deployment history, rollback).
- [ ] Config rollout worker and secret masking utilities.

## Phase 5 – Hardening & QA
- [ ] MFA service integration tests + rate limiting.
- [ ] End-to-end approval flow tests (Vitest + supertest).
- [ ] Observability dashboards (logs, metrics) for admin operations.
- [ ] Security review: ensure secrets never leave backend unmasked.
