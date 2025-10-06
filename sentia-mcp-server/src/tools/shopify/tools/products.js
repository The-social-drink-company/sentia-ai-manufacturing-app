/**
 * Shopify Products Management Tool
 * 
 * Comprehensive product catalog retrieval with variants, inventory,
 * pricing, and performance analytics.
 * 
 * @version 1.0.0
 */

import { createLogger } from '../../../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger();

/**
 * Products Tool Class
 */
export class ProductsTool {
  constructor(shopifyIntegration) {
    this.shopify = shopifyIntegration;
    this.name = 'shopify-get-products';
    this.description = 'Retrieve Shopify product catalog with variants, inventory, and performance metrics';
    this.category = 'products';
    this.cacheEnabled = true;
    this.cacheTTL = 900; // 15 minutes
    this.requiresAuth = true;

    this.inputSchema = {
      type: 'object',
      properties: {
        storeId: {
          type: 'string',
          enum: ['uk', 'usa', 'all'],
          description: 'Store to retrieve products from',
          default: 'all'
        },
        status: {
          type: 'string',
          enum: ['active', 'archived', 'draft', 'any'],
          description: 'Product status filter',
          default: 'active'
        },
        vendor: {
          type: 'string',
          description: 'Filter by product vendor'
        },
        productType: {
          type: 'string',
          description: 'Filter by product type'
        },
        collectionId: {
          type: 'string',
          description: 'Filter by collection ID'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by product tags'
        },
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: 250,
          description: 'Maximum number of products to retrieve per store',
          default: 50
        },
        sinceId: {
          type: 'string',
          description: 'Retrieve products after this product ID (pagination)'
        },
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific fields to retrieve'
        },
        includeVariants: {
          type: 'boolean',
          description: 'Include product variants',
          default: true
        },
        includeInventory: {
          type: 'boolean',
          description: 'Include inventory levels',
          default: true
        },
        includeImages: {
          type: 'boolean',
          description: 'Include product images',
          default: true
        },
        includeAnalytics: {
          type: 'boolean',
          description: 'Include product performance analytics',
          default: true
        },
        includePricing: {
          type: 'boolean',
          description: 'Include detailed pricing information',
          default: true
        },
        sortBy: {
          type: 'string',
          enum: ['created_at', 'updated_at', 'title', 'price'],
          description: 'Sort products by field',
          default: 'created_at'
        },
        sortOrder: {
          type: 'string',
          enum: ['asc', 'desc'],
          description: 'Sort order direction',
          default: 'desc'
        },
        priceMin: {
          type: 'number',
          minimum: 0,
          description: 'Minimum price filter'
        },
        priceMax: {
          type: 'number',
          minimum: 0,
          description: 'Maximum price filter'
        },
        inventoryMin: {
          type: 'integer',
          minimum: 0,
          description: 'Minimum inventory level filter'
        }
      },
      additionalProperties: false
    };

    logger.info('Shopify Products Tool initialized');
  }

  /**
   * Execute products retrieval
   */
  async execute(params) {
    const startTime = Date.now();
    const correlationId = params.correlationId || uuidv4();

    try {
      logger.info('Executing Shopify products tool', {
        correlationId,
        storeId: params.storeId || 'all',
        status: params.status,
        includeVariants: params.includeVariants,
        includeInventory: params.includeInventory
      });

      const results = {};

      if (params.storeId === 'all') {
        // Get products from all configured stores
        const configuredStores = Object.keys(this.shopify.config.stores).filter(
          storeId => this.shopify.config.stores[storeId].shopDomain && 
                     this.shopify.config.stores[storeId].accessToken
        );

        for (const storeId of configuredStores) {
          try {
            const storeParams = { ...params, storeId };
            results[storeId] = await this.getStoreProducts(storeParams, correlationId);
          } catch (error) {
            logger.warn('Failed to get products for store', {
              correlationId,
              storeId,
              error: error.message
            });
            results[storeId] = { error: error.message };
          }
        }
      } else {
        // Get products from specific store
        results[params.storeId] = await this.getStoreProducts(params, correlationId);
      }

      // Perform cross-store analytics if multiple stores
      let aggregatedAnalytics = null;
      if (params.includeAnalytics && Object.keys(results).length > 1) {
        aggregatedAnalytics = this.calculateAggregatedAnalytics(results);
      }

      const executionTime = Date.now() - startTime;

      logger.info('Products retrieved successfully', {
        correlationId,
        storesProcessed: Object.keys(results).length,
        executionTime
      });

      return {
        success: true,
        data: {
          products: results,
          aggregated: aggregatedAnalytics
        },
        metadata: {
          correlationId,
          executionTime,
          storesProcessed: Object.keys(results).length,
          generatedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;

      logger.error('Products retrieval failed', {
        correlationId,
        error: error.message,
        executionTime
      });

      throw new Error(`Products retrieval failed: ${error.message}`);
    }
  }

  /**
   * Get products from a specific store
   */
  async getStoreProducts(params, correlationId) {
    try {
      const client = this.shopify.getRestClient(params.storeId);
      
      // Build query parameters
      const queryParams = this.buildQueryParams(params);

      logger.debug('Fetching products from store', {
        correlationId,
        storeId: params.storeId,
        queryParams
      });

      // Fetch products from Shopify
      const response = await client.get({
        path: 'products',
        query: queryParams
      });

      if (!response.body || !response.body.products) {
        throw new Error('Invalid response from Shopify API');
      }

      let products = response.body.products;

      // Apply additional filters that Shopify API doesn't support directly
      products = this.applyAdditionalFilters(products, params);

      // Enrich products with additional data if requested
      const enrichedProducts = await this.enrichProductsData(products, params, correlationId);

      // Calculate analytics if requested
      let analytics = null;
      if (params.includeAnalytics) {
        analytics = this.calculateProductAnalytics(enrichedProducts, params);
      }

      logger.debug('Products retrieved from store', {
        correlationId,
        storeId: params.storeId,
        productCount: products.length
      });

      return {
        success: true,
        storeId: params.storeId,
        products: enrichedProducts,
        analytics,
        pagination: this.extractPaginationInfo(response.headers),
        metadata: {
          productCount: products.length,
          retrievedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      logger.error('Failed to get products from store', {
        correlationId,
        storeId: params.storeId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Build query parameters for Shopify API
   */
  buildQueryParams(params) {
    const queryParams = {};

    // Basic filters
    if (params.status && params.status !== 'any') {
      queryParams.status = params.status;
    }

    if (params.vendor) {
      queryParams.vendor = params.vendor;
    }

    if (params.productType) {
      queryParams.product_type = params.productType;
    }

    if (params.collectionId) {
      queryParams.collection_id = params.collectionId;
    }

    // Pagination
    queryParams.limit = params.limit || 50;
    
    if (params.sinceId) {
      queryParams.since_id = params.sinceId;
    }

    // Field selection
    if (params.fields && params.fields.length > 0) {
      queryParams.fields = params.fields.join(',');
    }

    return queryParams;
  }

  /**
   * Apply additional filters not supported by Shopify API
   */
  applyAdditionalFilters(products, params) {
    let filteredProducts = [...products];

    // Filter by tags
    if (params.tags && params.tags.length > 0) {
      filteredProducts = filteredProducts.filter(product => {
        const productTags = product.tags ? product.tags.split(',').map(tag => tag.trim().toLowerCase()) : [];
        return params.tags.some(tag => productTags.includes(tag.toLowerCase()));
      });
    }

    // Filter by price range
    if (params.priceMin !== undefined || params.priceMax !== undefined) {
      filteredProducts = filteredProducts.filter(product => {
        const minPrice = this.getProductMinPrice(product);
        const maxPrice = this.getProductMaxPrice(product);
        
        if (params.priceMin !== undefined && maxPrice < params.priceMin) return false;
        if (params.priceMax !== undefined && minPrice > params.priceMax) return false;
        
        return true;
      });
    }

    // Filter by inventory level
    if (params.inventoryMin !== undefined) {
      filteredProducts = filteredProducts.filter(product => {
        const totalInventory = this.calculateTotalInventory(product);
        return totalInventory >= params.inventoryMin;
      });
    }

    // Apply sorting
    if (params.sortBy && params.sortBy !== 'created_at') {
      filteredProducts.sort((a, b) => {
        let aValue, bValue;
        
        switch (params.sortBy) {
          case 'title':
            aValue = a.title || '';
            bValue = b.title || '';
            break;
          case 'price':
            aValue = this.getProductMinPrice(a);
            bValue = this.getProductMinPrice(b);
            break;
          case 'updated_at':
            aValue = new Date(a.updated_at || 0);
            bValue = new Date(b.updated_at || 0);
            break;
          default:
            return 0;
        }

        if (params.sortOrder === 'desc') {
          return aValue > bValue ? -1 : (aValue < bValue ? 1 : 0);
        } else {
          return aValue < bValue ? -1 : (aValue > bValue ? 1 : 0);
        }
      });
    }

    return filteredProducts;
  }

  /**
   * Enrich products with additional data
   */
  async enrichProductsData(products, params, correlationId) {
    try {
      const enrichedProducts = [];

      for (const product of products) {
        const enrichedProduct = { ...product };

        // Add calculated fields
        enrichedProduct.calculated = {
          variantCount: product.variants?.length || 0,
          totalInventory: this.calculateTotalInventory(product),
          minPrice: this.getProductMinPrice(product),
          maxPrice: this.getProductMaxPrice(product),
          averagePrice: this.getProductAveragePrice(product),
          imageCount: product.images?.length || 0,
          tagCount: product.tags ? product.tags.split(',').length : 0,
          isLowStock: this.isProductLowStock(product),
          profitMarginEstimate: this.estimateProductProfitMargin(product)
        };

        // Add inventory details if requested
        if (params.includeInventory && product.variants) {
          enrichedProduct.inventoryDetails = this.calculateInventoryDetails(product.variants);
        }

        // Add pricing analysis if requested
        if (params.includePricing && product.variants) {
          enrichedProduct.pricingAnalysis = this.analyzePricing(product.variants);
        }

        // Add SEO analysis
        enrichedProduct.seoAnalysis = this.analyzeSEO(product);

        // Add performance metrics (would require sales data integration)
        if (params.includeAnalytics) {
          enrichedProduct.performanceMetrics = await this.getProductPerformanceMetrics(
            product.id, 
            params.storeId, 
            correlationId
          );
        }

        enrichedProducts.push(enrichedProduct);
      }

      return enrichedProducts;

    } catch (error) {
      logger.warn('Failed to enrich products data', {
        correlationId,
        error: error.message
      });
      // Return original products if enrichment fails
      return products;
    }
  }

  /**
   * Calculate comprehensive product analytics
   */
  calculateProductAnalytics(products, params) {
    try {
      const analytics = {
        summary: {
          totalProducts: products.length,
          activeProducts: products.filter(p => p.status === 'active').length,
          totalVariants: 0,
          totalInventory: 0,
          averagePrice: 0,
          lowStockProducts: 0
        },
        distribution: {
          byVendor: {},
          byType: {},
          byTags: {},
          byPriceRange: {
            under25: 0,
            range25to50: 0,
            range50to100: 0,
            range100to250: 0,
            over250: 0
          }
        },
        inventory: {
          totalValue: 0,
          lowStockAlerts: [],
          outOfStockProducts: 0,
          overstockedProducts: []
        },
        insights: []
      };

      let totalPriceSum = 0;
      let productCount = 0;

      // Calculate summary metrics
      products.forEach(product => {
        analytics.summary.totalVariants += product.calculated?.variantCount || 0;
        analytics.summary.totalInventory += product.calculated?.totalInventory || 0;
        
        const avgPrice = product.calculated?.averagePrice || 0;
        if (avgPrice > 0) {
          totalPriceSum += avgPrice;
          productCount++;
        }

        if (product.calculated?.isLowStock) {
          analytics.summary.lowStockProducts++;
        }

        // Distribution analysis
        this.updateVendorDistribution(analytics.distribution.byVendor, product);
        this.updateTypeDistribution(analytics.distribution.byType, product);
        this.updateTagsDistribution(analytics.distribution.byTags, product);
        this.updatePriceRangeDistribution(analytics.distribution.byPriceRange, product);

        // Inventory analysis
        this.updateInventoryAnalysis(analytics.inventory, product);
      });

      // Calculate averages
      if (productCount > 0) {
        analytics.summary.averagePrice = totalPriceSum / productCount;
      }

      // Generate insights
      analytics.insights = this.generateProductInsights(analytics, products);

      return analytics;

    } catch (error) {
      logger.warn('Failed to calculate product analytics', {
        error: error.message
      });
      return null;
    }
  }

  /**
   * Generate business insights from product data
   */
  generateProductInsights(analytics, products) {
    const insights = [];

    // Inventory insights
    const lowStockRate = analytics.summary.lowStockProducts / analytics.summary.totalProducts;
    if (lowStockRate > 0.1) {
      insights.push({
        type: 'inventory',
        severity: 'warning',
        message: `${(lowStockRate * 100).toFixed(1)}% of products are low in stock`
      });
    }

    // Pricing insights
    if (analytics.summary.averagePrice > 100) {
      insights.push({
        type: 'pricing',
        severity: 'info',
        message: `High average product price of $${analytics.summary.averagePrice.toFixed(2)} indicates premium positioning`
      });
    }

    // Product diversity insights
    const vendorCount = Object.keys(analytics.distribution.byVendor).length;
    if (vendorCount < 3) {
      insights.push({
        type: 'diversification',
        severity: 'info',
        message: `Limited vendor diversity with only ${vendorCount} vendor(s)`
      });
    }

    // Variant insights
    const avgVariantsPerProduct = analytics.summary.totalVariants / analytics.summary.totalProducts;
    if (avgVariantsPerProduct > 5) {
      insights.push({
        type: 'complexity',
        severity: 'info',
        message: `High variant complexity with average ${avgVariantsPerProduct.toFixed(1)} variants per product`
      });
    }

    return insights;
  }

  // Helper methods for calculations and analysis

  getProductMinPrice(product) {
    if (!product.variants || product.variants.length === 0) return 0;
    return Math.min(...product.variants.map(v => parseFloat(v.price || 0)));
  }

  getProductMaxPrice(product) {
    if (!product.variants || product.variants.length === 0) return 0;
    return Math.max(...product.variants.map(v => parseFloat(v.price || 0)));
  }

  getProductAveragePrice(product) {
    if (!product.variants || product.variants.length === 0) return 0;
    const totalPrice = product.variants.reduce((sum, v) => sum + parseFloat(v.price || 0), 0);
    return totalPrice / product.variants.length;
  }

  calculateTotalInventory(product) {
    if (!product.variants) return 0;
    return product.variants.reduce((total, variant) => {
      return total + (variant.inventory_quantity || 0);
    }, 0);
  }

  isProductLowStock(product, threshold = 10) {
    const totalInventory = this.calculateTotalInventory(product);
    return totalInventory > 0 && totalInventory <= threshold;
  }

  estimateProductProfitMargin(product) {
    // Simplified profit margin estimation
    const avgPrice = this.getProductAveragePrice(product);
    const estimatedCost = avgPrice * 0.5; // Assume 50% cost ratio
    return avgPrice > 0 ? ((avgPrice - estimatedCost) / avgPrice) * 100 : 0;
  }

  calculateInventoryDetails(variants) {
    const details = {
      totalUnits: 0,
      byLocation: {},
      lowStockVariants: [],
      outOfStockVariants: []
    };

    variants.forEach(variant => {
      const inventory = variant.inventory_quantity || 0;
      details.totalUnits += inventory;

      if (inventory === 0) {
        details.outOfStockVariants.push({
          id: variant.id,
          title: variant.title,
          sku: variant.sku
        });
      } else if (inventory <= 5) {
        details.lowStockVariants.push({
          id: variant.id,
          title: variant.title,
          sku: variant.sku,
          quantity: inventory
        });
      }
    });

    return details;
  }

  analyzePricing(variants) {
    const prices = variants.map(v => parseFloat(v.price || 0)).filter(p => p > 0);
    
    if (prices.length === 0) {
      return { min: 0, max: 0, average: 0, variance: 0 };
    }

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const average = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    
    // Calculate variance
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - average, 2), 0) / prices.length;

    return {
      min,
      max,
      average,
      variance,
      priceSpread: max - min,
      standardDeviation: Math.sqrt(variance)
    };
  }

  analyzeSEO(product) {
    const analysis = {
      hasMetaDescription: !!product.meta_description,
      hasMetaTitle: !!product.meta_title,
      titleLength: (product.title || '').length,
      descriptionLength: (product.body_html || '').length,
      hasImages: (product.images || []).length > 0,
      hasAltTags: false, // Would need to parse image alt tags
      seoScore: 0
    };

    // Calculate SEO score
    let score = 0;
    if (analysis.hasMetaDescription) score += 20;
    if (analysis.hasMetaTitle) score += 20;
    if (analysis.titleLength >= 10 && analysis.titleLength <= 60) score += 20;
    if (analysis.descriptionLength >= 50) score += 20;
    if (analysis.hasImages) score += 20;

    analysis.seoScore = score;

    return analysis;
  }

  async getProductPerformanceMetrics(productId, storeId, correlationId) {
    // This would integrate with order data to calculate performance metrics
    // For now, return placeholder data
    return {
      totalSales: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      conversionRate: 0,
      viewsToSalesRatio: 0,
      lastSold: null,
      trending: false
    };
  }

  updateVendorDistribution(distribution, product) {
    const vendor = product.vendor || 'Unknown';
    distribution[vendor] = (distribution[vendor] || 0) + 1;
  }

  updateTypeDistribution(distribution, product) {
    const type = product.product_type || 'Unknown';
    distribution[type] = (distribution[type] || 0) + 1;
  }

  updateTagsDistribution(distribution, product) {
    if (product.tags) {
      const tags = product.tags.split(',').map(tag => tag.trim());
      tags.forEach(tag => {
        distribution[tag] = (distribution[tag] || 0) + 1;
      });
    }
  }

  updatePriceRangeDistribution(distribution, product) {
    const avgPrice = product.calculated?.averagePrice || 0;
    
    if (avgPrice < 25) distribution.under25++;
    else if (avgPrice < 50) distribution.range25to50++;
    else if (avgPrice < 100) distribution.range50to100++;
    else if (avgPrice < 250) distribution.range100to250++;
    else distribution.over250++;
  }

  updateInventoryAnalysis(inventory, product) {
    const totalInventory = product.calculated?.totalInventory || 0;
    const avgPrice = product.calculated?.averagePrice || 0;
    
    inventory.totalValue += totalInventory * avgPrice;
    
    if (totalInventory === 0) {
      inventory.outOfStockProducts++;
    } else if (product.calculated?.isLowStock) {
      inventory.lowStockAlerts.push({
        id: product.id,
        title: product.title,
        inventory: totalInventory
      });
    } else if (totalInventory > 100) {
      inventory.overstockedProducts.push({
        id: product.id,
        title: product.title,
        inventory: totalInventory
      });
    }
  }

  calculateAggregatedAnalytics(storeResults) {
    const aggregated = {
      totalProducts: 0,
      totalVariants: 0,
      totalInventoryValue: 0,
      storeComparison: {},
      crossStoreInsights: []
    };

    Object.entries(storeResults).forEach(([storeId, result]) => {
      if (result.success && result.analytics) {
        aggregated.totalProducts += result.analytics.summary.totalProducts;
        aggregated.totalVariants += result.analytics.summary.totalVariants;
        
        aggregated.storeComparison[storeId] = {
          products: result.analytics.summary.totalProducts,
          variants: result.analytics.summary.totalVariants,
          averagePrice: result.analytics.summary.averagePrice,
          inventoryValue: result.analytics.inventory.totalValue
        };
      }
    });

    return aggregated;
  }

  extractPaginationInfo(headers) {
    const linkHeader = headers.link;
    if (!linkHeader) return null;

    return {
      hasNext: linkHeader.includes('rel="next"'),
      hasPrevious: linkHeader.includes('rel="previous"')
    };
  }
}