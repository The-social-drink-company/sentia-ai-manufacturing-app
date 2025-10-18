/**
 * Export API Routes
 *
 * Handles data export in multiple formats (CSV, Excel, PDF, JSON)
 *
 * @module routes/export
 */

const express = require('express');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { addExportJob, getExportJobStatus, cancelExportJob, retryExportJob } = require('../queues/exportQueue');
const { listExports, getExportMetadata, deleteExport } = require('../services/import/ExportGenerator');
const { logAudit } = require('../services/audit/AuditLogger');
const { EXPORT_ACTIONS, STATUS } = require('../services/audit/AuditCategories');

const router = express.Router();
const prisma = new PrismaClient();

// ============================================================================
// Routes
// ============================================================================

/**
 * POST /api/export/start
 * Start export job
 */
router.post('/start', async (req, res) => {
  try {
    const { dataType, format, filters, options } = req.body;
    const userId = req.user?.id || 'ANONYMOUS';

    if (!dataType || !format) {
      return res.status(400).json({ error: 'Data type and format are required' });
    }

    // Validate format
    const allowedFormats = ['csv', 'xlsx', 'pdf', 'json'];
    if (!allowedFormats.includes(format.toLowerCase())) {
      return res.status(400).json({
        error: `Invalid format. Allowed formats: ${allowedFormats.join(', ')}`,
      });
    }

    // Create ExportJob record
    const exportJob = await prisma.exportJob.create({
      data: {
        dataType,
        format: format.toUpperCase(),
        filters: filters || {},
        options: options || {},
        status: 'PENDING',
        userId,
      },
    });

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${dataType.toLowerCase()}-export-${timestamp}.${format}`;

    // Add to queue
    await addExportJob(
      exportJob.id,
      userId,
      dataType,
      format,
      filters || {},
      { ...options, filename }
    );

    res.json({
      success: true,
      exportJob: {
        id: exportJob.id,
        status: exportJob.status,
        dataType: exportJob.dataType,
        format: exportJob.format,
        createdAt: exportJob.createdAt,
      },
    });

  } catch (error) {
    console.error('Start export error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/export/status/:jobId
 * Get export job status
 */
router.get('/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;

    // Get database record
    const exportJob = await prisma.exportJob.findUnique({
      where: { id: jobId },
    });

    if (!exportJob) {
      return res.status(404).json({ error: 'Export job not found' });
    }

    // Get queue status
    const queueStatus = await getExportJobStatus(jobId);

    res.json({
      success: true,
      exportJob: {
        id: exportJob.id,
        status: exportJob.status,
        dataType: exportJob.dataType,
        format: exportJob.format,
        rowCount: exportJob.rowCount,
        fileSize: exportJob.fileSize,
        filePath: exportJob.filePath,
        errors: exportJob.errors,
        startedAt: exportJob.startedAt,
        completedAt: exportJob.completedAt,
      },
      queueStatus,
    });

  } catch (error) {
    console.error('Get export status error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/export/download/:jobId
 * Download export file
 */
router.get('/download/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user?.id || 'ANONYMOUS';

    // Get export job
    const exportJob = await prisma.exportJob.findUnique({
      where: { id: jobId },
    });

    if (!exportJob) {
      return res.status(404).json({ error: 'Export job not found' });
    }

    if (exportJob.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Export is not completed yet' });
    }

    if (!exportJob.filePath) {
      return res.status(404).json({ error: 'Export file not found' });
    }

    // Log audit trail
    await logAudit({
      userId,
      action: EXPORT_ACTIONS.EXPORT_DOWNLOADED,
      category: 'EXPORT',
      resourceType: 'EXPORT_JOB',
      resourceId: jobId,
      status: STATUS.SUCCESS,
      metadata: {
        dataType: exportJob.dataType,
        format: exportJob.format,
        fileSize: exportJob.fileSize,
      },
    });

    // Send file
    res.download(exportJob.filePath, path.basename(exportJob.filePath), (err) => {
      if (err) {
        console.error('Download error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to download file' });
        }
      }
    });

  } catch (error) {
    console.error('Download export error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/export/cancel/:jobId
 * Cancel export job
 */
router.post('/cancel/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user?.id || 'ANONYMOUS';

    await cancelExportJob(jobId, userId);

    res.json({
      success: true,
      message: 'Export job cancelled',
    });

  } catch (error) {
    console.error('Cancel export error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/export/retry/:jobId
 * Retry failed export job
 */
router.post('/retry/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user?.id || 'ANONYMOUS';

    await retryExportJob(jobId, userId);

    res.json({
      success: true,
      message: 'Export job retried',
    });

  } catch (error) {
    console.error('Retry export error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/export/:jobId
 * Delete export job and file
 */
router.delete('/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user?.id || 'ANONYMOUS';

    // Get export job
    const exportJob = await prisma.exportJob.findUnique({
      where: { id: jobId },
    });

    if (!exportJob) {
      return res.status(404).json({ error: 'Export job not found' });
    }

    // Delete file if exists
    if (exportJob.filePath) {
      const filename = path.basename(exportJob.filePath);
      await deleteExport(filename);
    }

    // Delete database record
    await prisma.exportJob.delete({
      where: { id: jobId },
    });

    // Log audit trail
    await logAudit({
      userId,
      action: EXPORT_ACTIONS.EXPORT_DELETED,
      category: 'EXPORT',
      resourceType: 'EXPORT_JOB',
      resourceId: jobId,
      status: STATUS.SUCCESS,
    });

    res.json({
      success: true,
      message: 'Export deleted',
    });

  } catch (error) {
    console.error('Delete export error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/export/jobs
 * List export jobs
 */
router.get('/jobs', async (req, res) => {
  try {
    const { status, dataType, format, limit = 50, offset = 0 } = req.query;
    const userId = req.user?.id;

    const where = {};
    if (status) where.status = status;
    if (dataType) where.dataType = dataType;
    if (format) where.format = format.toUpperCase();
    if (userId && req.user?.role !== 'ADMIN') where.userId = userId;

    const [jobs, totalCount] = await Promise.all([
      prisma.exportJob.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset),
      }),
      prisma.exportJob.count({ where }),
    ]);

    res.json({
      success: true,
      jobs: jobs.map((job) => ({
        id: job.id,
        status: job.status,
        dataType: job.dataType,
        format: job.format,
        rowCount: job.rowCount,
        fileSize: job.fileSize,
        createdAt: job.createdAt,
        completedAt: job.completedAt,
      })),
      totalCount,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

  } catch (error) {
    console.error('List export jobs error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/export/files
 * List export files
 */
router.get('/files', async (req, res) => {
  try {
    const { format, sortBy = 'date' } = req.query;

    const result = await listExports({
      format,
      sortBy,
    });

    res.json({
      success: true,
      ...result,
    });

  } catch (error) {
    console.error('List export files error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/export/file/:filename
 * Get export file metadata
 */
router.get('/file/:filename', async (req, res) => {
  try {
    const { filename } = req.params;

    const metadata = await getExportMetadata(filename);

    if (!metadata.exists) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json({
      success: true,
      file: metadata,
    });

  } catch (error) {
    console.error('Get export metadata error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/export/templates
 * Get available export templates
 */
router.get('/templates', async (req, res) => {
  try {
    const templates = [
      {
        id: 'products',
        name: 'Products Export',
        dataType: 'PRODUCTS',
        description: 'Export all products with SKU, name, price, and inventory',
        formats: ['csv', 'xlsx', 'pdf', 'json'],
        filters: {
          status: ['ACTIVE', 'INACTIVE'],
          category: 'string',
        },
      },
      {
        id: 'inventory',
        name: 'Inventory Export',
        dataType: 'INVENTORY',
        description: 'Export inventory levels across all locations',
        formats: ['csv', 'xlsx', 'json'],
        filters: {
          location: 'string',
          lowStock: 'boolean',
        },
      },
      {
        id: 'orders',
        name: 'Orders Export',
        dataType: 'ORDERS',
        description: 'Export orders with customer and line item details',
        formats: ['csv', 'xlsx', 'pdf', 'json'],
        filters: {
          status: ['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'],
          startDate: 'date',
          endDate: 'date',
        },
      },
      {
        id: 'forecasts',
        name: 'Forecasts Export',
        dataType: 'FORECASTS',
        description: 'Export demand forecasts with confidence intervals',
        formats: ['csv', 'xlsx', 'json'],
        filters: {
          model: ['ARIMA', 'PROPHET', 'LSTM'],
          startDate: 'date',
          endDate: 'date',
        },
      },
      {
        id: 'audit-logs',
        name: 'Audit Logs Export',
        dataType: 'AUDIT_LOGS',
        description: 'Export audit trail for compliance reporting',
        formats: ['csv', 'xlsx', 'json'],
        filters: {
          category: 'string',
          severity: ['INFO', 'WARNING', 'ERROR', 'CRITICAL'],
          startDate: 'date',
          endDate: 'date',
        },
      },
    ];

    res.json({
      success: true,
      templates,
    });

  } catch (error) {
    console.error('Get export templates error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// Export Router
// ============================================================================

module.exports = router;
