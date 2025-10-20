/**
 * Unleashed Get Inventory Tool
 * 
 * Retrieves real-time inventory levels with multi-location tracking,
 * lot/serial numbers, reserved quantities, and inventory valuation.
 * 
 * @version 1.0.0
 * @author CapLiquify Platform Team
 */

import { createLogger } from '../../../utils/logger.js';

const logger = createLogger();

export class GetInventoryTool {
  constructor(apiClient, cache, dataValidator) {
    this.apiClient = apiClient;
    this.cache = cache;
    this.dataValidator = dataValidator;
    this.isInitialized = false;
    
    // Tool metadata
    this.name = 'unleashed-get-inventory';
    this.description = 'Retrieve real-time inventory levels with multi-location tracking, lot/serial numbers, and valuation';
    this.category = 'unleashed';
    this.version = '1.0.0';
    
    // Input schema for validation
    this.inputSchema = {
      type: 'object',
      properties: {
        productCode: {
          type: 'string',
          description: 'Specific product code to check inventory for'
        },
        productGuid: {
          type: 'string',
          description: 'Specific product GUID to check inventory for'
        },
        warehouseCode: {
          type: 'string',
          description: 'Specific warehouse location code'
        },
        warehouseGuid: {
          type: 'string',
          description: 'Specific warehouse GUID'
        },
        includeReserved: {
          type: 'boolean',
          default: true,
          description: 'Include reserved quantities in results'
        },
        includeAllocated: {
          type: 'boolean',
          default: true,
          description: 'Include allocated quantities in results'
        },
        includeLotSerial: {
          type: 'boolean',
          default: false,
          description: 'Include lot and serial number tracking details'
        },
        includeValuation: {
          type: 'boolean',
          default: true,
          description: 'Include inventory valuation calculations'
        },
        includeMovements: {
          type: 'boolean',
          default: false,
          description: 'Include recent inventory movements'
        },
        asOfDate: {
          type: 'string',
          format: 'date',
          description: 'Get inventory levels as of specific date (YYYY-MM-DD)'
        },
        modifiedSince: {
          type: 'string',
          format: 'date-time',
          description: 'Only return inventory modified since this date'
        },
        lowStockOnly: {
          type: 'boolean',
          default: false,
          description: 'Only return items with low stock levels'
        },
        negativeStockOnly: {
          type: 'boolean',
          default: false,
          description: 'Only return items with negative stock levels'
        },
        pageSize: {
          type: 'integer',
          minimum: 1,
          maximum: 1000,
          default: 200,
          description: 'Number of inventory records per page'
        },
        page: {
          type: 'integer',
          minimum: 1,
          default: 1,
          description: 'Page number for pagination'
        },
        sortBy: {
          type: 'string',
          enum: ['ProductCode', 'WarehouseCode', 'QtyOnHand', 'LastModifiedOn'],
          default: 'ProductCode',
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
      logger.info('Initializing Unleashed Get Inventory tool...');
      this.isInitialized = true;
      logger.info('Get Inventory tool initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize Get Inventory tool', { error: error.message });
      throw error;
    }
  }

  /**
   * Execute the get inventory tool
   */
  async execute(params = {}) {
    try {
      logger.info('Executing Unleashed get inventory request', {
        productCode: params.productCode,
        warehouseCode: params.warehouseCode,
        includeReserved: params.includeReserved,
        includeLotSerial: params.includeLotSerial,
        pageSize: params.pageSize || 200
      });

      // Validate input parameters
      const validationResult = this.dataValidator.validateInput(params, this.inputSchema);
      if (!validationResult.valid) {
        throw new Error(`Invalid parameters: ${validationResult.errors.join(', ')}`);
      }

      // Build query parameters
      const queryParams = this.buildQueryParams(params);
      
      // Check cache first (shorter cache for real-time data)
      const cacheKey = this.generateCacheKey(queryParams);
      if (this.cache && params.useCache !== false) {
        const cachedData = await this.cache.get(cacheKey);
        if (cachedData) {
          logger.debug('Returning cached inventory data');
          return cachedData;
        }
      }

      // Make API request
      const endpoint = this.buildInventoryEndpoint(params);
      const response = await this.apiClient.get(endpoint, queryParams);
      
      // Process and enrich inventory data
      const processedData = await this.processInventoryData(response.data, params);
      
      // Cache the results (short cache for real-time data)
      if (this.cache && params.useCache !== false) {
        await this.cache.set(cacheKey, processedData, 60); // 1 minute cache for real-time data
      }

      logger.info('Inventory data retrieved successfully', {
        recordCount: Array.isArray(processedData.inventory) ? processedData.inventory.length : 1,
        totalValue: processedData.summary?.totalValue || 0,
        lowStockItems: processedData.summary?.lowStockItems || 0
      });

      return processedData;

    } catch (error) {
      logger.error('Get inventory execution failed', {
        error: error.message,
        params
      });
      throw error;
    }
  }

  /**
   * Build appropriate inventory endpoint
   */
  buildInventoryEndpoint(params) {
    if (params.productGuid) {
      return `/StockItems/${params.productGuid}/StockOnHand`;
    } else if (params.warehouseGuid) {
      return `/Warehouses/${params.warehouseGuid}/StockOnHand`;
    } else {
      return '/StockOnHand';
    }
  }

  /**
   * Build query parameters for API request
   */
  buildQueryParams(params) {
    const queryParams = {};
    
    // Basic filters
    if (params.productCode) queryParams.productCode = params.productCode;
    if (params.warehouseCode) queryParams.warehouseCode = params.warehouseCode;
    if (params.asOfDate) queryParams.asOfDate = params.asOfDate;
    if (params.modifiedSince) queryParams.modifiedSince = params.modifiedSince;
    
    // Stock level filters
    if (params.lowStockOnly) queryParams.lowStockOnly = 'true';
    if (params.negativeStockOnly) queryParams.negativeStockOnly = 'true';
    
    // Data inclusion flags
    if (params.includeReserved) queryParams.includeReserved = 'true';
    if (params.includeAllocated) queryParams.includeAllocated = 'true';
    if (params.includeLotSerial) queryParams.includeLotSerial = 'true';
    if (params.includeValuation) queryParams.includeValuation = 'true';
    if (params.includeMovements) queryParams.includeMovements = 'true';
    
    // Pagination
    queryParams.pageSize = params.pageSize || 200;
    queryParams.page = params.page || 1;
    
    // Sorting
    if (params.sortBy) queryParams.sort = params.sortBy;
    
    return queryParams;
  }

  /**
   * Process and enrich inventory data
   */
  async processInventoryData(rawData, params) {
    try {
      const inventoryRecords = Array.isArray(rawData) ? rawData : [rawData];
      const processedInventory = [];

      for (const record of inventoryRecords) {
        const processedRecord = {
          // Product identification
          productGuid: record.ProductGuid,
          productCode: record.ProductCode,
          productDescription: record.ProductDescription,
          
          // Warehouse information
          warehouseGuid: record.WarehouseGuid,
          warehouseCode: record.WarehouseCode,
          warehouseName: record.WarehouseName,
          
          // Quantity information
          qtyOnHand: record.QtyOnHand || 0,
          qtyAllocated: record.QtyAllocated || 0,
          qtyAvailable: record.QtyAvailable || 0,
          qtyReserved: record.QtyReserved || 0,
          qtyInTransit: record.QtyInTransit || 0,
          qtyBackOrdered: record.QtyBackOrdered || 0,
          
          // Calculated quantities
          qtyFree: (record.QtyOnHand || 0) - (record.QtyAllocated || 0) - (record.QtyReserved || 0),
          qtyTotal: (record.QtyOnHand || 0) + (record.QtyInTransit || 0),
          
          // Stock level indicators
          minStockLevel: record.MinStockLevel || 0,
          maxStockLevel: record.MaxStockLevel || 0,
          reorderLevel: record.ReorderLevel || 0,
          isLowStock: (record.QtyOnHand || 0) <= (record.ReorderLevel || 0),
          isNegativeStock: (record.QtyOnHand || 0) < 0,
          isOverStock: (record.MaxStockLevel || 0) > 0 && (record.QtyOnHand || 0) > (record.MaxStockLevel || 0),
          
          // Valuation information
          unitCost: record.UnitCost || 0,
          totalValue: (record.QtyOnHand || 0) * (record.UnitCost || 0),
          averageLandPrice: record.AverageLandPrice || 0,
          lastCost: record.LastCost || 0,
          
          // Unit information
          unitOfMeasure: record.UnitOfMeasure,
          
          // Metadata
          lastModifiedOn: record.LastModifiedOn,
          lastStockMovement: record.LastStockMovement,
          
          // Enhanced data
          lotSerialNumbers: [],
          recentMovements: [],
          stockAnalysis: {}
        };

        // Get lot/serial number data if requested
        if (params.includeLotSerial && record.ProductGuid) {
          try {
            processedRecord.lotSerialNumbers = await this.getLotSerialNumbers(
              record.ProductGuid, 
              record.WarehouseGuid
            );
          } catch (error) {
            logger.warn('Failed to retrieve lot/serial data', { 
              productCode: record.ProductCode, 
              error: error.message 
            });
          }
        }

        // Get recent movements if requested
        if (params.includeMovements && record.ProductGuid) {
          try {
            processedRecord.recentMovements = await this.getRecentMovements(
              record.ProductGuid, 
              record.WarehouseGuid
            );
          } catch (error) {
            logger.warn('Failed to retrieve movement data', { 
              productCode: record.ProductCode, 
              error: error.message 
            });
          }
        }

        // Calculate stock analysis
        processedRecord.stockAnalysis = this.calculateStockAnalysis(processedRecord);

        processedInventory.push(processedRecord);
      }

      return {
        success: true,
        inventory: processedInventory,
        summary: this.calculateInventorySummary(processedInventory),
        analysis: this.performInventoryAnalysis(processedInventory),
        metadata: {
          retrievedAt: new Date().toISOString(),
          asOfDate: params.asOfDate || new Date().toISOString().split('T')[0],
          includeReserved: params.includeReserved,
          includeLotSerial: params.includeLotSerial,
          includeValuation: params.includeValuation
        }
      };

    } catch (error) {
      logger.error('Failed to process inventory data', { error: error.message });
      throw error;
    }
  }

  /**
   * Get lot and serial number details
   */
  async getLotSerialNumbers(productGuid, warehouseGuid) {
    try {
      const endpoint = `/StockItems/${productGuid}/LotNumbers`;
      const params = warehouseGuid ? { warehouseGuid } : {};
      const response = await this.apiClient.get(endpoint, params);
      
      return response.data.map(lot => ({
        lotNumber: lot.LotNumber,
        serialNumber: lot.SerialNumber,
        expiryDate: lot.ExpiryDate,
        manufactureDate: lot.ManufactureDate,
        qtyOnHand: lot.QtyOnHand,
        qtyAllocated: lot.QtyAllocated,
        warehouseCode: lot.WarehouseCode
      }));
      
    } catch (error) {
      logger.debug('No lot/serial data available', { productGuid });
      return [];
    }
  }

  /**
   * Get recent inventory movements
   */
  async getRecentMovements(productGuid, warehouseGuid) {
    try {
      const endpoint = `/StockMovements`;
      const params = { 
        productGuid,
        ...(warehouseGuid && { warehouseGuid }),
        pageSize: 10,
        sort: 'CreatedOn'
      };
      const response = await this.apiClient.get(endpoint, params);
      
      return response.data.map(movement => ({
        movementDate: movement.CreatedOn,
        movementType: movement.MovementType,
        quantity: movement.Quantity,
        unitCost: movement.UnitCost,
        reference: movement.Reference,
        notes: movement.Notes
      }));
      
    } catch (error) {
      logger.debug('No movement data available', { productGuid });
      return [];
    }
  }

  /**
   * Calculate stock analysis for individual item
   */
  calculateStockAnalysis(record) {
    const analysis = {
      stockStatus: 'normal',
      daysOfStock: 0,
      turnoverRate: 0,
      stockValue: record.totalValue,
      recommendations: []
    };

    // Determine stock status
    if (record.isNegativeStock) {
      analysis.stockStatus = 'negative';
      analysis.recommendations.push('Immediate restock required - negative inventory');
    } else if (record.isLowStock) {
      analysis.stockStatus = 'low';
      analysis.recommendations.push('Reorder recommended - below reorder level');
    } else if (record.isOverStock) {
      analysis.stockStatus = 'excess';
      analysis.recommendations.push('Consider reducing stock levels - above maximum');
    }

    // Calculate days of stock (simplified)
    if (record.reorderLevel > 0) {
      analysis.daysOfStock = Math.floor(record.qtyOnHand / (record.reorderLevel / 30));
    }

    // Stock efficiency recommendations
    if (record.qtyReserved > record.qtyOnHand * 0.5) {
      analysis.recommendations.push('High reserved quantity - monitor allocation');
    }

    if (record.qtyFree < 0) {
      analysis.recommendations.push('Over-allocated - review reservations');
    }

    return analysis;
  }

  /**
   * Calculate inventory summary statistics
   */
  calculateInventorySummary(inventory) {
    return {
      totalItems: inventory.length,
      totalValue: inventory.reduce((sum, item) => sum + item.totalValue, 0),
      totalQtyOnHand: inventory.reduce((sum, item) => sum + item.qtyOnHand, 0),
      totalQtyAvailable: inventory.reduce((sum, item) => sum + item.qtyAvailable, 0),
      lowStockItems: inventory.filter(item => item.isLowStock).length,
      negativeStockItems: inventory.filter(item => item.isNegativeStock).length,
      overStockItems: inventory.filter(item => item.isOverStock).length,
      averageUnitCost: this.calculateAverage(inventory, 'unitCost'),
      warehouseCount: new Set(inventory.map(item => item.warehouseCode)).size
    };
  }

  /**
   * Perform advanced inventory analysis
   */
  performInventoryAnalysis(inventory) {
    const analysis = {
      stockDistribution: this.analyzeStockDistribution(inventory),
      valueAnalysis: this.analyzeValueDistribution(inventory),
      riskAssessment: this.assessInventoryRisk(inventory),
      optimizationOpportunities: this.identifyOptimizationOpportunities(inventory)
    };

    return analysis;
  }

  /**
   * Analyze stock distribution
   */
  analyzeStockDistribution(inventory) {
    const statusCounts = inventory.reduce((acc, item) => {
      acc[item.stockAnalysis.stockStatus] = (acc[item.stockAnalysis.stockStatus] || 0) + 1;
      return acc;
    }, {});

    return {
      statusBreakdown: statusCounts,
      stockTurnover: this.calculateStockTurnover(inventory),
      locationSpread: this.analyzeLocationSpread(inventory)
    };
  }

  /**
   * Analyze value distribution
   */
  analyzeValueDistribution(inventory) {
    const sorted = inventory.sort((a, b) => b.totalValue - a.totalValue);
    const totalValue = sorted.reduce((sum, item) => sum + item.totalValue, 0);
    
    // ABC Analysis (80/15/5 rule)
    let runningValue = 0;
    const classification = sorted.map(item => {
      runningValue += item.totalValue;
      const percentage = runningValue / totalValue;
      
      if (percentage <= 0.8) return 'A';
      if (percentage <= 0.95) return 'B';
      return 'C';
    });

    return {
      abcClassification: {
        A: classification.filter(c => c === 'A').length,
        B: classification.filter(c => c === 'B').length,
        C: classification.filter(c => c === 'C').length
      },
      highValueItems: sorted.slice(0, 10),
      totalValue
    };
  }

  /**
   * Assess inventory risks
   */
  assessInventoryRisk(inventory) {
    const risks = [];
    
    const negativeStock = inventory.filter(item => item.isNegativeStock);
    if (negativeStock.length > 0) {
      risks.push({
        type: 'negative_stock',
        severity: 'high',
        count: negativeStock.length,
        description: 'Items with negative stock levels'
      });
    }

    const overAllocated = inventory.filter(item => item.qtyFree < 0);
    if (overAllocated.length > 0) {
      risks.push({
        type: 'over_allocation',
        severity: 'medium',
        count: overAllocated.length,
        description: 'Items with over-allocation issues'
      });
    }

    return risks;
  }

  /**
   * Identify optimization opportunities
   */
  identifyOptimizationOpportunities(inventory) {
    const opportunities = [];
    
    const excessStock = inventory.filter(item => item.isOverStock);
    if (excessStock.length > 0) {
      opportunities.push({
        type: 'reduce_excess_stock',
        impact: 'high',
        count: excessStock.length,
        potentialSavings: excessStock.reduce((sum, item) => 
          sum + ((item.qtyOnHand - item.maxStockLevel) * item.unitCost), 0),
        description: 'Reduce excess stock to free up capital'
      });
    }

    return opportunities;
  }

  /**
   * Helper methods
   */
  calculateAverage(items, field) {
    const values = items
      .map(item => item[field])
      .filter(value => value !== null && value !== undefined && !isNaN(value));
    
    return values.length > 0 ? 
      values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  }

  calculateStockTurnover(inventory) {
    // Simplified turnover calculation
    return inventory.length > 0 ? 
      inventory.reduce((sum, item) => sum + (item.qtyOnHand > 0 ? 1 : 0), 0) / inventory.length : 0;
  }

  analyzeLocationSpread(inventory) {
    const warehouseCounts = inventory.reduce((acc, item) => {
      acc[item.warehouseCode] = (acc[item.warehouseCode] || 0) + 1;
      return acc;
    }, {});

    return warehouseCounts;
  }

  /**
   * Generate cache key
   */
  generateCacheKey(params) {
    return `unleashed:inventory:${JSON.stringify(params)}`;
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