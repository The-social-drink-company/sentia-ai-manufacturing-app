# BMAD Story: Instrument Landing Page Analytics
- **Story ID**: BMAD-MKT-001
- **Epic**: Marketing Conversion & Insights
- **Owner**: Scrum Master (handoff to Dev/QA once scoped)
- **Status**: In Progress

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
- Wire events to analytics provider via existing analytics client abstraction.
- Add unit coverage for event dispatch (Vitest).

## Acceptance Criteria
- Events fire for hero visibility (once per session), primary CTA click, secondary CTA scroll, Clerk modal open.
- Event payload includes `{ eventName, timestamp, page, variant, userStatus }` and respects consent/env toggles.
- QA checklist for browser/device matrix verifies events in network inspector.
- Documentation updated with event catalog and instructions for marketing to view dashboards.

## Next Steps
1. Architect: Provide context on analytics stack, consent handling, and env configuration.
2. Developer: Implement instrumentation and tests.
3. QA: Validate events across browsers, both with and without consent.

## Blockers / Risks
- Need confirmation on analytics provider credentials before wiring to production.
- Ensure consent mechanism exists on landing page (follow-up story if absent).

## Status
Awaiting prioritization and developer assignment. Scrum Master to move story into backlog and schedule next BMAD cycle.

---
## Implementation Notes (2025-10-19)
- [x] Added `useLandingAnalytics` hook with consent-aware tracking and hero visibility observer.
- [x] Implemented `analyticsClient` abstraction handling Segment/web beacon fallback with env/consent guards.
- [x] Wired landing page CTAs and hero to analytics hook.
- [x] Added unit tests (`tests/unit/landing/analyticsClient.test.js`, `tests/unit/landing/useLandingAnalytics.test.jsx`).
- [x] Documented event catalog at `docs/analytics/landing-page-events.md` and appended QA checklist.
- [ ] Pending: Marketing dashboard wiring once ingestion endpoint is provisioned.
