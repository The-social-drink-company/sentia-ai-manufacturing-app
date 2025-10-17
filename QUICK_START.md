# Quick Start

The Sentia AI Manufacturing repo now reflects the merged original implementation with live integrations and Render-ready tooling. Use this guide for a fast local spin-up or smoke test.

## 1. Prerequisites
- Node.js 20.x (>=18 supported)
- pnpm 10.4.x (`corepack enable pnpm`)
- PostgreSQL 16 with pgvector extension (local or hosted)
- Optional: Redis for Socket.IO scaling and auto-sync caching

## 2. Clone and Install
```bash
git clone <repo-url>
cd sentia-ai-manufacturing-app
pnpm install
```

## 3. Environment Configuration
- Copy `CORRECTED-development.env` to `.env.local` (or create from scratch).
- Set values:
  - `DATABASE_URL` pointing to your Postgres instance
  - `VITE_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`
  - `VITE_FORCE_MOCK_AUTH=true` if you do not have Clerk keys for development
  - Optional API credentials (Shopify, Xero, Unleashed, Amazon) for live data tests

## 4. Database Prep
```bash
pnpm exec prisma migrate deploy
pnpm exec prisma db seed --schema prisma/schema.prisma
```
(The seed loads the nine-SKU Sentia model and historical sales used by the dashboards.)

## 5. Run Services
```bash
pnpm run dev        # starts Vite (3000) and Express API (5000)
# Optional integrations service
pnpm run dev:mcp    # starts MCP integration server (3001)
```
Visit `http://localhost:3000` and log in via mock auth banner or Clerk.

## 6. Smoke Test Checklist
- Dashboard cards load without mock data warnings.
- Demand Forecasting page refreshes cleanly when switching the horizon (no duplicate fetch logs).
- Enterprise AI Chatbot opens, displays smart suggestions, and responds with financial insights.
- `curl http://localhost:5000/api/health` returns status `ok`.
- (Optional) Hit `/api/status/sync` to confirm auto-sync job timestamps when credentials exist.

## 7. Lint, Test, Build
```bash
pnpm run lint
pnpm run test:run
pnpm run build
```

## 8. Deployment Preview
Running `pnpm run build` will output the production-ready bundle in `dist/` and run Prisma client generation. The same command sequence is executed by Render during deployment (see `render.yaml`).

You are now ready to work on features or validations with the merged codebase.

