/**
 * Optimization Job Manager Service
 * Handles async job processing, queue management, and job lifecycle
 */

import { EventEmitter } from 'events';
import { logDebug, logInfo, logWarn, logError } from '../../src/utils/logger';


class JobManagerService extends EventEmitter {
  constructor() {
    super();
    this.jobs = new Map();
    this.jobQueue = [];
    this.activeJobs = new Map();
    this.maxConcurrentJobs = 3;
    this.jobHistory = [];
    this.retentionDays = 30;
    this.processingInterval = null;
    
    this.startJobProcessor();
  }

  /**
   * Create new optimization job
   */
  async createJob(jobType, payload, options = {}) {
    const jobId = this.generateJobId();
    const job = {
      jobId,
      type: jobType,
      status: 'QUEUED',
      payload,
      options: {
        priority: options.priority || 'NORMAL',
        maxRetries: options.maxRetries || 3,
        timeout: options.timeout || 300000, // 5 minutes
        ...options
      },
      metadata: {
        createdAt: new Date().toISOString(),
        createdBy: options.userId || 'system',
        estimatedDuration: this.estimateJobDuration(jobType, payload),
        tags: options.tags || []
      },
      progress: {
        stage: 'INITIALIZING',
        percentage: 0,
        message: 'Job queued for processing',
        startedAt: null,
        completedAt: null
      },
      result: null,
      error: null,
      retryCount: 0
    };

    this.jobs.set(jobId, job);
    this.queueJob(job);
    
    // Emit job created event
    this.emit('jobCreated', { jobId, type: jobType });
    
    return { jobId, status: 'QUEUED', estimatedDuration: job.metadata.estimatedDuration };
  }

  /**
   * Queue job for processing
   */
  queueJob(job) {
    // Insert based on priority
    const priorityOrder = { 'HIGH': 0, 'NORMAL': 1, 'LOW': 2 };
    const insertIndex = this.jobQueue.findIndex(queuedJob => 
      priorityOrder[queuedJob.options.priority] > priorityOrder[job.options.priority]
    );
    
    if (insertIndex === -1) {
      this.jobQueue.push(job);
    } else {
      this.jobQueue.splice(insertIndex, 0, job);
    }
  }

  /**
   * Start job processing loop
   */
  startJobProcessor() {
    this.processingInterval = setInterval(async () => {
      await this.processJobQueue();
    }, 1000);
  }

  /**
   * Process job queue
   */
  async processJobQueue() {
    // Check if we can process more jobs
    if (this.activeJobs.size >= this.maxConcurrentJobs || this.jobQueue.length === 0) {
      return;
    }

    const job = this.jobQueue.shift();
    if (!job) return;

    try {
      await this.executeJob(job);
    } catch (error) {
      logError(`Job processing failed: ${error.message}`);
      await this.handleJobError(job, error);
    }
  }

  /**
   * Execute job
   */
  async executeJob(job) {
    const { jobId } = job;
    
    // Mark as active
    this.activeJobs.set(jobId, job);
    job.status = 'RUNNING';
    job.progress.startedAt = new Date().toISOString();
    job.progress.stage = 'PROCESSING';
    job.progress.message = 'Job execution started';
    
    this.emit('jobStarted', { jobId, type: job.type });

    try {
      // Set timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Job timeout')), job.options.timeout)
      );

      // Execute job with timeout
      const executionPromise = this.executeJobByType(job);
      const result = await Promise.race([executionPromise, timeoutPromise]);

      // Job completed successfully
      job.status = 'COMPLETED';
      job.result = result;
      job.progress.percentage = 100;
      job.progress.stage = 'COMPLETED';
      job.progress.message = 'Job completed successfully';
      job.progress.completedAt = new Date().toISOString();

      this.emit('jobCompleted', { jobId, type: job.type, result });

    } catch (error) {
      await this.handleJobError(job, error);
    } finally {
      // Remove from active jobs
      this.activeJobs.delete(jobId);
      
      // Archive job
      this.archiveJob(job);
    }
  }

  /**
   * Execute job based on type
   */
  async executeJobByType(job) {
    const { type, payload } = job;

    switch (type) {
      case 'SKU_OPTIMIZATION':
        return await this.executeSKUOptimization(job, payload);
      
      case 'BATCH_OPTIMIZATION':
        return await this.executeBatchOptimization(job, payload);
      
      case 'MULTI_WAREHOUSE_OPTIMIZATION':
        return await this.executeMultiWarehouseOptimization(job, payload);
      
      case 'WC_ANALYSIS':
        return await this.executeWCAnalysis(job, payload);
      
      case 'CFO_REPORT_GENERATION':
        return await this.executeCFOReportGeneration(job, payload);
      
      case 'DIAGNOSTICS_ANALYSIS':
        return await this.executeDiagnosticsAnalysis(job, payload);
      
      default:
        throw new Error(`Unknown job type: ${type}`);
    }
  }

  /**
   * Execute SKU optimization job
   */
  async executeSKUOptimization(job, payload) {
    const { OptimizationService } = await import('./OptimizationService.js');
    
    this.updateJobProgress(job, 20, 'LOADING_DATA', 'Loading SKU data and constraints');
    
    const { sku, constraints, demandHistory } = payload;
    
    this.updateJobProgress(job, 50, 'OPTIMIZING', 'Running optimization calculations');
    
    const result = await OptimizationService.optimizeSKU(sku, constraints, demandHistory);
    
    this.updateJobProgress(job, 80, 'GENERATING_EXPLANATION', 'Generating decision explanation');
    
    const { DiagnosticsService } = await import('./DiagnosticsService.js');
    const explanation = DiagnosticsService.explainDecision(result);
    
    return {
      optimization: result,
      explanation,
      metadata: {
        processingTime: Date.now() - new Date(job.progress.startedAt).getTime(),
        version: '1.0'
      }
    };
  }

  /**
   * Execute batch optimization job
   */
  async executeBatchOptimization(job, payload) {
    const { OptimizationService } = await import('./OptimizationService.js');
    
    this.updateJobProgress(job, 10, 'LOADING_DATA', 'Loading SKU batch data');
    
    const { skus, globalConstraints } = payload;
    
    this.updateJobProgress(job, 30, 'CLASSIFYING', 'Performing ABC classification');
    
    // Process in chunks to show progress
    const results = [];
    const chunkSize = 50;
    const totalChunks = Math.ceil(skus.length / chunkSize);
    
    for (let i = 0; i < totalChunks; i++) {
      const chunk = skus.slice(i * chunkSize, (i + 1) * chunkSize);
      const progressPercent = 30 + Math.floor((i / totalChunks) * 50);
      
      this.updateJobProgress(job, progressPercent, 'OPTIMIZING', 
        `Processing batch ${i + 1} of ${totalChunks} (${chunk.length} SKUs)`);
      
      const chunkResult = await OptimizationService.optimizeBatch(chunk, globalConstraints);
      results.push(...chunkResult.results);
    }
    
    this.updateJobProgress(job, 90, 'FINALIZING', 'Generating summary and diagnostics');
    
    const { DiagnosticsService } = await import('./DiagnosticsService.js');
    const diagnostics = DiagnosticsService.generateDiagnosticReport(results);
    
    return {
      results,
      summary: {
        totalSKUs: results.length,
        totalInvestment: results.reduce((sum, r) => sum + (r.outputs.recommendedOrderQty * r.inputs.unitCost), 0),
        avgStockoutRisk: results.reduce((sum, r) => sum + r.outputs.expectedStockoutRiskPct, 0) / results.length
      },
      diagnostics,
      metadata: {
        processingTime: Date.now() - new Date(job.progress.startedAt).getTime(),
        version: '1.0'
      }
    };
  }

  /**
   * Execute multi-warehouse optimization job
   */
  async executeMultiWarehouseOptimization(job, payload) {
    const { MultiWarehouseService } = await import('./MultiWarehouseService.js');
    
    this.updateJobProgress(job, 20, 'LOADING_DATA', 'Loading multi-warehouse configuration');
    
    const { skus, demandByRegion, constraints } = payload;
    
    this.updateJobProgress(job, 50, 'OPTIMIZING', 'Running multi-warehouse optimization');
    
    const plan = await MultiWarehouseService.generateMultiWarehousePlan(skus, demandByRegion, constraints);
    
    this.updateJobProgress(job, 80, 'ANALYZING_TRANSFERS', 'Analyzing transfer opportunities');
    
    return {
      plan,
      metadata: {
        processingTime: Date.now() - new Date(job.progress.startedAt).getTime(),
        version: '1.0'
      }
    };
  }

  /**
   * Execute working capital analysis job
   */
  async executeWCAnalysis(job, payload) {
    const { WorkingCapitalService } = await import('./WorkingCapitalService.js');
    
    this.updateJobProgress(job, 30, 'CALCULATING_REQUIREMENTS', 'Calculating WC requirements');
    
    const { orderPlan, region } = payload;
    const wcAnalysis = WorkingCapitalService.calculateWCRequirements(orderPlan, region);
    
    this.updateJobProgress(job, 70, 'GENERATING_REPORT', 'Generating CFO report');
    
    const cfoReport = WorkingCapitalService.generateCFOReport(wcAnalysis, region);
    
    return {
      analysis: wcAnalysis,
      report: cfoReport,
      metadata: {
        processingTime: Date.now() - new Date(job.progress.startedAt).getTime(),
        version: '1.0'
      }
    };
  }

  /**
   * Execute CFO report generation job
   */
  async executeCFOReportGeneration(job, payload) {
    const { CFOReportingService } = await import('./CFOReportingService.js');
    
    this.updateJobProgress(job, 20, 'PREPARING_DATA', 'Preparing optimization data');
    
    const { optimizationData, period, region } = payload;
    
    this.updateJobProgress(job, 50, 'GENERATING_BOARD_PACK', 'Generating board pack');
    
    const boardPack = await CFOReportingService.generateBoardPack(optimizationData, period, region);
    
    this.updateJobProgress(job, 80, 'EXPORTING_FORMATS', 'Exporting to requested formats');
    
    const exports = {};
    if (payload.formats) {
      for (const format of payload.formats) {
        exports[format] = await CFOReportingService.exportBoardPack(boardPack, format);
      }
    }
    
    return {
      boardPack,
      exports,
      metadata: {
        processingTime: Date.now() - new Date(job.progress.startedAt).getTime(),
        version: '1.0'
      }
    };
  }

  /**
   * Execute diagnostics analysis job
   */
  async executeDiagnosticsAnalysis(job, payload) {
    const { DiagnosticsService } = await import('./DiagnosticsService.js');
    
    this.updateJobProgress(job, 40, 'ANALYZING_DECISIONS', 'Analyzing optimization decisions');
    
    const { optimizationResults } = payload;
    const diagnosticReport = DiagnosticsService.generateDiagnosticReport(optimizationResults);
    
    this.updateJobProgress(job, 80, 'GENERATING_EXPLANATIONS', 'Generating decision explanations');
    
    const explanations = [];
    for (const result of optimizationResults.slice(0, 10)) { // Limit for performance
      if (!result.error) {
        explanations.push(DiagnosticsService.explainDecision(result));
      }
    }
    
    return {
      diagnostics: diagnosticReport,
      explanations,
      metadata: {
        processingTime: Date.now() - new Date(job.progress.startedAt).getTime(),
        version: '1.0'
      }
    };
  }

  /**
   * Update job progress
   */
  updateJobProgress(job, percentage, stage, message) {
    job.progress.percentage = percentage;
    job.progress.stage = stage;
    job.progress.message = message;
    
    this.emit('jobProgress', {
      jobId: job.jobId,
      progress: job.progress
    });
  }

  /**
   * Handle job error
   */
  async handleJobError(job, error) {
    job.error = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    };

    // Check if we should retry
    if (job.retryCount < job.options.maxRetries && this.isRetryableError(error)) {
      job.retryCount++;
      job.status = 'RETRYING';
      job.progress.message = `Retry ${job.retryCount}/${job.options.maxRetries}`;
      
      // Re-queue with exponential backoff
      setTimeout(() => {
        this.queueJob(job);
      }, Math.pow(2, job.retryCount) * 1000);
      
      this.emit('jobRetrying', { jobId: job.jobId, attempt: job.retryCount });
    } else {
      job.status = 'FAILED';
      job.progress.stage = 'FAILED';
      job.progress.message = error.message;
      job.progress.completedAt = new Date().toISOString();
      
      this.emit('jobFailed', { jobId: job.jobId, error: error.message });
    }
  }

  /**
   * Check if error is retryable
   */
  isRetryableError(error) {
    const retryableErrors = [
      'Network error',
      'Database connection failed',
      'Temporary service unavailable'
    ];
    
    return retryableErrors.some(retryableError => 
      error.message.includes(retryableError)
    );
  }

  /**
   * Archive completed job
   */
  archiveJob(job) {
    this.jobHistory.push({
      jobId: job.jobId,
      type: job.type,
      status: job.status,
      createdAt: job.metadata.createdAt,
      completedAt: job.progress.completedAt,
      duration: job.progress.completedAt 
        ? new Date(job.progress.completedAt) - new Date(job.progress.startedAt)
        : null,
      success: job.status === 'COMPLETED'
    });
    
    // Keep only recent history
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);
    
    this.jobHistory = this.jobHistory.filter(historyJob => 
      new Date(historyJob.createdAt) > cutoffDate
    );
  }

  /**
   * Get job status
   */
  getJobStatus(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) {
      return { error: 'Job not found' };
    }

    return {
      jobId: job.jobId,
      type: job.type,
      status: job.status,
      progress: job.progress,
      metadata: job.metadata,
      result: job.result,
      error: job.error
    };
  }

  /**
   * Cancel job
   */
  async cancelJob(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    if (job.status === 'COMPLETED' || job.status === 'FAILED') {
      throw new Error('Cannot cancel completed job');
    }

    if (job.status === 'QUEUED') {
      // Remove from queue
      const queueIndex = this.jobQueue.findIndex(queuedJob => queuedJob.jobId === jobId);
      if (queueIndex !== -1) {
        this.jobQueue.splice(queueIndex, 1);
      }
    }

    job.status = 'CANCELLED';
    job.progress.stage = 'CANCELLED';
    job.progress.message = 'Job cancelled by user';
    job.progress.completedAt = new Date().toISOString();

    // Remove from active jobs if running
    this.activeJobs.delete(jobId);

    this.emit('jobCancelled', { jobId });

    return { status: 'CANCELLED' };
  }

  /**
   * Get job queue status
   */
  getQueueStatus() {
    return {
      queueLength: this.jobQueue.length,
      activeJobs: this.activeJobs.size,
      maxConcurrentJobs: this.maxConcurrentJobs,
      nextJob: this.jobQueue[0] ? {
        jobId: this.jobQueue[0].jobId,
        type: this.jobQueue[0].type,
        priority: this.jobQueue[0].options.priority
      } : null
    };
  }

  /**
   * Get job history
   */
  getJobHistory(limit = 50) {
    return this.jobHistory
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
  }

  /**
   * Estimate job duration based on type and payload
   */
  estimateJobDuration(jobType, payload) {
    const estimations = {
      'SKU_OPTIMIZATION': 5, // seconds
      'BATCH_OPTIMIZATION': (payload.skus?.length || 100) * 0.1, // 0.1s per SKU
      'MULTI_WAREHOUSE_OPTIMIZATION': 30,
      'WC_ANALYSIS': 15,
      'CFO_REPORT_GENERATION': 45,
      'DIAGNOSTICS_ANALYSIS': 20
    };

    return estimations[jobType] || 30;
  }

  /**
   * Generate unique job ID
   */
  generateJobId() {
    return `OPT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Stop job processor
   */
  stop() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  /**
   * Get system health metrics
   */
  getHealthMetrics() {
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const recentJobs = this.jobHistory.filter(job => 
      new Date(job.createdAt) > hourAgo
    );
    
    const successRate = recentJobs.length > 0 
      ? (recentJobs.filter(job => job.success).length / recentJobs.length) * 100
      : 100;
    
    return {
      queueHealth: this.jobQueue.length < 100 ? 'HEALTHY' : 'OVERLOADED',
      activeJobs: this.activeJobs.size,
      successRate: Math.round(successRate * 10) / 10,
      averageProcessingTime: recentJobs.reduce((sum, job) => sum + (job.duration || 0), 0) / Math.max(1, recentJobs.length),
      lastProcessedJob: this.jobHistory[0]?.completedAt || null
    };
  }
}

export default new JobManagerService();