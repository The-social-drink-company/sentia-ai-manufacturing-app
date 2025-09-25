# Functional Assessment (Ultrathink)

## Scope & Method
Manual code review only; app, APIs, and MCP services were **not** executed in this environment. Findings highlight where guarantees fail and what to verify on a running stack.

## UI/UX Navigation Health
- Router only registers `/dashboard` and `/settings` behind the auth gate while the sidebar advertises `/working-capital`, `/inventory`, and `/production`; hitting those paths falls into the wildcard redirect back to `/dashboard`, so the links never land on dedicated pages (`src/App.jsx:101`, `src/components/EnterpriseSidebar.jsx:13`).
- The root tree wraps everything in `MockAuthProvider`, but the login route consumes Clerk's `useAuth`; when that view renders it will throw because no `ClerkProvider` exists (`src/App.jsx:7`, `src/pages/LoginPage.jsx:2`).
- `MockAuthProvider` seeds a static demo user and bypasses Clerk entirely, so even "authenticated" screens run against demo context (`src/providers/MockAuthProvider.jsx:6`).

## MCP & API Connectivity Check
- `useExecutiveDashboard` hydrates widgets via `/api/dashboard/executive`, `/api/metrics/realtime`, and `/api/working-capital/current` (`src/hooks/useExecutiveDashboard.js:283`, `src/hooks/useExecutiveDashboard.js:291`, `src/hooks/useExecutiveDashboard.js:299`).
- The Node server hits MCP first and silently falls back to synthetic payloads from `buildExecutiveDashboardFallback`, `buildRealtimeMetricsFallback`, and `buildWorkingCapitalFallback` whenever MCP is unavailable, leaving the UI unaware of degraded data (`server-fixed.js:138`, `server-fixed.js:411`, `server-fixed.js:424`, `server-fixed.js:437`).
- Additional routers under `/api/working-capital`, `/api/production`, `/api/inventory`, and `/api/analytics` return hard-coded demo data, so detail panes never touch MCP even when it is healthy (`server-fixed.js:493`, `server-fixed.js:528`, `server-fixed.js:548`, `server-fixed.js:568`).

## Data Authenticity Review
- Default auth context seeds the `sentia-ops-demo` account, guaranteeing demo metadata in widgets (`src/providers/MockAuthProvider.jsx:6`).
- Dashboard fallback copy such as `executive@sentia-demo.com` reinforces the demo posture (`src/pages/Dashboard.jsx:288`).
- Landing page copy explicitly warns about demo mode, underscoring that production data is absent by default (`src/pages/LandingPage.jsx:82`).
- Given the combination of mock auth and fallback APIs, no widget guarantees production parity without confirming MCP and database wiring on a live stack.

## Key Gaps & Next Steps
1. Replace the mock auth wrapper with the real Clerk provider (or re-enable a working `useAuth` bridge) and add routed shells for sidebar destinations.
2. Instrument `/api/*` handlers to emit degraded-state signals when MCP fails instead of silently returning demo payloads; gate or remove fallback generators before production deploys.
3. Swap demo identities and copy for real runtime data once authenticated MCP/DB sessions are available, and add automated checks that fail when fallbacks engage.
4. After wiring real services, run `pm run dev:all`, targeted MCP health checks, and UI smoke/coverage suites to validate navigation, auth, and data integrity.
