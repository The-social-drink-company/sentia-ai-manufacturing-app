/**
 * CashRunwayEngine - Advanced cash runway calculation and prediction engine
 * Provides comprehensive cash flow analysis, runway projections, and scenario modeling
 */

export class CashRunwayEngine {
  constructor(config = {}) {
    this.config = {
      defaultGrowthRate: 5, // % monthly
      defaultMargin: 20, // % gross margin
      inflationRate: 2.5, // % annual
      ...config
    }
  }

  /**
   * Calculate basic cash runway in months
   * @param {number} currentCash - Current cash balance
   * @param {number} monthlyBurnRate - Monthly cash burn rate
   * @param {number} monthlyRevenue - Monthly revenue
   * @returns {object} Runway calculations
   */
  calculateRunway(currentCash, monthlyBurnRate, monthlyRevenue) {
    const netBurnRate = monthlyBurnRate - monthlyRevenue

    if (netBurnRate <= 0) {
      return {
        runwayMonths: Infinity,
        runwayDays: Infinity,
        status: 'Cash Positive',
        netBurnRate: netBurnRate
      }
    }

    const runwayMonths = Math.floor(currentCash / netBurnRate)
    const runwayDays = runwayMonths * 30

    return {
      runwayMonths,
      runwayDays,
      netBurnRate,
      status: this.getRunwayStatus(runwayMonths),
      depletion_date: this.calculateDepletionDate(runwayDays)
    }
  }

  /**
   * Calculate cash needed for specific coverage periods
   * @param {object} params - Calculation parameters
   * @returns {array} Cash requirements by period
   */
  calculateCashRequirements(params) {
    const {
      monthlyBurnRate,
      monthlyRevenue,
      growthRate = this.config.defaultGrowthRate,
      periods = [30, 60, 90, 120, 180]
    } = params

    return periods.map(days => {
      const months = days / 30
      let totalCashNeeded = 0
      let revenue = monthlyRevenue
      let cumulativeRevenue = 0

      for (let month = 0; month < months; month++) {
        revenue = revenue * (1 + growthRate / 100)
        cumulativeRevenue += revenue
        totalCashNeeded += monthlyBurnRate
      }

      const netCashNeeded = Math.max(0, totalCashNeeded - cumulativeRevenue)

      return {
        days,
        months: months.toFixed(1),
        totalExpenses: totalCashNeeded,
        projectedRevenue: cumulativeRevenue,
        netCashRequired: netCashNeeded,
        bufferRequired: netCashNeeded * 1.2, // 20% buffer
        label: `${days} Days`
      }
    })
  }

  /**
   * Generate detailed cash flow projections
   * @param {object} params - Projection parameters
   * @returns {array} Monthly projections
   */
  generateProjections(params) {
    const {
      currentCash,
      monthlyBurnRate,
      monthlyRevenue,
      growthRate = this.config.defaultGrowthRate,
      months = 24,
      expenses = {},
      seasonality = null
    } = params

    const projections = []
    let cash = currentCash
    let revenue = monthlyRevenue
    let accumulatedCash = currentCash

    for (let month = 0; month < months; month++) {
      // Apply growth rate
      revenue = revenue * (1 + growthRate / 100)

      // Apply seasonality if provided
      if (seasonality && seasonality[month % 12]) {
        revenue = revenue * seasonality[month % 12]
      }

      // Calculate expenses with inflation
      const inflationFactor = Math.pow(1 + this.config.inflationRate / 100 / 12, month)
      const adjustedBurnRate = monthlyBurnRate * inflationFactor

      // Update cash position
      const netCashFlow = revenue - adjustedBurnRate
      cash = cash + netCashFlow

      // Detailed expense breakdown
      const expenseBreakdown = this.calculateExpenseBreakdown(expenses, adjustedBurnRate)

      projections.push({
        month: month + 1,
        monthLabel: this.getMonthLabel(month),
        cash: Math.max(0, cash),
        revenue,
        expenses: adjustedBurnRate,
        netCashFlow,
        runwayRemaining: cash > 0 ? Math.floor(cash / Math.abs(netCashFlow)) : 0,
        expenseBreakdown,
        cumulativeCash: accumulatedCash + netCashFlow * (month + 1),
        cashPositive: netCashFlow > 0,
        criticalLevel: cash < adjustedBurnRate * 3 // Less than 3 months runway
      })

      if (cash <= 0) break
    }

    return projections
  }

  /**
   * Calculate optimal burn rate for target runway
   * @param {object} params - Calculation parameters
   * @returns {object} Optimal burn rate recommendations
   */
  calculateOptimalBurnRate(params) {
    const {
      currentCash,
      targetRunwayMonths,
      monthlyRevenue,
      growthRate = this.config.defaultGrowthRate
    } = params

    // Calculate total expected revenue over target period
    let totalRevenue = 0
    let revenue = monthlyRevenue

    for (let month = 0; month < targetRunwayMonths; month++) {
      revenue = revenue * (1 + growthRate / 100)
      totalRevenue += revenue
    }

    // Calculate optimal burn rate
    const totalAvailableFunds = currentCash + totalRevenue
    const optimalMonthlyBurn = totalAvailableFunds / targetRunwayMonths

    // Calculate required adjustments
    const currentNetBurn = params.currentBurnRate - monthlyRevenue
    const requiredAdjustment = currentNetBurn - (optimalMonthlyBurn - monthlyRevenue)

    return {
      optimalMonthlyBurn,
      currentBurnRate: params.currentBurnRate,
      requiredReduction: Math.max(0, requiredAdjustment),
      requiredReductionPercent: (requiredAdjustment / params.currentBurnRate) * 100,
      alternativeRevenue: currentNetBurn - (currentCash / targetRunwayMonths),
      recommendations: this.generateOptimizationRecommendations(requiredAdjustment, params)
    }
  }

  /**
   * Calculate funding requirements for growth targets
   * @param {object} params - Growth parameters
   * @returns {object} Funding requirements
   */
  calculateGrowthFunding(params) {
    const {
      currentCash,
      monthlyBurnRate,
      monthlyRevenue,
      targetGrowthRate,
      growthPeriodMonths = 12,
      customerAcquisitionCost = 1000,
      lifetimeValue = 5000
    } = params

    // Calculate increased burn from growth
    const growthMultiplier = 1 + targetGrowthRate / 100
    const increasedBurnRate = monthlyBurnRate * growthMultiplier

    // Calculate revenue ramp
    let projectedRevenue = monthlyRevenue
    let totalRevenue = 0
    let totalBurn = 0

    for (let month = 0; month < growthPeriodMonths; month++) {
      projectedRevenue = projectedRevenue * (1 + targetGrowthRate / 100 / 12)
      totalRevenue += projectedRevenue
      totalBurn += increasedBurnRate
    }

    const fundingGap = totalBurn - totalRevenue - currentCash
    const newCustomersNeeded = Math.ceil((projectedRevenue - monthlyRevenue) / (lifetimeValue / 12))
    const customerAcquisitionBudget = newCustomersNeeded * customerAcquisitionCost

    return {
      fundingRequired: Math.max(0, fundingGap),
      bufferFunding: Math.max(0, fundingGap * 1.3), // 30% buffer
      totalBurnDuringGrowth: totalBurn,
      projectedRevenueGenerated: totalRevenue,
      newCustomersRequired: newCustomersNeeded,
      customerAcquisitionBudget,
      paybackPeriod: customerAcquisitionCost / (lifetimeValue / 12),
      unitEconomics: {
        CAC: customerAcquisitionCost,
        LTV: lifetimeValue,
        ratio: lifetimeValue / customerAcquisitionCost
      }
    }
  }

  /**
   * Perform sensitivity analysis on cash runway
   * @param {object} baseParams - Base parameters
   * @returns {array} Sensitivity analysis results
   */
  performSensitivityAnalysis(baseParams) {
    const variables = [
      { name: 'Revenue', key: 'monthlyRevenue', range: [-30, -20, -10, 0, 10, 20, 30] },
      { name: 'Burn Rate', key: 'monthlyBurnRate', range: [-30, -20, -10, 0, 10, 20, 30] },
      { name: 'Growth Rate', key: 'growthRate', range: [-5, -3, 0, 3, 5, 10, 15] }
    ]

    const results = []

    variables.forEach(variable => {
      variable.range.forEach(change => {
        const adjustedParams = { ...baseParams }

        if (variable.key === 'growthRate') {
          adjustedParams[variable.key] = baseParams[variable.key] + change
        } else {
          adjustedParams[variable.key] = baseParams[variable.key] * (1 + change / 100)
        }

        const runway = this.calculateRunway(
          adjustedParams.currentCash,
          adjustedParams.monthlyBurnRate,
          adjustedParams.monthlyRevenue
        )

        results.push({
          variable: variable.name,
          change: `${change > 0 ? '+' : ''}${change}%`,
          runwayMonths: runway.runwayMonths,
          impact: runway.runwayMonths - this.calculateRunway(
            baseParams.currentCash,
            baseParams.monthlyBurnRate,
            baseParams.monthlyRevenue
          ).runwayMonths
        })
      })
    })

    return results
  }

  /**
   * Calculate working capital impact on cash runway
   * @param {object} params - Working capital parameters
   * @returns {object} Working capital analysis
   */
  analyzeWorkingCapitalImpact(params) {
    const {
      revenue,
      dso = 45, // Days Sales Outstanding
      dpo = 30, // Days Payable Outstanding
      dio = 60, // Days Inventory Outstanding
      targetDso = 35,
      targetDpo = 45,
      targetDio = 45
    } = params

    const dailyRevenue = revenue / 30
    const dailyCOGS = dailyRevenue * 0.7 // Assuming 30% margin

    // Current working capital tied up
    const currentReceivables = dailyRevenue * dso
    const currentInventory = dailyCOGS * dio
    const currentPayables = dailyCOGS * dpo
    const currentWorkingCapital = currentReceivables + currentInventory - currentPayables

    // Optimized working capital
    const optimizedReceivables = dailyRevenue * targetDso
    const optimizedInventory = dailyCOGS * targetDio
    const optimizedPayables = dailyCOGS * targetDpo
    const optimizedWorkingCapital = optimizedReceivables + optimizedInventory - optimizedPayables

    // Cash freed up
    const cashFreedUp = currentWorkingCapital - optimizedWorkingCapital
    const additionalRunwayMonths = cashFreedUp / params.netBurnRate

    return {
      current: {
        receivables: currentReceivables,
        inventory: currentInventory,
        payables: currentPayables,
        workingCapital: currentWorkingCapital,
        cashConversionCycle: dso + dio - dpo
      },
      optimized: {
        receivables: optimizedReceivables,
        inventory: optimizedInventory,
        payables: optimizedPayables,
        workingCapital: optimizedWorkingCapital,
        cashConversionCycle: targetDso + targetDio - targetDpo
      },
      impact: {
        cashFreedUp,
        additionalRunwayMonths,
        percentImprovement: ((currentWorkingCapital - optimizedWorkingCapital) / currentWorkingCapital) * 100
      }
    }
  }

  // Helper methods
  getRunwayStatus(months) {
    if (months === Infinity) return 'Cash Positive'
    if (months > 18) return 'Healthy'
    if (months > 12) return 'Good'
    if (months > 6) return 'Caution'
    if (months > 3) return 'Warning'
    return 'Critical'
  }

  calculateDepletionDate(days) {
    if (days === Infinity) return null
    const date = new Date()
    date.setDate(date.getDate() + days)
    return date.toISOString().split('T')[0]
  }

  getMonthLabel(monthIndex) {
    const date = new Date()
    date.setMonth(date.getMonth() + monthIndex)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  calculateExpenseBreakdown(expenses, totalBurn) {
    const breakdown = {}
    const expenseTotal = Object.values(expenses).reduce((sum, val) => sum + val, 0)

    if (expenseTotal === 0) {
      return {
        payroll: totalBurn * 0.5,
        operations: totalBurn * 0.2,
        marketing: totalBurn * 0.15,
        other: totalBurn * 0.15
      }
    }

    Object.entries(expenses).forEach(([key, value]) => {
      breakdown[key] = (value / expenseTotal) * totalBurn
    })

    return breakdown
  }

  generateOptimizationRecommendations(requiredReduction, params) {
    const recommendations = []

    if (requiredReduction <= 0) {
      recommendations.push({
        priority: 'info',
        action: 'Maintain Current Burn',
        impact: 'You are on track to meet your runway target'
      })
      return recommendations
    }

    const reductionPercent = (requiredReduction / params.currentBurnRate) * 100

    if (reductionPercent > 30) {
      recommendations.push({
        priority: 'critical',
        action: 'Major Restructuring Required',
        impact: `Reduce expenses by ${reductionPercent.toFixed(1)}% or raise immediate funding`
      })
    }

    if (reductionPercent > 15) {
      recommendations.push({
        priority: 'high',
        action: 'Implement Cost Reduction Program',
        impact: `Target ${(requiredReduction / 1000).toFixed(0)}K monthly savings through operational efficiency`
      })
    }

    recommendations.push({
      priority: 'medium',
      action: 'Optimize Working Capital',
      impact: 'Improve DSO by 10 days to free up cash'
    })

    recommendations.push({
      priority: 'medium',
      action: 'Accelerate Revenue Growth',
      impact: `Increase revenue by ${((requiredReduction / params.monthlyRevenue) * 100).toFixed(1)}% to offset burn`
    })

    return recommendations
  }
}

// Export singleton instance
export default new CashRunwayEngine()
