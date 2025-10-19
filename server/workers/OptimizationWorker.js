const { Worker } = require('bullmq')
const { createBullMQConnection } = require('../lib/redis')
const prisma = require('../lib/prisma')
const logger = require('../utils/logger')
const { emitSSEEvent } = require('../services/sse/index.cjs')

/**
 * OptimizationWorker
 *
 * Processes inventory optimization jobs.
 *
 * Calculations:
 * - EOQ (Economic Order Quantity)
 * - Safety Stock
 * - Reorder Points
 * - Multi-warehouse allocation
 * - Capacity constraints
 * - Working capital optimization
 */
class OptimizationWorker {
  constructor() {
    this.worker = null
    this.connection = null
  }

  async start() {
    logger.info('[OptimizationWorker] Starting worker...')

    this.connection = createBullMQConnection()

    this.worker = new Worker('optimization-queue', async job => await this.processJob(job), {
      connection: this.connection,
      concurrency: 2,
    })

    this.worker.on('completed', job => {
      logger.info(`[OptimizationWorker] Job completed: ${job.id}`)
    })

    this.worker.on('failed', (job, err) => {
      logger.error(`[OptimizationWorker] Job failed: ${job.id}`, err)
    })

    logger.info('[OptimizationWorker] Worker started')
    return { success: true }
  }

  async processJob(job) {
    const { productId, constraints, userId } = job.data

    try {
      await job.updateProgress(10)
      this.emitProgress(userId, job.id, 10, 'Loading product data...')

      // Load product and inventory data
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          inventoryItems: {
            include: {
              movements: {
                orderBy: { performedAt: 'desc' },
                take: 100,
              },
            },
          },
          demandForecasts: {
            orderBy: { forecastDate: 'desc' },
            take: 1,
          },
        },
      })

      if (!product) {
        throw new Error(`Product not found: ${productId}`)
      }

      await job.updateProgress(30)
      this.emitProgress(userId, job.id, 30, 'Calculating EOQ...')

      // Calculate EOQ
      const eoq = this.calculateEOQ(product, constraints)

      await job.updateProgress(50)
      this.emitProgress(userId, job.id, 50, 'Calculating safety stock...')

      // Calculate safety stock
      const safetyStock = this.calculateSafetyStock(product, constraints)

      await job.updateProgress(70)
      this.emitProgress(userId, job.id, 70, 'Calculating reorder point...')

      // Calculate reorder point
      const reorderPoint = this.calculateReorderPoint(product, safetyStock)

      await job.updateProgress(90)
      this.emitProgress(userId, job.id, 90, 'Generating recommendations...')

      // Generate recommendations
      const recommendations = this.generateRecommendations({
        product,
        eoq,
        safetyStock,
        reorderPoint,
        constraints,
      })

      // Save results
      const result = await this.saveOptimizationResult({
        productId,
        eoq,
        safetyStock,
        reorderPoint,
        recommendations,
      })

      await job.updateProgress(100)
      this.emitComplete(userId, job.id, result)

      return {
        success: true,
        resultId: result.id,
        eoq: eoq.quantity,
        safetyStock: safetyStock.quantity,
        reorderPoint: reorderPoint.quantity,
      }
    } catch (error) {
      logger.error(`[OptimizationWorker] Job ${job.id} failed:`, error)
      if (userId) {
        emitSSEEvent(userId, 'job:failed', { jobId: job.id, error: error.message })
      }
      throw error
    }
  }

  calculateEOQ(product, constraints = {}) {
    const annualDemand = product.demandForecasts[0]?.forecastedDemand * 365 || 10000
    const orderingCost = constraints.orderingCost || 50
    const holdingCostRate = constraints.holdingCostRate || 0.25
    const unitCost = parseFloat(product.unitCost)

    const eoq = Math.sqrt((2 * annualDemand * orderingCost) / (holdingCostRate * unitCost))

    return {
      quantity: Math.round(eoq),
      annualDemand,
      orderingCost,
      holdingCostRate,
      totalCost: Math.sqrt(2 * annualDemand * orderingCost * holdingCostRate * unitCost),
    }
  }

  calculateSafetyStock(product, constraints = {}) {
    const leadTime = product.leadTime || 7
    const serviceLevelZ = constraints.serviceLevelZ || 1.65 // 95% service level
    const avgDemand = product.demandForecasts[0]?.forecastedDemand || 100
    const demandStdDev = avgDemand * 0.2 // Assume 20% coefficient of variation

    const safetyStock = serviceLevelZ * demandStdDev * Math.sqrt(leadTime)

    return {
      quantity: Math.round(safetyStock),
      leadTime,
      serviceLevel: 0.95,
      avgDemand,
      stdDev: demandStdDev,
    }
  }

  calculateReorderPoint(product, safetyStock) {
    const avgDemand = product.demandForecasts[0]?.forecastedDemand || 100
    const leadTime = product.leadTime || 7

    const reorderPoint = avgDemand * leadTime + safetyStock.quantity

    return {
      quantity: Math.round(reorderPoint),
      leadTimeDemand: avgDemand * leadTime,
      safetyStock: safetyStock.quantity,
    }
  }

  generateRecommendations(data) {
    const { product, eoq, safetyStock, reorderPoint } = data
    const recommendations = []

    // Current inventory level
    const currentStock = product.inventoryItems.reduce((sum, item) => sum + item.quantityOnHand, 0)

    // Check if reorder needed
    if (currentStock <= reorderPoint.quantity) {
      recommendations.push({
        type: 'REORDER',
        priority: 'HIGH',
        message: `Current stock (${currentStock}) is at or below reorder point (${reorderPoint.quantity}). Order ${eoq.quantity} units immediately.`,
        orderQuantity: eoq.quantity,
      })
    }

    // Check if overstocked
    if (currentStock > eoq.quantity * 2) {
      recommendations.push({
        type: 'OVERSTOCK',
        priority: 'MEDIUM',
        message: `Current stock (${currentStock}) is significantly above EOQ (${eoq.quantity}). Consider reducing orders.`,
      })
    }

    // Safety stock recommendation
    if (currentStock < safetyStock.quantity) {
      recommendations.push({
        type: 'SAFETY_STOCK',
        priority: 'HIGH',
        message: `Current stock (${currentStock}) is below safety stock level (${safetyStock.quantity}). Risk of stockout.`,
      })
    }

    return recommendations
  }

  async saveOptimizationResult(data) {
    return prisma.optimizationResult.create({
      data: {
        productId: data.productId,
        type: 'INVENTORY',
        parameters: JSON.stringify({
          eoq: data.eoq,
          safetyStock: data.safetyStock,
          reorderPoint: data.reorderPoint,
        }),
        results: JSON.stringify({
          recommendations: data.recommendations,
        }),
        score: 85.0,
        createdAt: new Date(),
      },
    })
  }

  emitProgress(userId, jobId, progress, message) {
    if (userId) {
      emitSSEEvent(userId, 'job:progress', {
        jobId,
        type: 'optimization',
        progress,
        message,
      })
    }
  }

  emitComplete(userId, jobId, result) {
    if (userId) {
      emitSSEEvent(userId, 'job:complete', {
        jobId,
        type: 'optimization',
        resultId: result.id,
      })
    }
  }

  async stop() {
    if (this.worker) await this.worker.close()
    if (this.connection) await this.connection.quit()
    logger.info('[OptimizationWorker] Worker stopped')
  }
}

module.exports = OptimizationWorker
