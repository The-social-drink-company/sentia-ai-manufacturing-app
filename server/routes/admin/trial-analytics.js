/**
 * Trial Analytics API Routes (Admin Only)
 *
 * Provides comprehensive trial funnel metrics for master admin dashboard:
 * - Signup, activation, conversion rates
 * - Email performance (open/click rates)
 * - Cohort analysis and retention
 * - Revenue projections
 *
 * @epic BMAD-TRIAL-001 (Automated Free Trial Journey)
 * @story Story 6 (Trial Analytics Dashboard)
 */

import express from 'express';
import { prisma } from '../../lib/prisma.js';

const router = express.Router();

/**
 * GET /api/admin/trial-analytics/overview
 *
 * Get high-level trial funnel overview
 *
 * Response:
 * {
 *   "totalSignups": 156,
 *   "totalActivations": 132,
 *   "totalConversions": 42,
 *   "activationRate": 84.6,
 *   "conversionRate": 31.8,
 *   "avgDaysToConvert": 8.5,
 *   "mrr": 12390,
 *   "arr": 148680
 * }
 */
router.get('/trial-analytics/overview', async (req, res) => {
  try {
    // Total signups (trials created)
    const totalSignups = await prisma.tenant.count({
      where: {
        OR: [
          { subscriptionStatus: 'TRIAL' },
          { subscriptionStatus: 'trial' },
          { isInTrial: true },
          { trialStartedAt: { not: null } },
        ],
      },
    });

    // Total activations (first login completed)
    const totalActivations = await prisma.tenant.count({
      where: {
        trialActivated: true,
      },
    });

    // Total conversions (trial → paid)
    const totalConversions = await prisma.tenant.count({
      where: {
        convertedAt: { not: null },
      },
    });

    // Calculate rates
    const activationRate = totalSignups > 0 ? (totalActivations / totalSignups) * 100 : 0;
    const conversionRate = totalSignups > 0 ? (totalConversions / totalSignups) * 100 : 0;

    // Average days to convert
    const conversions = await prisma.tenant.findMany({
      where: {
        conversionDays: { not: null },
      },
      select: {
        conversionDays: true,
      },
    });

    const avgDaysToConvert =
      conversions.length > 0
        ? conversions.reduce((sum, t) => sum + (t.conversionDays || 0), 0) / conversions.length
        : 0;

    // Calculate MRR/ARR
    const activeSubscriptions = await prisma.tenant.findMany({
      where: {
        subscriptionStatus: { in: ['ACTIVE', 'active'] },
      },
      select: {
        subscriptionTier: true,
        subscriptionCycle: true,
      },
    });

    const prices = {
      starter: { monthly: 149, annual: 1490 },
      professional: { monthly: 295, annual: 2950 },
      enterprise: { monthly: 595, annual: 5950 },
    };

    let mrr = 0;
    activeSubscriptions.forEach((sub) => {
      const tier = sub.subscriptionTier?.toLowerCase();
      const cycle = sub.subscriptionCycle?.toLowerCase();

      if (tier && prices[tier]) {
        if (cycle === 'annual') {
          mrr += prices[tier].annual / 12;
        } else {
          mrr += prices[tier].monthly;
        }
      }
    });

    const arr = mrr * 12;

    res.json({
      totalSignups,
      totalActivations,
      totalConversions,
      activationRate: Math.round(activationRate * 10) / 10,
      conversionRate: Math.round(conversionRate * 10) / 10,
      avgDaysToConvert: Math.round(avgDaysToConvert * 10) / 10,
      mrr: Math.round(mrr),
      arr: Math.round(arr),
    });
  } catch (error) {
    console.error('[Trial Analytics] Error fetching overview:', error);
    res.status(500).json({ error: 'Failed to fetch trial analytics overview' });
  }
});

/**
 * GET /api/admin/trial-analytics/funnel
 *
 * Get detailed trial funnel with drop-off points
 *
 * Response:
 * {
 *   "stages": [
 *     { "name": "Signups", "count": 156, "percentage": 100 },
 *     { "name": "Activations", "count": 132, "percentage": 84.6, "dropOff": 24 },
 *     { "name": "Conversions", "count": 42, "percentage": 31.8, "dropOff": 90 }
 *   ]
 * }
 */
router.get('/trial-analytics/funnel', async (req, res) => {
  try {
    const { days } = req.query;
    const daysAgo = days ? parseInt(days) : 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Get counts for each funnel stage
    const signups = await prisma.tenant.count({
      where: {
        createdAt: { gte: startDate },
        OR: [
          { isInTrial: true },
          { trialStartedAt: { not: null } },
        ],
      },
    });

    const activations = await prisma.tenant.count({
      where: {
        createdAt: { gte: startDate },
        trialActivated: true,
      },
    });

    const conversions = await prisma.tenant.count({
      where: {
        createdAt: { gte: startDate },
        convertedAt: { not: null },
      },
    });

    // Calculate funnel stages
    const stages = [
      {
        name: 'Signups',
        count: signups,
        percentage: 100,
        dropOff: 0,
      },
      {
        name: 'Activations',
        count: activations,
        percentage: signups > 0 ? Math.round((activations / signups) * 1000) / 10 : 0,
        dropOff: signups - activations,
      },
      {
        name: 'Conversions',
        count: conversions,
        percentage: signups > 0 ? Math.round((conversions / signups) * 1000) / 10 : 0,
        dropOff: signups - conversions,
      },
    ];

    res.json({ stages, period: `Last ${daysAgo} days` });
  } catch (error) {
    console.error('[Trial Analytics] Error fetching funnel:', error);
    res.status(500).json({ error: 'Failed to fetch trial funnel' });
  }
});

/**
 * GET /api/admin/trial-analytics/email-performance
 *
 * Get email performance metrics (open/click rates)
 *
 * Response:
 * {
 *   "emails": [
 *     { "type": "DAY_0", "sent": 156, "opened": 98, "clicked": 42, "openRate": 62.8, "clickRate": 26.9 },
 *     ...
 *   ]
 * }
 */
router.get('/trial-analytics/email-performance', async (req, res) => {
  try {
    const emailTypes = ['DAY_0', 'DAY_1', 'DAY_3', 'DAY_7', 'DAY_9', 'DAY_11', 'DAY_13', 'DAY_14'];

    const performance = await Promise.all(
      emailTypes.map(async (type) => {
        const sent = await prisma.trialEmail.count({
          where: { type, status: { in: ['SENT', 'DELIVERED'] } },
        });

        const opened = await prisma.trialEmail.count({
          where: { type, openedAt: { not: null } },
        });

        const clicked = await prisma.trialEmail.count({
          where: { type, clickedAt: { not: null } },
        });

        const openRate = sent > 0 ? Math.round((opened / sent) * 1000) / 10 : 0;
        const clickRate = sent > 0 ? Math.round((clicked / sent) * 1000) / 10 : 0;

        return {
          type,
          sent,
          opened,
          clicked,
          openRate,
          clickRate,
        };
      })
    );

    res.json({ emails: performance });
  } catch (error) {
    console.error('[Trial Analytics] Error fetching email performance:', error);
    res.status(500).json({ error: 'Failed to fetch email performance' });
  }
});

/**
 * GET /api/admin/trial-analytics/cohorts
 *
 * Get cohort analysis (retention by signup week)
 *
 * Response:
 * {
 *   "cohorts": [
 *     { "week": "2025-10-13", "signups": 24, "week1Retention": 83.3, "week2Retention": 70.8, "conversions": 7 },
 *     ...
 *   ]
 * }
 */
router.get('/trial-analytics/cohorts', async (req, res) => {
  try {
    // Get last 8 weeks of cohorts
    const weeksAgo = 8;
    const cohorts = [];

    for (let i = 0; i < weeksAgo; i++) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7 + 7));
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      // Signups in this week
      const signups = await prisma.tenant.count({
        where: {
          createdAt: { gte: weekStart, lt: weekEnd },
          OR: [
            { isInTrial: true },
            { trialStartedAt: { not: null } },
          ],
        },
      });

      // Week 1 retention (activated)
      const week1Active = await prisma.tenant.count({
        where: {
          createdAt: { gte: weekStart, lt: weekEnd },
          trialActivated: true,
        },
      });

      // Conversions
      const conversions = await prisma.tenant.count({
        where: {
          createdAt: { gte: weekStart, lt: weekEnd },
          convertedAt: { not: null },
        },
      });

      const week1Retention = signups > 0 ? Math.round((week1Active / signups) * 1000) / 10 : 0;

      cohorts.push({
        week: weekStart.toISOString().split('T')[0],
        signups,
        week1Retention,
        conversions,
        conversionRate: signups > 0 ? Math.round((conversions / signups) * 1000) / 10 : 0,
      });
    }

    res.json({ cohorts: cohorts.reverse() });
  } catch (error) {
    console.error('[Trial Analytics] Error fetching cohorts:', error);
    res.status(500).json({ error: 'Failed to fetch cohort data' });
  }
});

/**
 * GET /api/admin/trial-analytics/export
 *
 * Export trial analytics to CSV
 *
 * Response: CSV file download
 */
router.get('/trial-analytics/export', async (req, res) => {
  try {
    const tenants = await prisma.tenant.findMany({
      where: {
        OR: [
          { isInTrial: true },
          { trialStartedAt: { not: null } },
          { convertedAt: { not: null } },
        ],
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        trialStartedAt: true,
        trialEndDate: true,
        trialActivated: true,
        firstLoginAt: true,
        convertedAt: true,
        conversionDays: true,
        subscriptionTier: true,
        subscriptionStatus: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Generate CSV
    const headers = [
      'Tenant ID',
      'Company Name',
      'Signup Date',
      'Trial Start',
      'Trial End',
      'Activated',
      'First Login',
      'Converted',
      'Days to Convert',
      'Tier',
      'Status',
    ];

    const rows = tenants.map((t) => [
      t.id,
      t.name,
      t.createdAt?.toISOString().split('T')[0] || '',
      t.trialStartedAt?.toISOString().split('T')[0] || '',
      t.trialEndDate?.toISOString().split('T')[0] || '',
      t.trialActivated ? 'Yes' : 'No',
      t.firstLoginAt?.toISOString().split('T')[0] || '',
      t.convertedAt?.toISOString().split('T')[0] || '',
      t.conversionDays || '',
      t.subscriptionTier || '',
      t.subscriptionStatus || '',
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="trial-analytics-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('[Trial Analytics] Error exporting data:', error);
    res.status(500).json({ error: 'Failed to export trial analytics' });
  }
});

export default router;
