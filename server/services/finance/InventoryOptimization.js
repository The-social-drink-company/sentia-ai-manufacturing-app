import prisma from '../../lib/prisma.js'
import logger from '../../utils/logger.js'

class InventoryOptimization {
  constructor(config = {}) {
    this.config = {
      holdingCostRate: config.holdingCostRate || 0.25,
      orderingCost: config.orderingCost || 50,
      targetServiceLevel: config.targetServiceLevel || 0.95,
      safetyStockDays: config.safetyStockDays || 7,
    }
  }

  calculateEOQ(product) {
    const demand = product.annualDemand || product.monthlyDemand * 12 || 1000
    const orderingCost = product.orderingCost || this.config.orderingCost
    const unitCost = product.unitCost || 1
    const holdingCost = unitCost * this.config.holdingCostRate

    const eoq = Math.sqrt((2 * demand * orderingCost) / holdingCost)
    const ordersPerYear = demand / eoq

    return {
      eoq: Math.ceil(eoq),
      ordersPerYear: Number(ordersPerYear.toFixed(2)),
      daysBetweenOrders: Math.round(365 / Math.max(ordersPerYear, 1)),
    }
  }

  calculateSafetyStock(product) {
    const zScore = this.getZScore(this.config.targetServiceLevel)
    const demandStdDev = product.demandStdDev || product.dailyDemand * 0.25 || 1
    const leadTime = product.leadTimeDays || 14

    const safetyStock = zScore * demandStdDev * Math.sqrt(leadTime)
    const daysSafetyStock = (product.dailyDemand || 1) * this.config.safetyStockDays

    return {
      safetyStock: Math.ceil(Math.max(safetyStock, daysSafetyStock)),
      zScore,
    }
  }

  calculateReorderPoint(product) {
    const safety = this.calculateSafetyStock(product).safetyStock
    const dailyDemand = product.dailyDemand || product.annualDemand / 365 || 1
    const leadTime = product.leadTimeDays || 14

    return Math.ceil(dailyDemand * leadTime + safety)
  }

  getZScore(serviceLevel) {
    if (serviceLevel >= 0.99) return 2.33
    if (serviceLevel >= 0.98) return 2.05
    if (serviceLevel >= 0.95) return 1.65
    if (serviceLevel >= 0.9) return 1.28
    return 1.04
  }

  calculateStdDev(values) {
    if (!values?.length) return 0
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length
    const variance =
      values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length
    return Math.sqrt(variance)
  }

  async optimiseProduct(productId) {
    const product = await this.fetchProduct(productId)

    const eoq = this.calculateEOQ(product)
    const safetyStock = this.calculateSafetyStock(product)
    const reorderPoint = this.calculateReorderPoint(product)

    return {
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
      },
      eoq,
      safetyStock,
      reorderPoint,
    }
  }

  async fetchProduct(productId) {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          inventory: true,
          demandForecasts: {
            orderBy: { forecastDate: 'desc' },
            take: 12,
          },
        },
      })

      if (!product) {
        throw new Error(`Product not found: ${productId}`)
      }

      const demandValues = product.demandForecasts?.map(forecast => forecast.forecastedDemand) || []
      const annualDemand = demandValues.reduce((sum, value) => sum + value, 0) * 12 || 1200
      const dailyDemand = annualDemand / 365

      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        unitCost: product.inventory?.unitCost || 1,
        leadTimeDays: product.inventory?.leadTimeDays || 14,
        annualDemand,
        monthlyDemand: annualDemand / 12,
        dailyDemand,
        demandStdDev: this.calculateStdDev(demandValues),
      }
    } catch (error) {
      logger.warn('[InventoryOptimization] Falling back to default product data', error)
      return {
        id: productId,
        name: 'Unknown',
        sku: 'UNKNOWN',
        unitCost: 1,
        leadTimeDays: 14,
        annualDemand: 1200,
        monthlyDemand: 100,
        dailyDemand: 3.3,
        demandStdDev: 15,
      }
    }
  }
}

export default InventoryOptimization
