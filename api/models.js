/**
 * Model Registry API Routes
 */

import express from 'express';
import { modelRegistry } from '../services/models/modelRegistry.js';
import { logInfo, logError } from '../services/observability/structuredLogger.js';

const router = express.Router();

// Check if feature is enabled
const checkFeatureEnabled = (req, res, next) => {
  if (process.env.FEATURE_MODEL_REGISTRY !== 'true') {
    return res.status(403).json({
      success: false,
      error: 'Model Registry feature is disabled'
    });
  }
  next();
};

// POST /models/artifacts - Register a new artifact
router.post('/models/artifacts', checkFeatureEnabled, async (req, res) => {
  try {
    const { type, runId, entityId, region, metrics, params, artifactUrl, tags, version } = req.body;
    
    if (!type) {
      return res.status(400).json({
        success: false,
        error: 'Type is required'
      });
    }

    const artifact = await modelRegistry.registerArtifact(type, {
      runId,
      entityId,
      region,
      metrics,
      params,
      artifactUrl,
      tags,
      version,
      userId: req.user?.id
    });

    res.json({
      success: true,
      data: artifact
    });

  } catch (error) {
    logError('Failed to register artifact', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /models/artifacts - Get artifacts
router.get('/models/artifacts', checkFeatureEnabled, async (req, res) => {
  try {
    const { type, entityId, region, from, to, status } = req.query;
    
    const artifacts = await modelRegistry.getArtifacts({
      type,
      entityId,
      region,
      from,
      to,
      status
    });

    res.json({
      success: true,
      data: artifacts
    });

  } catch (error) {
    logError('Failed to fetch artifacts', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /models/baseline/:type - Get current baseline
router.get('/models/baseline/:type', checkFeatureEnabled, async (req, res) => {
  try {
    const { type } = req.params;
    const { entityId, region } = req.query;
    
    const baseline = await modelRegistry.getCurrentBaseline(type, entityId, region);

    res.json({
      success: true,
      data: baseline
    });

  } catch (error) {
    logError('Failed to fetch baseline', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /models/baseline-history/:type - Get baseline history
router.get('/models/baseline-history/:type', checkFeatureEnabled, async (req, res) => {
  try {
    const { type } = req.params;
    const { entityId, region, limit = 10 } = req.query;
    
    const history = await modelRegistry.getBaselineHistory(
      type,
      entityId,
      region,
      parseInt(limit)
    );

    res.json({
      success: true,
      data: history
    });

  } catch (error) {
    logError('Failed to fetch baseline history', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /models/baseline/propose - Propose baseline change
router.post('/models/baseline/propose', checkFeatureEnabled, async (req, res) => {
  try {
    const { type, artifactId, notes } = req.body;
    
    if (!type || !artifactId) {
      return res.status(400).json({
        success: false,
        error: 'Type and artifactId are required'
      });
    }

    // Check permissions
    if (!req.user || !['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    const result = await modelRegistry.proposeBaselineChange(type, artifactId, {
      approverId: req.user.id,
      notes,
      approved: req.user.role === 'admin' // Auto-approve for admins
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logError('Failed to propose baseline', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /models/baseline/:id/rollback - Rollback baseline
router.post('/models/baseline/:id/rollback', checkFeatureEnabled, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    // Admin only
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin privileges required'
      });
    }

    const result = await modelRegistry.rollbackBaseline(
      id,
      req.user.id,
      reason || 'Manual rollback'
    );

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logError('Failed to rollback baseline', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /models/trends/:type - Get performance trends
router.get('/models/trends/:type', checkFeatureEnabled, async (req, res) => {
  try {
    const { type } = req.params;
    const { entityId, region, days = 30 } = req.query;
    
    const trends = await modelRegistry.getPerformanceTrends(
      type,
      entityId,
      region,
      parseInt(days)
    );

    res.json({
      success: true,
      data: trends
    });

  } catch (error) {
    logError('Failed to fetch trends', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /models/export/baseline-note/:id - Export baseline change note
router.get('/models/export/baseline-note/:id', checkFeatureEnabled, async (req, res) => {
  try {
    const { id } = req.params;
    
    const note = await modelRegistry.exportBaselineChangeNote(id);

    res.json({
      success: true,
      data: note
    });

  } catch (error) {
    logError('Failed to export baseline note', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /models/archive - Archive old artifacts
router.post('/models/archive', checkFeatureEnabled, async (req, res) => {
  try {
    // Admin only
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin privileges required'
      });
    }

    const { daysToKeep = 90 } = req.body;
    
    const count = await modelRegistry.archiveOldArtifacts(parseInt(daysToKeep));

    res.json({
      success: true,
      data: {
        archived: count
      }
    });

  } catch (error) {
    logError('Failed to archive artifacts', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;