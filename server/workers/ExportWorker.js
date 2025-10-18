const { Worker } = require('bullmq');
const { createBullMQConnection } = require('../lib/redis');
const prisma = require('../lib/prisma');
const logger = require('../utils/logger');
const { emitSSEEvent } = require('../services/sse/index.cjs');
const { createObjectCsvStringifier } = require('csv-writer');
const fs = require('fs');
const path = require('path');

/**
 * ExportWorker - Processes report generation (CSV, Excel, PDF)
 */
class ExportWorker {
  constructor() {
    this.worker = null;
    this.connection = null;
  }

  async start() {
    logger.info('[ExportWorker] Starting worker...');
    this.connection = createBullMQConnection();

    this.worker = new Worker('export-queue', async (job) => await this.processJob(job), {
      connection: this.connection,
      concurrency: 2,
    });

    this.worker.on('completed', (job) => logger.info(`[ExportWorker] Job completed: ${job.id}`));
    this.worker.on('failed', (job, err) => logger.error(`[ExportWorker] Job failed: ${job.id}`, err));

    logger.info('[ExportWorker] Worker started');
    return { success: true };
  }

  async processJob(job) {
    const { entity, format, filters, userId } = job.data;

    try {
      await job.updateProgress(10);
      this.emitProgress(userId, job.id, 10, 'Fetching data...');

      const data = await this.fetchData(entity, filters);

      await job.updateProgress(50);
      this.emitProgress(userId, job.id, 50, 'Generating file...');

      const filePath = await this.generateFile(data, entity, format);

      await job.updateProgress(90);
      this.emitProgress(userId, job.id, 90, 'Saving export record...');

      const exportRecord = await prisma.dataExport.create({
        data: {
          userId,
          type: format.toUpperCase(),
          entity: entity.toUpperCase(),
          fileName: path.basename(filePath),
          fileUrl: filePath,
          fileSize: fs.statSync(filePath).size,
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      await job.updateProgress(100);
      this.emitComplete(userId, job.id, exportRecord);

      return {
        success: true,
        exportId: exportRecord.id,
        filePath,
      };
    } catch (error) {
      logger.error(`[ExportWorker] Job ${job.id} failed:`, error);
      if (userId) emitSSEEvent(userId, 'job:failed', { jobId: job.id, error: error.message });
      throw error;
    }
  }

  async fetchData(entity, filters = {}) {
    switch (entity) {
      case 'products':
        return prisma.product.findMany({ where: filters });
      case 'inventory':
        return prisma.inventoryItem.findMany({ where: filters });
      case 'forecasts':
        return prisma.demandForecast.findMany({ where: filters });
      default:
        throw new Error(`Unknown entity: ${entity}`);
    }
  }

  async generateFile(data, entity, format) {
    const exportDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${entity}-export-${timestamp}.${format}`;
    const filePath = path.join(exportDir, fileName);

    if (format === 'csv') {
      await this.generateCSV(data, filePath);
    } else if (format === 'json') {
      await this.generateJSON(data, filePath);
    }

    return filePath;
  }

  async generateCSV(data, filePath) {
    if (data.length === 0) {
      fs.writeFileSync(filePath, 'No data available');
      return;
    }

    const headers = Object.keys(data[0]).map(key => ({ id: key, title: key }));
    const csvStringifier = createObjectCsvStringifier({ header: headers });

    const csvData = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(data);
    fs.writeFileSync(filePath, csvData);
  }

  async generateJSON(data, filePath) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  emitProgress(userId, jobId, progress, message) {
    if (userId) emitSSEEvent(userId, 'job:progress', { jobId, type: 'export', progress, message });
  }

  emitComplete(userId, jobId, exportRecord) {
    if (userId) emitSSEEvent(userId, 'job:complete', { jobId, type: 'export', exportId: exportRecord.id });
  }

  async stop() {
    if (this.worker) await this.worker.close();
    if (this.connection) await this.connection.quit();
    logger.info('[ExportWorker] Worker stopped');
  }
}

module.exports = ExportWorker;
