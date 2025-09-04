/**
 * Agent API Routes
 */

import express from 'express';
import { agentOrchestrator } from '../services/agent/orchestrator.js';
import { toolCatalog } from '../services/agent/toolCatalog.js';
import { logInfo, logError } from '../services/observability/structuredLogger.js';

const router = express.Router();

// Check if agent feature is enabled
const checkFeatureEnabled = (req, res, next) => {
  if (process.env.FEATURE_AGENT !== 'true') {
    return res.status(403).json({
      success: false,
      error: 'Agent feature is disabled'
    });
  }
  next();
};

// POST /agent/run - Start a new agent run
router.post('/agent/run', checkFeatureEnabled, async (req, res) => {
  try {
    const { goal, mode = 'DRY_RUN', scope = {}, budgets = {} } = req.body;
    const userId = req.user?.id;

    if (!goal) {
      return res.status(400).json({
        success: false,
        error: 'Goal is required'
      });
    }

    // Validate mode
    if (!['DRY_RUN', 'PROPOSE', 'EXECUTE'].includes(mode)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid mode. Must be DRY_RUN, PROPOSE, or EXECUTE'
      });
    }

    // Check permissions for EXECUTE mode
    if (mode === 'EXECUTE' && (!req.user || req.user.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        error: 'EXECUTE mode requires admin privileges'
      });
    }

    const result = await agentOrchestrator.run(goal, {
      mode,
      scope,
      budgets,
      userId
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logError('Agent run failed', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /agent/runs/:runId - Get run status
router.get('/agent/runs/:runId', checkFeatureEnabled, async (req, res) => {
  try {
    const { runId } = req.params;
    
    const run = await agentOrchestrator.getRunStatus(runId);
    
    if (!run) {
      return res.status(404).json({
        success: false,
        error: 'Run not found'
      });
    }

    res.json({
      success: true,
      data: run
    });

  } catch (error) {
    logError('Failed to get run status', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /agent/runs/:runId/approve - Approve a step
router.post('/agent/runs/:runId/approve', checkFeatureEnabled, async (req, res) => {
  try {
    const { runId } = req.params;
    const { stepId } = req.body;
    const approverId = req.user?.id;

    if (!stepId) {
      return res.status(400).json({
        success: false,
        error: 'Step ID is required'
      });
    }

    if (!approverId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const approval = await agentOrchestrator.approveStep(runId, stepId, approverId);

    res.json({
      success: true,
      data: approval
    });

  } catch (error) {
    logError('Failed to approve step', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /agent/tools - Get available tools
router.get('/agent/tools', checkFeatureEnabled, async (req, res) => {
  try {
    const tools = toolCatalog.getAllTools();

    res.json({
      success: true,
      data: tools
    });

  } catch (error) {
    logError('Failed to get tools', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /agent/tools/:toolId/schema - Get tool schema
router.get('/agent/tools/:toolId/schema', checkFeatureEnabled, async (req, res) => {
  try {
    const { toolId } = req.params;
    const tool = toolCatalog.getTool(toolId);

    if (!tool) {
      return res.status(404).json({
        success: false,
        error: 'Tool not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: tool.id,
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        outputSchema: tool.outputSchema,
        requiresApproval: tool.requiresApproval
      }
    });

  } catch (error) {
    logError('Failed to get tool schema', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;