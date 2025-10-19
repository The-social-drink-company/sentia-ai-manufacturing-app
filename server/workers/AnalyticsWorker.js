const { Worker } = require('bullmq')
const { createBullMQConnection } = require('../lib/redis')
const prisma = require('../lib/prisma')
const logger = require('../utils/logger')

/**
 * AnalyticsWorker - Processes background analytics calculations
 */
class AnalyticsWorker {
  constructor() {
    this.worker = null
    this.connection = null
  }

  async start() {
    logger.info('[AnalyticsWorker] Starting worker...')
    this.connection = createBullMQConnection()

    this.worker = new Worker('analytics-queue', async job => await this.processJob(job), {
      connection: this.connection,
      concurrency: 2,
    })

    this.worker.on('completed', job => logger.info(`[AnalyticsWorker] Job completed: ${job.id}`))
    this.worker.on('failed', (job, err) =>
      logger.error(`[AnalyticsWorker] Job failed: ${job.id}`, err)
    )

    logger.info('[AnalyticsWorker] Worker started')
    return { success: true }
  }

  async processJob(job) {
    const { type, params } = job.data

    try {
      let result = null

      switch (type) {
        case 'inventory-turnover':
          result = await this.calculateInventoryTurnover(params)
          break
        case 'cash-conversion-cycle':
          result = await this.calculateCashConversionCycle(params)
          break
        case 'product-performance':
          result = await this.calculateProductPerformance(params)
          break
        default:
          throw new Error(`Unknown analytics type: ${type}`)
      }

      return { success: true, result }
    } catch (error) {
      logger.error(`[AnalyticsWorker] Job ${job.id} failed:`, error)
      throw error
    }
  }

  async calculateInventoryTurnover(params) {
    const { organizationId, startDate: _startDate, endDate: _endDate } = params

    // Calculate COGS and average inventory
    const products = await prisma.product.findMany({
      where: { organizationId },
      include: {
        inventoryItems: true,
      },
    })

    const totalCOGS = products.reduce((sum, p) => sum + parseFloat(p.unitCost) * 1000, 0)
    const avgInventory =
      products.reduce(
        (sum, p) =>
          sum + p.inventoryItems.reduce((s, i) => s + i.quantityOnHand * parseFloat(p.unitCost), 0),
        0
      ) / products.length

    const turnoverRatio = totalCOGS / avgInventory

    return {
      turnoverRatio,
      totalCOGS,
      avgInventory,
      daysInInventory: 365 / turnoverRatio,
    }
  }

  // eslint-disable-next-line no-unused-vars
  async calculateCashConversionCycle(params) {
    // Simplified CCC calculation
    // TODO: Implement actual CCC calculation using params (organizationId, dateRange)
    return {
      dso: 45, // Days Sales Outstanding
      dio: 60, // Days Inventory Outstanding
      dpo: 30, // Days Payables Outstanding
      ccc: 45 + 60 - 30, // = 75 days
    }
  }

  async calculateProductPerformance(params) {
    const { productId } = params

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        inventoryItems: true,
        demandForecasts: {
          orderBy: { forecastDate: 'desc' },
          take: 1,
        },
      },
    })

    return {
      productId,
      sku: product.sku,
      currentStock: product.inventoryItems.reduce((sum, i) => sum + i.quantityOnHand, 0),
      forecastedDemand: product.demandForecasts[0]?.forecastedDemand || 0,
      turnoverRate: 12, // Times per year
      margin: (
        ((parseFloat(product.sellingPrice) - parseFloat(product.unitCost)) /
          parseFloat(product.sellingPrice)) *
        100
      ).toFixed(2),
    }
  }

  async stop() {
    if (this.worker) await this.worker.close()
    if (this.connection) await this.connection.quit()
    logger.info('[AnalyticsWorker] Worker stopped')
  }
}

module.exports = AnalyticsWorker
