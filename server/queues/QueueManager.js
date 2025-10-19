const { Queue, QueueEvents } = require('bullmq')
const { createBullMQConnection } = require('../lib/redis')
const logger = require('../utils/logger')

/**
 * QueueManager
 *
 * Central management for all BullMQ queues.
 *
 * Features:
 * - Queue initialization and lifecycle
 * - Event handling and logging
 * - Dead Letter Queue (DLQ) support
 * - Queue monitoring
 * - Job scheduling
 *
 * Queues:
 * - forecast-queue: AI forecast computations
 * - optimization-queue: Inventory optimization jobs
 * - sync-queue: API integration syncs
 * - import-queue: CSV/Excel data imports
 * - export-queue: Report generation
 * - notification-queue: Email/alert notifications
 * - analytics-queue: Background analytics calculations
 */
class QueueManager {
  constructor() {
    this.queues = new Map()
    this.queueEvents = new Map()
    this.connection = null

    // Queue configurations
    this.queueConfigs = {
      forecast: {
        name: 'forecast-queue',
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000, // Start with 2 seconds
          },
          removeOnComplete: {
            age: 24 * 3600, // Keep completed jobs for 24 hours
            count: 1000, // Keep last 1000 completed jobs
          },
          removeOnFail: {
            age: 7 * 24 * 3600, // Keep failed jobs for 7 days
          },
          timeout: 5 * 60 * 1000, // 5 minutes max
        },
      },
      optimization: {
        name: 'optimization-queue',
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: {
            age: 24 * 3600,
            count: 1000,
          },
          removeOnFail: {
            age: 7 * 24 * 3600,
          },
          timeout: 5 * 60 * 1000,
        },
      },
      sync: {
        name: 'sync-queue',
        defaultJobOptions: {
          attempts: 5, // More retries for syncs
          backoff: {
            type: 'exponential',
            delay: 5000, // Start with 5 seconds
          },
          removeOnComplete: {
            age: 24 * 3600,
            count: 500,
          },
          removeOnFail: {
            age: 7 * 24 * 3600,
          },
          timeout: 10 * 60 * 1000, // 10 minutes for syncs
        },
      },
      import: {
        name: 'import-queue',
        defaultJobOptions: {
          attempts: 2, // Fewer retries for imports
          backoff: {
            type: 'fixed',
            delay: 5000,
          },
          removeOnComplete: {
            age: 7 * 24 * 3600, // Keep import jobs longer
            count: 100,
          },
          removeOnFail: {
            age: 30 * 24 * 3600, // Keep failed imports for 30 days
          },
          timeout: 15 * 60 * 1000, // 15 minutes for large imports
        },
      },
      export: {
        name: 'export-queue',
        defaultJobOptions: {
          attempts: 2,
          backoff: {
            type: 'fixed',
            delay: 3000,
          },
          removeOnComplete: {
            age: 3 * 24 * 3600, // Keep exports for 3 days
            count: 100,
          },
          removeOnFail: {
            age: 7 * 24 * 3600,
          },
          timeout: 10 * 60 * 1000,
        },
      },
      notification: {
        name: 'notification-queue',
        defaultJobOptions: {
          attempts: 5, // Important to deliver notifications
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: {
            age: 24 * 3600,
            count: 10000, // Keep more notifications
          },
          removeOnFail: {
            age: 7 * 24 * 3600,
          },
          timeout: 30 * 1000, // 30 seconds max
        },
      },
      analytics: {
        name: 'analytics-queue',
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: {
            age: 24 * 3600,
            count: 500,
          },
          removeOnFail: {
            age: 7 * 24 * 3600,
          },
          timeout: 10 * 60 * 1000,
        },
      },
    }
  }

  /**
   * Initialize all queues
   */
  async initialize() {
    try {
      logger.info('[QueueManager] Initializing queues...')

      // Create Redis connection for BullMQ
      this.connection = createBullMQConnection()

      // Test connection
      await this.connection.ping()
      logger.info('[QueueManager] Redis connection established')

      // Initialize each queue
      for (const [key, config] of Object.entries(this.queueConfigs)) {
        await this.initializeQueue(key, config)
      }

      logger.info(`[QueueManager] Initialized ${this.queues.size} queues`)

      return {
        success: true,
        queues: Array.from(this.queues.keys()),
      }
    } catch (error) {
      logger.error('[QueueManager] Failed to initialize queues:', error)
      throw error
    }
  }

  /**
   * Initialize a single queue
   */
  async initializeQueue(key, config) {
    try {
      // Create queue
      const queue = new Queue(config.name, {
        connection: this.connection,
        defaultJobOptions: config.defaultJobOptions,
      })

      // Create queue events for monitoring
      const queueEvents = new QueueEvents(config.name, {
        connection: createBullMQConnection(), // Separate connection for events
      })

      // Store references
      this.queues.set(key, queue)
      this.queueEvents.set(key, queueEvents)

      // Setup event listeners
      this.setupEventListeners(key, queue, queueEvents)

      logger.info(`[QueueManager] Initialized queue: ${config.name}`)

      return queue
    } catch (error) {
      logger.error(`[QueueManager] Failed to initialize queue ${key}:`, error)
      throw error
    }
  }

  /**
   * Setup event listeners for queue
   */
  setupEventListeners(key, queue, queueEvents) {
    // Job added
    queueEvents.on('added', ({ jobId }) => {
      logger.debug(`[Queue:${key}] Job added: ${jobId}`)
    })

    // Job completed
    queueEvents.on('completed', ({ jobId }) => {
      // returnvalue available in event but not logged for brevity
      logger.info(`[Queue:${key}] Job completed: ${jobId}`)
    })

    // Job failed
    queueEvents.on('failed', ({ jobId, failedReason }) => {
      logger.error(`[Queue:${key}] Job failed: ${jobId}`, {
        reason: failedReason,
      })
    })

    // Job progress
    queueEvents.on('progress', ({ jobId, data }) => {
      logger.debug(`[Queue:${key}] Job progress: ${jobId}`, data)
    })

    // Job stalled
    queueEvents.on('stalled', ({ jobId }) => {
      logger.warn(`[Queue:${key}] Job stalled: ${jobId}`)
    })

    // Job retrying
    queueEvents.on('retrying', ({ jobId, attemptsMade }) => {
      logger.warn(`[Queue:${key}] Job retrying: ${jobId} (attempt ${attemptsMade})`)
    })

    // Error event
    queueEvents.on('error', err => {
      logger.error(`[Queue:${key}] Queue error:`, err)
    })
  }

  /**
   * Get queue by key
   */
  getQueue(key) {
    const queue = this.queues.get(key)
    if (!queue) {
      throw new Error(`Queue not found: ${key}`)
    }
    return queue
  }

  /**
   * Add job to queue
   */
  async addJob(queueKey, jobName, data, options = {}) {
    try {
      const queue = this.getQueue(queueKey)

      const job = await queue.add(jobName, data, {
        ...options,
        // Merge with default options if not specified
        priority: options.priority || undefined,
        delay: options.delay || undefined,
        jobId: options.jobId || undefined,
      })

      logger.info(`[QueueManager] Job added to ${queueKey}: ${job.id}`)

      return {
        success: true,
        jobId: job.id,
        queueName: queue.name,
      }
    } catch (error) {
      logger.error(`[QueueManager] Failed to add job to ${queueKey}:`, error)
      throw error
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(queueKey, jobId) {
    try {
      const queue = this.getQueue(queueKey)
      const job = await queue.getJob(jobId)

      if (!job) {
        return null
      }

      const state = await job.getState()
      const progress = job.progress

      return {
        id: job.id,
        name: job.name,
        data: job.data,
        state,
        progress,
        attemptsMade: job.attemptsMade,
        timestamp: job.timestamp,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
        failedReason: job.failedReason,
        returnvalue: job.returnvalue,
      }
    } catch (error) {
      logger.error(`[QueueManager] Failed to get job status:`, error)
      return null
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(queueKey) {
    try {
      const queue = this.getQueue(queueKey)

      const [waiting, active, completed, failed, delayed, isPaused] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        queue.getDelayedCount(),
        queue.isPaused(),
      ])

      return {
        queueName: queue.name,
        waiting,
        active,
        completed,
        failed,
        delayed,
        isPaused,
        total: waiting + active + completed + failed + delayed,
      }
    } catch (error) {
      logger.error(`[QueueManager] Failed to get queue stats:`, error)
      return null
    }
  }

  /**
   * Get all queue statistics
   */
  async getAllQueueStats() {
    const stats = []

    for (const key of this.queues.keys()) {
      const stat = await this.getQueueStats(key)
      if (stat) {
        stats.push({
          key,
          ...stat,
        })
      }
    }

    return stats
  }

  /**
   * Get failed jobs
   */
  async getFailedJobs(queueKey, start = 0, end = 10) {
    try {
      const queue = this.getQueue(queueKey)
      const jobs = await queue.getFailed(start, end)

      return jobs.map(job => ({
        id: job.id,
        name: job.name,
        data: job.data,
        failedReason: job.failedReason,
        attemptsMade: job.attemptsMade,
        timestamp: job.timestamp,
        finishedOn: job.finishedOn,
      }))
    } catch (error) {
      logger.error(`[QueueManager] Failed to get failed jobs:`, error)
      return []
    }
  }

  /**
   * Retry failed job
   */
  async retryJob(queueKey, jobId) {
    try {
      const queue = this.getQueue(queueKey)
      const job = await queue.getJob(jobId)

      if (!job) {
        throw new Error(`Job not found: ${jobId}`)
      }

      await job.retry()

      logger.info(`[QueueManager] Job retried: ${jobId}`)

      return {
        success: true,
        jobId,
      }
    } catch (error) {
      logger.error(`[QueueManager] Failed to retry job:`, error)
      throw error
    }
  }

  /**
   * Remove job
   */
  async removeJob(queueKey, jobId) {
    try {
      const queue = this.getQueue(queueKey)
      const job = await queue.getJob(jobId)

      if (!job) {
        throw new Error(`Job not found: ${jobId}`)
      }

      await job.remove()

      logger.info(`[QueueManager] Job removed: ${jobId}`)

      return {
        success: true,
        jobId,
      }
    } catch (error) {
      logger.error(`[QueueManager] Failed to remove job:`, error)
      throw error
    }
  }

  /**
   * Pause queue
   */
  async pauseQueue(queueKey) {
    try {
      const queue = this.getQueue(queueKey)
      await queue.pause()

      logger.info(`[QueueManager] Queue paused: ${queueKey}`)

      return { success: true }
    } catch (error) {
      logger.error(`[QueueManager] Failed to pause queue:`, error)
      throw error
    }
  }

  /**
   * Resume queue
   */
  async resumeQueue(queueKey) {
    try {
      const queue = this.getQueue(queueKey)
      await queue.resume()

      logger.info(`[QueueManager] Queue resumed: ${queueKey}`)

      return { success: true }
    } catch (error) {
      logger.error(`[QueueManager] Failed to resume queue:`, error)
      throw error
    }
  }

  /**
   * Clean queue
   */
  async cleanQueue(queueKey, grace = 3600000, limit = 1000, type = 'completed') {
    try {
      const queue = this.getQueue(queueKey)
      const jobs = await queue.clean(grace, limit, type)

      logger.info(`[QueueManager] Cleaned ${jobs.length} ${type} jobs from ${queueKey}`)

      return {
        success: true,
        cleaned: jobs.length,
      }
    } catch (error) {
      logger.error(`[QueueManager] Failed to clean queue:`, error)
      throw error
    }
  }

  /**
   * Drain queue (remove all jobs)
   */
  async drainQueue(queueKey) {
    try {
      const queue = this.getQueue(queueKey)
      await queue.drain()

      logger.warn(`[QueueManager] Queue drained: ${queueKey}`)

      return { success: true }
    } catch (error) {
      logger.error(`[QueueManager] Failed to drain queue:`, error)
      throw error
    }
  }

  /**
   * Obliterate queue (remove all data)
   */
  async obliterateQueue(queueKey) {
    try {
      const queue = this.getQueue(queueKey)
      await queue.obliterate({ force: true })

      logger.warn(`[QueueManager] Queue obliterated: ${queueKey}`)

      return { success: true }
    } catch (error) {
      logger.error(`[QueueManager] Failed to obliterate queue:`, error)
      throw error
    }
  }

  /**
   * Shutdown all queues
   */
  async shutdown() {
    try {
      logger.info('[QueueManager] Shutting down queues...')

      // Close all queue events
      for (const [key, queueEvents] of this.queueEvents) {
        await queueEvents.close()
        logger.debug(`[QueueManager] Closed events for ${key}`)
      }

      // Close all queues
      for (const [key, queue] of this.queues) {
        await queue.close()
        logger.debug(`[QueueManager] Closed queue ${key}`)
      }

      // Close Redis connection
      if (this.connection) {
        await this.connection.quit()
        this.connection = null
      }

      // Clear maps
      this.queues.clear()
      this.queueEvents.clear()

      logger.info('[QueueManager] Shutdown complete')

      return { success: true }
    } catch (error) {
      logger.error('[QueueManager] Shutdown error:', error)
      throw error
    }
  }
}

// Singleton instance
let instance = null

module.exports = {
  QueueManager,
  getInstance: () => {
    if (!instance) {
      instance = new QueueManager()
    }
    return instance
  },
}
