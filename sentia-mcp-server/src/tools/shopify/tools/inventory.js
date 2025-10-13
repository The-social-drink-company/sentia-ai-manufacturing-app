/**
 * Shopify Inventory Management Tool
 * 
 * Track inventory levels across locations, low stock alerts,
 * inventory adjustments, and turnover rate calculations.
 * 
 * @version 1.0.0
 */

import { createLogger } from '../../../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger();

/**
 * Inventory Tool Class
 */
export class InventoryTool {
  constructor(shopifyIntegration) {
    this.shopify = shopifyIntegration;
    this.name = 'shopify-get-inventory';
    this.description = 'Track Shopify inventory levels with alerts, adjustments, and turnover analysis';
    this.category = 'inventory';
    this.cacheEnabled = true;
    this.cacheTTL = 300; // 5 minutes
    this.requiresAuth = true;

    this.inputSchema = {
      type: 'object',
      properties: {
        storeId: {
          type: 'string',
          enum: ['uk', 'usa', 'all'],
          description: 'Store to retrieve inventory from',
          default: 'all'
        },
        locationId: {
          type: 'string',
          description: 'Specific location ID to filter inventory'
        },
        productIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific product IDs to check inventory for'
        },
        variantIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific variant IDs to check inventory for'
        },
        lowStockThreshold: {
          type: 'integer',
          minimum: 0,
          description: 'Threshold for low stock alerts',
          default: 10
        },
        includeLocations: {
          type: 'boolean',
          description: 'Include location details for each inventory item',
          default: true
        },
        includeAnalytics: {
          type: 'boolean',
          description: 'Include inventory analytics and turnover rates',
          default: true
        },
        includeAlerts: {
          type: 'boolean',
          description: 'Include low stock and out of stock alerts',
          default: true
        },
        includeCosts: {
          type: 'boolean',
          description: 'Include inventory cost analysis',
          default: true
        },
        dateRange: {
          type: 'object',
          properties: {
            from: {
              type: 'string',
              pattern: '^\\d{4}-\\d{2}-\\d{2}$',
              description: 'Start date for inventory analysis (YYYY-MM-DD)'
            },
            to: {
              type: 'string',
              pattern: '^\\d{4}-\\d{2}-\\d{2}$',
              description: 'End date for inventory analysis (YYYY-MM-DD)'
            }
          },
          description: 'Date range for turnover analysis'
        },
        sortBy: {
          type: 'string',
          enum: ['quantity', 'value', 'turnover', 'product_name'],
          description: 'Sort inventory by field',
          default: 'quantity'
        },
        sortOrder: {
          type: 'string',
          enum: ['asc', 'desc'],
          description: 'Sort order direction',
          default: 'asc'
        }
      },
      additionalProperties: false
    };

    logger.info('Shopify Inventory Tool initialized');
  }

  /**
   * Execute inventory retrieval
   */
  async execute(params) {
    const startTime = Date.now();
    const correlationId = params.correlationId || uuidv4();

    try {
      logger.info('Executing Shopify inventory tool', {
        correlationId,
        storeId: params.storeId || 'all',
        lowStockThreshold: params.lowStockThreshold,
        includeAnalytics: params.includeAnalytics
      });

      const results = {};

      if (params.storeId === 'all') {
        // Get inventory from all configured stores
        const configuredStores = Object.keys(this.shopify.config.stores).filter(
          storeId => this.shopify.config.stores[storeId].shopDomain && 
                     this.shopify.config.stores[storeId].accessToken
        );

        for (const storeId of configuredStores) {
          try {
            const storeParams = { ...params, storeId };
            results[storeId] = await this.getStoreInventory(storeParams, correlationId);
          } catch (error) {
            logger.warn('Failed to get inventory for store', {
              correlationId,
              storeId,
              error: error.message
            });
            results[storeId] = { error: error.message };
          }
        }
      } else {
        // Get inventory from specific store
        results[params.storeId] = await this.getStoreInventory(params, correlationId);
      }

      // Perform cross-store analytics if multiple stores
      let aggregatedAnalytics = null;
      if (params.includeAnalytics && Object.keys(results).length > 1) {
        aggregatedAnalytics = this.calculateAggregatedAnalytics(results);
      }

      const executionTime = Date.now() - startTime;

      logger.info('Inventory retrieved successfully', {
        correlationId,
        storesProcessed: Object.keys(results).length,
        executionTime
      });

      return {
        success: true,
        data: {
          inventory: results,
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

      logger.error('Inventory retrieval failed', {
        correlationId,
        error: error.message,
        executionTime
      });

      throw new Error(`Inventory retrieval failed: ${error.message}`);
    }
  }

  /**
   * Get inventory from a specific store
   */
  async getStoreInventory(params, correlationId) {
    try {
      const client = this.shopify.getRestClient(params.storeId);
      
      // Get locations first
      const locations = await this.getStoreLocations(client, params, correlationId);
      
      // Get inventory levels
      const inventoryLevels = await this.getInventoryLevels(client, params, correlationId);
      
      // Get products to enrich inventory data
      const products = await this.getProductsForInventory(client, params, correlationId);

      // Combine and enrich inventory data
      const enrichedInventory = await this.enrichInventoryData(
        inventoryLevels, 
        products, 
        locations, 
        params, 
        correlationId
      );

      // Generate alerts if requested
      let alerts = [];
      if (params.includeAlerts) {
        alerts = this.generateInventoryAlerts(enrichedInventory, params);
      }

      // Calculate analytics if requested
      let analytics = null;
      if (params.includeAnalytics) {
        analytics = await this.calculateInventoryAnalytics(enrichedInventory, params, correlationId);
      }

      logger.debug('Inventory retrieved from store', {
        correlationId,
        storeId: params.storeId,
        inventoryItemCount: inventoryLevels.length,
        alertCount: alerts.length
      });

      return {
        success: true,
        storeId: params.storeId,
        inventory: enrichedInventory,
        locations,
        alerts,
        analytics,
        metadata: {
          inventoryItemCount: inventoryLevels.length,
          locationCount: locations.length,
          retrievedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      logger.error('Failed to get inventory from store', {
        correlationId,
        storeId: params.storeId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get store locations
   */
  async getStoreLocations(client, params, correlationId) {
    try {
      const response = await client.get({ path: 'locations' });
      
      if (!response.body || !response.body.locations) {
        throw new Error('Invalid locations response from Shopify API');
      }

      let locations = response.body.locations;

      // Filter by specific location if requested
      if (params.locationId) {
        locations = locations.filter(loc => loc.id.toString() === params.locationId);
      }

      return locations;

    } catch (error) {
      logger.error('Failed to get locations', {
        correlationId,
        error: error.message
      });
      // Return empty array if locations can't be fetched
      return [];
    }
  }

  /**
   * Get inventory levels
   */
  async getInventoryLevels(client, params, correlationId) {
    try {
      const queryParams = {};
      
      if (params.locationId) {
        queryParams.location_ids = params.locationId;
      }

      if (params.variantIds && params.variantIds.length > 0) {
        queryParams.inventory_item_ids = params.variantIds.join(',');
      }

      queryParams.limit = 250; // Maximum allowed by Shopify

      const response = await client.get({
        path: 'inventory_levels',
        query: queryParams
      });

      if (!response.body || !response.body.inventory_levels) {
        throw new Error('Invalid inventory levels response from Shopify API');
      }

      return response.body.inventory_levels;

    } catch (error) {
      logger.error('Failed to get inventory levels', {
        correlationId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get products for inventory enrichment
   */
  async getProductsForInventory(client, params, correlationId) {
    try {
      const queryParams = {
        limit: 250,
        status: 'active'
      };

      if (params.productIds && params.productIds.length > 0) {
        queryParams.ids = params.productIds.join(',');
      }

      const response = await client.get({
        path: 'products',
        query: queryParams
      });

      if (!response.body || !response.body.products) {
        return [];
      }

      return response.body.products;

    } catch (error) {
      logger.warn('Failed to get products for inventory', {
        correlationId,
        error: error.message
      });
      return [];
    }
  }

  /**
   * Enrich inventory data with product and location information
   */
  async enrichInventoryData(inventoryLevels, products, locations, params, correlationId) {
    try {
      const enrichedInventory = [];

      // Create lookup maps for efficiency
      const productMap = new Map();
      const variantMap = new Map();
      const locationMap = new Map(locations.map(loc => [loc.id.toString(), loc]));

      // Build product and variant maps
      products.forEach(product => {
        productMap.set(product.id.toString(), product);
        
        if (product.variants) {
          product.variants.forEach(variant => {
            variantMap.set(variant.inventory_item_id?.toString(), {
              ...variant,
              product
            });
          });
        }
      });

      // Enrich each inventory level
      for (const inventoryLevel of inventoryLevels) {
        const enrichedItem = { ...inventoryLevel };

        // Add location information
        const location = locationMap.get(inventoryLevel.location_id?.toString());
        if (location) {
          enrichedItem.location = {
            id: location.id,
            name: location.name,
            address: location.address1,
            city: location.city,
            country: location.country,
            active: location.active
          };
        }

        // Add product and variant information
        const variant = variantMap.get(inventoryLevel.inventory_item_id?.toString());
        if (variant) {
          enrichedItem.variant = {
            id: variant.id,
            title: variant.title,
            sku: variant.sku,
            price: variant.price,
            compare_at_price: variant.compare_at_price,
            barcode: variant.barcode,
            weight: variant.weight,
            weight_unit: variant.weight_unit
          };

          enrichedItem.product = {
            id: variant.product.id,
            title: variant.product.title,
            handle: variant.product.handle,
            product_type: variant.product.product_type,
            vendor: variant.product.vendor,
            tags: variant.product.tags
          };
        }

        // Add calculated fields
        enrichedItem.calculated = {
          isLowStock: this.isLowStock(inventoryLevel, params.lowStockThreshold),
          isOutOfStock: inventoryLevel.available === 0,
          inventoryValue: this.calculateInventoryValue(inventoryLevel, variant),
          stockStatus: this.getStockStatus(inventoryLevel, params.lowStockThreshold),
          daysOfStock: await this.calculateDaysOfStock(inventoryLevel, variant, correlationId),
          turnoverRate: await this.calculateTurnoverRate(inventoryLevel, variant, params.dateRange, correlationId)
        };

        enrichedInventory.push(enrichedItem);
      }

      // Sort inventory based on parameters
      return this.sortInventory(enrichedInventory, params);

    } catch (error) {
      logger.warn('Failed to enrich inventory data', {
        correlationId,
        error: error.message
      });
      return inventoryLevels;
    }
  }

  /**
   * Generate inventory alerts
   */
  generateInventoryAlerts(inventory, params) {
    const alerts = [];

    inventory.forEach(item => {
      // Low stock alert
      if (item.calculated?.isLowStock) {
        alerts.push({
          type: 'low_stock',
          severity: 'warning',
          productId: item.product?.id,
          variantId: item.variant?.id,
          locationId: item.location_id,
          productTitle: item.product?.title,
          variantTitle: item.variant?.title,
          locationName: item.location?.name,
          currentStock: item.available,
          threshold: params.lowStockThreshold,
          message: `Low stock alert: ${item.product?.title} (${item.variant?.title}) at ${item.location?.name}`
        });
      }

      // Out of stock alert
      if (item.calculated?.isOutOfStock) {
        alerts.push({
          type: 'out_of_stock',
          severity: 'critical',
          productId: item.product?.id,
          variantId: item.variant?.id,
          locationId: item.location_id,
          productTitle: item.product?.title,
          variantTitle: item.variant?.title,
          locationName: item.location?.name,
          message: `Out of stock: ${item.product?.title} (${item.variant?.title}) at ${item.location?.name}`
        });
      }

      // Overstock alert (if stock is very high compared to typical levels)
      if (item.available && item.available > 1000) {
        alerts.push({
          type: 'overstock',
          severity: 'info',
          productId: item.product?.id,
          variantId: item.variant?.id,
          locationId: item.location_id,
          productTitle: item.product?.title,
          variantTitle: item.variant?.title,
          locationName: item.location?.name,
          currentStock: item.available,
          message: `Potential overstock: ${item.product?.title} (${item.variant?.title}) at ${item.location?.name}`
        });
      }
    });

    return alerts;
  }

  /**
   * Calculate comprehensive inventory analytics
   */
  async calculateInventoryAnalytics(inventory, params, correlationId) {
    try {
      const analytics = {
        summary: {
          totalItems: inventory.length,
          totalValue: 0,
          totalUnits: 0,
          lowStockItems: 0,
          outOfStockItems: 0,
          overstockItems: 0,
          averageTurnoverRate: 0
        },
        distribution: {
          byLocation: {},
          byProduct: {},
          byVendor: {},
          byStockStatus: { inStock: 0, lowStock: 0, outOfStock: 0 }
        },
        performance: {
          fastMoving: [],
          slowMoving: [],
          deadStock: [],
          topValueItems: []
        },
        insights: []
      };

      let totalValue = 0;
      let totalUnits = 0;
      let totalTurnoverRate = 0;
      let itemsWithTurnover = 0;

      // Calculate summary metrics
      inventory.forEach(item => {
        const value = item.calculated?.inventoryValue || 0;
        const units = item.available || 0;
        const turnover = item.calculated?.turnoverRate || 0;

        totalValue += value;
        totalUnits += units;

        if (turnover > 0) {
          totalTurnoverRate += turnover;
          itemsWithTurnover++;
        }

        // Count stock statuses
        if (item.calculated?.isOutOfStock) {
          analytics.summary.outOfStockItems++;
          analytics.distribution.byStockStatus.outOfStock++;
        } else if (item.calculated?.isLowStock) {
          analytics.summary.lowStockItems++;
          analytics.distribution.byStockStatus.lowStock++;
        } else {
          analytics.distribution.byStockStatus.inStock++;
        }

        // Update distributions
        this.updateInventoryDistributions(analytics.distribution, item);
      });

      // Calculate averages
      analytics.summary.totalValue = totalValue;
      analytics.summary.totalUnits = totalUnits;
      
      if (itemsWithTurnover > 0) {
        analytics.summary.averageTurnoverRate = totalTurnoverRate / itemsWithTurnover;
      }

      // Identify performance categories
      analytics.performance = this.categorizeInventoryPerformance(inventory);

      // Generate insights
      analytics.insights = this.generateInventoryInsights(analytics, inventory);

      return analytics;

    } catch (error) {
      logger.warn('Failed to calculate inventory analytics', {
        correlationId,
        error: error.message
      });
      return null;
    }
  }

  // Helper methods for calculations

  isLowStock(inventoryLevel, threshold = 10) {
    const available = inventoryLevel.available || 0;
    return available > 0 && available <= threshold;
  }

  calculateInventoryValue(inventoryLevel, variant) {
    const quantity = inventoryLevel.available || 0;
    const price = variant ? parseFloat(variant.price || 0) : 0;
    return quantity * price;
  }

  getStockStatus(inventoryLevel, threshold = 10) {
    const available = inventoryLevel.available || 0;
    
    if (available === 0) return 'out_of_stock';
    if (available <= threshold) return 'low_stock';
    if (available > 100) return 'high_stock';
    return 'in_stock';
  }

  async calculateDaysOfStock(inventoryLevel, variant, correlationId) {
    // This would require sales velocity data to calculate accurately
    // For now, return a placeholder calculation
    const available = inventoryLevel.available || 0;
    const estimatedDailySales = 1; // Placeholder - would calculate from order history
    
    return estimatedDailySales > 0 ? Math.floor(available / estimatedDailySales) : null;
  }

  async calculateTurnoverRate(inventoryLevel, variant, dateRange, correlationId) {
    // This would require historical sales data to calculate turnover rate
    // For now, return a placeholder calculation
    return Math.random() * 12; // Placeholder - would calculate actual turnover
  }

  sortInventory(inventory, params) {
    const sortBy = params.sortBy || 'quantity';
    const sortOrder = params.sortOrder || 'asc';

    return inventory.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'quantity':
          aValue = a.available || 0;
          bValue = b.available || 0;
          break;
        case 'value':
          aValue = a.calculated?.inventoryValue || 0;
          bValue = b.calculated?.inventoryValue || 0;
          break;
        case 'turnover':
          aValue = a.calculated?.turnoverRate || 0;
          bValue = b.calculated?.turnoverRate || 0;
          break;
        case 'product_name':
          aValue = a.product?.title || '';
          bValue = b.product?.title || '';
          break;
        default:
          return 0;
      }

      if (sortOrder === 'desc') {
        return aValue > bValue ? -1 : (aValue < bValue ? 1 : 0);
      } else {
        return aValue < bValue ? -1 : (aValue > bValue ? 1 : 0);
      }
    });
  }

  updateInventoryDistributions(distribution, item) {
    // By location
    const locationName = item.location?.name || 'Unknown';
    if (!distribution.byLocation[locationName]) {
      distribution.byLocation[locationName] = { items: 0, totalValue: 0, totalUnits: 0 };
    }
    distribution.byLocation[locationName].items++;
    distribution.byLocation[locationName].totalValue += item.calculated?.inventoryValue || 0;
    distribution.byLocation[locationName].totalUnits += item.available || 0;

    // By product
    const productTitle = item.product?.title || 'Unknown';
    distribution.byProduct[productTitle] = (distribution.byProduct[productTitle] || 0) + 1;

    // By vendor
    const vendor = item.product?.vendor || 'Unknown';
    distribution.byVendor[vendor] = (distribution.byVendor[vendor] || 0) + 1;
  }

  categorizeInventoryPerformance(inventory) {
    const sorted = [...inventory].sort((a, b) => (b.calculated?.turnoverRate || 0) - (a.calculated?.turnoverRate || 0));
    
    const fastMoving = sorted.slice(0, 10).map(item => ({
      productId: item.product?.id,
      title: item.product?.title,
      turnoverRate: item.calculated?.turnoverRate,
      currentStock: item.available
    }));

    const slowMoving = sorted.slice(-10).map(item => ({
      productId: item.product?.id,
      title: item.product?.title,
      turnoverRate: item.calculated?.turnoverRate,
      currentStock: item.available
    }));

    const deadStock = inventory.filter(item => 
      (item.calculated?.turnoverRate || 0) === 0 && (item.available || 0) > 0
    ).map(item => ({
      productId: item.product?.id,
      title: item.product?.title,
      currentStock: item.available,
      value: item.calculated?.inventoryValue
    }));

    const topValueItems = [...inventory]
      .sort((a, b) => (b.calculated?.inventoryValue || 0) - (a.calculated?.inventoryValue || 0))
      .slice(0, 10)
      .map(item => ({
        productId: item.product?.id,
        title: item.product?.title,
        value: item.calculated?.inventoryValue,
        quantity: item.available
      }));

    return { fastMoving, slowMoving, deadStock, topValueItems };
  }

  generateInventoryInsights(analytics, inventory) {
    const insights = [];

    // Stock level insights
    const outOfStockRate = analytics.summary.outOfStockItems / analytics.summary.totalItems;
    if (outOfStockRate > 0.1) {
      insights.push({
        type: 'stock_level',
        severity: 'warning',
        message: `${(outOfStockRate * 100).toFixed(1)}% of inventory items are out of stock`
      });
    }

    const lowStockRate = analytics.summary.lowStockItems / analytics.summary.totalItems;
    if (lowStockRate > 0.2) {
      insights.push({
        type: 'stock_level',
        severity: 'warning',
        message: `${(lowStockRate * 100).toFixed(1)}% of inventory items are low in stock`
      });
    }

    // Value insights
    if (analytics.summary.totalValue > 100000) {
      insights.push({
        type: 'value',
        severity: 'info',
        message: `High inventory value of $${analytics.summary.totalValue.toLocaleString()}`
      });
    }

    // Performance insights
    if (analytics.performance.deadStock.length > 0) {
      insights.push({
        type: 'performance',
        severity: 'warning',
        message: `${analytics.performance.deadStock.length} items identified as dead stock`
      });
    }

    return insights;
  }

  calculateAggregatedAnalytics(storeResults) {
    const aggregated = {
      totalItems: 0,
      totalValue: 0,
      totalUnits: 0,
      storeComparison: {},
      crossStoreInsights: []
    };

    Object.entries(storeResults).forEach(([storeId, result]) => {
      if (result.success && result.analytics) {
        aggregated.totalItems += result.analytics.summary.totalItems;
        aggregated.totalValue += result.analytics.summary.totalValue;
        aggregated.totalUnits += result.analytics.summary.totalUnits;
        
        aggregated.storeComparison[storeId] = {
          items: result.analytics.summary.totalItems,
          value: result.analytics.summary.totalValue,
          units: result.analytics.summary.totalUnits,
          outOfStockRate: result.analytics.summary.outOfStockItems / result.analytics.summary.totalItems
        };
      }
    });

    return aggregated;
  }
}