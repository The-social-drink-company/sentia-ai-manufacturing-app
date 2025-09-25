# Repository Guidelines

## Project Structure & Module Organization
Keep all feature code in `src/`. Shared UI primitives stay in `src/components`, page shells in `src/pages`, and cross-cutting logic in `src/hooks`, `src/stores`, and `src/services`. Tests live beside features as `*.test.jsx` or under `tests/`. Assets belong in `src/assets`. Do not touch `server-fixed.js` or `mcp-server/enterprise-server-simple.js` unless coordinating backend changes. Prisma schemas and migrations stay in `prisma/`.

## Build, Test, and Development Commands
- `pm run dev`: start the React client with mocked MCP data.
- `pm run dev:all`: run client, API, and MCP together for end-to-end smoke checks.
- `pm run build`: produce production bundles.
- `pm run build:render` then `pm run start:production`: simulate the Render deployment pipeline.

## Coding Style & Naming Conventions
The repo standardizes on Prettier and ESLint defaults: two-space indentation, single quotes, and ASCII-only logs. Components and pages use PascalCase (e.g., `WorkingCapitalPanel.jsx`); hooks, utilities, and helpers stay camelCase. Favor Tailwind classes and shared primitives over bespoke styles. Run `pm run format:check` and `pm run lint` before pushing.

## Testing Guidelines
Vitest powers unit tests (`pm test`). Critical flows such as working-capital, forecasting, and orchestration should stay above 80% coverage; run `pm test --coverage` when touching them. Keep snapshots aligned with SSE payloads. Name specs `*.test.jsx` or `*.test.ts` and colocate with the code they exercise unless they live in `tests/`. Playwright end-to-end suites run via `pm run test:e2e`.

## Commit & Pull Request Guidelines
Use Conventional Commit prefixes (`feat:`, `fix:`, `chore:`). Reference SpecKit issues and include Render preview URLs for UI changes. Lint, type, and test status must be noted in the PR description. Attach before/after screenshots when modifying visuals.

## Security & Configuration Tips
Never commit secrets or `.env` files. Manage credentials in Render dashboards, snapshot production databases before `pm run db:migrate:prod`, and confirm MCP health at `https://mcp-server-tkyu.onrender.com/health` after protocol updates.
