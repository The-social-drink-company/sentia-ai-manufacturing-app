import express from 'express';
import { requireAuth } from '@clerk/backend';
import sentiaAIOrchestrator from '../services/SentiaAIOrchestrator.js';
import logger from '../services/logger.js';

const router = express.Router();

// Middleware to check authentication
const authMiddleware = requireAuth({ 
  apiKey: process.env.CLERK_SECRET_KEY 
});

/**
 * Initialize AI Systems
 * POST /api/ai/initialize
 */
router.post('/initialize', authMiddleware, async (req, res) => {
  try {
    const result = await sentiaAIOrchestrator.initialize();
    res.json(result);
  } catch (error) {
    logger.error('AI initialization failed:', error);
    res.status(500).json({ 
      error: 'Failed to initialize AI systems',
      details: error.message 
    });
  }
});

/**
 * Get System Status
 * GET /api/ai/status
 */
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const status = sentiaAIOrchestrator.getSystemStatus();
    res.json(status);
  } catch (error) {
    logger.error('Failed to get system status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get System Health
 * GET /api/ai/health
 */
router.get('/health', authMiddleware, async (req, res) => {
  try {
    const health = sentiaAIOrchestrator.getSystemHealth();
    res.json(health);
  } catch (error) {
    logger.error('Failed to get system health:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Execute Unified Query
 * POST /api/ai/query
 */
router.post('/query', authMiddleware, async (req, res) => {
  try {
    const { query, options } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const result = await sentiaAIOrchestrator.executeUnifiedQuery(query, options);
    res.json(result);
  } catch (error) {
    logger.error('Query execution failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Start Production Batch
 * POST /api/ai/production/start
 */
router.post('/production/start', authMiddleware, async (req, res) => {
  try {
    const { productType, quantity, options } = req.body;
    
    if (!productType || !quantity) {
      return res.status(400).json({ 
        error: 'Product type and quantity are required' 
      });
    }

    const result = await sentiaAIOrchestrator.startProductionBatch(
      productType,
      quantity,
      options
    );
    res.json(result);
  } catch (error) {
    logger.error('Production start failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Generate Forecast
 * POST /api/ai/forecast
 */
router.post('/forecast', authMiddleware, async (req, res) => {
  try {
    const { productSKU, options } = req.body;
    
    if (!productSKU) {
      return res.status(400).json({ error: 'Product SKU is required' });
    }

    const forecast = await sentiaAIOrchestrator.generateForecast(productSKU, options);
    res.json(forecast);
  } catch (error) {
    logger.error('Forecast generation failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get Unified Dashboard
 * GET /api/ai/dashboard/:type
 */
router.get('/dashboard/:type', authMiddleware, async (req, res) => {
  try {
    const { type } = req.params;
    const dashboard = await sentiaAIOrchestrator.getUnifiedDashboard(type);
    res.json(dashboard);
  } catch (error) {
    logger.error('Dashboard generation failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Perform Quality Inspection
 * POST /api/ai/quality/inspect
 */
router.post('/quality/inspect', authMiddleware, async (req, res) => {
  try {
    const { imageData, inspectionType, productInfo } = req.body;
    
    if (!imageData || !inspectionType || !productInfo) {
      return res.status(400).json({ 
        error: 'Image data, inspection type, and product info are required' 
      });
    }

    const result = await sentiaAIOrchestrator.performQualityInspection(
      imageData,
      inspectionType,
      productInfo
    );
    res.json(result);
  } catch (error) {
    logger.error('Quality inspection failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get Analytics Dashboard Data
 * GET /api/ai/analytics/:dashboardId
 */
router.get('/analytics/:dashboardId', authMiddleware, async (req, res) => {
  try {
    const { dashboardId } = req.params;
    
    if (!sentiaAIOrchestrator.systems.analytics) {
      return res.status(503).json({ 
        error: 'Analytics system not initialized' 
      });
    }

    const dashboardData = await sentiaAIOrchestrator.systems.analytics.getDashboardData(dashboardId);
    res.json(dashboardData);
  } catch (error) {
    logger.error('Analytics dashboard failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get Digital Twin 3D Scene
 * GET /api/ai/digital-twin/scene
 */
router.get('/digital-twin/scene', authMiddleware, async (req, res) => {
  try {
    if (!sentiaAIOrchestrator.systems.digitalTwin) {
      return res.status(503).json({ 
        error: 'Digital Twin system not initialized' 
      });
    }

    const sceneData = sentiaAIOrchestrator.systems.digitalTwin.generate3DSceneData(
      req.query.cameraView || 'overview'
    );
    res.json(sceneData);
  } catch (error) {
    logger.error('Digital twin scene failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get Supply Chain Dashboard
 * GET /api/ai/supply-chain/dashboard
 */
router.get('/supply-chain/dashboard', authMiddleware, async (req, res) => {
  try {
    if (!sentiaAIOrchestrator.systems.supplyChain) {
      return res.status(503).json({ 
        error: 'Supply Chain system not initialized' 
      });
    }

    const dashboard = sentiaAIOrchestrator.systems.supplyChain.getSupplyChainDashboard();
    res.json(dashboard);
  } catch (error) {
    logger.error('Supply chain dashboard failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get Maintenance Dashboard
 * GET /api/ai/maintenance/dashboard
 */
router.get('/maintenance/dashboard', authMiddleware, async (req, res) => {
  try {
    if (!sentiaAIOrchestrator.systems.maintenance) {
      return res.status(503).json({ 
        error: 'Maintenance system not initialized' 
      });
    }

    const dashboard = sentiaAIOrchestrator.systems.maintenance.getMaintenanceDashboard();
    res.json(dashboard);
  } catch (error) {
    logger.error('Maintenance dashboard failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get Quality Dashboard
 * GET /api/ai/quality/dashboard
 */
router.get('/quality/dashboard', authMiddleware, async (req, res) => {
  try {
    if (!sentiaAIOrchestrator.systems.quality) {
      return res.status(503).json({ 
        error: 'Quality system not initialized' 
      });
    }

    const dashboard = sentiaAIOrchestrator.systems.quality.getQualityDashboard();
    res.json(dashboard);
  } catch (error) {
    logger.error('Quality dashboard failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Conversational AI Chat
 * POST /api/ai/chat
 */
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!sentiaAIOrchestrator.systems.agent) {
      return res.status(503).json({ 
        error: 'Conversational agent not initialized' 
      });
    }

    const userId = req.auth.userId;
    const response = await sentiaAIOrchestrator.systems.agent.processUserInput(
      message,
      userId,
      sessionId
    );
    
    res.json(response);
  } catch (error) {
    logger.error('Chat processing failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Generate Executive Report
 * GET /api/ai/reports/executive
 */
router.get('/reports/executive', authMiddleware, async (req, res) => {
  try {
    if (!sentiaAIOrchestrator.systems.analytics) {
      return res.status(503).json({ 
        error: 'Analytics system not initialized' 
      });
    }

    const report = await sentiaAIOrchestrator.systems.analytics.generateExecutiveReport();
    res.json(report);
  } catch (error) {
    logger.error('Executive report generation failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get Manufacturing Execution Dashboard
 * GET /api/ai/execution/dashboard
 */
router.get('/execution/dashboard', authMiddleware, async (req, res) => {
  try {
    if (!sentiaAIOrchestrator.systems.execution) {
      return res.status(503).json({ 
        error: 'Manufacturing execution system not initialized' 
      });
    }

    const dashboard = sentiaAIOrchestrator.systems.execution.getExecutionDashboard();
    res.json(dashboard);
  } catch (error) {
    logger.error('Execution dashboard failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get Botanical Procurement Recommendations
 * POST /api/ai/procurement/recommendations
 */
router.post('/procurement/recommendations', authMiddleware, async (req, res) => {
  try {
    const { botanical, timeHorizon } = req.body;
    
    if (!botanical) {
      return res.status(400).json({ error: 'Botanical is required' });
    }

    if (!sentiaAIOrchestrator.systems.supplyChain) {
      return res.status(503).json({ 
        error: 'Supply chain system not initialized' 
      });
    }

    const recommendations = await sentiaAIOrchestrator.systems.supplyChain
      .generateProcurementRecommendations(botanical, timeHorizon);
    
    res.json(recommendations);
  } catch (error) {
    logger.error('Procurement recommendations failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Shutdown AI Systems
 * POST /api/ai/shutdown
 */
router.post('/shutdown', authMiddleware, async (req, res) => {
  try {
    // Only allow admin users to shutdown
    const userRole = req.auth.sessionClaims?.metadata?.role;
    
    if (userRole !== 'admin') {
      return res.status(403).json({ 
        error: 'Insufficient permissions. Admin role required.' 
      });
    }

    await sentiaAIOrchestrator.shutdown();
    res.json({ 
      success: true, 
      message: 'AI systems shutdown complete' 
    });
  } catch (error) {
    logger.error('AI shutdown failed:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;