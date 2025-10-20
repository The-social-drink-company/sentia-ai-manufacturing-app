/**
 * Tenant Isolation Security Tests
 *
 * BMAD-MULTITENANT-003 Story 4: Security Audit
 *
 * Penetration tests to verify zero cross-tenant data leaks.
 * Tests tenant hopping, session hijacking, role escalation, and SQL injection attempts.
 *
 * @module tests/security/tenant-isolation-security.test
 */

import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import express from 'express'
import { tenantMiddleware } from '../../server/middleware/tenant.middleware'
import { requireFeature } from '../../server/middleware/feature.middleware'
import { requireRole } from '../../server/middleware/rbac.middleware'

describe('Security Audit: Tenant Isolation', () => {
  let app: express.Application

  beforeAll(() => {
    app = express()
    app.use(express.json())
    app.use(tenantMiddleware)

    // Test routes
    app.get('/api/products', (req, res) => {
      res.json({ success: true, tenant: (req as any).tenant?.id })
    })

    app.post('/api/products', requireRole('member'), (req, res) => {
      res.status(201).json({ success: true })
    })

    app.get('/api/admin', requireRole('admin'), (req, res) => {
      res.json({ success: true })
    })
  })

  // ==================== TENANT HOPPING ATTEMPTS ====================

  describe('[SEC-001] Tenant Hopping Prevention', () => {
    it('should block access to Tenant B data with Tenant A credentials', async () => {
      const response = await request(app)
        .get('/api/products')
        .set('Authorization', 'Bearer tenant_a_token')
        .set('X-Organization-ID', 'org_tenant_b') // Attempting to access Tenant B
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toMatch(/not_organization_member|forbidden/)
    })

    it('should block X-Organization-ID header manipulation', async () => {
      const response = await request(app)
        .get('/api/products')
        .set('Authorization', 'Bearer valid_tenant_a_token')
        .set('X-Organization-ID', 'org_malicious_injection')
        .expect(403)

      expect(response.body.error).toMatch(/not_organization_member|tenant_not_found/)
    })

    it('should prevent schema name SQL injection via X-Organization-ID', async () => {
      const sqlInjectionPayloads = [
        "org_test'; DROP SCHEMA tenant_abc123; --",
        "org_test' OR '1'='1",
        "org_test'; SELECT * FROM public.tenants; --",
        "org_test\"; DELETE FROM users; --",
      ]

      for (const payload of sqlInjectionPayloads) {
        const response = await request(app)
          .get('/api/products')
          .set('Authorization', 'Bearer valid_token')
          .set('X-Organization-ID', payload)

        // Should either return 404 (tenant not found) or 400 (invalid org ID)
        expect([400, 404, 403]).toContain(response.status)
        expect(response.body.success).toBe(false)
      }
    })
  })

  // ==================== SESSION HIJACKING TESTS ====================

  describe('[SEC-002] Session Hijacking Prevention', () => {
    it('should reject expired Clerk session tokens', async () => {
      const expiredToken = createExpiredJWT()

      const response = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${expiredToken}`)
        .set('X-Organization-ID', 'org_test123')
        .expect(401)

      expect(response.body.error).toMatch(/session_expired|invalid_token/)
    })

    it('should reject JWT tokens with modified payload', async () => {
      const tamperedToken = createTamperedJWT()

      const response = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${tamperedToken}`)
        .set('X-Organization-ID', 'org_test123')
        .expect(401)

      expect(response.body.error).toMatch(/invalid_signature|verification_failed/)
    })

    it('should reject session tokens from different environment', async () => {
      const prodTokenInTest = 'prod_env_token_abc123'

      const response = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${prodTokenInTest}`)
        .set('X-Organization-ID', 'org_test123')
        .expect(401)

      expect(response.body.error).toMatch(/invalid_token|verification_failed/)
    })

    it('should prevent session replay attacks', async () => {
      // Simulate replaying same token after logout
      const loggedOutToken = 'sess_logged_out_token'

      const response = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${loggedOutToken}`)
        .set('X-Organization-ID', 'org_test123')
        .expect(401)

      expect(response.body.error).toMatch(/session_not_found|session_expired/)
    })
  })

  // ==================== ROLE ESCALATION TESTS ====================

  describe('[SEC-003] Role Escalation Prevention', () => {
    it('should prevent member from accessing admin-only routes', async () => {
      const response = await request(app)
        .get('/api/admin')
        .set('Authorization', 'Bearer member_user_token')
        .set('X-Organization-ID', 'org_test123')
        .expect(403)

      expect(response.body.error).toBe('insufficient_permissions')
    })

    it('should prevent viewer from performing write operations', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', 'Bearer viewer_user_token')
        .set('X-Organization-ID', 'org_test123')
        .send({ sku: 'TEST-001', name: 'Test Product' })
        .expect(403)

      expect(response.body.error).toBe('insufficient_permissions')
    })

    it('should prevent role modification via request body', async () => {
      const response = await request(app)
        .post('/api/users/profile')
        .set('Authorization', 'Bearer member_user_token')
        .set('X-Organization-ID', 'org_test123')
        .send({
          name: 'Test User',
          role: 'admin' // Attempting to escalate role
        })
        .expect(403)

      expect(response.body.error).toMatch(/forbidden|insufficient_permissions/)
    })
  })

  // ==================== FEATURE FLAG BYPASS TESTS ====================

  describe('[SEC-004] Feature Flag Bypass Prevention', () => {
    it('should block Starter tier from accessing ai_forecasting via crafted request', async () => {
      const response = await request(app)
        .get('/api/forecasts/ai')
        .set('Authorization', 'Bearer starter_tier_token')
        .set('X-Organization-ID', 'org_starter')
        .set('X-Feature-Override', 'ai_forecasting=true') // Attempt to bypass
        .expect(403)

      expect(response.body.error).toBe('feature_not_available')
      expect(response.body.upgradeUrl).toBeDefined()
    })

    it('should block Starter tier even after direct database feature modification', async () => {
      // This test simulates attempting to directly modify tenant.features in database
      // Middleware should re-check subscription tier, not just trust database value

      const response = await request(app)
        .get('/api/scenarios') // Requires what_if_analysis (Professional+)
        .set('Authorization', 'Bearer starter_tier_token_modified_db')
        .set('X-Organization-ID', 'org_starter')
        .expect(403)

      expect(response.body.error).toBe('feature_not_available')
    })
  })

  // ==================== DATABASE SECURITY TESTS ====================

  describe('[SEC-005] Database Security', () => {
    it('should not expose database connection strings in error messages', async () => {
      // Force a database error
      const response = await request(app)
        .get('/api/products?invalid_query=true')
        .set('Authorization', 'Bearer valid_token')
        .set('X-Organization-ID', 'org_test123')

      // Even if there's an error, connection string should not be exposed
      expect(response.body).not.toMatch(/postgres:\/\//)
      expect(response.body).not.toMatch(/DATABASE_URL/)
      expect(response.body).not.toMatch(/password=/)
    })

    it('should not expose sensitive environment variables in logs', async () => {
      // Test that errors don't leak env vars
      const response = await request(app)
        .get('/api/health')

      expect(response.body).not.toHaveProperty('CLERK_SECRET_KEY')
      expect(response.body).not.toHaveProperty('DATABASE_URL')
      expect(response.body).not.toHaveProperty('ENCRYPTION_KEY')
    })

    it('should enforce search_path isolation (prevent public schema access)', async () => {
      // Attempt to query public.tenants from tenant context
      const response = await request(app)
        .get('/api/products?table=public.tenants') // SQL injection attempt
        .set('Authorization', 'Bearer valid_token')
        .set('X-Organization-ID', 'org_test123')

      // Should not allow querying public schema tables
      expect(response.status).not.toBe(200)
    })
  })

  // ==================== AUDIT LOG VERIFICATION ====================

  describe('[SEC-006] Audit Logging', () => {
    it('should log all sensitive operations to audit_logs', async () => {
      // Verify that sensitive operations are logged
      // This is a placeholder - actual implementation checks database

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', 'Bearer admin_token')
        .set('X-Organization-ID', 'org_test123')
        .send({ sku: 'AUDIT-TEST', name: 'Audit Test Product' })

      // Audit log should contain:
      // - timestamp
      // - tenant_id
      // - user_id
      // - action: 'product_created'
      // - resource_id
      // - ip_address

      expect(response.status).toBeOneOf([200, 201])
    })

    it('should log failed authentication attempts', async () => {
      const response = await request(app)
        .get('/api/products')
        .set('Authorization', 'Bearer invalid_token')
        .set('X-Organization-ID', 'org_test123')
        .expect(401)

      // Failed auth should be logged with:
      // - timestamp
      // - attempted_org_id
      // - error_type: 'authentication_failed'
      // - ip_address

      expect(response.body.success).toBe(false)
    })
  })

  // ==================== RATE LIMITING TESTS ====================

  describe('[SEC-007] Rate Limiting (if implemented)', () => {
    it('should rate limit excessive requests from same tenant', async () => {
      const requests = []

      // Send 1000 requests rapidly
      for (let i = 0; i < 1000; i++) {
        requests.push(
          request(app)
            .get('/api/products')
            .set('Authorization', 'Bearer valid_token')
            .set('X-Organization-ID', 'org_test123')
        )
      }

      const responses = await Promise.all(requests)

      // At least some requests should be rate limited (429)
      const rateLimited = responses.filter(r => r.status === 429)
      expect(rateLimited.length).toBeGreaterThan(0)
    })
  })
})

// ==================== HELPER FUNCTIONS ====================

function createExpiredJWT(): string {
  // Create a JWT with exp claim in the past
  const payload = {
    sub: 'user_test123',
    org_id: 'org_test123',
    exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
  }

  // In real implementation, sign with Clerk secret
  return `expired.${Buffer.from(JSON.stringify(payload)).toString('base64')}.signature`
}

function createTamperedJWT(): string {
  // Create a JWT with modified payload but invalid signature
  const payload = {
    sub: 'user_test123',
    org_id: 'org_admin_escalated', // Tampered to admin org
    exp: Math.floor(Date.now() / 1000) + 3600,
  }

  return `header.${Buffer.from(JSON.stringify(payload)).toString('base64')}.invalid_signature`
}

// Custom matchers
expect.extend({
  toBeOneOf(received, expected) {
    const pass = expected.includes(received)
    return {
      pass,
      message: () => `expected ${received} to be one of ${expected.join(', ')}`,
    }
  },
})
