import EventEmitter from 'events';
import { logDebug, logInfo, logWarn, logError } from '../../src/utils/logger';


class BatchProcessor extends EventEmitter {
  constructor(options = {}) {
    super();
    this.config = {
      maxBatchSize: options.maxBatchSize || 50,
      batchTimeout: options.batchTimeout || 5000,
      maxConcurrency: options.maxConcurrency || 3,
      retryAttempts: options.retryAttempts || 2,
      retryDelay: options.retryDelay || 1000
    };
    
    this.pendingRequests = new Map();
    this.processingQueue = [];
    this.activeBatches = new Set();
    this.batchCounter = 0;
  }

  // Add request to batch processing queue
  async addRequest(requestId, processor, data, priority = 0) {
    return new Promise(_(resolve, _reject) => {
      const request = {
        id: requestId,
        processor,
        data,
        priority,
        resolve,
        reject,
        attempts: 0,
        createdAt: Date.now()
      };

      this.pendingRequests.set(requestId, request);
      this.processingQueue.push(request);
      
      // Sort by priority (higher first)
      this.processingQueue.sort((a, b) => b.priority - a.priority);
      
      // Try to process immediately if under concurrency limit
      this.processNextBatch();
    });
  }

  // Process the next batch if possible
  async processNextBatch() {
    if (this.activeBatches.size >= this.config.maxConcurrency || this.processingQueue.length === 0) {
      return;
    }

    const batchId = `batch_${++this.batchCounter}`;
    const batch = this.createBatch(batchId);
    
    if (batch.requests.length === 0) {
      return;
    }

    this.activeBatches.add(batchId);
    this.emit('batchStarted', { batchId, requestCount: batch.requests.length });

    try {
      await this.processBatch(batch);
    } catch (error) {
      logError(`Batch ${batchId} processing failed:`, error);
      this.handleBatchError(batch, error);
    } finally {
      this.activeBatches.delete(batchId);
      this.emit('batchCompleted', { batchId });
      
      // Process next batch if more requests pending
      if (this.processingQueue.length > 0) {
        setImmediate(() => this.processNextBatch());
      }
    }
  }

  // Create a batch from pending requests
  createBatch(batchId) {
    const batch = {
      id: batchId,
      requests: [],
      createdAt: Date.now()
    };

    // Group requests by processor type for efficiency
    const processorGroups = new Map();
    
    // Take up to maxBatchSize requests
    while (batch.requests.length < this.config.maxBatchSize && this.processingQueue.length > 0) {
      const request = this.processingQueue.shift();
      batch.requests.push(request);
      
      // Group by processor for batch optimization
      const processorKey = request.processor.name || 'default';
      if (!processorGroups.has(processorKey)) {
        processorGroups.set(processorKey, []);
      }
      processorGroups.get(processorKey).push(request);
    }

    batch.processorGroups = processorGroups;
    return batch;
  }

  // Process a batch of requests
  async processBatch(batch) {
    const results = new Map();
    
    // Process each processor group in parallel
    const groupPromises = Array.from(batch.processorGroups.entries()).map(
      async _([processorKey, _requests]) => {
        return this.processProcessorGroup(processorKey, requests, results);
      }
    );

    await Promise.all(groupPromises);
    
    // Resolve all requests in batch
    batch.requests.forEach(request => {
      const result = results.get(request.id);
      if (result && !result.error) {
        request.resolve(result.data);
        this.pendingRequests.delete(request.id);
      } else if (result && result.error) {
        this.handleRequestError(request, result.error);
      } else {
        this.handleRequestError(request, new Error('No result returned'));
      }
    });
  }

  // Process a group of requests with the same processor
  async processProcessorGroup(processorKey, requests, results) {
    try {
      // Check if processor supports batch processing
      const firstRequest = requests[0];
      const processor = firstRequest.processor;
      
      if (processor.processBatch && requests.length > 1) {
        // Use batch processing
        const batchData = requests.map(req => ({
          id: req.id,
          data: req.data
        }));
        
        const batchResults = await processor.processBatch(batchData);
        
        // Map results back to individual requests
        batchResults.forEach(result => {
          results.set(result.id, result);
        });
        
        this.emit('processorBatchProcessed', {
          processorKey,
          requestCount: requests.length,
          batchMode: true
        });
        
      } else {
        // Process individually in parallel
        const promises = requests.map(async request => {
          try {
            const data = await processor.process(request.data);
            results.set(request.id, { data });
          } catch (error) {
            results.set(request.id, { error });
          }
        });
        
        await Promise.all(promises);
        
        this.emit('processorBatchProcessed', {
          processorKey,
          requestCount: requests.length,
          batchMode: false
        });
      }
      
    } catch (error) {
      // Mark all requests in group as failed
      requests.forEach(request => {
        results.set(request.id, { error });
      });
    }
  }

  // Handle batch processing error
  handleBatchError(batch, error) {
    batch.requests.forEach(request => {
      this.handleRequestError(request, error);
    });
  }

  // Handle individual request error with retry logic
  async handleRequestError(request, error) {
    request.attempts++;
    
    if (request.attempts < this.config.retryAttempts) {
      // Retry with exponential backoff
      const delay = this.config.retryDelay * Math.pow(2, request.attempts - 1);
      
      setTimeout(() => {
        this.processingQueue.unshift(request); // Add to front for retry
        this.processNextBatch();
      }, delay);
      
      this.emit('requestRetry', {
        requestId: request.id,
        attempt: request.attempts,
        delay
      });
      
    } else {
      // Max retries exceeded
      request.reject(error);
      this.pendingRequests.delete(request.id);
      
      this.emit('requestFailed', {
        requestId: request.id,
        finalError: error,
        attempts: request.attempts
      });
    }
  }

  // Get batch processor statistics
  getStats() {
    return {
      pendingRequests: this.pendingRequests.size,
      queuedRequests: this.processingQueue.length,
      activeBatches: this.activeBatches.size,
      maxConcurrency: this.config.maxConcurrency,
      config: { ...this.config }
    };
  }

  // Cancel a pending request
  cancelRequest(requestId) {
    const request = this.pendingRequests.get(requestId);
    if (request) {
      // Remove from queue if not yet processing
      const queueIndex = this.processingQueue.findIndex(req => req.id === requestId);
      if (queueIndex !== -1) {
        this.processingQueue.splice(queueIndex, 1);
      }
      
      request.reject(new Error('Request cancelled'));
      this.pendingRequests.delete(requestId);
      
      this.emit('requestCancelled', { requestId });
      return true;
    }
    return false;
  }

  // Clear all pending requests
  clearQueue() {
    const cancelledCount = this.pendingRequests.size;
    
    // Reject all pending requests
    this.pendingRequests.forEach(request => {
      request.reject(new Error('Queue cleared'));
    });
    
    this.pendingRequests.clear();
    this.processingQueue.length = 0;
    
    this.emit('queueCleared', { cancelledCount });
    return cancelledCount;
  }

  // Wait for all pending requests to complete
  async drain() {
    return new Promise(_(resolve) => {
      const checkEmpty = () => {
        if (this.pendingRequests.size === 0 && this.activeBatches.size === 0) {
          resolve();
        } else {
          setTimeout(checkEmpty, 100);
        }
      };
      checkEmpty();
    });
  }

  // Adjust batch processing parameters at runtime
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', this.config);
  }
}

export default BatchProcessor;