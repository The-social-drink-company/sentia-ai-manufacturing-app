/**
 * Unleashed Get Products Tool
 * 
 * Retrieves product master data including BOMs (Bill of Materials), variants,
 * configurations, lifecycle stages, and costing information from Unleashed API.
 * 
 * @version 1.0.0
 * @author Sentia Manufacturing Team
 */

import { createLogger } from '../../../utils/logger.js';

const logger = createLogger();

export class GetProductsTool {
  constructor(apiClient, cache, dataValidator) {
    this.apiClient = apiClient;
    this.cache = cache;
    this.dataValidator = dataValidator;
    this.isInitialized = false;
    
    // Tool metadata
    this.name = 'unleashed-get-products';
    this.description = 'Retrieve product master data including BOMs, variants, lifecycle stages, and costing information';
    this.category = 'unleashed';
    this.version = '1.0.0';
    
    // Input schema for validation
    this.inputSchema = {
      type: 'object',
      properties: {
        productCode: {
          type: 'string',
          description: 'Specific product code to retrieve'
        },
        productGuid: {
          type: 'string',
          description: 'Specific product GUID to retrieve'
        },
        includeObsolete: {
          type: 'boolean',
          default: false,
          description: 'Include obsolete products in results'
        },
        includeBOM: {
          type: 'boolean',
          default: true,
          description: 'Include Bill of Materials data'
        },
        includeVariants: {
          type: 'boolean',
          default: true,
          description: 'Include product variants and configurations'
        },
        includeCosting: {
          type: 'boolean',
          default: true,
          description: 'Include costing and pricing information'
        },
        warehouseCode: {
          type: 'string',
          description: 'Filter by specific warehouse location'
        },
        categoryId: {
          type: 'string',
          description: 'Filter by product category'
        },
        supplierCode: {
          type: 'string',
          description: 'Filter by supplier code'
        },
        modifiedSince: {
          type: 'string',
          format: 'date-time',
          description: 'Only return products modified since this date'
        },
        pageSize: {
          type: 'integer',
          minimum: 1,
          maximum: 1000,
          default: 200,
          description: 'Number of products per page'
        },
        page: {
          type: 'integer',
          minimum: 1,
          default: 1,
          description: 'Page number for pagination'
        },
        sortBy: {
          type: 'string',
          enum: ['ProductCode', 'ProductDescription', 'LastModifiedOn', 'UnitOfMeasure'],
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
      logger.info('Initializing Unleashed Get Products tool...');
      this.isInitialized = true;
      logger.info('Get Products tool initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize Get Products tool', { error: error.message });
      throw error;
    }
  }

  /**
   * Execute the get products tool
   */
  async execute(params = {}) {
    try {
      logger.info('Executing Unleashed get products request', {
        productCode: params.productCode,
        includeBOM: params.includeBOM,
        includeVariants: params.includeVariants,
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
          logger.debug('Returning cached product data');
          return cachedData;
        }
      }

      // Make API request
      const endpoint = params.productGuid ? 
        `/StockItems/${params.productGuid}` : 
        '/StockItems';
      
      const response = await this.apiClient.get(endpoint, queryParams);
      
      // Process and enrich product data
      const processedData = await this.processProductData(response.data, params);
      
      // Cache the results
      if (this.cache && params.useCache !== false) {
        await this.cache.set(cacheKey, processedData, 900); // 15 minute cache
      }

      logger.info('Product data retrieved successfully', {
        productCount: Array.isArray(processedData.products) ? processedData.products.length : 1,
        includedBOM: params.includeBOM,
        includedVariants: params.includeVariants
      });

      return processedData;

    } catch (error) {
      logger.error('Get products execution failed', {
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
    if (params.productCode) queryParams.productCode = params.productCode;
    if (params.includeObsolete) queryParams.includeObsolete = 'true';
    if (params.warehouseCode) queryParams.warehouseCode = params.warehouseCode;
    if (params.categoryId) queryParams.categoryId = params.categoryId;
    if (params.supplierCode) queryParams.supplierCode = params.supplierCode;
    if (params.modifiedSince) queryParams.modifiedSince = params.modifiedSince;
    
    // Pagination
    queryParams.pageSize = params.pageSize || 200;
    queryParams.page = params.page || 1;
    
    // Sorting
    if (params.sortBy) queryParams.sort = params.sortBy;
    
    return queryParams;
  }

  /**
   * Process and enrich product data
   */
  async processProductData(rawData, params) {
    try {
      const products = Array.isArray(rawData) ? rawData : [rawData];
      const processedProducts = [];

      for (const product of products) {
        const processedProduct = {
          // Basic product information
          guid: product.Guid,
          productCode: product.ProductCode,
          productDescription: product.ProductDescription,
          unitOfMeasure: product.UnitOfMeasure,
          barcode: product.Barcode,
          productGroup: product.ProductGroup,
          
          // Lifecycle and status
          obsolete: product.Obsolete,
          canSell: product.CanSell,
          canPurchase: product.CanPurchase,
          canStock: product.CanStock,
          canManufacture: product.CanManufacture,
          
          // Physical properties
          weight: product.Weight,
          depth: product.Depth,
          height: product.Height,
          width: product.Width,
          volume: product.Volume,
          
          // Financial information
          defaultSellPrice: product.DefaultSellPrice,
          defaultBuyPrice: product.DefaultBuyPrice,
          averageLandPrice: product.AverageLandPrice,
          lastCost: product.LastCost,
          
          // Inventory settings
          minStockLevel: product.MinStockLevel,
          maxStockLevel: product.MaxStockLevel,
          reorderLevel: product.ReorderLevel,
          
          // Metadata
          createdBy: product.CreatedBy,
          createdOn: product.CreatedOn,
          lastModifiedOn: product.LastModifiedOn,
          
          // Enhanced data
          bomComponents: [],
          variants: [],
          costing: {}
        };

        // Get BOM data if requested
        if (params.includeBOM && product.Guid) {
          try {
            processedProduct.bomComponents = await this.getBOMComponents(product.Guid);
          } catch (error) {
            logger.warn('Failed to retrieve BOM data', { 
              productCode: product.ProductCode, 
              error: error.message 
            });
          }
        }

        // Get variant data if requested
        if (params.includeVariants && product.Guid) {
          try {
            processedProduct.variants = await this.getProductVariants(product.Guid);
          } catch (error) {
            logger.warn('Failed to retrieve variant data', { 
              productCode: product.ProductCode, 
              error: error.message 
            });
          }
        }

        // Get detailed costing if requested
        if (params.includeCosting && product.Guid) {
          try {
            processedProduct.costing = await this.getProductCosting(product.Guid);
          } catch (error) {
            logger.warn('Failed to retrieve costing data', { 
              productCode: product.ProductCode, 
              error: error.message 
            });
          }
        }

        processedProducts.push(processedProduct);
      }

      return {
        success: true,
        products: processedProducts,
        summary: {
          totalProducts: processedProducts.length,
          manufacturableProducts: processedProducts.filter(p => p.canManufacture).length,
          sellableProducts: processedProducts.filter(p => p.canSell).length,
          purchasableProducts: processedProducts.filter(p => p.canPurchase).length,
          obsoleteProducts: processedProducts.filter(p => p.obsolete).length,
          averageDefaultSellPrice: this.calculateAverage(processedProducts, 'defaultSellPrice'),
          averageWeight: this.calculateAverage(processedProducts, 'weight')
        },
        metadata: {
          retrievedAt: new Date().toISOString(),
          includedBOM: params.includeBOM,
          includedVariants: params.includeVariants,
          includedCosting: params.includeCosting
        }
      };

    } catch (error) {
      logger.error('Failed to process product data', { error: error.message });
      throw error;
    }
  }

  /**
   * Get BOM components for a product
   */
  async getBOMComponents(productGuid) {
    try {
      const response = await this.apiClient.get(`/StockItems/${productGuid}/BillOfMaterials`);
      
      return response.data.map(component => ({
        componentGuid: component.ComponentGuid,
        componentCode: component.ComponentCode,
        componentDescription: component.ComponentDescription,
        quantity: component.Quantity,
        unitOfMeasure: component.UnitOfMeasure,
        sequence: component.Sequence,
        wastePercentage: component.WastePercentage,
        costPercentage: component.CostPercentage,
        subComponents: component.SubComponents || []
      }));
      
    } catch (error) {
      logger.debug('No BOM data available for product', { productGuid });
      return [];
    }
  }

  /**
   * Get product variants
   */
  async getProductVariants(productGuid) {
    try {
      const response = await this.apiClient.get(`/StockItems/${productGuid}/Variants`);
      
      return response.data.map(variant => ({
        variantGuid: variant.Guid,
        variantCode: variant.ProductCode,
        variantDescription: variant.ProductDescription,
        attributes: variant.Attributes || [],
        sellPrice: variant.DefaultSellPrice,
        buyPrice: variant.DefaultBuyPrice
      }));
      
    } catch (error) {
      logger.debug('No variant data available for product', { productGuid });
      return [];
    }
  }

  /**
   * Get detailed product costing
   */
  async getProductCosting(productGuid) {
    try {
      const response = await this.apiClient.get(`/StockItems/${productGuid}/Costing`);
      
      return {
        standardCost: response.data.StandardCost,
        averageCost: response.data.AverageCost,
        lastCost: response.data.LastCost,
        materialCost: response.data.MaterialCost,
        laborCost: response.data.LaborCost,
        overheadCost: response.data.OverheadCost,
        totalManufacturingCost: response.data.TotalManufacturingCost,
        costingMethod: response.data.CostingMethod,
        lastUpdated: response.data.LastUpdated
      };
      
    } catch (error) {
      logger.debug('No detailed costing data available for product', { productGuid });
      return {};
    }
  }

  /**
   * Calculate average for numeric field
   */
  calculateAverage(items, field) {
    const values = items
      .map(item => item[field])
      .filter(value => value !== null && value !== undefined && !isNaN(value));
    
    return values.length > 0 ? 
      values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  }

  /**
   * Generate cache key
   */
  generateCacheKey(params) {
    return `unleashed:products:${JSON.stringify(params)}`;
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