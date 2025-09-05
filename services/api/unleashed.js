import express from 'express';
import rateLimit from 'express-rate-limit';
import unleashedERPService from '../unleashed-erp.js';

const router = express.Router();

// Rate limiting for Unleashed ERP API routes
const unleashedRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests to Unleashed ERP API',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(unleashedRateLimit);

// Get consolidated manufacturing data
router.get('/manufacturing', async (req, res) => {
  try {
    const data = await unleashedERPService.getConsolidatedData();
    
    if (data.error) {
      return res.status(500).json({
        error: data.error,
        message: 'Failed to fetch Unleashed ERP data'
      });
    }

    const response = {
      production: {
        activeBatches: data.production?.activeBatches || 0,
        completedToday: data.production?.completedToday || 0,
        qualityScore: data.production?.qualityScore || 95.0,
        utilizationRate: data.production?.utilizationRate || 85.0
      },
      resources: {
        status: data.resources?.status || [],
        utilizationRate: data.resources?.utilizationRate || 85.0
      },
      productionSchedule: data.productionSchedule || [],
      qualityAlerts: data.qualityAlerts || [],
      lastUpdated: data.lastUpdated
    };

    res.json(response);
  } catch (error) {
    console.error('UNLEASHED API: Manufacturing data error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process Unleashed ERP manufacturing data'
    });
  }
});

// Get production metrics only
router.get('/production', async (req, res) => {
  try {
    const data = await unleashedERPService.getConsolidatedData();
    
    if (data.error) {
      return res.status(500).json({
        error: data.error,
        message: 'Failed to fetch production data'
      });
    }

    res.json({
      production: data.production,
      lastUpdated: data.lastUpdated
    });
  } catch (error) {
    console.error('UNLEASHED API: Production data error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process production data'
    });
  }
});

// Get resource status and utilization
router.get('/resources', async (req, res) => {
  try {
    const data = await unleashedERPService.getConsolidatedData();
    
    if (data.error) {
      return res.status(500).json({
        error: data.error,
        message: 'Failed to fetch resource data'
      });
    }

    res.json({
      resources: data.resources,
      lastUpdated: data.lastUpdated
    });
  } catch (error) {
    console.error('UNLEASHED API: Resource data error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process resource data'
    });
  }
});

// Get production schedule
router.get('/schedule', async (req, res) => {
  try {
    const data = await unleashedERPService.getConsolidatedData();
    
    if (data.error) {
      return res.status(500).json({
        error: data.error,
        message: 'Failed to fetch production schedule'
      });
    }

    const limit = parseInt(req.query.limit) || 10;
    const schedule = data.productionSchedule?.slice(0, limit) || [];

    res.json({
      schedule,
      totalItems: data.productionSchedule?.length || 0,
      returnedItems: schedule.length,
      lastUpdated: data.lastUpdated
    });
  } catch (error) {
    console.error('UNLEASHED API: Schedule data error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process production schedule'
    });
  }
});

// Get quality alerts and issues
router.get('/quality-alerts', async (req, res) => {
  try {
    const data = await unleashedERPService.getConsolidatedData();
    
    if (data.error) {
      return res.status(500).json({
        error: data.error,
        message: 'Failed to fetch quality alerts'
      });
    }

    const limit = parseInt(req.query.limit) || 20;
    const alerts = data.qualityAlerts?.slice(0, limit) || [];

    res.json({
      alerts,
      totalAlerts: data.qualityAlerts?.length || 0,
      returnedAlerts: alerts.length,
      lastUpdated: data.lastUpdated
    });
  } catch (error) {
    console.error('UNLEASHED API: Quality alerts error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process quality alerts'
    });
  }
});

// Get inventory status from ERP
router.get('/inventory', async (req, res) => {
  try {
    const data = await unleashedERPService.getConsolidatedData();
    
    if (data.error) {
      return res.status(500).json({
        error: data.error,
        message: 'Failed to fetch inventory data'
      });
    }

    res.json({
      inventoryAlerts: data.inventoryAlerts || [],
      totalAlerts: data.inventoryAlerts?.length || 0,
      lastUpdated: data.lastUpdated
    });
  } catch (error) {
    console.error('UNLEASHED API: Inventory data error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process inventory data'
    });
  }
});

// Get manufacturing KPIs
router.get('/kpis', async (req, res) => {
  try {
    const data = await unleashedERPService.getConsolidatedData();
    
    if (data.error) {
      return res.status(500).json({
        error: data.error,
        message: 'Failed to fetch manufacturing KPIs'
      });
    }

    const kpis = {
      production: {
        efficiency: data.production?.qualityScore || 95.0,
        utilization: data.production?.utilizationRate || 85.0,
        throughput: data.production?.completedToday || 0,
        activeJobs: data.production?.activeBatches || 0
      },
      quality: {
        score: data.production?.qualityScore || 95.0,
        alertCount: data.qualityAlerts?.length || 0,
        trend: this.calculateQualityTrend(data)
      },
      resources: {
        averageUtilization: data.resources?.utilizationRate || 85.0,
        activeResources: data.resources?.status?.filter(r => r.status === 'active').length || 0,
        totalResources: data.resources?.status?.length || 0
      },
      schedule: {
        upcomingJobs: data.productionSchedule?.length || 0,
        nextJobTime: data.productionSchedule?.[0]?.scheduledTime || null
      },
      lastUpdated: data.lastUpdated
    };

    res.json(kpis);
  } catch (error) {
    console.error('UNLEASHED API: KPI data error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process manufacturing KPIs'
    });
  }
});

// Get connection status
router.get('/status', async (req, res) => {
  try {
    const status = unleashedERPService.getConnectionStatus();
    res.json(status);
  } catch (error) {
    console.error('UNLEASHED API: Status error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get connection status'
    });
  }
});

// Trigger manual sync
router.post('/sync', async (req, res) => {
  try {
    console.log('UNLEASHED API: Manual sync triggered');
    const data = await unleashedERPService.syncAllData();
    
    res.json({
      message: 'ERP sync completed successfully',
      data,
      syncTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('UNLEASHED API: Manual sync error:', error);
    res.status(500).json({
      error: 'ERP sync failed',
      message: error.message
    });
  }
});

// Get production analytics
router.get('/analytics', async (req, res) => {
  try {
    const data = await unleashedERPService.getConsolidatedData();
    
    if (data.error) {
      return res.status(500).json({
        error: data.error,
        message: 'Failed to fetch production analytics'
      });
    }

    const timeframe = req.query.timeframe || 'daily';
    
    const analytics = {
      efficiency: {
        current: data.production?.qualityScore || 95.0,
        target: 98.0,
        trend: 'stable'
      },
      utilization: {
        current: data.production?.utilizationRate || 85.0,
        target: 90.0,
        trend: 'improving'
      },
      throughput: {
        current: data.production?.completedToday || 0,
        target: 50,
        trend: 'stable'
      },
      quality: {
        score: data.production?.qualityScore || 95.0,
        alerts: data.qualityAlerts?.length || 0,
        trend: 'stable'
      },
      resources: data.resources?.status?.map(resource => ({
        name: resource.name,
        utilization: resource.utilization,
        status: resource.status,
        efficiency: resource.utilization > 80 ? 'high' : resource.utilization > 60 ? 'medium' : 'low'
      })) || [],
      timeframe,
      lastUpdated: data.lastUpdated
    };

    res.json(analytics);
  } catch (error) {
    console.error('UNLEASHED API: Analytics error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process production analytics'
    });
  }
});

// Get batch tracking information
router.get('/batches/:batchId?', async (req, res) => {
  try {
    const data = await unleashedERPService.getConsolidatedData();
    
    if (data.error) {
      return res.status(500).json({
        error: data.error,
        message: 'Failed to fetch batch data'
      });
    }

    const { batchId } = req.params;
    
    if (batchId) {
      // Return specific batch information
      const batch = data.productionSchedule?.find(job => 
        job.jobId === batchId || job.productName.includes(batchId)
      );
      
      if (!batch) {
        return res.status(404).json({
          error: 'Batch not found',
          message: `Batch ${batchId} not found in production schedule`
        });
      }
      
      res.json({
        batch,
        lastUpdated: data.lastUpdated
      });
    } else {
      // Return all active batches
      const activeBatches = data.productionSchedule?.map(job => ({
        id: job.jobId,
        productName: job.productName,
        quantity: job.quantity,
        scheduledTime: job.scheduledTime,
        priority: job.priority,
        status: 'planned'
      })) || [];
      
      res.json({
        batches: activeBatches,
        totalCount: activeBatches.length,
        lastUpdated: data.lastUpdated
      });
    }
  } catch (error) {
    console.error('UNLEASHED API: Batch tracking error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process batch tracking data'
    });
  }
});

// Helper function for quality trend calculation
function calculateQualityTrend(data) {
  // Simple trend calculation based on alert count
  const alertCount = data.qualityAlerts?.length || 0;
  if (alertCount === 0) return 'improving';
  if (alertCount <= 2) return 'stable';
  return 'declining';
}

export default router;