import express from 'express';
import NodeCache from 'node-cache';
import prisma from '../../lib/prisma.js';
import { requireAuth, requireRole, requireManager } from '../middleware/clerkAuth.js';
import { rateLimiters } from '../middleware/rateLimiter.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
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
    // Validate query parameters
    const query = productionMetricsSchema.query.parse(req.query);

    // Generate cache key based on query params
    const cacheKey = `production-metrics-${JSON.stringify(query)}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      console.log('[Cache Hit] Production metrics');
      return res.json(cached);
    }

    console.log('[Cache Miss] Production metrics - fetching from database');

    // Build where clause
    const where = {};
    if (query.startDate || query.endDate) {
      where.timestamp = {};
      if (query.startDate) where.timestamp.gte = new Date(query.startDate);
      if (query.endDate) where.timestamp.lte = new Date(query.endDate);
    }
    if (query.lineId) where.lineId = query.lineId;
    if (query.productId) where.productId = query.productId;

    // Fetch metrics with optimized fields
    const metrics = await prisma.productionMetrics.findMany({
      where,
      take: Math.min(query.limit 0, 100), // Limit max results to 100
      skip: query.offset,
      orderBy: { timestamp: 'desc' },
      select: {
        id: true,
        timestamp: true,
        lineId: true,
        productId: true,
        unitsProduced: true,
        efficiency: true,
        quality: true,
        oee: true,
        downtime: true,
        line: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            sku: true
          }
        }
      }
    });

    // Calculate aggregates
    const aggregates = await prisma.productionMetrics.aggregate({
      where,
      _avg: {
        efficiency: true,
        quality: true,
        oee: true
      },
      _sum: {
        unitsProduced: true,
        downtime: true
      }
    });

    const result = {
      success: true,
      data: {
        metrics,
        aggregates,
        pagination: {
          limit: query.limit,
          offset: query.offset,
          total: await prisma.productionMetrics.count({ where })
        }
      }
    };

    // Cache the result
    cache.set(cacheKey, result);

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
    // Validate query parameters
    const query = productionScheduleSchema.query.parse(req.query);

    // Build where clause
    const where = {};
    if (query.date) {
      const date = new Date(query.date);
      where.scheduledDate = {
        gte: new Date(date.setHours(0, 0, 0, 0)),
        lt: new Date(date.setHours(23, 59, 59, 999))
      };
    } else if (query.startDate || query.endDate) {
      where.scheduledDate = {};
      if (query.startDate) where.scheduledDate.gte = new Date(query.startDate);
      if (query.endDate) where.scheduledDate.lte = new Date(query.endDate);
    } else {
      // Default to next 7 days
      where.scheduledDate = {
        gte: new Date(),
        lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      };
    }
    if (query.lineId) where.lineId = query.lineId;
    if (query.status) where.status = query.status;

    // Fetch schedule
    const schedule = await prisma.productionSchedule.findMany({
      where,
      orderBy: [
        { scheduledDate: 'asc' },
        { priority: 'desc' }
      ],
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

export default router;