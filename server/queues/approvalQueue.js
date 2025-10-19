/**
 * Admin Approval Queue
 *
 * BullMQ queue for executing approved admin operations asynchronously
 *
 * Features:
 * - Async execution of approved changes
 * - Retry logic with exponential backoff
 * - Type-based execution handlers
 * - Queue monitoring and event tracking
 *
 * Queue Flow:
 * 1. ApprovalService.approve() → addApprovalJob()
 * 2. Worker picks up job → processApprovalJob()
 * 3. Route to type-specific handler
 * 4. Update approval status (COMPLETED/FAILED)
 * 5. Create audit history entry
 *
 * @module queues/approvalQueue
 */

import { Queue, Worker, QueueEvents } from 'bullmq'
import prisma from '../lib/prisma.js'
import logger from '../utils/logger.js'

const QUEUE_NAME = 'admin:approvals'
const WORKER_CONCURRENCY = 3

let approvalQueue
let approvalWorker
let approvalQueueEvents

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
 * Initialize approval queue
 *
 * @returns {Promise<void>}
 */
export async function initializeApprovalQueue() {
  try {
    const redis = await getRedisConnection()

    approvalQueue = new Queue(QUEUE_NAME, {
      connection: redis,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 30000, // Start at 30 seconds
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

    logger.info('[ApprovalQueue] Approval queue initialized')
  } catch (error) {
    logger.error('[ApprovalQueue] Failed to initialize queue:', error)
    throw error
  }
}

/**
 * Initialize approval worker
 *
 * @returns {Promise<void>}
 */
export async function initializeApprovalWorker() {
  try {
    const redis = await getRedisConnection()

    approvalWorker = new Worker(QUEUE_NAME, processApprovalJob, {
      connection: redis,
      concurrency: WORKER_CONCURRENCY,
      limiter: {
        max: 10, // Max 10 jobs
        duration: 1000, // Per 1 second
      },
    })

    // Worker event handlers
    approvalWorker.on('completed', (job, result) => {
      logger.info(`[ApprovalQueue] Job ${job.id} completed for approval ${job.data.approvalId}`, {
        resultSummary: result?.status || 'success',
        result,
      })
    })

    approvalWorker.on('failed', (job, error) => {
      logger.error(
        `[ApprovalQueue] Job ${job.id} failed for approval ${job.data.approvalId}:`,
        error
      )
    })

    approvalWorker.on('error', error => {
      logger.error('[ApprovalQueue] Worker error:', error)
    })

    logger.info('[ApprovalQueue] Approval worker initialized')
  } catch (error) {
    logger.error('[ApprovalQueue] Failed to initialize worker:', error)
    throw error
  }
}

/**
 * Initialize queue events listener
 *
 * @returns {Promise<void>}
 */
export async function initializeApprovalQueueEvents() {
  try {
    const redis = await getRedisConnection()

    approvalQueueEvents = new QueueEvents(QUEUE_NAME, {
      connection: redis,
    })

    approvalQueueEvents.on('waiting', ({ jobId }) => {
      logger.info(`[ApprovalQueue] Job ${jobId} is waiting`)
    })

    approvalQueueEvents.on('active', ({ jobId }) => {
      logger.info(`[ApprovalQueue] Job ${jobId} is active`)
    })

    approvalQueueEvents.on('completed', ({ jobId, returnvalue }) => {
      logger.info(`[ApprovalQueue] Job ${jobId} completed with result:`, returnvalue)
    })

    approvalQueueEvents.on('failed', ({ jobId, failedReason }) => {
      logger.error(`[ApprovalQueue] Job ${jobId} failed:`, failedReason)
    })

    logger.info('[ApprovalQueue] Queue events listener initialized')
  } catch (error) {
    logger.error('[ApprovalQueue] Failed to initialize queue events:', error)
    throw error
  }
}

/**
 * Add approval job to queue
 *
 * @param {string} approvalId - Approval ID
 * @param {Object} requestedChanges - Changes to execute
 * @returns {Promise<Object>} BullMQ job
 */
export async function addApprovalJob(approvalId, requestedChanges) {
  try {
    if (!approvalQueue) {
      throw new Error('Approval queue not initialized')
    }

    const job = await approvalQueue.add(
      'execute-approval',
      {
        approvalId,
        requestedChanges,
        enqueuedAt: new Date().toISOString(),
      },
      {
        jobId: `approval-${approvalId}`,
        priority: requestedChanges.priority === 'CRITICAL' ? 1 : 10,
      }
    )

    logger.info(`[ApprovalQueue] Added job ${job.id} for approval ${approvalId}`)
    return job
  } catch (error) {
    logger.error('[ApprovalQueue] Failed to add job:', error)
    throw error
  }
}

/**
 * Process approval job (worker function)
 *
 * @param {Object} job - BullMQ job
 * @returns {Promise<Object>} Execution result
 */
async function processApprovalJob(job) {
  const { approvalId, requestedChanges } = job.data

  try {
    logger.info(`[ApprovalQueue] Processing job ${job.id} for approval ${approvalId}`)

    // Fetch approval from database
    const approval = await prisma.adminApproval.findUnique({
      where: { id: approvalId },
    })

    if (!approval) {
      throw new Error(`Approval not found: ${approvalId}`)
    }

    if (approval.status !== 'APPROVED') {
      throw new Error(
        `Approval ${approvalId} is not in APPROVED state (current: ${approval.status})`
      )
    }

    // Route to type-specific execution handler
    let executionResult
    switch (approval.type) {
      case 'FEATURE_FLAG':
        executionResult = await executeFeatureFlagChange(approval, requestedChanges)
        break

      case 'CONFIG_CHANGE':
        executionResult = await executeConfigChange(approval, requestedChanges)
        break

      case 'INTEGRATION_SYNC':
        executionResult = await executeIntegrationSync(approval, requestedChanges)
        break

      case 'USER_MGMT':
        executionResult = await executeUserManagement(approval, requestedChanges)
        break

      case 'QUEUE_OPERATION':
        executionResult = await executeQueueOperation(approval, requestedChanges)
        break

      default:
        throw new Error(`Unknown approval type: ${approval.type}`)
    }

    // Update approval to COMPLETED
    await prisma.adminApproval.update({
      where: { id: approvalId },
      data: {
        status: 'COMPLETED',
        executedAt: new Date(),
        executionResult,
      },
    })

    // Create history entry
    await prisma.adminApprovalHistory.create({
      data: {
        approvalId,
        fromStatus: 'APPROVED',
        toStatus: 'COMPLETED',
        changedBy: 'SYSTEM',
        changedAt: new Date(),
        comment: 'Execution successful via BullMQ worker',
      },
    })

    logger.info(`[ApprovalQueue] Job ${job.id} executed successfully for approval ${approvalId}`)

    return {
      success: true,
      approvalId,
      executedAt: new Date().toISOString(),
      result: executionResult,
    }
  } catch (error) {
    logger.error(`[ApprovalQueue] Job ${job.id} execution failed:`, error)

    // Update approval to FAILED
    try {
      await prisma.adminApproval.update({
        where: { id: approvalId },
        data: {
          status: 'FAILED',
          executedAt: new Date(),
          executionError: error.message,
        },
      })

      // Create history entry
      await prisma.adminApprovalHistory.create({
        data: {
          approvalId,
          fromStatus: 'APPROVED',
          toStatus: 'FAILED',
          changedBy: 'SYSTEM',
          changedAt: new Date(),
          comment: `Execution failed: ${error.message}`,
        },
      })
    } catch (dbError) {
      logger.error('[ApprovalQueue] Failed to update approval status:', dbError)
    }

    throw error
  }
}

// ============================================================================
// Execution Handlers (Week 1 Stubs - Will be implemented in Weeks 2-4)
// ============================================================================

/**
 * Execute feature flag change
 *
 * @param {Object} approval - Approval record
 * @param {Object} requestedChanges - Changes to apply
 * @returns {Promise<Object>} Execution result
 */
async function executeFeatureFlagChange(approval, requestedChanges) {
  logger.info(`[ApprovalQueue] Executing feature flag change for approval ${approval.id}`)

  // TODO: Week 2 - Implement actual feature flag toggling
  // Will integrate with FeatureFlagService

  return {
    type: 'FEATURE_FLAG',
    action: 'stub',
    message: 'Feature flag execution stub (Week 2 implementation)',
    requestedChanges,
  }
}

/**
 * Execute configuration change
 *
 * @param {Object} approval - Approval record
 * @param {Object} requestedChanges - Changes to apply
 * @returns {Promise<Object>} Execution result
 */
async function executeConfigChange(approval, requestedChanges) {
  logger.info(`[ApprovalQueue] Executing config change for approval ${approval.id}`)

  // TODO: Week 4 - Implement environment config changes
  // Will integrate with EnvironmentConfigService

  return {
    type: 'CONFIG_CHANGE',
    action: 'stub',
    message: 'Config change execution stub (Week 4 implementation)',
    requestedChanges,
  }
}

/**
 * Execute integration sync
 *
 * @param {Object} approval - Approval record
 * @param {Object} requestedChanges - Changes to apply
 * @returns {Promise<Object>} Execution result
 */
async function executeIntegrationSync(approval, requestedChanges) {
  logger.info(`[ApprovalQueue] Executing integration sync for approval ${approval.id}`)

  // TODO: Week 2 - Implement integration sync triggers
  // Will integrate with IntegrationService

  return {
    type: 'INTEGRATION_SYNC',
    action: 'stub',
    message: 'Integration sync execution stub (Week 2 implementation)',
    requestedChanges,
  }
}

/**
 * Execute user management action
 *
 * @param {Object} approval - Approval record
 * @param {Object} requestedChanges - Changes to apply
 * @returns {Promise<Object>} Execution result
 */
async function executeUserManagement(approval, requestedChanges) {
  logger.info(`[ApprovalQueue] Executing user management action for approval ${approval.id}`)

  // TODO: Week 4 - Implement user creation/deletion
  // Will integrate with Clerk API and Prisma User model

  return {
    type: 'USER_MGMT',
    action: 'stub',
    message: 'User management execution stub (Week 4 implementation)',
    requestedChanges,
  }
}

/**
 * Execute queue operation
 *
 * @param {Object} approval - Approval record
 * @param {Object} requestedChanges - Changes to apply
 * @returns {Promise<Object>} Execution result
 */
async function executeQueueOperation(approval, requestedChanges) {
  logger.info(`[ApprovalQueue] Executing queue operation for approval ${approval.id}`)

  // TODO: Week 3 - Implement queue pause/resume/retry
  // Will integrate with QueueMonitorService

  return {
    type: 'QUEUE_OPERATION',
    action: 'stub',
    message: 'Queue operation execution stub (Week 3 implementation)',
    requestedChanges,
  }
}

// ============================================================================
// Queue Management
// ============================================================================

/**
 * Get approval queue instance
 *
 * @returns {Queue} BullMQ queue
 */
export function getApprovalQueue() {
  if (!approvalQueue) {
    throw new Error('Approval queue not initialized')
  }
  return approvalQueue
}

/**
 * Get queue statistics
 *
 * @returns {Promise<Object>} Queue stats
 */
export async function getApprovalQueueStats() {
  try {
    if (!approvalQueue) {
      throw new Error('Approval queue not initialized')
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      approvalQueue.getWaitingCount(),
      approvalQueue.getActiveCount(),
      approvalQueue.getCompletedCount(),
      approvalQueue.getFailedCount(),
      approvalQueue.getDelayedCount(),
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
    logger.error('[ApprovalQueue] Failed to get queue stats:', error)
    throw error
  }
}

/**
 * Shutdown queue and worker gracefully
 *
 * @returns {Promise<void>}
 */
export async function shutdownApprovalQueue() {
  try {
    logger.info('[ApprovalQueue] Shutting down approval queue and worker...')

    if (approvalQueueEvents) {
      await approvalQueueEvents.close()
      logger.info('[ApprovalQueue] Queue events listener closed')
    }

    if (approvalWorker) {
      await approvalWorker.close()
      logger.info('[ApprovalQueue] Worker closed')
    }

    if (approvalQueue) {
      await approvalQueue.close()
      logger.info('[ApprovalQueue] Queue closed')
    }

    logger.info('[ApprovalQueue] Shutdown complete')
  } catch (error) {
    logger.error('[ApprovalQueue] Shutdown error:', error)
    throw error
  }
}

// Auto-initialize on import (for server startup)
if (process.env.NODE_ENV !== 'test') {
  initializeApprovalQueue().catch(error => {
    logger.error('[ApprovalQueue] Auto-initialization failed:', error)
  })

  initializeApprovalWorker().catch(error => {
    logger.error('[ApprovalQueue] Worker auto-initialization failed:', error)
  })

  initializeApprovalQueueEvents().catch(error => {
    logger.error('[ApprovalQueue] Queue events auto-initialization failed:', error)
  })
}
