# Repository Guidelines

## Project Structure & Module Organization
Source code lives in `src/`; compose shared UI in `src/components`, route shells in `src/pages`, and reusable logic across `src/hooks`, `src/stores`, and `src/services`. Keep media in `src/assets`, align workflow updates with the playbooks in `spec-kit/` and `context/`, and leave server wiring to `server-fixed.js` plus `mcp-server/enterprise-server-simple.js`. Prisma schemas and migrations reside in `prisma/`, while regression coverage sits in `tests/` alongside colocated `*.test.jsx` specs.

## Build, Test, and Development Commands
Run `pm run dev` for the React client with mocked MCP data or `pm run dev:all` to launch client, API, and MCP together. Produce bundles via `pm run build`, then mimic Render with `pm run build:render` and `pm run start:production`. Guardrails include `pm run lint`, `pm run format:check`, and `pm run typecheck`; execute Vitest suites with `pm test` and Playwright flows through `pm run test:e2e`.

## Coding Style & Naming Conventions
Prettier and ESLint enforce two-space indentation, single quotes, and ASCII-only logging. Pages and components stay PascalCase (e.g., `WorkingCapitalPanel.jsx`); hooks, utilities, and helpers use camelCase. Prefer Tailwind utility classes or shared primitives over bespoke CSS modules.

## Testing Guidelines
Name specs with `*.test.jsx|ts` beside features or under `tests/`, and keep snapshots in sync with SSE payloads. Maintain at least 80% coverage for working-capital, forecasting, and orchestration modules, and refresh Playwright fixtures whenever event streams shift.

## Commit & Pull Request Guidelines
Recent history follows Conventional Commits (`feat:`, `fix:`, `build:`, `chore:`) with lowercase types and optional scopes; keep the pattern and avoid all-caps variants like `FIX:`. Target PRs to `development`, summarize the change set with links to relevant SpecKit tickets or issues, and attach Render preview URLs when UI surfaces move. Provide before/after screenshots for visual updates, cite lint/type/test runs (e.g., `pm run lint`, `pm test`, `pm run test:e2e`), and never include secrets or `.env` files.

## Security & Configuration
Manage secrets inside Render dashboards, snapshot production databases before `pm run db:migrate:prod`, and confirm MCP WebSocket health at `https://mcp-server-tkyu.onrender.com/health` after protocol changes.
