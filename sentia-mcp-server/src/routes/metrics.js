/**
 * Enhanced Metrics API Endpoints
 * 
 * Comprehensive REST API for metrics collection, querying, and real-time streaming
 * for the CapLiquify MCP Server monitoring system.
 * 
 * Features:
 * - RESTful endpoints for all metric types
 * - Real-time streaming via WebSocket/SSE
 * - Historical data aggregation and filtering
 * - Custom metric queries and reporting
 * - Export capabilities for external tools
 * - Prometheus-compatible metrics format
 */

import { Router } from 'express';
import { createLogger } from '../utils/logger.js';
import { monitoring } from '../utils/monitoring.js';
import { performanceMonitor } from '../utils/performance-monitor.js';
import { businessAnalytics } from '../utils/business-analytics.js';
import { alertEngine } from '../utils/alert-engine.js';
import { logManager } from '../utils/log-manager.js';
import { SERVER_CONFIG } from '../config/server-config.js';

const router = Router();
const logger = createLogger();

/**
 * Get all available metrics
 * GET /metrics
 */
router.get('/', async (req, res) => {
  try {
    const {
      format = 'json',
      startTime,
      endTime,
      category,
      labels
    } = req.query;

    const metrics = monitoring.getAllMetrics();
    
    // Filter by category if specified
    let filteredMetrics = metrics;
    if (category) {
      filteredMetrics = Object.keys(metrics)
        .filter(key => key.includes(category))
        .reduce((obj, key) => {
          obj[key] = metrics[key];
          return obj;
        }, {});
    }

    // Handle different response formats
    if (format === 'prometheus') {
      const prometheusData = monitoring.exportPrometheusMetrics();
      res.set('Content-Type', 'text/plain');
      res.send(prometheusData);
    } else {
      res.json({
        metrics: filteredMetrics,
        timestamp: Date.now(),
        count: Object.keys(filteredMetrics).length,
        filters: { category, labels, startTime, endTime }
      });
    }

    logger.debug('Metrics retrieved', {
      format,
      category,
      count: Object.keys(filteredMetrics).length
    });

  } catch (error) {
    logger.error('Failed to retrieve metrics', { error });
    res.status(500).json({
      error: 'Failed to retrieve metrics',
      message: error.message
    });
  }
});

/**
 * Get specific metric by name
 * GET /metrics/:metricName
 */
router.get('/:metricName', async (req, res) => {
  try {
    const { metricName } = req.params;
    const {
      labels,
      startTime,
      endTime,
      aggregation = 'raw'
    } = req.query;

    // Parse labels if provided
    const parsedLabels = labels ? JSON.parse(labels) : {};
    
    // Get metric data
    const metricData = monitoring.getMetric(metricName, parsedLabels);
    
    if (!metricData) {
      return res.status(404).json({
        error: 'Metric not found',
        metric: metricName,
        labels: parsedLabels
      });
    }

    // Get time series data if requested
    let timeSeries = null;
    if (startTime || endTime) {
      const start = startTime ? parseInt(startTime) : null;
      const end = endTime ? parseInt(endTime) : null;
      timeSeries = monitoring.getTimeSeries(metricName, parsedLabels, start, end);
    }

    res.json({
      metric: metricData,
      timeSeries: timeSeries,
      timestamp: Date.now()
    });

  } catch (error) {
    logger.error('Failed to retrieve metric', { error, metricName: req.params.metricName });
    res.status(500).json({
      error: 'Failed to retrieve metric',
      message: error.message
    });
  }
});

/**
 * Set metric value
 * POST /metrics/:metricName
 */
router.post('/:metricName', async (req, res) => {
  try {
    const { metricName } = req.params;
    const { value, labels = {}, timestamp } = req.body;

    if (value === undefined || value === null) {
      return res.status(400).json({
        error: 'Missing value',
        message: 'Metric value is required'
      });
    }

    // Set the metric
    monitoring.setMetric(metricName, value, labels);

    res.json({
      success: true,
      metric: metricName,
      value,
      labels,
      timestamp: timestamp || Date.now()
    });

    logger.debug('Metric set via API', { metricName, value, labels });

  } catch (error) {
    logger.error('Failed to set metric', { error, metricName: req.params.metricName });
    res.status(500).json({
      error: 'Failed to set metric',
      message: error.message
    });
  }
});

/**
 * Increment counter metric
 * POST /metrics/:metricName/increment
 */
router.post('/:metricName/increment', async (req, res) => {
  try {
    const { metricName } = req.params;
    const { increment = 1, labels = {} } = req.body;

    monitoring.incrementMetric(metricName, increment, labels);

    res.json({
      success: true,
      metric: metricName,
      increment,
      labels,
      timestamp: Date.now()
    });

    logger.debug('Metric incremented via API', { metricName, increment, labels });

  } catch (error) {
    logger.error('Failed to increment metric', { error, metricName: req.params.metricName });
    res.status(500).json({
      error: 'Failed to increment metric',
      message: error.message
    });
  }
});

/**
 * Get performance metrics summary
 * GET /metrics/performance/summary
 */
router.get('/performance/summary', async (req, res) => {
  try {
    const summary = performanceMonitor.getPerformanceSummary();
    
    res.json({
      performance: summary,
      timestamp: Date.now()
    });

  } catch (error) {
    logger.error('Failed to get performance summary', { error });
    res.status(500).json({
      error: 'Failed to get performance summary',
      message: error.message
    });
  }
});

/**
 * Get business analytics summary
 * GET /metrics/business/summary
 */
router.get('/business/summary', async (req, res) => {
  try {
    const summary = businessAnalytics.getAnalyticsSummary();
    
    res.json({
      business: summary,
      timestamp: Date.now()
    });

  } catch (error) {
    logger.error('Failed to get business analytics summary', { error });
    res.status(500).json({
      error: 'Failed to get business analytics summary',
      message: error.message
    });
  }
});

/**
 * Get monitoring system status
 * GET /metrics/system/status
 */
router.get('/system/status', async (req, res) => {
  try {
    const monitoringStatus = monitoring.getStatus();
    const alertStatus = alertEngine.getStatus();
    const healthStatus = monitoring.getHealthStatus();

    res.json({
      system: {
        monitoring: monitoringStatus,
        alerting: alertStatus,
        health: healthStatus,
        uptime: process.uptime(),
        timestamp: Date.now()
      }
    });

  } catch (error) {
    logger.error('Failed to get system status', { error });
    res.status(500).json({
      error: 'Failed to get system status',
      message: error.message
    });
  }
});

/**
 * Get alert metrics and statistics
 * GET /metrics/alerts
 */
router.get('/alerts', async (req, res) => {
  try {
    const {
      severity,
      category,
      state,
      limit = 100,
      offset = 0
    } = req.query;

    const filters = {
      severity,
      category,
      state: state || 'active'
    };

    // Remove undefined filters
    Object.keys(filters).forEach(key => 
      filters[key] === undefined && delete filters[key]
    );

    const alerts = state === 'history' 
      ? alertEngine.getAlertHistory(filters, parseInt(limit))
      : alertEngine.getActiveAlerts(filters);

    const statistics = alertEngine.getStatus().statistics;

    res.json({
      alerts: alerts.slice(parseInt(offset), parseInt(offset) + parseInt(limit)),
      statistics,
      filters,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: alerts.length
      },
      timestamp: Date.now()
    });

  } catch (error) {
    logger.error('Failed to get alert metrics', { error });
    res.status(500).json({
      error: 'Failed to get alert metrics',
      message: error.message
    });
  }
});

/**
 * Search logs via API
 * GET /metrics/logs/search
 */
router.get('/logs/search', async (req, res) => {
  try {
    const {
      query = '',
      sources,
      startDate,
      endDate,
      level,
      limit = 100,
      offset = 0
    } = req.query;

    const searchOptions = {
      sources: sources ? sources.split(',') : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      level,
      limit: parseInt(limit),
      offset: parseInt(offset)
    };

    const results = await logManager.searchLogs(query, searchOptions);

    res.json({
      ...results,
      timestamp: Date.now()
    });

  } catch (error) {
    logger.error('Failed to search logs', { error });
    res.status(500).json({
      error: 'Failed to search logs',
      message: error.message
    });
  }
});

/**
 * Get log insights and analysis
 * GET /metrics/logs/insights
 */
router.get('/logs/insights', async (req, res) => {
  try {
    const {
      timeRange = 24 * 60 * 60 * 1000, // 24 hours
      sources
    } = req.query;

    const insights = await logManager.generateInsights({
      timeRange: parseInt(timeRange),
      sources: sources ? sources.split(',') : undefined
    });

    res.json({
      insights,
      timestamp: Date.now()
    });

  } catch (error) {
    logger.error('Failed to get log insights', { error });
    res.status(500).json({
      error: 'Failed to get log insights',
      message: error.message
    });
  }
});

/**
 * Export metrics data
 * GET /metrics/export
 */
router.get('/export', async (req, res) => {
  try {
    const {
      format = 'json',
      startTime,
      endTime,
      metrics: requestedMetrics,
      compression = 'none'
    } = req.query;

    // Get all metrics or specific ones
    const allMetrics = monitoring.getAllMetrics();
    let exportData = allMetrics;

    if (requestedMetrics) {
      const metricNames = requestedMetrics.split(',');
      exportData = Object.keys(allMetrics)
        .filter(key => metricNames.some(name => key.includes(name)))
        .reduce((obj, key) => {
          obj[key] = allMetrics[key];
          return obj;
        }, {});
    }

    // Add metadata
    const exportPackage = {
      metadata: {
        exportedAt: new Date().toISOString(),
        server: SERVER_CONFIG.server.name,
        version: SERVER_CONFIG.server.version,
        environment: SERVER_CONFIG.server.environment,
        timeRange: { startTime, endTime },
        format,
        compression
      },
      metrics: exportData,
      performance: performanceMonitor.getPerformanceSummary(),
      business: businessAnalytics.getAnalyticsSummary(),
      alerts: alertEngine.getStatus().statistics
    };

    // Handle different export formats
    switch (format) {
      case 'csv':
        // Convert to CSV format
        const csvData = convertMetricsToCSV(exportData);
        res.set('Content-Type', 'text/csv');
        res.set('Content-Disposition', `attachment; filename=metrics_${Date.now()}.csv`);
        res.send(csvData);
        break;
        
      case 'prometheus':
        const prometheusData = monitoring.exportPrometheusMetrics();
        res.set('Content-Type', 'text/plain');
        res.set('Content-Disposition', `attachment; filename=metrics_${Date.now()}.prom`);
        res.send(prometheusData);
        break;
        
      default: // json
        res.set('Content-Type', 'application/json');
        if (compression !== 'none') {
          res.set('Content-Disposition', `attachment; filename=metrics_${Date.now()}.json`);
        }
        res.json(exportPackage);
    }

    logger.info('Metrics exported', {
      format,
      compression,
      metricsCount: Object.keys(exportData).length
    });

  } catch (error) {
    logger.error('Failed to export metrics', { error });
    res.status(500).json({
      error: 'Failed to export metrics',
      message: error.message
    });
  }
});

/**
 * Get real-time metrics stream endpoint info
 * GET /metrics/stream/info
 */
router.get('/stream/info', (req, res) => {
  res.json({
    websocket: {
      url: `ws://${req.get('host')}/metrics/stream/ws`,
      protocols: ['metrics-v1']
    },
    sse: {
      url: `http://${req.get('host')}/metrics/stream/sse`,
      eventTypes: ['metric:updated', 'alert:created', 'performance:alert']
    },
    supported: {
      websocket: true,
      sse: true,
      polling: true
    },
    rateLimit: {
      maxConnections: 100,
      maxEventsPerSecond: 10
    }
  });
});

/**
 * Server-Sent Events endpoint for real-time metrics
 * GET /metrics/stream/sse
 */
router.get('/stream/sse', (req, res) => {
  // Set up SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Send initial connection event
  res.write(`data: ${JSON.stringify({
    type: 'connection',
    timestamp: Date.now(),
    message: 'Connected to metrics stream'
  })}\n\n`);

  // Set up event listeners
  const onMetricUpdate = (data) => {
    res.write(`event: metric:updated\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const onAlert = (data) => {
    res.write(`event: alert:created\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const onPerformanceAlert = (data) => {
    res.write(`event: performance:alert\ndata: ${JSON.stringify(data)}\n\n`);
  };

  // Subscribe to events
  monitoring.on('metric:updated', onMetricUpdate);
  alertEngine.on('alert:created', onAlert);
  performanceMonitor.on('performance:alert', onPerformanceAlert);

  // Send heartbeat every 30 seconds
  const heartbeat = setInterval(() => {
    res.write(`event: heartbeat\ndata: ${JSON.stringify({
      type: 'heartbeat',
      timestamp: Date.now()
    })}\n\n`);
  }, 30000);

  // Clean up on client disconnect
  req.on('close', () => {
    monitoring.off('metric:updated', onMetricUpdate);
    alertEngine.off('alert:created', onAlert);
    performanceMonitor.off('performance:alert', onPerformanceAlert);
    clearInterval(heartbeat);
    logger.debug('SSE client disconnected');
  });

  logger.debug('SSE client connected for metrics stream');
});

/**
 * Prometheus-specific metrics endpoint
 * GET /metrics/prometheus
 */
router.get('/prometheus', async (req, res) => {
  try {
    const prometheusData = monitoring.exportPrometheusMetrics();
    
    res.set({
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      'Cache-Control': 'no-cache'
    });
    
    res.send(prometheusData);
    
    logger.debug('Prometheus metrics served');
    
  } catch (error) {
    logger.error('Failed to serve Prometheus metrics', { error });
    res.status(500).send('# Error generating metrics\n');
  }
});

/**
 * Node.js process metrics for Prometheus
 * GET /metrics/process
 */
router.get('/process', async (req, res) => {
  try {
    const processMetrics = monitoring.getProcessMetrics();
    
    res.set({
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      'Cache-Control': 'no-cache'
    });
    
    res.send(processMetrics);
    
  } catch (error) {
    logger.error('Failed to serve process metrics', { error });
    res.status(500).send('# Error generating process metrics\n');
  }
});

/**
 * Business metrics for Prometheus
 * GET /metrics/business
 */
router.get('/business', async (req, res) => {
  try {
    const { include_costs, include_roi } = req.query;
    
    const businessMetrics = businessAnalytics.exportPrometheusMetrics({
      includeCosts: include_costs === 'true',
      includeROI: include_roi === 'true'
    });
    
    res.set({
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      'Cache-Control': 'no-cache'
    });
    
    res.send(businessMetrics);
    
  } catch (error) {
    logger.error('Failed to serve business metrics', { error });
    res.status(500).send('# Error generating business metrics\n');
  }
});

/**
 * Integration-specific metrics for Prometheus
 * GET /metrics/integrations
 */
router.get('/integrations', async (req, res) => {
  try {
    const integrationMetrics = monitoring.getIntegrationMetrics();
    
    res.set({
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      'Cache-Control': 'no-cache'
    });
    
    res.send(integrationMetrics);
    
  } catch (error) {
    logger.error('Failed to serve integration metrics', { error });
    res.status(500).send('# Error generating integration metrics\n');
  }
});

/**
 * Security metrics for Prometheus
 * GET /metrics/security
 */
router.get('/security', async (req, res) => {
  try {
    const { include_auth_events, include_rate_limiting } = req.query;
    
    const securityMetrics = monitoring.getSecurityMetrics({
      includeAuthEvents: include_auth_events === 'true',
      includeRateLimiting: include_rate_limiting === 'true'
    });
    
    res.set({
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      'Cache-Control': 'no-cache'
    });
    
    res.send(securityMetrics);
    
  } catch (error) {
    logger.error('Failed to serve security metrics', { error });
    res.status(500).send('# Error generating security metrics\n');
  }
});

/**
 * Performance metrics with detailed breakdown for Prometheus
 * GET /metrics/performance
 */
router.get('/performance', async (req, res) => {
  try {
    const { 
      include_percentiles, 
      include_gc_metrics, 
      include_memory_details 
    } = req.query;
    
    const performanceMetrics = performanceMonitor.exportPrometheusMetrics({
      includePercentiles: include_percentiles === 'true',
      includeGCMetrics: include_gc_metrics === 'true',
      includeMemoryDetails: include_memory_details === 'true'
    });
    
    res.set({
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      'Cache-Control': 'no-cache'
    });
    
    res.send(performanceMetrics);
    
  } catch (error) {
    logger.error('Failed to serve performance metrics', { error });
    res.status(500).send('# Error generating performance metrics\n');
  }
});

/**
 * Get custom metric queries
 * POST /metrics/query
 */
router.post('/query', async (req, res) => {
  try {
    const {
      query,
      timeRange,
      aggregation,
      groupBy,
      filters
    } = req.body;

    // This would implement a query language for metrics
    // For now, return a basic response
    const result = {
      query,
      timeRange,
      aggregation,
      groupBy,
      filters,
      results: [],
      executionTime: 0,
      timestamp: Date.now()
    };

    res.json(result);

  } catch (error) {
    logger.error('Failed to execute metric query', { error });
    res.status(500).json({
      error: 'Failed to execute metric query',
      message: error.message
    });
  }
});

/**
 * Helper function to convert metrics to CSV format
 */
function convertMetricsToCSV(metrics) {
  const rows = ['timestamp,metric,value,labels'];
  
  for (const [metricName, metricList] of Object.entries(metrics)) {
    for (const metric of metricList) {
      const labelsStr = Object.entries(metric.labels || {})
        .map(([k, v]) => `${k}=${v}`)
        .join(';');
      
      rows.push(`${metric.timestamp},${metricName},${metric.value},"${labelsStr}"`);
    }
  }
  
  return rows.join('\n');
}

export default router;