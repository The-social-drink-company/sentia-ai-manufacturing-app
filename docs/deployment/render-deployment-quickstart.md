# Render Deployment Quickstart (October 2025)

This playbook explains how to launch the CapLiquify Manufacturing Platform on Render using the checked-in `render.yaml` blueprint. Follow the steps in order—the backend now applies Prisma migrations at boot and the static build no longer depends on Prisma, so deployments will complete without manual patches.

## Blueprint Overview
- **Database:** `sentia-db-prod` (PostgreSQL starter plan)
- **MCP Service:** `sentia-mcp-prod` (Node web service)
- **API Gateway:** `sentia-backend-prod` (Node web service with Prisma + SSE)
- **Frontend:** `sentia-frontend-prod` (Static site build via Vite)

Key automation baked into the blueprint:
- Backend `startCommand` runs `pnpm exec prisma migrate deploy` before starting `node server.js`.
- Frontend `buildCommand` calls `pnpm exec vite build`, so no database URL is required during the static build.
- `RATE_LIMIT_MAX=100` and `RATE_LIMIT_WINDOW=60000` are seeded to reflect the API contract (100 requests per-minute per user).

## Prerequisites
- Render account with GitHub access to this repository.
- Clerk API keys and third-party integration credentials (Xero, Shopify, Amazon SP, Unleashed).
- `render` CLI installed (`npm install -g @render/cli`) if you prefer CLI deployment.
- Database migrations pushed to `prisma/` in the repo (already included).

## 1. Apply the Blueprint
### Option A – Render Dashboard
1. Dashboard → **New +** → **Blueprint**.
2. Select the repository + branch containing the latest `render.yaml` (usually `development`).
3. Review the services and click **Apply**.

### Option B – Render CLI
```bash
render login
render blueprint deploy --file render.yaml --service-group sentia-prod
```

## 2. Populate Environment Variables
Add secrets through the Render UI (Settings → Environment) or via `render env set`.

### `sentia-mcp-prod`
- `XERO_CLIENT_ID`, `XERO_CLIENT_SECRET`
- `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SHOPIFY_ACCESS_TOKEN`
- `AMAZON_SP_API_KEY`, `AMAZON_SP_API_SECRET`
- `UNLEASHED_API_ID`, `UNLEASHED_API_KEY`
- Optional: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` (if AI tooling is enabled)

### `sentia-backend-prod`
- `CLERK_SECRET_KEY`
- `VITE_CLERK_PUBLISHABLE_KEY`
- `RATE_LIMIT_MAX` (defaults to `100`—adjust only if policy changes)
- `RATE_LIMIT_WINDOW` (default `60000` ms = 1 minute)
- Any third-party keys used directly by the API layer (Redis, analytics, etc.)

### `sentia-frontend-prod`
- `VITE_CLERK_PUBLISHABLE_KEY`
  (The blueprint wires `VITE_API_BASE_URL` to the backend URL automatically.)

> **Tip:** Use Render's "Bulk Edit" to paste values copied from your secrets manager. Do not commit `.env` files.

## 3. First Deployment Verification
1. Wait for each service status to show **Live**.
2. Open backend logs; confirm messages:
   - `Attempting database connection...`
   - `Database connection established`
   - `Prisma Migrate | finished` (indicates migrations ran).
3. Smoke-test endpoints:
   ```bash
   curl https://<backend-domain>/api/health
   curl -I https://<backend-domain>/api/v1/dashboard/summary
   curl -I https://<backend-domain>/api/v1/inventory?limit=1
   ```
   Ensure the responses include the `X-RateLimit-*` headers.
4. Verify SSE:
   ```bash
   curl -I https://<backend-domain>/api/v1/sse/dashboard
   ```
   Expect `Content-Type: text/event-stream`.
5. Confirm the static site resolves and references the backend URL (check browser dev tools → Network).

## 4. Redeploy & Maintenance Commands
- Force rebuild after secrets change: `render redeploy --service sentia-backend-prod`
- Manual migration run (if needed): `render ssh --service sentia-backend-prod -- prisma migrate deploy`
- Tail logs: `render logs --service sentia-backend-prod --tail 100`

## 5. Troubleshooting
- Backend build failing at Prisma step → verify the Render Postgres database is provisioned and credentials are available (`DATABASE_URL` is injected via the blueprint).
- 404 on frontend routes → confirm React rewrite rule is active (blueprint adds `/* → /index.html`).
- Rate-limit headers missing → ensure the backend service picked up `RATE_LIMIT_MAX`/`RATE_LIMIT_WINDOW`; redeploy if the variables were added after first boot.
- SSE connection issues → Render free plan limits concurrent connections; upgrade to Starter if you see disconnects.

With these updates, a fresh Render deploy should complete end-to-end (database → backend → frontend) without manual console work. Use this document as the handoff sheet for ops and future teammates.
