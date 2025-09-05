import Redis from 'redis';

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
      
      this.client = Redis.createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > this.maxReconnectAttempts) {
              console.error('REDIS: Max reconnection attempts reached');
              return new Error('Redis connection failed after max attempts');
            }
            const delay = Math.min(retries * 50, 500);
            console.log(`REDIS: Reconnecting in ${delay}ms (attempt ${retries})`);
            return delay;
          },
          connectTimeout: 10000,
          lazyConnect: true
        },
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            console.error('REDIS: Server refused connection');
            return new Error('Redis server connection refused');
          }
          if (options.times_connected > 10) {
            return new Error('Redis retry attempts exhausted');
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });

      this.client.on('connect', () => {
        console.log('REDIS: Connected to Redis server');
      });

      this.client.on('ready', () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        console.log('REDIS: Ready for operations');
      });

      this.client.on('error', (err) => {
        console.error('REDIS Error:', err);
        this.isConnected = false;
      });

      this.client.on('end', () => {
        console.log('REDIS: Connection ended');
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        this.reconnectAttempts++;
        console.log(`REDIS: Reconnecting (attempt ${this.reconnectAttempts})`);
      });

      await this.client.connect();
      return true;

    } catch (error) {
      console.error('REDIS: Connection failed:', error);
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
        console.log('REDIS: Disconnected successfully');
      }
    } catch (error) {
      console.error('REDIS: Disconnect error:', error);
    }
  }

  async get(key) {
    if (!this.isConnected || !this.client) {
      console.warn('REDIS: Not connected, returning null');
      return null;
    }

    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('REDIS: Get error:', error);
      return null;
    }
  }

  async set(key, value, ttlSeconds = 3600) {
    if (!this.isConnected || !this.client) {
      console.warn('REDIS: Not connected, skipping set operation');
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      await this.client.setEx(key, ttlSeconds, serialized);
      return true;
    } catch (error) {
      console.error('REDIS: Set error:', error);
      return false;
    }
  }

  async del(key) {
    if (!this.isConnected || !this.client) {
      console.warn('REDIS: Not connected, skipping delete operation');
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('REDIS: Delete error:', error);
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
      console.error('REDIS: Exists check error:', error);
      return false;
    }
  }

  async flushAll() {
    if (!this.isConnected || !this.client) {
      console.warn('REDIS: Not connected, cannot flush');
      return false;
    }

    try {
      await this.client.flushAll();
      console.log('REDIS: All keys flushed');
      return true;
    } catch (error) {
      console.error('REDIS: Flush error:', error);
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
      console.error('REDIS: Keys error:', error);
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
      console.error('REDIS: Multi-get error:', error);
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
      console.error('REDIS: Multi-set error:', error);
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
      console.error('REDIS: Increment error:', error);
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
      console.error('REDIS: Expire error:', error);
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
      console.error('REDIS: Stats error:', error);
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