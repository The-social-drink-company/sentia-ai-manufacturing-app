/**
 * Multi-Tenant Isolation Integration Tests
 *
 * Comprehensive test suite to verify tenant isolation across all API endpoints.
 * Tests feature flag enforcement, entity limits, and cross-tenant access prevention.
 *
 * @jest-environment node
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../../server.js'
import { tenantPrisma } from '../../server/services/tenantPrisma.js'

describe('Multi-Tenant Isolation Tests', () => {
  let tenant1, tenant2
  let tenant1Token, tenant2Token
  let product1Id, product2Id

  beforeAll(async () => {
    console.log('🧪 Setting up test tenants...')

    // Create two test tenants with different tiers
    tenant1 = await tenantPrisma.createTenant({
      slug: 'test-tenant-professional',
      name: 'Test Tenant Professional',
      clerkOrgId: 'org_test_prof_123',
      subscriptionTier: 'professional' // Has ai_forecasting and what_if
    })

    tenant2 = await tenantPrisma.createTenant({
      slug: 'test-tenant-starter',
      name: 'Test Tenant Starter',
      clerkOrgId: 'org_test_starter_456',
      subscriptionTier: 'starter' // No ai_forecasting or what_if
    })

    console.log(`✅ Created tenant 1 (Professional): ${tenant1.schemaName}`)
    console.log(`✅ Created tenant 2 (Starter): ${tenant2.schemaName}`)

    // Mock Clerk JWT tokens for testing
    // In production, these would be real Clerk tokens
    tenant1Token = createMockClerkToken('org_test_prof_123', 'user_123')
    tenant2Token = createMockClerkToken('org_test_starter_456', 'user_456')
  })

  afterAll(async () => {
    console.log('🧹 Cleaning up test tenants...')

    // Delete test tenants (hard delete)
    await tenantPrisma.deleteTenant(tenant1.id, true)
    await tenantPrisma.deleteTenant(tenant2.id, true)

    console.log('✅ Test cleanup complete')
  })

  // ==================== PRODUCTS API TESTS ====================

  describe('Products API - Tenant Isolation', () => {
    it('should isolate products between tenants', async () => {
      // Tenant 1 creates a product
      const response1 = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .send({
          sku: 'TEST-WIDGET-001',
          name: 'Tenant 1 Test Widget',
          description: 'This product belongs to Tenant 1',
          unitCost: 10.00,
          unitPrice: 20.00
        })
        .expect(201)

      expect(response1.body.success).toBe(true)
      expect(response1.body.data.sku).toBe('TEST-WIDGET-001')
      product1Id = response1.body.data.id

      // Tenant 2 creates a product with the SAME SKU (should succeed - different tenant)
      const response2 = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${tenant2Token}`)
        .send({
          sku: 'TEST-WIDGET-001', // Same SKU, different tenant
          name: 'Tenant 2 Test Widget',
          description: 'This product belongs to Tenant 2',
          unitCost: 15.00,
          unitPrice: 30.00
        })
        .expect(201)

      expect(response2.body.success).toBe(true)
      expect(response2.body.data.sku).toBe('TEST-WIDGET-001')
      product2Id = response2.body.data.id

      // Verify products have different IDs
      expect(product1Id).not.toBe(product2Id)

      // Tenant 1 should only see their product
      const tenant1Products = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .expect(200)

      expect(tenant1Products.body.success).toBe(true)
      expect(tenant1Products.body.data).toHaveLength(1)
      expect(tenant1Products.body.data[0].name).toBe('Tenant 1 Test Widget')
      expect(tenant1Products.body.data[0].unit_cost).toBe(10.00)

      // Tenant 2 should only see their product
      const tenant2Products = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${tenant2Token}`)
        .expect(200)

      expect(tenant2Products.body.success).toBe(true)
      expect(tenant2Products.body.data).toHaveLength(1)
      expect(tenant2Products.body.data[0].name).toBe('Tenant 2 Test Widget')
      expect(tenant2Products.body.data[0].unit_cost).toBe(15.00)
    })

    it('should prevent cross-tenant product access', async () => {
      // Tenant 2 tries to access Tenant 1's product
      await request(app)
        .get(`/api/products/${product1Id}`)
        .set('Authorization', `Bearer ${tenant2Token}`)
        .expect(404) // Product not found in Tenant 2's schema

      // Tenant 1 tries to access Tenant 2's product
      await request(app)
        .get(`/api/products/${product2Id}`)
        .set('Authorization', `Bearer ${tenant1Token}`)
        .expect(404) // Product not found in Tenant 1's schema
    })

    it('should enforce entity limits for Starter tier', async () => {
      // Starter tier has maxEntities = 500
      // Create 500 products for Tenant 2
      const createPromises = []
      for (let i = 0; i < 500; i++) {
        createPromises.push(
          request(app)
            .post('/api/products')
            .set('Authorization', `Bearer ${tenant2Token}`)
            .send({
              sku: `LIMIT-TEST-${i}`,
              name: `Limit Test Product ${i}`,
              unitCost: 10,
              unitPrice: 20
            })
        )
      }

      // Wait for all creates
      await Promise.all(createPromises)

      // 501st product should be blocked
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${tenant2Token}`)
        .send({
          sku: 'LIMIT-TEST-501',
          name: 'This should be blocked',
          unitCost: 10,
          unitPrice: 20
        })
        .expect(403)

      expect(response.body.error).toBe('entity_limit_reached')
      expect(response.body.message).toContain('limit')
    })
  })

  // ==================== SALES API TESTS ====================

  describe('Sales API - Tenant Isolation', () => {
    it('should isolate sales between tenants', async () => {
      // Tenant 1 creates a sale
      const sale1 = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .send({
          productId: product1Id,
          orderId: 'ORDER-T1-001',
          saleDate: '2025-10-19',
          channel: 'shopify_uk',
          quantity: 10,
          unitPrice: 20.00,
          totalAmount: 200.00,
          currency: 'GBP'
        })
        .expect(201)

      expect(sale1.body.success).toBe(true)

      // Tenant 2 creates a sale
      const sale2 = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${tenant2Token}`)
        .send({
          productId: product2Id,
          orderId: 'ORDER-T2-001',
          saleDate: '2025-10-19',
          channel: 'shopify_usa',
          quantity: 5,
          unitPrice: 30.00,
          totalAmount: 150.00,
          currency: 'USD'
        })
        .expect(201)

      expect(sale2.body.success).toBe(true)

      // Tenant 1 should only see their sales
      const tenant1Sales = await request(app)
        .get('/api/sales')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .expect(200)

      expect(tenant1Sales.body.data.every(s => s.order_id.startsWith('ORDER-T1'))).toBe(true)

      // Tenant 2 should only see their sales
      const tenant2Sales = await request(app)
        .get('/api/sales')
        .set('Authorization', `Bearer ${tenant2Token}`)
        .expect(200)

      expect(tenant2Sales.body.data.every(s => s.order_id.startsWith('ORDER-T2'))).toBe(true)
    })
  })

  // ==================== INVENTORY API TESTS ====================

  describe('Inventory API - Tenant Isolation', () => {
    it('should isolate inventory between tenants', async () => {
      // Get Tenant 1's inventory
      const inv1 = await request(app)
        .get('/api/inventory')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .expect(200)

      expect(inv1.body.success).toBe(true)
      expect(inv1.body.data.every(i => i.sku.includes('T1') || i.sku === 'TEST-WIDGET-001')).toBe(true)

      // Get Tenant 2's inventory
      const inv2 = await request(app)
        .get('/api/inventory')
        .set('Authorization', `Bearer ${tenant2Token}`)
        .expect(200)

      expect(inv2.body.success).toBe(true)
      // Tenant 2's inventory should not contain Tenant 1's products
      expect(inv2.body.data.every(i => !i.sku.includes('T1'))).toBe(true)
    })
  })

  // ==================== FORECASTS API TESTS ====================

  describe('Forecasts API - Feature Flag Enforcement', () => {
    it('should block Starter tier from creating forecasts', async () => {
      const response = await request(app)
        .post('/api/forecasts')
        .set('Authorization', `Bearer ${tenant2Token}`) // Starter tier
        .send({
          productId: product2Id,
          forecastDate: '2025-11-01',
          periodType: 'daily',
          forecastType: 'demand',
          modelType: 'arima',
          predictedValue: 100
        })
        .expect(403)

      expect(response.body.error).toBe('feature_not_available')
      expect(response.body.message).toContain('ai forecasting')
      expect(response.body.currentTier).toBe('starter')
    })

    it('should allow Professional tier to create forecasts', async () => {
      const response = await request(app)
        .post('/api/forecasts')
        .set('Authorization', `Bearer ${tenant1Token}`) // Professional tier
        .send({
          productId: product1Id,
          forecastDate: '2025-11-01',
          periodType: 'daily',
          forecastType: 'demand',
          modelType: 'arima',
          predictedValue: 100,
          confidenceLower: 80,
          confidenceUpper: 120,
          accuracyScore: 0.95
        })
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.predicted_value).toBe(100)
    })

    it('should isolate forecasts between tenants', async () => {
      // Tenant 1 should see their forecasts
      const forecasts1 = await request(app)
        .get('/api/forecasts')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .expect(200)

      expect(forecasts1.body.success).toBe(true)
      expect(forecasts1.body.data.every(f => f.product_id === product1Id)).toBe(true)
    })
  })

  // ==================== SCENARIOS API TESTS ====================

  describe('Scenarios API - Feature Flag Enforcement', () => {
    it('should block Starter tier from creating scenarios', async () => {
      const response = await request(app)
        .post('/api/scenarios')
        .set('Authorization', `Bearer ${tenant2Token}`) // Starter tier
        .send({
          name: 'Test Scenario',
          scenarioType: 'demand',
          baselineValue: 100,
          adjustedValue: 120
        })
        .expect(403)

      expect(response.body.error).toBe('feature_not_available')
      expect(response.body.message).toContain('what if')
    })

    it('should allow Professional tier to create scenarios', async () => {
      const response = await request(app)
        .post('/api/scenarios')
        .set('Authorization', `Bearer ${tenant1Token}`) // Professional tier
        .send({
          name: 'Demand Increase Test',
          scenarioType: 'demand',
          description: 'Test scenario for demand increase',
          baselineValue: 100,
          adjustedValue: 120,
          confidence: 0.8,
          probability: 0.6
        })
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.name).toBe('Demand Increase Test')
    })
  })

  // ==================== WORKING CAPITAL API TESTS ====================

  describe('Working Capital API - Tenant Isolation', () => {
    beforeEach(async () => {
      // Create working capital metrics for both tenants
      await tenantPrisma.queryRaw(
        tenant1.schemaName,
        `INSERT INTO working_capital_metrics (metric_date, cash, accounts_receivable, accounts_payable, inventory_value, current_assets, current_liabilities, working_capital, dso, dpo, dio, ccc)
         VALUES ('2025-10-19', 50000, 30000, 20000, 10000, 90000, 20000, 70000, 30, 45, 15, 0)`,
        []
      )

      await tenantPrisma.queryRaw(
        tenant2.schemaName,
        `INSERT INTO working_capital_metrics (metric_date, cash, accounts_receivable, accounts_payable, inventory_value, current_assets, current_liabilities, working_capital, dso, dpo, dio, ccc)
         VALUES ('2025-10-19', 25000, 15000, 10000, 5000, 45000, 10000, 35000, 35, 40, 20, 15)`,
        []
      )
    })

    it('should isolate working capital metrics between tenants', async () => {
      // Tenant 1's working capital
      const wc1 = await request(app)
        .get('/api/working-capital')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .expect(200)

      expect(wc1.body.success).toBe(true)
      expect(wc1.body.data.cash).toBe(50000)
      expect(wc1.body.data.working_capital).toBe(70000)

      // Tenant 2's working capital
      const wc2 = await request(app)
        .get('/api/working-capital')
        .set('Authorization', `Bearer ${tenant2Token}`)
        .expect(200)

      expect(wc2.body.success).toBe(true)
      expect(wc2.body.data.cash).toBe(25000)
      expect(wc2.body.data.working_capital).toBe(35000)
    })
  })

  // ==================== CROSS-TENANT SECURITY TESTS ====================

  describe('Cross-Tenant Security', () => {
    it('should never leak data across tenants', async () => {
      // Get all product IDs from Tenant 1
      const t1Products = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .expect(200)

      const t1ProductIds = t1Products.body.data.map(p => p.id)

      // Get all product IDs from Tenant 2
      const t2Products = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${tenant2Token}`)
        .expect(200)

      const t2ProductIds = t2Products.body.data.map(p => p.id)

      // Verify no overlap
      const overlap = t1ProductIds.filter(id => t2ProductIds.includes(id))
      expect(overlap).toHaveLength(0)
    })

    it('should prevent tenant switching via token manipulation', async () => {
      // Attempt to create a malicious token with a different org ID
      const maliciousToken = createMockClerkToken('org_nonexistent', 'user_123')

      const response = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${maliciousToken}`)
        .expect(404)

      expect(response.body.error).toBe('tenant_not_found')
    })
  })
})

// ==================== HELPER FUNCTIONS ====================

/**
 * Create a mock Clerk JWT token for testing
 * In production, use real Clerk tokens
 */
function createMockClerkToken(orgId, userId) {
  // This is a simplified mock token
  // In production, use Clerk's test helpers or create proper JWT tokens
  const payload = {
    orgId,
    userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  }

  // Base64 encode the payload (not secure, just for testing)
  return `mock.${Buffer.from(JSON.stringify(payload)).toString('base64')}.signature`
}
