import express from 'express';
import NodeCache from 'node-cache';
import prisma from '../../lib/prisma.js';
import { requireAuth, requireRole, requireManager } from '../middleware/clerkAuth.js';
import { rateLimiters } from '../middleware/rateLimiter.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import {
  inventoryLevelSchema,
  inventoryOptimizationSchema,
  inventoryMovementSchema,
  stockTakeSchema
} from '../validators/inventory.js';

const router = express.Router();

// Initialize cache with 60 second TTL for frequently accessed data
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

/**
 * GET /api/inventory/levels
 * Get current inventory levels with filters
 */
router.get('/levels',
  requireAuth,
  rateLimiters.read,
  asyncHandler(async (req, res) => {
    // Validate query parameters
    const query = inventoryLevelSchema.query.parse(req.query);

    // Check cache
    const cacheKey = `inventory-levels-${JSON.stringify(query)}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      console.log('[Cache Hit] Inventory levels');
      return res.json(cached);
    }

    console.log('[Cache Miss] Inventory levels - fetching from database');

    // Build where clause
    const where = {};
    if (query.sku) where.sku = { contains: query.sku, mode: 'insensitive' };
    if (query.location) where.location = query.location;
    if (query.category) where.category = query.category;
    if (query.status) {
      // Determine status based on quantity vs reorder point
      switch (query.status) {
        case 'out-of-stock':
          where.quantity = 0;
          break;
        case 'low-stock':
          where.quantity = { gt: 0, lte: prisma.raw('"reorderPoint"') };
          break;
        case 'in-stock':
          where.quantity = { gt: prisma.raw('"reorderPoint"') };
          break;
        case 'overstock':
          where.quantity = { gt: prisma.raw('"reorderPoint" * 3') };
          break;
      }
    }

    // Fetch inventory levels
    const [items, total] = await Promise.all([
      prisma.inventory.findMany({
        where,
        take: query.limit,
        skip: query.offset,
        orderBy: { updatedAt: 'desc' },
        include: {
          movements: {
            take: 5,
            orderBy: { timestamp: 'desc' }
          }
        }
      }),
      prisma.inventory.count({ where })
    ]);

    // Calculate inventory status for each item
    const itemsWithStatus = items.map(item => ({
      ...item,
      status: item.quantity === 0 ? 'out-of-stock' :
              item.quantity <= item.reorderPoint ? 'low-stock' :
              item.quantity > item.reorderPoint * 3 ? 'overstock' : 'in-stock',
      value: item.quantity * item.unitCost
    }));

    // Calculate summary statistics
    const summary = {
      totalItems: total,
      totalValue: itemsWithStatus.reduce((sum, item) => sum + item.value, 0),
      outOfStock: itemsWithStatus.filter(i => i.status === 'out-of-stock').length,
      lowStock: itemsWithStatus.filter(i => i.status === 'low-stock').length,
      overstock: itemsWithStatus.filter(i => i.status === 'overstock').length
    };

    res.json({
      success: true,
      data: {
        items: itemsWithStatus,
        summary,
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
 * POST /api/inventory/levels
 * Create new inventory item
 */
router.post('/levels',
  requireAuth,
  requireRole(['admin', 'manager']),
  rateLimiters.write,
  asyncHandler(async (req, res) => {
    // Validate request body
    const data = inventoryLevelSchema.create.parse(req.body);

    // Check if SKU already exists
    const existing = await prisma.inventory.findUnique({
      where: { sku: data.sku }
    });

    if (existing) {
      throw new AppError('SKU already exists', 409);
    }

    // Create inventory item
    const item = await prisma.inventory.create({
      data: {
        ...data,
        createdBy: req.userId
      }
    });

    // Create initial inventory movement
    await prisma.inventoryMovement.create({
      data: {
        inventoryId: item.id,
        type: 'adjustment',
        quantity: data.quantity,
        fromLocation: null,
        toLocation: data.location,
        reason: 'Initial stock entry',
        createdBy: req.userId
      }
    });

    res.status(201).json({
      success: true,
      data: item
    });
  })
);

/**
 * PUT /api/inventory/levels/:id
 * Update inventory item details
 */
router.put('/levels/:id',
  requireAuth,
  requireRole(['admin', 'manager']),
  rateLimiters.write,
  asyncHandler(async (req, res) => {
    // Validate request body
    const data = inventoryLevelSchema.update.parse(req.body);
    const { id } = req.params;

    // Update inventory item
    const item = await prisma.inventory.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      data: item
    });
  })
);

/**
 * POST /api/inventory/levels/:id/adjust
 * Adjust inventory quantity
 */
router.post('/levels/:id/adjust',
  requireAuth,
  requireRole(['admin', 'manager', 'operator']),
  rateLimiters.write,
  asyncHandler(async (req, res) => {
    // Validate request body
    const data = inventoryLevelSchema.adjust.parse(req.body);
    const { id } = req.params;

    // Get current inventory item
    const item = await prisma.inventory.findUnique({
      where: { id }
    });

    if (!item) {
      throw new AppError('Inventory item not found', 404);
    }

    // Calculate new quantity
    let newQuantity;
    switch (data.type) {
      case 'addition':
        newQuantity = item.quantity + data.quantity;
        break;
      case 'subtraction':
        newQuantity = Math.max(0, item.quantity - data.quantity);
        break;
      case 'count':
      case 'adjustment':
        newQuantity = data.quantity;
        break;
      default:
        throw new AppError('Invalid adjustment type', 400);
    }

    // Update inventory in transaction
    const [updatedItem, movement] = await prisma.$transaction([
      prisma.inventory.update({
        where: { id },
        data: {
          quantity: newQuantity,
          lastCountDate: data.type === 'count' ? new Date() : item.lastCountDate,
          updatedAt: new Date()
        }
      }),
      prisma.inventoryMovement.create({
        data: {
          inventoryId: id,
          type: data.type,
          quantity: Math.abs(data.quantity),
          fromLocation: item.location,
          toLocation: item.location,
          reason: data.reason,
          reference: data.reference,
          createdBy: req.userId
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        item: updatedItem,
        movement,
        previousQuantity: item.quantity,
        adjustment: data.quantity,
        newQuantity
      }
    });
  })
);

/**
 * POST /api/inventory/optimize
 * Calculate optimal order quantities (EOQ)
 */
router.post('/optimize',
  requireAuth,
  requireRole(['admin', 'manager']),
  rateLimiters.expensive,
  asyncHandler(async (req, res) => {
    // Validate request body
    const data = inventoryOptimizationSchema.eoq.parse(req.body);

    // Get inventory item
    const item = await prisma.inventory.findFirst({
      where: { sku: data.sku }
    });

    if (!item) {
      throw new AppError('SKU not found', 404);
    }

    // Calculate Economic Order Quantity (EOQ)
    const eoq = Math.sqrt((2 * data.demandRate * data.orderCost) / data.holdingCost);
    
    // Calculate reorder point
    const leadTimeDemand = data.leadTime ? data.demandRate * (data.leadTime / 365) : 0;
    const safetyStock = data.serviceLevel * Math.sqrt(leadTimeDemand);
    const reorderPoint = leadTimeDemand + safetyStock;

    // Calculate total annual costs
    const orderingCost = (data.demandRate / eoq) * data.orderCost;
    const holdingCostTotal = (eoq / 2) * data.holdingCost;
    const totalCost = orderingCost + holdingCostTotal;

    // Calculate optimization metrics
    const currentOrderingCost = (data.demandRate / item.reorderQuantity) * data.orderCost;
    const currentHoldingCost = (item.reorderQuantity / 2) * data.holdingCost;
    const currentTotalCost = currentOrderingCost + currentHoldingCost;
    const savings = currentTotalCost - totalCost;
    const savingsPercentage = (savings / currentTotalCost) * 100;

    res.json({
      success: true,
      data: {
        sku: data.sku,
        item: {
          name: item.name,
          currentReorderPoint: item.reorderPoint,
          currentReorderQuantity: item.reorderQuantity
        },
        optimization: {
          eoq: Math.round(eoq),
          reorderPoint: Math.round(reorderPoint),
          safetyStock: Math.round(safetyStock),
          annualOrderingCost: orderingCost,
          annualHoldingCost: holdingCostTotal,
          totalAnnualCost: totalCost,
          ordersPerYear: data.demandRate / eoq
        },
        comparison: {
          currentTotalCost,
          optimizedTotalCost: totalCost,
          annualSavings: savings,
          savingsPercentage
        },
        parameters: data
      }
    });
  })
);

/**
 * POST /api/inventory/optimize/reorder
 * Generate reorder recommendations
 */
router.post('/optimize/reorder',
  requireAuth,
  requireRole(['admin', 'manager']),
  rateLimiters.expensive,
  asyncHandler(async (req, res) => {
    // Validate request body
    const data = inventoryOptimizationSchema.reorder.parse(req.body);

    // Get inventory items
    const items = await prisma.inventory.findMany({
      where: {
        sku: { in: data.skus }
      }
    });

    if (items.length === 0) {
      throw new AppError('No items found', 404);
    }

    // Generate reorder recommendations
    const recommendations = items.map(item => {
      const shouldReorder = item.quantity <= item.reorderPoint;
      const daysOfStock = item.quantity / (item.reorderPoint / 30); // Rough estimate
      const urgency = item.quantity === 0 ? 'critical' :
                     item.quantity < item.reorderPoint * 0.5 ? 'high' :
                     item.quantity <= item.reorderPoint ? 'medium' : 'low';

      return {
        sku: item.sku,
        name: item.name,
        currentQuantity: item.quantity,
        reorderPoint: item.reorderPoint,
        reorderQuantity: item.reorderQuantity,
        shouldReorder,
        urgency,
        daysOfStock: Math.round(daysOfStock),
        orderAmount: shouldReorder ? item.reorderQuantity : 0,
        estimatedCost: shouldReorder ? item.reorderQuantity * item.unitCost : 0,
        supplier: item.supplier
      };
    });

    // Sort by urgency
    const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    recommendations.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

    // Calculate totals
    const summary = {
      totalItems: recommendations.length,
      itemsToReorder: recommendations.filter(r => r.shouldReorder).length,
      criticalItems: recommendations.filter(r => r.urgency === 'critical').length,
      totalOrderCost: recommendations.reduce((sum, r) => sum + r.estimatedCost, 0)
    };

    res.json({
      success: true,
      data: {
        recommendations,
        summary
      }
    });
  })
);

/**
 * GET /api/inventory/movements
 * Get inventory movements history
 */
router.get('/movements',
  requireAuth,
  rateLimiters.read,
  asyncHandler(async (req, res) => {
    // Validate query parameters
    const query = inventoryMovementSchema.query.parse(req.query);

    // Build where clause
    const where = {};
    if (query.sku) {
      const inventory = await prisma.inventory.findFirst({
        where: { sku: query.sku }
      });
      if (inventory) where.inventoryId = inventory.id;
    }
    if (query.location) {
      where.OR = [
        { fromLocation: query.location },
        { toLocation: query.location }
      ];
    }
    if (query.type) where.type = query.type;
    if (query.startDate || query.endDate) {
      where.timestamp = {};
      if (query.startDate) where.timestamp.gte = new Date(query.startDate);
      if (query.endDate) where.timestamp.lte = new Date(query.endDate);
    }

    // Fetch movements
    const [movements, total] = await Promise.all([
      prisma.inventoryMovement.findMany({
        where,
        take: query.limit,
        skip: query.offset,
        orderBy: { timestamp: 'desc' },
        include: {
          inventory: true,
          createdByUser: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.inventoryMovement.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        movements,
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
 * POST /api/inventory/movements
 * Create inventory movement (transfer)
 */
router.post('/movements',
  requireAuth,
  requireRole(['admin', 'manager', 'operator']),
  rateLimiters.write,
  asyncHandler(async (req, res) => {
    // Validate request body
    const data = inventoryMovementSchema.create.parse(req.body);

    // Get inventory item
    const item = await prisma.inventory.findFirst({
      where: { sku: data.sku }
    });

    if (!item) {
      throw new AppError('SKU not found', 404);
    }

    // For transfers, check if sufficient quantity
    if (data.type === 'transfer' && item.quantity < data.quantity) {
      throw new AppError('Insufficient inventory for transfer', 400, {
        available: item.quantity,
        requested: data.quantity
      });
    }

    // Create movement in transaction
    const movement = await prisma.$transaction(async (tx) => {
      // Create movement record
      const mov = await tx.inventoryMovement.create({
        data: {
          inventoryId: item.id,
          type: data.type,
          quantity: data.quantity,
          fromLocation: data.fromLocation,
          toLocation: data.toLocation,
          reason: data.reason,
          reference: data.reference,
          scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null,
          status: data.scheduledDate ? 'scheduled' : 'completed',
          createdBy: req.userId
        },
        include: {
          inventory: true
        }
      });

      // Update inventory if immediate movement
      if (!data.scheduledDate) {
        if (data.type === 'shipment' || data.type === 'transfer') {
          await tx.inventory.update({
            where: { id: item.id },
            data: {
              quantity: Math.max(0, item.quantity - data.quantity),
              location: data.type === 'transfer' ? data.toLocation : item.location
            }
          });
        } else if (data.type === 'receipt') {
          await tx.inventory.update({
            where: { id: item.id },
            data: {
              quantity: item.quantity + data.quantity
            }
          });
        }
      }

      return mov;
    });

    res.status(201).json({
      success: true,
      data: movement
    });
  })
);

/**
 * POST /api/inventory/stocktake
 * Record stock take results
 */
router.post('/stocktake',
  requireAuth,
  requireRole(['admin', 'manager', 'operator']),
  rateLimiters.write,
  asyncHandler(async (req, res) => {
    // Validate request body
    const data = stockTakeSchema.create.parse(req.body);

    // Process stock take in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create stock take record
      const stockTake = await tx.stockTake.create({
        data: {
          location: data.location,
          notes: data.notes,
          performedBy: req.userId,
          totalItems: data.items.length,
          totalVariance: data.items.reduce((sum, item) => sum + Math.abs(item.variance), 0)
        }
      });

      // Process each item
      const adjustments = [];
      for (const item of data.items) {
        // Find inventory item
        const inv = await tx.inventory.findFirst({
          where: { sku: item.sku }
        });

        if (!inv) continue;

        // Create adjustment if variance exists
        if (item.variance !== 0) {
          // Update inventory quantity
          await tx.inventory.update({
            where: { id: inv.id },
            data: {
              quantity: item.countedQuantity,
              lastCountDate: new Date()
            }
          });

          // Create movement record
          const movement = await tx.inventoryMovement.create({
            data: {
              inventoryId: inv.id,
              type: 'count',
              quantity: Math.abs(item.variance),
              fromLocation: data.location,
              toLocation: data.location,
              reason: `Stock take adjustment (${item.variance > 0 ? 'surplus' : 'shortage'})`,
              reference: `ST-${stockTake.id}`,
              createdBy: req.userId
            }
          });

          adjustments.push({
            sku: item.sku,
            previousQuantity: item.systemQuantity,
            countedQuantity: item.countedQuantity,
            variance: item.variance,
            movement: movement.id
          });
        }
      }

      return {
        stockTake,
        adjustments
      };
    });

    res.status(201).json({
      success: true,
      data: result
    });
  })
);

/**
 * GET /api/inventory/analytics
 * Get inventory analytics and insights
 */
router.get('/analytics',
  requireAuth,
  rateLimiters.read,
  asyncHandler(async (req, res) => {
    const { period = '30d' } = req.query;

    // Calculate date range
    const periodMap = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '365d': 365
    };
    const days = periodMap[period] || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get inventory metrics
    const [inventory, movements, stockouts] = await Promise.all([
      // Current inventory status
      prisma.inventory.aggregate({
        _sum: {
          quantity: true,
          unitCost: true
        },
        _count: true
      }),
      // Movement statistics
      prisma.inventoryMovement.groupBy({
        by: ['type'],
        where: {
          timestamp: { gte: startDate }
        },
        _count: true,
        _sum: {
          quantity: true
        }
      }),
      // Stockout occurrences
      prisma.inventory.count({
        where: {
          quantity: 0
        }
      })
    ]);

    // Calculate turnover metrics
    const totalValue = await prisma.$queryRaw`
      SELECT SUM(quantity * unit_cost) as total_value,
             AVG(quantity * unit_cost) as avg_value
      FROM inventory
    `;

    res.json({
      success: true,
      data: {
        period,
        overview: {
          totalItems: inventory._count,
          totalQuantity: inventory._sum.quantity || 0,
          totalValue: totalValue[0]?.total_value || 0,
          stockouts
        },
        movements: movements.map(m => ({
          type: m.type,
          count: m._count,
          totalQuantity: m._sum.quantity || 0
        })),
        trends: {
          // This would typically include time-series data
          message: 'Time-series trends would be calculated here'
        }
      }
    });
  })
);

export default router;