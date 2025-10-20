# Context Documentation - CapLiquify Manufacturing Platform

## Overview

This directory houses reference material that supports the CapLiquify Manufacturing Platform. Each subdirectory groups documents by purpose so engineers, designers, and operators can quickly locate the guidance they need while rebuilding the lint-clean baseline established on 2025-09-25.

## Directory Structure

### `business-logic/`

Core business rules, domain models, forecasting algorithms, and optimisation guides that drive the manufacturing workflows.

### `business-requirements/`

Stakeholder requirements, user acceptance criteria, delivery timelines, and enterprise rollout plans.

### `clerk-authentication/`

Clerk integration playbooks, configuration guides, and security notes for the primary identity provider.

### `database-schemas/`

Entity relationship diagrams, Prisma schemas, and migration guidelines that govern data storage.

### `deployment-configs/`

Render configuration, environment variable maps, process health checks, and observability runbooks.

### `development-methodology/`

Engineering processes, coding standards, Git workflow policies, testing strategies, and the **Repository Reset Log - 2025-09-25** that documents the fresh clone baseline.

### `environment-configuration/`

Environment setup notes for local, staging, and production systems, including required `.env` variables.

### `Original brief/`

The legacy product brief that informs scope, target personas, and high-level goals. Retained for historical context.

### `technical-specifications/`

System architecture, API design references, performance requirements, and security expectations.

### `testing-scenarios/`

Vitest and Playwright coverage plans, test matrices, and regression tracking for critical flows.

### `ui-components/`

Design system references, component inventories, and interaction guidelines for visual consistency.

### `what-the-screens-should-look-like/`

Annotated mocks, screen flows, and screenshot references for layout reconstruction.

## Key Documents

1. **`DEPLOYMENT_URLS.md`** � Environment URLs, health checks, and monitoring dashboards.
2. **`business-requirements/ENTERPRISE_IMPLEMENTATION_PLAN.md`** � Roadmap, prioritisation, and milestones.
3. **`CLERK_ENTERPRISE_IMPLEMENTATION_COMPLETE.md`** � Authentication implementation details and verification steps.
4. **`development-methodology/vibe_coding_guide.md`** � Day-to-day coding standards and workflow norms.
5. **`development-methodology/repository-reset-2025-09-25.md`** � Source of truth for the latest clean clone and lint baseline.

## Quick Reference

### Environment URLs

- Development: https://sentia-manufacturing-development.onrender.com
- Testing: https://sentia-manufacturing-testing.onrender.com
- Production: https://sentia-manufacturing-production.onrender.com

### Branch-to-Render Mapping

- Push `development` to deploy the development environment.
- Push `test` to update the testing environment.
- Push `production` for the live deployment.

### Authentication

- Set `VITE_CLERK_PUBLISHABLE_KEY` in `.env.local` (and Render env vars) to enable Clerk-backed sign-in.
- Use `VITE_FORCE_MOCK_AUTH=true` locally when you need the mock provider instead of Clerk.

### Common Commands

```bash
pm run dev            # Start Vite client and Express server
pm run build          # Build production bundles
pm run lint           # Run ESLint against src/ and server/
pm run typecheck      # Validate TypeScript definitions (if enabled)
pm run format:check   # Verify Prettier formatting
pm test               # Execute Vitest unit tests
pm run test:e2e       # Execute Playwright end-to-end tests
```

## Documentation Standards

1. Use `snake_case` for filenames and ASCII-only content unless an existing document already relies on extended characters.
2. Start each document with a clear title and overview before diving into implementation details.
3. Link related documents within the context set to reduce duplication and aid discovery.
4. Update this README whenever a new top-level directory is added or repurposed.

## Support

If clarification is needed:

- Review the codebase index (`CODEBASE_INDEX.md`).
- Consult the GitHub SpecKit playbook (`.github/SPECKIT.md`).
- Coordinate with the development team before diverging from the documented Git flow.

_Last updated_: 2025-09-25 (post-reset baseline)
