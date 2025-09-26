// Redis Cache Service for Distributed Caching
// Provides Redis-based caching with fallback to in-memory cache

import Redis from 'ioredis';
import NodeCache from 'node-cache';
import { logDebug, logInfo, logWarn, logError } from '../../src/utils/logger';


class RedisCacheService {
  constructor() {
    this.redis = null;
    this.fallbackCache = new NodeCache({ stdTTL: 60, checkperiod: 120 });
    this.isConnected = false;
    this.initRedis();
  }

  async initRedis() {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      logDebug('Redis URL not configured, using in-memory cache only');
      return;
    }

    try {
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 3) {
            logError('Redis connection failed, falling back to memory cache');
            this.isConnected = false;
            return null;
          }
          return Math.min(times * 100, 3000);
        },
        reconnectOnError: (err) => {
          const targetError = 'READONLY';
          if (err.message.includes(targetError)) {
            return true;
          }
          return false;
        }
      });

      this.redis.on('connect', () => {
        logDebug('Redis connected successfully');
        this.isConnected = true;
      });

      this.redis.on('error', (err) => {
        logError('Redis error:', err.message);
        this.isConnected = false;
      });

      // Test connection
      await this.redis.ping();
      this.isConnected = true;
    } catch (error) {
      logError('Failed to connect to Redis:', error.message);
      this.isConnected = false;
    }
  }

  async get(key) {
    try {
      if (this.isConnected && this.redis) {
        const value = await this.redis.get(key);
        if (value) {
          return JSON.parse(value);
        }
      }
    } catch (error) {
      logError('Redis get error:', error.message);
    }

    // Fallback to memory cache
    return this.fallbackCache.get(key);
  }

  async set(key, value, ttl = 60) {
    try {
      const serialized = JSON.stringify(value);

      if (this.isConnected && this.redis) {
        await this.redis.set(key, serialized, 'EX', ttl);
      }

      // Always set in fallback cache
      this.fallbackCache.set(key, value, ttl);
    } catch (error) {
      logError('Redis set error:', error.message);
      // Still set in fallback cache
      this.fallbackCache.set(key, value, ttl);
    }
  }

  async del(key) {
    try {
      if (this.isConnected && this.redis) {
        await this.redis.del(key);
      }
      this.fallbackCache.del(key);
    } catch (error) {
      logError('Redis del error:', error.message);
      this.fallbackCache.del(key);
    }
  }

  async flush(pattern = '*') {
    try {
      if (this.isConnected && this.redis) {
        if (pattern === '*') {
          await this.redis.flushdb();
        } else {
          const keys = await this.redis.keys(pattern);
          if (keys.length > 0) {
            await this.redis.del(...keys);
          }
        }
      }

      if (pattern === '*') {
        this.fallbackCache.flushAll();
      } else {
        const keys = this.fallbackCache.keys();
        keys.forEach(key => {
          if (key.includes(pattern.replace('*', ''))) {
            this.fallbackCache.del(key);
          }
        });
      }
    } catch (error) {
      logError('Redis flush error:', error.message);
      this.fallbackCache.flushAll();
    }
  }

  async mget(keys) {
    const results = {};

    try {
      if (this.isConnected && this.redis) {
        const values = await this.redis.mget(...keys);
        keys.forEach((key, index) => {
          if (values[index]) {
            results[key] = JSON.parse(values[index]);
          }
        });
      }
    } catch (error) {
      logError('Redis mget error:', error.message);
    }

    // Fill missing values from fallback cache
    keys.forEach(key => {
      if (!results[key]) {
        const value = this.fallbackCache.get(key);
        if (value) {
          results[key] = value;
        }
      }
    });

    return results;
  }

  async mset(keyValuePairs, ttl = 60) {
    try {
      if (this.isConnected && this.redis) {
        const pipeline = this.redis.pipeline();
        Object.entries(keyValuePairs).forEach(([key, value]) => {
          pipeline.set(key, JSON.stringify(value), 'EX', ttl);
        });
        await pipeline.exec();
      }

      // Always set in fallback cache
      Object.entries(keyValuePairs).forEach(([key, value]) => {
        this.fallbackCache.set(key, value, ttl);
      });
    } catch (error) {
      logError('Redis mset error:', error.message);
      // Still set in fallback cache
      Object.entries(keyValuePairs).forEach(([key, value]) => {
        this.fallbackCache.set(key, value, ttl);
      });
    }
  }

  async exists(key) {
    try {
      if (this.isConnected && this.redis) {
        const exists = await this.redis.exists(key);
        return exists === 1;
      }
    } catch (error) {
      logError('Redis exists error:', error.message);
    }

    return this.fallbackCache.has(key);
  }

  async ttl(key) {
    try {
      if (this.isConnected && this.redis) {
        return await this.redis.ttl(key);
      }
    } catch (error) {
      logError('Redis ttl error:', error.message);
    }

    return this.fallbackCache.getTtl(key);
  }

  async incr(key, amount = 1) {
    try {
      if (this.isConnected && this.redis) {
        return await this.redis.incrby(key, amount);
      }
    } catch (error) {
      logError('Redis incr error:', error.message);
    }

    // Fallback increment
    const current = this.fallbackCache.get(key) || 0;
    const newValue = current + amount;
    this.fallbackCache.set(key, newValue);
    return newValue;
  }

  getStats() {
    return {
      redis: {
        connected: this.isConnected,
        url: process.env.REDIS_URL ? 'Configured' : 'Not configured'
      },
      fallback: this.fallbackCache.getStats()
    };
  }

  async disconnect() {
    if (this.redis) {
      await this.redis.quit();
      this.isConnected = false;
    }
  }
}

// Create singleton instance
const redisCache = new RedisCacheService();

export { redisCache, RedisCacheService };
export default redisCache;