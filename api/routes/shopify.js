/**
 * Shopify API Routes
 * Handles sales data synchronization and metrics retrieval
 */

import express from 'express';
import shopifyIntegration from '../integrations/shopify.js';
import { logInfo, logError } from '../../services/observability/structuredLogger.js';
import cron from 'node-cron';

const router = express.Router();

/**
 * Test Shopify connections
 */
router.get('/status', async (req, res) => {
  try {
    const connections = await shopifyIntegration.testConnections();

    res.json({
      success: true,
      connections,
      lastSync: shopifyIntegration.lastSync,
      message: 'Shopify connection status retrieved'
    });
  } catch (error) {
    logError('Failed to check Shopify status', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Sync sales data from all Shopify stores
 */
router.post('/sync', async (req, res) => {
  try {
    logInfo('Starting manual Shopify sync');

    const results = await shopifyIntegration.syncAllStores();

    res.json({
      success: true,
      data: results,
      message: `Synced ${results.totalOrders} orders from Shopify`
    });
  } catch (error) {
    logError('Shopify sync failed', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get current sales metrics
 */
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await shopifyIntegration.getCurrentMetrics();

    res.json({
      success: true,
      data: metrics,
      lastSync: shopifyIntegration.lastSync
    });
  } catch (error) {
    logError('Failed to get Shopify metrics', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get sales data for a specific time period
 */
router.get('/sales', async (req, res) => {
  try {
    const { startDate, endDate, region } = req.query;

    // For now, return current metrics
    // In production, this would filter by date range
    const metrics = await shopifyIntegration.getCurrentMetrics();

    res.json({
      success: true,
      data: metrics.data,
      period: {
        start: startDate || 'last_30_days',
        end: endDate || 'today',
        region: region || 'all'
      }
    });
  } catch (error) {
    logError('Failed to get sales data', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get inventory levels from Shopify
 */
router.get('/inventory', async (req, res) => {
  try {
    const results = {
      uk: null,
      usa: null,
      eu: null,
      totalItems: 0,
      totalQuantity: 0
    };

    // Get inventory from each store
    if (shopifyIntegration.ukStore) {
      results.uk = await shopifyIntegration.syncInventoryLevels(shopifyIntegration.ukStore);
      if (results.uk) {
        results.totalItems += results.uk.itemsTracked || 0;
        results.totalQuantity += results.uk.totalQuantity || 0;
      }
    }

    if (shopifyIntegration.usaStore) {
      results.usa = await shopifyIntegration.syncInventoryLevels(shopifyIntegration.usaStore);
      if (results.usa) {
        results.totalItems += results.usa.itemsTracked || 0;
        results.totalQuantity += results.usa.totalQuantity || 0;
      }
    }

    res.json({
      success: true,
      data: results,
      message: 'Inventory levels retrieved'
    });
  } catch (error) {
    logError('Failed to get inventory levels', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get top selling products
 */
router.get('/products/top', async (req, res) => {
  try {
    const metrics = await shopifyIntegration.getCurrentMetrics();

    // Extract top products from metrics
    const topProducts = metrics.data?.uk?.metrics?.topProducts || [];
    const usaTopProducts = metrics.data?.usa?.metrics?.topProducts || [];

    // Combine and sort
    const allProducts = [...topProducts, ...usaTopProducts];
    const productMap = {};

    allProducts.forEach(product => {
      if (!productMap[product.sku]) {
        productMap[product.sku] = {
          ...product,
          totalRevenue: 0,
          totalQuantity: 0,
          regions: []
        };
      }
      productMap[product.sku].totalRevenue += product.revenue;
      productMap[product.sku].totalQuantity += product.quantity;
      productMap[product.sku].regions.push(product.region || 'unknown');
    });

    const sortedProducts = Object.values(productMap)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);

    res.json({
      success: true,
      data: sortedProducts,
      period: 'last_30_days'
    });
  } catch (error) {
    logError('Failed to get top products', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get sales by region
 */
router.get('/sales/by-region', async (req, res) => {
  try {
    const metrics = await shopifyIntegration.getCurrentMetrics();

    const regionData = {
      uk: {
        orders: metrics.data?.uk?.ordersProcessed || 0,
        revenue: metrics.data?.uk?.metrics?.totalRevenue30Days || 0,
        averageOrderValue: metrics.data?.uk?.metrics?.averageOrderValue || 0
      },
      usa: {
        orders: metrics.data?.usa?.ordersProcessed || 0,
        revenue: metrics.data?.usa?.metrics?.totalRevenue30Days || 0,
        averageOrderValue: metrics.data?.usa?.metrics?.averageOrderValue || 0
      },
      eu: {
        orders: metrics.data?.eu?.ordersProcessed || 0,
        revenue: metrics.data?.eu?.metrics?.totalRevenue30Days || 0,
        averageOrderValue: metrics.data?.eu?.metrics?.averageOrderValue || 0
      }
    };

    res.json({
      success: true,
      data: regionData,
      period: 'last_30_days',
      lastSync: shopifyIntegration.lastSync
    });
  } catch (error) {
    logError('Failed to get sales by region', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Initialize scheduled sync (every 15 minutes)
let syncJob = null;

export function startShopifySync() {
  if (syncJob) {
    syncJob.stop();
  }

  syncJob = cron.schedule('*/15 * * * *', async () => {
    try {
      logInfo('Running scheduled Shopify sync');
      await shopifyIntegration.syncAllStores();
    } catch (error) {
      logError('Scheduled Shopify sync failed', error);
    }
  });

  logInfo('Shopify scheduled sync started (every 15 minutes)');
}

export default router;