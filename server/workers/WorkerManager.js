const ForecastWorker = require('./ForecastWorker')
const OptimizationWorker = require('./OptimizationWorker')
const SyncWorker = require('./SyncWorker')
const ImportWorker = require('./ImportWorker')
const ExportWorker = require('./ExportWorker')
const NotificationWorker = require('./NotificationWorker')
const AnalyticsWorker = require('./AnalyticsWorker')
const logger = require('../utils/logger')

/**
 * WorkerManager
 *
 * Manages all background workers lifecycle.
 */
class WorkerManager {
  constructor() {
    this.workers = new Map()
  }

  async startAll() {
    logger.info('[WorkerManager] Starting all workers...')

    const workerClasses = [
      { key: 'forecast', Class: ForecastWorker },
      { key: 'optimization', Class: OptimizationWorker },
      { key: 'sync', Class: SyncWorker },
      { key: 'import', Class: ImportWorker },
      { key: 'export', Class: ExportWorker },
      { key: 'notification', Class: NotificationWorker },
      { key: 'analytics', Class: AnalyticsWorker },
    ]

    for (const { key, Class } of workerClasses) {
      try {
        const worker = new Class()
        await worker.start()
        this.workers.set(key, worker)
        logger.info(`[WorkerManager] Started ${key} worker`)
      } catch (error) {
        logger.error(`[WorkerManager] Failed to start ${key} worker:`, error)
      }
    }

    logger.info(`[WorkerManager] Started ${this.workers.size} workers`)
    return { success: true, count: this.workers.size }
  }

  async stopAll() {
    logger.info('[WorkerManager] Stopping all workers...')

    for (const [key, worker] of this.workers) {
      try {
        await worker.stop()
        logger.info(`[WorkerManager] Stopped ${key} worker`)
      } catch (error) {
        logger.error(`[WorkerManager] Error stopping ${key} worker:`, error)
      }
    }

    this.workers.clear()
    logger.info('[WorkerManager] All workers stopped')
    return { success: true }
  }

  getWorker(key) {
    return this.workers.get(key)
  }

  getAllWorkers() {
    return Array.from(this.workers.keys())
  }
}

let instance = null

module.exports = {
  WorkerManager,
  getInstance: () => {
    if (!instance) instance = new WorkerManager()
    return instance
  },
}
