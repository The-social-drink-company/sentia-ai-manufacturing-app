/**
 * Sync Job Queue
 *
 * BullMQ queue for executing integration sync jobs asynchronously
 *
 * Features:
 * - Async execution of integration sync jobs
 * - Retry logic with exponential backoff
 * - Type-based sync handler routing
 * - Queue monitoring and event tracking
 * - AdminSyncJob status updates
 *
 * Sync Types:
 * - XERO_SYNC: Financial data sync (AP, AR, bank accounts)
 * - SHOPIFY_SYNC: Sales data sync (orders, products, inventory)
 * - AMAZON_SYNC: Marketplace orders and fulfillment
 * - UNLEASHED_SYNC: ERP inventory and manufacturing data
 *
 * Queue Flow:
 * 1. IntegrationService.syncIntegration() → addSyncJob()
 * 2. Worker picks up job → processSyncJob()
 * 3. Route to type-specific handler
 * 4. Update AdminSyncJob status (COMPLETED/FAILED)
 * 5. Update AdminIntegration (lastSyncStatus, consecutiveFailures)
 *
 * @module queues/syncJobQueue
 */

import { Queue, Worker, QueueEvents } from 'bullmq'
import prisma from '../lib/prisma.js'
import logger from '../utils/logger.js'

const QUEUE_NAME = 'admin:sync-jobs'
const WORKER_CONCURRENCY = 5

let syncJobQueue
let syncJobWorker
let syncJobQueueEvents

/**
 * Get Redis connection (dynamic import for CommonJS redis.js)
 *
 * @private
 * @returns {Promise<Object>} Redis client
 */
async function getRedisConnection() {
  const { getRedisClient } = await import('../config/redis.js')
  return await getRedisClient()
}

/**
 * Initialize sync job queue
 *
 * @returns {Promise<void>}
 */
export async function initializeSyncJobQueue() {
  try {
    const redis = await getRedisConnection()

    syncJobQueue = new Queue(QUEUE_NAME, {
      connection: redis,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 60000, // Start at 1 minute
        },
        removeOnComplete: {
          age: 86400, // Keep completed jobs for 24 hours
          count: 1000,
        },
        removeOnFail: {
          age: 604800, // Keep failed jobs for 7 days
          count: 5000,
        },
      },
    })

    logger.info('[SyncJobQueue] Sync job queue initialized')
  } catch (error) {
    logger.error('[SyncJobQueue] Failed to initialize queue:', error)
    throw error
  }
}

/**
 * Initialize sync job worker
 *
 * @returns {Promise<void>}
 */
export async function initializeSyncJobWorker() {
  try {
    const redis = await getRedisConnection()

    syncJobWorker = new Worker(QUEUE_NAME, processSyncJob, {
      connection: redis,
      concurrency: WORKER_CONCURRENCY,
      limiter: {
        max: 10, // Max 10 jobs
        duration: 1000, // Per 1 second
      },
    })

    // Worker event handlers
    syncJobWorker.on('completed', (job) => {
      logger.info(`[SyncJobQueue] Job ${job.id} completed for sync job ${job.data.syncJobId}`)
    })

    syncJobWorker.on('failed', (job, error) => {
      logger.error(`[SyncJobQueue] Job ${job.id} failed for sync job ${job.data.syncJobId}:`, error)
    })

    syncJobWorker.on('error', (error) => {
      logger.error('[SyncJobQueue] Worker error:', error)
    })

    logger.info('[SyncJobQueue] Sync job worker initialized')
  } catch (error) {
    logger.error('[SyncJobQueue] Failed to initialize worker:', error)
    throw error
  }
}

/**
 * Initialize queue events listener
 *
 * @returns {Promise<void>}
 */
export async function initializeSyncJobQueueEvents() {
  try {
    const redis = await getRedisConnection()

    syncJobQueueEvents = new QueueEvents(QUEUE_NAME, {
      connection: redis,
    })

    syncJobQueueEvents.on('waiting', ({ jobId }) => {
      logger.info(`[SyncJobQueue] Job ${jobId} is waiting`)
    })

    syncJobQueueEvents.on('active', ({ jobId }) => {
      logger.info(`[SyncJobQueue] Job ${jobId} is active`)
    })

    syncJobQueueEvents.on('completed', ({ jobId }) => {
      logger.info(`[SyncJobQueue] Job ${jobId} completed`)
    })

    syncJobQueueEvents.on('failed', ({ jobId, failedReason }) => {
      logger.error(`[SyncJobQueue] Job ${jobId} failed:`, failedReason)
    })

    logger.info('[SyncJobQueue] Queue events listener initialized')
  } catch (error) {
    logger.error('[SyncJobQueue] Failed to initialize queue events:', error)
    throw error
  }
}

/**
 * Add sync job to queue
 *
 * @param {string} integrationId - Integration ID
 * @param {string} syncType - Sync type (XERO, SHOPIFY, AMAZON_SP_API, UNLEASHED)
 * @param {Object} options - Sync options
 * @param {string} options.syncJobId - AdminSyncJob ID
 * @returns {Promise<Object>} BullMQ job
 */
export async function addSyncJob(integrationId, syncType, options = {}) {
  try {
    if (!syncJobQueue) {
      throw new Error('Sync job queue not initialized')
    }

    const { syncJobId } = options

    const job = await syncJobQueue.add(
      'execute-sync',
      {
        integrationId,
        syncType,
        syncJobId,
        enqueuedAt: new Date().toISOString(),
      },
      {
        jobId: syncJobId ? `sync-${syncJobId}` : undefined,
        priority: options.priority || 10,
      }
    )

    logger.info(`[SyncJobQueue] Added job ${job.id} for integration ${integrationId}`)
    return job
  } catch (error) {
    logger.error('[SyncJobQueue] Failed to add job:', error)
    throw error
  }
}

/**
 * Process sync job (worker function)
 *
 * @param {Object} job - BullMQ job
 * @returns {Promise<Object>} Execution result
 */
async function processSyncJob(job) {
  const { integrationId, syncType, syncJobId } = job.data
  const startTime = Date.now()

  try {
    logger.info(`[SyncJobQueue] Processing job ${job.id} for integration ${integrationId}, type ${syncType}`)

    // Fetch sync job from database
    const syncJob = await prisma.adminSyncJob.findUnique({
      where: { id: syncJobId },
    })

    if (!syncJob) {
      throw new Error(`Sync job not found: ${syncJobId}`)
    }

    if (syncJob.status !== 'PENDING') {
      throw new Error(`Sync job ${syncJobId} is not in PENDING state (current: ${syncJob.status})`)
    }

    // Update sync job to PROCESSING
    await prisma.adminSyncJob.update({
      where: { id: syncJobId },
      data: {
        status: 'PROCESSING',
        startedAt: new Date(),
      },
    })

    // Fetch integration
    const integration = await prisma.adminIntegration.findUnique({
      where: { id: integrationId },
    })

    if (!integration) {
      throw new Error(`Integration not found: ${integrationId}`)
    }

    // Route to type-specific sync handler
    let syncResult
    switch (syncType) {
      case 'XERO':
        syncResult = await executeXeroSync(syncJob, integration)
        break

      case 'SHOPIFY':
        syncResult = await executeShopifySync(syncJob, integration)
        break

      case 'AMAZON_SP_API':
        syncResult = await executeAmazonSync(syncJob, integration)
        break

      case 'UNLEASHED':
        syncResult = await executeUnleashedSync(syncJob, integration)
        break

      default:
        throw new Error(`Unknown sync type: ${syncType}`)
    }

    const duration = Date.now() - startTime

    // Update sync job to COMPLETED
    await prisma.adminSyncJob.update({
      where: { id: syncJobId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        duration,
        processedRecords: syncResult.recordsProcessed || 0,
        successCount: syncResult.successCount || 0,
        errorCount: syncResult.errorCount || 0,
        result: syncResult,
      },
    })

    // Update integration
    await prisma.adminIntegration.update({
      where: { id: integrationId },
      data: {
        lastSyncStatus: 'COMPLETED',
        consecutiveFailures: 0,
        updatedAt: new Date(),
      },
    })

    logger.info(`[SyncJobQueue] Job ${job.id} executed successfully for sync job ${syncJobId} (${duration}ms)`)

    return {
      success: true,
      syncJobId,
      duration,
      result: syncResult,
    }
  } catch (error) {
    const duration = Date.now() - startTime
    logger.error(`[SyncJobQueue] Job ${job.id} execution failed:`, error)

    // Update sync job to FAILED
    try {
      await prisma.adminSyncJob.update({
        where: { id: syncJobId },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          duration,
          errors: {
            message: error.message,
            stack: error.stack,
          },
        },
      })

      // Update integration (increment consecutive failures)
      const integration = await prisma.adminIntegration.findUnique({
        where: { id: integrationId },
      })

      if (integration) {
        await prisma.adminIntegration.update({
          where: { id: integrationId },
          data: {
            lastSyncStatus: 'FAILED',
            lastError: error.message,
            consecutiveFailures: (integration.consecutiveFailures || 0) + 1,
            updatedAt: new Date(),
          },
        })
      }
    } catch (dbError) {
      logger.error('[SyncJobQueue] Failed to update sync job status:', dbError)
    }

    throw error
  }
}

// ============================================================================
// Sync Execution Handlers (Week 2 Stubs - Will be implemented in Week 3)
// ============================================================================

/**
 * Execute Xero financial data sync
 *
 * @param {Object} syncJob - AdminSyncJob record
 * @param {Object} integration - AdminIntegration record
 * @returns {Promise<Object>} Sync result
 */
async function executeXeroSync(syncJob, integration) {
  const integrationId = integration?.id ?? 'unknown'
  logger.info(`[SyncJobQueue] Executing Xero sync for job ${syncJob.id} (integration ${integrationId})`)

  // TODO: Week 3 - Implement actual Xero API sync
  // Will fetch: accounts receivable, accounts payable, bank accounts
  // Integration module: server/integrations/xero.js

  return {
    success: true,
    message: 'Xero sync stub (Week 3 implementation)',
    recordsProcessed: 0,
    successCount: 0,
    errorCount: 0,
  }
}
/**
 * Get queue statistics
 *
 * @returns {Promise<Object>} Queue stats
 */
export async function getSyncJobQueueStats() {
  try {
    if (!syncJobQueue) {
      throw new Error('Sync job queue not initialized')
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      syncJobQueue.getWaitingCount(),
      syncJobQueue.getActiveCount(),
      syncJobQueue.getCompletedCount(),
      syncJobQueue.getFailedCount(),
      syncJobQueue.getDelayedCount(),
    ])

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    }
  } catch (error) {
    logger.error('[SyncJobQueue] Failed to get queue stats:', error)
    throw error
  }
}

/**
 * Shutdown queue and worker gracefully
 *
 * @returns {Promise<void>}
 */
export async function shutdownSyncJobQueue() {
  try {
    logger.info('[SyncJobQueue] Shutting down sync job queue and worker...')

    if (syncJobQueueEvents) {
      await syncJobQueueEvents.close()
      logger.info('[SyncJobQueue] Queue events listener closed')
    }

    if (syncJobWorker) {
      await syncJobWorker.close()
      logger.info('[SyncJobQueue] Worker closed')
    }

    if (syncJobQueue) {
      await syncJobQueue.close()
      logger.info('[SyncJobQueue] Queue closed')
    }

    logger.info('[SyncJobQueue] Shutdown complete')
  } catch (error) {
    logger.error('[SyncJobQueue] Shutdown error:', error)
    throw error
  }
}

// Auto-initialize on import (for server startup)
if (process.env.NODE_ENV !== 'test') {
  initializeSyncJobQueue().catch((error) => {
    logger.error('[SyncJobQueue] Auto-initialization failed:', error)
  })

  initializeSyncJobWorker().catch((error) => {
    logger.error('[SyncJobQueue] Worker auto-initialization failed:', error)
  })

  initializeSyncJobQueueEvents().catch((error) => {
    logger.error('[SyncJobQueue] Queue events auto-initialization failed:', error)
  })
}


async function executeShopifySync(syncJob, integration) {
  const integrationId = integration?.id ?? 'unknown'
  logger.info(`[SyncJobQueue] Executing Shopify sync for job ${syncJob.id} (integration ${integrationId})`)

  return {
    success: true,
    message: 'Shopify sync stub (Week 3 implementation)',
    recordsProcessed: 0,
    successCount: 0,
    errorCount: 0,
  }
}

async function executeAmazonSync(syncJob, integration) {
  const integrationId = integration?.id ?? 'unknown'
  logger.info(`[SyncJobQueue] Executing Amazon sync for job ${syncJob.id} (integration ${integrationId})`)

  return {
    success: true,
    message: 'Amazon sync stub (Week 3 implementation)',
    recordsProcessed: 0,
    successCount: 0,
    errorCount: 0,
  }
}

async function executeUnleashedSync(syncJob, integration) {
  const integrationId = integration?.id ?? 'unknown'
  logger.info(`[SyncJobQueue] Executing Unleashed sync for job ${syncJob.id} (integration ${integrationId})`)

  return {
    success: true,
    message: 'Unleashed sync stub (Week 3 implementation)',
    recordsProcessed: 0,
    successCount: 0,
    errorCount: 0,
  }
}
