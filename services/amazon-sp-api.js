#!/usr/bin/env node

// Note: amazon-sp-api package has import issues in current environment
// Implementing fallback service with mock data until package is fixed
let SellingPartnerApi = null;

// Dynamic import function to be called when needed
async function importSellingPartnerApi() {
  if (SellingPartnerApi !== null) return SellingPartnerApi;
  
  try {
    const pkg = await import('amazon-sp-api');
    SellingPartnerApi = pkg.SellingPartnerApi || pkg.default;
    if (!SellingPartnerApi || typeof SellingPartnerApi !== 'function') {
      throw new Error('SellingPartnerApi constructor not found in package');
    }
    return SellingPartnerApi;
  } catch (error) {
    logError('❌ Amazon SP-API package not available:', error.message);
    SellingPartnerApi = class RequiredAuthSellingPartnerApi {
      constructor(config) {
        throw new Error('Amazon SP-API package not available. Please install: npm install amazon-sp-api and configure real credentials: AMAZON_REFRESH_TOKEN, AMAZON_LWA_APP_ID, AMAZON_LWA_CLIENT_SECRET, AMAZON_SP_ROLE_ARN, AMAZON_SELLER_ID');
      }
      
      async callAPI(operation) {
        throw new Error(`Amazon SP-API real authentication required for operation: ${operation.operation}. Please configure real credentials and install package: npm install amazon-sp-api`);
      }
    };
    return SellingPartnerApi;
  }
}
import { PrismaClient } from '@prisma/client';
import redisCache from '../src/lib/redis.js';
import { logDebug, logInfo, logWarn, logError } from '../src/utils/logger';


const prisma = new PrismaClient();

class AmazonSPAPIService {
  constructor() {
    this.spApi = null;
    this.isConnected = false;
    this.syncInterval = null;
    this.credentials = {
      refresh_token: process.env.AMAZON_REFRESH_TOKEN,
      lwa_app_id: process.env.AMAZON_LWA_APP_ID,
      lwa_client_secret: process.env.AMAZON_LWA_CLIENT_SECRET,
      aws_selling_partner_role: process.env.AMAZON_SP_ROLE_ARN,
      region: process.env.AMAZON_REGION || 'us-east-1'
    };
  }

  async initialize() {
    try {
      // FORCE REAL DATA ONLY - No mock data allowed
      if (!this.credentials.refresh_token || !this.credentials.lwa_app_id || !this.credentials.lwa_client_secret) {
        logWarn('Amazon SP-API authentication required. Please configure real Amazon SP-API credentials: AMAZON_REFRESH_TOKEN, AMAZON_LWA_APP_ID, AMAZON_LWA_CLIENT_SECRET, AMAZON_SP_ROLE_ARN. No mock data will be returned.');
        this.isConnected = false;
        return false;
      }

      // Dynamically import SellingPartnerApi
      const SPAPIClass = await importSellingPartnerApi();
      
      this.spApi = new SPAPIClass({
        region: this.credentials.region,
        refresh_token: this.credentials.refresh_token,
        credentials: {
          SELLING_PARTNER_APP_CLIENT_ID: this.credentials.lwa_app_id,
          SELLING_PARTNER_APP_CLIENT_SECRET: this.credentials.lwa_client_secret,
          AWS_SELLING_PARTNER_ROLE: this.credentials.aws_selling_partner_role
        },
        debug: process.env.NODE_ENV === 'development'
      });

      // Test connection
      await this.testConnection();
      this.isConnected = true;
      
      logDebug('✅ Amazon SP-API initialized successfully');
      
      // Start automatic data sync
      this.startDataSync();
      
    } catch (error) {
      logError('❌ Failed to initialize Amazon SP-API:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async testConnection() {
    try {
      const marketplaces = await this.spApi.callAPI({
        operation: 'getMarketplaceParticipations',
        endpoint: 'sellers'
      });
      
      logDebug(`🏪 Connected to ${marketplaces.payload.length} Amazon marketplaces`);
      return true;
    } catch (error) {
      throw new Error(`SP-API connection test failed: ${error.message}`);
    }
  }

  async syncInventoryData() {
    if (!this.isConnected) {
      throw new Error('Amazon SP-API not connected');
    }

    try {
      logDebug('📦 Syncing inventory data from Amazon...');
      
      // Get inventory summary
      const inventoryResponse = await this.spApi.callAPI({
        operation: 'getInventorySummaries',
        endpoint: 'fbaInventory',
        query: {
          granularityType: 'Marketplace',
          granularityId: 'ATVPDKIKX0DER', // US marketplace
          marketplaceIds: ['ATVPDKIKX0DER']
        }
      });

      const inventoryItems = inventoryResponse.payload.inventorySummaries || [];
      
      // Process and store inventory data
      const processedItems = [];
      for (const item of inventoryItems) {
        const inventoryData = {
          asin: item.asin,
          sku: item.sellerSku,
          fnsku: item.fnsku,
          productName: item.productName || 'Unknown Product',
          totalQuantity: item.totalQuantity || 0,
          inStockSupplyQuantity: item.inStockSupplyQuantity || 0,
          reservedQuantity: item.reservedQuantity || 0,
          fulfillableQuantity: item.fulfillableQuantity || 0,
          inboundWorkingQuantity: item.inboundWorkingQuantity || 0,
          inboundShippedQuantity: item.inboundShippedQuantity || 0,
          lastUpdated: new Date()
        };

        // Store in database
        await this.upsertInventoryItem(inventoryData);
        
        // Cache frequently accessed data
        await redisCache.cacheWidget(`amazon_inventory_${item.asin}`, inventoryData, 300);
        
        processedItems.push(inventoryData);
      }

      logDebug(`✅ Processed ${processedItems.length} inventory items`);
      
      // Cache aggregated inventory data
      const aggregatedData = {
        totalSKUs: processedItems.length,
        totalQuantity: processedItems.reduce((sum, item) => sum + item.totalQuantity, 0),
        lowStockItems: processedItems.filter(item => item.fulfillableQuantity < 10).length,
        lastSync: new Date().toISOString()
      };
      
      await redisCache.cacheWidget('amazon_inventory_summary', aggregatedData, 300);
      
      return processedItems;
      
    } catch (error) {
      logError('❌ Failed to sync inventory:', error);
      throw error;
    }
  }

  async syncOrderData() {
    if (!this.isConnected) return;

    try {
      logDebug('📋 Syncing order data from Amazon...');
      
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours
      
      const ordersResponse = await this.spApi.callAPI({
        operation: 'getOrders',
        endpoint: 'orders',
        query: {
          MarketplaceIds: ['ATVPDKIKX0DER'],
          CreatedAfter: startTime.toISOString(),
          CreatedBefore: endTime.toISOString(),
          OrderStatuses: ['Unshipped', 'PartiallyShipped', 'Shipped']
        }
      });

      const orders = ordersResponse.payload.Orders || [];
      
      for (const order of orders) {
        const orderData = {
          amazonOrderId: order.AmazonOrderId,
          orderStatus: order.OrderStatus,
          purchaseDate: new Date(order.PurchaseDate),
          orderTotal: parseFloat(order.OrderTotal?.Amount || 0),
          currencyCode: order.OrderTotal?.CurrencyCode || 'USD',
          numberOfItemsShipped: order.NumberOfItemsShipped || 0,
          numberOfItemsUnshipped: order.NumberOfItemsUnshipped || 0,
          fulfillmentChannel: order.FulfillmentChannel,
          salesChannel: order.SalesChannel,
          lastUpdated: new Date()
        };

        await this.upsertOrderItem(orderData);
      }

      logDebug(`✅ Processed ${orders.length} orders`);
      return orders;
      
    } catch (error) {
      logError('❌ Failed to sync orders:', error);
      throw error;
    }
  }

  async syncFBAData() {
    if (!this.isConnected) return;

    try {
      logDebug('🚚 Syncing FBA shipment data...');
      
      // Get FBA shipments
      const shipmentsResponse = await this.spApi.callAPI({
        operation: 'getShipments',
        endpoint: 'fbaInbound',
        query: {
          QueryType: 'SHIPMENT',
          MarketplaceId: 'ATVPDKIKX0DER'
        }
      });

      const shipments = shipmentsResponse.payload.ShipmentData || [];
      
      for (const shipment of shipments) {
        const shipmentData = {
          shipmentId: shipment.ShipmentId,
          shipmentName: shipment.ShipmentName,
          shipmentStatus: shipment.ShipmentStatus,
          destinationFulfillmentCenterId: shipment.DestinationFulfillmentCenterId,
          labelPrepPreference: shipment.LabelPrepPreference,
          areCasesRequired: shipment.AreCasesRequired,
          confirmedNeedByDate: shipment.ConfirmedNeedByDate ? new Date(shipment.ConfirmedNeedByDate) : null,
          lastUpdated: new Date()
        };

        await this.upsertFBAShipment(shipmentData);
      }

      logDebug(`✅ Processed ${shipments.length} FBA shipments`);
      return shipments;
      
    } catch (error) {
      logError('❌ Failed to sync FBA data:', error);
      throw error;
    }
  }

  async upsertInventoryItem(data) {
    try {
      await prisma.amazonInventory.upsert({
        where: { asin: data.asin },
        update: data,
        create: data
      });
    } catch (error) {
      logError('❌ Database error (inventory):', error);
    }
  }

  async upsertOrderItem(data) {
    try {
      await prisma.amazonOrder.upsert({
        where: { amazonOrderId: data.amazonOrderId },
        update: data,
        create: data
      });
    } catch (error) {
      logError('❌ Database error (orders):', error);
    }
  }

  async upsertFBAShipment(data) {
    try {
      await prisma.amazonFBAShipment.upsert({
        where: { shipmentId: data.shipmentId },
        update: data,
        create: data
      });
    } catch (error) {
      logError('❌ Database error (FBA):', error);
    }
  }

  startDataSync() {
    logDebug('🔄 Starting automated data sync (every 15 minutes)...');
    
    // Initial sync
    this.performFullSync();
    
    // Schedule regular syncs
    this.syncInterval = setInterval(() => {
      this.performFullSync();
    }, 15 * 60 * 1000); // 15 minutes
  }

  async performFullSync() {
    try {
      logDebug('🚀 Starting full Amazon data sync...');
      
      await Promise.all([
        this.syncInventoryData(),
        this.syncOrderData(),
        this.syncFBAData()
      ]);
      
      logDebug('✅ Full Amazon sync completed successfully');
      
    } catch (error) {
      logError('❌ Full sync failed:', error);
    }
  }

  async getInventorySummary() {
    // Try cache first
    const cached = await redisCache.getCachedWidget('amazon_inventory_summary');
    if (cached) return cached;

    // Fallback to database
    const inventoryItems = await prisma.amazonInventory.findMany({
      select: {
        totalQuantity: true,
        fulfillableQuantity: true,
        sku: true
      }
    });

    const summary = {
      totalSKUs: inventoryItems.length,
      totalQuantity: inventoryItems.reduce((sum, item) => sum + (item.totalQuantity || 0), 0),
      lowStockItems: inventoryItems.filter(item => (item.fulfillableQuantity || 0) < 10).length,
      lastSync: new Date().toISOString()
    };

    await redisCache.cacheWidget('amazon_inventory_summary', summary, 300);
    return summary;
  }

  async getOrderMetrics() {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);

    const orders = await prisma.amazonOrder.findMany({
      where: {
        purchaseDate: {
          gte: startTime,
          lte: endTime
        }
      }
    });

    const metrics = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + (order.orderTotal || 0), 0),
      averageOrderValue: orders.length > 0 ? orders.reduce((sum, order) => sum + (order.orderTotal || 0), 0) / orders.length : 0,
      unshippedOrders: orders.filter(order => order.orderStatus === 'Unshipped').length
    };

    await redisCache.cacheWidget('amazon_order_metrics', metrics, 300);
    return metrics;
  }

  stopDataSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      logDebug('⏹️ Amazon data sync stopped');
    }
  }

  async disconnect() {
    this.stopDataSync();
    this.isConnected = false;
    await prisma.$disconnect();
    logDebug('🔌 Amazon SP-API service disconnected');
  }
}

// Export singleton instance
const amazonSPAPIService = new AmazonSPAPIService();

export default amazonSPAPIService;