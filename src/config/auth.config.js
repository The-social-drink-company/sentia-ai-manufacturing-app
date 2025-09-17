/**
 * Authentication Configuration
 * Centralized auth settings, roles, and permissions
 */

// Role Definitions with Permissions
export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  OPERATOR: 'operator',
  VIEWER: 'viewer'
};

// Permission Definitions
export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: 'dashboard.view',
  DASHBOARD_EDIT: 'dashboard.edit',
  DASHBOARD_DELETE: 'dashboard.delete',

  // Financial
  FINANCIAL_VIEW: 'financial.view',
  FINANCIAL_EDIT: 'financial.edit',
  FINANCIAL_APPROVE: 'financial.approve',

  // Inventory
  INVENTORY_VIEW: 'inventory.view',
  INVENTORY_EDIT: 'inventory.edit',
  INVENTORY_DELETE: 'inventory.delete',

  // Production
  PRODUCTION_VIEW: 'production.view',
  PRODUCTION_EDIT: 'production.edit',
  PRODUCTION_SCHEDULE: 'production.schedule',

  // Quality
  QUALITY_VIEW: 'quality.view',
  QUALITY_EDIT: 'quality.edit',
  QUALITY_APPROVE: 'quality.approve',

  // Analytics
  ANALYTICS_VIEW: 'analytics.view',
  ANALYTICS_EXPORT: 'analytics.export',

  // Admin
  ADMIN_VIEW: 'admin.view',
  ADMIN_USERS: 'admin.users',
  ADMIN_SETTINGS: 'admin.settings',
  ADMIN_AUDIT: 'admin.audit'
};

// Role-Permission Mapping
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS), // Admin has all permissions

  [ROLES.MANAGER]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.DASHBOARD_EDIT,
    PERMISSIONS.FINANCIAL_VIEW,
    PERMISSIONS.FINANCIAL_EDIT,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_EDIT,
    PERMISSIONS.PRODUCTION_VIEW,
    PERMISSIONS.PRODUCTION_EDIT,
    PERMISSIONS.PRODUCTION_SCHEDULE,
    PERMISSIONS.QUALITY_VIEW,
    PERMISSIONS.QUALITY_EDIT,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.ANALYTICS_EXPORT
  ],

  [ROLES.OPERATOR]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_EDIT,
    PERMISSIONS.PRODUCTION_VIEW,
    PERMISSIONS.PRODUCTION_EDIT,
    PERMISSIONS.QUALITY_VIEW,
    PERMISSIONS.QUALITY_EDIT,
    PERMISSIONS.ANALYTICS_VIEW
  ],

  [ROLES.VIEWER]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.FINANCIAL_VIEW,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.PRODUCTION_VIEW,
    PERMISSIONS.QUALITY_VIEW,
    PERMISSIONS.ANALYTICS_VIEW
  ]
};

// Role Hierarchy (for permission inheritance)
export const ROLE_HIERARCHY = {
  [ROLES.ADMIN]: [ROLES.ADMIN, ROLES.MANAGER, ROLES.OPERATOR, ROLES.VIEWER],
  [ROLES.MANAGER]: [ROLES.MANAGER, ROLES.OPERATOR, ROLES.VIEWER],
  [ROLES.OPERATOR]: [ROLES.OPERATOR, ROLES.VIEWER],
  [ROLES.VIEWER]: [ROLES.VIEWER]
};

// Session Configuration
export const SESSION_CONFIG = {
  // Session timeout in milliseconds
  SESSION_TIMEOUT: 60 * 60 * 1000, // 1 hour

  // Warning time before session expires
  WARNING_TIME: 5 * 60 * 1000, // 5 minutes

  // Auto-refresh threshold
  AUTO_REFRESH_THRESHOLD: 10 * 60 * 1000, // 10 minutes before expiry

  // Activity tracking interval
  ACTIVITY_CHECK_INTERVAL: 30 * 1000, // 30 seconds

  // Idle timeout
  IDLE_TIMEOUT: 15 * 60 * 1000 // 15 minutes
};

// Clerk Configuration
export const CLERK_CONFIG = {
  // Sign-in/up URLs
  signInUrl: '/login',
  signUpUrl: '/signup',
  afterSignInUrl: '/dashboard',
  afterSignUpUrl: '/onboarding',

  // Appearance customization
  appearance: {
    baseTheme: 'light',
    variables: {
      colorPrimary: '#3B82F6',
      colorBackground: '#FFFFFF',
      colorText: '#111827',
      colorTextSecondary: '#6B7280',
      colorDanger: '#EF4444',
      colorSuccess: '#10B981',
      colorWarning: '#F59E0B',
      borderRadius: '0.5rem',
      fontFamily: 'Inter, system-ui, sans-serif'
    },
    elements: {
      card: 'shadow-xl',
      formButtonPrimary: 'bg-blue-600 hover:bg-blue-700',
      footerActionLink: 'text-blue-600 hover:text-blue-700',
      identityPreviewEditButton: 'text-blue-600 hover:text-blue-700'
    }
  },

  // Localization
  localization: {
    signIn: {
      start: {
        title: 'Welcome back to Sentia',
        subtitle: 'Sign in to access your manufacturing dashboard'
      }
    },
    signUp: {
      start: {
        title: 'Create your Sentia account',
        subtitle: 'Start optimizing your manufacturing operations'
      }
    }
  }
};

// Onboarding Steps Configuration
export const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to Sentia Manufacturing',
    description: 'Your intelligent manufacturing dashboard',
    required: true
  },
  {
    id: 'profile',
    title: 'Complete Your Profile',
    description: 'Tell us about your role and department',
    required: true
  },
  {
    id: 'preferences',
    title: 'Set Your Preferences',
    description: 'Customize your dashboard experience',
    required: false
  },
  {
    id: 'tour',
    title: 'Quick Tour',
    description: 'Learn about key features',
    required: false
  }
];

// Helper Functions
export const hasPermission = (userRole, permission) => {
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(permission);
};

export const hasAnyPermission = (userRole, permissions) => {
  const userPermissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.some(permission => userPermissions.includes(permission));
};

export const hasAllPermissions = (userRole, permissions) => {
  const userPermissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.every(permission => userPermissions.includes(permission));
};

export const canAccessRole = (userRole, requiredRole) => {
  const hierarchy = ROLE_HIERARCHY[userRole] || [];
  return hierarchy.includes(requiredRole);
};

export const getRoleDisplayName = (role) => {
  const displayNames = {
    [ROLES.ADMIN]: 'Administrator',
    [ROLES.MANAGER]: 'Manager',
    [ROLES.OPERATOR]: 'Operator',
    [ROLES.VIEWER]: 'Viewer'
  };
  return displayNames[role] || role;
};

export const getRoleBadgeColor = (role) => {
  const colors = {
    [ROLES.ADMIN]: 'bg-purple-100 text-purple-800',
    [ROLES.MANAGER]: 'bg-blue-100 text-blue-800',
    [ROLES.OPERATOR]: 'bg-green-100 text-green-800',
    [ROLES.VIEWER]: 'bg-gray-100 text-gray-800'
  };
  return colors[role] || 'bg-gray-100 text-gray-800';
};

// Authentication State Manager
export class AuthStateManager {
  constructor() {
    this.listeners = new Set();
    this.state = {
      isAuthenticated: false,
      user: null,
      role: null,
      permissions: [],
      sessionExpiry: null
    };
  }

  updateState(newState) {
    this.state = { ...this.state, ...newState };
    this.notifyListeners();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners() {
    this.listeners.forEach(listener => listener(this.state));
  }

  getState() {
    return this.state;
  }
}

// Export singleton instance
export const authStateManager = new AuthStateManager();

export default {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  ROLE_HIERARCHY,
  SESSION_CONFIG,
  CLERK_CONFIG,
  ONBOARDING_STEPS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canAccessRole,
  getRoleDisplayName,
  getRoleBadgeColor,
  authStateManager
};