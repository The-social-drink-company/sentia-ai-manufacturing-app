import express from 'express';
import prisma from '../../lib/prisma.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { rateLimiters } from '../middleware/rateLimiter.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';

const router = express.Router();

// Quality validation schemas
const qualitySchemas = {
  inspection: {
    create: z.object({
      batchId: z.string().min(1),
      productId: z.string().min(1),
      inspectorId: z.string().optional(),
      type: z.enum(['incoming', 'in-process', 'final', 'random']),
      sampleSize: z.number().min(1),
      criteria: z.array(z.object({
        parameter: z.string(),
        specification: z.string(),
        actualValue: z.string(),
        passed: z.boolean()
      })).min(1),
      overallResult: z.enum(['pass', 'fail', 'conditional']),
      notes: z.string().optional(),
      correctionActions: z.string().optional()
    }),
    query: z.object({
      batchId: z.string().optional(),
      productId: z.string().optional(),
      type: z.enum(['incoming', 'in-process', 'final', 'random']).optional(),
      result: z.enum(['pass', 'fail', 'conditional']).optional(),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
      limit: z.coerce.number().min(1).max(100).default(50),
      offset: z.coerce.number().min(0).default(0)
    })
  },
  defect: {
    create: z.object({
      productId: z.string().min(1),
      batchId: z.string().optional(),
      lineId: z.string().optional(),
      category: z.enum(['critical', 'major', 'minor', 'cosmetic']),
      type: z.string().min(1),
      description: z.string().min(1),
      quantity: z.number().min(1),
      rootCause: z.string().optional(),
      correctiveAction: z.string().optional(),
      preventiveAction: z.string().optional(),
      status: z.enum(['open', 'investigating', 'resolved', 'closed']).default('open')
    })
  },
  metrics: {
    query: z.object({
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
      productId: z.string().optional(),
      lineId: z.string().optional(),
      groupBy: z.enum(['day', 'week', 'month']).default('day')
    })
  },
  spc: {
    calculate: z.object({
      productId: z.string().min(1),
      parameter: z.string().min(1),
      period: z.enum(['shift', 'day', 'week', 'month']).default('day'),
      samples: z.number().min(20).max(1000).default(100)
    })
  }
};

/**
 * GET /api/quality/inspections
 * Get quality inspections with filters
 */
router.get('/inspections',
  authenticate,
  rateLimiters.read,
  asyncHandler(async (req, res) => {
    const query = qualitySchemas.inspection.query.parse(req.query);

    // Build where clause
    const where = {};
    if (query.batchId) where.batchId = query.batchId;
    if (query.productId) where.productId = query.productId;
    if (query.type) where.type = query.type;
    if (query.result) where.overallResult = query.result;
    if (query.startDate || query.endDate) {
      where.inspectionDate = {};
      if (query.startDate) where.inspectionDate.gte = new Date(query.startDate);
      if (query.endDate) where.inspectionDate.lte = new Date(query.endDate);
    }

    // Fetch inspections
    const [inspections, total] = await Promise.all([
      prisma.qualityInspection.findMany({
        where,
        take: query.limit,
        skip: query.offset,
        orderBy: { inspectionDate: 'desc' },
        include: {
          product: true,
          batch: true,
          inspector: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.qualityInspection.count({ where })
    ]);

    // Calculate pass rate
    const passCount = inspections.filter(i => i.overallResult === 'pass').length;
    const passRate = inspections.length > 0 ? (passCount / inspections.length) * 100 : 0;

    res.json({
      success: true,
      data: {
        inspections,
        summary: {
          total,
          passed: passCount,
          failed: inspections.filter(i => i.overallResult === 'fail').length,
          conditional: inspections.filter(i => i.overallResult === 'conditional').length,
          passRate
        },
        pagination: {
          limit: query.limit,
          offset: query.offset,
          total
        }
      }
    });
  })
);

/**
 * POST /api/quality/inspections
 * Create new quality inspection
 */
router.post('/inspections',
  authenticate,
  requireRole(['admin', 'manager', 'quality']),
  rateLimiters.write,
  asyncHandler(async (req, res) => {
    const data = qualitySchemas.inspection.create.parse(req.body);

    // Create inspection
    const inspection = await prisma.qualityInspection.create({
      data: {
        ...data,
        inspectorId: data.inspectorId || req.userId,
        inspectionDate: new Date(),
        criteria: JSON.stringify(data.criteria),
        createdBy: req.userId
      },
      include: {
        product: true,
        batch: true,
        inspector: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Update batch quality status if applicable
    if (data.batchId) {
      await prisma.batchProduction.update({
        where: { id: data.batchId },
        data: {
          qualityCheckPassed: data.overallResult === 'pass',
          qualityCheckDate: new Date()
        }
      });
    }

    // Create defect record if inspection failed
    if (data.overallResult === 'fail' && data.correctionActions) {
      await prisma.qualityDefect.create({
        data: {
          productId: data.productId,
          batchId: data.batchId,
          category: 'major',
          type: 'Inspection Failure',
          description: `Quality inspection failed: ${data.notes || 'See inspection details'}`,
          quantity: 1,
          correctiveAction: data.correctionActions,
          inspectionId: inspection.id,
          createdBy: req.userId
        }
      });
    }

    res.status(201).json({
      success: true,
      data: inspection
    });
  })
);

/**
 * GET /api/quality/defects
 * Get quality defects
 */
router.get('/defects',
  authenticate,
  rateLimiters.read,
  asyncHandler(async (req, res) => {
    const { productId, category, status, startDate, endDate, limit = 50, offset = 0 } = req.query;

    // Build where clause
    const where = {};
    if (productId) where.productId = productId;
    if (category) where.category = category;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Fetch defects
    const [defects, total] = await Promise.all([
      prisma.qualityDefect.findMany({
        where,
        take: parseInt(limit),
        skip: parseInt(offset),
        orderBy: { createdAt: 'desc' },
        include: {
          product: true,
          batch: true,
          line: true
        }
      }),
      prisma.qualityDefect.count({ where })
    ]);

    // Group defects by category
    const byCategory = await prisma.qualityDefect.groupBy({
      by: ['category'],
      where,
      _count: true,
      _sum: {
        quantity: true
      }
    });

    res.json({
      success: true,
      data: {
        defects,
        summary: {
          total,
          open: defects.filter(d => d.status === 'open').length,
          resolved: defects.filter(d => d.status === 'resolved').length,
          byCategory: byCategory.map(cat => ({
            category: cat.category,
            count: cat._count,
            totalQuantity: cat._sum.quantity || 0
          }))
        },
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total
        }
      }
    });
  })
);

/**
 * POST /api/quality/defects
 * Record new quality defect
 */
router.post('/defects',
  authenticate,
  requireRole(['admin', 'manager', 'quality', 'operator']),
  rateLimiters.write,
  asyncHandler(async (req, res) => {
    const data = qualitySchemas.defect.create.parse(req.body);

    // Create defect record
    const defect = await prisma.qualityDefect.create({
      data: {
        ...data,
        createdBy: req.userId
      },
      include: {
        product: true,
        batch: true,
        line: true
      }
    });

    // Update quality metrics
    await updateQualityMetrics(data.productId, data.lineId);

    res.status(201).json({
      success: true,
      data: defect
    });
  })
);

/**
 * PUT /api/quality/defects/:id
 * Update defect status
 */
router.put('/defects/:id',
  authenticate,
  requireRole(['admin', 'manager', 'quality']),
  rateLimiters.write,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, rootCause, correctiveAction, preventiveAction } = req.body;

    // Update defect
    const defect = await prisma.qualityDefect.update({
      where: { id },
      data: {
        status,
        rootCause,
        correctiveAction,
        preventiveAction,
        resolvedAt: status === 'resolved' ? new Date() : null,
        closedAt: status === 'closed' ? new Date() : null,
        updatedAt: new Date()
      },
      include: {
        product: true,
        batch: true,
        line: true
      }
    });

    res.json({
      success: true,
      data: defect
    });
  })
);

/**
 * GET /api/quality/metrics
 * Get quality metrics and KPIs
 */
router.get('/metrics',
  authenticate,
  rateLimiters.read,
  asyncHandler(async (req, res) => {
    const query = qualitySchemas.metrics.query.parse(req.query);

    // Build date range
    const where = {};
    if (query.productId) where.productId = query.productId;
    if (query.lineId) where.lineId = query.lineId;
    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) where.date.gte = new Date(query.startDate);
      if (query.endDate) where.date.lte = new Date(query.endDate);
    } else {
      // Default to last 30 days
      where.date = {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      };
    }

    // Fetch quality metrics
    const metrics = await prisma.qualityMetrics.findMany({
      where,
      orderBy: { date: 'asc' }
    });

    // Calculate aggregated KPIs
    const totalProduced = metrics.reduce((sum, m) => sum + m.totalProduced, 0);
    const totalDefects = metrics.reduce((sum, m) => sum + m.defects, 0);
    const totalRework = metrics.reduce((sum, m) => sum + m.rework, 0);
    const totalScrap = metrics.reduce((sum, m) => sum + m.scrap, 0);

    // Calculate rates
    const defectRate = totalProduced > 0 ? (totalDefects / totalProduced) * 1000000 : 0; // DPPM
    const firstPassYield = totalProduced > 0 ? 
      ((totalProduced - totalRework - totalScrap) / totalProduced) * 100 : 0;
    const scrapRate = totalProduced > 0 ? (totalScrap / totalProduced) * 100 : 0;
    const reworkRate = totalProduced > 0 ? (totalRework / totalProduced) * 100 : 0;

    // Group metrics by period
    const groupedMetrics = groupMetricsByPeriod(metrics, query.groupBy);

    res.json({
      success: true,
      data: {
        kpis: {
          defectRate,
          firstPassYield,
          scrapRate,
          reworkRate,
          totalProduced,
          totalDefects,
          totalRework,
          totalScrap
        },
        trends: groupedMetrics,
        period: {
          startDate: where.date?.gte,
          endDate: where.date?.lte || new Date(),
          groupBy: query.groupBy
        }
      }
    });
  })
);

/**
 * POST /api/quality/spc/calculate
 * Calculate Statistical Process Control metrics
 */
router.post('/spc/calculate',
  authenticate,
  requireRole(['admin', 'manager', 'quality']),
  rateLimiters.expensive,
  asyncHandler(async (req, res) => {
    const data = qualitySchemas.spc.calculate.parse(req.body);

    // Fetch measurement data
    const measurements = await prisma.qualityMeasurement.findMany({
      where: {
        productId: data.productId,
        parameter: data.parameter
      },
      take: data.samples,
      orderBy: { measuredAt: 'desc' }
    });

    if (measurements.length < 20) {
      throw new AppError('Insufficient data for SPC calculation', 400, {
        required: 20,
        available: measurements.length
      });
    }

    // Extract values
    const values = measurements.map(m => m.value);
    
    // Calculate statistics
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1);
    const stdDev = Math.sqrt(variance);
    
    // Calculate control limits (3-sigma)
    const ucl = mean + (3 * stdDev);
    const lcl = mean - (3 * stdDev);
    const uwl = mean + (2 * stdDev);
    const lwl = mean - (2 * stdDev);
    
    // Check for out-of-control points
    const outOfControl = values.filter(val => val > ucl || val < lcl);
    const warning = values.filter(val => (val > uwl && val <= ucl) || (val < lwl && val >= lcl));
    
    // Calculate process capability
    const specLimits = await prisma.qualitySpecification.findFirst({
      where: {
        productId: data.productId,
        parameter: data.parameter
      }
    });
    
    let cp, cpk;
    if (specLimits) {
      const usl = specLimits.upperLimit;
      const lsl = specLimits.lowerLimit;
      cp = (usl - lsl) / (6 * stdDev);
      const cpu = (usl - mean) / (3 * stdDev);
      const cpl = (mean - lsl) / (3 * stdDev);
      cpk = Math.min(cpu, cpl);
    }

    res.json({
      success: true,
      data: {
        statistics: {
          mean,
          stdDev,
          variance,
          min: Math.min(...values),
          max: Math.max(...values),
          range: Math.max(...values) - Math.min(...values),
          samples: values.length
        },
        controlLimits: {
          ucl,
          lcl,
          uwl,
          lwl,
          centerLine: mean
        },
        processCapability: {
          cp: cp || null,
          cpk: cpk || null,
          interpretation: cpk ? 
            (cpk >= 1.33 ? 'Capable' : cpk >= 1.0 ? 'Marginally Capable' : 'Not Capable') :
            'No specification limits'
        },
        analysis: {
          inControl: outOfControl.length === 0,
          outOfControlPoints: outOfControl.length,
          warningPoints: warning.length,
          trend: detectTrend(values),
          pattern: detectPattern(values)
        },
        data: measurements.map(m => ({
          date: m.measuredAt,
          value: m.value,
          status: m.value > ucl || m.value < lcl ? 'out-of-control' :
                 m.value > uwl || m.value < lwl ? 'warning' : 'normal'
        }))
      }
    });
  })
);

/**
 * GET /api/quality/certifications
 * Get quality certifications and compliance
 */
router.get('/certifications',
  authenticate,
  rateLimiters.read,
  asyncHandler(async (req, res) => {
    const certifications = await prisma.qualityCertification.findMany({
      orderBy: { expiryDate: 'asc' }
    });

    // Check expiry status
    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const certificationsWithStatus = certifications.map(cert => ({
      ...cert,
      status: cert.expiryDate < now ? 'expired' :
             cert.expiryDate < thirtyDays ? 'expiring-soon' : 'valid',
      daysUntilExpiry: Math.floor((cert.expiryDate - now) / (24 * 60 * 60 * 1000))
    }));

    res.json({
      success: true,
      data: {
        certifications: certificationsWithStatus,
        summary: {
          total: certifications.length,
          valid: certificationsWithStatus.filter(c => c.status === 'valid').length,
          expiringSoon: certificationsWithStatus.filter(c => c.status === 'expiring-soon').length,
          expired: certificationsWithStatus.filter(c => c.status === 'expired').length
        }
      }
    });
  })
);

// Helper functions
async function updateQualityMetrics(productId, lineId) {
  // This would update daily quality metrics
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await prisma.qualityMetrics.findFirst({
    where: {
      productId,
      lineId,
      date: today
    }
  });

  if (existing) {
    await prisma.qualityMetrics.update({
      where: { id: existing.id },
      data: {
        defects: existing.defects + 1,
        updatedAt: new Date()
      }
    });
  } else {
    await prisma.qualityMetrics.create({
      data: {
        productId,
        lineId,
        date: today,
        defects: 1,
        totalProduced: 0,
        rework: 0,
        scrap: 0
      }
    });
  }
}

function groupMetricsByPeriod(metrics, groupBy) {
  // Group metrics by specified period
  const grouped = {};
  
  metrics.forEach(metric => {
    let key;
    const date = new Date(metric.date);
    
    switch (groupBy) {
      case 'day':
        key = date.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
    }
    
    if (!grouped[key]) {
      grouped[key] = {
        period: key,
        totalProduced: 0,
        defects: 0,
        rework: 0,
        scrap: 0
      };
    }
    
    grouped[key].totalProduced += metric.totalProduced;
    grouped[key].defects += metric.defects;
    grouped[key].rework += metric.rework;
    grouped[key].scrap += metric.scrap;
  });
  
  return Object.values(grouped);
}

function detectTrend(values) {
  // Simple trend detection
  if (values.length < 7) return 'insufficient-data';
  
  let increasingCount = 0;
  let decreasingCount = 0;
  
  for (let i = 1; i < values.length; i++) {
    if (values[i] > values[i - 1]) increasingCount++;
    else if (values[i] < values[i - 1]) decreasingCount++;
  }
  
  if (increasingCount >= 6) return 'increasing';
  if (decreasingCount >= 6) return 'decreasing';
  return 'stable';
}

function detectPattern(values) {
  // Detect patterns in data
  if (values.length < 14) return 'insufficient-data';
  
  // Check for runs (consecutive points on same side of mean)
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  let currentRun = 0;
  let maxRun = 0;
  let lastSide = null;
  
  values.forEach(val => {
    const side = val > mean ? 'above' : 'below';
    if (side === lastSide) {
      currentRun++;
      maxRun = Math.max(maxRun, currentRun);
    } else {
      currentRun = 1;
      lastSide = side;
    }
  });
  
  if (maxRun >= 8) return 'run';
  
  // Check for alternating pattern
  let alternating = 0;
  for (let i = 2; i < values.length; i++) {
    if ((values[i] > values[i-1] && values[i-1] < values[i-2]) ||
        (values[i] < values[i-1] && values[i-1] > values[i-2])) {
      alternating++;
    }
  }
  
  if (alternating >= 12) return 'alternating';
  
  return 'random';
}

export default router;