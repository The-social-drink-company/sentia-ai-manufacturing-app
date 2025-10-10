import redis from 'redis';
import { logDebug, logInfo, logWarn, logError } from '../src/utils/logger';


class RedisCacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  async connect() {
    try {
      if (this.client) {
        await this.client.quit();
      }

      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.client = redis.createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > this.maxReconnectAttempts) {
              logError('REDIS: Max reconnection attempts reached');
              return new Error('Redis connection failed after max attempts');
            }
            const delay = Math.min(retries * 50, 500);
            logDebug(`REDIS: Reconnecting in ${delay}ms (attempt ${retries})`);
            return delay;
          },
          connectTimeout: 10000,
          lazyConnect: true
        },
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            logError('REDIS: Server refused connection');
            return new Error('Redis server connection refused');
          }
          if (options.times_connected > 10) {
            return new Error('Redis retry attempts exhausted');
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });

      this.client.on('connect', () => {
        logDebug('REDIS: Connected to Redis server');
      });

      this.client.on('ready', () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        logDebug('REDIS: Ready for operations');
      });

      this.client.on('error', (err) => {
        logError('REDIS Error:', err);
        this.isConnected = false;
      });

      this.client.on('end', () => {
        logDebug('REDIS: Connection ended');
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        this.reconnectAttempts++;
        logDebug(`REDIS: Reconnecting (attempt ${this.reconnectAttempts})`);
      });

      await this.client.connect();
      return true;

    } catch (error) {
      logError('REDIS: Connection failed:', error);
      this.isConnected = false;
      return false;
    }
  }

  async disconnect() {
    try {
      if (this.client) {
        await this.client.quit();
        this.client = null;
        this.isConnected = false;
        logDebug('REDIS: Disconnected successfully');
      }
    } catch (error) {
      logError('REDIS: Disconnect error:', error);
    }
  }

  async get(key) {
    if (!this.isConnected || !this.client) {
      // REDIS: Not connected - using fallback (no cache)
      return null;
    }

    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logError('REDIS: Get error:', error);
      return null;
    }
  }

  async set(key, value, ttlSeconds = 3600) {
    if (!this.isConnected || !this.client) {
      // REDIS: Not connected - skipping cache set operation
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      await this.client.setEx(key, ttlSeconds, serialized);
      return true;
    } catch (error) {
      logError('REDIS: Set error:', error);
      return false;
    }
  }

  async del(key) {
    if (!this.isConnected || !this.client) {
      // REDIS: Not connected - skipping cache delete operation
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logError('REDIS: Delete error:', error);
      return false;
    }
  }

  async exists(key) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logError('REDIS: Exists check error:', error);
      return false;
    }
  }

  async flushAll() {
    if (!this.isConnected || !this.client) {
      // REDIS: Not connected - cannot flush cache
      return false;
    }

    try {
      await this.client.flushAll();
      logDebug('REDIS: All keys flushed');
      return true;
    } catch (error) {
      logError('REDIS: Flush error:', error);
      return false;
    }
  }

  async keys(pattern = '*') {
    if (!this.isConnected || !this.client) {
      return [];
    }

    try {
      return await this.client.keys(pattern);
    } catch (error) {
      logError('REDIS: Keys error:', error);
      return [];
    }
  }

  async mget(keys) {
    if (!this.isConnected || !this.client || !keys.length) {
      return [];
    }

    try {
      const values = await this.client.mGet(keys);
      return values.map(value => value ? JSON.parse(value) : null);
    } catch (error) {
      logError('REDIS: Multi-get error:', error);
      return [];
    }
  }

  async mset(keyValuePairs, ttlSeconds = 3600) {
    if (!this.isConnected || !this.client || !keyValuePairs.length) {
      return false;
    }

    try {
      const pipeline = this.client.multi();
      
      for (const [key, value] of keyValuePairs) {
        const serialized = JSON.stringify(value);
        pipeline.setEx(key, ttlSeconds, serialized);
      }

      await pipeline.exec();
      return true;
    } catch (error) {
      logError('REDIS: Multi-set error:', error);
      return false;
    }
  }

  async increment(key, amount = 1) {
    if (!this.isConnected || !this.client) {
      return null;
    }

    try {
      return await this.client.incrBy(key, amount);
    } catch (error) {
      logError('REDIS: Increment error:', error);
      return null;
    }
  }

  async expire(key, seconds) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const result = await this.client.expire(key, seconds);
      return result === 1;
    } catch (error) {
      logError('REDIS: Expire error:', error);
      return false;
    }
  }

  async getStats() {
    if (!this.isConnected || !this.client) {
      return null;
    }

    try {
      const info = await this.client.info('memory');
      const keyspace = await this.client.info('keyspace');
      
      return {
        connected: this.isConnected,
        reconnectAttempts: this.reconnectAttempts,
        memory: info,
        keyspace: keyspace,
        uptime: await this.client.info('server')
      };
    } catch (error) {
      logError('REDIS: Stats error:', error);
      return null;
    }
  }

  generateCacheKey(prefix, ...parts) {
    const cleanParts = parts
      .map(part => String(part).replace(/[^a-zA-Z0-9_-]/g, '_'))
      .filter(Boolean);
    return `${prefix}:${cleanParts.join(':')}`;
  }

  async healthCheck() {
    if (!this.isConnected || !this.client) {
      return { healthy: false, error: 'Not connected' };
    }

    try {
      const testKey = 'health_check';
      const testValue = 'ok';
      
      await this.client.set(testKey, testValue);
      const result = await this.client.get(testKey);
      await this.client.del(testKey);

      return {
        healthy: result === testValue,
        ping: await this.client.ping(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }
}

const redisCacheService = new RedisCacheService();

export default redisCacheService;