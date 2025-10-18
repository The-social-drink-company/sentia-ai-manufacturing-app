const { Worker } = require('bullmq');
const { createBullMQConnection } = require('../lib/redis');
const prisma = require('../lib/prisma');
const logger = require('../utils/logger');
const { emitSSEEvent } = require('../services/sse/index.cjs');
const csv = require('csv-parser');
const fs = require('fs');

/**
 * ImportWorker - Processes CSV/Excel data imports
 */
class ImportWorker {
  constructor() {
    this.worker = null;
    this.connection = null;
  }

  async start() {
    logger.info('[ImportWorker] Starting worker...');
    this.connection = createBullMQConnection();

    this.worker = new Worker('import-queue', async (job) => await this.processJob(job), {
      connection: this.connection,
      concurrency: 1, // One import at a time
    });

    this.worker.on('completed', (job) => logger.info(`[ImportWorker] Job completed: ${job.id}`));
    this.worker.on('failed', (job, err) => logger.error(`[ImportWorker] Job failed: ${job.id}`, err));

    logger.info('[ImportWorker] Worker started');
    return { success: true };
  }

  async processJob(job) {
    const { filePath, entityType, userId } = job.data;

    try {
      await job.updateProgress(10);
      this.emitProgress(userId, job.id, 10, 'Reading file...');

      const rows = await this.readCSV(filePath);

      await job.updateProgress(30);
      this.emitProgress(userId, job.id, 30, 'Validating data...');

      const validationResults = await this.validateRows(rows, entityType);

      await job.updateProgress(60);
      this.emitProgress(userId, job.id, 60, 'Importing valid rows...');

      const importResults = await this.importValidRows(validationResults.valid, entityType);

      await job.updateProgress(90);
      this.emitProgress(userId, job.id, 90, 'Generating report...');

      const report = {
        total: rows.length,
        valid: validationResults.valid.length,
        invalid: validationResults.invalid.length,
        imported: importResults.imported,
        errors: validationResults.invalid,
      };

      await job.updateProgress(100);
      this.emitComplete(userId, job.id, report);

      return { success: true, report };
    } catch (error) {
      logger.error(`[ImportWorker] Job ${job.id} failed:`, error);
      if (userId) emitSSEEvent(userId, 'job:failed', { jobId: job.id, error: error.message });
      throw error;
    }
  }

  async readCSV(filePath) {
    return new Promise((resolve, reject) => {
      const rows = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => rows.push(row))
        .on('end', () => resolve(rows))
        .on('error', reject);
    });
  }

  async validateRows(rows, entityType) {
    const valid = [];
    const invalid = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const validation = this.validateRow(row, entityType);

      if (validation.valid) {
        valid.push(row);
      } else {
        invalid.push({
          row: i + 1,
          data: row,
          errors: validation.errors,
        });
      }
    }

    return { valid, invalid };
  }

  validateRow(row, entityType) {
    const errors = [];

    // Basic validation based on entity type
    if (entityType === 'products') {
      if (!row.sku) errors.push('SKU is required');
      if (!row.name) errors.push('Name is required');
      if (!row.unitCost || isNaN(parseFloat(row.unitCost))) errors.push('Valid unit cost is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async importValidRows(rows, entityType) {
    let imported = 0;

    for (const row of rows) {
      try {
        if (entityType === 'products') {
          await prisma.product.create({
            data: {
              sku: row.sku,
              name: row.name,
              unitCost: parseFloat(row.unitCost),
              sellingPrice: parseFloat(row.sellingPrice || row.unitCost),
              organizationId: row.organizationId || 'default-org',
            },
          });
          imported++;
        }
      } catch (error) {
        logger.error('[ImportWorker] Failed to import row:', error);
      }
    }

    return { imported };
  }

  emitProgress(userId, jobId, progress, message) {
    if (userId) emitSSEEvent(userId, 'job:progress', { jobId, type: 'import', progress, message });
  }

  emitComplete(userId, jobId, report) {
    if (userId) emitSSEEvent(userId, 'job:complete', { jobId, type: 'import', report });
  }

  async stop() {
    if (this.worker) await this.worker.close();
    if (this.connection) await this.connection.quit();
    logger.info('[ImportWorker] Worker stopped');
  }
}

module.exports = ImportWorker;
