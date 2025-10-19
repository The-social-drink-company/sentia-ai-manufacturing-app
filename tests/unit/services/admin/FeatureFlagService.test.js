/**
 * FeatureFlagService Unit Tests
 *
 * Tests feature flag management, targeting logic, and approval workflows
 *
 * Coverage:
 * - Feature flag creation and CRUD operations
 * - Toggle with production approval workflow
 * - Targeting evaluation (percentage, users, roles, environment)
 * - History tracking
 * - Error handling
 *
 * @module tests/unit/services/admin/FeatureFlagService.test.js
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import FeatureFlagService from '../../../../server/services/admin/FeatureFlagService.js'
import prisma from '../../../../server/lib/prisma.js'

// Mock Prisma
vi.mock('../../../../server/lib/prisma.js', () => ({
  default: {
    adminFeatureFlag: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    adminFeatureFlagHistory: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

// Mock logger
vi.mock('../../../../server/utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock ApprovalService for production approval workflow
vi.mock('../../../../server/services/admin/ApprovalService.js', () => ({
  default: {
    createApprovalRequest: vi.fn().mockResolvedValue({
      id: 'approval-123',
      status: 'PENDING',
      type: 'FEATURE_FLAG',
    }),
  },
}))

describe('FeatureFlagService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createFeatureFlag', () => {
    it('should create a new feature flag with history', async () => {
      const mockFlag = {
        id: 'flag-123',
        key: 'test-feature',
        name: 'Test Feature',
        description: 'Test description',
        category: 'FEATURE',
        environment: 'development',
        isEnabled: false,
        rolloutPercentage: 0,
        targetUsers: [],
        targetRoles: [],
        conditions: null,
        tags: ['test'],
        owner: 'user-123',
        lastModifiedBy: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      prisma.adminFeatureFlag.create.mockResolvedValue(mockFlag)
      prisma.adminFeatureFlagHistory.create.mockResolvedValue({
        id: 'history-123',
        flagId: 'flag-123',
        action: 'CREATED',
        changedBy: 'user-123',
      })

      const result = await FeatureFlagService.createFeatureFlag({
        key: 'test-feature',
        name: 'Test Feature',
        description: 'Test description',
        category: 'FEATURE',
        environment: 'development',
        owner: 'user-123',
        lastModifiedBy: 'user-123',
        tags: ['test'],
      })

      expect(result).toMatchObject({
        id: 'flag-123',
        key: 'test-feature',
        name: 'Test Feature',
      })

      expect(prisma.adminFeatureFlag.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          key: 'test-feature',
          name: 'Test Feature',
          category: 'FEATURE',
          environment: 'development',
          isEnabled: false,
          rolloutPercentage: 0,
        }),
      })

      expect(prisma.adminFeatureFlagHistory.create).toHaveBeenCalledWith({
        data: {
          flagId: 'flag-123',
          action: 'CREATED',
          previousValue: null,
          newValue: expect.any(Object),
          changedBy: 'user-123',
          changedAt: expect.any(Date),
          comment: 'Feature flag created',
        },
      })
    })

    it('should validate required fields', async () => {
      await expect(
        FeatureFlagService.createFeatureFlag({
          name: 'Test Feature',
          category: 'FEATURE',
        })
      ).rejects.toThrow('Missing required fields: key, name, category')

      await expect(
        FeatureFlagService.createFeatureFlag({
          key: 'test-feature',
          category: 'FEATURE',
        })
      ).rejects.toThrow('Missing required fields: key, name, category')
    })

    it('should reject duplicate keys', async () => {
      prisma.adminFeatureFlag.create.mockRejectedValue(
        new Error('Unique constraint failed on the fields: (`key`)')
      )

      await expect(
        FeatureFlagService.createFeatureFlag({
          key: 'existing-key',
          name: 'Test',
          category: 'FEATURE',
          lastModifiedBy: 'user-123',
        })
      ).rejects.toThrow()
    })
  })

  describe('toggleFeatureFlag', () => {
    it('should toggle non-production flag immediately', async () => {
      const mockFlag = {
        id: 'flag-dev',
        key: 'dev-feature',
        environment: 'development',
        isEnabled: false,
      }

      prisma.adminFeatureFlag.findUnique.mockResolvedValue(mockFlag)
      prisma.adminFeatureFlag.update.mockResolvedValue({
        ...mockFlag,
        isEnabled: true,
        updatedAt: new Date(),
      })
      prisma.adminFeatureFlagHistory.create.mockResolvedValue({
        id: 'history-toggle',
      })

      const result = await FeatureFlagService.toggleFeatureFlag('flag-dev', true, 'user-123')

      expect(result.approvalRequired).toBe(false)
      expect(result.flag.isEnabled).toBe(true)

      expect(prisma.adminFeatureFlag.update).toHaveBeenCalledWith({
        where: { id: 'flag-dev' },
        data: {
          isEnabled: true,
          lastModifiedBy: 'user-123',
          updatedAt: expect.any(Date),
        },
      })

      expect(prisma.adminFeatureFlagHistory.create).toHaveBeenCalledWith({
        data: {
          flagId: 'flag-dev',
          action: 'TOGGLED',
          previousValue: { isEnabled: false },
          newValue: { isEnabled: true },
          changedBy: 'user-123',
          changedAt: expect.any(Date),
          comment: 'Feature flag enabled',
        },
      })
    })

    it('should require approval for production flag toggle', async () => {
      const mockFlag = {
        id: 'flag-prod',
        key: 'prod-feature',
        environment: 'production',
        isEnabled: false,
        name: 'Production Feature',
        description: 'Important feature',
      }

      const ApprovalService = (await import('../../../../server/services/admin/ApprovalService.js'))
        .default

      prisma.adminFeatureFlag.findUnique.mockResolvedValue(mockFlag)

      const result = await FeatureFlagService.toggleFeatureFlag('flag-prod', true, 'user-123')

      expect(result.approvalRequired).toBe(true)
      expect(result.approval).toBeDefined()
      expect(result.approval.type).toBe('FEATURE_FLAG')

      expect(ApprovalService.createApprovalRequest).toHaveBeenCalledWith({
        type: 'FEATURE_FLAG',
        category: 'CONFIGURATION',
        priority: 'HIGH',
        title: expect.stringContaining('prod-feature'),
        description: expect.stringContaining('production'),
        requestedChanges: {
          flagId: 'flag-prod',
          flagKey: 'prod-feature',
          enabled: true,
        },
        rationale: expect.any(String),
        requesterId: 'user-123',
      })

      // Should NOT update flag directly
      expect(prisma.adminFeatureFlag.update).not.toHaveBeenCalled()
    })

    it('should reject toggle if flag not found', async () => {
      prisma.adminFeatureFlag.findUnique.mockResolvedValue(null)

      await expect(
        FeatureFlagService.toggleFeatureFlag('nonexistent', true, 'user-123')
      ).rejects.toThrow('Feature flag not found')
    })
  })

  describe('evaluateFeatureFlag', () => {
    it('should return false if flag not found', async () => {
      prisma.adminFeatureFlag.findUnique.mockResolvedValue(null)

      const result = await FeatureFlagService.evaluateFeatureFlag('nonexistent', {
        userId: 'user-123',
        environment: 'production',
      })

      expect(result.enabled).toBe(false)
      expect(result.reason).toBe('flag_not_found')
    })

    it('should return false if flag is disabled', async () => {
      prisma.adminFeatureFlag.findUnique.mockResolvedValue({
        id: 'flag-disabled',
        key: 'disabled-feature',
        isEnabled: false,
        environment: 'production',
      })

      const result = await FeatureFlagService.evaluateFeatureFlag('disabled-feature', {
        userId: 'user-123',
        environment: 'production',
      })

      expect(result.enabled).toBe(false)
      expect(result.reason).toBe('flag_disabled')
    })

    it('should return false if environment mismatch', async () => {
      prisma.adminFeatureFlag.findUnique.mockResolvedValue({
        id: 'flag-prod',
        key: 'prod-only',
        isEnabled: true,
        environment: 'production',
      })

      const result = await FeatureFlagService.evaluateFeatureFlag('prod-only', {
        userId: 'user-123',
        environment: 'development',
      })

      expect(result.enabled).toBe(false)
      expect(result.reason).toBe('environment_mismatch')
    })

    it('should return true if user in targetUsers', async () => {
      prisma.adminFeatureFlag.findUnique.mockResolvedValue({
        id: 'flag-targeted',
        key: 'user-targeted',
        isEnabled: true,
        environment: 'production',
        targetUsers: ['user-123', 'user-456'],
        rolloutPercentage: 0,
      })

      const result = await FeatureFlagService.evaluateFeatureFlag('user-targeted', {
        userId: 'user-123',
        environment: 'production',
      })

      expect(result.enabled).toBe(true)
      expect(result.reason).toBe('user_targeted')
    })

    it('should return true if user role in targetRoles', async () => {
      prisma.adminFeatureFlag.findUnique.mockResolvedValue({
        id: 'flag-role',
        key: 'admin-only',
        isEnabled: true,
        environment: 'production',
        targetRoles: ['ADMIN', 'MANAGER'],
        rolloutPercentage: 0,
      })

      const result = await FeatureFlagService.evaluateFeatureFlag('admin-only', {
        userId: 'user-123',
        userRole: 'ADMIN',
        environment: 'production',
      })

      expect(result.enabled).toBe(true)
      expect(result.reason).toBe('role_targeted')
    })

    it('should evaluate percentage rollout deterministically', async () => {
      prisma.adminFeatureFlag.findUnique.mockResolvedValue({
        id: 'flag-rollout',
        key: 'gradual-rollout',
        isEnabled: true,
        environment: 'production',
        rolloutPercentage: 50,
      })

      // Test with same userId multiple times - should be deterministic
      const result1 = await FeatureFlagService.evaluateFeatureFlag('gradual-rollout', {
        userId: 'user-stable',
        environment: 'production',
      })

      const result2 = await FeatureFlagService.evaluateFeatureFlag('gradual-rollout', {
        userId: 'user-stable',
        environment: 'production',
      })

      expect(result1.enabled).toBe(result2.enabled)
      expect(result1.reason).toContain('percentage')
    })

    it('should return true for 100% rollout', async () => {
      prisma.adminFeatureFlag.findUnique.mockResolvedValue({
        id: 'flag-full',
        key: 'full-rollout',
        isEnabled: true,
        environment: 'production',
        rolloutPercentage: 100,
      })

      const result = await FeatureFlagService.evaluateFeatureFlag('full-rollout', {
        userId: 'any-user',
        environment: 'production',
      })

      expect(result.enabled).toBe(true)
      expect(result.reason).toBe('percentage_included')
    })
  })

  describe('getFeatureFlags', () => {
    it('should return paginated feature flags with filters', async () => {
      const mockFlags = [
        { id: 'flag-1', key: 'feature-1', environment: 'production', isEnabled: true },
        { id: 'flag-2', key: 'feature-2', environment: 'production', isEnabled: false },
      ]

      prisma.adminFeatureFlag.count.mockResolvedValue(25)
      prisma.adminFeatureFlag.findMany.mockResolvedValue(mockFlags)

      const result = await FeatureFlagService.getFeatureFlags(
        { environment: 'production' },
        { page: 1, limit: 20 }
      )

      expect(result.flags).toHaveLength(2)
      expect(result.pagination).toEqual({
        total: 25,
        page: 1,
        limit: 20,
        totalPages: 2,
      })

      expect(prisma.adminFeatureFlag.findMany).toHaveBeenCalledWith({
        where: { environment: 'production' },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      })
    })

    it('should filter by multiple criteria', async () => {
      await FeatureFlagService.getFeatureFlags(
        {
          environment: 'production',
          isEnabled: true,
          category: 'FEATURE',
        },
        { page: 1, limit: 10 }
      )

      expect(prisma.adminFeatureFlag.findMany).toHaveBeenCalledWith({
        where: {
          environment: 'production',
          isEnabled: true,
          category: 'FEATURE',
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      })
    })

    it('should exclude deprecated flags by default', async () => {
      await FeatureFlagService.getFeatureFlags({}, { page: 1, limit: 20 })

      expect(prisma.adminFeatureFlag.findMany).toHaveBeenCalledWith({
        where: { deprecatedAt: null },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      })
    })
  })

  describe('updateFeatureFlag', () => {
    it('should update flag metadata', async () => {
      const mockFlag = {
        id: 'flag-update',
        key: 'test-feature',
        name: 'Test Feature',
        isEnabled: false,
      }

      prisma.adminFeatureFlag.findUnique.mockResolvedValue(mockFlag)
      prisma.adminFeatureFlag.update.mockResolvedValue({
        ...mockFlag,
        name: 'Updated Feature',
        description: 'New description',
      })
      prisma.adminFeatureFlagHistory.create.mockResolvedValue({
        id: 'history-update',
      })

      const result = await FeatureFlagService.updateFeatureFlag(
        'flag-update',
        {
          name: 'Updated Feature',
          description: 'New description',
        },
        'user-123'
      )

      expect(result.name).toBe('Updated Feature')

      expect(prisma.adminFeatureFlagHistory.create).toHaveBeenCalledWith({
        data: {
          flagId: 'flag-update',
          action: 'UPDATED',
          previousValue: expect.objectContaining({ name: 'Test Feature' }),
          newValue: expect.objectContaining({ name: 'Updated Feature' }),
          changedBy: 'user-123',
          changedAt: expect.any(Date),
          comment: 'Feature flag metadata updated',
        },
      })
    })

    it('should reject updates to isEnabled field', async () => {
      const mockFlag = {
        id: 'flag-reject',
        key: 'test',
        isEnabled: false,
      }

      prisma.adminFeatureFlag.findUnique.mockResolvedValue(mockFlag)

      await expect(
        FeatureFlagService.updateFeatureFlag(
          'flag-reject',
          { isEnabled: true },
          'user-123'
        )
      ).rejects.toThrow('Cannot update isEnabled via updateFeatureFlag')
    })
  })

  describe('deleteFeatureFlag', () => {
    it('should soft delete flag by setting deprecatedAt', async () => {
      const mockFlag = {
        id: 'flag-delete',
        key: 'deprecated-feature',
        deprecatedAt: null,
      }

      prisma.adminFeatureFlag.findUnique.mockResolvedValue(mockFlag)
      prisma.adminFeatureFlag.update.mockResolvedValue({
        ...mockFlag,
        deprecatedAt: new Date(),
      })
      prisma.adminFeatureFlagHistory.create.mockResolvedValue({
        id: 'history-delete',
      })

      const result = await FeatureFlagService.deleteFeatureFlag('flag-delete', 'user-123')

      expect(result.deprecatedAt).toBeDefined()

      expect(prisma.adminFeatureFlag.update).toHaveBeenCalledWith({
        where: { id: 'flag-delete' },
        data: {
          deprecatedAt: expect.any(Date),
          lastModifiedBy: 'user-123',
        },
      })

      expect(prisma.adminFeatureFlagHistory.create).toHaveBeenCalledWith({
        data: {
          flagId: 'flag-delete',
          action: 'DELETED',
          previousValue: expect.objectContaining({ deprecatedAt: null }),
          newValue: expect.objectContaining({ deprecatedAt: expect.any(Date) }),
          changedBy: 'user-123',
          changedAt: expect.any(Date),
          comment: 'Feature flag deprecated',
        },
      })
    })

    it('should reject deletion if already deprecated', async () => {
      const mockFlag = {
        id: 'flag-already-deleted',
        deprecatedAt: new Date(),
      }

      prisma.adminFeatureFlag.findUnique.mockResolvedValue(mockFlag)

      await expect(
        FeatureFlagService.deleteFeatureFlag('flag-already-deleted', 'user-123')
      ).rejects.toThrow('Feature flag is already deprecated')
    })
  })

  describe('getFeatureFlagHistory', () => {
    it('should return flag history in chronological order', async () => {
      const mockHistory = [
        {
          id: 'hist-1',
          flagId: 'flag-123',
          action: 'CREATED',
          changedBy: 'user-123',
          changedAt: new Date('2025-10-19T10:00:00Z'),
        },
        {
          id: 'hist-2',
          flagId: 'flag-123',
          action: 'TOGGLED',
          changedBy: 'user-456',
          changedAt: new Date('2025-10-19T11:00:00Z'),
        },
        {
          id: 'hist-3',
          flagId: 'flag-123',
          action: 'UPDATED',
          changedBy: 'user-123',
          changedAt: new Date('2025-10-19T12:00:00Z'),
        },
      ]

      prisma.adminFeatureFlagHistory.findMany.mockResolvedValue(mockHistory)

      const result = await FeatureFlagService.getFeatureFlagHistory('flag-123')

      expect(result).toHaveLength(3)
      expect(result[0].action).toBe('CREATED')
      expect(result[2].action).toBe('UPDATED')

      expect(prisma.adminFeatureFlagHistory.findMany).toHaveBeenCalledWith({
        where: { flagId: 'flag-123' },
        orderBy: { changedAt: 'asc' },
      })
    })
  })
})
