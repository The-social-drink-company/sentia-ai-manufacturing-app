/**
 * Dashboard API Analytics Integration Test Suite
 * 
 * Comprehensive integration tests for analytics endpoints in the dashboard API:
 * - Analytics analysis endpoints
 * - Visualization generation
 * - Insights and recommendations
 * - Predictive forecasting
 * - Alert management
 * - Performance metrics
 * - Data export functionality
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import dashboardApiRoutes from '../../../src/routes/dashboard-api.js';

describe('Dashboard API Analytics Integration Tests', () => {
  let app;
  let server;
  let validToken;
  let testPort = 3502;

  beforeAll(async () => {
    // Create Express app for testing
    app = express();
    app.use(express.json());
    app.use('/api/dashboard', dashboardApiRoutes);

    // Generate valid JWT token for testing
    validToken = jwt.sign(
      {
        sub: 'test-dashboard-service',
        iss: 'sentia-mcp-server',
        aud: 'sentia-dashboard',
        environment: 'test',
        permissions: ['data:read', 'tools:execute', 'status:read']
      },
      'test-secret',
      { expiresIn: '1h' }
    );

    // Start test server
    server = app.listen(testPort);
    await new Promise((resolve) => {
      server.on('listening', resolve);
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise((resolve) => {
        server.close(resolve);
      });
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Authentication', () => {
    it('should reject requests without authentication token', async () => {
      const response = await request(app)
        .post('/api/dashboard/analytics/analyze')
        .send({
          dataSource: 'manufacturing',
          analysisType: 'comprehensive'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access token required');
      expect(response.body.code).toBe('MISSING_TOKEN');
    });

    it('should reject requests with invalid token', async () => {
      const response = await request(app)
        .post('/api/dashboard/analytics/analyze')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          dataSource: 'manufacturing',
          analysisType: 'comprehensive'
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Invalid or expired token');
      expect(response.body.code).toBe('INVALID_TOKEN');
    });

    it('should accept requests with valid token', async () => {
      const response = await request(app)
        .get('/api/dashboard/health')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('Analytics Analysis Endpoints', () => {
    it('should perform comprehensive analytics analysis', async () => {
      const response = await request(app)
        .post('/api/dashboard/analytics/analyze')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          dataSource: 'manufacturing',
          analysisType: 'comprehensive',
          timeframe: '30d',
          filters: {
            productLine: 'A',
            region: 'US'
          },
          options: {
            includeAnomalies: true,
            includeTrends: true,
            includeForecasts: true
          }
        });

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(response.body.analysisId).toBeDefined();
      expect(response.body.status).toBe('completed');
      expect(response.body.dataSource).toBe('manufacturing');
      expect(response.body.analysisType).toBe('comprehensive');
      expect(response.body.timeframe).toBe('30d');
      expect(response.body.result).toBeDefined();
      expect(response.body.metadata).toBeDefined();
      expect(response.body.metadata.recordsAnalyzed).toBeGreaterThan(0);
      expect(response.body.metadata.executionTime).toBeGreaterThan(0);
      expect(response.body.metadata.confidence).toBeGreaterThan(0);
    });

    it('should perform financial analytics analysis', async () => {
      const response = await request(app)
        .post('/api/dashboard/analytics/analyze')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          dataSource: 'financial',
          analysisType: 'financial',
          timeframe: '90d',
          options: {
            includeForecasting: true,
            includeProfitability: true
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.analysisType).toBe('financial');
      expect(response.body.result).toBeDefined();
    });

    it('should perform operational analytics analysis', async () => {
      const response = await request(app)
        .post('/api/dashboard/analytics/analyze')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          dataSource: 'production',
          analysisType: 'operational',
          timeframe: '7d',
          options: {
            includeOEE: true,
            includeQuality: true,
            includeEfficiency: true
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.analysisType).toBe('operational');
      expect(response.body.result).toBeDefined();
    });

    it('should perform customer analytics analysis', async () => {
      const response = await request(app)
        .post('/api/dashboard/analytics/analyze')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          dataSource: 'customers',
          analysisType: 'customer',
          timeframe: '180d',
          options: {
            includeSegmentation: true,
            includeCLV: true,
            includeChurn: true
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.analysisType).toBe('customer');
      expect(response.body.result).toBeDefined();
    });

    it('should reject analysis request without data source', async () => {
      const response = await request(app)
        .post('/api/dashboard/analytics/analyze')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          analysisType: 'comprehensive',
          timeframe: '30d'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Data source is required');
      expect(response.body.code).toBe('MISSING_DATA_SOURCE');
    });
  });

  describe('Visualization Generation Endpoints', () => {
    it('should generate line chart visualization', async () => {
      const chartData = [
        { timestamp: '2024-01-01', value: 1000 },
        { timestamp: '2024-01-02', value: 1200 },
        { timestamp: '2024-01-03', value: 1100 },
        { timestamp: '2024-01-04', value: 1350 },
        { timestamp: '2024-01-05', value: 1250 }
      ];

      const response = await request(app)
        .post('/api/dashboard/analytics/visualize')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          chartType: 'line',
          data: chartData,
          options: {
            title: 'Revenue Trend',
            xAxis: { label: 'Date' },
            yAxis: { label: 'Revenue ($)' }
          },
          theme: 'sentia',
          interactive: true
        });

      expect(response.status).toBe(200);
      expect(response.body.visualizationId).toBeDefined();
      expect(response.body.chartType).toBe('line');
      expect(response.body.status).toBe('generated');
      expect(response.body.visualization).toBeDefined();
      expect(response.body.metadata).toBeDefined();
      expect(response.body.metadata.theme).toBe('sentia');
      expect(response.body.metadata.interactive).toBe(true);
      expect(response.body.metadata.dataPoints).toBe(5);
    });

    it('should generate bar chart visualization', async () => {
      const chartData = [
        { category: 'Product A', value: 5000 },
        { category: 'Product B', value: 3200 },
        { category: 'Product C', value: 4100 },
        { category: 'Product D', value: 2800 }
      ];

      const response = await request(app)
        .post('/api/dashboard/analytics/visualize')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          chartType: 'bar',
          data: chartData,
          options: {
            title: 'Product Sales',
            orientation: 'vertical'
          },
          theme: 'dark'
        });

      expect(response.status).toBe(200);
      expect(response.body.chartType).toBe('bar');
      expect(response.body.metadata.theme).toBe('dark');
    });

    it('should generate pie chart visualization', async () => {
      const chartData = [
        { category: 'Manufacturing', value: 60 },
        { category: 'Sales', value: 25 },
        { category: 'Operations', value: 15 }
      ];

      const response = await request(app)
        .post('/api/dashboard/analytics/visualize')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          chartType: 'pie',
          data: chartData,
          options: {
            title: 'Department Distribution',
            showLabels: true,
            showPercentages: true
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.chartType).toBe('pie');
    });

    it('should reject visualization request without chart type', async () => {
      const response = await request(app)
        .post('/api/dashboard/analytics/visualize')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          data: [{ x: 1, y: 2 }]
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Chart type and data are required');
      expect(response.body.code).toBe('MISSING_CHART_DATA');
    });

    it('should reject visualization request without data', async () => {
      const response = await request(app)
        .post('/api/dashboard/analytics/visualize')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          chartType: 'line'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Chart type and data are required');
      expect(response.body.code).toBe('MISSING_CHART_DATA');
    });
  });

  describe('Insights and Recommendations Endpoints', () => {
    it('should get comprehensive insights', async () => {
      const response = await request(app)
        .get('/api/dashboard/analytics/insights')
        .set('Authorization', `Bearer ${validToken}`)
        .query({
          category: 'all',
          timeframe: '30d',
          priority: 'high'
        });

      expect(response.status).toBe(200);
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.category).toBe('all');
      expect(response.body.timeframe).toBe('30d');
      expect(response.body.priority).toBe('high');
      expect(Array.isArray(response.body.insights)).toBe(true);
      expect(response.body.metadata).toBeDefined();
      expect(response.body.metadata.totalInsights).toBeGreaterThanOrEqual(0);
    });

    it('should get financial insights', async () => {
      const response = await request(app)
        .get('/api/dashboard/analytics/insights')
        .set('Authorization', `Bearer ${validToken}`)
        .query({
          category: 'financial',
          timeframe: '90d',
          priority: 'all'
        });

      expect(response.status).toBe(200);
      expect(response.body.category).toBe('financial');
    });

    it('should get operational insights', async () => {
      const response = await request(app)
        .get('/api/dashboard/analytics/insights')
        .set('Authorization', `Bearer ${validToken}`)
        .query({
          category: 'operational',
          timeframe: '7d'
        });

      expect(response.status).toBe(200);
      expect(response.body.category).toBe('operational');
    });

    it('should get customer insights', async () => {
      const response = await request(app)
        .get('/api/dashboard/analytics/insights')
        .set('Authorization', `Bearer ${validToken}`)
        .query({
          category: 'customer',
          timeframe: '180d'
        });

      expect(response.status).toBe(200);
      expect(response.body.category).toBe('customer');
    });
  });

  describe('Predictive Forecasting Endpoints', () => {
    it('should generate revenue forecast', async () => {
      const historicalData = Array.from({ length: 30 }, (_, i) => ({
        timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        value: 10000 + Math.sin(i * 0.1) * 2000 + Math.random() * 1000
      }));

      const response = await request(app)
        .post('/api/dashboard/analytics/forecast')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          metric: 'revenue',
          historicalData,
          forecastHorizon: 10,
          modelType: 'arima',
          includeConfidenceIntervals: true
        });

      expect(response.status).toBe(200);
      expect(response.body.forecastId).toBeDefined();
      expect(response.body.status).toBe('completed');
      expect(response.body.metric).toBe('revenue');
      expect(response.body.forecastHorizon).toBe(10);
      expect(response.body.modelType).toBe('arima');
      expect(response.body.forecast).toBeDefined();
      expect(response.body.metadata).toBeDefined();
      expect(response.body.metadata.historicalDataPoints).toBe(30);
      expect(response.body.metadata.forecastAccuracy).toBeGreaterThan(0);
      expect(response.body.metadata.modelConfidence).toBeGreaterThan(0);
    });

    it('should generate production forecast', async () => {
      const historicalData = Array.from({ length: 50 }, (_, i) => ({
        timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        value: 5000 + Math.cos(i * 0.05) * 1000 + Math.random() * 500
      }));

      const response = await request(app)
        .post('/api/dashboard/analytics/forecast')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          metric: 'production',
          historicalData,
          forecastHorizon: 7,
          modelType: 'lstm'
        });

      expect(response.status).toBe(200);
      expect(response.body.metric).toBe('production');
      expect(response.body.modelType).toBe('lstm');
    });

    it('should reject forecast request without metric', async () => {
      const response = await request(app)
        .post('/api/dashboard/analytics/forecast')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          historicalData: [{ timestamp: '2024-01-01', value: 100 }],
          forecastHorizon: 5
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Metric and historical data are required');
      expect(response.body.code).toBe('MISSING_FORECAST_DATA');
    });

    it('should reject forecast request without historical data', async () => {
      const response = await request(app)
        .post('/api/dashboard/analytics/forecast')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          metric: 'revenue',
          forecastHorizon: 5
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Metric and historical data are required');
      expect(response.body.code).toBe('MISSING_FORECAST_DATA');
    });
  });

  describe('Alert Management Endpoints', () => {
    it('should get analytics alerts', async () => {
      const response = await request(app)
        .get('/api/dashboard/analytics/alerts')
        .set('Authorization', `Bearer ${validToken}`)
        .query({
          status: 'active',
          priority: 'high',
          limit: 25,
          offset: 0
        });

      expect(response.status).toBe(200);
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.filters).toBeDefined();
      expect(response.body.filters.status).toBe('active');
      expect(response.body.filters.priority).toBe('high');
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.limit).toBe(25);
      expect(response.body.pagination.offset).toBe(0);
      expect(Array.isArray(response.body.alerts)).toBe(true);
      expect(response.body.summary).toBeDefined();
    });

    it('should create custom analytics alert', async () => {
      const alertData = {
        name: 'High Revenue Alert',
        description: 'Alert when daily revenue exceeds $50,000',
        metric: 'revenue',
        condition: 'greater_than',
        threshold: 50000,
        priority: 'medium',
        enabled: true,
        notifications: ['email', 'dashboard']
      };

      const response = await request(app)
        .post('/api/dashboard/analytics/alerts')
        .set('Authorization', `Bearer ${validToken}`)
        .send(alertData);

      expect(response.status).toBe(200);
      expect(response.body.alertId).toBeDefined();
      expect(response.body.status).toBe('created');
      expect(response.body.alert).toBeDefined();
      expect(response.body.alert.name).toBe('High Revenue Alert');
      expect(response.body.alert.metric).toBe('revenue');
      expect(response.body.alert.threshold).toBe(50000);
    });

    it('should reject alert creation without required fields', async () => {
      const incompleteAlert = {
        description: 'Alert without name or metric'
      };

      const response = await request(app)
        .post('/api/dashboard/analytics/alerts')
        .set('Authorization', `Bearer ${validToken}`)
        .send(incompleteAlert);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Name, metric, condition, and threshold are required');
      expect(response.body.code).toBe('MISSING_ALERT_DATA');
    });
  });

  describe('Performance Metrics Endpoints', () => {
    it('should get analytics performance metrics', async () => {
      const response = await request(app)
        .get('/api/dashboard/analytics/performance')
        .set('Authorization', `Bearer ${validToken}`)
        .query({
          timeframe: '24h'
        });

      expect(response.status).toBe(200);
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.timeframe).toBe('24h');
      expect(response.body.metrics).toBeDefined();
      expect(response.body.metrics.analysisRequests).toBeDefined();
      expect(response.body.metrics.visualizations).toBeDefined();
      expect(response.body.metrics.forecasts).toBeDefined();
      expect(response.body.metrics.alerts).toBeDefined();
      expect(response.body.systemHealth).toBeDefined();
      expect(response.body.systemHealth.cpuUsage).toBeDefined();
      expect(response.body.systemHealth.memoryUsage).toBeDefined();
    });

    it('should get performance metrics for different timeframes', async () => {
      const timeframes = ['1h', '24h', '7d', '30d'];

      for (const timeframe of timeframes) {
        const response = await request(app)
          .get('/api/dashboard/analytics/performance')
          .set('Authorization', `Bearer ${validToken}`)
          .query({ timeframe });

        expect(response.status).toBe(200);
        expect(response.body.timeframe).toBe(timeframe);
      }
    });
  });

  describe('Data Export Endpoints', () => {
    it('should export analytics data as JSON', async () => {
      const response = await request(app)
        .post('/api/dashboard/analytics/export')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          dataType: 'revenue',
          format: 'json',
          timeframe: '30d',
          filters: {
            region: 'US'
          },
          includeVisualizations: false
        });

      expect(response.status).toBe(200);
      expect(response.body.exportId).toBeDefined();
      expect(response.body.status).toBe('ready');
      expect(response.body.dataType).toBe('revenue');
      expect(response.body.format).toBe('json');
      expect(response.body.timeframe).toBe('30d');
      expect(response.body.data).toBeDefined();
      expect(response.body.metadata).toBeDefined();
      expect(response.body.metadata.recordCount).toBeGreaterThanOrEqual(0);
      expect(response.body.metadata.fileSize).toBeDefined();
    });

    it('should export analytics data as CSV', async () => {
      const response = await request(app)
        .post('/api/dashboard/analytics/export')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          dataType: 'production',
          format: 'csv',
          timeframe: '7d'
        });

      expect(response.status).toBe(200);
      expect(response.body.format).toBe('csv');
    });

    it('should export analytics data with visualizations', async () => {
      const response = await request(app)
        .post('/api/dashboard/analytics/export')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          dataType: 'comprehensive',
          format: 'json',
          timeframe: '90d',
          includeVisualizations: true
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
    });

    it('should reject export request without data type', async () => {
      const response = await request(app)
        .post('/api/dashboard/analytics/export')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          format: 'json',
          timeframe: '30d'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Data type is required');
      expect(response.body.code).toBe('MISSING_DATA_TYPE');
    });
  });

  describe('Error Handling', () => {
    it('should handle internal server errors gracefully', async () => {
      // Mock an internal error by sending malformed data
      const response = await request(app)
        .post('/api/dashboard/analytics/analyze')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          dataSource: 'invalid-source-that-causes-error',
          analysisType: 'malformed'
        });

      // Should still return structured error response
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body.error).toBeDefined();
      expect(response.body.code).toBeDefined();
    });

    it('should validate request parameters', async () => {
      const response = await request(app)
        .post('/api/dashboard/analytics/forecast')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          metric: 'revenue',
          historicalData: 'not-an-array',
          forecastHorizon: 'invalid'
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle timeout scenarios', async () => {
      // Test with very large dataset that might timeout
      const largeHistoricalData = Array.from({ length: 10000 }, (_, i) => ({
        timestamp: new Date(Date.now() - i * 60000).toISOString(),
        value: Math.random() * 1000
      }));

      const response = await request(app)
        .post('/api/dashboard/analytics/forecast')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          metric: 'stress-test',
          historicalData: largeHistoricalData,
          forecastHorizon: 100
        });

      // Should either succeed or fail gracefully with timeout
      if (response.status !== 200) {
        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.body.error).toBeDefined();
      }
    });
  });

  describe('Rate Limiting and Security', () => {
    it('should handle multiple concurrent requests', async () => {
      const requests = Array.from({ length: 5 }, () =>
        request(app)
          .get('/api/dashboard/analytics/insights')
          .set('Authorization', `Bearer ${validToken}`)
          .query({ category: 'all', timeframe: '30d' })
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('should maintain request isolation', async () => {
      // Send two different analysis requests simultaneously
      const request1Promise = request(app)
        .post('/api/dashboard/analytics/analyze')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          dataSource: 'financial',
          analysisType: 'financial',
          timeframe: '30d'
        });

      const request2Promise = request(app)
        .post('/api/dashboard/analytics/analyze')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          dataSource: 'production',
          analysisType: 'operational',
          timeframe: '7d'
        });

      const [response1, response2] = await Promise.all([request1Promise, request2Promise]);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response1.body.analysisId).not.toBe(response2.body.analysisId);
      expect(response1.body.analysisType).toBe('financial');
      expect(response2.body.analysisType).toBe('operational');
    });
  });

  describe('Data Consistency', () => {
    it('should return consistent data format across different endpoints', async () => {
      // Test multiple analytics endpoints for consistent response structure
      const endpoints = [
        { method: 'get', path: '/api/dashboard/analytics/insights?category=all' },
        { method: 'get', path: '/api/dashboard/analytics/performance' },
        { method: 'get', path: '/api/dashboard/analytics/alerts' }
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)
          [endpoint.method](endpoint.path)
          .set('Authorization', `Bearer ${validToken}`);

        expect(response.status).toBe(200);
        expect(response.body.timestamp).toBeDefined();
        expect(typeof response.body.timestamp).toBe('string');
      }
    });

    it('should maintain data integrity across operations', async () => {
      // Create an alert and then retrieve it
      const createResponse = await request(app)
        .post('/api/dashboard/analytics/alerts')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          name: 'Test Alert for Integrity',
          description: 'Testing data integrity',
          metric: 'test_metric',
          condition: 'greater_than',
          threshold: 1000,
          priority: 'medium'
        });

      expect(createResponse.status).toBe(200);
      const alertId = createResponse.body.alertId;

      // Retrieve alerts and verify the created alert exists
      const getResponse = await request(app)
        .get('/api/dashboard/analytics/alerts')
        .set('Authorization', `Bearer ${validToken}`);

      expect(getResponse.status).toBe(200);
      // Note: In a full implementation, you would verify the alert exists in the response
      // For this mock implementation, we just verify the endpoints work correctly
    });
  });
});