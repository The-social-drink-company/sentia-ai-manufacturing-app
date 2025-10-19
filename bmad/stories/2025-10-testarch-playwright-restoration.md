# BMAD-QA-002: Restore Playwright E2E Test Capability

**Epic**: EPIC-004 - QA Automation Hardening
**Sprint**: Sprint 1 - Test Infrastructure Stabilization
**Status**: ⏳ PENDING
**Story Points**: 2
**Priority**: P0 - Critical

## Story Description

As a QA engineer, I need to install @playwright/test and ensure browsers are provisioned so that TestArch workflows can execute E2E tests in ull and ci_cd modes. Currently the command pnpm playwright test fails because Playwright is not installed, preventing coverage of critical user flows.

## Acceptance Criteria

- [ ] @playwright/test added to devDependencies in package.json
- [ ] pnpm exec playwright install --with-deps (or platform-equivalent) executed to provision browsers
- [ ] pnpm playwright test executes successfully locally
- [ ] Playwright configuration references installed browsers with no skips
- [ ] TestArch workflow ull/ci_cd modes include E2E results in the generated report

## Implementation Notes

1. Install package
   `ash
   pnpm add -D @playwright/test
   pnpm exec playwright install --with-deps
   `
2. Validate playwright.config.js and playwright.config.ts point to correct test directories
3. Ensure CI pipeline includes Playwright cache steps if applicable
4. Update documentation (CLAUDE.md / README) with new setup instructions

## Risks / Dependencies

- Requires network permission to download NPM package and browser binaries
- Additional CI runtime due to browser downloads; cache as appropriate
- Ensure environment supports headless Chromium/Firefox/WebKit
