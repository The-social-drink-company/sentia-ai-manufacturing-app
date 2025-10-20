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

vi.mock('../../../../server/integrations/amazon.js', () => ({
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
        include: {
          syncJobs: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      })
    })

    it('should filter by integration type', async () => {
      prisma.adminIntegration.count.mockResolvedValue(5)
      prisma.adminIntegration.findMany.mockResolvedValue([])

      await IntegrationService.getIntegrations({ type: 'XERO' }, { page: 1, limit: 10 })

      expect(prisma.adminIntegration.findMany).toHaveBeenCalledWith({
        where: { type: 'XERO' },
        include: {
          syncJobs: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      })
    })

    it('should filter by health status', async () => {
      prisma.adminIntegration.count.mockResolvedValue(3)
      prisma.adminIntegration.findMany.mockResolvedValue([])

      await IntegrationService.getIntegrations({ healthStatus: 'HEALTHY' }, { page: 1, limit: 10 })

      expect(prisma.adminIntegration.findMany).toHaveBeenCalledWith({
        where: { healthStatus: 'HEALTHY' },
        include: {
          syncJobs: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
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

      expect(result.healthy).toBe(true)
      expect(result.responseTime).toBeGreaterThan(0) // Response time is calculated from Date.now()
      expect(result.message).toBe('Health check successful')

      expect(prisma.adminIntegration.update).toHaveBeenCalledWith({
        where: { id: 'int-xero' },
        data: {
          healthStatus: 'HEALTHY',
          healthCheckedAt: expect.any(Date),
          avgResponseTime: expect.any(Number), // Response time is calculated dynamically
          consecutiveFailures: 0,
          lastError: null,
          updatedAt: expect.any(Date),
        },
      })

      expect(prisma.adminSyncJob.create).toHaveBeenCalledWith({
        data: {
          integrationId: 'int-xero',
          type: 'XERO',
          operation: 'HEALTH_CHECK',
          status: 'COMPLETED',
          duration: expect.any(Number), // Response time is calculated dynamically
          errors: null,
          completedAt: expect.any(Date),
          createdAt: expect.any(Date),
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

      expect(result.healthy).toBe(false)
      expect(result.message).toContain('Connection timeout')

      expect(prisma.adminIntegration.update).toHaveBeenCalledWith({
        where: { id: 'int-failing' },
        data: expect.objectContaining({
          healthStatus: 'DOWN',
          consecutiveFailures: 5,
          lastError: 'Connection timeout',
          updatedAt: expect.any(Date),
        }),
      })
    })

    it('should mark integration as DEGRADED after 1-4 failures', async () => {
      const mockIntegration = {
        id: 'int-degraded',
        type: 'UNLEASHED',
        consecutiveFailures: 1,
      }

      const unleashedModule = await import('../../../../server/integrations/unleashed.js')
      unleashedModule.healthCheck.mockRejectedValue(new Error('Temporary failure'))

      prisma.adminIntegration.findUnique.mockResolvedValue(mockIntegration)
      prisma.adminIntegration.update.mockResolvedValue({
        ...mockIntegration,
        healthStatus: 'DEGRADED',
        consecutiveFailures: 2,
      })
      prisma.adminSyncJob.create.mockResolvedValue({ id: 'sync-degraded' })

      const result = await IntegrationService.testConnection('int-degraded')

      expect(result.healthy).toBe(false)
      expect(result.message).toContain('Temporary failure')

      expect(prisma.adminIntegration.update).toHaveBeenCalledWith({
        where: { id: 'int-degraded' },
        data: expect.objectContaining({
          healthStatus: 'DEGRADED',
          consecutiveFailures: 2,
          lastError: 'Temporary failure',
          updatedAt: expect.any(Date),
        }),
      })
    })

    it('should handle health check timeout', async () => {
      const mockIntegration = {
        id: 'int-timeout',
        type: 'XERO',
        consecutiveFailures: 0,
      }

      const xeroModule = await import('../../../../server/integrations/xero.js')
      // Mock a promise that never resolves (simulating timeout)
      xeroModule.healthCheck.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      prisma.adminIntegration.findUnique.mockResolvedValue(mockIntegration)
      prisma.adminIntegration.update.mockResolvedValue({
        ...mockIntegration,
        healthStatus: 'DEGRADED',
      })
      prisma.adminSyncJob.create.mockResolvedValue({ id: 'sync-timeout' })

      const result = await IntegrationService.testConnection('int-timeout')

      expect(result.healthy).toBe(false)
      expect(result.message).toContain('timeout')

      // Restore the mock for other tests
      xeroModule.healthCheck.mockResolvedValue({ success: true, responseTime: 150 })
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
          createdAt: expect.any(Date),
        },
      })

      const { addSyncJob } = await import('../../../../server/queues/syncJobQueue.js')
      expect(addSyncJob).toHaveBeenCalledWith('int-sync', 'XERO', {
        syncJobId: 'sync-job-123',
      })
    })

    it('should reject sync if integration is inactive', async () => {
      prisma.adminIntegration.findUnique.mockResolvedValue({
        id: 'int-inactive',
        name: 'Inactive Integration',
        isActive: false,
      })

      await expect(IntegrationService.syncIntegration('int-inactive', 'user-123')).rejects.toThrow(
        'Cannot sync inactive integration: Inactive Integration'
      )
    })

    it('should reject sync if integration not found', async () => {
      prisma.adminIntegration.findUnique.mockResolvedValue(null)

      await expect(
        IntegrationService.syncIntegration('nonexistent', 'user-123')
      ).rejects.toThrow('Integration not found: nonexistent')
    })
  })

  describe('pauseIntegration', () => {
    it('should pause active integration', async () => {
      const mockIntegration = {
        id: 'int-pause',
        type: 'XERO',
        isActive: true,
      }

      const pausedIntegration = {
        ...mockIntegration,
        isActive: false,
      }

      prisma.adminIntegration.update.mockResolvedValue(pausedIntegration)
      prisma.adminSyncJob.create.mockResolvedValue({
        id: 'sync-pause-123',
        integrationId: 'int-pause',
        type: 'XERO',
        operation: 'PAUSE_SYNC',
        status: 'COMPLETED',
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

      expect(prisma.adminSyncJob.create).toHaveBeenCalledWith({
        data: {
          integrationId: 'int-pause',
          type: 'XERO',
          operation: 'PAUSE_SYNC',
          status: 'COMPLETED',
          triggeredBy: 'user-123',
          completedAt: expect.any(Date),
          createdAt: expect.any(Date),
        },
      })
    })
  })

  describe('resumeIntegration', () => {
    it('should resume paused integration', async () => {
      const mockIntegration = {
        id: 'int-resume',
        type: 'SHOPIFY',
        isActive: false,
      }

      const resumedIntegration = {
        ...mockIntegration,
        isActive: true,
      }

      prisma.adminIntegration.update.mockResolvedValue(resumedIntegration)
      prisma.adminSyncJob.create.mockResolvedValue({
        id: 'sync-resume-123',
        integrationId: 'int-resume',
        type: 'SHOPIFY',
        operation: 'RESUME_SYNC',
        status: 'COMPLETED',
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

      expect(prisma.adminSyncJob.create).toHaveBeenCalledWith({
        data: {
          integrationId: 'int-resume',
          type: 'SHOPIFY',
          operation: 'RESUME_SYNC',
          status: 'COMPLETED',
          triggeredBy: 'user-123',
          completedAt: expect.any(Date),
          createdAt: expect.any(Date),
        },
      })
    })
  })

  describe('getIntegrationHealth', () => {
    it('should calculate uptime percentage from sync jobs', async () => {
      const mockIntegration = {
        id: 'int-health',
        healthStatus: 'HEALTHY',
        avgResponseTime: 200,
        consecutiveFailures: 0,
        healthCheckedAt: new Date('2025-10-19T10:00:00Z'),
        lastError: null,
      }

      prisma.adminIntegration.findUnique.mockResolvedValue(mockIntegration)

      // Mock _calculateUptime by mocking the adminSyncJob.findMany call it uses
      prisma.adminSyncJob.findMany.mockResolvedValue([
        { status: 'COMPLETED' },
        { status: 'COMPLETED' },
        { status: 'COMPLETED' },
        { status: 'COMPLETED' },
        { status: 'COMPLETED' },
        { status: 'COMPLETED' },
        { status: 'COMPLETED' },
        { status: 'COMPLETED' },
        { status: 'COMPLETED' },
        { status: 'FAILED' },
      ]) // 90% uptime (9/10)

      const result = await IntegrationService.getIntegrationHealth('int-health')

      expect(result.healthStatus).toBe('HEALTHY')
      expect(result.uptime).toBe(90) // 90% uptime
      expect(result.avgResponseTime).toBe(200)
      expect(result.consecutiveFailures).toBe(0)
      expect(result.healthCheckedAt).toEqual(mockIntegration.healthCheckedAt)
      expect(result.lastError).toBeNull()
    })

    it('should return 0% uptime if no syncs', async () => {
      const mockIntegration = {
        id: 'int-no-syncs',
        healthStatus: 'UNKNOWN',
        avgResponseTime: null,
        consecutiveFailures: 0,
        healthCheckedAt: null,
        lastError: null,
      }

      prisma.adminIntegration.findUnique.mockResolvedValue(mockIntegration)
      prisma.adminSyncJob.findMany.mockResolvedValue([]) // No sync jobs

      const result = await IntegrationService.getIntegrationHealth('int-no-syncs')

      expect(result.uptime).toBe(0)
      expect(result.healthStatus).toBe('UNKNOWN')
    })
  })

  describe('getIntegrationLogs', () => {
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

      prisma.adminSyncJob.count.mockResolvedValue(2)
      prisma.adminSyncJob.findMany.mockResolvedValue(mockSyncJobs)

      const result = await IntegrationService.getIntegrationLogs('int-history', { limit: 10 })

      expect(result.logs).toHaveLength(2)
      expect(result.logs[0].status).toBe('COMPLETED')
      expect(result.pagination).toEqual({
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      })

      expect(prisma.adminSyncJob.findMany).toHaveBeenCalledWith({
        where: { integrationId: 'int-history' },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      })
    })
  })
})
