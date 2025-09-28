/**
 * Shopify API Routes
 * Enterprise e-commerce integration endpoints
 * Part of Phase 3.1: E-commerce Platform Integration
 */

import express from 'express';
import ShopifyIntegration from '../integrations/shopify.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const shopify = new ShopifyIntegration();

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * GET /api/shopify/status
 * Get Shopify connection status for both stores
 */
router.get('/status', async (req, res) => {
  try {
    const status = await shopify.getConnectionStatus();

    res.json({
      success: true,
      data: status,
      meta: {
        timestamp: new Date().toISOString(),
        stores: ['UK', 'USA'],
        apiVersion: '2024-10'
      }
    });
  } catch (error) {
    console.error('Shopify status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check Shopify connection status',
      message: error.message
    });
  }
});

/**
 * GET /api/shopify/orders
 * Get orders from both Shopify stores
 */
router.get('/orders', async (req, res) => {
  try {
    const {
      limit = 50,
      status = 'any',
      financial_status,
      fulfillment_status,
      since_id,
      created_at_min,
      created_at_max
    } = req.query;

    const options = {
      limit: parseInt(limit),
      status,
      ...(financial_status && { financial_status }),
      ...(fulfillment_status && { fulfillment_status }),
      ...(since_id && { since_id }),
      ...(created_at_min && { created_at_min }),
      ...(created_at_max && { created_at_max })
    };

    const result = await shopify.getOrders(options);

    res.json({
      success: result.success,
      data: {
        orders: result.orders,
        totalCount: result.totalOrders,
        breakdown: result.breakdown
      },
      meta: {
        lastUpdated: result.lastUpdated,
        requestParams: options,
        rateLimits: shopify.rateLimits
      },
      ...(result.error && { error: result.error })
    });
  } catch (error) {
    console.error('Shopify orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Shopify orders',
      message: error.message
    });
  }
});

/**
 * GET /api/shopify/products
 * Get products from both Shopify stores
 */
router.get('/products', async (req, res) => {
  try {
    const {
      limit = 50,
      since_id,
      vendor,
      product_type,
      handle
    } = req.query;

    const options = {
      limit: parseInt(limit),
      ...(since_id && { since_id }),
      ...(vendor && { vendor }),
      ...(product_type && { product_type }),
      ...(handle && { handle })
    };

    const result = await shopify.getProducts(options);

    res.json({
      success: result.success,
      data: {
        products: result.products,
        totalCount: result.totalProducts,
        breakdown: result.breakdown
      },
      meta: {
        lastUpdated: result.lastUpdated,
        requestParams: options,
        rateLimits: shopify.rateLimits
      },
      ...(result.error && { error: result.error })
    });
  } catch (error) {
    console.error('Shopify products error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Shopify products',
      message: error.message
    });
  }
});

/**
 * GET /api/shopify/customers
 * Get customers from both Shopify stores
 */
router.get('/customers', async (req, res) => {
  try {
    const {
      limit = 50,
      since_id,
      created_at_min,
      created_at_max
    } = req.query;

    const options = {
      limit: parseInt(limit),
      ...(since_id && { since_id }),
      ...(created_at_min && { created_at_min }),
      ...(created_at_max && { created_at_max })
    };

    const result = await shopify.getCustomers(options);

    res.json({
      success: result.success,
      data: {
        customers: result.customers,
        totalCount: result.totalCustomers,
        breakdown: result.breakdown
      },
      meta: {
        lastUpdated: result.lastUpdated,
        requestParams: options,
        rateLimits: shopify.rateLimits
      },
      ...(result.error && { error: result.error })
    });
  } catch (error) {
    console.error('Shopify customers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Shopify customers',
      message: error.message
    });
  }
});

/**
 * GET /api/shopify/inventory
 * Get inventory levels from both Shopify stores
 */
router.get('/inventory', async (req, res) => {
  try {
    const {
      limit = 50,
      location_ids,
      inventory_item_ids
    } = req.query;

    const options = {
      limit: parseInt(limit),
      ...(location_ids && { location_ids: location_ids.split(',') }),
      ...(inventory_item_ids && { inventory_item_ids: inventory_item_ids.split(',') })
    };

    const result = await shopify.getInventoryLevels(options);

    res.json({
      success: result.success,
      data: {
        inventoryLevels: result.inventoryLevels,
        totalCount: result.totalLevels,
        breakdown: result.breakdown
      },
      meta: {
        lastUpdated: result.lastUpdated,
        requestParams: options,
        rateLimits: shopify.rateLimits
      },
      ...(result.error && { error: result.error })
    });
  } catch (error) {
    console.error('Shopify inventory error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Shopify inventory',
      message: error.message
    });
  }
});

/**
 * GET /api/shopify/analytics
 * Get analytics data from both Shopify stores
 */
router.get('/analytics', async (req, res) => {
  try {
    const {
      start_date,
      end_date
    } = req.query;

    const options = {
      ...(start_date && { start_date }),
      ...(end_date && { end_date })
    };

    const result = await shopify.getAnalytics(options);

    res.json({
      success: result.success,
      data: result.analytics,
      meta: {
        dateRange: result.dateRange,
        lastUpdated: result.lastUpdated,
        requestParams: options
      },
      ...(result.error && { error: result.error })
    });
  } catch (error) {
    console.error('Shopify analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Shopify analytics',
      message: error.message
    });
  }
});

/**
 * POST /api/shopify/webhook/:store
 * Handle Shopify webhooks for real-time updates
 */
router.post('/webhook/:store', async (req, res) => {
  try {
    const { store } = req.params;
    const signature = req.headers['x-shopify-hmac-sha256'];
    const topic = req.headers['x-shopify-topic'];
    const shop = req.headers['x-shopify-shop-domain'];

    if (!['uk', 'usa'].includes(store)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid store parameter'
      });
    }

    // Verify webhook signature
    const body = JSON.stringify(req.body);
    const isValid = shopify.verifyWebhook(body, signature, store);

    if (!isValid) {
      console.error(`Invalid webhook signature for ${store} store`);
      return res.status(401).json({
        success: false,
        error: 'Invalid webhook signature'
      });
    }

    // Process webhook based on topic
    console.log(`Received ${topic} webhook for ${store} store from ${shop}`);

    // Handle different webhook topics
    switch (topic) {
      case 'orders/create':
        console.log(`New order created in ${store} store:`, req.body.id);
        // In production, you would update your database, trigger notifications, etc.
        break;

      case 'orders/updated':
        console.log(`Order updated in ${store} store:`, req.body.id);
        break;

      case 'orders/paid':
        console.log(`Order paid in ${store} store:`, req.body.id);
        break;

      case 'orders/cancelled':
        console.log(`Order cancelled in ${store} store:`, req.body.id);
        break;

      case 'orders/fulfilled':
        console.log(`Order fulfilled in ${store} store:`, req.body.id);
        break;

      case 'products/create':
        console.log(`New product created in ${store} store:`, req.body.id);
        break;

      case 'products/update':
        console.log(`Product updated in ${store} store:`, req.body.id);
        break;

      case 'inventory_levels/update':
        console.log(`Inventory level updated in ${store} store`);
        break;

      default:
        console.log(`Unhandled webhook topic: ${topic} for ${store} store`);
    }

    res.json({
      success: true,
      message: 'Webhook processed successfully',
      data: {
        store,
        topic,
        shop,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Shopify webhook error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process webhook',
      message: error.message
    });
  }
});

/**
 * GET /api/shopify/mock-data
 * Get mock data for development and testing
 */
router.get('/mock-data', (req, res) => {
  try {
    const mockData = shopify.generateMockData();

    res.json({
      success: true,
      data: mockData,
      meta: {
        note: 'This is mock data for development purposes',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Shopify mock data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate mock data',
      message: error.message
    });
  }
});

/**
 * GET /api/shopify/sync/status
 * Get synchronization status
 */
router.get('/sync/status', async (req, res) => {
  try {
    // In production, this would check the last sync times from database
    const syncStatus = {
      lastSync: {
        orders: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
        products: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
        customers: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        inventory: new Date(Date.now() - 2 * 60 * 1000).toISOString() // 2 minutes ago
      },
      syncIntervals: {
        orders: '5 minutes',
        products: '15 minutes',
        customers: '30 minutes',
        inventory: '2 minutes'
      },
      errors: [],
      isHealthy: true
    };

    res.json({
      success: true,
      data: syncStatus,
      meta: {
        timestamp: new Date().toISOString(),
        stores: ['UK', 'USA']
      }
    });
  } catch (error) {
    console.error('Shopify sync status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sync status',
      message: error.message
    });
  }
});

export default router;