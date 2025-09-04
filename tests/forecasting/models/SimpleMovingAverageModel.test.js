import SimpleMovingAverageModel from '../../../services/forecasting/models/SimpleMovingAverageModel.js';

describe('SimpleMovingAverageModel', () => {
  let model;

  beforeEach(() => {
    model = new SimpleMovingAverageModel({ windowSize: 7 });
  });

  const generateTimeSeries = (length, trend = 0, noise = 0.1) => {
    return Array.from({ length }, (_, i) => ({
      date: new Date(Date.now() - (length - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      value: 100 + i * trend + (Math.random() - 0.5) * noise
    }));
  };

  describe('Constructor', () => {
    test('should initialize with default window size', () => {
      const defaultModel = new SimpleMovingAverageModel();
      expect(defaultModel.windowSize).toBe(14);
    });

    test('should initialize with custom window size', () => {
      expect(model.windowSize).toBe(7);
    });
  });

  describe('fit', () => {
    test('should fit model with valid time series data', async () => {
      const timeSeries = generateTimeSeries(20);
      
      await model.fit(timeSeries);
      
      expect(model.fitted).toBe(true);
      expect(model.timeSeries).toBeDefined();
      expect(model.timeSeries.length).toBe(20);
    });

    test('should handle string values by parsing to float', async () => {
      const timeSeries = [
        { date: '2024-01-01', value: '100.5' },
        { date: '2024-01-02', value: '101.2' },
        { date: '2024-01-03', value: '99.8' }
      ];
      
      await model.fit(timeSeries);
      
      expect(model.fitted).toBe(true);
      expect(typeof model.timeSeries[0].value).toBe('number');
      expect(model.timeSeries[0].value).toBe(100.5);
    });

    test('should preserve original dates', async () => {
      const timeSeries = generateTimeSeries(10);
      const originalDates = timeSeries.map(point => point.date);
      
      await model.fit(timeSeries);
      
      const fittedDates = model.timeSeries.map(point => point.date);
      expect(fittedDates).toEqual(originalDates);
    });
  });

  describe('forecast', () => {
    test('should throw error if model not fitted', async () => {
      await expect(model.forecast(5)).rejects.toThrow('Model must be fitted before forecasting');
    });

    test('should generate constant forecast equal to moving average', async () => {
      const timeSeries = [
        { date: '2024-01-01', value: 100 },
        { date: '2024-01-02', value: 102 },
        { date: '2024-01-03', value: 104 },
        { date: '2024-01-04', value: 106 },
        { date: '2024-01-05', value: 108 },
        { date: '2024-01-06', value: 110 },
        { date: '2024-01-07', value: 112 },
        { date: '2024-01-08', value: 114 }
      ];
      
      await model.fit(timeSeries);
      const forecast = await model.forecast(5);
      
      expect(Array.isArray(forecast)).toBe(true);
      expect(forecast.length).toBe(5);
      
      // All forecast values should be the same (simple moving average)
      const expectedValue = (108 + 110 + 112 + 114 + 106 + 104 + 102) / 7;
      forecast.forEach(value => {
        expect(Math.abs(value - expectedValue)).toBeLessThan(0.001);
      });
    });

    test('should use correct window size for moving average calculation', async () => {
      const model3 = new SimpleMovingAverageModel({ windowSize: 3 });
      const timeSeries = [
        { date: '2024-01-01', value: 10 },
        { date: '2024-01-02', value: 20 },
        { date: '2024-01-03', value: 30 },
        { date: '2024-01-04', value: 40 }
      ];
      
      await model3.fit(timeSeries);
      const forecast = await model3.forecast(1);
      
      // Should use last 3 values: (20 + 30 + 40) / 3 = 30
      expect(Math.abs(forecast[0] - 30)).toBeLessThan(0.001);
    });

    test('should handle window size larger than data', async () => {
      const largeWindowModel = new SimpleMovingAverageModel({ windowSize: 10 });
      const timeSeries = generateTimeSeries(5);
      
      await largeWindowModel.fit(timeSeries);
      const forecast = await largeWindowModel.forecast(3);
      
      expect(Array.isArray(forecast)).toBe(true);
      expect(forecast.length).toBe(3);
      
      // Should use all available data points
      const expectedValue = timeSeries.reduce((sum, point) => sum + point.value, 0) / timeSeries.length;
      forecast.forEach(value => {
        expect(Math.abs(value - expectedValue)).toBeLessThan(0.1);
      });
    });
  });

  describe('getParameters', () => {
    test('should return model parameters', () => {
      const params = model.getParameters();
      
      expect(params.windowSize).toBe(7);
      expect(params.type).toBe('SimpleMovingAverage');
    });
  });

  describe('Integration Tests', () => {
    test('should work with trending data', async () => {
      const trendingData = generateTimeSeries(20, 2); // Upward trend of 2 per day
      
      await model.fit(trendingData);
      const forecast = await model.forecast(10);
      
      expect(Array.isArray(forecast)).toBe(true);
      expect(forecast.length).toBe(10);
      
      // All forecast values should be positive and reasonable
      forecast.forEach(value => {
        expect(value).toBeGreaterThan(0);
        expect(value).toBeLessThan(1000);
      });
    });

    test('should work with seasonal data', async () => {
      const seasonalData = Array.from({ length: 28 }, (_, i) => ({
        date: new Date(Date.now() - (28 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        value: 100 + 20 * Math.sin(i * Math.PI / 7) // Weekly seasonality
      }));
      
      await model.fit(seasonalData);
      const forecast = await model.forecast(7);
      
      expect(Array.isArray(forecast)).toBe(true);
      expect(forecast.length).toBe(7);
      
      // Forecast should be reasonable given seasonal pattern
      forecast.forEach(value => {
        expect(value).toBeGreaterThan(70);
        expect(value).toBeLessThan(130);
      });
    });

    test('should handle zero and negative values', async () => {
      const mixedData = [
        { date: '2024-01-01', value: -5 },
        { date: '2024-01-02', value: 0 },
        { date: '2024-01-03', value: 5 },
        { date: '2024-01-04', value: 10 },
        { date: '2024-01-05', value: -2 },
        { date: '2024-01-06', value: 8 },
        { date: '2024-01-07', value: 3 }
      ];
      
      await model.fit(mixedData);
      const forecast = await model.forecast(3);
      
      expect(Array.isArray(forecast)).toBe(true);
      expect(forecast.length).toBe(3);
      
      // Calculate expected moving average
      const expectedValue = ((-5 + 0 + 5 + 10 + (-2) + 8 + 3) / 7);
      forecast.forEach(value => {
        expect(Math.abs(value - expectedValue)).toBeLessThan(0.001);
      });
    });

    test('should maintain consistent forecast values', async () => {
      const stableData = Array.from({ length: 10 }, (_, i) => ({
        date: new Date(Date.now() - (10 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        value: 50 + (Math.random() - 0.5) * 2 // Stable around 50 with small noise
      }));
      
      await model.fit(stableData);
      const forecast1 = await model.forecast(5);
      const forecast2 = await model.forecast(5);
      
      // Multiple calls should return identical results
      expect(forecast1).toEqual(forecast2);
    });
  });
});