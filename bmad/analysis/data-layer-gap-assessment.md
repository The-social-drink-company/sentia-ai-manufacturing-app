# Data Layer Gap Assessment

**Date**: 2025-10-22  
**Prepared by**: BMAD Method Agent (Codex)

## Overview
The backend services reference two different data domains:

1. **Implemented Prisma Models** – tables present in prisma/schema.prisma and the 20251017171256 migration (e.g., WorkingCapital, CashFlowForecast, InventoryItem, ProductionJob, QualityRecord).
2. **Legacy Seed/Service Expectations** – the seed script and older service code still expect tables such as warehouse, inventory, salesData, order, cashRunway, and inancial_metrics.

Recent remediation (2025-10-22) updated /api/real-api and /api/working-capital to align with the schemas that actually exist. The outstanding task is to decide whether to:

- Reintroduce the richer data model (sales, warehouses, orders) and associated migrations, **or**
- Retire the legacy expectations and build new seeds/tests around the slimmer schema.

## Current Service Requirements
| Service | Data Sources Used After 2025-10-22 Fix | Notes |
| --- | --- | --- |
| server/api/real-api.js | WorkingCapital, CashFlowForecast, InventoryItem, ProductionJob, QualityRecord | Regional sales route now returns 503 guidance until geo sales data exists. |
| server/api/working-capital.js | Xero integration, WorkingCapital, CashFlowForecast, InventoryItem | No longer references cashRunway table. |

## Seed Script Mismatch
prisma/seed.ts still calls prisma.order, prisma.warehouse, prisma.salesData, prisma.inventory, prisma.cashRunway, etc., none of which exist in the current Prisma schema. Running the seed will fail once it reaches these operations.

## Recommended Next Steps
1. **Decide on Target Schema**
   - If full commerce + manufacturing history is required, recreate models for Warehouse, Inventory, Order, SalesData, CashRunway, etc., and write migrations accordingly.
   - Otherwise, refactor/remove legacy seed steps and any remaining service references to the deprecated tables.

2. **Create Prisma Migration Plan**
   - Document new models and relations in mad/solutioning/tech-specs/ before changing the schema.
   - Generate migrations and align TypeScript types/services accordingly.

3. **Update Seed and Tests**
   - Rewrite prisma/seed.ts to insert data only for existing models or extend it after new tables are added.
   - Add unit tests covering the updated /api/real-api aggregations to guard against regression when schema evolves.

4. **Track in BMAD**
   - Raise a BMAD story for the chosen path (restore full schema vs. simplify) and link it to the deployment readiness epic.

