import { logInfo, logWarn, logError } from '../../services/observability/structuredLogger';

class DataAggregationService {
  constructor() {
    this.aggregatedData = new Map();
    this.aggregationWindows = new Map();
    this.subscribers = new Map();
    this.isRunning = false;
    this.processingQueue = [];
    this.batchSize = 100;
    this.flushInterval = 5000; // 5 seconds
    this.retentionPeriod = 24 * 60 * 60 * 1000; // 24 hours
    this.lastFlush = Date.now();
  }

  // Start the aggregation service
  start() {
    if (this.isRunning) {
      logWarn('Data aggregation service is already running');
      return;
    }

    this.isRunning = true;
    this.flushIntervalId = setInterval(() => {
      this.flushAggregatedData();
    }, this.flushInterval);

    // Cleanup old data every hour
    this.cleanupIntervalId = setInterval(() => {
      this.cleanupOldData();
    }, 60 * 60 * 1000);

    logInfo('Data aggregation service started');
  }

  // Stop the aggregation service
  stop() {
    if (!this.isRunning) return;

    this.isRunning = false;
    
    if (this.flushIntervalId) {
      clearInterval(this.flushIntervalId);
    }
    
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
    }

    // Flush any remaining data
    this.flushAggregatedData();
    
    logInfo('Data aggregation service stopped');
  }

  // Add data point for aggregation
  addDataPoint(streamType, data, timestamp = Date.now()) {
    if (!this.isRunning) {
      this.start();
    }

    try {
      // Add to processing queue
      this.processingQueue.push({
        streamType,
        data,
        timestamp
      });

      // Process queue if it reaches batch size
      if (this.processingQueue.length >= this.batchSize) {
        this.processBatch();
      }

      // Aggregate by different time windows
      this.aggregateByTimeWindows(streamType, data, timestamp);

    } catch (error) {
      logError('Failed to add data point for aggregation', { 
        streamType, 
        error: error.message 
      });
    }
  }

  // Process batch of data points
  processBatch() {
    const batch = this.processingQueue.splice(0, this.batchSize);
    
    try {
      // Group by stream type for efficient processing
      const groupedData = batch.reduce((groups, item) => {
        if (!groups[item.streamType]) {
          groups[item.streamType] = [];
        }
        groups[item.streamType].push(item);
        return groups;
      }, {});

      // Process each stream type
      Object.entries(groupedData).forEach(([streamType, items]) => {
        this.processStreamBatch(streamType, items);
      });

    } catch (error) {
      logError('Failed to process data batch', { error: error.message });
    }
  }

  // Process batch for specific stream type
  processStreamBatch(streamType, items) {
    try {
      const aggregations = this.calculateBatchAggregations(items);
      
      // Store aggregated results
      if (!this.aggregatedData.has(streamType)) {
        this.aggregatedData.set(streamType, {
          summary: {},
          timeSeries: [],
          lastUpdate: Date.now()
        });
      }

      const streamData = this.aggregatedData.get(streamType);
      streamData.summary = { ...streamData.summary, ...aggregations.summary };
      streamData.timeSeries.push(...aggregations.timeSeries);
      streamData.lastUpdate = Date.now();

      // Limit time series data
      if (streamData.timeSeries.length > 1000) {
        streamData.timeSeries = streamData.timeSeries.slice(-1000);
      }

    } catch (error) {
      logError('Failed to process stream batch', { streamType, error: error.message });
    }
  }

  // Calculate aggregations for a batch of items
  calculateBatchAggregations(items) {
    const values = items.map(item => this.extractNumericValues(item.data)).flat();
    const timestamps = items.map(item => item.timestamp);
    
    if (values.length === 0) {
      return { summary: {}, timeSeries: [] };
    }

    const summary = {
      count: values.length,
      sum: values.reduce((a, b) => a + b, 0),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      variance: this.calculateVariance(values),
      trend: this.calculateTrend(values)
    };

    const timeSeries = this.createTimeSeriesPoints(items, summary);

    return { summary, timeSeries };
  }

  // Aggregate data by different time windows (1m, 5m, 1h, 1d)
  aggregateByTimeWindows(streamType, data, timestamp) {
    const windows = [
      { duration: 60 * 1000, label: '1m' },      // 1 minute
      { duration: 5 * 60 * 1000, label: '5m' }, // 5 minutes
      { duration: 60 * 60 * 1000, label: '1h' }, // 1 hour
      { duration: 24 * 60 * 60 * 1000, label: '1d' } // 1 day
    ];

    windows.forEach(window => {
      const windowKey = `${streamType}_${window.label}`;
      const windowStart = Math.floor(timestamp / window.duration) * window.duration;
      
      if (!this.aggregationWindows.has(windowKey)) {
        this.aggregationWindows.set(windowKey, new Map());
      }

      const windowData = this.aggregationWindows.get(windowKey);
      
      if (!windowData.has(windowStart)) {
        windowData.set(windowStart, {
          values: [],
          count: 0,
          sum: 0,
          min: Infinity,
          max: -Infinity
        });
      }

      const bucket = windowData.get(windowStart);
      const numericValues = this.extractNumericValues(data);
      
      numericValues.forEach(value => {
        bucket.values.push(value);
        bucket.count++;
        bucket.sum += value;
        bucket.min = Math.min(bucket.min, value);
        bucket.max = Math.max(bucket.max, value);
      });
    });
  }

  // Extract numeric values from data object
  extractNumericValues(data) {
    const values = [];
    
    const traverse = (obj) => {
      Object.values(obj).forEach(value => {
        if (typeof value === 'number' && !isNaN(value)) {
          values.push(value);
        } else if (typeof value === 'object' && value !== null) {
          traverse(value);
        }
      });
    };
    
    traverse(data);
    return values;
  }

  // Calculate variance
  calculateVariance(values) {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }

  // Calculate trend direction
  calculateTrend(values) {
    if (values.length < 2) return 'stable';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const change = (secondAvg - firstAvg) / firstAvg;
    
    if (Math.abs(change) < 0.05) return 'stable';
    return change > 0 ? 'increasing' : 'decreasing';
  }

  // Create time series data points
  createTimeSeriesPoints(items, summary) {
    const timeGroups = items.reduce((groups, item) => {
      const timeKey = Math.floor(item.timestamp / 60000) * 60000; // 1-minute buckets
      if (!groups[timeKey]) {
        groups[timeKey] = [];
      }
      groups[timeKey].push(item);
      return groups;
    }, {});

    return Object.entries(timeGroups).map(([timestamp, groupItems]) => ({
      timestamp: parseInt(timestamp),
      value: groupItems.reduce((sum, item) => {
        const values = this.extractNumericValues(item.data);
        return sum + (values.reduce((a, b) => a + b, 0) / values.length || 0);
      }, 0) / groupItems.length,
      count: groupItems.length
    }));
  }

  // Flush aggregated data to subscribers
  flushAggregatedData() {
    try {
      const currentTime = Date.now();
      
      // Process any remaining items in queue
      if (this.processingQueue.length > 0) {
        this.processBatch();
      }

      // Notify subscribers with aggregated data
      this.aggregatedData.forEach((data, streamType) => {
        if (this.subscribers.has(streamType)) {
          const callbacks = this.subscribers.get(streamType);
          const aggregatedResult = {
            streamType,
            timestamp: currentTime,
            ...data,
            windowData: this.getWindowData(streamType)
          };

          callbacks.forEach(callback => {
            try {
              callback(aggregatedResult);
            } catch (error) {
              logWarn('Subscriber callback failed', { streamType, error: error.message });
            }
          });
        }
      });

      this.lastFlush = currentTime;

    } catch (error) {
      logError('Failed to flush aggregated data', { error: error.message });
    }
  }

  // Get window aggregation data for a stream type
  getWindowData(streamType) {
    const windowData = {};
    
    ['1m', '5m', '1h', '1d'].forEach(window => {
      const windowKey = `${streamType}_${window}`;
      if (this.aggregationWindows.has(windowKey)) {
        const data = this.aggregationWindows.get(windowKey);
        windowData[window] = Array.from(data.entries()).map(([timestamp, values]) => ({
          timestamp,
          avg: values.count > 0 ? values.sum / values.count : 0,
          min: values.min === Infinity ? 0 : values.min,
          max: values.max === -Infinity ? 0 : values.max,
          count: values.count
        }));
      }
    });
    
    return windowData;
  }

  // Subscribe to aggregated data updates
  subscribe(streamType, callback) {
    if (!this.subscribers.has(streamType)) {
      this.subscribers.set(streamType, new Set());
    }
    
    this.subscribers.get(streamType).add(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(streamType);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscribers.delete(streamType);
        }
      }
    };
  }

  // Clean up old data
  cleanupOldData() {
    try {
      const cutoffTime = Date.now() - this.retentionPeriod;
      
      // Clean aggregated data
      this.aggregatedData.forEach((data, streamType) => {
        data.timeSeries = data.timeSeries.filter(point => point.timestamp > cutoffTime);
      });

      // Clean window data
      this.aggregationWindows.forEach((windowMap) => {
        windowMap.forEach((data, timestamp) => {
          if (timestamp < cutoffTime) {
            windowMap.delete(timestamp);
          }
        });
      });

      logInfo('Cleaned up old aggregated data', { cutoffTime });

    } catch (error) {
      logError('Failed to cleanup old data', { error: error.message });
    }
  }

  // Get current aggregation summary
  getAggregationSummary() {
    return {
      isRunning: this.isRunning,
      streamCount: this.aggregatedData.size,
      queueSize: this.processingQueue.length,
      lastFlush: this.lastFlush,
      subscriberCount: Array.from(this.subscribers.values()).reduce((sum, set) => sum + set.size, 0),
      memoryUsage: this.calculateMemoryUsage()
    };
  }

  // Calculate approximate memory usage
  calculateMemoryUsage() {
    let totalPoints = 0;
    this.aggregatedData.forEach(data => {
      totalPoints += data.timeSeries.length;
    });
    
    this.aggregationWindows.forEach(windowMap => {
      windowMap.forEach(data => {
        totalPoints += data.values.length;
      });
    });
    
    return {
      approximatePoints: totalPoints,
      estimatedMB: (totalPoints * 50) / 1024 / 1024 // Rough estimate
    };
  }

  // Get aggregated data for a specific stream
  getStreamData(streamType, timeRange = '1h') {
    const data = this.aggregatedData.get(streamType);
    if (!data) return null;

    const windowData = this.getWindowData(streamType);
    const rangeData = windowData[timeRange] || [];

    return {
      summary: data.summary,
      timeSeries: rangeData,
      lastUpdate: data.lastUpdate
    };
  }
}

// Create singleton instance
const dataAggregationService = new DataAggregationService();

export default dataAggregationService;
export { DataAggregationService };
