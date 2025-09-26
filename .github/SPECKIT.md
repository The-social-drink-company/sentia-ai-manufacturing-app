# GitHub SpecKit - Sentia Manufacturing Dashboard

## Project Overview

The Sentia Manufacturing Dashboard is an enterprise-grade operations platform that provides real-time monitoring, predictive analytics, and AI-assisted decision support for manufacturing organisations. The 2025-09-25 repository reset established a lint-clean baseline that all future work should inherit.

## Table of Contents

1. [Architecture](#architecture)
2. [Technology Stack](#technology-stack)
3. [Key Features](#key-features)
4. [Development Setup](#development-setup)
5. [Deployment Workflow](#deployment-workflow)
6. [API Summary](#api-summary)
7. [Security](#security)
8. [Contributing](#contributing)
9. [Support](#support)

## Architecture

The platform follows a layered architecture:

- **Frontend**: React 18 + Vite delivering a responsive dashboard with Tailwind CSS.
- **Middleware**: Express gateway providing REST APIs, SSE feeds, and WebSocket events.
- **Business Services**: Modular service layer handling forecasting, working capital, and scenario modelling.
- **Data Access**: Prisma ORM backed by PostgreSQL with the `pgvector` extension for embeddings.
- **AI Orchestration**: MCP server coordinating OpenAI, Claude, and Gemini assistants.
- **Infrastructure**: Render-hosted environments with automated deployments per branch.

## Technology Stack

### Frontend

- React 18
- Vite 7
- Tailwind CSS 3
- TanStack Query 5
- Zustand 5
- React Router 7

### Backend

- Node.js 20
- Express 4
- Prisma 6
- BullMQ / Redis for background jobs
- Socket.IO for real-time communication

### AI & Analytics

- OpenAI, Anthropic, Gemini SDKs
- LangChain orchestration helpers
- PostgreSQL `pgvector` for similarity search

### Tooling

- ESLint 9 + Prettier 3
- Vitest + Testing Library
- Playwright for end-to-end testing
- Husky + lint-staged for pre-commit quality gates

## Key Features

- Real-time KPI visualisations for working capital and production metrics.
- Scenario modelling with what-if controls and forecasting overlays.
- Role-based access control backed by Clerk with enterprise policies.
- SSE and WebSocket channels for live updates without refresh.
- Export pipelines for CSV, JSON, and PDF reporting.
- AI copilots for summarisation, anomaly detection, and operator guidance.

## Development Setup

```bash
pm install            # Install dependencies
pm run dev            # Start Vite client and Express API
pm run dev:mcp        # Launch MCP orchestration server
pm run lint           # ESLint against src/ and server/
pm run format:check   # Verify Prettier formatting
pm run typecheck      # Run TypeScript checks (if enabled)
pm test               # Execute Vitest suite
pm run test:e2e       # Execute Playwright flows
```

Configure Clerk keys (or `VITE_FORCE_MOCK_AUTH=true` for local development) and verify Prisma connectivity before running the backend.

## Deployment Workflow

Render environments map directly to Git branches:

1. Push to `development` to trigger the development environment deploy.
2. Promote via pull request into `test` for integration and UAT.
3. Merge into `production` for live releases.

Always ensure `pm run lint`, `pm run format:check`, and `pm run typecheck` pass before pushing. Document deployment notes in the PR template and include Render preview links where applicable.

## API Summary

- Base URL (development): `https://sentia-manufacturing-development.onrender.com/api`
- Base URL (production): `https://sentia-manufacturing-production.onrender.com/api`
- Common endpoints: `/health`, `/dashboard/data`, `/working-capital/overview`, `/forecasting/predict`, `/inventory/status`, `/production/optimize`.
- Authentication: Bearer tokens issued by Clerk; mock provider available when `VITE_FORCE_MOCK_AUTH=true` locally.

## Security

- Enforce Clerk authentication with role-based guards.
- Apply Helmet, rate limiting, and audit logging across Express routes.
- Keep secrets out of source control; manage via Render dashboards.
- Run dependency audits and monitor Sentry/Prometheus dashboards after each deploy.

## Contributing

- Fork or branch from `development`.
- Follow Conventional Commit messages.
- Update documentation and tests alongside code changes.
- Verify linting, formatting, type checks, and automated tests before opening a PR.
- Respect the branch progression: `development` -> `test` -> `production`.
- Reference the 2025-09-25 repository reset log when evaluating legacy fixes.

## Support

- Review `context/README.md` for documentation map.
- Check `spec-kit/specs/001-sentia-manufacturing-dashboard/` for specification and implementation history.
- Confirm MCP health at `https://mcp-server-tkyu.onrender.com/health` after protocol changes.

_Last updated_: 2025-09-25 (post-reset baseline)
