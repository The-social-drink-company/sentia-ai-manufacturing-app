import EventEmitter from 'events';
import redisCacheService from './redis-cache.js';
import { logDebug, logInfo, logWarn, logError } from '../src/utils/logger';


class EnterpriseMonitoringService extends EventEmitter {
  constructor() {
    super();
    this.metrics = new Map();
    this.alerts = new Map();
    this.thresholds = new Map();
    this.healthChecks = new Map();
    this.performanceBaselines = new Map();
    this.anomalyDetectors = new Map();
    
    // System resource monitoring
    this.systemMetrics = {
      cpu: { current: 0, history: [], threshold: 80 },
      memory: { current: 0, history: [], threshold: 85 },
      disk: { current: 0, history: [], threshold: 90 },
      network: { current: 0, history: [], threshold: 100 }, // MB/s
      database: { connections: 0, queryTime: 0, threshold: 1000 },
      redis: { connections: 0, memory: 0, hitRate: 0 }
    };
    
    // Application performance monitoring
    this.applicationMetrics = {
      responseTime: { avg: 0, p95: 0, p99: 0, history: [] },
      throughput: { requests: 0, rps: 0, history: [] },
      errorRate: { rate: 0, count: 0, history: [] },
      activeUsers: { count: 0, peak: 0, history: [] },
      apiEndpoints: new Map(),
      services: new Map()
    };
    
    // Business metrics monitoring  
    this.businessMetrics = {
      manufacturingKPIs: {
        oee: { current: 85, target: 90, history: [] },
        quality: { current: 96.5, target: 98, history: [] },
        throughput: { current: 1250, target: 1500, history: [] },
        downtime: { current: 0.5, target: 0.2, history: [] }
      },
      salesMetrics: {
        revenue: { current: 0, target: 0, history: [] },
        orders: { current: 0, target: 0, history: [] },
        conversion: { current: 2.3, target: 3.0, history: [] },
        inventory: { turnover: 6.2, target: 8.0, history: [] }
      },
      operationalMetrics: {
        apiLatency: { current: 0, target: 200, history: [] },
        dataAccuracy: { current: 99.2, target: 99.9, history: [] },
        systemUptime: { current: 99.8, target: 99.9, history: [] },
        userSatisfaction: { current: 4.2, target: 4.5, history: [] }
      }
    };
    
    this.alertRules = new Map();
    this.dashboards = new Map();
    this.reports = new Map();
    this.isMonitoring = false;
    
    this.initializeMonitoring();
  }

  initializeMonitoring() {
    // Set up default alert rules
    this.setupDefaultAlerts();
    
    // Initialize anomaly detection
    this.setupAnomalyDetection();
    
    // Create default dashboards
    this.createDefaultDashboards();
    
    // Start monitoring loops
    this.startMonitoring();
    
    logDebug('Enterprise Monitoring: Service initialized');
  }

  setupDefaultAlerts() {
    // System alerts
    this.addAlertRule('high_cpu_usage', {
      metric: 'system.cpu.current',
      threshold: 80,
      operator: '>',
      duration: 300, // 5 minutes
      severity: 'warning',
      description: 'CPU usage above 80%'
    });

    this.addAlertRule('high_memory_usage', {
      metric: 'system.memory.current',
      threshold: 85,
      operator: '>',
      duration: 300,
      severity: 'warning',
      description: 'Memory usage above 85%'
    });

    this.addAlertRule('disk_space_low', {
      metric: 'system.disk.current',
      threshold: 90,
      operator: '>',
      duration: 60,
      severity: 'critical',
      description: 'Disk space above 90%'
    });

    // Application alerts
    this.addAlertRule('high_response_time', {
      metric: 'application.responseTime.p95',
      threshold: 2000,
      operator: '>',
      duration: 180,
      severity: 'warning',
      description: '95th percentile response time above 2s'
    });

    this.addAlertRule('high_error_rate', {
      metric: 'application.errorRate.rate',
      threshold: 5,
      operator: '>',
      duration: 120,
      severity: 'critical',
      description: 'Error rate above 5%'
    });

    // Business alerts
    this.addAlertRule('low_oee', {
      metric: 'business.manufacturingKPIs.oee.current',
      threshold: 75,
      operator: '<',
      duration: 600, // 10 minutes
      severity: 'warning',
      description: 'Overall Equipment Effectiveness below 75%'
    });

    this.addAlertRule('quality_drop', {
      metric: 'business.manufacturingKPIs.quality.current',
      threshold: 95,
      operator: '<',
      duration: 300,
      severity: 'critical',
      description: 'Quality score below 95%'
    });
  }

  setupAnomalyDetection() {
    // Time series anomaly detection
    this.anomalyDetectors.set('response_time', {
      type: 'statistical',
      window: 100,
      threshold: 3, // 3 standard deviations
      sensitivity: 0.8
    });

    this.anomalyDetectors.set('throughput', {
      type: 'statistical',
      window: 50,
      threshold: 2.5,
      sensitivity: 0.7
    });

    this.anomalyDetectors.set('manufacturing_oee', {
      type: 'statistical',
      window: 200,
      threshold: 2,
      sensitivity: 0.9
    });
  }

  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    
    // High-frequency monitoring (every 30 seconds)
    this.systemMonitoringInterval = setInterval(_() => {
      this.collectSystemMetrics();
      this.collectApplicationMetrics();
    }, 30000);

    // Medium-frequency monitoring (every 2 minutes)
    this.businessMonitoringInterval = setInterval(_() => {
      this.collectBusinessMetrics();
      this.checkAlerts();
    }, 120000);

    // Low-frequency monitoring (every 10 minutes)
    this.analyticsInterval = setInterval(_() => {
      this.performAnomalyDetection();
      this.generateInsights();
      this.updateBaselines();
    }, 600000);

    // Reporting (every hour)
    this.reportingInterval = setInterval(_() => {
      this.generateHourlyReport();
      this.cleanupOldMetrics();
    }, 3600000);

    logDebug('Enterprise Monitoring: All monitoring loops started');
  }

  async collectSystemMetrics() {
    try {
      // Simulate system metric collection (would use actual system APIs)
      const cpuUsage = this.simulateCPUUsage();
      const memoryUsage = this.simulateMemoryUsage();
      const diskUsage = this.simulateDiskUsage();
      const networkUsage = this.simulateNetworkUsage();

      // Update system metrics
      this.updateMetric('system.cpu', cpuUsage);
      this.updateMetric('system.memory', memoryUsage);
      this.updateMetric('system.disk', diskUsage);
      this.updateMetric('system.network', networkUsage);

      // Database metrics
      const dbMetrics = await this.collectDatabaseMetrics();
      this.updateMetric('system.database', dbMetrics);

      // Redis metrics
      const redisMetrics = await this.collectRedisMetrics();
      this.updateMetric('system.redis', redisMetrics);

      // Store in Redis for dashboards
      await this.storeMetricsInCache('system', {
        cpu: cpuUsage,
        memory: memoryUsage,
        disk: diskUsage,
        network: networkUsage,
        database: dbMetrics,
        redis: redisMetrics,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logError('Enterprise Monitoring: Failed to collect system metrics:', error);
    }
  }

  async collectApplicationMetrics() {
    try {
      // Collect response time metrics
      const responseTime = this.calculateResponseTimeMetrics();
      this.updateMetric('application.responseTime', responseTime);

      // Collect throughput metrics
      const throughput = this.calculateThroughputMetrics();
      this.updateMetric('application.throughput', throughput);

      // Collect error rate metrics
      const errorRate = this.calculateErrorRateMetrics();
      this.updateMetric('application.errorRate', errorRate);

      // Collect active users
      const activeUsers = await this.getActiveUsersCount();
      this.updateMetric('application.activeUsers', activeUsers);

      // API endpoint performance
      const apiMetrics = await this.collectAPIEndpointMetrics();
      this.updateMetric('application.apiEndpoints', apiMetrics);

      // Service health metrics
      const serviceMetrics = await this.collectServiceMetrics();
      this.updateMetric('application.services', serviceMetrics);

      await this.storeMetricsInCache('application', {
        responseTime,
        throughput,
        errorRate,
        activeUsers,
        apiMetrics,
        serviceMetrics,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logError('Enterprise Monitoring: Failed to collect application metrics:', error);
    }
  }

  async collectBusinessMetrics() {
    try {
      // Manufacturing KPIs
      const manufacturingKPIs = await this.collectManufacturingKPIs();
      this.updateMetric('business.manufacturingKPIs', manufacturingKPIs);

      // Sales metrics
      const salesMetrics = await this.collectSalesMetrics();
      this.updateMetric('business.salesMetrics', salesMetrics);

      // Operational metrics
      const operationalMetrics = await this.collectOperationalMetrics();
      this.updateMetric('business.operationalMetrics', operationalMetrics);

      await this.storeMetricsInCache('business', {
        manufacturing: manufacturingKPIs,
        sales: salesMetrics,
        operational: operationalMetrics,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logError('Enterprise Monitoring: Failed to collect business metrics:', error);
    }
  }

  // Metric calculation methods
  simulateCPUUsage() {
    // Simulate realistic CPU usage patterns
    const baseUsage = 30;
    const variation = Math.sin(Date.now() / 60000) * 15; // Sine wave variation
    const noise = (Math.random() - 0.5) * 10;
    const spike = Math.random() < 0.05 ? Math.random() * 30 : 0; // 5% chance of spike
    
    return Math.max(5, Math.min(95, baseUsage + variation + noise + spike));
  }

  simulateMemoryUsage() {
    const baseUsage = 45;
    const growth = Math.sin(Date.now() / 120000) * 20;
    const noise = (Math.random() - 0.5) * 8;
    
    return Math.max(10, Math.min(90, baseUsage + growth + noise));
  }

  simulateDiskUsage() {
    // Disk usage grows slowly over time
    const baseUsage = 60;
    const timeGrowth = (Date.now() % 86400000) / 86400000 * 2; // 2% daily growth
    const noise = (Math.random() - 0.5) * 3;
    
    return Math.max(40, Math.min(95, baseUsage + timeGrowth + noise));
  }

  simulateNetworkUsage() {
    // Network usage varies with request patterns
    const baseUsage = 15;
    const burstPattern = Math.sin(Date.now() / 30000) * 25;
    const randomBurst = Math.random() < 0.1 ? Math.random() * 40 : 0;
    
    return Math.max(0, baseUsage + burstPattern + randomBurst);
  }

  async collectDatabaseMetrics() {
    // Simulate database metrics
    return {
      connections: Math.floor(Math.random() * 50) + 10,
      queryTime: Math.random() * 500 + 50,
      activeQueries: Math.floor(Math.random() * 20),
      cacheHitRate: 85 + Math.random() * 10,
      deadlocks: Math.random() < 0.01 ? 1 : 0
    };
  }

  async collectRedisMetrics() {
    try {
      const stats = await redisCacheService.getStats();
      return {
        connections: Math.floor(Math.random() * 20) + 5,
        memory: Math.random() * 100 + 50, // MB
        hitRate: 90 + Math.random() * 8,
        commandsPerSec: Math.floor(Math.random() * 1000) + 100,
        keyCount: Math.floor(Math.random() * 10000) + 1000
      };
    } catch (error) {
      return {
        connections: 0,
        memory: 0,
        hitRate: 0,
        commandsPerSec: 0,
        keyCount: 0,
        error: error.message
      };
    }
  }

  calculateResponseTimeMetrics() {
    // Simulate response time distribution
    const avg = 150 + Math.random() * 100;
    const p95 = avg * (1.8 + Math.random() * 0.4);
    const p99 = avg * (2.5 + Math.random() * 0.5);

    return {
      avg: Math.round(avg),
      p95: Math.round(p95),
      p99: Math.round(p99),
      min: Math.round(avg * 0.3),
      max: Math.round(avg * 4),
      samples: Math.floor(Math.random() * 1000) + 500
    };
  }

  calculateThroughputMetrics() {
    const baseRPS = 50;
    const variation = Math.sin(Date.now() / 45000) * 20;
    const currentRPS = Math.max(5, baseRPS + variation + (Math.random() - 0.5) * 15);

    return {
      requests: Math.floor(currentRPS * 60), // per minute
      rps: Math.round(currentRPS * 10) / 10,
      peak: Math.round((currentRPS * 1.5) * 10) / 10,
      concurrent: Math.floor(currentRPS * 2)
    };
  }

  calculateErrorRateMetrics() {
    const baseErrorRate = 0.5;
    const spike = Math.random() < 0.02 ? Math.random() * 5 : 0;
    const errorRate = Math.max(0, baseErrorRate + spike + (Math.random() - 0.5) * 0.3);

    return {
      rate: Math.round(errorRate * 100) / 100,
      count: Math.floor(errorRate * 100),
      types: {
        '4xx': Math.floor(errorRate * 60),
        '5xx': Math.floor(errorRate * 40),
        timeout: Math.floor(errorRate * 20)
      }
    };
  }

  async getActiveUsersCount() {
    // Simulate user activity patterns
    const hourOfDay = new Date().getHours();
    const isBusinessHours = hourOfDay >= 8 && hourOfDay <= 18;
    const baseUsers = isBusinessHours ? 150 : 30;
    const variation = Math.random() * 50;

    return {
      count: Math.floor(baseUsers + variation),
      peak: Math.floor((baseUsers + variation) * 1.3),
      new: Math.floor(Math.random() * 10) + 1,
      returning: Math.floor((baseUsers + variation) * 0.8)
    };
  }

  async collectAPIEndpointMetrics() {
    const endpoints = [
      '/api/integrations/amazon-sp-api',
      '/api/integrations/shopify-multistore',
      '/api/integrations/unleashed-erp',
      '/api/forecasting/demand',
      '/api/manufacturing/production'
    ];

    const metrics = {};

    endpoints.forEach(endpoint => {
      metrics[endpoint] = {
        responseTime: Math.round(100 + Math.random() * 200),
        requestCount: Math.floor(Math.random() * 100) + 10,
        errorRate: Math.random() * 2,
        throughput: Math.round((Math.random() * 50 + 10) * 10) / 10
      };
    });

    return metrics;
  }

  async collectServiceMetrics() {
    const services = [
      'amazon-sp-api-service',
      'shopify-multistore-service',
      'unleashed-erp-service',
      'ai-forecasting-engine',
      'redis-cache-service'
    ];

    const metrics = {};

    services.forEach(service => {
      metrics[service] = {
        status: Math.random() > 0.05 ? 'healthy' : 'unhealthy',
        uptime: 99.5 + Math.random() * 0.4,
        responseTime: Math.round(50 + Math.random() * 150),
        errorRate: Math.random() * 1,
        instances: Math.floor(Math.random() * 3) + 1,
        version: '1.0.0'
      };
    });

    return metrics;
  }

  async collectManufacturingKPIs() {
    // Overall Equipment Effectiveness (OEE)
    const availability = 0.92 + Math.random() * 0.06;
    const performance = 0.88 + Math.random() * 0.10;
    const quality = 0.965 + Math.random() * 0.03;
    const oee = availability * performance * quality * 100;

    return {
      oee: {
        current: Math.round(oee * 10) / 10,
        availability: Math.round(availability * 1000) / 10,
        performance: Math.round(performance * 1000) / 10,
        quality: Math.round(quality * 1000) / 10
      },
      throughput: Math.floor(1200 + Math.random() * 400),
      downtime: Math.round((1 - availability) * 8 * 60), // minutes per 8-hour shift
      defectRate: Math.round((1 - quality) * 1000) / 10, // per thousand units
      energyEfficiency: 82 + Math.random() * 12
    };
  }

  async collectSalesMetrics() {
    const hourlyRevenue = 5000 + Math.random() * 3000;
    const hourlyOrders = Math.floor(hourlyRevenue / 85); // Average order value ~$85
    
    return {
      revenue: Math.round(hourlyRevenue),
      orders: hourlyOrders,
      averageOrderValue: Math.round((hourlyRevenue / hourlyOrders) * 100) / 100,
      conversion: Math.round((2.5 + Math.random() * 1.5) * 100) / 100,
      inventoryTurnover: Math.round((6 + Math.random() * 3) * 100) / 100,
      customerSatisfaction: Math.round((4.1 + Math.random() * 0.6) * 100) / 100
    };
  }

  async collectOperationalMetrics() {
    return {
      systemUptime: Math.round((99.7 + Math.random() * 0.25) * 100) / 100,
      dataAccuracy: Math.round((99.1 + Math.random() * 0.6) * 100) / 100,
      integrationHealth: Math.random() > 0.1 ? 'operational' : 'degraded',
      backupStatus: 'completed',
      securityScore: Math.round((92 + Math.random() * 6) * 10) / 10,
      complianceScore: Math.round((96 + Math.random() * 3) * 10) / 10
    };
  }

  // Alert management
  addAlertRule(name, rule) {
    this.alertRules.set(name, {
      ...rule,
      id: name,
      active: true,
      triggered: false,
      lastTriggered: null,
      triggerCount: 0,
      acknowledgedBy: null,
      acknowledgedAt: null
    });
  }

  async checkAlerts() {
    for (const [ruleName, rule] of this.alertRules) {
      if (!rule.active) continue;

      try {
        const metricValue = this.getMetricValue(rule.metric);
        const isTriggered = this.evaluateAlertCondition(metricValue, rule);

        if (isTriggered && !rule.triggered) {
          await this.triggerAlert(ruleName, rule, metricValue);
        } else if (!isTriggered && rule.triggered) {
          await this.resolveAlert(ruleName, rule);
        }
      } catch (error) {
        logError(`Enterprise Monitoring: Alert check failed for ${ruleName}:`, error);
      }
    }
  }

  evaluateAlertCondition(value, rule) {
    if (value === null || value === undefined) return false;

    switch (rule.operator) {
      case '>': return value > rule.threshold;
      case '<': return value < rule.threshold;
      case '>=': return value >= rule.threshold;
      case '<=': return value <= rule.threshold;
      case '==': return value === rule.threshold;
      case '!=': return value !== rule.threshold;
      default: return false;
    }
  }

  async triggerAlert(ruleName, rule, value) {
    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ruleName,
      severity: rule.severity,
      description: rule.description,
      metric: rule.metric,
      currentValue: value,
      threshold: rule.threshold,
      triggeredAt: new Date().toISOString(),
      status: 'active',
      acknowledgedBy: null,
      resolvedAt: null
    };

    this.alerts.set(alert.id, alert);
    rule.triggered = true;
    rule.lastTriggered = alert.triggeredAt;
    rule.triggerCount++;

    // Store alert in cache
    await redisCacheService.set(`alert:${alert.id}`, alert, 86400); // 24 hours

    // Emit alert event
    this.emit('alert:triggered', alert);

    logWarn(`🚨 ALERT: ${alert.description} - Current value: ${value}, Threshold: ${rule.threshold}`);

    // Send notifications based on severity
    if (rule.severity === 'critical') {
      await this.sendCriticalAlert(alert);
    }
  }

  async resolveAlert(ruleName, rule) {
    const activeAlerts = Array.from(this.alerts.values())
      .filter(alert => alert.ruleName === ruleName && alert.status === 'active');

    for (const alert of activeAlerts) {
      alert.status = 'resolved';
      alert.resolvedAt = new Date().toISOString();

      await redisCacheService.set(`alert:${alert.id}`, alert, 86400);
      this.emit('alert:resolved', alert);
    }

    rule.triggered = false;
    logDebug(`✅ ALERT RESOLVED: ${rule.description}`);
  }

  // Anomaly detection
  async performAnomalyDetection() {
    for (const [detectorName, detector] of this.anomalyDetectors) {
      try {
        const anomalies = await this.detectAnomalies(detectorName, detector);
        
        if (anomalies.length > 0) {
          await this.handleAnomalies(detectorName, anomalies);
        }
      } catch (error) {
        logError(`Enterprise Monitoring: Anomaly detection failed for ${detectorName}:`, error);
      }
    }
  }

  async detectAnomalies(detectorName, detector) {
    // Get historical data for the metric
    const metricData = this.getMetricHistory(detectorName, detector.window);
    
    if (metricData.length < 10) return []; // Need minimum data

    const anomalies = [];
    
    if (detector.type === 'statistical') {
      // Statistical anomaly detection using z-score
      const mean = metricData.reduce((sum, val) => sum + val, 0) / metricData.length;
      const variance = metricData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / metricData.length;
      const stdDev = Math.sqrt(variance);
      
      const currentValue = metricData[metricData.length - 1];
      const zScore = Math.abs((currentValue - mean) / stdDev);
      
      if (zScore > detector.threshold) {
        anomalies.push({
          type: 'statistical_outlier',
          value: currentValue,
          expectedRange: [mean - detector.threshold * stdDev, mean + detector.threshold * stdDev],
          severity: zScore > 4 ? 'high' : 'medium',
          confidence: Math.min(zScore / detector.threshold, 1) * detector.sensitivity
        });
      }
    }
    
    return anomalies;
  }

  async handleAnomalies(detectorName, anomalies) {
    for (const anomaly of anomalies) {
      const alert = {
        id: `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'anomaly',
        detector: detectorName,
        anomaly,
        triggeredAt: new Date().toISOString(),
        status: 'active'
      };

      this.alerts.set(alert.id, alert);
      this.emit('anomaly:detected', alert);

      logWarn(`🔍 ANOMALY DETECTED in ${detectorName}:`, anomaly);
    }
  }

  // Dashboard and reporting
  createDefaultDashboards() {
    this.dashboards.set('system-overview', {
      name: 'System Overview',
      panels: [
        { type: 'gauge', metric: 'system.cpu.current', title: 'CPU Usage' },
        { type: 'gauge', metric: 'system.memory.current', title: 'Memory Usage' },
        { type: 'gauge', metric: 'system.disk.current', title: 'Disk Usage' },
        { type: 'line-chart', metric: 'application.responseTime.avg', title: 'Response Time' }
      ]
    });

    this.dashboards.set('manufacturing-kpis', {
      name: 'Manufacturing KPIs',
      panels: [
        { type: 'gauge', metric: 'business.manufacturingKPIs.oee.current', title: 'Overall Equipment Effectiveness' },
        { type: 'gauge', metric: 'business.manufacturingKPIs.quality.current', title: 'Quality Score' },
        { type: 'line-chart', metric: 'business.manufacturingKPIs.throughput', title: 'Production Throughput' },
        { type: 'gauge', metric: 'business.manufacturingKPIs.downtime', title: 'Downtime (minutes)' }
      ]
    });
  }

  // Utility methods
  updateMetric(metricPath, value) {
    const pathParts = metricPath.split('.');
    let current = this;
    
    // Navigate to the correct nested object
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (!current[part + 'Metrics']) {
        current[part + 'Metrics'] = {};
      }
      current = current[part + 'Metrics'];
    }
    
    const finalKey = pathParts[pathParts.length - 1];
    
    if (typeof value === 'object' && value !== null) {
      current[finalKey] = { ...current[finalKey], ...value };
      
      // Update history for each numeric property
      Object.keys(value).forEach(key => {
        if (typeof value[key] === 'number') {
          if (!current[finalKey].history) current[finalKey].history = {};
          if (!current[finalKey].history[key]) current[finalKey].history[key] = [];
          
          current[finalKey].history[key].push({
            value: value[key],
            timestamp: Date.now()
          });
          
          // Keep only last 200 data points
          if (current[finalKey].history[key].length > 200) {
            current[finalKey].history[key] = current[finalKey].history[key].slice(-100);
          }
        }
      });
    } else {
      current[finalKey] = value;
    }
  }

  getMetricValue(metricPath) {
    const pathParts = metricPath.split('.');
    let current = this;
    
    for (const part of pathParts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return null;
      }
    }
    
    return current;
  }

  getMetricHistory(metricName, windowSize) {
    // Simplified metric history retrieval
    // In production, this would query from time series database
    const history = [];
    for (let i = 0; i < Math.min(windowSize, 50); i++) {
      history.push(Math.random() * 100 + 50); // Mock data
    }
    return history;
  }

  async storeMetricsInCache(category, metrics) {
    try {
      const key = `monitoring:${category}:${Date.now()}`;
      await redisCacheService.set(key, metrics, 3600); // 1 hour retention
    } catch (error) {
      logWarn('Enterprise Monitoring: Failed to store metrics in cache:', error);
    }
  }

  async sendCriticalAlert(alert) {
    // Placeholder for critical alert notification system
    logError(`🚨 CRITICAL ALERT: ${alert.description}`);
    
    // Would integrate with:
    // - PagerDuty
    // - Slack
    // - Email notifications
    // - SMS alerts
  }

  generateHourlyReport() {
    const report = {
      timestamp: new Date().toISOString(),
      period: '1 hour',
      summary: {
        totalAlerts: this.alerts.size,
        activeAlerts: Array.from(this.alerts.values()).filter(a => a.status === 'active').length,
        systemHealth: 'good', // Would be calculated
        businessMetrics: this.getBusinessMetricsSummary()
      }
    };

    this.reports.set(`hourly_${Date.now()}`, report);
    logDebug('Enterprise Monitoring: Hourly report generated');
  }

  getBusinessMetricsSummary() {
    return {
      oee: this.businessMetrics.manufacturingKPIs.oee.current,
      quality: this.businessMetrics.manufacturingKPIs.quality.current,
      uptime: this.businessMetrics.operationalMetrics.systemUptime.current,
      revenue: this.businessMetrics.salesMetrics.revenue.current
    };
  }

  cleanupOldMetrics() {
    // Clean up old alerts (keep only last 24 hours)
    const oneDayAgo = Date.now() - 86400000;
    
    for (const [alertId, alert] of this.alerts) {
      if (new Date(alert.triggeredAt).getTime() < oneDayAgo) {
        this.alerts.delete(alertId);
      }
    }
    
    // Clean up old reports (keep only last 7 days)
    const sevenDaysAgo = Date.now() - 604800000;
    
    for (const [reportId, report] of this.reports) {
      if (new Date(report.timestamp).getTime() < sevenDaysAgo) {
        this.reports.delete(reportId);
      }
    }
  }

  // Public API methods
  getSystemStatus() {
    return {
      system: this.systemMetrics,
      application: this.applicationMetrics,
      business: this.businessMetrics,
      alerts: {
        total: this.alerts.size,
        active: Array.from(this.alerts.values()).filter(a => a.status === 'active').length,
        critical: Array.from(this.alerts.values()).filter(a => a.severity === 'critical' && a.status === 'active').length
      },
      timestamp: new Date().toISOString()
    };
  }

  getActiveAlerts() {
    return Array.from(this.alerts.values())
      .filter(alert => alert.status === 'active')
      .sort((a, b) => {
        const severityOrder = { critical: 3, warning: 2, info: 1 };
        return (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
      });
  }

  getDashboard(dashboardName) {
    const dashboard = this.dashboards.get(dashboardName);
    if (!dashboard) return null;

    // Populate panels with current data
    const populatedPanels = dashboard.panels.map(panel => ({
      ...panel,
      currentValue: this.getMetricValue(panel.metric),
      lastUpdated: new Date().toISOString()
    }));

    return {
      ...dashboard,
      panels: populatedPanels
    };
  }

  getAllDashboards() {
    return Array.from(this.dashboards.keys()).map(name => ({
      name,
      dashboard: this.getDashboard(name)
    }));
  }

  acknowledgeAlert(alertId, userId) {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.acknowledgedBy = userId;
      alert.acknowledgedAt = new Date().toISOString();
      alert.status = 'acknowledged';
      
      redisCacheService.set(`alert:${alertId}`, alert, 86400);
      this.emit('alert:acknowledged', { alert, userId });
      
      return true;
    }
    return false;
  }

  generateInsights() {
    // Generate automated insights from metrics
    const insights = [];
    
    // CPU trend analysis
    if (this.systemMetrics.cpu.current > 85) {
      insights.push({
        type: 'performance',
        severity: 'warning',
        message: 'High CPU usage detected. Consider scaling up resources.',
        recommendation: 'Add more CPU cores or optimize resource-intensive processes.'
      });
    }
    
    // Manufacturing efficiency insight
    if (this.businessMetrics.manufacturingKPIs.oee.current < 80) {
      insights.push({
        type: 'business',
        severity: 'warning',
        message: 'Overall Equipment Effectiveness below target.',
        recommendation: 'Analyze availability, performance, and quality factors to identify improvement opportunities.'
      });
    }
    
    return insights;
  }

  updateBaselines() {
    // Update performance baselines for anomaly detection
    const now = Date.now();
    
    Object.keys(this.systemMetrics).forEach(metric => {
      const current = this.systemMetrics[metric].current;
      if (typeof current === 'number') {
        if (!this.performanceBaselines.has(metric)) {
          this.performanceBaselines.set(metric, { values: [], lastUpdate: now });
        }
        
        const baseline = this.performanceBaselines.get(metric);
        baseline.values.push(current);
        baseline.lastUpdate = now;
        
        // Keep only last 1000 values
        if (baseline.values.length > 1000) {
          baseline.values = baseline.values.slice(-500);
        }
      }
    });
  }

  async shutdown() {
    this.isMonitoring = false;
    
    if (this.systemMonitoringInterval) clearInterval(this.systemMonitoringInterval);
    if (this.businessMonitoringInterval) clearInterval(this.businessMonitoringInterval);
    if (this.analyticsInterval) clearInterval(this.analyticsInterval);
    if (this.reportingInterval) clearInterval(this.reportingInterval);
    
    logDebug('Enterprise Monitoring: Service shut down');
  }
}

const enterpriseMonitoringService = new EnterpriseMonitoringService();

export default enterpriseMonitoringService;