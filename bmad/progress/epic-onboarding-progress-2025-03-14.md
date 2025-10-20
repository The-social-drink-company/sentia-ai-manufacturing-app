# BMAD Progress Log – Onboarding Wizard Hardening

**Date**: 2025-03-14
**Phase**: Implementation (Level 4)
**Focus**: Trial Onboarding Wizard reliability fixes

## Summary

- Aligned the new onboarding flow with backend expectations by preventing the wizard from persisting an out-of-range `currentStep` value and redirecting finished tenants back to the dashboard.
- Surfaced backend errors to the UI (toast notifications) and allowed tenants to skip onboarding through the official API so state remains consistent across refreshes.
- Re-enabled the integration data import option by wiring the saved integration list into `DataImportStep`, and added inline + toast feedback when sample-data generation fails.
- Authored and executed BMAD-QA-004 Playwright regression coverage (`tests/e2e/onboarding-wizard.spec.ts`).

## File Updates

- `src/App-simple-environment.jsx`
  - Mount Sonner `Toaster` so onboarding notifications render globally.
- `src/pages/onboarding/OnboardingWizard.tsx`
  - Clamp saved step indices, gate completion persistence, and redirect for already-completed tenants.
  - Added onboarding skip handler and toast-based success/error feedback for all API paths.
  - Passed integration selections through to the data import step.
- `src/pages/onboarding/steps/DataImportStep.tsx`
  - Display inline + toast error messaging for sample data generation and acknowledge integration import selection.

## Open Questions / Next Checks

1. Confirm with backend whether `currentStep` should represent the next step to display or the last completed step (current implementation uses the “next step” convention).
2. Consider e2e coverage for skip/refresh flows once Playwright suites are stable.

## Immediate Next Actions

- [ ] Schedule backend sync to lock down onboarding progress contract (owner: Platform team).
- [ ] Draft Playwright scenario covering skip + refresh + completion paths; enqueue once core suite is green (owner: QA).
