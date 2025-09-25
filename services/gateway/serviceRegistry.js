import EventEmitter from 'events';
import { logDebug, logInfo, logWarn, logError } from '../../src/utils/logger';


/**
 * Service Registry for Microservices Discovery
 * 
 * Manages service registration, discovery, and health monitoring
 * in a distributed microservices architecture.
 */
export class ServiceRegistry extends EventEmitter {
  constructor(redis) {
    super();
    this.redis = redis;
    this.services = new Map();
    this.healthCheckInterval = 30000; // 30 seconds
    this.serviceTimeout = 90000; // 90 seconds
    
    this.startHealthMonitoring();
  }

  /**
   * Register a service in the registry
   */
  async registerService(serviceName, serviceConfig) {
    const service = {
      name: serviceName,
      ...serviceConfig,
      registeredAt: Date.now(),
      lastHealthCheck: Date.now(),
      status: 'unknown',
      instances: serviceConfig.instances || [serviceConfig.url],
      metadata: serviceConfig.metadata || {}
    };

    // Store in memory
    this.services.set(serviceName, service);

    // Store in Redis for distributed registry
    await this.redis.hset(
      'services:registry',
      serviceName,
      JSON.stringify(service)
    );

    // Set expiration for automatic cleanup
    await this.redis.expire(`service:${serviceName}`, this.serviceTimeout / 1000);

    logDebug(`📝 Service registered: ${serviceName} at ${serviceConfig.url}`);
    this.emit('serviceRegistered', service);

    return service;
  }

  /**
   * Unregister a service from the registry
   */
  async unregisterService(serviceName) {
    const service = this.services.get(serviceName);
    if (service) {
      this.services.delete(serviceName);
      await this.redis.hdel('services:registry', serviceName);
      await this.redis.del(`service:${serviceName}`);
      
      logDebug(`🗑️ Service unregistered: ${serviceName}`);
      this.emit('serviceUnregistered', service);
    }
  }

  /**
   * Discover a service by name
   */
  async discoverService(serviceName) {
    // Check memory first
    let service = this.services.get(serviceName);
    
    if (!service) {
      // Check Redis
      const serviceData = await this.redis.hget('services:registry', serviceName);
      if (serviceData) {
        service = JSON.parse(serviceData);
        this.services.set(serviceName, service);
      }
    }

    return service;
  }

  /**
   * Get all registered services
   */
  async getAllServices() {
    // Sync with Redis
    const redisServices = await this.redis.hgetall('services:registry');
    
    for (const [name, data] of Object.entries(redisServices)) {
      if (!this.services.has(name)) {
        this.services.set(name, JSON.parse(data));
      }
    }

    return Object.fromEntries(this.services);
  }

  /**
   * Get healthy instances of a service
   */
  async getHealthyInstances(serviceName) {
    const service = await this.discoverService(serviceName);
    if (!service) return [];

    return service.instances.filter(instance => {
      const instanceHealth = service.instanceHealth?.[instance];
      return instanceHealth?.status === 'healthy';
    });
  }

  /**
   * Update service health status
   */
  async updateServiceHealth(serviceName, isHealthy, instanceUrl = null) {
    const service = this.services.get(serviceName);
    if (!service) return;

    service.lastHealthCheck = Date.now();
    service.status = isHealthy ? 'healthy' : 'unhealthy';

    if (instanceUrl) {
      if (!service.instanceHealth) {
        service.instanceHealth = {};
      }
      service.instanceHealth[instanceUrl] = {
        status: isHealthy ? 'healthy' : 'unhealthy',
        lastCheck: Date.now(),
        consecutiveFailures: isHealthy ? 0 : (service.instanceHealth[instanceUrl]?.consecutiveFailures || 0) + 1
      };
    }

    // Update in Redis
    await this.redis.hset(
      'services:registry',
      serviceName,
      JSON.stringify(service)
    );

    this.emit('serviceHealthUpdated', { serviceName, isHealthy, instanceUrl });
  }

  /**
   * Get service statistics
   */
  getServiceStats(serviceName) {
    const service = this.services.get(serviceName);
    if (!service) return null;

    const totalInstances = service.instances.length;
    const healthyInstances = service.instances.filter(instance => {
      const health = service.instanceHealth?.[instance];
      return health?.status === 'healthy';
    }).length;

    return {
      name: serviceName,
      totalInstances,
      healthyInstances,
      healthyPercentage: totalInstances > 0 ? (healthyInstances / totalInstances) * 100 : 0,
      status: service.status,
      lastHealthCheck: service.lastHealthCheck,
      uptime: Date.now() - service.registeredAt,
      metadata: service.metadata
    };
  }

  /**
   * Start health monitoring for all services
   */
  startHealthMonitoring() {
    setInterval(async () => {
      for (const [serviceName, service] of this.services) {
        await this.performHealthCheck(serviceName, service);
      }
    }, this.healthCheckInterval);
  }

  /**
   * Perform health check for a specific service
   */
  async performHealthCheck(serviceName, service) {
    const healthCheckPromises = service.instances.map(async (instanceUrl) => {
      try {
        const healthCheckUrl = `${instanceUrl}${service.healthCheck || '/health'}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(healthCheckUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'ServiceRegistry/1.0',
            'X-Health-Check': 'true'
          }
        });

        clearTimeout(timeoutId);

        const isHealthy = response.ok;
        await this.updateServiceHealth(serviceName, isHealthy, instanceUrl);

        return { instanceUrl, healthy: isHealthy, responseTime: Date.now() };
      } catch (error) {
        await this.updateServiceHealth(serviceName, false, instanceUrl);
        return { instanceUrl, healthy: false, error: error.message };
      }
    });

    try {
      const results = await Promise.allSettled(healthCheckPromises);
      const healthyCount = results.filter(r => 
        r.status === 'fulfilled' && r.value.healthy
      ).length;

      // Update overall service health
      const overallHealthy = healthyCount > 0; // At least one instance healthy
      await this.updateServiceHealth(serviceName, overallHealthy);

      // Emit health check results
      this.emit('healthCheckCompleted', {
        serviceName,
        results: results.map(r => r.status === 'fulfilled' ? r.value : { error: r.reason }),
        healthyCount,
        totalCount: service.instances.length
      });

    } catch (error) {
      logError(`Health check failed for ${serviceName}:`, error);
      await this.updateServiceHealth(serviceName, false);
    }
  }

  /**
   * Add a new instance to an existing service
   */
  async addServiceInstance(serviceName, instanceUrl, metadata = {}) {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }

    if (!service.instances.includes(instanceUrl)) {
      service.instances.push(instanceUrl);
      
      // Initialize health status for new instance
      if (!service.instanceHealth) {
        service.instanceHealth = {};
      }
      service.instanceHealth[instanceUrl] = {
        status: 'unknown',
        lastCheck: Date.now(),
        consecutiveFailures: 0,
        metadata
      };

      // Update in Redis
      await this.redis.hset(
        'services:registry',
        serviceName,
        JSON.stringify(service)
      );

      logDebug(`➕ Instance added to ${serviceName}: ${instanceUrl}`);
      this.emit('instanceAdded', { serviceName, instanceUrl, metadata });
    }
  }

  /**
   * Remove an instance from a service
   */
  async removeServiceInstance(serviceName, instanceUrl) {
    const service = this.services.get(serviceName);
    if (!service) return;

    const index = service.instances.indexOf(instanceUrl);
    if (index > -1) {
      service.instances.splice(index, 1);
      
      // Remove health data for the instance
      if (service.instanceHealth) {
        delete service.instanceHealth[instanceUrl];
      }

      // Update in Redis
      await this.redis.hset(
        'services:registry',
        serviceName,
        JSON.stringify(service)
      );

      logDebug(`➖ Instance removed from ${serviceName}: ${instanceUrl}`);
      this.emit('instanceRemoved', { serviceName, instanceUrl });
    }
  }

  /**
   * Get service discovery metrics
   */
  getRegistryMetrics() {
    const services = Array.from(this.services.values());
    const totalServices = services.length;
    const healthyServices = services.filter(s => s.status === 'healthy').length;
    const totalInstances = services.reduce((sum, s) => sum + s.instances.length, 0);
    const healthyInstances = services.reduce((sum, s) => {
      return sum + s.instances.filter(instance => {
        const health = s.instanceHealth?.[instance];
        return health?.status === 'healthy';
      }).length;
    }, 0);

    return {
      timestamp: new Date().toISOString(),
      services: {
        total: totalServices,
        healthy: healthyServices,
        unhealthy: totalServices - healthyServices,
        healthyPercentage: totalServices > 0 ? (healthyServices / totalServices) * 100 : 0
      },
      instances: {
        total: totalInstances,
        healthy: healthyInstances,
        unhealthy: totalInstances - healthyInstances,
        healthyPercentage: totalInstances > 0 ? (healthyInstances / totalInstances) * 100 : 0
      },
      registry: {
        memoryServices: this.services.size,
        lastHealthCheck: Math.max(...services.map(s => s.lastHealthCheck || 0))
      }
    };
  }

  /**
   * Clean up stale services
   */
  async cleanupStaleServices() {
    const now = Date.now();
    const staleCutoff = now - this.serviceTimeout;

    for (const [serviceName, service] of this.services) {
      if (service.lastHealthCheck < staleCutoff) {
        logDebug(`🧹 Cleaning up stale service: ${serviceName}`);
        await this.unregisterService(serviceName);
      }
    }
  }

  /**
   * Export service registry state
   */
  async exportRegistry() {
    return {
      timestamp: new Date().toISOString(),
      services: Object.fromEntries(this.services),
      metrics: this.getRegistryMetrics()
    };
  }

  /**
   * Import service registry state
   */
  async importRegistry(registryData) {
    if (registryData.services) {
      for (const [serviceName, serviceData] of Object.entries(registryData.services)) {
        await this.registerService(serviceName, serviceData);
      }
    }
  }
}

export default ServiceRegistry;

