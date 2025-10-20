/**
 * Unleashed Get Production Orders Tool
 * 
 * Retrieves manufacturing orders with production schedules, WIP tracking,
 * efficiency monitoring, and cost analysis from Unleashed API.
 * 
 * @version 1.0.0
 * @author CapLiquify Platform Team
 */

import { createLogger } from '../../../utils/logger.js';

const logger = createLogger();

export class GetProductionOrdersTool {
  constructor(apiClient, cache, dataValidator) {
    this.apiClient = apiClient;
    this.cache = cache;
    this.dataValidator = dataValidator;
    this.isInitialized = false;
    
    // Tool metadata
    this.name = 'unleashed-get-production-orders';
    this.description = 'Retrieve manufacturing orders with production schedules, WIP tracking, and efficiency monitoring';
    this.category = 'unleashed';
    this.version = '1.0.0';
    
    // Input schema for validation
    this.inputSchema = {
      type: 'object',
      properties: {
        orderNumber: {
          type: 'string',
          description: 'Specific production order number to retrieve'
        },
        orderGuid: {
          type: 'string',
          description: 'Specific production order GUID to retrieve'
        },
        productCode: {
          type: 'string',
          description: 'Filter by product being manufactured'
        },
        warehouseCode: {
          type: 'string',
          description: 'Filter by production warehouse'
        },
        status: {
          type: 'string',
          enum: ['Planned', 'InProgress', 'OnHold', 'Completed', 'Cancelled'],
          description: 'Filter by production order status'
        },
        priority: {
          type: 'string',
          enum: ['Low', 'Normal', 'High', 'Urgent'],
          description: 'Filter by order priority'
        },
        plannedStartDate: {
          type: 'string',
          format: 'date',
          description: 'Filter by planned start date (YYYY-MM-DD)'
        },
        plannedEndDate: {
          type: 'string',
          format: 'date',
          description: 'Filter by planned end date (YYYY-MM-DD)'
        },
        actualStartDate: {
          type: 'string',
          format: 'date',
          description: 'Filter by actual start date (YYYY-MM-DD)'
        },
        actualEndDate: {
          type: 'string',
          format: 'date',
          description: 'Filter by actual end date (YYYY-MM-DD)'
        },
        includeComponents: {
          type: 'boolean',
          default: true,
          description: 'Include component requirements and consumption'
        },
        includeLabor: {
          type: 'boolean',
          default: true,
          description: 'Include labor tracking and costs'
        },
        includeOperations: {
          type: 'boolean',
          default: true,
          description: 'Include production operations and routing'
        },
        includeQuality: {
          type: 'boolean',
          default: false,
          description: 'Include quality control data'
        },
        includeCosts: {
          type: 'boolean',
          default: true,
          description: 'Include detailed cost analysis'
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
          description: 'Number of production orders per page'
        },
        page: {
          type: 'integer',
          minimum: 1,
          default: 1,
          description: 'Page number for pagination'
        },
        sortBy: {
          type: 'string',
          enum: ['OrderNumber', 'PlannedStartDate', 'PlannedEndDate', 'Status', 'Priority'],
          default: 'PlannedStartDate',
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
      logger.info('Initializing Unleashed Get Production Orders tool...');
      this.isInitialized = true;
      logger.info('Get Production Orders tool initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize Get Production Orders tool', { error: error.message });
      throw error;
    }
  }

  /**
   * Execute the get production orders tool
   */
  async execute(params = {}) {
    try {
      logger.info('Executing Unleashed get production orders request', {
        orderNumber: params.orderNumber,
        status: params.status,
        productCode: params.productCode,
        includeComponents: params.includeComponents,
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
          logger.debug('Returning cached production orders data');
          return cachedData;
        }
      }

      // Make API request
      const endpoint = params.orderGuid ? 
        `/ProductionOrders/${params.orderGuid}` : 
        '/ProductionOrders';
      
      const response = await this.apiClient.get(endpoint, queryParams);
      
      // Process and enrich production orders data
      const processedData = await this.processProductionOrdersData(response.data, params);
      
      // Cache the results
      if (this.cache && params.useCache !== false) {
        await this.cache.set(cacheKey, processedData, 180); // 3 minute cache
      }

      logger.info('Production orders data retrieved successfully', {
        orderCount: Array.isArray(processedData.productionOrders) ? processedData.productionOrders.length : 1,
        inProgressOrders: processedData.summary?.inProgressOrders || 0,
        plannedOrders: processedData.summary?.plannedOrders || 0
      });

      return processedData;

    } catch (error) {
      logger.error('Get production orders execution failed', {
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
    if (params.productCode) queryParams.productCode = params.productCode;
    if (params.warehouseCode) queryParams.warehouseCode = params.warehouseCode;
    if (params.status) queryParams.status = params.status;
    if (params.priority) queryParams.priority = params.priority;
    
    // Date filters
    if (params.plannedStartDate) queryParams.plannedStartDate = params.plannedStartDate;
    if (params.plannedEndDate) queryParams.plannedEndDate = params.plannedEndDate;
    if (params.actualStartDate) queryParams.actualStartDate = params.actualStartDate;
    if (params.actualEndDate) queryParams.actualEndDate = params.actualEndDate;
    if (params.modifiedSince) queryParams.modifiedSince = params.modifiedSince;
    
    // Data inclusion flags
    if (params.includeComponents) queryParams.includeComponents = 'true';
    if (params.includeLabor) queryParams.includeLabor = 'true';
    if (params.includeOperations) queryParams.includeOperations = 'true';
    if (params.includeQuality) queryParams.includeQuality = 'true';
    if (params.includeCosts) queryParams.includeCosts = 'true';
    
    // Pagination
    queryParams.pageSize = params.pageSize || 200;
    queryParams.page = params.page || 1;
    
    // Sorting
    if (params.sortBy) queryParams.sort = params.sortBy;
    
    return queryParams;
  }

  /**
   * Process and enrich production orders data
   */
  async processProductionOrdersData(rawData, params) {
    try {
      const orders = Array.isArray(rawData) ? rawData : [rawData];
      const processedOrders = [];

      for (const order of orders) {
        const processedOrder = {
          // Basic order information
          guid: order.Guid,
          orderNumber: order.OrderNumber,
          productionOrderType: order.ProductionOrderType,
          
          // Product information
          productGuid: order.ProductGuid,
          productCode: order.ProductCode,
          productDescription: order.ProductDescription,
          unitOfMeasure: order.UnitOfMeasure,
          
          // Quantities
          orderedQuantity: order.OrderedQuantity || 0,
          plannedQuantity: order.PlannedQuantity || 0,
          producedQuantity: order.ProducedQuantity || 0,
          remainingQuantity: (order.PlannedQuantity || 0) - (order.ProducedQuantity || 0),
          
          // Status and priority
          status: order.Status,
          priority: order.Priority,
          percentComplete: order.PercentComplete || 0,
          
          // Scheduling
          plannedStartDate: order.PlannedStartDate,
          plannedEndDate: order.PlannedEndDate,
          actualStartDate: order.ActualStartDate,
          actualEndDate: order.ActualEndDate,
          estimatedDuration: order.EstimatedDuration,
          actualDuration: order.ActualDuration,
          
          // Warehouse and location
          warehouseGuid: order.WarehouseGuid,
          warehouseCode: order.WarehouseCode,
          productionLine: order.ProductionLine,
          
          // Costing
          standardCost: order.StandardCost || 0,
          actualCost: order.ActualCost || 0,
          estimatedCost: order.EstimatedCost || 0,
          materialCost: order.MaterialCost || 0,
          laborCost: order.LaborCost || 0,
          overheadCost: order.OverheadCost || 0,
          
          // References
          salesOrderNumber: order.SalesOrderNumber,
          customerOrderNumber: order.CustomerOrderNumber,
          reference: order.Reference,
          notes: order.Notes,
          
          // Metadata
          createdBy: order.CreatedBy,
          createdOn: order.CreatedOn,
          lastModifiedOn: order.LastModifiedOn,
          
          // Enhanced data
          components: [],
          operations: [],
          laborTracking: [],
          qualityData: {},
          wipAnalysis: {},
          efficiency: {}
        };

        // Get component requirements if requested
        if (params.includeComponents && order.Guid) {
          try {
            processedOrder.components = await this.getOrderComponents(order.Guid);
          } catch (error) {
            logger.warn('Failed to retrieve component data', { 
              orderNumber: order.OrderNumber, 
              error: error.message 
            });
          }
        }

        // Get production operations if requested
        if (params.includeOperations && order.Guid) {
          try {
            processedOrder.operations = await this.getOrderOperations(order.Guid);
          } catch (error) {
            logger.warn('Failed to retrieve operations data', { 
              orderNumber: order.OrderNumber, 
              error: error.message 
            });
          }
        }

        // Get labor tracking if requested
        if (params.includeLabor && order.Guid) {
          try {
            processedOrder.laborTracking = await this.getLaborTracking(order.Guid);
          } catch (error) {
            logger.warn('Failed to retrieve labor data', { 
              orderNumber: order.OrderNumber, 
              error: error.message 
            });
          }
        }

        // Get quality data if requested
        if (params.includeQuality && order.Guid) {
          try {
            processedOrder.qualityData = await this.getQualityData(order.Guid);
          } catch (error) {
            logger.warn('Failed to retrieve quality data', { 
              orderNumber: order.OrderNumber, 
              error: error.message 
            });
          }
        }

        // Calculate WIP analysis
        processedOrder.wipAnalysis = this.calculateWIPAnalysis(processedOrder);
        
        // Calculate efficiency metrics
        processedOrder.efficiency = this.calculateEfficiencyMetrics(processedOrder);

        processedOrders.push(processedOrder);
      }

      return {
        success: true,
        productionOrders: processedOrders,
        summary: this.calculateProductionSummary(processedOrders),
        analysis: this.performProductionAnalysis(processedOrders),
        metadata: {
          retrievedAt: new Date().toISOString(),
          includeComponents: params.includeComponents,
          includeOperations: params.includeOperations,
          includeLabor: params.includeLabor,
          includeQuality: params.includeQuality
        }
      };

    } catch (error) {
      logger.error('Failed to process production orders data', { error: error.message });
      throw error;
    }
  }

  /**
   * Get order component requirements and consumption
   */
  async getOrderComponents(orderGuid) {
    try {
      const response = await this.apiClient.get(`/ProductionOrders/${orderGuid}/Components`);
      
      return response.data.map(component => ({
        componentGuid: component.ComponentGuid,
        componentCode: component.ComponentCode,
        componentDescription: component.ComponentDescription,
        requiredQuantity: component.RequiredQuantity || 0,
        consumedQuantity: component.ConsumedQuantity || 0,
        remainingQuantity: (component.RequiredQuantity || 0) - (component.ConsumedQuantity || 0),
        unitOfMeasure: component.UnitOfMeasure,
        unitCost: component.UnitCost || 0,
        totalCost: (component.ConsumedQuantity || 0) * (component.UnitCost || 0),
        wastePercentage: component.WastePercentage || 0,
        status: component.Status
      }));
      
    } catch (error) {
      logger.debug('No component data available for order', { orderGuid });
      return [];
    }
  }

  /**
   * Get production operations and routing
   */
  async getOrderOperations(orderGuid) {
    try {
      const response = await this.apiClient.get(`/ProductionOrders/${orderGuid}/Operations`);
      
      return response.data.map(operation => ({
        operationGuid: operation.OperationGuid,
        operationCode: operation.OperationCode,
        operationDescription: operation.OperationDescription,
        sequence: operation.Sequence,
        setupTime: operation.SetupTime || 0,
        runTime: operation.RunTime || 0,
        actualSetupTime: operation.ActualSetupTime || 0,
        actualRunTime: operation.ActualRunTime || 0,
        status: operation.Status,
        percentComplete: operation.PercentComplete || 0,
        workCenter: operation.WorkCenter,
        resource: operation.Resource,
        standardRate: operation.StandardRate || 0,
        actualRate: operation.ActualRate || 0
      }));
      
    } catch (error) {
      logger.debug('No operations data available for order', { orderGuid });
      return [];
    }
  }

  /**
   * Get labor tracking data
   */
  async getLaborTracking(orderGuid) {
    try {
      const response = await this.apiClient.get(`/ProductionOrders/${orderGuid}/Labor`);
      
      return response.data.map(labor => ({
        entryDate: labor.EntryDate,
        employee: labor.Employee,
        operation: labor.Operation,
        hoursWorked: labor.HoursWorked || 0,
        rate: labor.Rate || 0,
        cost: labor.Cost || 0,
        notes: labor.Notes
      }));
      
    } catch (error) {
      logger.debug('No labor data available for order', { orderGuid });
      return [];
    }
  }

  /**
   * Get quality control data
   */
  async getQualityData(orderGuid) {
    try {
      const response = await this.apiClient.get(`/ProductionOrders/${orderGuid}/Quality`);
      
      return {
        inspections: response.data.Inspections || [],
        defects: response.data.Defects || [],
        qualityScore: response.data.QualityScore || 0,
        passRate: response.data.PassRate || 0,
        reworkQuantity: response.data.ReworkQuantity || 0,
        scrapQuantity: response.data.ScrapQuantity || 0
      };
      
    } catch (error) {
      logger.debug('No quality data available for order', { orderGuid });
      return {};
    }
  }

  /**
   * Calculate WIP (Work in Progress) analysis
   */
  calculateWIPAnalysis(order) {
    const analysis = {
      wipValue: 0,
      completionStatus: 'planned',
      daysInProduction: 0,
      estimatedCompletion: null,
      bottlenecks: [],
      risks: []
    };

    // Calculate WIP value
    analysis.wipValue = order.actualCost || order.estimatedCost || 0;

    // Determine completion status
    if (order.status === 'Completed') {
      analysis.completionStatus = 'completed';
    } else if (order.status === 'InProgress') {
      analysis.completionStatus = 'in_progress';
    } else if (order.status === 'OnHold') {
      analysis.completionStatus = 'on_hold';
    }

    // Calculate days in production
    if (order.actualStartDate) {
      const startDate = new Date(order.actualStartDate);
      const currentDate = new Date();
      analysis.daysInProduction = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24));
    }

    // Identify risks
    if (order.remainingQuantity < 0) {
      analysis.risks.push('Over-production detected');
    }

    if (order.actualCost > order.estimatedCost * 1.1) {
      analysis.risks.push('Cost overrun detected');
    }

    if (order.plannedEndDate && new Date(order.plannedEndDate) < new Date()) {
      analysis.risks.push('Behind schedule');
    }

    return analysis;
  }

  /**
   * Calculate efficiency metrics
   */
  calculateEfficiencyMetrics(order) {
    const metrics = {
      scheduleEfficiency: 0,
      costEfficiency: 0,
      productionEfficiency: 0,
      overallEfficiency: 0,
      recommendations: []
    };

    // Schedule efficiency
    if (order.estimatedDuration && order.actualDuration) {
      metrics.scheduleEfficiency = Math.min(100, (order.estimatedDuration / order.actualDuration) * 100);
    }

    // Cost efficiency
    if (order.estimatedCost && order.actualCost && order.actualCost > 0) {
      metrics.costEfficiency = Math.min(100, (order.estimatedCost / order.actualCost) * 100);
    }

    // Production efficiency
    if (order.plannedQuantity && order.producedQuantity) {
      metrics.productionEfficiency = (order.producedQuantity / order.plannedQuantity) * 100;
    }

    // Overall efficiency (weighted average)
    const validMetrics = [metrics.scheduleEfficiency, metrics.costEfficiency, metrics.productionEfficiency]
      .filter(metric => metric > 0);
    
    if (validMetrics.length > 0) {
      metrics.overallEfficiency = validMetrics.reduce((sum, metric) => sum + metric, 0) / validMetrics.length;
    }

    // Generate recommendations
    if (metrics.scheduleEfficiency < 80) {
      metrics.recommendations.push('Review production scheduling and resource allocation');
    }

    if (metrics.costEfficiency < 90) {
      metrics.recommendations.push('Investigate cost overruns and optimize material usage');
    }

    return metrics;
  }

  /**
   * Calculate production summary statistics
   */
  calculateProductionSummary(orders) {
    return {
      totalOrders: orders.length,
      plannedOrders: orders.filter(o => o.status === 'Planned').length,
      inProgressOrders: orders.filter(o => o.status === 'InProgress').length,
      completedOrders: orders.filter(o => o.status === 'Completed').length,
      onHoldOrders: orders.filter(o => o.status === 'OnHold').length,
      totalPlannedQuantity: orders.reduce((sum, o) => sum + o.plannedQuantity, 0),
      totalProducedQuantity: orders.reduce((sum, o) => sum + o.producedQuantity, 0),
      totalEstimatedCost: orders.reduce((sum, o) => sum + o.estimatedCost, 0),
      totalActualCost: orders.reduce((sum, o) => sum + o.actualCost, 0),
      averageEfficiency: this.calculateAverage(orders.map(o => o.efficiency.overallEfficiency)),
      totalWIPValue: orders.reduce((sum, o) => sum + o.wipAnalysis.wipValue, 0)
    };
  }

  /**
   * Perform advanced production analysis
   */
  performProductionAnalysis(orders) {
    return {
      capacityUtilization: this.analyzeCapacityUtilization(orders),
      bottleneckAnalysis: this.analyzeBottlenecks(orders),
      costAnalysis: this.analyzeCosts(orders),
      schedulePerformance: this.analyzeSchedulePerformance(orders)
    };
  }

  /**
   * Analyze capacity utilization
   */
  analyzeCapacityUtilization(orders) {
    const activeOrders = orders.filter(o => o.status === 'InProgress');
    const plannedOrders = orders.filter(o => o.status === 'Planned');
    
    return {
      activeOrdersCount: activeOrders.length,
      plannedOrdersCount: plannedOrders.length,
      utilizationRate: activeOrders.length / (activeOrders.length + plannedOrders.length) || 0
    };
  }

  /**
   * Analyze bottlenecks
   */
  analyzeBottlenecks(orders) {
    const bottlenecks = [];
    
    // Identify orders behind schedule
    const behindSchedule = orders.filter(o => 
      o.plannedEndDate && new Date(o.plannedEndDate) < new Date() && o.status !== 'Completed'
    );
    
    if (behindSchedule.length > 0) {
      bottlenecks.push({
        type: 'schedule_delays',
        count: behindSchedule.length,
        impact: 'high'
      });
    }

    return bottlenecks;
  }

  /**
   * Analyze costs
   */
  analyzeCosts(orders) {
    const costOverruns = orders.filter(o => o.actualCost > o.estimatedCost * 1.1);
    
    return {
      costOverruns: costOverruns.length,
      averageCostVariance: this.calculateAverage(
        orders.map(o => ((o.actualCost - o.estimatedCost) / o.estimatedCost) * 100)
      )
    };
  }

  /**
   * Analyze schedule performance
   */
  analyzeSchedulePerformance(orders) {
    const completedOrders = orders.filter(o => o.status === 'Completed');
    const onTimeDeliveries = completedOrders.filter(o => 
      !o.plannedEndDate || !o.actualEndDate || new Date(o.actualEndDate) <= new Date(o.plannedEndDate)
    );

    return {
      onTimePerformance: completedOrders.length > 0 ? 
        (onTimeDeliveries.length / completedOrders.length) * 100 : 0,
      averageCycleTime: this.calculateAverage(
        completedOrders.map(o => o.actualDuration || 0)
      )
    };
  }

  /**
   * Helper methods
   */
  calculateAverage(values) {
    const validValues = values.filter(v => v !== null && v !== undefined && !isNaN(v));
    return validValues.length > 0 ? 
      validValues.reduce((sum, value) => sum + value, 0) / validValues.length : 0;
  }

  /**
   * Generate cache key
   */
  generateCacheKey(params) {
    return `unleashed:production-orders:${JSON.stringify(params)}`;
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