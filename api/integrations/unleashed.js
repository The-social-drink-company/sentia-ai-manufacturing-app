/**
 * Unleashed Inventory Management Integration
 * Real-time inventory and manufacturing data synchronization
 */

import axios from 'axios';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { logDebug, logInfo, logWarn, logError } from '../../services/observability/structuredLogger.js';

const prisma = new PrismaClient();

class UnleashedIntegration {
  constructor() {
    this.apiId = process.env.UNLEASHED_API_ID;
    this.apiKey = process.env.UNLEASHED_API_KEY;
    this.baseUrl = process.env.UNLEASHED_API_URL || 'https://api.unleashedsoftware.com';
    this.lastSync = null;
    this.syncInterval = 10 * 60 * 1000; // 10 minutes

    if (!this.apiId || !this.apiKey) {
      logWarn('Unleashed API credentials not configured');
    }
  }

  generateSignature(query = '') {
    const queryString = query ? `?${query}` : '';
    const hash = crypto
      .createHmac('sha256', this.apiKey)
      .update(queryString)
      .digest('base64');
    return hash;
  }

  async makeRequest(endpoint, params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const signature = this.generateSignature(queryString);

      const response = await axios({
        method: 'GET',
        url: `${this.baseUrl}/${endpoint}`,
        params,
        headers: {
          'api-auth-id': this.apiId,
          'api-auth-signature': signature,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      logError('Unleashed API request failed', { endpoint, error: error.message });
      throw error;
    }
  }

  async syncInventory() {
    try {
      logInfo('Starting Unleashed inventory sync');

      // Fetch products with stock levels
      const productsResponse = await this.makeRequest('Products', {
        pageSize: 500,
        includeObsolete: false
      });

      const products = productsResponse.Items || [];
      let syncedCount = 0;

      for (const product of products) {
        // Get stock on hand for each product
        const stockResponse = await this.makeRequest(`StockOnHand/${product.Guid}`);

        const inventoryData = {
          sku: product.ProductCode,
          productName: product.ProductDescription,
          category: product.ProductGroup?.GroupName,
          unitOfMeasure: product.UnitOfMeasure?.Code,
          costPrice: parseFloat(product.AverageLandPrice || 0),
          sellPrice: parseFloat(product.DefaultSellPrice || 0),
          stockOnHand: 0,
          stockAvailable: 0,
          stockAllocated: 0,
          reorderPoint: product.ReorderPoint || 0,
          reorderQuantity: product.ReorderQuantity || 0,
          supplier: product.Supplier?.SupplierName,
          warehouse: 'Main',
          lastUpdated: new Date()
        };

        // Calculate total stock across warehouses
        if (stockResponse && stockResponse.length > 0) {
          stockResponse.forEach(warehouse => {
            inventoryData.stockOnHand += parseFloat(warehouse.QtyOnHand || 0);
            inventoryData.stockAvailable += parseFloat(warehouse.AvailableQty || 0);
            inventoryData.stockAllocated += parseFloat(warehouse.AllocatedQty || 0);
          });
        }

        // Upsert inventory record
        await prisma.inventory.upsert({
          where: { sku: product.ProductCode },
          update: inventoryData,
          create: inventoryData
        });

        syncedCount++;
      }

      // Store sync log
      await prisma.integrationLog.create({
        data: {
          integration: 'unleashed',
          action: 'sync_inventory',
          status: 'success',
          recordsProcessed: syncedCount,
          metadata: {
            totalProducts: products.length,
            timestamp: new Date().toISOString()
          },
          timestamp: new Date()
        }
      });

      logInfo(`Unleashed inventory sync completed: ${syncedCount} products`);
      this.lastSync = new Date();

      return {
        success: true,
        productsProcessed: syncedCount,
        lastSync: this.lastSync
      };
    } catch (error) {
      logError('Unleashed inventory sync error:', error);

      await prisma.integrationLog.create({
        data: {
          integration: 'unleashed',
          action: 'sync_inventory',
          status: 'error',
          error: error.message,
          timestamp: new Date()
        }
      });

      throw error;
    }
  }

  async syncProductionOrders() {
    try {
      logInfo('Syncing Unleashed production orders');

      // Fetch assembly orders (production orders)
      const ordersResponse = await this.makeRequest('AssemblyOrders', {
        pageSize: 200,
        orderBy: 'AssemblyOrderDate',
        sort: 'desc'
      });

      const orders = ordersResponse.Items || [];
      let processedCount = 0;

      for (const order of orders) {
        const orderData = {
          orderNumber: order.AssemblyOrderNumber,
          productSku: order.Product?.ProductCode,
          productName: order.Product?.ProductDescription,
          quantityRequired: parseFloat(order.AssemblyQty || 0),
          quantityCompleted: parseFloat(order.AssembledQty || 0),
          status: order.OrderStatus,
          startDate: order.AssemblyOrderDate ? new Date(order.AssemblyOrderDate) : null,
          dueDate: order.RequiredByDate ? new Date(order.RequiredByDate) : null,
          completedDate: order.CompletedDate ? new Date(order.CompletedDate) : null,
          warehouse: order.Warehouse?.WarehouseName || 'Main',
          notes: order.Comments,
          lastUpdated: new Date()
        };

        // Store production order
        await prisma.productionOrder.upsert({
          where: { orderNumber: order.AssemblyOrderNumber },
          update: orderData,
          create: orderData
        });

        processedCount++;
      }

      logInfo(`Unleashed production orders synced: ${processedCount}`);

      return {
        success: true,
        ordersProcessed: processedCount
      };
    } catch (error) {
      logError('Production orders sync error:', error);
      throw error;
    }
  }

  async syncPurchaseOrders() {
    try {
      logInfo('Syncing Unleashed purchase orders');

      const ordersResponse = await this.makeRequest('PurchaseOrders', {
        pageSize: 200,
        orderBy: 'OrderDate',
        sort: 'desc'
      });

      const orders = ordersResponse.Items || [];
      let processedCount = 0;

      for (const order of orders) {
        const orderData = {
          orderNumber: order.OrderNumber,
          supplier: order.Supplier?.SupplierName,
          status: order.OrderStatus,
          orderDate: order.OrderDate ? new Date(order.OrderDate) : null,
          requiredDate: order.RequiredDate ? new Date(order.RequiredDate) : null,
          subTotal: parseFloat(order.SubTotal || 0),
          taxTotal: parseFloat(order.TaxTotal || 0),
          total: parseFloat(order.Total || 0),
          currency: order.Currency?.CurrencyCode || 'GBP',
          warehouse: order.Warehouse?.WarehouseName || 'Main',
          lineItems: [],
          lastUpdated: new Date()
        };

        // Process line items
        if (order.PurchaseOrderLines) {
          orderData.lineItems = order.PurchaseOrderLines.map(line => ({
            sku: line.Product?.ProductCode,
            productName: line.Product?.ProductDescription,
            quantity: parseFloat(line.OrderQuantity || 0),
            unitPrice: parseFloat(line.UnitPrice || 0),
            lineTotal: parseFloat(line.LineTotal || 0),
            received: parseFloat(line.ReceivedQuantity || 0)
          }));
        }

        // Store purchase order
        await prisma.purchaseOrder.upsert({
          where: { orderNumber: order.OrderNumber },
          update: orderData,
          create: orderData
        });

        processedCount++;
      }

      logInfo(`Unleashed purchase orders synced: ${processedCount}`);

      return {
        success: true,
        ordersProcessed: processedCount
      };
    } catch (error) {
      logError('Purchase orders sync error:', error);
      throw error;
    }
  }

  async syncSalesOrders() {
    try {
      logInfo('Syncing Unleashed sales orders');

      const ordersResponse = await this.makeRequest('SalesOrders', {
        pageSize: 200,
        orderBy: 'OrderDate',
        sort: 'desc'
      });

      const orders = ordersResponse.Items || [];
      let processedCount = 0;

      for (const order of orders) {
        const orderData = {
          externalId: `unleashed_${order.OrderNumber}`,
          source: 'unleashed',
          orderNumber: order.OrderNumber,
          customerName: order.Customer?.CustomerName,
          customerCode: order.Customer?.CustomerCode,
          status: order.OrderStatus,
          orderDate: order.OrderDate ? new Date(order.OrderDate) : null,
          requiredDate: order.RequiredDate ? new Date(order.RequiredDate) : null,
          subTotal: parseFloat(order.SubTotal || 0),
          taxTotal: parseFloat(order.TaxTotal || 0),
          totalAmount: parseFloat(order.Total || 0),
          currency: order.Currency?.CurrencyCode || 'GBP',
          warehouse: order.Warehouse?.WarehouseName || 'Main',
          shippingAddress: {
            company: order.DeliveryName,
            street: order.DeliveryStreetAddress,
            suburb: order.DeliverySuburb,
            city: order.DeliveryCity,
            region: order.DeliveryRegion,
            country: order.DeliveryCountry,
            postalCode: order.DeliveryPostCode
          },
          lineItems: [],
          updatedAt: new Date()
        };

        // Process line items
        if (order.SalesOrderLines) {
          orderData.lineItems = order.SalesOrderLines.map(line => ({
            sku: line.Product?.ProductCode,
            productName: line.Product?.ProductDescription,
            quantity: parseFloat(line.OrderQuantity || 0),
            unitPrice: parseFloat(line.UnitPrice || 0),
            discount: parseFloat(line.DiscountRate || 0),
            lineTotal: parseFloat(line.LineTotal || 0),
            dispatched: parseFloat(line.DispatchQuantity || 0)
          }));
        }

        // Store sales order
        await prisma.salesOrder.upsert({
          where: { externalId: orderData.externalId },
          update: orderData,
          create: orderData
        });

        processedCount++;
      }

      logInfo(`Unleashed sales orders synced: ${processedCount}`);

      return {
        success: true,
        ordersProcessed: processedCount
      };
    } catch (error) {
      logError('Sales orders sync error:', error);
      throw error;
    }
  }

  async getBillOfMaterials(productCode) {
    try {
      // Find product
      const productsResponse = await this.makeRequest('Products', {
        productCode: productCode
      });

      if (!productsResponse.Items || productsResponse.Items.length === 0) {
        throw new Error(`Product not found: ${productCode}`);
      }

      const product = productsResponse.Items[0];

      // Get BOM
      const bomResponse = await this.makeRequest(`Products/${product.Guid}/BillOfMaterials`);

      if (!bomResponse) {
        return null;
      }

      return {
        productCode: product.ProductCode,
        productName: product.ProductDescription,
        components: bomResponse.BillOfMaterialsLines?.map(line => ({
          componentCode: line.Product?.ProductCode,
          componentName: line.Product?.ProductDescription,
          quantity: parseFloat(line.Quantity || 0),
          unitOfMeasure: line.Product?.UnitOfMeasure?.Code,
          wastage: parseFloat(line.WastagePercent || 0)
        })) || []
      };
    } catch (error) {
      logError('BOM fetch error:', error);
      throw error;
    }
  }

  async getStockMovements(days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const movementsResponse = await this.makeRequest('StockMovements', {
        startDate: startDate.toISOString(),
        pageSize: 500
      });

      const movements = movementsResponse.Items || [];

      return movements.map(movement => ({
        date: movement.CreatedOn,
        productCode: movement.Product?.ProductCode,
        productName: movement.Product?.ProductDescription,
        quantity: parseFloat(movement.Quantity || 0),
        movementType: movement.Type,
        warehouse: movement.Warehouse?.WarehouseName,
        reference: movement.Reference,
        notes: movement.Notes
      }));
    } catch (error) {
      logError('Stock movements fetch error:', error);
      throw error;
    }
  }

  async getWarehouseStock(warehouseCode = null) {
    try {
      const params = {};
      if (warehouseCode) {
        params.warehouseCode = warehouseCode;
      }

      const stockResponse = await this.makeRequest('StockOnHand', params);

      return stockResponse.map(item => ({
        productCode: item.ProductCode,
        productDescription: item.ProductDescription,
        warehouse: item.WarehouseCode,
        qtyOnHand: parseFloat(item.QtyOnHand || 0),
        availableQty: parseFloat(item.AvailableQty || 0),
        allocatedQty: parseFloat(item.AllocatedQty || 0),
        avgCost: parseFloat(item.AvgCost || 0),
        totalCost: parseFloat(item.TotalCost || 0)
      }));
    } catch (error) {
      logError('Warehouse stock fetch error:', error);
      throw error;
    }
  }

  async runFullSync() {
    try {
      logInfo('Starting full Unleashed sync');

      const results = {
        inventory: await this.syncInventory(),
        salesOrders: await this.syncSalesOrders(),
        purchaseOrders: await this.syncPurchaseOrders(),
        productionOrders: await this.syncProductionOrders()
      };

      logInfo('Full Unleashed sync completed', results);

      return {
        success: true,
        results,
        syncTime: new Date()
      };
    } catch (error) {
      logError('Full sync error:', error);
      throw error;
    }
  }
}

// Export singleton instance
const unleashedIntegration = new UnleashedIntegration();
export default unleashedIntegration;

// Also export class for testing
export { UnleashedIntegration };