# BMAD Progress Log – Onboarding Wizard Hardening

**Date**: 2025-03-14
**Phase**: Implementation (Level 4)
**Focus**: Trial Onboarding Wizard reliability fixes

## Summary

- Aligned the new onboarding flow with backend expectations by preventing the wizard from persisting an out-of-range `currentStep` value and redirecting finished tenants back to the dashboard.
- Surfaced backend errors to the UI and allowed tenants to skip onboarding through the official API so state remains consistent across refreshes.
- Re-enabled the integration data import option by wiring the saved integration list into `DataImportStep`, and added inline error feedback when sample-data generation fails.

## File Updates

- `src/pages/onboarding/OnboardingWizard.tsx`
  - Clamp saved step indices, gate completion persistence, and redirect for already-completed tenants.
  - Added onboarding skip handler and surfaced completion errors in the UI.
  - Passed integration selections through to the data import step and exposed an error banner region.
- `src/pages/onboarding/steps/DataImportStep.tsx`
  - Display inline error messaging for sample data generation failures.

## Open Questions / Next Checks

1. Confirm with backend whether `currentStep` should represent the next step to display or the last completed step (current implementation uses the “next step” convention).
2. Add toast-based notifications for all onboarding API errors to match the broader design system.
3. Consider e2e coverage for skip/refresh flows once Playwright suites are stable.

