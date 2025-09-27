# New Product Prompt - Sentia Manufacturing Dashboard

## WHY - Vision & Purpose

- **Problem & Audience**: Sentia Spirits operates nine SKUs in three regions (UK, EU, US) across five sales channels (Amazon FBA plus Shopify DTC). Disconnected data, delayed insights, and ad-hoc decision loops hold back executives, finance teams, operations managers, and production planners. The dashboard consolidates the signal they need to run the business.
- **Application Summary**: A full-stack manufacturing intelligence platform that delivers AI-driven forecasts, working capital optimisation, production scheduling, and real-time health monitoring. The React dashboard consumes an Express/Prisma API, BullMQ workers, and Render-hosted infrastructure.
- **Primary User Personas**:
  - Executives and finance leads seeking consolidated KPIs, forecast accuracy, and liquidity oversight.
  - Operations and production managers supervising job schedules, OEE, stock levels, and supplier performance.
  - Supply chain and inventory planners managing reorder policy, lead times, and multi-warehouse balancing.
  - Finance controllers analysing the cash conversion cycle, running mitigation scenarios, and maintaining compliance.
  - System administrators managing roles, integrations, feature flags, and environment guardrails.
- **Unique Value Proposition**: Combines ensemble forecasting, constraint-aware optimisation, multi-channel integrations, and working capital analytics in a single, secure workspace. Differentiators include SSE live updates, Clerk-based RBAC, explainable optimisation logs, enterprise observability, and compliance-grade auditability.

## WHAT - Core Requirements

- **Mandatory Capabilities**:
  - Enforce authenticated, role-based access via Clerk (ADMIN, MANAGER, OPERATOR, VIEWER).
  - Ingest real-time and batch data from Amazon SP-API, Shopify, Unleashed ERP, and internal sources.
  - Produce AI forecasts (ARIMA, LSTM, Prophet, Random Forest ensemble) with accuracy metrics.
  - Calculate inventory policies (EOQ, safety stock, reorder points) plus working capital projections and recommendations.
  - Support configurable dashboards (drag-and-drop widgets, saved layouts, scenario toggles) with SSE-driven updates.
  - Provide bulk import tooling (CSV or Excel), validation, remediation, and export of cleansed datasets.
  - Allow users to trigger schedules, run optimisation jobs, approve plans, and audit each action.
  - Surface system health, queue depth, logs, and alerts in an admin portal with approval workflows for risky operations.
- **Key Workflows**:
  - Daily executive review of KPIs, cash runway, alerts, and drilldowns by market, channel, and product.
  - Weekly demand planners compare forecast models, push scenarios into stock optimisation, and commit PO bundles.
  - Finance teams analyse cash conversion cycles, detect breach windows, and export mitigation plans.
  - Operators monitor production jobs, downtime, predictive maintenance warnings, and quality metrics.
  - Admins rotate API secrets, manage feature flags, review audit logs, and maintain environment configuration.
- **Expected Outcomes**:
  - Forecast accuracy above 85 percent, inventory carrying cost reduced by 20 percent, on-time delivery above 90 percent, cash conversion cycle under 55 days.
  - Real-time visibility with SSE updates inside five seconds and alerting that cuts incident response to under 15 minutes.
  - Regulatory compliance (GDPR, SOC 2 trajectory) with complete audit trails and secure handling of PII and secrets.

## HOW - Planning & Implementation

- **Stack Components**:
  - Frontend: React 18, Vite, Tailwind, shadcn UI, TanStack Query, Recharts or Chart.js, Framer Motion.
  - Backend: Node.js 18, Express 4, Prisma ORM, BullMQ queues on Redis, validation workers, SSE endpoints.
  - Integrations: Amazon SP-API, Shopify multi-store APIs, Unleashed ERP, Clerk auth, OpenAI and Claude via MCP.
  - Infrastructure: Render deployments with Nixpacks, Neon PostgreSQL (pgvector), Redis, GitHub Actions, Cloudflare CDN.
- **System Requirements**:
  - Performance: API latency under 200 ms, page loads under one second, support 1,000 concurrent users, optimisation jobs under five minutes.
  - Security: TLS 1.3, strict CSP and HSTS, rate limits (100 requests per minute API, 20 per minute auth), encrypted environment variables, MFA for admins, immutable audit logs.
  - Scalability and Reliability: Auto-scale 2 to 10 instances, BullMQ resilience with DLQ, 99.9 percent uptime, RTO 15 minutes, RPO one hour, point-in-time recovery backups.
  - Integration Constraints: Honour API throttling, retry with backoff, configurable data mappings, webhook processing, masked secrets.
- **Key User Flows**:
  - **Executive Pulse**: Login -> Executive dashboard -> KPI drilldowns -> Working capital snapshot -> Export board deck. Success requires load times under three seconds and healthy SSE status. Fallback to cached data if integrations degrade.
  - **Forecast to Optimise**: Forecast page -> compare models -> apply in optimisation -> configure constraints -> review recommendations -> approve purchase orders. Success when optimiser meets constraints and approval is logged. Fallback to heuristics if solver times out.
  - **Cash Breach Mitigation**: Working capital dashboard -> breach indicator -> scenario analysis -> mitigation plan export -> notify finance. Success when plan includes risk deltas and audit entry.
  - **Admin Safeguards**: Admin portal -> configuration proposal -> step-up authentication -> approval workflow -> deployment. Success when audit log and notifications record every change without exposing secrets.
- **Core Interfaces**:
  - Executive dashboard (`/dashboard`): KPI bar, real-time charts, quick actions, SSE status, trend indicators.
  - Working capital suite (`/working-capital`, `/cash-runway`): Cash conversion metrics, runway charts, scenario sliders, mitigation recommendations.
  - Production and operations (`/production`, `/inventory`, `/quality`, `/supply-chain`): Job boards, OEE metrics, stock alerts, supplier performance.
  - Analytics and forecasting (`/forecasting`, `/what-if`, `/analytics`): Model toggles, scenario builders, export tools, AI insights.
  - Admin portal (`/admin`): User and role management, feature flags, integration health, logs explorer, maintenance utilities, approval modals.
  - Data import centre: Upload wizard, mapping editor, validation results, retry controls, audit-ready exports.

## BUSINESS REQUIREMENTS

- **Access and Authentication**:
  - Clerk as the identity provider with environment-specific keys; use `VITE_FORCE_MOCK_AUTH=true` for local development.
  - Roles: ADMIN (full control), MANAGER (operations), OPERATOR (execution and data entry), VIEWER (read only). Step-up auth plus MFA for sensitive admin actions.
  - Session policies: ADMIN timeout four hours, MANAGER eight hours, maximum two concurrent sessions per user, lockout after five failed attempts.
- **Business Rules**:
  - Validate imports (types, lookups, seasonality) before persistence; flag invalid rows with remediation guidance.
  - Forecast modules must expose accuracy metrics, confidence intervals, and historical performance logs.
  - Inventory optimisation must respect capacity, MOQ, working capital limits, multi-warehouse constraints, and approval thresholds (Manager up to GBP 50K, Director up to GBP 200K, CFO unlimited).
  - Compliance: Align with GDPR and SOC 2 controls, maintain full audit logs, enforce data retention (production seven years, test 90 days, development 30 days), keep secrets out of logs.
  - Monitoring SLA: Detect incidents within five minutes, resolve within 15 minutes, raise alerts on SSE outages.
- **Implementation Priorities**:
  - **High**: Authentication and RBAC, executive dashboard SSE, forecast-to-optimise workflow, working capital analytics, data import pipeline, admin audit logging, core integrations, security controls.
  - **Medium**: Advanced AI insights, multi-warehouse optimisation, predictive maintenance analytics, mobile floor interface, approval workflow UX.
  - **Low**: 3D digital twin visualisations, private-label configuration, multi-region failover, advanced theming, extended export formats beyond CSV and PDF.

---

_Last updated: 2025-09-25_
