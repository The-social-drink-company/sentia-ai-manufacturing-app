import { devLog } from '../lib/devLog.js';\n
// Enhanced Live Data Service - Enterprise Grade
// NO MOCK DATA ALLOWED - LIVE DATA ONLY WITH INTELLIGENT FALLBACKS

import { EventEmitter } from 'events';

class EnhancedLiveDataService extends EventEmitter {
  constructor() {
    super();
    this.initialized = false;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000
    };
    this.healthStatus = new Map();
    this.metrics = {
      requests: 0,
      successes: 0,
      failures: 0,
      cacheHits: 0
    };
  }

  async initialize() {
    if (this.initialized) return;
    
    this.log('Initializing Enhanced Live Data Service - Enterprise Grade');
    
    // Test all data source connections
    await this.validateAllConnections();
    
    // Set up health monitoring
    this.startHealthMonitoring();
    
    this.initialized = true;
    this.emit('initialized');
  }

  async validateAllConnections() {
    const sources = ['unleashed', 'amazon', 'shopify'];
    
    for (const source of sources) {
      try {
        await this.testConnection(source);
        this.healthStatus.set(source, { status: 'healthy', lastCheck: new Date() });
      } catch (error) {
        this.healthStatus.set(source, { status: 'unhealthy', lastCheck: new Date(), error: error.message });
        this.log(`Warning: ${source} connection failed: ${error.message}`);
      }
    }
  }

  async testConnection(source) {
    switch (source) {
      case 'unleashed':
        return this.testUnleashedConnection();
      case 'amazon':
        return this.testAmazonConnection();
      case 'shopify':
        return this.testShopifyConnection();
      default:
        throw new Error(`Unknown source: ${source}`);
    }
  }

  async testUnleashedConnection() {
    const apiId = process.env.UNLEASHED_API_ID;
    const apiKey = process.env.UNLEASHED_API_KEY;
    
    if (!apiId || !apiKey) {
      throw new Error('Unleashed API credentials not configured');
    }

    try {
      const response = await fetch('https://api.unleashedsoftware.com/Products/1', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'api-auth-id': apiId,
          'api-auth-signature': apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return { status: 'connected', service: 'unleashed' };
    } catch (error) {
      throw new Error(`Unleashed connection test failed: ${error.message}`);
    }
  }

  async testAmazonConnection() {
    // Amazon SP-API requires complex OAuth - check configuration
    const clientId = process.env.AMAZON_SP_API_CLIENT_ID;
    const clientSecret = process.env.AMAZON_SP_API_CLIENT_SECRET;
    const refreshToken = process.env.AMAZON_SP_API_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error('Amazon SP-API credentials not fully configured');
    }

    // For now, return configured status - full OAuth implementation needed
    return { status: 'configured', service: 'amazon', note: 'OAuth implementation required' };
  }

  async testShopifyConnection() {
    const accessToken = process.env.SHOPIFY_UK_ACCESS_TOKEN;
    const shopUrl = process.env.SHOPIFY_UK_SHOP_URL;

    if (!accessToken || !shopUrl) {
      throw new Error('Shopify API credentials not configured');
    }

    try {
      const response = await fetch(`https://${shopUrl}/admin/api/2023-10/shop.json`, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return { status: 'connected', service: 'shopify' };
    } catch (error) {
      throw new Error(`Shopify connection test failed: ${error.message}`);
    }
  }

  startHealthMonitoring() {
    // Health check every 2 minutes
    setInterval(() => {
      this.validateAllConnections();
    }, 2 * 60 * 1000);
  }

  async getUnleashedDataWithRetry() {
    return this.withRetry('unleashed', async () => {
      const apiId = process.env.UNLEASHED_API_ID;
      const apiKey = process.env.UNLEASHED_API_KEY;
      
      if (!apiId || !apiKey) {
        return this.createFallbackData('unleashed');
      }

      const response = await fetch('https://api.unleashedsoftware.com/SalesOrders', {
        headers: {
          'Accept': 'application/json',
          'api-auth-id': apiId,
          'api-auth-signature': apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Unleashed API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        orders: data.Items || [],
        totalOrders: data.Items?.length || 0,
        totalValue: data.Items?.reduce((sum, order) => sum + (order.Total || 0), 0) || 0,
        lastUpdated: new Date().toISOString(),
        status: 'LIVE_FROM_UNLEASHED',
        source: 'unleashed_api'
      };
    });
  }

  async getShopifyDataWithRetry() {
    return this.withRetry('shopify', async () => {
      const accessToken = process.env.SHOPIFY_UK_ACCESS_TOKEN;
      const shopUrl = process.env.SHOPIFY_UK_SHOP_URL;

      if (!accessToken || !shopUrl) {
        return this.createFallbackData('shopify');
      }

      const response = await fetch(`https://${shopUrl}/admin/api/2023-10/orders.json?status=any&limit=250`, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Shopify API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        orders: data.orders || [],
        totalOrders: data.orders?.length || 0,
        totalRevenue: data.orders?.reduce((sum, order) => sum + parseFloat(order.total_price || 0), 0) || 0,
        lastUpdated: new Date().toISOString(),
        status: 'LIVE_FROM_SHOPIFY',
        source: 'shopify_api'
      };
    });
  }

  async withRetry(operation, fn) {
    this.metrics.requests++;
    
    for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const result = await fn();
        this.metrics.successes++;
        this.emit('dataReceived', { operation, result, attempt });
        return result;
      } catch (error) {
        if (attempt === this.retryConfig.maxRetries) {
          this.metrics.failures++;
          this.emit('dataFailed', { operation, error, attempts: attempt });
          throw error;
        }
        
        const delay = Math.min(
          this.retryConfig.baseDelay * Math.pow(2, attempt - 1),
          this.retryConfig.maxDelay
        );
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  createFallbackData(source) {
    // Enterprise-grade fallback data that indicates connection issues
    const 0,
      shopify: {
        orders: [],
        totalOrders: 0,
        totalRevenue: 0,
        lastUpdated: new Date().toISOString(),
        status: 'CONNECTION_UNAVAILABLE',
        source: 'fallback_system',
        message: 'Shopify store connection unavailable. Check credentials and network.'
      },
      amazon: {
        sales: [],
        totalRevenue: 0,
        lastUpdated: new Date().toISOString(),
        status: 'CONNECTION_UNAVAILABLE',
        source: 'fallback_system',
        message: 'Amazon SP-API connection unavailable. OAuth setup required.'
      }
    };

    return fallbackData[source] || { status: 'UNKNOWN_SOURCE', source: 'error' };
  }

  async getDashboardKPIs() {
    try {
      const [unleashed, shopify] = await Promise.all([
        this.getUnleashedDataWithRetry(),
        this.getShopifyDataWithRetry()
      ]);

      const totalRevenue = (unleashed?.totalValue || 0) + (shopify?.totalRevenue || 0);
      const totalOrders = (unleashed?.totalOrders || 0) + (shopify?.totalOrders || 0);

      return {
        totalRevenue: totalRevenue.toLocaleString('en-GB', { 
          style: 'currency', 
          currency: 'GBP' 
        }),
        totalOrders,
        avgOrderValue: totalOrders > 0 ? (totalRevenue / totalOrders).toLocaleString('en-GB', { 
          style: 'currency', 
          currency: 'GBP' 
        }) : '£0',
        lastUpdated: new Date().toISOString(),
        dataSources: {
          unleashed: unleashed?.status === 'LIVE_FROM_UNLEASHED',
          shopify: shopify?.status === 'LIVE_FROM_SHOPIFY',
          amazon: false
        },
        healthStatus: Object.fromEntries(this.healthStatus),
        metrics: this.metrics,
        status: 'LIVE_DATA_WITH_ENTERPRISE_FALLBACKS'
      };
    } catch (error) {
      return {
        totalRevenue: '£0',
        totalOrders: 0,
        avgOrderValue: '£0',
        lastUpdated: new Date().toISOString(),
        dataSources: { unleashed: false, shopify: false, amazon: false },
        status: 'ERROR',
        error: error.message
      };
    }
  }

  getHealthStatus() {
    return {
      sources: Object.fromEntries(this.healthStatus),
      metrics: this.metrics,
      uptime: process.uptime(),
      lastUpdate: new Date().toISOString()
    };
  }

  log(message) {
    devLog.log(`[Enhanced Live Data Service] ${new Date().toISOString()}: ${message}`);
  }
}

// Create and export singleton instance
const enhancedLiveDataService = new EnhancedLiveDataService();

// Auto-initialize
if (typeof window !== 'undefined') {
  enhancedLiveDataService.initialize().catch(error => {
    devLog.error('Failed to initialize Enhanced Live Data Service:', error);
  });
}

export default enhancedLiveDataService;
