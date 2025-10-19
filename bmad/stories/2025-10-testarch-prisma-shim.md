# BMAD-QA-003: Provide Prisma Test Shim for Admin Services

**Epic**: EPIC-004 - QA Automation Hardening
**Sprint**: Sprint 1 - Test Infrastructure Stabilization
**Status**: ⏳ PENDING
**Story Points**: 2
**Priority**: P1 - High

## Story Description

As a QA engineer, I need to supply a test-friendly Prisma client shim so that admin service unit tests can import server/lib/prisma.js during Vitest execution. The current tests (	ests/unit/services/admin/ApprovalService.test.js and MfaService.test.js) fail because the module path cannot be resolved under Vitest's environment.

## Acceptance Criteria

- [ ] server/lib/prisma.js export available to Vitest (real client or stub)
- [ ] Admin service unit tests execute without import-resolution errors
- [ ] Vitest run reports 0 failed suites in 	ests/unit/services/admin/*
- [ ] TestArch report reflects passing admin service tests

## Implementation Notes

1. Create an ESM-compatible Prisma client wrapper (server/lib/prisma.js) or adjust Vitest aliases (itest.config.js) to mock the module
2. Provide Jest-style mock via i.mock if full Prisma is not required
3. Ensure tests do not reach production database connections; use in-memory or stub

## Risks / Dependencies

- Careful to avoid connecting to live databases during tests
- Align with Prisma schema used by admin services
