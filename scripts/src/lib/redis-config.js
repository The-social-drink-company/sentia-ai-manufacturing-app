
// Enhanced Redis performance settings
export const REDIS_CONFIG = {
  maxMemoryPolicy: 'allkeys-lru',
  maxMemorySize: '512mb',
  persistenceMode: 'rdb',
  compressionEnabled: true,
  pipelineEnabled: true,
  clusterEnabled: process.env.NODE_ENV === 'production'
};