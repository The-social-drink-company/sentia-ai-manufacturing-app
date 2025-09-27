
// Enhanced Redis performance settings
export const REDISCONFIG = {
  maxMemoryPolicy: 'allkeys-lru',
  maxMemorySize: '512mb',
  persistenceMode: 'rdb',
  compressionEnabled: true,
  pipelineEnabled: true,
  clusterEnabled: process.env.NODE_ENV === 'production'
};