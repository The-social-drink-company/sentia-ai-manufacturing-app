/**
 * Unleashed ERP Integration for MCP Server
 * Handles all Unleashed API interactions through the MCP architecture
 * Provides REAL inventory data - NO MOCK DATA
 */

import crypto from 'crypto';
import axios from 'axios';
import winston from 'winston';

class UnleashedIntegrationMCP {
  constructor() {
    this.apiId = process.env.UNLEASHED_API_ID;
    this.apiKey = process.env.UNLEASHED_API_KEY;
    this.baseUrl = process.env.UNLEASHED_API_URL || 'https://api.unleashedsoftware.com';
    this.isInitialized = false;
    this.lastSyncTime = null;

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/unleashed-integration.log' })
      ]
    });
  }

  async initialize() {
    try {
      if (!this.apiId || !this.apiKey) {
        this.logger.warn('Unleashed API credentials not configured');
        return {
          success: false,
          error: 'Missing UNLEASHED_API_ID or UNLEASHED_API_KEY'
        };
      }

      // Test connection
      await this.testConnection();

      this.isInitialized = true;
      this.logger.info('✅ Unleashed Integration initialized for MCP Server');
      return { success: true };
    } catch (error) {
      this.logger.error('Failed to initialize Unleashed integration', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate HMAC signature for Unleashed API authentication
   */
  getSignature(query) {
    if (!this.apiKey) {
      throw new Error('Unleashed API key not configured');
    }
    const hmac = crypto.createHmac('sha256', this.apiKey);
    hmac.update(query);
    return hmac.digest('base64');
  }

  /**
   * Make authenticated request to Unleashed API with retry logic
   */
  async makeRequest(endpoint, params = {}, method = 'GET', data = null, retries = 3) {
    if (!this.apiId || !this.apiKey) {
      throw new Error('Unleashed API not configured');
    }

    let lastError;
    let baseDelay = 1000; // Start with 1 second delay

    for (let attempt = 0; attempt <= retries; attempt++) {
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
          },
          timeout: 60000 // Increased to 60 seconds
        };

        if (data) {
          config.data = data;
        }

        // Log attempt info for debugging
        if (attempt > 0) {
          this.logger.info(`Retry attempt ${attempt} for ${endpoint}`);
        }

        const response = await axios(config);
        return response.data;
      } catch (error) {
        lastError = error;

        // Check if it's a timeout or network error
        const isRetriableError = error.code === 'ECONNABORTED' ||
                                 error.code === 'ETIMEDOUT' ||
                                 error.code === 'ENOTFOUND' ||
                                 error.code === 'ECONNREFUSED' ||
                                 (error.response && error.response.status >= 500);

        if (attempt < retries && isRetriableError) {
          // Calculate exponential backoff delay with jitter
          const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;

          this.logger.warn(`Request to ${endpoint} failed, retrying in ${Math.round(delay)}ms`, {
            error: error.message,
            attempt: attempt + 1,
            maxRetries: retries
          });

          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          // Final attempt failed or non-retriable error
          this.logger.error(`Unleashed API request failed: ${endpoint}`, {
            error: error.message,
            endpoint,
            method,
            attempts: attempt + 1,
            code: error.code,
            status: error.response?.status
          });
          throw error;
        }
      }
    }

    throw lastError;
  }

  /**
   * Test API connection
   */
  async testConnection() {
    try {
      const response = await this.makeRequest('/Currencies', { pageSize: 1 });
      this.logger.info('Unleashed connection test successful');
      return { success: true, data: response };
    } catch (error) {
      this.logger.error('Unleashed connection test failed', error);
      throw error;
    }
  }

  // MCP Tool: Get Inventory Data with automatic pagination
  async getInventoryData(params = {}) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const {
        productCode,
        warehouse,
        includeAllocated = true,
        pageSize = 200,
        maxPages = 10 // Safety limit to prevent infinite loops
      } = params;

      let endpoint = '/StockOnHand';
      const allStockItems = [];
      let currentPage = 1;
      let hasMorePages = true;
      let totalPages = 0;

      // Fetch all pages of inventory data
      while (hasMorePages && currentPage <= maxPages) {
        const queryParams = {
          pageSize,
          page: currentPage
        };

        if (productCode) {
          queryParams.productCode = productCode;
        }
        if (warehouse) {
          queryParams.warehouseCode = warehouse;
        }

        this.logger.info(`Fetching inventory page ${currentPage}`, {
          endpoint,
          pageSize,
          productCode,
          warehouse
        });

        const response = await this.makeRequest(endpoint, queryParams);
        const pageItems = response.Items || [];

        // Add items from this page to the collection
        allStockItems.push(...pageItems);

        // Check pagination info
        const pagination = response.Pagination || {};
        totalPages = pagination.NumberOfPages || 1;
        hasMorePages = currentPage < totalPages;
        currentPage++;

        // Log progress
        if (hasMorePages) {
          this.logger.info(`Fetched page ${currentPage - 1} of ${totalPages}, ${pageItems.length} items`);
        }
      }

      // Process and format inventory data
      const inventory = allStockItems.map(item => ({
        sku: item.ProductCode,
        productName: item.ProductDescription,
        warehouse: item.WarehouseCode,
        warehouseName: item.WarehouseName,
        quantityOnHand: item.QtyOnHand || 0,
        quantityAllocated: includeAllocated ? (item.AllocatedQty || 0) : 0,
        quantityAvailable: item.AvailableQty || 0,
        averageCost: item.AvgCost || 0,
        totalValue: (item.QtyOnHand || 0) * (item.AvgCost || 0),
        lastModified: item.LastModifiedOn,
        binLocation: item.BinLocation
      }));

      // Calculate totals
      const totals = {
        totalProducts: inventory.length,
        totalQuantity: inventory.reduce((sum, item) => sum + item.quantityOnHand, 0),
        totalValue: inventory.reduce((sum, item) => sum + item.totalValue, 0),
        totalAllocated: inventory.reduce((sum, item) => sum + item.quantityAllocated, 0),
        totalAvailable: inventory.reduce((sum, item) => sum + item.quantityAvailable, 0)
      };

      this.logger.info('Retrieved all inventory data from Unleashed', {
        totalPages: currentPage - 1,
        itemCount: inventory.length,
        totals
      });

      return {
        success: true,
        data: {
          inventory,
          totals,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      this.logger.error('Failed to get inventory data', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // MCP Tool: Get Purchase Orders
  async getPurchaseOrders(params = {}) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const {
        status,
        supplier,
        startDate,
        endDate,
        pageSize = 100
      } = params;

      const queryParams = {
        pageSize,
        orderBy: 'OrderDate',
        sort: 'desc'
      };

      if (status) queryParams.status = status;
      if (supplier) queryParams.supplierCode = supplier;
      if (startDate) queryParams.startDate = startDate;
      if (endDate) queryParams.endDate = endDate;

      const response = await this.makeRequest('/PurchaseOrders', queryParams);
      const orders = response.Items || [];

      // Process purchase orders
      const purchaseOrders = orders.map(po => ({
        orderNumber: po.OrderNumber,
        supplier: po.Supplier?.SupplierName,
        supplierCode: po.Supplier?.SupplierCode,
        orderDate: po.OrderDate,
        requiredDate: po.RequiredDate,
        status: po.OrderStatus,
        subTotal: po.SubTotal || 0,
        tax: po.TaxTotal || 0,
        total: po.Total || 0,
        currency: po.Currency?.Code || 'USD',
        deliveryAddress: po.DeliveryAddress,
        comments: po.Comments,
        lines: (po.PurchaseOrderLines || []).map(line => ({
          productCode: line.Product?.ProductCode,
          productName: line.Product?.ProductDescription,
          quantity: line.OrderQty,
          unitPrice: line.UnitPrice,
          lineTotal: line.LineTotal,
          dueDate: line.DueDate
        }))
      }));

      // Calculate summary
      const summary = {
        totalOrders: purchaseOrders.length,
        totalValue: purchaseOrders.reduce((sum, po) => sum + po.total, 0),
        byStatus: this.groupByStatus(purchaseOrders),
        bySupplier: this.groupBySupplier(purchaseOrders)
      };

      this.logger.info('Retrieved purchase orders from Unleashed', {
        orderCount: purchaseOrders.length,
        summary
      });

      return {
        success: true,
        data: {
          purchaseOrders,
          summary,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      this.logger.error('Failed to get purchase orders', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // MCP Tool: Get Sales Orders
  async getSalesOrders(params = {}) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const {
        status,
        customer,
        startDate,
        endDate,
        pageSize = 100
      } = params;

      const queryParams = {
        pageSize,
        orderBy: 'OrderDate',
        sort: 'desc'
      };

      if (status) queryParams.status = status;
      if (customer) queryParams.customerCode = customer;
      if (startDate) queryParams.startDate = startDate;
      if (endDate) queryParams.endDate = endDate;

      const response = await this.makeRequest('/SalesOrders', queryParams);
      const orders = response.Items || [];

      // Process sales orders
      const salesOrders = orders.map(so => ({
        orderNumber: so.OrderNumber,
        customer: so.Customer?.CustomerName,
        customerCode: so.Customer?.CustomerCode,
        orderDate: so.OrderDate,
        requiredDate: so.RequiredDate,
        status: so.OrderStatus,
        subTotal: so.SubTotal || 0,
        tax: so.TaxTotal || 0,
        total: so.Total || 0,
        currency: so.Currency?.Code || 'USD',
        deliveryAddress: so.DeliveryAddress,
        deliveryMethod: so.DeliveryMethod,
        trackingNumber: so.TrackingNumber,
        comments: so.Comments,
        lines: (so.SalesOrderLines || []).map(line => ({
          productCode: line.Product?.ProductCode,
          productName: line.Product?.ProductDescription,
          quantity: line.OrderQty,
          unitPrice: line.UnitPrice,
          discount: line.DiscountRate,
          lineTotal: line.LineTotal,
          dueDate: line.DueDate
        }))
      }));

      // Calculate summary
      const summary = {
        totalOrders: salesOrders.length,
        totalRevenue: salesOrders.reduce((sum, so) => sum + so.total, 0),
        byStatus: this.groupByStatus(salesOrders),
        byCustomer: this.groupByCustomer(salesOrders)
      };

      this.logger.info('Retrieved sales orders from Unleashed', {
        orderCount: salesOrders.length,
        summary
      });

      return {
        success: true,
        data: {
          salesOrders,
          summary,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      this.logger.error('Failed to get sales orders', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // MCP Tool: Get Stock Movements
  async getStockMovements(params = {}) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const {
        productCode,
        warehouse,
        startDate,
        endDate,
        movementType,
        pageSize = 200
      } = params;

      // Default to last 30 days if no date range specified
      const defaultStartDate = new Date();
      defaultStartDate.setDate(defaultStartDate.getDate() - 30);

      const queryParams = {
        pageSize,
        startDate: startDate || defaultStartDate.toISOString(),
        endDate: endDate || new Date().toISOString()
      };

      if (productCode) queryParams.productCode = productCode;
      if (warehouse) queryParams.warehouseCode = warehouse;
      if (movementType) queryParams.movementType = movementType;

      const response = await this.makeRequest('/StockMovements', queryParams);
      const movements = response.Items || [];

      // Process stock movements
      const stockMovements = movements.map(movement => ({
        productCode: movement.ProductCode,
        productName: movement.ProductDescription,
        warehouse: movement.WarehouseCode,
        movementType: movement.MovementType,
        quantity: movement.Quantity,
        unitCost: movement.Cost || 0,
        totalCost: (movement.Quantity || 0) * (movement.Cost || 0),
        reference: movement.Reference,
        orderNumber: movement.OrderNumber,
        completedDate: movement.CompletedDate,
        reason: movement.Reason,
        customerSupplier: movement.CustomerSupplier
      }));

      // Calculate movement summary
      const summary = {
        totalMovements: stockMovements.length,
        byType: this.groupByMovementType(stockMovements),
        totalInbound: stockMovements
          .filter(m => m.quantity > 0)
          .reduce((sum, m) => sum + m.quantity, 0),
        totalOutbound: stockMovements
          .filter(m => m.quantity < 0)
          .reduce((sum, m) => sum + Math.abs(m.quantity), 0),
        totalValue: stockMovements.reduce((sum, m) => sum + Math.abs(m.totalCost), 0)
      };

      this.logger.info('Retrieved stock movements from Unleashed', {
        movementCount: stockMovements.length,
        summary
      });

      return {
        success: true,
        data: {
          stockMovements,
          summary,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      this.logger.error('Failed to get stock movements', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // MCP Tool: Get Product Details
  async getProductDetails(productCode) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!productCode) {
        throw new Error('Product code is required');
      }

      const response = await this.makeRequest(`/Products/${productCode}`);

      const product = {
        sku: response.ProductCode,
        name: response.ProductDescription,
        group: response.ProductGroup?.GroupName,
        unitOfMeasure: response.UnitOfMeasure?.Name,
        weight: response.Weight,
        dimensions: {
          width: response.Width,
          height: response.Height,
          depth: response.Depth
        },
        barcode: response.Barcode,
        isActive: !response.IsObsolete,
        averageCost: response.AverageLandPrice,
        defaultSellPrice: response.DefaultSellPrice,
        supplier: response.Supplier?.SupplierName,
        leadTime: response.LeadTime,
        notes: response.Notes,
        lastModified: response.LastModifiedOn
      };

      // Get current stock levels
      const stockResponse = await this.makeRequest('/StockOnHand', {
        productCode,
        pageSize: 50
      });

      const stockByWarehouse = (stockResponse.Items || []).map(item => ({
        warehouse: item.WarehouseName,
        onHand: item.QtyOnHand || 0,
        allocated: item.AllocatedQty || 0,
        available: item.AvailableQty || 0,
        binLocation: item.BinLocation
      }));

      product.stock = {
        totalOnHand: stockByWarehouse.reduce((sum, w) => sum + w.onHand, 0),
        totalAllocated: stockByWarehouse.reduce((sum, w) => sum + w.allocated, 0),
        totalAvailable: stockByWarehouse.reduce((sum, w) => sum + w.available, 0),
        byWarehouse: stockByWarehouse
      };

      this.logger.info(`Retrieved product details for ${productCode}`);

      return {
        success: true,
        data: product,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Failed to get product details for ${productCode}`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // MCP Tool: Perform Full Sync
  async performFullSync() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      this.logger.info('Starting full Unleashed data sync');

      const results = {
        inventory: await this.getInventoryData(),
        purchaseOrders: await this.getPurchaseOrders({ pageSize: 500 }),
        salesOrders: await this.getSalesOrders({ pageSize: 500 }),
        stockMovements: await this.getStockMovements({ pageSize: 500 })
      };

      this.lastSyncTime = new Date();

      const summary = {
        success: true,
        syncTime: this.lastSyncTime,
        itemsSynced: {
          inventory: results.inventory.data?.inventory?.length || 0,
          purchaseOrders: results.purchaseOrders.data?.purchaseOrders?.length || 0,
          salesOrders: results.salesOrders.data?.salesOrders?.length || 0,
          stockMovements: results.stockMovements.data?.stockMovements?.length || 0
        },
        errors: []
      };

      // Check for any errors
      Object.entries(results).forEach(([key, result]) => {
        if (!result.success) {
          summary.errors.push({ type: key, error: result.error });
        }
      });

      if (summary.errors.length > 0) {
        summary.success = false;
        summary.message = 'Sync completed with errors';
      }

      this.logger.info('Full Unleashed sync completed', summary);
      return summary;
    } catch (error) {
      this.logger.error('Full Unleashed sync failed', error);
      return {
        success: false,
        error: error.message,
        syncTime: new Date()
      };
    }
  }

  // MCP Tool: Get Connection Status
  async getStatus() {
    return {
      initialized: this.isInitialized,
      configured: !!(this.apiId && this.apiKey),
      lastSync: this.lastSyncTime,
      apiId: this.apiId ? `${this.apiId.substring(0, 8)}...` : null
    };
  }

  // Utility methods
  groupByStatus(items) {
    const groups = {};
    items.forEach(item => {
      const status = item.status || 'Unknown';
      if (!groups[status]) {
        groups[status] = { count: 0, value: 0 };
      }
      groups[status].count++;
      groups[status].value += item.total || 0;
    });
    return groups;
  }

  groupBySupplier(items) {
    const groups = {};
    items.forEach(item => {
      const supplier = item.supplier || 'Unknown';
      if (!groups[supplier]) {
        groups[supplier] = { count: 0, value: 0 };
      }
      groups[supplier].count++;
      groups[supplier].value += item.total || 0;
    });
    return groups;
  }

  groupByCustomer(items) {
    const groups = {};
    items.forEach(item => {
      const customer = item.customer || 'Unknown';
      if (!groups[customer]) {
        groups[customer] = { count: 0, value: 0 };
      }
      groups[customer].count++;
      groups[customer].value += item.total || 0;
    });
    return groups;
  }

  groupByMovementType(movements) {
    const groups = {};
    movements.forEach(movement => {
      const type = movement.movementType || 'Unknown';
      if (!groups[type]) {
        groups[type] = { count: 0, quantity: 0, value: 0 };
      }
      groups[type].count++;
      groups[type].quantity += Math.abs(movement.quantity || 0);
      groups[type].value += Math.abs(movement.totalCost || 0);
    });
    return groups;
  }
}

// Export singleton instance
export default new UnleashedIntegrationMCP();