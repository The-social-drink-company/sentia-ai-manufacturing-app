/**
 * Cash Conversion Cycle Engine - Realistic timing calculations for working capital
 * Implements proper DSO, DPO, and DIO calculations based on business calendar
 */

import DateContextEngine from './DateContextEngine';

export class CashConversionCycleEngine {
  constructor(options = {}) {
    this.dateEngine = new DateContextEngine();
    this.config = {
      // Industry benchmarks for manufacturing
      targetDSO: options.targetDSO || 0,  // Days Sales Outstanding
      targetDPO: options.targetDPO || 0,  // Days Payable Outstanding  
      targetDIO: options.targetDIO || 0,  // Days Inventory Outstanding
      
      // Credit terms
      creditTerms: options.creditTerms || {
        net15: 0.10,  // 10% of customers pay net 15
        net30: 0.50,  // 50% of customers pay net 30
        net45: 0.25,  // 25% of customers pay net 45
        net60: 0.15   // 15% of customers pay net 60
      },
      
      // Payment terms with suppliers
      paymentTerms: options.paymentTerms || {
        net30: 0.30,  // 30% of suppliers on net 30
        net60: 0.45,  // 45% of suppliers on net 60
        net90: 0.25   // 25% of suppliers on net 90
      },
      
      // Inventory categories with different turnover rates
      inventoryCategories: options.inventoryCategories || {
        rawMaterials: { turnoverDays: 21, percentage: 0.40 },
        workInProcess: { turnoverDays: 7, percentage: 0.15 },
        finishedGoods: { turnoverDays: 35, percentage: 0.45 }
      }
    };
  }

  /**
   * Calculate realistic Cash Conversion Cycle based on current date and business patterns
   */
  calculateCashConversionCycle(baseMetrics = {}) {
    const context = this.dateEngine.getCurrentContext();
    
    // Get actual metrics or use defaults
    const metrics = {
      annualRevenue: baseMetrics.annualRevenue || 0,
      annualCOGS: baseMetrics.annualCOGS || 0,
      averageReceivables: baseMetrics.averageReceivables || null,
      averageInventory: baseMetrics.averageInventory || null,
      averagePayables: baseMetrics.averagePayables || null,
      ...baseMetrics
    };

    // Calculate or estimate key balance sheet items
    const dailyRevenue = metrics.annualRevenue / 365;
    const dailyCOGS = metrics.annualCOGS / 365;
    
    // Estimate receivables based on payment terms if not provided
    const receivables = metrics.averageReceivables || this.calculateReceivables(dailyRevenue);
    
    // Estimate inventory based on categories if not provided
    const inventory = metrics.averageInventory || this.calculateInventory(dailyCOGS);
    
    // Estimate payables based on payment terms if not provided
    const payables = metrics.averagePayables || this.calculatePayables(dailyCOGS);

    // Calculate cycle components
    const dso = this.calculateDSO(receivables, dailyRevenue, context);
    const dio = this.calculateDIO(inventory, dailyCOGS, context);
    const dpo = this.calculateDPO(payables, dailyCOGS, context);
    
    // Cash Conversion Cycle = DSO + DIO - DPO
    const ccc = dso + dio - dpo;

    return {
      cashConversionCycle: Math.round(ccc * 10) / 10,
      components: {
        dso: Math.round(dso * 10) / 10,
        dio: Math.round(dio * 10) / 10,
        dpo: Math.round(dpo * 10) / 10
      },
      balanceSheetItems: {
        receivables: Math.round(receivables),
        inventory: Math.round(inventory),
        payables: Math.round(payables)
      },
      benchmarks: {
        targetDSO: this.config.targetDSO,
        targetDIO: this.config.targetDIO,
        targetDPO: this.config.targetDPO,
        targetCCC: this.config.targetDSO + this.config.targetDIO - this.config.targetDPO
      },
      performance: {
        dsoVariance: Math.round((dso - this.config.targetDSO) * 10) / 10,
        dioVariance: Math.round((dio - this.config.targetDIO) * 10) / 10,
        dpoVariance: Math.round((dpo - this.config.targetDPO) * 10) / 10
      },
      workingCapitalImpact: this.calculateWorkingCapitalImpact(ccc, dailyRevenue),
      recommendations: this.generateRecommendations(dso, dio, dpo),
      calculatedAt: context.currentDate
    };
  }

  /**
   * Calculate Days Sales Outstanding with realistic payment patterns
   */
  calculateDSO(receivables, dailyRevenue, context) {
    // Base DSO calculation
    const baseDSO = receivables / dailyRevenue;
    
    // Adjust for seasonal payment patterns
    let seasonalAdjustment = 1.0;
    
    // End of quarter - customers delay payments
    if (context.dayOfMonth > 25 && [3, 6, 9, 12].includes(context.currentMonth)) {
      seasonalAdjustment = 1.15;
    }
    
    // Holiday periods - extended payment delays
    if ([12, 1].includes(context.currentMonth)) {
      seasonalAdjustment = 1.08;
    }
    
    // Summer vacation period (July-August) - slower collections
    if ([7, 8].includes(context.currentMonth)) {
      seasonalAdjustment = 1.05;
    }

    return baseDSO * seasonalAdjustment;
  }

  /**
   * Calculate Days Inventory Outstanding with seasonal business patterns
   */
  calculateDIO(inventory, dailyCOGS, context) {
    // Base DIO calculation
    const baseDIO = inventory / dailyCOGS;
    
    // Seasonal inventory adjustments
    let seasonalAdjustment = 1.0;
    
    // Pre-holiday inventory buildup (October-November)
    if ([10, 11].includes(context.currentMonth)) {
      seasonalAdjustment = 1.20;
    }
    
    // Post-holiday inventory reduction (January-February) 
    if ([1, 2].includes(context.currentMonth)) {
      seasonalAdjustment = 0.85;
    }
    
    // Summer production scheduling (June-August)
    if ([6, 7, 8].includes(context.currentMonth)) {
      seasonalAdjustment = 0.95;
    }

    return baseDIO * seasonalAdjustment;
  }

  /**
   * Calculate Days Payable Outstanding with supplier payment realities
   */
  calculateDPO(payables, dailyCOGS, context) {
    // Base DPO calculation
    const baseDPO = payables / dailyCOGS;
    
    // Month-end payment concentration
    let paymentTiming = 1.0;
    
    // Companies often delay payments until month-end
    if (context.dayOfMonth <= 15) {
      paymentTiming = 1.10;  // Higher payables in first half of month
    }
    
    // Quarter-end cash conservation
    if (context.dayOfMonth > 25 && [3, 6, 9, 12].includes(context.currentMonth)) {
      paymentTiming = 1.08;
    }

    return baseDPO * paymentTiming;
  }

  /**
   * Estimate receivables based on credit terms and payment patterns
   */
  calculateReceivables(dailyRevenue) {
    let weightedDSO = 0;
    
    Object.entries(this.config.creditTerms).forEach(([term, percentage]) => {
      const days = parseInt(term.replace('net', ''));
      // Add collection delay factor (customers typically pay 5-10 days late)
      const actualDays = days + 7;
      weightedDSO += actualDays * percentage;
    });
    
    return dailyRevenue * weightedDSO;
  }

  /**
   * Estimate inventory based on categories and turnover rates
   */
  calculateInventory(dailyCOGS) {
    let totalInventory = 0;
    
    Object.entries(this.config.inventoryCategories).forEach(([category, config]) => {
      const categoryInventory = dailyCOGS * config.turnoverDays * config.percentage;
      totalInventory += categoryInventory;
    });
    
    return totalInventory;
  }

  /**
   * Estimate payables based on payment terms
   */
  calculatePayables(dailyCOGS) {
    let weightedDPO = 0;
    
    Object.entries(this.config.paymentTerms).forEach(([term, percentage]) => {
      const days = parseInt(term.replace('net', ''));
      weightedDPO += days * percentage;
    });
    
    return dailyCOGS * 0.7 * weightedDPO; // 70% of COGS typically on payables terms
  }

  /**
   * Calculate working capital impact of CCC changes
   */
  calculateWorkingCapitalImpact(ccc, dailyRevenue) {
    const targetCCC = this.config.targetDSO + this.config.targetDIO - this.config.targetDPO;
    const cccVariance = ccc - targetCCC;
    
    // Each day of CCC = ~1 day of revenue tied up in working capital
    const workingCapitalImpact = cccVariance * dailyRevenue;
    
    return {
      cccVarianceDays: Math.round(cccVariance * 10) / 10,
      workingCapitalImpact: Math.round(workingCapitalImpact),
      annualInterestCost: Math.round(workingCapitalImpact * 0.055), // 5.5% cost of capital
      optimizationPotential: Math.round(Math.abs(workingCapitalImpact))
    };
  }

  /**
   * Generate actionable recommendations based on CCC analysis
   */
  generateRecommendations(dso, dio, dpo) {
    const recommendations = [];
    
    // DSO recommendations
    if (dso > this.config.targetDSO + 5) {
      recommendations.push({
        area: 'Collections',
        priority: 'high',
        issue: `DSO of ${dso.toFixed(1)} days exceeds target by ${(dso - this.config.targetDSO).toFixed(1)} days`,
        recommendation: 'Implement automated collections processes, offer early payment discounts, review credit terms',
        impact: `Could free up £${Math.round((dso - this.config.targetDSO) * 40000000 / 365).toLocaleString()} in working capital`
      });
    }

    // DIO recommendations  
    if (dio > this.config.targetDIO + 5) {
      recommendations.push({
        area: 'Inventory',
        priority: 'medium',
        issue: `Inventory days of ${dio.toFixed(1)} exceeds target by ${(dio - this.config.targetDIO).toFixed(1)} days`,
        recommendation: 'Implement just-in-time ordering, improve demand forecasting, reduce safety stock levels',
        impact: `Could free up £${Math.round((dio - this.config.targetDIO) * 26000000 / 365).toLocaleString()} in working capital`
      });
    }

    // DPO recommendations
    if (dpo < this.config.targetDPO - 5) {
      recommendations.push({
        area: 'Payables',
        priority: 'low',
        issue: `Payable days of ${dpo.toFixed(1)} below target by ${(this.config.targetDPO - dpo).toFixed(1)} days`,
        recommendation: 'Negotiate extended payment terms with suppliers, optimize payment timing',
        impact: `Could improve cash flow by £${Math.round((this.config.targetDPO - dpo) * 26000000 / 365).toLocaleString()}`
      });
    }

    // Overall CCC recommendation
    const ccc = dso + dio - dpo;
    const targetCCC = this.config.targetDSO + this.config.targetDIO - this.config.targetDPO;
    
    if (ccc > targetCCC + 10) {
      recommendations.push({
        area: 'Cash Conversion Cycle',
        priority: 'high',
        issue: `CCC of ${ccc.toFixed(1)} days significantly exceeds target of ${targetCCC.toFixed(1)} days`,
        recommendation: 'Comprehensive working capital optimization program focusing on collections and inventory',
        impact: `Total optimization potential: £${Math.round((ccc - targetCCC) * 40000000 / 365).toLocaleString()}`
      });
    }

    return recommendations;
  }

  /**
   * Project CCC over time with seasonal variations
   */
  projectCCCOverTime(months = 12) {
    const projections = [];
    const currentCCC = this.calculateCashConversionCycle();
    
    for (let month = 0; month < months; month++) {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + month);
      
      const monthContext = {
        currentMonth: futureDate.getMonth() + 1,
        dayOfMonth: futureDate.getDate(),
        currentDate: futureDate.toISOString().split('T')[0]
      };
      
      // Apply seasonal variations to base CCC
      let seasonalDSO = currentCCC.components.dso;
      let seasonalDIO = currentCCC.components.dio;
      let seasonalDPO = currentCCC.components.dpo;
      
      // Seasonal DSO adjustments
      if ([12, 1].includes(monthContext.currentMonth)) seasonalDSO *= 1.08;
      if ([7, 8].includes(monthContext.currentMonth)) seasonalDSO *= 1.05;
      
      // Seasonal DIO adjustments  
      if ([10, 11].includes(monthContext.currentMonth)) seasonalDIO *= 1.20;
      if ([1, 2].includes(monthContext.currentMonth)) seasonalDIO *= 0.85;
      
      // Seasonal DPO adjustments
      if ([3, 6, 9, 12].includes(monthContext.currentMonth)) seasonalDPO *= 1.08;
      
      const projectedCCC = seasonalDSO + seasonalDIO - seasonalDPO;
      
      projections.push({
        month: futureDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        date: monthContext.currentDate,
        ccc: Math.round(projectedCCC * 10) / 10,
        dso: Math.round(seasonalDSO * 10) / 10,
        dio: Math.round(seasonalDIO * 10) / 10,
        dpo: Math.round(seasonalDPO * 10) / 10,
        workingCapitalImpact: Math.round((projectedCCC - currentCCC.benchmarks.targetCCC) * 40000000 / 365)
      });
    }
    
    return projections;
  }

  /**
   * Analyze CCC trends and identify patterns
   */
  analyzeCCCTrends(historicalData) {
    if (!historicalData || historicalData.length < 3) {
      return { trend: 'insufficient_data', message: 'Need at least 3 data points for trend analysis' };
    }
    
    // Calculate trend slope using linear regression
    const n = historicalData.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    
    historicalData.forEach((point, index) => {
      sumX += index;
      sumY += point.ccc;
      sumXY += index * point.ccc;
      sumXX += index * index;
    });
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const trend = slope > 1 ? 'deteriorating' : slope < -1 ? 'improving' : 'stable';
    
    // Analyze variance
    const cccValues = historicalData.map(h => h.ccc);
    const avgCCC = cccValues.reduce((sum, val) => sum + val, 0) / cccValues.length;
    const variance = cccValues.reduce((sum, val) => sum + Math.pow(val - avgCCC, 2), 0) / cccValues.length;
    const volatility = variance > 25 ? 'high' : variance > 10 ? 'medium' : 'low';
    
    return {
      trend,
      slope: Math.round(slope * 100) / 100,
      volatility,
      variance: Math.round(variance * 10) / 10,
      averageCCC: Math.round(avgCCC * 10) / 10,
      recommendation: this.getTrendRecommendation(trend, volatility, avgCCC)
    };
  }

  getTrendRecommendation(trend, volatility, avgCCC) {
    if (trend === 'deteriorating') {
      return 'CCC is worsening over time. Immediate action needed on collections, inventory management, or supplier terms.';
    }
    if (trend === 'improving') {
      return 'CCC is improving. Continue current optimization efforts and identify additional opportunities.';
    }
    if (volatility === 'high') {
      return 'CCC is highly volatile. Focus on stabilizing working capital processes and improving predictability.';
    }
    return 'CCC is stable. Monitor for seasonal patterns and optimization opportunities.';
  }
}

export default CashConversionCycleEngine;