# Repository Guidelines

## Project Structure & Module Organization
Keep shipping features inside `src/`. Shared UI primitives stay in `src/components`, page shells in `src/pages`, feature dashboards under `src/features/{executive,working-capital,inventory,production}` with thin wrappers. Shared logic sits in `src/hooks`, `src/services`, and `src/stores`; Tailwind assets live in `src/assets`. Server mocks belong in `server-fixed.js` and `mcp-server/enterprise-server-simple.js`. Place specs beside implementations as `*.test.jsx|ts` or under `tests/`. Prisma schema and migrations live in `prisma/`.

## Build, Test, and Development Commands
Use `pm run dev` for the React client with mocked MCP data, or `pm run dev:all` to launch client, API, and MCP together. Build production bundles with `pm run build`, then mimic Render using `pm run build:render` followed by `pm run start:production`. Run quality gates with `pm run lint`, `pm run format:check`, and `pm run typecheck`. Execute unit suites via `pm test`, end-to-end flows with `pm run test:e2e`, and collect coverage by `pm test --coverage`.

## Coding Style & Naming Conventions
ESLint and Prettier enforce two-space indentation, single quotes, and ASCII-only logging. Components and pages use PascalCase (`WorkingCapitalPanel.jsx`), hooks/utilities stay camelCase, and favor Tailwind utilities plus shared primitives instead of ad-hoc CSS.

## Testing Guidelines
Vitest powers unit tests; Playwright handles scenario coverage. Name files `*.test.jsx|ts` and co-locate snapshots with sources. Maintain at least 80% coverage for working-capital, forecasting, and orchestration modules, updating SSE snapshots when payloads shift.

## Commit & Pull Request Guidelines
Follow Conventional Commits (`feat:`, `fix:`, `chore:`). Reference the relevant SpecKit issue IDs in commit bodies or PR descriptions. For UI work, attach Render preview URLs and before/after screenshots. Document completed lint, type, and test runs inside the PR template before requesting review.

## Security & Configuration Tips
Never commit secrets or `.env` files; manage credentials through Render. Before protocol changes or migrations run `pm run db:migrate:prod`, snapshot the production database, and confirm MCP health at `https://mcp-server-tkyu.onrender.com/health`. In local or CI contexts set `VITE_FORCE_MOCK_AUTH=true`; leave it unset in deployed environments. Clerk remains the IdP, so supply `VITE_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` via environment management.
