/**
 * Advanced Analytics Engine Test Suite
 * 
 * Comprehensive tests for the AdvancedAnalytics class including:
 * - Real-time data processing
 * - Predictive analytics capabilities
 * - Anomaly detection
 * - Trend analysis
 * - Pattern recognition
 * - Forecasting engine
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AdvancedAnalytics } from '../../../src/utils/analytics.js';

describe('AdvancedAnalytics', () => {
  let advancedAnalytics;
  let mockConfig;

  beforeEach(() => {
    mockConfig = {
      enableRealTimeProcessing: true,
      enablePredictiveAnalytics: true,
      enableAnomalyDetection: true,
      cacheConfig: {
        ttl: 3600,
        maxSize: 1000
      },
      mlModels: {
        anomalyDetection: { threshold: 0.95 },
        forecasting: { horizon: 12 },
        trendAnalysis: { minDataPoints: 10 }
      }
    };

    advancedAnalytics = new AdvancedAnalytics(mockConfig);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default configuration', () => {
      const analytics = new AdvancedAnalytics();
      expect(analytics).toBeDefined();
      expect(analytics.config).toBeDefined();
    });

    it('should initialize with custom configuration', () => {
      expect(advancedAnalytics.config).toEqual(expect.objectContaining(mockConfig));
    });

    it('should initialize all required engines', () => {
      expect(advancedAnalytics.trendAnalyzer).toBeDefined();
      expect(advancedAnalytics.patternRecognizer).toBeDefined();
      expect(advancedAnalytics.forecastEngine).toBeDefined();
      expect(advancedAnalytics.correlationAnalyzer).toBeDefined();
      expect(advancedAnalytics.anomalyEngine).toBeDefined();
    });
  });

  describe('runComprehensiveAnalysis', () => {
    it('should analyze manufacturing data successfully', async () => {
      const mockData = [
        { timestamp: '2024-01-01', revenue: 10000, orders: 50, efficiency: 0.85 },
        { timestamp: '2024-01-02', revenue: 12000, orders: 60, efficiency: 0.88 },
        { timestamp: '2024-01-03', revenue: 11000, orders: 55, efficiency: 0.82 }
      ];

      const options = {
        analysisId: 'test-analysis-001',
        timeframe: '3d',
        includeAnomalies: true,
        includeTrends: true,
        includeForecasts: true
      };

      const result = await advancedAnalytics.runComprehensiveAnalysis(mockData, options);

      expect(result).toBeDefined();
      expect(result.analysisId).toBe('test-analysis-001');
      expect(result.summary).toBeDefined();
      expect(result.trends).toBeDefined();
      expect(result.anomalies).toBeDefined();
      expect(result.patterns).toBeDefined();
      expect(result.forecasts).toBeDefined();
      expect(result.insights).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should handle empty data gracefully', async () => {
      const result = await advancedAnalytics.runComprehensiveAnalysis([]);
      
      expect(result).toBeDefined();
      expect(result.summary.dataPoints).toBe(0);
      expect(result.trends).toEqual([]);
      expect(result.anomalies).toEqual([]);
    });

    it('should include correlation analysis when enabled', async () => {
      const mockData = Array.from({ length: 30 }, (_, i) => ({
        timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        revenue: Math.floor(Math.random() * 50000) + 10000,
        orders: Math.floor(Math.random() * 100) + 20,
        efficiency: Math.random() * 0.3 + 0.7
      }));

      const options = { includeCorrelations: true };
      const result = await advancedAnalytics.runComprehensiveAnalysis(mockData, options);

      expect(result.correlations).toBeDefined();
      expect(Array.isArray(result.correlations)).toBe(true);
    });
  });

  describe('generateForecast', () => {
    it('should generate accurate forecasts', async () => {
      const historicalData = Array.from({ length: 50 }, (_, i) => ({
        timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        value: 1000 + Math.sin(i * 0.1) * 200 + Math.random() * 100
      }));

      const options = {
        metric: 'revenue',
        horizon: 10,
        modelType: 'arima',
        includeConfidenceIntervals: true
      };

      const forecast = await advancedAnalytics.generateForecast(historicalData, options);

      expect(forecast).toBeDefined();
      expect(forecast.predictions).toBeDefined();
      expect(forecast.predictions.length).toBe(10);
      expect(forecast.confidence).toBeGreaterThan(0);
      expect(forecast.accuracy).toBeGreaterThan(0);
      expect(forecast.modelMetrics).toBeDefined();
    });

    it('should handle insufficient data for forecasting', async () => {
      const insufficientData = [
        { timestamp: '2024-01-01', value: 100 },
        { timestamp: '2024-01-02', value: 110 }
      ];

      const forecast = await advancedAnalytics.generateForecast(insufficientData, {
        metric: 'revenue',
        horizon: 5
      });

      expect(forecast.warnings).toBeDefined();
      expect(forecast.warnings).toContain('Insufficient data for reliable forecasting');
    });

    it('should support different forecasting models', async () => {
      const data = Array.from({ length: 30 }, (_, i) => ({
        timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        value: 1000 + i * 10 + Math.random() * 50
      }));

      const models = ['arima', 'lstm', 'prophet', 'linear'];
      
      for (const model of models) {
        const forecast = await advancedAnalytics.generateForecast(data, {
          metric: 'revenue',
          modelType: model,
          horizon: 5
        });
        
        expect(forecast.modelType).toBe(model);
        expect(forecast.predictions).toBeDefined();
      }
    });
  });

  describe('generateInsights', () => {
    it('should generate actionable insights', async () => {
      const mockData = Array.from({ length: 30 }, (_, i) => ({
        timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        revenue: Math.floor(Math.random() * 50000) + 10000,
        orders: Math.floor(Math.random() * 100) + 20,
        efficiency: Math.random() * 0.3 + 0.7,
        costs: Math.floor(Math.random() * 30000) + 5000
      }));

      const options = {
        category: 'comprehensive',
        priority: 'high',
        includeRecommendations: true
      };

      const insights = await advancedAnalytics.generateInsights(mockData, options);

      expect(Array.isArray(insights)).toBe(true);
      expect(insights.length).toBeGreaterThan(0);
      
      insights.forEach(insight => {
        expect(insight.id).toBeDefined();
        expect(insight.type).toBeDefined();
        expect(insight.priority).toBeDefined();
        expect(insight.description).toBeDefined();
        expect(insight.impact).toBeDefined();
        expect(insight.confidence).toBeGreaterThan(0);
        expect(typeof insight.actionable).toBe('boolean');
      });
    });

    it('should filter insights by priority', async () => {
      const mockData = Array.from({ length: 20 }, (_, i) => ({
        timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        revenue: Math.floor(Math.random() * 50000) + 10000
      }));

      const highPriorityInsights = await advancedAnalytics.generateInsights(mockData, {
        priority: 'high'
      });

      const allInsights = await advancedAnalytics.generateInsights(mockData, {
        priority: 'all'
      });

      expect(highPriorityInsights.length).toBeLessThanOrEqual(allInsights.length);
      
      highPriorityInsights.forEach(insight => {
        expect(['high', 'critical']).toContain(insight.priority);
      });
    });
  });

  describe('real-time processing', () => {
    it('should process streaming data', async () => {
      const mockStreamData = {
        timestamp: new Date().toISOString(),
        revenue: 15000,
        orders: 75,
        efficiency: 0.91
      };

      const result = await advancedAnalytics.processRealtimeData(mockStreamData);

      expect(result).toBeDefined();
      expect(result.processed).toBe(true);
      expect(result.timestamp).toBeDefined();
      expect(result.anomalies).toBeDefined();
      expect(result.alerts).toBeDefined();
    });

    it('should detect anomalies in real-time', async () => {
      // Establish baseline with normal data
      const normalData = Array.from({ length: 10 }, () => ({
        timestamp: new Date().toISOString(),
        revenue: 10000 + Math.random() * 2000,
        efficiency: 0.85 + Math.random() * 0.1
      }));

      for (const data of normalData) {
        await advancedAnalytics.processRealtimeData(data);
      }

      // Send anomalous data
      const anomalousData = {
        timestamp: new Date().toISOString(),
        revenue: 50000, // Significantly higher than baseline
        efficiency: 0.95
      };

      const result = await advancedAnalytics.processRealtimeData(anomalousData);

      expect(result.anomalies.length).toBeGreaterThan(0);
      expect(result.anomalies[0].metric).toBe('revenue');
      expect(result.anomalies[0].severity).toBeDefined();
    });
  });

  describe('pattern recognition', () => {
    it('should identify seasonal patterns', async () => {
      // Create data with clear seasonal pattern
      const seasonalData = Array.from({ length: 365 }, (_, i) => {
        const dayOfYear = i % 365;
        const seasonalFactor = Math.sin((dayOfYear / 365) * 2 * Math.PI) * 5000;
        return {
          timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
          revenue: 20000 + seasonalFactor + Math.random() * 1000
        };
      });

      const patterns = await advancedAnalytics.identifyPatterns(seasonalData, {
        patternTypes: ['seasonal', 'cyclical', 'trend']
      });

      expect(patterns).toBeDefined();
      expect(patterns.seasonal).toBeDefined();
      expect(patterns.seasonal.detected).toBe(true);
      expect(patterns.seasonal.confidence).toBeGreaterThan(0.7);
    });

    it('should detect trend patterns', async () => {
      // Create data with clear upward trend
      const trendData = Array.from({ length: 50 }, (_, i) => ({
        timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        revenue: 10000 + (i * 100) + Math.random() * 500
      }));

      const patterns = await advancedAnalytics.identifyPatterns(trendData, {
        patternTypes: ['trend']
      });

      expect(patterns.trend).toBeDefined();
      expect(patterns.trend.direction).toBe('upward');
      expect(patterns.trend.strength).toBeGreaterThan(0.5);
    });
  });

  describe('performance optimization', () => {
    it('should cache analysis results', async () => {
      const mockData = [
        { timestamp: '2024-01-01', revenue: 10000 },
        { timestamp: '2024-01-02', revenue: 12000 }
      ];

      const options = { analysisId: 'cache-test', timeframe: '2d' };

      // First analysis should cache results
      const result1 = await advancedAnalytics.runComprehensiveAnalysis(mockData, options);
      
      // Second analysis should use cached results
      const result2 = await advancedAnalytics.runComprehensiveAnalysis(mockData, options);

      expect(result1.analysisId).toBe(result2.analysisId);
      expect(result2.fromCache).toBe(true);
    });

    it('should handle memory efficiently for large datasets', async () => {
      const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
        timestamp: new Date(Date.now() - i * 60 * 1000).toISOString(),
        revenue: Math.floor(Math.random() * 50000) + 10000,
        orders: Math.floor(Math.random() * 100) + 20,
        efficiency: Math.random() * 0.3 + 0.7
      }));

      const startMemory = process.memoryUsage().heapUsed;
      
      const result = await advancedAnalytics.runComprehensiveAnalysis(largeDataset, {
        optimizeMemory: true
      });

      const endMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (endMemory - startMemory) / 1024 / 1024; // MB

      expect(result).toBeDefined();
      expect(memoryIncrease).toBeLessThan(100); // Should not increase memory by more than 100MB
    });
  });

  describe('error handling', () => {
    it('should handle malformed data gracefully', async () => {
      const malformedData = [
        { invalid: 'data' },
        { timestamp: 'invalid-date', revenue: 'not-a-number' },
        null,
        undefined
      ];

      const result = await advancedAnalytics.runComprehensiveAnalysis(malformedData);

      expect(result).toBeDefined();
      expect(result.errors).toBeDefined();
      expect(result.validDataPoints).toBe(0);
      expect(result.skippedDataPoints).toBeGreaterThan(0);
    });

    it('should validate input parameters', async () => {
      const validData = [
        { timestamp: '2024-01-01', revenue: 10000 }
      ];

      await expect(advancedAnalytics.runComprehensiveAnalysis(validData, {
        timeframe: 'invalid-timeframe'
      })).rejects.toThrow('Invalid timeframe parameter');

      await expect(advancedAnalytics.generateForecast(validData, {
        horizon: -5
      })).rejects.toThrow('Forecast horizon must be positive');
    });

    it('should handle API timeouts gracefully', async () => {
      // Mock network timeout
      vi.spyOn(advancedAnalytics, 'fetchExternalData').mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 100);
        });
      });

      const data = [{ timestamp: '2024-01-01', revenue: 10000 }];
      
      const result = await advancedAnalytics.runComprehensiveAnalysis(data, {
        includeExternalData: true,
        timeout: 50
      });

      expect(result.warnings).toContain('External data fetch timeout');
      expect(result.summary).toBeDefined(); // Should still return basic analysis
    });
  });

  describe('integration with caching system', () => {
    it('should integrate with multi-level cache', async () => {
      const mockData = [
        { timestamp: '2024-01-01', revenue: 10000 },
        { timestamp: '2024-01-02', revenue: 12000 }
      ];

      const cacheKey = 'analytics-test-cache';
      
      // Test cache miss
      const result1 = await advancedAnalytics.runComprehensiveAnalysis(mockData, {
        cacheKey,
        enableCaching: true
      });

      expect(result1.fromCache).toBe(false);

      // Test cache hit
      const result2 = await advancedAnalytics.runComprehensiveAnalysis(mockData, {
        cacheKey,
        enableCaching: true
      });

      expect(result2.fromCache).toBe(true);
      expect(result1.analysisId).toBe(result2.analysisId);
    });
  });

  describe('event emission', () => {
    it('should emit analytics events', (done) => {
      const mockData = [
        { timestamp: '2024-01-01', revenue: 10000 }
      ];

      let eventsReceived = 0;
      const expectedEvents = ['analysis-started', 'analysis-completed'];

      expectedEvents.forEach(eventType => {
        advancedAnalytics.on(eventType, (data) => {
          expect(data).toBeDefined();
          eventsReceived++;
          
          if (eventsReceived === expectedEvents.length) {
            done();
          }
        });
      });

      advancedAnalytics.runComprehensiveAnalysis(mockData, {
        analysisId: 'event-test'
      });
    });

    it('should emit anomaly detection events', (done) => {
      advancedAnalytics.on('anomaly-detected', (anomaly) => {
        expect(anomaly.metric).toBeDefined();
        expect(anomaly.severity).toBeDefined();
        expect(anomaly.timestamp).toBeDefined();
        done();
      });

      const anomalousData = {
        timestamp: new Date().toISOString(),
        revenue: 1000000 // Extremely high value
      };

      advancedAnalytics.processRealtimeData(anomalousData);
    });
  });
});