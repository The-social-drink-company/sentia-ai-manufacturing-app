import express from 'express';
import rateLimit from 'express-rate-limit';
import shopifyMultiStoreService from '../shopify-multistore.js';

const router = express.Router();

// Rate limiting for Shopify API routes
const shopifyRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests to Shopify API',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(shopifyRateLimit);

// Get consolidated multi-store data
router.get('/consolidated', async (req, res) => {
  try {
    const data = await shopifyMultiStoreService.getConsolidatedData();
    
    if (data.error) {
      return res.status(500).json({
        error: data.error,
        message: 'Failed to fetch Shopify consolidated data'
      });
    }

    const response = {
      stores: data.stores.map(store => ({
        id: store.id,
        name: store.name,
        region: store.region,
        currency: store.currency,
        sales: store.sales,
        orders: store.orders,
        customers: store.customers,
        avgOrderValue: store.avgOrderValue,
        status: store.status
      })),
      totalSales: data.totalSales,
      totalOrders: data.totalOrders,
      totalCustomers: data.totalCustomers,
      avgOrderValue: data.avgOrderValue,
      syncStatus: data.syncStatus,
      lastUpdated: data.lastUpdated
    };

    res.json(response);
  } catch (error) {
    console.error('SHOPIFY API: Consolidated data error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process Shopify consolidated data'
    });
  }
});

// Get specific store data
router.get('/store/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;
    const data = await shopifyMultiStoreService.getStoreData(storeId);
    
    if (data.error) {
      return res.status(404).json({
        error: data.error,
        message: `Store ${storeId} not found or unavailable`
      });
    }

    res.json(data);
  } catch (error) {
    console.error(`SHOPIFY API: Store data error for ${req.params.storeId}:`, error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch store data'
    });
  }
});

// Get inventory synchronization data
router.get('/inventory-sync', async (req, res) => {
  try {
    const data = await shopifyMultiStoreService.getInventorySync();
    
    if (data.error) {
      return res.status(500).json({
        error: data.error,
        message: 'Failed to fetch inventory sync data'
      });
    }

    res.json(data);
  } catch (error) {
    console.error('SHOPIFY API: Inventory sync error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process inventory sync data'
    });
  }
});

// Get sales analytics across all stores
router.get('/sales-analytics', async (req, res) => {
  try {
    const data = await shopifyMultiStoreService.getConsolidatedData();
    
    if (data.error) {
      return res.status(500).json({
        error: data.error,
        message: 'Failed to fetch sales analytics'
      });
    }

    const analytics = {
      totalSales: data.totalSales,
      totalOrders: data.totalOrders,
      avgOrderValue: data.avgOrderValue,
      storeBreakdown: data.stores.map(store => ({
        storeId: store.id,
        storeName: store.name,
        region: store.region,
        currency: store.currency,
        sales: store.sales,
        orders: store.orders,
        avgOrderValue: store.avgOrderValue,
        salesPercentage: data.totalSales > 0 ? (store.sales / data.totalSales * 100).toFixed(2) : 0
      })),
      topPerformingStore: data.stores.reduce((top, store) => 
        store.sales > (top?.sales || 0) ? store : top, null),
      lastUpdated: data.lastUpdated
    };

    res.json(analytics);
  } catch (error) {
    console.error('SHOPIFY API: Sales analytics error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process sales analytics'
    });
  }
});

// Get recent orders across all stores
router.get('/recent-orders', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const data = await shopifyMultiStoreService.getConsolidatedData();
    
    if (data.error) {
      return res.status(500).json({
        error: data.error,
        message: 'Failed to fetch recent orders'
      });
    }

    const allOrders = [];
    data.stores.forEach(store => {
      if (store.recentOrders) {
        store.recentOrders.forEach(order => {
          allOrders.push({
            ...order,
            storeId: store.id,
            storeName: store.name,
            region: store.region
          });
        });
      }
    });

    // Sort by creation date (newest first) and limit
    const recentOrders = allOrders
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);

    res.json({
      orders: recentOrders,
      totalCount: allOrders.length,
      returnedCount: recentOrders.length,
      lastUpdated: data.lastUpdated
    });
  } catch (error) {
    console.error('SHOPIFY API: Recent orders error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch recent orders'
    });
  }
});

// Get connection status
router.get('/status', async (req, res) => {
  try {
    const status = shopifyMultiStoreService.getConnectionStatus();
    res.json(status);
  } catch (error) {
    console.error('SHOPIFY API: Status error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get connection status'
    });
  }
});

// Trigger manual sync for all stores
router.post('/sync', async (req, res) => {
  try {
    console.log('SHOPIFY API: Manual sync triggered');
    const data = await shopifyMultiStoreService.syncAllStores();
    
    res.json({
      message: 'Sync completed successfully',
      data,
      syncTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('SHOPIFY API: Manual sync error:', error);
    res.status(500).json({
      error: 'Sync failed',
      message: error.message
    });
  }
});

// Trigger manual sync for specific store
router.post('/sync/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;
    console.log(`SHOPIFY API: Manual sync triggered for store ${storeId}`);
    
    const data = await shopifyMultiStoreService.syncStore(storeId);
    
    res.json({
      message: `Store ${storeId} synced successfully`,
      data,
      syncTime: new Date().toISOString()
    });
  } catch (error) {
    console.error(`SHOPIFY API: Manual sync error for ${req.params.storeId}:`, error);
    res.status(500).json({
      error: 'Store sync failed',
      message: error.message
    });
  }
});

// Get product performance across stores
router.get('/product-performance', async (req, res) => {
  try {
    const data = await shopifyMultiStoreService.getConsolidatedData();
    
    if (data.error) {
      return res.status(500).json({
        error: data.error,
        message: 'Failed to fetch product performance data'
      });
    }

    const productPerformance = {};
    
    data.stores.forEach(store => {
      store.products?.forEach(product => {
        const key = product.handle || product.title;
        if (!productPerformance[key]) {
          productPerformance[key] = {
            title: product.title,
            handle: product.handle,
            totalInventory: 0,
            averagePrice: 0,
            storeCount: 0,
            stores: []
          };
        }

        productPerformance[key].totalInventory += product.inventory || 0;
        productPerformance[key].averagePrice += parseFloat(product.price) || 0;
        productPerformance[key].storeCount += 1;
        productPerformance[key].stores.push({
          storeId: store.id,
          storeName: store.name,
          inventory: product.inventory,
          price: product.price,
          currency: store.currency
        });
      });
    });

    // Calculate average prices
    Object.values(productPerformance).forEach(product => {
      if (product.storeCount > 0) {
        product.averagePrice = product.averagePrice / product.storeCount;
      }
    });

    res.json({
      products: Object.values(productPerformance),
      totalProducts: Object.keys(productPerformance).length,
      lastUpdated: data.lastUpdated
    });
  } catch (error) {
    console.error('SHOPIFY API: Product performance error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process product performance data'
    });
  }
});

export default router;