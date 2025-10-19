const Redis = require('ioredis')
const logger = require('../utils/logger')

/**
 * Redis Connection Manager
 *
 * Manages Redis connections for BullMQ queues and general caching.
 *
 * Features:
 * - Connection pooling
 * - Automatic reconnection
 * - Health monitoring
 * - Error handling
 */

// Redis connection configurations
const getRedisConfig = () => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

  // Parse Redis URL
  const url = new URL(redisUrl)

  return {
    host: url.hostname,
    port: parseInt(url.port) || 6379,
    password: url.password || undefined,
    db: parseInt(url.pathname.slice(1)) || 0,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000)
      logger.warn(`[Redis] Retrying connection (attempt ${times}), delay: ${delay}ms`)
      return delay
    },
    reconnectOnError(err) {
      const targetError = 'READONLY'
      if (err.message.includes(targetError)) {
        logger.error('[Redis] Reconnecting due to READONLY error')
        return true
      }
      return false
    },
  }
}

// Main Redis client for general operations
let redisClient = null

/**
 * Get Redis client (singleton)
 */
const getRedisClient = () => {
  if (!redisClient) {
    const config = getRedisConfig()

    redisClient = new Redis(config)

    redisClient.on('connect', () => {
      logger.info('[Redis] Connected successfully')
    })

    redisClient.on('ready', () => {
      logger.info('[Redis] Client ready')
    })

    redisClient.on('error', err => {
      logger.error('[Redis] Client error:', err)
    })

    redisClient.on('close', () => {
      logger.warn('[Redis] Connection closed')
    })

    redisClient.on('reconnecting', () => {
      logger.info('[Redis] Reconnecting...')
    })
  }

  return redisClient
}

/**
 * Create Redis connection for BullMQ
 * BullMQ requires separate connections for queue and worker
 */
const createBullMQConnection = () => {
  const config = getRedisConfig()

  return new Redis({
    ...config,
    maxRetriesPerRequest: null, // BullMQ requirement
    enableOfflineQueue: false, // BullMQ requirement
  })
}

/**
 * Test Redis connection
 */
const testConnection = async () => {
  try {
    const client = getRedisClient()
    await client.ping()
    logger.info('[Redis] Connection test successful')
    return { success: true }
  } catch (error) {
    logger.error('[Redis] Connection test failed:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get Redis info
 */
const getRedisInfo = async () => {
  try {
    const client = getRedisClient()
    const info = await client.info()

    // Parse info string
    const lines = info.split('\r\n')
    const parsed = {}

    let section = 'general'
    for (const line of lines) {
      if (line.startsWith('#')) {
        section = line.substring(2).toLowerCase().trim()
        parsed[section] = {}
      } else if (line.includes(':')) {
        const [key, value] = line.split(':')
        parsed[section][key] = value
      }
    }

    return {
      connected: true,
      version: parsed.server?.redis_version,
      uptime: parsed.server?.uptime_in_seconds,
      connectedClients: parsed.clients?.connected_clients,
      usedMemory: parsed.memory?.used_memory_human,
      totalSystemMemory: parsed.memory?.total_system_memory_human,
      ...parsed,
    }
  } catch (error) {
    logger.error('[Redis] Failed to get info:', error)
    return {
      connected: false,
      error: error.message,
    }
  }
}

/**
 * Get Redis statistics
 */
const getRedisStats = async () => {
  try {
    const client = getRedisClient()

    const [dbSize, info] = await Promise.all([client.dbsize(), client.info('stats')])

    // Parse stats
    const lines = info.split('\r\n')
    const stats = {}

    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':')
        stats[key] = value
      }
    }

    return {
      dbSize,
      totalConnectionsReceived: parseInt(stats.total_connections_received) || 0,
      totalCommandsProcessed: parseInt(stats.total_commands_processed) || 0,
      instantaneousOpsPerSec: parseFloat(stats.instantaneous_ops_per_sec) || 0,
      keyspaceHits: parseInt(stats.keyspace_hits) || 0,
      keyspaceMisses: parseInt(stats.keyspace_misses) || 0,
      hitRate:
        stats.keyspace_hits && stats.keyspace_misses
          ? (
              (parseInt(stats.keyspace_hits) /
                (parseInt(stats.keyspace_hits) + parseInt(stats.keyspace_misses))) *
              100
            ).toFixed(2) + '%'
          : 'N/A',
    }
  } catch (error) {
    logger.error('[Redis] Failed to get stats:', error)
    return null
  }
}

/**
 * Clear all keys (use with caution!)
 */
const flushAll = async () => {
  try {
    const client = getRedisClient()
    await client.flushall()
    logger.warn('[Redis] All keys flushed')
    return { success: true }
  } catch (error) {
    logger.error('[Redis] Failed to flush all:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Close Redis connection
 */
const closeConnection = async () => {
  if (redisClient) {
    try {
      await redisClient.quit()
      redisClient = null
      logger.info('[Redis] Connection closed')
    } catch (error) {
      logger.error('[Redis] Error closing connection:', error)
      throw error
    }
  }
}

/**
 * Health check for Redis
 */
const healthCheck = async () => {
  try {
    const client = getRedisClient()
    const start = Date.now()
    await client.ping()
    const latency = Date.now() - start

    return {
      healthy: true,
      latency,
      status: latency < 100 ? 'excellent' : latency < 500 ? 'good' : 'slow',
    }
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
    }
  }
}

module.exports = {
  getRedisClient,
  createBullMQConnection,
  testConnection,
  getRedisInfo,
  getRedisStats,
  flushAll,
  closeConnection,
  healthCheck,
}
