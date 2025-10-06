/**
 * Amazon Inventory Management Tool
 * 
 * Comprehensive inventory tracking for Amazon FBA and FBM with health monitoring,
 * optimization recommendations, and multi-location management.
 * 
 * @version 1.0.0
 */

import { createLogger } from '../../../utils/logger.js';

const logger = createLogger();

/**
 * Amazon Inventory Tool Class
 */
export class InventoryTool {
  constructor(authManager, options = {}) {
    this.authManager = authManager;
    this.options = {
      defaultLimit: options.defaultLimit || 100,
      maxLimit: options.maxLimit || 500,
      lowStockThreshold: options.lowStockThreshold || 10,
      includeHealth: options.includeHealth !== false,
      ...options
    };

    // Input schema for MCP
    this.inputSchema = {
      type: 'object',
      properties: {
        marketplaceId: {
          type: 'string',
          enum: ['UK', 'USA', 'EU', 'CANADA', 'A1F83G8C2ARO7P', 'ATVPDKIKX0DER', 'A1PA6795UKMFR9', 'A2EUQ1WTGCTBG2'],
          description: 'Amazon marketplace ID or name'
        },
        inventoryType: {
          type: 'string',
          enum: ['fba', 'fbm', 'all'],
          default: 'all',
          description: 'Type of inventory to retrieve (FBA, FBM, or both)'
        },
        granularityType: {
          type: 'string',
          enum: ['Marketplace', 'Fulfillment Center'],
          default: 'Marketplace',
          description: 'Level of detail for inventory data'
        },
        identifiers: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific SKUs or ASINs to retrieve (optional)'
        },
        includeReserved: {
          type: 'boolean',
          default: true,
          description: 'Include reserved inventory quantities'
        },
        includeInbound: {
          type: 'boolean',
          default: true,
          description: 'Include inbound shipment inventory'
        },
        includeHealth: {
          type: 'boolean',
          default: true,
          description: 'Include inventory health metrics and alerts'
        },
        lowStockThreshold: {
          type: 'integer',
          minimum: 0,
          default: 10,
          description: 'Threshold for low stock alerts'
        },
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: 500,
          description: 'Maximum number of inventory items to retrieve'
        },
        sandbox: {
          type: 'boolean',
          default: false,
          description: 'Use sandbox environment'
        }
      },
      required: ['marketplaceId']
    };

    logger.info('Amazon Inventory Tool initialized', {
      defaultLimit: this.options.defaultLimit,
      lowStockThreshold: this.options.lowStockThreshold
    });
  }

  /**
   * Execute inventory retrieval
   */
  async execute(params = {}) {
    const correlationId = `inventory-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      logger.info('Executing Amazon inventory retrieval', {
        correlationId,
        params: this.sanitizeParams(params)
      });

      // Validate and normalize parameters
      const normalizedParams = this.validateAndNormalizeParams(params);
      
      // Get authenticated client
      const client = await this.authManager.getClient(normalizedParams.marketplaceId, {
        sandbox: normalizedParams.sandbox,
        correlationId
      });

      // Retrieve inventory data
      const inventoryData = await this.retrieveInventory(client, normalizedParams, correlationId);

      // Enrich with health metrics and alerts
      if (normalizedParams.includeHealth) {
        this.enrichInventoryWithHealth(inventoryData.inventory, normalizedParams);
      }

      // Calculate inventory analytics
      const analytics = this.calculateInventoryAnalytics(inventoryData.inventory, normalizedParams);

      // Generate recommendations
      const recommendations = this.generateInventoryRecommendations(inventoryData.inventory, normalizedParams);

      const result = {
        success: true,
        marketplace: normalizedParams.marketplaceId,
        inventoryType: normalizedParams.inventoryType,
        summary: {
          totalItems: inventoryData.inventory.length,
          totalUnits: this.calculateTotalUnits(inventoryData.inventory),
          lowStockItems: inventoryData.inventory.filter(item => item.calculated?.isLowStock).length,
          outOfStockItems: inventoryData.inventory.filter(item => item.calculated?.isOutOfStock).length,
          currency: this.determineCurrency(normalizedParams.marketplaceId)
        },
        inventory: inventoryData.inventory,
        analytics,
        recommendations,
        alerts: this.generateInventoryAlerts(inventoryData.inventory, normalizedParams),
        pagination: {
          hasNextPage: !!inventoryData.nextToken,
          nextToken: inventoryData.nextToken
        },
        timestamp: new Date().toISOString(),
        correlationId
      };

      logger.info('Amazon inventory retrieval completed', {
        correlationId,
        itemCount: result.inventory.length,
        lowStockItems: result.summary.lowStockItems,
        marketplace: normalizedParams.marketplaceId
      });

      return result;

    } catch (error) {
      logger.error('Amazon inventory retrieval failed', {
        correlationId,
        error: error.message,
        stack: error.stack,
        params: this.sanitizeParams(params)
      });

      return {
        success: false,
        error: error.message,
        correlationId,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Validate and normalize input parameters
   */
  validateAndNormalizeParams(params) {
    const normalized = { ...params };

    // Set defaults
    normalized.inventoryType = normalized.inventoryType || 'all';
    normalized.granularityType = normalized.granularityType || 'Marketplace';
    normalized.limit = Math.min(normalized.limit || this.options.defaultLimit, this.options.maxLimit);
    normalized.includeReserved = normalized.includeReserved !== false;
    normalized.includeInbound = normalized.includeInbound !== false;
    normalized.includeHealth = normalized.includeHealth !== false;
    normalized.lowStockThreshold = normalized.lowStockThreshold || this.options.lowStockThreshold;
    normalized.sandbox = normalized.sandbox || false;

    return normalized;
  }

  /**
   * Retrieve inventory from Amazon SP-API
   */
  async retrieveInventory(client, params, correlationId) {
    try {
      logger.debug('Retrieving inventory from SP-API', {
        correlationId,
        marketplace: params.marketplaceId,
        inventoryType: params.inventoryType
      });

      let inventory = [];
      let nextToken = null;

      // Get FBA inventory if requested
      if (params.inventoryType === 'all' || params.inventoryType === 'fba') {
        const fbaData = await this.getFBAInventory(client, params, correlationId);
        inventory = [...inventory, ...fbaData.inventory];
        if (fbaData.nextToken) nextToken = fbaData.nextToken;
      }

      // Get FBM inventory if requested
      if (params.inventoryType === 'all' || params.inventoryType === 'fbm') {
        const fbmData = await this.getFBMInventory(client, params, correlationId);
        inventory = [...inventory, ...fbmData.inventory];
        if (fbmData.nextToken) nextToken = fbmData.nextToken;
      }

      // Remove duplicates if getting both FBA and FBM
      if (params.inventoryType === 'all') {
        inventory = this.removeDuplicateInventory(inventory);
      }

      return { inventory, nextToken };

    } catch (error) {
      logger.error('Failed to retrieve inventory from SP-API', {
        correlationId,
        error: error.message,
        inventoryType: params.inventoryType
      });
      throw error;
    }
  }

  /**
   * Get FBA inventory summary
   */
  async getFBAInventory(client, params, correlationId) {
    const requestParams = {
      granularityType: params.granularityType,
      granularityId: this.getMarketplaceId(params.marketplaceId),
      maxResultsPerPage: params.limit
    };

    // Add specific SKUs if provided
    if (params.identifiers && params.identifiers.length > 0) {
      requestParams.sellerSkus = params.identifiers.slice(0, 50); // API limit
    }

    const response = await client.callAPI({
      operation: 'getInventorySummaries',
      endpoint: 'fbaInventory',
      query: requestParams
    });

    const summaries = response.inventorySummaries || [];
    const inventory = summaries.map(summary => this.transformFBAInventory(summary, params));

    return {
      inventory,
      nextToken: response.NextToken
    };
  }

  /**
   * Get FBM inventory (seller listings)
   */
  async getFBMInventory(client, params, correlationId) {
    const requestParams = {
      MarketplaceId: this.getMarketplaceId(params.marketplaceId),
      MaxResultsPerPage: params.limit
    };

    const response = await client.callAPI({
      operation: 'getListingsItem',
      endpoint: 'listings',
      query: requestParams
    });

    const listings = response.listings || [];
    const inventory = listings.map(listing => this.transformFBMInventory(listing, params));

    return {
      inventory,
      nextToken: response.NextToken
    };
  }

  /**
   * Transform FBA inventory summary to standardized format
   */
  transformFBAInventory(summary, params) {
    const totalQuantity = (summary.totalQuantity || 0);
    const inStockQuantity = (summary.inStockQuantity || 0);
    const reservedQuantity = (summary.reservedQuantity || 0);

    return {
      sku: summary.sellerSku,
      asin: summary.asin,
      fnSku: summary.fnSku,
      fulfillmentType: 'FBA',
      condition: summary.condition || 'NEW',
      totalQuantity,
      available: inStockQuantity,
      reserved: reservedQuantity,
      inbound: summary.inboundQuantity || 0,
      unfulfillable: summary.unfulfillableQuantity || 0,
      lastUpdated: summary.lastUpdatedTime,
      source: 'fba'
    };
  }

  /**
   * Transform FBM listing to standardized format
   */
  transformFBMInventory(listing, params) {
    const offer = listing.offers?.[0] || {};
    const quantity = parseInt(offer.quantity || 0);

    return {
      sku: listing.sku,
      asin: listing.asin,
      fulfillmentType: 'FBM',
      condition: offer.condition || 'NEW',
      totalQuantity: quantity,
      available: quantity,
      reserved: 0,
      inbound: 0,
      unfulfillable: 0,
      price: {
        amount: offer.listingPrice?.Amount,
        currency: offer.listingPrice?.CurrencyCode
      },
      lastUpdated: offer.lastUpdated,
      source: 'fbm'
    };
  }

  /**
   * Remove duplicate inventory items
   */
  removeDuplicateInventory(inventory) {
    const seen = new Set();
    return inventory.filter(item => {
      const key = `${item.sku}-${item.fulfillmentType}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Enrich inventory with health metrics
   */
  enrichInventoryWithHealth(inventory, params) {
    inventory.forEach(item => {
      item.calculated = {
        isLowStock: item.available <= params.lowStockThreshold,
        isOutOfStock: item.available === 0,
        turnoverRate: this.calculateTurnoverRate(item),
        daysOfSupply: this.calculateDaysOfSupply(item),
        healthScore: this.calculateHealthScore(item, params),
        restockUrgency: this.calculateRestockUrgency(item, params)
      };

      // Add age information if available
      if (item.lastUpdated) {
        const lastUpdate = new Date(item.lastUpdated);
        const now = new Date();
        const daysSinceUpdate = Math.floor((now - lastUpdate) / (1000 * 60 * 60 * 24));
        item.calculated.daysSinceUpdate = daysSinceUpdate;
        item.calculated.isStale = daysSinceUpdate > 7;
      }
    });
  }

  /**
   * Calculate inventory analytics
   */
  calculateInventoryAnalytics(inventory, params) {
    if (!inventory || inventory.length === 0) {
      return null;
    }

    const analytics = {
      overview: {
        totalSKUs: inventory.length,
        totalUnits: this.calculateTotalUnits(inventory),
        fulfillmentSplit: {
          fba: { skus: 0, units: 0 },
          fbm: { skus: 0, units: 0 }
        }
      },
      health: {
        healthy: 0,
        lowStock: 0,
        outOfStock: 0,
        stale: 0
      },
      turnover: {
        fast: 0,      // > 12 turns/year
        medium: 0,    // 4-12 turns/year
        slow: 0,      // < 4 turns/year
        unknown: 0
      },
      ageDistribution: {
        fresh: 0,     // < 7 days
        current: 0,   // 7-30 days
        aging: 0,     // 30-90 days
        stale: 0      // > 90 days
      },
      value: {
        totalValue: 0,
        averageValue: 0,
        topValueItems: []
      }
    };

    inventory.forEach(item => {
      // Fulfillment type analysis
      if (item.fulfillmentType === 'FBA') {
        analytics.overview.fulfillmentSplit.fba.skus++;
        analytics.overview.fulfillmentSplit.fba.units += item.totalQuantity;
      } else {
        analytics.overview.fulfillmentSplit.fbm.skus++;
        analytics.overview.fulfillmentSplit.fbm.units += item.totalQuantity;
      }

      // Health analysis
      if (item.calculated?.isOutOfStock) {
        analytics.health.outOfStock++;
      } else if (item.calculated?.isLowStock) {
        analytics.health.lowStock++;
      } else {
        analytics.health.healthy++;
      }

      if (item.calculated?.isStale) {
        analytics.health.stale++;
      }

      // Turnover analysis
      const turnover = item.calculated?.turnoverRate;
      if (turnover !== undefined) {
        if (turnover > 12) analytics.turnover.fast++;
        else if (turnover >= 4) analytics.turnover.medium++;
        else analytics.turnover.slow++;
      } else {
        analytics.turnover.unknown++;
      }

      // Age distribution
      const daysSinceUpdate = item.calculated?.daysSinceUpdate;
      if (daysSinceUpdate !== undefined) {
        if (daysSinceUpdate <= 7) analytics.ageDistribution.fresh++;
        else if (daysSinceUpdate <= 30) analytics.ageDistribution.current++;
        else if (daysSinceUpdate <= 90) analytics.ageDistribution.aging++;
        else analytics.ageDistribution.stale++;
      }

      // Value analysis
      if (item.price?.amount) {
        const itemValue = parseFloat(item.price.amount) * item.totalQuantity;
        analytics.value.totalValue += itemValue;
        
        if (itemValue > 0) {
          analytics.value.topValueItems.push({
            sku: item.sku,
            value: itemValue,
            units: item.totalQuantity,
            price: parseFloat(item.price.amount)
          });
        }
      }
    });

    // Calculate averages and sort top items
    analytics.value.averageValue = analytics.value.totalValue / analytics.overview.totalSKUs;
    analytics.value.topValueItems.sort((a, b) => b.value - a.value);
    analytics.value.topValueItems = analytics.value.topValueItems.slice(0, 10);

    return analytics;
  }

  /**
   * Generate inventory recommendations
   */
  generateInventoryRecommendations(inventory, params) {
    const recommendations = {
      immediate: [],
      shortTerm: [],
      longTerm: [],
      optimization: []
    };

    inventory.forEach(item => {
      // Immediate actions
      if (item.calculated?.isOutOfStock) {
        recommendations.immediate.push({
          type: 'restock',
          priority: 'critical',
          sku: item.sku,
          message: 'Out of stock - immediate restock required',
          suggestedQuantity: this.calculateSuggestedRestock(item)
        });
      } else if (item.calculated?.isLowStock) {
        recommendations.immediate.push({
          type: 'low_stock',
          priority: 'high',
          sku: item.sku,
          message: `Low stock warning - ${item.available} units remaining`,
          suggestedQuantity: this.calculateSuggestedRestock(item)
        });
      }

      // Short-term actions
      if (item.calculated?.restockUrgency === 'high') {
        recommendations.shortTerm.push({
          type: 'restock_planning',
          priority: 'medium',
          sku: item.sku,
          message: 'Plan restock within 2 weeks',
          daysOfSupply: item.calculated.daysOfSupply
        });
      }

      // Long-term optimization
      if (item.calculated?.turnoverRate && item.calculated.turnoverRate < 2) {
        recommendations.longTerm.push({
          type: 'slow_mover',
          priority: 'low',
          sku: item.sku,
          message: 'Slow-moving inventory - consider price optimization or promotion',
          turnoverRate: item.calculated.turnoverRate
        });
      }

      // Fulfillment optimization
      if (item.fulfillmentType === 'FBM' && item.totalQuantity > 50) {
        recommendations.optimization.push({
          type: 'fba_conversion',
          priority: 'medium',
          sku: item.sku,
          message: 'Consider converting to FBA for better performance',
          currentUnits: item.totalQuantity
        });
      }
    });

    // Sort recommendations by priority
    const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
    Object.keys(recommendations).forEach(category => {
      recommendations[category].sort((a, b) => 
        priorityOrder[a.priority] - priorityOrder[b.priority]
      );
    });

    return recommendations;
  }

  /**
   * Generate inventory alerts
   */
  generateInventoryAlerts(inventory, params) {
    const alerts = [];

    inventory.forEach(item => {
      // Stock level alerts
      if (item.calculated?.isOutOfStock) {
        alerts.push({
          type: 'out_of_stock',
          severity: 'critical',
          sku: item.sku,
          message: 'Product is out of stock',
          details: {
            available: item.available,
            reserved: item.reserved
          }
        });
      } else if (item.calculated?.isLowStock) {
        alerts.push({
          type: 'low_stock',
          severity: 'warning',
          sku: item.sku,
          message: `Low stock: ${item.available} units remaining`,
          details: {
            available: item.available,
            threshold: params.lowStockThreshold
          }
        });
      }

      // Data freshness alerts
      if (item.calculated?.isStale) {
        alerts.push({
          type: 'stale_data',
          severity: 'info',
          sku: item.sku,
          message: `Inventory data is stale (${item.calculated.daysSinceUpdate} days old)`,
          details: {
            lastUpdated: item.lastUpdated,
            daysSinceUpdate: item.calculated.daysSinceUpdate
          }
        });
      }

      // Health score alerts
      if (item.calculated?.healthScore < 3) {
        alerts.push({
          type: 'poor_health',
          severity: 'warning',
          sku: item.sku,
          message: 'Poor inventory health score',
          details: {
            healthScore: item.calculated.healthScore,
            issues: this.identifyHealthIssues(item)
          }
        });
      }
    });

    return alerts.sort((a, b) => {
      const severityOrder = { 'critical': 0, 'warning': 1, 'info': 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  /**
   * Calculate turnover rate (placeholder - would need sales data)
   */
  calculateTurnoverRate(item) {
    // This would require sales velocity data from orders
    // For now, return undefined to indicate unknown
    return undefined;
  }

  /**
   * Calculate days of supply (placeholder - would need sales velocity)
   */
  calculateDaysOfSupply(item) {
    // This would require average daily sales data
    // For now, return undefined to indicate unknown
    return undefined;
  }

  /**
   * Calculate health score
   */
  calculateHealthScore(item, params) {
    let score = 10;

    // Deduct points for stock issues
    if (item.calculated?.isOutOfStock) score -= 5;
    else if (item.calculated?.isLowStock) score -= 2;

    // Deduct points for stale data
    if (item.calculated?.isStale) score -= 1;

    // Deduct points for high reserved quantity
    if (item.reserved > item.available) score -= 1;

    // Deduct points for unfulfillable inventory
    if (item.unfulfillable > 0) score -= 1;

    return Math.max(score, 0);
  }

  /**
   * Calculate restock urgency
   */
  calculateRestockUrgency(item, params) {
    if (item.calculated?.isOutOfStock) return 'critical';
    if (item.calculated?.isLowStock) return 'high';
    if (item.available <= params.lowStockThreshold * 2) return 'medium';
    return 'low';
  }

  /**
   * Calculate suggested restock quantity
   */
  calculateSuggestedRestock(item) {
    // Simple calculation - would be more sophisticated with sales velocity
    const baseRestock = 30; // days worth
    const currentStock = item.available;
    
    // Suggest enough to get to at least 30 days supply
    return Math.max(baseRestock - currentStock, 10);
  }

  /**
   * Identify health issues
   */
  identifyHealthIssues(item) {
    const issues = [];

    if (item.calculated?.isOutOfStock) issues.push('Out of stock');
    if (item.calculated?.isLowStock) issues.push('Low stock');
    if (item.calculated?.isStale) issues.push('Stale data');
    if (item.reserved > item.available) issues.push('High reserved quantity');
    if (item.unfulfillable > 0) issues.push('Unfulfillable inventory');

    return issues;
  }

  /**
   * Calculate total units across all inventory
   */
  calculateTotalUnits(inventory) {
    return inventory.reduce((total, item) => total + (item.totalQuantity || 0), 0);
  }

  /**
   * Determine currency based on marketplace
   */
  determineCurrency(marketplaceId) {
    const currencyMap = {
      'UK': 'GBP',
      'A1F83G8C2ARO7P': 'GBP',
      'USA': 'USD',
      'ATVPDKIKX0DER': 'USD',
      'EU': 'EUR',
      'A1PA6795UKMFR9': 'EUR',
      'CANADA': 'CAD',
      'A2EUQ1WTGCTBG2': 'CAD'
    };

    return currencyMap[marketplaceId] || 'USD';
  }

  /**
   * Get marketplace ID from name or return as-is
   */
  getMarketplaceId(identifier) {
    const marketplaceMap = {
      'UK': 'A1F83G8C2ARO7P',
      'USA': 'ATVPDKIKX0DER',
      'EU': 'A1PA6795UKMFR9',
      'CANADA': 'A2EUQ1WTGCTBG2'
    };

    return marketplaceMap[identifier.toUpperCase()] || identifier;
  }

  /**
   * Sanitize parameters for logging
   */
  sanitizeParams(params) {
    const sanitized = { ...params };
    // Remove sensitive data if any
    return sanitized;
  }

  /**
   * Get tool schema for MCP registration
   */
  getSchema() {
    return {
      name: 'amazon-get-inventory',
      description: 'Retrieve and analyze Amazon FBA/FBM inventory with health monitoring and optimization recommendations',
      inputSchema: this.inputSchema
    };
  }
}