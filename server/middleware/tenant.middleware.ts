/**
 * Tenant Middleware - Multi-Tenant SaaS Request Handler
 *
 * BMAD-MULTITENANT-002 Story 1: Tenant Middleware with Clerk Integration
 *
 * This middleware:
 * 1. Authenticates user via Clerk session token
 * 2. Identifies tenant from X-Organization-ID header
 * 3. Verifies user belongs to organization (via Clerk)
 * 4. Fetches tenant from database
 * 5. Checks subscription status (active/trial/suspended/cancelled)
 * 6. Auto-creates user in database if missing
 * 7. Attaches tenant + user to Express Request object
 * 8. Sets PostgreSQL search_path to tenant schema
 *
 * Security:
 * - Prevents tenant hopping (org membership verification)
 * - Blocks suspended/cancelled subscriptions
 * - Ensures database isolation via search_path
 *
 * @module server/middleware/tenant.middleware
 */

import { Request, Response, NextFunction } from 'express';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ================================
// TypeScript Type Extensions
// ================================

/**
 * Extend Express Request to include tenant and user information
 *
 * These properties are attached by tenantMiddleware and available
 * to all downstream route handlers.
 */
declare global {
  namespace Express {
    interface Request {
      /**
       * Tenant information extracted from Clerk organization
       * Available after tenantMiddleware executes successfully
       */
      tenant?: {
        id: string;                          // UUID primary key
        slug: string;                        // URL-friendly identifier
        schemaName: string;                  // PostgreSQL schema name (tenant_<uuid>)
        organizationId: string;              // Clerk organization ID
        subscriptionTier: string;            // starter | professional | enterprise
        subscriptionStatus: string;          // trial | active | suspended | cancelled
        features: Record<string, boolean>;   // Feature flags (ai_forecasting, what_if, etc.)
      };

      /**
       * User information from database
       * Available after tenantMiddleware executes successfully
       */
      user?: {
        id: string;          // UUID primary key
        clerkId: string;     // Clerk user ID
        email: string;       // User email address
        role: string;        // owner | admin | member | viewer
      };
    }
  }
}

// ================================
// Tenant Middleware
// ================================

/**
 * Main tenant middleware function
 *
 * Executed on every request that requires tenant context.
 * Authenticates user, identifies tenant, sets database schema.
 *
 * @example
 * // Protect all routes under /api/products
 * router.use('/api/products', tenantMiddleware);
 *
 * @example
 * // Protect individual route
 * router.get('/api/dashboard', tenantMiddleware, getDashboardHandler);
 */
export async function tenantMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // ====================================
    // STEP 1: Extract Clerk Session Token
    // ====================================
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'authentication_required',
        message: 'Missing or invalid authorization header. Please include "Authorization: Bearer <token>".',
        hint: 'Obtain token from Clerk session'
      });
      return;
    }

    const sessionToken = authHeader.substring(7); // Remove "Bearer " prefix

    // ====================================
    // STEP 2: Verify Session with Clerk
    // ====================================
    let session;
    try {
      session = await clerkClient.sessions.verifySession(sessionToken);
    } catch (clerkError: any) {
      res.status(401).json({
        success: false,
        error: 'invalid_session',
        message: 'Clerk session verification failed. Token may be expired or invalid.',
        clerkError: clerkError.message
      });
      return;
    }

    if (!session) {
      res.status(401).json({
        success: false,
        error: 'invalid_session',
        message: 'Session verification returned null. Please re-authenticate.'
      });
      return;
    }

    // ====================================
    // STEP 3: Get Clerk User
    // ====================================
    let clerkUser;
    try {
      clerkUser = await clerkClient.users.getUser(session.userId);
    } catch (userError: any) {
      res.status(500).json({
        success: false,
        error: 'clerk_user_fetch_failed',
        message: 'Failed to fetch user from Clerk',
        clerkError: userError.message
      });
      return;
    }

    // ====================================
    // STEP 4: Get Active Organization ID
    // ====================================
    // In Clerk, users can belong to multiple organizations.
    // The client must specify which organization context to use via header.
    const organizationId = req.headers['x-organization-id'] as string;

    if (!organizationId) {
      res.status(400).json({
        success: false,
        error: 'missing_organization_id',
        message: 'Missing X-Organization-ID header. Please select an organization.',
        hint: 'Include "X-Organization-ID: <clerk_org_id>" in request headers'
      });
      return;
    }

    // ====================================
    // STEP 5: Verify Organization Membership
    // ====================================
    let orgMembership;
    try {
      const memberships = await clerkClient.organizations.getOrganizationMembershipList({
        organizationId,
        userId: session.userId
      });

      orgMembership = memberships?.data;

      if (!orgMembership || orgMembership.length === 0) {
        res.status(403).json({
          success: false,
          error: 'organization_access_denied',
          message: 'You do not belong to this organization',
          organizationId
        });
        return;
      }
    } catch (orgError: any) {
      res.status(500).json({
        success: false,
        error: 'organization_verification_failed',
        message: 'Failed to verify organization membership',
        clerkError: orgError.message
      });
      return;
    }

    // ====================================
    // STEP 6: Get Tenant from Database
    // ====================================
    let tenant;
    try {
      tenant = await prisma.tenant.findUnique({
        where: { clerkOrganizationId: organizationId },
        select: {
          id: true,
          slug: true,
          schemaName: true,
          clerkOrganizationId: true,
          subscriptionTier: true,
          subscriptionStatus: true,
          features: true
        }
      });
    } catch (dbError: any) {
      res.status(500).json({
        success: false,
        error: 'tenant_lookup_failed',
        message: 'Database error while fetching tenant',
        dbError: dbError.message
      });
      return;
    }

    if (!tenant) {
      res.status(404).json({
        success: false,
        error: 'tenant_not_found',
        message: 'No tenant found for this organization. Please contact support.',
        organizationId
      });
      return;
    }

    // ====================================
    // STEP 7: Check Subscription Status
    // ====================================
    if (tenant.subscriptionStatus === 'suspended' || tenant.subscriptionStatus === 'cancelled') {
      res.status(403).json({
        success: false,
        error: 'subscription_inactive',
        message: tenant.subscriptionStatus === 'suspended'
          ? 'Your subscription is suspended. Please update your billing information.'
          : 'Your subscription has been cancelled. Please reactivate to continue.',
        subscriptionStatus: tenant.subscriptionStatus,
        billingUrl: '/billing'
      });
      return;
    }

    // ====================================
    // STEP 8: Get or Create User in Database
    // ====================================
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { clerkUserId: session.userId },
        select: {
          id: true,
          clerkUserId: true,
          email: true,
          role: true,
          tenantId: true
        }
      });

      // Auto-create user if they exist in Clerk but not in our database
      if (!user) {
        console.log(`[TenantMiddleware] Auto-creating user ${session.userId} for tenant ${tenant.id}`);

        // Determine role from Clerk organization membership
        const userRole = orgMembership[0].role === 'admin' ? 'admin' : 'member';
        const primaryEmail = clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId);

        user = await prisma.user.create({
          data: {
            clerkUserId: session.userId,
            email: primaryEmail?.emailAddress || '',
            fullName: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Unknown User',
            tenantId: tenant.id,
            role: userRole
          },
          select: {
            id: true,
            clerkUserId: true,
            email: true,
            role: true,
            tenantId: true
          }
        });

        console.log(`[TenantMiddleware] User created: ${user.id} (${user.email}) as ${user.role}`);
      }
    } catch (userDbError: any) {
      res.status(500).json({
        success: false,
        error: 'user_lookup_failed',
        message: 'Database error while fetching or creating user',
        dbError: userDbError.message
      });
      return;
    }

    // ====================================
    // STEP 9: Attach Tenant and User to Request
    // ====================================
    req.tenant = {
      id: tenant.id,
      slug: tenant.slug,
      schemaName: tenant.schemaName,
      organizationId: tenant.clerkOrganizationId,
      subscriptionTier: tenant.subscriptionTier,
      subscriptionStatus: tenant.subscriptionStatus,
      features: tenant.features as Record<string, boolean>
    };

    req.user = {
      id: user.id,
      clerkId: user.clerkUserId,
      email: user.email,
      role: user.role
    };

    // ====================================
    // STEP 10: Set PostgreSQL search_path to Tenant Schema
    // ====================================
    // This ensures all subsequent database queries target the tenant's schema
    // Example: SELECT * FROM products → tenant_abc123.products
    try {
      await prisma.$executeRawUnsafe(
        `SET search_path TO "${tenant.schemaName}", public`
      );

      console.log(`[TenantMiddleware] Schema switched to ${tenant.schemaName} for user ${user.email}`);
    } catch (schemaError: any) {
      res.status(500).json({
        success: false,
        error: 'schema_switch_failed',
        message: 'Failed to set PostgreSQL search_path',
        schemaName: tenant.schemaName,
        dbError: schemaError.message
      });
      return;
    }

    // ====================================
    // SUCCESS: Proceed to next middleware/route handler
    // ====================================
    next();

  } catch (error: any) {
    console.error('[TenantMiddleware] Unexpected error:', error);

    res.status(500).json({
      success: false,
      error: 'internal_server_error',
      message: 'An unexpected error occurred during tenant identification',
      debug: process.env.NODE_ENV === 'development' ? {
        errorType: error.name,
        errorMessage: error.message,
        stack: error.stack
      } : undefined
    });
  }
}

// ================================
// Helper Functions
// ================================

/**
 * Optional middleware to require tenant context
 *
 * Use this AFTER tenantMiddleware to ensure req.tenant exists.
 * Useful for routes that should never run without tenant context.
 *
 * @example
 * router.get('/api/products', tenantMiddleware, requireTenant, getProductsHandler);
 */
export function requireTenant(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.tenant) {
    res.status(401).json({
      success: false,
      error: 'tenant_not_identified',
      message: 'Tenant context not established. Please ensure tenantMiddleware runs first.'
    });
    return;
  }

  next();
}

/**
 * Optional middleware to require user context
 *
 * Use this AFTER tenantMiddleware to ensure req.user exists.
 *
 * @example
 * router.post('/api/profile', tenantMiddleware, requireUser, updateProfileHandler);
 */
export function requireUser(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'user_not_authenticated',
      message: 'User context not established. Please ensure tenantMiddleware runs first.'
    });
    return;
  }

  next();
}

export default tenantMiddleware;
