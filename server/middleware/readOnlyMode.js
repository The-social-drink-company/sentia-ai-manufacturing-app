/**
 * Read-Only Mode Middleware
 *
 * Enforces read-only restrictions for expired trial tenants during grace period.
 * Allows data viewing but blocks all CREATE, UPDATE, DELETE operations.
 *
 * Grace Period Flow:
 * - Day 14-17: Read-only mode (user can view data, cannot modify)
 * - Day 17+: Full suspension (no access)
 *
 * @epic BMAD-TRIAL-001 (Automated Free Trial Journey)
 * @story Story 5 (Trial Expiration & Grace Period)
 */

import { prisma } from '../lib/prisma.js';

/**
 * HTTP methods that modify data (blocked in read-only mode)
 */
const WRITE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

/**
 * API endpoints that are always allowed (even in read-only mode)
 */
const ALLOWED_ENDPOINTS = [
  '/api/auth',               // Authentication
  '/api/billing/trial-upgrade', // Allow upgrading to restore access
  '/api/trial/status',       // Trial status checks
  '/api/health',             // Health checks
  '/api/webhooks',           // Webhook receivers
];

/**
 * Read-only endpoints (explicitly allowed GET requests)
 */
const READ_ONLY_ENDPOINTS = [
  '/api/dashboard',          // Dashboard data
  '/api/forecasts',          // Demand forecasting
  '/api/working-capital',    // Working capital data
  '/api/inventory',          // Inventory data
  '/api/reports',            // Reports
  '/api/analytics',          // Analytics
  '/api/settings',           // Settings (GET only)
];

/**
 * Middleware to enforce read-only mode for expired trials in grace period
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
export const readOnlyMode = async (req, res, next) => {
  try {
    // Skip middleware for allowed endpoints
    const isAllowedEndpoint = ALLOWED_ENDPOINTS.some(endpoint =>
      req.path.startsWith(endpoint)
    );

    if (isAllowedEndpoint) {
      return next();
    }

    // Skip middleware for GET requests on read-only endpoints
    if (req.method === 'GET') {
      const isReadOnlyEndpoint = READ_ONLY_ENDPOINTS.some(endpoint =>
        req.path.startsWith(endpoint)
      );

      if (isReadOnlyEndpoint) {
        return next(); // Allow GET requests
      }
    }

    // Get tenant from request (set by tenant middleware)
    const tenantId = req.tenantId || req.tenant?.id;

    if (!tenantId) {
      // No tenant in request - skip read-only checks
      return next();
    }

    // Get tenant from database
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        subscriptionStatus: true,
        isInTrial: true,
        trialEndDate: true,
        isActive: true,
      },
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Check if tenant is suspended (past grace period)
    if (tenant.subscriptionStatus === 'SUSPENDED' || !tenant.isActive) {
      return res.status(403).json({
        error: 'Account suspended',
        message: 'Your account has been suspended. Please contact support or upgrade to restore access.',
        code: 'ACCOUNT_SUSPENDED',
        actions: {
          upgrade: '/billing/upgrade',
          support: '/support',
        },
      });
    }

    // Check if trial has expired (but within grace period)
    const now = new Date();
    const trialExpired = tenant.trialEndDate && tenant.trialEndDate < now;
    const inGracePeriod = trialExpired &&
      tenant.subscriptionStatus === 'TRIAL' &&
      tenant.isActive;

    if (inGracePeriod) {
      // Calculate days remaining in grace period
      const gracePeriodEnd = new Date(tenant.trialEndDate);
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 3); // 3-day grace period
      const daysLeft = Math.ceil((gracePeriodEnd - now) / (1000 * 60 * 60 * 24));

      // Block write operations
      if (WRITE_METHODS.includes(req.method)) {
        return res.status(403).json({
          error: 'Read-only mode',
          message: `Your trial has expired. You have ${daysLeft} day${daysLeft !== 1 ? 's' : ''} to upgrade before your account is suspended.`,
          code: 'TRIAL_EXPIRED_READ_ONLY',
          gracePeriodEnds: gracePeriodEnd.toISOString(),
          daysRemaining: daysLeft,
          actions: {
            upgrade: '/billing/trial-upgrade',
            viewPricing: '/pricing',
          },
        });
      }

      // Add read-only indicator to response headers
      res.setHeader('X-ReadOnly-Mode', 'true');
      res.setHeader('X-Grace-Period-Days', daysLeft.toString());
    }

    next();
  } catch (error) {
    console.error('[Read-Only Middleware] Error:', error);
    // Don't block requests on middleware errors
    next();
  }
};

/**
 * Check if tenant is in read-only mode
 *
 * @param {string} tenantId - Tenant ID
 * @returns {Promise<Object>} Read-only status
 */
export const checkReadOnlyStatus = async (tenantId) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        subscriptionStatus: true,
        isInTrial: true,
        trialEndDate: true,
        isActive: true,
      },
    });

    if (!tenant) {
      return { readOnly: false, suspended: false };
    }

    // Check suspension
    if (tenant.subscriptionStatus === 'SUSPENDED' || !tenant.isActive) {
      return {
        readOnly: true,
        suspended: true,
        message: 'Account suspended',
      };
    }

    // Check grace period
    const now = new Date();
    const trialExpired = tenant.trialEndDate && tenant.trialEndDate < now;
    const inGracePeriod = trialExpired &&
      tenant.subscriptionStatus === 'TRIAL' &&
      tenant.isActive;

    if (inGracePeriod) {
      const gracePeriodEnd = new Date(tenant.trialEndDate);
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 3);
      const daysLeft = Math.ceil((gracePeriodEnd - now) / (1000 * 60 * 60 * 24));

      return {
        readOnly: true,
        suspended: false,
        inGracePeriod: true,
        daysRemaining: daysLeft,
        gracePeriodEnds: gracePeriodEnd,
        message: `Trial expired. ${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining in grace period.`,
      };
    }

    return { readOnly: false, suspended: false };
  } catch (error) {
    console.error('[Read-Only Check] Error:', error);
    return { readOnly: false, suspended: false, error: error.message };
  }
};

export default readOnlyMode;
