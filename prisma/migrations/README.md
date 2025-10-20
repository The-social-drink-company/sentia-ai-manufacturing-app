# Database Migrations

The Prisma migrations in this directory manage the CapLiquify Manufacturing Platform data model. The current baseline is the enterprise schema delivered in October 2025 and captured in `20251017171256_init/migration.sql`.

## Prerequisites

- PostgreSQL 15+ with the [`pgvector`](https://github.com/pgvector/pgvector) extension available (`CREATE EXTENSION IF NOT EXISTS "vector"`).
- A populated `DATABASE_URL` in your environment (Render, Neon, or local Postgres).
- Prisma CLI `>= 6.16.3` (`pnpm dlx prisma -v`).

## First-Time Bring-Up

1. **Create or select the target database.** Ensure the user has permission to create extensions.
2. **Apply the baseline migration.**
   ```bash
   npx prisma migrate deploy
   ```
   This executes the init migration, creating identity, finance, manufacturing, AI, and analytics tables with ~150 indexes and 60+ foreign keys.
3. **Generate Prisma Client.**
   ```bash
   npx prisma generate
   ```
4. **Seed development data (optional in prod).**
   ```bash
   NODE_ENV=development npx prisma db seed
   ```
   The seed script is TypeScript (`prisma/seed.ts`) and runs through `tsx`. Install dependencies first via `pnpm install` if running in a clean environment.

## Ongoing Development Workflow

```bash
# Create a migration for new schema changes
npx prisma migrate dev --name <change_summary>

# Regenerate the client after schema edits
npx prisma generate

# Reset local database (DESTROYS DATA)
npx prisma migrate reset --skip-seed
```

Keep migrations immutable—never rewrite an applied migration. Create a new timestamped folder for adjustments.

## Test / Production Deployment

```bash
# (Optional) Preview what will run
npx prisma migrate diff \
  --from-migrations prisma/migrations \
  --to-schema-datamodel prisma/schema.prisma \
  --script

# Back up the database before applying changes
pg_dump "$DATABASE_URL" > backup_$(date +%Y%m%d_%H%M%S).sql

# Apply pending migrations
npx prisma migrate deploy
```

After deploy, monitor for locks/slow queries and confirm health dashboards.

## Schema Overview

Key models introduced in the baseline migration:

- **Identity & Governance:** `User`, `Organization`, `Department`, `Session`, `AuditLog`, `SystemSetting`, `Notification`, `DataExport`, `ScheduledJob`.
- **Financial Operations:** `WorkingCapital`, `CashFlowForecast`, `WhatIfScenario`.
- **Manufacturing & Quality:** `Product`, `InventoryItem`, `InventoryMovement`, `ProductionJob`, `QualityRecord`.
- **Forecasting & AI:** `DemandForecast`, `AIInsight`, `MCPRequest`, `VectorStore`, `Dashboard`.

Each table is namespaced with Prisma `@@map` annotations so database naming remains snake_case.

## Handling pgvector Locally

When running Postgres locally without pgvector baked in, launch a container that ships the extension, for example:

```bash
docker run --name sentia-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 \
  -d ankane/pgvector:latest
```

Once the container is healthy, apply the migration and seed data as described above.

> **Render Tip:** Managed PostgreSQL instances on Render may expose pgvector versions that lag upstream releases. Keep the datasource configuration version-agnostic (`extensions = [pgvector(map: "vector")]`) and, if migrations fail, run `SELECT * FROM pg_available_extensions WHERE name = ''vector'';` to confirm supported versions before retrying.

## Troubleshooting

- **`P1012 Environment variable not found: DATABASE_URL`:** export the connection string or use `direnv`/dotenv before running Prisma commands.
- **`P1001 Can't reach database server`:** confirm the Postgres host/port, ensure Docker (if used) is running, and verify firewalls.
- **Seeding skips destructive resets in production:** run `NODE_ENV=production npx prisma db seed` to preserve data if you must seed prod.

---

_Last updated: 2025-10-17_
