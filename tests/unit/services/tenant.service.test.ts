/**
 * Tenant Service Unit Tests
 *
 * BMAD-MULTITENANT-002 Story 10: Comprehensive Unit Tests
 *
 * Tests for tenant lifecycle management including creation,
 * deletion, and schema provisioning.
 *
 * @module tests/unit/services/tenant.service.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TenantService } from '../../../server/services/tenant.service'
import { createMockPrismaClient, createMockTenant } from '../../mocks/prisma.mock'

// Mock Prisma client
vi.mock('../../../server/lib/prisma-tenant', () => ({
  prisma: createMockPrismaClient()
}))

describe('TenantService', () => {
  let tenantService: TenantService
  let mockPrisma: ReturnType<typeof createMockPrismaClient>

  beforeEach(() => {
    mockPrisma = createMockPrismaClient()
    tenantService = new TenantService()
    vi.clearAllMocks()
  })

  describe('createTenant', () => {
    it('should successfully create tenant with all components', async () => {
      // Arrange
      const input = {
        name: 'Test Company',
        slug: 'test-company',
        clerkOrganizationId: 'org_test123',
        subscriptionTier: 'professional' as const,
        ownerEmail: 'owner@test.com'
      }

      // Act
      const tenant = await tenantService.createTenant(input)

      // Assert
      expect(tenant).toBeDefined()
      expect(tenant.name).toBe('Test Company')
      expect(tenant.slug).toBe('test-company')
      expect(tenant.subscriptionTier).toBe('professional')
      expect(mockPrisma.tenant.create).toHaveBeenCalled()
      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('CREATE SCHEMA')
      )
    })

    it('should set correct feature flags for starter tier', async () => {
      // Arrange
      const input = {
        name: 'Starter Company',
        slug: 'starter-company',
        clerkOrganizationId: 'org_starter',
        subscriptionTier: 'starter' as const,
        ownerEmail: 'starter@test.com'
      }

      // Act
      const tenant = await tenantService.createTenant(input)

      // Assert
      expect(tenant.features.basic_forecasting).toBe(true)
      expect(tenant.features.ai_forecasting).toBe(false)
      expect(tenant.features.what_if_analysis).toBe(false)
      expect(tenant.features.custom_integrations).toBe(false)
      expect(tenant.maxUsers).toBe(5)
      expect(tenant.maxEntities).toBe(500)
    })

    it('should set correct feature flags for professional tier', async () => {
      // Arrange
      const input = {
        name: 'Professional Company',
        slug: 'pro-company',
        clerkOrganizationId: 'org_pro',
        subscriptionTier: 'professional' as const,
        ownerEmail: 'pro@test.com'
      }

      // Act
      const tenant = await tenantService.createTenant(input)

      // Assert
      expect(tenant.features.basic_forecasting).toBe(true)
      expect(tenant.features.ai_forecasting).toBe(true)
      expect(tenant.features.what_if_analysis).toBe(true)
      expect(tenant.features.priority_support).toBe(true)
      expect(tenant.features.custom_integrations).toBe(false)
      expect(tenant.maxUsers).toBe(25)
      expect(tenant.maxEntities).toBe(5000)
    })

    it('should set correct feature flags for enterprise tier', async () => {
      // Arrange
      const input = {
        name: 'Enterprise Company',
        slug: 'enterprise-company',
        clerkOrganizationId: 'org_enterprise',
        subscriptionTier: 'enterprise' as const,
        ownerEmail: 'enterprise@test.com'
      }

      // Act
      const tenant = await tenantService.createTenant(input)

      // Assert
      expect(tenant.features.basic_forecasting).toBe(true)
      expect(tenant.features.ai_forecasting).toBe(true)
      expect(tenant.features.what_if_analysis).toBe(true)
      expect(tenant.features.multi_entity).toBe(true)
      expect(tenant.features.api_access).toBe(true)
      expect(tenant.features.white_label).toBe(true)
      expect(tenant.features.custom_integrations).toBe(true)
      expect(tenant.maxUsers).toBe(100)
      expect(tenant.maxEntities).toBe(999999)
    })

    it('should create PostgreSQL schema with tenant prefix', async () => {
      // Arrange
      const input = {
        name: 'Schema Test',
        slug: 'schema-test',
        clerkOrganizationId: 'org_schema',
        subscriptionTier: 'professional' as const,
        ownerEmail: 'schema@test.com'
      }

      // Act
      const tenant = await tenantService.createTenant(input)

      // Assert
      expect(tenant.schemaName).toMatch(/^tenant_[a-f0-9]{32}$/)
      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining(`CREATE SCHEMA IF NOT EXISTS "${tenant.schemaName}"`)
      )
    })

    it('should rollback on failure', async () => {
      // Arrange
      const input = {
        name: 'Failure Test',
        slug: 'failure-test',
        clerkOrganizationId: 'org_failure',
        subscriptionTier: 'professional' as const,
        ownerEmail: 'failure@test.com'
      }

      // Mock failure during schema creation
      mockPrisma.$executeRawUnsafe = vi.fn().mockRejectedValue(new Error('Schema creation failed'))

      // Act & Assert
      await expect(tenantService.createTenant(input)).rejects.toThrow('Tenant creation failed')

      // Verify cleanup was attempted
      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalled()
    })
  })

  describe('deleteTenant', () => {
    it('should successfully delete tenant and schema', async () => {
      // Arrange
      const tenant = createMockTenant()
      mockPrisma.addTenant(tenant)

      // Act
      await tenantService.deleteTenant(tenant.id)

      // Assert
      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining(`DROP SCHEMA IF EXISTS "${tenant.schemaName}" CASCADE`)
      )
      expect(mockPrisma.tenant.delete).toHaveBeenCalledWith({
        where: { id: tenant.id }
      })
    })

    it('should throw error when tenant does not exist', async () => {
      // Arrange
      const nonExistentId = 'tenant_nonexistent'

      // Mock tenant not found
      mockPrisma.tenant.findUnique = vi.fn().mockResolvedValue(null)

      // Act & Assert
      await expect(tenantService.deleteTenant(nonExistentId)).rejects.toThrow('Tenant not found')
    })
  })

  describe('softDeleteTenant', () => {
    it('should mark tenant as deleted without removing data', async () => {
      // Arrange
      const tenant = createMockTenant()
      mockPrisma.addTenant(tenant)

      // Act
      const result = await tenantService.softDeleteTenant(tenant.id)

      // Assert
      expect(result.deletedAt).toBeDefined()
      expect(result.subscriptionStatus).toBe('cancelled')
      expect(mockPrisma.tenant.update).toHaveBeenCalledWith({
        where: { id: tenant.id },
        data: {
          deletedAt: expect.any(Date),
          subscriptionStatus: 'cancelled'
        }
      })
    })
  })

  describe('updateTenant', () => {
    it('should update tenant metadata', async () => {
      // Arrange
      const tenant = createMockTenant()
      mockPrisma.addTenant(tenant)

      const updates = {
        name: 'Updated Name',
        subscriptionTier: 'enterprise' as const
      }

      // Act
      const result = await tenantService.updateTenant(tenant.id, updates)

      // Assert
      expect(result.name).toBe('Updated Name')
      expect(result.subscriptionTier).toBe('enterprise')
      expect(mockPrisma.tenant.update).toHaveBeenCalledWith({
        where: { id: tenant.id },
        data: expect.objectContaining({
          name: 'Updated Name',
          subscriptionTier: 'enterprise',
          updatedAt: expect.any(Date)
        })
      })
    })
  })

  describe('getTenantByClerkOrgId', () => {
    it('should find tenant by Clerk organization ID', async () => {
      // Arrange
      const tenant = createMockTenant()
      mockPrisma.addTenant(tenant)

      // Act
      const result = await tenantService.getTenantByClerkOrgId(tenant.clerkOrganizationId)

      // Assert
      expect(result).toBeDefined()
      expect(result?.id).toBe(tenant.id)
      expect(mockPrisma.tenant.findUnique).toHaveBeenCalledWith({
        where: { clerkOrganizationId: tenant.clerkOrganizationId }
      })
    })

    it('should return null when tenant does not exist', async () => {
      // Arrange
      mockPrisma.tenant.findUnique = vi.fn().mockResolvedValue(null)

      // Act
      const result = await tenantService.getTenantByClerkOrgId('org_nonexistent')

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('getTenantBySlug', () => {
    it('should find tenant by slug', async () => {
      // Arrange
      const tenant = createMockTenant()
      mockPrisma.addTenant(tenant)

      // Act
      const result = await tenantService.getTenantBySlug(tenant.slug)

      // Assert
      expect(result).toBeDefined()
      expect(result?.id).toBe(tenant.id)
      expect(mockPrisma.tenant.findUnique).toHaveBeenCalledWith({
        where: { slug: tenant.slug }
      })
    })
  })

  describe('isSlugAvailable', () => {
    it('should return true when slug is available', async () => {
      // Arrange
      mockPrisma.tenant.findUnique = vi.fn().mockResolvedValue(null)

      // Act
      const result = await tenantService.isSlugAvailable('available-slug')

      // Assert
      expect(result).toBe(true)
    })

    it('should return false when slug is taken', async () => {
      // Arrange
      const tenant = createMockTenant({ slug: 'taken-slug' })
      mockPrisma.addTenant(tenant)

      // Act
      const result = await tenantService.isSlugAvailable('taken-slug')

      // Assert
      expect(result).toBe(false)
    })
  })
})
