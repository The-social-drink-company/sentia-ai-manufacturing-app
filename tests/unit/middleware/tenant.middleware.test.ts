/**
 * Tenant Middleware Unit Tests
 *
 * BMAD-MULTITENANT-002 Story 10: Comprehensive Unit Tests
 *
 * Tests for tenant identification, database schema switching,
 * and request context enrichment.
 *
 * @module tests/unit/middleware/tenant.middleware.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { tenantMiddleware, requireTenant, requireUser } from '../../../server/middleware/tenant.middleware'
import {
  createMockClerkClient,
  createMockSession,
  createMockUser,
  createMockOrganization,
  createMockMembership
} from '../../mocks/clerk.mock'
import { createMockPrismaClient, createMockTenant, createMockDbUser } from '../../mocks/prisma.mock'
import { createMockExpressContext, getResponseStatus, getResponseJson, wasNextCalled } from '../../mocks/express.mock'

// Mock Clerk and Prisma modules
vi.mock('@clerk/clerk-sdk-node', () => ({
  clerkClient: createMockClerkClient()
}))

vi.mock('../../../server/lib/prisma-tenant', () => ({
  prisma: createMockPrismaClient()
}))

describe('Tenant Middleware', () => {
  let mockClerk: ReturnType<typeof createMockClerkClient>
  let mockPrisma: ReturnType<typeof createMockPrismaClient>

  beforeEach(() => {
    mockClerk = createMockClerkClient()
    mockPrisma = createMockPrismaClient()
    vi.clearAllMocks()
  })

  describe('tenantMiddleware', () => {
    it('should successfully identify tenant and set context', async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext({
        headers: {
          'authorization': 'Bearer sess_test123',
          'x-organization-id': 'org_test123'
        }
      })

      const tenant = createMockTenant()
      const user = createMockDbUser()

      mockPrisma.addTenant(tenant)
      mockPrisma.addUser(user)

      // Act
      await tenantMiddleware(req as any, res as any, next)

      // Assert
      expect(wasNextCalled(next)).toBe(true)
      expect(req.tenant).toBeDefined()
      expect(req.tenant?.id).toBe(tenant.id)
      expect(req.user).toBeDefined()
      expect(req.user?.id).toBe(user.id)
      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('SET search_path')
      )
    })

    it('should return 401 when Authorization header is missing', async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext({
        headers: {}
      })

      // Act
      await tenantMiddleware(req as any, res as any, next)

      // Assert
      expect(getResponseStatus(res)).toBe(401)
      expect(getResponseJson(res)).toMatchObject({
        success: false,
        error: 'missing_authorization'
      })
      expect(wasNextCalled(next)).toBe(false)
    })

    it('should return 401 when X-Organization-ID header is missing', async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext({
        headers: {
          'authorization': 'Bearer sess_test123'
        }
      })

      // Act
      await tenantMiddleware(req as any, res as any, next)

      // Assert
      expect(getResponseStatus(res)).toBe(401)
      expect(getResponseJson(res)).toMatchObject({
        success: false,
        error: 'missing_organization_id'
      })
      expect(wasNextCalled(next)).toBe(false)
    })

    it('should return 401 when Clerk session is invalid', async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext({
        headers: {
          'authorization': 'Bearer invalid_session',
          'x-organization-id': 'org_test123'
        }
      })

      mockClerk.addSession(createMockSession({
        id: 'invalid_session',
        status: 'expired'
      }))

      // Act
      await tenantMiddleware(req as any, res as any, next)

      // Assert
      expect(getResponseStatus(res)).toBe(401)
      expect(getResponseJson(res)).toMatchObject({
        success: false,
        error: 'session_verification_failed'
      })
    })

    it('should return 403 when user is not a member of the organization', async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext({
        headers: {
          'authorization': 'Bearer sess_test123',
          'x-organization-id': 'org_different123'
        }
      })

      // User has no membership to org_different123
      mockClerk.addSession(createMockSession())
      mockClerk.addUser(createMockUser())

      // Act
      await tenantMiddleware(req as any, res as any, next)

      // Assert
      expect(getResponseStatus(res)).toBe(403)
      expect(getResponseJson(res)).toMatchObject({
        success: false,
        error: 'not_organization_member'
      })
    })

    it('should return 404 when tenant does not exist', async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext({
        headers: {
          'authorization': 'Bearer sess_test123',
          'x-organization-id': 'org_test123'
        }
      })

      mockClerk.addSession(createMockSession())
      mockClerk.addUser(createMockUser())
      const org = createMockOrganization()
      mockClerk.addOrganization(org)
      mockClerk.addMembership('user_test123', createMockMembership(org))

      // No tenant in database

      // Act
      await tenantMiddleware(req as any, res as any, next)

      // Assert
      expect(getResponseStatus(res)).toBe(404)
      expect(getResponseJson(res)).toMatchObject({
        success: false,
        error: 'tenant_not_found'
      })
    })

    it('should return 403 when subscription is suspended', async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext({
        headers: {
          'authorization': 'Bearer sess_test123',
          'x-organization-id': 'org_test123'
        }
      })

      const tenant = createMockTenant({
        subscriptionStatus: 'suspended'
      })

      mockPrisma.addTenant(tenant)

      // Act
      await tenantMiddleware(req as any, res as any, next)

      // Assert
      expect(getResponseStatus(res)).toBe(403)
      expect(getResponseJson(res)).toMatchObject({
        success: false,
        error: 'subscription_suspended'
      })
    })

    it('should return 402 when subscription is past_due', async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext({
        headers: {
          'authorization': 'Bearer sess_test123',
          'x-organization-id': 'org_test123'
        }
      })

      const tenant = createMockTenant({
        subscriptionStatus: 'past_due'
      })

      mockPrisma.addTenant(tenant)

      // Act
      await tenantMiddleware(req as any, res as any, next)

      // Assert
      expect(getResponseStatus(res)).toBe(402)
      expect(getResponseJson(res)).toMatchObject({
        success: false,
        error: 'payment_required'
      })
    })

    it('should auto-create user if not exists', async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext({
        headers: {
          'authorization': 'Bearer sess_test123',
          'x-organization-id': 'org_test123'
        }
      })

      const tenant = createMockTenant()
      mockPrisma.addTenant(tenant)

      // User does NOT exist in database
      mockPrisma.user.findUnique = vi.fn().mockResolvedValue(null)

      const clerkUser = createMockUser()
      mockClerk.addSession(createMockSession())
      mockClerk.addUser(clerkUser)

      // Act
      await tenantMiddleware(req as any, res as any, next)

      // Assert
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          clerkUserId: clerkUser.id,
          tenantId: tenant.id,
          email: clerkUser.emailAddresses[0].emailAddress
        })
      })
      expect(wasNextCalled(next)).toBe(true)
    })

    it('should set PostgreSQL search_path to tenant schema', async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext({
        headers: {
          'authorization': 'Bearer sess_test123',
          'x-organization-id': 'org_test123'
        }
      })

      const tenant = createMockTenant({
        schemaName: 'tenant_abc123'
      })
      const user = createMockDbUser()

      mockPrisma.addTenant(tenant)
      mockPrisma.addUser(user)

      // Act
      await tenantMiddleware(req as any, res as any, next)

      // Assert
      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledWith(
        'SET search_path TO "tenant_abc123", public'
      )
    })

    it('should update user lastLoginAt timestamp', async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext({
        headers: {
          'authorization': 'Bearer sess_test123',
          'x-organization-id': 'org_test123'
        }
      })

      const tenant = createMockTenant()
      const user = createMockDbUser({
        lastLoginAt: new Date('2025-01-01')
      })

      mockPrisma.addTenant(tenant)
      mockPrisma.addUser(user)

      // Act
      await tenantMiddleware(req as any, res as any, next)

      // Assert
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { clerkUserId: user.clerkUserId },
        data: {
          lastLoginAt: expect.any(Date)
        }
      })
    })
  })

  describe('requireTenant', () => {
    it('should call next() when tenant context exists', () => {
      // Arrange
      const { req, res, next } = createMockExpressContext()
      req.tenant = createMockTenant()

      // Act
      requireTenant(req as any, res as any, next)

      // Assert
      expect(wasNextCalled(next)).toBe(true)
    })

    it('should return 401 when tenant context is missing', () => {
      // Arrange
      const { req, res, next } = createMockExpressContext()

      // Act
      requireTenant(req as any, res as any, next)

      // Assert
      expect(getResponseStatus(res)).toBe(401)
      expect(getResponseJson(res)).toMatchObject({
        success: false,
        error: 'tenant_context_missing'
      })
      expect(wasNextCalled(next)).toBe(false)
    })
  })

  describe('requireUser', () => {
    it('should call next() when user context exists', () => {
      // Arrange
      const { req, res, next } = createMockExpressContext()
      req.user = createMockDbUser()

      // Act
      requireUser(req as any, res as any, next)

      // Assert
      expect(wasNextCalled(next)).toBe(true)
    })

    it('should return 401 when user context is missing', () => {
      // Arrange
      const { req, res, next } = createMockExpressContext()

      // Act
      requireUser(req as any, res as any, next)

      // Assert
      expect(getResponseStatus(res)).toBe(401)
      expect(getResponseJson(res)).toMatchObject({
        success: false,
        error: 'user_context_missing'
      })
      expect(wasNextCalled(next)).toBe(false)
    })
  })
})
