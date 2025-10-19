# CAPLIQUIFY-PHASE-2: API Route Multi-Tenant Transformation

**Story ID**: CAPLIQUIFY-PHASE-2-API
**Epic**: CapLiquify Multi-Tenant SaaS Transformation
**Phase**: Phase 2 (Backend Transformation) - Continuation
**Created**: October 19, 2025
**Status**: IN PROGRESS
**Priority**: P0 (Critical Path)

---

## 📋 Story Overview

Transform existing single-tenant API routes to use the new multi-tenant infrastructure (tenant middleware and Prisma service). This completes Phase 2 of the CapLiquify transformation, making all backend endpoints tenant-aware.

### Prerequisites
- ✅ Phase 1: Database architecture complete
- ✅ Phase 2.1: Tenant middleware created
- ✅ Phase 2.2: Tenant Prisma service created
- ✅ Documentation complete

### Success Criteria
- [ ] All API routes use `tenantContext` middleware
- [ ] All database queries execute in correct tenant schema
- [ ] Feature flags enforce subscription tier limits
- [ ] Entity limits prevent over-provisioning
- [ ] Integration tests verify tenant isolation
- [ ] No cross-tenant data leaks possible

---

## 🎯 Acceptance Criteria

### 1. Products API Transformation
**Route**: `/api/products`

**Requirements**:
- [ ] Apply `tenantContext` middleware to all product routes
- [ ] Use `tenantPrisma.queryRaw()` for all product queries
- [ ] Enforce product entity limits on creation
- [ ] All queries execute in tenant-specific schema
- [ ] Return 403 when entity limit reached

**Test Cases**:
```javascript
// TC-1: Tenant A can only see their products
GET /api/products (as Tenant A) → returns Tenant A products only

// TC-2: Tenant B cannot see Tenant A's products
GET /api/products (as Tenant B) → returns Tenant B products only (different set)

// TC-3: Product entity limits enforced
POST /api/products (Starter tier with 500 products) → 403 "Entity limit reached"

// TC-4: Cross-tenant product access blocked
GET /api/products/:tenantAProductId (as Tenant B) → 404 or 403
```

### 2. Sales API Transformation
**Route**: `/api/sales`

**Requirements**:
- [ ] Apply `tenantContext` middleware
- [ ] Use tenant-scoped queries for all sales data
- [ ] Filter sales by tenant schema automatically
- [ ] Aggregate sales data per tenant only

**Test Cases**:
```javascript
// TC-1: Tenant sales isolation
GET /api/sales (as Tenant A) → returns only Tenant A sales

// TC-2: Sales aggregations are tenant-scoped
GET /api/sales/summary (as Tenant A) → aggregates only Tenant A data

// TC-3: Cross-tenant sales hidden
GET /api/sales/:tenantBSaleId (as Tenant A) → 404
```

### 3. Inventory API Transformation
**Route**: `/api/inventory`

**Requirements**:
- [ ] Apply `tenantContext` middleware
- [ ] Inventory queries use tenant schema
- [ ] Inventory updates only affect tenant's data
- [ ] Stock level alerts are tenant-specific

**Test Cases**:
```javascript
// TC-1: Inventory isolation verified
GET /api/inventory (as Tenant A) → returns only Tenant A inventory

// TC-2: Inventory updates are tenant-scoped
PUT /api/inventory/:id (as Tenant A) → updates only in Tenant A's schema

// TC-3: Low stock alerts are tenant-specific
GET /api/inventory/alerts (as Tenant A) → alerts only for Tenant A products
```

### 4. Forecasts API Transformation
**Route**: `/api/forecasts`

**Requirements**:
- [ ] Apply `tenantContext` and `requireFeature('ai_forecasting')` middleware
- [ ] Only Professional/Enterprise tiers can access
- [ ] Forecasts are tenant-scoped
- [ ] Starter tier gets 403 with upgrade message

**Test Cases**:
```javascript
// TC-1: Feature flag enforcement
POST /api/forecasts (as Starter tier) → 403 "Feature not available. Upgrade to Professional."

// TC-2: Professional tier can create forecasts
POST /api/forecasts (as Professional tier) → 201 Created

// TC-3: Forecasts are tenant-isolated
GET /api/forecasts (as Tenant A) → returns only Tenant A forecasts
```

### 5. Working Capital API Transformation
**Route**: `/api/working-capital`

**Requirements**:
- [ ] Apply `tenantContext` middleware
- [ ] Working capital metrics are tenant-specific
- [ ] Calculations use only tenant's financial data
- [ ] No cross-tenant financial data leakage

**Test Cases**:
```javascript
// TC-1: Working capital isolation
GET /api/working-capital (as Tenant A) → returns only Tenant A metrics

// TC-2: Calculations use tenant data only
GET /api/working-capital/analysis → calculated from Tenant A's AR/AP only
```

### 6. Scenarios API Transformation
**Route**: `/api/scenarios`

**Requirements**:
- [ ] Apply `tenantContext` and `requireFeature('what_if')` middleware
- [ ] Only Professional/Enterprise tiers can create scenarios
- [ ] Scenarios are tenant-scoped
- [ ] Starter tier gets 403

**Test Cases**:
```javascript
// TC-1: Feature flag blocks Starter tier
POST /api/scenarios (as Starter) → 403 "Upgrade to Professional for what-if analysis"

// TC-2: Scenarios are tenant-isolated
GET /api/scenarios (as Tenant A) → only Tenant A scenarios
```

### 7. Integration Tests
**File**: `tests/integration/tenant-isolation.test.js`

**Requirements**:
- [ ] Test suite covering all endpoints
- [ ] Verify tenant isolation for each route
- [ ] Test subscription tier enforcement
- [ ] Test entity limit enforcement
- [ ] Test feature flag enforcement
- [ ] Test cross-tenant access prevention

---

## 🏗️ Implementation Plan

### Step 1: Create Example Transformed Route
**File**: `server/routes/products.example.js`

Create a complete example showing before/after transformation:

```javascript
// BEFORE (Single-Tenant)
router.get('/products', async (req, res) => {
  const products = await prisma.product.findMany({
    where: { isActive: true }
  })
  res.json(products)
})

// AFTER (Multi-Tenant)
import { tenantContext, checkEntityLimit } from '../middleware/tenantContext.js'
import { tenantPrisma } from '../services/tenantPrisma.js'

router.use(tenantContext) // Apply to all routes

router.get('/products', async (req, res) => {
  const { tenantSchema } = req

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

router.post('/products',
  checkEntityLimit('products', async (schema) => {
    const [result] = await tenantPrisma.queryRaw(
      schema,
      'SELECT COUNT(*) as count FROM products'
    )
    return parseInt(result.count)
  }),
  async (req, res) => {
    const { tenantSchema } = req
    const { sku, name, unitCost, unitPrice } = req.body

    const [product] = await tenantPrisma.queryRaw(
      tenantSchema,
      `INSERT INTO products (company_id, sku, name, unit_cost, unit_price, is_active)
       VALUES ((SELECT id FROM companies LIMIT 1), $1, $2, $3, $4, true)
       RETURNING *`,
      [sku, name, unitCost, unitPrice]
    )

    res.status(201).json(product)
  }
)
```

### Step 2: Transform Each API Route File

**Priority Order**:
1. ✅ `/api/products` - Most critical for testing
2. ✅ `/api/inventory` - Closely tied to products
3. ✅ `/api/sales` - Transaction data
4. ✅ `/api/working-capital` - Financial metrics
5. ✅ `/api/forecasts` - Feature-gated (Professional+)
6. ✅ `/api/scenarios` - Feature-gated (Professional+)
7. ✅ `/api/integrations` - API credentials (Enterprise)

**For Each Route**:
- [ ] Add `import { tenantContext, requireFeature, checkEntityLimit } from '../middleware/tenantContext.js'`
- [ ] Add `import { tenantPrisma } from '../services/tenantPrisma.js'`
- [ ] Apply `router.use(tenantContext)` at top of file
- [ ] Convert Prisma queries to `tenantPrisma.queryRaw()` or `tenantPrisma.executeRaw()`
- [ ] Add feature guards where applicable
- [ ] Add entity limit checks on create operations
- [ ] Update error handling to include tenant context

### Step 3: Create Integration Test Suite

**File**: `tests/integration/tenant-isolation.test.js`

```javascript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from '../../server.js'
import { tenantPrisma } from '../../server/services/tenantPrisma.js'

describe('Multi-Tenant Isolation', () => {
  let tenant1, tenant2
  let tenant1Token, tenant2Token

  beforeAll(async () => {
    // Create two test tenants
    tenant1 = await tenantPrisma.createTenant({
      slug: 'test-tenant-1',
      name: 'Test Tenant 1',
      clerkOrgId: 'org_test_1',
      subscriptionTier: 'professional'
    })

    tenant2 = await tenantPrisma.createTenant({
      slug: 'test-tenant-2',
      name: 'Test Tenant 2',
      clerkOrgId: 'org_test_2',
      subscriptionTier: 'starter'
    })

    // Get auth tokens (mock Clerk tokens for testing)
    tenant1Token = await getTestClerkToken('org_test_1')
    tenant2Token = await getTestClerkToken('org_test_2')
  })

  afterAll(async () => {
    // Clean up test tenants
    await tenantPrisma.deleteTenant(tenant1.id, true)
    await tenantPrisma.deleteTenant(tenant2.id, true)
  })

  describe('Product Isolation', () => {
    it('should isolate products between tenants', async () => {
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

    it('should prevent cross-tenant product access', async () => {
      const product1 = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .send({ sku: 'CROSS-001', name: 'Cross Test', unitCost: 10, unitPrice: 20 })
        .expect(201)

      // Tenant 2 tries to access Tenant 1's product
      await request(app)
        .get(`/api/products/${product1.body.id}`)
        .set('Authorization', `Bearer ${tenant2Token}`)
        .expect(404) // Product not found in Tenant 2's schema
    })
  })

  describe('Feature Flag Enforcement', () => {
    it('should block Starter tier from AI forecasting', async () => {
      await request(app)
        .post('/api/forecasts')
        .set('Authorization', `Bearer ${tenant2Token}`) // Starter tier
        .send({ productId: 'xxx', forecastDate: '2025-11-01', predictedValue: 100 })
        .expect(403)
        .expect((res) => {
          expect(res.body.error).toBe('feature_not_available')
          expect(res.body.message).toContain('ai forecasting')
        })
    })

    it('should allow Professional tier to use AI forecasting', async () => {
      await request(app)
        .post('/api/forecasts')
        .set('Authorization', `Bearer ${tenant1Token}`) // Professional tier
        .send({ productId: 'xxx', forecastDate: '2025-11-01', predictedValue: 100 })
        .expect(201)
    })
  })

  describe('Entity Limit Enforcement', () => {
    it('should enforce product limits for Starter tier', async () => {
      // Starter tier has max 500 entities
      // Create 500 products
      for (let i = 0; i < 500; i++) {
        await request(app)
          .post('/api/products')
          .set('Authorization', `Bearer ${tenant2Token}`)
          .send({ sku: `LIMIT-${i}`, name: `Product ${i}`, unitCost: 10, unitPrice: 20 })
          .expect(201)
      }

      // 501st product should fail
      await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${tenant2Token}`)
        .send({ sku: 'LIMIT-501', name: 'Product 501', unitCost: 10, unitPrice: 20 })
        .expect(403)
        .expect((res) => {
          expect(res.body.error).toBe('entity_limit_reached')
        })
    })
  })
})
```

### Step 4: Database Migration Execution

**Prerequisites**:
- [ ] Backup Render PostgreSQL database
- [ ] Verify DATABASE_URL environment variable
- [ ] Test migrations on local PostgreSQL first

**Execution Steps**:
```bash
# 1. Backup database (via Render Dashboard)
# Navigate to: Database → Backups → Create Manual Backup

# 2. Connect to Render PostgreSQL
export DATABASE_URL="<from-render-dashboard>"
psql $DATABASE_URL -c "SELECT version();"

# 3. Run migrations in order
psql $DATABASE_URL -f prisma/migrations/001_create_public_schema.sql
psql $DATABASE_URL -f prisma/migrations/002_tenant_schema_functions.sql

# 4. Verify migration success
psql $DATABASE_URL -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('tenants', 'users', 'subscriptions', 'audit_logs');"

# 5. Verify functions created
psql $DATABASE_URL -c "SELECT proname FROM pg_proc WHERE proname IN ('create_tenant_schema', 'delete_tenant_schema', 'list_tenant_schemas', 'verify_tenant_isolation');"

# 6. Optional: Create test tenant
psql $DATABASE_URL -f prisma/migrations/003_testing_queries.sql

# 7. Run verification
psql $DATABASE_URL -c "SELECT * FROM verify_tenant_isolation();"
```

---

## 📊 Estimation

### Development Time
| Task | Estimated Hours | Complexity |
|------|----------------|------------|
| Create example transformed route | 1-2 hours | Low |
| Transform `/api/products` | 2-3 hours | Medium |
| Transform `/api/inventory` | 1-2 hours | Low |
| Transform `/api/sales` | 1-2 hours | Low |
| Transform `/api/working-capital` | 2-3 hours | Medium |
| Transform `/api/forecasts` | 1-2 hours | Low |
| Transform `/api/scenarios` | 1-2 hours | Low |
| Create integration test suite | 3-4 hours | Medium |
| Execute database migrations | 2-3 hours | Medium |
| Testing and verification | 2-3 hours | Medium |
| **Total** | **16-25 hours** | **Medium** |

### Risk Assessment
| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Migration breaks existing data | Low | High | Complete backup before migration |
| Cross-tenant data leaks | Low | Critical | Comprehensive integration tests |
| Performance degradation | Medium | Medium | Monitor query performance |
| Connection pool exhaustion | Low | Medium | Connection pool limits in place |
| Clerk token validation issues | Medium | High | Test with mock tokens first |

---

## 🎯 Definition of Done

- [ ] All 7 API route files transformed to use tenant middleware
- [ ] All database queries execute in tenant-specific schemas
- [ ] Feature flags enforce subscription tier limits
- [ ] Entity limits prevent over-provisioning
- [ ] Integration test suite passes with 100% success
- [ ] Database migrations executed on Render PostgreSQL
- [ ] Tenant isolation verified via `verify_tenant_isolation()` function
- [ ] No cross-tenant data leaks in testing
- [ ] Performance testing shows acceptable query times
- [ ] Documentation updated with API transformation examples
- [ ] Retrospective created documenting lessons learned
- [ ] Code committed and pushed to `main` branch

---

## 📝 Notes

### Current API Route Files to Transform
```
server/routes/
├── products.js          # ⏳ TO TRANSFORM
├── sales.js             # ⏳ TO TRANSFORM
├── inventory.js         # ⏳ TO TRANSFORM
├── forecasts.js         # ⏳ TO TRANSFORM
├── working-capital.js   # ⏳ TO TRANSFORM
├── scenarios.js         # ⏳ TO TRANSFORM
└── integrations.js      # ⏳ TO TRANSFORM
```

### Middleware Usage Pattern
```javascript
import { tenantContext, requireFeature, checkEntityLimit, preventReadOnly } from '../middleware/tenantContext.js'
import { tenantPrisma } from '../services/tenantPrisma.js'

// Apply to all routes in this file
router.use(tenantContext)

// Read-only route (no guards needed)
router.get('/products', async (req, res) => { ... })

// Create route (check entity limit, prevent read-only)
router.post('/products',
  preventReadOnly,
  checkEntityLimit('products', countQuery),
  async (req, res) => { ... }
)

// Feature-gated route
router.post('/forecasts',
  preventReadOnly,
  requireFeature('ai_forecasting'),
  async (req, res) => { ... }
)

// Admin-only route
router.delete('/products/:id',
  preventReadOnly,
  requireRole(['owner', 'admin']),
  async (req, res) => { ... }
)
```

---

**Story Created**: October 19, 2025
**Estimated Completion**: 16-25 hours of development
**Dependencies**: Phase 1 & Phase 2.1-2.2 complete ✅
**Blocking**: Phase 3 (Authentication & Tenant Management)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
