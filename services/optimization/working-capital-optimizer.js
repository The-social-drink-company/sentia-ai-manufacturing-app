/**
 * Advanced Working Capital Optimization Engine
 * Enterprise-grade cash flow, inventory, and receivables optimization
 */

import { logInfo, logWarn, logError } from '../observability/structuredLogger.js';

export class WorkingCapitalOptimizer {
  constructor(options = {}) {
    this.config = {
      targetDSO: options.targetDSO || 45, // Days Sales Outstanding
      targetDIO: options.targetDIO || 60, // Days Inventory Outstanding
      targetDPO: options.targetDPO || 30, // Days Payable Outstanding
      cashReserveRatio: options.cashReserveRatio || 0.1, // 10% of revenue
      optimizationHorizon: options.optimizationHorizon || 90, // days
      riskTolerance: options.riskTolerance || 'moderate', // conservative, moderate, aggressive
      ...options
    };
    
    this.optimizationStrategies = new Map();
    this.performanceMetrics = new Map();
    this.alertThresholds = this.setupAlertThresholds();
  }

  /**
   * Comprehensive working capital analysis and optimization
   */
  async optimizeWorkingCapital(companyData) {
    try {
      logInfo('Starting working capital optimization', { companyId: companyData.companyId });
      
      // Analyze current state
      const currentState = await this.analyzeCurrentState(companyData);
      
      // Identify optimization opportunities
      const opportunities = await this.identifyOpportunities(currentState);
      
      // Generate optimization strategies
      const strategies = await this.generateOptimizationStrategies(opportunities, currentState);
      
      // Calculate projected impact
      const projectedImpact = await this.calculateProjectedImpact(strategies, currentState);
      
      // Create action plan
      const actionPlan = await this.createActionPlan(strategies, projectedImpact);
      
      // Generate monitoring framework
      const monitoring = await this.createMonitoringFramework(actionPlan);
      
      return {
        companyId: companyData.companyId,
        analysisDate: new Date().toISOString(),
        currentState,
        opportunities,
        strategies,
        projectedImpact,
        actionPlan,
        monitoring,
        executiveSummary: this.generateExecutiveSummary(currentState, projectedImpact)
      };
      
    } catch (error) {
      logError('Working capital optimization failed', { 
        companyId: companyData.companyId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Analyze current working capital state
   */
  async analyzeCurrentState(companyData) {
    const financials = companyData.financials || {};
    const inventory = companyData.inventory || {};
    const receivables = companyData.receivables || {};
    const payables = companyData.payables || {};
    
    // Calculate key metrics
    const currentDSO = this.calculateDSO(receivables, financials.revenue);
    const currentDIO = this.calculateDIO(inventory, financials.cogs);
    const currentDPO = this.calculateDPO(payables, financials.cogs);
    const cashConversionCycle = currentDSO + currentDIO - currentDPO;
    
    // Calculate working capital components
    const workingCapital = {
      current: financials.currentAssets - financials.currentLiabilities,
      optimal: this.calculateOptimalWorkingCapital(financials),
      variance: 0
    };
    workingCapital.variance = workingCapital.current - workingCapital.optimal;
    
    // Analyze cash position
    const cashAnalysis = this.analyzeCashPosition(financials, companyData.cashFlow);
    
    // Assess liquidity ratios
    const liquidityRatios = this.calculateLiquidityRatios(financials);
    
    // Evaluate efficiency metrics
    const efficiencyMetrics = this.calculateEfficiencyMetrics(companyData);
    
    return {
      dso: { current: currentDSO, target: this.config.targetDSO, variance: currentDSO - this.config.targetDSO },
      dio: { current: currentDIO, target: this.config.targetDIO, variance: currentDIO - this.config.targetDIO },
      dpo: { current: currentDPO, target: this.config.targetDPO, variance: currentDPO - this.config.targetDPO },
      cashConversionCycle: { 
        current: cashConversionCycle, 
        optimal: this.config.targetDSO + this.config.targetDIO - this.config.targetDPO,
        variance: cashConversionCycle - (this.config.targetDSO + this.config.targetDIO - this.config.targetDPO)
      },
      workingCapital,
      cashAnalysis,
      liquidityRatios,
      efficiencyMetrics,
      riskAssessment: this.assessWorkingCapitalRisks(companyData)
    };
  }

  /**
   * Identify optimization opportunities
   */
  async identifyOpportunities(currentState) {
    const opportunities = [];
    
    // DSO Optimization Opportunities
    if (currentState.dso.variance > 5) {
      opportunities.push({
        type: 'receivables',
        category: 'DSO Reduction',
        currentValue: currentState.dso.current,
        targetValue: this.config.targetDSO,
        potentialImpact: this.calculateDSOImpact(currentState.dso.variance),
        difficulty: 'moderate',
        timeframe: '30-60 days',
        strategies: [
          'Implement automated invoicing',
          'Offer early payment discounts',
          'Improve credit screening',
          'Use collection agencies for overdue accounts'
        ]
      });
    }
    
    // DIO Optimization Opportunities
    if (currentState.dio.variance > 10) {
      opportunities.push({
        type: 'inventory',
        category: 'Inventory Optimization',
        currentValue: currentState.dio.current,
        targetValue: this.config.targetDIO,
        potentialImpact: this.calculateDIOImpact(currentState.dio.variance),
        difficulty: 'high',
        timeframe: '60-90 days',
        strategies: [
          'Implement just-in-time inventory',
          'Improve demand forecasting',
          'Optimize safety stock levels',
          'Liquidate slow-moving inventory'
        ]
      });
    }
    
    // DPO Optimization Opportunities
    if (currentState.dpo.variance < -5) {
      opportunities.push({
        type: 'payables',
        category: 'Payment Terms Extension',
        currentValue: currentState.dpo.current,
        targetValue: this.config.targetDPO,
        potentialImpact: this.calculateDPOImpact(Math.abs(currentState.dpo.variance)),
        difficulty: 'low',
        timeframe: '15-30 days',
        strategies: [
          'Negotiate extended payment terms',
          'Take advantage of vendor financing',
          'Optimize payment timing',
          'Consolidate suppliers for better terms'
        ]
      });
    }
    
    // Cash Flow Opportunities
    if (currentState.cashAnalysis.utilizationRate < 0.8) {
      opportunities.push({
        type: 'cash_management',
        category: 'Cash Utilization',
        currentValue: currentState.cashAnalysis.utilizationRate,
        targetValue: 0.9,
        potentialImpact: this.calculateCashUtilizationImpact(currentState.cashAnalysis),
        difficulty: 'low',
        timeframe: '7-14 days',
        strategies: [
          'Invest excess cash in short-term securities',
          'Pay down high-interest debt',
          'Accelerate capital investments',
          'Increase dividend payments'
        ]
      });
    }
    
    return opportunities.sort((a, b) => b.potentialImpact.value - a.potentialImpact.value);
  }

  /**
   * Generate optimization strategies
   */
  async generateOptimizationStrategies(opportunities, currentState) {
    const strategies = [];
    
    for (const opportunity of opportunities) {
      const strategy = await this.createOptimizationStrategy(opportunity, currentState);
      strategies.push(strategy);
    }
    
    // Add composite strategies that combine multiple opportunities
    const compositeStrategies = await this.createCompositeStrategies(opportunities, currentState);
    strategies.push(...compositeStrategies);
    
    return strategies;
  }

  /**
   * Create individual optimization strategy
   */
  async createOptimizationStrategy(opportunity, currentState) {
    const strategy = {
      id: `strategy_${opportunity.type}_${Date.now()}`,
      name: opportunity.category,
      type: opportunity.type,
      priority: this.calculatePriority(opportunity),
      phases: [],
      resources: {
        financial: 0,
        human: 0,
        time: opportunity.timeframe
      },
      risks: [],
      kpis: []
    };
    
    // Create implementation phases
    switch (opportunity.type) {
      case 'receivables':
        strategy.phases = await this.createReceivablesOptimizationPhases(opportunity, currentState);
        break;
      case 'inventory':
        strategy.phases = await this.createInventoryOptimizationPhases(opportunity, currentState);
        break;
      case 'payables':
        strategy.phases = await this.createPayablesOptimizationPhases(opportunity, currentState);
        break;
      case 'cash_management':
        strategy.phases = await this.createCashManagementPhases(opportunity, currentState);
        break;
    }
    
    // Define success metrics
    strategy.kpis = this.defineStrategyKPIs(opportunity.type);
    
    // Identify implementation risks
    strategy.risks = this.identifyImplementationRisks(opportunity, currentState);
    
    return strategy;
  }

  /**
   * Create receivables optimization phases
   */
  async createReceivablesOptimizationPhases(opportunity, currentState) {
    return [
      {
        phase: 1,
        name: 'Assessment and Setup',
        duration: 14,
        actions: [
          'Analyze current receivables aging',
          'Identify problematic customers',
          'Setup automated invoicing system',
          'Establish collection procedures'
        ],
        deliverables: ['Receivables analysis report', 'Automated invoicing system'],
        success_criteria: 'System operational, baseline established'
      },
      {
        phase: 2,
        name: 'Process Implementation',
        duration: 30,
        actions: [
          'Implement early payment discounts (2/10 net 30)',
          'Start automated follow-up sequences',
          'Negotiate payment plans for overdue accounts',
          'Improve credit approval process'
        ],
        deliverables: ['New collection process', 'Payment discount program'],
        success_criteria: '15% reduction in overdue accounts'
      },
      {
        phase: 3,
        name: 'Optimization and Monitoring',
        duration: 30,
        actions: [
          'Monitor DSO improvements',
          'Adjust discount rates based on uptake',
          'Implement factoring for large receivables',
          'Regular customer credit reviews'
        ],
        deliverables: ['DSO monitoring dashboard', 'Credit policy updates'],
        success_criteria: `Target DSO of ${this.config.targetDSO} days achieved`
      }
    ];
  }

  /**
   * Create inventory optimization phases
   */
  async createInventoryOptimizationPhases(opportunity, currentState) {
    return [
      {
        phase: 1,
        name: 'Inventory Analysis',
        duration: 21,
        actions: [
          'Conduct ABC analysis of inventory',
          'Identify slow-moving and obsolete stock',
          'Analyze demand patterns and seasonality',
          'Review supplier lead times and reliability'
        ],
        deliverables: ['Inventory classification report', 'Demand analysis'],
        success_criteria: 'Complete inventory categorization'
      },
      {
        phase: 2,
        name: 'Process Redesign',
        duration: 45,
        actions: [
          'Implement just-in-time for A-items',
          'Establish safety stock formulas',
          'Setup automated reorder points',
          'Liquidate obsolete inventory'
        ],
        deliverables: ['JIT system', 'Inventory management policies'],
        success_criteria: '25% reduction in slow-moving inventory'
      },
      {
        phase: 3,
        name: 'Continuous Improvement',
        duration: 30,
        actions: [
          'Monitor inventory turnover rates',
          'Adjust safety stock levels',
          'Implement vendor-managed inventory for key suppliers',
          'Regular inventory optimization reviews'
        ],
        deliverables: ['Turnover monitoring system', 'VMI agreements'],
        success_criteria: `Target DIO of ${this.config.targetDIO} days achieved`
      }
    ];
  }

  /**
   * Calculate projected impact of strategies
   */
  async calculateProjectedImpact(strategies, currentState) {
    const impact = {
      cashFlow: { monthly: 0, annual: 0 },
      workingCapital: { reduction: 0, percentage: 0 },
      roi: { percentage: 0, paybackPeriod: 0 },
      riskAdjusted: { cashFlow: 0, workingCapital: 0 },
      timeline: { quick: [], medium: [], long: [] }
    };
    
    for (const strategy of strategies) {
      const strategyImpact = await this.calculateStrategyImpact(strategy, currentState);
      
      // Aggregate impacts
      impact.cashFlow.monthly += strategyImpact.cashFlow.monthly;
      impact.cashFlow.annual += strategyImpact.cashFlow.annual;
      impact.workingCapital.reduction += strategyImpact.workingCapital.reduction;
      
      // Categorize by timeline
      const totalDuration = strategy.phases.reduce((sum, phase) => sum + phase.duration, 0);
      if (totalDuration <= 30) {
        impact.timeline.quick.push(strategy.id);
      } else if (totalDuration <= 90) {
        impact.timeline.medium.push(strategy.id);
      } else {
        impact.timeline.long.push(strategy.id);
      }
    }
    
    // Calculate percentages and ROI
    impact.workingCapital.percentage = (impact.workingCapital.reduction / currentState.workingCapital.current) * 100;
    impact.roi.percentage = (impact.cashFlow.annual / this.calculateImplementationCost(strategies)) * 100;
    impact.roi.paybackPeriod = this.calculateImplementationCost(strategies) / impact.cashFlow.monthly;
    
    // Risk-adjust the projections
    impact.riskAdjusted.cashFlow = impact.cashFlow.annual * this.getRiskAdjustmentFactor();
    impact.riskAdjusted.workingCapital = impact.workingCapital.reduction * this.getRiskAdjustmentFactor();
    
    return impact;
  }

  /**
   * Create comprehensive action plan
   */
  async createActionPlan(strategies, projectedImpact) {
    // Prioritize strategies based on impact and difficulty
    const prioritizedStrategies = strategies.sort((a, b) => {
      return (b.priority.score * projectedImpact.roi.percentage) - (a.priority.score * projectedImpact.roi.percentage);
    });
    
    const actionPlan = {
      overview: {
        totalStrategies: strategies.length,
        estimatedDuration: Math.max(...strategies.map(s => s.phases.reduce((sum, p) => sum + p.duration, 0))),
        estimatedInvestment: this.calculateImplementationCost(strategies),
        expectedROI: projectedImpact.roi.percentage
      },
      phases: this.createMasterImplementationPlan(prioritizedStrategies),
      resources: this.calculateResourceRequirements(prioritizedStrategies),
      milestones: this.defineMilestones(prioritizedStrategies, projectedImpact),
      riskMitigation: this.createRiskMitigationPlan(strategies),
      governanceStructure: this.defineGovernanceStructure()
    };
    
    return actionPlan;
  }

  /**
   * Create monitoring framework
   */
  async createMonitoringFramework(actionPlan) {
    return {
      kpis: {
        primary: [
          { metric: 'DSO', target: this.config.targetDSO, frequency: 'weekly' },
          { metric: 'DIO', target: this.config.targetDIO, frequency: 'weekly' },
          { metric: 'DPO', target: this.config.targetDPO, frequency: 'weekly' },
          { metric: 'Cash Conversion Cycle', target: this.config.targetDSO + this.config.targetDIO - this.config.targetDPO, frequency: 'weekly' }
        ],
        secondary: [
          { metric: 'Working Capital Ratio', target: 1.5, frequency: 'monthly' },
          { metric: 'Cash Flow from Operations', target: 'positive', frequency: 'monthly' },
          { metric: 'Inventory Turnover', target: 6, frequency: 'monthly' }
        ]
      },
      dashboards: [
        {
          name: 'Executive Working Capital Dashboard',
          audience: 'C-Suite',
          frequency: 'daily',
          metrics: ['Cash Position', 'Working Capital Trend', 'Key Ratios', 'Action Plan Progress']
        },
        {
          name: 'Operational Working Capital Dashboard',
          audience: 'Finance Team',
          frequency: 'real-time',
          metrics: ['DSO Trend', 'Collection Performance', 'Inventory Levels', 'Payment Schedule']
        }
      ],
      alerts: this.setupWorkingCapitalAlerts(),
      reporting: {
        weekly: 'Working Capital Performance Report',
        monthly: 'Working Capital Optimization Progress',
        quarterly: 'Strategic Working Capital Review'
      }
    };
  }

  /**
   * Generate executive summary
   */
  generateExecutiveSummary(currentState, projectedImpact) {
    const summary = {
      currentPerformance: {
        dso: `${currentState.dso.current} days (target: ${this.config.targetDSO})`,
        dio: `${currentState.dio.current} days (target: ${this.config.targetDIO})`,
        dpo: `${currentState.dpo.current} days (target: ${this.config.targetDPO})`,
        ccc: `${currentState.cashConversionCycle.current} days`,
        workingCapital: `$${(currentState.workingCapital.current / 1000000).toFixed(1)}M`
      },
      optimizationOpportunity: {
        cashFlowImprovement: `$${(projectedImpact.cashFlow.annual / 1000000).toFixed(1)}M annually`,
        workingCapitalReduction: `$${(projectedImpact.workingCapital.reduction / 1000000).toFixed(1)}M (${projectedImpact.workingCapital.percentage.toFixed(1)}%)`,
        roi: `${projectedImpact.roi.percentage.toFixed(0)}%`,
        paybackPeriod: `${projectedImpact.roi.paybackPeriod.toFixed(1)} months`
      },
      keyRecommendations: [
        currentState.dso.variance > 5 ? 'Focus on receivables management to reduce DSO' : null,
        currentState.dio.variance > 10 ? 'Implement inventory optimization to reduce carrying costs' : null,
        currentState.dpo.variance < -5 ? 'Negotiate extended payment terms with suppliers' : null
      ].filter(Boolean),
      implementationPriority: projectedImpact.timeline.quick.length > 0 ? 'Start with quick wins (30-day implementations)' : 'Focus on medium-term improvements',
      riskLevel: this.assessOverallRisk(currentState)
    };
    
    return summary;
  }

  // Helper methods for calculations
  calculateDSO(receivables, revenue) {
    return receivables.total && revenue ? (receivables.total / (revenue / 365)) : 0;
  }

  calculateDIO(inventory, cogs) {
    return inventory.total && cogs ? (inventory.total / (cogs / 365)) : 0;
  }

  calculateDPO(payables, cogs) {
    return payables.total && cogs ? (payables.total / (cogs / 365)) : 0;
  }

  calculateOptimalWorkingCapital(financials) {
    // Optimal working capital as percentage of revenue
    return financials.revenue * 0.15; // 15% of revenue as baseline
  }

  analyzeCashPosition(financials, cashFlow) {
    const currentCash = financials.cash || 0;
    const monthlyBurn = cashFlow?.monthlyAverage || 0;
    const runway = monthlyBurn > 0 ? currentCash / monthlyBurn : Infinity;
    
    return {
      current: currentCash,
      runway: runway,
      utilizationRate: Math.min(currentCash / (financials.revenue * 0.1), 1),
      riskLevel: runway < 3 ? 'high' : runway < 6 ? 'medium' : 'low'
    };
  }

  calculateLiquidityRatios(financials) {
    return {
      current: financials.currentAssets / financials.currentLiabilities,
      quick: (financials.currentAssets - financials.inventory) / financials.currentLiabilities,
      cash: financials.cash / financials.currentLiabilities
    };
  }

  setupAlertThresholds() {
    return {
      dso: { warning: this.config.targetDSO * 1.1, critical: this.config.targetDSO * 1.2 },
      dio: { warning: this.config.targetDIO * 1.15, critical: this.config.targetDIO * 1.3 },
      dpo: { warning: this.config.targetDPO * 0.9, critical: this.config.targetDPO * 0.8 },
      cashFlow: { warning: -100000, critical: -500000 }
    };
  }

  getRiskAdjustmentFactor() {
    const factors = {
      conservative: 0.8,
      moderate: 0.9,
      aggressive: 1.0
    };
    return factors[this.config.riskTolerance] || 0.9;
  }
}

export default WorkingCapitalOptimizer;