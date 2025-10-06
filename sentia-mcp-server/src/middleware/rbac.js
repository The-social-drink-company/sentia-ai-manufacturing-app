/**
 * Role-Based Access Control (RBAC) Middleware
 * 
 * Comprehensive RBAC system with development bypass for the Sentia Manufacturing MCP Server.
 * 
 * CRITICAL: Development environment grants admin permissions automatically
 * while maintaining full RBAC enforcement in production.
 */

import { createLogger } from '../utils/logger.js';
import { 
  isDevelopmentEnvironment, 
  CURRENT_AUTH_CONFIG 
} from '../config/auth-config.js';
import { 
  AuthorizationError, 
  ValidationError 
} from '../utils/error-handler.js';

const logger = createLogger();

/**
 * RBAC Manager Class
 */
export class RBACManager {
  constructor() {
    this.isDevelopment = isDevelopmentEnvironment();
    this.config = CURRENT_AUTH_CONFIG.rbac;
    this.roles = this.config.roles;
    this.permissions = this.config.permissions;
    
    // Initialize permission cache
    this.permissionCache = new Map();
    this.buildPermissionCache();
  }

  /**
   * Build permission cache with role inheritance
   */
  buildPermissionCache() {
    for (const [roleName, roleConfig] of Object.entries(this.roles)) {
      const allPermissions = this.resolveRolePermissions(roleName, new Set());
      this.permissionCache.set(roleName, Array.from(allPermissions));
    }
    
    logger.debug('Permission cache built', {
      roles: Object.keys(this.roles).length,
      cacheEntries: this.permissionCache.size
    });
  }

  /**
   * Resolve role permissions with inheritance
   */
  resolveRolePermissions(roleName, visited = new Set()) {
    if (visited.has(roleName)) {
      logger.warn('Circular role inheritance detected', { roleName });
      return new Set();
    }
    
    visited.add(roleName);
    const role = this.roles[roleName];
    
    if (!role) {
      logger.warn('Unknown role referenced', { roleName });
      return new Set();
    }
    
    const permissions = new Set(role.permissions);
    
    // Add inherited permissions
    if (role.inherits && Array.isArray(role.inherits)) {
      for (const inheritedRole of role.inherits) {
        const inheritedPermissions = this.resolveRolePermissions(inheritedRole, new Set(visited));
        for (const permission of inheritedPermissions) {
          permissions.add(permission);
        }
      }
    }
    
    return permissions;
  }

  /**
   * Check if user has required role
   */
  hasRole(user, requiredRole) {
    // CRITICAL: Development bypass - always grant access
    if (this.isDevelopment) {
      logger.debug('Development bypass: Role check passed', {
        userId: user?.id,
        requiredRole,
        userRole: user?.role
      });
      return true;
    }
    
    if (!user || !user.role) {
      return false;
    }
    
    // Admin role has access to everything
    if (user.role === 'admin') {
      return true;
    }
    
    // Direct role match
    if (user.role === requiredRole) {
      return true;
    }
    
    // Check if user's role inherits the required role
    return this.roleInheritsFrom(user.role, requiredRole);
  }

  /**
   * Check if role inherits from another role
   */
  roleInheritsFrom(userRole, requiredRole) {
    const role = this.roles[userRole];
    
    if (!role || !role.inherits) {
      return false;
    }
    
    if (role.inherits.includes(requiredRole)) {
      return true;
    }
    
    // Check transitive inheritance
    for (const inheritedRole of role.inherits) {
      if (this.roleInheritsFrom(inheritedRole, requiredRole)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(user, requiredPermission) {
    // CRITICAL: Development bypass - always grant access
    if (this.isDevelopment) {
      logger.debug('Development bypass: Permission check passed', {
        userId: user?.id,
        requiredPermission,
        userRole: user?.role
      });
      return true;
    }
    
    if (!user) {
      return false;
    }
    
    // Check explicit user permissions first
    if (user.permissions && Array.isArray(user.permissions)) {
      if (user.permissions.includes('*') || user.permissions.includes(requiredPermission)) {
        return true;
      }
    }
    
    // Check role-based permissions
    if (user.role) {
      const rolePermissions = this.permissionCache.get(user.role) || [];
      
      if (rolePermissions.includes('*') || rolePermissions.includes(requiredPermission)) {
        return true;
      }
      
      // Check wildcard permissions (e.g., "financial:*" for "financial:read")
      const permissionParts = requiredPermission.split(':');
      if (permissionParts.length === 2) {
        const wildcardPermission = `${permissionParts[0]}:*`;
        if (rolePermissions.includes(wildcardPermission)) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Check if user has any of the required permissions
   */
  hasAnyPermission(user, requiredPermissions) {
    if (!Array.isArray(requiredPermissions) || requiredPermissions.length === 0) {
      return true;
    }
    
    return requiredPermissions.some(permission => this.hasPermission(user, permission));
  }

  /**
   * Check if user has all required permissions
   */
  hasAllPermissions(user, requiredPermissions) {
    if (!Array.isArray(requiredPermissions) || requiredPermissions.length === 0) {
      return true;
    }
    
    return requiredPermissions.every(permission => this.hasPermission(user, permission));
  }

  /**
   * Get all permissions for a user
   */
  getUserPermissions(user) {
    if (this.isDevelopment) {
      return ['*']; // All permissions in development
    }
    
    if (!user) {
      return [];
    }
    
    const permissions = new Set();
    
    // Add explicit user permissions
    if (user.permissions && Array.isArray(user.permissions)) {
      for (const permission of user.permissions) {
        permissions.add(permission);
      }
    }
    
    // Add role-based permissions
    if (user.role) {
      const rolePermissions = this.permissionCache.get(user.role) || [];
      for (const permission of rolePermissions) {
        permissions.add(permission);
      }
    }
    
    return Array.from(permissions);
  }

  /**
   * Get role hierarchy for a user
   */
  getUserRoleHierarchy(user) {
    if (!user || !user.role) {
      return [];
    }
    
    const hierarchy = [user.role];
    const role = this.roles[user.role];
    
    if (role && role.inherits) {
      for (const inheritedRole of role.inherits) {
        hierarchy.push(...this.getUserRoleHierarchy({ role: inheritedRole }));
      }
    }
    
    return [...new Set(hierarchy)]; // Remove duplicates
  }

  /**
   * Validate role configuration
   */
  validateRoleConfiguration() {
    const errors = [];
    
    // Check for circular dependencies
    for (const roleName of Object.keys(this.roles)) {
      try {
        this.resolveRolePermissions(roleName);
      } catch (error) {
        errors.push(`Circular inheritance in role: ${roleName}`);
      }
    }
    
    // Check for invalid permission references
    for (const [roleName, role] of Object.entries(this.roles)) {
      for (const permission of role.permissions) {
        if (permission !== '*' && !this.isValidPermission(permission)) {
          errors.push(`Invalid permission "${permission}" in role "${roleName}"`);
        }
      }
    }
    
    if (errors.length > 0) {
      logger.error('RBAC configuration validation failed', { errors });
      throw new ValidationError(`RBAC configuration invalid: ${errors.join(', ')}`);
    }
    
    return true;
  }

  /**
   * Check if permission is valid
   */
  isValidPermission(permission) {
    if (permission === '*') {
      return true;
    }
    
    // Check against defined permission categories
    for (const permissions of Object.values(this.permissions)) {
      if (permissions.includes(permission)) {
        return true;
      }
    }
    
    // Check wildcard permissions
    const parts = permission.split(':');
    if (parts.length === 2 && parts[1] === '*') {
      return Object.prototype.hasOwnProperty.call(this.permissions, parts[0]);
    }
    
    return false;
  }

  /**
   * Get RBAC status and statistics
   */
  getStatus() {
    return {
      developmentBypass: this.isDevelopment,
      totalRoles: Object.keys(this.roles).length,
      totalPermissionCategories: Object.keys(this.permissions).length,
      totalPermissions: Object.values(this.permissions).flat().length,
      defaultRole: this.config.defaultRole,
      cacheSize: this.permissionCache.size,
      roles: Object.fromEntries(
        Object.entries(this.roles).map(([name, role]) => [
          name,
          {
            name: role.name,
            description: role.description,
            permissionCount: this.permissionCache.get(name)?.length || 0,
            inherits: role.inherits || []
          }
        ])
      )
    };
  }
}

// Create singleton instance
export const rbacManager = new RBACManager();

/**
 * Middleware to require specific role
 */
export function requireRole(requiredRole) {
  return (req, res, next) => {
    try {
      // CRITICAL: Development bypass
      if (isDevelopmentEnvironment()) {
        logger.debug('Development bypass: Role requirement bypassed', {
          requiredRole,
          correlationId: req.correlationId
        });
        return next();
      }
      
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }
      
      if (!rbacManager.hasRole(req.user, requiredRole)) {
        logger.warn('Role access denied', {
          userId: req.user.id,
          userRole: req.user.role,
          requiredRole,
          correlationId: req.correlationId
        });
        
        throw new AuthorizationError(`Role required: ${requiredRole}`);
      }
      
      logger.debug('Role access granted', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRole,
        correlationId: req.correlationId
      });
      
      next();
      
    } catch (error) {
      const statusCode = error.statusCode || 403;
      res.status(statusCode).json({
        error: error.message,
        correlationId: req.correlationId,
        timestamp: new Date().toISOString()
      });
    }
  };
}

/**
 * Middleware to require specific permission
 */
export function requirePermission(requiredPermission) {
  return (req, res, next) => {
    try {
      // CRITICAL: Development bypass
      if (isDevelopmentEnvironment()) {
        logger.debug('Development bypass: Permission requirement bypassed', {
          requiredPermission,
          correlationId: req.correlationId
        });
        return next();
      }
      
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }
      
      if (!rbacManager.hasPermission(req.user, requiredPermission)) {
        logger.warn('Permission access denied', {
          userId: req.user.id,
          userRole: req.user.role,
          requiredPermission,
          userPermissions: rbacManager.getUserPermissions(req.user),
          correlationId: req.correlationId
        });
        
        throw new AuthorizationError(`Permission required: ${requiredPermission}`);
      }
      
      logger.debug('Permission access granted', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredPermission,
        correlationId: req.correlationId
      });
      
      next();
      
    } catch (error) {
      const statusCode = error.statusCode || 403;
      res.status(statusCode).json({
        error: error.message,
        correlationId: req.correlationId,
        timestamp: new Date().toISOString()
      });
    }
  };
}

/**
 * Middleware to require any of the specified permissions
 */
export function requireAnyPermission(requiredPermissions) {
  return (req, res, next) => {
    try {
      // CRITICAL: Development bypass
      if (isDevelopmentEnvironment()) {
        logger.debug('Development bypass: Any permission requirement bypassed', {
          requiredPermissions,
          correlationId: req.correlationId
        });
        return next();
      }
      
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }
      
      if (!rbacManager.hasAnyPermission(req.user, requiredPermissions)) {
        logger.warn('Any permission access denied', {
          userId: req.user.id,
          userRole: req.user.role,
          requiredPermissions,
          userPermissions: rbacManager.getUserPermissions(req.user),
          correlationId: req.correlationId
        });
        
        throw new AuthorizationError(`One of these permissions required: ${requiredPermissions.join(', ')}`);
      }
      
      logger.debug('Any permission access granted', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredPermissions,
        correlationId: req.correlationId
      });
      
      next();
      
    } catch (error) {
      const statusCode = error.statusCode || 403;
      res.status(statusCode).json({
        error: error.message,
        correlationId: req.correlationId,
        timestamp: new Date().toISOString()
      });
    }
  };
}

/**
 * Middleware to check tool-specific permissions
 */
export function requireToolPermission(toolName) {
  return (req, res, next) => {
    try {
      // CRITICAL: Development bypass
      if (isDevelopmentEnvironment()) {
        logger.debug('Development bypass: Tool permission bypassed', {
          toolName,
          correlationId: req.correlationId
        });
        return next();
      }
      
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }
      
      // Determine required permission based on tool category
      const toolPermissions = {
        'system': 'system:admin',
        'financial': 'financial:read',
        'production': 'production:read',
        'inventory': 'inventory:read',
        'quality': 'quality:read',
        'analytics': 'analytics:read',
        'database': 'system:admin'
      };
      
      // Default to the tool's category permission
      let requiredPermission = 'dashboard:read'; // Default permission
      
      // Try to match tool name to category
      for (const [category, permission] of Object.entries(toolPermissions)) {
        if (toolName.toLowerCase().includes(category)) {
          requiredPermission = permission;
          break;
        }
      }
      
      if (!rbacManager.hasPermission(req.user, requiredPermission)) {
        logger.warn('Tool permission access denied', {
          userId: req.user.id,
          userRole: req.user.role,
          toolName,
          requiredPermission,
          correlationId: req.correlationId
        });
        
        throw new AuthorizationError(`Tool access denied: ${toolName}`);
      }
      
      logger.debug('Tool permission access granted', {
        userId: req.user.id,
        userRole: req.user.role,
        toolName,
        requiredPermission,
        correlationId: req.correlationId
      });
      
      next();
      
    } catch (error) {
      const statusCode = error.statusCode || 403;
      res.status(statusCode).json({
        error: error.message,
        correlationId: req.correlationId,
        timestamp: new Date().toISOString()
      });
    }
  };
}

// Export the RBAC manager and convenience functions
export const {
  hasRole,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getUserPermissions,
  getUserRoleHierarchy,
  getStatus
} = rbacManager;

// Validate configuration on startup
try {
  rbacManager.validateRoleConfiguration();
  logger.info('RBAC configuration validated successfully');
} catch (error) {
  logger.error('RBAC configuration validation failed', { error: error.message });
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}