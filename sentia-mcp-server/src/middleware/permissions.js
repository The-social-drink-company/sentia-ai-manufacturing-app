/**
 * Permission Checking Middleware
 * 
 * Advanced permission validation system with development bypass
 * for the Sentia Manufacturing MCP Server.
 * 
 * CRITICAL: Development environment bypasses all permission checks
 * while maintaining granular permission control in production.
 */

import { createLogger } from '../utils/logger.js';
import { rbacManager } from './rbac.js';
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
 * Permission Manager Class
 */
export class PermissionManager {
  constructor() {
    this.isDevelopment = isDevelopmentEnvironment();
    this.config = CURRENT_AUTH_CONFIG.rbac;
    
    // Permission templates for common operations
    this.permissionTemplates = {
      read: ['read', 'view', 'get', 'list', 'search'],
      write: ['write', 'create', 'update', 'edit', 'modify'],
      delete: ['delete', 'remove', 'destroy'],
      admin: ['admin', 'manage', 'configure', 'control']
    };
    
    // Tool category permissions mapping
    this.toolPermissions = new Map([
      ['system-status', 'system:read'],
      ['list-tools', 'dashboard:read'],
      ['database-query', 'system:admin'],
      
      // Financial tools
      ['financial-reports', 'financial:read'],
      ['create-invoice', 'financial:write'],
      ['financial-analysis', 'financial:read'],
      ['sales-performance', 'financial:read'],
      
      // Manufacturing tools
      ['get-products', 'production:read'],
      ['get-inventory', 'inventory:read'],
      ['get-production-orders', 'production:read'],
      ['get-purchase-orders', 'production:read'],
      ['get-sales-orders', 'orders:read'],
      ['get-suppliers', 'production:read'],
      ['get-customers', 'orders:read'],
      
      // E-commerce tools
      ['orders', 'orders:read'],
      ['products', 'inventory:read'],
      ['customers', 'orders:read'],
      ['analytics', 'analytics:read'],
      ['product-management', 'inventory:write'],
      
      // AI tools
      ['data-analysis', 'analytics:read'],
      ['content-generation', 'analytics:write'],
      ['customer-insights', 'analytics:read'],
      ['operational-optimization', 'production:read'],
      ['forecasting', 'analytics:read'],
      ['automated-reporting', 'reports:write'],
      ['business-reports', 'reports:read'],
      ['competitive-analysis', 'analytics:read'],
      ['inventory-optimization', 'inventory:write'],
      ['strategic-planning', 'analytics:read']
    ]);
  }

  /**
   * Check permission for a specific operation
   */
  checkPermission(user, permission, context = {}) {
    // CRITICAL: Development bypass - always allow
    if (this.isDevelopment) {
      logger.debug('Development bypass: Permission check bypassed', {
        userId: user?.id,
        permission,
        context: Object.keys(context)
      });
      return { granted: true, reason: 'development_bypass' };
    }
    
    if (!user) {
      return { granted: false, reason: 'no_user' };
    }
    
    // Use RBAC manager for permission checking
    const hasPermission = rbacManager.hasPermission(user, permission);
    
    if (hasPermission) {
      logger.debug('Permission granted', {
        userId: user.id,
        permission,
        userRole: user.role
      });
      
      return { granted: true, reason: 'permission_match' };
    }
    
    // Check for context-specific permissions
    if (context.resource) {
      const contextPermission = this.getContextualPermission(permission, context);
      if (contextPermission && rbacManager.hasPermission(user, contextPermission)) {
        logger.debug('Contextual permission granted', {
          userId: user.id,
          originalPermission: permission,
          contextualPermission: contextPermission,
          context: context.resource
        });
        
        return { granted: true, reason: 'contextual_permission' };
      }
    }
    
    logger.warn('Permission denied', {
      userId: user.id,
      permission,
      userRole: user.role,
      userPermissions: rbacManager.getUserPermissions(user),
      context
    });
    
    return { granted: false, reason: 'insufficient_permissions' };
  }

  /**
   * Get contextual permission based on resource
   */
  getContextualPermission(basePermission, context) {
    const { resource, action } = context;
    
    if (!resource) return null;
    
    // Map resource types to permission categories
    const resourcePermissions = {
      'financial': 'financial',
      'production': 'production',
      'inventory': 'inventory',
      'quality': 'quality',
      'analytics': 'analytics',
      'reports': 'reports',
      'orders': 'orders',
      'users': 'users',
      'system': 'system'
    };
    
    const category = resourcePermissions[resource.toLowerCase()];
    if (!category) return null;
    
    // Determine action level
    const actionLevel = this.getActionLevel(action || basePermission);
    
    return `${category}:${actionLevel}`;
  }

  /**
   * Determine action level from permission or action
   */
  getActionLevel(action) {
    const actionLower = action.toLowerCase();
    
    for (const [level, keywords] of Object.entries(this.permissionTemplates)) {
      if (keywords.some(keyword => actionLower.includes(keyword))) {
        return level;
      }
    }
    
    return 'read'; // Default to read access
  }

  /**
   * Check tool execution permission
   */
  checkToolPermission(user, toolName, context = {}) {
    // CRITICAL: Development bypass - always allow
    if (this.isDevelopment) {
      logger.debug('Development bypass: Tool permission bypassed', {
        userId: user?.id,
        toolName
      });
      return { granted: true, reason: 'development_bypass' };
    }
    
    if (!user) {
      return { granted: false, reason: 'no_user' };
    }
    
    // Check specific tool permission mapping
    const requiredPermission = this.toolPermissions.get(toolName);
    
    if (requiredPermission) {
      return this.checkPermission(user, requiredPermission, { 
        ...context, 
        tool: toolName 
      });
    }
    
    // Infer permission from tool name
    const inferredPermission = this.inferToolPermission(toolName);
    return this.checkPermission(user, inferredPermission, { 
      ...context, 
      tool: toolName 
    });
  }

  /**
   * Infer permission from tool name
   */
  inferToolPermission(toolName) {
    const nameLower = toolName.toLowerCase();
    
    // Financial tools
    if (nameLower.includes('financial') || nameLower.includes('invoice') || 
        nameLower.includes('payment') || nameLower.includes('accounting')) {
      return 'financial:read';
    }
    
    // Production tools
    if (nameLower.includes('production') || nameLower.includes('manufacturing') || 
        nameLower.includes('process')) {
      return 'production:read';
    }
    
    // Inventory tools
    if (nameLower.includes('inventory') || nameLower.includes('stock') || 
        nameLower.includes('warehouse')) {
      return 'inventory:read';
    }
    
    // Quality tools
    if (nameLower.includes('quality') || nameLower.includes('inspection') || 
        nameLower.includes('test')) {
      return 'quality:read';
    }
    
    // Analytics tools
    if (nameLower.includes('analytics') || nameLower.includes('analysis') || 
        nameLower.includes('insights') || nameLower.includes('forecast')) {
      return 'analytics:read';
    }
    
    // Reports tools
    if (nameLower.includes('report') || nameLower.includes('export')) {
      return 'reports:read';
    }
    
    // Orders tools
    if (nameLower.includes('order') || nameLower.includes('customer') || 
        nameLower.includes('supplier')) {
      return 'orders:read';
    }
    
    // System tools
    if (nameLower.includes('system') || nameLower.includes('config') || 
        nameLower.includes('admin') || nameLower.includes('database')) {
      return 'system:admin';
    }
    
    // Default to dashboard read permission
    return 'dashboard:read';
  }

  /**
   * Check multiple permissions (AND logic)
   */
  checkAllPermissions(user, permissions, context = {}) {
    if (!Array.isArray(permissions) || permissions.length === 0) {
      return { granted: true, reason: 'no_permissions_required' };
    }
    
    for (const permission of permissions) {
      const result = this.checkPermission(user, permission, context);
      if (!result.granted) {
        return {
          granted: false,
          reason: 'missing_permission',
          missingPermission: permission,
          checkResult: result
        };
      }
    }
    
    return { granted: true, reason: 'all_permissions_granted' };
  }

  /**
   * Check multiple permissions (OR logic)
   */
  checkAnyPermission(user, permissions, context = {}) {
    if (!Array.isArray(permissions) || permissions.length === 0) {
      return { granted: true, reason: 'no_permissions_required' };
    }
    
    const results = [];
    
    for (const permission of permissions) {
      const result = this.checkPermission(user, permission, context);
      results.push({ permission, result });
      
      if (result.granted) {
        return {
          granted: true,
          reason: 'permission_granted',
          grantedPermission: permission,
          checkResult: result
        };
      }
    }
    
    return {
      granted: false,
      reason: 'no_permissions_granted',
      checkedPermissions: results
    };
  }

  /**
   * Filter data based on user permissions
   */
  filterDataByPermissions(user, data, permissionMap) {
    if (this.isDevelopment) {
      return data; // No filtering in development
    }
    
    if (!user || !data || !permissionMap) {
      return data;
    }
    
    const filteredData = {};
    
    for (const [key, requiredPermission] of Object.entries(permissionMap)) {
      if (data[key] !== undefined) {
        const hasAccess = rbacManager.hasPermission(user, requiredPermission);
        if (hasAccess) {
          filteredData[key] = data[key];
        }
      }
    }
    
    return filteredData;
  }

  /**
   * Get permission summary for user
   */
  getPermissionSummary(user) {
    if (this.isDevelopment) {
      return {
        developmentMode: true,
        allPermissionsGranted: true,
        permissions: ['*'],
        roles: ['admin']
      };
    }
    
    if (!user) {
      return {
        developmentMode: false,
        allPermissionsGranted: false,
        permissions: [],
        roles: []
      };
    }
    
    return {
      developmentMode: false,
      allPermissionsGranted: user.permissions?.includes('*') || user.role === 'admin',
      permissions: rbacManager.getUserPermissions(user),
      roles: rbacManager.getUserRoleHierarchy(user),
      toolAccess: this.getToolAccessSummary(user)
    };
  }

  /**
   * Get tool access summary for user
   */
  getToolAccessSummary(user) {
    const summary = {};
    
    for (const [toolName, requiredPermission] of this.toolPermissions.entries()) {
      const result = this.checkPermission(user, requiredPermission);
      summary[toolName] = {
        granted: result.granted,
        requiredPermission,
        reason: result.reason
      };
    }
    
    return summary;
  }

  /**
   * Validate permission string format
   */
  validatePermissionFormat(permission) {
    if (typeof permission !== 'string') {
      return { valid: false, error: 'Permission must be a string' };
    }
    
    if (permission === '*') {
      return { valid: true };
    }
    
    const parts = permission.split(':');
    if (parts.length !== 2) {
      return { valid: false, error: 'Permission must be in format "category:action"' };
    }
    
    const [category, action] = parts;
    
    if (!category || !action) {
      return { valid: false, error: 'Both category and action must be specified' };
    }
    
    // Check if category exists
    if (!Object.prototype.hasOwnProperty.call(this.config.permissions, category)) {
      return { valid: false, error: `Unknown permission category: ${category}` };
    }
    
    return { valid: true };
  }

  /**
   * Get permission manager status
   */
  getStatus() {
    return {
      developmentBypass: this.isDevelopment,
      toolPermissionMappings: this.toolPermissions.size,
      permissionTemplates: Object.keys(this.permissionTemplates),
      environment: this.isDevelopment ? 'development' : 'production'
    };
  }
}

// Create singleton instance
export const permissionManager = new PermissionManager();

/**
 * Middleware factory for permission checking
 */
export function requirePermissions(permissions, options = {}) {
  const { mode = 'all', context = {} } = options;
  
  return async (req, res, next) => {
    try {
      // CRITICAL: Development bypass
      if (isDevelopmentEnvironment()) {
        logger.debug('Development bypass: Permission middleware bypassed', {
          permissions,
          correlationId: req.correlationId
        });
        return next();
      }
      
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }
      
      let result;
      
      if (mode === 'any') {
        result = permissionManager.checkAnyPermission(req.user, permissions, {
          ...context,
          correlationId: req.correlationId
        });
      } else {
        result = permissionManager.checkAllPermissions(req.user, permissions, {
          ...context,
          correlationId: req.correlationId
        });
      }
      
      if (!result.granted) {
        throw new AuthorizationError(
          `Insufficient permissions: ${result.reason}`,
          { details: result }
        );
      }
      
      // Add permission context to request
      req.permissionContext = {
        checkedPermissions: permissions,
        mode,
        result
      };
      
      next();
      
    } catch (error) {
      const statusCode = error.statusCode || 403;
      res.status(statusCode).json({
        error: error.message,
        correlationId: req.correlationId,
        timestamp: new Date().toISOString(),
        details: error.details || {}
      });
    }
  };
}

/**
 * Middleware for tool-specific permission checking
 */
export function requireToolPermissions(options = {}) {
  return async (req, res, next) => {
    try {
      // CRITICAL: Development bypass
      if (isDevelopmentEnvironment()) {
        logger.debug('Development bypass: Tool permission middleware bypassed', {
          correlationId: req.correlationId
        });
        return next();
      }
      
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }
      
      // Extract tool name from request
      const toolName = req.params.toolName || req.body.toolName || options.toolName;
      
      if (!toolName) {
        throw new ValidationError('Tool name required for permission check');
      }
      
      const result = permissionManager.checkToolPermission(req.user, toolName, {
        correlationId: req.correlationId,
        ...options.context
      });
      
      if (!result.granted) {
        throw new AuthorizationError(
          `Tool access denied: ${toolName}`,
          { details: result }
        );
      }
      
      // Add tool permission context to request
      req.toolPermissionContext = {
        toolName,
        result
      };
      
      next();
      
    } catch (error) {
      const statusCode = error.statusCode || 403;
      res.status(statusCode).json({
        error: error.message,
        correlationId: req.correlationId,
        timestamp: new Date().toISOString(),
        details: error.details || {}
      });
    }
  };
}

// Export convenience functions
export const {
  checkPermission,
  checkToolPermission,
  checkAllPermissions,
  checkAnyPermission,
  filterDataByPermissions,
  getPermissionSummary,
  validatePermissionFormat,
  getStatus
} = permissionManager;