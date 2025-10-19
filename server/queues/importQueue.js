/**
 * Import Queue Configuration
 *
 * BullMQ queue for async import job processing
 * Handles CSV/Excel file imports with validation, transformation, and data insertion
 *
 * @module queues/importQueue
 */

const { Queue, Worker, QueueEvents } = require('bullmq')
const { getRedisClient } = require('../config/redis')
const { processImportJob } = require('../services/import/ImportProcessor')
const { logAudit } = require('../services/audit/AuditLogger')
const { IMPORT_ACTIONS, STATUS, SEVERITY } = require('../services/audit/AuditCategories')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// ============================================================================
// Queue Configuration
// ============================================================================

const QUEUE_NAME = 'import-queue'

const QUEUE_OPTIONS = {
  connection: null, // Will be set dynamically
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000, // 5 seconds initial delay
    },
    removeOnComplete: {
      age: 86400, // Keep completed jobs for 24 hours
      count: 1000, // Keep max 1000 completed jobs
    },
    removeOnFail: {
      age: 604800, // Keep failed jobs for 7 days
      count: 5000, // Keep max 5000 failed jobs
    },
  },
}

// ============================================================================
// Queue Instance
// ============================================================================

let importQueue
let importWorker
let importQueueEvents

/**
 * Initialize import queue
 */
async function initializeImportQueue() {
  if (importQueue) {
    console.log('Import queue already initialized')
    return importQueue
  }

  try {
    const redis = await getRedisClient()

    // Create queue
    importQueue = new Queue(QUEUE_NAME, {
      ...QUEUE_OPTIONS,
      connection: redis,
    })

    // Create queue events listener
    importQueueEvents = new QueueEvents(QUEUE_NAME, {
      connection: redis,
    })

    // Set up event listeners
    setupQueueEventListeners()

    console.log(`✅ Import queue initialized: ${QUEUE_NAME}`)

    return importQueue
  } catch (error) {
    console.error('Failed to initialize import queue:', error)
    throw error
  }
}

/**
 * Initialize import worker
 */
async function initializeImportWorker() {
  if (importWorker) {
    console.log('Import worker already initialized')
    return importWorker
  }

  try {
    const redis = await getRedisClient()

    // Create worker
    importWorker = new Worker(QUEUE_NAME, processImportJobWrapper, {
      connection: redis,
      concurrency: 5, // Process up to 5 imports concurrently
      limiter: {
        max: 10, // Max 10 jobs per duration
        duration: 60000, // per 60 seconds
      },
    })

    // Set up worker event listeners
    setupWorkerEventListeners()

    console.log(`✅ Import worker initialized with concurrency: 5`)

    return importWorker
  } catch (error) {
    console.error('Failed to initialize import worker:', error)
    throw error
  }
}

// ============================================================================
// Job Processing
// ============================================================================

/**
 * Wrapper for import job processing with error handling
 */
async function processImportJobWrapper(job) {
  const { importJobId, userId } = job.data

  console.log(`Processing import job: ${importJobId} (Bull Job ID: ${job.id})`)

  try {
    // Update job status to IMPORTING
    await prisma.importJob.update({
      where: { id: importJobId },
      data: {
        status: 'IMPORTING',
        startedAt: new Date(),
      },
    })

    // Progress callback
    const progressCallback = async progress => {
      // Update job progress in BullMQ
      await job.updateProgress(progress.progress)

      // Update database
      await prisma.importJob.update({
        where: { id: importJobId },
        data: {
          processedRows: progress.processedRows || 0,
          succeededRows: progress.succeededRows || 0,
          failedRows: progress.failedRows || 0,
        },
      })

      console.log(`Import job ${importJobId} progress: ${progress.progress}%`)
    }

    // Process the import
    const result = await processImportJob(importJobId, progressCallback)

    // Update job status to COMPLETED
    await prisma.importJob.update({
      where: { id: importJobId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        processedRows: result.processedRows,
        succeededRows: result.succeededRows,
        failedRows: result.failedRows,
        errors: result.errors || [],
      },
    })

    // Log audit trail
    await logAudit({
      userId,
      action: IMPORT_ACTIONS.IMPORT_COMPLETED,
      category: 'IMPORT',
      resourceType: 'IMPORT_JOB',
      resourceId: importJobId,
      status: STATUS.SUCCESS,
      metadata: {
        totalRows: result.totalRows,
        succeededRows: result.succeededRows,
        failedRows: result.failedRows,
        duration: result.duration,
      },
    })

    console.log(`✅ Import job ${importJobId} completed successfully`)

    return result
  } catch (error) {
    console.error(`❌ Import job ${importJobId} failed:`, error)

    // Update job status to FAILED
    await prisma.importJob.update({
      where: { id: importJobId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        errors: [{ error: error.message }],
      },
    })

    // Log audit trail
    await logAudit({
      userId,
      action: IMPORT_ACTIONS.IMPORT_FAILED,
      category: 'IMPORT',
      resourceType: 'IMPORT_JOB',
      resourceId: importJobId,
      status: STATUS.FAILURE,
      severity: SEVERITY.ERROR,
      errorMessage: error.message,
    })

    throw error
  }
}

// ============================================================================
// Job Management
// ============================================================================

/**
 * Add import job to queue
 */
async function addImportJob(importJobId, userId, options = {}) {
  if (!importQueue) {
    await initializeImportQueue()
  }

  const jobData = {
    importJobId,
    userId,
    timestamp: new Date().toISOString(),
  }

  const jobOptions = {
    jobId: `import-${importJobId}`,
    priority: options.priority || 5,
    ...options,
  }

  try {
    const job = await importQueue.add('import', jobData, jobOptions)

    console.log(`Import job added to queue: ${job.id}`)

    // Log audit trail
    await logAudit({
      userId,
      action: IMPORT_ACTIONS.IMPORT_QUEUED,
      category: 'IMPORT',
      resourceType: 'IMPORT_JOB',
      resourceId: importJobId,
      status: STATUS.SUCCESS,
      metadata: {
        bullJobId: job.id,
        priority: jobOptions.priority,
      },
    })

    return job
  } catch (error) {
    console.error('Failed to add import job to queue:', error)

    await logAudit({
      userId,
      action: IMPORT_ACTIONS.IMPORT_QUEUED,
      category: 'IMPORT',
      resourceType: 'IMPORT_JOB',
      resourceId: importJobId,
      status: STATUS.FAILURE,
      severity: SEVERITY.ERROR,
      errorMessage: error.message,
    })

    throw error
  }
}

/**
 * Get import job status
 */
async function getImportJobStatus(importJobId) {
  if (!importQueue) {
    await initializeImportQueue()
  }

  const bullJobId = `import-${importJobId}`
  const job = await importQueue.getJob(bullJobId)

  if (!job) {
    return { exists: false }
  }

  const state = await job.getState()
  const progress = await job.progress

  return {
    exists: true,
    id: job.id,
    state,
    progress,
    attemptsMade: job.attemptsMade,
    processedOn: job.processedOn,
    finishedOn: job.finishedOn,
    returnvalue: job.returnvalue,
    failedReason: job.failedReason,
  }
}

/**
 * Cancel import job
 */
async function cancelImportJob(importJobId, userId) {
  if (!importQueue) {
    await initializeImportQueue()
  }

  const bullJobId = `import-${importJobId}`
  const job = await importQueue.getJob(bullJobId)

  if (!job) {
    throw new Error(`Import job not found: ${importJobId}`)
  }

  try {
    await job.remove()

    // Update database
    await prisma.importJob.update({
      where: { id: importJobId },
      data: {
        status: 'CANCELLED',
        completedAt: new Date(),
      },
    })

    // Log audit trail
    await logAudit({
      userId,
      action: IMPORT_ACTIONS.IMPORT_CANCELLED,
      category: 'IMPORT',
      resourceType: 'IMPORT_JOB',
      resourceId: importJobId,
      status: STATUS.SUCCESS,
    })

    console.log(`Import job cancelled: ${importJobId}`)

    return { success: true }
  } catch (error) {
    console.error('Failed to cancel import job:', error)
    throw error
  }
}

/**
 * Retry failed import job
 */
async function retryImportJob(importJobId, userId) {
  if (!importQueue) {
    await initializeImportQueue()
  }

  const bullJobId = `import-${importJobId}`
  const job = await importQueue.getJob(bullJobId)

  if (!job) {
    throw new Error(`Import job not found: ${importJobId}`)
  }

  try {
    await job.retry()

    // Update database
    await prisma.importJob.update({
      where: { id: importJobId },
      data: {
        status: 'PENDING',
        errors: [],
      },
    })

    // Log audit trail
    await logAudit({
      userId,
      action: IMPORT_ACTIONS.IMPORT_RETRIED,
      category: 'IMPORT',
      resourceType: 'IMPORT_JOB',
      resourceId: importJobId,
      status: STATUS.SUCCESS,
    })

    console.log(`Import job retried: ${importJobId}`)

    return { success: true }
  } catch (error) {
    console.error('Failed to retry import job:', error)
    throw error
  }
}

// ============================================================================
// Queue Monitoring
// ============================================================================

/**
 * Get queue metrics
 */
async function getQueueMetrics() {
  if (!importQueue) {
    await initializeImportQueue()
  }

  const [waiting, active, completed, failed, delayed] = await Promise.all([
    importQueue.getWaitingCount(),
    importQueue.getActiveCount(),
    importQueue.getCompletedCount(),
    importQueue.getFailedCount(),
    importQueue.getDelayedCount(),
  ])

  return {
    queueName: QUEUE_NAME,
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed,
  }
}

/**
 * Get jobs by status
 */
async function getJobsByStatus(status, start = 0, end = 99) {
  if (!importQueue) {
    await initializeImportQueue()
  }

  const jobs = await importQueue.getJobs(status, start, end)

  return jobs.map(job => ({
    id: job.id,
    name: job.name,
    data: job.data,
    progress: job.progress,
    attemptsMade: job.attemptsMade,
    timestamp: job.timestamp,
    processedOn: job.processedOn,
    finishedOn: job.finishedOn,
    failedReason: job.failedReason,
  }))
}

/**
 * Clean old jobs
 */
async function cleanOldJobs(grace = 86400000) {
  if (!importQueue) {
    await initializeImportQueue()
  }

  // grace = 24 hours in milliseconds
  await importQueue.clean(grace, 1000, 'completed')
  await importQueue.clean(grace * 7, 5000, 'failed') // Keep failed jobs for 7 days

  console.log('Old import jobs cleaned')
}

// ============================================================================
// Event Listeners
// ============================================================================

/**
 * Set up queue event listeners
 */
function setupQueueEventListeners() {
  if (!importQueueEvents) return

  importQueueEvents.on('completed', ({ jobId }) => {
    console.log(`✅ Import job completed: ${jobId}`)
  })

  importQueueEvents.on('failed', ({ jobId, failedReason }) => {
    console.error(`❌ Import job failed: ${jobId}`, failedReason)
  })

  importQueueEvents.on('progress', ({ jobId, data }) => {
    console.log(`Import job progress: ${jobId} - ${data}%`)
  })
}

/**
 * Set up worker event listeners
 */
function setupWorkerEventListeners() {
  if (!importWorker) return

  importWorker.on('completed', job => {
    console.log(`Worker completed job: ${job.id}`)
  })

  importWorker.on('failed', (job, error) => {
    console.error(`Worker failed job: ${job.id}`, error.message)
  })

  importWorker.on('error', error => {
    console.error('Import worker error:', error)
  })
}

// ============================================================================
// Graceful Shutdown
// ============================================================================

/**
 * Close import queue and worker
 */
async function closeImportQueue() {
  try {
    if (importWorker) {
      await importWorker.close()
      console.log('Import worker closed')
    }

    if (importQueueEvents) {
      await importQueueEvents.close()
      console.log('Import queue events closed')
    }

    if (importQueue) {
      await importQueue.close()
      console.log('Import queue closed')
    }
  } catch (error) {
    console.error('Error closing import queue:', error)
    throw error
  }
}

// ============================================================================
// Exports
// ============================================================================

module.exports = {
  // Initialization
  initializeImportQueue,
  initializeImportWorker,

  // Job management
  addImportJob,
  getImportJobStatus,
  cancelImportJob,
  retryImportJob,

  // Queue monitoring
  getQueueMetrics,
  getJobsByStatus,
  cleanOldJobs,

  // Cleanup
  closeImportQueue,

  // Queue instance (for testing)
  getQueue: () => importQueue,
}
