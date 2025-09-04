import { jest } from '@jest/globals';
import ForecastingService from '../../services/forecasting/ForecastingService.js';

describe('ForecastingService', () => {
  let forecastingService;

  beforeEach(() => {
    forecastingService = new ForecastingService({
      backtestFolds: 3,
      minTrainingDays: 30,
      cacheMaxSize: 10
    });
  });

  afterEach(() => {
    if (forecastingService) {
      forecastingService.destroy();
    }
  });

  describe('Constructor', () => {
    test('should initialize with default configuration', () => {
      const service = new ForecastingService();
      expect(service.config.backtestFolds).toBe(5);
      expect(service.config.minTrainingDays).toBe(90);
      expect(service.models).toBeDefined();
      expect(service.cache).toBeDefined();
      expect(service.batchProcessor).toBeDefined();
      service.destroy();
    });

    test('should initialize with custom configuration', () => {
      expect(forecastingService.config.backtestFolds).toBe(3);
      expect(forecastingService.config.minTrainingDays).toBe(30);
    });
  });

  describe('generateForecast', () => {
    const mockRequest = {
      series_filter: { series_ids: ['test-series-1', 'test-series-2'] },
      horizon: 30,
      models: ['Ensemble'],
      currency_mode: 'local'
    };

    test('should generate forecast job with valid request', async () => {
      const result = await forecastingService.generateForecast(mockRequest);
      
      expect(result.jobId).toBeDefined();
      expect(result.status).toBe('QUEUED');
    });

    test('should use provided idempotent key', async () => {
      const idempotentKey = 'test-idempotent-key';
      const result = await forecastingService.generateForecast(mockRequest, idempotentKey);
      
      expect(result.jobId).toBe(idempotentKey);
      expect(result.status).toBe('QUEUED');
    });

    test('should return existing job for duplicate idempotent key', async () => {
      const idempotentKey = 'test-duplicate-key';
      const result1 = await forecastingService.generateForecast(mockRequest, idempotentKey);
      const result2 = await forecastingService.generateForecast(mockRequest, idempotentKey);
      
      expect(result1.jobId).toBe(result2.jobId);
      expect(result2.status).toBeDefined();
    });
  });

  describe('forecastSeries', () => {
    test('should generate forecast for valid series', async () => {
      const result = await forecastingService.forecastSeries('test-series', 30, ['SMA']);
      
      expect(result.seriesId).toBe('test-series');
      expect(result.forecasts).toBeDefined();
      expect(result.forecasts.SMA).toBeDefined();
      expect(Array.isArray(result.forecasts.SMA)).toBe(true);
      expect(result.forecasts.SMA.length).toBe(30);
    });

    test('should throw error for insufficient data', async () => {
      // Mock loadTimeSeriesData to return insufficient data
      jest.spyOn(forecastingService, 'loadTimeSeriesData').mockResolvedValue(
        Array.from({ length: 20 }, (_, i) => ({ date: `2024-01-${i + 1}`, value: i + 1 }))
      );

      await expect(
        forecastingService.forecastSeries('test-series', 30)
      ).rejects.toThrow('Insufficient data');
    });

    test('should use cache for repeated requests', async () => {
      const result1 = await forecastingService.forecastSeries('test-series', 30);
      const result2 = await forecastingService.forecastSeries('test-series', 30);
      
      expect(result1).toEqual(result2);
    });

    test('should apply regional adjustments when specified', async () => {
      const options = {
        region: 'UK',
        applyRegionalAdjustments: true
      };
      
      const result = await forecastingService.forecastSeries('test-series', 30, ['Ensemble'], options);
      
      expect(result.metadata.region).toBe('UK');
      expect(result.metadata.regionalAdjustments).toBeDefined();
      expect(result.metadata.calendarInsights).toBeDefined();
    });

    test('should apply FX conversion when specified', async () => {
      const options = {
        currencyMode: 'converted',
        baseCurrency: 'GBP',
        targetCurrency: 'USD'
      };
      
      const result = await forecastingService.forecastSeries('test-series', 30, ['Ensemble'], options);
      
      expect(result.metadata.fxConversion).toBeDefined();
      expect(result.metadata.fxConversion.fromCurrency).toBe('GBP');
      expect(result.metadata.fxConversion.toCurrency).toBe('USD');
      expect(result.metadata.fxInsights).toBeDefined();
    });
  });

  describe('performRollingBacktest', () => {
    const mockTimeSeries = Array.from({ length: 100 }, (_, i) => ({
      date: new Date(Date.now() - (100 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      value: 50 + Math.sin(i * 0.1) * 10 + Math.random() * 5
    }));

    test('should generate backtest folds', async () => {
      const result = await forecastingService.performRollingBacktest(mockTimeSeries, 30);
      
      expect(result.folds).toBeDefined();
      expect(result.folds.length).toBeGreaterThan(0);
      expect(result.modelResults).toBeDefined();
      
      // Check fold structure
      const fold = result.folds[0];
      expect(fold.foldNumber).toBeDefined();
      expect(fold.trainStart).toBeDefined();
      expect(fold.trainEnd).toBeDefined();
      expect(fold.testStart).toBeDefined();
      expect(fold.testEnd).toBeDefined();
    });

    test('should calculate metrics for all models', async () => {
      const result = await forecastingService.performRollingBacktest(mockTimeSeries, 30);
      
      const modelNames = Object.keys(result.modelResults);
      expect(modelNames.length).toBeGreaterThan(0);
      
      modelNames.forEach(modelName => {
        const modelResult = result.modelResults[modelName];
        if (modelResult.metrics.mape) {
          expect(typeof modelResult.metrics.mape).toBe('number');
          expect(modelResult.metrics.mape).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('calculateEnsembleWeights', () => {
    test('should calculate inverse MAPE weights', () => {
      const mockBacktestResults = {
        modelResults: {
          SMA: { metrics: { mape: 20 } },
          HoltWinters: { metrics: { mape: 15 } },
          ARIMA: { metrics: { mape: 25 } }
        }
      };

      const weights = forecastingService.calculateEnsembleWeights(mockBacktestResults);
      
      expect(weights.HoltWinters).toBeGreaterThan(weights.SMA);
      expect(weights.SMA).toBeGreaterThan(weights.ARIMA);
      
      // Weights should sum to approximately 1
      const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
      expect(Math.abs(totalWeight - 1.0)).toBeLessThan(0.01);
    });

    test('should handle missing metrics gracefully', () => {
      const mockBacktestResults = {
        modelResults: {
          SMA: { metrics: {} },
          HoltWinters: { metrics: { mape: 15 } }
        }
      };

      const weights = forecastingService.calculateEnsembleWeights(mockBacktestResults);
      
      expect(weights.SMA).toBeDefined();
      expect(weights.HoltWinters).toBeDefined();
      expect(weights.HoltWinters).toBeGreaterThan(weights.SMA);
    });
  });

  describe('Job Management', () => {
    test('should track job status', async () => {
      const request = {
        series_filter: { series_ids: ['test-series'] },
        horizon: 30
      };

      const { jobId } = await forecastingService.generateForecast(request);
      const status = forecastingService.getJobStatus(jobId);
      
      expect(status).toBeDefined();
      expect(status.id).toBe(jobId);
      expect(['QUEUED', 'RUNNING', 'COMPLETED', 'FAILED']).toContain(status.status);
    });

    test('should cancel jobs', async () => {
      const request = {
        series_filter: { series_ids: ['test-series'] },
        horizon: 30
      };

      const { jobId } = await forecastingService.generateForecast(request);
      const cancelled = forecastingService.cancelJob(jobId);
      
      expect(cancelled).toBe(true);
      
      const status = forecastingService.getJobStatus(jobId);
      expect(status.status).toBe('CANCELLED');
    });

    test('should return false for non-existent job cancellation', () => {
      const cancelled = forecastingService.cancelJob('non-existent-job');
      expect(cancelled).toBe(false);
    });
  });

  describe('FX and Regional Methods', () => {
    test('should get FX rate', async () => {
      const rate = await forecastingService.getFXRate('GBP', 'USD');
      
      expect(typeof rate).toBe('number');
      expect(rate).toBeGreaterThan(0);
    });

    test('should return 1.0 for same currency', async () => {
      const rate = await forecastingService.getFXRate('GBP', 'GBP');
      expect(rate).toBe(1.0);
    });

    test('should generate FX scenarios', async () => {
      const scenarios = await forecastingService.generateFXScenarios(
        'GBP', 
        ['USD', 'EUR'], 
        ['base', 'stress_up']
      );
      
      expect(scenarios.base).toBeDefined();
      expect(scenarios.stress_up).toBeDefined();
      expect(scenarios.base.USD).toBeGreaterThan(0);
      expect(scenarios.base.EUR).toBeGreaterThan(0);
    });

    test('should get regional events', () => {
      const events = forecastingService.getRegionalEvents(
        'UK',
        '2024-01-01',
        '2024-12-31'
      );
      
      expect(Array.isArray(events)).toBe(true);
      if (events.length > 0) {
        expect(events[0].name).toBeDefined();
        expect(events[0].impact).toBeDefined();
      }
    });

    test('should get supported regions', () => {
      const regions = forecastingService.getSupportedRegions();
      
      expect(Array.isArray(regions)).toBe(true);
      expect(regions).toContain('UK');
      expect(regions).toContain('EU');
      expect(regions).toContain('USA');
    });

    test('should get supported currencies', () => {
      const currencies = forecastingService.getSupportedCurrencies();
      
      expect(Array.isArray(currencies)).toBe(true);
      expect(currencies).toContain('GBP');
      expect(currencies).toContain('EUR');
      expect(currencies).toContain('USD');
    });
  });

  describe('Bulk Processing', () => {
    test('should process multiple series in bulk', async () => {
      const seriesIds = ['series-1', 'series-2', 'series-3'];
      const results = await forecastingService.forecastBulk(seriesIds, 30);
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(seriesIds.length);
      
      results.forEach((result, index) => {
        expect(result.seriesId).toBe(seriesIds[index]);
        expect(result.forecasts).toBeDefined();
      });
    });
  });

  describe('Cache Management', () => {
    test('should provide cache statistics', () => {
      const stats = forecastingService.getCacheStats();
      
      expect(stats.entries).toBeDefined();
      expect(stats.maxSize).toBeDefined();
      expect(typeof stats.entries).toBe('number');
    });

    test('should clear cache', () => {
      forecastingService.clearCache();
      const stats = forecastingService.getCacheStats();
      
      expect(stats.entries).toBe(0);
    });

    test('should invalidate cache by pattern', async () => {
      // Generate some cached data
      await forecastingService.forecastSeries('test-series-1', 30);
      await forecastingService.forecastSeries('test-series-2', 30);
      
      const invalidatedCount = forecastingService.invalidateCachePattern('test-series-1');
      expect(invalidatedCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance Metrics', () => {
    test('should provide performance metrics', () => {
      const metrics = forecastingService.getPerformanceMetrics();
      
      expect(metrics.cache).toBeDefined();
      expect(metrics.batch).toBeDefined();
      expect(metrics.activeJobs).toBeDefined();
      expect(typeof metrics.activeJobs).toBe('number');
    });
  });

  describe('Scenario Analysis', () => {
    test('should generate comprehensive scenario analysis', async () => {
      const analysis = await forecastingService.generateScenarioAnalysis('test-series', {
        regions: ['UK', 'USA'],
        targetCurrency: 'USD'
      });
      
      expect(analysis.seriesId).toBe('test-series');
      expect(analysis.scenarios).toBeDefined();
      expect(analysis.scenarios.UK).toBeDefined();
      expect(analysis.scenarios.USA).toBeDefined();
      expect(analysis.analysisMetadata).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid series ID gracefully', async () => {
      // Mock loadTimeSeriesData to throw error
      jest.spyOn(forecastingService, 'loadTimeSeriesData').mockRejectedValue(
        new Error('Series not found')
      );

      await expect(
        forecastingService.forecastSeries('invalid-series', 30)
      ).rejects.toThrow('Series not found');
    });
  });
});