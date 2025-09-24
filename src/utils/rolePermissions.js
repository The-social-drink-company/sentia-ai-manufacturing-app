/**
 * Enterprise Role-Based Access Control (RBAC) System
 * Defines roles, permissions, and access control for different admin levels
 */

// Define enterprise roles with hierarchical permissions
export const ROLES = {
  // System-level roles (highest privileges)
  SUPER_ADMIN: 'super_admin',
  SYSTEM_ADMIN: 'system_admin', 
  
  // Business-level roles
  USER_ADMIN: 'user_admin',
  MANAGER: 'manager',
  
  // Standard roles
  OPERATOR: 'operator',
  VIEWER: 'viewer',
  USER: 'user'
};

// Define granular permissions
export const PERMISSIONS = {
  // System Administration (System Admins only)
  SYSTEM_CONFIG: 'system:config',
  API_KEYS_MANAGE: 'system:api_keys',
  SYSTEM_LOGS: 'system:logs',
  SYSTEM_MONITORING: 'system:monitoring',
  SYSTEM_BACKUP: 'system:backup',
  SYSTEM_SECURITY: 'system:security',
  SYSTEM_INTEGRATIONS: 'system:integrations',
  
  // User Administration (User Admins)
  USERS_VIEW: 'users:view',
  USERS_CREATE: 'users:create',
  USERS_EDIT: 'users:edit',
  USERS_DELETE: 'users:delete',
  USERS_INVITE: 'users:invite',
  USERS_APPROVE: 'users:approve',
  USERS_ROLES: 'users:roles',
  
  // Business Operations
  DATA_IMPORT: 'data:import',
  DATA_EXPORT: 'data:export',
  REPORTS_VIEW: 'reports:view',
  REPORTS_CREATE: 'reports:create',
  ANALYTICS_VIEW: 'analytics:view',
  ANALYTICS_ADVANCED: 'analytics:advanced',
  
  // Dashboard Management
  DASHBOARD_VIEW: 'dashboard:view',
  DASHBOARD_EDIT: 'dashboard:edit',
  DASHBOARD_ADMIN: 'dashboard:admin',
  
  // Manufacturing Operations
  PRODUCTION_VIEW: 'production:view',
  PRODUCTION_MANAGE: 'production:manage',
  INVENTORY_VIEW: 'inventory:view',
  INVENTORY_MANAGE: 'inventory:manage',
  QUALITY_VIEW: 'quality:view',
  QUALITY_MANAGE: 'quality:manage'
};

// Role permission mappings
export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: [
    // Has ALL permissions
    ...Object.values(PERMISSIONS)
  ],
  
  [ROLES.SYSTEM_ADMIN]: [
    // System administration only
    PERMISSIONS.SYSTEM_CONFIG,
    PERMISSIONS.API_KEYS_MANAGE,
    PERMISSIONS.SYSTEM_LOGS,
    PERMISSIONS.SYSTEM_MONITORING,
    PERMISSIONS.SYSTEM_BACKUP,
    PERMISSIONS.SYSTEM_SECURITY,
    PERMISSIONS.SYSTEM_INTEGRATIONS,
    
    // Basic dashboard access
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.ANALYTICS_VIEW
  ],
  
  [ROLES.USER_ADMIN]: [
    // User management only
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_EDIT,
    PERMISSIONS.USERS_DELETE,
    PERMISSIONS.USERS_INVITE,
    PERMISSIONS.USERS_APPROVE,
    PERMISSIONS.USERS_ROLES,
    
    // Basic dashboard access
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.ANALYTICS_VIEW
  ],
  
  [ROLES.MANAGER]: [
    // Business operations
    PERMISSIONS.DATA_IMPORT,
    PERMISSIONS.DATA_EXPORT,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_CREATE,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.ANALYTICS_ADVANCED,
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.DASHBOARD_EDIT,
    
    // Manufacturing management
    PERMISSIONS.PRODUCTION_VIEW,
    PERMISSIONS.PRODUCTION_MANAGE,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_MANAGE,
    PERMISSIONS.QUALITY_VIEW,
    PERMISSIONS.QUALITY_MANAGE,
    
    // Limited user viewing
    PERMISSIONS.USERS_VIEW
  ],
  
  [ROLES.OPERATOR]: [
    // Manufacturing operations
    PERMISSIONS.PRODUCTION_VIEW,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.QUALITY_VIEW,
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.ANALYTICS_VIEW
  ],
  
  [ROLES.VIEWER]: [
    // Read-only access
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.PRODUCTION_VIEW,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.QUALITY_VIEW
  ],
  
  [ROLES.USER]: [
    // Basic dashboard access
    PERMISSIONS.DASHBOARD_VIEW
  ]
};

// Admin panel sections with required permissions
export const ADMIN_SECTIONS = {
  // User Administration Section
  user_management: {
    id: 'user_management',
    name: 'User Administration',
    description: 'Manage users, roles, and permissions',
    requiredPermissions: [PERMISSIONS.USERS_VIEW],
    tabs: [
      {
        id: 'users',
        name: 'Users',
        icon: 'UserGroupIcon',
        requiredPermissions: [PERMISSIONS.USERS_VIEW],
        actions: {
          create: PERMISSIONS.USERS_CREATE,
          edit: PERMISSIONS.USERS_EDIT,
          delete: PERMISSIONS.USERS_DELETE,
          invite: PERMISSIONS.USERS_INVITE,
          approve: PERMISSIONS.USERS_APPROVE,
          roles: PERMISSIONS.USERS_ROLES
        }
      },
      {
        id: 'invitations',
        name: 'Invitations',
        icon: 'EnvelopeIcon',
        requiredPermissions: [PERMISSIONS.USERS_INVITE]
      },
      {
        id: 'roles',
        name: 'Roles & Permissions',
        icon: 'ShieldCheckIcon',
        requiredPermissions: [PERMISSIONS.USERS_ROLES]
      }
    ]
  },
  
  // System Administration Section
  system_administration: {
    id: 'system_administration',
    name: 'System Administration',
    description: 'System configuration, APIs, and security',
    requiredPermissions: [PERMISSIONS.SYSTEM_CONFIG],
    tabs: [
      {
        id: 'api-keys',
        name: 'API Integrations',
        icon: 'KeyIcon',
        requiredPermissions: [PERMISSIONS.API_KEYS_MANAGE]
      },
      {
        id: 'system-config',
        name: 'System Settings',
        icon: 'CogIcon',
        requiredPermissions: [PERMISSIONS.SYSTEM_CONFIG]
      },
      {
        id: 'security',
        name: 'Security',
        icon: 'LockClosedIcon',
        requiredPermissions: [PERMISSIONS.SYSTEM_SECURITY]
      },
      {
        id: 'logs',
        name: 'System Logs',
        icon: 'DocumentTextIcon',
        requiredPermissions: [PERMISSIONS.SYSTEM_LOGS]
      },
      {
        id: 'monitoring',
        name: 'Monitoring',
        icon: 'ChartBarIcon',
        requiredPermissions: [PERMISSIONS.SYSTEM_MONITORING]
      }
    ]
  }
};

/**
 * Check if user has a specific permission
 */
export function hasPermission(userRole, permission) {
  if (!userRole || !permission) return false;
  
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permission);
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(userRole, permissions) {
  if (!userRole || !permissions) return false;
  
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.some(permission => rolePermissions.includes(permission));
}

/**
 * Check if user has all specified permissions
 */
export function hasAllPermissions(userRole, permissions) {
  if (!userRole || !permissions) return false;
  
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.every(permission => rolePermissions.includes(permission));
}

/**
 * Get available admin sections for a user role
 */
export function getAvailableAdminSections(userRole) {
  return Object.values(ADMIN_SECTIONS).filter(section => 
    hasAnyPermission(userRole, section.requiredPermissions)
  );
}

/**
 * Get available tabs for a user role within a section
 */
export function getAvailableTabs(userRole, sectionId) {
  const section = ADMIN_SECTIONS[sectionId];
  if (!section) return [];
  
  return section.tabs.filter(tab => 
    hasAnyPermission(userRole, tab.requiredPermissions)
  );
}

/**
 * Check if user can access admin panel
 */
export function canAccessAdmin(userRole) {
  const adminRoles = [
    ROLES.SUPER_ADMIN,
    ROLES.SYSTEM_ADMIN,
    ROLES.USER_ADMIN
  ];
  
  return adminRoles.includes(userRole);
}

/**
 * Get user's admin access level
 */
export function getAdminAccessLevel(userRole) {
  switch (userRole) {
    case ROLES.SUPER_ADMIN:
      return 'full';
    case ROLES.SYSTEM_ADMIN:
      return 'system';
    case ROLES.USER_ADMIN:
      return 'users';
    default:
      return 'none';
  }
}