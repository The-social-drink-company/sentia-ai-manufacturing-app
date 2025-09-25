import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import crypto from 'crypto';

const REQUIRED_ENV_VARS = [
  'FINANCIAL_AGGREGATOR_URL',
  'FINANCIAL_AGGREGATOR_TOKEN',
  'FINANCIAL_AI_ENDPOINT',
  'FINANCIAL_AI_TOKEN'
];

const MONTE_CARLO_ITERATIONS = Number(process.env.CASH_ENGINE_SIM_ITERATIONS || 10000);

const ensureEnv = () => {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`EnterpriseCashCoverageEngine missing required environment variables: ${missing.join(', ')}`);
  }
};

const assertRealNumber = (value, label) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    throw new Error(`Invalid value for ${label}. Expected real numeric data from source systems.`);
  }
  return Number(value);
};

export class EnterpriseCashCoverageEngine {
  constructor() {
    ensureEnv();
    this.prisma = new PrismaClient();
    this.benchmarkCache = new Map();
  }

  async calculateCashCoverage(companyData) {
    const realTimeData = await this.fetchRealTimeFinancials();

    const analysis = {
      currentCash: assertRealNumber(realTimeData.cashOnHand, 'cashOnHand'),
      coverage: {},
      recommendations: [],
      alerts: [],
      confidence: 0
    };

    const periods = [30, 60, 90, 120, 180];

    const coverageResults = await Promise.all(
      periods.map(async (days) => {
        const coverage = await this.calculatePeriodCoverage(realTimeData, days, companyData);
        return [
          `day_${days}`,
          {
            requiredCash: coverage.required,
            availableCash: coverage.available,
            shortfall: coverage.shortfall,
            coverageRatio: coverage.ratio,
            probability: coverage.probability,
            scenarios: coverage.scenarios,
            actionRequired: coverage.shortfall > 0
          }
        ];
      })
    );

    coverageResults.forEach(([key, value]) => {
      analysis.coverage[key] = value;
    });

    analysis.recommendations = await this.generateAIRecommendations(analysis, companyData);
    analysis.alerts = this.generateExecutiveAlerts(analysis);
    analysis.confidence = this.deriveConfidenceScore(coverageResults.map(([, value]) => value));

    return analysis;
  }

  async calculatePeriodCoverage(financials, days, companyData) {
    const [
      historicalCashFlow,
      expectedReceivables,
      payableObligations,
      operatingExpenses,
      predictedRevenue
    ] = await Promise.all([
      this.getHistoricalCashFlow(days),
      this.predictReceivables(financials.currentDebtors, companyData.dso, days),
      this.calculatePayables(financials.currentCreditors, companyData.dpo, days),
      this.projectOperatingExpenses(financials.monthlyExpenses, days, companyData.growthRate),
      this.predictRevenue(financials.historicalRevenue, days, companyData.industry)
    ]);

    const workingCapitalNeeds = this.calculateWorkingCapitalRequirement(
      predictedRevenue,
      companyData.dso,
      companyData.dpo,
      companyData.inventoryTurns
    );

    const scenarios = await this.runMonteCarloSimulation({
      receivables: expectedReceivables,
      payables: payableObligations,
      expenses: operatingExpenses,
      revenue: predictedRevenue,
      historicalCashFlow,
      iterations: MONTE_CARLO_ITERATIONS
    });

    const required = operatingExpenses + payableObligations + workingCapitalNeeds;
    const available = financials.cashOnHand + expectedReceivables + predictedRevenue;
    const shortfall = Math.max(0, required - available);
    const ratio = required === 0 ? 0 : (financials.cashOnHand + expectedReceivables) / (operatingExpenses + payableObligations);

    return {
      required,
      available,
      shortfall,
      ratio,
      probability: this.calculateProbabilityOfShortfall(scenarios, required),
      scenarios: this.summarizeScenarios(scenarios, required)
    };
  }

  async calculateCashInjectionNeeds(companyData, scenario = 'sustain') {
    const injectionAnalysis = {
      scenario,
      immediateNeed: 0,
      optimalAmount: 0,
      sources: [],
      timeline: [],
      roi: 0
    };

    switch (scenario) {
      case 'sustain': {
        const survivalCash = await this.calculateSurvivalCash(companyData);
        injectionAnalysis.immediateNeed = survivalCash;
        injectionAnalysis.optimalAmount = survivalCash * 1.3;
        break;
      }
      case 'growth': {
        const requirements = await this.calculateGrowthCapital(companyData.targetGrowthRate, companyData);
        injectionAnalysis.immediateNeed = requirements.upfrontCapital;
        injectionAnalysis.optimalAmount = requirements.totalCapital;
        injectionAnalysis.roi = requirements.expectedROI;
        break;
      }
      case 'aggressive': {
        const aggressive = await this.calculateAggressiveExpansion(companyData);
        injectionAnalysis.immediateNeed = aggressive.immediate;
        injectionAnalysis.optimalAmount = aggressive.total;
        injectionAnalysis.roi = aggressive.projectedROI;
        break;
      }
      default:
        throw new Error(`Unknown scenario ${scenario}`);
    }

    injectionAnalysis.sources = await this.rankFundingSources(
      injectionAnalysis.optimalAmount,
      companyData
    );

    injectionAnalysis.timeline = this.generateFundingTimeline(
      injectionAnalysis.immediateNeed,
      injectionAnalysis.optimalAmount,
      companyData.burnRate
    );

    return injectionAnalysis;
  }

  async calculateGrowthFunding(targetGrowthPercent, companyData) {
    const growthAnalysis = {
      targetRevenue: 0,
      requiredCapital: 0,
      workingCapitalIncrease: 0,
      capexRequirements: 0,
      additionalHeadcount: 0,
      fundingMix: {},
      milestones: [],
      risks: []
    };

    growthAnalysis.targetRevenue = assertRealNumber(companyData.currentRevenue, 'currentRevenue') * (1 + targetGrowthPercent / 100);
    const additionalRevenue = growthAnalysis.targetRevenue - assertRealNumber(companyData.currentRevenue, 'currentRevenue');

    growthAnalysis.workingCapitalIncrease = this.calculateIncrementalWorkingCapital(
      additionalRevenue,
      companyData.dso,
      companyData.dpo,
      companyData.dio
    );

    const industryGrowthModel = await this.getIndustryGrowthModel(companyData.industry, companyData.revenue);

    const capex = additionalRevenue * industryGrowthModel.capexToRevenueRatio;
    const marketing = additionalRevenue * industryGrowthModel.marketingToRevenueRatio;
    const headcountCost = this.calculateHeadcountCosts(additionalRevenue, industryGrowthModel.revenuePerEmployee);

    growthAnalysis.capexRequirements = capex;
    growthAnalysis.additionalHeadcount = Math.ceil(additionalRevenue / industryGrowthModel.revenuePerEmployee);
    growthAnalysis.requiredCapital = growthAnalysis.workingCapitalIncrease + capex + marketing + headcountCost;
    growthAnalysis.fundingMix = await this.optimizeFundingMix(growthAnalysis.requiredCapital, companyData);
    growthAnalysis.milestones = this.generateGrowthMilestones(companyData.currentRevenue, growthAnalysis.targetRevenue, 12);
    growthAnalysis.risks = await this.assessGrowthRisks(targetGrowthPercent, companyData, industryGrowthModel);

    return growthAnalysis;
  }

  async getIndustryBenchmarks(industry, revenue, isListed = false) {
    const cacheKey = `${industry}:${revenue}:${isListed}`;
    if (this.benchmarkCache.has(cacheKey)) {
      return this.benchmarkCache.get(cacheKey);
    }

    const benchmarkSources = await Promise.all([
      this.fetchBloombergBenchmarks(industry, revenue, isListed),
      this.fetchIndustryDatabaseBenchmarks(industry, revenue),
      this.queryAIForBenchmarks(industry, revenue, isListed)
    ]);

    const consolidated = this.consolidateBenchmarks(benchmarkSources);
    this.benchmarkCache.set(cacheKey, consolidated);
    return consolidated;
  }

  async queryAIForBenchmarks(industry, revenue, isListed) {
    const prompt = `Provide financial benchmarks for ${industry} companies with revenue of ${revenue}.\nCompany type: ${isListed ? 'Listed/Public' : 'SME/Private'}\n\nReturn specific metrics:\n- Average DSO, DPO, DIO\n- Working Capital as % of Revenue\n- EBITDA Margin\n- Revenue per Employee\n- Cash Conversion Cycle\n- Growth Rates\n\nUse only real, current market data sourced from verified public filings and market research.`;
    const response = await this.callLLM(prompt, 'financial-analysis');
    return this.parseBenchmarkResponse(response);
  }

  async calculateInventoryImpact(companyData) {
    if (!companyData.usesInventory) {
      return null;
    }

    const inventoryAnalysis = {
      currentTurns: companyData.inventoryTurns,
      optimalTurns: 0,
      cashReleased: 0,
      efficiencyGain: 0
    };

    const industryBenchmark = await this.getIndustryBenchmarks(companyData.industry, companyData.revenue);
    inventoryAnalysis.optimalTurns = industryBenchmark.inventoryTurns || companyData.inventoryTurns;

    if (inventoryAnalysis.optimalTurns > companyData.inventoryTurns) {
      const currentInventoryValue = companyData.revenue / companyData.inventoryTurns;
      const optimalInventoryValue = companyData.revenue / inventoryAnalysis.optimalTurns;
      inventoryAnalysis.cashReleased = currentInventoryValue - optimalInventoryValue;
    }

    inventoryAnalysis.efficiencyGain = companyData.inventoryTurns === 0
      ? 0
      : ((inventoryAnalysis.optimalTurns - companyData.inventoryTurns) / companyData.inventoryTurns) * 100;

    return inventoryAnalysis;
  }

  async optimizeWorkingCapital(currentMetrics) {
    const benchmarks = await this.getIndustryBenchmarks(currentMetrics.industry, currentMetrics.revenue);

    const optimization = {
      currentCCC: currentMetrics.dso + (currentMetrics.dio || 0) - currentMetrics.dpo,
      optimalCCC: (benchmarks.averageDSO + (benchmarks.averageDIO || 0) - benchmarks.averageDPO) || 0,
      improvements: {},
      cashImpact: 0,
      implementationPlan: []
    };

    optimization.improvements.dso = {
      current: currentMetrics.dso,
      target: benchmarks.topQuartileDSO || currentMetrics.dso,
      cashImpact: this.calculateDSOImpact(currentMetrics.dso, benchmarks.topQuartileDSO || currentMetrics.dso, currentMetrics.revenue),
      actions: await this.generateDSOActions(currentMetrics)
    };

    optimization.improvements.dpo = {
      current: currentMetrics.dpo,
      target: benchmarks.topQuartileDPO || currentMetrics.dpo,
      cashImpact: this.calculateDPOImpact(currentMetrics.dpo, benchmarks.topQuartileDPO || currentMetrics.dpo, currentMetrics.revenue),
      actions: await this.generateDPOActions(currentMetrics)
    };

    if (currentMetrics.dio) {
      optimization.improvements.dio = {
        current: currentMetrics.dio,
        target: benchmarks.topQuartileDIO || currentMetrics.dio,
        cashImpact: this.calculateDIOImpact(currentMetrics.dio, benchmarks.topQuartileDIO || currentMetrics.dio, currentMetrics.revenue),
        actions: await this.generateDIOActions(currentMetrics)
      };
    }

    optimization.cashImpact =
      optimization.improvements.dso.cashImpact +
      optimization.improvements.dpo.cashImpact +
      (optimization.improvements.dio?.cashImpact || 0);

    optimization.implementationPlan = await this.createImplementationRoadmap(optimization);

    return optimization;
  }

  async generateExecutiveInsights(companyData) {
    const criticalMetrics = await Promise.all([
      this.calculateCashRunway(companyData),
      this.calculateBurnRate(companyData),
      this.assessWorkingCapitalEfficiency(companyData),
      this.assessGrowthReadiness(companyData),
      this.calculateFinancialHealthScore(companyData)
    ]);

    const insights = {
      criticalMetrics: {
        cashRunway: criticalMetrics[0],
        burnRate: criticalMetrics[1],
        workingCapitalEfficiency: criticalMetrics[2],
        growthReadiness: criticalMetrics[3],
        financialHealth: criticalMetrics[4]
      },
      decisions: await this.identifyKeyDecisions(criticalMetrics, companyData),
      opportunities: await this.identifyOpportunities(companyData),
      risks: await this.performRiskAssessment(companyData),
      recommendations: await this.generateStrategicRecommendations(companyData)
    };

    return insights;
  }

  async fetchRealTimeFinancials() {
    const [xeroData, bankData, erpData] = await Promise.all([
      this.fetchXeroData(),
      this.fetchBankingData(),
      this.fetchERPData()
    ]);
    return this.consolidateFinancialData(xeroData, bankData, erpData);
  }

  async callLLM(prompt, mode = 'analysis') {
    const endpoint = process.env.FINANCIAL_AI_ENDPOINT;
    const token = process.env.FINANCIAL_AI_TOKEN;

    const { data } = await axios.post(endpoint, { prompt, mode }, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!data) {
      throw new Error('AI service returned empty response. Real analysis required.');
    }

    return data;
  }

  // ----- Data Retrieval Helpers -----

  async fetchXeroData() {
    const url = `${process.env.FINANCIAL_AGGREGATOR_URL}/xero/financials`;
    const { data } = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${process.env.FINANCIAL_AGGREGATOR_TOKEN}`
      }
    });
    return data;
  }

  async fetchBankingData() {
    const url = `${process.env.FINANCIAL_AGGREGATOR_URL}/banking/balances`;
    const { data } = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${process.env.FINANCIAL_AGGREGATOR_TOKEN}`
      }
    });
    return data;
  }

  async fetchERPData() {
    const url = `${process.env.FINANCIAL_AGGREGATOR_URL}/erp/metrics`;
    const { data } = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${process.env.FINANCIAL_AGGREGATOR_TOKEN}`
      }
    });
    return data;
  }

  consolidateFinancialData(xeroData, bankData, erpData) {
    if (!xeroData || !bankData || !erpData) {
      throw new Error('Missing financial data from one or more source systems.');
    }

    const cashOnHand = assertRealNumber(bankData.totalCash, 'totalCash');
    return {
      cashOnHand,
      currentDebtors: assertRealNumber(xeroData.accountsReceivable, 'accountsReceivable'),
      currentCreditors: assertRealNumber(xeroData.accountsPayable, 'accountsPayable'),
      monthlyExpenses: assertRealNumber(erpData.operatingExpensesMonthly, 'operatingExpensesMonthly'),
      historicalRevenue: erpData.historicalRevenue || []
    };
  }

  // ----- Financial Calculations -----

  async getHistoricalCashFlow(days) {
    const since = new Date();
    since.setDate(since.getDate() - days * 3);

    const records = await this.prisma.cashLedger.findMany({
      where: { postedAt: { gte: since } },
      select: { amount: true }
    });

    if (!records.length) {
      throw new Error('No historical cash flow records found in database.');
    }

    return records.map(({ amount }) => assertRealNumber(amount, 'cashLedger.amount'));
  }

  async predictReceivables(currentDebtors, dso, days) {
    const dailySales = currentDebtors / Math.max(1, dso);
    return dailySales * days;
  }

  async calculatePayables(currentCreditors, dpo, days) {
    const dailyPayables = currentCreditors / Math.max(1, dpo);
    return dailyPayables * days;
  }

  async projectOperatingExpenses(monthlyExpenses, days, growthRate) {
    const dailyExpenses = monthlyExpenses / 30;
    return dailyExpenses * days * (1 + (growthRate || 0));
  }

  async predictRevenue(historicalRevenue, days, industry) {
    if (!historicalRevenue || !historicalRevenue.length) {
      throw new Error('Historical revenue data required for revenue prediction.');
    }

    const endpoint = `${process.env.FINANCIAL_AI_ENDPOINT}/forecast/revenue`;
    const { data } = await axios.post(
      endpoint,
      { historicalRevenue, days, industry },
      {
        headers: {
          Authorization: `Bearer ${process.env.FINANCIAL_AI_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return assertRealNumber(data?.predictedRevenue, 'predictedRevenue');
  }

  calculateWorkingCapitalRequirement(predictedRevenue, dso, dpo, inventoryTurns) {
    const receivableRequirement = (predictedRevenue * dso) / 365;
    const payableBenefit = (predictedRevenue * dpo) / 365;
    const inventoryRequirement = inventoryTurns ? predictedRevenue / Math.max(inventoryTurns, 1) : 0;
    return receivableRequirement + inventoryRequirement - payableBenefit;
  }

  async runMonteCarloSimulation({ receivables, payables, expenses, revenue, historicalCashFlow, iterations }) {
    const baseDataset = historicalCashFlow || [];
    const volatility = this.calculateVolatility(baseDataset);

    const results = [];
    for (let i = 0; i < iterations; i += 1) {
      const receivablesSample = this.applyVariance(receivables, volatility);
      const payablesSample = this.applyVariance(payables, volatility);
      const expensesSample = this.applyVariance(expenses, volatility);
      const revenueSample = this.applyVariance(revenue, volatility);
      const scenarioCash = receivablesSample + revenueSample - payablesSample - expensesSample;
      results.push({ receivablesSample, payablesSample, expensesSample, revenueSample, scenarioCash });
    }

    return results;
  }

  calculateProbabilityOfShortfall(scenarios, required) {
    const shortfalls = scenarios.filter((scenario) => scenario.scenarioCash < required);
    return shortfalls.length / scenarios.length;
  }

  summarizeScenarios(scenarios, required) {
    const sorted = [...scenarios].sort((a, b) => a.scenarioCash - b.scenarioCash);
    const medianIndex = Math.floor(sorted.length / 2);
    const median = sorted[medianIndex];

    return {
      worstCase: sorted[0].scenarioCash,
      bestCase: sorted[sorted.length - 1].scenarioCash,
      median: median.scenarioCash,
      shortfallProbability: this.calculateProbabilityOfShortfall(scenarios, required)
    };
  }

  async generateAIRecommendations(analysis, companyData) {
    const prompt = `Company: ${companyData.name || 'Sentia Spirits'}\nProvide strategic treasury recommendations based on the following coverage analysis: ${JSON.stringify(analysis.coverage)}.`;
    const aiResponse = await this.callLLM(prompt, 'recommendations');
    return aiResponse.recommendations || [];
  }

  generateExecutiveAlerts(analysis) {
    return Object.entries(analysis.coverage)
      .filter(([, value]) => value.shortfall > 0 || value.coverageRatio < 1)
      .map(([key, value]) => ({
        period: key,
        message: `Coverage shortfall detected for ${key}. Shortfall: ${value.shortfall.toFixed(2)}.`,
        severity: value.shortfall > 0 ? 'critical' : 'warning'
      }));
  }

  deriveConfidenceScore(entries) {
    const ratios = entries.map((item) => item.coverageRatio || 0);
    const probability = entries.reduce((acc, item) => acc + (1 - item.probability), 0) / entries.length;
    const averageRatio = ratios.reduce((acc, ratio) => acc + ratio, 0) / entries.length;
    return Math.min(1, Math.max(0, (averageRatio + probability) / 2));
  }

  // ----- Cash Injection helpers -----

  async calculateSurvivalCash(companyData) {
    const runway = await this.calculateCashRunway(companyData);
    return runway.days < 90 ? companyData.monthlyBurnRate * 3 : companyData.monthlyBurnRate;
  }

  async calculateGrowthCapital(targetGrowthRate, companyData) {
    const response = await axios.post(
      `${process.env.FINANCIAL_AI_ENDPOINT}/growth/capital`,
      { targetGrowthRate, companyData },
      {
        headers: {
          Authorization: `Bearer ${process.env.FINANCIAL_AI_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  }

  async calculateAggressiveExpansion(companyData) {
    const response = await axios.post(
      `${process.env.FINANCIAL_AI_ENDPOINT}/growth/aggressive`,
      { companyData },
      {
        headers: {
          Authorization: `Bearer ${process.env.FINANCIAL_AI_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  }

  async rankFundingSources(amount, companyData) {
    const response = await axios.post(
      `${process.env.FINANCIAL_AGGREGATOR_URL}/funding/options`,
      { amount, companyData },
      {
        headers: {
          Authorization: `Bearer ${process.env.FINANCIAL_AGGREGATOR_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data.sources || [];
  }

  generateFundingTimeline(immediateNeed, optimalAmount, burnRate) {
    const monthsToRaise = Math.ceil(optimalAmount / Math.max(burnRate, 1));
    return Array.from({ length: monthsToRaise }).map((_, index) => ({
      month: index + 1,
      cashBuffer: immediateNeed + burnRate * index
    }));
  }

  calculateIncrementalWorkingCapital(additionalRevenue, dso, dpo, dio) {
    const receivableIncrease = (additionalRevenue * dso) / 365;
    const payableIncrease = (additionalRevenue * dpo) / 365;
    const inventoryIncrease = dio ? (additionalRevenue * dio) / 365 : 0;
    return receivableIncrease + inventoryIncrease - payableIncrease;
  }

  async getIndustryGrowthModel(industry, revenue) {
    const response = await axios.get(
      `${process.env.FINANCIAL_AGGREGATOR_URL}/benchmarks/growth-model`,
      {
        params: { industry, revenue },
        headers: {
          Authorization: `Bearer ${process.env.FINANCIAL_AGGREGATOR_TOKEN}`
        }
      }
    );
    return response.data;
  }

  calculateHeadcountCosts(additionalRevenue, revenuePerEmployee) {
    if (!revenuePerEmployee) return 0;
    return (additionalRevenue / revenuePerEmployee) * (process.env.AVG_FULLY_LOADED_COST || 120000);
  }

  async optimizeFundingMix(requiredCapital, companyData) {
    const response = await axios.post(
      `${process.env.FINANCIAL_AI_ENDPOINT}/funding/mix`,
      { requiredCapital, companyData },
      {
        headers: {
          Authorization: `Bearer ${process.env.FINANCIAL_AI_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  }

  generateGrowthMilestones(currentRevenue, targetRevenue, durationMonths) {
    const monthlyIncrement = (targetRevenue - currentRevenue) / durationMonths;
    return Array.from({ length: durationMonths }).map((_, index) => ({
      month: index + 1,
      projectedRevenue: currentRevenue + monthlyIncrement * (index + 1)
    }));
  }

  async assessGrowthRisks(targetGrowthPercent, companyData, industryGrowthModel) {
    const response = await axios.post(
      `${process.env.FINANCIAL_AI_ENDPOINT}/risk/growth`,
      { targetGrowthPercent, companyData, industryGrowthModel },
      {
        headers: {
          Authorization: `Bearer ${process.env.FINANCIAL_AI_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data.risks || [];
  }

  async fetchBloombergBenchmarks(industry, revenue, isListed) {
    const response = await axios.get(
      `${process.env.BLOOMBERG_BENCHMARK_URL}`,
      {
        params: { industry, revenue, isListed },
        headers: {
          Authorization: `Bearer ${process.env.BLOOMBERG_BENCHMARK_TOKEN}`
        }
      }
    );
    return response.data;
  }

  async fetchIndustryDatabaseBenchmarks(industry, revenue) {
    const response = await axios.get(
      `${process.env.FINANCIAL_AGGREGATOR_URL}/benchmarks/industry`,
      {
        params: { industry, revenue },
        headers: {
          Authorization: `Bearer ${process.env.FINANCIAL_AGGREGATOR_TOKEN}`
        }
      }
    );
    return response.data;
  }

  parseBenchmarkResponse(response) {
    if (!response) {
      throw new Error('Benchmark AI response invalid');
    }
    return response.benchmarks || response;
  }

  consolidateBenchmarks(sources) {
    const merged = {};
    sources.forEach((source) => {
      Object.entries(source || {}).forEach(([key, value]) => {
        if (!merged[key]) merged[key] = [];
        merged[key].push(value);
      });
    });

    const consolidated = {};
    Object.entries(merged).forEach(([key, values]) => {
      const numericValues = values
        .flat()
        .map((item) => Number(item))
        .filter((num) => !Number.isNaN(num));
      if (numericValues.length) {
        consolidated[key] = numericValues.reduce((acc, val) => acc + val, 0) / numericValues.length;
      }
    });
    return consolidated;
  }

  // ----- Executive Insights Helpers -----

  async calculateCashRunway(companyData) {
    const cash = await this.getLatestCashBalance(companyData.companyId);
    const burn = await this.calculateBurnRate(companyData);
    const days = burn.dailyBurnRate === 0 ? Infinity : cash / burn.dailyBurnRate;
    return { cash, dailyBurnRate: burn.dailyBurnRate, days };
  }

  async getLatestCashBalance(companyId) {
    const balance = await this.prisma.cashProjection.findFirst({
      where: { companyId },
      orderBy: { projectionDate: 'desc' },
      select: { endingBalance: true }
    });
    if (!balance) {
      throw new Error('Cash projection data missing for company.');
    }
    return assertRealNumber(balance.endingBalance, 'endingBalance');
  }

  async calculateBurnRate(companyData) {
    const expenses = await this.prisma.expense.findMany({
      where: { companyId: companyData.companyId, incurredAt: { gte: this.getMonthsAgoDate(3) } },
      select: { amount: true }
    });

    if (!expenses.length) {
      throw new Error('Expense data not found for burn rate calculation.');
    }

    const total = expenses.reduce((acc, { amount }) => acc + Number(amount), 0);
    const monthlyBurn = total / 3;
    return { monthlyBurnRate: monthlyBurn, dailyBurnRate: monthlyBurn / 30 };
  }

  async assessWorkingCapitalEfficiency(companyData) {
    const metrics = await this.prisma.workingCapitalMetric.findFirst({
      where: { companyId: companyData.companyId },
      orderBy: { capturedAt: 'desc' }
    });

    if (!metrics) {
      throw new Error('Working capital metrics missing.');
    }

    return {
      dso: metrics.dso,
      dpo: metrics.dpo,
      dio: metrics.dio,
      cashConversionCycle: metrics.dso + metrics.dio - metrics.dpo
    };
  }

  async assessGrowthReadiness(companyData) {
    const readiness = await this.prisma.growthReadiness.findFirst({
      where: { companyId: companyData.companyId },
      orderBy: { assessedAt: 'desc' }
    });

    if (!readiness) {
      throw new Error('Growth readiness assessment missing.');
    }

    return readiness;
  }

  async calculateFinancialHealthScore(companyData) {
    const response = await axios.post(
      `${process.env.FINANCIAL_AI_ENDPOINT}/health/score`,
      { companyId: companyData.companyId },
      {
        headers: {
          Authorization: `Bearer ${process.env.FINANCIAL_AI_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  }

  async identifyKeyDecisions(criticalMetrics, companyData) {
    const response = await axios.post(
      `${process.env.FINANCIAL_AI_ENDPOINT}/decisions/recommend`,
      { criticalMetrics, companyData },
      {
        headers: {
          Authorization: `Bearer ${process.env.FINANCIAL_AI_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data.decisions || [];
  }

  async identifyOpportunities(companyData) {
    const opportunities = await this.prisma.opportunity.findMany({
      where: { companyId: companyData.companyId },
      orderBy: { impactScore: 'desc' }
    });
    return opportunities;
  }

  async performRiskAssessment(companyData) {
    const risks = await this.prisma.riskRegister.findMany({
      where: { companyId: companyData.companyId },
      orderBy: { riskScore: 'desc' }
    });
    return risks;
  }

  async generateStrategicRecommendations(companyData) {
    const response = await axios.post(
      `${process.env.FINANCIAL_AI_ENDPOINT}/strategy/recommendations`,
      { companyData },
      {
        headers: {
          Authorization: `Bearer ${process.env.FINANCIAL_AI_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data.recommendations || [];
  }

  // ----- Utility helpers -----

  calculateVolatility(dataset) {
    if (!dataset.length) {
      return 0.1;
    }
    const mean = dataset.reduce((acc, value) => acc + value, 0) / dataset.length;
    const variance = dataset.reduce((acc, value) => acc + (value - mean) ** 2, 0) / dataset.length;
    return Math.sqrt(variance) / Math.max(mean, 1);
  }

  applyVariance(value, volatility) {
    const random = crypto.randomBytes(4).readUInt32BE(0) / 0xffffffff;
    const variance = (random - 0.5) * 2 * volatility;
    return value * (1 + variance);
  }

  calculateDSOImpact(currentDSO, targetDSO, revenue) {
    const delta = Math.max(0, currentDSO - targetDSO);
    return (revenue / 365) * delta;
  }

  calculateDPOImpact(currentDPO, targetDPO, revenue) {
    const delta = Math.max(0, targetDPO - currentDPO);
    return (revenue / 365) * delta;
  }

  calculateDIOImpact(currentDIO, targetDIO, revenue) {
    const delta = Math.max(0, currentDIO - targetDIO);
    return (revenue / 365) * delta;
  }

  async generateDSOActions(currentMetrics) {
    const { data } = await axios.post(
      `${process.env.FINANCIAL_AI_ENDPOINT}/actions/dso`,
      { currentMetrics },
      {
        headers: {
          Authorization: `Bearer ${process.env.FINANCIAL_AI_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return data.actions || [];
  }

  async generateDPOActions(currentMetrics) {
    const { data } = await axios.post(
      `${process.env.FINANCIAL_AI_ENDPOINT}/actions/dpo`,
      { currentMetrics },
      {
        headers: {
          Authorization: `Bearer ${process.env.FINANCIAL_AI_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return data.actions || [];
  }

  async generateDIOActions(currentMetrics) {
    const { data } = await axios.post(
      `${process.env.FINANCIAL_AI_ENDPOINT}/actions/dio`,
      { currentMetrics },
      {
        headers: {
          Authorization: `Bearer ${process.env.FINANCIAL_AI_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return data.actions || [];
  }

  async createImplementationRoadmap(optimization) {
    const { data } = await axios.post(
      `${process.env.FINANCIAL_AI_ENDPOINT}/roadmap/working-capital`,
      { optimization },
      {
        headers: {
          Authorization: `Bearer ${process.env.FINANCIAL_AI_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return data.milestones || [];
  }

  getMonthsAgoDate(months) {
    const date = new Date();
    date.setMonth(date.getMonth() - months);
    return date;
  }
}

export default EnterpriseCashCoverageEngine;
