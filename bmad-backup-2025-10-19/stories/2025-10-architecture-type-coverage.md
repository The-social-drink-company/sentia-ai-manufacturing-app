# BMAD-ARCH-012: Add Type/JSDoc Coverage for Finance & Integration Services

**Epic**: EPIC-003 - Architecture Compliance
**Sprint**: Sprint 1 - Service Hardening
**Status**: ⏳ PENDING
**Story Points**: 3
**Priority**: P1 - High

## Story Description

As an architect, I need to add TypeScript or comprehensive JSDoc annotations to the finance and integration services so that architecture validation passes the type documentation requirement. Files such as server/services/finance/ApprovalEngine.js and src/services/APIIntegration.js currently export untyped functions, making it difficult to maintain enterprise-grade contracts.

## Acceptance Criteria

- [ ] Finance services under server/services/finance/ include JSDoc or TypeScript definitions for public APIs
- [ ] Integration clients (src/services/APIIntegration.js, services/integration/UnifiedApiClient.js) expose typed interfaces and parameter docs
- [ ] Linting passes with no @typescript-eslint/explicit-function-return-type or equivalent warnings (if enabled)
- [ ] TestArch architecture validation reports "Type Safety" as compliant
- [ ] Documentation updated in BMAD-METHOD-V6A-IMPLEMENTATION.md metrics

## Implementation Notes

1. Consider migrating key modules to .ts/.cts or adding JSDoc @typedef blocks
2. Align types with existing Prisma models and API schemas
3. Update unit tests to ensure typed exports remain stable
4. Run pnpm lint and pnpm vitest run after changes

## Risks / Dependencies

- Mixed module system (ESM/CJS) requires careful migration
- JSDoc must remain ASCII to comply with logging standards
- Coordinate with ongoing integration development to avoid merge conflicts
