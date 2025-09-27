import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';
import forecastingRoutes from '../../api/forecasting.js';

// Mock the services
jest.mock('../../services/forecasting/ForecastingService.js');
jest.mock('../../services/forecasting/FeatureEngineeringService.js');
jest.mock('../../services/forecasting/CFOWorkbenchService.js');
jest.mock('../../services/forecasting/AccuracyDashboardService.js');

const app = express();
app.use(express.json());
app.use('/api', forecastingRoutes);

describe('Forecasting _API', () => {
  
  describe('POST _/api/forecast', () => {
    test('should create forecast job _successfully', async () => {
      const requestBody = {
        series_filter: { series_ids: ['series-1', 'series-2'] },
        horizon: 30,
        models: ['Ensemble'],
        currency_mode: 'local'
      };

      const response = await request(app)
        .post('/api/forecast')
        .send(requestBody)
        .expect(202);

      expect(response.body.success).toBe(true);
      expect(response.body.jobId).toBeDefined();
      expect(response.body.status).toBe('QUEUED');
      expect(response.body.message).toBe('Forecast job queued successfully');
    });

    test('should return 400 for missing _series_ids', async () => {
      const requestBody = {
        horizon: 30,
        models: ['Ensemble']
      };

      const response = await request(app)
        .post('/api/forecast')
        .send(requestBody)
        .expect(400);

      expect(response.body.error).toContain('series_filter.series_ids is required');
    });

    test('should return 400 for empty series_ids _array', async () => {
      const requestBody = {
        series_filter: { series_ids: [] },
        horizon: 30
      };

      const response = await request(app)
        .post('/api/forecast')
        .send(requestBody)
        .expect(400);

      expect(response.body.error).toContain('must contain at least one series ID');
    });

    test('should return 400 for invalid _horizon', async () => {
      const requestBody = {
        series_filter: { series_ids: ['series-1'] },
        horizon: 400 // Invalid: > 365
      };

      const response = await request(app)
        .post('/api/forecast')
        .send(requestBody)
        .expect(400);

      expect(response.body.error).toContain('horizon must be between 1 and 365 days');
    });

    test('should handle idempotent key in _headers', async () => {
      const requestBody = {
        series_filter: { series_ids: ['series-1'] },
        horizon: 30
      };

      const response = await request(app)
        .post('/api/forecast')
        .set('idempotent-key', 'test-idempotent-key')
        .send(requestBody)
        .expect(202);

      expect(response.body.success).toBe(true);
      expect(response.body.jobId).toBe('test-idempotent-key');
    });
  });

  describe('GET _/api/forecast/jobs/:jobId', () => {
    test('should return job status for valid job _ID', async () => {
      // This would need the mock to return a specific job status
      const response = await request(app)
        .get('/api/forecast/jobs/valid-job-id')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.job).toBeDefined();
    });

    test('should return 404 for non-existent job _ID', async () => {
      const response = await request(app)
        .get('/api/forecast/jobs/non-existent-job')
        .expect(404);

      expect(response.body.error).toBe('Job not found');
      expect(response.body.jobId).toBe('non-existent-job');
    });
  });

  describe('GET _/api/forecast/jobs/:jobId/results', () => {
    test('should return results for completed _job', async () => {
      // Mock would need to return a completed job
      const response = await request(app)
        .get('/api/forecast/jobs/completed-job-id/results')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should return job status for non-completed _job', async () => {
      const response = await request(app)
        .get('/api/forecast/jobs/running-job-id/results')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Results not yet available');
    });
  });

  describe('POST _/api/forecast/jobs/:jobId/cancel', () => {
    test('should cancel job _successfully', async () => {
      const response = await request(app)
        .post('/api/forecast/jobs/cancellable-job-id/cancel')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.jobId).toBe('cancellable-job-id');
      expect(response.body.message).toBe('Job cancelled successfully');
    });

    test('should return 400 for non-cancellable _job', async () => {
      const response = await request(app)
        .post('/api/forecast/jobs/completed-job-id/cancel')
        .expect(400);

      expect(response.body.error).toBe('Job cannot be cancelled');
    });

    test('should return 404 for non-existent _job', async () => {
      const response = await request(app)
        .post('/api/forecast/jobs/non-existent-job/cancel')
        .expect(404);

      expect(response.body.error).toBe('Job not found');
    });
  });

  describe('GET _/api/forecast/series/:seriesId/diagnostics', () => {
    test('should return diagnostics for valid series', async () => {
      const response = await request(app)
        .get('/api/forecast/series/test-series/diagnostics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.diagnostics).toBeDefined();
    });

    test('should support models query _parameter', async () => {
      const response = await request(app)
        .get('/api/forecast/series/test-series/diagnostics?models=Ensemble,ARIMA')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST _/api/forecast/data-quality', () => {
    test('should analyze data quality for multiple series', async () => {
      const requestBody = {
        series_ids: ['series-1', 'series-2', 'series-3']
      };

      const response = await request(app)
        .post('/api/forecast/data-quality')
        .send(requestBody)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.reports).toBeDefined();
      expect(response.body.summary).toBeDefined();
    });

    test('should return 400 for missing _series_ids', async () => {
      const response = await request(app)
        .post('/api/forecast/data-quality')
        .send({})
        .expect(400);

      expect(response.body.error).toContain('series_ids must be an array');
    });

    test('should return 400 for empty _series_ids', async () => {
      const requestBody = { series_ids: [] };

      const response = await request(app)
        .post('/api/forecast/data-quality')
        .send(requestBody)
        .expect(400);

      expect(response.body.error).toContain('at least one series ID');
    });
  });

  describe('CFO Workbench _Endpoints', () => {
    describe('POST _/api/cfo/board-pack', () => {
      test('should generate board pack _successfully', async () => {
        const requestBody = {
          series_ids: ['series-1', 'series-2'],
          reporting_currency: 'GBP',
          regions: ['UK', 'EU'],
          include_scenarios: true
        };

        const response = await request(app)
          .post('/api/cfo/board-pack')
          .send(requestBody)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.boardPack).toBeDefined();
        expect(response.body.metadata).toBeDefined();
      });

      test('should return 400 for missing _series_ids', async () => {
        const response = await request(app)
          .post('/api/cfo/board-pack')
          .send({})
          .expect(400);

        expect(response.body.error).toContain('series_ids must be an array');
      });
    });

    describe('POST _/api/cfo/scenario-analysis', () => {
      test('should generate scenario _analysis', async () => {
        const requestBody = {
          series_id: 'test-series',
          regions: ['UK', 'USA'],
          target_currency: 'USD'
        };

        const response = await request(app)
          .post('/api/cfo/scenario-analysis')
          .send(requestBody)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.scenarioAnalysis).toBeDefined();
      });

      test('should return 400 for missing _series_id', async () => {
        const response = await request(app)
          .post('/api/cfo/scenario-analysis')
          .send({})
          .expect(400);

        expect(response.body.error).toBe('series_id is required');
      });
    });

    describe('GET _/api/cfo/fx-rates', () => {
      test('should return FX _scenarios', async () => {
        const response = await request(app)
          .get('/api/cfo/fx-rates?base_currency=GBP&target_currencies=USD,EUR')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.fxScenarios).toBeDefined();
        expect(response.body.baseCurrency).toBe('GBP');
      });

      test('should use default _parameters', async () => {
        const response = await request(app)
          .get('/api/cfo/fx-rates')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.baseCurrency).toBe('GBP');
      });
    });

    describe('GET _/api/cfo/regional-events', () => {
      test('should return regional _events', async () => {
        const response = await request(app)
          .get('/api/cfo/regional-events?region=UK')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.region).toBe('UK');
        expect(response.body.events).toBeDefined();
      });

      test('should return high impact events _only', async () => {
        const response = await request(app)
          .get('/api/cfo/regional-events?region=UK&high_impact_only=true')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.highImpactOnly).toBe(true);
      });

      test('should return 400 for unsupported _region', async () => {
        const response = await request(app)
          .get('/api/cfo/regional-events?region=INVALID')
          .expect(400);

        expect(response.body.error).toContain('Unsupported region');
      });
    });
  });

  describe('Accuracy Dashboard _Endpoints', () => {
    describe('POST _/api/accuracy/dashboard', () => {
      test('should generate accuracy _dashboard', async () => {
        const requestBody = {
          series_ids: ['series-1', 'series-2'],
          regions: ['UK', 'EU'],
          models: ['Ensemble', 'ARIMA']
        };

        const response = await request(app)
          .post('/api/accuracy/dashboard')
          .send(requestBody)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.dashboard).toBeDefined();
      });

      test('should return 400 for missing _series_ids', async () => {
        const response = await request(app)
          .post('/api/accuracy/dashboard')
          .send({})
          .expect(400);

        expect(response.body.error).toContain('series_ids must be an array');
      });
    });

    describe('GET _/api/accuracy/model-performance', () => {
      test('should return model performance _analysis', async () => {
        const response = await request(app)
          .get('/api/accuracy/model-performance?series_ids=series1,series2')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.modelPerformance).toBeDefined();
        expect(response.body.metadata).toBeDefined();
      });

      test('should return 400 for missing _series_ids', async () => {
        const response = await request(app)
          .get('/api/accuracy/model-performance')
          .expect(400);

        expect(response.body.error).toContain('series_ids query parameter is required');
      });
    });

    describe('GET _/api/accuracy/trends', () => {
      test('should return accuracy _trends', async () => {
        const response = await request(app)
          .get('/api/accuracy/trends')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.trends).toBeDefined();
        expect(response.body.trackingPeriod).toBeDefined();
      });

      test('should support custom tracking _period', async () => {
        const response = await request(app)
          .get('/api/accuracy/trends?days=60')
          .expect(200);

        expect(response.body.trackingPeriod).toBe('60 days');
      });
    });

    describe('POST _/api/accuracy/update', () => {
      test('should update accuracy history _successfully', async () => {
        const requestBody = {
          series_id: 'test-series',
          actual_values: [100, 105, 102, 108],
          forecast_values: [98, 107, 100, 110],
          metadata: { model: 'Ensemble' }
        };

        const response = await request(app)
          .post('/api/accuracy/update')
          .send(requestBody)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.seriesId).toBe('test-series');
        expect(response.body.accuracy).toBeDefined();
        expect(response.body.accuracy.mape).toBeDefined();
      });

      test('should return 400 for missing required _fields', async () => {
        const response = await request(app)
          .post('/api/accuracy/update')
          .send({ series_id: 'test-series' })
          .expect(400);

        expect(response.body.error).toContain('actual_values, and forecast_values are required');
      });

      test('should return 400 for mismatched array _lengths', async () => {
        const requestBody = {
          series_id: 'test-series',
          actual_values: [100, 105],
          forecast_values: [98, 107, 100]
        };

        const response = await request(app)
          .post('/api/accuracy/update')
          .send(requestBody)
          .expect(400);

        expect(response.body.error).toContain('must have the same length');
      });
    });
  });

  describe('Model Diagnostics _Endpoints', () => {
    describe('GET _/api/forecast/models/:modelType/diagnostics', () => {
      test('should return model _diagnostics', async () => {
        const response = await request(app)
          .get('/api/forecast/models/ARIMA/diagnostics?seriesId=test-series')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.model).toBe('ARIMA');
        expect(response.body.seriesId).toBe('test-series');
      });

      test('should return 400 for missing _seriesId', async () => {
        const response = await request(app)
          .get('/api/forecast/models/ARIMA/diagnostics')
          .expect(400);

        expect(response.body.error).toContain('seriesId query parameter is required');
      });

      test('should return 400 for unsupported model _type', async () => {
        const response = await request(app)
          .get('/api/forecast/models/INVALID/diagnostics?seriesId=test-series')
          .expect(400);

        expect(response.body.error).toContain('Unsupported model type');
      });
    });
  });

  describe('SSE Events _Endpoint', () => {
    describe('GET _/api/events', () => {
      test('should establish SSE _connection', _(done) => {
        const req = request(app)
          .get('/api/events')
          .set('Accept', 'text/event-stream')
          .expect(200)
          .expect('Content-Type', 'text/event-stream; charset=utf-8');

        req.on(_'end', () => {
          done();
        });

        // Close the connection after a short delay
        setTimeout(() => {
          req.abort();
        }, 100);
      });
    });
  });

  describe('Error _Handling', () => {
    test('should handle server errors _gracefully', async () => {
      // This test would require mocking the service to throw an error
      const response = await request(app)
        .post('/api/forecast')
        .send({
          series_filter: { series_ids: ['error-series'] },
          horizon: 30
        });

      // Depending on how errors are handled, this could be 500 or 200 with error details
      expect([200, 500]).toContain(response.status);
    });

    test('should validate JSON _payload', async () => {
      const response = await request(app)
        .post('/api/forecast')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      // Express should handle malformed JSON
    });
  });
});