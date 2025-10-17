# BMAD Measurement: Mock Data Inventory

The following inventory captures every known location where the dashboard still emits synthetic, fallback,
or placeholder data. This establishes the measurement baseline required before we can eliminate the mocks
and connect to production integrations.

## 1. Server API Routes (Express)
- server/index.js
  - /api/financial/kpi-summary, /api/financial/cash-flow, /api/sales/product-performance,
    /api/financial/pl-analysis, /api/regional/performance — hard-coded payloads driven by
    Math.random and annotated as main-server-fallback.
  - SSE feed under /api/dashboard/stream — emits random operational metrics for production,
    quality, inventory, and orders.
  - Health-style endpoints advertise fallback data sources (bulletproof-api).
- server/api/working-capital.js
  - / now errors when no records exist, but subordinate routes still fabricate outputs:
    - /finance/ar-ap returns topDebtors/topCreditors arrays that need real AR/AP data.
    - /forecasts/cashflow currently responds 503 until a forecasting engine is connected.
- server/api/enhanced-forecasting.js
  - fetchExternalDemandData logs "not yet implemented"; there is no live external demand pipeline.
  - Model-insight helpers tolerate missing integrations.
- server/routes/sse.js
  - Broadcasts randomly generated data (revenue, orders, efficiency, defects, stock levels).
- server/routes/data.js
  - Provides mock analytics payloads for tooling.
- server/monitoring/enterprise-monitoring.js
  - Generates synthetic monitoring alerts and metrics.

## 2. Backend Services
- src/services/DemandForecastingEngine.js
  - generateSimulatedForecast, calculateHistoricalAccuracy, and ensemble helpers introduce random
    noise when AI outputs are missing.
- src/services/FinancialAlgorithms.js
  - Several calculations assume synthetic baselines when upstream APIs are unavailable.
- src/services/WorkingCapitalEngine.js
  - Seasonal and channel analyses rely on estimated multipliers instead of live commerce data.
- src/services/api/APIIntegration.js
  - WebSocket and analytics helpers still expose mocked status messages.
- src/services/mcpClient.js
  - Real-time connection scaffolding not yet wired, returning TODO placeholders.

## 3. Client Components and Widgets
- src/components/DemandForecasting.jsx, src/components/FinancialReports.jsx,
  src/components/InventoryManagement.jsx, src/components/widgets/*
  - Expect synthetic payloads and render randomised figures when data is missing.
- src/components/admin/SystemAdminPanel.jsx, src/components/DebugPanel.jsx
  - Dashboard controls animate metrics with Math.random loops.
- src/components/EnterpriseAIChatbot.jsx
  - Suggestion copy references random optimisation deltas.
- src/components/ui/sidebar.jsx
  - Mock utilisation percentages displayed in navigation.

## 4. Documentation and Context
- Several markdown files still mention "fallback" or "demo" behaviour; they need updating once
  real integrations replace the mocks.

## Next Steps Within BMAD
1. Analysis — confirm the real data source and credential requirements for each item above
   (Xero, Shopify, Amazon SP-API, Unleashed, MCP, Redis, Prisma).
2. Deployment — replace synthetic responses with the real integration (or fail fast with a 503) and
   update the UI to handle empty states gracefully.
3. Validation — rerun pnpm install, pnpm run build, pnpm run lint, pnpm run test, and Prisma checks
   after each feature conversion to ensure the codebase remains consistent.

This measurement document should be kept current as items are retired.
