const prisma = require('../../lib/prisma')
const logger = require('../../utils/logger')

class CashRunway {
  constructor(config = {}) {
    this.config = {
      minimumCashBalance: config.minimumCashBalance || 50000,
      warningThreshold: config.warningThreshold || 3,
      criticalThreshold: config.criticalThreshold || 1.5,
      burnRateWindow: config.burnRateWindow || 3,
    }
  }

  async calculateCurrent(data = {}) {
    const cashBalance = data.cashBalance ?? (await this.fetchCashBalance())
    const burnRate = data.burnRate ?? (await this.calculateBurnRate(this.config.burnRateWindow))

    const runwayMonths = burnRate > 0 ? cashBalance / burnRate : null
    const runwayDays = runwayMonths ? Math.round(runwayMonths * 30) : null
    const breachRisk = this.assessBreachRisk(cashBalance, runwayMonths)
    const status = this.determineStatus(runwayMonths, cashBalance)

    const scenarios = this.buildScenarioProjections(cashBalance, burnRate)

    return {
      cashBalance: Number(cashBalance.toFixed(2)),
      burnRate: Number(burnRate.toFixed(2)),
      runwayMonths: runwayMonths ? Number(runwayMonths.toFixed(2)) : null,
      runwayDays,
      breachRisk,
      status,
      minimumCashBalance: this.config.minimumCashBalance,
      cashAboveMinimum: Number((cashBalance - this.config.minimumCashBalance).toFixed(2)),
      scenarios,
      calculatedAt: new Date(),
    }
  }

  async calculateBurnRate(months = 3) {
    try {
      const now = new Date()
      const since = new Date(now)
      since.setMonth(since.getMonth() - months)

      const cashFlows = await prisma.cashFlowStatement.findMany({
        where: {
          date: {
            gte: since,
            lte: now,
          },
        },
        orderBy: { date: 'asc' },
        select: { endingCash: true },
      })

      if (cashFlows.length >= 2) {
        const burn = (cashFlows[0].endingCash - cashFlows[cashFlows.length - 1].endingCash) / months
        return Math.max(0, burn)
      }
    } catch (error) {
      logger.warn('[CashRunway] Unable to calculate burn rate from statements', error)
    }

    return 10000
  }

  assessBreachRisk(cashBalance, runwayMonths) {
    if (cashBalance < this.config.minimumCashBalance) return 'breach'
    if (!runwayMonths) return 'unknown'
    if (runwayMonths < this.config.criticalThreshold) return 'critical'
    if (runwayMonths < this.config.warningThreshold) return 'warning'
    return 'stable'
  }

  determineStatus(runwayMonths, cashBalance) {
    if (!runwayMonths) return 'stable'
    if (cashBalance < this.config.minimumCashBalance) return 'critical'
    if (runwayMonths < this.config.criticalThreshold) return 'critical'
    if (runwayMonths < this.config.warningThreshold) return 'warning'
    return 'healthy'
  }

  buildScenarioProjections(cashBalance, burnRate) {
    const scenarios = [
      { key: 'base', label: 'Base case', burnMultiplier: 1 },
      { key: 'conservative', label: 'Conservative (burn +15%)', burnMultiplier: 1.15 },
      { key: 'optimistic', label: 'Optimistic (burn -10%)', burnMultiplier: 0.9 },
    ]

    return scenarios.map(scenario => {
      const projectedBurn = burnRate * scenario.burnMultiplier
      const months = projectedBurn > 0 ? cashBalance / projectedBurn : null
      return {
        ...scenario,
        burnRate: Number(projectedBurn.toFixed(2)),
        runwayMonths: months ? Number(months.toFixed(2)) : null,
      }
    })
  }

  async fetchCashBalance() {
    try {
      const latest = await prisma.cashFlowStatement.findFirst({
        orderBy: { date: 'desc' },
        select: { endingCash: true },
      })
      if (latest?.endingCash !== undefined) {
        return latest.endingCash
      }

      const aggregate = await prisma.bankAccount.aggregate({
        _sum: { balance: true },
      })
      return aggregate._sum.balance || 0
    } catch (error) {
      logger.warn('[CashRunway] Unable to fetch cash balance', error)
      return 0
    }
  }

  async saveMetrics(metrics) {
    try {
      await prisma.cashRunwayMetrics.create({
        data: {
          date: metrics.calculatedAt,
          cashBalance: metrics.cashBalance,
          burnRate: metrics.burnRate,
          runwayMonths: metrics.runwayMonths,
          runwayDays: metrics.runwayDays,
          status: metrics.status,
        },
      })
    } catch (error) {
      logger.warn('[CashRunway] Unable to persist metrics', error)
    }
  }
}

module.exports = CashRunway
