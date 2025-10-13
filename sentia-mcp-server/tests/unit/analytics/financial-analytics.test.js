/**
 * Financial Analytics Test Suite
 * 
 * Comprehensive tests for the FinancialAnalytics class including:
 * - Revenue analysis and trends
 * - Profitability calculations
 * - Cash flow forecasting
 * - Customer lifetime value (CLV)
 * - Working capital optimization
 * - Financial KPI tracking
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FinancialAnalytics } from '../../../src/utils/financial-analytics.js';

describe('FinancialAnalytics', () => {
  let financialAnalytics;
  let mockConfig;

  beforeEach(() => {
    mockConfig = {
      enableForecasting: true,
      forecastHorizon: 12,
      enableRealTimeTracking: true,
      currencyPrecision: 2,
      defaultCurrency: 'USD',
      enableAlerts: true
    };

    financialAnalytics = new FinancialAnalytics(mockConfig);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default configuration', () => {
      const analytics = new FinancialAnalytics();
      expect(analytics).toBeDefined();
      expect(analytics.config).toBeDefined();
    });

    it('should initialize with custom configuration', () => {
      expect(financialAnalytics.config).toEqual(expect.objectContaining(mockConfig));
    });

    it('should initialize analytics components', () => {
      expect(financialAnalytics.revenueAnalyzer).toBeDefined();
      expect(financialAnalytics.profitabilityAnalyzer).toBeDefined();
      expect(financialAnalytics.cashFlowForecaster).toBeDefined();
      expect(financialAnalytics.clvCalculator).toBeDefined();
      expect(financialAnalytics.workingCapitalOptimizer).toBeDefined();
    });
  });

  describe('revenue analysis', () => {
    it('should analyze revenue trends', async () => {
      const revenueData = Array.from({ length: 12 }, (_, i) => ({
        month: `2024-${String(i + 1).padStart(2, '0')}`,
        revenue: 50000 + (i * 2000) + (Math.random() * 5000),
        transactions: 100 + (i * 5),
        averageOrderValue: 500 + (Math.random() * 100)
      }));

      const analysis = await financialAnalytics.analyzeRevenue(revenueData);

      expect(analysis).toBeDefined();
      expect(analysis.totalRevenue).toBeGreaterThan(0);
      expect(analysis.averageMonthlyRevenue).toBeGreaterThan(0);
      expect(analysis.growthRate).toBeDefined();
      expect(analysis.trend).toMatch(/^(upward|downward|stable)$/);
      expect(analysis.seasonality).toBeDefined();
      expect(analysis.volatility).toBeDefined();
    });

    it('should calculate revenue growth metrics', async () => {
      const revenueData = [
        { month: '2024-01', revenue: 50000 },
        { month: '2024-02', revenue: 52000 },
        { month: '2024-03', revenue: 55000 },
        { month: '2024-04', revenue: 53000 },
        { month: '2024-05', revenue: 58000 }
      ];

      const analysis = await financialAnalytics.analyzeRevenue(revenueData);

      expect(analysis.growthMetrics).toBeDefined();
      expect(analysis.growthMetrics.monthOverMonth).toBeDefined();
      expect(analysis.growthMetrics.yearOverYear).toBeDefined();
      expect(analysis.growthMetrics.compoundAnnualGrowthRate).toBeDefined();
      expect(analysis.growthMetrics.accelerationRate).toBeDefined();
    });

    it('should identify revenue patterns', async () => {
      // Create data with seasonal pattern
      const seasonalRevenue = Array.from({ length: 24 }, (_, i) => {
        const month = (i % 12) + 1;
        const seasonalFactor = month === 12 ? 1.5 : month <= 3 ? 0.8 : 1.0; // Holiday spike, Q1 dip
        return {
          month: `202${Math.floor(i / 12) + 3}-${String(month).padStart(2, '0')}`,
          revenue: 50000 * seasonalFactor + (Math.random() * 5000)
        };
      });

      const analysis = await financialAnalytics.analyzeRevenue(seasonalRevenue);

      expect(analysis.patterns).toBeDefined();
      expect(analysis.patterns.seasonal).toBeDefined();
      expect(analysis.patterns.seasonal.detected).toBe(true);
      expect(analysis.patterns.seasonal.peakMonths).toContain(12);
      expect(analysis.patterns.seasonal.lowMonths).toContain(1);
    });

    it('should handle currency conversion', async () => {
      const multiCurrencyData = [
        { month: '2024-01', revenue: 50000, currency: 'USD' },
        { month: '2024-02', revenue: 45000, currency: 'EUR' },
        { month: '2024-03', revenue: 6000000, currency: 'JPY' }
      ];

      const analysis = await financialAnalytics.analyzeRevenue(multiCurrencyData, {
        normalizedCurrency: 'USD',
        exchangeRates: {
          'EUR': 1.1,
          'JPY': 0.0067
        }
      });

      expect(analysis.normalizedRevenue).toBeDefined();
      expect(analysis.totalRevenue).toBeCloseTo(189500, 0); // Rough conversion
      expect(analysis.currencyBreakdown).toBeDefined();
    });
  });

  describe('profitability analysis', () => {
    it('should calculate comprehensive profitability metrics', async () => {
      const financialData = {
        revenue: [
          { month: '2024-01', amount: 100000 },
          { month: '2024-02', amount: 110000 },
          { month: '2024-03', amount: 105000 }
        ],
        costs: [
          { month: '2024-01', cogs: 60000, opex: 25000 },
          { month: '2024-02', cogs: 65000, opex: 26000 },
          { month: '2024-03', cogs: 62000, opex: 25500 }
        ],
        taxes: [
          { month: '2024-01', rate: 0.25 },
          { month: '2024-02', rate: 0.25 },
          { month: '2024-03', rate: 0.25 }
        ]
      };

      const analysis = await financialAnalytics.analyzeProfitability(financialData);

      expect(analysis).toBeDefined();
      expect(analysis.grossProfitMargin).toBeDefined();
      expect(analysis.operatingProfitMargin).toBeDefined();
      expect(analysis.netProfitMargin).toBeDefined();
      expect(analysis.ebitda).toBeDefined();
      expect(analysis.ebitdaMargin).toBeDefined();
      expect(analysis.profitabilityTrend).toBeDefined();
    });

    it('should analyze profit margins by segment', async () => {
      const segmentedData = {
        segments: [
          {
            name: 'Product Line A',
            revenue: 150000,
            costs: 90000,
            allocation: 0.6
          },
          {
            name: 'Product Line B',
            revenue: 100000,
            costs: 55000,
            allocation: 0.4
          }
        ]
      };

      const analysis = await financialAnalytics.analyzeSegmentProfitability(segmentedData);

      expect(analysis.segments).toBeDefined();
      expect(analysis.segments.length).toBe(2);
      
      analysis.segments.forEach(segment => {
        expect(segment.grossProfit).toBeDefined();
        expect(segment.grossProfitMargin).toBeDefined();
        expect(segment.profitContribution).toBeDefined();
        expect(segment.roi).toBeDefined();
      });

      expect(analysis.mostProfitable).toBeDefined();
      expect(analysis.leastProfitable).toBeDefined();
    });

    it('should calculate return on investment metrics', async () => {
      const investmentData = {
        initialInvestment: 500000,
        cashFlows: [
          { period: 1, amount: 80000 },
          { period: 2, amount: 120000 },
          { period: 3, amount: 150000 },
          { period: 4, amount: 180000 },
          { period: 5, amount: 200000 }
        ],
        discountRate: 0.1
      };

      const roiAnalysis = await financialAnalytics.calculateROI(investmentData);

      expect(roiAnalysis).toBeDefined();
      expect(roiAnalysis.simpleROI).toBeDefined();
      expect(roiAnalysis.annualizedROI).toBeDefined();
      expect(roiAnalysis.npv).toBeDefined();
      expect(roiAnalysis.irr).toBeDefined();
      expect(roiAnalysis.paybackPeriod).toBeDefined();
      expect(roiAnalysis.profitabilityIndex).toBeDefined();
    });
  });

  describe('cash flow forecasting', () => {
    it('should generate cash flow forecasts', async () => {
      const historicalCashFlow = Array.from({ length: 12 }, (_, i) => ({
        month: `202${Math.floor(i / 12) + 3}-${String((i % 12) + 1).padStart(2, '0')}`,
        inflow: 80000 + (Math.random() * 20000),
        outflow: 70000 + (Math.random() * 15000),
        netCashFlow: null // Will be calculated
      }));

      // Calculate net cash flow
      historicalCashFlow.forEach(flow => {
        flow.netCashFlow = flow.inflow - flow.outflow;
      });

      const forecast = await financialAnalytics.forecastCashFlow(historicalCashFlow, {
        periods: 6,
        includeScenarios: true,
        includeConfidenceIntervals: true
      });

      expect(forecast).toBeDefined();
      expect(forecast.periods).toBe(6);
      expect(forecast.predictions.length).toBe(6);
      
      forecast.predictions.forEach(prediction => {
        expect(prediction.period).toBeDefined();
        expect(prediction.projectedInflow).toBeDefined();
        expect(prediction.projectedOutflow).toBeDefined();
        expect(prediction.projectedNetCashFlow).toBeDefined();
        expect(prediction.confidence).toBeDefined();
      });

      expect(forecast.scenarios).toBeDefined();
      expect(forecast.scenarios.optimistic).toBeDefined();
      expect(forecast.scenarios.pessimistic).toBeDefined();
      expect(forecast.scenarios.mostLikely).toBeDefined();
    });

    it('should identify cash flow patterns', async () => {
      const cashFlowData = Array.from({ length: 24 }, (_, i) => {
        const month = (i % 12) + 1;
        // Simulate seasonal business with Q4 spike
        const seasonalMultiplier = month >= 10 ? 1.5 : month <= 2 ? 0.7 : 1.0;
        
        return {
          month: `202${Math.floor(i / 12) + 3}-${String(month).padStart(2, '0')}`,
          netCashFlow: 10000 * seasonalMultiplier + (Math.random() * 5000)
        };
      });

      const analysis = await financialAnalytics.analyzeCashFlowPatterns(cashFlowData);

      expect(analysis.seasonality).toBeDefined();
      expect(analysis.seasonality.detected).toBe(true);
      expect(analysis.trend).toBeDefined();
      expect(analysis.volatility).toBeDefined();
      expect(analysis.cyclicality).toBeDefined();
    });

    it('should calculate working capital requirements', async () => {
      const workingCapitalData = {
        currentAssets: {
          cash: 50000,
          accountsReceivable: 120000,
          inventory: 200000,
          otherCurrentAssets: 30000
        },
        currentLiabilities: {
          accountsPayable: 80000,
          shortTermDebt: 40000,
          accruedExpenses: 25000,
          otherCurrentLiabilities: 15000
        },
        salesData: {
          annualSales: 1200000,
          daysInPeriod: 365
        }
      };

      const analysis = await financialAnalytics.analyzeWorkingCapital(workingCapitalData);

      expect(analysis).toBeDefined();
      expect(analysis.workingCapital).toBe(240000); // 400000 - 160000
      expect(analysis.currentRatio).toBeCloseTo(2.5, 1); // 400000 / 160000
      expect(analysis.quickRatio).toBeDefined();
      expect(analysis.cashConversionCycle).toBeDefined();
      expect(analysis.daysReceivableOutstanding).toBeDefined();
      expect(analysis.daysInventoryOutstanding).toBeDefined();
      expect(analysis.daysPayableOutstanding).toBeDefined();
    });
  });

  describe('customer lifetime value (CLV)', () => {
    it('should calculate CLV for individual customers', async () => {
      const customerData = {
        customerId: 'CUST001',
        acquisitionDate: '2023-01-15',
        transactions: [
          { date: '2023-01-15', amount: 500, costs: 300 },
          { date: '2023-03-20', amount: 750, costs: 450 },
          { date: '2023-06-10', amount: 600, costs: 360 },
          { date: '2023-09-05', amount: 800, costs: 480 },
          { date: '2023-12-20', amount: 900, costs: 540 }
        ],
        retentionProbability: 0.85,
        discountRate: 0.1
      };

      const clvAnalysis = await financialAnalytics.calculateCustomerCLV(customerData);

      expect(clvAnalysis).toBeDefined();
      expect(clvAnalysis.customerId).toBe('CUST001');
      expect(clvAnalysis.historicalValue).toBeDefined();
      expect(clvAnalysis.predictedLifetime).toBeDefined();
      expect(clvAnalysis.futureValue).toBeDefined();
      expect(clvAnalysis.totalCLV).toBeDefined();
      expect(clvAnalysis.averageOrderValue).toBeDefined();
      expect(clvAnalysis.purchaseFrequency).toBeDefined();
      expect(clvAnalysis.retentionRate).toBeDefined();
    });

    it('should perform cohort CLV analysis', async () => {
      const cohortData = {
        cohortId: '2023-Q1',
        acquisitionPeriod: '2023-01-01',
        customers: Array.from({ length: 100 }, (_, i) => ({
          customerId: `CUST${String(i + 1).padStart(3, '0')}`,
          acquisitionDate: '2023-02-15',
          totalSpent: Math.random() * 5000 + 1000,
          transactionCount: Math.floor(Math.random() * 10) + 1,
          lastPurchase: '2024-01-20',
          isActive: Math.random() > 0.3
        }))
      };

      const cohortAnalysis = await financialAnalytics.analyzeCohortCLV(cohortData);

      expect(cohortAnalysis).toBeDefined();
      expect(cohortAnalysis.cohortId).toBe('2023-Q1');
      expect(cohortAnalysis.cohortSize).toBe(100);
      expect(cohortAnalysis.averageCLV).toBeDefined();
      expect(cohortAnalysis.medianCLV).toBeDefined();
      expect(cohortAnalysis.retentionRates).toBeDefined();
      expect(cohortAnalysis.revenueByPeriod).toBeDefined();
      expect(cohortAnalysis.churnAnalysis).toBeDefined();
    });

    it('should segment customers by CLV', async () => {
      const customerBase = Array.from({ length: 1000 }, (_, i) => ({
        customerId: `CUST${String(i + 1).padStart(4, '0')}`,
        clv: Math.random() * 10000 + 500,
        acquisitionCost: Math.random() * 200 + 50,
        segment: null // To be calculated
      }));

      const segmentation = await financialAnalytics.segmentCustomersByCLV(customerBase, {
        segmentCount: 5,
        method: 'quintile'
      });

      expect(segmentation).toBeDefined();
      expect(segmentation.segments.length).toBe(5);
      
      segmentation.segments.forEach((segment, index) => {
        expect(segment.name).toBeDefined();
        expect(segment.customers.length).toBeGreaterThan(0);
        expect(segment.averageCLV).toBeDefined();
        expect(segment.minCLV).toBeDefined();
        expect(segment.maxCLV).toBeDefined();
        
        if (index > 0) {
          expect(segment.minCLV).toBeGreaterThanOrEqual(
            segmentation.segments[index - 1].maxCLV
          );
        }
      });

      expect(segmentation.recommendations).toBeDefined();
    });
  });

  describe('financial KPI tracking', () => {
    it('should calculate comprehensive financial KPIs', async () => {
      const financialData = {
        revenue: 1200000,
        grossProfit: 720000,
        operatingProfit: 240000,
        netProfit: 180000,
        totalAssets: 800000,
        totalEquity: 500000,
        currentAssets: 300000,
        currentLiabilities: 150000,
        inventory: 100000,
        accountsReceivable: 80000,
        accountsPayable: 60000,
        costOfGoodsSold: 480000,
        operatingExpenses: 480000
      };

      const kpis = await financialAnalytics.calculateFinancialKPIs(financialData);

      expect(kpis).toBeDefined();
      
      // Profitability ratios
      expect(kpis.grossProfitMargin).toBeCloseTo(0.6, 2); // 720000/1200000
      expect(kpis.operatingProfitMargin).toBeCloseTo(0.2, 2); // 240000/1200000
      expect(kpis.netProfitMargin).toBeCloseTo(0.15, 2); // 180000/1200000
      
      // Liquidity ratios
      expect(kpis.currentRatio).toBeCloseTo(2.0, 1); // 300000/150000
      expect(kpis.quickRatio).toBeCloseTo(1.33, 2); // (300000-100000)/150000
      
      // Efficiency ratios
      expect(kpis.assetTurnover).toBeCloseTo(1.5, 1); // 1200000/800000
      expect(kpis.inventoryTurnover).toBeCloseTo(4.8, 1); // 480000/100000
      expect(kpis.receivablesTurnover).toBeCloseTo(15, 0); // 1200000/80000
      
      // Leverage ratios
      expect(kpis.debtToEquityRatio).toBeCloseTo(0.6, 1); // (800000-500000)/500000
      expect(kpis.equityRatio).toBeCloseTo(0.625, 3); // 500000/800000
    });

    it('should track KPI trends over time', async () => {
      const historicalKPIs = Array.from({ length: 12 }, (_, i) => ({
        period: `2024-${String(i + 1).padStart(2, '0')}`,
        grossProfitMargin: 0.6 + (Math.random() * 0.1 - 0.05),
        netProfitMargin: 0.15 + (Math.random() * 0.05 - 0.025),
        currentRatio: 2.0 + (Math.random() * 0.5 - 0.25),
        inventoryTurnover: 4.8 + (Math.random() * 1.0 - 0.5)
      }));

      const trendAnalysis = await financialAnalytics.analyzeKPITrends(historicalKPIs);

      expect(trendAnalysis).toBeDefined();
      expect(trendAnalysis.trends).toBeDefined();
      
      Object.keys(trendAnalysis.trends).forEach(kpi => {
        expect(trendAnalysis.trends[kpi].direction).toMatch(/^(improving|declining|stable)$/);
        expect(trendAnalysis.trends[kpi].changeRate).toBeDefined();
        expect(trendAnalysis.trends[kpi].volatility).toBeDefined();
      });

      expect(trendAnalysis.alerts).toBeDefined();
      expect(trendAnalysis.recommendations).toBeDefined();
    });

    it('should benchmark KPIs against industry standards', async () => {
      const companyKPIs = {
        grossProfitMargin: 0.65,
        netProfitMargin: 0.12,
        currentRatio: 1.8,
        inventoryTurnover: 6.2,
        receivablesTurnover: 12.5
      };

      const industryBenchmarks = {
        manufacturing: {
          grossProfitMargin: { median: 0.58, p25: 0.45, p75: 0.68 },
          netProfitMargin: { median: 0.08, p25: 0.04, p75: 0.15 },
          currentRatio: { median: 1.5, p25: 1.2, p75: 2.1 },
          inventoryTurnover: { median: 5.2, p25: 3.8, p75: 7.1 },
          receivablesTurnover: { median: 10.5, p25: 8.2, p75: 14.8 }
        }
      };

      const benchmark = await financialAnalytics.benchmarkKPIs(
        companyKPIs, 
        industryBenchmarks.manufacturing
      );

      expect(benchmark).toBeDefined();
      
      Object.keys(companyKPIs).forEach(kpi => {
        expect(benchmark[kpi]).toBeDefined();
        expect(benchmark[kpi].value).toBe(companyKPIs[kpi]);
        expect(benchmark[kpi].percentile).toBeDefined();
        expect(benchmark[kpi].performance).toMatch(/^(above_median|below_median|at_median)$/);
        expect(benchmark[kpi].recommendation).toBeDefined();
      });

      expect(benchmark.overallScore).toBeDefined();
      expect(benchmark.strengths).toBeDefined();
      expect(benchmark.improvementAreas).toBeDefined();
    });
  });

  describe('insights generation', () => {
    it('should generate financial insights', async () => {
      const financialData = {
        revenue: Array.from({ length: 12 }, (_, i) => ({
          month: `2024-${String(i + 1).padStart(2, '0')}`,
          amount: 100000 + (i * 2000) + (Math.random() * 10000)
        })),
        expenses: Array.from({ length: 12 }, (_, i) => ({
          month: `2024-${String(i + 1).padStart(2, '0')}`,
          amount: 80000 + (i * 1500) + (Math.random() * 8000)
        })),
        cashFlow: Array.from({ length: 12 }, (_, i) => ({
          month: `2024-${String(i + 1).padStart(2, '0')}`,
          amount: 20000 + (i * 500) + (Math.random() * 5000)
        }))
      };

      const insights = await financialAnalytics.generateInsights(financialData, {
        priority: 'high',
        includeRecommendations: true
      });

      expect(Array.isArray(insights)).toBe(true);
      expect(insights.length).toBeGreaterThan(0);

      insights.forEach(insight => {
        expect(insight.id).toBeDefined();
        expect(insight.type).toBeDefined();
        expect(insight.category).toBe('financial');
        expect(insight.priority).toBeDefined();
        expect(insight.title).toBeDefined();
        expect(insight.description).toBeDefined();
        expect(insight.impact).toBeDefined();
        expect(insight.confidence).toBeGreaterThan(0);
        expect(insight.actionable).toBeDefined();
        
        if (insight.actionable) {
          expect(insight.recommendations).toBeDefined();
          expect(Array.isArray(insight.recommendations)).toBe(true);
        }
      });
    });

    it('should prioritize insights by impact', async () => {
      const mockData = {
        revenue: [{ month: '2024-01', amount: 100000 }],
        expenses: [{ month: '2024-01', amount: 120000 }] // Negative margin
      };

      const insights = await financialAnalytics.generateInsights(mockData, {
        priority: 'all'
      });

      const highPriorityInsights = insights.filter(i => i.priority === 'high' || i.priority === 'critical');
      expect(highPriorityInsights.length).toBeGreaterThan(0);

      // Should identify negative margin as critical
      const marginInsight = insights.find(i => i.title.toLowerCase().includes('margin'));
      expect(marginInsight).toBeDefined();
      expect(['high', 'critical']).toContain(marginInsight.priority);
    });
  });

  describe('error handling and validation', () => {
    it('should handle missing financial data', async () => {
      const incompleteData = {
        revenue: [{ month: '2024-01', amount: 100000 }]
        // Missing costs and other required data
      };

      const analysis = await financialAnalytics.analyzeFinancialData(incompleteData);

      expect(analysis).toBeDefined();
      expect(analysis.warnings).toBeDefined();
      expect(analysis.warnings.length).toBeGreaterThan(0);
      expect(analysis.completeness).toBeLessThan(1.0);
    });

    it('should validate financial data integrity', async () => {
      const invalidData = {
        revenue: [
          { month: '2024-01', amount: -100000 }, // Negative revenue
          { month: '2024-02', amount: 'invalid' }, // Non-numeric
          { month: 'invalid-date', amount: 50000 } // Invalid date
        ]
      };

      await expect(financialAnalytics.analyzeFinancialData(invalidData, {
        strict: true
      })).rejects.toThrow('Data validation failed');
    });

    it('should handle currency and formatting issues', async () => {
      const messyData = {
        revenue: [
          { month: '2024-01', amount: '$100,000.50', currency: 'USD' },
          { month: '2024-02', amount: '€85,000.75', currency: 'EUR' },
          { month: '2024-03', amount: 120000, currency: undefined }
        ]
      };

      const analysis = await financialAnalytics.analyzeFinancialData(messyData, {
        sanitizeData: true,
        defaultCurrency: 'USD'
      });

      expect(analysis).toBeDefined();
      expect(analysis.sanitizedData).toBeDefined();
      expect(analysis.normalizedRevenue).toBeDefined();
    });

    it('should provide meaningful error messages', async () => {
      try {
        await financialAnalytics.calculateROI({
          initialInvestment: 0, // Invalid
          cashFlows: []
        });
      } catch (error) {
        expect(error.message).toContain('Initial investment must be greater than zero');
        expect(error.code).toBe('INVALID_INVESTMENT_DATA');
      }
    });
  });

  describe('performance and caching', () => {
    it('should cache complex calculations', async () => {
      const largeDataset = {
        revenue: Array.from({ length: 1000 }, (_, i) => ({
          month: `202${Math.floor(i / 12) + 1}-${String((i % 12) + 1).padStart(2, '0')}`,
          amount: Math.random() * 100000
        }))
      };

      const cacheKey = 'large-revenue-analysis';

      // First calculation should cache results
      const startTime1 = Date.now();
      const result1 = await financialAnalytics.analyzeFinancialData(largeDataset, {
        cacheKey,
        enableCaching: true
      });
      const duration1 = Date.now() - startTime1;

      // Second calculation should use cache
      const startTime2 = Date.now();
      const result2 = await financialAnalytics.analyzeFinancialData(largeDataset, {
        cacheKey,
        enableCaching: true
      });
      const duration2 = Date.now() - startTime2;

      expect(result2.fromCache).toBe(true);
      expect(duration2).toBeLessThan(duration1);
      expect(result1.analysisId).toBe(result2.analysisId);
    });

    it('should handle large datasets efficiently', async () => {
      const massiveDataset = {
        revenue: Array.from({ length: 10000 }, (_, i) => ({
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
          amount: Math.random() * 10000
        }))
      };

      const startTime = Date.now();
      const analysis = await financialAnalytics.analyzeFinancialData(massiveDataset, {
        optimizePerformance: true
      });
      const duration = Date.now() - startTime;

      expect(analysis).toBeDefined();
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
      expect(analysis.performance).toBeDefined();
      expect(analysis.performance.dataPoints).toBe(10000);
      expect(analysis.performance.processingTime).toBeDefined();
    });
  });
});