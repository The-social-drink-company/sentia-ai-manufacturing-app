/**
 * Export Queue Configuration
 * BullMQ queue for handling data export operations
 */

import { Queue } from 'bullmq'
import { createBullMQConnection } from '../lib/redis.js'
import { logInfo, logError } from '../utils/logger.js'

let exportQueue = null

/**
 * Get or create the export queue
 * @returns {Queue} BullMQ export queue instance
 */
export function getExportQueue() {
  if (!exportQueue) {
    const connection = createBullMQConnection()

    exportQueue = new Queue('export-queue', {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          age: 24 * 3600, // Keep completed jobs for 24 hours
          count: 1000,
        },
        removeOnFail: {
          age: 7 * 24 * 3600, // Keep failed jobs for 7 days
        },
      },
    })

    exportQueue.on('error', error => {
      logError('Export Queue error:', error)
    })

    logInfo('Export Queue initialized')
  }

  return exportQueue
}

/**
 * Add export job to queue
 * @param {Object} data - Export job data
 * @param {string} data.type - Export type (forecast, inventory, sales, etc.)
 * @param {string} data.format - Export format (csv, xlsx, json)
 * @param {string} data.userId - User initiating export
 * @param {Object} data.filters - Data filters
 * @param {Object} data.options - Additional export options
 * @returns {Promise<Job>} Created job
 */
export async function addExportJob(data) {
  const queue = getExportQueue()

  const job = await queue.add('export-data', data, {
    jobId: `export-${data.type}-${Date.now()}`,
    priority: data.priority || 5,
  })

  logInfo(`Export job created: ${job.id}`, {
    type: data.type,
    format: data.format,
    userId: data.userId,
  })

  return job
}

/**
 * Schedule recurring export
 * @param {Object} data - Export job data
 * @param {string} schedule - Cron expression (e.g., '0 2 * * *' for daily at 2 AM)
 * @returns {Promise<Job>} Created recurring job
 */
export async function scheduleRecurringExport(data, schedule) {
  const queue = getExportQueue()

  const job = await queue.add('export-data', data, {
    repeat: {
      pattern: schedule,
    },
    jobId: `scheduled-export-${data.type}`,
  })

  logInfo(`Scheduled export created: ${job.id}`, {
    type: data.type,
    schedule,
  })

  return job
}

/**
 * Get export job status
 * @param {string} jobId - Job ID
 * @returns {Promise<Object>} Job status information
 */
export async function getExportJobStatus(jobId) {
  const queue = getExportQueue()
  const job = await queue.getJob(jobId)

  if (!job) {
    return { exists: false }
  }

  const state = await job.getState()
  const progress = job.progress

  return {
    exists: true,
    id: job.id,
    state,
    progress,
    data: job.data,
    attemptsMade: job.attemptsMade,
    finishedOn: job.finishedOn,
    processedOn: job.processedOn,
    failedReason: job.failedReason,
    returnvalue: job.returnvalue, // Contains file path/URL after completion
  }
}

/**
 * Cancel export job
 * @param {string} jobId - Job ID to cancel
 * @returns {Promise<boolean>} True if cancelled successfully
 */
export async function cancelExportJob(jobId) {
  const queue = getExportQueue()
  const job = await queue.getJob(jobId)

  if (!job) {
    return false
  }

  await job.remove()
  logInfo(`Export job cancelled: ${jobId}`)

  return true
}

/**
 * Remove scheduled export
 * @param {string} jobId - Job ID of scheduled export
 * @returns {Promise<boolean>} True if removed successfully
 */
export async function removeScheduledExport(jobId) {
  const queue = getExportQueue()
  const job = await queue.getJob(jobId)

  if (!job) {
    return false
  }

  await job.remove()
  logInfo(`Scheduled export removed: ${jobId}`)

  return true
}

/**
 * Get queue metrics
 * @returns {Promise<Object>} Queue metrics
 */
export async function getExportQueueMetrics() {
  const queue = getExportQueue()

  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ])

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed,
  }
}

/**
 * Get all scheduled exports
 * @returns {Promise<Array>} List of scheduled exports
 */
export async function getScheduledExports() {
  const queue = getExportQueue()
  const repeatableJobs = await queue.getRepeatableJobs()

  return repeatableJobs.map(job => ({
    id: job.id,
    key: job.key,
    name: job.name,
    pattern: job.pattern,
    next: job.next,
  }))
}

/**
 * Close queue connection
 * @returns {Promise<void>}
 */
export async function closeExportQueue() {
  if (exportQueue) {
    await exportQueue.close()
    exportQueue = null
    logInfo('Export Queue closed')
  }
}

export default {
  getExportQueue,
  addExportJob,
  scheduleRecurringExport,
  getExportJobStatus,
  cancelExportJob,
  removeScheduledExport,
  getExportQueueMetrics,
  getScheduledExports,
  closeExportQueue,
}
