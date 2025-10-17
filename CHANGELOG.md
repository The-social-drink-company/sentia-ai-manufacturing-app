# Changelog

All notable changes following the reintegration of the original Sentia manufacturing codebase are documented here.

## 2025-10-16

### Added

- Auto-sync orchestration service tying Shopify, Xero, Amazon SP-API, and Unleashed ERP into the Express gateway without relying on MCP fallbacks.
- Render blueprint (`render.yaml`) defining frontend, backend, and MCP services with shared PostgreSQL provisioning.
- Documentation suite refreshed (`FINAL_IMPLEMENTATION_GUIDE.md`, `DEPLOYMENT_STRATEGY_AND_VERIFICATION.md`, `CODEX_CLI_PROMPTS_COMPLETE.md`, `QUICK_START.md`).

### Improved

- `src/components/DemandForecasting.jsx` now memoises the forecast fetch and removes redundant model selection state, eliminating duplicate API calls when users switch horizons.
- `src/components/EnterpriseAIChatbot.jsx` leverages `useMemo` for smart suggestions and tightens effect dependencies to prevent repeated welcome prompts or stale data.
- Deployment strategy aligns with Render health checks and environment variable bindings, replacing outdated Railway workflow references.
- Quick Start guidance now walks through Prisma seeding, optional MCP service start-up, and smoke tests tied to real data.

### Fixed

- Stale hook dependencies that triggered unnecessary re-renders in the Demand Forecasting widget.
- Chatbot error handling now suppresses console noise by catching and logging non-critical failures while providing user-facing fallback messaging.

### Breaking Changes

- None observed; existing feature routes and API contracts remain compatible. Downstream consumers should re-test demand forecasting metrics to confirm ensemble outputs are unaffected by hook memoisation.
