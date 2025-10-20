/**
 * Unleashed Get Sales Orders Tool
 * 
 * Retrieves customer sales orders with delivery tracking, fulfillment monitoring,
 * customer satisfaction analysis, and order profitability assessment.
 * 
 * @version 1.0.0
 * @author CapLiquify Platform Team
 */

import { createLogger } from '../../../utils/logger.js';

const logger = createLogger();

export class GetSalesOrdersTool {
  constructor(apiClient, cache, dataValidator) {
    this.apiClient = apiClient;
    this.cache = cache;
    this.dataValidator = dataValidator;
    this.isInitialized = false;
    
    // Tool metadata
    this.name = 'unleashed-get-sales-orders';
    this.description = 'Retrieve customer sales orders with delivery tracking, fulfillment monitoring, and profitability analysis';
    this.category = 'unleashed';
    this.version = '1.0.0';
    
    // Input schema for validation
    this.inputSchema = {
      type: 'object',
      properties: {
        orderNumber: {
          type: 'string',
          description: 'Specific sales order number to retrieve'
        },
        orderGuid: {
          type: 'string',
          description: 'Specific sales order GUID to retrieve'
        },
        customerCode: {
          type: 'string',
          description: 'Filter by customer code'
        },
        customerGuid: {
          type: 'string',
          description: 'Filter by customer GUID'
        },
        status: {
          type: 'string',
          enum: ['Quote', 'Backordered', 'Completed', 'Cancelled', 'Parked'],
          description: 'Filter by sales order status'
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
        includeLineItems: {
          type: 'boolean',
          default: true,
          description: 'Include order line items and product details'
        },
        includeFulfillment: {
          type: 'boolean',
          default: true,
          description: 'Include fulfillment and shipping information'
        },
        includeProfitability: {
          type: 'boolean',
          default: false,
          description: 'Include profitability analysis'
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
          description: 'Number of sales orders per page'
        },
        page: {
          type: 'integer',
          minimum: 1,
          default: 1,
          description: 'Page number for pagination'
        },
        sortBy: {
          type: 'string',
          enum: ['OrderNumber', 'OrderDate', 'RequiredDate', 'CustomerName', 'Status'],
          default: 'OrderDate',
          description: 'Field to sort results by'
        }
      }
    };
  }

  async initialize() {
    try {
      logger.info('Initializing Unleashed Get Sales Orders tool...');
      this.isInitialized = true;
      logger.info('Get Sales Orders tool initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize Get Sales Orders tool', { error: error.message });
      throw error;
    }
  }

  async execute(params = {}) {
    try {
      logger.info('Executing Unleashed get sales orders request', {
        orderNumber: params.orderNumber,
        customerCode: params.customerCode,
        status: params.status,
        pageSize: params.pageSize || 200
      });

      const validationResult = this.dataValidator.validateInput(params, this.inputSchema);
      if (!validationResult.valid) {
        throw new Error(`Invalid parameters: ${validationResult.errors.join(', ')}`);
      }

      const queryParams = this.buildQueryParams(params);
      const cacheKey = this.generateCacheKey(queryParams);
      
      if (this.cache && params.useCache !== false) {
        const cachedData = await this.cache.get(cacheKey);
        if (cachedData) {
          logger.debug('Returning cached sales orders data');
          return cachedData;
        }
      }

      const endpoint = params.orderGuid ? `/SalesOrders/${params.orderGuid}` : '/SalesOrders';
      const response = await this.apiClient.get(endpoint, queryParams);
      const processedData = await this.processSalesOrdersData(response.data, params);
      
      if (this.cache && params.useCache !== false) {
        await this.cache.set(cacheKey, processedData, 180);
      }

      logger.info('Sales orders data retrieved successfully', {
        orderCount: Array.isArray(processedData.salesOrders) ? processedData.salesOrders.length : 1,
        totalValue: processedData.summary?.totalOrderValue || 0
      });

      return processedData;

    } catch (error) {
      logger.error('Get sales orders execution failed', { error: error.message, params });
      throw error;
    }
  }

  buildQueryParams(params) {
    const queryParams = {};
    if (params.orderNumber) queryParams.orderNumber = params.orderNumber;
    if (params.customerCode) queryParams.customerCode = params.customerCode;
    if (params.status) queryParams.status = params.status;
    if (params.orderDate) queryParams.orderDate = params.orderDate;
    if (params.orderDateFrom) queryParams.orderDateFrom = params.orderDateFrom;
    if (params.orderDateTo) queryParams.orderDateTo = params.orderDateTo;
    if (params.requiredDate) queryParams.requiredDate = params.requiredDate;
    if (params.modifiedSince) queryParams.modifiedSince = params.modifiedSince;
    if (params.includeLineItems) queryParams.includeLineItems = 'true';
    if (params.includeFulfillment) queryParams.includeFulfillment = 'true';
    if (params.includeProfitability) queryParams.includeProfitability = 'true';
    queryParams.pageSize = params.pageSize || 200;
    queryParams.page = params.page || 1;
    if (params.sortBy) queryParams.sort = params.sortBy;
    return queryParams;
  }

  async processSalesOrdersData(rawData, params) {
    try {
      const orders = Array.isArray(rawData) ? rawData : [rawData];
      const processedOrders = [];

      for (const order of orders) {
        const processedOrder = {
          guid: order.Guid,
          orderNumber: order.OrderNumber,
          customerGuid: order.CustomerGuid,
          customerCode: order.CustomerCode,
          customerName: order.CustomerName,
          orderDate: order.OrderDate,
          requiredDate: order.RequiredDate,
          status: order.Status,
          subTotal: order.SubTotal || 0,
          taxTotal: order.TaxTotal || 0,
          total: order.Total || 0,
          currency: order.Currency,
          deliveryMethod: order.DeliveryMethod,
          deliveryAddress: order.DeliveryAddress,
          salesPerson: order.SalesPerson,
          reference: order.Reference,
          notes: order.Notes,
          createdBy: order.CreatedBy,
          createdOn: order.CreatedOn,
          lastModifiedOn: order.LastModifiedOn,
          lineItems: [],
          fulfillment: {},
          profitability: {}
        };

        if (params.includeLineItems && order.Guid) {
          try {
            processedOrder.lineItems = await this.getOrderLineItems(order.Guid);
          } catch (error) {
            logger.warn('Failed to retrieve line items', { orderNumber: order.OrderNumber, error: error.message });
          }
        }

        if (params.includeFulfillment && order.Guid) {
          try {
            processedOrder.fulfillment = await this.getFulfillmentData(order.Guid);
          } catch (error) {
            logger.warn('Failed to retrieve fulfillment data', { orderNumber: order.OrderNumber, error: error.message });
          }
        }

        if (params.includeProfitability && order.Guid) {
          processedOrder.profitability = this.calculateProfitability(processedOrder);
        }

        processedOrders.push(processedOrder);
      }

      return {
        success: true,
        salesOrders: processedOrders,
        summary: this.calculateSalesSummary(processedOrders),
        analysis: this.performSalesAnalysis(processedOrders),
        metadata: {
          retrievedAt: new Date().toISOString(),
          includeLineItems: params.includeLineItems,
          includeFulfillment: params.includeFulfillment,
          includeProfitability: params.includeProfitability
        }
      };

    } catch (error) {
      logger.error('Failed to process sales orders data', { error: error.message });
      throw error;
    }
  }

  async getOrderLineItems(orderGuid) {
    try {
      const response = await this.apiClient.get(`/SalesOrders/${orderGuid}/LineItems`);
      return response.data.map(item => ({
        lineNumber: item.LineNumber,
        productCode: item.ProductCode,
        productDescription: item.ProductDescription,
        orderedQuantity: item.OrderedQuantity || 0,
        dispatchedQuantity: item.DispatchedQuantity || 0,
        unitPrice: item.UnitPrice || 0,
        lineTotal: item.LineTotal || 0,
        unitOfMeasure: item.UnitOfMeasure
      }));
    } catch (error) {
      logger.debug('No line items available for order', { orderGuid });
      return [];
    }
  }

  async getFulfillmentData(orderGuid) {
    try {
      const response = await this.apiClient.get(`/SalesOrders/${orderGuid}/Fulfillment`);
      return {
        fulfillmentStatus: response.data.Status || 'pending',
        dispatchedDate: response.data.DispatchedDate,
        deliveredDate: response.data.DeliveredDate,
        trackingNumber: response.data.TrackingNumber,
        carrier: response.data.Carrier,
        fulfillmentPercentage: response.data.FulfillmentPercentage || 0
      };
    } catch (error) {
      logger.debug('No fulfillment data available for order', { orderGuid });
      return {};
    }
  }

  calculateProfitability(order) {
    const revenue = order.total || 0;
    const cost = order.lineItems.reduce((sum, item) => sum + (item.unitCost || 0) * item.orderedQuantity, 0);
    const grossProfit = revenue - cost;
    const marginPercentage = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    return {
      revenue,
      cost,
      grossProfit,
      marginPercentage,
      profitability: marginPercentage > 20 ? 'high' : marginPercentage > 10 ? 'medium' : 'low'
    };
  }

  calculateSalesSummary(orders) {
    return {
      totalOrders: orders.length,
      quoteOrders: orders.filter(o => o.status === 'Quote').length,
      backorderedOrders: orders.filter(o => o.status === 'Backordered').length,
      completedOrders: orders.filter(o => o.status === 'Completed').length,
      totalOrderValue: orders.reduce((sum, o) => sum + o.total, 0),
      averageOrderValue: this.calculateAverage(orders, 'total'),
      uniqueCustomers: new Set(orders.map(o => o.customerCode)).size
    };
  }

  performSalesAnalysis(orders) {
    return {
      customerAnalysis: this.analyzeCustomers(orders),
      fulfillmentPerformance: this.analyzeFulfillmentPerformance(orders),
      profitabilityAnalysis: this.analyzeProfitability(orders)
    };
  }

  analyzeCustomers(orders) {
    const customerMetrics = {};
    orders.forEach(order => {
      if (!customerMetrics[order.customerCode]) {
        customerMetrics[order.customerCode] = {
          customerName: order.customerName,
          orderCount: 0,
          totalValue: 0
        };
      }
      customerMetrics[order.customerCode].orderCount++;
      customerMetrics[order.customerCode].totalValue += order.total;
    });
    return customerMetrics;
  }

  analyzeFulfillmentPerformance(orders) {
    const fulfilledOrders = orders.filter(o => o.fulfillment.deliveredDate);
    return {
      totalFulfilled: fulfilledOrders.length,
      fulfillmentRate: orders.length > 0 ? (fulfilledOrders.length / orders.length) * 100 : 0
    };
  }

  analyzeProfitability(orders) {
    const ordersWithProfitability = orders.filter(o => o.profitability.revenue > 0);
    return {
      averageMargin: this.calculateAverage(ordersWithProfitability.map(o => o.profitability.marginPercentage)),
      totalProfit: ordersWithProfitability.reduce((sum, o) => sum + o.profitability.grossProfit, 0)
    };
  }

  calculateAverage(items, field) {
    if (typeof items[0] === 'number') {
      const validValues = items.filter(v => v !== null && v !== undefined && !isNaN(v));
      return validValues.length > 0 ? validValues.reduce((sum, v) => sum + v, 0) / validValues.length : 0;
    }
    const values = items.map(item => item[field]).filter(value => value !== null && value !== undefined && !isNaN(value));
    return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  }

  generateCacheKey(params) {
    return `unleashed:sales-orders:${JSON.stringify(params)}`;
  }

  getStatus() {
    return {
      name: this.name,
      initialized: this.isInitialized,
      category: this.category,
      version: this.version
    };
  }
}