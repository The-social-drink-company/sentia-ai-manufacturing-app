/**
 * CashRunwayEngine - Complete cash flow calculations engine
 * Version: 2.0.0 - September 24, 2025 Feature Addition
 * Purpose: Comprehensive cash runway analysis and projections for manufacturing operations
 */

/**
 * Industry benchmark data for various sectors and company sizes
 */
const INDUSTRY_BENCHMARKS = {
  manufacturing: {
    small: { dso: 45, dio: 60, dpo: 30, burnRatePercent: 0.15, growthRate: 0.10 },
    medium: { dso: 42, dio: 55, dpo: 35, burnRatePercent: 0.12, growthRate: 0.15 },
    large: { dso: 38, dio: 50, dpo: 40, burnRatePercent: 0.10, growthRate: 0.20 }
  },
  retail: {
    small: { dso: 30, dio: 45, dpo: 25, burnRatePercent: 0.18, growthRate: 0.12 },
    medium: { dso: 28, dio: 40, dpo: 30, burnRatePercent: 0.15, growthRate: 0.18 },
    large: { dso: 25, dio: 35, dpo: 35, burnRatePercent: 0.12, growthRate: 0.25 }
  },
  technology: {
    small: { dso: 60, dio: 0, dpo: 30, burnRatePercent: 0.25, growthRate: 0.30 },
    medium: { dso: 55, dio: 0, dpo: 35, burnRatePercent: 0.20, growthRate: 0.40 },
    large: { dso: 50, dio: 0, dpo: 40, burnRatePercent: 0.15, growthRate: 0.50 }
  },
  services: {
    small: { dso: 35, dio: 0, dpo: 20, burnRatePercent: 0.12, growthRate: 0.15 },
    medium: { dso: 32, dio: 0, dpo: 25, burnRatePercent: 0.10, growthRate: 0.20 },
    large: { dso: 30, dio: 0, dpo: 30, burnRatePercent: 0.08, growthRate: 0.25 }
  }
};

/**
 * Seasonal adjustment factors by month (1.0 = no adjustment)
 */
const SEASONAL_FACTORS = {
  january: 0.85,
  february: 0.88,
  march: 0.95,
  april: 1.00,
  may: 1.05,
  june: 1.08,
  july: 1.10,
  august: 1.08,
  september: 1.05,
  october: 1.12,
  november: 1.15,
  december: 1.20
};

/**
 * CashRunwayEngine - Main class for cash flow analysis and projections
 */
class CashRunwayEngine {
  /**
   * Initialize the cash runway engine with default parameters
   * @param {Object} config - Configuration object
   */
  constructor(config = {}) {
    this.industry = config.industry || 'manufacturing';
    this.companySize = config.companySize || 'medium';
    this.currency = config.currency || 'USD';
    this.fiscalYearStart = config.fiscalYearStart || 1; // January
    this.enableSeasonality = config.enableSeasonality !== false;
    this.riskTolerance = config.riskTolerance || 'moderate'; // conservative, moderate, aggressive

    // Initialize constants
    this.DAYS_IN_YEAR = 365;
    this.MONTHS_IN_YEAR = 12;
    this.WORKING_DAYS = 250;

    // Risk multipliers
    this.RISK_MULTIPLIERS = {
      conservative: 1.2,
      moderate: 1.0,
      aggressive: 0.8
    };

    // Funding scenarios
    this.FUNDING_SCENARIOS = {
      sustain: { growthRate: 0, marginImprovement: 0, timeHorizon: 12 },
      growth: { growthRate: 0.20, marginImprovement: 0.05, timeHorizon: 18 },
      aggressive: { growthRate: 0.50, marginImprovement: 0.10, timeHorizon: 24 }
    };
  }

  /**
   * Calculate cash runway in months
   * @param {number} cashBalance - Current cash balance
   * @param {number} monthlyBurnRate - Monthly burn rate (negative = burning cash)
   * @param {number} monthlyRevenue - Monthly revenue
   * @returns {Object} Runway analysis
   */
  calculateRunway(cashBalance, monthlyBurnRate, monthlyRevenue = 0) {
    // Validate inputs
    if (!this.validateInputs({ cashBalance, monthlyBurnRate, monthlyRevenue })) {
      throw new Error('Invalid inputs for runway calculation');
    }

    // Calculate net burn rate
    const netBurnRate = monthlyBurnRate - monthlyRevenue;

    // Handle profitable scenarios
    if (netBurnRate <= 0) {
      return {
        runway: Infinity,
        runwayMonths: 'Infinite',
        isProfitable: true,
        monthlyProfit: Math.abs(netBurnRate),
        cashGrowthRate: (Math.abs(netBurnRate) / cashBalance) * 100,
        recommendation: 'Company is cash flow positive. Consider growth investments.'
      };
    }

    // Calculate basic runway
    const runwayMonths = cashBalance / netBurnRate;

    // Apply risk adjustment
    const riskMultiplier = this.RISK_MULTIPLIERS[this.riskTolerance];
    const adjustedRunway = runwayMonths / riskMultiplier;

    // Calculate runway date
    const runwayDate = new Date();
    runwayDate.setMonth(runwayDate.getMonth() + Math.floor(adjustedRunway));

    // Generate recommendations
    let recommendation = '';
    if (adjustedRunway < 3) {
      recommendation = 'CRITICAL: Less than 3 months runway. Immediate action required.';
    } else if (adjustedRunway < 6) {
      recommendation = 'WARNING: Less than 6 months runway. Begin fundraising immediately.';
    } else if (adjustedRunway < 12) {
      recommendation = 'CAUTION: Less than 12 months runway. Plan fundraising soon.';
    } else if (adjustedRunway < 18) {
      recommendation = 'HEALTHY: 12-18 months runway. Monitor closely.';
    } else {
      recommendation = 'STRONG: Over 18 months runway. Focus on growth.';
    }

    return {
      runway: adjustedRunway,
      runwayMonths: adjustedRunway.toFixed(1),
      runwayDate: runwayDate.toISOString(),
      netBurnRate,
      monthlyRevenue,
      isProfitable: false,
      burnMultiple: monthlyRevenue > 0 ? netBurnRate / monthlyRevenue : null,
      daysRemaining: Math.floor(adjustedRunway * 30),
      recommendation,
      riskAdjustment: riskMultiplier
    };
  }

  /**
   * Calculate cash coverage for specific day periods
   * @param {number} cashBalance - Current cash balance
   * @param {Object} expenses - Expense breakdown
   * @param {number} days - Coverage period in days
   * @returns {Object} Coverage analysis
   */
  calculateCoverage(cashBalance, expenses, days) {
    const dailyExpenses = {
      payroll: (expenses.payroll || 0) / 30,
      rent: (expenses.rent || 0) / 30,
      utilities: (expenses.utilities || 0) / 30,
      inventory: (expenses.inventory || 0) / 30,
      marketing: (expenses.marketing || 0) / 30,
      other: (expenses.other || 0) / 30
    };

    const totalDailyExpenses = Object.values(dailyExpenses).reduce((sum, exp) => sum + exp, 0);
    const periodExpenses = totalDailyExpenses * days;

    // Apply seasonal adjustment if enabled
    let adjustedPeriodExpenses = periodExpenses;
    if (this.enableSeasonality) {
      const currentMonth = new Date().getMonth();
      const monthName = Object.keys(SEASONAL_FACTORS)[currentMonth];
      const seasonalFactor = SEASONAL_FACTORS[monthName];
      adjustedPeriodExpenses = periodExpenses * seasonalFactor;
    }

    const coveragePercentage = (cashBalance / adjustedPeriodExpenses) * 100;
    const canCover = cashBalance >= adjustedPeriodExpenses;
    const shortfall = Math.max(0, adjustedPeriodExpenses - cashBalance);
    const surplus = Math.max(0, cashBalance - adjustedPeriodExpenses);

    // Calculate coverage by category
    const coverageByCategory = {};
    let remainingCash = cashBalance;

    // Priority order for coverage
    const priorityOrder = ['payroll', 'rent', 'utilities', 'inventory', 'marketing', 'other'];

    for (const category of priorityOrder) {
      const categoryExpense = dailyExpenses[category] * days;
      if (remainingCash >= categoryExpense) {
        coverageByCategory[category] = {
          covered: true,
          amount: categoryExpense,
          percentage: 100
        };
        remainingCash -= categoryExpense;
      } else {
        coverageByCategory[category] = {
          covered: false,
          amount: remainingCash,
          percentage: (remainingCash / categoryExpense) * 100,
          shortfall: categoryExpense - remainingCash
        };
        remainingCash = 0;
      }
    }

    return {
      days,
      totalExpenses: adjustedPeriodExpenses,
      cashBalance,
      coveragePercentage: Math.min(100, coveragePercentage),
      canCover,
      shortfall,
      surplus,
      coverageByCategory,
      dailyBurn: totalDailyExpenses,
      recommendation: this.generateCoverageRecommendation(coveragePercentage, days)
    };
  }

  /**
   * Calculate burn rate metrics
   * @param {Object} expenses - Monthly expenses
   * @param {number} revenue - Monthly revenue
   * @param {string} period - Calculation period
   * @returns {Object} Burn rate analysis
   */
  calculateBurnRate(expenses, revenue, period = 'monthly') {
    const totalExpenses = Object.values(expenses).reduce((sum, exp) => sum + exp, 0);
    const grossBurnRate = totalExpenses;
    const netBurnRate = totalExpenses - revenue;

    // Calculate efficiency metrics
    const efficiencyRatio = revenue > 0 ? revenue / totalExpenses : 0;
    const burnMultiple = revenue > 0 ? netBurnRate / revenue : null;

    // Period adjustments
    const periodMultipliers = {
      daily: 1 / 30,
      weekly: 7 / 30,
      monthly: 1,
      quarterly: 3,
      yearly: 12
    };

    const multiplier = periodMultipliers[period] || 1;

    // Calculate trend (mock data - would use historical data in production)
    const trend = this.calculateTrend([
      netBurnRate * 1.1,
      netBurnRate * 1.05,
      netBurnRate * 1.02,
      netBurnRate
    ]);

    return {
      period,
      grossBurnRate: grossBurnRate * multiplier,
      netBurnRate: netBurnRate * multiplier,
      revenue: revenue * multiplier,
      efficiencyRatio: efficiencyRatio.toFixed(2),
      burnMultiple,
      isPositiveCashFlow: netBurnRate <= 0,
      trend: {
        direction: trend.direction,
        percentageChange: trend.percentageChange,
        projection: trend.projection
      },
      breakdown: {
        payroll: (expenses.payroll || 0) * multiplier,
        rent: (expenses.rent || 0) * multiplier,
        utilities: (expenses.utilities || 0) * multiplier,
        inventory: (expenses.inventory || 0) * multiplier,
        marketing: (expenses.marketing || 0) * multiplier,
        other: (expenses.other || 0) * multiplier
      },
      recommendations: this.generateBurnRateRecommendations(efficiencyRatio, netBurnRate)
    };
  }

  /**
   * Calculate funding needs based on scenario
   * @param {string} scenario - Funding scenario (sustain, growth, aggressive)
   * @param {Object} currentMetrics - Current financial metrics
   * @returns {Object} Funding requirements
   */
  calculateFundingNeeds(scenario = 'sustain', currentMetrics) {
    const scenarioConfig = this.FUNDING_SCENARIOS[scenario];
    const { monthlyBurnRate, monthlyRevenue, cashBalance } = currentMetrics;

    // Calculate base funding need
    const currentNetBurn = monthlyBurnRate - monthlyRevenue;
    const monthsToFund = scenarioConfig.timeHorizon;

    // Apply growth assumptions
    const projectedRevenue = monthlyRevenue * Math.pow(1 + scenarioConfig.growthRate / 12, monthsToFund);
    const projectedExpenses = monthlyBurnRate * (1 + scenarioConfig.growthRate * 0.7); // Expenses grow slower

    // Calculate working capital needs
    const workingCapitalIncrease = (projectedRevenue - monthlyRevenue) * 2; // 2 months of revenue growth

    // Buffer calculation
    const buffer = this.RISK_MULTIPLIERS[this.riskTolerance];

    // Total funding calculation
    let totalFunding = 0;
    let monthlyProjections = [];

    for (let month = 1; month <= monthsToFund; month++) {
      const revGrowth = Math.pow(1 + scenarioConfig.growthRate / 12, month);
      const expGrowth = Math.pow(1 + (scenarioConfig.growthRate * 0.7) / 12, month);

      const monthRevenue = monthlyRevenue * revGrowth;
      const monthExpenses = monthlyBurnRate * expGrowth;
      const monthNetBurn = monthExpenses - monthRevenue;

      totalFunding += Math.max(0, monthNetBurn);

      monthlyProjections.push({
        month,
        revenue: monthRevenue,
        expenses: monthExpenses,
        netBurn: monthNetBurn,
        cumulativeFunding: totalFunding
      });
    }

    // Add working capital and buffer
    totalFunding += workingCapitalIncrease;
    totalFunding *= buffer;

    // Calculate milestone-based tranches
    const tranches = this.calculateFundingTranches(totalFunding, monthsToFund);

    return {
      scenario,
      totalFundingNeeded: totalFunding,
      timeHorizon: monthsToFund,
      workingCapitalNeeds: workingCapitalIncrease,
      bufferAmount: totalFunding * (buffer - 1),
      tranches,
      monthlyProjections,
      assumptions: {
        growthRate: scenarioConfig.growthRate * 100 + '%',
        marginImprovement: scenarioConfig.marginImprovement * 100 + '%',
        riskAdjustment: this.riskTolerance
      },
      breakEvenMonth: this.calculateBreakEvenMonth(monthlyProjections),
      roi: this.calculateROI(totalFunding, projectedRevenue, monthsToFund)
    };
  }

  /**
   * Optimize working capital metrics
   * @param {Object} currentMetrics - Current DSO, DPO, DIO metrics
   * @returns {Object} Optimization recommendations
   */
  optimizeWorkingCapital(currentMetrics) {
    const { dso, dpo, dio, revenue, cogs } = currentMetrics;
    const benchmarks = this.getIndustryBenchmarks(this.industry, this.companySize);

    // Calculate optimization potential
    const dsoOptimization = {
      current: dso,
      benchmark: benchmarks.dso,
      potential: Math.max(0, dso - benchmarks.dso),
      cashImpact: (revenue / 365) * Math.max(0, dso - benchmarks.dso),
      priority: dso > benchmarks.dso * 1.2 ? 'HIGH' : dso > benchmarks.dso ? 'MEDIUM' : 'LOW',
      actions: [
        'Implement automated invoice reminders',
        'Offer early payment discounts (2/10 net 30)',
        'Improve credit screening process',
        'Consider factoring for immediate cash'
      ]
    };

    const dpoOptimization = {
      current: dpo,
      benchmark: benchmarks.dpo,
      potential: Math.max(0, benchmarks.dpo - dpo),
      cashImpact: (cogs / 365) * Math.max(0, benchmarks.dpo - dpo),
      priority: dpo < benchmarks.dpo * 0.8 ? 'HIGH' : dpo < benchmarks.dpo ? 'MEDIUM' : 'LOW',
      actions: [
        'Negotiate extended payment terms',
        'Implement vendor financing programs',
        'Optimize payment scheduling',
        'Consolidate suppliers for better terms'
      ]
    };

    const dioOptimization = {
      current: dio,
      benchmark: benchmarks.dio,
      potential: Math.max(0, dio - benchmarks.dio),
      cashImpact: (cogs / 365) * Math.max(0, dio - benchmarks.dio),
      priority: dio > benchmarks.dio * 1.3 ? 'HIGH' : dio > benchmarks.dio ? 'MEDIUM' : 'LOW',
      actions: [
        'Implement just-in-time inventory',
        'Improve demand forecasting',
        'Reduce safety stock levels',
        'Implement ABC inventory analysis'
      ]
    };

    // Calculate total cash impact
    const totalCashImpact = dsoOptimization.cashImpact + dpoOptimization.cashImpact + dioOptimization.cashImpact;

    // Generate prioritized action plan
    const actionPlan = [];

    if (dsoOptimization.priority === 'HIGH') {
      actionPlan.push({
        metric: 'DSO',
        impact: dsoOptimization.cashImpact,
        timeframe: '30 days',
        actions: dsoOptimization.actions.slice(0, 2)
      });
    }

    if (dpoOptimization.priority === 'HIGH') {
      actionPlan.push({
        metric: 'DPO',
        impact: dpoOptimization.cashImpact,
        timeframe: '60 days',
        actions: dpoOptimization.actions.slice(0, 2)
      });
    }

    if (dioOptimization.priority === 'HIGH') {
      actionPlan.push({
        metric: 'DIO',
        impact: dioOptimization.cashImpact,
        timeframe: '90 days',
        actions: dioOptimization.actions.slice(0, 2)
      });
    }

    // Sort by impact
    actionPlan.sort((a, b) => b.impact - a.impact);

    return {
      dsoOptimization,
      dpoOptimization,
      dioOptimization,
      totalCashImpact,
      cashConversionCycle: {
        current: dso + dio - dpo,
        optimized: benchmarks.dso + benchmarks.dio - benchmarks.dpo,
        improvement: (dso + dio - dpo) - (benchmarks.dso + benchmarks.dio - benchmarks.dpo)
      },
      prioritizedActions: actionPlan,
      implementationTimeline: this.generateImplementationTimeline(actionPlan),
      expectedROI: (totalCashImpact / currentMetrics.revenue) * 100
    };
  }

  /**
   * Generate cash flow projections
   * @param {Object} baseData - Base financial data
   * @param {number} months - Number of months to project
   * @returns {Array} Monthly projections
   */
  generateProjections(baseData, months = 24) {
    const {
      startingCash,
      monthlyRevenue,
      monthlyExpenses,
      growthRate = 0.05,
      seasonalityEnabled = true,
      collections = { pattern: 'standard' }, // standard, fast, slow
      payments = { pattern: 'standard' }
    } = baseData;

    const projections = [];
    let currentCash = startingCash;
    let currentRevenue = monthlyRevenue;
    let currentExpenses = monthlyExpenses;

    // Collection patterns (percentage collected in each month)
    const collectionPatterns = {
      fast: [0.5, 0.4, 0.1], // 50% current, 40% next month, 10% month after
      standard: [0.3, 0.5, 0.2], // 30% current, 50% next month, 20% month after
      slow: [0.1, 0.4, 0.5] // 10% current, 40% next month, 50% month after
    };

    const pattern = collectionPatterns[collections.pattern] || collectionPatterns.standard;
    const revenueBuffer = []; // Track uncollected revenue

    for (let month = 1; month <= months; month++) {
      const currentDate = new Date();
      currentDate.setMonth(currentDate.getMonth() + month - 1);
      const monthIndex = currentDate.getMonth();
      const monthName = Object.keys(SEASONAL_FACTORS)[monthIndex];

      // Apply growth
      const monthlyGrowth = Math.pow(1 + growthRate / 12, month);
      currentRevenue = monthlyRevenue * monthlyGrowth;
      currentExpenses = monthlyExpenses * monthlyGrowth * 0.9; // Expenses grow slower

      // Apply seasonality
      if (seasonalityEnabled && this.enableSeasonality) {
        const seasonalFactor = SEASONAL_FACTORS[monthName];
        currentRevenue *= seasonalFactor;
      }

      // Calculate cash collections based on pattern
      let cashCollected = currentRevenue * pattern[0];

      // Add collections from previous months
      revenueBuffer.forEach((pastRevenue, index) => {
        if (index < pattern.length - 1) {
          cashCollected += pastRevenue * pattern[index + 1];
        }
      });

      // Update revenue buffer
      revenueBuffer.unshift(currentRevenue * (1 - pattern[0]));
      if (revenueBuffer.length > pattern.length - 1) {
        revenueBuffer.pop();
      }

      // Calculate net cash flow
      const netCashFlow = cashCollected - currentExpenses;
      currentCash += netCashFlow;

      // Generate scenarios
      const bestCase = currentCash * 1.2;
      const worstCase = currentCash * 0.8;

      projections.push({
        month,
        monthName,
        date: currentDate.toISOString(),
        revenue: currentRevenue,
        collections: cashCollected,
        expenses: currentExpenses,
        netCashFlow,
        cashBalance: currentCash,
        scenarios: {
          best: bestCase,
          expected: currentCash,
          worst: worstCase
        },
        metrics: {
          burnRate: currentExpenses - cashCollected,
          runway: currentCash > 0 ? currentCash / Math.max(1, currentExpenses - cashCollected) : 0,
          cashCoverage: currentCash / currentExpenses
        },
        alerts: this.generateProjectionAlerts(currentCash, netCashFlow, month)
      });
    }

    return {
      projections,
      summary: {
        startingCash,
        endingCash: currentCash,
        totalRevenue: projections.reduce((sum, p) => sum + p.revenue, 0),
        totalExpenses: projections.reduce((sum, p) => sum + p.expenses, 0),
        averageMonthlyBurn: projections.reduce((sum, p) => sum + p.metrics.burnRate, 0) / months,
        cashFlowPositiveMonth: projections.findIndex(p => p.netCashFlow > 0) + 1 || null,
        lowestCashMonth: projections.reduce((min, p) => p.cashBalance < min.cashBalance ? p : min),
        highestCashMonth: projections.reduce((max, p) => p.cashBalance > max.cashBalance ? p : max)
      }
    };
  }

  /**
   * Calculate unit economics
   * @param {number} ltv - Customer lifetime value
   * @param {number} cac - Customer acquisition cost
   * @param {number} churnRate - Monthly churn rate
   * @returns {Object} Unit economics analysis
   */
  calculateUnitEconomics(ltv, cac, churnRate) {
    // LTV/CAC ratio
    const ltvCacRatio = ltv / cac;

    // Payback period in months
    const monthlyRevenue = ltv * churnRate; // Simplified calculation
    const paybackPeriod = cac / monthlyRevenue;

    // Calculate margins
    const grossMargin = 0.7; // Assumed 70% gross margin
    const contributionMargin = ltv * grossMargin;
    const contributionMarginRatio = contributionMargin / ltv;

    // Growth efficiency
    const growthEfficiency = ltvCacRatio > 3 ? 'Excellent' :
                            ltvCacRatio > 2 ? 'Good' :
                            ltvCacRatio > 1 ? 'Fair' : 'Poor';

    // Calculate sustainable growth rate
    const retentionRate = 1 - churnRate;
    const sustainableGrowthRate = (ltvCacRatio - 1) * churnRate;

    // Recommendations
    const recommendations = [];

    if (ltvCacRatio < 1) {
      recommendations.push('CRITICAL: LTV/CAC below 1. Business model unsustainable.');
    } else if (ltvCacRatio < 2) {
      recommendations.push('WARNING: LTV/CAC below 2. Improve retention or reduce CAC.');
    } else if (ltvCacRatio < 3) {
      recommendations.push('CAUTION: LTV/CAC below 3. Focus on optimization.');
    } else {
      recommendations.push('STRONG: LTV/CAC above 3. Ready for scaling.');
    }

    if (paybackPeriod > 12) {
      recommendations.push('Long payback period. Consider improving monetization.');
    }

    if (churnRate > 0.1) {
      recommendations.push('High churn rate. Focus on customer retention.');
    }

    return {
      ltv,
      cac,
      ltvCacRatio: ltvCacRatio.toFixed(2),
      paybackPeriod: paybackPeriod.toFixed(1),
      monthlyChurn: (churnRate * 100).toFixed(1) + '%',
      annualChurn: ((1 - Math.pow(1 - churnRate, 12)) * 100).toFixed(1) + '%',
      retentionRate: (retentionRate * 100).toFixed(1) + '%',
      contributionMargin: contributionMargin.toFixed(2),
      contributionMarginRatio: (contributionMarginRatio * 100).toFixed(1) + '%',
      growthEfficiency,
      sustainableGrowthRate: (sustainableGrowthRate * 100).toFixed(1) + '%',
      recommendations,
      benchmarks: {
        target: { ltvCac: 3, payback: 12, churn: 0.05 },
        industry: this.getIndustryUnitEconomics()
      }
    };
  }

  /**
   * Perform sensitivity analysis
   * @param {Object} baseCase - Base case parameters
   * @param {Array} variables - Variables to test
   * @returns {Object} Sensitivity analysis matrix
   */
  performSensitivityAnalysis(baseCase, variables) {
    const results = [];
    const impactMatrix = {};

    // Define variation ranges
    const variations = [-20, -10, 0, 10, 20]; // Percentage variations

    variables.forEach(variable => {
      impactMatrix[variable.name] = [];

      variations.forEach(variation => {
        // Create modified case
        const modifiedCase = { ...baseCase };
        const originalValue = modifiedCase[variable.key];
        modifiedCase[variable.key] = originalValue * (1 + variation / 100);

        // Calculate impact on key metrics
        const runway = this.calculateRunway(
          modifiedCase.cashBalance,
          modifiedCase.monthlyBurnRate,
          modifiedCase.monthlyRevenue
        );

        const impact = {
          variation: variation + '%',
          value: modifiedCase[variable.key],
          runway: runway.runwayMonths,
          runwayChange: ((runway.runway - baseCase.baseRunway) / baseCase.baseRunway * 100).toFixed(1) + '%',
          cashImpact: (modifiedCase.cashBalance - baseCase.cashBalance)
        };

        impactMatrix[variable.name].push(impact);
      });

      // Calculate sensitivity score
      const sensitivityScore = this.calculateSensitivityScore(impactMatrix[variable.name]);

      results.push({
        variable: variable.name,
        sensitivity: sensitivityScore,
        criticalThreshold: this.findCriticalThreshold(baseCase, variable),
        recommendation: this.generateSensitivityRecommendation(sensitivityScore, variable.name)
      });
    });

    // Sort by sensitivity
    results.sort((a, b) => b.sensitivity - a.sensitivity);

    // Identify critical factors
    const criticalFactors = results.filter(r => r.sensitivity > 0.5);
    const moderateFactors = results.filter(r => r.sensitivity > 0.2 && r.sensitivity <= 0.5);
    const lowFactors = results.filter(r => r.sensitivity <= 0.2);

    return {
      impactMatrix,
      results,
      criticalFactors,
      moderateFactors,
      lowFactors,
      summary: {
        mostSensitive: results[0]?.variable || null,
        leastSensitive: results[results.length - 1]?.variable || null,
        riskAssessment: this.assessRisk(criticalFactors, moderateFactors)
      },
      recommendations: this.generateSensitivityActionPlan(criticalFactors)
    };
  }

  /**
   * Generate alerts based on metrics
   * @param {Object} metrics - Current financial metrics
   * @returns {Array} Prioritized alerts
   */
  generateAlerts(metrics) {
    const alerts = [];
    const { cashBalance, monthlyBurnRate, monthlyRevenue, dso, dio, dpo } = metrics;

    // Calculate runway
    const runway = this.calculateRunway(cashBalance, monthlyBurnRate, monthlyRevenue);

    // Cash runway alerts
    if (runway.runway < 3) {
      alerts.push({
        type: 'CRITICAL',
        category: 'CASH_RUNWAY',
        message: 'Less than 3 months of cash runway remaining',
        metric: runway.runwayMonths + ' months',
        action: 'Immediate fundraising or cost reduction required',
        priority: 1
      });
    } else if (runway.runway < 6) {
      alerts.push({
        type: 'WARNING',
        category: 'CASH_RUNWAY',
        message: 'Less than 6 months of cash runway',
        metric: runway.runwayMonths + ' months',
        action: 'Begin fundraising process',
        priority: 2
      });
    } else if (runway.runway < 12) {
      alerts.push({
        type: 'CAUTION',
        category: 'CASH_RUNWAY',
        message: 'Less than 12 months of cash runway',
        metric: runway.runwayMonths + ' months',
        action: 'Plan for next funding round',
        priority: 3
      });
    }

    // Burn rate alerts
    const burnRateGrowth = 0.1; // Mock 10% growth - would use historical data
    if (burnRateGrowth > 0.15) {
      alerts.push({
        type: 'WARNING',
        category: 'BURN_RATE',
        message: 'Burn rate increasing rapidly',
        metric: (burnRateGrowth * 100).toFixed(1) + '% growth',
        action: 'Review expense categories for optimization',
        priority: 2
      });
    }

    // Working capital alerts
    const benchmarks = this.getIndustryBenchmarks(this.industry, this.companySize);

    if (dso > benchmarks.dso * 1.5) {
      alerts.push({
        type: 'WARNING',
        category: 'WORKING_CAPITAL',
        message: 'DSO significantly above benchmark',
        metric: dso + ' days (benchmark: ' + benchmarks.dso + ')',
        action: 'Improve collections process',
        priority: 2
      });
    }

    if (dio > benchmarks.dio * 1.5) {
      alerts.push({
        type: 'CAUTION',
        category: 'WORKING_CAPITAL',
        message: 'DIO above industry benchmark',
        metric: dio + ' days (benchmark: ' + benchmarks.dio + ')',
        action: 'Optimize inventory levels',
        priority: 3
      });
    }

    if (dpo < benchmarks.dpo * 0.7) {
      alerts.push({
        type: 'CAUTION',
        category: 'WORKING_CAPITAL',
        message: 'DPO below industry benchmark',
        metric: dpo + ' days (benchmark: ' + benchmarks.dpo + ')',
        action: 'Negotiate better payment terms',
        priority: 3
      });
    }

    // Revenue alerts
    if (monthlyRevenue === 0) {
      alerts.push({
        type: 'WARNING',
        category: 'REVENUE',
        message: 'No revenue recorded',
        metric: '$0',
        action: 'Focus on revenue generation',
        priority: 2
      });
    }

    // Sort by priority
    alerts.sort((a, b) => a.priority - b.priority);

    return alerts;
  }

  /**
   * Get industry benchmarks
   * @param {string} industry - Industry type
   * @param {string} size - Company size
   * @returns {Object} Industry benchmarks
   */
  getIndustryBenchmarks(industry = 'manufacturing', size = 'medium') {
    const benchmarkData = INDUSTRY_BENCHMARKS[industry] || INDUSTRY_BENCHMARKS.manufacturing;
    const sizeBenchmarks = benchmarkData[size] || benchmarkData.medium;

    return {
      ...sizeBenchmarks,
      industry,
      size,
      cashConversionCycle: sizeBenchmarks.dso + sizeBenchmarks.dio - sizeBenchmarks.dpo,
      quickRatio: 1.2, // Standard benchmark
      currentRatio: 2.0, // Standard benchmark
      debtToEquity: 0.5, // Standard benchmark
      returnOnAssets: 0.08, // 8% ROA
      grossMargin: 0.35, // 35% gross margin
      operatingMargin: 0.15, // 15% operating margin
      netMargin: 0.10 // 10% net margin
    };
  }

  // ==================== Helper Methods ====================

  /**
   * Validate input parameters
   * @param {Object} inputs - Input parameters to validate
   * @returns {boolean} Validation result
   */
  validateInputs(inputs) {
    for (const [key, value] of Object.entries(inputs)) {
      if (value === null || value === undefined) {
        console.error(`Invalid input: ${key} is null or undefined`);
        return false;
      }
      if (typeof value === 'number' && isNaN(value)) {
        console.error(`Invalid input: ${key} is NaN`);
        return false;
      }
    }
    return true;
  }

  /**
   * Format currency values
   * @param {number} amount - Amount to format
   * @returns {string} Formatted currency
   */
  formatCurrency(amount) {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    return formatter.format(amount);
  }

  /**
   * Calculate trend from historical data
   * @param {Array} dataPoints - Historical data points
   * @returns {Object} Trend analysis
   */
  calculateTrend(dataPoints) {
    if (!dataPoints || dataPoints.length < 2) {
      return { direction: 'stable', percentageChange: 0, projection: 0 };
    }

    const firstValue = dataPoints[0];
    const lastValue = dataPoints[dataPoints.length - 1];
    const percentageChange = ((lastValue - firstValue) / firstValue) * 100;

    // Simple linear projection
    const avgChange = (lastValue - firstValue) / (dataPoints.length - 1);
    const projection = lastValue + avgChange;

    return {
      direction: percentageChange > 5 ? 'increasing' : percentageChange < -5 ? 'decreasing' : 'stable',
      percentageChange: percentageChange.toFixed(1),
      projection
    };
  }

  /**
   * Interpolate growth rate
   * @param {number} startValue - Starting value
   * @param {number} endValue - Ending value
   * @param {number} periods - Number of periods
   * @returns {number} Growth rate
   */
  interpolateGrowth(startValue, endValue, periods) {
    if (startValue === 0 || periods === 0) return 0;
    return Math.pow(endValue / startValue, 1 / periods) - 1;
  }

  /**
   * Generate coverage recommendation
   * @private
   */
  generateCoverageRecommendation(coveragePercentage, days) {
    if (coveragePercentage >= 100) {
      return `Full coverage for ${days} days. Consider investment opportunities.`;
    } else if (coveragePercentage >= 75) {
      return `Good coverage (${coveragePercentage.toFixed(0)}%). Monitor closely.`;
    } else if (coveragePercentage >= 50) {
      return `Moderate coverage (${coveragePercentage.toFixed(0)}%). Plan for additional funding.`;
    } else {
      return `Low coverage (${coveragePercentage.toFixed(0)}%). Immediate action required.`;
    }
  }

  /**
   * Generate burn rate recommendations
   * @private
   */
  generateBurnRateRecommendations(efficiencyRatio, netBurnRate) {
    const recommendations = [];

    if (efficiencyRatio < 0.5) {
      recommendations.push('Efficiency ratio below 50%. Focus on revenue growth.');
    }
    if (efficiencyRatio > 1.5) {
      recommendations.push('Strong efficiency ratio. Consider scaling operations.');
    }
    if (netBurnRate > 0) {
      recommendations.push('Negative cash flow. Implement cost controls.');
    }

    return recommendations;
  }

  /**
   * Calculate funding tranches
   * @private
   */
  calculateFundingTranches(totalFunding, months) {
    return [
      { tranche: 1, amount: totalFunding * 0.4, milestone: 'Product development', month: Math.floor(months * 0.25) },
      { tranche: 2, amount: totalFunding * 0.35, milestone: 'Market expansion', month: Math.floor(months * 0.5) },
      { tranche: 3, amount: totalFunding * 0.25, milestone: 'Scale operations', month: Math.floor(months * 0.75) }
    ];
  }

  /**
   * Calculate break-even month
   * @private
   */
  calculateBreakEvenMonth(projections) {
    const breakEvenMonth = projections.findIndex(p => p.netBurn <= 0);
    return breakEvenMonth === -1 ? null : breakEvenMonth + 1;
  }

  /**
   * Calculate ROI
   * @private
   */
  calculateROI(investment, returns, periods) {
    return ((returns * periods - investment) / investment) * 100;
  }

  /**
   * Generate implementation timeline
   * @private
   */
  generateImplementationTimeline(actionPlan) {
    const timeline = [];
    let cumulativeDays = 0;

    actionPlan.forEach((action, index) => {
      const days = parseInt(action.timeframe);
      cumulativeDays += days;

      timeline.push({
        phase: index + 1,
        metric: action.metric,
        startDay: cumulativeDays - days,
        endDay: cumulativeDays,
        expectedImpact: action.impact
      });
    });

    return timeline;
  }

  /**
   * Generate projection alerts
   * @private
   */
  generateProjectionAlerts(cashBalance, netCashFlow, month) {
    const alerts = [];

    if (cashBalance < 0) {
      alerts.push(`Month ${month}: Negative cash balance`);
    } else if (cashBalance < 10000) {
      alerts.push(`Month ${month}: Low cash warning`);
    }

    if (netCashFlow < -50000) {
      alerts.push(`Month ${month}: High burn rate`);
    }

    return alerts;
  }

  /**
   * Get industry unit economics
   * @private
   */
  getIndustryUnitEconomics() {
    return {
      ltvCac: 3.5,
      paybackPeriod: 14,
      churnRate: 0.05,
      retentionRate: 0.95
    };
  }

  /**
   * Calculate sensitivity score
   * @private
   */
  calculateSensitivityScore(impacts) {
    const changes = impacts.map(i => parseFloat(i.runwayChange));
    const maxChange = Math.max(...changes.map(Math.abs));
    return maxChange / 100; // Normalize to 0-1
  }

  /**
   * Find critical threshold
   * @private
   */
  findCriticalThreshold(baseCase, variable) {
    // Simplified - would do binary search in production
    return baseCase[variable.key] * 0.7; // 30% reduction as critical
  }

  /**
   * Generate sensitivity recommendation
   * @private
   */
  generateSensitivityRecommendation(score, variableName) {
    if (score > 0.5) {
      return `${variableName} is highly sensitive. Monitor closely and hedge risk.`;
    } else if (score > 0.2) {
      return `${variableName} has moderate sensitivity. Regular monitoring recommended.`;
    } else {
      return `${variableName} has low sensitivity. Standard monitoring sufficient.`;
    }
  }

  /**
   * Assess risk based on factors
   * @private
   */
  assessRisk(criticalFactors, moderateFactors) {
    if (criticalFactors.length > 3) {
      return 'HIGH RISK: Multiple critical sensitivities identified';
    } else if (criticalFactors.length > 1) {
      return 'MODERATE RISK: Some critical sensitivities';
    } else if (moderateFactors.length > 3) {
      return 'LOW-MODERATE RISK: Several moderate sensitivities';
    } else {
      return 'LOW RISK: Limited sensitivities';
    }
  }

  /**
   * Generate sensitivity action plan
   * @private
   */
  generateSensitivityActionPlan(criticalFactors) {
    return criticalFactors.map(factor => ({
      variable: factor.variable,
      action: `Implement controls and monitoring for ${factor.variable}`,
      priority: 'HIGH',
      timeline: '30 days'
    }));
  }
}

// Export as default
export default CashRunwayEngine;