# Deployment Strategy and Verification

## Deployment Overview

Sentia AI Manufacturing runs as a three-service Render stack powered by the `render.yaml` blueprint. The merge re-activated the multi-service topology:

1. **sentia-frontend-prod** - Static Vite build served via Render static site.
2. **sentia-backend-prod** - Node/Express API with Prisma and Socket.IO.
3. **sentia-mcp-prod** - Integration worker exposing Shopify, Xero, Amazon SP-API, and Unleashed ERP endpoints.
4. **sentia-db-prod** (managed) - Shared PostgreSQL (pgvector-enabled) database automatically provisioned by Render.

All services are deployed from the `merge-original-repo` branch onward. CI should run linting, tests, and build validation before Render receives the artefacts.

## Pre-Deployment Checklist

- `pnpm run lint`
- `pnpm run format:check`
- `pnpm run test:run`
- `pnpm run build`
- Confirm Prisma migrations are committed and `pnpm exec prisma migrate deploy` succeeds locally.
- Verify updated environment variables exist for every Render service (see matrix below).
- Ensure MCP credentials are valid or explicitly documented as unavailable (the services surface degraded mode messages).

## Environment Variable Matrix

| Service              | Required Keys                                                                                                                                                                                                                                                        | Notes                                                                                                             |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| sentia-backend-prod  | `NODE_ENV=production`, `PORT=10001`, `DATABASE_URL`, `MCP_SERVER_URL`, `CLERK_SECRET_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`                                                                                                                                              | `DATABASE_URL` pulled from Render database binding; Clerk keys marked `sync: false` and must be entered manually. |
| sentia-mcp-prod      | `NODE_ENV=production`, `PORT=10000`, `DATABASE_URL`, `LOG_LEVEL=info`, `XERO_CLIENT_ID`, `XERO_CLIENT_SECRET`, `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SHOPIFY_ACCESS_TOKEN`, `AMAZON_SP_API_KEY`, `AMAZON_SP_API_SECRET`, `UNLEASHED_API_ID`, `UNLEASHED_API_KEY` | Credentials can remain blank for read-only demos; auto-sync manager reports missing secrets via status endpoints. |
| sentia-frontend-prod | `VITE_API_BASE_URL`, `VITE_CLERK_PUBLISHABLE_KEY`                                                                                                                                                                                                                    | `VITE_API_BASE_URL` automatically injected from backend service URL; Clerk key must match backend value.          |
| Shared               | `VITE_FORCE_MOCK_AUTH` (optional), `ENABLE_SSE`, `ENABLE_AI_FEATURES`, `REDIS_URL`                                                                                                                                                                                   | Optional toggles; defaults from `enhancedEnvValidator` maintain safe configuration.                               |

## Deployment Steps

1. Commit and push changes to the deployment branch.
2. From the repository root run:
   ```bash
   pnpm run build    # generates dist/ and Prisma client
   ```
3. Trigger Render deployment:
   - **Preferred:** Use Render dashboard -> Blueprints -> Deploy from Git for `render.yaml`.
   - **CLI option:** `render blueprint launch render.yaml` (requires Render CLI + auth).
4. Monitor build logs for each service:
   - Frontend: ensures Vite build completes and static bundle uploaded.
   - Backend: confirms Prisma generate step and Express server boot.
   - MCP: validates pnpm install and service health check (`/health`).
5. When build succeeds, Render automatically applies environment variables and restarts services.

## Verification Checklist

- **Frontend availability** - Load the environment URL and confirm Clerk loads (or mock auth banner when using `VITE_FORCE_MOCK_AUTH`).
- **Backend health** - `curl https://<backend>/api/health` should return `{ status: "ok" }` with service metadata.
- **MCP health** - `curl https://<mcp>/health` should report integration readiness, highlighting any missing secrets.
- **Database connectivity** - Inspect backend logs for successful Prisma connection and auto-sync scheduling messages.
- **Auto-sync** - `GET https://<backend>/api/status/sync` (authenticate first if required) to confirm last-run timestamps for Shopify/Xero/Unleashed/Amazon jobs.
- **Real-time channels** - Open dashboard and validate live widgets update (inspect browser console for Socket.IO handshake success).
- **Demand forecasting** - Change the time horizon; ensure no duplicate fetch warnings after `useCallback` memoisation.
- **AI assistant** - Launch chatbot, verify welcome message suggestions render, and respond without throwing console errors.
- **Logs and monitoring** - Review Render logs for warnings, especially missing MCP credentials or Prisma migration prompts.

## Troubleshooting Tips

- **Build fails at pnpm install** - Ensure `corepack enable` runs; Render's command sequence already handles this, but check for lockfile drift.
- **Prisma migration mismatch** - Run `pnpm exec prisma migrate deploy` locally against the Render database to sync schema, then redeploy.
- **Clerk authentication errors** - Confirm publishable key on frontend matches backend secret key domain. Use `VITE_FORCE_MOCK_AUTH=true` for temporary bypasses.
- **Auto-sync not running** - Inspect `services/auto-sync-manager.js` logs; verify cron expressions and that Redis (if configured) is reachable. Without credentials the service remains in safe mode and records the missing secret names.
- **Socket.IO connection issues** - Ensure HTTPS WebSocket upgrade allowed; when horizontal scaling, add Redis adapter via `REDIS_URL` to share session state.
- **External API throttling** - Xero and Shopify are rate-limited; auto-sync manager staggers jobs (30-45 minute cadence). Increase intervals via service config if hitting limits.

## Rollback Strategy

- Use Render's previous deploy rollback for each service.
- If migrations were applied, run `pnpm exec prisma migrate deploy --last` with the previous migration snapshot or restore from latest database backup before rolling back code.
- Keep static frontend pinned to the prior successful build while backend reverts; ensure `VITE_API_BASE_URL` still points to the stable backend.

## Post-Deploy Monitoring

- Confirm Datadog/Sentry (if configured) receive heartbeats.
- Review `logs/` shipping to ensure Winston transport rotations are functioning.
- Capture screenshots/KPIs for stakeholder confirmation per enterprise checklist.

## Change Control Notes

- Document deployment in SpecKit/Render change logs referencing the SpecKit issue ID tied to the merge.
- Update `CHANGELOG.md` (see new file) and include verification evidence in the PR description.
