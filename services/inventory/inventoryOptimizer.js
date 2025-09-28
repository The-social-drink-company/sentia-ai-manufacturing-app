import { logInfo, logWarn, logError } from '../observability/structuredLogger.js';

export class InventoryOptimizer {
  constructor(databaseService) {
    this.databaseService = databaseService;
    this.optimizationCache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
    
    // Default parameters (can be customized per product/industry)
    this.defaultParams = {
      holdingCostRate: 0.25, // 25% per year
      stockoutCostRate: 5.0, // 5x the product cost
      serviceLevel: 0.95, // 95% service level
      leadTimeVariability: 0.2, // 20% coefficient of variation
      demandVariability: 0.3, // 30% coefficient of variation
      seasonalityFactor: 1.0, // No seasonality by default
      setupCost: 50, // Default setup cost
      reviewPeriod: 7 // Weekly review period in days
    };
  }

  async optimizeInventory(companyId = 'default', options = {}) {
    const cacheKey = `inventory_optimization_${companyId}_${JSON.stringify(options)}`;
    
    // Check cache first
    const cached = this.optimizationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      logInfo('Returning cached inventory optimization');
      return cached.data;
    }

    try {
      logInfo('Starting inventory optimization analysis', { companyId, options });

      // Get current inventory levels and historical data
      const [inventoryLevels, historicalSales, supplierData] = await Promise.all([
        this.getCurrentInventoryLevels(companyId),
        this.getHistoricalDemandData(companyId, options.periodDays || 365),
        this.getSupplierData(companyId)
      ]);

      const optimizationResults = [];

      // Process each product/SKU
      for (const inventory of inventoryLevels) {
        try {
          const productOptimization = await this.optimizeProduct(
            inventory,
            historicalSales.filter(sale => 
              sale.productId === inventory.productId || 
              sale.productId === 'shopify-aggregate' || 
              sale.productId === 'amazon-aggregate'
            ),
            supplierData.find(s => s.productId === inventory.productId) || {},
            options
          );

          optimizationResults.push(productOptimization);
        } catch (error) {
          logError(`Failed to optimize product ${inventory.productId}`, error);
          optimizationResults.push({
            productId: inventory.productId,
            error: error.message,
            status: 'failed'
          });
        }
      }

      // Calculate portfolio-level metrics
      const portfolioMetrics = this.calculatePortfolioMetrics(optimizationResults);

      const result = {
        companyId,
        optimizationDate: new Date(),
        products: optimizationResults,
        portfolioMetrics,
        recommendations: this.generateRecommendations(optimizationResults),
        parameters: { ...this.defaultParams, ...options },
        dataQuality: this.assessDataQuality(inventoryLevels, historicalSales, supplierData),
        nextReview: new Date(Date.now() + this.defaultParams.reviewPeriod * 24 * 60 * 60 * 1000)
      };

      // Cache the results
      this.optimizationCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      logInfo('Inventory optimization completed', {
        productsOptimized: optimizationResults.length,
        totalReorderRecommendations: optimizationResults.filter(p => p.reorderRecommended).length,
        totalInventoryValue: portfolioMetrics.totalInventoryValue
      });

      return result;

    } catch (error) {
      logError('Failed to optimize inventory', error);
      return this.getFallbackOptimization(companyId, error);
    }
  }

  async optimizeProduct(inventory, historicalSales, supplierData, options) {
    const params = { ...this.defaultParams, ...options };
    
    // Calculate demand statistics
    const demandStats = this.calculateDemandStatistics(historicalSales, options.periodDays || 365);
    
    // Calculate costs
    const costs = this.calculateCosts(inventory, supplierData, params);
    
    // Calculate EOQ (Economic Order Quantity)
    const eoq = this.calculateEOQ(demandStats, costs, params);
    
    // Calculate safety stock
    const safetyStock = this.calculateSafetyStock(demandStats, supplierData, params);
    
    // Calculate reorder point
    const reorderPoint = this.calculateReorderPoint(demandStats, safetyStock, supplierData, params);
    
    // Calculate optimal service level
    const optimalServiceLevel = this.calculateOptimalServiceLevel(costs, demandStats, params);
    
    // Calculate ABC classification
    const abcClassification = this.classifyABC(inventory, demandStats, costs);
    
    // Generate product-specific recommendations
    const recommendations = this.generateProductRecommendations(
      inventory, eoq, safetyStock, reorderPoint, demandStats, costs
    );

    return {
      productId: inventory.productId,
      location: inventory.location,
      
      // Current status
      currentStock: inventory.currentStock || 0,
      availableStock: inventory.availableStock || 0,
      reservedStock: inventory.reservedStock || 0,
      currentValue: inventory.value || 0,
      
      // Demand analysis
      demandStatistics: {
        averageDailyDemand: demandStats.averageDailyDemand,
        demandStandardDeviation: demandStats.standardDeviation,
        coefficientOfVariation: demandStats.coefficientOfVariation,
        seasonalityIndex: demandStats.seasonalityIndex,
        trendDirection: demandStats.trend,
        forecastAccuracy: demandStats.forecastAccuracy
      },
      
      // Cost structure
      costs: {
        unitCost: costs.unitCost,
        holdingCostPerUnit: costs.holdingCostPerUnit,
        orderingCost: costs.orderingCost,
        stockoutCostPerUnit: costs.stockoutCostPerUnit,
        totalAnnualCost: costs.totalAnnualCost
      },
      
      // Optimization results
      eoq: {
        quantity: eoq.quantity,
        frequency: eoq.orderFrequency,
        annualCost: eoq.totalAnnualCost,
        holdingCost: eoq.holdingCost,
        orderingCost: eoq.orderingCost
      },
      
      safetyStock: {
        quantity: safetyStock.quantity,
        serviceLevel: safetyStock.serviceLevel,
        stockoutRisk: safetyStock.stockoutRisk,
        cost: safetyStock.cost
      },
      
      reorderPoint: {
        quantity: reorderPoint.quantity,
        leadTimeDemand: reorderPoint.leadTimeDemand,
        leadTime: reorderPoint.leadTime,
        triggerLevel: reorderPoint.triggerLevel
      },
      
      // Performance metrics
      performance: {
        turnoverRatio: demandStats.annualDemand > 0 ? 
          (demandStats.annualDemand * costs.unitCost) / (inventory.value || 1) : 0,
        daysOnHand: demandStats.averageDailyDemand > 0 ? 
          inventory.currentStock / demandStats.averageDailyDemand : 0,
        stockoutRisk: this.calculateStockoutRisk(inventory.currentStock, demandStats, reorderPoint),
        overstock: Math.max(0, inventory.currentStock - (eoq.quantity + safetyStock.quantity))
      },
      
      // Classifications
      abcClassification,
      optimalServiceLevel,
      
      // Action recommendations
      recommendations,
      reorderRecommended: inventory.currentStock <= reorderPoint.quantity,
      reorderQuantity: eoq.quantity,
      reorderUrgency: this.assessReorderUrgency(inventory.currentStock, reorderPoint.quantity, demandStats),
      
      // Data quality indicators
      dataQuality: {
        historicalDataPoints: historicalSales.length,
        dataCompleteness: historicalSales.length > 30 ? 'high' : 
                         historicalSales.length > 10 ? 'medium' : 'low',
        hasSupplierData: Object.keys(supplierData).length > 0,
        confidenceLevel: this.calculateConfidenceLevel(historicalSales, demandStats)
      },
      
      calculatedAt: new Date()
    };
  }

  calculateDemandStatistics(historicalSales, periodDays) {
    if (!historicalSales || historicalSales.length === 0) {
      return {
        averageDailyDemand: 10, // Default estimate
        standardDeviation: 3,
        coefficientOfVariation: 0.3,
        annualDemand: 3650,
        seasonalityIndex: 1.0,
        trend: 'stable',
        forecastAccuracy: 0.7
      };
    }

    // Sort sales by date
    const sortedSales = historicalSales
      .filter(sale => sale.date && sale.quantity > 0)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (sortedSales.length === 0) {
      return this.getDefaultDemandStats();
    }

    // Calculate daily demand
    const totalQuantity = sortedSales.reduce((sum, sale) => sum + sale.quantity, 0);
    const totalDays = Math.max(1, periodDays);
    const averageDailyDemand = totalQuantity / totalDays;

    // Calculate standard deviation
    const dailyDemands = this.aggregateDailyDemand(sortedSales, periodDays);
    const variance = dailyDemands.reduce((sum, demand) => 
      sum + Math.pow(demand - averageDailyDemand, 2), 0) / Math.max(1, dailyDemands.length - 1);
    const standardDeviation = Math.sqrt(variance);

    // Calculate coefficient of variation
    const coefficientOfVariation = averageDailyDemand > 0 ? 
      standardDeviation / averageDailyDemand : 0;

    // Simple trend analysis
    const trend = this.calculateTrend(dailyDemands);
    
    // Simple seasonality detection
    const seasonalityIndex = this.detectSeasonality(dailyDemands);

    return {
      averageDailyDemand,
      standardDeviation,
      coefficientOfVariation,
      annualDemand: averageDailyDemand * 365,
      seasonalityIndex,
      trend,
      forecastAccuracy: Math.max(0.5, 1 - Math.min(1, coefficientOfVariation))
    };
  }

  aggregateDailyDemand(sortedSales, periodDays) {
    const dailyDemand = {};
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - periodDays * 24 * 60 * 60 * 1000);

    // Initialize all days with zero demand
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      dailyDemand[dateStr] = 0;
    }

    // Aggregate sales by day
    sortedSales.forEach(sale => {
      const dateStr = new Date(sale.date).toISOString().split('T')[0];
      if (dailyDemand.hasOwnProperty(dateStr)) {
        dailyDemand[dateStr] += sale.quantity;
      }
    });

    return Object.values(dailyDemand);
  }

  calculateTrend(dailyDemands) {
    if (dailyDemands.length < 10) return 'stable';

    const n = dailyDemands.length;
    const x = Array.from({ length: n }, (_, _i) => i);
    const y = dailyDemands;

    // Simple linear regression
    const xSum = x.reduce((sum, val) => sum + val, 0);
    const ySum = y.reduce((sum, val) => sum + val, 0);
    const xySum = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const xxSum = x.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * xySum - xSum * ySum) / (n * xxSum - xSum * xSum);

    if (slope > 0.1) return 'increasing';
    if (slope < -0.1) return 'decreasing';
    return 'stable';
  }

  detectSeasonality(dailyDemands) {
    // Simple seasonality detection - look for weekly patterns
    if (dailyDemands.length < 28) return 1.0;

    const weeklyAverages = [];
    for (let week = 0; week < Math.floor(dailyDemands.length / 7); week++) {
      const weekData = dailyDemands.slice(week * 7, (week + 1) * 7);
      const weekAvg = weekData.reduce((sum, val) => sum + val, 0) / weekData.length;
      weeklyAverages.push(weekAvg);
    }

    const overallAvg = weeklyAverages.reduce((sum, val) => sum + val, 0) / weeklyAverages.length;
    const variance = weeklyAverages.reduce((sum, val) => sum + Math.pow(val - overallAvg, 2), 0) / weeklyAverages.length;
    const stdDev = Math.sqrt(variance);

    // Seasonality index based on coefficient of variation
    return overallAvg > 0 ? 1 + (stdDev / overallAvg) : 1.0;
  }

  calculateCosts(inventory, supplierData, params) {
    const unitCost = supplierData.unitCost || inventory.value / Math.max(1, inventory.currentStock) || 10;
    const holdingCostPerUnit = unitCost * params.holdingCostRate;
    const orderingCost = supplierData.orderingCost || params.setupCost;
    const stockoutCostPerUnit = unitCost * params.stockoutCostRate;

    return {
      unitCost,
      holdingCostPerUnit,
      orderingCost,
      stockoutCostPerUnit,
      totalAnnualCost: 0 // Will be calculated during EOQ optimization
    };
  }

  calculateEOQ(demandStats, costs, params) {
    const annualDemand = demandStats.annualDemand;
    const orderingCost = costs.orderingCost;
    const holdingCostPerUnit = costs.holdingCostPerUnit;

    if (holdingCostPerUnit <= 0 || annualDemand <= 0) {
      return {
        quantity: Math.max(1, annualDemand / 12), // Monthly supply as fallback
        orderFrequency: 12,
        totalAnnualCost: 0,
        holdingCost: 0,
        orderingCost: 0
      };
    }

    // Classic EOQ formula: sqrt(2 * D * S / H)
    const eoqQuantity = Math.sqrt(2 * annualDemand * orderingCost / holdingCostPerUnit);
    
    // Calculate associated costs
    const orderFrequency = annualDemand / eoqQuantity;
    const annualOrderingCost = orderFrequency * orderingCost;
    const annualHoldingCost = (eoqQuantity / 2) * holdingCostPerUnit;
    const totalAnnualCost = annualOrderingCost + annualHoldingCost;

    return {
      quantity: Math.ceil(eoqQuantity),
      orderFrequency,
      totalAnnualCost,
      holdingCost: annualHoldingCost,
      orderingCost: annualOrderingCost
    };
  }

  calculateSafetyStock(demandStats, supplierData, params) {
    const leadTime = supplierData.leadTimeDays || 14; // 2 weeks default
    const leadTimeVariability = supplierData.leadTimeVariability || params.leadTimeVariability;
    const demandVariability = demandStats.coefficientOfVariation || params.demandVariability;
    const serviceLevel = params.serviceLevel;

    // Z-score for service level
    const zScore = this.getZScore(serviceLevel);

    // Safety stock calculation considering both demand and lead time variability
    const averageDemandDuringLeadTime = demandStats.averageDailyDemand * leadTime;
    
    // Variance calculation
    const demandVariance = Math.pow(demandStats.standardDeviation * leadTime, 2);
    const leadTimeVariance = Math.pow(averageDemandDuringLeadTime * leadTimeVariability, 2);
    const totalVariance = demandVariance + leadTimeVariance;
    const standardDeviationDuringLeadTime = Math.sqrt(totalVariance);

    const safetyStockQuantity = zScore * standardDeviationDuringLeadTime;
    const safetyStockCost = safetyStockQuantity * params.holdingCostRate * 
      (supplierData.unitCost || demandStats.averageDailyDemand * 10);

    return {
      quantity: Math.ceil(Math.max(0, safetyStockQuantity)),
      serviceLevel,
      stockoutRisk: 1 - serviceLevel,
      cost: safetyStockCost,
      leadTime,
      zScore
    };
  }

  calculateReorderPoint(demandStats, safetyStock, supplierData, params) {
    const leadTime = supplierData.leadTimeDays || 14;
    const leadTimeDemand = demandStats.averageDailyDemand * leadTime;
    const reorderQuantity = leadTimeDemand + safetyStock.quantity;

    return {
      quantity: Math.ceil(reorderQuantity),
      leadTimeDemand: Math.ceil(leadTimeDemand),
      leadTime,
      triggerLevel: Math.ceil(reorderQuantity * 1.1) // 10% buffer
    };
  }

  calculateOptimalServiceLevel(costs, demandStats, params) {
    // Optimal service level based on cost trade-off
    const holdingCost = costs.holdingCostPerUnit;
    const stockoutCost = costs.stockoutCostPerUnit;
    
    if (stockoutCost <= 0) return params.serviceLevel;
    
    // Optimal service level = stockoutCost / (stockoutCost + holdingCost)
    const optimalServiceLevel = stockoutCost / (stockoutCost + holdingCost);
    
    return Math.min(0.999, Math.max(0.5, optimalServiceLevel));
  }

  classifyABC(inventory, demandStats, costs) {
    const annualUsageValue = demandStats.annualDemand * costs.unitCost;
    
    // These thresholds would typically be set based on portfolio analysis
    // For now, using simple rules
    if (annualUsageValue > 50000) return 'A';
    if (annualUsageValue > 10000) return 'B';
    return 'C';
  }

  calculateStockoutRisk(currentStock, demandStats, reorderPoint) {
    if (currentStock >= reorderPoint.quantity) return 0;
    
    const daysUntilStockout = currentStock / Math.max(0.1, demandStats.averageDailyDemand);
    
    if (daysUntilStockout > 30) return 0.1;
    if (daysUntilStockout > 14) return 0.3;
    if (daysUntilStockout > 7) return 0.6;
    return 0.9;
  }

  assessReorderUrgency(currentStock, reorderPoint, demandStats) {
    if (currentStock <= 0) return 'critical';
    
    const daysRemaining = currentStock / Math.max(0.1, demandStats.averageDailyDemand);
    
    if (currentStock <= reorderPoint * 0.5) return 'urgent';
    if (currentStock <= reorderPoint) return 'high';
    if (currentStock <= reorderPoint * 1.5) return 'medium';
    return 'low';
  }

  generateProductRecommendations(inventory, eoq, safetyStock, reorderPoint, demandStats, costs) {
    const recommendations = [];
    
    // Reorder recommendations
    if (inventory.currentStock <= reorderPoint.quantity) {
      recommendations.push({
        type: 'reorder',
        priority: this.assessReorderUrgency(inventory.currentStock, reorderPoint.quantity, demandStats),
        message: `Reorder ${eoq.quantity} units. Current stock (${inventory.currentStock}) is at or below reorder point (${reorderPoint.quantity})`,
        quantity: eoq.quantity,
        estimatedCost: eoq.quantity * costs.unitCost
      });
    }
    
    // Overstock recommendations
    const idealStock = eoq.quantity + safetyStock.quantity;
    if (inventory.currentStock > idealStock * 2) {
      recommendations.push({
        type: 'overstock',
        priority: 'medium',
        message: `Consider reducing stock levels. Current stock (${inventory.currentStock}) is significantly above optimal level (${idealStock})`,
        excessQuantity: inventory.currentStock - idealStock,
        tiedUpCapital: (inventory.currentStock - idealStock) * costs.unitCost
      });
    }
    
    // Service level recommendations
    const currentServiceLevel = 1 - this.calculateStockoutRisk(inventory.currentStock, demandStats, reorderPoint);
    if (currentServiceLevel < 0.8) {
      recommendations.push({
        type: 'service_level',
        priority: 'high',
        message: `Current service level (${(currentServiceLevel * 100).toFixed(1)}%) is below target. Consider increasing safety stock.`,
        recommendedSafetyStock: safetyStock.quantity * 1.2
      });
    }
    
    // Cost optimization recommendations
    if (costs.holdingCostPerUnit > costs.unitCost * 0.5) {
      recommendations.push({
        type: 'cost_optimization',
        priority: 'medium',
        message: 'High holding costs detected. Consider more frequent, smaller orders or negotiate better supplier terms.',
        potentialSavings: (costs.holdingCostPerUnit - costs.unitCost * 0.25) * inventory.currentStock
      });
    }
    
    return recommendations;
  }

  calculatePortfolioMetrics(optimizationResults) {
    const validResults = optimizationResults.filter(r => r.error === undefined);
    
    if (validResults.length === 0) {
      return {
        totalProducts: 0,
        totalInventoryValue: 0,
        totalReorderRecommendations: 0,
        averageTurnoverRatio: 0,
        totalAnnualHoldingCost: 0,
        totalTiedUpCapital: 0
      };
    }

    return {
      totalProducts: validResults.length,
      totalInventoryValue: validResults.reduce((sum, r) => sum + r.currentValue, 0),
      totalReorderRecommendations: validResults.filter(r => r.reorderRecommended).length,
      averageTurnoverRatio: validResults.reduce((sum, r) => sum + r.performance.turnoverRatio, 0) / validResults.length,
      totalAnnualHoldingCost: validResults.reduce((sum, r) => sum + r.eoq.holdingCost, 0),
      totalTiedUpCapital: validResults.reduce((sum, r) => sum + r.currentValue, 0),
      abcBreakdown: {
        A: validResults.filter(r => r.abcClassification === 'A').length,
        B: validResults.filter(r => r.abcClassification === 'B').length,
        C: validResults.filter(r => r.abcClassification === 'C').length
      },
      urgencyBreakdown: {
        critical: validResults.filter(r => r.reorderUrgency === 'critical').length,
        urgent: validResults.filter(r => r.reorderUrgency === 'urgent').length,
        high: validResults.filter(r => r.reorderUrgency === 'high').length,
        medium: validResults.filter(r => r.reorderUrgency === 'medium').length,
        low: validResults.filter(r => r.reorderUrgency === 'low').length
      }
    };
  }

  generateRecommendations(optimizationResults) {
    const recommendations = [];
    const validResults = optimizationResults.filter(r => r.error === undefined);
    
    // High-priority reorders
    const criticalReorders = validResults.filter(r => r.reorderUrgency === 'critical');
    if (criticalReorders.length > 0) {
      recommendations.push({
        type: 'critical_reorders',
        priority: 'critical',
        message: `${criticalReorders.length} products are critically low and need immediate reordering`,
        products: criticalReorders.map(r => ({ productId: r.productId, quantity: r.reorderQuantity }))
      });
    }
    
    // Portfolio optimization
    const lowTurnoverItems = validResults.filter(r => r.performance.turnoverRatio < 2);
    if (lowTurnoverItems.length > validResults.length * 0.2) {
      recommendations.push({
        type: 'portfolio_optimization',
        priority: 'medium',
        message: `${lowTurnoverItems.length} products have low turnover ratios. Consider discontinuing or reducing stock levels.`,
        affectedProducts: lowTurnoverItems.length
      });
    }
    
    // Safety stock optimization
    const lowServiceLevel = validResults.filter(r => r.safetyStock.serviceLevel < 0.9);
    if (lowServiceLevel.length > 0) {
      recommendations.push({
        type: 'service_level',
        priority: 'high',
        message: `${lowServiceLevel.length} products may not meet service level targets. Consider increasing safety stock.`,
        affectedProducts: lowServiceLevel.length
      });
    }
    
    return recommendations;
  }

  // Helper methods
  async getCurrentInventoryLevels(companyId) {
    if (!this.databaseService.isConnected) {
      return [
        { productId: 'PROD001', location: 'Main Warehouse', currentStock: 100, availableStock: 80, reservedStock: 20, value: 5000 },
        { productId: 'PROD002', location: 'Main Warehouse', currentStock: 50, availableStock: 40, reservedStock: 10, value: 2500 },
        { productId: 'PROD003', location: 'Main Warehouse', currentStock: 200, availableStock: 180, reservedStock: 20, value: 10000 }
      ];
    }

    try {
      const inventoryLevels = await this.databaseService.prisma.inventoryLevel.findMany({
        where: { entity_id: companyId },
        include: {
          product: true
        }
      });
      
      return inventoryLevels.map(level => ({
        productId: level.productId,
        location: level.location,
        currentStock: level.currentStock,
        availableStock: level.availableStock,
        reservedStock: level.reservedStock,
        value: level.value,
        currency: level.currency
      }));
    } catch (error) {
      logError('Failed to get current inventory levels', error);
      return [];
    }
  }

  async getHistoricalDemandData(companyId, periodDays) {
    if (!this.databaseService.isConnected) {
      // PRODUCTION: No mock data - return empty array or throw error
      this.logger.error('Database not connected - cannot retrieve historical demand data');
      throw new Error('Database connection required for historical demand data');
      // Alternative: return empty array if you prefer graceful degradation
      // return [];
    }

    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - periodDays * 24 * 60 * 60 * 1000);

      const historicalSales = await this.databaseService.prisma.historicalSale.findMany({
        where: {
          companyId,
          date: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: {
          date: 'asc'
        }
      });

      return historicalSales;
    } catch (error) {
      logError('Failed to get historical demand data', error);
      return [];
    }
  }

  async getSupplierData(companyId) {
    // In a real implementation, this would fetch from a suppliers table
    return [
      { productId: 'PROD001', leadTimeDays: 14, leadTimeVariability: 0.2, unitCost: 50, orderingCost: 100 },
      { productId: 'PROD002', leadTimeDays: 10, leadTimeVariability: 0.15, unitCost: 25, orderingCost: 75 },
      { productId: 'PROD003', leadTimeDays: 21, leadTimeVariability: 0.3, unitCost: 100, orderingCost: 150 }
    ];
  }

  getZScore(serviceLevel) {
    // Approximate Z-scores for common service levels
    if (serviceLevel >= 0.999) return 3.09;
    if (serviceLevel >= 0.99) return 2.33;
    if (serviceLevel >= 0.95) return 1.645;
    if (serviceLevel >= 0.90) return 1.28;
    if (serviceLevel >= 0.85) return 1.04;
    if (serviceLevel >= 0.80) return 0.84;
    return 0.67; // ~75% service level
  }

  calculateConfidenceLevel(historicalSales, demandStats) {
    if (historicalSales.length < 10) return 'low';
    if (historicalSales.length < 50) return 'medium';
    if (demandStats.coefficientOfVariation > 0.5) return 'medium';
    return 'high';
  }

  assessDataQuality(inventoryLevels, historicalSales, supplierData) {
    const inventoryCompleteness = inventoryLevels.length > 0 ? 'good' : 'poor';
    const salesDataCompleteness = historicalSales.length > 30 ? 'good' : 
                                 historicalSales.length > 10 ? 'fair' : 'poor';
    const supplierDataCompleteness = supplierData.length > 0 ? 'good' : 'poor';

    return {
      inventory: inventoryCompleteness,
      sales: salesDataCompleteness,
      supplier: supplierDataCompleteness,
      overall: [inventoryCompleteness, salesDataCompleteness, supplierDataCompleteness]
        .filter(q => q === 'good').length >= 2 ? 'good' : 'needs_improvement'
    };
  }

  getDefaultDemandStats() {
    return {
      averageDailyDemand: 10,
      standardDeviation: 3,
      coefficientOfVariation: 0.3,
      annualDemand: 3650,
      seasonalityIndex: 1.0,
      trend: 'stable',
      forecastAccuracy: 0.7
    };
  }

  getFallbackOptimization(companyId, error) {
    return {
      companyId,
      optimizationDate: new Date(),
      products: [],
      portfolioMetrics: {
        totalProducts: 0,
        totalInventoryValue: 0,
        totalReorderRecommendations: 0,
        averageTurnoverRatio: 0
      },
      recommendations: [{
        type: 'system_error',
        priority: 'high',
        message: `Inventory optimization failed: ${error.message}. Using fallback recommendations.`
      }],
      error: error.message,
      fallback: true
    };
  }

  // Cache management
  clearCache() {
    this.optimizationCache.clear();
    logInfo('Inventory optimization cache cleared');
  }

  getCacheStats() {
    return {
      size: this.optimizationCache.size,
      timeout: this.cacheTimeout,
      keys: Array.from(this.optimizationCache.keys())
    };
  }
}

export default InventoryOptimizer;