/**
 * Working Capital Optimization Service
 * Manages cash flow timing, WC limits, and payment optimization
 */

class WorkingCapitalService {
  constructor() {
    this.wcLimits = {
      uk: {
        monthlyLimit: 2000000,
        currency: 'GBP',
        utilizationTarget: 0.85,
        emergencyReserve: 300000
      },
      eu: {
        monthlyLimit: 1500000,
        currency: 'EUR',
        utilizationTarget: 0.80,
        emergencyReserve: 200000
      },
      usa: {
        monthlyLimit: 2500000,
        currency: 'USD',
        utilizationTarget: 0.90,
        emergencyReserve: 350000
      }
    };

    this.paymentTerms = {
      suppliers: {
        standardTerms: 45,
        earlyPayDiscount: { rate: 0.02, days: 10 },
        paymentMethods: ['bank_transfer', 'trade_finance']
      },
      customers: {
        retailTerms: 30,
        wholesaleTerms: 60,
        collectionRate: 0.98
      }
    };

    this.holdingCostComponents = {
      storageCost: 2.50, // per cubic meter per month
      insurance: 0.005, // 0.5% of inventory value annually
      obsolescenceReserve: 0.02, // 2% quarterly for slow-moving
      costOfCapital: 0.08, // 8% annually
      totalHoldingRate: 0.25 // 25% annually
    };
  }

  /**
   * Calculate working capital requirements for order plan
   */
  calculateWCRequirements(orderPlan, region = 'uk') {
    const wcConfig = this.wcLimits[region];
    const wcTimeline = new Map();
    
    // Process each order in the plan
    for (const order of orderPlan) {
      const cashOutDate = this.calculateCashOutDate(order.orderDate, order.paymentTerms);
      const cashInDate = this.calculateCashInDate(order.deliveryDate, order.customerTerms);
      const orderValue = order.quantity * order.unitCost;
      
      // Record cash out
      this.addCashFlowEntry(wcTimeline, cashOutDate, -orderValue, {
        type: 'supplier_payment',
        skuId: order.skuId,
        orderId: order.orderId,
        amount: orderValue
      });
      
      // Record cash in (estimated based on inventory turnover)
      const estimatedSaleDate = this.estimateSaleDate(order.deliveryDate, order.turnoverDays);
      this.addCashFlowEntry(wcTimeline, cashInDate, orderValue * order.marginMultiplier, {
        type: 'customer_payment',
        skuId: order.skuId,
        amount: orderValue * order.marginMultiplier
      });
    }
    
    // Calculate cumulative WC usage
    return this.calculateCumulativeWC(wcTimeline, wcConfig);
  }

  /**
   * Add cash flow entry to timeline
   */
  addCashFlowEntry(timeline, date, amount, metadata) {
    const dateKey = new Date(date).toISOString().split('T')[0];
    
    if (!timeline.has(dateKey)) {
      timeline.set(dateKey, { cashFlow: 0, entries: [] });
    }
    
    const entry = timeline.get(dateKey);
    entry.cashFlow += amount;
    entry.entries.push({ amount, ...metadata });
  }

  /**
   * Calculate cumulative working capital usage
   */
  calculateCumulativeWC(wcTimeline, wcConfig) {
    const sortedDates = Array.from(wcTimeline.keys()).sort();
    let cumulativeWC = 0;
    const wcUsageTimeline = [];
    const violations = [];
    
    for (const date of sortedDates) {
      const dayData = wcTimeline.get(date);
      cumulativeWC += dayData.cashFlow;
      
      const utilizationPct = cumulativeWC / wcConfig.monthlyLimit;
      const exceedsLimit = cumulativeWC > wcConfig.monthlyLimit;
      const exceedsTarget = utilizationPct > wcConfig.utilizationTarget;
      
      wcUsageTimeline.push({
        date,
        cumulativeWC,
        utilizationPct: Math.round(utilizationPct * 10000) / 100,
        cashFlow: dayData.cashFlow,
        entries: dayData.entries,
        exceedsLimit,
        exceedsTarget
      });
      
      if (exceedsLimit) {
        violations.push({
          date,
          exceedAmount: cumulativeWC - wcConfig.monthlyLimit,
          utilizationPct
        });
      }
    }
    
    return {
      timeline: wcUsageTimeline,
      violations,
      peakUtilization: Math.max(...wcUsageTimeline.map(t => t.utilizationPct)),
      avgUtilization: wcUsageTimeline.reduce((sum, t) => sum + t.utilizationPct, 0) / wcUsageTimeline.length
    };
  }

  /**
   * Calculate cash out date based on payment terms
   */
  calculateCashOutDate(orderDate, paymentTerms = 45) {
    const cashOutDate = new Date(orderDate);
    cashOutDate.setDate(cashOutDate.getDate() + paymentTerms);
    return cashOutDate;
  }

  /**
   * Calculate cash in date
   */
  calculateCashInDate(deliveryDate, customerTerms = 30) {
    const cashInDate = new Date(deliveryDate);
    cashInDate.setDate(cashInDate.getDate() + customerTerms);
    return cashInDate;
  }

  /**
   * Estimate sale date based on inventory turnover
   */
  estimateSaleDate(deliveryDate, turnoverDays = 45) {
    const saleDate = new Date(deliveryDate);
    saleDate.setDate(saleDate.getDate() + turnoverDays);
    return saleDate;
  }

  /**
   * Optimize payment timing for early pay discounts
   */
  optimizePaymentTiming(orderPlan, wcConfig) {
    const optimizedPlan = [];
    
    for (const order of orderPlan) {
      const standardPaymentDate = this.calculateCashOutDate(order.orderDate, order.paymentTerms);
      const earlyPaymentDate = this.calculateCashOutDate(order.orderDate, this.paymentTerms.suppliers.earlyPayDiscount.days);
      
      const orderValue = order.quantity * order.unitCost;
      const discountAmount = orderValue * this.paymentTerms.suppliers.earlyPayDiscount.rate;
      const acceleratedCashOut = (order.paymentTerms - this.paymentTerms.suppliers.earlyPayDiscount.days) * orderValue * (this.holdingCostComponents.costOfCapital / 365);
      
      const netBenefit = discountAmount - acceleratedCashOut;
      
      const optimizedOrder = {
        ...order,
        paymentRecommendation: {
          recommendEarlyPay: netBenefit > 0,
          standardPaymentDate: standardPaymentDate.toISOString().split('T')[0],
          earlyPaymentDate: earlyPaymentDate.toISOString().split('T')[0],
          discountAmount: Math.round(discountAmount * 100) / 100,
          netBenefit: Math.round(netBenefit * 100) / 100,
          opportunityCost: Math.round(acceleratedCashOut * 100) / 100
        }
      };
      
      optimizedPlan.push(optimizedOrder);
    }
    
    return optimizedPlan;
  }

  /**
   * Apply working capital constraints to order plan
   */
  applyWCConstraints(orderPlan, region = 'uk') {
    const wcConfig = this.wcLimits[region];
    const wcAnalysis = this.calculateWCRequirements(orderPlan, region);
    
    if (wcAnalysis.violations.length === 0) {
      return {
        constrainedPlan: orderPlan,
        wcAnalysis,
        modificationsNeeded: false
      };
    }
    
    // Apply constraint handling
    const constrainedPlan = this.resolveWCViolations(orderPlan, wcAnalysis, wcConfig);
    
    return {
      constrainedPlan,
      wcAnalysis,
      modificationsNeeded: true,
      violationsResolved: wcAnalysis.violations.length
    };
  }

  /**
   * Resolve working capital violations through order deferral
   */
  resolveWCViolations(orderPlan, wcAnalysis, wcConfig) {
    // Sort orders by priority (impact per £ invested)
    const prioritizedOrders = orderPlan
      .map(order => ({
        ...order,
        priority: this.calculateOrderPriority(order),
        wcImpact: order.quantity * order.unitCost
      }))
      .sort((a, b) => b.priority - a.priority);
    
    const constrainedPlan = [];
    let cumulativeWC = 0;
    let deferralCount = 0;
    
    for (const order of prioritizedOrders) {
      const projectedWC = cumulativeWC + order.wcImpact;
      const utilizationAfter = projectedWC / wcConfig.monthlyLimit;
      
      if (utilizationAfter <= wcConfig.utilizationTarget) {
        // Order fits within WC limit
        constrainedPlan.push(order);
        cumulativeWC = projectedWC;
      } else {
        // Defer order to next period
        const deferredOrder = {
          ...order,
          orderDeferred: true,
          originalOrderDate: order.orderDate,
          newOrderDate: this.calculateDeferralDate(order.orderDate, 30),
          deferralReason: 'working_capital_constraint',
          wcImpactReduction: order.wcImpact
        };
        
        constrainedPlan.push(deferredOrder);
        deferralCount++;
      }
    }
    
    return {
      orders: constrainedPlan,
      deferrals: deferralCount,
      wcUtilization: cumulativeWC / wcConfig.monthlyLimit
    };
  }

  /**
   * Calculate order priority for WC constraint handling
   */
  calculateOrderPriority(order) {
    // Priority = (stockout_cost_avoided + holding_cost_saved) / wc_investment
    const stockoutCost = order.stockoutRisk * order.quantity * order.unitCost * 0.1;
    const holdingCostSaved = order.quantity * order.unitCost * this.holdingCostComponents.totalHoldingRate * (30/365);
    const wcInvestment = order.quantity * order.unitCost;
    
    return wcInvestment > 0 ? (stockoutCost + holdingCostSaved) / wcInvestment : 0;
  }

  /**
   * Calculate deferral date
   */
  calculateDeferralDate(originalDate, deferDays) {
    const deferredDate = new Date(originalDate);
    deferredDate.setDate(deferredDate.getDate() + deferDays);
    return deferredDate.toISOString().split('T')[0];
  }

  /**
   * Generate working capital KPIs
   */
  generateWCKPIs(wcAnalysis, region = 'uk') {
    const wcConfig = this.wcLimits[region];
    
    return {
      peakUtilization: wcAnalysis.peakUtilization,
      avgUtilization: wcAnalysis.avgUtilization,
      utilizationTarget: wcConfig.utilizationTarget * 100,
      violationDays: wcAnalysis.violations.length,
      maxExceedAmount: wcAnalysis.violations.length > 0 
        ? Math.max(...wcAnalysis.violations.map(v => v.exceedAmount))
        : 0,
      wcEfficiency: this.calculateWCEfficiency(wcAnalysis),
      daysOutstanding: this.calculateDSO(wcAnalysis),
      inventoryDays: this.calculateInventoryDays(wcAnalysis),
      cashConversionCycle: this.calculateCashConversionCycle(wcAnalysis)
    };
  }

  /**
   * Calculate working capital efficiency
   */
  calculateWCEfficiency(wcAnalysis) {
    // Simplified: Revenue per unit of working capital
    const avgWC = wcAnalysis.timeline.reduce((sum, t) => sum + t.cumulativeWC, 0) / wcAnalysis.timeline.length;
    return avgWC > 0 ? (1000000 / avgWC) : 0; // Assumes £1M revenue target
  }

  /**
   * Calculate Days Sales Outstanding (DSO)
   */
  calculateDSO(wcAnalysis) {
    // Simplified calculation based on customer payment terms
    return this.paymentTerms.customers.retailTerms;
  }

  /**
   * Calculate inventory days
   */
  calculateInventoryDays(wcAnalysis) {
    // Simplified: inventory value / COGS * 365
    return 45; // Placeholder
  }

  /**
   * Calculate cash conversion cycle
   */
  calculateCashConversionCycle(wcAnalysis) {
    const dso = this.calculateDSO(wcAnalysis);
    const dio = this.calculateInventoryDays(wcAnalysis);
    const dpo = this.paymentTerms.suppliers.standardTerms;
    
    return dso + dio - dpo;
  }

  /**
   * Generate CFO working capital report
   */
  generateCFOReport(wcAnalysis, region = 'uk', period = 'Q1-2024') {
    const kpis = this.generateWCKPIs(wcAnalysis, region);
    const wcConfig = this.wcLimits[region];
    
    return {
      reportHeader: {
        title: 'Working Capital Optimization Report',
        region: region.toUpperCase(),
        period,
        generatedAt: new Date().toISOString(),
        currency: wcConfig.currency
      },
      executiveSummary: {
        peakUtilization: `${kpis.peakUtilization}%`,
        avgUtilization: `${kpis.avgUtilization}%`,
        limitBreaches: kpis.violationDays,
        wcLimit: wcConfig.monthlyLimit.toLocaleString(),
        emergencyReserve: wcConfig.emergencyReserve.toLocaleString(),
        efficiency: kpis.wcEfficiency,
        cashConversionCycle: kpis.cashConversionCycle
      },
      keyMetrics: {
        daysOutstanding: kpis.daysOutstanding,
        inventoryDays: kpis.inventoryDays,
        paymentDays: this.paymentTerms.suppliers.standardTerms,
        collectionEfficiency: this.paymentTerms.customers.collectionRate * 100
      },
      riskAssessment: {
        wcRisk: kpis.violationDays > 0 ? 'HIGH' : (kpis.peakUtilization > 90 ? 'MEDIUM' : 'LOW'),
        liquidityRisk: kpis.peakUtilization > wcConfig.utilizationTarget * 100 ? 'ELEVATED' : 'NORMAL',
        recommendedActions: this.generateRecommendedActions(kpis, wcConfig)
      },
      timeline: wcAnalysis.timeline.map(t => ({
        date: t.date,
        wcUsed: Math.round(t.cumulativeWC),
        utilizationPct: t.utilizationPct,
        exceedsTarget: t.exceedsTarget,
        exceedsLimit: t.exceedsLimit
      }))
    };
  }

  /**
   * Generate recommended actions for CFO report
   */
  generateRecommendedActions(kpis, wcConfig) {
    const actions = [];
    
    if (kpis.peakUtilization > wcConfig.utilizationTarget * 100) {
      actions.push('Consider increasing working capital facility or reducing peak inventory levels');
    }
    
    if (kpis.violationDays > 0) {
      actions.push('Implement order deferral strategy to avoid facility breaches');
    }
    
    if (kpis.daysOutstanding > 35) {
      actions.push('Review customer payment terms and collection processes');
    }
    
    if (kpis.cashConversionCycle > 60) {
      actions.push('Optimize payment timing and inventory turnover to improve cash cycle');
    }
    
    return actions.length > 0 ? actions : ['Working capital management is within acceptable parameters'];
  }

  /**
   * Get WC limits for region
   */
  getWCLimits(region) {
    return this.wcLimits[region] || null;
  }

  /**
   * Update WC limits
   */
  updateWCLimits(region, newLimits) {
    if (this.wcLimits[region]) {
      this.wcLimits[region] = { ...this.wcLimits[region], ...newLimits };
    }
  }
}

export default new WorkingCapitalService();