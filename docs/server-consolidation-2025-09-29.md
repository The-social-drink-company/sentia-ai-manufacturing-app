# Server Consolidation (2025-09-29)

## Changes
- Promoted `server/index.js` to the sole Express entrypoint and removed `server/index-final-clerk.js`, `server/index-ultimate.js`, and `server/index.cjs`.
- Added `/ready` and `/alive` readiness probes and centralized the Clerk configuration flag via `isClerkConfigured`.
- Normalized the error handler signature and reused the canonical Clerk flag across health and status responses.

## Follow-up
- Any deployment scripts should continue pointing at `server/index.js` (dev) or `server-enterprise-complete.js` (prod) until we finish the broader cleanup.
- If a simplified server variant is needed for smoke tests, consider exposing that via feature flags rather than alternative entry files.
