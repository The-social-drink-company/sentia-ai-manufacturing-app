# CapLiquify Migration Guide

**Version**: 1.0
**Date**: October 19, 2025
**Status**: Phase 1 Complete - Ready for Database Migration
**Next Phase**: Backend Multi-Tenant Transformation

---

## Table of Contents

1. [Migration Overview](#migration-overview)
2. [Prerequisites](#prerequisites)
3. [Phase 1: Database Migration](#phase-1-database-migration)
4. [Phase 2: Backend Transformation](#phase-2-backend-transformation)
5. [Phase 3: Testing & Verification](#phase-3-testing--verification)
6. [Rollback Procedures](#rollback-procedures)
7. [Troubleshooting](#troubleshooting)

---

## Migration Overview

### What is CapLiquify?

CapLiquify is the multi-tenant SaaS transformation of CapLiquify Manufacturing Platform. The migration transforms a single-tenant application into a scalable multi-tenant platform with:

- **Schema-per-tenant isolation**: Each customer gets their own PostgreSQL schema
- **Subscription billing**: Stripe integration with 3 tiers (Starter, Professional, Enterprise)
- **Organization management**: Clerk Organizations for multi-tenant authentication
- **Scalable architecture**: Designed to support 100+ tenants on a single database

### Migration Phases

```
Phase 1: Database Architecture     ✅ COMPLETE
Phase 2: Backend Transformation    ⏳ IN PROGRESS
Phase 3: Authentication & Tenants  ⏳ PENDING
Phase 4: Marketing Website         ⏳ PENDING
Phase 5: Admin Dashboard           ⏳ PENDING
Phase 6: Billing & Subscriptions   ⏳ PENDING
Phase 7: Data Migration            ⏳ PENDING
Phase 8: Production Launch         ⏳ PENDING
```

---

## Prerequisites

### Required Access

- [x] Render Dashboard access (https://dashboard.render.com)
- [x] PostgreSQL database credentials
- [x] Git repository write access
- [x] Clerk account (for Phase 3)
- [x] Stripe account (for Phase 6)

### Environment Setup

```bash
# Ensure you have the latest code
git checkout main
git pull origin main

# Verify you have the migration files
ls -la prisma/migrations/

# Expected files:
# 001_create_public_schema.sql
# 002_tenant_schema_functions.sql
# 003_testing_queries.sql
```

### Database Preparation

**CRITICAL**: This migration will modify your production database. Complete a backup first.

```bash
# Option 1: Render Dashboard Backup
# Go to: https://dashboard.render.com
# Navigate to: Your Database → Backups → Create Manual Backup

# Option 2: pg_dump (if you have direct access)
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql
```

---

## Phase 1: Database Migration

### Step 1.1: Connect to Render PostgreSQL

Get your database URL from Render:

```bash
# In Render Dashboard:
# 1. Go to your PostgreSQL service
# 2. Click "Info" tab
# 3. Copy "External Database URL"

# Set environment variable (DO NOT COMMIT THIS)
export DATABASE_URL="postgresql://user:password@dpg-xxx.oregon-postgres.render.com/database"

# Test connection
psql $DATABASE_URL -c "SELECT version();"
```

Expected output:
```
PostgreSQL 17.x on x86_64-pc-linux-gnu, compiled by gcc...
```

### Step 1.2: Run Public Schema Migration

This creates the foundation tables: `tenants`, `users`, `subscriptions`, `audit_logs`.

```bash
# Execute migration
psql $DATABASE_URL -f prisma/migrations/001_create_public_schema.sql

# Verify tables created
psql $DATABASE_URL -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('tenants', 'users', 'subscriptions', 'audit_logs');"
```

Expected output:
```
     table_name
--------------------
 tenants
 users
 subscriptions
 audit_logs
(4 rows)
```

### Step 1.3: Create Tenant Management Functions

This creates PostgreSQL functions to dynamically create/delete tenant schemas.

```bash
# Execute function creation
psql $DATABASE_URL -f prisma/migrations/002_tenant_schema_functions.sql

# Verify functions created
psql $DATABASE_URL -c "SELECT proname FROM pg_proc WHERE proname IN ('create_tenant_schema', 'delete_tenant_schema', 'list_tenant_schemas', 'verify_tenant_isolation');"
```

Expected output:
```
        proname
------------------------
 create_tenant_schema
 delete_tenant_schema
 list_tenant_schemas
 verify_tenant_isolation
(4 rows)
```

### Step 1.4: Run Testing Queries (Optional but Recommended)

This creates two test tenants with sample data to verify everything works.

**WARNING**: This will create test data. Skip this step in production.

```bash
# For development/staging environments only
psql $DATABASE_URL -f prisma/migrations/003_testing_queries.sql

# Verify test tenants created
psql $DATABASE_URL -c "SELECT name, slug, schema_name, subscription_tier FROM public.tenants;"
```

Expected output:
```
          name          |       slug        |   schema_name    | subscription_tier
------------------------+-------------------+------------------+-------------------
 ACME Manufacturing Ltd | acme-manufacturing| tenant_test123   | professional
 Beta Industries Inc    | beta-industries   | tenant_beta456   | starter
(2 rows)
```

### Step 1.5: Verify Multi-Tenant Setup

Run the verification function to ensure everything is properly configured:

```bash
psql $DATABASE_URL -c "SELECT * FROM verify_tenant_isolation();"
```

Expected output:
```
      test_name       | result |                details
----------------------+--------+---------------------------------------
 Tenant Schema Count  | PASS   | Found 2 tenant schemas
 Public Schema Tables | PASS   | Expected 4, found 4
(2 rows)
```

### Step 1.6: Update Prisma Client

Generate the new Prisma client with multi-tenant support:

```bash
# Generate Prisma client
npx prisma generate --schema=prisma/schema-multi-tenant.prisma

# Expected output:
# ✔ Generated Prisma Client (v5.x.x) to ./node_modules/@prisma/client
```

---

## Phase 2: Backend Transformation

### Overview

Phase 2 transforms the Express backend to be multi-tenant aware. This involves:

1. Creating tenant context middleware
2. Implementing dynamic schema routing
3. Updating all API routes to use tenant schemas
4. Adding tenant isolation verification

### Step 2.1: Create Tenant Middleware

**File**: `server/middleware/tenantContext.js`

```javascript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Tenant Context Middleware
 * Extracts tenant from Clerk organization and sets database schema context
 */
export async function tenantContext(req, res, next) {
  try {
    // Extract organization ID from Clerk auth
    const clerkOrgId = req.auth?.orgId

    if (!clerkOrgId) {
      return res.status(400).json({
        error: 'No organization context',
        message: 'User must be part of an organization to access this resource'
      })
    }

    // Lookup tenant by Clerk organization ID
    const tenant = await prisma.tenant.findUnique({
      where: { clerkOrganizationId: clerkOrgId },
      include: {
        subscription: true
      }
    })

    if (!tenant) {
      return res.status(404).json({
        error: 'Tenant not found',
        message: 'No tenant exists for this organization. Please contact support.'
      })
    }

    // Check if tenant is active
    if (tenant.subscriptionStatus === 'suspended' || tenant.subscriptionStatus === 'cancelled') {
      return res.status(403).json({
        error: 'Account suspended',
        message: 'Your subscription is not active. Please update your billing information.'
      })
    }

    // Check if trial expired
    if (tenant.subscriptionStatus === 'trial' && tenant.trialEndsAt < new Date()) {
      return res.status(403).json({
        error: 'Trial expired',
        message: 'Your trial has ended. Please subscribe to continue using CapLiquify.'
      })
    }

    // Attach tenant to request
    req.tenant = tenant
    req.tenantSchema = tenant.schemaName

    // Set PostgreSQL search path for this request
    await prisma.$executeRaw`SET search_path TO ${tenant.schemaName}, public`

    next()
  } catch (error) {
    console.error('Tenant context error:', error)
    res.status(500).json({
      error: 'Tenant resolution failed',
      message: 'Unable to determine tenant context. Please try again.'
    })
  }
}

/**
 * Tenant Feature Guard
 * Checks if tenant's subscription tier includes a specific feature
 */
export function requireFeature(featureName) {
  return (req, res, next) => {
    const tenant = req.tenant

    if (!tenant) {
      return res.status(500).json({
        error: 'No tenant context',
        message: 'Tenant middleware must be applied before feature guard'
      })
    }

    const hasFeature = tenant.features?.[featureName] === true

    if (!hasFeature) {
      return res.status(403).json({
        error: 'Feature not available',
        message: `Your subscription plan does not include ${featureName}. Please upgrade to access this feature.`,
        featureName,
        currentTier: tenant.subscriptionTier
      })
    }

    next()
  }
}

/**
 * Tenant Limit Guard
 * Checks if tenant has reached their entity limit (e.g., max products, max users)
 */
export function checkEntityLimit(entityType, countQuery) {
  return async (req, res, next) => {
    const tenant = req.tenant

    try {
      // Execute count query in tenant schema
      const count = await countQuery(tenant.schemaName)

      const limit = tenant.maxEntities || Infinity

      if (count >= limit) {
        return res.status(403).json({
          error: 'Entity limit reached',
          message: `You have reached your ${entityType} limit (${limit}). Please upgrade to add more.`,
          currentCount: count,
          limit: limit,
          upgradeUrl: '/billing/upgrade'
        })
      }

      req.entityCount = count
      next()
    } catch (error) {
      console.error('Entity limit check failed:', error)
      next(error)
    }
  }
}
```

### Step 2.2: Create Tenant-Aware Prisma Service

**File**: `server/services/tenantPrisma.js`

```javascript
import { PrismaClient } from '@prisma/client'

/**
 * Tenant-Aware Prisma Client
 * Returns a Prisma client configured for a specific tenant schema
 */
export class TenantPrismaService {
  constructor() {
    this.globalClient = new PrismaClient()
  }

  /**
   * Get Prisma client for a specific tenant
   * @param {string} schemaName - Tenant schema name (e.g., 'tenant_123abc')
   * @returns {PrismaClient} - Prisma client with search_path set to tenant schema
   */
  async getClient(schemaName) {
    const client = new PrismaClient()

    // Set search path to tenant schema
    await client.$executeRaw`SET search_path TO ${schemaName}, public`

    return client
  }

  /**
   * Execute raw SQL query in tenant schema
   * @param {string} schemaName - Tenant schema name
   * @param {string} query - SQL query template
   * @param {Array} params - Query parameters
   */
  async executeRaw(schemaName, query, params = []) {
    const client = await this.getClient(schemaName)

    try {
      const result = await client.$executeRawUnsafe(query, ...params)
      return result
    } finally {
      await client.$disconnect()
    }
  }

  /**
   * Query raw SQL in tenant schema
   * @param {string} schemaName - Tenant schema name
   * @param {string} query - SQL query template
   * @param {Array} params - Query parameters
   */
  async queryRaw(schemaName, query, params = []) {
    const client = await this.getClient(schemaName)

    try {
      const result = await client.$queryRawUnsafe(query, ...params)
      return result
    } finally {
      await client.$disconnect()
    }
  }

  /**
   * Get global client (for public schema queries)
   */
  getGlobalClient() {
    return this.globalClient
  }

  /**
   * Disconnect all clients
   */
  async disconnect() {
    await this.globalClient.$disconnect()
  }
}

// Singleton instance
export const tenantPrisma = new TenantPrismaService()
```

### Step 2.3: Update API Routes Example

**Example**: Transform `/api/products` endpoint

**Before (Single-Tenant)**:
```javascript
// server/routes/products.js
import express from 'express'
import { PrismaClient } from '@prisma/client'

const router = express.Router()
const prisma = new PrismaClient()

router.get('/products', async (req, res) => {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { inventory: true }
  })

  res.json(products)
})

export default router
```

**After (Multi-Tenant)**:
```javascript
// server/routes/products.js
import express from 'express'
import { tenantContext, requireFeature } from '../middleware/tenantContext.js'
import { tenantPrisma } from '../services/tenantPrisma.js'

const router = express.Router()

// Apply tenant middleware to all routes
router.use(tenantContext)

router.get('/products', async (req, res) => {
  const { tenantSchema } = req

  // Query tenant's specific schema
  const products = await tenantPrisma.queryRaw(
    tenantSchema,
    `SELECT p.*, i.quantity_on_hand, i.quantity_available
     FROM products p
     LEFT JOIN inventory i ON i.product_id = p.id
     WHERE p.is_active = true
     ORDER BY p.name`
  )

  res.json(products)
})

router.post('/products', async (req, res) => {
  const { tenantSchema, tenant } = req
  const { sku, name, unitCost, unitPrice } = req.body

  // Validate tenant hasn't exceeded product limit
  const productCount = await tenantPrisma.queryRaw(
    tenantSchema,
    'SELECT COUNT(*) as count FROM products'
  )

  if (productCount[0].count >= tenant.maxEntities) {
    return res.status(403).json({
      error: 'Product limit reached',
      message: `You have reached your product limit (${tenant.maxEntities}). Please upgrade to add more products.`
    })
  }

  // Insert into tenant schema
  const [product] = await tenantPrisma.queryRaw(
    tenantSchema,
    `INSERT INTO products (company_id, sku, name, unit_cost, unit_price, is_active)
     VALUES ((SELECT id FROM companies LIMIT 1), $1, $2, $3, $4, true)
     RETURNING *`,
    [sku, name, unitCost, unitPrice]
  )

  res.status(201).json(product)
})

export default router
```

### Step 2.4: Update All API Routes

Routes that need transformation:

- [x] `/api/products` - Product management
- [x] `/api/sales` - Sales data
- [x] `/api/inventory` - Inventory management
- [x] `/api/forecasts` - Demand forecasting (requires `ai_forecasting` feature)
- [x] `/api/working-capital` - Financial metrics
- [x] `/api/scenarios` - What-if analysis (requires `what_if` feature)
- [x] `/api/integrations` - API credentials (requires `api_integrations` feature)

### Step 2.5: Test Multi-Tenant API

Create a test script to verify tenant isolation:

**File**: `tests/integration/tenant-isolation.test.js`

```javascript
import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import app from '../../server.js'

describe('Multi-Tenant Isolation', () => {
  let tenant1Token, tenant2Token

  beforeAll(async () => {
    // Get auth tokens for two different tenants
    tenant1Token = await getClerkToken('org_acme')
    tenant2Token = await getClerkToken('org_beta')
  })

  it('should isolate product data between tenants', async () => {
    // Create product for Tenant 1
    const product1 = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${tenant1Token}`)
      .send({ sku: 'TEST-001', name: 'Test Product 1', unitCost: 10, unitPrice: 20 })
      .expect(201)

    // Create product for Tenant 2
    const product2 = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${tenant2Token}`)
      .send({ sku: 'TEST-001', name: 'Test Product 2', unitCost: 15, unitPrice: 30 })
      .expect(201)

    // Tenant 1 should only see their product
    const tenant1Products = await request(app)
      .get('/api/products')
      .set('Authorization', `Bearer ${tenant1Token}`)
      .expect(200)

    expect(tenant1Products.body).toHaveLength(1)
    expect(tenant1Products.body[0].name).toBe('Test Product 1')

    // Tenant 2 should only see their product
    const tenant2Products = await request(app)
      .get('/api/products')
      .set('Authorization', `Bearer ${tenant2Token}`)
      .expect(200)

    expect(tenant2Products.body).toHaveLength(1)
    expect(tenant2Products.body[0].name).toBe('Test Product 2')
  })

  it('should enforce subscription limits', async () => {
    // Tenant 1 (Professional) can create forecasts
    await request(app)
      .post('/api/forecasts')
      .set('Authorization', `Bearer ${tenant1Token}`)
      .send({ productId: 'xxx', forecastDate: '2025-11-01', predictedValue: 100 })
      .expect(201)

    // Tenant 2 (Starter) cannot create forecasts
    await request(app)
      .post('/api/forecasts')
      .set('Authorization', `Bearer ${tenant2Token}`)
      .send({ productId: 'yyy', forecastDate: '2025-11-01', predictedValue: 50 })
      .expect(403)
      .expect((res) => {
        expect(res.body.error).toBe('Feature not available')
      })
  })
})
```

---

## Phase 3: Testing & Verification

### Verification Checklist

- [ ] **Database Migration**
  - [ ] All public schema tables created
  - [ ] Tenant management functions working
  - [ ] Test tenants created successfully
  - [ ] Tenant isolation verified

- [ ] **Backend Transformation**
  - [ ] Tenant middleware implemented
  - [ ] All API routes updated
  - [ ] Feature guards working
  - [ ] Entity limits enforced

- [ ] **Integration Tests**
  - [ ] Tenant isolation tests passing
  - [ ] Subscription tier tests passing
  - [ ] Feature flag tests passing
  - [ ] Performance tests passing

### Performance Testing

Test query performance with multiple tenants:

```sql
-- Create 10 test tenants with data
DO $$
DECLARE
  i INTEGER;
  tenant_id UUID;
BEGIN
  FOR i IN 1..10 LOOP
    INSERT INTO public.tenants (slug, name, schema_name, clerk_organization_id, subscription_tier, subscription_status)
    VALUES (
      'test-tenant-' || i,
      'Test Tenant ' || i,
      'tenant_test' || i,
      'org_test_' || i,
      'professional',
      'trial'
    ) RETURNING id INTO tenant_id;

    PERFORM create_tenant_schema(tenant_id);

    -- Insert sample data
    EXECUTE format('
      INSERT INTO tenant_test%s.companies (name) VALUES (''Test Company %s'');
      INSERT INTO tenant_test%s.products (company_id, sku, name, unit_cost, unit_price)
      SELECT id, ''SKU-'' || generate_series, ''Product '' || generate_series, 10, 20
      FROM tenant_test%s.companies, generate_series(1, 100);
    ', i, i, i, i);
  END LOOP;
END $$;

-- Measure query performance
EXPLAIN ANALYZE
SELECT * FROM tenant_test1.products WHERE is_active = true;
```

---

## Rollback Procedures

### Emergency Rollback

If something goes wrong during migration:

**Step 1: Stop Application**
```bash
# In Render Dashboard
# Navigate to: Your Web Service → Settings → Stop Service
```

**Step 2: Restore Database Backup**
```bash
# Option 1: Render Dashboard
# Navigate to: Database → Backups → Select backup → Restore

# Option 2: Manual restore
psql $DATABASE_URL < backup-YYYYMMDD-HHMMSS.sql
```

**Step 3: Revert Code Changes**
```bash
git checkout main
git reset --hard <commit-before-migration>
git push origin main --force
```

**Step 4: Restart Application**
```bash
# In Render Dashboard
# Navigate to: Your Web Service → Settings → Start Service
```

### Partial Rollback

If only Phase 2 (backend) needs rollback:

```bash
# Revert backend changes but keep database schema
git revert <phase-2-commit-hash>
git push origin main

# Database schema remains multi-tenant ready for future migration
```

---

## Troubleshooting

### Issue 1: "Environment variable not found: DATABASE_URL"

**Cause**: DATABASE_URL not set in environment

**Fix**:
```bash
# Get URL from Render Dashboard
export DATABASE_URL="postgresql://..."

# Or add to .env file (DO NOT COMMIT)
echo "DATABASE_URL=postgresql://..." >> .env
```

### Issue 2: "Schema tenant_xxx does not exist"

**Cause**: Tenant schema not created or deleted

**Fix**:
```sql
-- Verify tenant exists
SELECT id, schema_name FROM public.tenants WHERE schema_name = 'tenant_xxx';

-- Recreate schema
SELECT create_tenant_schema('<tenant-id>'::UUID);
```

### Issue 3: "Cannot access other tenant's data"

**Cause**: Search path not set correctly

**Fix**:
```javascript
// In your middleware, ensure:
await prisma.$executeRaw`SET search_path TO ${tenant.schemaName}, public`

// Verify search path
const [result] = await prisma.$queryRaw`SHOW search_path`
console.log('Current search path:', result.search_path)
```

### Issue 4: "Subscription tier limits not enforcing"

**Cause**: Feature flags not properly configured

**Fix**:
```sql
-- Check tenant features
SELECT name, subscription_tier, features FROM public.tenants WHERE id = '<tenant-id>';

-- Update features if needed
UPDATE public.tenants
SET features = '{"ai_forecasting": true, "what_if": true, "api_integrations": true}'::JSONB
WHERE id = '<tenant-id>';
```

---

## Next Steps

After completing Phase 1 and 2:

1. **Phase 3**: Integrate Clerk Organizations for tenant authentication
2. **Phase 4**: Build marketing website and landing pages
3. **Phase 5**: Create master admin dashboard for tenant management
4. **Phase 6**: Integrate Stripe for subscription billing
5. **Phase 7**: Migrate existing Sentia data to multi-tenant structure
6. **Phase 8**: Production launch and monitoring setup

---

## Resources

- **Multi-Tenant Setup Guide**: [MULTI_TENANT_SETUP_GUIDE.md](MULTI_TENANT_SETUP_GUIDE.md)
- **Prisma Multi-Schema**: https://www.prisma.io/docs/concepts/components/prisma-schema/multiple-databases
- **PostgreSQL Schemas**: https://www.postgresql.org/docs/current/ddl-schemas.html
- **Clerk Organizations**: https://clerk.com/docs/organizations/overview
- **Stripe Subscriptions**: https://stripe.com/docs/billing/subscriptions/overview

---

**Document Version**: 1.0
**Last Updated**: October 19, 2025
**Maintained By**: CapLiquify Engineering Team
