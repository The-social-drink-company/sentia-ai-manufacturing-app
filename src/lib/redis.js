// Wrapper for redis-cache service to maintain import compatibility
// amazon-sp-api.js imports from '../src/lib/redis.js' but actual service is in services/redis-cache.js
import redisCacheService from '../../services/redis-cache.js'

export default redisCacheService
