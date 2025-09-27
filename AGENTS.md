# Repository Guidelines

## Project Structure & Module Organization
- Keep feature code inside `src/`. Shared UI lives in `src/components`, page shells in `src/pages`, reusable logic in `src/hooks`, `src/stores`, and `src/services`. Assets go to `src/assets`. Server stubs stay in `server-fixed.js` and `mcp-server/enterprise-server-simple.js`. Specs either sit beside features as `*.test.jsx` or inside `tests/`. Prisma schemas and migrations belong to `prisma/`.
- Restored enterprise dashboards live under `src/features/{executive,working-capital,inventory,production}` with thin wrappers in `src/pages/`.

## Build, Test, and Development Commands
- Use `pm run dev` to boot the React client with mocked MCP data; `pm run dev:all` starts client, API, and MCP together. `pm run build` produces production bundles, and `pm run build:render` plus `pm run start:production` mimics the Render deployment flow. Run `pm run lint`, `pm run format:check`, and `pm run typecheck` before submitting. Execute unit tests with `pm test` and Playwright flows via `pm run test:e2e`.

## Coding Style & Naming Conventions
- Prettier and ESLint enforce two-space indentation, single quotes, and ASCII-only logging. Components and pages use PascalCase (for example `WorkingCapitalPanel.jsx`). Hooks, utilities, and helpers stay camelCase. Prefer Tailwind utility classes and shared primitives instead of custom CSS.

## Testing Guidelines
- Vitest drives unit tests; Playwright covers end-to-end scenarios. Keep snapshots synced with SSE payloads. Aim for at least 80% coverage on working-capital, forecasting, and orchestration modules. Name specs as `*.test.jsx|ts`. Run `pm test --coverage` when touching critical flows.

## Commit & Pull Request Guidelines
- Follow Conventional Commits (`feat:`, `fix:`, `chore:`). Reference SpecKit issues and attach Render preview URLs for UI work. Include before/after screenshots for visual changes. Document lint, type, and test runs in the PR description.

## Security & Configuration
- Do not commit secrets or `.env` files. Manage credentials in Render dashboards and snapshot production databases before `pm run db:migrate:prod`. After protocol changes confirm MCP health at `https://mcp-server-tkyu.onrender.com/health`.

## Authentication & Environment
- Clerk is the primary IdP. Provide `VITE_CLERK_PUBLISHABLE_KEY`/`CLERK_SECRET_KEY` in `.env` files for production.
- For local or automated testing, set `VITE_FORCE_MOCK_AUTH=true` to skip Clerk and rely on the mock provider. Leave it unset/false in deployed environments.
- Mock sessions persist in `localStorage` under `sentia-mock-auth-v1`; clear it when you need a fresh state.
