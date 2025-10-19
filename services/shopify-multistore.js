import '@shopify/shopify-api/adapters/node';
import { shopifyApi, ApiVersion } from '@shopify/shopify-api';
import redisCacheService from './redis-cache.js';
import { logDebug, logInfo, logWarn, logError } from './logger.js';
import sseService from '../server/services/sse/index.cjs';


class ShopifyMultiStoreService {
  constructor() {
    this.stores = new Map();
    this.isConnected = false;
    this.syncInterval = null;
    this.syncFrequency = 15 * 60 * 1000; // 15 minutes
    this.shopify = null;
    
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
      
      // Initialize Shopify API if not already done
      if (!this.shopify) {
        this.shopify = shopifyApi({
          apiKey: 'not-needed-for-private-apps',
          apiSecretKey: 'not-needed-for-private-apps',
          scopes: ['read_orders', 'read_products', 'read_customers'],
          hostName: 'localhost', // Not used for direct API calls
          apiVersion: ApiVersion.January24
        });
      }
      
      for (const config of this.storeConfigs) {
        if (!config.shopDomain || !config.accessToken) {
          logWarn(`SHOPIFY: Missing credentials for ${config.name}, skipping`);
          continue;
        }

        try {
          // Create a session for this store
          const session = {
            id: `${config.id}-session`,
            shop: config.shopDomain,
            state: 'active',
            isOnline: false,
            accessToken: config.accessToken,
            scope: 'read_orders,read_products,read_customers'
          };

          const client = new this.shopify.clients.Rest({ session });

          const shopResponse = await client.get({
            path: 'shop'
          });

          if (shopResponse && shopResponse.body && shopResponse.body.shop) {
            this.stores.set(config.id, {
              ...config,
              client,
              session,
              shopInfo: shopResponse.body.shop,
              lastSync: null,
              isActive: true
            });
            
            logInfo(`SHOPIFY: Connected to ${config.name} (${config.shopDomain})`);
          }
        } catch (storeError) {
          logError(`SHOPIFY: Failed to connect to ${config.name}:`, storeError.message);
          this.stores.set(config.id, {
            ...config,
            client: null,
            session: null,
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
    this.syncInterval = setInterval(async () => {
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

    const syncStartTime = Date.now();
    logDebug('SHOPIFY: Starting multi-store sync...');

    // Emit sync started event
    sseService.emitShopifySyncStarted({
      totalStores: this.stores.size,
      activeStores: Array.from(this.stores.values()).filter(s => s.isActive).length,
      timestamp: new Date().toISOString()
    });

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

        // Emit store synced event
        sseService.emitShopifyStoreSynced({
          storeId,
          storeName: store.name,
          region: store.region,
          orders: storeData.orders,
          revenue: storeData.sales,
          netRevenue: storeData.netSales,
          transactionFees: storeData.transactionFees,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        logError(`SHOPIFY: Sync failed for ${store.name}:`, error);
        syncResults.push({
          storeId,
          success: false,
          error: error.message,
          syncTime: new Date().toISOString()
        });

        // Emit sync error event
        sseService.emitShopifySyncError({
          storeId,
          storeName: store.name,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Cache consolidated data
    const consolidatedData = this.consolidateStoreData(syncResults);
    await redisCacheService.set('shopify:consolidated_data', consolidatedData, 1800); // 30 min cache

    const syncDuration = Date.now() - syncStartTime;
    const successCount = syncResults.filter(r => r.success).length;
    const totalCount = syncResults.length;

    logDebug(`SHOPIFY: Sync completed. ${successCount}/${totalCount} stores synced successfully in ${syncDuration}ms`);

    // Emit sync completed event
    sseService.emitShopifySyncCompleted({
      totalStores: totalCount,
      successfulStores: successCount,
      failedStores: totalCount - successCount,
      totalRevenue: consolidatedData.totalSales || 0,
      totalNetRevenue: consolidatedData.totalNetSales || 0,
      totalTransactionFees: consolidatedData.totalTransactionFees || 0,
      totalOrders: consolidatedData.totalOrders || 0,
      syncDuration,
      timestamp: new Date().toISOString()
    });

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
        const grossSales = orders.reduce((sum, order) => sum + parseFloat(order.total_price || 0), 0);
        const transactionFeeRate = 0.029; // 2.9% Shopify transaction fee
        const transactionFees = grossSales * transactionFeeRate;
        const netSales = grossSales - transactionFees;

        storeData.orders = orders.length;
        storeData.sales = grossSales;
        storeData.netSales = netSales;
        storeData.transactionFees = transactionFees;
        storeData.feeRate = transactionFeeRate;
        storeData.avgOrderValue = storeData.orders > 0 ? storeData.sales / storeData.orders : 0;
        storeData.avgNetOrderValue = storeData.orders > 0 ? netSales / storeData.orders : 0;
        storeData.commission = {
          grossRevenue: grossSales,
          transactionFees: transactionFees,
          netRevenue: netSales,
          effectiveMargin: grossSales > 0 ? netSales / grossSales : 0,
          feeImpact: `${(transactionFeeRate * 100).toFixed(1)}% Shopify fees`
        };
        storeData.recentOrders = orders.slice(0, 10).map(order => ({
          id: order.id,
          orderNumber: order.order_number,
          totalPrice: parseFloat(order.total_price),
          netPrice: parseFloat(order.total_price) * (1 - transactionFeeRate),
          transactionFee: parseFloat(order.total_price) * transactionFeeRate,
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
    
    const totalGrossSales = stores.reduce((sum, store) => sum + (store.sales || 0), 0);
    const totalNetSales = stores.reduce((sum, store) => sum + (store.netSales || 0), 0);
    const totalTransactionFees = stores.reduce((sum, store) => sum + (store.transactionFees || 0), 0);
    const totalOrders = stores.reduce((sum, store) => sum + store.orders, 0);

    const consolidated = {
      stores,
      totalSales: totalGrossSales,
      totalNetSales: totalNetSales,
      totalTransactionFees: totalTransactionFees,
      totalOrders: totalOrders, 
      totalCustomers: stores.reduce((sum, store) => sum + store.customers, 0),
      avgOrderValue: totalOrders > 0 ? totalGrossSales / totalOrders : 0,
      avgNetOrderValue: totalOrders > 0 ? totalNetSales / totalOrders : 0,
      commission: {
        totalTransactionFees: totalTransactionFees,
        effectiveMargin: totalGrossSales > 0 ? totalNetSales / totalGrossSales : 0,
        feeRate: 0.029,
        totalFeeImpact: `£${totalTransactionFees.toFixed(2)} in Shopify transaction fees`
      },
      syncStatus: {
        inSync: syncResults.every(r => r.success),
        pendingItems: syncResults.filter(r => !r.success).length,
        lastSync: new Date().toISOString()
      },
      lastUpdated: new Date().toISOString()
    };

    // avgOrderValue already calculated above

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

  async getConsolidatedSalesData(params = {}) {
    try {
      logDebug('SHOPIFY: Getting consolidated sales data...');
      
      // Use the existing consolidated data method
      const consolidatedData = await this.getConsolidatedData();
      
      if (consolidatedData.error) {
        logWarn('SHOPIFY: Error in consolidated data:', consolidatedData.error);
        return {
          success: false,
          error: consolidatedData.error,
          totalRevenue: 0,
          totalOrders: 0,
          totalCustomers: 0,
          avgOrderValue: 0,
          dataSource: 'shopify_multistore',
          lastUpdated: new Date().toISOString()
        };
      }

      // Calculate commission impact (2.9% Shopify transaction fees)
      const grossRevenue = consolidatedData.totalSales || 0;
      const transactionFeeRate = 0.029; // 2.9% Shopify transaction fee
      const transactionFees = grossRevenue * transactionFeeRate;
      const netRevenue = grossRevenue - transactionFees;

      // Transform the data to match expected structure
      return {
        success: true,
        totalRevenue: grossRevenue,
        netRevenue: netRevenue,
        transactionFees: transactionFees,
        feeRate: transactionFeeRate,
        totalOrders: consolidatedData.totalOrders || 0,
        totalCustomers: consolidatedData.totalCustomers || 0,
        avgOrderValue: consolidatedData.avgOrderValue || 0,
        avgNetOrderValue: consolidatedData.totalOrders > 0 ? netRevenue / consolidatedData.totalOrders : 0,
        stores: consolidatedData.stores || [],
        commission: {
          shopifyTransactionFees: transactionFees,
          effectiveMargin: netRevenue / Math.max(grossRevenue, 1),
          feeImpact: `${(transactionFeeRate * 100).toFixed(1)}% transaction fees applied`
        },
        dataSource: 'shopify_multistore',
        lastUpdated: consolidatedData.lastUpdated || new Date().toISOString()
      };
      
    } catch (error) {
      logError('SHOPIFY: Error getting consolidated sales data:', error.message);
      return {
        success: false,
        error: error.message,
        totalRevenue: 0,
        totalOrders: 0,
        totalCustomers: 0,
        avgOrderValue: 0,
        dataSource: 'shopify_multistore_error',
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
        totalUnitsSold: 0,
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

      // Calculate total units sold across all products
      performanceData.totalUnitsSold = performanceData.products.reduce((total, product) => {
        return total + (product.unitsSold || 0);
      }, 0);

      // Check if we have any data
      if (performanceData.products.length === 0 && performanceData.storeErrors.length > 0) {
        throw new Error(`No product performance data available. Store errors: ${performanceData.storeErrors.map(e => `${e.storeName}: ${e.error}`).join('; ')}`);
      }

      logInfo(`SHOPIFY: Product performance retrieved successfully: ${performanceData.products.length} products, ${performanceData.totalUnitsSold} units sold, £${performanceData.totalRevenue.toFixed(2)} revenue`);
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

  async getSalesTrends(params = {}) {
    try {
      logDebug('SHOPIFY: Getting sales trends data...', params);
      
      if (!this.isConnected) {
        throw new Error('Shopify multistore service not connected. Call connect() first.');
      }

      const { period = '12months', includeQuantity = true } = params;
      
      // Calculate date range based on period
      let daysBack = 365; // 12 months default
      if (period === '6months') daysBack = 180;
      if (period === '3months') daysBack = 90;
      if (period === '1month') daysBack = 30;
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);
      
      const trendsData = [];
      const monthlyData = new Map();
      
      for (const [storeId, store] of this.stores.entries()) {
        if (!store.isActive || !store.client) {
          logWarn(`SHOPIFY: Skipping inactive store ${store.name} for trends data`);
          continue;
        }

        try {
          const ordersResponse = await store.client.get({
            path: 'orders',
            query: {
              status: 'any',
              financial_status: 'paid',
              created_at_min: startDate.toISOString(),
              limit: 250,
              fields: 'id,line_items,total_price,currency,created_at'
            }
          });

          if (ordersResponse.body && ordersResponse.body.orders) {
            const orders = ordersResponse.body.orders;
            
            orders.forEach(order => {
              const orderDate = new Date(order.created_at);
              const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
              
              if (!monthlyData.has(monthKey)) {
                monthlyData.set(monthKey, {
                  date: monthKey + '-01',
                  revenue: 0,
                  quantity: 0,
                  orders: 0
                });
              }
              
              const monthData = monthlyData.get(monthKey);
              monthData.revenue += parseFloat(order.total_price || 0);
              monthData.orders += 1;
              
              if (includeQuantity && order.line_items) {
                order.line_items.forEach(item => {
                  monthData.quantity += parseInt(item.quantity || 0);
                });
              }
            });
          }
        } catch (storeError) {
          logError(`SHOPIFY: Failed to get trends data from ${store.name}:`, storeError);
        }
      }
      
      // Convert to array and sort by date
      const sortedData = Array.from(monthlyData.values()).sort((a, b) => 
        new Date(a.date) - new Date(b.date)
      );
      
      logInfo(`SHOPIFY: Retrieved sales trends for ${sortedData.length} months`);
      
      return {
        success: true,
        data: sortedData,
        period: period,
        dateRange: {
          start: startDate.toISOString(),
          end: new Date().toISOString()
        },
        lastUpdated: new Date().toISOString()
      };
      
    } catch (error) {
      logError('SHOPIFY: Error getting sales trends:', error);
      return {
        success: false,
        error: error.message,
        data: [],
        lastUpdated: new Date().toISOString()
      };
    }
  }

  async getRegionalPerformance() {
    try {
      const regionalData = [];
      
      for (const [storeId, store] of this.stores) {
        if (!store.isActive || !store.client) {
          continue;
        }

        try {
          // Get orders from last 30 days for this store
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
            const revenue = orders.reduce((sum, order) => sum + parseFloat(order.total_price || 0), 0);
            
            regionalData.push({
              name: store.name,
              region: store.region,
              revenue: revenue,
              orders: orders.length,
              currency: store.currency,
              growth: 0, // Would need historical data for growth calculation
              market_share: 0, // Would need total market data
              source: 'shopify'
            });
          }
        } catch (storeError) {
          logError(`Failed to get regional data from ${store.name}:`, storeError);
        }
      }

      return regionalData;
    } catch (error) {
      logError('Error getting regional performance:', error);
      throw error;
    }
  }

  async getAllOrders(params = {}) {
    try {
      const allOrders = [];
      
      for (const [storeId, store] of this.stores) {
        if (!store.isActive || !store.client) {
          continue;
        }

        try {
          const ordersResponse = await store.client.get({
            path: 'orders',
            query: {
              status: 'any',
              limit: params.limit || 250,
              created_at_min: params.created_at_min || '',
              financial_status: 'paid',
              ...params
            }
          });

          if (ordersResponse.body && ordersResponse.body.orders) {
            const orders = ordersResponse.body.orders.map(order => ({
              ...order,
              store_region: store.region,
              store_currency: store.currency
            }));
            allOrders.push(...orders);
          }
        } catch (storeError) {
          logError(`Failed to get orders from ${store.name}:`, storeError);
        }
      }

      return allOrders;
    } catch (error) {
      logError('Error getting all orders:', error);
      throw error;
    }
  }

  getActiveStoreCount() {
    return Array.from(this.stores.values()).filter(store => store.isActive).length;
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