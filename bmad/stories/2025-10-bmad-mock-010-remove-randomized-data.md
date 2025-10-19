# BMAD-MOCK-010: Eliminate Remaining Math.random() Mock Data

**Epic**: EPIC-002 - Eliminate All Mock Data
**Sprint**: Sprint 2 - Order & Inventory Data
**Status**: ⏳ PENDING
**Story Points**: 5
**Priority**: P0 - Critical

## Story Description

As a developer, I need to remove the remaining Math.random() driven mock data from production React components and services so that dashboards display deterministic or live data. TestArch flagged ~80 files still synthesizing trends, KPI values, and integration metrics, which violates the BMAD mock data policy.

## Acceptance Criteria

- [ ] Inventory of all Math.random() occurrences in src and services reviewed and triaged
- [ ] Financial dashboards (e.g., DashboardEnterprise.jsx, EnterpriseAIChatbot.jsx, APIIntegration.js) return real or deterministic fallback values
- [ ] Admin/System panels show explicit "data unavailable" messaging instead of simulated metrics
- [ ] Forecasting and ML services gated behind feature flags or real datasets (no random coefficients)
- [ ] TestArch architecture validation passes without mock data violations

## Implementation Notes

1. Use g "Math.random" src services to identify offenders
2. Replace with:
   - Real integration calls (Xero, Shopify, Amazon, Unleashed)
   - Cached deterministic sample datasets for demos
   - Explicit empty state components with setup prompts
3. Update unit tests to reflect deterministic outputs
4. Document replacements in BMAD implementation log

## Risks / Dependencies

- Requires coordination with integration stories (BMAD-MOCK-002..007)
- UI empty states must be handled gracefully to avoid regressions
- Some modules may need feature flags until live data available
