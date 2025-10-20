# BMAD-QA-004: Onboarding Wizard Regression Scenario

**Epic**: EPIC-003 – Frontend Polish & UX Enhancement
**Story ID**: BMAD-QA-004
**Priority**: HIGH (Regression Coverage)
**Estimated Effort**: 1 day baseline → 3-4 hours with BMAD velocity
**Dependencies**: Backend contract confirmation for `currentStep` (pending)
**Status**: READY FOR QA REVIEW

---

## Story Description

Author an end-to-end Playwright flow that validates the trial onboarding wizard after the recent persistence and UX fixes. The scenario must prove that progress survives refreshes, skips record correctly, and the dashboard celebration/tour trigger only fires when onboarding completes successfully.

### Business Value

- **Regression Safety**: Locks in the reliability work so future UI changes cannot silently break onboarding.
- **User Confidence**: Ensures tenants that refresh or skip do not get trapped in the wizard.
- **Deployment Gate**: Adds automated coverage to catch backend/front-end contract drift around onboarding progress APIs.

### Current State

- No Playwright coverage exists for the trial onboarding wizard.
- Manual QA verifies the flow sporadically; regressions have slipped through (e.g., `currentStep` overshoot).
- Toast notifications and persistence handling were recently added without automated validation.

### Desired State

- Playwright scenario runs in CI (flagged `@onboarding`), covering completion, skip, and refresh sequences.
- Test asserts server state via API stubs/fakes and ensures the dashboard query parameters render celebration behaviour.
- Scenario becomes part of release checklist for trial onboarding changes.

---

## Acceptance Criteria

### AC1: Completion Flow Coverage
**Given** a trial tenant starts at `/trial-onboarding`
**When** they complete all four steps (with sample data generation)
**Then** the test must assert:
- Progress API receives monotonically increasing `currentStep` values ≤ 3.
- The completion API returns success and redirect location.
- Browser ends at `/dashboard?onboarding=complete&tour=auto` and confetti/tour triggers fire once.

**Status**: ⏳ Pending

---

### AC2: Refresh Persistence Coverage
**Given** the user completes step 2 and refreshes the page
**When** the wizard reloads
**Then** it resumes on step 3 with previous data hydrated, showing the integration import option when applicable.

**Status**: ⏳ Pending

---

### AC3: Skip Flow Coverage
**Given** the user selects “Skip onboarding and explore on your own”
**When** the skip API succeeds
**Then** the test must assert that:
- Toast confirmation appears.
- Browser redirects to `/dashboard` without query parameters.
- Subsequent visit to `/trial-onboarding` immediately redirects back to the dashboard.

**Status**: ⏳ Pending

---

## Technical Context

### Test Implementation Notes

- Implemented dedicated Playwright spec (`tests/e2e/onboarding-wizard.spec.ts`).
- Utilises Playwright route mocks to capture onboarding API interactions and mutate server state.
- Tagged with `@onboarding` for selective execution (`npx playwright test --grep @onboarding`).

### Evidence

- ✅ Playwright run: `npx playwright test tests/e2e/onboarding-wizard.spec.ts --project=chromium --reporter=list`
  - Output: `3 passed (21.7s)`
- ✅ Trace/video artefacts stored under `test-results/` for CI review.
- Mock onboarding APIs using MSW or Playwright route handlers to capture requests/responses.
- Use `expect.poll` for toast visibility and SSE-driven UI effects.
- Tag scenario with `@onboarding` and `@smoke` for dashboard release gating.
- Ensure sample data generation stub returns `{ success: true, data: {...} }` so wizard advances naturally.

### CI Integration

- Add story to `tests/README.md` coverage table once implemented.
- Wire into Playwright smoke command (`pnpm run test:e2e --project=chromium --grep @onboarding`).

---

## BMAD Workflow Notes

- Story queued pending backend confirmation of `currentStep` semantics; if contract changes, update expectations before implementation.
- Once greenlit, run through `bmad dev dev-story` → `bmad qa review-story` with artifacts attached (Playwright trace + video).
