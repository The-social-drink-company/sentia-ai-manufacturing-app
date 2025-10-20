# BMAD-INFRA-004: Render pgvector Extension Compatibility Remediation

**Story ID**: BMAD-INFRA-004
**Epic**: BMAD-INFRA-003 – Deployment Infrastructure Resolution
**Priority**: 🔥 Blocker
**Status**: 🚧 In Progress
**Created**: 2025-10-19
**Assignee**: AI Engineering Agent (Codex)
**Estimated Effort**: 1.5 hours

---

## User Story

**As a** DevOps engineer supporting the CapLiquify Manufacturing Platform deployments,
**I want** Prisma migrations to succeed against the Render production database without pgvector version conflicts,
**So that** deployment pipelines run uninterrupted and AI features depending on embeddings remain operational.

---

## Problem Statement

Render production deploys are currently failing during `prisma migrate deploy` with error `extension "vector" has no installation script nor update path for version "0.5.1"`. Prisma schema pins pgvector to version `0.5.1`, but the managed Render PostgreSQL instance exposes a different supported version. This hard pin causes all subsequent migrations to fail and blocks every deployment.

### Evidence

```
2025-10-19 16:21:31Z Error: P3018
Migration name: 20251017171256_init
Database error: extension "vector" has no installation script nor update path for version "0.5.1"
```

---

## Acceptance Criteria

- [x] Prisma datasource configuration no longer pins pgvector to an unavailable version.
- [ ] Database migrations execute successfully on Render (no pgvector version mismatch).
- [x] Documentation updated with Render-compatible pgvector guidance and verification steps.
- [ ] BMAD story updated with investigation notes, implemented changes, and QA verification checklist.
- [ ] Follow-up task recorded if production validation requires coordination with another developer.

---

## Phase Plan (BMAD-METHOD v6a)

### Phase 2 → Planning Snapshot
- Confirm current Render pgvector support range.
- Determine safest cross-environment configuration (likely version-agnostic).

### Phase 3 → Solutioning Summary
- Choose schema change: remove pinned version, retain mapping alias.
- Capture rollback plan (revert schema line, re-run migrate) if needed.

### Phase 4 → Implementation Tasks
1. Update `prisma/schema.prisma` datasource extension configuration.
2. Ensure migration SQL remains compatible (no explicit version strings).
3. Update Render deployment documentation with vector extension prerequisites.
4. Verify Prisma formatting/validation locally.
5. Coordinate production verification run post-merge.

---

## QA Checklist

- [ ] `pnpm exec prisma format` succeeds.
- [ ] `pnpm exec prisma studio --schema prisma/schema.prisma` (optional) launches locally.
- [ ] `pnpm exec prisma migrate deploy --preview-feature --schema prisma/schema.prisma` dry run (staging or development DB) completes.
- [ ] Render deploy run reviewed to confirm `prisma migrate deploy` completes without error.
- [ ] Embedding columns (`vector(1536)`) validated via introspection (`pnpm exec prisma db pull` against development DB).

_Note: Mark staging/production verification as pending if database access is restricted. Capture coordination steps in story updates._

---

## Communication & Dependencies

- Coordinate with infrastructure owner to obtain Render pgvector version details if unknown.
- Notify sibling developer(s) about schema change to avoid conflicting migrations.
- Ensure auto-commit agent picks up schema change once thresholds met.

---

## References

- Render Logs (2025-10-19): deployment failure when applying `20251017171256_init`.
- Prisma Docs: [Resolve migration issues](https://pris.ly/d/migrate-resolve).
- Internal Guide: `docs/render-deployment-guide.md` (to be updated).

---

## Updates

- **2025-10-19 16:30 UTC** – Story created, logs captured, remediation plan drafted.
- _Next_: Implement schema adjustment and documentation update.- **2025-10-19 17:05 UTC** – Removed pgvector version pin, refreshed Render deployment guide, added migration README tip, and ran  `pnpm exec prisma format`. Render prod validation pending once deployment reruns. 

