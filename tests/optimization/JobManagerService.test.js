/**
 * Tests for JobManagerService
 * Tests job creation, execution, queue management, and error handling
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import JobManagerService from '../../services/optimization/JobManagerService.js';

// Mock the services that JobManager depends on
jest.mock('../../services/optimization/OptimizationService.js');
jest.mock('../../services/optimization/MultiWarehouseService.js');
jest.mock('../../services/optimization/WorkingCapitalService.js');
jest.mock('../../services/optimization/DiagnosticsService.js');
jest.mock('../../services/optimization/CFOReportingService.js');

describe('JobManagerService', () => {
  let mockSKU;
  let mockSKUBatch;

  beforeEach(() => {
    // Clear job history and queue
    JobManagerService.jobs.clear();
    JobManagerService.jobQueue = [];
    JobManagerService.activeJobs.clear();
    JobManagerService.jobHistory = [];

    mockSKU = {
      skuId: 'SKU-TEST-001',
      annualDemand: 1200,
      demandMean: 3.28,
      demandStdDev: 1.2,
      leadTimeDays: 14,
      unitCost: 25.50,
      serviceLevel: 0.98
    };

    mockSKUBatch = [
      { ...mockSKU, skuId: 'SKU-001' },
      { ...mockSKU, skuId: 'SKU-002' },
      { ...mockSKU, skuId: 'SKU-003' }
    ];
  });

  afterEach(() => {
    // Clean up any active intervals
    JobManagerService.stop();
  });

  describe('Job Creation', () => {
    it('should create a job successfully', async () => {
      const payload = {
        sku: mockSKU,
        constraints: {},
        demandHistory: []
      };

      const result = await JobManagerService.createJob('SKU_OPTIMIZATION', payload);

      expect(result).toMatchObject({
        jobId: expect.stringMatching(/^OPT-/),
        status: 'QUEUED',
        estimatedDuration: expect.any(Number)
      });

      // Verify job was added to jobs map
      const job = JobManagerService.jobs.get(result.jobId);
      expect(job).toBeDefined();
      expect(job.type).toBe('SKU_OPTIMIZATION');
      expect(job.status).toBe('QUEUED');
    });

    it('should generate unique job IDs', async () => {
      const payload = { sku: mockSKU };

      const job1 = await JobManagerService.createJob('SKU_OPTIMIZATION', payload);
      const job2 = await JobManagerService.createJob('SKU_OPTIMIZATION', payload);

      expect(job1.jobId).not.toBe(job2.jobId);
    });

    it('should set job priority correctly', async () => {
      const payload = { sku: mockSKU };
      const options = { priority: 'HIGH' };

      const result = await JobManagerService.createJob('SKU_OPTIMIZATION', payload, options);
      const job = JobManagerService.jobs.get(result.jobId);

      expect(job.options.priority).toBe('HIGH');
    });

    it('should estimate duration based on job type', async () => {
      const skuJob = await JobManagerService.createJob('SKU_OPTIMIZATION', { sku: mockSKU });
      const batchJob = await JobManagerService.createJob('BATCH_OPTIMIZATION', { skus: mockSKUBatch });

      expect(skuJob.estimatedDuration).toBe(5); // seconds for SKU optimization
      expect(batchJob.estimatedDuration).toBe(mockSKUBatch.length * 0.1); // 0.1s per SKU
    });

    it('should queue jobs with correct priority order', async () => {
      // Create jobs with different priorities
      await JobManagerService.createJob('SKU_OPTIMIZATION', { sku: mockSKU }, { priority: 'LOW' });
      await JobManagerService.createJob('SKU_OPTIMIZATION', { sku: mockSKU }, { priority: 'HIGH' });
      await JobManagerService.createJob('SKU_OPTIMIZATION', { sku: mockSKU }, { priority: 'NORMAL' });

      // Check queue order (HIGH should be first)
      expect(JobManagerService.jobQueue[0].options.priority).toBe('HIGH');
      expect(JobManagerService.jobQueue[1].options.priority).toBe('NORMAL');
      expect(JobManagerService.jobQueue[2].options.priority).toBe('LOW');
    });
  });

  describe('Job Status Management', () => {
    it('should return job status correctly', async () => {
      const payload = { sku: mockSKU };
      const job = await JobManagerService.createJob('SKU_OPTIMIZATION', payload);

      const status = JobManagerService.getJobStatus(job.jobId);

      expect(status).toMatchObject({
        jobId: job.jobId,
        type: 'SKU_OPTIMIZATION',
        status: 'QUEUED',
        progress: expect.objectContaining({
          stage: 'INITIALIZING',
          percentage: 0,
          message: 'Job queued for processing'
        }),
        metadata: expect.objectContaining({
          createdAt: expect.any(String),
          createdBy: expect.any(String)
        })
      });
    });

    it('should return error for non-existent job', () => {
      const status = JobManagerService.getJobStatus('NON_EXISTENT_JOB');
      expect(status).toEqual({ error: 'Job not found' });
    });

    it('should update job progress correctly', async () => {
      const payload = { sku: mockSKU };
      const job = await JobManagerService.createJob('SKU_OPTIMIZATION', payload);
      const jobObj = JobManagerService.jobs.get(job.jobId);

      // Mock progress update
      JobManagerService.updateJobProgress(jobObj, 50, 'PROCESSING', 'Running optimization');

      const status = JobManagerService.getJobStatus(job.jobId);
      expect(status.progress).toMatchObject({
        percentage: 50,
        stage: 'PROCESSING',
        message: 'Running optimization'
      });
    });
  });

  describe('Job Cancellation', () => {
    it('should cancel queued job successfully', async () => {
      const payload = { sku: mockSKU };
      const job = await JobManagerService.createJob('SKU_OPTIMIZATION', payload);

      const result = await JobManagerService.cancelJob(job.jobId);

      expect(result.status).toBe('CANCELLED');
      
      const status = JobManagerService.getJobStatus(job.jobId);
      expect(status.status).toBe('CANCELLED');
    });

    it('should throw error for non-existent job', async () => {
      await expect(JobManagerService.cancelJob('NON_EXISTENT_JOB'))
        .rejects.toThrow('Job not found');
    });

    it('should not cancel completed jobs', async () => {
      const payload = { sku: mockSKU };
      const job = await JobManagerService.createJob('SKU_OPTIMIZATION', payload);
      
      // Manually set job as completed
      const jobObj = JobManagerService.jobs.get(job.jobId);
      jobObj.status = 'COMPLETED';

      await expect(JobManagerService.cancelJob(job.jobId))
        .rejects.toThrow('Cannot cancel completed job');
    });

    it('should remove cancelled job from queue', async () => {
      const payload = { sku: mockSKU };
      const job = await JobManagerService.createJob('SKU_OPTIMIZATION', payload);

      const queueLengthBefore = JobManagerService.jobQueue.length;
      await JobManagerService.cancelJob(job.jobId);
      const queueLengthAfter = JobManagerService.jobQueue.length;

      expect(queueLengthAfter).toBe(queueLengthBefore - 1);
    });
  });

  describe('Queue Management', () => {
    it('should return correct queue status', () => {
      const status = JobManagerService.getQueueStatus();

      expect(status).toMatchObject({
        queueLength: expect.any(Number),
        activeJobs: expect.any(Number),
        maxConcurrentJobs: expect.any(Number),
        nextJob: null // Initially empty
      });
    });

    it('should show next job in queue', async () => {
      const payload = { sku: mockSKU };
      const job = await JobManagerService.createJob('SKU_OPTIMIZATION', payload);

      const status = JobManagerService.getQueueStatus();

      expect(status.nextJob).toMatchObject({
        jobId: job.jobId,
        type: 'SKU_OPTIMIZATION',
        priority: 'NORMAL'
      });
    });

    it('should respect max concurrent jobs limit', () => {
      expect(JobManagerService.maxConcurrentJobs).toBe(3);
      
      // Create multiple active jobs
      for (let i = 0; i < 5; i++) {
        const mockJob = { jobId: `test-job-${i}` };
        JobManagerService.activeJobs.set(mockJob.jobId, mockJob);
      }

      const status = JobManagerService.getQueueStatus();
      expect(status.activeJobs).toBe(5);
    });
  });

  describe('Job History', () => {
    it('should track job history correctly', async () => {
      const payload = { sku: mockSKU };
      const job = await JobManagerService.createJob('SKU_OPTIMIZATION', payload);
      const jobObj = JobManagerService.jobs.get(job.jobId);

      // Simulate job completion
      jobObj.status = 'COMPLETED';
      jobObj.progress.completedAt = new Date().toISOString();
      JobManagerService.archiveJob(jobObj);

      const history = JobManagerService.getJobHistory();
      expect(history).toHaveLength(1);
      expect(history[0]).toMatchObject({
        jobId: job.jobId,
        type: 'SKU_OPTIMIZATION',
        status: 'COMPLETED',
        success: true
      });
    });

    it('should limit history to retention period', async () => {
      // Mock old jobs
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 35); // 35 days ago

      JobManagerService.jobHistory.push({
        jobId: 'OLD-JOB',
        createdAt: oldDate.toISOString(),
        status: 'COMPLETED'
      });

      // Create new job and archive it
      const payload = { sku: mockSKU };
      const job = await JobManagerService.createJob('SKU_OPTIMIZATION', payload);
      const jobObj = JobManagerService.jobs.get(job.jobId);
      jobObj.status = 'COMPLETED';
      JobManagerService.archiveJob(jobObj);

      const history = JobManagerService.getJobHistory();
      
      // Old job should be filtered out (older than 30 days)
      expect(history.every(h => h.jobId !== 'OLD-JOB')).toBe(true);
    });

    it('should respect history limit parameter', async () => {
      // Add multiple history entries
      for (let i = 0; i < 10; i++) {
        JobManagerService.jobHistory.push({
          jobId: `JOB-${i}`,
          createdAt: new Date().toISOString(),
          status: 'COMPLETED',
          success: true
        });
      }

      const limitedHistory = JobManagerService.getJobHistory(5);
      expect(limitedHistory).toHaveLength(5);
    });
  });

  describe('Health Metrics', () => {
    it('should return health metrics', () => {
      const health = JobManagerService.getHealthMetrics();

      expect(health).toMatchObject({
        queueHealth: expect.stringMatching(/^(HEALTHY|OVERLOADED)$/),
        activeJobs: expect.any(Number),
        successRate: expect.any(Number),
        averageProcessingTime: expect.any(Number),
        lastProcessedJob: null // Initially null
      });
    });

    it('should indicate overloaded queue', async () => {
      // Create many jobs to overload queue
      const promises = [];
      for (let i = 0; i < 150; i++) {
        promises.push(JobManagerService.createJob('SKU_OPTIMIZATION', { sku: mockSKU }));
      }
      await Promise.all(promises);

      const health = JobManagerService.getHealthMetrics();
      expect(health.queueHealth).toBe('OVERLOADED');
    });

    it('should calculate success rate correctly', () => {
      // Add mixed success/failure history
      JobManagerService.jobHistory.push(
        { success: true, createdAt: new Date().toISOString() },
        { success: true, createdAt: new Date().toISOString() },
        { success: false, createdAt: new Date().toISOString() },
        { success: true, createdAt: new Date().toISOString() }
      );

      const health = JobManagerService.getHealthMetrics();
      expect(health.successRate).toBe(75); // 3/4 = 75%
    });
  });

  describe('Job Execution Types', () => {
    it('should estimate duration for different job types', () => {
      expect(JobManagerService.estimateJobDuration('SKU_OPTIMIZATION', {})).toBe(5);
      expect(JobManagerService.estimateJobDuration('BATCH_OPTIMIZATION', { skus: Array(100) })).toBe(10);
      expect(JobManagerService.estimateJobDuration('MULTI_WAREHOUSE_OPTIMIZATION', {})).toBe(30);
      expect(JobManagerService.estimateJobDuration('WC_ANALYSIS', {})).toBe(15);
      expect(JobManagerService.estimateJobDuration('CFO_REPORT_GENERATION', {})).toBe(45);
      expect(JobManagerService.estimateJobDuration('DIAGNOSTICS_ANALYSIS', {})).toBe(20);
      expect(JobManagerService.estimateJobDuration('UNKNOWN_TYPE', {})).toBe(30);
    });
  });

  describe('Error Handling', () => {
    it('should handle retryable errors', async () => {
      const payload = { sku: mockSKU };
      const job = await JobManagerService.createJob('SKU_OPTIMIZATION', payload);
      const jobObj = JobManagerService.jobs.get(job.jobId);

      // Mock retryable error
      const retryableError = new Error('Network error occurred');
      
      await JobManagerService.handleJobError(jobObj, retryableError);

      expect(jobObj.status).toBe('RETRYING');
      expect(jobObj.retryCount).toBe(1);
      expect(jobObj.error.message).toBe('Network error occurred');
    });

    it('should fail job after max retries', async () => {
      const payload = { sku: mockSKU };
      const job = await JobManagerService.createJob('SKU_OPTIMIZATION', payload, { maxRetries: 2 });
      const jobObj = JobManagerService.jobs.get(job.jobId);

      // Simulate multiple failures
      const error = new Error('Persistent error');
      jobObj.retryCount = 2; // Already at max retries

      await JobManagerService.handleJobError(jobObj, error);

      expect(jobObj.status).toBe('FAILED');
      expect(jobObj.progress.stage).toBe('FAILED');
    });

    it('should not retry non-retryable errors', async () => {
      const payload = { sku: mockSKU };
      const job = await JobManagerService.createJob('SKU_OPTIMIZATION', payload);
      const jobObj = JobManagerService.jobs.get(job.jobId);

      // Mock non-retryable error
      const nonRetryableError = new Error('Validation failed');
      
      await JobManagerService.handleJobError(jobObj, nonRetryableError);

      expect(jobObj.status).toBe('FAILED');
      expect(jobObj.retryCount).toBe(0);
    });

    it('should identify retryable errors correctly', () => {
      const networkError = new Error('Network error occurred');
      const dbError = new Error('Database connection failed');
      const serviceError = new Error('Temporary service unavailable');
      const validationError = new Error('Invalid input data');

      expect(JobManagerService.isRetryableError(networkError)).toBe(true);
      expect(JobManagerService.isRetryableError(dbError)).toBe(true);
      expect(JobManagerService.isRetryableError(serviceError)).toBe(true);
      expect(JobManagerService.isRetryableError(validationError)).toBe(false);
    });
  });

  describe('Service Lifecycle', () => {
    it('should start and stop job processor', () => {
      expect(JobManagerService.processingInterval).toBeDefined();
      
      JobManagerService.stop();
      expect(JobManagerService.processingInterval).toBeNull();
      
      JobManagerService.startJobProcessor();
      expect(JobManagerService.processingInterval).toBeDefined();
    });

    it('should generate valid job IDs', () => {
      const jobId1 = JobManagerService.generateJobId();
      const jobId2 = JobManagerService.generateJobId();

      expect(jobId1).toMatch(/^OPT-\d+-\w+$/);
      expect(jobId2).toMatch(/^OPT-\d+-\w+$/);
      expect(jobId1).not.toBe(jobId2);
    });
  });

  describe('Event Emission', () => {
    it('should emit job events', (done) => {
      let eventsReceived = 0;
      const expectedEvents = ['jobCreated', 'jobProgress', 'jobCompleted', 'jobFailed', 'jobCancelled', 'jobRetrying'];
      
      // Listen for any job events
      JobManagerService.on('jobCreated', () => {
        eventsReceived++;
        if (eventsReceived === 1) done(); // Just test one event for now
      });

      // Create a job to trigger event
      JobManagerService.createJob('SKU_OPTIMIZATION', { sku: mockSKU });
    });
  });
});