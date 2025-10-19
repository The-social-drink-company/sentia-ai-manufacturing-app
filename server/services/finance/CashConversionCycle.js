import prisma from '../../lib/prisma.js'
import logger from '../../utils/logger.js'

class CashConversionCycle {
  constructor(config = {}) {
    this.config = {
      periodDays: config.periodDays || 365,
      targetCCC: config.targetCCC || 55,
      warningThreshold: config.warningThreshold || 65,
      criticalThreshold: config.criticalThreshold || 75,
    }
  }

  async calculateCurrent(data = {}) {
    const financials = Object.keys(data).length ? data : await this.fetchFinancialData()

    const dio = this.calculateDIO(financials.inventory, financials.cogs)
    const dso = this.calculateDSO(financials.accountsReceivable, financials.revenue)
    const dpo = this.calculateDPO(financials.accountsPayable, financials.cogs)
    const ccc = dio + dso - dpo

    const status = this.determineStatus(ccc)
    const variance = ccc - this.config.targetCCC
    const variancePercent = this.config.targetCCC
      ? (variance / this.config.targetCCC) * 100
      : 0

    return {
      ccc: Number(ccc.toFixed(2)),
      dio: Number(dio.toFixed(2)),
      dso: Number(dso.toFixed(2)),
      dpo: Number(dpo.toFixed(2)),
      status,
      target: this.config.targetCCC,
      variance: Number(variance.toFixed(2)),
      variancePercent: Number(variancePercent.toFixed(2)),
      periodDays: this.config.periodDays,
      calculatedAt: new Date(),
      recommendations: this.buildRecommendations({ ccc, dio, dso, dpo, status }),
    }
  }

  calculateDIO(inventory = 0, cogs = 0) {
    if (!cogs) return 0
    return (inventory / cogs) * this.config.periodDays
  }

  calculateDSO(accountsReceivable = 0, revenue = 0) {
    if (!revenue) return 0
    return (accountsReceivable / revenue) * this.config.periodDays
  }

  calculateDPO(accountsPayable = 0, cogs = 0) {
    if (!cogs) return 0
    return (accountsPayable / cogs) * this.config.periodDays
  }

  determineStatus(value) {
    if (value <= this.config.targetCCC) return 'excellent'
    if (value <= this.config.warningThreshold) return 'good'
    if (value <= this.config.criticalThreshold) return 'warning'
    return 'critical'
  }

  buildRecommendations({ ccc, dio, dso, dpo, status }) {
    const actions = []

    if (status === 'excellent') {
      actions.push('Maintain current working-capital cadence; continue monitoring weekly.')
      return actions
    }

    if (dso > 35) {
      actions.push('Accelerate collections with reminder cadences and early-payment incentives.')
    }

    if (dio > 45) {
      actions.push('Reduce slow-moving inventory via targeted promotions or SKU rationalisation.')
    }

    if (dpo < 30) {
      actions.push('Negotiate extended terms with strategic suppliers to anchor DPO above 35 days.')
    }

    if (!actions.length) {
      actions.push('Undertake joint finance/procurement working session to identify additional efficiency levers.')
    }

    actions.push(`Overall CCC is ${ccc.toFixed(1)} days versus target ${this.config.targetCCC} days.`)

    return actions
  }

  async fetchFinancialData() {
    try {
      const [inventoryAgg, revenueOrders, cogsTransactions, receivablesAgg, payablesAgg] = await Promise.all([
        prisma.inventory.aggregate({
          _sum: { totalValue: true },
        }),
        prisma.salesOrder.aggregate({
          where: { status: 'COMPLETED' },
          _sum: { totalAmount: true },
        }),
        prisma.inventoryTransaction.aggregate({
          where: { transactionType: 'SALE' },
          _sum: { value: true },
        }),
        prisma.invoice.aggregate({
          where: { status: 'UNPAID' },
          _sum: { totalAmount: true },
        }),
        prisma.purchaseOrder.aggregate({
          where: { status: 'PENDING_PAYMENT' },
          _sum: { totalCost: true },
        }),
      ])

      const revenue = revenueOrders._sum.totalAmount || 0
      const cogs = cogsTransactions._sum.value || revenue * 0.65

      return {
        inventory: inventoryAgg._sum.totalValue || 0,
        revenue,
        cogs,
        accountsReceivable: receivablesAgg._sum.totalAmount || 0,
        accountsPayable: payablesAgg._sum.totalCost || 0,
      }
    } catch (error) {
      logger.warn('[CCC] Failed to fetch aggregated financial data, falling back to zeros', error)
      return {
        inventory: 0,
        revenue: 0,
        cogs: 0,
        accountsReceivable: 0,
        accountsPayable: 0,
      }
    }
  }

  async fetchHistoricalTrend(periods = 6) {
    try {
      const records = await prisma.workingCapitalMetrics.findMany({
        orderBy: { date: 'desc' },
        take: periods,
      })

      return records
        .map(record => ({
          date: record.date,
          ccc: record.ccc,
          dio: record.dio,
          dso: record.dso,
          dpo: record.dpo,
        }))
        .reverse()
    } catch (error) {
      logger.warn('[CCC] Failed to fetch historical metrics', error)
      return []
    }
  }

  async saveMetrics(metrics) {
    try {
      await prisma.workingCapitalMetrics.create({
        data: {
          date: metrics.calculatedAt,
          ccc: metrics.ccc,
          dio: metrics.dio,
          dso: metrics.dso,
          dpo: metrics.dpo,
          status: metrics.status,
          variance: metrics.variance,
          variancePercent: metrics.variancePercent,
        },
      })
    } catch (error) {
      logger.warn('[CCC] Unable to persist metrics', error)
    }
  }
}

export default CashConversionCycle
