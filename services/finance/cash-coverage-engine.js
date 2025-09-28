import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { logInfo, logError, logWarn } from '../observability/structuredLogger.js';

/**
 * Enterprise Cash Coverage Analysis Engine
 * Fortune 500-level financial modeling for Sentia Spirits
 * Core capability: Answer "How much cash do I need for X days?"
 */
export class EnterpriseCashCoverageEngine {
  constructor() {
    this.prisma = new PrismaClient();
    this.benchmarkCache = new Map();
    this.simulationCache = new Map();
  }

  /**
   * CORE VALUE PROPOSITION #1: Cash Coverage Analysis
   * Answers: "How much cash do I need to cover expenses for 30/60/90/120/180 days?"
   */
  async calculateCashCoverage(companyData, options = {}) {
    try {
      logInfo('Starting enterprise cash coverage analysis', {
        company: companyData.companyName,
        periods: options.periods || [30, 60, 90, 120, 180]
      });

      // Pull REAL data from accounting systems
      const realTimeData = await this.fetchRealTimeFinancials(companyData);

      if (!realTimeData || !realTimeData.cashOnHand) {
        throw new Error('Unable to fetch real-time financial data');
      }

      const analysis = {
        timestamp: new Date().toISOString(),
        currentCash: realTimeData.cashOnHand,
        bankBalances: realTimeData.bankAccounts,
        coverage: {},
        recommendations: [],
        alerts: [],
        confidence: 0,
        dataQuality: this.assessDataQuality(realTimeData)
      };

      // Calculate coverage for each period
      const periods = options.periods || [30, 60, 90, 120, 180];

      for (const days of periods) {
        const coverage = await this.calculatePeriodCoverage(
          realTimeData,
          days,
          companyData,
          options
        );

        analysis.coverage[`day_${days}`] = {
          requiredCash: coverage.required,
          availableCash: coverage.available,
          shortfall: coverage.shortfall,
          surplusCash: coverage.surplus,
          coverageRatio: coverage.ratio,
          probability: coverage.probability,
          scenarios: coverage.scenarios,
          actionRequired: coverage.shortfall > 0,
          recommendations: coverage.recommendations
        };
      }

      // AI-powered recommendations
      analysis.recommendations = await this.generateAIRecommendations(analysis, companyData);
      analysis.alerts = this.generateExecutiveAlerts(analysis);
      analysis.confidence = this.calculateConfidenceScore(analysis, realTimeData);

      // Store analysis for historical tracking
      await this.storeAnalysis(analysis, companyData);

      logInfo('Cash coverage analysis completed', {
        company: companyData.companyName,
        confidence: analysis.confidence
      });

      return analysis;
    } catch (error) {
      logError('Cash coverage analysis failed', error);
      throw error;
    }
  }

  async calculatePeriodCoverage(financials, days, companyData, options = {}) {
    try {
      // Enterprise-level calculation with multiple data sources

      // 1. Historical Cash Flow Analysis
      const historicalCashFlow = await this.getHistoricalCashFlow(companyData, days);

      // 2. Accounts Receivable Predictions (Real DSO data)
      const expectedReceivables = await this.predictReceivables(
        financials.currentDebtors,
        companyData.dso || financials.averageDSO,
        days
      );

      // 3. Accounts Payable Obligations (Real DPO data)
      const payableObligations = await this.calculatePayables(
        financials.currentCreditors,
        companyData.dpo || financials.averageDPO,
        days
      );

      // 4. Operating Expenses Projection with seasonality
      const operatingExpenses = await this.projectOperatingExpenses(
        financials.monthlyExpenses,
        days,
        companyData.growthRate || 0,
        companyData.seasonality
      );

      // 5. Revenue Predictions with ML
      const predictedRevenue = await this.predictRevenue(
        financials.historicalRevenue,
        days,
        companyData
      );

      // 6. Working Capital Requirements
      const workingCapitalNeeds = this.calculateWorkingCapitalRequirement(
        predictedRevenue,
        companyData.dso || financials.averageDSO,
        companyData.dpo || financials.averageDPO,
        companyData.inventoryTurns || 12
      );

      // 7. Tax and regulatory obligations
      const taxObligations = await this.calculateTaxObligations(
        financials,
        days,
        companyData
      );

      // 8. Debt service requirements
      const debtService = await this.calculateDebtService(
        financials.debtSchedule,
        days
      );

      // Monte Carlo Simulation for uncertainty
      const scenarios = await this.runMonteCarloSimulation({
        receivables: expectedReceivables,
        payables: payableObligations,
        expenses: operatingExpenses,
        revenue: predictedRevenue,
        workingCapital: workingCapitalNeeds,
        taxes: taxObligations,
        debtService: debtService,
        iterations: options.simulationIterations || 10000,
        confidenceLevel: options.confidenceLevel || 0.95
      });

      const totalRequired = operatingExpenses + payableObligations +
                          workingCapitalNeeds + taxObligations + debtService;
      const totalAvailable = financials.cashOnHand + expectedReceivables + predictedRevenue;
      const shortfall = Math.max(0, totalRequired - totalAvailable);
      const surplus = Math.max(0, totalAvailable - totalRequired);

      return {
        required: totalRequired,
        available: totalAvailable,
        shortfall: shortfall,
        surplus: surplus,
        ratio: totalAvailable / totalRequired,
        probability: this.calculateProbabilityOfShortfall(scenarios),
        scenarios: this.summarizeScenarios(scenarios),
        recommendations: this.generatePeriodRecommendations(shortfall, surplus, days),
        breakdown: {
          operatingExpenses,
          payableObligations,
          workingCapitalNeeds,
          taxObligations,
          debtService,
          expectedReceivables,
          predictedRevenue
        }
      };
    } catch (error) {
      logError('Period coverage calculation failed', error);
      throw error;
    }
  }

  /**
   * CORE VALUE PROPOSITION #2: Cash Injection Requirements
   * Calculate exactly how much cash injection is needed and when
   */
  async calculateCashInjectionNeeds(companyData, scenario = 'sustain') {
    try {
      logInfo('Calculating cash injection requirements', {
        company: companyData.companyName,
        scenario
      });

      const financials = await this.fetchRealTimeFinancials(companyData);

      const injectionAnalysis = {
        scenario,
        immediateNeed: 0,
        optimalAmount: 0,
        criticalDate: null,
        sources: [],
        timeline: [],
        roi: 0,
        paybackPeriod: 0,
        riskScore: 0
      };

      // Different scenarios require different calculations
      switch(scenario) {
        case 'sustain':
          // Minimum cash to maintain operations
          injectionAnalysis.immediateNeed = await this.calculateSurvivalCash(companyData, financials);
          injectionAnalysis.optimalAmount = injectionAnalysis.immediateNeed * 1.3; // 30% safety buffer
          injectionAnalysis.criticalDate = this.calculateCashRunoutDate(financials, companyData);
          break;

        case 'growth':
          // Capital for planned growth
          const growthRequirements = await this.calculateGrowthCapital(
            companyData.targetGrowthRate || 20,
            companyData,
            financials
          );
          injectionAnalysis.immediateNeed = growthRequirements.upfrontCapital;
          injectionAnalysis.optimalAmount = growthRequirements.totalCapital;
          injectionAnalysis.roi = growthRequirements.expectedROI;
          injectionAnalysis.paybackPeriod = growthRequirements.paybackMonths;
          break;

        case 'aggressive':
          // Aggressive expansion capital
          const aggressiveRequirements = await this.calculateAggressiveExpansion(companyData, financials);
          injectionAnalysis.immediateNeed = aggressiveRequirements.immediate;
          injectionAnalysis.optimalAmount = aggressiveRequirements.total;
          injectionAnalysis.roi = aggressiveRequirements.projectedROI;
          injectionAnalysis.paybackPeriod = aggressiveRequirements.paybackMonths;
          injectionAnalysis.riskScore = aggressiveRequirements.riskScore;
          break;

        case 'turnaround':
          // Turnaround/restructuring capital
          const turnaroundRequirements = await this.calculateTurnaroundCapital(companyData, financials);
          injectionAnalysis.immediateNeed = turnaroundRequirements.immediate;
          injectionAnalysis.optimalAmount = turnaroundRequirements.total;
          injectionAnalysis.criticalDate = turnaroundRequirements.deadline;
          injectionAnalysis.riskScore = turnaroundRequirements.riskScore;
          break;
      }

      // Identify and rank funding sources by cost of capital
      injectionAnalysis.sources = await this.rankFundingSources(
        injectionAnalysis.optimalAmount,
        companyData,
        financials
      );

      // Create detailed funding timeline
      injectionAnalysis.timeline = this.generateFundingTimeline(
        injectionAnalysis.immediateNeed,
        injectionAnalysis.optimalAmount,
        financials.burnRate || this.calculateBurnRate(financials),
        injectionAnalysis.criticalDate
      );

      // Calculate weighted average cost of capital
      injectionAnalysis.wacc = this.calculateWACC(injectionAnalysis.sources, companyData);

      // Store analysis
      await this.storeInjectionAnalysis(injectionAnalysis, companyData);

      return injectionAnalysis;
    } catch (error) {
      logError('Cash injection calculation failed', error);
      throw error;
    }
  }

  /**
   * CORE VALUE PROPOSITION #3: Growth Funding Calculator
   * Calculate exact funding needed for specific growth targets
   */
  async calculateGrowthFunding(targetGrowthPercent, companyData, timeframMonths = 12) {
    try {
      logInfo('Calculating growth funding requirements', {
        company: companyData.companyName,
        targetGrowth: targetGrowthPercent,
        timeframe: timeframMonths
      });

      const financials = await this.fetchRealTimeFinancials(companyData);

      const growthAnalysis = {
        targetGrowthPercent,
        timeframeMonths: timeframMonths,
        currentRevenue: financials.currentRevenue,
        targetRevenue: 0,
        requiredCapital: 0,
        workingCapitalIncrease: 0,
        capexRequirements: 0,
        additionalOpex: 0,
        additionalHeadcount: 0,
        fundingMix: {},
        milestones: [],
        risks: [],
        successProbability: 0
      };

      // Calculate target revenue
      growthAnalysis.targetRevenue = financials.currentRevenue * (1 + targetGrowthPercent / 100);

      // Working Capital increase needed for growth
      const additionalRevenue = growthAnalysis.targetRevenue - financials.currentRevenue;
      growthAnalysis.workingCapitalIncrease = await this.calculateIncrementalWorkingCapital(
        additionalRevenue,
        companyData.dso || financials.averageDSO,
        companyData.dpo || financials.averageDPO,
        companyData.dio || financials.averageDIO
      );

      // Industry-specific growth requirements
      const industryGrowthModel = await this.getIndustryGrowthModel(
        companyData.industry,
        financials.currentRevenue
      );

      // CAPEX requirements based on industry benchmarks
      growthAnalysis.capexRequirements = additionalRevenue * industryGrowthModel.capexToRevenueRatio;

      // Additional operating expenses
      growthAnalysis.additionalOpex = this.calculateAdditionalOpex(
        additionalRevenue,
        industryGrowthModel,
        companyData
      );

      // Headcount and personnel costs
      const headcountNeeds = this.calculateHeadcountRequirements(
        additionalRevenue,
        industryGrowthModel.revenuePerEmployee,
        companyData
      );
      growthAnalysis.additionalHeadcount = headcountNeeds.count;

      // Total capital requirements
      growthAnalysis.requiredCapital =
        growthAnalysis.workingCapitalIncrease +
        growthAnalysis.capexRequirements +
        growthAnalysis.additionalOpex +
        headcountNeeds.totalCost;

      // Optimal funding mix based on company profile
      growthAnalysis.fundingMix = await this.optimizeFundingMix(
        growthAnalysis.requiredCapital,
        companyData,
        financials
      );

      // Growth milestones with KPIs
      growthAnalysis.milestones = this.generateGrowthMilestones(
        financials.currentRevenue,
        growthAnalysis.targetRevenue,
        timeframMonths,
        growthAnalysis.requiredCapital
      );

      // Risk assessment with mitigation strategies
      growthAnalysis.risks = await this.assessGrowthRisks(
        targetGrowthPercent,
        companyData,
        industryGrowthModel,
        financials
      );

      // Success probability using ML models
      growthAnalysis.successProbability = await this.predictGrowthSuccess(
        growthAnalysis,
        companyData,
        industryGrowthModel
      );

      // Store analysis
      await this.storeGrowthAnalysis(growthAnalysis, companyData);

      return growthAnalysis;
    } catch (error) {
      logError('Growth funding calculation failed', error);
      throw error;
    }
  }

  /**
   * Industry Benchmarking with real data
   */
  async getIndustryBenchmarks(industry, revenue, region = 'US', isListed = false) {
    try {
      // Check cache first
      const cacheKey = `${industry}-${revenue}-${region}-${isListed}`;
      if (this.benchmarkCache.has(cacheKey)) {
        const cached = this.benchmarkCache.get(cacheKey);
        if (cached.timestamp > Date.now() - 86400000) { // 24 hour cache
          return cached.data;
        }
      }

      // Query real benchmark data from multiple sources
      const benchmarkPromises = [
        this.fetchDatabaseBenchmarks(industry, revenue, region, isListed),
        this.fetchAPIBenchmarks(industry, revenue, region),
        this.queryAIForBenchmarks(industry, revenue, region, isListed)
      ];

      const benchmarkSources = await Promise.allSettled(benchmarkPromises);

      // Consolidate successful responses
      const validSources = benchmarkSources
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);

      if (validSources.length === 0) {
        throw new Error('Unable to fetch industry benchmarks');
      }

      const benchmarks = this.consolidateBenchmarks(validSources);

      // Cache results
      this.benchmarkCache.set(cacheKey, {
        data: benchmarks,
        timestamp: Date.now()
      });

      return benchmarks;
    } catch (error) {
      logError('Industry benchmark fetch failed', error);
      // Return conservative defaults if benchmarks unavailable
      return this.getDefaultBenchmarks(industry);
    }
  }

  /**
   * Advanced Working Capital Optimization
   */
  async optimizeWorkingCapital(currentMetrics, companyData) {
    try {
      const optimization = {
        currentCCC: currentMetrics.dso + (currentMetrics.dio || 0) - currentMetrics.dpo,
        optimalCCC: 0,
        improvements: {},
        cashImpact: 0,
        implementationPlan: [],
        timeToImplement: 0,
        investmentRequired: 0
      };

      // Get industry best practices
      const benchmarks = await this.getIndustryBenchmarks(
        companyData.industry,
        currentMetrics.revenue,
        companyData.region
      );

      // DSO Optimization
      optimization.improvements.dso = {
        current: currentMetrics.dso,
        target: Math.min(currentMetrics.dso, benchmarks.topQuartileDSO),
        improvement: currentMetrics.dso - Math.min(currentMetrics.dso, benchmarks.topQuartileDSO),
        cashImpact: this.calculateDSOImpact(
          currentMetrics.dso,
          benchmarks.topQuartileDSO,
          currentMetrics.revenue
        ),
        actions: await this.generateDSOActions(currentMetrics, benchmarks),
        timeframe: 90, // days
        difficulty: this.assessImplementationDifficulty('dso', currentMetrics, benchmarks)
      };

      // DPO Optimization (extend payment terms)
      optimization.improvements.dpo = {
        current: currentMetrics.dpo,
        target: Math.max(currentMetrics.dpo, benchmarks.topQuartileDPO),
        improvement: Math.max(currentMetrics.dpo, benchmarks.topQuartileDPO) - currentMetrics.dpo,
        cashImpact: this.calculateDPOImpact(
          currentMetrics.dpo,
          benchmarks.topQuartileDPO,
          currentMetrics.revenue
        ),
        actions: await this.generateDPOActions(currentMetrics, benchmarks),
        timeframe: 60, // days
        difficulty: this.assessImplementationDifficulty('dpo', currentMetrics, benchmarks)
      };

      // DIO Optimization (if applicable)
      if (currentMetrics.dio && currentMetrics.dio > 0) {
        optimization.improvements.dio = {
          current: currentMetrics.dio,
          target: Math.min(currentMetrics.dio, benchmarks.topQuartileDIO),
          improvement: currentMetrics.dio - Math.min(currentMetrics.dio, benchmarks.topQuartileDIO),
          cashImpact: this.calculateDIOImpact(
            currentMetrics.dio,
            benchmarks.topQuartileDIO,
            currentMetrics.revenue,
            currentMetrics.cogs
          ),
          actions: await this.generateDIOActions(currentMetrics, benchmarks),
          timeframe: 120, // days
          difficulty: this.assessImplementationDifficulty('dio', currentMetrics, benchmarks)
        };
      }

      // Calculate total cash impact
      optimization.cashImpact =
        (optimization.improvements.dso?.cashImpact || 0) +
        (optimization.improvements.dpo?.cashImpact || 0) +
        (optimization.improvements.dio?.cashImpact || 0);

      // Calculate optimal CCC
      optimization.optimalCCC =
        (optimization.improvements.dso?.target || currentMetrics.dso) +
        (optimization.improvements.dio?.target || currentMetrics.dio || 0) -
        (optimization.improvements.dpo?.target || currentMetrics.dpo);

      // Generate implementation roadmap
      optimization.implementationPlan = await this.createImplementationRoadmap(
        optimization,
        companyData
      );

      // Calculate investment and time requirements
      optimization.investmentRequired = this.calculateImplementationInvestment(optimization);
      optimization.timeToImplement = this.calculateImplementationTime(optimization);

      // ROI calculation
      optimization.roi = (optimization.cashImpact / optimization.investmentRequired) * 100;

      return optimization;
    } catch (error) {
      logError('Working capital optimization failed', error);
      throw error;
    }
  }

  /**
   * Executive Decision Support System
   */
  async generateExecutiveInsights(companyData) {
    try {
      const financials = await this.fetchRealTimeFinancials(companyData);

      const insights = {
        timestamp: new Date().toISOString(),
        criticalMetrics: {},
        decisions: [],
        opportunities: [],
        risks: [],
        recommendations: [],
        alerts: []
      };

      // Critical metrics for C-suite
      insights.criticalMetrics = {
        cashRunway: await this.calculateCashRunway(financials, companyData),
        burnRate: this.calculateBurnRate(financials),
        workingCapitalEfficiency: await this.assessWorkingCapitalEfficiency(financials, companyData),
        growthReadiness: await this.assessGrowthReadiness(financials, companyData),
        financialHealth: await this.calculateFinancialHealthScore(financials, companyData),
        liquidityRatio: this.calculateLiquidityRatios(financials),
        debtCoverage: this.calculateDebtCoverage(financials)
      };

      // Key decisions needed with urgency scores
      insights.decisions = await this.identifyKeyDecisions(
        insights.criticalMetrics,
        financials,
        companyData
      );

      // Opportunities with quantified impact
      insights.opportunities = await this.identifyOpportunities(
        financials,
        companyData,
        insights.criticalMetrics
      );

      // Risk assessment with probability and impact
      insights.risks = await this.performRiskAssessment(
        financials,
        companyData,
        insights.criticalMetrics
      );

      // AI-generated strategic recommendations
      insights.recommendations = await this.generateStrategicRecommendations(
        insights,
        financials,
        companyData
      );

      // Critical alerts
      insights.alerts = this.generateCriticalAlerts(
        insights.criticalMetrics,
        financials
      );

      // Store insights for tracking
      await this.storeExecutiveInsights(insights, companyData);

      return insights;
    } catch (error) {
      logError('Executive insights generation failed', error);
      throw error;
    }
  }

  // Helper methods for real data integration
  async fetchRealTimeFinancials(companyData) {
    try {
      // Parallel fetch from multiple sources
      const dataPromises = [
        this.fetchXeroData(companyData),
        this.fetchBankingData(companyData),
        this.fetchERPData(companyData),
        this.fetchDatabaseData(companyData)
      ];

      const results = await Promise.allSettled(dataPromises);

      // Extract successful results
      const validData = results
        .filter(result => result.status === 'fulfilled' && result.value)
        .map(result => result.value);

      if (validData.length === 0) {
        throw new Error('No financial data sources available');
      }

      // Consolidate and reconcile data from multiple sources
      return this.consolidateFinancialData(validData);
    } catch (error) {
      logError('Failed to fetch real-time financials', error);
      throw error;
    }
  }

  async fetchXeroData(companyData) {
    try {
      const response = await axios.get('/api/integrations/xero/financials', {
        params: {
          companyId: companyData.companyId,
          includeBalanceSheet: true,
          includeCashFlow: true,
          includeDebtors: true,
          includeCreditors: true
        }
      });

      return {
        source: 'xero',
        timestamp: new Date().toISOString(),
        ...response.data
      };
    } catch (error) {
      logWarn('Xero data fetch failed', { error: error.message });
      return null;
    }
  }

  async fetchBankingData(companyData) {
    try {
      const response = await axios.get('/api/integrations/banking/accounts', {
        params: {
          companyId: companyData.companyId
        }
      });

      return {
        source: 'banking',
        timestamp: new Date().toISOString(),
        bankAccounts: response.data.accounts,
        totalCash: response.data.totalBalance,
        transactions: response.data.recentTransactions
      };
    } catch (error) {
      logWarn('Banking data fetch failed', { error: error.message });
      return null;
    }
  }

  async fetchERPData(companyData) {
    try {
      const response = await axios.get('/api/integrations/erp/financials', {
        params: {
          companyId: companyData.companyId,
          modules: ['finance', 'inventory', 'sales', 'purchasing']
        }
      });

      return {
        source: 'erp',
        timestamp: new Date().toISOString(),
        ...response.data
      };
    } catch (error) {
      logWarn('ERP data fetch failed', { error: error.message });
      return null;
    }
  }

  async fetchDatabaseData(companyData) {
    try {
      // Fetch from local database
      const [financialData, cashFlowData, workingCapitalData] = await Promise.all([
        this.prisma.financialSnapshot.findFirst({
          where: { companyId: companyData.companyId },
          orderBy: { createdAt: 'desc' }
        }),
        this.prisma.cashFlow.findMany({
          where: {
            companyId: companyData.companyId,
            date: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
          },
          orderBy: { date: 'desc' }
        }),
        this.prisma.workingCapital.findFirst({
          where: { companyId: companyData.companyId },
          orderBy: { createdAt: 'desc' }
        })
      ]);

      return {
        source: 'database',
        timestamp: new Date().toISOString(),
        snapshot: financialData,
        cashFlows: cashFlowData,
        workingCapital: workingCapitalData
      };
    } catch (error) {
      logWarn('Database fetch failed', { error: error.message });
      return null;
    }
  }

  consolidateFinancialData(dataSources) {
    // Prioritize data sources by reliability and recency
    const prioritizedData = dataSources.sort(_(a, b) => {
      const priority = { xero: 1, erp: 2, banking: 3, database: 4 };
      return priority[a.source] - priority[b.source];
    });

    // Build consolidated financial picture
    const consolidated = {
      timestamp: new Date().toISOString(),
      cashOnHand: 0,
      bankAccounts: [],
      currentDebtors: 0,
      currentCreditors: 0,
      monthlyExpenses: 0,
      historicalRevenue: [],
      averageDSO: 0,
      averageDPO: 0,
      averageDIO: 0,
      currentRevenue: 0,
      debtSchedule: [],
      inventoryValue: 0,
      cogs: 0
    };

    // Merge data from all sources
    for (const data of prioritizedData) {
      // Cash and banking
      if (data.totalCash) consolidated.cashOnHand = Math.max(consolidated.cashOnHand, data.totalCash);
      if (data.bankAccounts) consolidated.bankAccounts = [...consolidated.bankAccounts, ...data.bankAccounts];

      // Debtors and creditors
      if (data.currentDebtors) consolidated.currentDebtors = data.currentDebtors;
      if (data.currentCreditors) consolidated.currentCreditors = data.currentCreditors;

      // Operating metrics
      if (data.monthlyExpenses) consolidated.monthlyExpenses = data.monthlyExpenses;
      if (data.currentRevenue) consolidated.currentRevenue = data.currentRevenue;

      // Working capital metrics
      if (data.averageDSO) consolidated.averageDSO = data.averageDSO;
      if (data.averageDPO) consolidated.averageDPO = data.averageDPO;
      if (data.averageDIO) consolidated.averageDIO = data.averageDIO;

      // Historical data
      if (data.historicalRevenue) {
        consolidated.historicalRevenue = [...consolidated.historicalRevenue, ...data.historicalRevenue];
      }

      // Inventory and COGS
      if (data.inventoryValue) consolidated.inventoryValue = data.inventoryValue;
      if (data.cogs) consolidated.cogs = data.cogs;
    }

    // Remove duplicate bank accounts
    consolidated.bankAccounts = this.deduplicateBankAccounts(consolidated.bankAccounts);

    // Calculate derived metrics if not available
    if (!consolidated.averageDSO && consolidated.currentDebtors && consolidated.currentRevenue) {
      consolidated.averageDSO = (consolidated.currentDebtors / consolidated.currentRevenue) * 365;
    }

    if (!consolidated.averageDPO && consolidated.currentCreditors && consolidated.cogs) {
      consolidated.averageDPO = (consolidated.currentCreditors / consolidated.cogs) * 365;
    }

    return consolidated;
  }

  async runMonteCarloSimulation(params) {
    try {
      const cacheKey = JSON.stringify(params);
      if (this.simulationCache.has(cacheKey)) {
        const cached = this.simulationCache.get(cacheKey);
        if (cached.timestamp > Date.now() - 3600000) { // 1 hour cache
          return cached.results;
        }
      }

      const iterations = params.iterations || 10000;
      const results = [];

      for (let i = 0; i < iterations; i++) {
        // Generate scenario with random variations
        const scenario = {
          receivables: this.randomVariation(params.receivables, 0.15), // 15% variation
          payables: this.randomVariation(params.payables, 0.10), // 10% variation
          expenses: this.randomVariation(params.expenses, 0.20), // 20% variation
          revenue: this.randomVariation(params.revenue, 0.25), // 25% variation
          workingCapital: this.randomVariation(params.workingCapital, 0.15),
          taxes: this.randomVariation(params.taxes || 0, 0.05),
          debtService: params.debtService || 0 // No variation on debt service
        };

        // Calculate outcome
        const totalRequired = scenario.expenses + scenario.payables +
                            scenario.workingCapital + scenario.taxes + scenario.debtService;
        const totalAvailable = scenario.receivables + scenario.revenue;

        results.push({
          required: totalRequired,
          available: totalAvailable,
          shortfall: Math.max(0, totalRequired - totalAvailable),
          surplus: Math.max(0, totalAvailable - totalRequired)
        });
      }

      // Cache results
      this.simulationCache.set(cacheKey, {
        results,
        timestamp: Date.now()
      });

      return results;
    } catch (error) {
      logError('Monte Carlo simulation failed', error);
      throw error;
    }
  }

  randomVariation(baseValue, variationPercent) {
    const variation = baseValue * variationPercent;
    return baseValue + (Math.random() - 0.5) * 2 * variation;
  }

  calculateProbabilityOfShortfall(scenarios) {
    const shortfallCount = scenarios.filter(s => s.shortfall > 0).length;
    return (shortfallCount / scenarios.length) * 100;
  }

  summarizeScenarios(scenarios) {
    const sortedByShortfall = [...scenarios].sort((a, b) => a.shortfall - b.shortfall);
    const percentileIndex = (p) => Math.floor(scenarios.length * p / 100);

    return {
      bestCase: sortedByShortfall[percentileIndex(5)],
      mostLikely: sortedByShortfall[percentileIndex(50)],
      worstCase: sortedByShortfall[percentileIndex(95)],
      average: {
        required: scenarios.reduce((sum, s) => sum + s.required, 0) / scenarios.length,
        available: scenarios.reduce((sum, s) => sum + s.available, 0) / scenarios.length,
        shortfall: scenarios.reduce((sum, s) => sum + s.shortfall, 0) / scenarios.length,
        surplus: scenarios.reduce((sum, s) => sum + s.surplus, 0) / scenarios.length
      }
    };
  }

  async generateAIRecommendations(analysis, companyData) {
    try {
      const prompt = {
        tool: 'ai_manufacturing_request',
        params: {
          prompt: `Generate strategic cash management recommendations for ${companyData.companyName}.
                   Current cash: ${analysis.currentCash}
                   Coverage analysis: ${JSON.stringify(analysis.coverage)}
                   Industry: ${companyData.industry}

                   Provide 3-5 specific, actionable recommendations to optimize cash position.
                   Focus on: immediate actions, medium-term improvements, and strategic initiatives.`,
          context: 'financial-optimization'
        }
      };

      const response = await axios.post('/api/mcp/request', prompt);
      return response.data.recommendations || [];
    } catch (error) {
      logWarn('AI recommendations generation failed', { error: error.message });
      return this.generateDefaultRecommendations(analysis);
    }
  }

  generateExecutiveAlerts(analysis) {
    const alerts = [];

    // Check 30-day coverage
    if (analysis.coverage.day_30 && analysis.coverage.day_30.coverageRatio < 1.0) {
      alerts.push({
        severity: 'critical',
        message: 'Immediate cash shortfall within 30 days',
        amount: analysis.coverage.day_30.shortfall,
        action: 'Urgent cash injection or credit facility required'
      });
    }

    // Check 90-day coverage
    if (analysis.coverage.day_90 && analysis.coverage.day_90.coverageRatio < 1.2) {
      alerts.push({
        severity: 'warning',
        message: 'Cash coverage below safety threshold for 90 days',
        ratio: analysis.coverage.day_90.coverageRatio,
        action: 'Review working capital optimization opportunities'
      });
    }

    // Check 180-day outlook
    if (analysis.coverage.day_180 && analysis.coverage.day_180.probability > 30) {
      alerts.push({
        severity: 'info',
        message: `${analysis.coverage.day_180.probability.toFixed(1)}% probability of cash shortfall within 180 days`,
        action: 'Consider growth funding or strategic planning'
      });
    }

    return alerts;
  }

  // Additional helper methods
  async storeAnalysis(analysis, companyData) {
    try {
      await this.prisma.cashCoverageAnalysis.create({
        data: {
          companyId: companyData.companyId,
          analysis: analysis,
          timestamp: new Date()
        }
      });
    } catch (error) {
      logWarn('Failed to store analysis', { error: error.message });
    }
  }

  assessDataQuality(realTimeData) {
    let score = 100;
    const issues = [];

    // Check data completeness
    if (!realTimeData.cashOnHand) {
      score -= 20;
      issues.push('Missing cash balance');
    }

    if (!realTimeData.currentDebtors) {
      score -= 15;
      issues.push('Missing accounts receivable');
    }

    if (!realTimeData.historicalRevenue || realTimeData.historicalRevenue.length < 3) {
      score -= 15;
      issues.push('Insufficient historical revenue data');
    }

    // Check data freshness
    const dataAge = Date.now() - new Date(realTimeData.timestamp).getTime();
    if (dataAge > 86400000) { // More than 24 hours old
      score -= 10;
      issues.push('Data older than 24 hours');
    }

    return {
      score,
      grade: score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : 'D',
      issues
    };
  }

  calculateConfidenceScore(analysis, realTimeData) {
    const dataQuality = this.assessDataQuality(realTimeData);
    let confidence = dataQuality.score;

    // Adjust based on scenario spread
    const scenarioSpread = analysis.coverage.day_90?.scenarios;
    if (scenarioSpread) {
      const spreadRatio = scenarioSpread.worstCase.shortfall / (scenarioSpread.bestCase.surplus || 1);
      if (spreadRatio > 2) confidence -= 10;
      if (spreadRatio > 5) confidence -= 20;
    }

    return Math.max(0, Math.min(100, confidence));
  }

  deduplicateBankAccounts(accounts) {
    const unique = new Map();
    for (const account of accounts) {
      const key = `${account.bank}-${account.accountNumber}`;
      if (!unique.has(key) || account.timestamp > unique.get(key).timestamp) {
        unique.set(key, account);
      }
    }
    return Array.from(unique.values());
  }

  getDefaultBenchmarks(industry) {
    // Conservative default benchmarks when real data unavailable
    const defaults = {
      manufacturing: {
        topQuartileDSO: 45,
        topQuartileDPO: 60,
        topQuartileDIO: 60,
        inventoryTurns: 6,
        workingCapitalRatio: 0.20
      },
      retail: {
        topQuartileDSO: 30,
        topQuartileDPO: 45,
        topQuartileDIO: 45,
        inventoryTurns: 8,
        workingCapitalRatio: 0.15
      },
      services: {
        topQuartileDSO: 60,
        topQuartileDPO: 30,
        topQuartileDIO: 0,
        inventoryTurns: 0,
        workingCapitalRatio: 0.25
      }
    };

    return defaults[industry] || defaults.manufacturing;
  }

  // Clean up resources
  async cleanup() {
    await this.prisma.$disconnect();
  }
}

export default EnterpriseCashCoverageEngine;