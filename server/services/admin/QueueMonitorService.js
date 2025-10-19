/**
 * Queue Monitor Service
 *
 * Monitors BullMQ queue health, metrics, and manages queue operations
 *
 * Features:
 * - Real-time queue metrics (active, waiting, completed, failed jobs)
 * - Performance tracking (throughput, error rate, avg processing time)
 * - Queue management (pause, resume, retry failed jobs, clean)
 * - Alert monitoring (threshold breaches)
 * - AdminQueueMonitor table synchronization
 *
 * Tracked Queues:
 * - admin:approvals (Week 1)
 * - admin:sync-jobs (Week 2)
 * - admin:notifications (future)
 *
 * @module services/admin/QueueMonitorService
 */

import prisma from '../../lib/prisma.js'
import logger from '../../utils/logger.js'

class QueueMonitorService {
  constructor() {
    this.ALERT_THRESHOLDS = {
      ERROR_RATE: 0.05, // 5% error rate triggers alert
      QUEUE_SIZE: 1000, // Alert if waiting jobs > 1000
      PROCESSING_TIME: 300000, // Alert if avg processing time > 5 minutes
    }

    this.QUEUE_TYPES = {
      'admin:approvals': 'APPROVAL',
      'admin:sync-jobs': 'SYNC',
      'admin:notifications': 'NOTIFICATION',
    }
  }

  /**
   * Get all tracked queues with current metrics
   *
   * @param {Object} filters - Filter criteria
   * @param {string} filters.queueType - Filter by queue type
   * @param {boolean} filters.isHealthy - Filter by health status
   * @param {boolean} filters.isPaused - Filter by paused status
   * @param {Object} options - Pagination options
   * @param {number} options.page - Page number
   * @param {number} options.limit - Results per page
   * @returns {Promise<Object>} Paginated queue list with metrics
   */
  async getAllQueues(filters = {}, options = {}) {
    try {
      const { queueType, isHealthy, isPaused } = filters
      const { page = 1, limit = 20 } = options

      const where = {}
      if (queueType) where.queueType = queueType
      if (isHealthy !== undefined) where.isHealthy = isHealthy
      if (isPaused !== undefined) where.isPaused = isPaused

      const [queues, total] = await Promise.all([
        prisma.adminQueueMonitor.findMany({
          where,
          orderBy: { lastCheckedAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.adminQueueMonitor.count({ where }),
      ])

      return {
        queues,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      }
    } catch (error) {
      logger.error('[QueueMonitorService] Failed to get queues:', error)
      throw new Error(`Failed to retrieve queues: ${error.message}`)
    }
  }

  /**
   * Get queue by ID with detailed metrics
   *
   * @param {string} id - Queue monitor ID
   * @returns {Promise<Object>} Queue with detailed metrics
   */
  async getQueueById(id) {
    try {
      const queue = await prisma.adminQueueMonitor.findUnique({
        where: { id },
      })

      if (!queue) {
        throw new Error('Queue not found')
      }

      // Refresh metrics from BullMQ
      await this.updateQueueMetrics(queue.queueName)

      // Re-fetch after update
      const updatedQueue = await prisma.adminQueueMonitor.findUnique({
        where: { id },
      })

      return updatedQueue
    } catch (error) {
      logger.error(`[QueueMonitorService] Failed to get queue ${id}:`, error)
      throw new Error(`Failed to retrieve queue: ${error.message}`)
    }
  }

  /**
   * Get queue by name
   *
   * @param {string} queueName - Queue name (e.g., 'admin:approvals')
   * @returns {Promise<Object>} Queue monitor record
   */
  async getQueueByName(queueName) {
    try {
      let queue = await prisma.adminQueueMonitor.findUnique({
        where: { queueName },
      })

      // Auto-create if doesn't exist
      if (!queue) {
        const queueType = this.QUEUE_TYPES[queueName] || 'UNKNOWN'
        queue = await prisma.adminQueueMonitor.create({
          data: {
            queueName,
            queueType,
            isPaused: false,
            isHealthy: true,
            activeJobs: 0,
            waitingJobs: 0,
            completedJobs: 0,
            failedJobs: 0,
          },
        })

        logger.info(`[QueueMonitorService] Created queue monitor for ${queueName}`)
      }

      return queue
    } catch (error) {
      logger.error(`[QueueMonitorService] Failed to get queue ${queueName}:`, error)
      throw new Error(`Failed to retrieve queue: ${error.message}`)
    }
  }

  /**
   * Update queue metrics from BullMQ
   *
   * Fetches real-time metrics from BullMQ queue and updates AdminQueueMonitor table
   *
   * @param {string} queueName - Queue name
   * @returns {Promise<Object>} Updated queue metrics
   */
  async updateQueueMetrics(queueName) {
    try {
      // Get BullMQ queue instance
      const bullQueue = await this._getBullMQQueue(queueName)

      if (!bullQueue) {
        logger.warn(`[QueueMonitorService] BullMQ queue not found: ${queueName}`)
        return null
      }

      // Fetch metrics from BullMQ
      const [waiting, active, completed, failed, delayed, isPaused] = await Promise.all([
        bullQueue.getWaitingCount(),
        bullQueue.getActiveCount(),
        bullQueue.getCompletedCount(),
        bullQueue.getFailedCount(),
        bullQueue.getDelayedCount(),
        bullQueue.isPaused(),
      ])

      // Calculate performance metrics
      const totalJobs = waiting + active + completed + failed + delayed
      const errorRate = totalJobs > 0 ? failed / totalJobs : 0
      const throughput = this._calculateThroughput(completed, 60000) // Jobs per minute

      // Calculate avg processing time (if jobs exist)
      let avgProcessingTime = null
      if (completed > 0) {
        const recentJobs = await bullQueue.getJobs(['completed'], 0, 10)
        if (recentJobs.length > 0) {
          const durations = recentJobs
            .filter((job) => job.finishedOn && job.processedOn)
            .map((job) => job.finishedOn - job.processedOn)

          if (durations.length > 0) {
            avgProcessingTime = Math.round(
              durations.reduce((sum, d) => sum + d, 0) / durations.length
            )
          }
        }
      }

      // Determine health status
      const isHealthy =
        errorRate < this.ALERT_THRESHOLDS.ERROR_RATE &&
        waiting < this.ALERT_THRESHOLDS.QUEUE_SIZE &&
        (avgProcessingTime === null || avgProcessingTime < this.ALERT_THRESHOLDS.PROCESSING_TIME)

      // Get or create queue monitor record
      const existingQueue = await this.getQueueByName(queueName)

      // Update metrics
      const updatedQueue = await prisma.adminQueueMonitor.update({
        where: { id: existingQueue.id },
        data: {
          isPaused,
          isHealthy,
          activeJobs: active,
          waitingJobs: waiting,
          completedJobs: completed,
          failedJobs: failed,
          avgProcessingTime,
          throughput,
          errorRate,
          lastCheckedAt: new Date(),
          updatedAt: new Date(),
        },
      })

      logger.info(`[QueueMonitorService] Updated metrics for ${queueName}`)

      return updatedQueue
    } catch (error) {
      logger.error(`[QueueMonitorService] Failed to update metrics for ${queueName}:`, error)
      throw new Error(`Failed to update queue metrics: ${error.message}`)
    }
  }

  /**
   * Pause queue (requires approval for production)
   *
   * @param {string} queueName - Queue name
   * @param {string} userId - User requesting pause
   * @param {string} reason - Reason for pause
   * @returns {Promise<Object>} Pause result (immediate or approval required)
   */
  async pauseQueue(queueName, userId, reason = 'Manual pause') {
    try {
      const queue = await this.getQueueByName(queueName)

      if (queue.isPaused) {
        throw new Error('Queue is already paused')
      }

      // Check if approval required (production environment)
      const approvalRequired = this._checkApprovalRequired()

      if (approvalRequired) {
        // Create approval request
        const ApprovalService = (await import('./ApprovalService.js')).default

        const approval = await ApprovalService.createApprovalRequest({
          type: 'QUEUE_OPERATION',
          category: 'OPERATIONAL',
          priority: 'HIGH',
          title: `Pause queue: ${queueName}`,
          description: `Request to pause ${queueName} queue. ${reason}`,
          requestedChanges: {
            queueName,
            operation: 'PAUSE',
            reason,
          },
          rationale: reason,
          requesterId: userId,
        })

        return {
          success: false,
          approvalRequired: true,
          approval,
          message: 'Production queue pause requires approval',
        }
      }

      // Non-production: Pause immediately
      const bullQueue = await this._getBullMQQueue(queueName)

      if (!bullQueue) {
        throw new Error(`BullMQ queue not found: ${queueName}`)
      }

      await bullQueue.pause()

      // Update database
      const updatedQueue = await prisma.adminQueueMonitor.update({
        where: { id: queue.id },
        data: {
          isPaused: true,
          updatedAt: new Date(),
        },
      })

      logger.info(`[QueueMonitorService] Queue ${queueName} paused by ${userId}`)

      return {
        success: true,
        approvalRequired: false,
        queue: updatedQueue,
        message: `Queue ${queueName} paused`,
      }
    } catch (error) {
      logger.error(`[QueueMonitorService] Failed to pause queue ${queueName}:`, error)
      throw new Error(`Failed to pause queue: ${error.message}`)
    }
  }

  /**
   * Resume paused queue
   *
   * @param {string} queueName - Queue name
   * @param {string} userId - User requesting resume
   * @returns {Promise<Object>} Updated queue
   */
  async resumeQueue(queueName, userId) {
    try {
      const queue = await this.getQueueByName(queueName)

      if (!queue.isPaused) {
        throw new Error('Queue is not paused')
      }

      const bullQueue = await this._getBullMQQueue(queueName)

      if (!bullQueue) {
        throw new Error(`BullMQ queue not found: ${queueName}`)
      }

      await bullQueue.resume()

      // Update database
      const updatedQueue = await prisma.adminQueueMonitor.update({
        where: { id: queue.id },
        data: {
          isPaused: false,
          updatedAt: new Date(),
        },
      })

      logger.info(`[QueueMonitorService] Queue ${queueName} resumed by ${userId}`)

      return updatedQueue
    } catch (error) {
      logger.error(`[QueueMonitorService] Failed to resume queue ${queueName}:`, error)
      throw new Error(`Failed to resume queue: ${error.message}`)
    }
  }

  /**
   * Retry failed jobs in queue
   *
   * @param {string} queueName - Queue name
   * @param {number} limit - Max number of jobs to retry (default: 10)
   * @returns {Promise<Object>} Retry result
   */
  async retryFailedJobs(queueName, limit = 10) {
    try {
      const bullQueue = await this._getBullMQQueue(queueName)

      if (!bullQueue) {
        throw new Error(`BullMQ queue not found: ${queueName}`)
      }

      const failedJobs = await bullQueue.getJobs(['failed'], 0, limit)

      if (failedJobs.length === 0) {
        return {
          success: true,
          retriedCount: 0,
          message: 'No failed jobs to retry',
        }
      }

      // Retry each failed job
      const retryPromises = failedJobs.map((job) => job.retry())
      await Promise.all(retryPromises)

      logger.info(`[QueueMonitorService] Retried ${failedJobs.length} failed jobs in ${queueName}`)

      // Update metrics
      await this.updateQueueMetrics(queueName)

      return {
        success: true,
        retriedCount: failedJobs.length,
        message: `Retried ${failedJobs.length} failed jobs`,
      }
    } catch (error) {
      logger.error(`[QueueMonitorService] Failed to retry jobs in ${queueName}:`, error)
      throw new Error(`Failed to retry failed jobs: ${error.message}`)
    }
  }

  /**
   * Clean completed/failed jobs from queue
   *
   * @param {string} queueName - Queue name
   * @param {Object} options - Clean options
   * @param {number} options.grace - Grace period in milliseconds (default: 86400000 = 24h)
   * @param {number} options.limit - Max jobs to clean
   * @param {string} options.status - Job status to clean ('completed' or 'failed')
   * @returns {Promise<Object>} Clean result
   */
  async cleanQueue(queueName, options = {}) {
    try {
      const { grace = 86400000, limit, status = 'completed' } = options

      const bullQueue = await this._getBullMQQueue(queueName)

      if (!bullQueue) {
        throw new Error(`BullMQ queue not found: ${queueName}`)
      }

      const cleaned = await bullQueue.clean(grace, limit, status)

      logger.info(`[QueueMonitorService] Cleaned ${cleaned.length} ${status} jobs from ${queueName}`)

      // Update metrics
      await this.updateQueueMetrics(queueName)

      return {
        success: true,
        cleanedCount: cleaned.length,
        status,
        message: `Cleaned ${cleaned.length} ${status} jobs`,
      }
    } catch (error) {
      logger.error(`[QueueMonitorService] Failed to clean queue ${queueName}:`, error)
      throw new Error(`Failed to clean queue: ${error.message}`)
    }
  }

  /**
   * Get jobs in queue with pagination
   *
   * @param {string} queueName - Queue name
   * @param {string} status - Job status ('active', 'waiting', 'completed', 'failed')
   * @param {Object} options - Pagination options
   * @param {number} options.start - Start index
   * @param {number} options.end - End index
   * @returns {Promise<Object>} Jobs list
   */
  async getQueueJobs(queueName, status = 'waiting', options = {}) {
    try {
      const { start = 0, end = 19 } = options

      const bullQueue = await this._getBullMQQueue(queueName)

      if (!bullQueue) {
        throw new Error(`BullMQ queue not found: ${queueName}`)
      }

      const jobs = await bullQueue.getJobs([status], start, end)

      const formattedJobs = jobs.map((job) => ({
        id: job.id,
        name: job.name,
        data: job.data,
        opts: job.opts,
        progress: job.progress,
        attemptsMade: job.attemptsMade,
        finishedOn: job.finishedOn,
        processedOn: job.processedOn,
        failedReason: job.failedReason,
        timestamp: job.timestamp,
      }))

      return {
        jobs: formattedJobs,
        total: jobs.length,
        status,
      }
    } catch (error) {
      logger.error(`[QueueMonitorService] Failed to get jobs from ${queueName}:`, error)
      throw new Error(`Failed to retrieve queue jobs: ${error.message}`)
    }
  }

  /**
   * Get queue health status
   *
   * @param {string} queueName - Queue name
   * @returns {Promise<Object>} Health status with metrics
   */
  async getQueueHealth(queueName) {
    try {
      // Update metrics first
      await this.updateQueueMetrics(queueName)

      const queue = await this.getQueueByName(queueName)

      const health = {
        queueName: queue.queueName,
        isHealthy: queue.isHealthy,
        isPaused: queue.isPaused,
        metrics: {
          activeJobs: queue.activeJobs,
          waitingJobs: queue.waitingJobs,
          completedJobs: queue.completedJobs,
          failedJobs: queue.failedJobs,
          errorRate: queue.errorRate,
          throughput: queue.throughput,
          avgProcessingTime: queue.avgProcessingTime,
        },
        alerts: [],
      }

      // Check thresholds and add alerts
      if (queue.errorRate > this.ALERT_THRESHOLDS.ERROR_RATE) {
        health.alerts.push({
          type: 'HIGH_ERROR_RATE',
          severity: 'WARNING',
          message: `Error rate ${(queue.errorRate * 100).toFixed(2)}% exceeds threshold ${(this.ALERT_THRESHOLDS.ERROR_RATE * 100).toFixed(2)}%`,
        })
      }

      if (queue.waitingJobs > this.ALERT_THRESHOLDS.QUEUE_SIZE) {
        health.alerts.push({
          type: 'QUEUE_BACKLOG',
          severity: 'WARNING',
          message: `Waiting jobs ${queue.waitingJobs} exceeds threshold ${this.ALERT_THRESHOLDS.QUEUE_SIZE}`,
        })
      }

      if (
        queue.avgProcessingTime &&
        queue.avgProcessingTime > this.ALERT_THRESHOLDS.PROCESSING_TIME
      ) {
        health.alerts.push({
          type: 'SLOW_PROCESSING',
          severity: 'WARNING',
          message: `Avg processing time ${(queue.avgProcessingTime / 1000).toFixed(1)}s exceeds threshold ${(this.ALERT_THRESHOLDS.PROCESSING_TIME / 1000).toFixed(1)}s`,
        })
      }

      return health
    } catch (error) {
      logger.error(`[QueueMonitorService] Failed to get health for ${queueName}:`, error)
      throw new Error(`Failed to retrieve queue health: ${error.message}`)
    }
  }

  /**
   * Check alert thresholds for all queues
   *
   * @returns {Promise<Object[]>} List of queues with active alerts
   */
  async checkQueueAlerts() {
    try {
      const { queues } = await this.getAllQueues({}, { page: 1, limit: 100 })

      const alertedQueues = []

      for (const queue of queues) {
        const alerts = []

        // Check error rate
        if (queue.errorRate > this.ALERT_THRESHOLDS.ERROR_RATE) {
          alerts.push({
            type: 'HIGH_ERROR_RATE',
            severity: 'WARNING',
            value: queue.errorRate,
            threshold: this.ALERT_THRESHOLDS.ERROR_RATE,
          })
        }

        // Check queue size
        if (queue.waitingJobs > this.ALERT_THRESHOLDS.QUEUE_SIZE) {
          alerts.push({
            type: 'QUEUE_BACKLOG',
            severity: 'WARNING',
            value: queue.waitingJobs,
            threshold: this.ALERT_THRESHOLDS.QUEUE_SIZE,
          })
        }

        // Check processing time
        if (
          queue.avgProcessingTime &&
          queue.avgProcessingTime > this.ALERT_THRESHOLDS.PROCESSING_TIME
        ) {
          alerts.push({
            type: 'SLOW_PROCESSING',
            severity: 'WARNING',
            value: queue.avgProcessingTime,
            threshold: this.ALERT_THRESHOLDS.PROCESSING_TIME,
          })
        }

        if (alerts.length > 0) {
          alertedQueues.push({
            queueName: queue.queueName,
            queueType: queue.queueType,
            alerts,
            lastCheckedAt: queue.lastCheckedAt,
          })

          // Update lastAlertAt timestamp
          await prisma.adminQueueMonitor.update({
            where: { id: queue.id },
            data: {
              lastAlertAt: new Date(),
            },
          })
        }
      }

      if (alertedQueues.length > 0) {
        logger.warn(`[QueueMonitorService] ${alertedQueues.length} queues have active alerts`)
      }

      return alertedQueues
    } catch (error) {
      logger.error('[QueueMonitorService] Failed to check queue alerts:', error)
      throw new Error(`Failed to check queue alerts: ${error.message}`)
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Get BullMQ queue instance by name
   *
   * @private
   * @param {string} queueName - Queue name
   * @returns {Promise<Queue|null>} BullMQ queue or null
   */
  async _getBullMQQueue(queueName) {
    try {
      switch (queueName) {
        case 'admin:sync-jobs': {
          const { getSyncJobQueue } = await import('../../queues/syncJobQueue.js')
          return getSyncJobQueue()
        }

        case 'admin:approvals': {
          const { getApprovalQueue } = await import('../../queues/approvalQueue.js')
          return getApprovalQueue()
        }

        case 'admin:notifications':
          // TODO: Implement notification queue in future
          logger.warn('[QueueMonitorService] Notification queue not implemented yet')
          return null

        default:
          logger.warn(`[QueueMonitorService] Unknown queue: ${queueName}`)
          return null
      }
    } catch (error) {
      logger.error(`[QueueMonitorService] Failed to get BullMQ queue ${queueName}:`, error)
      return null
    }
  }

  /**
   * Calculate throughput (jobs per minute)
   *
   * @private
   * @param {number} completedJobs - Number of completed jobs
   * @param {number} duration - Duration in milliseconds
   * @returns {number} Throughput (jobs per minute)
   */
  _calculateThroughput(completedJobs, duration) {
    if (completedJobs === 0 || duration === 0) {
      return 0
    }

    const durationMinutes = duration / 60000
    return parseFloat((completedJobs / durationMinutes).toFixed(2))
  }

  /**
   * Check if approval required for queue operation
   *
   * @private
   * @returns {boolean} True if production environment
   */
  _checkApprovalRequired() {
    const environment = process.env.NODE_ENV || 'development'
    return environment === 'production'
  }
}

// Singleton instance
let queueMonitorServiceInstance

/**
 * Get QueueMonitorService singleton instance
 *
 * @returns {QueueMonitorService} Service instance
 */
export function getQueueMonitorService() {
  if (!queueMonitorServiceInstance) {
    queueMonitorServiceInstance = new QueueMonitorService()
  }
  return queueMonitorServiceInstance
}

export default getQueueMonitorService()
