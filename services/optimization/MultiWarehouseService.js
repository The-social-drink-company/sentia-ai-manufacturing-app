/**
 * Multi-Warehouse Optimization Service
 * Handles cross-border sourcing, transfer optimization, and regional constraints
 */

import OptimizationService from './OptimizationService.js';

class MultiWarehouseService {
  constructor() {
    this.warehouseConfig = {
      uk: {
        locations: ['Manchester', 'London', 'Birmingham'],
        totalCapacity: 150000,
        currency: 'GBP',
        workingHours: 8 * 5, // hours per week
        peakSeasons: ['Q4', 'Summer']
      },
      eu: {
        locations: ['Amsterdam', 'Frankfurt'],
        totalCapacity: 115000,
        currency: 'EUR',
        workingHours: 8 * 5,
        peakSeasons: ['Q4']
      },
      usa: {
        locations: ['Los Angeles', 'Atlanta'],
        totalCapacity: 200000,
        currency: 'USD',
        workingHours: 8 * 5,
        peakSeasons: ['Q4', 'Back-to-school']
      }
    };

    this.tradeRoutes = {
      'uk_to_eu': {
        dutyRates: { tea_products: 3.2, herbal_supplements: 6.5, packaging: 0.0 },
        processingTimeDays: 2,
        minimumShipment: 1000
      },
      'eu_to_uk': {
        dutyRates: { tea_products: 2.8, herbal_supplements: 5.0, packaging: 0.0 },
        processingTimeDays: 3,
        minimumShipment: 1500
      },
      'uk_eu_to_usa': {
        dutyRates: { tea_products: 6.4, herbal_supplements: 8.0 },
        processingTimeDays: 5,
        minimumShipment: 2000
      }
    };

    this.fxRates = {
      'GBP_EUR': 1.15,
      'GBP_USD': 1.25,
      'EUR_USD': 1.09
    };
  }

  /**
   * Calculate landed cost for cross-border sourcing
   */
  calculateLandedCost(unitCost, sourceCurrency, destCurrency, productCategory, sourceRegion, destRegion) {
    let landedCost = unitCost;

    // Apply FX conversion
    const fxRate = this.getFXRate(sourceCurrency, destCurrency);
    landedCost *= fxRate;

    // Apply duties and tariffs
    const routeKey = `${sourceRegion}_to_${destRegion}`;
    const route = this.tradeRoutes[routeKey];
    
    if (route && route.dutyRates[productCategory]) {
      const dutyRate = route.dutyRates[productCategory] / 100;
      landedCost *= (1 + dutyRate);
    }

    // Add estimated shipping cost (simplified)
    const shippingCost = this.calculateShippingCost(sourceRegion, destRegion);
    landedCost += shippingCost;

    return landedCost;
  }

  /**
   * Get FX rate between currencies
   */
  getFXRate(fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return 1.0;
    
    const rateKey = `${fromCurrency}_${toCurrency}`;
    const reverseKey = `${toCurrency}_${fromCurrency}`;
    
    if (this.fxRates[rateKey]) {
      return this.fxRates[rateKey];
    } else if (this.fxRates[reverseKey]) {
      return 1 / this.fxRates[reverseKey];
    }
    
    // Cross rate calculation (via USD if available)
    if (fromCurrency !== 'USD' && toCurrency !== 'USD') {
      const fromUSDRate = this.getFXRate(fromCurrency, 'USD');
      const toUSDRate = this.getFXRate('USD', toCurrency);
      return fromUSDRate * toUSDRate;
    }
    
    return 1.0; // Fallback
  }

  /**
   * Calculate shipping cost between regions
   */
  calculateShippingCost(sourceRegion, destRegion) {
    const shippingMatrix = {
      'uk_eu': 1.50,
      'eu_uk': 1.50,
      'uk_usa': 3.50,
      'eu_usa': 3.00,
      'usa_uk': 3.50,
      'usa_eu': 3.00
    };
    
    const routeKey = `${sourceRegion}_${destRegion}`;
    return shippingMatrix[routeKey] || 2.00; // Default shipping cost
  }

  /**
   * Select optimal source warehouse for demand
   */
  async selectOptimalSource(sku, demandRegion, availableSources) {
    const sourceOptions = [];
    
    for (const source of availableSources) {
      const landedCost = this.calculateLandedCost(
        sku.unitCost,
        source.currency,
        this.warehouseConfig[demandRegion].currency,
        sku.productCategory,
        source.region,
        demandRegion
      );
      
      // Calculate adjusted lead time for cross-border
      const baseLeadTime = sku.leadTimeDays;
      const routeKey = `${source.region}_to_${demandRegion}`;
      const route = this.tradeRoutes[routeKey];
      const crossBorderDelay = route ? route.processingTimeDays : 0;
      const adjustedLeadTime = baseLeadTime + crossBorderDelay;
      
      // Check capacity availability
      const availableCapacity = this.calculateAvailableCapacity(source.region, source.warehouse);
      
      // Calculate total cost including stockout penalty
      const stockoutPenalty = this.calculateStockoutPenalty(
        sku,
        adjustedLeadTime,
        demandRegion
      );
      
      const totalCost = landedCost + stockoutPenalty;
      
      sourceOptions.push({
        sourceWarehouse: source.warehouse,
        sourceRegion: source.region,
        landedCost,
        adjustedLeadTime,
        availableCapacity,
        stockoutPenalty,
        totalCost,
        feasible: availableCapacity >= sku.demandForecast
      });
    }
    
    // Select lowest total cost feasible option
    const feasibleOptions = sourceOptions.filter(opt => opt.feasible);
    if (feasibleOptions.length === 0) {
      return { error: 'No feasible sourcing options available', options: sourceOptions };
    }
    
    const optimalSource = feasibleOptions.reduce((best, current) => 
      current.totalCost < best.totalCost ? current : best
    );
    
    return {
      recommended: optimalSource,
      alternatives: feasibleOptions.filter(opt => opt !== optimalSource).slice(0, 2),
      allOptions: sourceOptions
    };
  }

  /**
   * Calculate available capacity for warehouse
   */
  calculateAvailableCapacity(region, warehouse) {
    const config = this.warehouseConfig[region];
    if (!config) return 0;
    
    // Simplified capacity calculation
    const baseCapacity = config.totalCapacity / config.locations.length;
    const utilizationRate = 0.85; // Assume 85% utilization target
    
    return Math.floor(baseCapacity * utilizationRate);
  }

  /**
   * Calculate stockout penalty based on service level requirements
   */
  calculateStockoutPenalty(sku, leadTime, region) {
    const serviceLevelPenalty = {
      direct_to_consumer: 50.0,
      retail_partners: 25.0,
      wholesale_distributors: 10.0
    };
    
    const channelType = sku.channelType || 'retail_partners';
    const basePenalty = serviceLevelPenalty[channelType] || 25.0;
    
    // Increase penalty for longer lead times
    const leadTimeMultiplier = Math.max(1.0, leadTime / 14); // 14 days baseline
    
    return basePenalty * leadTimeMultiplier * (1 - (sku.serviceLevel || 0.98));
  }

  /**
   * Optimize transfer between warehouses
   */
  async optimizeTransfers(transferRequests) {
    const optimizedTransfers = [];
    
    for (const request of transferRequests) {
      const {
        skuId,
        fromWarehouse,
        toWarehouse,
        requiredQty,
        urgencyLevel = 'normal'
      } = request;
      
      // Calculate transfer cost
      const transferCost = this.calculateTransferCost(
        fromWarehouse,
        toWarehouse,
        requiredQty
      );
      
      // Calculate transfer lead time
      const transferLeadTime = this.calculateTransferLeadTime(
        fromWarehouse,
        toWarehouse,
        urgencyLevel
      );
      
      // Check minimum shipment requirements
      const minShipmentMet = this.checkMinimumShipment(
        fromWarehouse.region,
        toWarehouse.region,
        requiredQty
      );
      
      // Calculate opportunity cost of stock-out vs transfer cost
      const stockoutCost = this.calculateStockoutCost(request);
      const netBenefit = stockoutCost - transferCost;
      
      const transferRecommendation = {
        skuId,
        fromWarehouse: fromWarehouse.id,
        toWarehouse: toWarehouse.id,
        recommendedQty: requiredQty,
        transferCost,
        transferLeadTime,
        minShipmentMet,
        stockoutCost,
        netBenefit,
        recommended: netBenefit > 0 && minShipmentMet,
        urgencyLevel,
        estimatedArrival: this.calculateArrivalDate(transferLeadTime)
      };
      
      optimizedTransfers.push(transferRecommendation);
    }
    
    // Sort by net benefit descending
    return optimizedTransfers.sort((a, b) => b.netBenefit - a.netBenefit);
  }

  /**
   * Calculate transfer cost between warehouses
   */
  calculateTransferCost(fromWarehouse, toWarehouse, qty) {
    const baseTransferCost = 2.50; // per unit
    const crossBorderSurcharge = fromWarehouse.region !== toWarehouse.region ? 1.00 : 0;
    const urgencyMultiplier = 1.0; // Could vary by urgency
    
    return (baseTransferCost + crossBorderSurcharge) * qty * urgencyMultiplier;
  }

  /**
   * Calculate transfer lead time
   */
  calculateTransferLeadTime(fromWarehouse, toWarehouse, urgencyLevel) {
    let baseDays = fromWarehouse.region === toWarehouse.region ? 2 : 5;
    
    const urgencyMultipliers = {
      urgent: 0.5,
      normal: 1.0,
      standard: 1.5
    };
    
    return Math.ceil(baseDays * (urgencyMultipliers[urgencyLevel] || 1.0));
  }

  /**
   * Check minimum shipment requirements
   */
  checkMinimumShipment(fromRegion, toRegion, qty) {
    if (fromRegion === toRegion) return true; // No minimum for intra-region
    
    const routeKey = `${fromRegion}_to_${toRegion}`;
    const route = this.tradeRoutes[routeKey];
    
    return !route || qty >= (route.minimumShipment || 0);
  }

  /**
   * Calculate cost of stock-out
   */
  calculateStockoutCost(request) {
    const baseCost = request.unitPrice * request.requiredQty * 0.1; // 10% of value
    const urgencyMultiplier = request.urgencyLevel === 'urgent' ? 2.0 : 1.0;
    
    return baseCost * urgencyMultiplier;
  }

  /**
   * Calculate estimated arrival date
   */
  calculateArrivalDate(leadTimeDays) {
    const arrivalDate = new Date();
    arrivalDate.setDate(arrivalDate.getDate() + leadTimeDays);
    return arrivalDate.toISOString().split('T')[0];
  }

  /**
   * Generate multi-warehouse optimization plan
   */
  async generateMultiWarehousePlan(skus, demandByRegion, constraints = {}) {
    const optimizationPlan = {
      regions: {},
      transfers: [],
      summary: {
        totalCost: 0,
        totalLeadTime: 0,
        constraintViolations: []
      },
      timestamp: new Date().toISOString()
    };
    
    // Optimize each region independently
    for (const [region, regionSkus] of Object.entries(demandByRegion)) {
      const regionalResults = await OptimizationService.optimizeBatch(
        regionSkus,
        constraints[region] || {}
      );
      
      optimizationPlan.regions[region] = regionalResults;
      optimizationPlan.summary.totalCost += regionalResults.summary.totalInvestment;
    }
    
    // Identify transfer opportunities
    const transferOpportunities = await this.identifyTransferOpportunities(
      optimizationPlan.regions
    );
    
    if (transferOpportunities.length > 0) {
      optimizationPlan.transfers = await this.optimizeTransfers(transferOpportunities);
    }
    
    return optimizationPlan;
  }

  /**
   * Identify opportunities for inter-warehouse transfers
   */
  async identifyTransferOpportunities(regionalResults) {
    const opportunities = [];
    const regions = Object.keys(regionalResults);
    
    // Compare stock levels and identify surplus/deficit pairs
    for (let i = 0; i < regions.length; i++) {
      for (let j = 0; j < regions.length; j++) {
        if (i === j) continue;
        
        const sourceRegion = regions[i];
        const destRegion = regions[j];
        
        const sourceResults = regionalResults[sourceRegion].results;
        const destResults = regionalResults[destRegion].results;
        
        // Find SKUs with surplus in source and deficit in dest
        for (const sourceSku of sourceResults) {
          const destSku = destResults.find(d => d.skuId === sourceSku.skuId);
          
          if (destSku && destSku.outputs.orderDeferred && sourceSku.outputs.recommendedOrderQty > 0) {
            opportunities.push({
              skuId: sourceSku.skuId,
              fromWarehouse: { region: sourceRegion, id: `WH_${sourceRegion.toUpperCase()}` },
              toWarehouse: { region: destRegion, id: `WH_${destRegion.toUpperCase()}` },
              availableQty: sourceSku.outputs.recommendedOrderQty,
              requiredQty: destSku.outputs.recommendedOrderQty,
              unitPrice: destSku.inputs.unitCost,
              urgencyLevel: destSku.riskFlags.includes('stockout_risk') ? 'urgent' : 'normal'
            });
          }
        }
      }
    }
    
    return opportunities;
  }

  /**
   * Get warehouse configuration
   */
  getWarehouseConfig(region) {
    return this.warehouseConfig[region] || null;
  }

  /**
   * Update FX rates
   */
  updateFXRates(newRates) {
    this.fxRates = { ...this.fxRates, ...newRates };
  }

  /**
   * Get trade route information
   */
  getTradeRoute(sourceRegion, destRegion) {
    const routeKey = `${sourceRegion}_to_${destRegion}`;
    return this.tradeRoutes[routeKey] || null;
  }
}

export default new MultiWarehouseService();