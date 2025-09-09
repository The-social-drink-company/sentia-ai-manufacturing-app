#!/usr/bin/env node

/**
 * Amazon SP-API Configuration and Setup
 * Production-ready implementation with real credentials
 */

import pkg from 'amazon-sp-api';
const { SellingPartnerApi } = pkg;
import { PrismaClient } from '@prisma/client';
import { logInfo, logError, logWarn } from '../observability/structuredLogger.js';

const prisma = new PrismaClient();

export class AmazonSPAPIManager {
  constructor() {
    this.spApi = null;
    this.isConfigured = false;
    this.isConnected = false;
    this.marketplace = 'A1PA6795UKMFR9'; // UK marketplace default
    this.credentials = this.loadCredentials();
  }

  loadCredentials() {
    const requiredVars = [
      'AMAZON_REFRESH_TOKEN',
      'AMAZON_LWA_APP_ID', 
      'AMAZON_LWA_CLIENT_SECRET',
      'AMAZON_SP_ROLE_ARN'
    ];

    const credentials = {
      refresh_token: process.env.AMAZON_REFRESH_TOKEN,
      lwa_app_id: process.env.AMAZON_LWA_APP_ID,
      lwa_client_secret: process.env.AMAZON_LWA_CLIENT_SECRET,
      aws_selling_partner_role: process.env.AMAZON_SP_ROLE_ARN,
      region: process.env.AMAZON_REGION || 'us-east-1',
      marketplace_id: process.env.AMAZON_MARKETPLACE_ID || 'A1PA6795UKMFR9'
    };

    // Check if all required credentials are present and valid
    const missingVars = requiredVars.filter(varName => 
      !process.env[varName] || 
      process.env[varName] === 'your_key_here' ||
      process.env[varName] === 'placeholder' ||
      process.env[varName].length < 10
    );

    if (missingVars.length === 0) {
      this.isConfigured = true;
      logInfo('Amazon SP-API credentials found and appear valid');
    } else {
      this.isConfigured = false;
      logWarn('Amazon SP-API not configured', { missing: missingVars });
    }

    return credentials;
  }

  async initialize() {
    if (!this.isConfigured) {
      logWarn('Amazon SP-API not configured - skipping initialization');
      return false;
    }

    try {
      logInfo('Initializing Amazon SP-API connection');
      
      this.spApi = new SellingPartnerApi({
        region: this.credentials.region,
        refresh_token: this.credentials.refresh_token,
        credentials: {
          SELLING_PARTNER_APP_CLIENT_ID: this.credentials.lwa_app_id,
          SELLING_PARTNER_APP_CLIENT_SECRET: this.credentials.lwa_client_secret,
          AWS_SELLING_PARTNER_ROLE: this.credentials.aws_selling_partner_role
        },
        debug: process.env.NODE_ENV === 'development'
      });

      // Test connection with a simple API call
      await this.testConnection();
      this.isConnected = true;
      
      logInfo('Amazon SP-API initialized successfully');
      return true;
      
    } catch (error) {
      logError('Failed to initialize Amazon SP-API', error);
      this.isConnected = false;
      return false;
    }
  }

  async testConnection() {
    try {
      // Test with marketplace participation API
      const participation = await this.spApi.callAPI({
        operation: 'getMarketplaceParticipations',
        endpoint: 'sellers'
      });
      
      if (participation && participation.payload) {
        logInfo('Amazon SP-API connection test successful');
        return true;
      } else {
        throw new Error('Invalid response from marketplace participation API');
      }
    } catch (error) {
      logError('Amazon SP-API connection test failed', error);
      throw error;
    }
  }

  async syncOrderData() {
    if (!this.isConnected) {
      logWarn('Amazon SP-API not connected - cannot sync orders');
      return [];
    }

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const orders = await this.spApi.callAPI({
        operation: 'getOrders',
        endpoint: 'orders',
        query: {
          MarketplaceIds: this.credentials.marketplace_id,
          CreatedAfter: thirtyDaysAgo.toISOString(),
          OrderStatuses: 'Unshipped,PartiallyShipped,Shipped'
        }
      });

      if (orders && orders.payload && orders.payload.Orders) {
        const orderData = orders.payload.Orders.map(order => ({
          orderId: order.AmazonOrderId,
          purchaseDate: new Date(order.PurchaseDate),
          orderStatus: order.OrderStatus,
          totalAmount: parseFloat(order.OrderTotal?.Amount || 0),
          currency: order.OrderTotal?.CurrencyCode || 'GBP',
          marketplace: order.MarketplaceId,
          shipServiceLevel: order.ShipServiceLevel,
          source: 'amazon_sp_api',
          raw_data: order
        }));

        // Store in database
        await this.storeOrderData(orderData);
        
        logInfo('Amazon orders synchronized', { count: orderData.length });
        return orderData;
      }

      return [];
    } catch (error) {
      logError('Failed to sync Amazon order data', error);
      return [];
    }
  }

  async syncInventoryData() {
    if (!this.isConnected) {
      logWarn('Amazon SP-API not connected - cannot sync inventory');
      return [];
    }

    try {
      const inventory = await this.spApi.callAPI({
        operation: 'getInventorySummaries',
        endpoint: 'fbaInventory',
        query: {
          granularityType: 'Marketplace',
          granularityId: this.credentials.marketplace_id,
          marketplaceIds: this.credentials.marketplace_id
        }
      });

      if (inventory && inventory.payload && inventory.payload.inventorySummaries) {
        const inventoryData = inventory.payload.inventorySummaries.map(item => ({
          asin: item.asin,
          fnSku: item.fnSku,
          sellerSku: item.sellerSku,
          condition: item.condition,
          totalQuantity: item.totalQuantity || 0,
          inStockSupplyQuantity: item.inStockSupplyQuantity || 0,
          reservedQuantity: item.reservedQuantity?.totalReservedQuantity || 0,
          source: 'amazon_sp_api',
          lastUpdated: new Date(),
          raw_data: item
        }));

        await this.storeInventoryData(inventoryData);
        
        logInfo('Amazon inventory synchronized', { count: inventoryData.length });
        return inventoryData;
      }

      return [];
    } catch (error) {
      logError('Failed to sync Amazon inventory data', error);
      return [];
    }
  }

  async storeOrderData(orders) {
    try {
      for (const order of orders) {
        await prisma.historicalSale.upsert({
          where: {
            external_id: order.orderId
          },
          update: {
            amount: order.totalAmount,
            currency: order.currency,
            order_status: order.orderStatus,
            updated_at: new Date(),
            raw_data: order.raw_data
          },
          create: {
            external_id: order.orderId,
            sale_date: order.purchaseDate,
            amount: order.totalAmount,
            currency: order.currency,
            channel: 'Amazon',
            order_status: order.orderStatus,
            marketplace: order.marketplace,
            source: order.source,
            raw_data: order.raw_data,
            created_by: 'system'
          }
        });
      }
      
      logInfo('Amazon order data stored successfully', { count: orders.length });
    } catch (error) {
      logError('Failed to store Amazon order data', error);
      throw error;
    }
  }

  async storeInventoryData(inventory) {
    try {
      for (const item of inventory) {
        await prisma.inventoryLevel.upsert({
          where: {
            sku: item.sellerSku
          },
          update: {
            quantity_on_hand: item.totalQuantity,
            quantity_available: item.inStockSupplyQuantity,
            quantity_reserved: item.reservedQuantity,
            last_updated: new Date(),
            raw_data: item.raw_data
          },
          create: {
            sku: item.sellerSku,
            product_name: item.asin, // Will be enriched later
            quantity_on_hand: item.totalQuantity,
            quantity_available: item.inStockSupplyQuantity,
            quantity_reserved: item.reservedQuantity,
            location: 'Amazon FBA',
            source: item.source,
            raw_data: item.raw_data,
            created_by: 'system'
          }
        });
      }
      
      logInfo('Amazon inventory data stored successfully', { count: inventory.length });
    } catch (error) {
      logError('Failed to store Amazon inventory data', error);
      throw error;
    }
  }

  getConnectionStatus() {
    return {
      configured: this.isConfigured,
      connected: this.isConnected,
      service: 'Amazon SP-API',
      lastSync: this.lastSyncTime,
      credentials: {
        hasRefreshToken: !!this.credentials.refresh_token,
        hasAppId: !!this.credentials.lwa_app_id,
        hasClientSecret: !!this.credentials.lwa_client_secret,
        hasRoleArn: !!this.credentials.aws_selling_partner_role,
        region: this.credentials.region,
        marketplace: this.credentials.marketplace_id
      }
    };
  }

  async performFullSync() {
    if (!this.isConnected) {
      logWarn('Cannot perform full sync - Amazon SP-API not connected');
      return false;
    }

    try {
      logInfo('Starting full Amazon SP-API sync');
      
      const [orders, inventory] = await Promise.all([
        this.syncOrderData(),
        this.syncInventoryData()
      ]);

      this.lastSyncTime = new Date();
      
      logInfo('Full Amazon SP-API sync completed', {
        orders: orders.length,
        inventory: inventory.length,
        timestamp: this.lastSyncTime
      });

      return {
        success: true,
        orders: orders.length,
        inventory: inventory.length,
        timestamp: this.lastSyncTime
      };
      
    } catch (error) {
      logError('Full Amazon SP-API sync failed', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  generateConfigurationGuide() {
    return {
      title: 'Amazon SP-API Configuration Guide',
      steps: [
        {
          step: 1,
          title: 'Register Amazon Developer Account',
          description: 'Create an account at https://developer.amazonservices.com'
        },
        {
          step: 2,
          title: 'Create SP-API Application',
          description: 'Register your application in Seller Central -> Apps & Services -> Develop apps'
        },
        {
          step: 3,
          title: 'Obtain LWA Credentials',
          description: 'Get LWA App ID and Client Secret from your application'
        },
        {
          step: 4,
          title: 'Set up IAM Role',
          description: 'Create AWS IAM role with SP-API permissions'
        },
        {
          step: 5,
          title: 'Get Refresh Token',
          description: 'Generate refresh token through OAuth authorization flow'
        },
        {
          step: 6,
          title: 'Configure Environment Variables',
          description: 'Add credentials to .env file',
          variables: [
            'AMAZON_REFRESH_TOKEN=your_refresh_token',
            'AMAZON_LWA_APP_ID=your_app_id',
            'AMAZON_LWA_CLIENT_SECRET=your_client_secret',
            'AMAZON_SP_ROLE_ARN=arn:aws:iam::account:role/your-role',
            'AMAZON_REGION=us-east-1',
            'AMAZON_MARKETPLACE_ID=A1PA6795UKMFR9'
          ]
        }
      ],
      currentStatus: this.getConnectionStatus()
    };
  }
}

export const amazonSPAPI = new AmazonSPAPIManager();