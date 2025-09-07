/**
 * Stock Level Optimization API Endpoints
 * Comprehensive optimization API with job management, CFO reporting, and multi-warehouse capabilities
 */

import express from 'express';
import { logError } from '../services/observability/structuredLogger.js';
import OptimizationService from '../services/optimization/OptimizationService.js';
import MultiWarehouseService from '../services/optimization/MultiWarehouseService.js';
import WorkingCapitalService from '../services/optimization/WorkingCapitalService.js';
import DiagnosticsService from '../services/optimization/DiagnosticsService.js';
import CFOReportingService from '../services/optimization/CFOReportingService.js';
import JobManagerService from '../services/optimization/JobManagerService.js';
import { logError } from '../services/logger.js';

const router = express.Router();

// Feature flags
const FEATURE_MULTI_WH = process.env.FEATURE_MULTI_WAREHOUSE === 'true' || false;
const FEATURE_WC_OPTIMIZATION = process.env.FEATURE_WC_OPTIMIZATION === 'true' || false;
const FEATURE_CFO_REPORTS = process.env.FEATURE_CFO_REPORTS === 'true' || false;
const FEATURE_DIAGNOSTICS = process.env.FEATURE_DIAGNOSTICS === 'true' || false;

// ========================================
// CORE OPTIMIZATION ENDPOINTS
// ========================================

/**
 * POST /api/optimization/sku/optimize
 * Optimize single SKU with constraint handling
 */
router.post('/sku/optimize', async (req, res) => {
  try {
    const { sku, constraints = {}, demandHistory = [] } = req.body;

    if (!sku || !sku.skuId) {
      return res.status(400).json({ 
        error: 'Missing required SKU data',
        required: ['skuId', 'annualDemand', 'demandMean', 'demandStdDev', 'leadTimeDays', 'unitCost']
      });
    }

    const result = await OptimizationService.optimizeSKU(sku, constraints, demandHistory);

    // Generate explanation if diagnostics enabled
    let explanation = null;
    if (FEATURE_DIAGNOSTICS) {
      explanation = DiagnosticsService.explainDecision(result);
    }

    res.json({
      success: true,
      result,
      explanation,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logError('SKU optimization failed', error);
    res.status(500).json({
      error: 'Optimization failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/optimization/batch/optimize
 * Optimize batch of SKUs with global constraints
 */
router.post('/batch/optimize', async (req, res) => {
  try {
    const { skus, globalConstraints = {} } = req.body;

    if (!Array.isArray(skus) || skus.length === 0) {
      return res.status(400).json({ 
        error: 'Missing or empty SKUs array'
      });
    }

    const result = await OptimizationService.optimizeBatch(skus, globalConstraints);

    res.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logError('Batch optimization failed', error);
    res.status(500).json({
      error: 'Batch optimization failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/optimization/jobs/create
 * Create asynchronous optimization job
 */
router.post('/jobs/create', async (req, res) => {
  try {
    const { jobType, payload, options = {} } = req.body;

    if (!jobType || !payload) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['jobType', 'payload']
      });
    }

    const validJobTypes = [
      'SKU_OPTIMIZATION',
      'BATCH_OPTIMIZATION', 
      'MULTI_WAREHOUSE_OPTIMIZATION',
      'WC_ANALYSIS',
      'CFO_REPORT_GENERATION',
      'DIAGNOSTICS_ANALYSIS'
    ];

    if (!validJobTypes.includes(jobType)) {
      return res.status(400).json({
        error: 'Invalid job type',
        validTypes: validJobTypes
      });
    }

    const job = await JobManagerService.createJob(jobType, payload, {
      ...options,
      userId: req.user?.id || 'anonymous'
    });

    res.status(201).json({
      success: true,
      job,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logError('Job creation failed', error);
    res.status(500).json({
      error: 'Job creation failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/optimization/jobs/:jobId/status
 * Get job status and results
 */
router.get('/jobs/:jobId/status', async (req, res) => {
  try {
    const { jobId } = req.params;
    const status = JobManagerService.getJobStatus(jobId);

    if (status.error) {
      return res.status(404).json({
        error: status.error,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      ...status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logError('Job status retrieval failed', error);
    res.status(500).json({
      error: 'Failed to retrieve job status',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * DELETE /api/optimization/jobs/:jobId
 * Cancel optimization job
 */
router.delete('/jobs/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const result = await JobManagerService.cancelJob(jobId);

    res.json({
      success: true,
      jobId,
      ...result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logError('Job cancellation failed', error);
    res.status(400).json({
      error: 'Job cancellation failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/optimization/queue/status
 * Get job queue status
 */
router.get('/queue/status', async (req, res) => {
  try {
    const queueStatus = JobManagerService.getQueueStatus();
    const healthMetrics = JobManagerService.getHealthMetrics();

    res.json({
      success: true,
      queue: queueStatus,
      health: healthMetrics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logError('Queue status retrieval failed', error);
    res.status(500).json({
      error: 'Failed to retrieve queue status',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ========================================
// MULTI-WAREHOUSE ENDPOINTS (Feature Flag)
// ========================================

if (FEATURE_MULTI_WH) {
  /**
   * POST /api/optimization/multi-warehouse/optimize
   * Multi-warehouse optimization with cross-border capabilities
   */
  router.post('/multi-warehouse/optimize', async (req, res) => {
    try {
      const { skus, demandByRegion, constraints = {} } = req.body;

      if (!skus || !demandByRegion) {
        return res.status(400).json({
          error: 'Missing required fields',
          required: ['skus', 'demandByRegion']
        });
      }

      const plan = await MultiWarehouseService.generateMultiWarehousePlan(
        skus, 
        demandByRegion, 
        constraints
      );

      res.json({
        success: true,
        plan,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logError('Multi-warehouse optimization failed', error);
      res.status(500).json({
        error: 'Multi-warehouse optimization failed',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * POST /api/optimization/multi-warehouse/source-selection
   * Optimal source warehouse selection
   */
  router.post('/multi-warehouse/source-selection', async (req, res) => {
    try {
      const { sku, demandRegion, availableSources } = req.body;

      if (!sku || !demandRegion || !availableSources) {
        return res.status(400).json({
          error: 'Missing required fields',
          required: ['sku', 'demandRegion', 'availableSources']
        });
      }

      const sourceSelection = await MultiWarehouseService.selectOptimalSource(
        sku, 
        demandRegion, 
        availableSources
      );

      res.json({
        success: true,
        sourceSelection,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logError('Source selection failed', error);
      res.status(500).json({
        error: 'Source selection failed',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * POST /api/optimization/multi-warehouse/transfers/optimize
   * Optimize inter-warehouse transfers
   */
  router.post('/multi-warehouse/transfers/optimize', async (req, res) => {
    try {
      const { transferRequests } = req.body;

      if (!Array.isArray(transferRequests)) {
        return res.status(400).json({
          error: 'Transfer requests must be an array'
        });
      }

      const optimizedTransfers = await MultiWarehouseService.optimizeTransfers(transferRequests);

      res.json({
        success: true,
        transfers: optimizedTransfers,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logError('Transfer optimization failed', error);
      res.status(500).json({
        error: 'Transfer optimization failed',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * GET /api/optimization/multi-warehouse/config/:region
   * Get warehouse configuration for region
   */
  router.get('/multi-warehouse/config/:region', async (req, res) => {
    try {
      const { region } = req.params;
      const config = MultiWarehouseService.getWarehouseConfig(region);

      if (!config) {
        return res.status(404).json({
          error: 'Region not found',
          availableRegions: ['uk', 'eu', 'usa']
        });
      }

      res.json({
        success: true,
        region,
        config,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logError('Config retrieval failed', error);
      res.status(500).json({
        error: 'Failed to retrieve warehouse config',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });
}

// ========================================
// WORKING CAPITAL ENDPOINTS (Feature Flag)
// ========================================

if (FEATURE_WC_OPTIMIZATION) {
  /**
   * POST /api/optimization/working-capital/analyze
   * Analyze working capital requirements
   */
  router.post('/working-capital/analyze', async (req, res) => {
    try {
      const { orderPlan, region = 'uk' } = req.body;

      if (!Array.isArray(orderPlan)) {
        return res.status(400).json({
          error: 'Order plan must be an array'
        });
      }

      const wcAnalysis = WorkingCapitalService.calculateWCRequirements(orderPlan, region);
      const kpis = WorkingCapitalService.generateWCKPIs(wcAnalysis, region);

      res.json({
        success: true,
        analysis: wcAnalysis,
        kpis,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logError('WC analysis failed', error);
      res.status(500).json({
        error: 'Working capital analysis failed',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * POST /api/optimization/working-capital/optimize-payments
   * Optimize payment timing for early pay discounts
   */
  router.post('/working-capital/optimize-payments', async (req, res) => {
    try {
      const { orderPlan, wcConfig } = req.body;

      if (!Array.isArray(orderPlan)) {
        return res.status(400).json({
          error: 'Order plan must be an array'
        });
      }

      const optimizedPlan = WorkingCapitalService.optimizePaymentTiming(orderPlan, wcConfig);

      res.json({
        success: true,
        optimizedPlan,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logError('Payment optimization failed', error);
      res.status(500).json({
        error: 'Payment optimization failed',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * POST /api/optimization/working-capital/apply-constraints
   * Apply WC constraints to order plan
   */
  router.post('/working-capital/apply-constraints', async (req, res) => {
    try {
      const { orderPlan, region = 'uk' } = req.body;

      if (!Array.isArray(orderPlan)) {
        return res.status(400).json({
          error: 'Order plan must be an array'
        });
      }

      const constrainedResult = WorkingCapitalService.applyWCConstraints(orderPlan, region);

      res.json({
        success: true,
        ...constrainedResult,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logError('WC constraint application failed', error);
      res.status(500).json({
        error: 'WC constraint application failed',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * GET /api/optimization/working-capital/limits/:region
   * Get WC limits for region
   */
  router.get('/working-capital/limits/:region', async (req, res) => {
    try {
      const { region } = req.params;
      const limits = WorkingCapitalService.getWCLimits(region);

      if (!limits) {
        return res.status(404).json({
          error: 'Region not found',
          availableRegions: ['uk', 'eu', 'usa']
        });
      }

      res.json({
        success: true,
        region,
        limits,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logError('WC limits retrieval failed', error);
      res.status(500).json({
        error: 'Failed to retrieve WC limits',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });
}

// ========================================
// CFO REPORTING ENDPOINTS (Feature Flag)
// ========================================

if (FEATURE_CFO_REPORTS) {
  /**
   * POST /api/optimization/reports/board-pack
   * Generate CFO board pack
   */
  router.post('/reports/board-pack', async (req, res) => {
    try {
      const { optimizationData, period = 'Q1-2024', region = 'ALL' } = req.body;

      if (!Array.isArray(optimizationData)) {
        return res.status(400).json({
          error: 'Optimization data must be an array'
        });
      }

      const boardPack = await CFOReportingService.generateBoardPack(
        optimizationData, 
        period, 
        region
      );

      res.json({
        success: true,
        boardPack,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logError('Board pack generation failed', error);
      res.status(500).json({
        error: 'Board pack generation failed',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * POST /api/optimization/reports/export
   * Export board pack to various formats
   */
  router.post('/reports/export', async (req, res) => {
    try {
      const { boardPack, format = 'json' } = req.body;

      if (!boardPack) {
        return res.status(400).json({
          error: 'Board pack data is required'
        });
      }

      const validFormats = ['json', 'pdf', 'excel', 'powerpoint'];
      if (!validFormats.includes(format.toLowerCase())) {
        return res.status(400).json({
          error: 'Invalid format',
          validFormats
        });
      }

      const exportResult = await CFOReportingService.exportBoardPack(boardPack, format);

      res.json({
        success: true,
        export: exportResult,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logError('Board pack export failed', error);
      res.status(500).json({
        error: 'Board pack export failed',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });
}

// ========================================
// DIAGNOSTICS ENDPOINTS (Feature Flag)
// ========================================

if (FEATURE_DIAGNOSTICS) {
  /**
   * POST /api/optimization/diagnostics/explain
   * Generate decision explanation
   */
  router.post('/diagnostics/explain', async (req, res) => {
    try {
      const { optimizationResult } = req.body;

      if (!optimizationResult) {
        return res.status(400).json({
          error: 'Optimization result is required'
        });
      }

      const explanation = DiagnosticsService.explainDecision(optimizationResult);

      res.json({
        success: true,
        explanation,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logError('Decision explanation failed', error);
      res.status(500).json({
        error: 'Decision explanation failed',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * POST /api/optimization/diagnostics/report
   * Generate diagnostic report for optimization batch
   */
  router.post('/diagnostics/report', async (req, res) => {
    try {
      const { optimizationResults } = req.body;

      if (!Array.isArray(optimizationResults)) {
        return res.status(400).json({
          error: 'Optimization results must be an array'
        });
      }

      const diagnosticReport = DiagnosticsService.generateDiagnosticReport(optimizationResults);

      res.json({
        success: true,
        report: diagnosticReport,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logError('Diagnostic report generation failed', error);
      res.status(500).json({
        error: 'Diagnostic report generation failed',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * GET /api/optimization/diagnostics/history/:skuId
   * Get decision history for SKU
   */
  router.get('/diagnostics/history/:skuId', async (req, res) => {
    try {
      const { skuId } = req.params;
      const { limit = 10 } = req.query;

      const history = DiagnosticsService.getDecisionHistory(skuId, parseInt(limit));

      res.json({
        success: true,
        skuId,
        history,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logError('Decision history retrieval failed', error);
      res.status(500).json({
        error: 'Failed to retrieve decision history',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });
}

// ========================================
// SYSTEM ENDPOINTS
// ========================================

/**
 * GET /api/optimization/health
 * System health check
 */
router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      features: {
        multiWarehouse: FEATURE_MULTI_WH,
        workingCapital: FEATURE_WC_OPTIMIZATION,
        cfoReports: FEATURE_CFO_REPORTS,
        diagnostics: FEATURE_DIAGNOSTICS
      },
      jobManager: JobManagerService.getHealthMetrics()
    };

    res.json(health);

  } catch (error) {
    logError('Health check failed', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/optimization/version
 * API version info
 */
router.get('/version', async (req, res) => {
  res.json({
    service: 'Stock Level Optimization API',
    version: '1.0.0',
    features: {
      coreOptimization: true,
      jobManagement: true,
      multiWarehouse: FEATURE_MULTI_WH,
      workingCapital: FEATURE_WC_OPTIMIZATION,
      cfoReports: FEATURE_CFO_REPORTS,
      diagnostics: FEATURE_DIAGNOSTICS
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * Cache management
 */
router.delete('/cache', async (req, res) => {
  try {
    OptimizationService.clearCache();
    
    res.json({
      success: true,
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logError('Cache clear failed', error);
    res.status(500).json({
      error: 'Cache clear failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
router.use((error, req, res, next) => {
  logError('Optimization API Error', error);
  
  res.status(error.status || 500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred',
    timestamp: new Date().toISOString()
  });
});

export default router;