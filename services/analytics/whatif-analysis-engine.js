/**
 * Interactive What-If Analysis Engine
 * Real-time working capital and business scenario modeling with slider controls
 * Supports multi-market analysis (UK, USA, Europe) with comprehensive parameter adjustment
 */

import { EventEmitter } from 'events';
import { logInfo, logWarn, logError } from '../observability/structuredLogger.js';

export class WhatIfAnalysisEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      markets: ['UK', 'USA', 'EUROPE'],
      currencies: { UK: 'GBP', USA: 'USD', EUROPE: 'EUR' },
      exchangeRates: { GBP: 1.27, USD: 1.0, EUR: 1.09 }, // USD base
      updateInterval: options.updateInterval || 500, // Real-time updates every 500ms
      historicalPeriods: 24, // months
      forecastHorizon: 12, // months
      confidenceInterval: 0.95,
      ...options
    };
    
    // Scenario parameters with slider ranges and defaults
    this.parameters = {
      rawMaterials: {
        availability: { min: 50, max: 100, default: 85, unit: '%', step: 5 },
        deliveryTime: { min: 7, max: 60, default: 21, unit: 'days', step: 1 },
        costInflation: { min: -10, max: 25, default: 5, unit: '%', step: 0.5 },
        supplierReliability: { min: 70, max: 100, default: 90, unit: '%', step: 5 },
        bufferStock: { min: 10, max: 45, default: 21, unit: 'days', step: 1 }
      },
      manufacturing: {
        capacity: { min: 60, max: 120, default: 100, unit: '%', step: 5 },
        efficiency: { min: 70, max: 98, default: 88, unit: '%', step: 1 },
        leadTime: { min: 3, max: 21, default: 7, unit: 'days', step: 1 },
        qualityRate: { min: 92, max: 99.5, default: 97, unit: '%', step: 0.5 },
        laborCost: { min: -15, max: 30, default: 8, unit: '%', step: 1 },
        energyCost: { min: -5, max: 40, default: 15, unit: '%', step: 1 }
      },
      shipping: {
        deliveryTime: { min: 1, max: 14, default: 5, unit: 'days', step: 1 },
        shippingCost: { min: -20, max: 50, default: 12, unit: '%', step: 1 },
        reliabilityRate: { min: 85, max: 99.5, default: 95, unit: '%', step: 0.5 },
        expeditedOption: { min: 0, max: 100, default: 10, unit: '%', step: 5 }
      },
      sales: {
        growthRate: { min: -20, max: 40, default: 12, unit: '%', step: 1 },
        seasonalityFactor: { min: 0.5, max: 2.0, default: 1.2, unit: 'x', step: 0.1 },
        priceElasticity: { min: -2.0, max: -0.3, default: -1.2, unit: '', step: 0.1 },
        marketPenetration: { min: 5, max: 25, default: 13.8, unit: '%', step: 0.2 }
      },
      inventory: {
        targetStockDays: { min: 15, max: 90, default: 45, unit: 'days', step: 5 },
        safetyStockLevel: { min: 5, max: 30, default: 14, unit: 'days', step: 1 },
        turnoverTarget: { min: 4, max: 24, default: 8, unit: 'x/year', step: 1 },
        obsolescenceRate: { min: 1, max: 8, default: 3, unit: '%', step: 0.5 }
      },
      financing: {
        interestRate: { min: 2, max: 15, default: 6.5, unit: '%', step: 0.25 },
        creditLimit: { min: 1, max: 20, default: 5, unit: 'M USD', step: 0.5 },
        cashReserveRatio: { min: 5, max: 25, default: 10, unit: '%', step: 1 },
        paymentTerms: { min: 15, max: 90, default: 30, unit: 'days', step: 5 }
      }
    };
    
    // Market-specific multipliers and adjustments
    this.marketParameters = {
      UK: {
        demandMultiplier: 1.0,
        costMultiplier: 1.15,
        regulatoryComplexity: 1.1,
        shippingCostBase: 0.08,
        seasonalPeaks: [3, 6, 11], // March, June, November
        workingCapitalDays: 45
      },
      USA: {
        demandMultiplier: 1.8,
        costMultiplier: 1.0,
        regulatoryComplexity: 1.0,
        shippingCostBase: 0.12,
        seasonalPeaks: [2, 5, 10, 11], // Feb, May, Oct, Nov
        workingCapitalDays: 38
      },
      EUROPE: {
        demandMultiplier: 1.4,
        costMultiplier: 1.22,
        regulatoryComplexity: 1.25,
        shippingCostBase: 0.10,
        seasonalPeaks: [4, 7, 9, 12], // Apr, July, Sept, Dec
        workingCapitalDays: 52
      }
    };
    
    this.currentScenario = this.getDefaultScenario();
    this.baselineMetrics = null;
    this.scenarioCache = new Map();
  }

  /**
   * Initialize the What-If Analysis engine
   */
  async initialize(baselineData) {
    try {
      logInfo('Initializing What-If Analysis engine');
      
      // Set baseline metrics from actual company data
      this.baselineMetrics = await this.calculateBaselineMetrics(baselineData);
      
      // Calculate default scenario
      this.currentScenario = await this.calculateScenario(this.getDefaultScenario());
      
      logInfo('What-If Analysis engine initialized', {
        markets: this.config.markets.length,
        parameters: Object.keys(this.parameters).length
      });
      
      return this.currentScenario;
      
    } catch (error) {
      logError('Failed to initialize What-If Analysis engine', { error: error.message });
      throw error;
    }
  }

  /**
   * Update scenario parameters and recalculate in real-time
   */
  async updateScenario(parameterChanges) {
    try {
      const startTime = performance.now();
      
      // Apply parameter changes
      const updatedParameters = { ...this.currentScenario.parameters };
      
      for (const [category, changes] of Object.entries(parameterChanges)) {
        if (updatedParameters[category]) {
          updatedParameters[category] = { ...updatedParameters[category], ...changes };
        }
      }
      
      // Validate parameter ranges
      const validatedParameters = this.validateParameters(updatedParameters);
      
      // Check cache for quick retrieval
      const cacheKey = this.generateCacheKey(validatedParameters);
      if (this.scenarioCache.has(cacheKey)) {
        const cachedScenario = this.scenarioCache.get(cacheKey);
        this.currentScenario = cachedScenario;
        
        // Emit real-time update
        this.emit('scenarioUpdate', {
          scenario: cachedScenario,
          cached: true,
          processingTime: performance.now() - startTime
        });
        
        return cachedScenario;
      }
      
      // Calculate new scenario
      const newScenario = await this.calculateScenario({ parameters: validatedParameters });
      
      // Cache result
      this.scenarioCache.set(cacheKey, newScenario);
      
      // Keep cache size manageable
      if (this.scenarioCache.size > 100) {
        const firstKey = this.scenarioCache.keys().next().value;
        this.scenarioCache.delete(firstKey);
      }
      
      this.currentScenario = newScenario;
      
      const processingTime = performance.now() - startTime;
      
      // Emit real-time update
      this.emit('scenarioUpdate', {
        scenario: newScenario,
        cached: false,
        processingTime
      });
      
      logInfo('Scenario updated', { processingTime: `${processingTime.toFixed(2)}ms` });
      
      return newScenario;
      
    } catch (error) {
      logError('Scenario update failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Calculate comprehensive scenario analysis
   */
  async calculateScenario(scenarioData) {
    const params = scenarioData.parameters;
    const calculationTimestamp = new Date().toISOString();
    
    // Calculate for each market
    const marketAnalysis = {};
    let totalWorkingCapitalRequired = 0;
    let totalBorrowingRequired = 0;
    
    for (const market of this.config.markets) {
      const marketData = await this.calculateMarketScenario(market, params);
      marketAnalysis[market] = marketData;
      totalWorkingCapitalRequired += marketData.workingCapitalRequired;
      totalBorrowingRequired += marketData.borrowingRequired;
    }
    
    // Calculate overall impact
    const overallImpact = await this.calculateOverallImpact(marketAnalysis, params);
    
    // Generate insights and recommendations
    const insights = await this.generateScenarioInsights(marketAnalysis, overallImpact, params);
    
    return {
      id: `scenario_${Date.now()}`,
      calculatedAt: calculationTimestamp,
      parameters: params,
      marketAnalysis,
      overallImpact,
      insights,
      workingCapitalSummary: {
        totalRequired: totalWorkingCapitalRequired,
        totalBorrowingRequired: totalBorrowingRequired,
        byMarket: Object.fromEntries(
          Object.entries(marketAnalysis).map(([market, data]) => [
            market, 
            { 
              workingCapital: data.workingCapitalRequired,
              borrowing: data.borrowingRequired 
            }
          ])
        )
      },
      confidence: this.calculateScenarioConfidence(params)
    };
  }

  /**
   * Calculate market-specific scenario
   */
  async calculateMarketScenario(market, params) {
    const marketConfig = this.marketParameters[market];
    const currency = this.config.currencies[market];
    const exchangeRate = this.config.exchangeRates[currency];
    
    // Sales forecast calculation
    const baselineSales = this.baselineMetrics?.markets?.[market]?.sales || 15000000; // Default $15M
    const adjustedGrowthRate = params.sales.growthRate / 100;
    const marketDemandMultiplier = marketConfig.demandMultiplier;
    
    const salesForecast = [];
    for (let month = 1; month <= this.config.forecastHorizon; month++) {
      const seasonalFactor = this.calculateSeasonalFactor(month, marketConfig.seasonalPeaks, params.sales.seasonalityFactor);
      const monthlySales = (baselineSales / 12) * 
        (1 + adjustedGrowthRate) * 
        marketDemandMultiplier * 
        seasonalFactor;
        
      salesForecast.push({
        month,
        sales: monthlySales,
        seasonalFactor,
        currency
      });
    }
    
    // Production requirements
    const totalAnnualSales = salesForecast.reduce((sum, month) => sum + month.sales, 0);
    const productionCapacity = params.manufacturing.capacity / 100;
    const productionEfficiency = params.manufacturing.efficiency / 100;
    const maxProductionCapacity = this.baselineMetrics?.production?.maxCapacity || 20000000;
    
    const productionRequired = totalAnnualSales / productionEfficiency;
    const capacityUtilization = productionRequired / (maxProductionCapacity * productionCapacity);
    
    // Raw materials calculation
    const rawMaterialsPerUnit = this.baselineMetrics?.costs?.rawMaterialsPerUnit || 0.35;
    const rawMaterialAvailability = params.rawMaterials.availability / 100;
    const rawMaterialInflation = 1 + (params.rawMaterials.costInflation / 100);
    
    const rawMaterialsNeeded = totalAnnualSales * rawMaterialsPerUnit * rawMaterialInflation;
    const rawMaterialsConstraint = rawMaterialAvailability < 0.9;
    
    // Inventory analysis
    const targetStockDays = params.inventory.targetStockDays;
    const safetyStockDays = params.inventory.safetyStockLevel;
    const dailySalesRate = totalAnnualSales / 365;
    
    const targetInventoryValue = dailySalesRate * targetStockDays * 0.6; // 60% of sales value
    const safetyStockValue = dailySalesRate * safetyStockDays * 0.6;
    const totalInventoryRequired = targetInventoryValue + safetyStockValue;
    
    // Working capital calculation
    const accountsReceivable = (totalAnnualSales / 365) * params.financing.paymentTerms;
    const accountsPayable = (rawMaterialsNeeded / 365) * marketConfig.workingCapitalDays;
    const netWorkingCapital = totalInventoryRequired + accountsReceivable - accountsPayable;
    
    // Seasonal working capital requirements
    const seasonalWorkingCapital = [];
    let maxWorkingCapitalRequired = 0;
    
    for (let month = 1; month <= 12; month++) {
      const monthSales = salesForecast.find(s => s.month === month)?.sales || dailySalesRate * 30;
      const seasonalInventory = totalInventoryRequired * this.calculateSeasonalFactor(month, marketConfig.seasonalPeaks, 1.3);
      const monthlyAR = (monthSales / 30) * params.financing.paymentTerms;
      const monthlyAP = (rawMaterialsNeeded / 12 / 30) * marketConfig.workingCapitalDays;
      const monthlyWC = seasonalInventory + monthlyAR - monthlyAP;
      
      seasonalWorkingCapital.push({
        month,
        workingCapital: monthlyWC,
        inventory: seasonalInventory,
        receivables: monthlyAR,
        payables: monthlyAP
      });
      
      maxWorkingCapitalRequired = Math.max(maxWorkingCapitalRequired, monthlyWC);
    }
    
    // Borrowing requirements
    const availableCash = this.baselineMetrics?.cash?.[market] || 2000000;
    const creditLimit = params.financing.creditLimit * 1000000; // Convert M to actual value
    const interestRate = params.financing.interestRate / 100;
    
    const borrowingRequired = Math.max(0, maxWorkingCapitalRequired - availableCash);
    const creditUtilization = borrowingRequired / creditLimit;
    const annualInterestCost = borrowingRequired * interestRate;
    
    // Risk analysis
    const risks = this.calculateMarketRisks(market, params, {
      capacityUtilization,
      creditUtilization,
      rawMaterialsConstraint
    });
    
    return {
      market,
      currency,
      salesForecast,
      production: {
        required: productionRequired,
        capacityUtilization,
        efficiency: productionEfficiency,
        constraint: capacityUtilization > 0.95
      },
      rawMaterials: {
        totalNeeded: rawMaterialsNeeded,
        availability: rawMaterialAvailability,
        constraint: rawMaterialsConstraint,
        cost: rawMaterialsNeeded
      },
      inventory: {
        target: targetInventoryValue,
        safety: safetyStockValue,
        total: totalInventoryRequired,
        turnover: totalAnnualSales / totalInventoryRequired
      },
      workingCapital: {
        net: netWorkingCapital,
        seasonal: seasonalWorkingCapital,
        max: maxWorkingCapitalRequired,
        components: {
          inventory: totalInventoryRequired,
          receivables: accountsReceivable,
          payables: accountsPayable
        }
      },
      workingCapitalRequired: maxWorkingCapitalRequired,
      borrowingRequired,
      financing: {
        borrowingRequired,
        creditUtilization,
        interestRate,
        annualInterestCost,
        availableCash,
        creditLimit
      },
      risks
    };
  }

  /**
   * Calculate seasonal factor for demand
   */
  calculateSeasonalFactor(month, seasonalPeaks, seasonalityMultiplier) {
    const baseSeasonality = 1.0;
    const peakBoost = seasonalityMultiplier - 1.0;
    
    // Check if month is a seasonal peak
    const isPeak = seasonalPeaks.includes(month);
    const isNearPeak = seasonalPeaks.some(peak => Math.abs(month - peak) === 1);
    
    if (isPeak) {
      return baseSeasonality + peakBoost;
    } else if (isNearPeak) {
      return baseSeasonality + (peakBoost * 0.6);
    } else {
      // Distribute remaining demand across other months
      const nonPeakMonths = 12 - seasonalPeaks.length - (seasonalPeaks.length * 2); // peaks + adjacent
      const reductionFactor = (seasonalPeaks.length * peakBoost) / Math.max(nonPeakMonths, 1);
      return Math.max(0.5, baseSeasonality - reductionFactor);
    }
  }

  /**
   * Calculate overall business impact
   */
  async calculateOverallImpact(marketAnalysis, params) {
    const totalSales = Object.values(marketAnalysis).reduce((sum, market) => 
      sum + market.salesForecast.reduce((monthSum, month) => monthSum + month.sales, 0), 0
    );
    
    const totalWorkingCapital = Object.values(marketAnalysis).reduce((sum, market) => 
      sum + market.workingCapitalRequired, 0
    );
    
    const totalBorrowingRequired = Object.values(marketAnalysis).reduce((sum, market) => 
      sum + market.borrowingRequired, 0
    );
    
    const totalInterestCost = Object.values(marketAnalysis).reduce((sum, market) => 
      sum + market.financing.annualInterestCost, 0
    );
    
    // Calculate ROI and financial metrics
    const grossMargin = 0.4; // 40% baseline
    const adjustedMargin = grossMargin * (params.manufacturing.efficiency / 100);
    const grossProfit = totalSales * adjustedMargin;
    const netProfitBeforeInterest = grossProfit - (totalSales * 0.15); // 15% operating expenses
    const netProfit = netProfitBeforeInterest - totalInterestCost;
    const roi = netProfit / totalWorkingCapital;
    
    // Calculate operational metrics
    const averageCapacityUtilization = Object.values(marketAnalysis).reduce((sum, market) => 
      sum + market.production.capacityUtilization, 0
    ) / Object.values(marketAnalysis).length;
    
    const hasCapacityConstraints = Object.values(marketAnalysis).some(market => 
      market.production.constraint
    );
    
    const hasRawMaterialConstraints = Object.values(marketAnalysis).some(market => 
      market.rawMaterials.constraint
    );
    
    return {
      financial: {
        totalSales,
        grossProfit,
        netProfit,
        totalWorkingCapital,
        totalBorrowingRequired,
        totalInterestCost,
        roi: roi * 100, // Convert to percentage
        workingCapitalTurnover: totalSales / totalWorkingCapital
      },
      operational: {
        averageCapacityUtilization: averageCapacityUtilization * 100,
        hasCapacityConstraints,
        hasRawMaterialConstraints,
        overallEfficiency: params.manufacturing.efficiency
      },
      comparison: {
        salesVsBaseline: this.baselineMetrics ? (totalSales / this.baselineMetrics.totalSales - 1) * 100 : 0,
        workingCapitalVsBaseline: this.baselineMetrics ? (totalWorkingCapital / this.baselineMetrics.totalWorkingCapital - 1) * 100 : 0,
        profitVsBaseline: this.baselineMetrics ? (netProfit / this.baselineMetrics.netProfit - 1) * 100 : 0
      }
    };
  }

  /**
   * Generate scenario insights and recommendations
   */
  async generateScenarioInsights(marketAnalysis, overallImpact, params) {
    const insights = {
      summary: [],
      opportunities: [],
      risks: [],
      recommendations: []
    };
    
    // Financial insights
    if (overallImpact.financial.roi > 25) {
      insights.summary.push({
        type: 'positive',
        category: 'financial',
        title: 'Excellent ROI Scenario',
        description: `This scenario delivers ${overallImpact.financial.roi.toFixed(1)}% ROI on working capital`
      });
    } else if (overallImpact.financial.roi < 10) {
      insights.summary.push({
        type: 'warning',
        category: 'financial',
        title: 'Low ROI Alert',
        description: `ROI of ${overallImpact.financial.roi.toFixed(1)}% may not justify the working capital investment`
      });
    }
    
    // Working capital insights
    if (overallImpact.financial.totalWorkingCapital > this.baselineMetrics?.totalWorkingCapital * 1.5) {
      insights.risks.push({
        type: 'financial',
        severity: 'high',
        title: 'High Working Capital Requirement',
        description: `Scenario requires ${((overallImpact.financial.totalWorkingCapital / 1000000).toFixed(1))}M in working capital`,
        impact: 'May strain cash flow and require significant borrowing'
      });
    }
    
    // Market-specific insights
    Object.entries(marketAnalysis).forEach(_([market, _data]) => {
      if (data.financing.creditUtilization > 0.8) {
        insights.risks.push({
          type: 'financing',
          severity: 'high',
          title: `${market} Credit Utilization Risk`,
          description: `${market} market requires ${(data.financing.creditUtilization * 100).toFixed(1)}% of available credit`,
          impact: 'Limited financial flexibility for unexpected demands'
        });
      }
      
      if (data.production.capacityUtilization > 0.9) {
        insights.risks.push({
          type: 'operational',
          severity: 'medium',
          title: `${market} Capacity Constraint`,
          description: `${market} production running at ${(data.production.capacityUtilization * 100).toFixed(1)}% capacity`,
          impact: 'May struggle to meet demand spikes or handle quality issues'
        });
      }
    });
    
    // Generate recommendations
    if (overallImpact.operational.hasCapacityConstraints) {
      insights.recommendations.push({
        priority: 'high',
        category: 'operational',
        action: 'Increase manufacturing capacity',
        description: 'Consider expanding production capacity or improving efficiency to meet projected demand',
        impact: 'Reduces delivery risk and improves customer satisfaction',
        investment: 'Medium to High'
      });
    }
    
    if (overallImpact.financial.totalBorrowingRequired > 0) {
      insights.recommendations.push({
        priority: 'medium',
        category: 'financial',
        action: 'Secure additional financing',
        description: `Arrange ${(overallImpact.financial.totalBorrowingRequired / 1000000).toFixed(1)}M in additional credit facilities`,
        impact: 'Ensures adequate working capital for scenario execution',
        investment: `Annual interest cost: $${(overallImpact.financial.totalInterestCost / 1000).toFixed(0)}K`
      });
    }
    
    // Identify best market opportunities
    const marketROIs = Object.entries(marketAnalysis).map(([market, data]) => ({
      market,
      roi: (data.salesForecast.reduce((sum, month) => sum + month.sales, 0) * 0.25) / data.workingCapitalRequired
    })).sort((a, b) => b.roi - a.roi);
    
    insights.opportunities.push({
      type: 'market',
      title: 'Market Prioritization',
      description: `${marketROIs[0].market} offers the best ROI at ${(marketROIs[0].roi * 100).toFixed(1)}%`,
      recommendation: `Focus initial expansion efforts on ${marketROIs[0].market} market`
    });
    
    return insights;
  }

  /**
   * Get default scenario parameters
   */
  getDefaultScenario() {
    const defaultParams = {};
    
    Object.entries(this.parameters).forEach(_([category, _params]) => {
      defaultParams[category] = {};
      Object.entries(params).forEach(_([param, _config]) => {
        defaultParams[category][param] = config.default;
      });
    });
    
    return { parameters: defaultParams };
  }

  /**
   * Validate parameter ranges
   */
  validateParameters(parameters) {
    const validated = {};
    
    Object.entries(parameters).forEach(_([category, _params]) => {
      validated[category] = {};
      
      Object.entries(params).forEach(_([param, _value]) => {
        const config = this.parameters[category]?.[param];
        if (config) {
          // Clamp value to valid range
          validated[category][param] = Math.max(
            config.min,
            Math.min(config.max, value)
          );
        } else {
          validated[category][param] = value;
        }
      });
    });
    
    return validated;
  }

  /**
   * Calculate baseline metrics from actual data
   */
  async calculateBaselineMetrics(baselineData) {
    return {
      totalSales: baselineData.financials?.revenue || 42500000,
      totalWorkingCapital: baselineData.financials?.working_capital || 13500000,
      netProfit: baselineData.financials?.net_income || 6100000,
      markets: {
        UK: { sales: 15000000 },
        USA: { sales: 18500000 },
        EUROPE: { sales: 9000000 }
      },
      production: {
        maxCapacity: 50000000
      },
      costs: {
        rawMaterialsPerUnit: 0.35
      },
      cash: {
        UK: 1500000,
        USA: 2200000,
        EUROPE: 1300000
      }
    };
  }

  /**
   * Calculate market-specific risks
   */
  calculateMarketRisks(market, params, calculations) {
    const risks = [];
    
    if (calculations.capacityUtilization > 0.95) {
      risks.push({
        type: 'operational',
        severity: 'high',
        description: 'Capacity utilization exceeds safe operating levels',
        probability: 0.8
      });
    }
    
    if (calculations.creditUtilization > 0.9) {
      risks.push({
        type: 'financial',
        severity: 'critical',
        description: 'Credit utilization approaching maximum limits',
        probability: 0.9
      });
    }
    
    if (calculations.rawMaterialsConstraint) {
      risks.push({
        type: 'supply_chain',
        severity: 'medium',
        description: 'Raw materials availability below optimal levels',
        probability: 0.6
      });
    }
    
    return risks;
  }

  /**
   * Generate cache key for scenario
   */
  generateCacheKey(parameters) {
    const keyString = JSON.stringify(parameters);
    // Simple hash function for cache key
    let hash = 0;
    for (let i = 0; i < keyString.length; i++) {
      const char = keyString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `scenario_${hash}`;
  }

  /**
   * Calculate scenario confidence based on parameter reliability
   */
  calculateScenarioConfidence(params) {
    // Base confidence starts high for well-known parameters
    let confidence = 0.85;
    
    // Reduce confidence for extreme parameter values
    Object.entries(params).forEach(_([category, _categoryParams]) => {
      Object.entries(categoryParams).forEach(_([param, _value]) => {
        const config = this.parameters[category]?.[param];
        if (config) {
          const range = config.max - config.min;
          const distanceFromDefault = Math.abs(value - config.default);
          const extremeness = (distanceFromDefault / range) * 2; // 0-2 scale
          
          if (extremeness > 1) {
            confidence -= (extremeness - 1) * 0.1; // Reduce confidence for extreme values
          }
        }
      });
    });
    
    return Math.max(0.5, Math.min(0.95, confidence));
  }
}

export default WhatIfAnalysisEngine;