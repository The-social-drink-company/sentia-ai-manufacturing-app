/**
 * Unleashed ERP Integration Service
 * Provides REAL-TIME inventory data from Unleashed Software
 * NO MOCK DATA - Only real inventory from the ERP system
 */

import crypto from 'crypto';
import axios from 'axios';
import cron from 'node-cron';
import prisma from '../lib/prisma.js';
import { logInfo, logError, logWarn } from '../services/observability/structuredLogger.js';

class UnleashedIntegrationService {
  constructor() {
    this.apiId = process.env.UNLEASHED_API_ID;
    this.apiKey = process.env.UNLEASHED_API_KEY;
    this.baseUrl = process.env.UNLEASHED_API_URL || 'https://api.unleashedsoftware.com';
    this.syncJob = null;
    this.isConnected = false;
    this.lastSyncTime = null;

    // Initialize if credentials are available
    if (this.apiId && this.apiKey) {
      this.isConnected = true;
      logInfo('Unleashed Integration initialized with REAL API credentials');
    } else {
      logWarn('Unleashed API credentials not configured');
    }
  }

  /**
   * Generate HMAC signature for Unleashed API authentication
   */
  getSignature(query) {
    const hmac = crypto.createHmac('sha256', this.apiKey);
    hmac.update(query);
    return hmac.digest('base64');
  }

  /**
   * Make authenticated request to Unleashed API
   */
  async request(endpoint, params = {}, method = 'GET', data = null) {
    if (!this.isConnected) {
      throw new Error('Unleashed API not configured');
    }

    try {
      const query = new URLSearchParams(params).toString();
      const signature = this.getSignature(query);

      const config = {
        method,
        url: `${this.baseUrl}${endpoint}`,
        params,
        headers: {
          'api-auth-id': this.apiId,
          'api-auth-signature': signature,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return response.data;
    } catch (error) {
      logError(`Unleashed API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  /**
   * Sync all products from Unleashed
   */
  async syncProducts() {
    try {
      logInfo('Starting Unleashed products sync');

      const response = await this.request('/Products', {
        pageSize: 200,
        includeObsolete: false
      });

      const products = response.Items || [];
      let syncedCount = 0;

      for (const product of products) {
        await prisma.product.upsert({
          where: {
            sku: product.ProductCode
          },
          update: {
            name: product.ProductDescription,
            category: product.ProductGroup?.GroupName || 'Uncategorized',
            unitOfMeasure: product.UnitOfMeasure?.Name || 'Each',
            weight: product.Weight || 0,
            width: product.Width || 0,
            height: product.Height || 0,
            depth: product.Depth || 0,
            barcode: product.Barcode,
            isActive: !product.IsObsolete,
            lastModified: product.LastModifiedOn ? new Date(product.LastModifiedOn) : new Date(),
            metadata: {
              guid: product.Guid,
              notes: product.Notes,
              supplier: product.Supplier?.SupplierName,
              leadTime: product.LeadTime
            }
          },
          create: {
            sku: product.ProductCode,
            name: product.ProductDescription,
            category: product.ProductGroup?.GroupName || 'Uncategorized',
            unitOfMeasure: product.UnitOfMeasure?.Name || 'Each',
            weight: product.Weight || 0,
            width: product.Width || 0,
            height: product.Height || 0,
            depth: product.Depth || 0,
            barcode: product.Barcode,
            isActive: !product.IsObsolete,
            metadata: {
              guid: product.Guid,
              notes: product.Notes,
              supplier: product.Supplier?.SupplierName,
              leadTime: product.LeadTime
            }
          }
        });
        syncedCount++;
      }

      logInfo(`Synced ${syncedCount} products from Unleashed`);
      return syncedCount;
    } catch (error) {
      logError('Failed to sync Unleashed products', error);
      throw error;
    }
  }

  /**
   * Sync stock on hand from Unleashed
   */
  async syncStockOnHand() {
    try {
      logInfo('Starting Unleashed stock on hand sync');

      const response = await this.request('/StockOnHand', {
        pageSize: 200
      });

      const stockItems = response.Items || [];
      let syncedCount = 0;

      for (const item of stockItems) {
        await prisma.inventory.upsert({
          where: {
            sku_location: {
              sku: item.ProductCode,
              location: item.WarehouseCode || 'DEFAULT'
            }
          },
          update: {
            quantity: item.QtyOnHand || 0,
            allocatedQty: item.AllocatedQty || 0,
            availableQty: item.AvailableQty || 0,
            unitCost: item.AvgCost || 0,
            totalValue: (item.QtyOnHand || 0) * (item.AvgCost || 0),
            lastStockTake: item.LastModifiedOn ? new Date(item.LastModifiedOn) : new Date(),
            metadata: {
              guid: item.Guid,
              warehouse: item.WarehouseName,
              bin: item.BinLocation
            }
          },
          create: {
            sku: item.ProductCode,
            name: item.ProductDescription,
            location: item.WarehouseCode || 'DEFAULT',
            quantity: item.QtyOnHand || 0,
            allocatedQty: item.AllocatedQty || 0,
            availableQty: item.AvailableQty || 0,
            unitCost: item.AvgCost || 0,
            totalValue: (item.QtyOnHand || 0) * (item.AvgCost || 0),
            reorderPoint: item.MinStockAlertLevel || 0,
            reorderQuantity: item.ReorderQty || 0,
            metadata: {
              guid: item.Guid,
              warehouse: item.WarehouseName,
              bin: item.BinLocation
            }
          }
        });
        syncedCount++;
      }

      logInfo(`Synced ${syncedCount} inventory items from Unleashed`);
      return syncedCount;
    } catch (error) {
      logError('Failed to sync Unleashed stock on hand', error);
      throw error;
    }
  }

  /**
   * Sync purchase orders from Unleashed
   */
  async syncPurchaseOrders() {
    try {
      logInfo('Starting Unleashed purchase orders sync');

      const response = await this.request('/PurchaseOrders', {
        pageSize: 100,
        orderBy: 'OrderDate',
        sort: 'desc'
      });

      const purchaseOrders = response.Items || [];
      let syncedCount = 0;

      for (const po of purchaseOrders) {
        await prisma.purchaseOrder.upsert({
          where: {
            orderNumber: po.OrderNumber
          },
          update: {
            supplier: po.Supplier?.SupplierName || 'Unknown',
            orderDate: new Date(po.OrderDate),
            requiredDate: po.RequiredDate ? new Date(po.RequiredDate) : null,
            status: po.OrderStatus,
            subTotal: po.SubTotal || 0,
            taxTotal: po.TaxTotal || 0,
            total: po.Total || 0,
            currency: po.Currency?.Code || 'USD',
            deliveryAddress: po.DeliveryAddress,
            comments: po.Comments,
            metadata: {
              guid: po.Guid,
              supplierCode: po.Supplier?.SupplierCode,
              lines: po.PurchaseOrderLines
            }
          },
          create: {
            orderNumber: po.OrderNumber,
            supplier: po.Supplier?.SupplierName || 'Unknown',
            orderDate: new Date(po.OrderDate),
            requiredDate: po.RequiredDate ? new Date(po.RequiredDate) : null,
            status: po.OrderStatus,
            subTotal: po.SubTotal || 0,
            taxTotal: po.TaxTotal || 0,
            total: po.Total || 0,
            currency: po.Currency?.Code || 'USD',
            deliveryAddress: po.DeliveryAddress,
            comments: po.Comments,
            metadata: {
              guid: po.Guid,
              supplierCode: po.Supplier?.SupplierCode,
              lines: po.PurchaseOrderLines
            }
          }
        });
        syncedCount++;
      }

      logInfo(`Synced ${syncedCount} purchase orders from Unleashed`);
      return syncedCount;
    } catch (error) {
      logError('Failed to sync Unleashed purchase orders', error);
      throw error;
    }
  }

  /**
   * Sync sales orders from Unleashed
   */
  async syncSalesOrders() {
    try {
      logInfo('Starting Unleashed sales orders sync');

      const response = await this.request('/SalesOrders', {
        pageSize: 100,
        orderBy: 'OrderDate',
        sort: 'desc'
      });

      const salesOrders = response.Items || [];
      let syncedCount = 0;

      for (const so of salesOrders) {
        await prisma.salesOrder.upsert({
          where: {
            orderNumber: so.OrderNumber
          },
          update: {
            customer: so.Customer?.CustomerName || 'Unknown',
            orderDate: new Date(so.OrderDate),
            requiredDate: so.RequiredDate ? new Date(so.RequiredDate) : null,
            status: so.OrderStatus,
            subTotal: so.SubTotal || 0,
            taxTotal: so.TaxTotal || 0,
            total: so.Total || 0,
            currency: so.Currency?.Code || 'USD',
            deliveryAddress: so.DeliveryAddress,
            deliveryMethod: so.DeliveryMethod,
            trackingNumber: so.TrackingNumber,
            comments: so.Comments,
            metadata: {
              guid: so.Guid,
              customerCode: so.Customer?.CustomerCode,
              lines: so.SalesOrderLines
            }
          },
          create: {
            orderNumber: so.OrderNumber,
            customer: so.Customer?.CustomerName || 'Unknown',
            orderDate: new Date(so.OrderDate),
            requiredDate: so.RequiredDate ? new Date(so.RequiredDate) : null,
            status: so.OrderStatus,
            subTotal: so.SubTotal || 0,
            taxTotal: so.TaxTotal || 0,
            total: so.Total || 0,
            currency: so.Currency?.Code || 'USD',
            deliveryAddress: so.DeliveryAddress,
            deliveryMethod: so.DeliveryMethod,
            trackingNumber: so.TrackingNumber,
            comments: so.Comments,
            metadata: {
              guid: so.Guid,
              customerCode: so.Customer?.CustomerCode,
              lines: so.SalesOrderLines
            }
          }
        });
        syncedCount++;
      }

      logInfo(`Synced ${syncedCount} sales orders from Unleashed`);
      return syncedCount;
    } catch (error) {
      logError('Failed to sync Unleashed sales orders', error);
      throw error;
    }
  }

  /**
   * Sync stock movements from Unleashed
   */
  async syncStockMovements() {
    try {
      logInfo('Starting Unleashed stock movements sync');

      // Get stock movements for the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const response = await this.request('/StockMovements', {
        pageSize: 200,
        modifiedSince: sevenDaysAgo.toISOString()
      });

      const movements = response.Items || [];
      let syncedCount = 0;

      for (const movement of movements) {
        await prisma.stockMovement.create({
          data: {
            productCode: movement.ProductCode,
            warehouse: movement.WarehouseCode,
            movementType: movement.MovementType,
            quantity: movement.Quantity,
            unitCost: movement.Cost || 0,
            totalCost: (movement.Quantity || 0) * (movement.Cost || 0),
            reference: movement.Reference,
            movementDate: new Date(movement.CompletedDate),
            reason: movement.Reason,
            metadata: {
              guid: movement.Guid,
              orderNumber: movement.OrderNumber,
              customerSupplier: movement.CustomerSupplier
            }
          }
        });
        syncedCount++;
      }

      logInfo(`Synced ${syncedCount} stock movements from Unleashed`);
      return syncedCount;
    } catch (error) {
      logError('Failed to sync Unleashed stock movements', error);
      throw error;
    }
  }

  /**
   * Full sync of all Unleashed data
   */
  async syncAllData() {
    try {
      logInfo('Starting full Unleashed data sync');

      const results = {
        products: await this.syncProducts(),
        stockOnHand: await this.syncStockOnHand(),
        purchaseOrders: await this.syncPurchaseOrders(),
        salesOrders: await this.syncSalesOrders(),
        stockMovements: await this.syncStockMovements()
      };

      this.lastSyncTime = new Date();

      // Update integration status
      await prisma.integration.upsert({
        where: { service: 'unleashed' },
        update: {
          status: 'connected',
          lastSync: this.lastSyncTime,
          metadata: {
            lastSyncResults: results,
            apiId: this.apiId
          }
        },
        create: {
          service: 'unleashed',
          status: 'connected',
          lastSync: this.lastSyncTime,
          metadata: {
            lastSyncResults: results,
            apiId: this.apiId
          }
        }
      });

      logInfo('Full Unleashed sync completed', results);
      return results;
    } catch (error) {
      logError('Full Unleashed sync failed', error);

      // Update status to error
      await prisma.integration.upsert({
        where: { service: 'unleashed' },
        update: {
          status: 'error',
          metadata: {
            lastError: error.message,
            errorTime: new Date()
          }
        },
        create: {
          service: 'unleashed',
          status: 'error',
          metadata: {
            lastError: error.message,
            errorTime: new Date()
          }
        }
      });

      throw error;
    }
  }

  /**
   * Start automated sync schedule
   */
  startAutomatedSync() {
    // Stop existing job if any
    if (this.syncJob) {
      this.syncJob.stop();
    }

    // Schedule sync every 15 minutes
    this.syncJob = cron.schedule('*/15 * * * *', async () => {
      logInfo('Running automated Unleashed sync');
      try {
        await this.syncAllData();
      } catch (error) {
        logError('Automated Unleashed sync failed', error);
      }
    });

    logInfo('Automated Unleashed sync scheduled (every 15 minutes)');
  }

  /**
   * Stop automated sync
   */
  stopAutomatedSync() {
    if (this.syncJob) {
      this.syncJob.stop();
      this.syncJob = null;
      logInfo('Automated Unleashed sync stopped');
    }
  }

  /**
   * Get real-time stock level for a specific product
   */
  async getRealTimeStock(productCode) {
    try {
      const response = await this.request(`/StockOnHand/${productCode}`);
      return {
        productCode: response.ProductCode,
        totalOnHand: response.QtyOnHand,
        allocated: response.AllocatedQty,
        available: response.AvailableQty,
        warehouses: response.WarehouseStockList || []
      };
    } catch (error) {
      logError(`Failed to get real-time stock for ${productCode}`, error);
      throw error;
    }
  }

  /**
   * Check connection status
   */
  async checkConnectionStatus() {
    try {
      if (!this.isConnected) {
        return {
          connected: false,
          status: 'not_configured',
          message: 'Unleashed API credentials not configured'
        };
      }

      // Test connection with a simple API call
      await this.request('/Currencies', { pageSize: 1 });

      const integration = await prisma.integration.findUnique({
        where: { service: 'unleashed' }
      });

      return {
        connected: true,
        status: 'connected',
        message: 'Unleashed connected successfully',
        lastSync: integration?.lastSync || this.lastSyncTime,
        apiId: this.apiId
      };
    } catch (error) {
      logError('Failed to check Unleashed connection status', error);
      return {
        connected: false,
        status: 'error',
        message: error.message
      };
    }
  }

  /**
   * Manual sync trigger
   */
  async triggerManualSync() {
    try {
      logInfo('Manual Unleashed sync triggered');
      const results = await this.syncAllData();
      return {
        success: true,
        results,
        timestamp: new Date()
      };
    } catch (error) {
      logError('Manual Unleashed sync failed', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }
}

// Create singleton instance
const unleashedIntegration = new UnleashedIntegrationService();

// Start automated sync if configured
if (unleashedIntegration.isConnected) {
  unleashedIntegration.startAutomatedSync();
}

export default unleashedIntegration;