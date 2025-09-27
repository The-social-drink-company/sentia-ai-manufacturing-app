import express from 'express';
import NodeCache from 'node-cache';
import { requireAuth, requireRole, requireManager } from '../middleware/clerkAuth.js';
import { rateLimiters } from '../middleware/rateLimiter.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { logDebug, logInfo, logWarn, logError } from '../../src/utils/logger';
import productionService from '../../services/production/productionService.js';

import {
  productionMetricsSchema,
  productionScheduleSchema,
  productionLineSchema,
  batchProductionSchema
} from '../validators/production.js';

const router = express.Router();

// Initialize cache with 60 second TTL
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

/**
 * GET /api/production/metrics
 * Get production metrics with filters
 */
router.get('/metrics',
  requireAuth,
  rateLimiters.read,
  asyncHandler(async (req, res) => {
    const { timeRange = '24h', line = 'all', shift = 'current' } = req.query;

    // Generate cache key based on query params
    const cacheKey = `production-metrics-${timeRange}-${line}-${shift}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      logDebug('[Cache Hit] Production metrics');
      return res.json(cached);
    }

    logDebug('[Cache Miss] Production metrics - fetching from service');

    // Get metrics from production service
    const metrics = await productionService.getProductionMetrics(timeRange);

    const result = {
      success: true,
      data: metrics
    };

    // Cache the result
    cache.set(cacheKey, result);

    logInfo('Production metrics fetched', {
      timeRange,
      totalJobs: metrics.summary?.totalJobs,
      oee: metrics.oee?.overall
    });

    res.json(result);
  })
);

/**
 * POST /api/production/metrics
 * Create new production metric entry
 */
router.post('/metrics',
  requireAuth,
  requireRole(['admin', 'manager', 'operator']),
  rateLimiters.write,
  asyncHandler(async (req, res) => {
    // Validate request body
    const data = productionMetricsSchema.create.parse(req.body);

    // Create metric
    const metric = await prisma.productionMetrics.create({
      data: {
        ...data,
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
        createdBy: req.userId
      },
      include: {
        line: true,
        product: true
      }
    });

    res.status(201).json({
      success: true,
      data: metric
    });
  })
);

/**
 * GET /api/production/schedule
 * Get production schedule
 */
router.get('/schedule',
  requireAuth,
  rateLimiters.read,
  asyncHandler(async (req, res) => {
    const { daysAhead = 30 } = req.query;

    const cacheKey = `production-schedule-${daysAhead}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      logDebug('[Cache Hit] Production schedule');
      return res.json(cached);
    }

    // Get schedule from production service
    const schedule = await productionService.getProductionSchedule(parseInt(daysAhead));

    const result = {
      success: true,
      data: schedule
    };

    // Cache the result
    cache.set(cacheKey, result);

    logInfo('Production schedule fetched', {
      daysAhead,
      totalJobs: schedule.totalJobs
    });

    res.json(result);
  })
);

/**
 * POST /api/production/schedule
 * Create new production schedule entry
 */
router.post('/schedule',
  requireAuth,
  requireRole(['admin', 'manager']),
  rateLimiters.write,
  asyncHandler(async (req, res) => {
    // Validate request body
    const data = productionScheduleSchema.create.parse(req.body);

    // Check for conflicts
    const conflicts = await prisma.productionSchedule.findMany({
      where: {
        lineId: data.lineId,
        scheduledDate: new Date(data.scheduledDate),
        OR: [
          {
            AND: [
              { startTime: { lte: data.startTime } },
              { endTime: { gt: data.startTime } }
            ]
          },
          {
            AND: [
              { startTime: { lt: data.endTime } },
              { endTime: { gte: data.endTime } }
            ]
          }
        ]
      }
    });

    if (conflicts.length > 0) {
      throw new AppError('Schedule conflict detected', 409, { conflicts });
    }

    // Create schedule entry
    const schedule = await prisma.productionSchedule.create({
      data: {
        ...data,
        scheduledDate: new Date(data.scheduledDate),
        createdBy: req.userId
      },
      include: {
        product: true,
        line: true
      }
    });

    res.status(201).json({
      success: true,
      data: schedule
    });
  })
);

/**
 * PUT /api/production/schedule/:id
 * Update production schedule entry
 */
router.put('/schedule/:id',
  requireAuth,
  requireRole(['admin', 'manager']),
  rateLimiters.write,
  asyncHandler(async (req, res) => {
    // Validate request body
    const data = productionScheduleSchema.update.parse(req.body);
    const { id } = req.params;

    // Update schedule entry
    const schedule = await prisma.productionSchedule.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      },
      include: {
        product: true,
        line: true
      }
    });

    res.json({
      success: true,
      data: schedule
    });
  })
);

/**
 * GET /api/production/lines
 * Get all production lines
 */
router.get('/lines',
  requireAuth,
  rateLimiters.read,
  asyncHandler(async (req, res) => {
    const lines = await prisma.productionLine.findMany({
      include: {
        _count: {
          select: {
            schedules: true,
            metrics: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: lines
    });
  })
);

/**
 * POST /api/production/lines
 * Create new production line
 */
router.post('/lines',
  requireAuth,
  requireRole(['admin']),
  rateLimiters.write,
  asyncHandler(async (req, res) => {
    // Validate request body
    const data = productionLineSchema.create.parse(req.body);

    // Check if line code already exists
    const existing = await prisma.productionLine.findUnique({
      where: { code: data.code }
    });

    if (existing) {
      throw new AppError('Production line code already exists', 409);
    }

    // Create production line
    const line = await prisma.productionLine.create({
      data: {
        ...data,
        createdBy: req.userId
      }
    });

    res.status(201).json({
      success: true,
      data: line
    });
  })
);

/**
 * GET /api/production/efficiency
 * Get efficiency analytics
 */
router.get('/efficiency',
  requireAuth,
  rateLimiters.read,
  asyncHandler(async (req, res) => {
    const { period = '7d' } = req.query;

    // Calculate date range
    const periodMap = {
      '1d': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90
    };
    const days = periodMap[period] || 7;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get efficiency data grouped by day
    const efficiencyData = await prisma.$queryRaw`
      SELECT
        DATE(timestamp) as date,
        AVG(efficiency) as avg_efficiency,
        AVG(quality) as avg_quality,
        AVG(oee) as avg_oee,
        SUM(units_produced) as total_units,
        SUM(downtime) as total_downtime
      FROM production_metrics
      WHERE timestamp >= ${startDate}
      GROUP BY DATE(timestamp)
      ORDER BY date ASC
    `;

    res.json({
      success: true,
      data: {
        period,
        startDate,
        metrics: efficiencyData
      }
    });
  })
);

/**
 * POST /api/production/batch
 * Create batch production entry
 */
router.post('/batch',
  requireAuth,
  requireRole(['admin', 'manager', 'operator']),
  rateLimiters.write,
  asyncHandler(async (req, res) => {
    // Validate request body
    const data = batchProductionSchema.create.parse(req.body);

    // Check if batch number already exists
    const existing = await prisma.batchProduction.findUnique({
      where: { batchNumber: data.batchNumber }
    });

    if (existing) {
      throw new AppError('Batch number already exists', 409);
    }

    // Create batch entry
    const batch = await prisma.batchProduction.create({
      data: {
        ...data,
        startTime: new Date(data.startTime),
        endTime: data.endTime ? new Date(data.endTime) : null,
        createdBy: req.userId
      },
      include: {
        product: true,
        line: true
      }
    });

    res.status(201).json({
      success: true,
      data: batch
    });
  })
);

/**
 * GET /api/production/downtime
 * Get downtime analysis
 */
router.get('/downtime',
  requireAuth,
  rateLimiters.read,
  asyncHandler(async (req, res) => {
    const { lineId, startDate, endDate } = req.query;

    // Build where clause
    const where = {};
    if (lineId) where.lineId = lineId;
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    } else {
      // Default to last 30 days
      where.timestamp = {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      };
    }

    // Get downtime data
    const downtimeData = await prisma.productionMetrics.groupBy({
      by: ['lineId'],
      where,
      _sum: {
        downtime: true
      },
      _count: true
    });

    // Get line details
    const lineIds = downtimeData.map(d => d.lineId);
    const lines = await prisma.productionLine.findMany({
      where: { id: { in: lineIds } }
    });

    // Combine data
    const result = downtimeData.map(d => {
      const line = lines.find(l => l.id === d.lineId);
      return {
        line,
        totalDowntime: d._sum.downtime,
        incidents: d._count
      };
    });

    res.json({
      success: true,
      data: result
    });
  })
);

/**
 * GET /api/production/machines
 * Get machine metrics and status
 */
router.get('/machines',
  requireAuth,
  rateLimiters.read,
  asyncHandler(async (req, res) => {
    const cacheKey = 'production-machines';
    const cached = cache.get(cacheKey);

    if (cached) {
      logDebug('[Cache Hit] Machine metrics');
      return res.json(cached);
    }

    // Get machine metrics from production service
    const machineMetrics = await productionService.getMachineMetrics();

    const result = {
      success: true,
      data: machineMetrics
    };

    // Cache the result
    cache.set(cacheKey, result, 30); // 30 second cache for machine data

    logInfo('Machine metrics fetched', {
      totalMachines: machineMetrics.summary?.totalMachines,
      activeMachines: machineMetrics.summary?.activeMachines
    });

    res.json(result);
  })
);

/**
 * POST /api/production/jobs
 * Create new production job
 */
router.post('/jobs',
  requireAuth,
  requireRole(['admin', 'manager']),
  rateLimiters.write,
  asyncHandler(async (req, res) => {
    const jobData = req.body;

    // Create job using production service
    const job = await productionService.createProductionJob({
      ...jobData,
      createdBy: req.userId
    });

    logInfo('Production job created', {
      jobNumber: job.jobNumber,
      productName: job.productName,
      quantity: job.quantity
    });

    res.status(201).json({
      success: true,
      data: job
    });
  })
);

/**
 * PUT /api/production/jobs/:id
 * Update production job
 */
router.put('/jobs/:id',
  requireAuth,
  requireRole(['admin', 'manager', 'operator']),
  rateLimiters.write,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    // Update job using production service
    const job = await productionService.updateProductionJob(id, {
      ...updateData,
      updatedBy: req.userId
    });

    logInfo('Production job updated', {
      jobId: id,
      status: job.status
    });

    res.json({
      success: true,
      data: job
    });
  })
);

/**
 * GET /api/production/quality
 * Get quality metrics for production
 */
router.get('/quality',
  requireAuth,
  rateLimiters.read,
  asyncHandler(async (req, res) => {
    const { timeRange = '7d' } = req.query;

    const cacheKey = `production-quality-${timeRange}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      logDebug('[Cache Hit] Production quality metrics');
      return res.json(cached);
    }

    // Import quality service
    const qualityService = (await import('../../services/quality/qualityService.js')).default;

    // Get quality metrics
    const qualityMetrics = await qualityService.getQualityMetrics(timeRange);

    const result = {
      success: true,
      data: qualityMetrics
    };

    // Cache the result
    cache.set(cacheKey, result);

    logInfo('Production quality metrics fetched', {
      timeRange,
      firstPassYield: qualityMetrics.summary?.firstPassYield
    });

    res.json(result);
  })
);

/**
 * GET /api/production/export
 * Export production data
 */
router.get('/export',
  requireAuth,
  requireRole(['admin', 'manager']),
  rateLimiters.read,
  asyncHandler(async (req, res) => {
    const { format = 'json', timeRange = '30d' } = req.query;

    // Export data using production service
    const exportData = await productionService.exportProductionData(format, timeRange);

    logInfo('Production data exported', {
      format,
      timeRange,
      recordCount: exportData.productions?.length || 0
    });

    // Set appropriate headers for download
    const filename = `production-data-${new Date().toISOString().split('T')[0]}.${format}`;

    switch (format) {
      case 'csv':
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        // Convert to CSV (simplified)
        const csvData = exportData.productions.map(p =>
          `${p.jobNumber},${p.productName},${p.status},${p.completedQuantity},${p.efficiency}`
        ).join('\n');
        res.send(`Job Number,Product Name,Status,Completed Quantity,Efficiency\n${csvData}`);
        break;
      default:
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.json({
          success: true,
          data: exportData
        });
    }
  })
);

export default router;

