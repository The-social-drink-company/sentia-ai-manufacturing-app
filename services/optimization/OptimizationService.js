/**
 * Stock Level Optimization Service
 * Implements EOQ, Safety Stock, and ROP calculations with constraint handling
 */

import fs from 'fs/promises';
import path from 'path';

class OptimizationService {
  constructor() {
    this.cachedResults = new Map();
    this.constraints = {
      workingCapital: new Map(),
      warehouse: new Map(),
      supplier: new Map()
    };
  }

  /**
   * Calculate Economic Order Quantity (EOQ)
   * EOQ = √(2 × D × S / H)
   */
  calculateEOQ(annualDemand, orderingCost, holdingCostRate, unitCost) {
    const holdingCostPerUnit = holdingCostRate * unitCost;
    return Math.sqrt((2 * annualDemand * orderingCost) / holdingCostPerUnit);
  }

  /**
   * Calculate Safety Stock
   * Safety Stock = z × σ_LT
   */
  calculateSafetyStock(serviceLevel, demandStdDev, leadTimeDays) {
    const zScores = {
      0.99: 2.33,
      0.98: 2.05,
      0.95: 1.65,
      0.90: 1.28
    };
    
    const zScore = zScores[serviceLevel] || 1.65;
    const leadTimeStdDev = Math.sqrt(leadTimeDays) * demandStdDev;
    return zScore * leadTimeStdDev;
  }

  /**
   * Calculate Reorder Point (ROP)
   * ROP = μ_LT + Safety Stock
   */
  calculateROP(dailyDemandMean, leadTimeDays, safetyStock) {
    const leadTimeDemand = dailyDemandMean * leadTimeDays;
    return leadTimeDemand + safetyStock;
  }

  /**
   * Calculate demand statistics during lead time
   */
  calculateLeadTimeDemandStats(dailyMean, dailyStdDev, leadTimeDays, leadTimeStdDev = 0) {
    const meanLT = dailyMean * leadTimeDays;
    
    // For variable lead times: σ_LT = √(demand_var × LT_mean + demand_mean² × LT_var)
    let sigmaLT;
    if (leadTimeStdDev > 0) {
      const demandVar = dailyStdDev * dailyStdDev;
      const ltVar = leadTimeStdDev * leadTimeStdDev;
      sigmaLT = Math.sqrt(demandVar * leadTimeDays + (dailyMean * dailyMean) * ltVar);
    } else {
      // For fixed lead times: σ_LT = √(LT) × daily_std_dev
      sigmaLT = Math.sqrt(leadTimeDays) * dailyStdDev;
    }
    
    return { meanLT, sigmaLT };
  }

  /**
   * Apply ABC classification
   */
  classifyABC(skus) {
    // Sort by annual revenue descending
    const sorted = skus
      .map(sku => ({
        ...sku,
        annualRevenue: sku.annualDemand * sku.unitPrice
      }))
      .sort((a, b) => b.annualRevenue - a.annualRevenue);

    const totalRevenue = sorted.reduce((sum, sku) => sum + sku.annualRevenue, 0);
    let cumulativeRevenue = 0;
    
    return sorted.map(sku => {
      cumulativeRevenue += sku.annualRevenue;
      const cumulativePercent = cumulativeRevenue / totalRevenue;
      
      let abcClass, serviceLevel;
      if (cumulativePercent <= 0.8) {
        abcClass = 'A';
        serviceLevel = 0.99;
      } else if (cumulativePercent <= 0.95) {
        abcClass = 'B';
        serviceLevel = 0.98;
      } else {
        abcClass = 'C';
        serviceLevel = 0.95;
      }
      
      return { ...sku, abcClass, serviceLevel, cumulativePercent };
    });
  }

  /**
   * Calculate stockout risk
   */
  calculateStockoutRisk(rop, meanLT, sigmaLT) {
    if (sigmaLT === 0) return 0;
    
    // P(Demand_LT > ROP) = 1 - Φ((ROP - μ_LT) / σ_LT)
    const zScore = (rop - meanLT) / sigmaLT;
    const stockoutRisk = 1 - this.normalCDF(zScore);
    return Math.max(0, Math.min(1, stockoutRisk));
  }

  /**
   * Standard normal CDF approximation
   */
  normalCDF(x) {
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  /**
   * Error function approximation
   */
  erf(x) {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  /**
   * Apply MOQ and lot-size constraints
   */
  applyMOQConstraints(orderQty, moq, lotSize) {
    if (orderQty === 0) return 0;
    
    // Must meet minimum order quantity
    if (orderQty < moq) {
      orderQty = moq;
    }
    
    // Round up to nearest lot size
    if (lotSize > 0) {
      orderQty = Math.ceil(orderQty / lotSize) * lotSize;
    }
    
    return orderQty;
  }

  /**
   * Generate risk flags for SKU
   */
  generateRiskFlags(sku, demandHistory) {
    const flags = [];
    
    // Slow mover: demand < 1 unit per week
    if (sku.annualDemand / 52 < 1) {
      flags.push('slow_mover');
    }
    
    // High variance: CV > 1.5
    const cv = sku.demandStdDev / sku.demandMean;
    if (cv > 1.5) {
      flags.push('high_variance');
    }
    
    // Data gaps: missing > 10% of demand data
    const expectedDataPoints = demandHistory.length;
    const actualDataPoints = demandHistory.filter(d => d.demand > 0).length;
    if (actualDataPoints / expectedDataPoints < 0.9) {
      flags.push('data_gaps');
    }
    
    // New item: < 6 months of data
    if (expectedDataPoints < 26) { // Assuming weekly data
      flags.push('new_item');
    }
    
    // Obsolete: no demand in last 90 days with inventory
    const recentDemand = demandHistory.slice(-13).reduce((sum, d) => sum + d.demand, 0);
    if (recentDemand === 0 && sku.currentInventory > 0) {
      flags.push('obsolete');
    }
    
    return flags;
  }

  /**
   * Optimize single SKU with constraint handling
   */
  async optimizeSKU(sku, constraints = {}, demandHistory = []) {
    try {
      // Basic inputs
      const {
        skuId,
        annualDemand,
        demandMean: dailyDemandMean,
        demandStdDev: dailyDemandStdDev,
        leadTimeDays,
        unitCost,
        holdingCostRate = 0.25,
        orderingCost = 50,
        moq = 0,
        lotSize = 0,
        serviceLevel
      } = sku;

      // Calculate core metrics
      const eoq = this.calculateEOQ(annualDemand, orderingCost, holdingCostRate, unitCost);
      const safetyStock = this.calculateSafetyStock(serviceLevel, dailyDemandStdDev, leadTimeDays);
      const { meanLT, sigmaLT } = this.calculateLeadTimeDemandStats(
        dailyDemandMean, 
        dailyDemandStdDev, 
        leadTimeDays
      );
      const rop = this.calculateROP(dailyDemandMean, leadTimeDays, safetyStock);

      // Apply constraints
      let recommendedOrderQty = eoq;
      const adjustments = [];

      // MOQ constraint
      if (moq > 0 && eoq < moq) {
        const beforeQty = recommendedOrderQty;
        recommendedOrderQty = this.applyMOQConstraints(recommendedOrderQty, moq, lotSize);
        adjustments.push({
          constraint: 'moq_constraint',
          beforeQty,
          afterQty: recommendedOrderQty,
          reason: `Rounded up to meet MOQ of ${moq}`,
          costImpact: (recommendedOrderQty - beforeQty) * unitCost * holdingCostRate
        });
      }

      // Lot size constraint
      if (lotSize > 0) {
        const beforeQty = recommendedOrderQty;
        recommendedOrderQty = this.applyMOQConstraints(recommendedOrderQty, 0, lotSize);
        if (beforeQty !== recommendedOrderQty) {
          adjustments.push({
            constraint: 'lot_size_constraint',
            beforeQty,
            afterQty: recommendedOrderQty,
            reason: `Rounded to lot size multiple of ${lotSize}`,
            costImpact: Math.abs(recommendedOrderQty - beforeQty) * unitCost * holdingCostRate
          });
        }
      }

      // Calculate outputs
      const stockoutRisk = this.calculateStockoutRisk(rop, meanLT, sigmaLT);
      const holdingCost = (recommendedOrderQty / 2 + safetyStock) * unitCost * holdingCostRate;
      const riskFlags = this.generateRiskFlags(sku, demandHistory);

      // Generate decision record
      const decisionRecord = {
        skuId,
        inputs: {
          demandMeanDaily: dailyDemandMean,
          demandStdDaily: dailyDemandStdDev,
          leadTimeDays,
          serviceLevel,
          unitCost,
          holdingRate: holdingCostRate,
          moq,
          lotSize
        },
        calculations: {
          eoq: Math.round(eoq),
          safetyStock: Math.round(safetyStock),
          rop: Math.round(rop),
          muLT: Math.round(meanLT),
          sigmaLT: Math.round(sigmaLT * 100) / 100
        },
        outputs: {
          recommendedOrderQty: Math.round(recommendedOrderQty),
          recommendedOrderDate: this.calculateOrderDate(sku.currentInventory, rop, dailyDemandMean),
          expectedStockoutRiskPct: Math.round(stockoutRisk * 10000) / 100,
          projectedHoldingCost: Math.round(holdingCost * 100) / 100
        },
        adjustments,
        riskFlags,
        abcClass: sku.abcClass || 'C',
        timestamp: new Date().toISOString()
      };

      return decisionRecord;
    } catch (error) {
      throw new Error(`SKU optimization failed for ${sku.skuId}: ${error.message}`);
    }
  }

  /**
   * Calculate recommended order date
   */
  calculateOrderDate(currentInventory, rop, dailyDemandMean) {
    if (currentInventory <= rop) {
      return new Date().toISOString().split('T')[0]; // Today
    }
    
    const daysUntilReorder = Math.max(0, (currentInventory - rop) / dailyDemandMean);
    const orderDate = new Date();
    orderDate.setDate(orderDate.getDate() + Math.ceil(daysUntilReorder));
    return orderDate.toISOString().split('T')[0];
  }

  /**
   * Batch optimization with constraint handling
   */
  async optimizeBatch(skus, globalConstraints = {}) {
    try {
      // Phase 1: Classify SKUs using ABC analysis
      const classifiedSKUs = this.classifyABC(skus);
      
      // Phase 2: Optimize each SKU individually
      const optimizationPromises = classifiedSKUs.map(sku => 
        this.optimizeSKU(sku, globalConstraints)
      );
      
      const results = await Promise.all(optimizationPromises);
      
      // Phase 3: Apply global constraints (working capital, capacity)
      const constrainedResults = await this.applyGlobalConstraints(results, globalConstraints);
      
      // Generate summary statistics
      const summary = this.generateOptimizationSummary(constrainedResults);
      
      return {
        results: constrainedResults,
        summary,
        timestamp: new Date().toISOString(),
        constraintsApplied: Object.keys(globalConstraints).length > 0
      };
    } catch (error) {
      throw new Error(`Batch optimization failed: ${error.message}`);
    }
  }

  /**
   * Apply global constraints (working capital, capacity)
   */
  async applyGlobalConstraints(results, constraints) {
    if (!constraints.workingCapitalLimit && !constraints.capacityLimit) {
      return results;
    }

    // Sort by priority (cost reduction per £ invested)
    const prioritizedResults = results
      .map(result => ({
        ...result,
        priority: this.calculateInvestmentPriority(result)
      }))
      .sort((a, b) => b.priority - a.priority);

    let totalInvestment = 0;
    let totalCapacityUsed = 0;
    const constrainedResults = [];

    for (const result of prioritizedResults) {
      const investment = result.outputs.recommendedOrderQty * result.inputs.unitCost;
      const capacityNeeded = result.outputs.recommendedOrderQty * 0.1; // Assume 0.1 processing hours per unit
      
      let canOrder = true;
      const constraintViolations = [];

      // Check working capital constraint
      if (constraints.workingCapitalLimit && totalInvestment + investment > constraints.workingCapitalLimit) {
        canOrder = false;
        constraintViolations.push('working_capital_exceeded');
      }

      // Check capacity constraint
      if (constraints.capacityLimit && totalCapacityUsed + capacityNeeded > constraints.capacityLimit) {
        canOrder = false;
        constraintViolations.push('capacity_exceeded');
      }

      if (canOrder) {
        totalInvestment += investment;
        totalCapacityUsed += capacityNeeded;
        constrainedResults.push(result);
      } else {
        // Order deferred - calculate impact
        const deferredResult = {
          ...result,
          outputs: {
            ...result.outputs,
            recommendedOrderQty: 0,
            orderDeferred: true,
            deferralReason: constraintViolations.join(', '),
            riskIncreasePct: 5.0 // Simplified risk increase
          }
        };
        constrainedResults.push(deferredResult);
      }
    }

    return constrainedResults;
  }

  /**
   * Calculate investment priority for constraint allocation
   */
  calculateInvestmentPriority(result) {
    const investment = result.outputs.recommendedOrderQty * result.inputs.unitCost;
    const holdingCostSaved = result.outputs.projectedHoldingCost * 0.1; // Simplified
    const stockoutCostAvoided = result.outputs.expectedStockoutRiskPct * result.inputs.unitCost;
    
    return investment > 0 ? (holdingCostSaved + stockoutCostAvoided) / investment : 0;
  }

  /**
   * Generate optimization summary statistics
   */
  generateOptimizationSummary(results) {
    const totalSKUs = results.length;
    const ordersToPlace = results.filter(r => r.outputs.recommendedOrderQty > 0).length;
    const deferredOrders = results.filter(r => r.outputs.orderDeferred).length;
    
    const totalInvestment = results.reduce((sum, r) => 
      sum + (r.outputs.recommendedOrderQty * r.inputs.unitCost), 0
    );
    
    const totalHoldingCost = results.reduce((sum, r) => 
      sum + r.outputs.projectedHoldingCost, 0
    );
    
    const avgStockoutRisk = results.reduce((sum, r) => 
      sum + r.outputs.expectedStockoutRiskPct, 0
    ) / totalSKUs;

    const abcDistribution = {
      A: results.filter(r => r.abcClass === 'A').length,
      B: results.filter(r => r.abcClass === 'B').length,
      C: results.filter(r => r.abcClass === 'C').length
    };

    return {
      totalSKUs,
      ordersToPlace,
      deferredOrders,
      totalInvestment: Math.round(totalInvestment),
      totalHoldingCost: Math.round(totalHoldingCost),
      avgStockoutRisk: Math.round(avgStockoutRisk * 100) / 100,
      abcDistribution
    };
  }

  /**
   * Get cached optimization result
   */
  getCachedResult(cacheKey) {
    return this.cachedResults.get(cacheKey);
  }

  /**
   * Cache optimization result
   */
  setCachedResult(cacheKey, result) {
    this.cachedResults.set(cacheKey, {
      ...result,
      cachedAt: new Date().toISOString()
    });
  }

  /**
   * Clear optimization cache
   */
  clearCache() {
    this.cachedResults.clear();
  }
}

export default new OptimizationService();