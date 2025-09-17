/**
 * Unleashed Inventory API Routes
 * Provides real-time inventory data and stock movement tracking
 */

import express from 'express';
import prisma from '../../lib/prisma.js';
import { getUnleashedSync } from '../unleashed/inventorySync.js';
import unleashedIntegration from '../../mcp-server/api-integrations/unleashed-integration.js';
import { logInfo, logError } from '../observability/structuredLogger.js';
import WebSocketService from '../websocketService.js';

const router = express.Router();

/**
 * Get real-time inventory status
 */
router.get('/status', async (req, res) => {
  try {
    const { warehouse, lowStockOnly, search } = req.query;

    const where = {};

    if (warehouse) {
      where.warehouse = warehouse;
    }

    if (lowStockOnly === 'true') {
      where.quantity = {
        lte: prisma.inventory.fields.reorderPoint
      };
    }

    if (search) {
      where.OR = [
        { sku: { contains: search, mode: 'insensitive' } },
        { productName: { contains: search, mode: 'insensitive' } }
      ];
    }

    const inventory = await prisma.inventory.findMany({
      where,
      orderBy: [
        { quantity: 'asc' },
        { productName: 'asc' }
      ],
      take: 100
    });

    // Get metrics
    const metrics = await prisma.inventoryMetric.findFirst({
      orderBy: { timestamp: 'desc' }
    });

    // Calculate alerts
    const alerts = inventory.filter(item => {
      if (item.quantity === 0) return true; // Out of stock
      if (item.quantity <= item.reorderPoint) return true; // Low stock
      return false;
    }).map(item => ({
      sku: item.sku,
      productName: item.productName,
      currentStock: item.quantity,
      reorderPoint: item.reorderPoint,
      status: item.quantity === 0 ? 'out-of-stock' : 'low-stock',
      warehouse: item.warehouse,
      value: item.totalValue
    }));

    res.json({
      success: true,
      data: {
        inventory,
        metrics,
        alerts,
        syncStatus: getUnleashedSync().getStatus()
      }
    });
  } catch (error) {
    logError('Failed to get inventory status', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve inventory status'
    });
  }
});

/**
 * Get stock movements for a product
 */
router.get('/movements/:sku', async (req, res) => {
  try {
    const { sku } = req.params;
    const { startDate, endDate, limit = 50 } = req.query;

    const where = { productCode: sku };

    if (startDate) {
      where.completedDate = {
        ...where.completedDate,
        gte: new Date(startDate)
      };
    }

    if (endDate) {
      where.completedDate = {
        ...where.completedDate,
        lte: new Date(endDate)
      };
    }

    const movements = await prisma.stockMovement.findMany({
      where,
      orderBy: { completedDate: 'desc' },
      take: parseInt(limit)
    });

    // Get product details
    const product = await prisma.inventory.findUnique({
      where: { sku }
    });

    // Calculate movement summary
    const summary = {
      totalMovements: movements.length,
      totalInbound: movements
        .filter(m => m.quantity > 0)
        .reduce((sum, m) => sum + m.quantity, 0),
      totalOutbound: movements
        .filter(m => m.quantity < 0)
        .reduce((sum, m) => sum + Math.abs(m.quantity), 0),
      netChange: movements.reduce((sum, m) => sum + m.quantity, 0),
      averageDailyUsage: product?.avgDailyUsage || 0
    };

    res.json({
      success: true,
      data: {
        product,
        movements,
        summary
      }
    });
  } catch (error) {
    logError('Failed to get stock movements', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve stock movements'
    });
  }
});

/**
 * Get stock movement trends
 */
router.get('/trends', async (req, res) => {
  try {
    const { period = '30d', groupBy = 'day' } = req.query;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    const movements = await prisma.stockMovement.findMany({
      where: {
        completedDate: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { completedDate: 'asc' }
    });

    // Group movements by period
    const trends = {};
    movements.forEach(movement => {
      const date = movement.completedDate;
      let key;

      switch (groupBy) {
        case 'hour':
          key = `${date.toISOString().slice(0, 13)}:00`;
          break;
        case 'day':
          key = date.toISOString().slice(0, 10);
          break;
        case 'week':
          const week = Math.floor((date - startDate) / (7 * 24 * 60 * 60 * 1000));
          key = `Week ${week + 1}`;
          break;
        default:
          key = date.toISOString().slice(0, 10);
      }

      if (!trends[key]) {
        trends[key] = {
          date: key,
          inbound: 0,
          outbound: 0,
          net: 0,
          count: 0,
          value: 0
        };
      }

      if (movement.quantity > 0) {
        trends[key].inbound += movement.quantity;
      } else {
        trends[key].outbound += Math.abs(movement.quantity);
      }
      trends[key].net += movement.quantity;
      trends[key].count++;
      trends[key].value += Math.abs(movement.totalCost || 0);
    });

    const trendData = Object.values(trends).sort((a, b) =>
      new Date(a.date) - new Date(b.date)
    );

    res.json({
      success: true,
      data: {
        period,
        groupBy,
        trends: trendData,
        summary: {
          totalInbound: trendData.reduce((sum, t) => sum + t.inbound, 0),
          totalOutbound: trendData.reduce((sum, t) => sum + t.outbound, 0),
          netChange: trendData.reduce((sum, t) => sum + t.net, 0),
          totalValue: trendData.reduce((sum, t) => sum + t.value, 0)
        }
      }
    });
  } catch (error) {
    logError('Failed to get stock trends', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve stock trends'
    });
  }
});

/**
 * Trigger manual sync
 */
router.post('/sync', async (req, res) => {
  try {
    const syncService = getUnleashedSync();

    if (syncService.isRunning) {
      return res.status(409).json({
        success: false,
        message: 'Sync already in progress'
      });
    }

    // Start sync in background
    syncService.triggerManualSync().then(result => {
      logInfo('Manual sync completed', result);

      // Broadcast completion
      const wsService = WebSocketService.getInstance();
      wsService.broadcast('unleashed-sync-complete', result);
    });

    res.json({
      success: true,
      message: 'Sync started',
      status: syncService.getStatus()
    });
  } catch (error) {
    logError('Failed to trigger sync', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger sync'
    });
  }
});

/**
 * Get sync status
 */
router.get('/sync/status', async (req, res) => {
  try {
    const syncService = getUnleashedSync();
    const status = syncService.getStatus();

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logError('Failed to get sync status', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve sync status'
    });
  }
});

/**
 * Get low stock alerts
 */
router.get('/alerts', async (req, res) => {
  try {
    const { severity = 'all', limit = 50 } = req.query;

    const where = {};

    switch (severity) {
      case 'critical':
        where.quantity = 0; // Out of stock
        break;
      case 'warning':
        where.quantity = {
          gt: 0,
          lte: prisma.inventory.fields.reorderPoint
        };
        break;
      case 'all':
      default:
        where.quantity = {
          lte: prisma.inventory.fields.reorderPoint
        };
    }

    const alerts = await prisma.inventory.findMany({
      where,
      orderBy: [
        { quantity: 'asc' },
        { totalValue: 'desc' }
      ],
      take: parseInt(limit)
    });

    // Format alerts
    const formattedAlerts = alerts.map(item => ({
      sku: item.sku,
      productName: item.productName,
      currentStock: item.quantity,
      reorderPoint: item.reorderPoint,
      reorderQuantity: item.reorderQuantity,
      warehouse: item.warehouse,
      severity: item.quantity === 0 ? 'critical' : 'warning',
      estimatedStockout: item.avgDailyUsage > 0
        ? Math.floor(item.quantity / item.avgDailyUsage)
        : null,
      value: item.totalValue,
      lastModified: item.lastModified
    }));

    res.json({
      success: true,
      data: {
        alerts: formattedAlerts,
        summary: {
          total: formattedAlerts.length,
          critical: formattedAlerts.filter(a => a.severity === 'critical').length,
          warning: formattedAlerts.filter(a => a.severity === 'warning').length,
          totalValue: formattedAlerts.reduce((sum, a) => sum + a.value, 0)
        }
      }
    });
  } catch (error) {
    logError('Failed to get stock alerts', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve stock alerts'
    });
  }
});

/**
 * Get product availability
 */
router.get('/availability/:sku', async (req, res) => {
  try {
    const { sku } = req.params;

    // Get from database first
    const inventory = await prisma.inventory.findUnique({
      where: { sku }
    });

    if (!inventory) {
      // Try to get from Unleashed directly
      const result = await unleashedIntegration.getProductDetails(sku);

      if (result.success) {
        return res.json({
          success: true,
          data: result.data
        });
      }

      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Get pending orders
    const pendingPurchaseOrders = await prisma.purchaseOrder.findMany({
      where: {
        status: 'Open',
        data: {
          path: ['lines'],
          array_contains: [{ productCode: sku }]
        }
      }
    });

    const pendingSalesOrders = await prisma.salesOrder.findMany({
      where: {
        status: 'Open',
        data: {
          path: ['lines'],
          array_contains: [{ productCode: sku }]
        }
      }
    });

    // Calculate availability
    const incomingStock = pendingPurchaseOrders.reduce((sum, po) => {
      const lines = po.data.lines || [];
      const productLines = lines.filter(l => l.productCode === sku);
      return sum + productLines.reduce((lineSum, l) => lineSum + l.quantity, 0);
    }, 0);

    const committedStock = pendingSalesOrders.reduce((sum, so) => {
      const lines = so.data.lines || [];
      const productLines = lines.filter(l => l.productCode === sku);
      return sum + productLines.reduce((lineSum, l) => lineSum + l.quantity, 0);
    }, 0);

    const availability = {
      sku: inventory.sku,
      productName: inventory.productName,
      currentStock: inventory.quantity,
      allocated: inventory.quantityAllocated || 0,
      available: inventory.quantityAvailable || inventory.quantity,
      incomingStock,
      committedStock,
      futureAvailable: inventory.quantity + incomingStock - committedStock,
      warehouse: inventory.warehouse,
      location: inventory.location,
      reorderPoint: inventory.reorderPoint,
      reorderQuantity: inventory.reorderQuantity,
      avgDailyUsage: inventory.avgDailyUsage,
      daysOfStock: inventory.avgDailyUsage > 0
        ? Math.floor(inventory.quantity / inventory.avgDailyUsage)
        : null,
      lastModified: inventory.lastModified
    };

    res.json({
      success: true,
      data: availability
    });
  } catch (error) {
    logError('Failed to get product availability', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve product availability'
    });
  }
});

/**
 * Subscribe to real-time updates via SSE
 */
router.get('/realtime', (req, res) => {
  // Set up SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  // Send initial connection message
  res.write(`data: ${JSON.stringify({
    type: 'connected',
    timestamp: new Date()
  })}\n\n`);

  // Keep connection alive
  const keepAlive = setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: 'ping' })}\n\n`);
  }, 30000);

  // Clean up on disconnect
  req.on('close', () => {
    clearInterval(keepAlive);
    logInfo('SSE connection closed');
  });
});

export default router;