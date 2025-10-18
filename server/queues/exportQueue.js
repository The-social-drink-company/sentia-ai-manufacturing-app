/**
 * Export Queue Configuration
 *
 * BullMQ queue for async export job processing
 * Handles CSV/Excel/PDF/JSON export generation
 *
 * @module queues/exportQueue
 */

const { Queue, Worker, QueueEvents } = require('bullmq');
const { getRedisClient } = require('../config/redis');
const { generateExport } = require('../services/import/ExportGenerator');
const { logAudit } = require('../services/audit/AuditLogger');
const { EXPORT_ACTIONS, STATUS, SEVERITY } = require('../services/audit/AuditCategories');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ============================================================================
// Queue Configuration
// ============================================================================

const QUEUE_NAME = 'export-queue';

const QUEUE_OPTIONS = {
  connection: null, // Will be set dynamically
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 3000, // 3 seconds initial delay
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
};

// ============================================================================
// Queue Instance
// ============================================================================

let exportQueue;
let exportWorker;
let exportQueueEvents;

/**
 * Initialize export queue
 */
async function initializeExportQueue() {
  if (exportQueue) {
    console.log('Export queue already initialized');
    return exportQueue;
  }

  try {
    const redis = await getRedisClient();

    // Create queue
    exportQueue = new Queue(QUEUE_NAME, {
      ...QUEUE_OPTIONS,
      connection: redis,
    });

    // Create queue events listener
    exportQueueEvents = new QueueEvents(QUEUE_NAME, {
      connection: redis,
    });

    // Set up event listeners
    setupQueueEventListeners();

    console.log(`✅ Export queue initialized: ${QUEUE_NAME}`);

    return exportQueue;
  } catch (error) {
    console.error('Failed to initialize export queue:', error);
    throw error;
  }
}

/**
 * Initialize export worker
 */
async function initializeExportWorker() {
  if (exportWorker) {
    console.log('Export worker already initialized');
    return exportWorker;
  }

  try {
    const redis = await getRedisClient();

    // Create worker
    exportWorker = new Worker(
      QUEUE_NAME,
      processExportJobWrapper,
      {
        connection: redis,
        concurrency: 3, // Process up to 3 exports concurrently
        limiter: {
          max: 20, // Max 20 jobs per duration
          duration: 60000, // per 60 seconds
        },
      }
    );

    // Set up worker event listeners
    setupWorkerEventListeners();

    console.log(`✅ Export worker initialized with concurrency: 3`);

    return exportWorker;
  } catch (error) {
    console.error('Failed to initialize export worker:', error);
    throw error;
  }
}

// ============================================================================
// Job Processing
// ============================================================================

/**
 * Wrapper for export job processing with error handling
 */
async function processExportJobWrapper(job) {
  const { exportJobId, userId, dataType, format, filters, options } = job.data;

  console.log(`Processing export job: ${exportJobId} (Bull Job ID: ${job.id})`);

  try {
    // Update job status to EXPORTING
    await prisma.exportJob.update({
      where: { id: exportJobId },
      data: {
        status: 'EXPORTING',
        startedAt: new Date(),
      },
    });

    // Fetch data based on dataType
    const data = await fetchDataForExport(dataType, filters);

    // Progress update
    await job.updateProgress(50);

    // Generate export
    const result = await generateExport(data, format, {
      ...options,
      userId,
      filename: options.filename || `export-${exportJobId}.${format}`,
    });

    // Progress update
    await job.updateProgress(100);

    // Update job status to COMPLETED
    await prisma.exportJob.update({
      where: { id: exportJobId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        filePath: result.filepath,
        fileSize: result.size,
        rowCount: result.rowCount,
      },
    });

    // Create File record
    await prisma.file.create({
      data: {
        filename: result.filename,
        filePath: result.filepath,
        fileType: format.toUpperCase(),
        fileSize: result.size,
        mimeType: getMimeType(format),
        uploadedBy: userId,
      },
    });

    // Log audit trail
    await logAudit({
      userId,
      action: EXPORT_ACTIONS.EXPORT_COMPLETED,
      category: 'EXPORT',
      resourceType: 'EXPORT_JOB',
      resourceId: exportJobId,
      status: STATUS.SUCCESS,
      metadata: {
        dataType,
        format,
        rowCount: result.rowCount,
        fileSize: result.size,
        duration: result.duration,
      },
    });

    console.log(`✅ Export job ${exportJobId} completed successfully`);

    return result;

  } catch (error) {
    console.error(`❌ Export job ${exportJobId} failed:`, error);

    // Update job status to FAILED
    await prisma.exportJob.update({
      where: { id: exportJobId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        errors: [{ error: error.message }],
      },
    });

    // Log audit trail
    await logAudit({
      userId,
      action: EXPORT_ACTIONS.EXPORT_FAILED,
      category: 'EXPORT',
      resourceType: 'EXPORT_JOB',
      resourceId: exportJobId,
      status: STATUS.FAILURE,
      severity: SEVERITY.ERROR,
      errorMessage: error.message,
    });

    throw error;
  }
}

/**
 * Fetch data for export based on data type
 */
async function fetchDataForExport(dataType, filters = {}) {
  const { startDate, endDate, status, limit, offset } = filters;

  // Build where clause
  const where = {};

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  if (status) {
    where.status = status;
  }

  // Fetch data based on type
  switch (dataType) {
    case 'PRODUCTS':
      return await prisma.product.findMany({
        where,
        take: limit,
        skip: offset,
      });

    case 'INVENTORY':
      return await prisma.inventory.findMany({
        where,
        include: {
          product: true,
        },
        take: limit,
        skip: offset,
      });

    case 'ORDERS':
      return await prisma.order.findMany({
        where,
        include: {
          items: true,
          customer: true,
        },
        take: limit,
        skip: offset,
      });

    case 'CUSTOMERS':
      return await prisma.customer.findMany({
        where,
        take: limit,
        skip: offset,
      });

    case 'SUPPLIERS':
      return await prisma.supplier.findMany({
        where,
        take: limit,
        skip: offset,
      });

    case 'FORECASTS':
      return await prisma.forecast.findMany({
        where,
        take: limit,
        skip: offset,
      });

    case 'OPTIMIZATIONS':
      return await prisma.optimization.findMany({
        where,
        take: limit,
        skip: offset,
      });

    case 'AUDIT_LOGS':
      return await prisma.auditLog.findMany({
        where,
        take: limit,
        skip: offset,
      });

    default:
      throw new Error(`Unsupported data type: ${dataType}`);
  }
}

/**
 * Get MIME type for export format
 */
function getMimeType(format) {
  const mimeTypes = {
    csv: 'text/csv',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    pdf: 'application/pdf',
    json: 'application/json',
  };

  return mimeTypes[format] || 'application/octet-stream';
}

// ============================================================================
// Job Management
// ============================================================================

/**
 * Add export job to queue
 */
async function addExportJob(exportJobId, userId, dataType, format, filters = {}, options = {}) {
  if (!exportQueue) {
    await initializeExportQueue();
  }

  const jobData = {
    exportJobId,
    userId,
    dataType,
    format,
    filters,
    options,
    timestamp: new Date().toISOString(),
  };

  const jobOptions = {
    jobId: `export-${exportJobId}`,
    priority: options.priority || 5,
  };

  try {
    const job = await exportQueue.add('export', jobData, jobOptions);

    console.log(`Export job added to queue: ${job.id}`);

    // Log audit trail
    await logAudit({
      userId,
      action: EXPORT_ACTIONS.EXPORT_QUEUED,
      category: 'EXPORT',
      resourceType: 'EXPORT_JOB',
      resourceId: exportJobId,
      status: STATUS.SUCCESS,
      metadata: {
        bullJobId: job.id,
        dataType,
        format,
        priority: jobOptions.priority,
      },
    });

    return job;
  } catch (error) {
    console.error('Failed to add export job to queue:', error);

    await logAudit({
      userId,
      action: EXPORT_ACTIONS.EXPORT_QUEUED,
      category: 'EXPORT',
      resourceType: 'EXPORT_JOB',
      resourceId: exportJobId,
      status: STATUS.FAILURE,
      severity: SEVERITY.ERROR,
      errorMessage: error.message,
    });

    throw error;
  }
}

/**
 * Get export job status
 */
async function getExportJobStatus(exportJobId) {
  if (!exportQueue) {
    await initializeExportQueue();
  }

  const bullJobId = `export-${exportJobId}`;
  const job = await exportQueue.getJob(bullJobId);

  if (!job) {
    return { exists: false };
  }

  const state = await job.getState();
  const progress = await job.progress;

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
  };
}

/**
 * Cancel export job
 */
async function cancelExportJob(exportJobId, userId) {
  if (!exportQueue) {
    await initializeExportQueue();
  }

  const bullJobId = `export-${exportJobId}`;
  const job = await exportQueue.getJob(bullJobId);

  if (!job) {
    throw new Error(`Export job not found: ${exportJobId}`);
  }

  try {
    await job.remove();

    // Update database
    await prisma.exportJob.update({
      where: { id: exportJobId },
      data: {
        status: 'CANCELLED',
        completedAt: new Date(),
      },
    });

    // Log audit trail
    await logAudit({
      userId,
      action: EXPORT_ACTIONS.EXPORT_CANCELLED,
      category: 'EXPORT',
      resourceType: 'EXPORT_JOB',
      resourceId: exportJobId,
      status: STATUS.SUCCESS,
    });

    console.log(`Export job cancelled: ${exportJobId}`);

    return { success: true };
  } catch (error) {
    console.error('Failed to cancel export job:', error);
    throw error;
  }
}

/**
 * Retry failed export job
 */
async function retryExportJob(exportJobId, userId) {
  if (!exportQueue) {
    await initializeExportQueue();
  }

  const bullJobId = `export-${exportJobId}`;
  const job = await exportQueue.getJob(bullJobId);

  if (!job) {
    throw new Error(`Export job not found: ${exportJobId}`);
  }

  try {
    await job.retry();

    // Update database
    await prisma.exportJob.update({
      where: { id: exportJobId },
      data: {
        status: 'PENDING',
        errors: [],
      },
    });

    // Log audit trail
    await logAudit({
      userId,
      action: EXPORT_ACTIONS.EXPORT_RETRIED,
      category: 'EXPORT',
      resourceType: 'EXPORT_JOB',
      resourceId: exportJobId,
      status: STATUS.SUCCESS,
    });

    console.log(`Export job retried: ${exportJobId}`);

    return { success: true };
  } catch (error) {
    console.error('Failed to retry export job:', error);
    throw error;
  }
}

// ============================================================================
// Queue Monitoring
// ============================================================================

/**
 * Get queue metrics
 */
async function getQueueMetrics() {
  if (!exportQueue) {
    await initializeExportQueue();
  }

  const [waiting, active, completed, failed, delayed] = await Promise.all([
    exportQueue.getWaitingCount(),
    exportQueue.getActiveCount(),
    exportQueue.getCompletedCount(),
    exportQueue.getFailedCount(),
    exportQueue.getDelayedCount(),
  ]);

  return {
    queueName: QUEUE_NAME,
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed,
  };
}

/**
 * Get jobs by status
 */
async function getJobsByStatus(status, start = 0, end = 99) {
  if (!exportQueue) {
    await initializeExportQueue();
  }

  const jobs = await exportQueue.getJobs(status, start, end);

  return jobs.map((job) => ({
    id: job.id,
    name: job.name,
    data: job.data,
    progress: job.progress,
    attemptsMade: job.attemptsMade,
    timestamp: job.timestamp,
    processedOn: job.processedOn,
    finishedOn: job.finishedOn,
    failedReason: job.failedReason,
  }));
}

/**
 * Clean old jobs
 */
async function cleanOldJobs(grace = 86400000) {
  if (!exportQueue) {
    await initializeExportQueue();
  }

  // grace = 24 hours in milliseconds
  await exportQueue.clean(grace, 1000, 'completed');
  await exportQueue.clean(grace * 7, 5000, 'failed'); // Keep failed jobs for 7 days

  console.log('Old export jobs cleaned');
}

// ============================================================================
// Event Listeners
// ============================================================================

/**
 * Set up queue event listeners
 */
function setupQueueEventListeners() {
  if (!exportQueueEvents) return;

  exportQueueEvents.on('completed', ({ jobId }) => {
    console.log(`✅ Export job completed: ${jobId}`);
  });

  exportQueueEvents.on('failed', ({ jobId, failedReason }) => {
    console.error(`❌ Export job failed: ${jobId}`, failedReason);
  });

  exportQueueEvents.on('progress', ({ jobId, data }) => {
    console.log(`Export job progress: ${jobId} - ${data}%`);
  });
}

/**
 * Set up worker event listeners
 */
function setupWorkerEventListeners() {
  if (!exportWorker) return;

  exportWorker.on('completed', (job) => {
    console.log(`Worker completed job: ${job.id}`);
  });

  exportWorker.on('failed', (job, error) => {
    console.error(`Worker failed job: ${job.id}`, error.message);
  });

  exportWorker.on('error', (error) => {
    console.error('Export worker error:', error);
  });
}

// ============================================================================
// Graceful Shutdown
// ============================================================================

/**
 * Close export queue and worker
 */
async function closeExportQueue() {
  try {
    if (exportWorker) {
      await exportWorker.close();
      console.log('Export worker closed');
    }

    if (exportQueueEvents) {
      await exportQueueEvents.close();
      console.log('Export queue events closed');
    }

    if (exportQueue) {
      await exportQueue.close();
      console.log('Export queue closed');
    }
  } catch (error) {
    console.error('Error closing export queue:', error);
    throw error;
  }
}

// ============================================================================
// Exports
// ============================================================================

module.exports = {
  // Initialization
  initializeExportQueue,
  initializeExportWorker,

  // Job management
  addExportJob,
  getExportJobStatus,
  cancelExportJob,
  retryExportJob,

  // Queue monitoring
  getQueueMetrics,
  getJobsByStatus,
  cleanOldJobs,

  // Cleanup
  closeExportQueue,

  // Queue instance (for testing)
  getQueue: () => exportQueue,
};
