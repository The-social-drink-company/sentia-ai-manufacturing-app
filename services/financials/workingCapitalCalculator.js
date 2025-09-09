import { logInfo, logWarn, logError } from '../observability/structuredLogger.js';

export class WorkingCapitalCalculator {
  constructor(databaseService) {
    this.databaseService = databaseService;
    this.calculationCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async calculateWorkingCapitalMetrics(companyId = 'default', periodDays = 365) {
    const cacheKey = `wc_metrics_${companyId}_${periodDays}`;
    
    // Check cache first
    const cached = this.calculationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      logInfo('Returning cached working capital metrics');
      return cached.data;
    }

    try {
      logInfo('Calculating working capital metrics', { companyId, periodDays });

      // Get current date and period start date
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - periodDays * 24 * 60 * 60 * 1000);

      // Calculate all components in parallel
      const [dso, dpo, dio, currentAssets, currentLiabilities] = await Promise.all([
        this.calculateDSO(companyId, startDate, endDate),
        this.calculateDPO(companyId, startDate, endDate),
        this.calculateDIO(companyId, startDate, endDate),
        this.calculateCurrentAssets(companyId),
        this.calculateCurrentLiabilities(companyId)
      ]);

      // Calculate working capital components
      const workingCapital = currentAssets.total - currentLiabilities.total;
      const workingCapitalRatio = currentLiabilities.total > 0 
        ? currentAssets.total / currentLiabilities.total 
        : 0;

      // Calculate cash conversion cycle
      const cashConversionCycle = dso.days + dio.days - dpo.days;

      // Calculate working capital efficiency metrics
      const metrics = {
        // Core working capital metrics
        workingCapital: {
          amount: workingCapital,
          ratio: workingCapitalRatio,
          currency: 'GBP',
          asOfDate: endDate
        },
        
        // Current assets breakdown
        currentAssets: {
          total: currentAssets.total,
          accountsReceivable: currentAssets.accountsReceivable,
          inventory: currentAssets.inventory,
          cash: currentAssets.cash,
          otherAssets: currentAssets.other,
          currency: 'GBP'
        },

        // Current liabilities breakdown
        currentLiabilities: {
          total: currentLiabilities.total,
          accountsPayable: currentLiabilities.accountsPayable,
          shortTermDebt: currentLiabilities.shortTermDebt,
          accruedExpenses: currentLiabilities.accruedExpenses,
          otherLiabilities: currentLiabilities.other,
          currency: 'GBP'
        },

        // Days metrics
        dso: {
          days: dso.days,
          accountsReceivable: dso.accountsReceivable,
          dailyRevenue: dso.dailyRevenue,
          formula: 'Accounts Receivable / (Revenue / Days)',
          benchmark: { excellent: '<30', good: '30-45', poor: '>60' }
        },

        dpo: {
          days: dpo.days,
          accountsPayable: dpo.accountsPayable,
          dailyCOGS: dpo.dailyCOGS,
          formula: 'Accounts Payable / (COGS / Days)',
          benchmark: { excellent: '>45', good: '30-45', poor: '<30' }
        },

        dio: {
          days: dio.days,
          averageInventory: dio.averageInventory,
          dailyCOGS: dio.dailyCOGS,
          formula: 'Average Inventory / (COGS / Days)',
          benchmark: { excellent: '<30', good: '30-60', poor: '>90' }
        },

        // Advanced metrics
        cashConversionCycle: {
          days: cashConversionCycle,
          formula: 'DSO + DIO - DPO',
          interpretation: cashConversionCycle > 0 
            ? 'Company invests cash before collecting from sales'
            : 'Company collects cash before paying suppliers',
          benchmark: { excellent: '<30', good: '30-60', poor: '>90' }
        },

        // Efficiency ratios
        efficiencyMetrics: {
          workingCapitalTurnover: this.calculateWorkingCapitalTurnover(
            dso.dailyRevenue * periodDays, workingCapital
          ),
          receivablesTurnover: periodDays / (dso.days || 1),
          inventoryTurnover: periodDays / (dio.days || 1),
          payablesTurnover: periodDays / (dpo.days || 1)
        },

        // Period information
        calculationPeriod: {
          startDate,
          endDate,
          days: periodDays
        },

        // Data quality indicators
        dataQuality: {
          hasRealARData: dso.hasRealData,
          hasRealAPData: dpo.hasRealData,
          hasRealInventoryData: dio.hasRealData,
          completeness: this.assessDataCompleteness(dso, dpo, dio)
        },

        calculatedAt: new Date(),
        cacheExpiresAt: new Date(Date.now() + this.cacheTimeout)
      };

      // Cache the results
      this.calculationCache.set(cacheKey, {
        data: metrics,
        timestamp: Date.now()
      });

      logInfo('Working capital metrics calculated successfully', {
        workingCapital: metrics.workingCapital.amount,
        dso: metrics.dso.days,
        dpo: metrics.dpo.days,
        dio: metrics.dio.days,
        cashConversionCycle: metrics.cashConversionCycle.days
      });

      return metrics;

    } catch (error) {
      logError('Failed to calculate working capital metrics', error);
      
      // Return fallback metrics with error indication
      return this.getFallbackMetrics(companyId, error);
    }
  }

  async calculateDSO(companyId, startDate, endDate) {
    try {
      if (!this.databaseService.isConnected) {
        logWarn('Database not connected, using estimated DSO');
        return {
          days: 45, // Industry average
          accountsReceivable: 150000,
          dailyRevenue: 3333.33,
          hasRealData: false,
          source: 'estimated'
        };
      }

      // Get accounts receivable from database (fallback if model doesn't exist)
      let accountsReceivable;
      try {
        accountsReceivable = await this.databaseService.prisma.workingCapital.aggregate({
          where: {
            entity_id: companyId,
            projectionDate: {
              gte: startDate,
              lte: endDate
            }
          },
          _sum: {
            actual_sales_revenue: true
          }
        });
      } catch (error) {
        // Fallback to estimated values if table doesn't exist
        logWarn('Database query failed, using fallback data', { error: error.message });
        accountsReceivable = { _sum: { actual_sales_revenue: null } };
      }

      // Get revenue for the period from working capital data (fallback if model doesn't exist)
      let revenueData;
      try {
        revenueData = await this.databaseService.prisma.workingCapital.aggregate({
          where: {
            entity_id: companyId,
            projectionDate: {
              gte: startDate,
              lte: endDate
            }
          },
          _sum: {
            actual_sales_revenue: true
          }
        });
      } catch (error) {
        // Fallback to estimated values if table doesn't exist  
        logWarn('Revenue query failed, using fallback data', { error: error.message });
        revenueData = { _sum: { actual_sales_revenue: null } };
      }

      const totalAR = accountsReceivable._sum.actual_sales_revenue || 0;
      const totalRevenue = revenueData._sum.actual_sales_revenue || 0;
      const periodDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      const dailyRevenue = totalRevenue / periodDays;

      const dsoCalculation = {
        days: dailyRevenue > 0 ? totalAR / dailyRevenue : 0,
        accountsReceivable: totalAR,
        dailyRevenue,
        hasRealData: totalAR > 0 || totalRevenue > 0,
        source: 'database'
      };

      logInfo('DSO calculated', dsoCalculation);
      return dsoCalculation;

    } catch (error) {
      logError('DSO calculation failed', error);
      return {
        days: 45,
        accountsReceivable: 0,
        dailyRevenue: 0,
        hasRealData: false,
        source: 'error_fallback',
        error: error.message
      };
    }
  }

  async calculateDPO(companyId, startDate, endDate) {
    try {
      if (!this.databaseService.isConnected) {
        logWarn('Database not connected, using estimated DPO');
        return {
          days: 30,
          accountsPayable: 80000,
          dailyCOGS: 2666.67,
          hasRealData: false,
          source: 'estimated'
        };
      }

      // Get accounts payable (using expenses as proxy)
      const accountsPayable = await this.databaseService.prisma.cashFlow.aggregate({
        where: {
          companyId,
          date: {
            gte: startDate,
            lte: endDate
          },
          type: 'EXPENSE',
          category: {
            in: ['COGS', 'INVENTORY', 'SUPPLIES', 'MATERIALS']
          }
        },
        _sum: {
          amount: true
        }
      });

      // Calculate COGS from expenses
      const cogsData = await this.databaseService.prisma.cashFlow.aggregate({
        where: {
          companyId,
          date: {
            gte: startDate,
            lte: endDate
          },
          type: 'EXPENSE',
          category: 'COGS'
        },
        _sum: {
          amount: true
        }
      });

      const totalAP = Math.abs(accountsPayable._sum.amount || 0);
      const totalCOGS = Math.abs(cogsData._sum.amount || 0);
      const periodDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      const dailyCOGS = totalCOGS / periodDays;

      const dpoCalculation = {
        days: dailyCOGS > 0 ? totalAP / dailyCOGS : 0,
        accountsPayable: totalAP,
        dailyCOGS,
        hasRealData: totalAP > 0 || totalCOGS > 0,
        source: 'database'
      };

      logInfo('DPO calculated', dpoCalculation);
      return dpoCalculation;

    } catch (error) {
      logError('DPO calculation failed', error);
      return {
        days: 30,
        accountsPayable: 0,
        dailyCOGS: 0,
        hasRealData: false,
        source: 'error_fallback',
        error: error.message
      };
    }
  }

  async calculateDIO(companyId, startDate, endDate) {
    try {
      if (!this.databaseService.isConnected) {
        logWarn('Database not connected, using estimated DIO');
        return {
          days: 60,
          averageInventory: 200000,
          dailyCOGS: 3333.33,
          hasRealData: false,
          source: 'estimated'
        };
      }

      // Get current inventory levels
      const currentInventory = await this.databaseService.prisma.inventoryLevel.aggregate({
        where: {
          entity_id: companyId
        },
        _sum: {
          value: true
        }
      });

      // Get historical inventory for average calculation
      const inventoryHistory = await this.databaseService.prisma.inventoryLevel.groupBy({
        by: ['entity_id'],
        where: {
          entity_id: companyId,
          updatedAt: {
            gte: startDate,
            lte: endDate
          }
        },
        _avg: {
          value: true
        }
      });

      // Calculate COGS
      const cogsData = await this.databaseService.prisma.cashFlow.aggregate({
        where: {
          companyId,
          date: {
            gte: startDate,
            lte: endDate
          },
          type: 'EXPENSE',
          category: 'COGS'
        },
        _sum: {
          amount: true
        }
      });

      const averageInventory = inventoryHistory[0]?._avg?.value || currentInventory._sum.value || 0;
      const totalCOGS = Math.abs(cogsData._sum.amount || 0);
      const periodDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      const dailyCOGS = totalCOGS / periodDays;

      const dioCalculation = {
        days: dailyCOGS > 0 ? averageInventory / dailyCOGS : 0,
        averageInventory,
        dailyCOGS,
        hasRealData: averageInventory > 0 || totalCOGS > 0,
        source: 'database'
      };

      logInfo('DIO calculated', dioCalculation);
      return dioCalculation;

    } catch (error) {
      logError('DIO calculation failed', error);
      return {
        days: 60,
        averageInventory: 0,
        dailyCOGS: 0,
        hasRealData: false,
        source: 'error_fallback',
        error: error.message
      };
    }
  }

  async calculateCurrentAssets(companyId) {
    try {
      if (!this.databaseService.isConnected) {
        return {
          total: 500000,
          accountsReceivable: 150000,
          inventory: 200000,
          cash: 100000,
          other: 50000
        };
      }

      // Get accounts receivable
      const arData = await this.databaseService.prisma.accountsReceivable.aggregate({
        where: { companyId, status: 'AUTHORISED' },
        _sum: { amount: true }
      });

      // Get inventory value
      const inventoryData = await this.databaseService.prisma.inventoryLevel.aggregate({
        where: { companyId },
        _sum: { value: true }
      });

      // Get cash from positive cash flow balances
      const cashData = await this.databaseService.prisma.cashFlow.aggregate({
        where: { 
          companyId, 
          type: 'REVENUE',
          date: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        },
        _sum: { amount: true }
      });

      const accountsReceivable = arData._sum.amount || 0;
      const inventory = inventoryData._sum.value || 0;
      const cash = Math.max(0, cashData._sum.amount || 0) * 0.1; // Estimate 10% as cash balance
      const other = (accountsReceivable + inventory) * 0.1; // Estimate 10% other current assets

      return {
        total: accountsReceivable + inventory + cash + other,
        accountsReceivable,
        inventory,
        cash,
        other
      };

    } catch (error) {
      logError('Current assets calculation failed', error);
      return {
        total: 0,
        accountsReceivable: 0,
        inventory: 0,
        cash: 0,
        other: 0
      };
    }
  }

  async calculateCurrentLiabilities(companyId) {
    try {
      if (!this.databaseService.isConnected) {
        return {
          total: 300000,
          accountsPayable: 80000,
          shortTermDebt: 150000,
          accruedExpenses: 50000,
          other: 20000
        };
      }

      // Get accounts payable from expenses
      const apData = await this.databaseService.prisma.cashFlow.aggregate({
        where: {
          companyId,
          type: 'EXPENSE',
          date: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        _sum: { amount: true }
      });

      const totalExpenses = Math.abs(apData._sum.amount || 0);
      const accountsPayable = totalExpenses * 0.4; // Estimate 40% as AP
      const shortTermDebt = totalExpenses * 0.3; // Estimate 30% as short-term debt
      const accruedExpenses = totalExpenses * 0.2; // Estimate 20% as accrued
      const other = totalExpenses * 0.1; // Estimate 10% other

      return {
        total: accountsPayable + shortTermDebt + accruedExpenses + other,
        accountsPayable,
        shortTermDebt,
        accruedExpenses,
        other
      };

    } catch (error) {
      logError('Current liabilities calculation failed', error);
      return {
        total: 0,
        accountsPayable: 0,
        shortTermDebt: 0,
        accruedExpenses: 0,
        other: 0
      };
    }
  }

  calculateWorkingCapitalTurnover(revenue, workingCapital) {
    if (workingCapital <= 0) return 0;
    return revenue / workingCapital;
  }

  assessDataCompleteness(dso, dpo, dio) {
    const realDataCount = [dso.hasRealData, dpo.hasRealData, dio.hasRealData]
      .filter(Boolean).length;
    
    const completeness = (realDataCount / 3) * 100;
    
    if (completeness >= 80) return 'high';
    if (completeness >= 50) return 'medium';
    return 'low';
  }

  getFallbackMetrics(companyId, error) {
    return {
      workingCapital: { amount: 200000, ratio: 1.67, currency: 'GBP' },
      currentAssets: { total: 500000, accountsReceivable: 150000, inventory: 200000, cash: 100000, other: 50000 },
      currentLiabilities: { total: 300000, accountsPayable: 80000, shortTermDebt: 150000, accruedExpenses: 50000, other: 20000 },
      dso: { days: 45, hasRealData: false, source: 'fallback' },
      dpo: { days: 30, hasRealData: false, source: 'fallback' },
      dio: { days: 60, hasRealData: false, source: 'fallback' },
      cashConversionCycle: { days: 75 },
      error: error.message,
      fallback: true,
      calculatedAt: new Date()
    };
  }

  // Scenario analysis for what-if calculations
  async calculateWhatIfScenarios(baseMetrics, scenarios) {
    logInfo('Calculating what-if scenarios for working capital');
    
    const results = [];
    
    for (const scenario of scenarios) {
      const adjustedMetrics = { ...baseMetrics };
      
      // Apply scenario adjustments
      if (scenario.dsoChange) {
        const newDSO = baseMetrics.dso.days * (1 + scenario.dsoChange / 100);
        adjustedMetrics.dso = { ...baseMetrics.dso, days: newDSO };
        
        // Recalculate AR based on new DSO
        const newAR = newDSO * baseMetrics.dso.dailyRevenue;
        adjustedMetrics.currentAssets = {
          ...baseMetrics.currentAssets,
          accountsReceivable: newAR,
          total: baseMetrics.currentAssets.total - baseMetrics.currentAssets.accountsReceivable + newAR
        };
      }
      
      if (scenario.dpoChange) {
        const newDPO = baseMetrics.dpo.days * (1 + scenario.dpoChange / 100);
        adjustedMetrics.dpo = { ...baseMetrics.dpo, days: newDPO };
        
        // Recalculate AP based on new DPO
        const newAP = newDPO * baseMetrics.dpo.dailyCOGS;
        adjustedMetrics.currentLiabilities = {
          ...baseMetrics.currentLiabilities,
          accountsPayable: newAP,
          total: baseMetrics.currentLiabilities.total - baseMetrics.currentLiabilities.accountsPayable + newAP
        };
      }
      
      if (scenario.dioChange) {
        const newDIO = baseMetrics.dio.days * (1 + scenario.dioChange / 100);
        adjustedMetrics.dio = { ...baseMetrics.dio, days: newDIO };
        
        // Recalculate inventory based on new DIO
        const newInventory = newDIO * baseMetrics.dio.dailyCOGS;
        adjustedMetrics.currentAssets = {
          ...adjustedMetrics.currentAssets,
          inventory: newInventory,
          total: adjustedMetrics.currentAssets.total - baseMetrics.currentAssets.inventory + newInventory
        };
      }
      
      // Recalculate derived metrics
      adjustedMetrics.workingCapital = {
        ...adjustedMetrics.workingCapital,
        amount: adjustedMetrics.currentAssets.total - adjustedMetrics.currentLiabilities.total,
        ratio: adjustedMetrics.currentLiabilities.total > 0 
          ? adjustedMetrics.currentAssets.total / adjustedMetrics.currentLiabilities.total 
          : 0
      };
      
      adjustedMetrics.cashConversionCycle = {
        ...adjustedMetrics.cashConversionCycle,
        days: adjustedMetrics.dso.days + adjustedMetrics.dio.days - adjustedMetrics.dpo.days
      };
      
      results.push({
        scenario: scenario.name,
        parameters: scenario,
        metrics: adjustedMetrics,
        impact: {
          workingCapitalChange: adjustedMetrics.workingCapital.amount - baseMetrics.workingCapital.amount,
          cashConversionCycleChange: adjustedMetrics.cashConversionCycle.days - baseMetrics.cashConversionCycle.days
        }
      });
    }
    
    return results;
  }

  clearCache() {
    this.calculationCache.clear();
    logInfo('Working capital calculation cache cleared');
  }

  getCacheStats() {
    return {
      size: this.calculationCache.size,
      timeout: this.cacheTimeout,
      keys: Array.from(this.calculationCache.keys())
    };
  }
}

export default WorkingCapitalCalculator;