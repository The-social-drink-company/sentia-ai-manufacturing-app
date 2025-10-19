# Test Backlog Tracker

_Last updated: 2025-10-19 (Command: `pnpm test -- --run`)_

Summary of the latest Vitest run:
- **4 suites passed**, 3 suites skipped (App, API inventory, scenario-modeler)
- **12 tests passed**, 1 test skipped inside `tests/unit/services/approval-engine.test.js`
- Legacy landing page tests were migrated to `tests/unit/landing/` and now execute normally.

## Skipped Suites

| Suite | Reason | Unblocker |
| --- | --- | --- |
| `tests/unit/App.test.jsx` | Entire file stubbed with `describe.skip` because React Testing Library helpers were removed. | Reinstall `@testing-library/react` + `@testing-library/jest-dom`, recreate smoke tests, and remove the skip. |
| `tests/unit/api-inventory.test.jsx` | Stubbed with `describe.skip`; supertest harness removed during cleanup. | Reintroduce supertest-based API fixtures (or switch to Fastify inject), then restore coverage. |
| `tests/unit/services/scenario-modeler.test.js` | Deprecated suite waiting on finance services to stabilise. | Update imports to the new `server/services/finance/ScenarioModeler.js` API and replace placeholders. |

## Skipped Test Cases

- `tests/unit/services/approval-engine.test.js` → `it.skip('auto-approves low risk requests inside the limit')`
  - Disabled while logger mocks and service wiring were in flux.
  - **Action**: Confirm the low-risk evaluation path still returns `auto_approved` and re-enable the case.

## Immediate Follow-ups
1. Restore the `ApprovalEngine` low-risk unit test once service mocks settle.
2. Decide whether to revive the API inventory suite via supertest or cover endpoints with integration tests.
3. Plan the React Testing Library setup so the top-level `App` suite can validate routing and providers.
4. For the scenario modeler, align tests with the new finance orchestrator functions and seed representative fixtures.

## Historical Snapshot
- 2025-10-19: First stable run since BMAD finance services landed; Vitest completes with skips instead of hard failures.