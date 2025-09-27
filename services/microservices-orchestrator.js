import EventEmitter from 'events';
import redisCacheService from './redis-cache.js';
import { logDebug, logInfo, logWarn, logError } from '../src/utils/logger';


class MicroservicesOrchestrator extends EventEmitter {
  constructor() {
    super();
    this.services = new Map();
    this.serviceInstances = new Map();
    this.dependencies = new Map();
    this.healthChecks = new Map();
    this.loadBalancers = new Map();
    this.messageQueue = [];
    this.eventHandlers = new Map();
    this.metrics = {
      totalRequests: 0,
      errorCount: 0,
      responseTime: [],
      serviceUtilization: new Map()
    };
    
    this.setupEventHandlers();
    this.startHealthMonitoring();
  }

  // Service registration and discovery
  registerService(name, config) {
    const serviceConfig = {
      name,
      version: config.version || '1.0.0',
      instances: config.instances || 1,
      healthEndpoint: config.healthEndpoint || '/health',
      dependencies: config.dependencies || [],
      resources: {
        cpu: config.resources?.cpu || '100m',
        memory: config.resources?.memory || '128Mi',
        storage: config.resources?.storage || '1Gi'
      },
      scaling: {
        min: config.scaling?.min || 1,
        max: config.scaling?.max || 10,
        cpuThreshold: config.scaling?.cpuThreshold || 70,
        memoryThreshold: config.scaling?.memoryThreshold || 80
      },
      retry: {
        attempts: config.retry?.attempts || 3,
        backoff: config.retry?.backoff || 1000,
        timeout: config.retry?.timeout || 30000
      },
      circuitBreaker: {
        failureThreshold: config.circuitBreaker?.failureThreshold || 5,
        resetTimeout: config.circuitBreaker?.resetTimeout || 60000,
        state: 'closed',
        failures: 0,
        lastFailure: null
      },
      loadBalancer: {
        strategy: config.loadBalancer?.strategy || 'round-robin',
        stickySession: config.loadBalancer?.stickySession || false
      }
    };

    this.services.set(name, serviceConfig);
    this.dependencies.set(name, config.dependencies || []);
    
    // Initialize service instances
    this.initializeServiceInstances(name, serviceConfig);
    
    // Setup load balancer
    this.setupLoadBalancer(name, serviceConfig);
    
    logDebug(`Microservices: Registered service ${name} v${serviceConfig.version}`);
    this.emit('service:registered', { name, config: serviceConfig });
    
    return serviceConfig;
  }

  initializeServiceInstances(serviceName, config) {
    const instances = [];
    
    for (let i = 0; i < config.instances; i++) {
      const instance = {
        id: `${serviceName}-${i + 1}`,
        serviceName,
        status: 'starting',
        health: 'unknown',
        lastHealthCheck: null,
        requests: 0,
        errors: 0,
        responseTime: [],
        resources: {
          cpu: 0,
          memory: 0,
          connections: 0
        },
        metadata: {
          startTime: new Date().toISOString(),
          version: config.version,
          restartCount: 0
        }
      };
      
      instances.push(instance);
    }
    
    this.serviceInstances.set(serviceName, instances);
    
    // Simulate instance startup
    setTimeout(_() => {
      instances.forEach(instance => {
        instance.status = 'running';
        instance.health = 'healthy';
      });
      logDebug(`Microservices: ${serviceName} instances initialized`);
    }, 2000);
  }

  setupLoadBalancer(serviceName, config) {
    const loadBalancer = {
      serviceName,
      strategy: config.loadBalancer.strategy,
      currentIndex: 0,
      stickySession: config.loadBalancer.stickySession,
      sessionMap: new Map(),
      
      getNextInstance: (sessionId = _null) => {
        const instances = this.getHealthyInstances(serviceName);
        
        if (instances.length === 0) {
          throw new Error(`No healthy instances available for service ${serviceName}`);
        }
        
        // Sticky session routing
        if (this.stickySession && sessionId) {
          const stickyInstance = this.sessionMap.get(sessionId);
          if (stickyInstance && instances.includes(stickyInstance)) {
            return stickyInstance;
          }
        }
        
        let selectedInstance;
        
        switch (config.loadBalancer.strategy) {
          case 'round-robin':
            selectedInstance = instances[this.currentIndex % instances.length];
            this.currentIndex = (this.currentIndex + 1) % instances.length;
            break;
            
          case 'least-connections':
            selectedInstance = instances.reduce((min, current) => 
              current.resources.connections < min.resources.connections ? current : min
            );
            break;
            
          case 'weighted-round-robin':
            // Simple implementation - could be enhanced with actual weights
            selectedInstance = instances[Math.floor(Math.random() * instances.length)];
            break;
            
          case 'least-response-time':
            selectedInstance = instances.reduce(_(fastest, current) => {
              const avgResponseTime = current.responseTime.length > 0 
                ? current.responseTime.reduce((sum, _time) => sum + time, 0) / current.responseTime.length
                : 0;
              const fastestAvg = fastest.responseTime.length > 0
                ? fastest.responseTime.reduce((sum, _time) => sum + time, 0) / fastest.responseTime.length
                : 0;
              return avgResponseTime < fastestAvg ? current : fastest;
            });
            break;
            
          default:
            selectedInstance = instances[0];
        }
        
        // Store sticky session mapping
        if (this.stickySession && sessionId) {
          this.sessionMap.set(sessionId, selectedInstance);
        }
        
        return selectedInstance;
      }
    };
    
    this.loadBalancers.set(serviceName, loadBalancer);
  }

  // Service discovery
  discoverService(serviceName) {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }
    
    const instances = this.getHealthyInstances(serviceName);
    
    return {
      service: service.name,
      version: service.version,
      instances: instances.map(instance => ({
        id: instance.id,
        status: instance.status,
        health: instance.health,
        endpoint: `http://localhost:${5000 + parseInt(instance.id.split('-')[1])}`
      })),
      loadBalancer: this.loadBalancers.get(serviceName)
    };
  }

  // Request routing
  async routeRequest(serviceName, request, options = {}) {
    try {
      const service = this.services.get(serviceName);
      if (!service) {
        throw new Error(`Service ${serviceName} not found`);
      }

      // Circuit breaker check
      if (this.isCircuitOpen(service)) {
        throw new Error(`Circuit breaker open for service ${serviceName}`);
      }

      // Get instance using load balancer
      const loadBalancer = this.loadBalancers.get(serviceName);
      const instance = loadBalancer.getNextInstance(options.sessionId);
      
      // Execute request with retry logic
      const response = await this.executeRequestWithRetry(
        instance, 
        request, 
        service.retry
      );
      
      // Record metrics
      this.recordRequestMetrics(instance, response, true);
      this.resetCircuitBreakerFailures(service);
      
      return response;
      
    } catch (error) {
      logError(`Request routing failed for ${serviceName}:`, error.message);
      
      // Record failure metrics
      const service = this.services.get(serviceName);
      this.recordCircuitBreakerFailure(service);
      this.metrics.errorCount++;
      
      throw error;
    }
  }

  async executeRequestWithRetry(instance, request, retryConfig) {
    let lastError;
    
    for (let attempt = 1; attempt <= retryConfig.attempts; attempt++) {
      try {
        const startTime = Date.now();
        
        // Simulate request execution
        const response = await this.simulateRequest(instance, request);
        
        const responseTime = Date.now() - startTime;
        instance.responseTime.push(responseTime);
        
        // Keep only last 100 response times
        if (instance.responseTime.length > 100) {
          instance.responseTime = instance.responseTime.slice(-100);
        }
        
        return response;
        
      } catch (error) {
        lastError = error;
        
        if (attempt < retryConfig.attempts) {
          const backoffDelay = retryConfig.backoff * Math.pow(2, attempt - 1);
          logDebug(`Retry attempt ${attempt + 1} for ${instance.id} in ${backoffDelay}ms`);
          await this.sleep(backoffDelay);
        }
      }
    }
    
    throw lastError;
  }

  async simulateRequest(instance, request) {
    // Simulate request processing
    const processingTime = Math.random() * 500 + 100; // 100-600ms
    await this.sleep(processingTime);
    
    instance.requests++;
    instance.resources.connections++;
    
    // Simulate occasional failures
    if (Math.random() < 0.05) { // 5% failure rate
      instance.errors++;
      instance.resources.connections--;
      throw new Error('Simulated service error');
    }
    
    instance.resources.connections--;
    
    return {
      status: 200,
      data: {
        message: `Response from ${instance.id}`,
        timestamp: new Date().toISOString(),
        processingTime,
        request: request.path || '/unknown'
      }
    };
  }

  // Health monitoring
  startHealthMonitoring() {
    setInterval(async _() => {
      await this.performHealthChecks();
      await this.updateMetrics();
      await this.checkAutoScaling();
    }, 30000); // Every 30 seconds
  }

  async performHealthChecks() {
    for (const [serviceName, instances] of this.serviceInstances) {
      for (const instance of instances) {
        try {
          const isHealthy = await this.checkInstanceHealth(instance);
          
          instance.health = isHealthy ? 'healthy' : 'unhealthy';
          instance.lastHealthCheck = new Date().toISOString();
          
          if (!isHealthy && instance.status === 'running') {
            logWarn(`Health check failed for ${instance.id}`);
            this.emit('instance:unhealthy', { instance, serviceName });
          }
          
        } catch (error) {
          instance.health = 'unhealthy';
          instance.lastHealthCheck = new Date().toISOString();
          logError(`Health check error for ${instance.id}:`, error.message);
        }
      }
    }
  }

  async checkInstanceHealth(instance) {
    // Simulate health check
    const isHealthy = Math.random() > 0.02; // 98% healthy
    
    // Update resource usage
    instance.resources.cpu = Math.random() * 100;
    instance.resources.memory = Math.random() * 100;
    
    return isHealthy;
  }

  async updateMetrics() {
    for (const [serviceName, instances] of this.serviceInstances) {
      const serviceMetrics = {
        totalRequests: instances.reduce((sum, i) => sum + i.requests, 0),
        totalErrors: instances.reduce((sum, i) => sum + i.errors, 0),
        averageResponseTime: this.calculateAverageResponseTime(instances),
        healthyInstances: instances.filter(i => i.health === 'healthy').length,
        totalInstances: instances.length,
        cpuUsage: instances.reduce((sum, i) => sum + i.resources.cpu, 0) / instances.length,
        memoryUsage: instances.reduce((sum, i) => sum + i.resources.memory, 0) / instances.length
      };
      
      this.metrics.serviceUtilization.set(serviceName, serviceMetrics);
      
      // Cache metrics in Redis
      await redisCacheService.set(
        `microservices:metrics:${serviceName}`,
        serviceMetrics,
        300 // 5 minutes
      );
    }
  }

  calculateAverageResponseTime(instances) {
    const allResponseTimes = instances.flatMap(i => i.responseTime);
    return allResponseTimes.length > 0
      ? allResponseTimes.reduce((sum, _time) => sum + time, 0) / allResponseTimes.length
      : 0;
  }

  async checkAutoScaling() {
    for (const [serviceName, serviceConfig] of this.services) {
      const instances = this.serviceInstances.get(serviceName);
      const metrics = this.metrics.serviceUtilization.get(serviceName);
      
      if (!metrics) continue;
      
      const shouldScaleUp = (
        metrics.cpuUsage > serviceConfig.scaling.cpuThreshold ||
        metrics.memoryUsage > serviceConfig.scaling.memoryThreshold
      ) && instances.length < serviceConfig.scaling.max;
      
      const shouldScaleDown = (
        metrics.cpuUsage < serviceConfig.scaling.cpuThreshold * 0.5 &&
        metrics.memoryUsage < serviceConfig.scaling.memoryThreshold * 0.5
      ) && instances.length > serviceConfig.scaling.min;
      
      if (shouldScaleUp) {
        await this.scaleService(serviceName, 'up');
      } else if (shouldScaleDown) {
        await this.scaleService(serviceName, 'down');
      }
    }
  }

  async scaleService(serviceName, direction) {
    const instances = this.serviceInstances.get(serviceName);
    const serviceConfig = this.services.get(serviceName);
    
    if (direction === 'up' && instances.length < serviceConfig.scaling.max) {
      const newInstance = {
        id: `${serviceName}-${instances.length + 1}`,
        serviceName,
        status: 'starting',
        health: 'unknown',
        lastHealthCheck: null,
        requests: 0,
        errors: 0,
        responseTime: [],
        resources: { cpu: 0, memory: 0, connections: 0 },
        metadata: {
          startTime: new Date().toISOString(),
          version: serviceConfig.version,
          restartCount: 0
        }
      };
      
      instances.push(newInstance);
      
      // Simulate startup time
      setTimeout(_() => {
        newInstance.status = 'running';
        newInstance.health = 'healthy';
      }, 5000);
      
      logDebug(`Microservices: Scaled up ${serviceName} (${instances.length} instances)`);
      this.emit('service:scaled', { serviceName, direction: 'up', instances: instances.length });
      
    } else if (direction === 'down' && instances.length > serviceConfig.scaling.min) {
      const instanceToRemove = instances.pop();
      instanceToRemove.status = 'terminating';
      
      logDebug(`Microservices: Scaled down ${serviceName} (${instances.length} instances)`);
      this.emit('service:scaled', { serviceName, direction: 'down', instances: instances.length });
    }
  }

  // Circuit breaker logic
  isCircuitOpen(service) {
    const cb = service.circuitBreaker;
    
    if (cb.state === 'closed') return false;
    if (cb.state === 'half-open') return false;
    
    // Check if reset timeout has passed
    if (cb.state === 'open' && cb.lastFailure) {
      const timeSinceFailure = Date.now() - new Date(cb.lastFailure).getTime();
      if (timeSinceFailure > cb.resetTimeout) {
        cb.state = 'half-open';
        return false;
      }
    }
    
    return cb.state === 'open';
  }

  recordCircuitBreakerFailure(service) {
    const cb = service.circuitBreaker;
    cb.failures++;
    cb.lastFailure = new Date().toISOString();
    
    if (cb.failures >= cb.failureThreshold && cb.state === 'closed') {
      cb.state = 'open';
      logWarn(`Circuit breaker opened for service ${service.name}`);
      this.emit('circuit-breaker:opened', { service: service.name });
    }
  }

  resetCircuitBreakerFailures(service) {
    const cb = service.circuitBreaker;
    
    if (cb.state === 'half-open') {
      cb.state = 'closed';
      cb.failures = 0;
      logDebug(`Circuit breaker closed for service ${service.name}`);
      this.emit('circuit-breaker:closed', { service: service.name });
    } else if (cb.state === 'closed') {
      cb.failures = Math.max(0, cb.failures - 1);
    }
  }

  recordRequestMetrics(instance, response, success) {
    this.metrics.totalRequests++;
    
    if (!success) {
      this.metrics.errorCount++;
    }
    
    const responseTime = response.processingTime || 0;
    this.metrics.responseTime.push(responseTime);
    
    // Keep only last 1000 response times
    if (this.metrics.responseTime.length > 1000) {
      this.metrics.responseTime = this.metrics.responseTime.slice(-1000);
    }
  }

  // Utility methods
  getHealthyInstances(serviceName) {
    const instances = this.serviceInstances.get(serviceName) || [];
    return instances.filter(instance => 
      instance.status === 'running' && instance.health === 'healthy'
    );
  }

  getAllServices() {
    return Array.from(this.services.keys());
  }

  getServiceStatus(serviceName) {
    const service = this.services.get(serviceName);
    const instances = this.serviceInstances.get(serviceName) || [];
    const metrics = this.metrics.serviceUtilization.get(serviceName);
    
    if (!service) return null;
    
    return {
      name: serviceName,
      version: service.version,
      instances: {
        total: instances.length,
        healthy: instances.filter(i => i.health === 'healthy').length,
        running: instances.filter(i => i.status === 'running').length
      },
      circuitBreaker: service.circuitBreaker,
      metrics,
      dependencies: this.dependencies.get(serviceName)
    };
  }

  async getOverallStatus() {
    const services = {};
    
    for (const serviceName of this.services.keys()) {
      services[serviceName] = this.getServiceStatus(serviceName);
    }
    
    const totalInstances = Array.from(this.serviceInstances.values())
      .flatMap(instances => instances).length;
    
    const healthyInstances = Array.from(this.serviceInstances.values())
      .flatMap(instances => instances)
      .filter(instance => instance.health === 'healthy').length;
    
    return {
      status: healthyInstances === totalInstances ? 'healthy' : 'degraded',
      totalServices: this.services.size,
      totalInstances,
      healthyInstances,
      totalRequests: this.metrics.totalRequests,
      errorRate: this.metrics.totalRequests > 0 
        ? (this.metrics.errorCount / this.metrics.totalRequests * 100).toFixed(2)
        : 0,
      averageResponseTime: this.metrics.responseTime.length > 0
        ? (this.metrics.responseTime.reduce((sum, _time) => sum + time, 0) / this.metrics.responseTime.length).toFixed(2)
        : 0,
      services,
      timestamp: new Date().toISOString()
    };
  }

  setupEventHandlers() {
    this.on(_'service:registered', _(event) => {
      logDebug(`Event: Service ${event.name} registered`);
    });

    this.on(_'instance:unhealthy', _(event) => {
      logWarn(`Event: Instance ${event.instance.id} is unhealthy`);
    });

    this.on(_'service:scaled', _(event) => {
      logDebug(`Event: Service ${event.serviceName} scaled ${event.direction} to ${event.instances} instances`);
    });

    this.on(_'circuit-breaker:opened', _(event) => {
      logWarn(`Event: Circuit breaker opened for ${event.service}`);
    });

    this.on(_'circuit-breaker:closed', _(event) => {
      logDebug(`Event: Circuit breaker closed for ${event.service}`);
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

const microservicesOrchestrator = new MicroservicesOrchestrator();

export default microservicesOrchestrator;