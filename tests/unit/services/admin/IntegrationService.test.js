/**
 * IntegrationService Unit Tests
 *
 * Tests integration management, health monitoring, and sync orchestration
 *
 * Coverage:
 * - Integration CRUD operations
 * - Health monitoring and status tracking
 * - Sync job creation and orchestration
 * - Pause/resume functionality
 * - Uptime calculations
 * - Error handling
 *
 * @module tests/unit/services/admin/IntegrationService.test.js
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import IntegrationService from '../../../../server/services/admin/IntegrationService.js'
import prisma from '../../../../server/lib/prisma.js'

// Mock Prisma
vi.mock('../../../../server/lib/prisma.js', () => ({
  default: {
    adminIntegration: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    adminSyncJob: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
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

// Mock sync queue
vi.mock('../../../../server/queues/syncJobQueue.js', () => ({
  addSyncJob: vi.fn().mockResolvedValue({ id: 'queue-job-123' }),
}))

// Mock dynamic integration imports
vi.mock('../../../../server/integrations/xero.js', () => ({
  healthCheck: vi.fn().mockResolvedValue({ success: true, responseTime: 150 }),
}))

vi.mock('../../../../server/integrations/shopify.js', () => ({
  healthCheck: vi.fn().mockResolvedValue({ success: true, responseTime: 200 }),
}))

vi.mock('../../../../server/integrations/amazon_sp_api.js', () => ({
  healthCheck: vi.fn().mockResolvedValue({ success: true, responseTime: 300 }),
}))

vi.mock('../../../../server/integrations/unleashed.js', () => ({
  healthCheck: vi.fn().mockResolvedValue({ success: true, responseTime: 250 }),
}))

describe('IntegrationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getIntegrations', () => {
    it('should return paginated integrations with filters', async () => {
      const mockIntegrations = [
        { id: 'int-1', name: 'Xero Integration', type: 'XERO', isActive: true },
        { id: 'int-2', name: 'Shopify Integration', type: 'SHOPIFY', isActive: true },
      ]

      prisma.adminIntegration.count.mockResolvedValue(10)
      prisma.adminIntegration.findMany.mockResolvedValue(mockIntegrations)

      const result = await IntegrationService.getIntegrations(
        { isActive: true },
        { page: 1, limit: 20 }
      )

      expect(result.integrations).toHaveLength(2)
      expect(result.pagination).toEqual({
        total: 10,
        page: 1,
        limit: 20,
        totalPages: 1,
      })

      expect(prisma.adminIntegration.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      })
    })

    it('should filter by integration type', async () => {
      await IntegrationService.getIntegrations({ type: 'XERO' }, { page: 1, limit: 10 })

      expect(prisma.adminIntegration.findMany).toHaveBeenCalledWith({
        where: { type: 'XERO' },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      })
    })

    it('should filter by health status', async () => {
      await IntegrationService.getIntegrations({ healthStatus: 'HEALTHY' }, { page: 1, limit: 10 })

      expect(prisma.adminIntegration.findMany).toHaveBeenCalledWith({
        where: { healthStatus: 'HEALTHY' },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      })
    })
  })

  describe('testConnection', () => {
    it('should test Xero connection and record health check', async () => {
      const mockIntegration = {
        id: 'int-xero',
        type: 'XERO',
        name: 'Xero Integration',
        isActive: true,
        healthStatus: 'UNKNOWN',
        consecutiveFailures: 0,
      }

      prisma.adminIntegration.findUnique.mockResolvedValue(mockIntegration)
      prisma.adminIntegration.update.mockResolvedValue({
        ...mockIntegration,
        healthStatus: 'HEALTHY',
        healthCheckedAt: new Date(),
      })
      prisma.adminSyncJob.create.mockResolvedValue({
        id: 'sync-health-123',
        type: 'XERO',
        operation: 'HEALTH_CHECK',
        status: 'COMPLETED',
      })

      const result = await IntegrationService.testConnection('int-xero')

      expect(result.status).toBe('HEALTHY')
      expect(result.responseTime).toBe(150)
      expect(result.success).toBe(true)

      expect(prisma.adminIntegration.update).toHaveBeenCalledWith({
        where: { id: 'int-xero' },
        data: {
          healthStatus: 'HEALTHY',
          healthCheckedAt: expect.any(Date),
          avgResponseTime: 150,
          consecutiveFailures: 0,
        },
      })

      expect(prisma.adminSyncJob.create).toHaveBeenCalledWith({
        data: {
          integrationId: 'int-xero',
          type: 'XERO',
          operation: 'HEALTH_CHECK',
          status: 'COMPLETED',
          startedAt: expect.any(Date),
          completedAt: expect.any(Date),
          duration: 150,
          result: {
            success: true,
            responseTime: 150,
          },
        },
      })
    })

    it('should mark integration as DOWN after 5 consecutive failures', async () => {
      const mockIntegration = {
        id: 'int-failing',
        type: 'SHOPIFY',
        consecutiveFailures: 4,
      }

      // Mock health check failure
      const shopifyModule = await import('../../../../server/integrations/shopify.js')
      shopifyModule.healthCheck.mockRejectedValue(new Error('Connection timeout'))

      prisma.adminIntegration.findUnique.mockResolvedValue(mockIntegration)
      prisma.adminIntegration.update.mockResolvedValue({
        ...mockIntegration,
        healthStatus: 'DOWN',
        consecutiveFailures: 5,
      })
      prisma.adminSyncJob.create.mockResolvedValue({ id: 'sync-failed' })

      const result = await IntegrationService.testConnection('int-failing')

      expect(result.status).toBe('DOWN')
      expect(result.success).toBe(false)

      expect(prisma.adminIntegration.update).toHaveBeenCalledWith({
        where: { id: 'int-failing' },
        data: expect.objectContaining({
          healthStatus: 'DOWN',
          consecutiveFailures: 5,
        }),
      })
    })

    it('should mark integration as DEGRADED after 1-4 failures', async () => {
      const mockIntegration = {
        id: 'int-degraded',
        type: 'AMAZON_SP_API',
        consecutiveFailures: 1,
      }

      const amazonModule = await import('../../../../server/integrations/amazon_sp_api.js')
      amazonModule.healthCheck.mockRejectedValue(new Error('Temporary failure'))

      prisma.adminIntegration.findUnique.mockResolvedValue(mockIntegration)
      prisma.adminIntegration.update.mockResolvedValue({
        ...mockIntegration,
        healthStatus: 'DEGRADED',
        consecutiveFailures: 2,
      })
      prisma.adminSyncJob.create.mockResolvedValue({ id: 'sync-degraded' })

      const result = await IntegrationService.testConnection('int-degraded')

      expect(result.status).toBe('DEGRADED')

      expect(prisma.adminIntegration.update).toHaveBeenCalledWith({
        where: { id: 'int-degraded' },
        data: expect.objectContaining({
          healthStatus: 'DEGRADED',
          consecutiveFailures: 2,
        }),
      })
    })

    it('should handle health check timeout', async () => {
      const mockIntegration = {
        id: 'int-timeout',
        type: 'UNLEASHED',
        consecutiveFailures: 0,
      }

      const unleashedModule = await import('../../../../server/integrations/unleashed.js')
      unleashedModule.healthCheck.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 15000))
      )

      prisma.adminIntegration.findUnique.mockResolvedValue(mockIntegration)
      prisma.adminIntegration.update.mockResolvedValue({
        ...mockIntegration,
        healthStatus: 'DEGRADED',
      })
      prisma.adminSyncJob.create.mockResolvedValue({ id: 'sync-timeout' })

      const result = await IntegrationService.testConnection('int-timeout')

      expect(result.success).toBe(false)
      expect(result.error).toContain('timeout')
    })
  })

  describe('syncIntegration', () => {
    it('should create sync job and enqueue to BullMQ', async () => {
      const mockIntegration = {
        id: 'int-sync',
        type: 'XERO',
        name: 'Xero Integration',
        isActive: true,
      }

      const mockSyncJob = {
        id: 'sync-job-123',
        integrationId: 'int-sync',
        type: 'XERO',
        operation: 'FULL_SYNC',
        status: 'PENDING',
      }

      prisma.adminIntegration.findUnique.mockResolvedValue(mockIntegration)
      prisma.adminSyncJob.create.mockResolvedValue(mockSyncJob)

      const result = await IntegrationService.syncIntegration('int-sync', 'user-123')

      expect(result.syncJob).toEqual(mockSyncJob)
      expect(result.queueJobId).toBe('queue-job-123')

      expect(prisma.adminSyncJob.create).toHaveBeenCalledWith({
        data: {
          integrationId: 'int-sync',
          type: 'XERO',
          operation: 'FULL_SYNC',
          status: 'PENDING',
          triggeredBy: 'user-123',
        },
      })

      const { addSyncJob } = await import('../../../../server/queues/syncJobQueue.js')
      expect(addSyncJob).toHaveBeenCalledWith('int-sync', 'XERO', {
        syncJobId: 'sync-job-123',
        userId: 'user-123',
      })
    })

    it('should reject sync if integration is inactive', async () => {
      prisma.adminIntegration.findUnique.mockResolvedValue({
        id: 'int-inactive',
        isActive: false,
      })

      await expect(IntegrationService.syncIntegration('int-inactive', 'user-123')).rejects.toThrow(
        'Integration is not active'
      )
    })

    it('should reject sync if integration not found', async () => {
      prisma.adminIntegration.findUnique.mockResolvedValue(null)

      await expect(
        IntegrationService.syncIntegration('nonexistent', 'user-123')
      ).rejects.toThrow('Integration not found')
    })
  })

  describe('pauseIntegration', () => {
    it('should pause active integration', async () => {
      const mockIntegration = {
        id: 'int-pause',
        isActive: true,
      }

      prisma.adminIntegration.findUnique.mockResolvedValue(mockIntegration)
      prisma.adminIntegration.update.mockResolvedValue({
        ...mockIntegration,
        isActive: false,
      })

      const result = await IntegrationService.pauseIntegration('int-pause', 'user-123')

      expect(result.isActive).toBe(false)

      expect(prisma.adminIntegration.update).toHaveBeenCalledWith({
        where: { id: 'int-pause' },
        data: {
          isActive: false,
          updatedAt: expect.any(Date),
        },
      })
    })

    it('should reject pause if already paused', async () => {
      prisma.adminIntegration.findUnique.mockResolvedValue({
        id: 'int-already-paused',
        isActive: false,
      })

      await expect(
        IntegrationService.pauseIntegration('int-already-paused', 'user-123')
      ).rejects.toThrow('Integration is already paused')
    })
  })

  describe('resumeIntegration', () => {
    it('should resume paused integration', async () => {
      const mockIntegration = {
        id: 'int-resume',
        isActive: false,
      }

      prisma.adminIntegration.findUnique.mockResolvedValue(mockIntegration)
      prisma.adminIntegration.update.mockResolvedValue({
        ...mockIntegration,
        isActive: true,
      })

      const result = await IntegrationService.resumeIntegration('int-resume', 'user-123')

      expect(result.isActive).toBe(true)

      expect(prisma.adminIntegration.update).toHaveBeenCalledWith({
        where: { id: 'int-resume' },
        data: {
          isActive: true,
          updatedAt: expect.any(Date),
        },
      })
    })

    it('should reject resume if already active', async () => {
      prisma.adminIntegration.findUnique.mockResolvedValue({
        id: 'int-already-active',
        isActive: true,
      })

      await expect(
        IntegrationService.resumeIntegration('int-already-active', 'user-123')
      ).rejects.toThrow('Integration is already active')
    })
  })

  describe('getIntegrationHealth', () => {
    it('should calculate uptime percentage from sync jobs', async () => {
      const mockIntegration = {
        id: 'int-health',
        healthStatus: 'HEALTHY',
        avgResponseTime: 200,
      }

      prisma.adminIntegration.findUnique.mockResolvedValue(mockIntegration)
      prisma.adminSyncJob.count
        .mockResolvedValueOnce(90) // successful
        .mockResolvedValueOnce(10) // failed

      const result = await IntegrationService.getIntegrationHealth('int-health')

      expect(result.status).toBe('HEALTHY')
      expect(result.uptime).toBe(90) // 90% uptime
      expect(result.avgResponseTime).toBe(200)
      expect(result.totalSyncs).toBe(100)
      expect(result.successfulSyncs).toBe(90)
      expect(result.failedSyncs).toBe(10)
    })

    it('should return 0% uptime if no syncs', async () => {
      const mockIntegration = {
        id: 'int-no-syncs',
        healthStatus: 'UNKNOWN',
      }

      prisma.adminIntegration.findUnique.mockResolvedValue(mockIntegration)
      prisma.adminSyncJob.count.mockResolvedValue(0)

      const result = await IntegrationService.getIntegrationHealth('int-no-syncs')

      expect(result.uptime).toBe(0)
      expect(result.totalSyncs).toBe(0)
    })
  })

  describe('getSyncJobHistory', () => {
    it('should return recent sync jobs for integration', async () => {
      const mockSyncJobs = [
        {
          id: 'sync-1',
          integrationId: 'int-history',
          status: 'COMPLETED',
          completedAt: new Date('2025-10-19T10:00:00Z'),
        },
        {
          id: 'sync-2',
          integrationId: 'int-history',
          status: 'FAILED',
          completedAt: new Date('2025-10-19T09:00:00Z'),
        },
      ]

      prisma.adminSyncJob.findMany.mockResolvedValue(mockSyncJobs)

      const result = await IntegrationService.getSyncJobHistory('int-history', 10)

      expect(result).toHaveLength(2)
      expect(result[0].status).toBe('COMPLETED')

      expect(prisma.adminSyncJob.findMany).toHaveBeenCalledWith({
        where: { integrationId: 'int-history' },
        orderBy: { createdAt: 'desc' },
        take: 10,
      })
    })
  })
})
