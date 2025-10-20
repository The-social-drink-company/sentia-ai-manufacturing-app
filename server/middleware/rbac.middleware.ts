/**
 * RBAC Middleware - Role-Based Access Control
 *
 * BMAD-MULTITENANT-002 Story 3: RBAC Middleware
 *
 * This middleware enforces role-based permissions using a hierarchical
 * role system. Higher roles inherit permissions from lower roles.
 *
 * Role Hierarchy (descending power):
 * - owner (4): Full admin access + tenant deletion
 * - admin (3): User management, settings, integrations
 * - member (2): Read/write data, create records
 * - viewer (1): Read-only access
 *
 * Usage:
 * ```ts
 * // Require admin role (admin or owner)
 * router.delete(
 *   '/api/users/:id',
 *   tenantMiddleware,
 *   requireRole('admin'),
 *   deleteUserHandler
 * );
 *
 * // Require owner role (owner only)
 * router.delete(
 *   '/api/tenant',
 *   tenantMiddleware,
 *   requireRole('owner'),
 *   deleteTenantHandler
 * );
 *
 * // Require member role (member, admin, or owner)
 * router.post(
 *   '/api/products',
 *   tenantMiddleware,
 *   requireRole('member'),
 *   createProductHandler
 * );
 * ```
 *
 * Security:
 * - Prevents privilege escalation (member can't perform admin actions)
 * - Prevents data modification by viewers
 * - Returns 403 with clear error message for insufficient permissions
 *
 * @module server/middleware/rbac.middleware
 */

import { Request, Response, NextFunction } from 'express';

// ================================
// Role Types & Hierarchy
// ================================

/**
 * All available roles in CapLiquify
 *
 * Roles are hierarchical - higher roles inherit permissions from lower roles.
 */
export type Role = 'owner' | 'admin' | 'member' | 'viewer';

/**
 * Role hierarchy levels
 *
 * Higher numbers = more permissions
 * Example: admin (3) can do everything member (2) and viewer (1) can do
 */
const roleHierarchy: Record<Role, number> = {
  owner: 4,  // Full control (delete tenant, change subscription, etc.)
  admin: 3,  // Manage users, settings, integrations
  member: 2, // Create/edit data, use features
  viewer: 1  // Read-only access
};

/**
 * Role descriptions for error messages and documentation
 */
const ROLE_DESCRIPTIONS: Record<Role, string> = {
  owner: 'Organization Owner (full admin rights + billing)',
  admin: 'Administrator (user management, settings, integrations)',
  member: 'Member (create/edit data, use features)',
  viewer: 'Viewer (read-only access)'
};

/**
 * Default permissions for each role
 *
 * This defines what actions each role can perform.
 * Higher roles inherit all permissions from lower roles.
 */
export const ROLE_PERMISSIONS = {
  viewer: [
    'view_dashboard',
    'view_products',
    'view_sales',
    'view_forecasts',
    'view_reports',
    'export_data'
  ],
  member: [
    // Inherits all viewer permissions +
    'create_products',
    'edit_products',
    'create_sales',
    'edit_sales',
    'create_forecasts',
    'edit_forecasts',
    'import_data'
  ],
  admin: [
    // Inherits all member permissions +
    'delete_products',
    'delete_sales',
    'manage_users',
    'invite_users',
    'remove_users',
    'manage_integrations',
    'configure_settings',
    'view_audit_logs'
  ],
  owner: [
    // Inherits all admin permissions +
    'delete_tenant',
    'change_subscription',
    'manage_billing',
    'assign_owner_role',
    'view_billing',
    'export_all_data'
  ]
} as const;

// ================================
// RBAC Middleware
// ================================

/**
 * Factory function to create RBAC middleware
 *
 * Returns middleware that checks if the user has the required role.
 * Due to role hierarchy, higher roles automatically pass lower role checks.
 *
 * @param minRole - Minimum role required to access route
 * @returns Express middleware function
 *
 * @example
 * // Only admins and owners can delete products
 * router.delete('/api/products/:id', requireRole('admin'), deleteProductHandler);
 *
 * @example
 * // Only owners can delete tenant
 * router.delete('/api/tenant', requireRole('owner'), deleteTenantHandler);
 *
 * @example
 * // Members, admins, and owners can create products
 * router.post('/api/products', requireRole('member'), createProductHandler);
 */
export function requireRole(minRole: Role) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // ====================================
    // STEP 1: Ensure user context exists
    // ====================================
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'user_not_authenticated',
        message: 'User context not established. Please ensure tenantMiddleware runs before RBAC middleware.',
        hint: 'Use: router.use(tenantMiddleware) before role-protected routes'
      });
      return;
    }

    // ====================================
    // STEP 2: Get user's role level
    // ====================================
    const userRole = req.user.role as Role;
    const userRoleLevel = roleHierarchy[userRole] || 0;
    const requiredRoleLevel = roleHierarchy[minRole];

    // ====================================
    // STEP 3: Check if user has sufficient permissions
    // ====================================
    if (userRoleLevel < requiredRoleLevel) {
      res.status(403).json({
        success: false,
        error: 'insufficient_permissions',
        message: `This action requires ${ROLE_DESCRIPTIONS[minRole]} permissions.`,
        requiredRole: minRole,
        currentRole: userRole,
        hint: `Contact an admin or owner to request ${minRole} access`
      });
      return;
    }

    // ====================================
    // SUCCESS: User has sufficient role, proceed
    // ====================================
    next();
  };
}

/**
 * Middleware to require EXACT role match (no hierarchy)
 *
 * Unlike requireRole, this checks for exact role match.
 * Useful for owner-only actions that should not be accessible to admins.
 *
 * @param role - Exact role required
 * @returns Express middleware function
 *
 * @example
 * // Only owners (not admins) can change subscription
 * router.post('/api/subscription', requireExactRole('owner'), changeSubscriptionHandler);
 */
export function requireExactRole(role: Role) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'user_not_authenticated',
        message: 'User context not established.'
      });
      return;
    }

    if (req.user.role !== role) {
      res.status(403).json({
        success: false,
        error: 'exact_role_required',
        message: `This action requires exactly ${ROLE_DESCRIPTIONS[role]} access.`,
        requiredRole: role,
        currentRole: req.user.role,
        note: 'Role hierarchy does not apply for this action'
      });
      return;
    }

    next();
  };
}

/**
 * Middleware to require ANY of the specified roles
 *
 * Useful when multiple roles should have access (OR condition).
 * Does not use hierarchy - checks exact role matches.
 *
 * @param roles - Array of roles that can access route
 * @returns Express middleware function
 *
 * @example
 * // Allow either admin OR owner (but not member)
 * router.get('/api/audit-logs', requireAnyRole(['admin', 'owner']), getAuditLogsHandler);
 */
export function requireAnyRole(roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'user_not_authenticated',
        message: 'User context not established.'
      });
      return;
    }

    const hasRole = roles.includes(req.user.role as Role);

    if (!hasRole) {
      const roleNames = roles.map(r => ROLE_DESCRIPTIONS[r]).join(' OR ');

      res.status(403).json({
        success: false,
        error: 'insufficient_role',
        message: `This action requires one of: ${roleNames}`,
        requiredRoles: roles,
        currentRole: req.user.role
      });
      return;
    }

    next();
  };
}

// ================================
// Helper Functions
// ================================

/**
 * Check if user has a specific role or higher (non-middleware)
 *
 * Use this in route handlers for conditional logic based on role.
 *
 * @param req - Express request object
 * @param minRole - Minimum role to check
 * @returns true if user has role or higher, false otherwise
 *
 * @example
 * // Show admin panel only to admins and owners
 * async function getDashboard(req, res) {
 *   const data = { ... };
 *
 *   if (hasRole(req, 'admin')) {
 *     data.adminPanel = await getAdminPanelData();
 *   }
 *
 *   res.json(data);
 * }
 */
export function hasRole(req: Request, minRole: Role): boolean {
  if (!req.user) {
    return false;
  }

  const userRoleLevel = roleHierarchy[req.user.role as Role] || 0;
  const requiredRoleLevel = roleHierarchy[minRole];

  return userRoleLevel >= requiredRoleLevel;
}

/**
 * Check if user has exact role match (non-middleware)
 *
 * @param req - Express request object
 * @param role - Exact role to check
 * @returns true if user has exact role, false otherwise
 *
 * @example
 * // Show owner-only settings
 * if (hasExactRole(req, 'owner')) {
 *   data.ownerSettings = await getOwnerSettings();
 * }
 */
export function hasExactRole(req: Request, role: Role): boolean {
  return req.user?.role === role;
}

/**
 * Get all permissions for a user's role (including inherited)
 *
 * @param role - User role
 * @returns Array of permission strings
 *
 * @example
 * // Get all permissions for member role
 * const permissions = getRolePermissions('member');
 * // Returns: ['view_dashboard', 'view_products', ..., 'create_products', 'edit_products', ...]
 */
export function getRolePermissions(role: Role): string[] {
  const allRoles: Role[] = ['viewer', 'member', 'admin', 'owner'];
  const roleIndex = allRoles.indexOf(role);

  if (roleIndex === -1) {
    return [];
  }

  // Collect all permissions from current role and all roles below it
  const permissions: string[] = [];
  for (let i = 0; i <= roleIndex; i++) {
    permissions.push(...ROLE_PERMISSIONS[allRoles[i]]);
  }

  return [...new Set(permissions)]; // Remove duplicates
}

/**
 * Check if user has a specific permission (non-middleware)
 *
 * @param req - Express request object
 * @param permission - Permission to check
 * @returns true if user has permission, false otherwise
 *
 * @example
 * // Check if user can delete products
 * if (hasPermission(req, 'delete_products')) {
 *   // Show delete button
 * }
 */
export function hasPermission(req: Request, permission: string): boolean {
  if (!req.user) {
    return false;
  }

  const userPermissions = getRolePermissions(req.user.role as Role);
  return userPermissions.includes(permission);
}

// ================================
// Export
// ================================

export default requireRole;
