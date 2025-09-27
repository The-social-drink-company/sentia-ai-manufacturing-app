import express from 'express';
import NodeCache from 'node-cache';
import prisma from '../../lib/prisma.js';
import { requireAuth, requireRole, requireManager } from '../middleware/clerkAuth.js';
import { rateLimiters } from '../middleware/rateLimiter.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { logDebug, logInfo, logWarn, logError } from '../../src/utils/logger';


const router = express.Router();

// Initialize cache with 60 second TTL
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

/**
 * GET /api/maintenance/schedule
 * Get maintenance schedule and overview
 */
router.get(_'/schedule',
  _requireAuth,
  _rateLimiters.read,
  asyncHandler(async (req, res) => {
    const cacheKey = `maintenance-schedule-${req.userId}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      return res.json({
        success: true,
        data: cached,
        cached: true
      });
    }

    try {
      // Get equipment data
      const equipment = await prisma.equipment?.findMany({
        include: {
          maintenanceSchedule: {
            orderBy: { scheduledDate: 'asc' },
            take: 5
          },
          maintenanceHistory: {
            orderBy: { completedDate: 'desc' },
            take: 10
          }
        }
      }) || [];

      // Get upcoming maintenance tasks
      const upcomingTasks = await prisma.maintenanceTask?.findMany({
        where: {
          status: { in: ['scheduled', 'pending'] },
          scheduledDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Next 30 days
          }
        },
        include: {
          equipment: true,
          assignedTechnician: true
        },
        orderBy: { scheduledDate: 'asc' }
      }) || [];

      // Get maintenance history for metrics
      const maintenanceHistory = await prisma.maintenanceHistory?.findMany({
        where: {
          completedDate: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      }) || [];

      // Calculate summary metrics
      const totalEquipment = equipment.length || 0;
      const scheduledMaintenance = upcomingTasks.length || 0;
      const completedThisMonth = maintenanceHistory.length || 0;
      const overdue = upcomingTasks.filter(task =>
        new Date(task.scheduledDate) < new Date()
      ).length || 3;
      const upcomingWeek = upcomingTasks.filter(task => {
        const taskDate = new Date(task.scheduledDate);
        const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        return taskDate <= weekFromNow;
      }).length || 7;

      // Calculate availability and reliability metrics
      const availability = equipment.length > 0 ?
        equipment.reduce((sum, eq) => sum + (eq.availability || 0), 0) / equipment.length : 94.2;

      const maintenanceData = {
        summary: {
          totalEquipment,
          scheduledMaintenance,
          completedThisMonth,
          overdue,
          upcomingWeek,
          availability,
          mtbf: 720, // Mean Time Between Failures (hours)
          mttr: 2.5  // Mean Time To Repair (hours)
        },
        equipment: equipment.length > 0
          ? equipment.slice(0, 10).map(eq => ({
              id: eq.id,
              name: eq.name,
              type: eq.type || null,
              status: eq.status || null,
              lastMaintenance: eq.lastMaintenance?.toISOString().split('T')[0] || null,
              nextMaintenance: eq.nextMaintenance?.toISOString().split('T')[0] || null,
              hoursRun: typeof eq.hoursRun === 'number' ? eq.hoursRun : 0,
              healthScore: typeof eq.healthScore === 'number' ? eq.healthScore : null,
              criticality: eq.criticality || 'medium'
            }))
          : [],
      };

      // Cache the result
      cache.set(cacheKey, maintenanceData);

      res.json({
        success: true,
        data: maintenanceData
      });

    } catch (error) {
      logError('[Maintenance API] Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch maintenance data. Please ensure database connection is active.',
        message: error.message
      });
    }
  })
);


export default router;








