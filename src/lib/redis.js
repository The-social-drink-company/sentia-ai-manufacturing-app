import { devLog } from '../lib/devLog.js';
import Redis from 'ioredis';

class RedisCache {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.connect();
  }

  async connect() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.client = new Redis(redisUrl, {
        retryDelayOnFailover: 100,
        enableReadyCheck: true,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000,
        family: 4,
        connectTimeout: 10000,
        commandTimeout: 5000,
      });

      this.client.on('connect', () => {
        devLog.log('🔴 Redis connected');
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        devLog.error('❌ Redis error:', err);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        devLog.log('🔴 Redis connection closed');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      devLog.error('❌ Redis connection failed:', error);
      this.isConnected = false;
    }
  }

  async get(key) {
    if (!this.isConnected) return null;
    
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      devLog.error(`❌ Redis GET error for key ${key}:`, error);
      return null;
    }
  }

  async set(key, value, ttl = 300) {
    if (!this.isConnected) return false;
    
    try {
      const serialized = JSON.stringify(value);
      if (ttl > 0) {
        await this.client.setex(key, ttl, serialized);
      } else {
        await this.client.set(key, serialized);
      }
      return true;
    } catch (error) {
      devLog.error(`❌ Redis SET error for key ${key}:`, error);
      return false;
    }
  }

  async del(key) {
    if (!this.isConnected) return false;
    
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      devLog.error(`❌ Redis DEL error for key ${key}:`, error);
      return false;
    }
  }

  async invalidatePattern(pattern) {
    if (!this.isConnected) return false;
    
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
      return true;
    } catch (error) {
      devLog.error(`❌ Redis INVALIDATE error for pattern ${pattern}:`, error);
      return false;
    }
  }

  async exists(key) {
    if (!this.isConnected) return false;
    
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      devLog.error(`❌ Redis EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  async ttl(key) {
    if (!this.isConnected) return -1;
    
    try {
      return await this.client.ttl(key);
    } catch (error) {
      devLog.error(`❌ Redis TTL error for key ${key}:`, error);
      return -1;
    }
  }

  async flushAll() {
    if (!this.isConnected) return false;
    
    try {
      await this.client.flushall();
      return true;
    } catch (error) {
      devLog.error('❌ Redis FLUSHALL error:', error);
      return false;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }

  // Enterprise-specific caching methods
  async cacheWidget(widgetId, data, ttl = 30) {
    return this.set(`widget:${widgetId}`, data, ttl);
  }

  async getCachedWidget(widgetId) {
    return this.get(`widget:${widgetId}`);
  }

  async cacheUserSession(userId, sessionData, ttl = 3600) {
    return this.set(`session:${userId}`, sessionData, ttl);
  }

  async getUserSession(userId) {
    return this.get(`session:${userId}`);
  }

  async cacheDashboardData(dashboardId, data, ttl = 60) {
    return this.set(`dashboard:${dashboardId}`, data, ttl);
  }

  async getCachedDashboardData(dashboardId) {
    return this.get(`dashboard:${dashboardId}`);
  }

  async cacheAPIResponse(endpoint, params, data, ttl = 120) {
    const key = `api:${endpoint}:${JSON.stringify(params)}`;
    return this.set(key, data, ttl);
  }

  async getCachedAPIResponse(endpoint, params) {
    const key = `api:${endpoint}:${JSON.stringify(params)}`;
    return this.get(key);
  }
}

// Singleton instance
const redisCache = new RedisCache();

export default redisCache;