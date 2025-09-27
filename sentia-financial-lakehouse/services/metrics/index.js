import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pino from 'pino';
import { Registry, Counter, Gauge, Histogram, Summary } from 'prom-client';
import Redis from 'ioredis';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// Prometheus metrics registry
const register = new Registry();

// Business metrics
const metrics = {
  // Liquidity metrics
  cashBalance: new Gauge({
    name: 'liquidity_cash_balance',
    help: 'Current cash balance',
    labelNames: ['currency', 'account'],
    registers: [register],
  }),
  
  currentRatio: new Gauge({
    name: 'liquidity_current_ratio',
    help: 'Current ratio (current assets / current liabilities)',
    registers: [register],
  }),
  
  quickRatio: new Gauge({
    name: 'liquidity_quick_ratio',
    help: 'Quick ratio (liquid assets / current liabilities)',
    registers: [register],
  }),
  
  cashConversionCycle: new Gauge({
    name: 'liquidity_cash_conversion_cycle',
    help: 'Cash conversion cycle in days',
    registers: [register],
  }),
  
  // Operational metrics
  transactionVolume: new Counter({
    name: 'transaction_volume_total',
    help: 'Total transaction volume',
    labelNames: ['type', 'currency'],
    registers: [register],
  }),
  
  dataIngestionRate: new Histogram({
    name: 'data_ingestion_duration_seconds',
    help: 'Data ingestion duration',
    labelNames: ['source', 'status'],
    buckets: [0.1, 0.5, 1, 2, 5, 10],
    registers: [register],
  }),
  
  aiQueryLatency: new Histogram({
    name: 'ai_query_latency_seconds',
    help: 'AI query processing latency',
    labelNames: ['agent', 'capability'],
    buckets: [0.5, 1, 2, 5, 10, 30],
    registers: [register],
  }),
  
  // Alert metrics
  alertsTriggered: new Counter({
    name: 'alerts_triggered_total',
    help: 'Total alerts triggered',
    labelNames: ['severity', 'type'],
    registers: [register],
  }),
  
  forecastAccuracy: new Gauge({
    name: 'forecast_accuracy_percentage',
    help: 'Forecast accuracy percentage',
    labelNames: ['model', 'horizon'],
    registers: [register],
  }),
};

// Calculate and update business metrics
const updateBusinessMetrics = async () => {
  try {
    // Fetch latest data from lakehouse
    const lakehouseUrl = process.env.LAKEHOUSE_URL || 'http://localhost:8100';
    const { data } = await axios.get(`${lakehouseUrl}/analytics/liquidity`);
    
    if (data && data.data && data.data.length > 0) {
      const latest = data.data[0];
      
      metrics.cashBalance.set({ currency: 'USD', account: 'main' }, latest.cash_on_hand);
      metrics.currentRatio.set(latest.current_ratio);
      metrics.quickRatio.set(latest.quick_ratio);
      metrics.cashConversionCycle.set(latest.cash_conversion_cycle);
    }
    
    // Store in Redis for quick access
    await redis.set('metrics:latest', JSON.stringify({
      timestamp: new Date().toISOString(),
      cashBalance: latest.cash_on_hand,
      currentRatio: latest.current_ratio,
      quickRatio: latest.quick_ratio,
      cashConversionCycle: latest.cash_conversion_cycle,
    }), 'EX', 300); // 5 minute TTL
    
  } catch (error) {
    logger.error('Error updating business metrics:', error);
  }
};

// Update metrics every minute
setInterval(updateBusinessMetrics, 60000);

// Health check
app.get(_'/health', _(req, res) => {
  res.json({
    status: 'healthy',
    service: 'metrics',
    timestamp: new Date().toISOString(),
  });
});

// Prometheus metrics endpoint
app.get(_'/metrics', async _(req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error) {
    logger.error('Error generating metrics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Record metric endpoint
app.post(_'/record', async _(req, res) => {
  try {
    const { metric, value, labels = {} } = req.body;
    
    if (!metric || value === undefined) {
      return res.status(400).json({ error: 'Metric and value required' });
    }
    
    // Record the metric
    if (metrics[metric]) {
      if (metrics[metric] instanceof Counter) {
        metrics[metric].inc(labels, value);
      } else if (metrics[metric] instanceof Gauge) {
        metrics[metric].set(labels, value);
      } else if (metrics[metric] instanceof Histogram) {
        metrics[metric].observe(labels, value);
      }
    }
    
    // Store in time-series format in Redis
    const key = `metrics:timeseries:${metric}:${Date.now()}`;
    await redis.set(key, JSON.stringify({ value, labels, timestamp: new Date().toISOString() }), 'EX', 86400);
    
    res.json({ success: true, metric, value });
  } catch (error) {
    logger.error('Error recording metric:', error);
    res.status(500).json({ error: error.message });
  }
});

// Query metrics endpoint
app.get(_'/query/:metric', async _(req, res) => {
  try {
    const { metric } = req.params;
    const { start, end } = req.query;
    
    // Get time series data from Redis
    const pattern = `metrics:timeseries:${metric}:*`;
    const keys = await redis.keys(pattern);
    
    const data = [];
    for (const key of keys) {
      const value = await redis.get(key);
      if (value) {
        data.push(JSON.parse(value));
      }
    }
    
    // Filter by date range if provided
    const filtered = data.filter(d => {
      const timestamp = new Date(d.timestamp);
      const startDate = start ? new Date(start) : new Date(0);
      const endDate = end ? new Date(end) : new Date();
      return timestamp >= startDate && timestamp <= endDate;
    });
    
    res.json({
      metric,
      data: filtered.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
      count: filtered.length,
    });
  } catch (error) {
    logger.error('Error querying metrics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Alerts endpoint
app.post(_'/alert', async _(req, res) => {
  try {
    const { severity, type, message, data } = req.body;
    
    // Record alert
    metrics.alertsTriggered.inc({ severity, type });
    
    // Store alert in Redis
    const alert = {
      id: `alert:${Date.now()}`,
      severity,
      type,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
    
    await redis.lpush('alerts:queue', JSON.stringify(alert));
    await redis.ltrim('alerts:queue', 0, 999); // Keep last 1000 alerts
    
    logger.warn(`Alert triggered: ${severity} - ${type} - ${message}`);
    
    res.json({ success: true, alert });
  } catch (error) {
    logger.error('Error recording alert:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.METRICS_PORT || 8101;
app.listen(PORT, _() => {
  logger.info(`Metrics service running on port ${PORT}`);
  updateBusinessMetrics(); // Initial update
});