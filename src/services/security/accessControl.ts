// Enterprise-grade Access Control System (RBAC + ABAC)

// Define User type to replace Clerk User
export interface User {
  id: string;
  email?: string;
  name?: string;
  role?: string;
  [key: string]: any;
}

// Role definitions
export enum Role {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  ANALYST = 'analyst',
  OPERATOR = 'operator',
  VIEWER = 'viewer',
  GUEST = 'guest'
}

// Permission definitions
export enum Permission {
  // System permissions
  MANAGE_USERS = 'manage_users',
  MANAGE_ROLES = 'manage_roles',
  MANAGE_SYSTEM = 'manage_system',
  VIEW_AUDIT_LOGS = 'view_audit_logs',
  EXPORT_AUDIT_LOGS = 'export_audit_logs',
  
  // Data permissions
  VIEW_ALL_DATA = 'view_all_data',
  EDIT_ALL_DATA = 'edit_all_data',
  DELETE_ALL_DATA = 'delete_all_data',
  EXPORT_DATA = 'export_data',
  IMPORT_DATA = 'import_data',
  
  // Financial permissions
  VIEW_FINANCIAL = 'view_financial',
  EDIT_FINANCIAL = 'edit_financial',
  APPROVE_TRANSACTIONS = 'approve_transactions',
  VIEW_SENSITIVE_FINANCIAL = 'view_sensitive_financial',
  
  // Manufacturing permissions
  VIEW_PRODUCTION = 'view_production',
  EDIT_PRODUCTION = 'edit_production',
  MANAGE_INVENTORY = 'manage_inventory',
  APPROVE_ORDERS = 'approve_orders',
  
  // Analytics permissions
  VIEW_ANALYTICS = 'view_analytics',
  CREATE_REPORTS = 'create_reports',
  EDIT_DASHBOARDS = 'edit_dashboards',
  SHARE_REPORTS = 'share_reports',
  
  // API permissions
  MANAGE_API_KEYS = 'manage_api_keys',
  ACCESS_API = 'access_api',
  RATE_LIMIT_BYPASS = 'rate_limit_bypass'
}

// Resource types for ABAC
export enum ResourceType {
  USER = 'user',
  ROLE = 'role',
  DASHBOARD = 'dashboard',
  REPORT = 'report',
  FINANCIAL_DATA = 'financial_data',
  PRODUCTION_DATA = 'production_data',
  INVENTORY = 'inventory',
  API_KEY = 'api_key',
  AUDIT_LOG = 'audit_log',
  SYSTEM_CONFIG = 'system_config'
}

// Action types for ABAC
export enum Action {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  EXPORT = 'export',
  SHARE = 'share',
  APPROVE = 'approve',
  REJECT = 'reject',
  EXECUTE = 'execute'
}

// Role-Permission mapping
const rolePermissions: Record<Role, Permission[]> = {
  [Role.SUPER_ADMIN]: Object.values(Permission),
  
  [Role.ADMIN]: [
    Permission.MANAGE_USERS,
    Permission.VIEW_AUDIT_LOGS,
    Permission.EXPORT_AUDIT_LOGS,
    Permission.VIEW_ALL_DATA,
    Permission.EDIT_ALL_DATA,
    Permission.EXPORT_DATA,
    Permission.IMPORT_DATA,
    Permission.VIEW_FINANCIAL,
    Permission.EDIT_FINANCIAL,
    Permission.VIEW_PRODUCTION,
    Permission.EDIT_PRODUCTION,
    Permission.MANAGE_INVENTORY,
    Permission.VIEW_ANALYTICS,
    Permission.CREATE_REPORTS,
    Permission.EDIT_DASHBOARDS,
    Permission.SHARE_REPORTS,
    Permission.MANAGE_API_KEYS,
    Permission.ACCESS_API
  ],
  
  [Role.MANAGER]: [
    Permission.VIEW_AUDIT_LOGS,
    Permission.VIEW_ALL_DATA,
    Permission.EDIT_ALL_DATA,
    Permission.EXPORT_DATA,
    Permission.VIEW_FINANCIAL,
    Permission.VIEW_PRODUCTION,
    Permission.EDIT_PRODUCTION,
    Permission.MANAGE_INVENTORY,
    Permission.APPROVE_ORDERS,
    Permission.VIEW_ANALYTICS,
    Permission.CREATE_REPORTS,
    Permission.SHARE_REPORTS,
    Permission.ACCESS_API
  ],
  
  [Role.ANALYST]: [
    Permission.VIEW_ALL_DATA,
    Permission.EXPORT_DATA,
    Permission.VIEW_FINANCIAL,
    Permission.VIEW_PRODUCTION,
    Permission.VIEW_ANALYTICS,
    Permission.CREATE_REPORTS,
    Permission.SHARE_REPORTS,
    Permission.ACCESS_API
  ],
  
  [Role.OPERATOR]: [
    Permission.VIEW_PRODUCTION,
    Permission.EDIT_PRODUCTION,
    Permission.MANAGE_INVENTORY,
    Permission.VIEW_ANALYTICS,
    Permission.ACCESS_API
  ],
  
  [Role.VIEWER]: [
    Permission.VIEW_PRODUCTION,
    Permission.VIEW_ANALYTICS
  ],
  
  [Role.GUEST]: []
};

// Attribute-based access control context
export interface ABACContext {
  user: {
    id: string;
    role: Role;
    department?: string;
    location?: string;
    clearanceLevel?: number;
    attributes?: Record<string, any>;
  };
  resource: {
    type: ResourceType;
    id: string;
    owner?: string;
    department?: string;
    sensitivity?: 'public' | 'internal' | 'confidential' | 'restricted';
    attributes?: Record<string, any>;
  };
  action: Action;
  environment: {
    time?: Date;
    ipAddress?: string;
    location?: string;
    deviceType?: string;
    sessionAge?: number;
  };
}

// ABAC Policy Engine
export class ABACPolicyEngine {
  private policies: ABACPolicy[] = [];

  constructor() {
    this.initializeDefaultPolicies();
  }

  private initializeDefaultPolicies() {
    // Data sensitivity policies
    this.addPolicy({
      name: 'restricted_data_access',
      description: 'Only users with high clearance can access restricted data',
      condition: (context) => {
        if (context.resource.sensitivity === 'restricted') {
          return (context.user.clearanceLevel || 0) >= 3;
        }
        return true;
      }
    });

    // Department-based access
    this.addPolicy({
      name: 'department_isolation',
      description: 'Users can only access data from their department unless admin',
      condition: (context) => {
        if (context.user.role === Role.SUPER_ADMIN || context.user.role === Role.ADMIN) {
          return true;
        }
        if (context.resource.department && context.user.department) {
          return context.resource.department === context.user.department;
        }
        return true;
      }
    });

    // Time-based access
    this.addPolicy({
      name: 'business_hours_restriction',
      description: 'Sensitive operations only during business hours',
      condition: (context) => {
        if (context.action === Action.DELETE || context.action === Action.APPROVE) {
          const hour = context.environment.time?.getHours() || new Date().getHours();
          const day = context.environment.time?.getDay() || new Date().getDay();
          
          // Business hours: Mon-Fri, 8 AM - 6 PM
          if (day >= 1 && day <= 5 && hour >= 8 && hour < 18) {
            return true;
          }
          
          // Allow admins to work outside business hours
          return context.user.role === Role.SUPER_ADMIN || context.user.role === Role.ADMIN;
        }
        return true;
      }
    });

    // Session age restriction
    this.addPolicy({
      name: 'session_age_limit',
      description: 'Require re-authentication for sensitive actions on old sessions',
      condition: (context) => {
        const maxSessionAge = 3600000; // 1 hour in milliseconds
        if (context.action === Action.DELETE || 
            context.action === Action.APPROVE ||
            context.resource.sensitivity === 'restricted') {
          return (context.environment.sessionAge || 0) < maxSessionAge;
        }
        return true;
      }
    });

    // Owner-based access
    this.addPolicy({
      name: 'owner_access',
      description: 'Resource owners have full access to their resources',
      condition: (context) => {
        if (context.resource.owner === context.user.id) {
          return true;
        }
        return null; // Continue to other policies
      }
    });
  }

  addPolicy(policy: ABACPolicy) {
    this.policies.push(policy);
  }

  removePolicy(name: string) {
    this.policies = this.policies.filter(p => p.name !== name);
  }

  evaluate(context: ABACContext): boolean {
    // Check all policies
    for (const policy of this.policies) {
      const result = policy.condition(context);
      if (result === false) {
        console.log(`Access denied by policy: ${policy.name}`);
        return false;
      }
    }
    return true;
  }
}

// ABAC Policy interface
interface ABACPolicy {
  name: string;
  description: string;
  condition: (context: ABACContext) => boolean | null;
}

// Access Control Service
export class AccessControlService {
  private static instance: AccessControlService;
  private abacEngine: ABACPolicyEngine;
  private roleCache: Map<string, Role> = new Map();
  private permissionCache: Map<string, Set<Permission>> = new Map();

  private constructor() {
    this.abacEngine = new ABACPolicyEngine();
  }

  public static getInstance(): AccessControlService {
    if (!AccessControlService.instance) {
      AccessControlService.instance = new AccessControlService();
    }
    return AccessControlService.instance;
  }

  // RBAC: Check if user has specific permission
  public hasPermission(userId: string, permission: Permission): boolean {
    const permissions = this.getUserPermissions(userId);
    return permissions.has(permission);
  }

  // RBAC: Check if user has any of the specified permissions
  public hasAnyPermission(userId: string, permissions: Permission[]): boolean {
    const userPermissions = this.getUserPermissions(userId);
    return permissions.some(p => userPermissions.has(p));
  }

  // RBAC: Check if user has all specified permissions
  public hasAllPermissions(userId: string, permissions: Permission[]): boolean {
    const userPermissions = this.getUserPermissions(userId);
    return permissions.every(p => userPermissions.has(p));
  }

  // RBAC: Get user's role
  public getUserRole(userId: string): Role {
    if (this.roleCache.has(userId)) {
      return this.roleCache.get(userId)!;
    }

    // In production, fetch from database
    // For now, return default role
    const role = Role.VIEWER;
    this.roleCache.set(userId, role);
    return role;
  }

  // RBAC: Get user's permissions
  public getUserPermissions(userId: string): Set<Permission> {
    if (this.permissionCache.has(userId)) {
      return this.permissionCache.get(userId)!;
    }

    const role = this.getUserRole(userId);
    const permissions = new Set(rolePermissions[role] || []);
    this.permissionCache.set(userId, permissions);
    return permissions;
  }

  // ABAC: Evaluate access based on attributes
  public evaluateAccess(context: ABACContext): boolean {
    // First check RBAC permissions
    const requiredPermission = this.getRequiredPermission(context.resource.type, context.action);
    if (requiredPermission && !this.hasPermission(context.user.id, requiredPermission)) {
      return false;
    }

    // Then evaluate ABAC policies
    return this.abacEngine.evaluate(context);
  }

  // Map resource type and action to required permission
  private getRequiredPermission(resourceType: ResourceType, action: Action): Permission | null {
    const permissionMap: Record<string, Permission> = {
      [`${ResourceType.USER}_${Action.CREATE}`]: Permission.MANAGE_USERS,
      [`${ResourceType.USER}_${Action.UPDATE}`]: Permission.MANAGE_USERS,
      [`${ResourceType.USER}_${Action.DELETE}`]: Permission.MANAGE_USERS,
      [`${ResourceType.FINANCIAL_DATA}_${Action.READ}`]: Permission.VIEW_FINANCIAL,
      [`${ResourceType.FINANCIAL_DATA}_${Action.UPDATE}`]: Permission.EDIT_FINANCIAL,
      [`${ResourceType.PRODUCTION_DATA}_${Action.READ}`]: Permission.VIEW_PRODUCTION,
      [`${ResourceType.PRODUCTION_DATA}_${Action.UPDATE}`]: Permission.EDIT_PRODUCTION,
      [`${ResourceType.INVENTORY}_${Action.UPDATE}`]: Permission.MANAGE_INVENTORY,
      [`${ResourceType.API_KEY}_${Action.CREATE}`]: Permission.MANAGE_API_KEYS,
      [`${ResourceType.AUDIT_LOG}_${Action.READ}`]: Permission.VIEW_AUDIT_LOGS,
      [`${ResourceType.AUDIT_LOG}_${Action.EXPORT}`]: Permission.EXPORT_AUDIT_LOGS,
    };

    const key = `${resourceType}_${action}`;
    return permissionMap[key] || null;
  }

  // Clear caches
  public clearCache(userId?: string) {
    if (userId) {
      this.roleCache.delete(userId);
      this.permissionCache.delete(userId);
    } else {
      this.roleCache.clear();
      this.permissionCache.clear();
    }
  }

  // Add custom ABAC policy
  public addCustomPolicy(policy: ABACPolicy) {
    this.abacEngine.addPolicy(policy);
  }

  // Remove custom ABAC policy
  public removeCustomPolicy(name: string) {
    this.abacEngine.removePolicy(name);
  }
}

export default AccessControlService.getInstance();