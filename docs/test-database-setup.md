# Test Database Setup Documentation

## Overview

Isolated PostgreSQL test database for integration tests, completely separate from production. This database is used exclusively for automated testing and can be safely reset or destroyed without affecting production data.

## Architecture

```
Production Database (capliquify-db-prod)
├── sentia_prod_db (PRODUCTION DATA - DO NOT TEST HERE)
└── Basic-256mb Instance (5 GB storage)

Test Database (capliquify-test-db)
├── sentia_test_db (TEST DATA ONLY - Safe for destructive operations)
└── Free Instance (1 GB storage)
```

**Key Principle**: Complete isolation ensures integration tests never touch production data.

## Configuration

### Test Database Specifications

| Property | Value |
|----------|-------|
| **Service Name** | capliquify-test-db |
| **Database Name** | sentia_test_db |
| **Instance Type** | Free (256 MB RAM, 1 GB Storage) |
| **Region** | Oregon (US West) |
| **PostgreSQL Version** | 17 |
| **Tier** | Free (expires after 90 days inactivity) |
| **Purpose** | Integration testing only |

### Connection Details

**External Database URL** (for local development and CI/CD):
```
postgresql://[USERNAME]:[PASSWORD]@[HOST].oregon-postgres.render.com/sentia_test_db
```

**Internal Database URL** (for Render services only):
```
postgresql://[USERNAME]:[PASSWORD]@[INTERNAL_HOST]/sentia_test_db
```

**PSQL Command** (direct database access):
```bash
PGPASSWORD=[PASSWORD] psql -h [HOST].oregon-postgres.render.com -U [USERNAME] sentia_test_db
```

> ⚠️ **Security Note**: Connection credentials are stored in `.env.test` (gitignored). Never commit database credentials to version control.

## Local Development Setup

### Prerequisites

- Node.js 18+ installed
- pnpm package manager installed
- Access to Render dashboard (for database credentials)

### Setup Steps

#### 1. Create .env.test File

Copy the template and fill in credentials:

```bash
# Copy template
cp .env.test.example .env.test

# Edit .env.test and update DATABASE_URL with actual credentials
# Format: postgresql://USERNAME:PASSWORD@HOST/sentia_test_db
```

#### 2. Apply Prisma Migrations

Run migrations to create database schema (73+ tables):

```bash
# Apply all migrations to test database
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

Expected output:
```
✅ 15 migrations applied successfully
✅ 73+ tables created
✅ Indexes and constraints applied
✅ pgvector extension installed
```

#### 3. Verify Database Setup

Run connection test:

```bash
# Test database connectivity
DATABASE_URL="postgresql://..." node -e "
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  prisma.\$connect()
    .then(() => console.log('✅ Test database connected'))
    .then(() => prisma.\$disconnect());
"
```

#### 4. Run Integration Tests

Execute integration test suite:

```bash
# Run all integration tests
pnpm test --run

# Run specific test file
pnpm test subscription.test.js --run

# Run with verbose output
pnpm test --run --reporter=verbose
```

## Database Schema

### Multi-Tenant Architecture

The test database uses a **schema-per-tenant** architecture:

```
sentia_test_db
├── public schema
│   ├── tenants (tenant registry)
│   ├── users (global user table)
│   └── subscriptions (billing data)
└── tenant_{slug} schemas (isolated per tenant)
    ├── products
    ├── sales
    ├── inventory
    ├── forecasts
    ├── working_capital_metrics
    └── ... (70+ tables per tenant)
```

### Key Tables (Public Schema)

- **tenants**: Tenant registry with schema names
- **users**: Global user authentication
- **subscriptions**: Stripe subscription data
- **tier_configs**: Subscription tier configurations
- **feature_flags**: Feature enablement by tier

### Key Tables (Tenant Schema)

Each tenant gets an isolated schema with:
- **products**: Product catalog (SKU, pricing, costs)
- **sales**: Sales transactions (orders, revenue)
- **inventory**: Stock levels by channel
- **forecasts**: Demand forecasting data
- **working_capital_metrics**: Financial KPIs
- **scenarios**: What-if analysis data

## Test Database Maintenance

### Reset Test Data

Clean all test data and start fresh:

```bash
# Option 1: Drop and recreate all tenant schemas
npm run test:db:reset

# Option 2: Manual cleanup via PSQL
PGPASSWORD=[PASSWORD] psql -h [HOST] -U [USERNAME] sentia_test_db
sentia_test_db=> SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%';
sentia_test_db=> DROP SCHEMA tenant_test_starter CASCADE;
sentia_test_db=> DROP SCHEMA tenant_test_professional CASCADE;
```

### Re-apply Migrations

If schema is out of sync with production:

```bash
# Re-run all migrations
DATABASE_URL="postgresql://..." npx prisma migrate deploy

# Force reset migrations (destructive - drops all data)
DATABASE_URL="postgresql://..." npx prisma migrate reset --force
```

### Keep Database Active

Free tier databases expire after 90 days of inactivity. To prevent expiration:

```bash
# Run monthly to keep database active
pnpm test --run

# Or set up GitHub Actions cron job (weekly)
# See: .github/workflows/integration-tests.yml
```

### Monitor Database Usage

Check storage usage via Render dashboard:

1. Go to https://dashboard.render.com
2. Select `capliquify-test-db`
3. View **Storage** section (should stay under 1 GB)

If approaching 1 GB:
```bash
# Vacuum and analyze database
PGPASSWORD=[PASSWORD] psql -h [HOST] -U [USERNAME] sentia_test_db -c "VACUUM FULL ANALYZE;"
```

## Integration Test Infrastructure

### Test Utilities

Located in `tests/utils/`:

| File | Purpose | Lines |
|------|---------|-------|
| **authHelpers.js** | JWT token generation for auth testing | 75 |
| **mockFactories.js** | Test data generators (tenants, users, products) | 198 |
| **testDatabase.js** | Database lifecycle management (setup, teardown, seed) | 149 |

### Test Structure

```
tests/
├── integration/
│   ├── api/
│   │   ├── subscription.test.js (25 tests, 7 endpoints)
│   │   ├── auth.test.js (planned: 12 tests)
│   │   └── core-business.test.js (planned: 15 tests)
│   └── tenant-isolation.test.js (existing multi-tenant tests)
├── unit/ (unit tests - don't use test database)
└── utils/ (test helpers)
```

### Running Specific Test Suites

```bash
# All integration tests
pnpm test tests/integration/ --run

# Subscription API tests only
pnpm test subscription.test.js --run

# Single test by name
pnpm test subscription.test.js --run -t "should calculate proration"

# Watch mode (re-run on file changes)
pnpm test subscription.test.js
```

## Security Best Practices

### ✅ DO

- Use separate test database (never test against production)
- Store credentials in `.env.test` (gitignored)
- Use mock API keys for external services
- Reset test data between test runs
- Limit test database access to development team

### ❌ DON'T

- Never commit `.env.test` to version control
- Never use production database for testing
- Never use production API keys in tests
- Never share test database credentials publicly
- Never run destructive operations on production

## Troubleshooting

### Issue: "Can't reach database server"

**Cause**: Database URL incorrect or network issue

**Solution**:
```bash
# Verify DATABASE_URL format
echo $DATABASE_URL

# Test connection with psql
PGPASSWORD=[PASSWORD] psql -h [HOST] -U [USERNAME] sentia_test_db

# Check Render dashboard for database status
```

### Issue: "Prisma migrations out of sync"

**Cause**: Test database schema doesn't match production

**Solution**:
```bash
# Re-apply all migrations
DATABASE_URL="postgresql://..." npx prisma migrate deploy

# Or force reset (WARNING: drops all data)
DATABASE_URL="postgresql://..." npx prisma migrate reset --force
```

### Issue: "Tests timing out"

**Cause**: Slow network connection to Render database

**Solution**:
```bash
# Increase test timeout in vitest.config.js
test: {
  testTimeout: 30000, // 30 seconds instead of 10
}

# Or use local PostgreSQL for faster tests
DATABASE_URL="postgresql://localhost:5432/sentia_test_local"
```

### Issue: "Database storage full (1 GB limit)"

**Cause**: Test data accumulation

**Solution**:
```bash
# Clean up old test data
npm run test:db:reset

# Vacuum database
PGPASSWORD=[PASSWORD] psql -h [HOST] -U [USERNAME] sentia_test_db -c "VACUUM FULL;"

# Check table sizes
PGPASSWORD=[PASSWORD] psql -h [HOST] -U [USERNAME] sentia_test_db -c "
  SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
  FROM pg_tables
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
  LIMIT 20;
"
```

## CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/integration-tests.yml
name: Integration Tests

on:
  push:
    branches: [main, development]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * 1' # Weekly Monday 2am (keep database active)

jobs:
  integration-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run integration tests
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
          NODE_ENV: test
        run: pnpm test tests/integration/ --run

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: integration-test-results
          path: test-results/
```

### Required GitHub Secrets

Add to repository settings → Secrets:
- `TEST_DATABASE_URL`: Full PostgreSQL connection string

## Related Documentation

- [Integration Test Strategy](../bmad/progress/BMAD-TEST-006-integration-tests-progress.md)
- [BMAD-METHOD Testing Guide](../bmad/docs/testing-workflow.md)
- [Prisma Migration Guide](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Vitest Configuration](../vitest.config.js)

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review integration test documentation
3. Check Render dashboard for database status
4. Consult BMAD-METHOD testing workflow

---

**Last Updated**: 2025-10-20
**BMAD Story**: BMAD-TEST-006 (API Route Integration Tests)
**Epic**: EPIC-004 (Test Coverage Enhancement)
