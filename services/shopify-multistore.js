import { shopifyApi } from '@shopify/shopify-api';
import redisCacheService from './redis-cache.js';
import { logDebug, logInfo, logWarn, logError } from '../src/utils/logger';


class ShopifyMultiStoreService {
  constructor() {
    this.stores = new Map();
    this.isConnected = false;
    this.syncInterval = null;
    this.syncFrequency = 15 * 60 * 1000; // 15 minutes
    
    this.storeConfigs = [
      {
        id: 'uk_eu_store',
        name: 'Sentia UK/EU Store',
        shopDomain: process.env.SHOPIFY_UK_SHOP_DOMAIN,
        accessToken: process.env.SHOPIFY_UK_ACCESS_TOKEN,
        apiVersion: '2024-01',
        region: 'uk_eu',
        currency: 'GBP'
      },
      {
        id: 'us_store',
        name: 'Sentia US Store', 
        shopDomain: process.env.SHOPIFY_US_SHOP_DOMAIN,
        accessToken: process.env.SHOPIFY_US_ACCESS_TOKEN,
        apiVersion: '2024-01',
        region: 'us',
        currency: 'USD'
      }
    ];
  }

  async connect() {
    try {
      logDebug('SHOPIFY: Initializing multi-store connections...');
      
      for (const config of this.storeConfigs) {
        if (!config.shopDomain || !config.accessToken) {
          logWarn(`SHOPIFY: Missing credentials for ${config.name}, skipping`);
          continue;
        }

        try {
          const client = new shopifyApi.clients.Rest({
            session: {
              shop: config.shopDomain,
              accessToken: config.accessToken
            },
            apiVersion: config.apiVersion
          });

          const shopResponse = await client.get({
            path: 'shop'
          });

          if (shopResponse && shopResponse.body && shopResponse.body.shop) {
            this.stores.set(config.id, {
              ...config,
              client,
              shopInfo: shopResponse.body.shop,
              lastSync: null,
              isActive: true
            });
            
            logDebug(`SHOPIFY: Connected to ${config.name} (${config.shopDomain})`);
          }
        } catch (storeError) {
          logError(`SHOPIFY: Failed to connect to ${config.name}:`, storeError.message);
          this.stores.set(config.id, {
            ...config,
            client: null,
            shopInfo: null,
            lastSync: null,
            isActive: false,
            error: storeError.message
          });
        }
      }

      this.isConnected = this.stores.size > 0;
      
      if (this.isConnected) {
        logDebug(`SHOPIFY: Successfully connected to ${this.stores.size} stores`);
        await this.startSyncScheduler();
      } else {
        logError('SHOPIFY: No stores connected successfully');
      }

      return this.isConnected;
    } catch (error) {
      logError('SHOPIFY: Connection initialization failed:', error);
      return false;
    }
  }

  async startSyncScheduler() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    logDebug(`SHOPIFY: Starting sync scheduler (every ${this.syncFrequency / 1000 / 60} minutes)`);
    
    // Initial sync
    await this.syncAllStores();

    // Schedule regular syncs
    this.syncInterval = setInterval(async _() => {
      try {
        await this.syncAllStores();
      } catch (error) {
        logError('SHOPIFY: Scheduled sync failed:', error);
      }
    }, this.syncFrequency);
  }

  async syncAllStores() {
    if (!this.isConnected) {
      // SHOPIFY: Not connected - using mock data
      return;
    }

    logDebug('SHOPIFY: Starting multi-store sync...');
    const syncResults = [];

    for (const [storeId, store] of this.stores.entries()) {
      if (!store.isActive || !store.client) {
        logWarn(`SHOPIFY: Skipping inactive store ${store.name}`);
        continue;
      }

      try {
        const storeData = await this.syncStore(storeId);
        syncResults.push({
          storeId,
          success: true,
          data: storeData,
          syncTime: new Date().toISOString()
        });

        store.lastSync = new Date().toISOString();
        logDebug(`SHOPIFY: Synced ${store.name} successfully`);

      } catch (error) {
        logError(`SHOPIFY: Sync failed for ${store.name}:`, error);
        syncResults.push({
          storeId,
          success: false,
          error: error.message,
          syncTime: new Date().toISOString()
        });
      }
    }

    // Cache consolidated data
    const consolidatedData = this.consolidateStoreData(syncResults);
    await redisCacheService.set('shopify:consolidated_data', consolidatedData, 1800); // 30 min cache

    logDebug(`SHOPIFY: Sync completed. ${syncResults.filter(r => r.success).length}/${syncResults.length} stores synced successfully`);
    return consolidatedData;
  }

  async syncStore(storeId) {
    const store = this.stores.get(storeId);
    if (!store || !store.client) {
      throw new Error(`Store ${storeId} not found or inactive`);
    }

    const storeData = {
      id: storeId,
      name: store.name,
      region: store.region,
      currency: store.currency,
      sales: 0,
      orders: 0,
      customers: 0,
      avgOrderValue: 0,
      products: [],
      recentOrders: [],
      status: 'active'
    };

    try {
      // Get orders from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const ordersResponse = await store.client.get({
        path: 'orders',
        query: {
          status: 'any',
          created_at_min: thirtyDaysAgo.toISOString(),
          limit: 250,
          financial_status: 'paid'
        }
      });

      if (ordersResponse.body && ordersResponse.body.orders) {
        const orders = ordersResponse.body.orders;
        storeData.orders = orders.length;
        storeData.sales = orders.reduce((sum, order) => sum + parseFloat(order.total_price || 0), 0);
        storeData.avgOrderValue = storeData.orders > 0 ? storeData.sales / storeData.orders : 0;
        storeData.recentOrders = orders.slice(0, 10).map(order => ({
          id: order.id,
          orderNumber: order.order_number,
          totalPrice: parseFloat(order.total_price),
          currency: order.currency,
          createdAt: order.created_at,
          customerEmail: order.customer?.email
        }));
      }

      // Get customer count
      const customersResponse = await store.client.get({
        path: 'customers/count'
      });

      if (customersResponse.body && customersResponse.body.count) {
        storeData.customers = customersResponse.body.count;
      }

      // Get top products
      const productsResponse = await store.client.get({
        path: 'products',
        query: {
          limit: 50,
          published_status: 'published'
        }
      });

      if (productsResponse.body && productsResponse.body.products) {
        storeData.products = productsResponse.body.products.map(product => ({
          id: product.id,
          title: product.title,
          handle: product.handle,
          status: product.status,
          inventory: product.variants?.reduce((sum, variant) => 
            sum + (variant.inventory_quantity || 0), 0) || 0,
          price: product.variants?.[0]?.price || 0
        }));
      }

      // Cache individual store data
      const cacheKey = redisCacheService.generateCacheKey('shopify', 'store', storeId);
      await redisCacheService.set(cacheKey, storeData, 1800); // 30 min cache

      return storeData;

    } catch (error) {
      logError(`SHOPIFY: Error syncing ${store.name}:`, error);
      throw error;
    }
  }

  consolidateStoreData(syncResults) {
    const successfulSyncs = syncResults.filter(result => result.success);
    
    if (successfulSyncs.length === 0) {
      return {
        stores: [],
        totalSales: 0,
        totalOrders: 0,
        totalCustomers: 0,
        avgOrderValue: 0,
        syncStatus: {
          inSync: false,
          pendingItems: 0,
          lastSync: new Date().toISOString()
        },
        lastUpdated: new Date().toISOString()
      };
    }

    const stores = successfulSyncs.map(sync => sync.data);
    
    const consolidated = {
      stores,
      totalSales: stores.reduce((sum, store) => sum + store.sales, 0),
      totalOrders: stores.reduce((sum, store) => sum + store.orders, 0), 
      totalCustomers: stores.reduce((sum, store) => sum + store.customers, 0),
      avgOrderValue: 0,
      syncStatus: {
        inSync: syncResults.every(r => r.success),
        pendingItems: syncResults.filter(r => !r.success).length,
        lastSync: new Date().toISOString()
      },
      lastUpdated: new Date().toISOString()
    };

    consolidated.avgOrderValue = consolidated.totalOrders > 0 
      ? consolidated.totalSales / consolidated.totalOrders 
      : 0;

    return consolidated;
  }

  async getConsolidatedData() {
    try {
      // Try cache first
      const cached = await redisCacheService.get('shopify:consolidated_data');
      if (cached) {
        return cached;
      }

      // If no cache, trigger sync
      logDebug('SHOPIFY: No cached data, triggering sync...');
      return await this.syncAllStores();
      
    } catch (error) {
      logError('SHOPIFY: Error getting consolidated data:', error);
      return {
        error: error.message,
        stores: [],
        totalSales: 0,
        totalOrders: 0,
        totalCustomers: 0,
        avgOrderValue: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  async getStoreData(storeId) {
    try {
      const cacheKey = redisCacheService.generateCacheKey('shopify', 'store', storeId);
      const cached = await redisCacheService.get(cacheKey);
      
      if (cached) {
        return cached;
      }

      // If no cache and store exists, sync it
      if (this.stores.has(storeId)) {
        return await this.syncStore(storeId);
      }

      throw new Error(`Store ${storeId} not found`);
      
    } catch (error) {
      logError(`SHOPIFY: Error getting store data for ${storeId}:`, error);
      return { error: error.message };
    }
  }

  async getProductPerformance(params = {}) {
    try {
      logInfo('SHOPIFY: Getting product performance data', params);
      
      if (!this.isConnected) {
        throw new Error('Shopify multistore service not connected. Call connect() first.');
      }

      const { startDate, endDate, limit = 50 } = params;
      const performanceData = {
        products: [],
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        dateRange: {
          start: startDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
          end: endDate || new Date().toISOString()
        },
        lastUpdated: new Date().toISOString(),
        storeErrors: []
      };

      for (const [storeId, store] of this.stores.entries()) {
        if (!store.isActive || !store.client) {
          logWarn(`SHOPIFY: Skipping inactive store ${store.name} for performance data`);
          performanceData.storeErrors.push({
            storeId,
            storeName: store.name,
            error: 'Store not active or client not available'
          });
          continue;
        }

        try {
          // Get orders with line items for the specified period
          const ordersResponse = await store.client.get({
            path: 'orders',
            query: {
              status: 'any',
              financial_status: 'paid',
              created_at_min: performanceData.dateRange.start,
              created_at_max: performanceData.dateRange.end,
              limit: 250,
              fields: 'id,line_items,total_price,currency,created_at'
            }
          });

          if (!ordersResponse.body || !ordersResponse.body.orders) {
            throw new Error(`Invalid orders response from ${store.name}`);
          }

          const orders = ordersResponse.body.orders;
          const productSales = new Map();

          // Process each order to calculate product performance
          orders.forEach(order => {
            const orderValue = parseFloat(order.total_price || 0);
            performanceData.totalRevenue += orderValue;
            performanceData.totalOrders += 1;

            if (order.line_items && Array.isArray(order.line_items)) {
              order.line_items.forEach(item => {
                const productId = item.product_id?.toString();
                if (!productId) return;

                const quantity = parseInt(item.quantity || 0);
                const price = parseFloat(item.price || 0);
                const revenue = quantity * price;

                if (productSales.has(productId)) {
                  const existing = productSales.get(productId);
                  existing.unitsSold += quantity;
                  existing.revenue += revenue;
                } else {
                  productSales.set(productId, {
                    id: productId,
                    title: item.title || item.name || 'Unknown Product',
                    sku: item.sku || null,
                    unitsSold: quantity,
                    revenue: revenue,
                    currency: order.currency || store.currency,
                    storeId: store.id,
                    storeName: store.name
                  });
                }
              });
            }
          });

          // Add products from this store to the overall results
          for (const product of productSales.values()) {
            performanceData.products.push(product);
          }

          logInfo(`SHOPIFY: Retrieved performance data for ${store.name}: ${orders.length} orders, ${productSales.size} products`);

        } catch (storeError) {
          logError(`SHOPIFY: Failed to get performance data from ${store.name}:`, storeError);
          performanceData.storeErrors.push({
            storeId,
            storeName: store.name,
            error: storeError.message,
            details: storeError.response?.data || null
          });
        }
      }

      // Sort products by revenue and apply limit
      performanceData.products.sort((a, b) => b.revenue - a.revenue);
      if (limit) {
        performanceData.products = performanceData.products.slice(0, limit);
      }

      // Calculate final metrics
      performanceData.averageOrderValue = performanceData.totalOrders > 0 
        ? performanceData.totalRevenue / performanceData.totalOrders 
        : 0;

      // Check if we have any data
      if (performanceData.products.length === 0 && performanceData.storeErrors.length > 0) {
        throw new Error(`No product performance data available. Store errors: ${performanceData.storeErrors.map(e => `${e.storeName}: ${e.error}`).join('; ')}`);
      }

      logInfo(`SHOPIFY: Product performance retrieved successfully: ${performanceData.products.length} products, £${performanceData.totalRevenue.toFixed(2)} revenue`);
      return performanceData;

    } catch (error) {
      logError('SHOPIFY: Error getting product performance:', error);
      throw new Error(`Failed to retrieve product performance data: ${error.message}`);
    }
  }

  async getInventorySync() {
    const consolidated = await this.getConsolidatedData();
    
    if (consolidated.error) {
      return { error: consolidated.error };
    }

    const inventoryByProduct = new Map();
    
    consolidated.stores.forEach(store => {
      store.products.forEach(product => {
        const key = product.handle || product.title.toLowerCase().replace(/\s+/g, '-');
        
        if (inventoryByProduct.has(key)) {
          const existing = inventoryByProduct.get(key);
          existing.totalInventory += product.inventory;
          existing.stores.push({
            storeId: store.id,
            storeName: store.name,
            inventory: product.inventory,
            price: product.price,
            currency: store.currency
          });
        } else {
          inventoryByProduct.set(key, {
            productHandle: key,
            productTitle: product.title,
            totalInventory: product.inventory,
            stores: [{
              storeId: store.id,
              storeName: store.name,
              inventory: product.inventory,
              price: product.price,
              currency: store.currency
            }]
          });
        }
      });
    });

    return {
      products: Array.from(inventoryByProduct.values()),
      syncTime: consolidated.lastUpdated,
      storeCount: consolidated.stores.length
    };
  }

  getConnectionStatus() {
    const storeStatuses = Array.from(this.stores.values()).map(store => ({
      id: store.id,
      name: store.name,
      region: store.region,
      isActive: store.isActive,
      lastSync: store.lastSync,
      error: store.error || null
    }));

    return {
      connected: this.isConnected,
      totalStores: this.stores.size,
      activeStores: storeStatuses.filter(s => s.isActive).length,
      stores: storeStatuses,
      syncRunning: this.syncInterval !== null
    };
  }

  async disconnect() {
    try {
      if (this.syncInterval) {
        clearInterval(this.syncInterval);
        this.syncInterval = null;
      }

      this.stores.clear();
      this.isConnected = false;
      
      logDebug('SHOPIFY: Disconnected from all stores');
    } catch (error) {
      logError('SHOPIFY: Disconnect error:', error);
    }
  }
}

const shopifyMultiStoreService = new ShopifyMultiStoreService();

export default shopifyMultiStoreService;