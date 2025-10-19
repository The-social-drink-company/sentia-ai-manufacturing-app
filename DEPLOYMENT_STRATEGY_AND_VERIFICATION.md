# Deployment Strategy and Verification

## Deployment Overview

Sentia AI Manufacturing runs as a **four-service Render stack** powered by the `render.yaml` blueprint. The architecture provides complete separation of concerns with independent scaling capabilities:

### Four-Service Architecture

1. **Service 1: Frontend (Static Site)** - `sentia-frontend-prod`
   - Vite-built React 19 SPA served via Render static site
   - No runtime server required
   - Automatically rewrites to `/index.html` for client-side routing

2. **Service 2: Backend API (Web Service)** - `sentia-backend-prod`
   - Node.js Express API with Prisma ORM and Socket.IO
   - REST endpoints for business logic
   - Real-time SSE/WebSocket streaming for live data

3. **Service 3: MCP Server (Web Service)** - `sentia-mcp-prod`
   - Standalone integration hub for external APIs
   - Exposes Shopify, Xero, Amazon SP-API, and Unleashed ERP endpoints
   - Tool execution framework for Backend API consumption

4. **Service 4: Database (Managed PostgreSQL)** - `sentia-db-prod`
   - PostgreSQL 16 with pgvector extension for AI/ML embeddings
   - Shared connection string automatically bound to Services 2 and 3
   - Automatic backups and monitoring

All services are deployed from the `development` branch. CI should run linting, tests, and build validation before Render receives the artifacts.

## Pre-Deployment Checklist

- `pnpm run lint`
- `pnpm run format:check`
- `pnpm run test:run`
- `pnpm run build`
- Confirm Prisma migrations are committed and `pnpm exec prisma migrate deploy` succeeds locally.
- Verify updated environment variables exist for every Render service (see matrix below).
- Ensure MCP credentials are valid or explicitly documented as unavailable (the services surface degraded mode messages).

## Environment Variable Matrix (Four-Service Configuration)

| Service                    | Required Keys                                                                                                                                                                                                                                                        | Notes                                                                                                                                                           |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Service 1: Frontend**    | `VITE_API_BASE_URL`, `VITE_CLERK_PUBLISHABLE_KEY`                                                                                                                                                                                                                    | `VITE_API_BASE_URL` automatically injected from Service 2 URL; Clerk key must match backend value.                                                              |
| **Service 2: Backend API** | `NODE_ENV=production`, `PORT=10001`, `DATABASE_URL`, `MCP_SERVER_URL`, `CLERK_SECRET_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`                                                                                                                                              | `DATABASE_URL` pulled from Service 4 database binding; `MCP_SERVER_URL` points to Service 3; Clerk keys marked `sync: false` and must be entered manually.      |
| **Service 3: MCP Server**  | `NODE_ENV=production`, `PORT=10000`, `DATABASE_URL`, `LOG_LEVEL=info`, `XERO_CLIENT_ID`, `XERO_CLIENT_SECRET`, `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SHOPIFY_ACCESS_TOKEN`, `AMAZON_SP_API_KEY`, `AMAZON_SP_API_SECRET`, `UNLEASHED_API_ID`, `UNLEASHED_API_KEY` | `DATABASE_URL` pulled from Service 4 binding; credentials can remain blank for read-only demos; auto-sync manager reports missing secrets via status endpoints. |
| **Service 4: Database**    | (Managed by Render)                                                                                                                                                                                                                                                  | Connection string automatically provided to Services 2 and 3 via Render service bindings.                                                                       |
| **Shared (Optional)**      | `VITE_FORCE_MOCK_AUTH`, `ENABLE_SSE`, `ENABLE_AI_FEATURES`, `REDIS_URL`                                                                                                                                                                                              | Optional toggles; defaults from `enhancedEnvValidator` maintain safe configuration.                                                                             |

## Deployment Steps (Four-Service Workflow)

1. **Prepare Code and Environment**
   - Commit and push changes to the `development` branch
   - Verify all four services are defined in `render.yaml`
   - Ensure environment variables configured in Render dashboard for each service

2. **Build Validation (Local)**

   ```bash
   pnpm run build    # generates dist/ and Prisma client
   ```

3. **Trigger Render Deployment**
   - **Preferred:** Use Render dashboard -> Blueprints -> Deploy from Git for `render.yaml`
   - **CLI option:** `render blueprint launch render.yaml` (requires Render CLI + auth)

4. **Monitor Build Logs for Each Service:**

   **Service 1: Frontend (Static Site)**
   - Verifies Vite build completes successfully
   - Confirms static bundle uploaded to CDN
   - Validates rewrites to `/index.html` configured

   **Service 2: Backend API (Web Service)**
   - Confirms corepack enables pnpm 10.4.1
   - Validates Prisma client generation step
   - Verifies Express server boot and health check response

   **Service 3: MCP Server (Web Service)**
   - Validates pnpm install of MCP dependencies
   - Confirms MCP server initialization
   - Verifies service health check (`/health`)

   **Service 4: Database (PostgreSQL)**
   - Render automatically provisions or updates PostgreSQL instance
   - pgvector extension enabled
   - Connection string bound to Services 2 and 3

5. **Post-Deployment Auto-Configuration**
   - Render automatically applies environment variables
   - Services restart with new configuration
   - Health checks validate all services are running

## Verification Checklist (Four-Service Validation)

### Service 1: Frontend (Static Site)

- ✅ **URL availability** - Load the frontend URL and verify page loads
- ✅ **Authentication** - Confirm Clerk loads (or mock auth banner when using `VITE_FORCE_MOCK_AUTH`)
- ✅ **Client-side routing** - Navigate to different routes, verify rewrites working
- ✅ **API communication** - Verify frontend successfully connects to Service 2 (Backend API)

### Service 2: Backend API (Web Service)

- ✅ **Health endpoint** - `curl https://<backend>/api/health` returns `{ status: "ok" }` with service metadata
- ✅ **Database connectivity** - Inspect logs for successful Prisma connection to Service 4
- ✅ **MCP communication** - Verify Backend API successfully calls Service 3 (MCP Server)
- ✅ **Auto-sync status** - `GET https://<backend>/api/status/sync` confirms last-run timestamps
- ✅ **Real-time channels** - Open dashboard and validate Socket.IO handshake success

### Service 3: MCP Server (Web Service)

- ✅ **Health endpoint** - `curl https://<mcp>/health` reports integration readiness
- ✅ **Database connectivity** - Verify MCP server connects to Service 4 successfully
- ✅ **External API status** - Check status endpoint for Shopify/Xero/Unleashed/Amazon connectivity
- ✅ **Tool execution** - Test at least one tool execution endpoint
- ✅ **Missing credentials handling** - Verify graceful degradation when credentials unavailable

### Service 4: Database (PostgreSQL)

- ✅ **Connection from Service 2** - Backend API Prisma queries successful
- ✅ **Connection from Service 3** - MCP Server database writes successful
- ✅ **pgvector extension** - Verify extension enabled for AI/ML features
- ✅ **Migrations applied** - Check all Prisma migrations applied successfully

### Integration Testing

- ✅ **Frontend → Backend → Database** - Complete data flow working
- ✅ **Backend → MCP → External APIs** - Integration flow functional
- ✅ **Real-time updates** - SSE/WebSocket updates propagating to frontend
- ✅ **Demand forecasting** - Change time horizon; ensure no duplicate fetch warnings
- ✅ **AI assistant** - Chatbot responds without console errors
- ✅ **Working Capital** - Live financial data displays correctly

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
