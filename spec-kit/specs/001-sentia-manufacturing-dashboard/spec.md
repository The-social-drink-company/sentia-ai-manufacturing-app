# Feature Specification: Sentia Manufacturing Dashboard

**Feature Branch**: `001-sentia-manufacturing-dashboard`  
**Created**: 2025-09-22  
**Status**: Production  
**Input**: Enterprise manufacturing dashboard with working capital intelligence, what-if analysis, and AI-powered insights

## Execution Flow (main)

```
1. Parse enterprise requirements
   - Manufacturing company needs real-time visibility
2. Extract key concepts
   - Actors: Admin, Manager, Operator, Viewer
   - Actions: Monitor KPIs, analyse scenarios, optimise capital
   - Data: Financial metrics, production data, inventory levels
   - Constraints: Enterprise security, real-time updates
3. Define user workflows
   - Dashboard navigation, data import, report generation
4. Generate functional requirements
   - Each requirement testable via UI or API
5. Identify key entities
   - WorkingCapital, WhatIfScenario, DemandForecast
6. Run review checklist
   - All requirements verified against implementation
7. Return: SUCCESS (spec implemented and deployed)
8. Repository baseline refreshed (2025-09-25 clone) to restore lint compliance
```

---

## User Scenarios and Testing

### Primary User Story

As a manufacturing operations manager, I need a comprehensive dashboard that provides real-time visibility into working capital, production metrics, and financial scenarios so that I can make data-driven decisions to optimise cash flow and operational efficiency.

### Acceptance Scenarios

1. **Given** the user is authenticated, **when** they access the dashboard, **then** they see real-time KPIs for current ratio, quick ratio, cash unlock potential, and annual improvement.
2. **Given** the manager role, **when** accessing the working capital page, **then** they can review AR/AP aging, inventory turnover, and cash conversion cycles.
3. **Given** the admin role, **when** navigating to what-if analysis, **then** they can adjust scenario sliders and observe the impact on financial metrics.
4. **Given** any user role, **when** backend data changes, **then** the dashboard updates in real time through SSE without a page refresh.

### Edge Cases

- System provides a fallback UI when the database connection is unavailable.
- Dashboard remains responsive with 1,000+ concurrent users.
- Export functionality supports datasets larger than 10 MB.
- Mobile responsive design adapts to tablet and handset breakpoints.

## Requirements

### Functional Requirements

- **FR-001**: Provide role-based access control with Admin, Manager, Operator, and Viewer roles.
- **FR-002**: Display real-time KPI widgets for critical financial metrics.
- **FR-003**: Enable navigation between Dashboard, Working Capital, What-If Analysis, and supporting modules.
- **FR-004**: Integrate with external APIs (Xero, Shopify, Amazon SP-API, Unleashed).
- **FR-005**: Support data import from spreadsheets and APIs.
- **FR-006**: Offer export functionality for reports in JSON and CSV formats.
- **FR-007**: Deliver real-time updates via Server-Sent Events.
- **FR-008**: Provide AI-powered analytics and forecasting capabilities.
- **FR-009**: Maintain an audit trail for all data modifications.
- **FR-010**: Support three deployment environments (development, test, production).

### Key Entities

- **WorkingCapital**: Captures financial metrics including current assets, liabilities, AR/AP aging.
- **WhatIfScenario**: Stores scenario models with adjustable parameters and derived impacts.
- **DemandForecast**: Holds predictive analytics for inventory and production planning.
- **User**: Represents authenticated actors with Clerk-managed roles and permissions.
- **Dashboard**: Persists widget layout, preferences, and state per user.

---

## Implementation Lessons Learned

### Critical Success Factors

- Navigation system uses an enterprise sidebar with keyboard shortcuts (G+O, G+F, G+I).
- All button interactions have functional handlers and telemetry.
- Git workflow enforces development -> test -> production promotion with PR review.
- AI integration relies on the MCP server coordinating multiple providers.

### Known Issues Resolved

- Railway environment variables now load reliably via explicit configuration.
- Resolved port conflicts that caused EADDRINUSE errors.
- Patched eight security vulnerabilities including critical `xlsx` issues.
- Optimised build performance to 9-11 seconds through code splitting.

### Architecture Decisions

- **Frontend**: React 18 + Vite 4 + Tailwind CSS with strategic memoisation.
- **Backend**: Node.js + Express with structured logging and rate limiting.
- **Database**: PostgreSQL with `pgvector` for AI embeddings.
- **Authentication**: Clerk with production domain configuration and RBAC.
- **Deployment**: Railway auto-deploy pipelines wired to Git branches.

---

## Review and Acceptance Checklist

### Content Quality

- [x] Business requirements avoid implementation detail creep.
- [x] Focus remains on user value and measurable outcomes.
- [x] All mandatory sections completed.

### Requirement Completeness

- [x] Requirements are testable and unambiguous.
- [x] Success criteria are measurable.
- [x] Scope is clearly bounded.
- [x] Dependencies documented (Clerk, Railway, external APIs).

---

## Execution Status

- [x] User requirements parsed.
- [x] Key concepts extracted.
- [x] User scenarios defined.
- [x] Requirements generated and implemented.
- [x] Entities identified and modelled.
- [x] Review checklist passed.
- [x] Deployed to production.

---

_Repository reset acknowledged: the 2025-09-25 clone is the lint-clean starting point for ongoing development._
