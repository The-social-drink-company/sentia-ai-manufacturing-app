/**
 * Unleashed Get Purchase Orders Tool
 * 
 * Retrieves supplier purchase orders with delivery tracking, lead time analysis,
 * supplier performance monitoring, and procurement cost analysis.
 * 
 * @version 1.0.0
 * @author CapLiquify Platform Team
 */

import { createLogger } from '../../../utils/logger.js';

const logger = createLogger();

export class GetPurchaseOrdersTool {
  constructor(apiClient, cache, dataValidator) {
    this.apiClient = apiClient;
    this.cache = cache;
    this.dataValidator = dataValidator;
    this.isInitialized = false;
    
    // Tool metadata
    this.name = 'unleashed-get-purchase-orders';
    this.description = 'Retrieve supplier purchase orders with delivery tracking, lead time analysis, and supplier performance';
    this.category = 'unleashed';
    this.version = '1.0.0';
    
    // Input schema for validation
    this.inputSchema = {
      type: 'object',
      properties: {
        orderNumber: {
          type: 'string',
          description: 'Specific purchase order number to retrieve'
        },
        orderGuid: {
          type: 'string',
          description: 'Specific purchase order GUID to retrieve'
        },
        supplierCode: {
          type: 'string',
          description: 'Filter by supplier code'
        },
        supplierGuid: {
          type: 'string',
          description: 'Filter by supplier GUID'
        },
        status: {
          type: 'string',
          enum: ['Draft', 'Placed', 'Acknowledged', 'Shipped', 'Received', 'Completed', 'Cancelled'],
          description: 'Filter by purchase order status'
        },
        priority: {
          type: 'string',
          enum: ['Low', 'Normal', 'High', 'Urgent'],
          description: 'Filter by order priority'
        },
        orderDate: {
          type: 'string',
          format: 'date',
          description: 'Filter by order date (YYYY-MM-DD)'
        },
        orderDateFrom: {
          type: 'string',
          format: 'date',
          description: 'Filter orders from this date (YYYY-MM-DD)'
        },
        orderDateTo: {
          type: 'string',
          format: 'date',
          description: 'Filter orders to this date (YYYY-MM-DD)'
        },
        requiredDate: {
          type: 'string',
          format: 'date',
          description: 'Filter by required delivery date'
        },
        deliveryDate: {
          type: 'string',
          format: 'date',
          description: 'Filter by actual delivery date'
        },
        warehouseCode: {
          type: 'string',
          description: 'Filter by delivery warehouse'
        },
        includeLineItems: {
          type: 'boolean',
          default: true,
          description: 'Include order line items and product details'
        },
        includeDeliveries: {
          type: 'boolean',
          default: true,
          description: 'Include delivery tracking information'
        },
        includeSupplierPerformance: {
          type: 'boolean',
          default: false,
          description: 'Include supplier performance metrics'
        },
        includeCosts: {
          type: 'boolean',
          default: true,
          description: 'Include detailed cost breakdown'
        },
        modifiedSince: {
          type: 'string',
          format: 'date-time',
          description: 'Only return orders modified since this date'
        },
        pageSize: {
          type: 'integer',
          minimum: 1,
          maximum: 1000,
          default: 200,
          description: 'Number of purchase orders per page'
        },
        page: {
          type: 'integer',
          minimum: 1,
          default: 1,
          description: 'Page number for pagination'
        },
        sortBy: {
          type: 'string',
          enum: ['OrderNumber', 'OrderDate', 'RequiredDate', 'SupplierName', 'Status'],
          default: 'OrderDate',
          description: 'Field to sort results by'
        }
      }
    };
  }

  /**
   * Initialize the tool
   */
  async initialize() {
    try {
      logger.info('Initializing Unleashed Get Purchase Orders tool...');
      this.isInitialized = true;
      logger.info('Get Purchase Orders tool initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize Get Purchase Orders tool', { error: error.message });
      throw error;
    }
  }

  /**
   * Execute the get purchase orders tool
   */
  async execute(params = {}) {
    try {
      logger.info('Executing Unleashed get purchase orders request', {
        orderNumber: params.orderNumber,
        supplierCode: params.supplierCode,
        status: params.status,
        includeLineItems: params.includeLineItems,
        pageSize: params.pageSize || 200
      });

      // Validate input parameters
      const validationResult = this.dataValidator.validateInput(params, this.inputSchema);
      if (!validationResult.valid) {
        throw new Error(`Invalid parameters: ${validationResult.errors.join(', ')}`);
      }

      // Build query parameters
      const queryParams = this.buildQueryParams(params);
      
      // Check cache first
      const cacheKey = this.generateCacheKey(queryParams);
      if (this.cache && params.useCache !== false) {
        const cachedData = await this.cache.get(cacheKey);
        if (cachedData) {
          logger.debug('Returning cached purchase orders data');
          return cachedData;
        }
      }

      // Make API request
      const endpoint = params.orderGuid ? 
        `/PurchaseOrders/${params.orderGuid}` : 
        '/PurchaseOrders';
      
      const response = await this.apiClient.get(endpoint, queryParams);
      
      // Process and enrich purchase orders data
      const processedData = await this.processPurchaseOrdersData(response.data, params);
      
      // Cache the results
      if (this.cache && params.useCache !== false) {
        await this.cache.set(cacheKey, processedData, 180); // 3 minute cache
      }

      logger.info('Purchase orders data retrieved successfully', {
        orderCount: Array.isArray(processedData.purchaseOrders) ? processedData.purchaseOrders.length : 1,
        totalValue: processedData.summary?.totalOrderValue || 0,
        pendingOrders: processedData.summary?.pendingOrders || 0
      });

      return processedData;

    } catch (error) {
      logger.error('Get purchase orders execution failed', {
        error: error.message,
        params
      });
      throw error;
    }
  }

  /**
   * Build query parameters for API request
   */
  buildQueryParams(params) {
    const queryParams = {};
    
    // Basic filters
    if (params.orderNumber) queryParams.orderNumber = params.orderNumber;
    if (params.supplierCode) queryParams.supplierCode = params.supplierCode;
    if (params.supplierGuid) queryParams.supplierGuid = params.supplierGuid;
    if (params.status) queryParams.status = params.status;
    if (params.priority) queryParams.priority = params.priority;
    if (params.warehouseCode) queryParams.warehouseCode = params.warehouseCode;
    
    // Date filters
    if (params.orderDate) queryParams.orderDate = params.orderDate;
    if (params.orderDateFrom) queryParams.orderDateFrom = params.orderDateFrom;
    if (params.orderDateTo) queryParams.orderDateTo = params.orderDateTo;
    if (params.requiredDate) queryParams.requiredDate = params.requiredDate;
    if (params.deliveryDate) queryParams.deliveryDate = params.deliveryDate;
    if (params.modifiedSince) queryParams.modifiedSince = params.modifiedSince;
    
    // Data inclusion flags
    if (params.includeLineItems) queryParams.includeLineItems = 'true';
    if (params.includeDeliveries) queryParams.includeDeliveries = 'true';
    if (params.includeSupplierPerformance) queryParams.includeSupplierPerformance = 'true';
    if (params.includeCosts) queryParams.includeCosts = 'true';
    
    // Pagination
    queryParams.pageSize = params.pageSize || 200;
    queryParams.page = params.page || 1;
    
    // Sorting
    if (params.sortBy) queryParams.sort = params.sortBy;
    
    return queryParams;
  }

  /**
   * Process and enrich purchase orders data
   */
  async processPurchaseOrdersData(rawData, params) {
    try {
      const orders = Array.isArray(rawData) ? rawData : [rawData];
      const processedOrders = [];

      for (const order of orders) {
        const processedOrder = {
          // Basic order information
          guid: order.Guid,
          orderNumber: order.OrderNumber,
          orderType: order.OrderType,
          
          // Supplier information
          supplierGuid: order.SupplierGuid,
          supplierCode: order.SupplierCode,
          supplierName: order.SupplierName,
          supplierContact: order.SupplierContact,
          
          // Order details
          orderDate: order.OrderDate,
          requiredDate: order.RequiredDate,
          promisedDate: order.PromisedDate,
          deliveryDate: order.DeliveryDate,
          
          // Status and priority
          status: order.Status,
          priority: order.Priority,
          
          // Financial information
          subTotal: order.SubTotal || 0,
          taxTotal: order.TaxTotal || 0,
          total: order.Total || 0,
          currency: order.Currency,
          exchangeRate: order.ExchangeRate || 1,
          
          // Delivery information
          deliveryMethod: order.DeliveryMethod,
          deliveryAddress: order.DeliveryAddress,
          warehouseCode: order.WarehouseCode,
          warehouseName: order.WarehouseName,
          
          // Payment terms
          paymentTerms: order.PaymentTerms,
          paymentDueDate: order.PaymentDueDate,
          
          // References
          supplierReference: order.SupplierReference,
          requisitionNumber: order.RequisitionNumber,
          reference: order.Reference,
          notes: order.Notes,
          
          // Tracking
          trackingNumber: order.TrackingNumber,
          carrier: order.Carrier,
          
          // Metadata
          createdBy: order.CreatedBy,
          createdOn: order.CreatedOn,
          lastModifiedOn: order.LastModifiedOn,
          
          // Enhanced data
          lineItems: [],
          deliveries: [],
          supplierPerformance: {},
          leadTimeAnalysis: {},
          costAnalysis: {}
        };

        // Get line items if requested
        if (params.includeLineItems && order.Guid) {
          try {
            processedOrder.lineItems = await this.getOrderLineItems(order.Guid);
          } catch (error) {
            logger.warn('Failed to retrieve line items', { 
              orderNumber: order.OrderNumber, 
              error: error.message 
            });
          }
        }

        // Get delivery information if requested
        if (params.includeDeliveries && order.Guid) {
          try {
            processedOrder.deliveries = await this.getOrderDeliveries(order.Guid);
          } catch (error) {
            logger.warn('Failed to retrieve delivery data', { 
              orderNumber: order.OrderNumber, 
              error: error.message 
            });
          }
        }

        // Get supplier performance if requested
        if (params.includeSupplierPerformance && order.SupplierGuid) {
          try {
            processedOrder.supplierPerformance = await this.getSupplierPerformance(order.SupplierGuid);
          } catch (error) {
            logger.warn('Failed to retrieve supplier performance', { 
              supplierCode: order.SupplierCode, 
              error: error.message 
            });
          }
        }

        // Calculate lead time analysis
        processedOrder.leadTimeAnalysis = this.calculateLeadTimeAnalysis(processedOrder);
        
        // Calculate cost analysis
        processedOrder.costAnalysis = this.calculateCostAnalysis(processedOrder);

        processedOrders.push(processedOrder);
      }

      return {
        success: true,
        purchaseOrders: processedOrders,
        summary: this.calculatePurchaseSummary(processedOrders),
        analysis: this.performPurchaseAnalysis(processedOrders),
        metadata: {
          retrievedAt: new Date().toISOString(),
          includeLineItems: params.includeLineItems,
          includeDeliveries: params.includeDeliveries,
          includeSupplierPerformance: params.includeSupplierPerformance
        }
      };

    } catch (error) {
      logger.error('Failed to process purchase orders data', { error: error.message });
      throw error;
    }
  }

  /**
   * Get order line items
   */
  async getOrderLineItems(orderGuid) {
    try {
      const response = await this.apiClient.get(`/PurchaseOrders/${orderGuid}/LineItems`);
      
      return response.data.map(item => ({
        lineNumber: item.LineNumber,
        productGuid: item.ProductGuid,
        productCode: item.ProductCode,
        productDescription: item.ProductDescription,
        orderedQuantity: item.OrderedQuantity || 0,
        receivedQuantity: item.ReceivedQuantity || 0,
        remainingQuantity: (item.OrderedQuantity || 0) - (item.ReceivedQuantity || 0),
        unitPrice: item.UnitPrice || 0,
        discountRate: item.DiscountRate || 0,
        lineTotal: item.LineTotal || 0,
        unitOfMeasure: item.UnitOfMeasure,
        taxRate: item.TaxRate || 0,
        requiredDate: item.RequiredDate,
        notes: item.Notes
      }));
      
    } catch (error) {
      logger.debug('No line items available for order', { orderGuid });
      return [];
    }
  }

  /**
   * Get order deliveries
   */
  async getOrderDeliveries(orderGuid) {
    try {
      const response = await this.apiClient.get(`/PurchaseOrders/${orderGuid}/Deliveries`);
      
      return response.data.map(delivery => ({
        deliveryNumber: delivery.DeliveryNumber,
        deliveryDate: delivery.DeliveryDate,
        receivedDate: delivery.ReceivedDate,
        carrier: delivery.Carrier,
        trackingNumber: delivery.TrackingNumber,
        status: delivery.Status,
        items: delivery.Items || []
      }));
      
    } catch (error) {
      logger.debug('No delivery data available for order', { orderGuid });
      return [];
    }
  }

  /**
   * Get supplier performance metrics
   */
  async getSupplierPerformance(supplierGuid) {
    try {
      const response = await this.apiClient.get(`/Suppliers/${supplierGuid}/Performance`);
      
      return {
        onTimeDeliveryRate: response.data.OnTimeDeliveryRate || 0,
        qualityRating: response.data.QualityRating || 0,
        averageLeadTime: response.data.AverageLeadTime || 0,
        costPerformance: response.data.CostPerformance || 0,
        overallRating: response.data.OverallRating || 0,
        totalOrders: response.data.TotalOrders || 0,
        lastEvaluation: response.data.LastEvaluation
      };
      
    } catch (error) {
      logger.debug('No performance data available for supplier', { supplierGuid });
      return {};
    }
  }

  /**
   * Calculate lead time analysis
   */
  calculateLeadTimeAnalysis(order) {
    const analysis = {
      plannedLeadTime: 0,
      actualLeadTime: 0,
      leadTimeVariance: 0,
      onTimeStatus: 'unknown',
      daysEarly: 0,
      daysLate: 0
    };

    if (order.orderDate && order.requiredDate) {
      const orderDate = new Date(order.orderDate);
      const requiredDate = new Date(order.requiredDate);
      analysis.plannedLeadTime = Math.floor((requiredDate - orderDate) / (1000 * 60 * 60 * 24));
    }

    if (order.orderDate && order.deliveryDate) {
      const orderDate = new Date(order.orderDate);
      const deliveryDate = new Date(order.deliveryDate);
      analysis.actualLeadTime = Math.floor((deliveryDate - orderDate) / (1000 * 60 * 60 * 24));
    }

    if (analysis.plannedLeadTime > 0 && analysis.actualLeadTime > 0) {
      analysis.leadTimeVariance = analysis.actualLeadTime - analysis.plannedLeadTime;
      
      if (analysis.leadTimeVariance < 0) {
        analysis.onTimeStatus = 'early';
        analysis.daysEarly = Math.abs(analysis.leadTimeVariance);
      } else if (analysis.leadTimeVariance > 0) {
        analysis.onTimeStatus = 'late';
        analysis.daysLate = analysis.leadTimeVariance;
      } else {
        analysis.onTimeStatus = 'on_time';
      }
    }

    return analysis;
  }

  /**
   * Calculate cost analysis
   */
  calculateCostAnalysis(order) {
    const analysis = {
      orderValue: order.total || 0,
      averageItemCost: 0,
      costPerUnit: 0,
      discountImpact: 0,
      taxImpact: (order.taxTotal || 0) / (order.subTotal || 1) * 100
    };

    if (order.lineItems && order.lineItems.length > 0) {
      const totalQuantity = order.lineItems.reduce((sum, item) => sum + item.orderedQuantity, 0);
      analysis.averageItemCost = order.lineItems.reduce((sum, item) => sum + item.unitPrice, 0) / order.lineItems.length;
      analysis.costPerUnit = totalQuantity > 0 ? order.total / totalQuantity : 0;
      
      const totalDiscount = order.lineItems.reduce((sum, item) => 
        sum + (item.unitPrice * item.orderedQuantity * (item.discountRate / 100)), 0);
      analysis.discountImpact = totalDiscount;
    }

    return analysis;
  }

  /**
   * Calculate purchase summary statistics
   */
  calculatePurchaseSummary(orders) {
    return {
      totalOrders: orders.length,
      draftOrders: orders.filter(o => o.status === 'Draft').length,
      placedOrders: orders.filter(o => o.status === 'Placed').length,
      receivedOrders: orders.filter(o => o.status === 'Received').length,
      completedOrders: orders.filter(o => o.status === 'Completed').length,
      pendingOrders: orders.filter(o => ['Draft', 'Placed', 'Acknowledged', 'Shipped'].includes(o.status)).length,
      totalOrderValue: orders.reduce((sum, o) => sum + o.total, 0),
      averageOrderValue: this.calculateAverage(orders, 'total'),
      averageLeadTime: this.calculateAverage(orders.map(o => o.leadTimeAnalysis.actualLeadTime)),
      onTimeDeliveryRate: this.calculateOnTimeRate(orders),
      uniqueSuppliers: new Set(orders.map(o => o.supplierCode)).size
    };
  }

  /**
   * Perform advanced purchase analysis
   */
  performPurchaseAnalysis(orders) {
    return {
      supplierAnalysis: this.analyzeSuppliers(orders),
      deliveryPerformance: this.analyzeDeliveryPerformance(orders),
      costTrends: this.analyzeCostTrends(orders),
      riskAssessment: this.assessPurchaseRisks(orders)
    };
  }

  /**
   * Analyze supplier performance
   */
  analyzeSuppliers(orders) {
    const supplierMetrics = {};
    
    orders.forEach(order => {
      if (!supplierMetrics[order.supplierCode]) {
        supplierMetrics[order.supplierCode] = {
          supplierName: order.supplierName,
          orderCount: 0,
          totalValue: 0,
          onTimeDeliveries: 0,
          lateDeliveries: 0,
          averageLeadTime: 0
        };
      }
      
      const metrics = supplierMetrics[order.supplierCode];
      metrics.orderCount++;
      metrics.totalValue += order.total;
      
      if (order.leadTimeAnalysis.onTimeStatus === 'on_time' || order.leadTimeAnalysis.onTimeStatus === 'early') {
        metrics.onTimeDeliveries++;
      } else if (order.leadTimeAnalysis.onTimeStatus === 'late') {
        metrics.lateDeliveries++;
      }
    });

    return supplierMetrics;
  }

  /**
   * Analyze delivery performance
   */
  analyzeDeliveryPerformance(orders) {
    const completedOrders = orders.filter(o => o.deliveryDate);
    const onTimeOrders = completedOrders.filter(o => 
      o.leadTimeAnalysis.onTimeStatus === 'on_time' || o.leadTimeAnalysis.onTimeStatus === 'early'
    );

    return {
      totalDeliveries: completedOrders.length,
      onTimeDeliveries: onTimeOrders.length,
      onTimeRate: completedOrders.length > 0 ? (onTimeOrders.length / completedOrders.length) * 100 : 0,
      averageLeadTime: this.calculateAverage(completedOrders.map(o => o.leadTimeAnalysis.actualLeadTime)),
      leadTimeVariance: this.calculateStandardDeviation(completedOrders.map(o => o.leadTimeAnalysis.actualLeadTime))
    };
  }

  /**
   * Analyze cost trends
   */
  analyzeCostTrends(orders) {
    const ordersWithDates = orders.filter(o => o.orderDate).sort((a, b) => new Date(a.orderDate) - new Date(b.orderDate));
    
    return {
      totalSpend: ordersWithDates.reduce((sum, o) => sum + o.total, 0),
      averageOrderValue: this.calculateAverage(ordersWithDates, 'total'),
      costTrend: ordersWithDates.length > 1 ? 
        (ordersWithDates[ordersWithDates.length - 1].total - ordersWithDates[0].total) / ordersWithDates[0].total * 100 : 0
    };
  }

  /**
   * Assess purchase risks
   */
  assessPurchaseRisks(orders) {
    const risks = [];
    
    // Overdue orders
    const overdueOrders = orders.filter(o => 
      o.requiredDate && new Date(o.requiredDate) < new Date() && !['Received', 'Completed'].includes(o.status)
    );
    
    if (overdueOrders.length > 0) {
      risks.push({
        type: 'overdue_orders',
        severity: 'high',
        count: overdueOrders.length,
        description: 'Orders past required delivery date'
      });
    }

    // Single supplier dependency
    const supplierCounts = {};
    orders.forEach(o => {
      supplierCounts[o.supplierCode] = (supplierCounts[o.supplierCode] || 0) + 1;
    });
    
    const maxSupplierOrders = Math.max(...Object.values(supplierCounts));
    if (maxSupplierOrders > orders.length * 0.5) {
      risks.push({
        type: 'supplier_dependency',
        severity: 'medium',
        description: 'High dependency on single supplier'
      });
    }

    return risks;
  }

  /**
   * Helper methods
   */
  calculateAverage(items, field) {
    if (typeof items[0] === 'number') {
      const validValues = items.filter(v => v !== null && v !== undefined && !isNaN(v));
      return validValues.length > 0 ? validValues.reduce((sum, v) => sum + v, 0) / validValues.length : 0;
    }
    
    const values = items
      .map(item => item[field])
      .filter(value => value !== null && value !== undefined && !isNaN(value));
    
    return values.length > 0 ? 
      values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  }

  calculateOnTimeRate(orders) {
    const deliveredOrders = orders.filter(o => o.deliveryDate);
    if (deliveredOrders.length === 0) return 0;
    
    const onTimeOrders = deliveredOrders.filter(o => 
      o.leadTimeAnalysis.onTimeStatus === 'on_time' || o.leadTimeAnalysis.onTimeStatus === 'early'
    );
    
    return (onTimeOrders.length / deliveredOrders.length) * 100;
  }

  calculateStandardDeviation(values) {
    const validValues = values.filter(v => v !== null && v !== undefined && !isNaN(v));
    if (validValues.length === 0) return 0;
    
    const mean = validValues.reduce((sum, v) => sum + v, 0) / validValues.length;
    const squaredDiffs = validValues.map(v => Math.pow(v - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, v) => sum + v, 0) / validValues.length;
    
    return Math.sqrt(avgSquaredDiff);
  }

  /**
   * Generate cache key
   */
  generateCacheKey(params) {
    return `unleashed:purchase-orders:${JSON.stringify(params)}`;
  }

  /**
   * Get tool status
   */
  getStatus() {
    return {
      name: this.name,
      initialized: this.isInitialized,
      category: this.category,
      version: this.version
    };
  }
}