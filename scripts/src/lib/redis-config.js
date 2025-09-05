// Enterprise Redis Configuration for High-Performance Caching
import Redis from 'ioredis';

const redisConfig = {
  development: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    db: 0,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    keepAlive: 30000
  },
  
  production: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    db: 0,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    enableOfflineQueue: false,
    connectTimeout: 10000,
    commandTimeout: 5000,
    maxmemoryPolicy: 'allkeys-lru'
  }
};

const environment = process.env.NODE_ENV || 'development';
const redis = new Redis(redisConfig[environment]);

// Enterprise performance optimizations
redis.defineCommand('cachedSet', {
  numberOfKeys: 1,
  lua: `
    redis.call('set', KEYS[1], ARGV[1])
    redis.call('expire', KEYS[1], ARGV[2])
    return 1
  `
});

export default redis;