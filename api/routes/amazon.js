/**
 * Amazon SP-API Routes
 * Handles Amazon marketplace data synchronization and management
 */

import express from 'express';
import amazonIntegration from '../integrations/amazon.js';
import { clerkAuth } from '../middleware/clerkAuth.js';
import asyncHandler from '../lib/asyncHandler.js';
import { logDebug, logInfo, logWarn, logError } from '../../services/observability/structuredLogger.js';

const router = express.Router();

// Apply authentication middleware
router.use(clerkAuth);

// GET /api/amazon/status - Check Amazon integration status
router.get('/status', asyncHandler(async (req, res) => {
  try {
    const status = {
      connected: !!(process.env.AMAZON_SP_API_CLIENT_ID && process.env.AMAZON_SP_API_CLIENT_SECRET),
      marketplaces: {
        uk: !!process.env.AMAZON_UK_MARKETPLACE_ID,
        usa: !!process.env.AMAZON_USA_MARKETPLACE_ID
      },
      lastSync: amazonIntegration.lastSync,
      defaultMarketplace: process.env.AMAZON_DEFAULT_MARKETPLACE
    };

    res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    logError('Amazon status check failed', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check Amazon status'
    });
  }
}));

// POST /api/amazon/sync - Trigger full sales data sync
router.post('/sync', asyncHandler(async (req, res) => {
  try {
    const { marketplace = process.env.AMAZON_DEFAULT_MARKETPLACE } = req.body;

    logInfo(`Starting Amazon sync for marketplace: ${marketplace}`);

    const result = await amazonIntegration.syncSalesData(marketplace);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logError('Amazon sync failed', error);
    res.status(500).json({
      success: false,
      error: 'Amazon sync failed',
      details: error.message
    });
  }
}));

// GET /api/amazon/orders - Get recent orders
router.get('/orders', asyncHandler(async (req, res) => {
  try {
    const { marketplace = process.env.AMAZON_DEFAULT_MARKETPLACE, limit = 50 } = req.query;

    // This would fetch from database after sync
    const orders = await prisma.salesOrder.findMany({
      where: {
        source: 'amazon',
        marketplace: marketplace
      },
      orderBy: {
        orderDate: 'desc'
      },
      take: parseInt(limit)
    });

    res.status(200).json({
      success: true,
      data: orders
    });
  } catch (error) {
    logError('Failed to fetch Amazon orders', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders'
    });
  }
}));

// GET /api/amazon/inventory - Get FBA inventory levels
router.get('/inventory', asyncHandler(async (req, res) => {
  try {
    const { marketplace = process.env.AMAZON_DEFAULT_MARKETPLACE } = req.query;

    const inventory = await amazonIntegration.getFBAInventory(marketplace);

    res.status(200).json({
      success: true,
      data: inventory
    });
  } catch (error) {
    logError('Failed to fetch Amazon inventory', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch inventory'
    });
  }
}));

// GET /api/amazon/financial-events - Get financial data
router.get('/financial-events', asyncHandler(async (req, res) => {
  try {
    const { marketplace = process.env.AMAZON_DEFAULT_MARKETPLACE } = req.query;

    const financialData = await amazonIntegration.getFinancialEvents(marketplace);

    res.status(200).json({
      success: true,
      data: financialData
    });
  } catch (error) {
    logError('Failed to fetch Amazon financial events', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch financial events'
    });
  }
}));

// GET /api/amazon/returns - Get returns data
router.get('/returns', asyncHandler(async (req, res) => {
  try {
    const { marketplace = process.env.AMAZON_DEFAULT_MARKETPLACE } = req.query;

    const returns = await amazonIntegration.getReturns(marketplace);

    res.status(200).json({
      success: true,
      data: returns
    });
  } catch (error) {
    logError('Failed to fetch Amazon returns', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch returns'
    });
  }
}));

// GET /api/amazon/performance - Get product performance metrics
router.get('/performance', asyncHandler(async (req, res) => {
  try {
    const { marketplace = process.env.AMAZON_DEFAULT_MARKETPLACE } = req.query;

    const performance = await amazonIntegration.getProductPerformance(marketplace);

    res.status(200).json({
      success: true,
      data: performance
    });
  } catch (error) {
    logError('Failed to fetch Amazon performance', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch performance data'
    });
  }
}));

// POST /api/amazon/fba-shipment - Create FBA shipment
router.post('/fba-shipment', asyncHandler(async (req, res) => {
  try {
    const { items, marketplace = process.env.AMAZON_DEFAULT_MARKETPLACE } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        error: 'Items array is required'
      });
    }

    const shipment = await amazonIntegration.createFBAShipment(items, marketplace);

    res.status(200).json({
      success: true,
      data: shipment
    });
  } catch (error) {
    logError('Failed to create FBA shipment', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create FBA shipment'
    });
  }
}));

export default router;