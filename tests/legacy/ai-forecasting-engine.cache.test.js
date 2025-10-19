import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import aiForecastingEngine from '../ai-forecasting-engine.js';
import forecastCacheService from '../forecast-cache-service.js';

vi.mock('../forecast-cache-service.js', () => {
  const cache = new Map();
  return {
    default: {
      generateDatasetSignature: vi.fn((data, options) => {
        const payload = JSON.stringify({ length: data?.length || 0, options });
        return `signature_${payload.length}`;
      }),
      getForecast: vi.fn(async ({ datasetSignature, horizon }) => {
        return cache.get(`forecast:${datasetSignature}:${horizon}`) || null;
      }),
      setForecast: vi.fn(async ({ datasetSignature, horizon, forecast }) => {
        cache.set(`forecast:${datasetSignature}:${horizon}`, forecast);
        return true;
      }),
      getModelPerformance: vi.fn(async (modelName) => {
        return cache.get(`performance:${modelName}`) || null;
      }),
      setModelPerformance: vi.fn(async (modelName, payload) => {
        cache.set(`performance:${modelName}`, payload);
        return true;
      }),
      flushAll: vi.fn(async () => {
        cache.clear();
        return true;
      })
    }
  };
});

vi.mock('../redis-cache.js', () => ({
  default: {
    generateCacheKey: (...parts) => parts.join(':'),
    get: vi.fn(async () => null),
    set: vi.fn(async () => true),
    setEx: vi.fn(async () => true),
    del: vi.fn(async () => true),
    flushAll: vi.fn(async () => true)
  }
}));

vi.mock('../src/utils/logger', () => ({
  logDebug: vi.fn(),
  logInfo: vi.fn(),
  logWarn: vi.fn(),
  logError: vi.fn()
}));

vi.mock('@tensorflow/tfjs-node', () => {
  const tensorMock = (shape) => ({
    shape,
    dataSync: () => new Float32Array(shape.reduce((acc, val) => acc * (val || 1), 1)).fill(0.5),
    data: async () => new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7]),
    dispose: vi.fn()
  });

  const fakeModel = () => ({
    compile: vi.fn(),
    fit: vi.fn(async () => ({ history: { loss: [0.1], val_loss: [0.2] } })),
    predict: vi.fn(() => tensorMock([7]))
  });

  return {
    sequential: vi.fn(() => fakeModel()),
    layers: {
      lstm: vi.fn(() => ({})),
      dense: vi.fn(() => ({})),
      dropout: vi.fn(() => ({})),
      batchNormalization: vi.fn(() => ({}))
    },
    tensor: vi.fn(() => tensorMock([1, 7])),
    metrics: {
      meanSquaredError: vi.fn(() => tensorMock([])),
      meanAbsoluteError: vi.fn(() => tensorMock([]))
    },
    train: {
      adam: vi.fn(() => ({})),
      adamax: vi.fn(() => ({})),
      sgd: vi.fn(() => ({}))
    },
    mean: vi.fn(() => tensorMock([])),
    sum: vi.fn(() => tensorMock([])),
    square: vi.fn(() => tensorMock([])),
    sub: vi.fn(() => tensorMock([])),
    div: vi.fn(() => tensorMock([]))
  };
});

describe('AI Forecasting Engine Cache Integration', () => {
  const mockData = Array.from({ length: 40 }, (_, idx) => ({
    timestamp: new Date(Date.now() - idx * 86400000).toISOString(),
    value: 100 + idx,
    features: { seasonality: 0.5, trend: idx / 10 }
  })).reverse();

  beforeEach(async () => {
    vi.useFakeTimers();
    await forecastCacheService.flushAll();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('stores model performance in cache after training', async () => {
    const modelName = 'lstm';
    const result = await aiForecastingEngine.trainModel(modelName, mockData);
    expect(result.modelName).toBe(modelName);

    const cached = await forecastCacheService.getModelPerformance(modelName);
    expect(cached).toBeTruthy();
    expect(cached.datasetSignature).toBeDefined();
    expect(cached.trainingHistory).toBeDefined();
  });

  it('returns cached forecast when available', async () => {
    const horizon = 7;
    const firstRun = await aiForecastingEngine.generateForecast(mockData, horizon);
    expect(firstRun.forecast).toHaveLength(horizon);

    const secondRun = await aiForecastingEngine.generateForecast(mockData, horizon);
    expect(secondRun.forecast).toEqual(firstRun.forecast);
    expect(forecastCacheService.getForecast).toHaveBeenCalledWith(
      expect.objectContaining({ horizon })
    );
  });

  it('persists forecast via cache service', async () => {
    const horizon = 5;
    await aiForecastingEngine.generateForecast(mockData, horizon);

    const datasetSignature = forecastCacheService.generateDatasetSignature(mockData, {
      horizon,
      options: {}
    });

    const cached = await forecastCacheService.getForecast({ datasetSignature, horizon });
    expect(cached).toBeTruthy();
    expect(cached.forecast).toHaveLength(horizon);
  });
});
