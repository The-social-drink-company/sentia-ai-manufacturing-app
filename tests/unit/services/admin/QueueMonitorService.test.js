/**
 * QueueMonitorService Unit Tests
 *
 * Tests for BullMQ queue monitoring and management
 *
 * Test Coverage:
 * - Queue metrics collection and BullMQ integration
 * - Queue operations (pause, resume, retry, clean)
 * - Production approval workflow integration
 * - Health monitoring and alert threshold detection
 * - Pagination and filtering
 *
 * @module tests/unit/services/admin/QueueMonitorService
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import QueueMonitorService from '../../../../server/services/admin/QueueMonitorService.js'
import prisma from '../../../../server/lib/prisma.js'

let mockBullQueue

vi.mock('../../../../server/queues/syncJobQueue.js', () => ({
  getSyncJobQueue: vi.fn(() => Promise.resolve(mockBullQueue)),
}))

vi.mock('../../../../server/queues/approvalQueue.js', () => ({
  getApprovalQueue: vi.fn(() => Promise.resolve(mockBullQueue)),
}))

// Mock dependencies
vi.mock('../../../../server/lib/prisma.js', () => ({
  default: {
    adminQueueMonitor: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  },
}))

vi.mock('../../../../server/services/admin/ApprovalService.js', () => ({
  default: {
    createApprovalRequest: vi.fn(),
  },
}))

vi.mock('../../../../server/utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}))

describe('QueueMonitorService', () => {
  let mockBullQueue

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()

    // Mock BullMQ queue instance
    mockBullQueue = {
      getWaitingCount: vi.fn().mockResolvedValue(10),
      getActiveCount: vi.fn().mockResolvedValue(2),
      getCompletedCount: vi.fn().mockResolvedValue(100),
      getFailedCount: vi.fn().mockResolvedValue(5),
      getDelayedCount: vi.fn().mockResolvedValue(0),
      isPaused: vi.fn().mockResolvedValue(false),
      pause: vi.fn().mockResolvedValue(undefined),
      resume: vi.fn().mockResolvedValue(undefined),
      getJobs: vi.fn().mockResolvedValue([]),
      getJob: vi.fn().mockResolvedValue(null),
      clean: vi.fn().mockResolvedValue([]),
    }

    vi.spyOn(QueueMonitorService, '_getBullMQQueue').mockResolvedValue(mockBullQueue)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getAllQueues', () => {
    it('should return paginated list of queues with default pagination', async () => {
      const mockQueues = [
        {
          id: 'queue-1',
          queueName: 'admin:sync-jobs',
          queueType: 'SYNC',
          isPaused: false,
          isHealthy: true,
          activeJobs: 2,
          waitingJobs: 10,
          completedJobs: 100,
          failedJobs: 5,
          errorRate: 0.05,
          throughput: 10.5,
          avgProcessingTime: 5000,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      prisma.adminQueueMonitor.findMany.mockResolvedValue(mockQueues)
      prisma.adminQueueMonitor.count.mockResolvedValue(1)

      const result = await QueueMonitorService.getAllQueues({}, {})

      expect(result).toEqual({
        queues: mockQueues,
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      })

      expect(prisma.adminQueueMonitor.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 20,
        orderBy: { lastCheckedAt: 'desc' },
      })
    })

    it('should filter queues by queueType and health status', async () => {
      const filters = {
        queueType: 'SYNC',
        isHealthy: true,
        isPaused: false,
      }

      prisma.adminQueueMonitor.findMany.mockResolvedValue([])
      prisma.adminQueueMonitor.count.mockResolvedValue(0)

      await QueueMonitorService.getAllQueues(filters, { page: 2, limit: 10 })

      expect(prisma.adminQueueMonitor.findMany).toHaveBeenCalledWith({
        where: {
          queueType: 'SYNC',
          isHealthy: true,
          isPaused: false,
        },
        skip: 10,
        take: 10,
        orderBy: { lastCheckedAt: 'desc' },
      })
    })

    it('should handle pagination correctly for multiple pages', async () => {
      prisma.adminQueueMonitor.findMany.mockResolvedValue([])
      prisma.adminQueueMonitor.count.mockResolvedValue(45)

      const result = await QueueMonitorService.getAllQueues({}, { page: 3, limit: 20 })

      expect(result.pagination).toEqual({
        page: 3,
        limit: 20,
        total: 45,
        totalPages: 3,
      })

      expect(prisma.adminQueueMonitor.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 40,
        take: 20,
        orderBy: { lastCheckedAt: 'desc' },
      })
    })
  })

  describe('getQueueById', () => {
    it('should return queue details with refreshed metrics', async () => {
      const mockQueue = {
        id: 'queue-1',
        queueName: 'admin:sync-jobs',
        queueType: 'SYNC',
        activeJobs: 1, // Will be updated
        waitingJobs: 5, // Will be updated
        updatedAt: new Date('2025-01-01'),
      }

      const updatedQueue = {
        ...mockQueue,
        activeJobs: 2,
        waitingJobs: 10,
        updatedAt: new Date(),
      }

      prisma.adminQueueMonitor.findUnique
        .mockResolvedValueOnce(mockQueue)
        .mockResolvedValueOnce(updatedQueue)

      const updateQueueMetricsSpy = vi
        .spyOn(QueueMonitorService, 'updateQueueMetrics')
        .mockResolvedValue(updatedQueue)

      const result = await QueueMonitorService.getQueueById('queue-1')

      expect(result).toEqual(updatedQueue)
      expect(prisma.adminQueueMonitor.findUnique).toHaveBeenNthCalledWith(1, {
        where: { id: 'queue-1' },
      })
      expect(prisma.adminQueueMonitor.findUnique).toHaveBeenNthCalledWith(2, {
        where: { id: 'queue-1' },
      })
      expect(updateQueueMetricsSpy).toHaveBeenCalledWith('admin:sync-jobs')

      updateQueueMetricsSpy.mockRestore()
    })

    it('should throw error if queue not found', async () => {
      prisma.adminQueueMonitor.findUnique.mockResolvedValue(null)

      await expect(QueueMonitorService.getQueueById('nonexistent')).rejects.toThrow(
        /Queue not found/
      )
    })
  })

  describe('updateQueueMetrics', () => {
    it('should update queue metrics from BullMQ instance', async () => {
      const mockQueue = {
        id: 'queue-1',
        queueName: 'admin:sync-jobs',
        completedJobs: 90,
        failedJobs: 3,
        updatedAt: new Date(Date.now() - 120000), // 2 minutes ago
      }

      const getQueueSpy = vi
        .spyOn(QueueMonitorService, 'getQueueByName')
        .mockResolvedValue({
          ...mockQueue,
          queueType: 'SYNC',
          isPaused: false,
          isHealthy: true,
        })
      prisma.adminQueueMonitor.update.mockResolvedValue({
        ...mockQueue,
        activeJobs: 2,
        waitingJobs: 10,
        completedJobs: 100,
        failedJobs: 5,
      })

      await QueueMonitorService.updateQueueMetrics('admin:sync-jobs')

      expect(prisma.adminQueueMonitor.update).toHaveBeenCalledWith({
        where: { id: 'queue-1' },
        data: expect.objectContaining({
          activeJobs: 2,
          waitingJobs: 10,
          completedJobs: 100,
          failedJobs: 5,
          isPaused: false,
          errorRate: expect.any(Number),
          throughput: expect.any(Number),
          isHealthy: expect.any(Boolean),
        }),
      })

      // Verify BullMQ calls
      expect(mockBullQueue.getWaitingCount).toHaveBeenCalled()
      expect(mockBullQueue.getActiveCount).toHaveBeenCalled()
      expect(mockBullQueue.getCompletedCount).toHaveBeenCalled()
      expect(mockBullQueue.getFailedCount).toHaveBeenCalled()
      expect(mockBullQueue.getDelayedCount).toHaveBeenCalled()
      expect(mockBullQueue.isPaused).toHaveBeenCalled()

      getQueueSpy.mockRestore()
    })

    it('should calculate error rate and throughput correctly', async () => {
      const mockQueue = {
        id: 'queue-1',
        queueName: 'admin:sync-jobs',
        completedJobs: 90,
        failedJobs: 4,
        updatedAt: new Date(Date.now() - 60000), // 1 minute ago
      }

      mockBullQueue.getCompletedCount.mockResolvedValue(100)
      mockBullQueue.getFailedCount.mockResolvedValue(5)
      mockBullQueue.getWaitingCount.mockResolvedValue(0)
      mockBullQueue.getActiveCount.mockResolvedValue(0)

      const getQueueSpy = vi
        .spyOn(QueueMonitorService, 'getQueueByName')
        .mockResolvedValue({
          ...mockQueue,
          queueType: 'SYNC',
          isPaused: false,
          isHealthy: true,
        })
      prisma.adminQueueMonitor.update.mockImplementation((args) => {
        return Promise.resolve({ ...mockQueue, ...args.data })
      })

      await QueueMonitorService.updateQueueMetrics('admin:sync-jobs')

      const updateCall = prisma.adminQueueMonitor.update.mock.calls[0][0]
      const updateData = updateCall.data

      // Error rate = 5 / (100 + 5) = 0.047619...
      expect(updateData.errorRate).toBeCloseTo(0.047619, 5)

      // Throughput = completed jobs per minute = 100 jobs/min
      expect(updateData.throughput).toBeCloseTo(100, 1)

      getQueueSpy.mockRestore()
    })

    it('should mark queue as unhealthy if error rate exceeds threshold', async () => {
      const mockQueue = {
        id: 'queue-1',
        queueName: 'admin:sync-jobs',
        completedJobs: 90,
        failedJobs: 3,
        updatedAt: new Date(),
      }

      // Error rate = 10 / 110 = 0.0909 (9.09% > 5% threshold)
      mockBullQueue.getCompletedCount.mockResolvedValue(100)
      mockBullQueue.getFailedCount.mockResolvedValue(10)

      const getQueueSpy = vi
        .spyOn(QueueMonitorService, 'getQueueByName')
        .mockResolvedValue({
          ...mockQueue,
          queueType: 'SYNC',
          isPaused: false,
          isHealthy: true,
        })
      prisma.adminQueueMonitor.update.mockImplementation((args) => {
        return Promise.resolve({ ...mockQueue, ...args.data })
      })

      await QueueMonitorService.updateQueueMetrics('admin:sync-jobs')

      const updateCall = prisma.adminQueueMonitor.update.mock.calls[0][0]
      expect(updateCall.data.isHealthy).toBe(false)
      expect(updateCall.data.errorRate).toBeGreaterThan(0.05) // 5% threshold

      getQueueSpy.mockRestore()
    })

  })

  describe('getQueueByName', () => {
    it('should create queue monitor record if not exists', async () => {
      prisma.adminQueueMonitor.findUnique.mockResolvedValueOnce(null)
      prisma.adminQueueMonitor.create.mockResolvedValue({
        id: 'queue-new',
        queueName: 'admin:sync-jobs',
        queueType: 'SYNC',
        isPaused: false,
        isHealthy: true,
        activeJobs: 0,
        waitingJobs: 0,
        completedJobs: 0,
        failedJobs: 0,
      })

      const queue = await QueueMonitorService.getQueueByName('admin:sync-jobs')

      expect(prisma.adminQueueMonitor.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          queueName: 'admin:sync-jobs',
          queueType: 'SYNC',
          isPaused: false,
          isHealthy: true,
        }),
      })
      expect(queue.queueName).toBe('admin:sync-jobs')
    })
  })

  describe('pauseQueue - Production Approval Workflow', () => {
    it('should create approval request in production environment', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const mockQueue = {
        id: 'queue-1',
        queueName: 'admin:sync-jobs',
        isPaused: false,
        isHealthy: true,
      }

      const mockApproval = {
        id: 'approval-1',
        type: 'QUEUE_OPERATION',
        status: 'PENDING',
      }

      const getQueueSpy = vi
        .spyOn(QueueMonitorService, 'getQueueByName')
        .mockResolvedValue(mockQueue)

      const ApprovalService = (await import('../../../../server/services/admin/ApprovalService.js')).default
      ApprovalService.createApprovalRequest.mockResolvedValue(mockApproval)

      const result = await QueueMonitorService.pauseQueue('admin:sync-jobs', 'user-1', 'Emergency maintenance')

      expect(result).toEqual({
        success: false,
        approvalRequired: true,
        approval: mockApproval,
        message: 'Production queue pause requires approval',
      })

      expect(ApprovalService.createApprovalRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'QUEUE_OPERATION',
          requesterId: 'user-1',
          rationale: 'Emergency maintenance',
          requestedChanges: expect.objectContaining({
            operation: 'PAUSE',
            queueName: 'admin:sync-jobs',
          }),
        })
      )

      // Should NOT pause queue immediately
      expect(mockBullQueue.pause).not.toHaveBeenCalled()
      expect(prisma.adminQueueMonitor.update).not.toHaveBeenCalled()

      getQueueSpy.mockRestore()
      process.env.NODE_ENV = originalEnv
    })

    it('should pause queue immediately in non-production environment', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const mockQueue = {
        id: 'queue-1',
        queueName: 'admin:sync-jobs',
        isPaused: false,
        isHealthy: true,
      }

      const updatedQueue = {
        ...mockQueue,
        isPaused: true,
      }

      const getQueueSpy = vi
        .spyOn(QueueMonitorService, 'getQueueByName')
        .mockResolvedValue(mockQueue)
      prisma.adminQueueMonitor.update.mockResolvedValue(updatedQueue)

      const result = await QueueMonitorService.pauseQueue('admin:sync-jobs', 'user-1', 'Testing')

      expect(result).toEqual({
        success: true,
        approvalRequired: false,
        queue: updatedQueue,
        message: 'Queue admin:sync-jobs paused',
      })

      expect(mockBullQueue.pause).toHaveBeenCalled()
      expect(prisma.adminQueueMonitor.update).toHaveBeenCalledWith({
        where: { id: 'queue-1' },
        data: expect.objectContaining({ isPaused: true }),
      })

      getQueueSpy.mockRestore()
      process.env.NODE_ENV = originalEnv
    })

    it('should throw error if queue already paused', async () => {
      const mockQueue = {
        id: 'queue-1',
        queueName: 'admin:sync-jobs',
        isPaused: true,
        isHealthy: true,
      }

      const getQueueSpy = vi
        .spyOn(QueueMonitorService, 'getQueueByName')
        .mockResolvedValue(mockQueue)

      await expect(
        QueueMonitorService.pauseQueue('admin:sync-jobs', 'user-1', 'Test')
      ).rejects.toThrow(/already paused/)

      getQueueSpy.mockRestore()
    })
  })

  describe('resumeQueue', () => {
    it('should resume paused queue successfully', async () => {
      const mockQueue = {
        id: 'queue-1',
        queueName: 'admin:sync-jobs',
        isPaused: true,
        isHealthy: true,
      }

      const updatedQueue = {
        ...mockQueue,
        isPaused: false,
      }

      const getQueueSpy = vi
        .spyOn(QueueMonitorService, 'getQueueByName')
        .mockResolvedValue(mockQueue)
      prisma.adminQueueMonitor.update.mockResolvedValue(updatedQueue)

      const result = await QueueMonitorService.resumeQueue('admin:sync-jobs', 'user-1')

      expect(result).toEqual(updatedQueue)
      expect(mockBullQueue.resume).toHaveBeenCalled()
      expect(prisma.adminQueueMonitor.update).toHaveBeenCalledWith({
        where: { id: 'queue-1' },
        data: expect.objectContaining({ isPaused: false }),
      })

      getQueueSpy.mockRestore()
    })

    it('should throw error if queue not paused', async () => {
      const mockQueue = {
        id: 'queue-1',
        queueName: 'admin:sync-jobs',
        isPaused: false,
        isHealthy: true,
      }

      const getQueueSpy = vi
        .spyOn(QueueMonitorService, 'getQueueByName')
        .mockResolvedValue(mockQueue)

      await expect(
        QueueMonitorService.resumeQueue('admin:sync-jobs', 'user-1')
      ).rejects.toThrow(/not paused/)

      getQueueSpy.mockRestore()
    })
  })

  describe('retryFailedJobs', () => {
    it('should retry specified number of failed jobs', async () => {
      const mockFailedJobs = [
        { id: 'job-1', retry: vi.fn().mockResolvedValue(undefined) },
        { id: 'job-2', retry: vi.fn().mockResolvedValue(undefined) },
        { id: 'job-3', retry: vi.fn().mockResolvedValue(undefined) },
      ]

      mockBullQueue.getJobs.mockResolvedValue(mockFailedJobs)

      const updateMetricsSpy = vi
        .spyOn(QueueMonitorService, 'updateQueueMetrics')
        .mockResolvedValue()
      const getQueueSpy = vi
        .spyOn(QueueMonitorService, 'getQueueByName')
        .mockResolvedValue({ id: 'queue-1', queueName: 'admin:sync-jobs' })

      const result = await QueueMonitorService.retryFailedJobs('admin:sync-jobs', 3)

      expect(result).toEqual({
        success: true,
        retriedCount: 3,
        message: 'Retried 3 failed jobs',
      })

      expect(mockBullQueue.getJobs).toHaveBeenCalledWith(['failed'], 0, 3)
      mockFailedJobs.forEach((job) => {
        expect(job.retry).toHaveBeenCalled()
      })

      expect(updateMetricsSpy).toHaveBeenCalledWith('admin:sync-jobs')
      updateMetricsSpy.mockRestore()
      getQueueSpy.mockRestore()
    })

    it('should handle case when no failed jobs exist', async () => {
      mockBullQueue.getJobs.mockResolvedValue([])

      const updateMetricsSpy = vi
        .spyOn(QueueMonitorService, 'updateQueueMetrics')
        .mockResolvedValue()
      const getQueueSpy = vi
        .spyOn(QueueMonitorService, 'getQueueByName')
        .mockResolvedValue({ id: 'queue-1', queueName: 'admin:sync-jobs' })

      const result = await QueueMonitorService.retryFailedJobs('admin:sync-jobs', 10)

      expect(result).toEqual({
        success: true,
        retriedCount: 0,
        message: 'No failed jobs to retry',
      })

      expect(updateMetricsSpy).not.toHaveBeenCalled()
      updateMetricsSpy.mockRestore()
      getQueueSpy.mockRestore()
    })
  })

  describe('cleanQueue', () => {
    it('should clean completed jobs with default grace period', async () => {
      const cleanedJobIds = ['job-1', 'job-2', 'job-3']
      mockBullQueue.clean.mockResolvedValue(cleanedJobIds)

      const updateMetricsSpy = vi
        .spyOn(QueueMonitorService, 'updateQueueMetrics')
        .mockResolvedValue()
      const getQueueSpy = vi
        .spyOn(QueueMonitorService, 'getQueueByName')
        .mockResolvedValue({ id: 'queue-1', queueName: 'admin:sync-jobs' })

      const result = await QueueMonitorService.cleanQueue('admin:sync-jobs', {})

      expect(result).toEqual({
        success: true,
        cleanedCount: 3,
        status: 'completed',
        message: 'Cleaned 3 completed jobs',
      })

      expect(mockBullQueue.clean).toHaveBeenCalledWith(86400000, undefined, 'completed')
      expect(updateMetricsSpy).toHaveBeenCalledWith('admin:sync-jobs')
      updateMetricsSpy.mockRestore()
      getQueueSpy.mockRestore()
    })

    it('should clean failed jobs with custom grace period and limit', async () => {
      mockBullQueue.clean.mockResolvedValue(['job-1', 'job-2'])

      const updateMetricsSpy = vi
        .spyOn(QueueMonitorService, 'updateQueueMetrics')
        .mockResolvedValue()
      const getQueueSpy = vi
        .spyOn(QueueMonitorService, 'getQueueByName')
        .mockResolvedValue({ id: 'queue-1', queueName: 'admin:sync-jobs' })

      const result = await QueueMonitorService.cleanQueue('admin:sync-jobs', {
        grace: 3600000, // 1 hour
        limit: 100,
        status: 'failed',
      })

      expect(result).toEqual({
        success: true,
        cleanedCount: 2,
        status: 'failed',
        message: 'Cleaned 2 failed jobs',
      })

      expect(mockBullQueue.clean).toHaveBeenCalledWith(3600000, 100, 'failed')
      expect(updateMetricsSpy).toHaveBeenCalledWith('admin:sync-jobs')
      updateMetricsSpy.mockRestore()
      getQueueSpy.mockRestore()
    })
  })

  describe('getQueueHealth', () => {
    it('should return healthy status when all metrics normal', async () => {
      const mockQueue = {
        id: 'queue-1',
        queueName: 'admin:sync-jobs',
        isHealthy: true,
        isPaused: false,
        errorRate: 0.02,
        waitingJobs: 50,
        avgProcessingTime: 60000,
        activeJobs: 2,
        completedJobs: 100,
        failedJobs: 5,
        throughput: 12,
      }

      const updateMetricsSpy = vi
        .spyOn(QueueMonitorService, 'updateQueueMetrics')
        .mockResolvedValue()

      prisma.adminQueueMonitor.findUnique.mockResolvedValue(mockQueue)

      const result = await QueueMonitorService.getQueueHealth('admin:sync-jobs')

      expect(result.queueName).toBe('admin:sync-jobs')
      expect(result.isHealthy).toBe(true)
      expect(result.alerts).toEqual([])
      expect(result.metrics).toEqual(
        expect.objectContaining({
          errorRate: 0.02,
          waitingJobs: 50,
          avgProcessingTime: 60000,
        })
      )
      expect(updateMetricsSpy).toHaveBeenCalledWith('admin:sync-jobs')
      updateMetricsSpy.mockRestore()
    })

    it('should return degraded status with alerts when thresholds breached', async () => {
      const mockQueue = {
        id: 'queue-1',
        queueName: 'admin:sync-jobs',
        isHealthy: false,
        isPaused: false,
        errorRate: 0.08,
        waitingJobs: 1200,
        avgProcessingTime: 400000,
        activeJobs: 5,
        completedJobs: 200,
        failedJobs: 20,
        throughput: 8,
      }

      const updateMetricsSpy = vi
        .spyOn(QueueMonitorService, 'updateQueueMetrics')
        .mockResolvedValue()

      prisma.adminQueueMonitor.findUnique.mockResolvedValue(mockQueue)

      const result = await QueueMonitorService.getQueueHealth('admin:sync-jobs')

      expect(result.isHealthy).toBe(false)
      expect(result.alerts).toHaveLength(3)
      expect(result.alerts).toContainEqual(
        expect.objectContaining({
          type: 'HIGH_ERROR_RATE',
        })
      )
      expect(result.alerts).toContainEqual(
        expect.objectContaining({
          type: 'QUEUE_BACKLOG',
        })
      )
      expect(result.alerts).toContainEqual(
        expect.objectContaining({
          type: 'SLOW_PROCESSING',
        })
      )
      expect(updateMetricsSpy).toHaveBeenCalledWith('admin:sync-jobs')
      updateMetricsSpy.mockRestore()
    })
  })

  describe('checkQueueAlerts', () => {
    it('should check all queues and return alerts for unhealthy ones', async () => {
      const mockQueues = [
        {
          id: 'queue-1',
          queueName: 'admin:sync-jobs',
          queueType: 'SYNC',
          isHealthy: false,
          errorRate: 0.1,
          waitingJobs: 2000,
          avgProcessingTime: null,
          lastCheckedAt: new Date(),
        },
        {
          id: 'queue-2',
          queueName: 'admin:approvals',
          queueType: 'APPROVAL',
          isHealthy: true,
          errorRate: 0.01,
          waitingJobs: 10,
          avgProcessingTime: 1000,
          lastCheckedAt: new Date(),
        },
      ]

      const getAllQueuesSpy = vi
        .spyOn(QueueMonitorService, 'getAllQueues')
        .mockResolvedValue({ queues: mockQueues })
      prisma.adminQueueMonitor.update.mockResolvedValue(mockQueues[0])

      const result = await QueueMonitorService.checkQueueAlerts()

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(
        expect.objectContaining({
          queueName: 'admin:sync-jobs',
          alerts: expect.arrayContaining([
            expect.objectContaining({ type: 'HIGH_ERROR_RATE' }),
            expect.objectContaining({ type: 'QUEUE_BACKLOG' }),
          ]),
        })
      )

      getAllQueuesSpy.mockRestore()
    })

    it('should return empty alerts when all queues healthy', async () => {
      const mockQueues = [
        {
          id: 'queue-1',
          queueName: 'admin:sync-jobs',
          queueType: 'SYNC',
          isHealthy: true,
          errorRate: 0.01,
          waitingJobs: 50,
          avgProcessingTime: 30000,
          lastCheckedAt: new Date(),
        },
      ]

      const getAllQueuesSpy = vi
        .spyOn(QueueMonitorService, 'getAllQueues')
        .mockResolvedValue({ queues: mockQueues })
      prisma.adminQueueMonitor.update.mockResolvedValue(mockQueues[0])

      const result = await QueueMonitorService.checkQueueAlerts()

      expect(result).toEqual([])

      getAllQueuesSpy.mockRestore()
    })
  })
})
