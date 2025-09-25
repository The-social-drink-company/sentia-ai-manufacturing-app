/**
 * Queue Service using BullMQ for background job processing
 * Handles data import pipeline jobs with Redis as message broker
 */

import { Queue, Worker, QueueEvents } from 'bullmq';
import Redis from 'ioredis';
import { logInfo, logError, logWarn } from '../../services/logger.js';
import ValidationEngine from './validationEngine.js';
import dbService from './db/index.js';
import fs from 'fs';
import csv from 'csv-parser';
import ExcelJS from 'exceljs';

class QueueService {
  constructor() {
    this.redis = null;
    this.queues = {};
    this.workers = {};
    this.queueEvents = {};
    this.validationEngine = new ValidationEngine();
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Temporarily disable queue service to stabilize server
      logWarn('Queue service temporarily disabled for server stability - using synchronous processing');
      this.isInitialized = true;
      return false;
      
      // Check if Redis is configured in environment
      if (!process.env.REDIS_HOST && !process.env.REDIS_URL) {
        logWarn('Redis not configured - queue service will be disabled');
        this.isInitialized = true;
        return false;
      }

      // Initialize Redis connection only if we don't have one or it's not connected
      if (!this.redis || this.redis.status === 'end' || this.redis.status === 'close') {
        const redisConfig = process.env.REDIS_URL ? 
          process.env.REDIS_URL : 
          {
            host: process.env.REDIS_HOST || null,
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD,
            db: process.env.REDIS_DB || 0,
            retryDelayOnFailover: 100,
            enableReadyCheck: true,
            lazyConnect: true,
            maxRetriesPerRequest: null,
            connectTimeout: 5000,
            commandTimeout: 5000
          };

        this.redis = new Redis(redisConfig);
        
        // Set up error handling to prevent unhandled errors
        this.redis.on('error', (error) => {
          logWarn('Redis connection error - queue service unavailable', error);
        });

        this.redis.on('connect', () => {
          logInfo('Redis connection established for queue service');
        });

        this.redis.on('close', () => {
          logWarn('Redis connection closed');
        });
      }

      // Only connect if not already connected/connecting
      if (this.redis.status !== 'ready' && this.redis.status !== 'connecting') {
        try {
          // Test the connection with timeout
          const connectionPromise = this.redis.connect();
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Redis connection timeout')), 10000)
          );

          await Promise.race([connectionPromise, timeoutPromise]);
        } catch (connectionError) {
          // If connection fails, continue without Redis
          logWarn('Redis connection failed - continuing without queue service', connectionError.message);
          this.isInitialized = true;
          return false;
        }
      }

      // Initialize queues
      this.queues = {
        'data-import': new Queue('data-import', {
          connection: this.redis,
          defaultJobOptions: {
            removeOnComplete: 10,
            removeOnFail: 50,
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 5000
            }
          }
        }),
        'data-validation': new Queue('data-validation', {
          connection: this.redis,
          defaultJobOptions: {
            removeOnComplete: 10,
            removeOnFail: 50,
            attempts: 2,
            backoff: {
              type: 'exponential',
              delay: 3000
            }
          }
        })
      };

      // Initialize workers
      await this.initializeWorkers();

      // Initialize queue events
      this.initializeQueueEvents();

      this.isInitialized = true;
      logInfo('Queue service initialized successfully');

    } catch (error) {
      logError('Failed to initialize queue service', error);
      // Gracefully degrade - continue without queue processing
      logWarn('Queue service disabled - running in synchronous mode');
      this.isInitialized = true; // Mark as initialized even if failed to prevent retry loops
      return false;
    }
  }

  async initializeWorkers() {
    // Data Import Worker
    this.workers['data-import'] = new Worker(
      'data-import',
      async (job) => await this.processImportJob(job),
      {
        connection: this.redis,
        concurrency: 2,
        removeOnComplete: 10,
        removeOnFail: 50
      }
    );

    // Data Validation Worker
    this.workers['data-validation'] = new Worker(
      'data-validation', 
      async (job) => await this.processValidationJob(job),
      {
        connection: this.redis,
        concurrency: 3,
        removeOnComplete: 10,
        removeOnFail: 50
      }
    );

    // Worker event handlers
    Object.entries(this.workers).forEach(([queueName, worker]) => {
      worker.on('completed', (job) => {
        logInfo(`Job completed in ${queueName}`, {
          jobId: job.id,
          duration: Date.now() - job.timestamp
        });
      });

      worker.on('failed', (job, err) => {
        logError(`Job failed in ${queueName}`, {
          jobId: job?.id,
          error: err.message
        });
      });

      worker.on('error', (err) => {
        logError(`Worker error in ${queueName}`, err);
      });
    });

    logInfo('Queue workers initialized');
  }

  initializeQueueEvents() {
    Object.keys(this.queues).forEach(queueName => {
      this.queueEvents[queueName] = new QueueEvents(queueName, {
        connection: this.redis
      });

      this.queueEvents[queueName].on('waiting', ({ jobId }) => {
        logInfo(`Job waiting in ${queueName}`, { jobId });
      });

      this.queueEvents[queueName].on('active', ({ jobId, prev }) => {
        logInfo(`Job active in ${queueName}`, { jobId, prev });
      });

      this.queueEvents[queueName].on('progress', ({ jobId, data }) => {
        logInfo(`Job progress in ${queueName}`, { jobId, progress: data });
      });
    });
  }

  /**
   * Add import job to queue
   */
  async addImportJob(importJobId, config = {}) {
    if (!this.isInitialized || !this.queues['data-import']) {
      // Fallback to synchronous processing
      return await this.processImportJobSync(importJobId, config);
    }

    try {
      const job = await this.queues['data-import'].add(
        'process-import',
        {
          importJobId,
          config,
          timestamp: Date.now()
        },
        {
          jobId: `import-${importJobId}`,
          delay: config.delay || 0,
          priority: config.priority || 0
        }
      );

      logInfo('Import job added to queue', { 
        jobId: job.id, 
        importJobId 
      });

      return { success: true, jobId: job.id };
    } catch (error) {
      logError('Failed to add import job to queue', error);
      throw error;
    }
  }

  /**
   * Add validation job to queue
   */
  async addValidationJob(importJobId, validationConfig = {}) {
    if (!this.isInitialized || !this.queues['data-validation']) {
      // Fallback to synchronous processing
      return await this.processValidationJobSync(importJobId, validationConfig);
    }

    try {
      const job = await this.queues['data-validation'].add(
        'process-validation',
        {
          importJobId,
          validationConfig,
          timestamp: Date.now()
        },
        {
          jobId: `validation-${importJobId}`,
          delay: validationConfig.delay || 0,
          priority: validationConfig.priority || 0
        }
      );

      logInfo('Validation job added to queue', { 
        jobId: job.id, 
        importJobId 
      });

      return { success: true, jobId: job.id };
    } catch (error) {
      logError('Failed to add validation job to queue', error);
      throw error;
    }
  }

  /**
   * Process import job (worker function)
   */
  async processImportJob(job) {
    const { importJobId, config } = job.data;
    
    try {
      logInfo('Processing import job', { importJobId, jobId: job.id });
      
      await dbService.initialize();
      const prisma = dbService.getClient();

      // Update job status
      await prisma.import_job.update({
        where: { id: importJobId },
        data: { 
          status: 'processing',
          processed_at: new Date()
        }
      });

      // Get import job details
      const importJob = await prisma.import_job.findUnique({
        where: { id: importJobId }
      });

      if (!importJob) {
        throw new Error(`Import job ${importJobId} not found`);
      }

      // Parse file and extract data
      const fileData = await this.parseFile(importJob.file_path, importJob.file_type);
      
      // Update progress
      await job.updateProgress(25);

      // Apply field mapping
      const mappedData = this.applyFieldMapping(fileData, importJob.mapping_config);
      
      // Update progress
      await job.updateProgress(50);

      // Store raw data for validation
      const validationResults = [];
      for (let i = 0; i < mappedData.length; i++) {
        const result = await prisma.validation_result.create({
          data: {
            import_job_id: importJobId,
            row_number: i + 1,
            status: 'pending',
            original_data: mappedData[i],
            errors: [],
            warnings: []
          }
        });
        validationResults.push(result);
      }

      // Update progress and job status
      await job.updateProgress(75);

      await prisma.import_job.update({
        where: { id: importJobId },
        data: {
          total_rows: mappedData.length,
          processed_rows: 0,
          status: 'validation_pending'
        }
      });

      await job.updateProgress(100);

      logInfo('Import job completed', { importJobId, totalRows: mappedData.length });
      
      return {
        success: true,
        importJobId,
        totalRows: mappedData.length,
        validationResultsCount: validationResults.length
      };

    } catch (error) {
      logError('Import job processing failed', { importJobId, error: error.message });
      
      // Update job status to failed
      try {
        await dbService.initialize();
        const prisma = dbService.getClient();
        await prisma.import_job.update({
          where: { id: importJobId },
          data: { 
            status: 'failed',
            warnings: [error.message]
          }
        });
      } catch (dbError) {
        logError('Failed to update import job status', dbError);
      }

      throw error;
    }
  }

  /**
   * Process validation job (worker function)
   */
  async processValidationJob(job) {
    const { importJobId, validationConfig } = job.data;
    
    try {
      logInfo('Processing validation job', { importJobId, jobId: job.id });
      
      await dbService.initialize();
      const prisma = dbService.getClient();

      // Get import job and validation data
      const [importJob, validationResults] = await Promise.all([
        prisma.import_job.findUnique({ where: { id: importJobId } }),
        prisma.validation_result.findMany({
          where: { import_job_id: importJobId },
          orderBy: { row_number: 'asc' }
        })
      ]);

      if (!importJob) {
        throw new Error(`Import job ${importJobId} not found`);
      }

      // Update job status
      await prisma.import_job.update({
        where: { id: importJobId },
        data: { status: 'validating' }
      });

      let validRows = 0;
      let errorRows = 0;
      let warningRows = 0;

      // Process validation results in batches
      const batchSize = 100;
      for (let i = 0; i < validationResults.length; i += batchSize) {
        const batch = validationResults.slice(i, i + batchSize);
        
        for (const validationResult of batch) {
          const rowValidation = await this.validationEngine.validateRow(
            validationResult.original_data,
            importJob.data_type,
            validationResult.row_number
          );

          const status = rowValidation.isValid ? 'valid' : 'error';
          if (rowValidation.isValid) validRows++;
          else errorRows++;
          if (rowValidation.warnings.length > 0) warningRows++;

          await prisma.validation_result.update({
            where: { id: validationResult.id },
            data: {
              status,
              errors: rowValidation.errors,
              warnings: rowValidation.warnings,
              processed_data: rowValidation.processedData
            }
          });
        }

        // Update progress
        const progress = Math.floor(((i + batch.length) / validationResults.length) * 100);
        await job.updateProgress(progress);
      }

      // Update final job status
      const finalStatus = errorRows > 0 ? 'completed_with_errors' : 'completed';
      await prisma.import_job.update({
        where: { id: importJobId },
        data: {
          status: finalStatus,
          processed_rows: validRows,
          error_rows: errorRows,
          completed_at: new Date()
        }
      });

      logInfo('Validation job completed', {
        importJobId,
        validRows,
        errorRows,
        warningRows
      });

      return {
        success: true,
        importJobId,
        validRows,
        errorRows,
        warningRows,
        status: finalStatus
      };

    } catch (error) {
      logError('Validation job processing failed', { importJobId, error: error.message });
      
      // Update job status to failed
      try {
        await dbService.initialize();
        const prisma = dbService.getClient();
        await prisma.import_job.update({
          where: { id: importJobId },
          data: { 
            status: 'failed',
            warnings: [error.message]
          }
        });
      } catch (dbError) {
        logError('Failed to update validation job status', dbError);
      }

      throw error;
    }
  }

  /**
   * Parse uploaded file based on file type
   */
  async parseFile(filePath, fileType) {
    const data = [];

    try {
      if (fileType.includes('csv') || fileType.includes('text')) {
        // Parse CSV
        return new Promise((resolve, reject) => {
          const results = [];
          fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => results.push(row))
            .on('end', () => resolve(results))
            .on('error', reject);
        });
      } else if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
        // Parse Excel
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        const worksheet = workbook.worksheets[0];
        if (!worksheet) {
          return [];
        }

        const toValue = (cellValue) => {
          if (cellValue === null || cellValue === undefined) return '';
          if (cellValue instanceof Date) return cellValue.toISOString();
          if (typeof cellValue === 'object') {
            if (cellValue.text) return cellValue.text;
            if (Array.isArray(cellValue.richText)) {
              return cellValue.richText.map(part => part.text).join('');
            }
            if (typeof cellValue.result !== 'undefined') return cellValue.result;
            if (cellValue.hyperlink) return cellValue.text || cellValue.hyperlink;
            if (typeof cellValue.value !== 'undefined') return cellValue.value;
          }
          return cellValue;
        };

        const headers = worksheet
          .getRow(1)
          .values.slice(1)
          .map(header => {
            const value = toValue(header);
            return typeof value === 'string' ? value.trim() : value;
          });

        const rows = [];
        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
          if (rowNumber === 1) return;
          const record = {};

          headers.forEach((header, idx) => {
            if (!header) return;
            const raw = toValue(row.getCell(idx + 1).value);
            record[header] = raw;
          });

          if (Object.values(record).some(value => value !== '' && value !== null && value !== undefined)) {
            rows.push(record);
          }
        });

        return rows;
      } else if (fileType.includes('json')) {
        // Parse JSON
        const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return Array.isArray(jsonData) ? jsonData : [jsonData];
      }
    } catch (error) {
      logError('File parsing failed', { filePath, fileType, error: error.message });
      throw new Error(`Failed to parse file: ${error.message}`);
    }

    throw new Error(`Unsupported file type: ${fileType}`);
  }

  /**
   * Apply field mapping configuration to raw data
   */
  applyFieldMapping(data, mappingConfig) {
    if (!mappingConfig || Object.keys(mappingConfig).length === 0) {
      return data;
    }

    return data.map(row => {
      const mappedRow = {};
      
      // Apply mapping
      Object.entries(mappingConfig).forEach(([targetField, sourceField]) => {
        if (sourceField && row.hasOwnProperty(sourceField)) {
          mappedRow[targetField] = row[sourceField];
        }
      });

      return mappedRow;
    });
  }

  /**
   * Synchronous fallback processing (when Redis/queues unavailable)
   */
  async processImportJobSync(importJobId, config) {
    logWarn('Processing import job synchronously (queue unavailable)', { importJobId });
    
    try {
      const jobData = { data: { importJobId, config }, updateProgress: () => {} };
      return await this.processImportJob(jobData);
    } catch (error) {
      logError('Synchronous import processing failed', error);
      throw error;
    }
  }

  async processValidationJobSync(importJobId, validationConfig) {
    logWarn('Processing validation job synchronously (queue unavailable)', { importJobId });
    
    try {
      const jobData = { data: { importJobId, validationConfig }, updateProgress: () => {} };
      return await this.processValidationJob(jobData);
    } catch (error) {
      logError('Synchronous validation processing failed', error);
      throw error;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    if (!this.isInitialized) {
      return { available: false, message: 'Queue service not available' };
    }

    try {
      const stats = {};
      
      for (const [name, queue] of Object.entries(this.queues)) {
        const [waiting, active, completed, failed] = await Promise.all([
          queue.getWaiting(),
          queue.getActive(),
          queue.getCompleted(),
          queue.getFailed()
        ]);

        stats[name] = {
          waiting: waiting.length,
          active: active.length,
          completed: completed.length,
          failed: failed.length
        };
      }

      return {
        available: true,
        redis: {
          status: this.redis.status,
          uptime: this.redis.status === 'ready' ? Date.now() : 0
        },
        queues: stats
      };
    } catch (error) {
      logError('Failed to get queue stats', error);
      return { available: false, error: error.message };
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    if (!this.isInitialized) return;

    try {
      logInfo('Shutting down queue service...');

      // Close workers
      await Promise.all(
        Object.values(this.workers).map(worker => worker.close())
      );

      // Close queue events
      await Promise.all(
        Object.values(this.queueEvents).map(queueEvent => queueEvent.close())
      );

      // Close queues
      await Promise.all(
        Object.values(this.queues).map(queue => queue.close())
      );

      // Close Redis connection
      if (this.redis) {
        await this.redis.quit();
      }

      this.isInitialized = false;
      logInfo('Queue service shutdown completed');
    } catch (error) {
      logError('Error during queue service shutdown', error);
    }
  }
}

// Export singleton instance
const queueService = new QueueService();
export default queueService;


