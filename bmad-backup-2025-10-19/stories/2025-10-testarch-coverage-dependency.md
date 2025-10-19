# BMAD-QA-001: Install Vitest Coverage Dependency

**Epic**: EPIC-004 - QA Automation Hardening
**Sprint**: Sprint 1 - Test Infrastructure Stabilization
**Status**: ⏳ PENDING
**Story Points**: 1
**Priority**: P0 - Critical

## Story Description

As a developer, I need to add the @vitest/coverage-v8 dependency so that TestArch workflows can collect coverage metrics during full and ci_cd automation modes. Without this package, coverage generation fails immediately and quality gates cannot be evaluated.

## Acceptance Criteria

- [ ] @vitest/coverage-v8 listed under devDependencies in package.json
- [ ] pnpm install executed to update pnpm-lock.yaml
- [ ] pnpm vitest run --coverage --reporter=verbose completes without missing-dependency errors
- [ ] Coverage JSON/HTML artifacts written to coverage/ directory
- [ ] TestArch workflow ci_cd mode captures coverage metrics in the generated report

## Implementation Notes

1. Add dependency
   `ash
   pnpm add -D @vitest/coverage-v8
   `
2. Verify install updates lockfile
3. Re-run TestArch automate workflow in ci_cd mode to confirm coverage output
4. Capture coverage thresholds in itest.config.js if needed for gates

## Risks / Dependencies

- Requires network access to npm registry (obtain approval if restricted)
- Must run pnpm install to keep lockfile in sync
- Coverage reports may require additional disk space in CI
