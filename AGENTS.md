# Repository Guidelines

## Project Structure & Module Organization
Source code lives under src/, with shared primitives in src/components, page shells in src/pages, and feature dashboards in src/features/{executive,working-capital,inventory,production}. Shared hooks, services, and state reside in src/hooks, src/services, and src/stores; Tailwind tokens, icons, and theme assets are in src/assets. Mock servers live in server-fixed.js and mcp-server/enterprise-server-simple.js. Place Prisma schema and migrations inside prisma/, and co-locate unit specs beside implementations as *.test.jsx|ts or place broader suites under 	ests/.

## Build, Test, and Development Commands
Use pm run dev for the React client with mocked MCP data, or pm run dev:all to spin up client, API, and MCP together. Build production bundles with pm run build, then mimic the Render stack via pm run build:render followed by pm run start:production. Quality gates: pm run lint, pm run format:check, and pm run typecheck. Execute unit tests using pm test, end-to-end flows through pm run test:e2e, and capture coverage with pm test --coverage.

## Coding Style & Naming Conventions
ESLint and Prettier enforce two-space indentation, single quotes, and ASCII-only logging. Components and pages use PascalCase (e.g., WorkingCapitalPanel.jsx), hooks and utilities stay camelCase, and Tailwind utility classes plus shared primitives replace ad-hoc CSS. Run pm run format before committing to maintain stylistic consistency.

## Testing Guidelines
Vitest runs unit tests; Playwright powers end-to-end scenarios. Maintain at least 80% coverage for working-capital, forecasting, and orchestration modules, updating SSE snapshots whenever payloads change. Name test files *.test.jsx|ts, store snapshots beside their specs, and verify new features with both unit and scenario coverage.

## Commit & Pull Request Guidelines
Follow Conventional Commits (eat:, ix:, chore:) with SpecKit issue IDs referenced in commit bodies or PR descriptions. PRs must include Render preview URLs for UI work, before/after screenshots, and a completed checklist confirming pm run lint, pm run typecheck, and relevant tests. Document configuration changes and linked MCP health checks where applicable.

## Security & Configuration Tips
Never commit secrets or .env files; credentials flow through Render-managed environment variables. For protocol changes or migrations, run pm run db:migrate:prod, snapshot production data, and confirm MCP health at https://mcp-server-tkyu.onrender.com/health. Set VITE_FORCE_MOCK_AUTH=true locally or in CI, and provide Clerk keys (VITE_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY) via environment management, leaving them unset in deployed environments.
