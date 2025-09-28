/**
 * Integration tests for Optimization API endpoints
 * Tests all REST endpoints with various scenarios
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import optimizationRouter from '../../api/optimization.js';

// Mock environment variables for testing
process.env.FEATURE_MULTI_WAREHOUSE = 'true';
process.env.FEATURE_WC_OPTIMIZATION = 'true';
process.env.FEATURE_CFO_REPORTS = 'true';
process.env.FEATURE_DIAGNOSTICS = 'true';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/optimization', optimizationRouter);

describe('Optimization API _Endpoints', () => {
  let mockSKU;
  let mockSKUBatch;

  beforeEach(() => {
    // Mock SKU data for testing
    mockSKU = {
      skuId: 'SKU-TEST-001',
      annualDemand: 1200,
      demandMean: 3.28,
      demandStdDev: 1.2,
      leadTimeDays: 14,
      unitCost: 25.50,
      unitPrice: 35.00,
      holdingCostRate: 0.25,
      orderingCost: 50,
      moq: 100,
      lotSize: 50,
      serviceLevel: 0.98,
      currentInventory: 150
    };

    mockSKUBatch = [
      { ...mockSKU, skuId: 'SKU-001', unitPrice: 50 },
      { ...mockSKU, skuId: 'SKU-002', unitPrice: 75, annualDemand: 800 },
      { ...mockSKU, skuId: 'SKU-003', unitPrice: 100, annualDemand: 400 }
    ];
  });

  describe('Core Optimization _Endpoints', () => {
    describe('POST _/api/optimization/sku/optimize', () => {
      it('should optimize single SKU _successfully', async () => {
        const response = await request(app)
          .post('/api/optimization/sku/optimize')
          .send({ sku: mockSKU })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          result: expect.objectContaining({
            skuId: 'SKU-TEST-001',
            inputs: expect.any(Object),
            calculations: expect.any(Object),
            outputs: expect.any(Object)
          }),
          timestamp: expect.any(String)
        });

        // Verify calculation results
        expect(response.body.result.calculations.eoq).toBeGreaterThan(0);
        expect(response.body.result.outputs.recommendedOrderQty).toBeGreaterThanOrEqual(0);
      });

      it('should include explanation when diagnostics _enabled', async () => {
        const response = await request(app)
          .post('/api/optimization/sku/optimize')
          .send({ sku: mockSKU })
          .expect(200);

        expect(response.body.explanation).toBeDefined();
        expect(response.body.explanation).toHaveProperty('decisionSummary');
        expect(response.body.explanation).toHaveProperty('mathematicalRationale');
      });

      it('should handle constraints _correctly', async () => {
        const constraints = {
          workingCapitalLimit: 10000,
          maxOrderSize: 200
        };

        const response = await request(app)
          .post('/api/optimization/sku/optimize')
          .send({ 
            sku: mockSKU, 
            constraints,
            demandHistory: []
          })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should return 400 for missing SKU _data', async () => {
        const response = await request(app)
          .post('/api/optimization/sku/optimize')
          .send({})
          .expect(400);

        expect(response.body.error).toBe('Missing required SKU data');
        expect(response.body.required).toEqual(expect.any(Array));
      });

      it('should return 400 for invalid SKU _data', async () => {
        const invalidSKU = { ...mockSKU };
        delete invalidSKU.skuId;

        const response = await request(app)
          .post('/api/optimization/sku/optimize')
          .send({ sku: invalidSKU })
          .expect(400);

        expect(response.body.error).toBe('Missing required SKU data');
      });
    });

    describe('POST _/api/optimization/batch/optimize', () => {
      it('should optimize batch of SKUs _successfully', async () => {
        const response = await request(app)
          .post('/api/optimization/batch/optimize')
          .send({ skus: mockSKUBatch })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          results: expect.any(Array),
          summary: expect.objectContaining({
            totalSKUs: 3,
            totalInvestment: expect.any(Number),
            avgStockoutRisk: expect.any(Number)
          }),
          timestamp: expect.any(String)
        });

        expect(response.body.results).toHaveLength(3);
      });

      it('should apply global _constraints', async () => {
        const globalConstraints = {
          workingCapitalLimit: 1000, // Very low limit
          capacityLimit: 100
        };

        const response = await request(app)
          .post('/api/optimization/batch/optimize')
          .send({ 
            skus: mockSKUBatch,
            globalConstraints
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.constraintsApplied).toBe(true);
      });

      it('should return 400 for empty SKUs _array', async () => {
        const response = await request(app)
          .post('/api/optimization/batch/optimize')
          .send({ skus: [] })
          .expect(400);

        expect(response.body.error).toBe('Missing or empty SKUs array');
      });

      it('should return 400 for missing _SKUs', async () => {
        const response = await request(app)
          .post('/api/optimization/batch/optimize')
          .send({})
          .expect(400);

        expect(response.body.error).toBe('Missing or empty SKUs array');
      });
    });
  });

  describe('Job Management _Endpoints', () => {
    describe('POST _/api/optimization/jobs/create', () => {
      it('should create SKU optimization _job', async () => {
        const jobPayload = {
          jobType: 'SKU_OPTIMIZATION',
          payload: {
            sku: mockSKU,
            constraints: {},
            demandHistory: []
          },
          options: {
            priority: 'HIGH',
            maxRetries: 2
          }
        };

        const response = await request(app)
          .post('/api/optimization/jobs/create')
          .send(jobPayload)
          .expect(201);

        expect(response.body).toMatchObject({
          success: true,
          job: expect.objectContaining({
            jobId: expect.any(String),
            status: 'QUEUED',
            estimatedDuration: expect.any(Number)
          }),
          timestamp: expect.any(String)
        });
      });

      it('should create batch optimization _job', async () => {
        const jobPayload = {
          jobType: 'BATCH_OPTIMIZATION',
          payload: {
            skus: mockSKUBatch,
            globalConstraints: {}
          }
        };

        const response = await request(app)
          .post('/api/optimization/jobs/create')
          .send(jobPayload)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.job.jobId).toMatch(/^OPT-/);
      });

      it('should return 400 for invalid job _type', async () => {
        const response = await request(app)
          .post('/api/optimization/jobs/create')
          .send({
            jobType: 'INVALID_JOB_TYPE',
            payload: {}
          })
          .expect(400);

        expect(response.body.error).toBe('Invalid job type');
        expect(response.body.validTypes).toEqual(expect.any(Array));
      });

      it('should return 400 for missing required _fields', async () => {
        const response = await request(app)
          .post('/api/optimization/jobs/create')
          .send({})
          .expect(400);

        expect(response.body.error).toBe('Missing required fields');
        expect(response.body.required).toEqual(['jobType', 'payload']);
      });
    });

    describe('GET _/api/optimization/jobs/:jobId/status', () => {
      it('should return 404 for non-existent _job', async () => {
        const response = await request(app)
          .get('/api/optimization/jobs/NON_EXISTENT_JOB/status')
          .expect(404);

        expect(response.body.error).toBe('Job not found');
      });
    });

    describe('GET _/api/optimization/queue/status', () => {
      it('should return queue _status', async () => {
        const response = await request(app)
          .get('/api/optimization/queue/status')
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          queue: expect.objectContaining({
            queueLength: expect.any(Number),
            activeJobs: expect.any(Number),
            maxConcurrentJobs: expect.any(Number)
          }),
          health: expect.objectContaining({
            queueHealth: expect.any(String),
            successRate: expect.any(Number)
          }),
          timestamp: expect.any(String)
        });
      });
    });
  });

  describe('Multi-Warehouse _Endpoints', () => {
    describe('POST _/api/optimization/multi-warehouse/optimize', () => {
      it('should optimize multi-warehouse _plan', async () => {
        const demandByRegion = {
          uk: mockSKUBatch.slice(0, 2),
          eu: mockSKUBatch.slice(1),
          usa: mockSKUBatch
        };

        const response = await request(app)
          .post('/api/optimization/multi-warehouse/optimize')
          .send({
            skus: mockSKUBatch,
            demandByRegion,
            constraints: {
              uk: { workingCapitalLimit: 50000 },
              eu: { workingCapitalLimit: 40000 },
              usa: { workingCapitalLimit: 60000 }
            }
          })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          plan: expect.objectContaining({
            regions: expect.any(Object),
            summary: expect.any(Object),
            timestamp: expect.any(String)
          }),
          timestamp: expect.any(String)
        });
      });

      it('should return 400 for missing required _fields', async () => {
        const response = await request(app)
          .post('/api/optimization/multi-warehouse/optimize')
          .send({})
          .expect(400);

        expect(response.body.error).toBe('Missing required fields');
        expect(response.body.required).toEqual(['skus', 'demandByRegion']);
      });
    });

    describe('POST _/api/optimization/multi-warehouse/source-selection', () => {
      it('should select optimal source _warehouse', async () => {
        const availableSources = [
          { warehouse: 'WH_UK_001', region: 'uk', currency: 'GBP' },
          { warehouse: 'WH_EU_001', region: 'eu', currency: 'EUR' },
          { warehouse: 'WH_USA_001', region: 'usa', currency: 'USD' }
        ];

        const response = await request(app)
          .post('/api/optimization/multi-warehouse/source-selection')
          .send({
            sku: mockSKU,
            demandRegion: 'uk',
            availableSources
          })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          sourceSelection: expect.objectContaining({
            recommended: expect.any(Object),
            alternatives: expect.any(Array),
            allOptions: expect.any(Array)
          }),
          timestamp: expect.any(String)
        });
      });

      it('should return 400 for missing _parameters', async () => {
        const response = await request(app)
          .post('/api/optimization/multi-warehouse/source-selection')
          .send({})
          .expect(400);

        expect(response.body.error).toBe('Missing required fields');
        expect(response.body.required).toEqual(['sku', 'demandRegion', 'availableSources']);
      });
    });

    describe('GET _/api/optimization/multi-warehouse/config/:region', () => {
      it('should return warehouse config for valid _region', async () => {
        const response = await request(app)
          .get('/api/optimization/multi-warehouse/config/uk')
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          region: 'uk',
          config: expect.objectContaining({
            locations: expect.any(Array),
            totalCapacity: expect.any(Number),
            currency: 'GBP'
          }),
          timestamp: expect.any(String)
        });
      });

      it('should return 404 for invalid _region', async () => {
        const response = await request(app)
          .get('/api/optimization/multi-warehouse/config/invalid')
          .expect(404);

        expect(response.body.error).toBe('Region not found');
        expect(response.body.availableRegions).toEqual(['uk', 'eu', 'usa']);
      });
    });
  });

  describe('Working Capital _Endpoints', () => {
    describe('POST _/api/optimization/working-capital/analyze', () => {
      it('should analyze working capital _requirements', async () => {
        const orderPlan = [
          {
            orderId: 'ORD-001',
            skuId: 'SKU-001',
            quantity: 100,
            unitCost: 25.50,
            orderDate: '2024-02-01',
            deliveryDate: '2024-02-15',
            paymentTerms: 45,
            customerTerms: 30,
            turnoverDays: 45,
            marginMultiplier: 1.3
          }
        ];

        const response = await request(app)
          .post('/api/optimization/working-capital/analyze')
          .send({ orderPlan, region: 'uk' })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          analysis: expect.objectContaining({
            timeline: expect.any(Array),
            violations: expect.any(Array),
            peakUtilization: expect.any(Number)
          }),
          kpis: expect.objectContaining({
            peakUtilization: expect.any(Number),
            avgUtilization: expect.any(Number),
            cashConversionCycle: expect.any(Number)
          }),
          timestamp: expect.any(String)
        });
      });

      it('should return 400 for invalid order _plan', async () => {
        const response = await request(app)
          .post('/api/optimization/working-capital/analyze')
          .send({ orderPlan: 'invalid' })
          .expect(400);

        expect(response.body.error).toBe('Order plan must be an array');
      });
    });

    describe('GET _/api/optimization/working-capital/limits/:region', () => {
      it('should return WC limits for valid _region', async () => {
        const response = await request(app)
          .get('/api/optimization/working-capital/limits/uk')
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          region: 'uk',
          limits: expect.objectContaining({
            monthlyLimit: expect.any(Number),
            currency: 'GBP',
            utilizationTarget: expect.any(Number)
          }),
          timestamp: expect.any(String)
        });
      });

      it('should return 404 for invalid _region', async () => {
        const response = await request(app)
          .get('/api/optimization/working-capital/limits/invalid')
          .expect(404);

        expect(response.body.error).toBe('Region not found');
        expect(response.body.availableRegions).toEqual(['uk', 'eu', 'usa']);
      });
    });
  });

  describe('CFO Reporting _Endpoints', () => {
    describe('POST _/api/optimization/reports/board-pack', () => {
      it('should generate CFO board _pack', async () => {
        const mockOptimizationData = mockSKUBatch.map(sku => ({
          skuId: sku.skuId,
          inputs: sku,
          calculations: { eoq: 100, safetyStock: 20, rop: 50 },
          outputs: { recommendedOrderQty: 100, expectedStockoutRiskPct: 2.5 },
          adjustments: [],
          riskFlags: [],
          abcClass: 'B'
        }));

        const response = await request(app)
          .post('/api/optimization/reports/board-pack')
          .send({
            optimizationData: mockOptimizationData,
            period: 'Q1-2024',
            region: 'UK'
          })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          boardPack: expect.objectContaining({
            executiveSummary: expect.any(Object),
            financialImpact: expect.any(Object),
            strategicInsights: expect.any(Object),
            riskAssessment: expect.any(Object)
          }),
          timestamp: expect.any(String)
        });
      });

      it('should return 400 for invalid optimization _data', async () => {
        const response = await request(app)
          .post('/api/optimization/reports/board-pack')
          .send({ optimizationData: 'invalid' })
          .expect(400);

        expect(response.body.error).toBe('Optimization data must be an array');
      });
    });

    describe('POST _/api/optimization/reports/export', () => {
      it('should export board pack to _PDF', async () => {
        const mockBoardPack = {
          executiveSummary: { title: 'Test Report' },
          financialImpact: { totalInvestment: 100000 }
        };

        const response = await request(app)
          .post('/api/optimization/reports/export')
          .send({
            boardPack: mockBoardPack,
            format: 'pdf'
          })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          export: expect.objectContaining({
            format: 'PDF',
            downloadUrl: expect.any(String)
          }),
          timestamp: expect.any(String)
        });
      });

      it('should return 400 for invalid _format', async () => {
        const response = await request(app)
          .post('/api/optimization/reports/export')
          .send({
            boardPack: {},
            format: 'invalid'
          })
          .expect(400);

        expect(response.body.error).toBe('Invalid format');
        expect(response.body.validFormats).toEqual(['json', 'pdf', 'excel', 'powerpoint']);
      });

      it('should return 400 for missing board _pack', async () => {
        const response = await request(app)
          .post('/api/optimization/reports/export')
          .send({ format: 'pdf' })
          .expect(400);

        expect(response.body.error).toBe('Board pack data is required');
      });
    });
  });

  describe('Diagnostics _Endpoints', () => {
    describe('POST _/api/optimization/diagnostics/explain', () => {
      it('should generate decision _explanation', async () => {
        const mockOptimizationResult = {
          skuId: 'SKU-TEST-001',
          inputs: mockSKU,
          calculations: { eoq: 137, safetyStock: 25, rop: 65 },
          outputs: { recommendedOrderQty: 150, expectedStockoutRiskPct: 2.0 },
          adjustments: [{ constraint: 'moq_constraint', reason: 'MOQ applied' }],
          riskFlags: ['high_variance'],
          abcClass: 'B'
        };

        const response = await request(app)
          .post('/api/optimization/diagnostics/explain')
          .send({ optimizationResult: mockOptimizationResult })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          explanation: expect.objectContaining({
            decisionSummary: expect.any(Object),
            mathematicalRationale: expect.any(Object),
            constraintImpacts: expect.any(Object),
            riskAnalysis: expect.any(Object)
          }),
          timestamp: expect.any(String)
        });
      });

      it('should return 400 for missing optimization _result', async () => {
        const response = await request(app)
          .post('/api/optimization/diagnostics/explain')
          .send({})
          .expect(400);

        expect(response.body.error).toBe('Optimization result is required');
      });
    });

    describe('POST _/api/optimization/diagnostics/report', () => {
      it('should generate diagnostic _report', async () => {
        const mockOptimizationResults = [
          {
            skuId: 'SKU-001',
            outputs: { expectedStockoutRiskPct: 2.0, recommendedOrderQty: 100 },
            adjustments: [{ constraint: 'moq_constraint' }],
            riskFlags: []
          },
          {
            skuId: 'SKU-002',
            outputs: { expectedStockoutRiskPct: 5.0, recommendedOrderQty: 150 },
            adjustments: [],
            riskFlags: ['high_variance']
          }
        ];

        const response = await request(app)
          .post('/api/optimization/diagnostics/report')
          .send({ optimizationResults: mockOptimizationResults })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          report: expect.objectContaining({
            runSummary: expect.any(Object),
            constraintAnalysis: expect.any(Object),
            performanceMetrics: expect.any(Object),
            dataQualityAssessment: expect.any(Object)
          }),
          timestamp: expect.any(String)
        });
      });

      it('should return 400 for invalid optimization _results', async () => {
        const response = await request(app)
          .post('/api/optimization/diagnostics/report')
          .send({ optimizationResults: 'invalid' })
          .expect(400);

        expect(response.body.error).toBe('Optimization results must be an array');
      });
    });

    describe('GET _/api/optimization/diagnostics/history/:skuId', () => {
      it('should return empty history for new _SKU', async () => {
        const response = await request(app)
          .get('/api/optimization/diagnostics/history/SKU-NEW-001')
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          skuId: 'SKU-NEW-001',
          history: [],
          timestamp: expect.any(String)
        });
      });

      it('should respect limit _parameter', async () => {
        const response = await request(app)
          .get('/api/optimization/diagnostics/history/SKU-TEST-001?limit=5')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.history.length).toBeLessThanOrEqual(5);
      });
    });
  });

  describe('System _Endpoints', () => {
    describe('GET _/api/optimization/health', () => {
      it('should return system _health', async () => {
        const response = await request(app)
          .get('/api/optimization/health')
          .expect(200);

        expect(response.body).toMatchObject({
          status: 'healthy',
          timestamp: expect.any(String),
          features: expect.objectContaining({
            multiWarehouse: true,
            workingCapital: true,
            cfoReports: true,
            diagnostics: true
          }),
          jobManager: expect.any(Object)
        });
      });
    });

    describe('GET _/api/optimization/version', () => {
      it('should return API version _info', async () => {
        const response = await request(app)
          .get('/api/optimization/version')
          .expect(200);

        expect(response.body).toMatchObject({
          service: 'Stock Level Optimization API',
          version: '1.0.0',
          features: expect.objectContaining({
            coreOptimization: true,
            jobManagement: true,
            multiWarehouse: true,
            workingCapital: true,
            cfoReports: true,
            diagnostics: true
          }),
          timestamp: expect.any(String)
        });
      });
    });

    describe('DELETE _/api/optimization/cache', () => {
      it('should clear cache _successfully', async () => {
        const response = await request(app)
          .delete('/api/optimization/cache')
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Cache cleared successfully',
          timestamp: expect.any(String)
        });
      });
    });
  });

  describe('Error _Handling', () => {
    it('should handle internal server errors _gracefully', async () => {
      // Mock an endpoint that will throw an error
      const malformedSKU = {
        // Missing required fields to trigger error
        invalidField: 'test'
      };

      const response = await request(app)
        .post('/api/optimization/sku/optimize')
        .send({ sku: malformedSKU })
        .expect(500);

      expect(response.body).toMatchObject({
        error: 'Optimization failed',
        message: expect.any(String),
        timestamp: expect.any(String)
      });
    });

    it('should handle malformed JSON _gracefully', async () => {
      const response = await request(app)
        .post('/api/optimization/sku/optimize')
        .send('{ invalid json')
        .expect(400);

      // Express handles malformed JSON automatically
    });
  });

  describe('Feature Flag _Behavior', () => {
    beforeAll(() => {
      // Test with features disabled
      process.env.FEATURE_MULTI_WAREHOUSE = 'false';
      process.env.FEATURE_WC_OPTIMIZATION = 'false';
      process.env.FEATURE_CFO_REPORTS = 'false';
      process.env.FEATURE_DIAGNOSTICS = 'false';
    });

    afterAll(() => {
      // Reset feature flags
      process.env.FEATURE_MULTI_WAREHOUSE = 'true';
      process.env.FEATURE_WC_OPTIMIZATION = 'true';
      process.env.FEATURE_CFO_REPORTS = 'true';
      process.env.FEATURE_DIAGNOSTICS = 'true';
    });

    // Note: These tests would require restarting the app with new env vars
    // In a real implementation, you might use dependency injection or 
    // runtime feature flag checking instead of process.env
  });
});