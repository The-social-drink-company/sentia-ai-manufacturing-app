import client from 'prom-client';
import { logWarn, logError } from '../observability/structuredLogger.js';

// SLO Definitions
const SLO_TARGETS = {
  DATA_FRESHNESS_MINUTES: parseInt(process.env.SLO_DATA_FRESHNESS_MINUTES) || 30,
  FORECAST_SUCCESS_PCT: parseInt(process.env.SLO_FORECAST_SUCCESS_PCT) || 99,
  WC_RECENCY_HOURS: parseInt(process.env.SLO_WC_RECENCY_HOURS) || 24,
  API_LATENCY_P95_MS: parseInt(process.env.SLO_API_LATENCY_P95_MS) || 500,
  ERROR_RATE_THRESHOLD: parseFloat(process.env.SLO_ERROR_RATE_THRESHOLD) || 0.01,
  AVAILABILITY_PCT: parseFloat(process.env.SLO_AVAILABILITY_PCT) || 99.9
};

// SLO Metrics
const sloMetrics = {
  // Data freshness gauge
  dataFreshness: new client.Gauge({
    name: 'slo_data_freshness_minutes',
    help: 'Time since last data sync in minutes',
    labelNames: ['source', 'entity']
  }),
  
  // Forecast job success rate
  forecastJobs: new client.Counter({
    name: 'slo_forecast_jobs_total',
    help: 'Total forecast jobs',
    labelNames: ['status', 'type']
  }),
  
  // Working capital recency
  wcLastUpdate: new client.Gauge({
    name: 'slo_working_capital_last_update_timestamp',
    help: 'Timestamp of last working capital calculation',
    labelNames: ['entity', 'type']
  }),
  
  // API latency histogram
  apiLatency: new client.Histogram({
    name: 'slo_api_latency_ms',
    help: 'API request latency in milliseconds',
    labelNames: ['endpoint', 'method'],
    buckets: [10, 25, 50, 100, 250, 500, 1000, 2500, 5000]
  }),
  
  // Error budget consumption
  errorBudget: new client.Gauge({
    name: 'slo_error_budget_consumed_percent',
    help: 'Percentage of error budget consumed',
    labelNames: ['service', 'window']
  }),
  
  // SLO compliance
  sloCompliance: new client.Gauge({
    name: 'slo_compliance_percent',
    help: 'SLO compliance percentage',
    labelNames: ['slo_name', 'window']
  }),
  
  // Business metrics
  businessEvents: new client.Counter({
    name: 'business_events_total',
    help: 'Business events counter',
    labelNames: ['event_type', 'entity', 'status']
  }),
  
  // Queue metrics for SLO
  queueDepth: new client.Gauge({
    name: 'slo_queue_depth',
    help: 'Current queue depth',
    labelNames: ['queue_name', 'priority']
  }),
  
  queueLatency: new client.Histogram({
    name: 'slo_queue_processing_latency_ms',
    help: 'Queue job processing latency',
    labelNames: ['queue_name', 'job_type'],
    buckets: [100, 500, 1000, 5000, 10000, 30000, 60000]
  })
};

// Register all SLO metrics
Object.values(sloMetrics).forEach(metric => {
  client.register.registerMetric(metric);
});

// SLO Tracking class
export class SLOTracker {
  constructor() {
    this.measurements = new Map();
    this.startTracking();
  }
  
  startTracking() {
    // Update SLO compliance every minute
    setInterval(() => this.calculateSLOCompliance(), 60000);
    
    // Update error budget every 5 minutes
    setInterval(() => this.calculateErrorBudget(), 300000);
  }
  
  // Track data freshness
  recordDataSync(source, entity, timestamp = Date.now()) {
    const ageMinutes = (Date.now() - timestamp) / 60000;
    sloMetrics.dataFreshness.set({ source, entity }, ageMinutes);
    
    // Check SLO violation
    if (ageMinutes > SLO_TARGETS.DATA_FRESHNESS_MINUTES) {
      this.recordSLOViolation('data_freshness', {
        source,
        entity,
        ageMinutes,
        target: SLO_TARGETS.DATA_FRESHNESS_MINUTES
      });
    }
  }
  
  // Track forecast jobs
  recordForecastJob(status, type = 'default') {
    sloMetrics.forecastJobs.inc({ status, type });
    
    // Update success rate
    this.updateForecastSuccessRate();
  }
  
  // Track working capital updates
  recordWCUpdate(entity, type = 'calculation') {
    const timestamp = Date.now();
    sloMetrics.wcLastUpdate.set({ entity, type }, timestamp);
    
    // Check if update is overdue
    const hoursSinceUpdate = (Date.now() - timestamp) / 3600000;
    if (hoursSinceUpdate > SLO_TARGETS.WC_RECENCY_HOURS) {
      this.recordSLOViolation('wc_recency', {
        entity,
        hoursSinceUpdate,
        target: SLO_TARGETS.WC_RECENCY_HOURS
      });
    }
  }
  
  // Track API latency
  recordApiLatency(endpoint, method, latencyMs) {
    sloMetrics.apiLatency.observe({ endpoint, method }, latencyMs);
  }
  
  // Track business events
  recordBusinessEvent(eventType, entity, status = 'success') {
    sloMetrics.businessEvents.inc({ event_type: eventType, entity, status });
  }
  
  // Track queue metrics
  recordQueueDepth(queueName, depth, priority = 'normal') {
    sloMetrics.queueDepth.set({ queue_name: queueName, priority }, depth);
    
    // Alert on high queue depth
    const threshold = parseInt(process.env.QUEUE_ALERT_DEPTH) || 500;
    if (depth > threshold) {
      logWarn('High queue depth detected', {
        queueName,
        depth,
        threshold,
        priority
      });
    }
  }
  
  recordQueueLatency(queueName, jobType, latencyMs) {
    sloMetrics.queueLatency.observe({ queue_name: queueName, job_type: jobType }, latencyMs);
  }
  
  // Record SLO violation
  recordSLOViolation(sloName, details) {
    logWarn('SLO violation detected', {
      sloName,
      ...details,
      timestamp: new Date().toISOString()
    });
    
    // Send alert if configured
    this.sendSLOAlert(sloName, details);
  }
  
  // Calculate forecast success rate
  async updateForecastSuccessRate() {
    try {
      // Get metrics from last hour
      const metrics = await client.register.getSingleMetricAsString('slo_forecast_jobs_total');
      // Parse and calculate success rate
      // This would need actual implementation based on your metrics storage
      const successRate = 99.5; // Placeholder
      
      sloMetrics.sloCompliance.set(
        { slo_name: 'forecast_success_rate', window: '1h' },
        successRate
      );
      
      if (successRate < SLO_TARGETS.FORECAST_SUCCESS_PCT) {
        this.recordSLOViolation('forecast_success_rate', {
          currentRate: successRate,
          target: SLO_TARGETS.FORECAST_SUCCESS_PCT
        });
      }
    } catch (error) {
      logError('Failed to calculate forecast success rate', error);
    }
  }
  
  // Calculate error budget
  async calculateErrorBudget() {
    try {
      // Calculate based on error rate over time windows
      const windows = ['5m', '1h', '24h'];
      
      for (const window of windows) {
        // This would need actual implementation based on your metrics
        const errorRate = 0.005; // Placeholder
        const budgetConsumed = (errorRate / SLO_TARGETS.ERROR_RATE_THRESHOLD) * 100;
        
        sloMetrics.errorBudget.set(
          { service: 'api', window },
          Math.min(budgetConsumed, 100)
        );
        
        if (budgetConsumed > 80) {
          logWarn('Error budget consumption high', {
            window,
            budgetConsumed,
            errorRate
          });
        }
      }
    } catch (error) {
      logError('Failed to calculate error budget', error);
    }
  }
  
  // Calculate overall SLO compliance
  async calculateSLOCompliance() {
    const slos = [
      { name: 'data_freshness', check: this.checkDataFreshness },
      { name: 'forecast_success', check: this.checkForecastSuccess },
      { name: 'wc_recency', check: this.checkWCRecency },
      { name: 'api_latency', check: this.checkApiLatency },
      { name: 'error_rate', check: this.checkErrorRate }
    ];
    
    for (const slo of slos) {
      try {
        const compliance = await slo.check.call(this);
        sloMetrics.sloCompliance.set(
          { slo_name: slo.name, window: '24h' },
          compliance
        );
      } catch (error) {
        logError(`Failed to calculate SLO compliance for ${slo.name}`, error);
      }
    }
  }
  
  // Individual SLO checks (simplified implementations)
  async checkDataFreshness() {
    // Implementation would check actual metrics
    return 99.5;
  }
  
  async checkForecastSuccess() {
    return 99.8;
  }
  
  async checkWCRecency() {
    return 100;
  }
  
  async checkApiLatency() {
    return 98.5;
  }
  
  async checkErrorRate() {
    return 99.95;
  }
  
  // Send SLO alert
  async sendSLOAlert(sloName, details) {
    const webhookUrl = process.env.ALERT_WEBHOOK_URL;
    if (!webhookUrl) return;
    
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alert: 'SLO Violation',
          slo: sloName,
          details,
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV,
          severity: this.getSeverity(sloName)
        })
      });
    } catch (error) {
      logError('Failed to send SLO alert', error);
    }
  }
  
  getSeverity(sloName) {
    const criticalSLOs = ['data_freshness', 'forecast_success'];
    return criticalSLOs.includes(sloName) ? 'critical' : 'warning';
  }
  
  // Get SLO dashboard data
  getSLODashboard() {
    return {
      targets: SLO_TARGETS,
      compliance: {
        dataFreshness: this.measurements.get('data_freshness') || 100,
        forecastSuccess: this.measurements.get('forecast_success') || 100,
        wcRecency: this.measurements.get('wc_recency') || 100,
        apiLatency: this.measurements.get('api_latency') || 100,
        errorRate: this.measurements.get('error_rate') || 100
      },
      violations: Array.from(this.measurements.entries())
        .filter(([_, value]) => value < 100)
        .map(([name, value]) => ({ name, compliance: value }))
    };
  }
}

// Regional performance tracking
export class RegionalMetrics {
  constructor() {
    this.latencyMetrics = new client.Histogram({
      name: 'regional_latency_ms',
      help: 'Regional latency measurements',
      labelNames: ['region', 'endpoint', 'type'],
      buckets: [10, 25, 50, 100, 250, 500, 1000, 2500, 5000]
    });
    
    client.register.registerMetric(this.latencyMetrics);
  }
  
  recordLatency(region, endpoint, latencyMs, type = 'api') {
    this.latencyMetrics.observe({ region, endpoint, type }, latencyMs);
    
    // Check regional performance targets
    const targets = {
      EU: 100,
      US: 150,
      APAC: 200
    };
    
    if (latencyMs > (targets[region] || 200)) {
      logWarn('Regional latency exceeded target', {
        region,
        endpoint,
        latencyMs,
        target: targets[region]
      });
    }
  }
  
  recordClientLatency(req, latencyMs) {
    // Determine region from request
    const region = this.getRegionFromRequest(req);
    const endpoint = 'dashboard_load';
    
    this.recordLatency(region, endpoint, latencyMs, 'rum');
  }
  
  getRegionFromRequest(req) {
    // Simple region detection based on headers or IP
    const cfCountry = req.headers['cf-ipcountry'];
    const regionalHint = req.headers['x-region-hint'] || process.env.REGIONAL_HINT;
    
    if (regionalHint) return regionalHint;
    
    // Map countries to regions
    const regionMap = {
      US: 'US', CA: 'US', MX: 'US',
      GB: 'EU', DE: 'EU', FR: 'EU', IT: 'EU', ES: 'EU',
      JP: 'APAC', CN: 'APAC', AU: 'APAC', IN: 'APAC'
    };
    
    return regionMap[cfCountry] || 'UNKNOWN';
  }
}

// Create singleton instances
export const sloTracker = new SLOTracker();
export const regionalMetrics = new RegionalMetrics();

// Express middleware for SLO tracking
export const sloMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const endpoint = req.route?.path || req.path;
    const method = req.method;
    
    // Track API latency for SLO
    sloTracker.recordApiLatency(endpoint, method, duration);
    
    // Track regional performance
    const region = regionalMetrics.getRegionFromRequest(req);
    regionalMetrics.recordLatency(region, endpoint, duration);
  });
  
  next();
};

// Client latency tracking endpoint
export const trackClientLatency = (req, res) => {
  const { latency, page, action } = req.body;
  
  if (latency) {
    regionalMetrics.recordClientLatency(req, latency);
    sloTracker.recordBusinessEvent('client_interaction', page || 'unknown', 'success');
  }
  
  res.json({ success: true });
};

export default {
  SLOTracker,
  RegionalMetrics,
  sloTracker,
  regionalMetrics,
  sloMiddleware,
  trackClientLatency,
  SLO_TARGETS
};