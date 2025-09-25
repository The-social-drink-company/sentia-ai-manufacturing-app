/**
 * API Integration Service
 * Centralized service for all external API integrations via MCP Server
 * Connects to Railway MCP Server: 99691282-de66-45b2-98cf-317083dd11ba
 */

import { getMCPClient } from './mcp-client.js';
import prisma from '../lib/prisma.js';
import { logDebug, logInfo, logWarn, logError } from '../src/utils/logger';


class APIIntegrationService {
  constructor() {
    this.mcpClient = getMCPClient();
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.syncInterval = null;
    this.isSyncing = false;

    // Initialize automatic sync based on environment
    this.initializeAutoSync();
  }

  initializeAutoSync() {
    // Only enable auto-sync in production/testing
    if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test') {
      // Sync every 30 minutes
      this.syncInterval = setInterval(() => {
        this.syncAllServices();
      }, 30 * 60 * 1000);
    }

    // Listen for MCP Server events
    this.mcpClient.on('api-update', (data) => {
      this.handleAPIUpdate(data);
    });

    this.mcpClient.on('manufacturing-alert', (alert) => {
      this.handleManufacturingAlert(alert);
    });
  }

  // ====================
  // Xero Integration
  // ====================

  async getXeroInvoices(options = {}) {
    const cacheKey = `xero-invoices-${JSON.stringify(options)}`;

    // Check cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      // Call through MCP Server
      const response = await this.mcpClient.callUnifiedAPI(
        'xero',
        'GET',
        '/invoices',
        options
      );

      // Cache the response
      this.cache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      });

      // Store in database for offline access
      if (response.data && response.data.invoices) {
        await this.storeXeroData('invoices', response.data.invoices);
      }

      return response.data;
    } catch (error) {
      logError('Failed to get Xero invoices:', error);

      // Fallback to cached database data
      return await this.getXeroDataFromDB('invoices', options);
    }
  }

  async getXeroContacts(options = {}) {
    try {
      const response = await this.mcpClient.callUnifiedAPI(
        'xero',
        'GET',
        '/contacts',
        options
      );

      if (response.data && response.data.contacts) {
        await this.storeXeroData('contacts', response.data.contacts);
      }

      return response.data;
    } catch (error) {
      logError('Failed to get Xero contacts:', error);
      return await this.getXeroDataFromDB('contacts', options);
    }
  }

  async getXeroBankTransactions(accountId, options = {}) {
    try {
      const response = await this.mcpClient.callUnifiedAPI(
        'xero',
        'GET',
        `/bank-transactions/${accountId}`,
        options
      );

      if (response.data && response.data.transactions) {
        await this.storeXeroData('bank_transactions', response.data.transactions);
      }

      return response.data;
    } catch (error) {
      logError('Failed to get Xero bank transactions:', error);
      return await this.getXeroDataFromDB('bank_transactions', { accountId, ...options });
    }
  }

  async syncXeroData() {
    try {
      logDebug('Syncing Xero data...');
      const result = await this.mcpClient.syncXeroData();

      // Update local database with synced data
      if (result.success) {
        await this.updateSyncStatus('xero', result);
      }

      return result;
    } catch (error) {
      logError('Xero sync failed:', error);
      throw error;
    }
  }

  // ====================
  // Shopify Integration
  // ====================

  async getShopifyOrders(options = {}) {
    try {
      const response = await this.mcpClient.callUnifiedAPI(
        'shopify',
        'GET',
        '/orders',
        options
      );

      if (response.data && response.data.orders) {
        await this.storeShopifyData('orders', response.data.orders);
      }

      return response.data;
    } catch (error) {
      logError('Failed to get Shopify orders:', error);
      return await this.getShopifyDataFromDB('orders', options);
    }
  }

  async getShopifyProducts(options = {}) {
    try {
      const response = await this.mcpClient.callUnifiedAPI(
        'shopify',
        'GET',
        '/products',
        options
      );

      if (response.data && response.data.products) {
        await this.storeShopifyData('products', response.data.products);
      }

      return response.data;
    } catch (error) {
      logError('Failed to get Shopify products:', error);
      return await this.getShopifyDataFromDB('products', options);
    }
  }

  async getShopifyInventory(locationId = null) {
    try {
      const endpoint = locationId ? `/inventory/${locationId}` : '/inventory';
      const response = await this.mcpClient.callUnifiedAPI(
        'shopify',
        'GET',
        endpoint
      );

      if (response.data && response.data.inventory) {
        await this.storeShopifyData('inventory', response.data.inventory);
      }

      return response.data;
    } catch (error) {
      logError('Failed to get Shopify inventory:', error);
      return await this.getShopifyDataFromDB('inventory', { locationId });
    }
  }

  async syncShopifyData() {
    try {
      logDebug('Syncing Shopify data...');
      const result = await this.mcpClient.syncShopifyData();

      if (result.success) {
        await this.updateSyncStatus('shopify', result);
      }

      return result;
    } catch (error) {
      logError('Shopify sync failed:', error);
      throw error;
    }
  }

  // ====================
  // Amazon SP-API Integration
  // ====================

  async getAmazonOrders(options = {}) {
    try {
      const response = await this.mcpClient.callUnifiedAPI(
        'amazon',
        'GET',
        '/orders',
        options
      );

      if (response.data && response.data.orders) {
        await this.storeAmazonData('orders', response.data.orders);
      }

      return response.data;
    } catch (error) {
      logError('Failed to get Amazon orders:', error);
      return await this.getAmazonDataFromDB('orders', options);
    }
  }

  async getAmazonInventory(options = {}) {
    try {
      const response = await this.mcpClient.callUnifiedAPI(
        'amazon',
        'GET',
        '/inventory',
        options
      );

      if (response.data && response.data.inventory) {
        await this.storeAmazonData('inventory', response.data.inventory);
      }

      return response.data;
    } catch (error) {
      logError('Failed to get Amazon inventory:', error);
      return await this.getAmazonDataFromDB('inventory', options);
    }
  }

  async syncAmazonData() {
    try {
      logDebug('Syncing Amazon data...');
      const result = await this.mcpClient.syncAmazonData();

      if (result.success) {
        await this.updateSyncStatus('amazon', result);
      }

      return result;
    } catch (error) {
      logError('Amazon sync failed:', error);
      throw error;
    }
  }

  // ====================
  // Unleashed Integration
  // ====================

  async getUnleashedProducts(options = {}) {
    try {
      const response = await this.mcpClient.callUnifiedAPI(
        'unleashed',
        'GET',
        '/products',
        options
      );

      if (response.data && response.data.products) {
        await this.storeUnleashedData('products', response.data.products);
      }

      return response.data;
    } catch (error) {
      logError('Failed to get Unleashed products:', error);
      return await this.getUnleashedDataFromDB('products', options);
    }
  }

  async getUnleashedStockOnHand(options = {}) {
    try {
      const response = await this.mcpClient.callUnifiedAPI(
        'unleashed',
        'GET',
        '/stock-on-hand',
        options
      );

      if (response.data && response.data.stock) {
        await this.storeUnleashedData('stock', response.data.stock);
      }

      return response.data;
    } catch (error) {
      logError('Failed to get Unleashed stock:', error);
      return await this.getUnleashedDataFromDB('stock', options);
    }
  }

  // ====================
  // Neon Database Operations
  // ====================

  async queryNeonDatabase(query, branch = null) {
    try {
      const result = await this.mcpClient.queryDatabase(query, branch);
      return result;
    } catch (error) {
      logError('Database query failed:', error);

      // Fallback to direct Prisma query
      return await prisma.$queryRawUnsafe(query);
    }
  }

  async syncDatabaseBranches() {
    try {
      logDebug('Syncing database branches...');
      const result = await this.mcpClient.syncDatabaseBranches();

      if (result.success) {
        logDebug('Database branches synced successfully');
      }

      return result;
    } catch (error) {
      logError('Database branch sync failed:', error);
      throw error;
    }
  }

  // ====================
  // Unified Sync Operations
  // ====================

  async syncAllServices() {
    if (this.isSyncing) {
      logDebug('Sync already in progress, skipping...');
      return;
    }

    this.isSyncing = true;
    const results = {
      xero: null,
      shopify: null,
      amazon: null,
      database: null,
      timestamp: new Date().toISOString()
    };

    try {
      logDebug('Starting full service sync...');

      // Sync all services in parallel
      const [xeroResult, shopifyResult, amazonResult, dbResult] = await Promise.allSettled([
        this.syncXeroData(),
        this.syncShopifyData(),
        this.syncAmazonData(),
        this.syncDatabaseBranches()
      ]);

      results.xero = xeroResult.status === 'fulfilled' ? xeroResult.value : { error: xeroResult.reason };
      results.shopify = shopifyResult.status === 'fulfilled' ? shopifyResult.value : { error: shopifyResult.reason };
      results.amazon = amazonResult.status === 'fulfilled' ? amazonResult.value : { error: amazonResult.reason };
      results.database = dbResult.status === 'fulfilled' ? dbResult.value : { error: dbResult.reason };

      // Log sync results to MCP Server
      await this.mcpClient.logEvent('full-sync-completed', results);

      logDebug('Full service sync completed');
    } catch (error) {
      logError('Full sync failed:', error);
      results.error = error.message;
    } finally {
      this.isSyncing = false;
    }

    return results;
  }

  // ====================
  // Database Storage Helpers
  // ====================

  async storeXeroData(type, data) {
    try {
      const records = Array.isArray(data) ? data : [data];

      for (const record of records) {
        await prisma.externalAPIData.upsert({
          where: {
            source_type_externalId: {
              source: 'xero',
              type,
              externalId: record.id || record.InvoiceID || record.ContactID
            }
          },
          update: {
            data: record,
            updatedAt: new Date()
          },
          create: {
            source: 'xero',
            type,
            externalId: record.id || record.InvoiceID || record.ContactID,
            data: record
          }
        });
      }
    } catch (error) {
      logError(`Failed to store Xero ${type} data:`, error);
    }
  }

  async storeShopifyData(type, data) {
    try {
      const records = Array.isArray(data) ? data : [data];

      for (const record of records) {
        await prisma.externalAPIData.upsert({
          where: {
            source_type_externalId: {
              source: 'shopify',
              type,
              externalId: String(record.id)
            }
          },
          update: {
            data: record,
            updatedAt: new Date()
          },
          create: {
            source: 'shopify',
            type,
            externalId: String(record.id),
            data: record
          }
        });
      }
    } catch (error) {
      logError(`Failed to store Shopify ${type} data:`, error);
    }
  }

  async storeAmazonData(type, data) {
    try {
      const records = Array.isArray(data) ? data : [data];

      for (const record of records) {
        await prisma.externalAPIData.upsert({
          where: {
            source_type_externalId: {
              source: 'amazon',
              type,
              externalId: record.orderId || record.asin || record.sku
            }
          },
          update: {
            data: record,
            updatedAt: new Date()
          },
          create: {
            source: 'amazon',
            type,
            externalId: record.orderId || record.asin || record.sku,
            data: record
          }
        });
      }
    } catch (error) {
      logError(`Failed to store Amazon ${type} data:`, error);
    }
  }

  async storeUnleashedData(type, data) {
    try {
      const records = Array.isArray(data) ? data : [data];

      for (const record of records) {
        await prisma.externalAPIData.upsert({
          where: {
            source_type_externalId: {
              source: 'unleashed',
              type,
              externalId: record.Guid || record.ProductCode
            }
          },
          update: {
            data: record,
            updatedAt: new Date()
          },
          create: {
            source: 'unleashed',
            type,
            externalId: record.Guid || record.ProductCode,
            data: record
          }
        });
      }
    } catch (error) {
      logError(`Failed to store Unleashed ${type} data:`, error);
    }
  }

  // ====================
  // Database Retrieval Helpers
  // ====================

  async getXeroDataFromDB(type, options = {}) {
    try {
      const data = await prisma.externalAPIData.findMany({
        where: {
          source: 'xero',
          type
        },
        orderBy: {
          updatedAt: 'desc'
        },
        take: options.limit || 100
      });

      return {
        [type]: data.map(d => d.data),
        fromCache: true
      };
    } catch (error) {
      logError(`Failed to get Xero ${type} from database:`, error);
      return { [type]: [], fromCache: true, error: error.message };
    }
  }

  async getShopifyDataFromDB(type, options = {}) {
    try {
      const data = await prisma.externalAPIData.findMany({
        where: {
          source: 'shopify',
          type
        },
        orderBy: {
          updatedAt: 'desc'
        },
        take: options.limit || 100
      });

      return {
        [type]: data.map(d => d.data),
        fromCache: true
      };
    } catch (error) {
      logError(`Failed to get Shopify ${type} from database:`, error);
      return { [type]: [], fromCache: true, error: error.message };
    }
  }

  async getAmazonDataFromDB(type, options = {}) {
    try {
      const data = await prisma.externalAPIData.findMany({
        where: {
          source: 'amazon',
          type
        },
        orderBy: {
          updatedAt: 'desc'
        },
        take: options.limit || 100
      });

      return {
        [type]: data.map(d => d.data),
        fromCache: true
      };
    } catch (error) {
      logError(`Failed to get Amazon ${type} from database:`, error);
      return { [type]: [], fromCache: true, error: error.message };
    }
  }

  async getUnleashedDataFromDB(type, options = {}) {
    try {
      const data = await prisma.externalAPIData.findMany({
        where: {
          source: 'unleashed',
          type
        },
        orderBy: {
          updatedAt: 'desc'
        },
        take: options.limit || 100
      });

      return {
        [type]: data.map(d => d.data),
        fromCache: true
      };
    } catch (error) {
      logError(`Failed to get Unleashed ${type} from database:`, error);
      return { [type]: [], fromCache: true, error: error.message };
    }
  }

  // ====================
  // Event Handlers
  // ====================

  handleAPIUpdate(data) {
    logDebug('API update received:', data);

    // Clear relevant cache
    if (data.service) {
      for (const [key] of this.cache) {
        if (key.startsWith(data.service)) {
          this.cache.delete(key);
        }
      }
    }

    // Trigger sync if needed
    if (data.requiresSync) {
      this.syncAllServices();
    }
  }

  handleManufacturingAlert(alert) {
    logDebug('Manufacturing alert received:', alert);

    // Handle critical alerts
    if (alert.severity === 'critical') {
      // Trigger immediate sync
      this.syncAllServices();

      // Log to database
      prisma.manufacturingAlert.create({
        data: {
          type: alert.type,
          severity: alert.severity,
          message: alert.message,
          data: alert.data,
          timestamp: new Date()
        }
      }).catch(console.error);
    }
  }

  async updateSyncStatus(service, result) {
    try {
      await prisma.syncStatus.upsert({
        where: { service },
        update: {
          lastSync: new Date(),
          status: result.success ? 'success' : 'failed',
          message: result.message,
          recordsProcessed: result.recordsProcessed || 0
        },
        create: {
          service,
          lastSync: new Date(),
          status: result.success ? 'success' : 'failed',
          message: result.message,
          recordsProcessed: result.recordsProcessed || 0
        }
      });
    } catch (error) {
      logError(`Failed to update sync status for ${service}:`, error);
    }
  }

  // ====================
  // Cleanup
  // ====================

  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    this.cache.clear();
    this.mcpClient.disconnect();
  }
}

// Singleton instance
let apiService = null;

export const getAPIIntegrationService = () => {
  if (!apiService) {
    apiService = new APIIntegrationService();
  }
  return apiService;
};

export default APIIntegrationService;