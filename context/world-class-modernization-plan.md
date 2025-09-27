# World-Class Modernization Blueprint

## 1. Executive Summary
The Sentia Manufacturing Dashboard repository is partially migrated and currently lacks a stable engineering foundation: dependency installs fail, the git metadata appears absent in the working directory, and numerous feature modules exist in varying stages of completion. This blueprint defines a comprehensive transformation program to elevate the codebase, delivery pipeline, and operational posture to enterprise-grade standards.

## 2. Current-State Findings
- **Version Control**: .git directory missing locally; must restore to ensure history, branching, and CI integration.
- **Dependency Management**: pnpm-lock.yaml absent/outdated; npm/pnpm installs fail on Windows due to path and filesystem errors; Render builds fail with ERR_PNPM_OUTDATED_LOCKFILE.
- **Repository Hygiene**: Root contains orphaned legacy/ and .vite/ folders; README displays mojibake; inconsistent tooling configs.
- **Architecture**: Feature folders (executive, working-capital, inventory, production, orecasting, i-analytics) exist but implementations are incomplete and partially duplicated.
- **Testing**: Vitest/Playwright suites referenced but cannot be executed; coverage claims in README likely stale.
- **Security & Compliance**: Allow-listing of postinstall scripts, missing audit log coverage, unverified third-party integrations.
- **Documentation**: Multiple strategic docs exist (
ew-repo-implementation-plan.md, specs) but lack linkage to actionable work tracking.

## 3. Transformation Objectives
1. Restore repository integrity and deterministic builds across dev/CI/production.
2. Enforce high engineering standards (lint, types, tests, coverage, DORA metrics).
3. Deliver feature parity across executive, working-capital, inventory, production, forecasting, and AI analytics surfaces.
4. Implement resilient data orchestration, security hardening, and observability.
5. Enable enterprise deployment workflows (Render + optional self-host), with documented runbooks and SLOs.

## 4. Strategic Pillars & Workstreams
### Pillar A – Engineering Foundations
1. Restore .git metadata from a fresh clone; reapply pending changes via patches if necessary.
2. Standardize tooling: Node 24.4.1, pnpm 9.x, Volta/Corepack config, consistent .nvmrc/.node-version.
3. Regenerate pnpm-lock.yaml and package-lock.json in a Linux environment; enforce CI guard (pnpm install --frozen-lockfile).
4. Clean repository tree: remove orphan legacy/ artifacts, relocate .vite cache to gitignored paths, validate .gitignore.
5. Refresh README and documentation to remove corrupted characters and reflect accurate stack info.

### Pillar B – Build, Test, and Quality Automation
1. Reinstate Vitest + Playwright suites; triage failing tests; reach =80% coverage on critical modules.
2. Add lint/type/test steps to CI (GitHub Actions); block merges on failures.
3. Introduce pnpm lint-staged + Husky pre-commit gating; verify cross-platform support via WSL runner.
4. Establish golden-path seed data and deterministic unit fixtures.
5. Instrument coverage reporting (Codecov/Sonar) and track trendlines.

### Pillar C – Feature Completion & UX Excellence
1. **Executive Dashboard**: finalize SSE-driven KPIs, drill-down flows, exports, role-based filters.
2. **Working Capital**: AR/AP aging, cash conversion analytics, Xero connector stubs, audit logging.
3. **Inventory**: Stock telemetry, reorder intelligence, Unleashed API abstraction, supplier scoring.
4. **Production**: OEE, scheduling, capacity, IoT telemetry adapters, shift handover workflows.
5. **Forecasting & AI Analytics**: Background job orchestration, model training, explainability UI, cost guards.
6. Conduct UX review against enterprise accessibility (WCAG 2.1 AA) and responsiveness checklists.

### Pillar D – Data, Integrations, and Security
1. Build ingestion layer with retryable jobs (BullMQ) for Shopify, Amazon SP-API, Unleashed, Xero.
2. Harden Prisma schema: add migrations, referential integrity, row-level security patterns where applicable.
3. Implement secrets management (Render environment, .env.example), rotate keys.
4. Enforce RBAC, audit trails (Clerk events + domain audit tables), and data retention policies.
5. Run dependency vulnerability scans (npm audit, Snyk) and remediate high severity issues.

### Pillar E – Observability, Performance, and Operations
1. Add structured logging (Winston + OpenTelemetry), log correlation IDs, and consistent error envelopes.
2. Implement metrics dashboards (Prometheus/Prom-Client + Grafana/DataDog) for API latency, job success, SSE health.
3. Load/perf test critical paths (k6/Artillery) -> ensure <200 ms API median, <2s dashboard render.
4. Configure Render deploy pipeline: staged environments (dev/staging/prod), canary toggles, rollback procedures.
5. Create operational runbooks, on-call rotation plans, incident response checklists, backup/restore drills.

## 5. Phased Roadmap & Milestones
| Phase | Duration | Focus | Key Exit Criteria |
|-------|----------|-------|--------------------|
| 0. Stabilize | Week 1 | Git + lockfiles, WSL-based installs, baseline lint/type/test | CI green, README refreshed, plan ratified |
| 1. Foundation | Weeks 2-3 | Tooling, code hygiene, QA harness | Automated gates enforced, coverage baseline established |
| 2. Feature Vertical 1 | Weeks 3-4 | Executive + Working Capital | Features functional with mock data, 80% coverage |
| 3. Feature Vertical 2 | Weeks 4-5 | Inventory + Production | Feature parity, scenario tests, UX sign-off |
| 4. AI & Data Orchestration | Weeks 5-6 | Forecasting hub, integrations | Data SLAs met, AI explainability delivered |
| 5. Security & Ops Hardening | Weeks 6-7 | Compliance, observability, SRE | Pen-test closed, runbooks approved |
| 6. Launch & Hypercare | Weeks 7-8 | UAT, performance, go-live, support transition | Production release with SLO monitoring |

## 6. Governance & Tracking
- **Program Management**: Establish weekly steering reviews, burndown dashboards, risk register (RAID).
- **Work Tracking**: Break workstreams into epics/stories; integrate with Jira/Linear; link to specs & PRDs.
- **Definition of Done**: Code reviewed, tests passing, docs updated, security scan clean, deployment verified.
- **Communication**: Publish bi-weekly stakeholder updates summarizing progress, risks, and decisions.

## 7. Immediate Action Checklist
1. Clone repo afresh to recover .git; branch from development.
2. In WSL/Docker: run corepack enable + pnpm install to regenerate lockfiles; commit.
3. Restore .gitignore, remove stray build artifacts (.vite/, cached 
ode_modules).
4. Validate pnpm run lint, pnpm run typecheck, pnpm run test; document failures and create tickets.
5. Align technical docs (plan, implementation status) with updated roadmap; circulate for sign-off.

## 8. Success Metrics
- **Engineering**: <5% flaky test rate, <1h MTTR on pipeline failures, >85% coverage on core modules.
- **Product**: Feature usage KPIs defined per persona, NPS feedback loop.
- **Operational**: 99.9% uptime target, <200ms API latency p95, cost of goods analytics delivered weekly.
- **Security**: Zero critical vulns, quarterly pen-test pass, SOC2-aligned controls documented.

