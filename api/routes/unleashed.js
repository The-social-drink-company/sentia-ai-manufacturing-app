/**
 * Unleashed Inventory Management Routes
 * Handles inventory, production, and order management through Unleashed API
 */

import express from 'express';
import unleashedIntegration from '../integrations/unleashed.js';
import { clerkAuth } from '../middleware/clerkAuth.js';
import asyncHandler from '../lib/asyncHandler.js';
import { logDebug, logInfo, logWarn, logError } from '../../services/observability/structuredLogger.js';

const router = express.Router();

// Apply authentication middleware
router.use(clerkAuth);

// GET /api/unleashed/status - Check Unleashed integration status
router.get('/status', asyncHandler(async (req, res) => {
  try {
    const status = {
      connected: !!(process.env.UNLEASHED_API_ID && process.env.UNLEASHED_API_KEY),
      lastSync: unleashedIntegration.lastSync,
      apiUrl: process.env.UNLEASHED_API_URL || 'https://api.unleashedsoftware.com'
    };

    res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    logError('Unleashed status check failed', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check Unleashed status'
    });
  }
}));

// POST /api/unleashed/sync - Trigger full data sync
router.post('/sync', asyncHandler(async (req, res) => {
  try {
    logInfo('Starting full Unleashed sync');

    const result = await unleashedIntegration.runFullSync();

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logError('Unleashed full sync failed', error);
    res.status(500).json({
      success: false,
      error: 'Unleashed sync failed',
      details: error.message
    });
  }
}));

// POST /api/unleashed/sync/inventory - Sync inventory only
router.post('/sync/inventory', asyncHandler(async (req, res) => {
  try {
    logInfo('Starting Unleashed inventory sync');

    const result = await unleashedIntegration.syncInventory();

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logError('Unleashed inventory sync failed', error);
    res.status(500).json({
      success: false,
      error: 'Inventory sync failed',
      details: error.message
    });
  }
}));

// POST /api/unleashed/sync/sales-orders - Sync sales orders
router.post('/sync/sales-orders', asyncHandler(async (req, res) => {
  try {
    logInfo('Starting Unleashed sales orders sync');

    const result = await unleashedIntegration.syncSalesOrders();

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logError('Unleashed sales orders sync failed', error);
    res.status(500).json({
      success: false,
      error: 'Sales orders sync failed',
      details: error.message
    });
  }
}));

// POST /api/unleashed/sync/purchase-orders - Sync purchase orders
router.post('/sync/purchase-orders', asyncHandler(async (req, res) => {
  try {
    logInfo('Starting Unleashed purchase orders sync');

    const result = await unleashedIntegration.syncPurchaseOrders();

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logError('Unleashed purchase orders sync failed', error);
    res.status(500).json({
      success: false,
      error: 'Purchase orders sync failed',
      details: error.message
    });
  }
}));

// POST /api/unleashed/sync/production-orders - Sync production orders
router.post('/sync/production-orders', asyncHandler(async (req, res) => {
  try {
    logInfo('Starting Unleashed production orders sync');

    const result = await unleashedIntegration.syncProductionOrders();

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logError('Unleashed production orders sync failed', error);
    res.status(500).json({
      success: false,
      error: 'Production orders sync failed',
      details: error.message
    });
  }
}));

// GET /api/unleashed/inventory - Get current inventory levels
router.get('/inventory', asyncHandler(async (req, res) => {
  try {
    const { limit = 100, offset = 0, search, category } = req.query;

    let whereClause = {};

    if (search) {
      whereClause.OR = [
        { sku: { contains: search, mode: 'insensitive' } },
        { productName: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (category) {
      whereClause.category = category;
    }

    const [inventory, total] = await Promise.all([
      prisma.inventory.findMany({
        where: whereClause,
        skip: parseInt(offset),
        take: parseInt(limit),
        orderBy: { sku: 'asc' }
      }),
      prisma.inventory.count({ where: whereClause })
    ]);

    res.status(200).json({
      success: true,
      data: {
        inventory,
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    logError('Failed to fetch Unleashed inventory', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch inventory'
    });
  }
}));

// GET /api/unleashed/stock-movements - Get stock movement history
router.get('/stock-movements', asyncHandler(async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const movements = await unleashedIntegration.getStockMovements(parseInt(days));

    res.status(200).json({
      success: true,
      data: movements
    });
  } catch (error) {
    logError('Failed to fetch stock movements', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stock movements'
    });
  }
}));

// GET /api/unleashed/warehouse-stock - Get warehouse stock levels
router.get('/warehouse-stock', asyncHandler(async (req, res) => {
  try {
    const { warehouseCode } = req.query;

    const stock = await unleashedIntegration.getWarehouseStock(warehouseCode);

    res.status(200).json({
      success: true,
      data: stock
    });
  } catch (error) {
    logError('Failed to fetch warehouse stock', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch warehouse stock'
    });
  }
}));

// GET /api/unleashed/bom/:productCode - Get Bill of Materials
router.get('/bom/:productCode', asyncHandler(async (req, res) => {
  try {
    const { productCode } = req.params;

    const bom = await unleashedIntegration.getBillOfMaterials(productCode);

    if (!bom) {
      return res.status(404).json({
        success: false,
        error: 'Bill of Materials not found'
      });
    }

    res.status(200).json({
      success: true,
      data: bom
    });
  } catch (error) {
    logError('Failed to fetch BOM', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Bill of Materials'
    });
  }
}));

// GET /api/unleashed/production-orders - Get production orders
router.get('/production-orders', asyncHandler(async (req, res) => {
  try {
    const { limit = 50, offset = 0, status } = req.query;

    let whereClause = {};

    if (status) {
      whereClause.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.productionOrder.findMany({
        where: whereClause,
        skip: parseInt(offset),
        take: parseInt(limit),
        orderBy: { startDate: 'desc' }
      }),
      prisma.productionOrder.count({ where: whereClause })
    ]);

    res.status(200).json({
      success: true,
      data: {
        orders,
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    logError('Failed to fetch production orders', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch production orders'
    });
  }
}));

// GET /api/unleashed/purchase-orders - Get purchase orders
router.get('/purchase-orders', asyncHandler(async (req, res) => {
  try {
    const { limit = 50, offset = 0, status } = req.query;

    let whereClause = {};

    if (status) {
      whereClause.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where: whereClause,
        skip: parseInt(offset),
        take: parseInt(limit),
        orderBy: { orderDate: 'desc' }
      }),
      prisma.purchaseOrder.count({ where: whereClause })
    ]);

    res.status(200).json({
      success: true,
      data: {
        orders,
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    logError('Failed to fetch purchase orders', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch purchase orders'
    });
  }
}));

export default router;