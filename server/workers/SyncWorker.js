const { Worker } = require('bullmq');
const { createBullMQConnection } = require('../lib/redis');
const logger = require('../utils/logger');
const { getInstance: getIntegrationManager } = require('../services/integrations/IntegrationManager');

/**
 * SyncWorker - Processes API integration sync jobs
 */
class SyncWorker {
  constructor() {
    this.worker = null;
    this.connection = null;
  }

  async start() {
    logger.info('[SyncWorker] Starting worker...');
    this.connection = createBullMQConnection();

    this.worker = new Worker('sync-queue', async (job) => await this.processJob(job), {
      connection: this.connection,
      concurrency: 2,
    });

    this.worker.on('completed', (job) => logger.info(`[SyncWorker] Job completed: ${job.id}`));
    this.worker.on('failed', (job, err) => logger.error(`[SyncWorker] Job failed: ${job.id}`, err));

    logger.info('[SyncWorker] Worker started');
    return { success: true };
  }

  async processJob(job) {
    const { integrationId, dataTypes } = job.data;

    try {
      await job.updateProgress(10);

      const integrationManager = getIntegrationManager();
      const result = await integrationManager.sync(integrationId, { dataTypes });

      await job.updateProgress(100);

      return { success: true, ...result };
    } catch (error) {
      logger.error(`[SyncWorker] Job ${job.id} failed:`, error);
      throw error;
    }
  }

  async stop() {
    if (this.worker) await this.worker.close();
    if (this.connection) await this.connection.quit();
    logger.info('[SyncWorker] Worker stopped');
  }
}

module.exports = SyncWorker;
