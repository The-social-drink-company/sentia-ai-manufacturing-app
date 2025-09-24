/**
 * Multi-Market Service
 * Handles UK, EU, and US market integrations simultaneously
 * Provides unified data access with high performance and resilience
 */

import { EventEmitter } from 'events';
import ShopifyMultiStore from './shopifyMultiStore.js';
import AmazonSPAPI from './amazonSPAPI.js';
import CurrencyService from './currencyService.js';
import InventoryTracker from './inventoryTracker.js';
import MarketCache from './marketCache.js';
import logger from '../logger.js';

class MultiMarketService extends EventEmitter {
  constructor() {
    super();
    
    // Market configurations
    this.markets = {
      UK: {
        code: 'GB',
        currency: 'GBP',
        timezone: 'Europe/London',
        locale: 'en-GB',
        shopifyDomain: process.env.SHOPIFY_UK_DOMAIN,
        amazonMarketplaceId: 'A1F83G8C2ARO7P',
        vatRate: 0.20
      },
      EU: {
        code: 'EU',
        currency: 'EUR',
        timezone: 'Europe/Berlin',
        locale: 'en-EU',
        shopifyDomain: process.env.SHOPIFY_EU_DOMAIN,
        amazonMarketplaceId: 'A1PA6795UKMFR9', // Germany
        vatRate: 0.19
      },
      US: {
        code: 'US',
        currency: 'USD',
        timezone: 'America/New_York',
        locale: 'en-US',
        shopifyDomain: process.env.SHOPIFY_US_DOMAIN,
        amazonMarketplaceId: 'ATVPDKIKX0DER',
        salesTaxRate: 0.08 // Average
      }
    };
    
    // Initialize services
    this.initializeServices();
    
    // Market status tracking
    this.marketStatus = new Map();
    this.lastSync = new Map();
    
    // Performance metrics
    this.metrics = {
      apiCalls: new Map(),
      cacheHits: 0,
      cacheMisses: 0,
      errors: new Map(),
      responseTime: new Map()
    };
    
    // Start monitoring
    this.startHealthMonitoring();
  }

  /**
   * Initialize all market services
   */
  async initializeServices() {
    try {
      // Initialize Shopify multi-store
      this.shopify = new ShopifyMultiStore({
        stores: {
          UK: {
            domain: this.markets.UK.shopifyDomain,
            accessToken: process.env.SHOPIFY_UK_ACCESS_TOKEN,
            apiVersion: '2024-01'
          },
          EU: {
            domain: this.markets.EU.shopifyDomain,
            accessToken: process.env.SHOPIFY_EU_ACCESS_TOKEN,
            apiVersion: '2024-01'
          },
          US: {
            domain: this.markets.US.shopifyDomain,
            accessToken: process.env.SHOPIFY_US_ACCESS_TOKEN,
            apiVersion: '2024-01'
          }
        }
      });
      
      // Initialize Amazon SP-API
      this.amazon = new AmazonSPAPI({
        regions: {
          UK: {
            region: 'eu-west-2',
            marketplaceId: this.markets.UK.amazonMarketplaceId,
            sellerId: process.env.AMAZON_UK_SELLER_ID,
            credentials: {
              clientId: process.env.AMAZON_SP_API_CLIENT_ID,
              clientSecret: process.env.AMAZON_SP_API_CLIENT_SECRET,
              refreshToken: process.env.AMAZON_UK_REFRESH_TOKEN
            }
          },
          US: {
            region: 'us-east-1',
            marketplaceId: this.markets.US.amazonMarketplaceId,
            sellerId: process.env.AMAZON_US_SELLER_ID,
            credentials: {
              clientId: process.env.AMAZON_SP_API_CLIENT_ID,
              clientSecret: process.env.AMAZON_SP_API_CLIENT_SECRET,
              refreshToken: process.env.AMAZON_US_REFRESH_TOKEN
            }
          }
        }
      });
      
      // Initialize currency service
      this.currency = new CurrencyService({
        baseCurrency: 'GBP',
        updateInterval: 3600000, // 1 hour
        apiKey: process.env.CURRENCY_API_KEY
      });
      
      // Initialize inventory tracker
      this.inventory = new InventoryTracker({
        markets: Object.keys(this.markets),
        syncInterval: 300000 // 5 minutes
      });
      
      // Initialize cache
      this.cache = new MarketCache({
        ttl: 300000, // 5 minutes
        maxSize: 1000,
        redis: {
          host: process.env.REDIS_HOST,
          port: process.env.REDIS_PORT,
          password: process.env.REDIS_PASSWORD
        }
      });
      
      logger.info('Multi-market services initialized successfully');
      
      // Set all markets as active
      Object.keys(this.markets).forEach(market => {
        this.marketStatus.set(market, 'active');
      });
      
    } catch (error) {
      logger.error('Failed to initialize multi-market services:', error);
      throw error;
    }
  }

  /**
   * Get unified market data across all regions
   */
  async getUnifiedMarketData(options = {}) {
    const startTime = Date.now();
    
    try {
      // Check cache first
      const cacheKey = `unified_market_data_${JSON.stringify(options)}`;
      const cached = await this.cache.get(cacheKey);
      
      if (cached) {
        this.metrics.cacheHits++;
        return cached;
      }
      
      this.metrics.cacheMisses++;
      
      // Fetch data from all markets in parallel
      const marketPromises = Object.keys(this.markets).map(async market => {
        try {
          const data = await this.getMarketData(market, options);
          return { market, data, status: 'success' };
        } catch (error) {
          logger.error(`Failed to fetch ${market} data:`, error);
          this.recordError(market, error);
          return { 
            market, 
            data: null, 
            status: 'error',
            error: error.message 
          };
        }
      });
      
      const results = await Promise.allSettled(marketPromises);
      
      // Process results
      const marketData = {};
      const errors = [];
      
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          const { market, data, status, error } = result.value;
          if (status === 'success') {
            marketData[market] = data;
          } else {
            errors.push({ market, error });
          }
        }
      });
      
      // Calculate aggregated metrics
      const aggregated = this.aggregateMarketData(marketData);
      
      const response = {
        timestamp: new Date().toISOString(),
        markets: marketData,
        aggregated,
        errors: errors.length > 0 ? errors : null,
        performance: {
          responseTime: Date.now() - startTime,
          marketsActive: Object.keys(marketData).length,
          marketsFailed: errors.length
        }
      };
      
      // Cache the response
      await this.cache.set(cacheKey, response, 300000); // 5 minutes
      
      // Record metrics
      this.recordMetrics('unified_data', Date.now() - startTime);
      
      return response;
      
    } catch (error) {
      logger.error('Failed to get unified market data:', error);
      throw error;
    }
  }

  /**
   * Get data for a specific market
   */
  async getMarketData(market, options = {}) {
    const startTime = Date.now();
    
    if (!this.markets[market]) {
      throw new Error(`Invalid market: ${market}`);
    }
    
    try {
      // Check market status
      if (this.marketStatus.get(market) === 'offline') {
        throw new Error(`Market ${market} is currently offline`);
      }
      
      const marketConfig = this.markets[market];
      
      // Fetch data from different sources in parallel
      const [shopifyData, amazonData, inventoryData] = await Promise.all([
        this.getShopifyData(market, options),
        this.getAmazonData(market, options),
        this.getInventoryData(market, options)
      ]);
      
      // Convert to base currency if requested
      let convertedData = {
        shopify: shopifyData,
        amazon: amazonData,
        inventory: inventoryData
      };
      
      if (options.convertCurrency) {
        convertedData = await this.convertMarketCurrency(
          convertedData,
          marketConfig.currency,
          options.targetCurrency || 'GBP'
        );
      }
      
      // Calculate market metrics
      const metrics = this.calculateMarketMetrics(convertedData);
      
      const response = {
        market,
        currency: marketConfig.currency,
        timezone: marketConfig.timezone,
        data: convertedData,
        metrics,
        lastSync: this.lastSync.get(market) || null,
        responseTime: Date.now() - startTime
      };
      
      // Update last sync time
      this.lastSync.set(market, new Date().toISOString());
      
      // Record metrics
      this.recordMetrics(`${market}_data`, Date.now() - startTime);
      
      return response;
      
    } catch (error) {
      logger.error(`Failed to get ${market} data:`, error);
      this.marketStatus.set(market, 'error');
      throw error;
    }
  }

  /**
   * Get Shopify data for a market
   */
  async getShopifyData(market, options = {}) {
    try {
      const cacheKey = `shopify_${market}_${JSON.stringify(options)}`;
      const cached = await this.cache.get(cacheKey);
      
      if (cached) return cached;
      
      const data = await this.shopify.getStoreData(market, {
        includeOrders: options.includeOrders !== false,
        includeProducts: options.includeProducts !== false,
        includeCustomers: options.includeCustomers !== false,
        dateRange: options.dateRange || 'last30days'
      });
      
      await this.cache.set(cacheKey, data, 180000); // 3 minutes
      
      return data;
      
    } catch (error) {
      logger.error(`Shopify ${market} error:`, error);
      return null;
    }
  }

  /**
   * Get Amazon data for a market
   */
  async getAmazonData(market, options = {}) {
    try {
      // Only UK and US have Amazon integration
      if (!['UK', 'US'].includes(market)) {
        return null;
      }
      
      const cacheKey = `amazon_${market}_${JSON.stringify(options)}`;
      const cached = await this.cache.get(cacheKey);
      
      if (cached) return cached;
      
      const data = await this.amazon.getMarketplaceData(market, {
        includeOrders: options.includeOrders !== false,
        includeInventory: options.includeInventory !== false,
        includeFBA: options.includeFBA !== false,
        dateRange: options.dateRange || 'last30days'
      });
      
      await this.cache.set(cacheKey, data, 180000); // 3 minutes
      
      return data;
      
    } catch (error) {
      logger.error(`Amazon ${market} error:`, error);
      return null;
    }
  }

  /**
   * Get inventory data for a market
   */
  async getInventoryData(market, options = {}) {
    try {
      const cacheKey = `inventory_${market}_${JSON.stringify(options)}`;
      const cached = await this.cache.get(cacheKey);
      
      if (cached) return cached;
      
      const data = await this.inventory.getMarketInventory(market, {
        includeAllocations: options.includeAllocations !== false,
        includePending: options.includePending !== false,
        includeTransfers: options.includeTransfers !== false
      });
      
      await this.cache.set(cacheKey, data, 60000); // 1 minute
      
      return data;
      
    } catch (error) {
      logger.error(`Inventory ${market} error:`, error);
      return null;
    }
  }

  /**
   * Convert market data to target currency
   */
  async convertMarketCurrency(data, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return data;
    
    try {
      const rate = await this.currency.getRate(fromCurrency, toCurrency);
      
      // Deep clone and convert
      const converted = JSON.parse(JSON.stringify(data));
      
      // Convert Shopify data
      if (converted.shopify?.orders) {
        converted.shopify.orders.forEach(order => {
          order.totalPrice = order.totalPrice * rate;
          order.subtotalPrice = order.subtotalPrice * rate;
          order.totalTax = order.totalTax * rate;
          order.convertedFrom = fromCurrency;
          order.convertedRate = rate;
        });
      }
      
      // Convert Amazon data
      if (converted.amazon?.orders) {
        converted.amazon.orders.forEach(order => {
          order.orderTotal = order.orderTotal * rate;
          order.convertedFrom = fromCurrency;
          order.convertedRate = rate;
        });
      }
      
      // Convert inventory values
      if (converted.inventory?.products) {
        converted.inventory.products.forEach(product => {
          product.value = product.value * rate;
          product.costPrice = product.costPrice * rate;
          product.sellPrice = product.sellPrice * rate;
          product.convertedFrom = fromCurrency;
          product.convertedRate = rate;
        });
      }
      
      return converted;
      
    } catch (error) {
      logger.error('Currency conversion failed:', error);
      return data;
    }
  }

  /**
   * Aggregate data across all markets
   */
  aggregateMarketData(marketData) {
    const aggregated = {
      totalRevenue: 0,
      totalOrders: 0,
      totalProducts: 0,
      totalCustomers: new Set(),
      totalInventoryValue: 0,
      byMarket: {},
      byCurrency: {}
    };
    
    Object.entries(marketData).forEach(([market, data]) => {
      if (!data) return;
      
      const marketMetrics = {
        revenue: 0,
        orders: 0,
        products: 0,
        customers: 0,
        inventoryValue: 0
      };
      
      // Aggregate Shopify data
      if (data.shopify) {
        marketMetrics.revenue += data.shopify.totalRevenue || 0;
        marketMetrics.orders += data.shopify.orderCount || 0;
        marketMetrics.products += data.shopify.productCount || 0;
        marketMetrics.customers += data.shopify.customerCount || 0;
      }
      
      // Aggregate Amazon data
      if (data.amazon) {
        marketMetrics.revenue += data.amazon.totalRevenue || 0;
        marketMetrics.orders += data.amazon.orderCount || 0;
      }
      
      // Aggregate inventory data
      if (data.inventory) {
        marketMetrics.inventoryValue = data.inventory.totalValue || 0;
      }
      
      aggregated.byMarket[market] = marketMetrics;
      
      // Update totals
      aggregated.totalRevenue += marketMetrics.revenue;
      aggregated.totalOrders += marketMetrics.orders;
      aggregated.totalProducts += marketMetrics.products;
      aggregated.totalInventoryValue += marketMetrics.inventoryValue;
      
      // Track by currency
      const currency = this.markets[market].currency;
      if (!aggregated.byCurrency[currency]) {
        aggregated.byCurrency[currency] = {
          revenue: 0,
          orders: 0,
          inventoryValue: 0
        };
      }
      
      aggregated.byCurrency[currency].revenue += marketMetrics.revenue;
      aggregated.byCurrency[currency].orders += marketMetrics.orders;
      aggregated.byCurrency[currency].inventoryValue += marketMetrics.inventoryValue;
    });
    
    aggregated.totalCustomers = aggregated.totalCustomers.size;
    aggregated.averageOrderValue = aggregated.totalOrders > 0 
      ? aggregated.totalRevenue / aggregated.totalOrders 
      : 0;
    
    return aggregated;
  }

  /**
   * Calculate metrics for a specific market
   */
  calculateMarketMetrics(data) {
    const metrics = {
      revenue: {
        shopify: 0,
        amazon: 0,
        total: 0
      },
      orders: {
        shopify: 0,
        amazon: 0,
        total: 0
      },
      inventory: {
        available: 0,
        allocated: 0,
        pending: 0,
        value: 0
      },
      performance: {
        conversionRate: 0,
        averageOrderValue: 0,
        topProducts: [],
        stockTurnover: 0
      }
    };
    
    // Calculate revenue
    if (data.shopify) {
      metrics.revenue.shopify = data.shopify.totalRevenue || 0;
      metrics.orders.shopify = data.shopify.orderCount || 0;
    }
    
    if (data.amazon) {
      metrics.revenue.amazon = data.amazon.totalRevenue || 0;
      metrics.orders.amazon = data.amazon.orderCount || 0;
    }
    
    metrics.revenue.total = metrics.revenue.shopify + metrics.revenue.amazon;
    metrics.orders.total = metrics.orders.shopify + metrics.orders.amazon;
    
    // Calculate inventory metrics
    if (data.inventory) {
      metrics.inventory.available = data.inventory.available || 0;
      metrics.inventory.allocated = data.inventory.allocated || 0;
      metrics.inventory.pending = data.inventory.pending || 0;
      metrics.inventory.value = data.inventory.totalValue || 0;
      
      // Calculate stock turnover
      if (metrics.inventory.value > 0) {
        metrics.performance.stockTurnover = 
          (metrics.revenue.total * 12) / metrics.inventory.value;
      }
    }
    
    // Calculate performance metrics
    if (metrics.orders.total > 0) {
      metrics.performance.averageOrderValue = 
        metrics.revenue.total / metrics.orders.total;
    }
    
    // Get top products
    if (data.shopify?.products) {
      metrics.performance.topProducts = data.shopify.products
        .sort((a, b) => b.salesCount - a.salesCount)
        .slice(0, 5)
        .map(p => ({
          name: p.title,
          sales: p.salesCount,
          revenue: p.revenue
        }));
    }
    
    return metrics;
  }

  /**
   * Sync inventory across markets
   */
  async syncInventoryAcrossMarkets(sku, allocations) {
    try {
      const results = await Promise.all(
        Object.entries(allocations).map(async ([market, quantity]) => {
          try {
            await this.inventory.updateMarketInventory(market, sku, quantity);
            return { market, status: 'success', quantity };
          } catch (error) {
            logger.error(`Failed to sync inventory for ${market}:`, error);
            return { market, status: 'error', error: error.message };
          }
        })
      );
      
      return {
        sku,
        timestamp: new Date().toISOString(),
        results
      };
      
    } catch (error) {
      logger.error('Failed to sync inventory:', error);
      throw error;
    }
  }

  /**
   * Start health monitoring for all markets
   */
  startHealthMonitoring() {
    setInterval(async () => {
      for (const market of Object.keys(this.markets)) {
        try {
          // Ping each market's primary service
          await this.pingMarket(market);
          this.marketStatus.set(market, 'active');
        } catch (error) {
          logger.warn(`Market ${market} health check failed:`, error);
          this.marketStatus.set(market, 'degraded');
        }
      }
      
      // Emit health status
      this.emit('health', {
        timestamp: new Date().toISOString(),
        markets: Object.fromEntries(this.marketStatus),
        metrics: this.getMetricsSummary()
      });
      
    }, 60000); // Check every minute
  }

  /**
   * Ping a specific market
   */
  async pingMarket(market) {
    const timeout = 5000;
    
    return Promise.race([
      this.shopify.ping(market),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Ping timeout')), timeout)
      )
    ]);
  }

  /**
   * Record performance metrics
   */
  recordMetrics(operation, responseTime) {
    if (!this.metrics.apiCalls.has(operation)) {
      this.metrics.apiCalls.set(operation, 0);
    }
    
    this.metrics.apiCalls.set(
      operation,
      this.metrics.apiCalls.get(operation) + 1
    );
    
    if (!this.metrics.responseTime.has(operation)) {
      this.metrics.responseTime.set(operation, []);
    }
    
    const times = this.metrics.responseTime.get(operation);
    times.push(responseTime);
    
    // Keep only last 100 response times
    if (times.length > 100) {
      times.shift();
    }
  }

  /**
   * Record errors
   */
  recordError(market, error) {
    if (!this.metrics.errors.has(market)) {
      this.metrics.errors.set(market, []);
    }
    
    const errors = this.metrics.errors.get(market);
    errors.push({
      timestamp: new Date().toISOString(),
      message: error.message,
      code: error.code
    });
    
    // Keep only last 50 errors
    if (errors.length > 50) {
      errors.shift();
    }
  }

  /**
   * Get metrics summary
   */
  getMetricsSummary() {
    const summary = {
      apiCalls: Object.fromEntries(this.metrics.apiCalls),
      cacheHitRate: this.metrics.cacheHits / 
        (this.metrics.cacheHits + this.metrics.cacheMisses) || 0,
      averageResponseTime: {},
      errorRate: {},
      uptime: {}
    };
    
    // Calculate average response times
    this.metrics.responseTime.forEach((times, operation) => {
      if (times.length > 0) {
        summary.averageResponseTime[operation] = 
          times.reduce((a, b) => a + b, 0) / times.length;
      }
    });
    
    // Calculate error rates
    this.metrics.errors.forEach((errors, market) => {
      summary.errorRate[market] = errors.length;
    });
    
    // Calculate uptime
    this.marketStatus.forEach((status, market) => {
      summary.uptime[market] = status === 'active' ? 100 : 0;
    });
    
    return summary;
  }

  /**
   * Clear cache for specific market or all
   */
  async clearCache(market = null) {
    if (market) {
      await this.cache.clearPattern(`*${market}*`);
    } else {
      await this.cache.clear();
    }
    
    logger.info(`Cache cleared for: ${market || 'all markets'}`);
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    logger.info('Shutting down multi-market service');
    
    await Promise.all([
      this.shopify.disconnect(),
      this.amazon.disconnect(),
      this.inventory.stop(),
      this.cache.disconnect()
    ]);
    
    this.removeAllListeners();
  }
}

// Export singleton
const multiMarketService = new MultiMarketService();

export default multiMarketService;
export { MultiMarketService };