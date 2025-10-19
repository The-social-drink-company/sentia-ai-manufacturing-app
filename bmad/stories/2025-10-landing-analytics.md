# BMAD Story: Instrument Landing Page Analytics
- **Story ID**: BMAD-MKT-001
- **Epic**: Marketing Conversion & Insights
- **Owner**: Scrum Master (handoff to Dev/QA once scoped)
- **Status**: Planning

## Problem Statement
The landing page is live but uninstrumented. Without telemetry we cannot measure CTA engagement, scroll depth, or conversion signals, making future optimization speculative.

## Objectives
1. Capture key visitor interactions (hero view, primary/secondary CTA clicks, Clerk modal opens).
2. Ensure tracking honours privacy/consent requirements and degrades gracefully without environment secrets.
3. Provide dashboards/metrics to marketing & product stakeholders.

## Initial Scope
- Select analytics transport (prefer existing internal analytics bus; fall back to Segment blueprint if needed).
- Define event schema (event names, properties, user context) and document in `docs/analytics/landing-page-events.md`.
- Implement client-side instrumentation in `LandingPage.jsx` gated behind consent flag.
- Wire events to analytics provider via existing `analyticsClient` (or create minimal abstraction to avoid tight coupling).
- Add unit coverage for event dispatch (e.g., using Vitest + vi.fn mocks).

## Acceptance Criteria
- Events fire for hero visibility (once per session), primary CTA click, secondary CTA scroll, Clerk modal open.
- Event payload includes `{ eventName, timestamp, page, variant, userStatus }` and respects consent/ENV toggles.
- QA checklist for browser/device matrix verifies events in network inspector.
- Documentation updated with event catalog and instructions for marketing to view dashboards.

## Next Steps
1. Architect: Provide context on analytics stack, consent handling, and env configuration.
2. Developer: Implement instrumentation and tests.
3. QA: Validate events across browsers, both with and without consent.

---
## Architect Context
- Preferred transport: use existing `services/analytics/analyticsClient.js` (falls back to console in non-prod). If unavailable, create lightweight client sending POST to `/api/analytics` (already mocked).
- Consent: rely on `useEnvironmentAuth` + cookie banner. Add `ENABLE_ANALYTICS` env guard and respect `window.__sentiaConsent.analytics === true`.
- Event schema draft:
  - `landing_hero_viewed` (props: variant, viewportWidth, referrer)
  - `landing_primary_cta_clicked` (props: variant, buttonLabel)
  - `landing_secondary_cta_clicked` (props: targetSection)
  - `landing_signin_modal_opened` (props: triggerLocation)
- Document env vars: `VITE_ENABLE_ANALYTICS`, `VITE_ANALYTICS_WRITE_KEY` (if Segment), fallback to `ANALYTICS_ENDPOINT`.
- Non-blocking: expose hook `useLandingAnalytics()` to encapsulate logic.
## Implementation Outline
- Developer Tasks
  1. Create `src/hooks/useLandingAnalytics.js` wrapping consent check and analytics client dispatch.
  2. Update `LandingPage.jsx` to invoke analytics on hero intersect, CTA clicks, and Clerk modal open.
  3. Add unit tests under `tests/unit/landing/landing-analytics.test.jsx` verifying event dispatch.
  4. Update `.env.template` with analytics envs and guard code via `import.meta.env`.
- QA Tasks
  1. Validate events in browser devtools (Chrome, Safari, Edge) with consent enabled/disabled.
  2. Confirm no network calls when `ENABLE_ANALYTICS` false.
  3. Perform accessibility regression on CTA buttons after instrumentation.
  4. Sign off using updated QA checklist appended to `docs/deployment/render-deployment-quickstart.md` or new analytics doc.

## Blockers / Risks
- Need confirmation on analytics provider credentials before wiring to production.
- Ensure consent mechanism exists on landing page (follow-up story if absent).

## Status
Awaiting prioritization and developer assignment. Scrum Master to move story into backlog and schedule next BMAD cycle.
