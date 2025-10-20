/**
 * A/B Testing Service
 *
 * Manages A/B test experiments for trial optimization:
 * - Variant assignment (random, consistent per user)
 * - Conversion tracking per variant
 * - Statistical significance calculation
 * - Test lifecycle (active/paused/concluded)
 *
 * Test Variables:
 * - Trial length (14/21/30 days)
 * - Email frequency (standard/reduced)
 * - Upgrade incentive (20% off/1 month free)
 * - Onboarding flow (4-step/single-page)
 *
 * @epic BMAD-TRIAL-001 (Automated Free Trial Journey)
 * @story Story 7 (A/B Testing Framework)
 */

import { prisma } from '../lib/prisma.js';
import crypto from 'crypto';

/**
 * Available test variants
 */
const TEST_VARIANTS = {
  trial_length: {
    control: { name: '14 days', value: 14 },
    variant_a: { name: '21 days', value: 21 },
    variant_b: { name: '30 days', value: 30 },
  },
  email_frequency: {
    control: { name: 'Standard (8 emails)', value: 'standard' },
    variant_a: { name: 'Reduced (4 emails)', value: 'reduced' },
  },
  upgrade_incentive: {
    control: { name: '20% off first month', value: 'discount_20' },
    variant_a: { name: '1 month free', value: 'month_free' },
    variant_b: { name: 'No incentive', value: 'none' },
  },
  onboarding_flow: {
    control: { name: '4-step wizard', value: 'wizard' },
    variant_a: { name: 'Single page', value: 'single_page' },
  },
};

class ABTestingService {
  /**
   * Assign user to A/B test variant
   *
   * Uses deterministic hashing to ensure consistent variant per user
   *
   * @param {string} userId - User/tenant ID
   * @param {string} testName - Test name (e.g., 'trial_length')
   * @returns {Object} Assigned variant
   */
  async assignVariant(userId, testName) {
    try {
      // Check if test exists and is active
      const test = await prisma.aBTest.findFirst({
        where: {
          name: testName,
          status: 'ACTIVE',
        },
      });

      if (!test) {
        // No active test - return control
        return this.getControlVariant(testName);
      }

      // Check if user already has variant assignment
      const existingAssignment = await prisma.aBTestAssignment.findFirst({
        where: {
          testId: test.id,
          userId,
        },
      });

      if (existingAssignment) {
        return {
          testId: test.id,
          testName: test.name,
          variant: existingAssignment.variant,
          value: TEST_VARIANTS[testName]?.[existingAssignment.variant]?.value,
        };
      }

      // Assign new variant using deterministic hash
      const variant = this.hashToVariant(userId, testName, test.variantWeights || {});

      // Save assignment
      await prisma.aBTestAssignment.create({
        data: {
          testId: test.id,
          userId,
          variant,
          assignedAt: new Date(),
        },
      });

      console.log(`[A/B Test] Assigned user ${userId} to ${testName}:${variant}`);

      return {
        testId: test.id,
        testName: test.name,
        variant,
        value: TEST_VARIANTS[testName]?.[variant]?.value,
      };
    } catch (error) {
      console.error('[A/B Test] Error assigning variant:', error);
      // Fallback to control on error
      return this.getControlVariant(testName);
    }
  }

  /**
   * Hash user ID to variant (deterministic, consistent)
   *
   * @param {string} userId - User ID
   * @param {string} testName - Test name
   * @param {Object} weights - Variant weights (e.g., {control: 50, variant_a: 30, variant_b: 20})
   * @returns {string} Variant name
   */
  hashToVariant(userId, testName, weights = {}) {
    const hash = crypto
      .createHash('md5')
      .update(`${userId}:${testName}`)
      .digest('hex');

    // Convert hash to number 0-100
    const hashInt = parseInt(hash.substring(0, 8), 16);
    const bucket = hashInt % 100;

    // Default equal weights if not specified
    const variants = TEST_VARIANTS[testName];
    if (!variants) return 'control';

    const variantNames = Object.keys(variants);
    const defaultWeight = 100 / variantNames.length;

    // Calculate cumulative weights
    let cumulative = 0;
    for (const variantName of variantNames) {
      const weight = weights[variantName] || defaultWeight;
      cumulative += weight;

      if (bucket < cumulative) {
        return variantName;
      }
    }

    return 'control'; // Fallback
  }

  /**
   * Get control variant for test
   *
   * @param {string} testName - Test name
   * @returns {Object} Control variant
   */
  getControlVariant(testName) {
    return {
      testId: null,
      testName,
      variant: 'control',
      value: TEST_VARIANTS[testName]?.control?.value,
    };
  }

  /**
   * Track conversion event
   *
   * @param {string} userId - User ID
   * @param {string} testName - Test name
   */
  async trackConversion(userId, testName) {
    try {
      const test = await prisma.aBTest.findFirst({
        where: { name: testName, status: 'ACTIVE' },
      });

      if (!test) return;

      // Find assignment
      const assignment = await prisma.aBTestAssignment.findFirst({
        where: {
          testId: test.id,
          userId,
        },
      });

      if (!assignment) return;

      // Update conversion
      await prisma.aBTestAssignment.update({
        where: { id: assignment.id },
        data: {
          converted: true,
          convertedAt: new Date(),
        },
      });

      console.log(`[A/B Test] Conversion tracked: ${testName}:${assignment.variant} for user ${userId}`);
    } catch (error) {
      console.error('[A/B Test] Error tracking conversion:', error);
    }
  }

  /**
   * Get test results with statistical significance
   *
   * @param {string} testName - Test name
   * @returns {Object} Test results
   */
  async getTestResults(testName) {
    try {
      const test = await prisma.aBTest.findFirst({
        where: { name: testName },
        include: {
          assignments: true,
        },
      });

      if (!test) {
        return { error: 'Test not found' };
      }

      // Calculate metrics per variant
      const variantStats = {};

      for (const variantName of Object.keys(TEST_VARIANTS[testName] || {})) {
        const assignments = test.assignments.filter((a) => a.variant === variantName);
        const conversions = assignments.filter((a) => a.converted);

        const count = assignments.length;
        const conversionCount = conversions.length;
        const conversionRate = count > 0 ? (conversionCount / count) * 100 : 0;

        variantStats[variantName] = {
          count,
          conversions: conversionCount,
          conversionRate: Math.round(conversionRate * 10) / 10,
        };
      }

      // Calculate statistical significance (control vs variants)
      const control = variantStats.control;
      const significance = {};

      for (const [variantName, stats] of Object.entries(variantStats)) {
        if (variantName === 'control') continue;

        // Z-test for proportions
        const p1 = control.conversionRate / 100;
        const p2 = stats.conversionRate / 100;
        const n1 = control.count;
        const n2 = stats.count;

        if (n1 < 30 || n2 < 30) {
          significance[variantName] = {
            pValue: null,
            significant: false,
            message: 'Insufficient sample size (need 30+ per variant)',
          };
          continue;
        }

        const pPool = ((p1 * n1) + (p2 * n2)) / (n1 + n2);
        const se = Math.sqrt(pPool * (1 - pPool) * (1/n1 + 1/n2));
        const z = (p2 - p1) / se;
        const pValue = 2 * (1 - this.normalCDF(Math.abs(z)));

        significance[variantName] = {
          zScore: Math.round(z * 100) / 100,
          pValue: Math.round(pValue * 1000) / 1000,
          significant: pValue < 0.05,
          lift: Math.round(((stats.conversionRate - control.conversionRate) / control.conversionRate) * 1000) / 10,
        };
      }

      return {
        testName,
        status: test.status,
        startedAt: test.startedAt,
        variants: variantStats,
        significance,
        totalAssignments: test.assignments.length,
      };
    } catch (error) {
      console.error('[A/B Test] Error getting results:', error);
      return { error: error.message };
    }
  }

  /**
   * Normal cumulative distribution function (for z-test)
   *
   * @param {number} z - Z-score
   * @returns {number} CDF value
   */
  normalCDF(z) {
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp(-z * z / 2);
    const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return z > 0 ? 1 - prob : prob;
  }

  /**
   * Create new A/B test
   *
   * @param {Object} testConfig - Test configuration
   * @returns {Object} Created test
   */
  async createTest({ name, description, variantWeights }) {
    try {
      const test = await prisma.aBTest.create({
        data: {
          name,
          description,
          status: 'ACTIVE',
          variantWeights: variantWeights || {},
          startedAt: new Date(),
        },
      });

      console.log(`[A/B Test] Created test: ${name}`);
      return test;
    } catch (error) {
      console.error('[A/B Test] Error creating test:', error);
      throw error;
    }
  }

  /**
   * Pause/resume test
   *
   * @param {string} testName - Test name
   * @param {string} status - New status ('ACTIVE' | 'PAUSED' | 'CONCLUDED')
   */
  async updateTestStatus(testName, status) {
    try {
      await prisma.aBTest.updateMany({
        where: { name: testName },
        data: { status },
      });

      console.log(`[A/B Test] Updated ${testName} status to ${status}`);
    } catch (error) {
      console.error('[A/B Test] Error updating test status:', error);
      throw error;
    }
  }
}

export default new ABTestingService();
