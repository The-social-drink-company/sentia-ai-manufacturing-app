/**
 * Import Queue Configuration
 * BullMQ queue for handling data import operations
 */

import { Queue } from 'bullmq';
import { createBullMQConnection } from '../lib/redis.js';
import { logInfo, logError } from '../utils/logger.js';

let importQueue = null;

/**
 * Get or create the import queue
 * @returns {Queue} BullMQ import queue instance
 */
export function getImportQueue() {
  if (!importQueue) {
    const connection = createBullMQConnection();

    importQueue = new Queue('import-queue', {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          age: 24 * 3600, // Keep completed jobs for 24 hours
          count: 1000, // Keep last 1000 completed jobs
        },
        removeOnFail: {
          age: 7 * 24 * 3600, // Keep failed jobs for 7 days
        },
      },
    });

    importQueue.on('error', (error) => {
      logError('Import Queue error:', error);
    });

    logInfo('Import Queue initialized');
  }

  return importQueue;
}

/**
 * Add import job to queue
 * @param {Object} data - Import job data
 * @param {string} data.fileId - File ID to import
 * @param {string} data.userId - User initiating import
 * @param {Object} data.mapping - Column mapping configuration
 * @param {Object} data.options - Additional import options
 * @returns {Promise<Job>} Created job
 */
export async function addImportJob(data) {
  const queue = getImportQueue();

  const job = await queue.add('import-data', data, {
    jobId: `import-${data.fileId}-${Date.now()}`,
    priority: data.priority || 5,
  });

  logInfo(`Import job created: ${job.id}`, {
    fileId: data.fileId,
    userId: data.userId,
  });

  return job;
}

/**
 * Get import job status
 * @param {string} jobId - Job ID
 * @returns {Promise<Object>} Job status information
 */
export async function getImportJobStatus(jobId) {
  const queue = getImportQueue();
  const job = await queue.getJob(jobId);

  if (!job) {
    return { exists: false };
  }

  const state = await job.getState();
  const progress = job.progress;

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
  };
}

/**
 * Cancel import job
 * @param {string} jobId - Job ID to cancel
 * @returns {Promise<boolean>} True if cancelled successfully
 */
export async function cancelImportJob(jobId) {
  const queue = getImportQueue();
  const job = await queue.getJob(jobId);

  if (!job) {
    return false;
  }

  await job.remove();
  logInfo(`Import job cancelled: ${jobId}`);

  return true;
}

/**
 * Get queue metrics
 * @returns {Promise<Object>} Queue metrics
 */
export async function getImportQueueMetrics() {
  const queue = getImportQueue();

  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed,
  };
}

/**
 * Close queue connection
 * @returns {Promise<void>}
 */
export async function closeImportQueue() {
  if (importQueue) {
    await importQueue.close();
    importQueue = null;
    logInfo('Import Queue closed');
  }
}

export default {
  getImportQueue,
  addImportJob,
  getImportJobStatus,
  cancelImportJob,
  getImportQueueMetrics,
  closeImportQueue,
};
