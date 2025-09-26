import express from 'express';
import { requireAuth } from '@clerk/express';
import multer from 'multer';
import path from 'path';
import { EnterpriseDataPipeline } from '../../services/pipeline/EnterpriseDataPipeline.js';
import { logInfo, logError } from '../../services/observability/structuredLogger.js';

const router = express.Router();

// Initialize the data pipeline
const pipeline = new EnterpriseDataPipeline();

// Start the pipeline on server start
(async () => {
  try {
    await pipeline.startDataIngestion();
    logInfo('Enterprise Data Pipeline started successfully');
  } catch (error) {
    logError('Failed to start data pipeline', error);
  }
})();

// Configure multer for CSV uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB max file size
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'text/csv',
      'application/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV and Excel files are allowed.'));
    }
  }
});

/**
 * GET /api/data-pipeline/health
 * Check pipeline health status
 */
router.get('/health', async (req, res) => {
  try {
    const health = await pipeline.healthCheck();

    res.json({
      success: true,
      health
    });
  } catch (error) {
    logError('Health check failed', error);
    res.status(503).json({
      error: 'Service unavailable',
      message: error.message
    });
  }
});

/**
 * GET /api/data-pipeline/status
 * Get detailed pipeline status
 */
router.get('/status', requireAuth(), async (req, res) => {
  try {
    const status = {
      uptime: process.uptime(),
      metrics: pipeline.metrics,
      activeStreams: Array.from(pipeline.activeStreams.keys()),
      pollers: Array.from(pipeline.pollers.keys()),
      webhooks: Array.from(pipeline.webhookHandlers.keys())
    };

    // Get queue status
    const queueStatus = {};
    for (const [name, queue] of Object.entries(pipeline.queues)) {
      const counts = await queue.getJobCounts();
      queueStatus[name] = counts;
    }
    status.queues = queueStatus;

    res.json({
      success: true,
      status
    });
  } catch (error) {
    logError('Status check failed', error);
    res.status(500).json({
      error: 'Status check failed',
      message: error.message
    });
  }
});

/**
 * POST /api/data-pipeline/upload/csv
 * Upload and process CSV file
 */
router.post('/upload/csv', requireAuth(), upload.single('file'), async (req, res) => {
  try {
    const { type } = req.body;
    const userId = req.auth.userId;

    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded'
      });
    }

    if (!type) {
      return res.status(400).json({
        error: 'File type is required'
      });
    }

    logInfo('Processing CSV upload', {
      userId,
      type,
      fileName: req.file.originalname,
      fileSize: req.file.size
    });

    const result = await pipeline.processCSVUpload(
      req.file.path,
      type,
      userId
    );

    res.json({
      success: true,
      result
    });
  } catch (error) {
    logError('CSV upload processing failed', error);
    res.status(500).json({
      error: 'File processing failed',
      message: error.message
    });
  }
});

/**
 * POST /api/data-pipeline/webhook/:source
 * Receive webhook data from external sources
 */
router.post('/webhook/:source', async (req, res) => {
  try {
    const { source } = req.params;
    const data = req.body;

    // Verify webhook signature if provided
    const signature = req.headers['x-webhook-signature'];
    if (signature && !verifyWebhookSignature(source, signature, data)) {
      return res.status(401).json({
        error: 'Invalid webhook signature'
      });
    }

    logInfo(`Webhook received from ${source}`, {
      source,
      dataSize: JSON.stringify(data).length
    });

    const result = await pipeline.processWebhook(source, data);

    res.json({
      success: true,
      result
    });
  } catch (error) {
    logError(`Webhook processing failed for ${req.params.source}`, error);
    res.status(500).json({
      error: 'Webhook processing failed',
      message: error.message
    });
  }
});

/**
 * POST /api/data-pipeline/ingest
 * Manual data ingestion endpoint
 */
router.post('/ingest', requireAuth(), async (req, res) => {
  try {
    const { source, data, metadata } = req.body;
    const userId = req.auth.userId;

    if (!source || !data) {
      return res.status(400).json({
        error: 'Source and data are required'
      });
    }

    logInfo('Manual data ingestion', {
      userId,
      source,
      recordCount: Array.isArray(data) ? data.length : 1
    });

    // Add to ingestion queue
    const job = await pipeline.queues.ingestion.add({
      source,
      data,
      metadata: {
        ...metadata,
        userId,
        ingestedAt: new Date().toISOString(),
        manual: true
      }
    });

    res.json({
      success: true,
      jobId: job.id
    });
  } catch (error) {
    logError('Manual ingestion failed', error);
    res.status(500).json({
      error: 'Ingestion failed',
      message: error.message
    });
  }
});

/**
 * GET /api/data-pipeline/queue/:name
 * Get queue status
 */
router.get('/queue/:name', requireAuth(), async (req, res) => {
  try {
    const { name } = req.params;
    const queue = pipeline.queues[name];

    if (!queue) {
      return res.status(404).json({
        error: 'Queue not found'
      });
    }

    const [counts, jobs] = await Promise.all([
      queue.getJobCounts(),
      queue.getJobs(['waiting', 'active', 'completed', 'failed'], 0, 10)
    ]);

    res.json({
      success: true,
      queue: name,
      counts,
      recentJobs: jobs.map(job => ({
        id: job.id,
        status: job.opts.status,
        data: job.data,
        progress: job.progress(),
        createdAt: job.timestamp,
        processedAt: job.processedOn
      }))
    });
  } catch (error) {
    logError(`Queue status check failed for ${req.params.name}`, error);
    res.status(500).json({
      error: 'Queue status check failed',
      message: error.message
    });
  }
});

/**
 * POST /api/data-pipeline/retry/:queue/:jobId
 * Retry a failed job
 */
router.post('/retry/:queue/:jobId', requireAuth(), async (req, res) => {
  try {
    const { queue: queueName, jobId } = req.params;
    const queue = pipeline.queues[queueName];

    if (!queue) {
      return res.status(404).json({
        error: 'Queue not found'
      });
    }

    const job = await queue.getJob(jobId);

    if (!job) {
      return res.status(404).json({
        error: 'Job not found'
      });
    }

    await job.retry();

    res.json({
      success: true,
      message: 'Job retry initiated',
      jobId
    });
  } catch (error) {
    logError(`Job retry failed for ${req.params.jobId}`, error);
    res.status(500).json({
      error: 'Job retry failed',
      message: error.message
    });
  }
});

/**
 * DELETE /api/data-pipeline/queue/:name/:jobId
 * Remove a job from queue
 */
router.delete('/queue/:name/:jobId', requireAuth(), async (req, res) => {
  try {
    const { name, jobId } = req.params;
    const queue = pipeline.queues[name];

    if (!queue) {
      return res.status(404).json({
        error: 'Queue not found'
      });
    }

    const job = await queue.getJob(jobId);

    if (!job) {
      return res.status(404).json({
        error: 'Job not found'
      });
    }

    await job.remove();

    res.json({
      success: true,
      message: 'Job removed',
      jobId
    });
  } catch (error) {
    logError(`Job removal failed for ${req.params.jobId}`, error);
    res.status(500).json({
      error: 'Job removal failed',
      message: error.message
    });
  }
});

/**
 * POST /api/data-pipeline/pause/:queue
 * Pause a queue
 */
router.post('/pause/:queue', requireAuth(), async (req, res) => {
  try {
    const { queue: queueName } = req.params;
    const queue = pipeline.queues[queueName];

    if (!queue) {
      return res.status(404).json({
        error: 'Queue not found'
      });
    }

    await queue.pause();

    res.json({
      success: true,
      message: `Queue ${queueName} paused`
    });
  } catch (error) {
    logError(`Queue pause failed for ${req.params.queue}`, error);
    res.status(500).json({
      error: 'Queue pause failed',
      message: error.message
    });
  }
});

/**
 * POST /api/data-pipeline/resume/:queue
 * Resume a paused queue
 */
router.post('/resume/:queue', requireAuth(), async (req, res) => {
  try {
    const { queue: queueName } = req.params;
    const queue = pipeline.queues[queueName];

    if (!queue) {
      return res.status(404).json({
        error: 'Queue not found'
      });
    }

    await queue.resume();

    res.json({
      success: true,
      message: `Queue ${queueName} resumed`
    });
  } catch (error) {
    logError(`Queue resume failed for ${req.params.queue}`, error);
    res.status(500).json({
      error: 'Queue resume failed',
      message: error.message
    });
  }
});

/**
 * GET /api/data-pipeline/analytics/realtime
 * Get real-time analytics data
 */
router.get('/analytics/realtime', requireAuth(), async (req, res) => {
  try {
    // Set up Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

    // Listen for analytics events
    const analyticsHandler = (analytics) => {
      res.write(`data: ${JSON.stringify({
        type: 'analytics',
        data: analytics
      })}\n\n`);
    };

    pipeline.on('analytics', analyticsHandler);

    // Listen for alerts
    const alertHandler = (alert) => {
      res.write(`data: ${JSON.stringify({
        type: 'alert',
        data: alert
      })}\n\n`);
    };

    pipeline.on('alert', alertHandler);

    // Send heartbeat every 30 seconds
    const heartbeat = setInterval(() => {
      res.write(`data: ${JSON.stringify({ type: 'heartbeat' })}\n\n`);
    }, 30000);

    // Clean up on disconnect
    req.on('close', () => {
      pipeline.off('analytics', analyticsHandler);
      pipeline.off('alert', alertHandler);
      clearInterval(heartbeat);
    });
  } catch (error) {
    logError('Real-time analytics stream failed', error);
    res.status(500).json({
      error: 'Analytics stream failed',
      message: error.message
    });
  }
});

/**
 * GET /api/data-pipeline/metrics
 * Get pipeline metrics
 */
router.get('/metrics', requireAuth(), async (req, res) => {
  try {
    const metrics = {
      ...pipeline.metrics,
      timestamp: new Date().toISOString()
    };

    // Calculate additional metrics
    if (metrics.processingTime && metrics.processingTime.length > 0) {
      metrics.avgProcessingTime =
        metrics.processingTime.reduce((a, b) => a + b, 0) / metrics.processingTime.length;
    }

    if (metrics.dataQuality && metrics.dataQuality.length > 0) {
      metrics.avgDataQuality =
        metrics.dataQuality.reduce((a, b) => a + b.score, 0) / metrics.dataQuality.length;
    }

    res.json({
      success: true,
      metrics
    });
  } catch (error) {
    logError('Metrics fetch failed', error);
    res.status(500).json({
      error: 'Metrics fetch failed',
      message: error.message
    });
  }
});

/**
 * POST /api/data-pipeline/validate
 * Validate data against schema
 */
router.post('/validate', requireAuth(), async (req, res) => {
  try {
    const { source, data } = req.body;

    if (!source || !data) {
      return res.status(400).json({
        error: 'Source and data are required'
      });
    }

    const validation = await pipeline.validateData(source, data);

    res.json({
      success: true,
      validation
    });
  } catch (error) {
    logError('Data validation failed', error);
    res.status(500).json({
      error: 'Validation failed',
      message: error.message
    });
  }
});

/**
 * POST /api/data-pipeline/transform
 * Transform data to standard format
 */
router.post('/transform', requireAuth(), async (req, res) => {
  try {
    const { source, data } = req.body;

    if (!source || !data) {
      return res.status(400).json({
        error: 'Source and data are required'
      });
    }

    const transformed = await pipeline.transformData(source, data);

    res.json({
      success: true,
      transformed
    });
  } catch (error) {
    logError('Data transformation failed', error);
    res.status(500).json({
      error: 'Transformation failed',
      message: error.message
    });
  }
});

/**
 * POST /api/data-pipeline/enrich
 * Enrich data with calculated fields
 */
router.post('/enrich', requireAuth(), async (req, res) => {
  try {
    const { source, data } = req.body;

    if (!source || !data) {
      return res.status(400).json({
        error: 'Source and data are required'
      });
    }

    const enriched = await pipeline.enrichData(source, data);

    res.json({
      success: true,
      enriched
    });
  } catch (error) {
    logError('Data enrichment failed', error);
    res.status(500).json({
      error: 'Enrichment failed',
      message: error.message
    });
  }
});

// Helper function to verify webhook signatures
function verifyWebhookSignature(source, signature, data) {
  // Implementation would verify webhook signatures
  // This is a placeholder that should be implemented based on each source's requirements

  const secrets = {
    xero: process.env.XERO_WEBHOOK_SECRET,
    shopify: process.env.SHOPIFY_WEBHOOK_SECRET,
    unleashed: process.env.UNLEASHED_WEBHOOK_SECRET
  };

  const secret = secrets[source];
  if (!secret) {
    return true; // No secret configured, allow through
  }

  // Implement actual signature verification based on source
  // For example, for Shopify:
  // const hash = crypto.createHmac('sha256', secret).update(JSON.stringify(data)).digest('base64');
  // return hash === signature;

  return true; // Placeholder
}

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  logInfo('SIGTERM received, shutting down data pipeline');
  await pipeline.shutdown();
});

process.on('SIGINT', async () => {
  logInfo('SIGINT received, shutting down data pipeline');
  await pipeline.shutdown();
});

export default router;