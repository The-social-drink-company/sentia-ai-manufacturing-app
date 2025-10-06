/**
 * Xero Business Intelligence and Analytics
 * 
 * Advanced analytics and business intelligence capabilities for Xero financial data
 * including KPI calculations, trend analysis, and financial forecasting.
 * 
 * @version 1.0.0
 */

import { createLogger } from '../../../utils/logger.js';

const logger = createLogger();

/**
 * Xero Analytics Class
 */
export class XeroAnalytics {
  constructor(options = {}) {
    this.options = {
      // Historical data for trend analysis (in months)
      trendAnalysisPeriod: options.trendAnalysisPeriod || 12,
      
      // Industry benchmarks (can be customized per industry)
      benchmarks: {
        currentRatio: { good: 2.0, warning: 1.5, critical: 1.0 },
        quickRatio: { good: 1.0, warning: 0.75, critical: 0.5 },
        daysPayableOutstanding: { good: 45, warning: 60, critical: 90 },
        daysReceivableOutstanding: { good: 30, warning: 45, critical: 60 },
        daysInventoryOutstanding: { good: 45, warning: 60, critical: 90 },
        grossMargin: { good: 0.4, warning: 0.25, critical: 0.1 },
        ...options.benchmarks
      },
      
      ...options
    };

    // Performance tracking
    this.performanceMetrics = {
      toolExecutions: new Map(),
      totalExecutions: 0,
      totalExecutionTime: 0,
      errors: 0,
      cacheHits: 0
    };

    logger.info('Xero Analytics initialized', {
      trendAnalysisPeriod: this.options.trendAnalysisPeriod,
      benchmarksConfigured: Object.keys(this.options.benchmarks).length
    });
  }

  /**
   * Calculate key financial ratios
   */
  calculateFinancialRatios(balanceSheet, profitLoss = null) {
    try {
      const ratios = {};

      if (!balanceSheet || !balanceSheet.Reports || !balanceSheet.Reports[0]) {
        throw new Error('Invalid balance sheet data');
      }

      const report = balanceSheet.Reports[0];
      const rows = report.Rows || [];

      // Extract financial data from balance sheet
      const financialData = this.extractFinancialData(rows);

      // Liquidity Ratios
      ratios.currentRatio = this.calculateCurrentRatio(financialData);
      ratios.quickRatio = this.calculateQuickRatio(financialData);
      ratios.cashRatio = this.calculateCashRatio(financialData);

      // Efficiency Ratios (if P&L data is available)
      if (profitLoss) {
        const plData = this.extractProfitLossData(profitLoss);
        ratios.assetTurnover = this.calculateAssetTurnover(plData, financialData);
        ratios.inventoryTurnover = this.calculateInventoryTurnover(plData, financialData);
        ratios.receivablesTurnover = this.calculateReceivablesTurnover(plData, financialData);
      }

      // Leverage Ratios
      ratios.debtToAssets = this.calculateDebtToAssets(financialData);
      ratios.debtToEquity = this.calculateDebtToEquity(financialData);
      ratios.equityRatio = this.calculateEquityRatio(financialData);

      // Working Capital Metrics
      ratios.workingCapital = this.calculateWorkingCapital(financialData);
      ratios.workingCapitalRatio = this.calculateWorkingCapitalRatio(financialData);

      // Add benchmark comparisons
      ratios.benchmarkAnalysis = this.compareWithBenchmarks(ratios);

      logger.info('Financial ratios calculated', {
        ratiosCount: Object.keys(ratios).length,
        hasP_L: !!profitLoss
      });

      return ratios;

    } catch (error) {
      logger.error('Financial ratio calculation failed', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Calculate Cash Conversion Cycle components
   */
  calculateCashConversionCycle(balanceSheet, profitLoss, previousBalanceSheet = null) {
    try {
      const cccComponents = {};

      const currentData = this.extractFinancialData(balanceSheet.Reports[0].Rows);
      const plData = this.extractProfitLossData(profitLoss);
      
      // Get previous period data for averages
      let previousData = null;
      if (previousBalanceSheet) {
        previousData = this.extractFinancialData(previousBalanceSheet.Reports[0].Rows);
      }

      // Days Sales Outstanding (DSO)
      cccComponents.DSO = this.calculateDSO(currentData, plData, previousData);

      // Days Payable Outstanding (DPO)
      cccComponents.DPO = this.calculateDPO(currentData, plData, previousData);

      // Days Inventory Outstanding (DIO)
      cccComponents.DIO = this.calculateDIO(currentData, plData, previousData);

      // Cash Conversion Cycle
      cccComponents.CCC = cccComponents.DSO + cccComponents.DIO - cccComponents.DPO;

      // Industry comparison
      cccComponents.industryComparison = this.compareCCCWithIndustry(cccComponents);

      logger.info('Cash Conversion Cycle calculated', {
        DSO: cccComponents.DSO,
        DPO: cccComponents.DPO,
        DIO: cccComponents.DIO,
        CCC: cccComponents.CCC
      });

      return cccComponents;

    } catch (error) {
      logger.error('Cash Conversion Cycle calculation failed', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Analyze cash flow trends
   */
  analyzeCashFlowTrends(cashFlowReports) {
    try {
      if (!Array.isArray(cashFlowReports) || cashFlowReports.length === 0) {
        throw new Error('Invalid cash flow data');
      }

      const trends = {
        operatingCashFlow: [],
        investingCashFlow: [],
        financingCashFlow: [],
        netCashFlow: [],
        periods: []
      };

      // Extract cash flow data for each period
      for (const report of cashFlowReports) {
        const cashFlowData = this.extractCashFlowData(report);
        
        trends.operatingCashFlow.push(cashFlowData.operatingCashFlow);
        trends.investingCashFlow.push(cashFlowData.investingCashFlow);
        trends.financingCashFlow.push(cashFlowData.financingCashFlow);
        trends.netCashFlow.push(cashFlowData.netCashFlow);
        trends.periods.push(cashFlowData.period);
      }

      // Calculate trend statistics
      trends.analysis = {
        operatingTrend: this.calculateTrend(trends.operatingCashFlow),
        investingTrend: this.calculateTrend(trends.investingCashFlow),
        financingTrend: this.calculateTrend(trends.financingCashFlow),
        netCashTrend: this.calculateTrend(trends.netCashFlow),
        volatility: this.calculateVolatility(trends.netCashFlow),
        averageOperatingCashFlow: this.calculateAverage(trends.operatingCashFlow)
      };

      // Cash flow health assessment
      trends.healthAssessment = this.assessCashFlowHealth(trends);

      logger.info('Cash flow trends analyzed', {
        periodsAnalyzed: trends.periods.length,
        operatingTrend: trends.analysis.operatingTrend,
        healthScore: trends.healthAssessment.score
      });

      return trends;

    } catch (error) {
      logger.error('Cash flow trend analysis failed', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Generate financial forecasts
   */
  generateFinancialForecast(historicalData, forecastPeriods = 12) {
    try {
      const forecast = {
        revenue: [],
        expenses: [],
        cashFlow: [],
        periods: [],
        confidence: [],
        assumptions: []
      };

      // Revenue forecasting using trend analysis
      const revenueTrend = this.calculateTrend(historicalData.revenue);
      const revenueSeasonality = this.detectSeasonality(historicalData.revenue);

      for (let i = 1; i <= forecastPeriods; i++) {
        const forecastPeriod = this.addMonths(new Date(), i);
        
        // Base forecast on trend
        const baseForecast = this.projectTrend(historicalData.revenue, i, revenueTrend);
        
        // Apply seasonality adjustment
        const seasonalAdjustment = this.applySeasonality(baseForecast, i, revenueSeasonality);
        
        // Calculate confidence based on historical variance
        const confidence = this.calculateForecastConfidence(historicalData.revenue, i);
        
        forecast.revenue.push(seasonalAdjustment);
        forecast.periods.push(forecastPeriod);
        forecast.confidence.push(confidence);
      }

      // Expense forecasting
      forecast.expenses = this.forecastExpenses(historicalData, forecastPeriods);

      // Cash flow forecasting
      forecast.cashFlow = forecast.revenue.map((rev, index) => 
        rev - forecast.expenses[index]
      );

      // Add forecast assumptions
      forecast.assumptions = this.generateForecastAssumptions(historicalData, revenueTrend);

      logger.info('Financial forecast generated', {
        forecastPeriods,
        averageConfidence: this.calculateAverage(forecast.confidence),
        totalForecastRevenue: forecast.revenue.reduce((sum, val) => sum + val, 0)
      });

      return forecast;

    } catch (error) {
      logger.error('Financial forecast generation failed', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Identify overdue payments and aging analysis
   */
  analyzeReceivablesAging(invoices) {
    try {
      const aging = {
        current: { amount: 0, count: 0 },        // 0-30 days
        thirtyDays: { amount: 0, count: 0 },     // 31-60 days
        sixtyDays: { amount: 0, count: 0 },      // 61-90 days
        ninetyDays: { amount: 0, count: 0 },     // 91+ days
        total: { amount: 0, count: 0 }
      };

      const today = new Date();
      const riskCustomers = [];
      const overduePayments = [];

      for (const invoice of invoices) {
        if (invoice.Type !== 'ACCREC' || invoice.Status === 'PAID') {
          continue; // Skip non-receivable or paid invoices
        }

        const dueDate = new Date(invoice.DueDateString || invoice.DateString);
        const daysPastDue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
        const amountDue = parseFloat(invoice.AmountDue || invoice.Total || 0);

        aging.total.amount += amountDue;
        aging.total.count += 1;

        // Categorize by aging bucket
        if (daysPastDue <= 30) {
          aging.current.amount += amountDue;
          aging.current.count += 1;
        } else if (daysPastDue <= 60) {
          aging.thirtyDays.amount += amountDue;
          aging.thirtyDays.count += 1;
        } else if (daysPastDue <= 90) {
          aging.sixtyDays.amount += amountDue;
          aging.sixtyDays.count += 1;
        } else {
          aging.ninetyDays.amount += amountDue;
          aging.ninetyDays.count += 1;
        }

        // Identify overdue payments
        if (daysPastDue > 0) {
          overduePayments.push({
            invoiceNumber: invoice.InvoiceNumber,
            contact: invoice.Contact?.Name,
            amount: amountDue,
            daysPastDue,
            dueDate: invoice.DueDateString,
            riskLevel: this.assessPaymentRisk(daysPastDue, amountDue)
          });
        }

        // Identify risk customers
        if (daysPastDue > 30) {
          const existingCustomer = riskCustomers.find(c => 
            c.contactID === invoice.Contact?.ContactID
          );
          
          if (existingCustomer) {
            existingCustomer.totalOverdue += amountDue;
            existingCustomer.overdueInvoices += 1;
          } else {
            riskCustomers.push({
              contactID: invoice.Contact?.ContactID,
              contactName: invoice.Contact?.Name,
              totalOverdue: amountDue,
              overdueInvoices: 1,
              maxDaysPastDue: daysPastDue
            });
          }
        }
      }

      // Calculate percentages
      aging.percentages = {
        current: (aging.current.amount / aging.total.amount) * 100,
        thirtyDays: (aging.thirtyDays.amount / aging.total.amount) * 100,
        sixtyDays: (aging.sixtyDays.amount / aging.total.amount) * 100,
        ninetyDays: (aging.ninetyDays.amount / aging.total.amount) * 100
      };

      // Risk assessment
      aging.riskAssessment = {
        lowRisk: aging.percentages.current + aging.percentages.thirtyDays,
        mediumRisk: aging.percentages.sixtyDays,
        highRisk: aging.percentages.ninetyDays,
        recommendedActions: this.generateReceivablesRecommendations(aging)
      };

      logger.info('Receivables aging analysis completed', {
        totalAmount: aging.total.amount,
        totalInvoices: aging.total.count,
        overdueCount: overduePayments.length,
        riskCustomers: riskCustomers.length
      });

      return {
        aging,
        overduePayments: overduePayments.sort((a, b) => b.daysPastDue - a.daysPastDue),
        riskCustomers: riskCustomers.sort((a, b) => b.totalOverdue - a.totalOverdue)
      };

    } catch (error) {
      logger.error('Receivables aging analysis failed', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Record tool execution performance
   */
  recordToolExecution(toolName, executionTime, success) {
    this.performanceMetrics.totalExecutions++;
    this.performanceMetrics.totalExecutionTime += executionTime;

    if (!this.performanceMetrics.toolExecutions.has(toolName)) {
      this.performanceMetrics.toolExecutions.set(toolName, {
        executions: 0,
        totalTime: 0,
        errors: 0,
        averageTime: 0
      });
    }

    const toolStats = this.performanceMetrics.toolExecutions.get(toolName);
    toolStats.executions++;
    toolStats.totalTime += executionTime;
    toolStats.averageTime = toolStats.totalTime / toolStats.executions;

    if (!success) {
      toolStats.errors++;
      this.performanceMetrics.errors++;
    }
  }

  /**
   * Get performance statistics
   */
  getStats() {
    const stats = {
      totalExecutions: this.performanceMetrics.totalExecutions,
      averageExecutionTime: this.performanceMetrics.totalExecutions > 0 
        ? this.performanceMetrics.totalExecutionTime / this.performanceMetrics.totalExecutions
        : 0,
      errorRate: this.performanceMetrics.totalExecutions > 0 
        ? (this.performanceMetrics.errors / this.performanceMetrics.totalExecutions) * 100
        : 0,
      toolStats: Object.fromEntries(this.performanceMetrics.toolExecutions)
    };

    return stats;
  }

  // Helper methods for financial calculations

  extractFinancialData(rows) {
    const data = {};
    // Implementation would parse Xero balance sheet structure
    // This is a simplified example
    return data;
  }

  extractProfitLossData(profitLoss) {
    const data = {};
    // Implementation would parse Xero P&L structure
    return data;
  }

  calculateCurrentRatio(data) {
    return (data.currentAssets || 0) / (data.currentLiabilities || 1);
  }

  calculateQuickRatio(data) {
    const quickAssets = (data.currentAssets || 0) - (data.inventory || 0);
    return quickAssets / (data.currentLiabilities || 1);
  }

  calculateCashRatio(data) {
    return (data.cash || 0) / (data.currentLiabilities || 1);
  }

  calculateWorkingCapital(data) {
    return (data.currentAssets || 0) - (data.currentLiabilities || 0);
  }

  calculateWorkingCapitalRatio(data) {
    return this.calculateWorkingCapital(data) / (data.currentAssets || 1);
  }

  calculateDebtToAssets(data) {
    return (data.totalLiabilities || 0) / (data.totalAssets || 1);
  }

  calculateDebtToEquity(data) {
    return (data.totalLiabilities || 0) / (data.totalEquity || 1);
  }

  calculateEquityRatio(data) {
    return (data.totalEquity || 0) / (data.totalAssets || 1);
  }

  compareWithBenchmarks(ratios) {
    const comparison = {};
    
    for (const [metric, value] of Object.entries(ratios)) {
      if (this.options.benchmarks[metric]) {
        const benchmark = this.options.benchmarks[metric];
        comparison[metric] = {
          value,
          status: value >= benchmark.good ? 'good' 
            : value >= benchmark.warning ? 'warning' 
            : 'critical',
          benchmark: benchmark.good
        };
      }
    }
    
    return comparison;
  }

  calculateTrend(data) {
    if (data.length < 2) return 0;
    
    const n = data.length;
    const x = Array.from({length: n}, (_, i) => i);
    const y = data;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }

  calculateAverage(data) {
    return data.length > 0 ? data.reduce((a, b) => a + b, 0) / data.length : 0;
  }

  calculateVolatility(data) {
    const avg = this.calculateAverage(data);
    const variance = data.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / data.length;
    return Math.sqrt(variance);
  }

  addMonths(date, months) {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  }

  assessPaymentRisk(daysPastDue, amount) {
    if (daysPastDue > 90 || amount > 10000) return 'high';
    if (daysPastDue > 60 || amount > 5000) return 'medium';
    return 'low';
  }

  generateReceivablesRecommendations(aging) {
    const recommendations = [];
    
    if (aging.percentages.ninetyDays > 20) {
      recommendations.push('Consider debt collection services for 90+ day overdue accounts');
    }
    
    if (aging.percentages.sixtyDays > 15) {
      recommendations.push('Implement stricter credit terms for new customers');
    }
    
    if (aging.percentages.current < 60) {
      recommendations.push('Review payment terms and collection processes');
    }
    
    return recommendations;
  }
}