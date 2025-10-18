import crypto from 'crypto';
import redisCacheService from './redis-cache.js';
import { logDebug, logError } from '../src/utils/logger';

const MODEL_PREFIX = 'ai_forecast_model';
const PERFORMANCE_PREFIX = 'ai_model_performance';
const FORECAST_PREFIX = 'ai_forecast_result';

const DEFAULT_MODEL_TTL = 60 * 60 * 24; // 24 hours
const DEFAULT_FORECAST_TTL = 60 * 30; // 30 minutes

class ForecastCacheService {
  generateDatasetSignature(rawData = [], options = {}) {
    try {
      const payload = JSON.stringify({
        length: rawData.length,
        hash: this.#hashSample(rawData),
        options
      });
      return crypto.createHash('sha256').update(payload).digest('hex').slice(0, 24);
    } catch (error) {
      logError('AI Forecast Cache: Failed to generate dataset signature', error);
      return 'unknown';
    }
  }

  async getForecast({ datasetSignature, horizon }) {
    if (!datasetSignature || !horizon) {
      return null;
    }

    const cacheKey = redisCacheService.generateCacheKey(
      FORECAST_PREFIX,
      datasetSignature,
      `${horizon}d`
    );

    return redisCacheService.get(cacheKey);
  }

  async setForecast({ datasetSignature, horizon, forecast }, ttlSeconds = DEFAULT_FORECAST_TTL) {
    if (!datasetSignature || !horizon || !forecast) {
      return false;
    }

    const cacheKey = redisCacheService.generateCacheKey(
      FORECAST_PREFIX,
      datasetSignature,
      `${horizon}d`
    );

    const success = await redisCacheService.set(cacheKey, forecast, ttlSeconds);

    if (success) {
      logDebug(`AI Forecast Cache: Stored forecast at key ${cacheKey}`);
    }

    return success;
  }

  async getModelPerformance(modelName) {
    if (!modelName) {
      return null;
    }

    const cacheKey = redisCacheService.generateCacheKey(PERFORMANCE_PREFIX, modelName);
    return redisCacheService.get(cacheKey);
  }

  async setModelPerformance(modelName, performance, ttlSeconds = DEFAULT_MODEL_TTL) {
    if (!modelName || !performance) {
      return false;
    }

    const cacheKey = redisCacheService.generateCacheKey(PERFORMANCE_PREFIX, modelName);
    const success = await redisCacheService.set(cacheKey, performance, ttlSeconds);

    if (success) {
      logDebug(`AI Forecast Cache: Stored model performance at key ${cacheKey}`);
    }

    return success;
  }

  async deleteModelPerformance(modelName) {
    if (!modelName) {
      return false;
    }

    const cacheKey = redisCacheService.generateCacheKey(PERFORMANCE_PREFIX, modelName);
    return redisCacheService.del(cacheKey);
  }

  async getModelArtifact(modelName) {
    if (!modelName) {
      return null;
    }

    const cacheKey = redisCacheService.generateCacheKey(MODEL_PREFIX, modelName);
    return redisCacheService.get(cacheKey);
  }

  async setModelArtifact(modelName, artifact, ttlSeconds = DEFAULT_MODEL_TTL) {
    if (!modelName || !artifact) {
      return false;
    }

    const cacheKey = redisCacheService.generateCacheKey(MODEL_PREFIX, modelName);
    const success = await redisCacheService.set(cacheKey, artifact, ttlSeconds);

    if (success) {
      logDebug(`AI Forecast Cache: Stored model artifact at key ${cacheKey}`);
    }

    return success;
  }

  async flushAll() {
    return redisCacheService.flushAll();
  }

  #hashSample(rawData) {
    if (!Array.isArray(rawData) || !rawData.length) {
      return crypto.createHash('md5').update('empty').digest('hex');
    }

    const sample = rawData.slice(-10).map(point => ({
      value: point?.value,
      timestamp: point?.timestamp,
      features: point?.features ? Object.keys(point.features) : []
    }));

    return crypto.createHash('md5').update(JSON.stringify(sample)).digest('hex');
  }
}

const forecastCacheService = new ForecastCacheService();

export default forecastCacheService;
