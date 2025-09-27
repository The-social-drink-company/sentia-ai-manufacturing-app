/**
 * Data Quality API Routes
 */

import express from 'express';
import { dqEngine } from '../services/dataQuality/dqEngine.js';
import { logError } from '../services/logger.js';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Check if DQ feature is enabled
const checkFeatureEnabled = (req, res, _next) => {
  if (process.env.FEATURE_DQ !== 'true') {
    return res.status(403).json({
      success: false,
      error: 'Data Quality feature is disabled'
    });
  }
  next();
};

// POST /dq/run - Run DQ checks for a dataset
router.post(_'/dq/run', checkFeatureEnabled, async (req, res) => {
  try {
    const { dataset } = req.body;
    
    if (!dataset) {
      return res.status(400).json({
        success: false,
        error: 'Dataset is required'
      });
    }

    const result = await dqEngine.runDQChecks(dataset, {
      profileId: req.user?.id
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logError('DQ run failed', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /dq/runs - Get DQ runs for a dataset
router.get(_'/dq/runs', checkFeatureEnabled, async (req, res) => {
  try {
    const { dataset, limit = 10 } = req.query;
    
    const runs = await prisma.dQRuns.findMany({
      where: dataset ? { dataset } : {},
      orderBy: { startedAt: 'desc' },
      take: parseInt(limit)
    });

    res.json({
      success: true,
      data: runs
    });

  } catch (error) {
    logError('Failed to fetch DQ runs', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /dq/findings - Get DQ findings
router.get(_'/dq/findings', checkFeatureEnabled, async (req, res) => {
  try {
    const { dataset, runId, limit = 10, severity } = req.query;
    
    let where = {};
    
    if (runId) {
      where.runId = runId;
    } else if (dataset) {
      // Get latest run for dataset
      const latestRun = await prisma.dQRuns.findFirst({
        where: { dataset },
        orderBy: { startedAt: 'desc' }
      });
      
      if (latestRun) {
        where.runId = latestRun.id;
      }
    }
    
    if (severity) {
      where.severity = severity;
    }

    const findings = await prisma.dQFindings.findMany({
      where,
      orderBy: { impactValueBase: 'desc' },
      take: parseInt(limit)
    });

    res.json({
      success: true,
      data: findings
    });

  } catch (error) {
    logError('Failed to fetch findings', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /dq/freshness - Get freshness status
router.get(_'/dq/freshness', checkFeatureEnabled, async (req, res) => {
  try {
    const status = await dqEngine.getFreshnessStatus();
    
    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    logError('Failed to get freshness status', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /dq/lineage - Get lineage information
router.get(_'/dq/lineage', checkFeatureEnabled, async (req, res) => {
  try {
    const { importJobId, limit = 10 } = req.query;
    
    const where = {};
    if (importJobId) {
      where.importJobId = parseInt(importJobId);
    }
    
    const lineage = await prisma.importLineage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    res.json({
      success: true,
      data: lineage
    });

  } catch (error) {
    logError('Failed to fetch lineage', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /dq/rules - Get DQ rules
router.get(_'/dq/rules', checkFeatureEnabled, async (req, res) => {
  try {
    const { dataset, active = true } = req.query;
    
    const where = {
      ...(dataset && { dataset }),
      ...(active !== undefined && { active: active === 'true' })
    };

    const rules = await prisma.dQRules.findMany({
      where,
      orderBy: { dataset: 'asc' }
    });

    res.json({
      success: true,
      data: rules
    });

  } catch (error) {
    logError('Failed to fetch rules', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /dq/rules - Create or update DQ rule
router.post(_'/dq/rules', checkFeatureEnabled, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin privileges required'
      });
    }

    const { dataset, ruleKey, severity, configJson, active = true } = req.body;
    
    if (!dataset || !ruleKey || !severity) {
      return res.status(400).json({
        success: false,
        error: 'Dataset, ruleKey, and severity are required'
      });
    }

    const rule = await prisma.dQRules.upsert({
      where: {
        dataset_ruleKey: {
          dataset,
          ruleKey
        }
      },
      update: {
        severity,
        configJson,
        active
      },
      create: {
        dataset,
        ruleKey,
        severity,
        configJson,
        active
      }
    });

    res.json({
      success: true,
      data: rule
    });

  } catch (error) {
    logError('Failed to create/update rule', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /dq/export/brief - Export DQ daily brief
router.get(_'/dq/export/brief', checkFeatureEnabled, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get today's runs and findings
    const runs = await prisma.dQRuns.findMany({
      where: {
        startedAt: { gte: today }
      },
      include: {
        findings: {
          take: 5,
          orderBy: { impactValueBase: 'desc' }
        }
      }
    });

    // Get freshness status
    const freshness = await dqEngine.getFreshnessStatus();
    
    const brief = {
      title: 'Data Quality Daily Brief',
      date: new Date().toISOString(),
      summary: {
        totalRuns: runs.length,
        totalFindings: runs.reduce((sum, r) => sum + r.findings.length, 0),
        totalImpactGBP: runs.reduce((sum, r) => 
          sum + r.findings.reduce((s, f) => 
            s + (f.impactCurrency === 'GBP' ? parseFloat(f.impactValueBase || 0) : 0), 0), 0)
      },
      freshnessStatus: freshness,
      topFindings: runs.flatMap(r => r.findings)
        .sort((a, b) => (b.impactValueBase || 0) - (a.impactValueBase || 0))
        .slice(0, 10)
    };

    res.json({
      success: true,
      data: brief
    });

  } catch (error) {
    logError('Failed to export DQ brief', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;