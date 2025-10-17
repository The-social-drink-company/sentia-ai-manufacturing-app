# Database Migrations

## Overview

This directory contains Prisma migration files for the Sentia Manufacturing Dashboard database schema.

## Migration Strategy

### Environments

- **Development**: Migrations applied automatically via `prisma migrate dev`
- **Test**: Migrations applied via `prisma migrate deploy` in CI/CD pipeline
- **Production**: Migrations applied via `prisma migrate deploy` with manual approval

### Migration Workflow

#### Development Environment

```bash
# Create new migration
npx prisma migrate dev --name description_of_change

# Reset database (caution: deletes all data)
npx prisma migrate reset

# Generate Prisma Client
npx prisma generate
```

#### Test/Production Environments

```bash
# Preview migration
npx prisma migrate deploy --preview-feature

# Create backup before migration
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Apply migrations
npx prisma migrate deploy

# Verify migration
npx prisma migrate status
```

### Zero-Downtime Migration Pattern

For production deployments that require zero downtime:

**Step 1: Add new column (nullable)**
```sql
-- Migration: 001_add_new_field
ALTER TABLE products ADD COLUMN new_field VARCHAR(100);
CREATE INDEX idx_products_new_field ON products(new_field);
```

**Step 2: Deploy application code that writes to both old and new fields**

**Step 3: Backfill data**
```sql
-- Migration: 002_backfill_new_field
UPDATE products
SET new_field = old_field
WHERE new_field IS NULL;
```

**Step 4: Make column NOT NULL**
```sql
-- Migration: 003_make_new_field_required
ALTER TABLE products ALTER COLUMN new_field SET NOT NULL;
```

**Step 5: Deploy application code that only uses new field**

**Step 6: Drop old column**
```sql
-- Migration: 004_drop_old_field
ALTER TABLE products DROP COLUMN old_field;
```

## Initial Migration

The initial migration creates the complete database schema including:

### User Management
- `users` - User accounts with Clerk integration
- `sessions` - Session management
- `audit_logs` - Immutable audit trail

### Product & Inventory
- `products` - Product master data
- `warehouses` - Warehouse locations
- `inventory` - Stock levels
- `stock_movements` - Inventory transactions

### Sales & Orders
- `customers` - Customer master data
- `orders` - Sales orders
- `order_items` - Order line items
- `sales_data` - Aggregated sales metrics

### Production
- `production_jobs` - Manufacturing work orders
- `production_schedules` - Job scheduling
- `quality_metrics` - Quality control measurements
- `downtime_events` - Downtime tracking

### Financial
- `working_capital` - Working capital metrics
- `cash_runway` - Cash flow projections
- `scenarios` - What-if analysis

### Forecasting & AI
- `forecasts` - Demand forecasts
- `forecast_models` - ML model registry
- `optimization_results` - Optimization recommendations
- `embeddings` - Vector embeddings for semantic search

### Integration
- `integration_configs` - External API configurations
- `sync_jobs` - Data synchronization jobs
- `webhook_events` - Inbound webhooks

## Migration Files

Migration files are stored in timestamped directories:
```
migrations/
  └── 20251017000000_init/
      ├── migration.sql
      └── README.md
```

## Common Migration Commands

### Check migration status
```bash
npx prisma migrate status
```

### Resolve migration conflicts
```bash
npx prisma migrate resolve --applied "20251017000000_init"
npx prisma migrate resolve --rolled-back "20251017000000_failed_migration"
```

### Generate SQL without applying
```bash
npx prisma migrate diff \
  --from-schema-datamodel prisma/schema.prisma \
  --to-schema-datasource prisma/schema.prisma \
  --script > migration.sql
```

## Rollback Procedure

### Automatic Rollback (if migration fails)
Prisma automatically rolls back failed migrations in transactions.

### Manual Rollback
```bash
# 1. Identify migration to rollback
npx prisma migrate status

# 2. Create backup
pg_dump $DATABASE_URL > backup_before_rollback.sql

# 3. Mark migration as rolled back
npx prisma migrate resolve --rolled-back "20251017000000_migration_name"

# 4. Apply previous migration state
psql $DATABASE_URL < migrations/20251016000000_previous_migration/migration.sql

# 5. Verify database state
npx prisma migrate status
```

## Troubleshooting

### Migration fails with "relation already exists"
```bash
# Mark migration as applied without running it
npx prisma migrate resolve --applied "20251017000000_migration_name"
```

### Baseline existing database
```bash
# Mark all migrations as applied (for existing production database)
npx prisma migrate resolve --applied "0_init"
```

### Reset development database
```bash
# WARNING: Deletes all data
npx prisma migrate reset --skip-seed
```

## Best Practices

1. **Always backup before migrations** in production
2. **Test migrations** in development and test environments first
3. **Use descriptive migration names**: `add_forecast_model_table`, not `update`
4. **Review generated SQL** before applying in production
5. **Keep migrations small** and focused on single changes
6. **Never edit applied migrations** - create new migration instead
7. **Use transactions** for data migrations
8. **Add indexes concurrently** in production: `CREATE INDEX CONCURRENTLY`
9. **Monitor migration duration** and plan for maintenance windows if needed
10. **Document breaking changes** in migration README files

## Migration Hooks

### Before Migration
```bash
# .env or package.json scripts
PRISMA_MIGRATE_BEFORE_HOOK="./scripts/backup-db.sh"
```

### After Migration
```bash
PRISMA_MIGRATE_AFTER_HOOK="./scripts/validate-schema.sh"
```

## Emergency Procedures

### Database Corruption
1. Stop application servers
2. Restore from most recent backup
3. Apply migrations from backup point forward
4. Validate data integrity
5. Resume application services

### Failed Production Migration
1. Assess impact (can users still access system?)
2. If critical: Rollback immediately
3. If non-critical: Mark as rolled-back and fix in next release
4. Post-mortem analysis and update procedures

## Monitoring

### Key Metrics to Monitor
- Migration duration
- Database size growth
- Index creation time
- Lock contention during migration
- Query performance before/after migration

### Alerts
- Migration duration > 5 minutes
- Migration failure
- Database connection pool exhaustion during migration
- Replication lag > 30 seconds after migration

---

**Last Updated**: October 17, 2025
**Maintained By**: Data Engineering Team
