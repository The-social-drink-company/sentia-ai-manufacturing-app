import express from 'express';
import amazonSPAPIService from '../amazon-sp-api.js';
import { auth } from '../../middleware/auth.js';
import { rateLimit } from 'express-rate-limit';

const router = express.Router();

// Rate limiting for Amazon API endpoints
const amazonRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many Amazon API requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting and authentication to all Amazon routes
router.use(amazonRateLimit);
router.use(auth);

/**
 * GET /api/amazon/inventory
 * Get real-time inventory data from Amazon SP-API
 */
router.get('/inventory', async (req, res) => {
  try {
    console.log('📦 API Request: Amazon inventory data');
    
    if (!amazonSPAPIService.isConnected) {
      return res.status(503).json({
        error: 'Amazon SP-API service not connected',
        message: 'Please check Amazon SP-API credentials and try again'
      });
    }

    const inventorySummary = await amazonSPAPIService.getInventorySummary();
    
    // Transform data for frontend widget
    const response = {
      inventory: {
        total: inventorySummary.totalQuantity,
        lowStock: inventorySummary.lowStockItems,
        totalSKUs: inventorySummary.totalSKUs
      },
      lastUpdated: inventorySummary.lastSync,
      status: 'connected'
    };

    res.json(response);
    
  } catch (error) {
    console.error('❌ Amazon inventory API error:', error);
    res.status(500).json({
      error: 'Failed to fetch Amazon inventory data',
      message: error.message,
      status: 'error'
    });
  }
});

/**
 * GET /api/amazon/orders
 * Get real-time order data from Amazon SP-API
 */
router.get('/orders', async (req, res) => {
  try {
    console.log('📋 API Request: Amazon order data');
    
    if (!amazonSPAPIService.isConnected) {
      return res.status(503).json({
        error: 'Amazon SP-API service not connected'
      });
    }

    const orderMetrics = await amazonSPAPIService.getOrderMetrics();
    
    const response = {
      orders: {
        total: orderMetrics.totalOrders,
        revenue: orderMetrics.totalRevenue,
        averageOrderValue: orderMetrics.averageOrderValue,
        unshipped: orderMetrics.unshippedOrders
      },
      lastUpdated: new Date().toISOString(),
      status: 'connected'
    };

    res.json(response);
    
  } catch (error) {
    console.error('❌ Amazon orders API error:', error);
    res.status(500).json({
      error: 'Failed to fetch Amazon order data',
      message: error.message
    });
  }
});

/**
 * GET /api/amazon/sales-velocity
 * Calculate sales velocity from Amazon data
 */
router.get('/sales-velocity', async (req, res) => {
  try {
    console.log('📈 API Request: Amazon sales velocity');
    
    const orderMetrics = await amazonSPAPIService.getOrderMetrics();
    const inventorySummary = await amazonSPAPIService.getInventorySummary();
    
    // Calculate sales velocity (units sold per day)
    const salesVelocity = orderMetrics.totalOrders > 0 ? 
      orderMetrics.totalOrders / 1 : 0; // Orders per day (last 24 hours)
    
    const response = {
      sales: {
        velocity: salesVelocity,
        totalRevenue: orderMetrics.totalRevenue,
        averageOrderValue: orderMetrics.averageOrderValue
      },
      inventory: {
        totalStock: inventorySummary.totalQuantity,
        daysCoverage: salesVelocity > 0 ? Math.round(inventorySummary.totalQuantity / salesVelocity) : 0
      },
      lastUpdated: new Date().toISOString()
    };

    res.json(response);
    
  } catch (error) {
    console.error('❌ Amazon sales velocity API error:', error);
    res.status(500).json({
      error: 'Failed to calculate sales velocity',
      message: error.message
    });
  }
});

/**
 * GET /api/amazon/fba
 * Get FBA stock and shipment data
 */
router.get('/fba', async (req, res) => {
  try {
    console.log('🚚 API Request: Amazon FBA data');
    
    // In a real implementation, this would query the FBA shipments table
    const fbaData = {
      stock: Math.floor(Math.random() * 5000) + 1000, // Placeholder until full database implementation
      inboundShipments: Math.floor(Math.random() * 10) + 1,
      pendingShipments: Math.floor(Math.random() * 5),
      lastUpdated: new Date().toISOString()
    };

    res.json({ fba: fbaData });
    
  } catch (error) {
    console.error('❌ Amazon FBA API error:', error);
    res.status(500).json({
      error: 'Failed to fetch FBA data',
      message: error.message
    });
  }
});

/**
 * GET /api/amazon/reorder-alerts
 * Get reorder alerts based on inventory levels and sales velocity
 */
router.get('/reorder-alerts', async (req, res) => {
  try {
    console.log('🚨 API Request: Amazon reorder alerts');
    
    // This would query the database for low stock items and calculate reorder points
    const alerts = [
      {
        sku: 'SENTIA-SPIRITS-001',
        currentStock: 8,
        reorderPoint: 20,
        daysOfStock: 3,
        priority: 'HIGH'
      },
      {
        sku: 'SENTIA-SPIRITS-002', 
        currentStock: 15,
        reorderPoint: 25,
        daysOfStock: 5,
        priority: 'MEDIUM'
      }
    ];

    res.json({
      reorderAlerts: alerts,
      totalAlerts: alerts.length,
      highPriorityAlerts: alerts.filter(alert => alert.priority === 'HIGH').length,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Amazon reorder alerts API error:', error);
    res.status(500).json({
      error: 'Failed to fetch reorder alerts',
      message: error.message
    });
  }
});

/**
 * POST /api/amazon/sync
 * Manually trigger Amazon data sync
 */
router.post('/sync', async (req, res) => {
  try {
    console.log('🔄 API Request: Manual Amazon sync');
    
    if (!amazonSPAPIService.isConnected) {
      return res.status(503).json({
        error: 'Amazon SP-API service not connected'
      });
    }

    // Trigger full sync
    amazonSPAPIService.performFullSync();
    
    res.json({
      message: 'Amazon data sync triggered successfully',
      timestamp: new Date().toISOString(),
      status: 'syncing'
    });
    
  } catch (error) {
    console.error('❌ Amazon sync API error:', error);
    res.status(500).json({
      error: 'Failed to trigger Amazon sync',
      message: error.message
    });
  }
});

/**
 * GET /api/amazon/status
 * Get Amazon SP-API connection status
 */
router.get('/status', async (req, res) => {
  try {
    const status = {
      connected: amazonSPAPIService.isConnected,
      lastSync: new Date().toISOString(),
      service: 'Amazon SP-API',
      region: process.env.AMAZON_REGION || 'us-east-1'
    };

    res.json(status);
    
  } catch (error) {
    console.error('❌ Amazon status API error:', error);
    res.status(500).json({
      error: 'Failed to get Amazon status',
      message: error.message
    });
  }
});

export default router;