/**
 * Authentication and Authorization Policies
 * 
 * Authentication policies that respect the development bypass mode as described in CLAUDE.md
 * while maintaining API authentication requirements and proper security for other environments.
 */

import { config } from 'dotenv';

config();

/**
 * Authentication Policies with Development Bypass
 */
export const authPolicies = {
  // Development bypass settings (as per CLAUDE.md)
  developmentBypass: {
    enabled: process.env.VITE_DEVELOPMENT_MODE === 'true',
    mockUser: {
      id: 'dev-user-1',
      email: 'developer@sentia.com',
      role: 'admin',
      permissions: ['*'],
      authenticated: true,
      mfaVerified: true,
      sessionActive: true
    },
    // Still require authentication for API integrations
    exemptAPIs: [
      '/api/integrations/xero',
      '/api/integrations/shopify', 
      '/api/integrations/amazon',
      '/api/integrations/anthropic',
      '/api/integrations/openai',
      '/api/integrations/unleashed'
    ]
  },

  // Password policies (only applied when not in development bypass mode)
  password: {
    development: {
      // Minimal requirements for development when bypass is disabled
      minLength: 4,
      requireUppercase: false,
      requireLowercase: false,
      requireNumbers: false,
      requireSymbols: false,
      maxAge: 0, // No expiry
      historyCount: 0,
      complexity: 'low'
    },
    
    testing: {
      minLength: 6,
      requireUppercase: false,
      requireLowercase: true,
      requireNumbers: true,
      requireSymbols: false,
      maxAge: 0, // No expiry for testing
      historyCount: 3,
      complexity: 'medium'
    },
    
    staging: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSymbols: false,
      maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
      historyCount: 5,
      complexity: 'high'
    },
    
    production: {
      minLength: 12,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSymbols: true,
      maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
      historyCount: 12,
      complexity: 'maximum',
      prohibitCommonPasswords: true,
      prohibitPersonalInfo: true
    }
  },

  // Account lockout policies (disabled in development bypass mode)
  lockout: {
    development: {
      enabled: false, // Always disabled in development
      maxAttempts: 100,
      duration: 60000, // 1 minute
      progressive: false
    },
    
    testing: {
      enabled: true,
      maxAttempts: 10,
      duration: 300000, // 5 minutes
      progressive: false,
      trackByIP: true,
      trackByUser: true
    },
    
    staging: {
      enabled: true,
      maxAttempts: 5,
      duration: 600000, // 10 minutes
      progressive: true,
      trackByIP: true,
      trackByUser: true,
      escalationFactor: 2
    },
    
    production: {
      enabled: true,
      maxAttempts: 3,
      duration: 900000, // 15 minutes
      progressive: true,
      trackByIP: true,
      trackByUser: true,
      escalationFactor: 2,
      maxDuration: 86400000, // 24 hours
      alertOnLockout: true
    }
  },

  // Session policies (relaxed in development bypass mode)
  session: {
    development: {
      timeout: 86400000, // 24 hours
      maxConcurrent: 100,
      rotation: false,
      secure: false,
      httpOnly: true,
      sameSite: 'lax',
      bypassEnabled: process.env.VITE_DEVELOPMENT_MODE === 'true'
    },
    
    testing: {
      timeout: 7200000, // 2 hours
      maxConcurrent: 10,
      rotation: false,
      secure: false,
      httpOnly: true,
      sameSite: 'strict'
    },
    
    staging: {
      timeout: 3600000, // 1 hour
      maxConcurrent: 5,
      rotation: true,
      rotationInterval: 1800000, // 30 minutes
      secure: true,
      httpOnly: true,
      sameSite: 'strict'
    },
    
    production: {
      timeout: 3600000, // 1 hour
      maxConcurrent: 3,
      rotation: true,
      rotationInterval: 1800000, // 30 minutes
      secure: true,
      httpOnly: true,
      sameSite: 'strict',
      domain: process.env.SESSION_DOMAIN,
      pinToIP: true
    }
  },

  // MFA policies (disabled in development bypass mode)
  mfa: {
    development: {
      enabled: false, // Always disabled in development
      required: false,
      methods: ['totp'],
      gracePeriod: 0
    },
    
    testing: {
      enabled: true,
      required: false,
      methods: ['totp', 'email'],
      gracePeriod: 86400000, // 24 hours
      backupCodes: true
    },
    
    staging: {
      enabled: true,
      required: process.env.REQUIRE_MFA === 'true',
      methods: ['totp', 'sms', 'email'],
      gracePeriod: 86400000, // 24 hours
      backupCodes: true,
      rememberDevice: true,
      deviceTrustDuration: 2592000000 // 30 days
    },
    
    production: {
      enabled: true,
      required: process.env.REQUIRE_MFA === 'true',
      methods: ['totp', 'sms', 'email', 'hardware'],
      gracePeriod: 86400000, // 24 hours
      backupCodes: true,
      rememberDevice: true,
      deviceTrustDuration: 2592000000, // 30 days
      enforceForAdmins: true,
      enforceForPrivilegedOps: true
    }
  }
};

/**
 * Authorization Policies (with development bypass consideration)
 */
export const authzPolicies = {
  // Role definitions
  roles: {
    admin: {
      name: 'Administrator',
      description: 'Full system access and administration',
      permissions: ['*'], // All permissions
      level: 100,
      requiresMFA: true,
      maxSessionDuration: 3600000, // 1 hour
      allowedIPs: process.env.ADMIN_ALLOWED_IPS?.split(',') || [],
      businessHoursOnly: false
    },
    
    manager: {
      name: 'Manager',
      description: 'Management and supervisory access',
      permissions: [
        'read',
        'write',
        'tools:execute',
        'reports:generate',
        'users:manage',
        'dashboards:configure',
        'integrations:configure',
        'analytics:access'
      ],
      level: 75,
      requiresMFA: process.env.MANAGER_REQUIRE_MFA === 'true',
      maxSessionDuration: 7200000, // 2 hours
      allowedIPs: process.env.MANAGER_ALLOWED_IPS?.split(',') || [],
      businessHoursOnly: process.env.MANAGER_BUSINESS_HOURS_ONLY === 'true'
    },
    
    operator: {
      name: 'Operator',
      description: 'Operational access for production tasks',
      permissions: [
        'read',
        'tools:execute',
        'production:manage',
        'inventory:update',
        'orders:process',
        'quality:record'
      ],
      level: 50,
      requiresMFA: false,
      maxSessionDuration: 28800000, // 8 hours
      allowedIPs: process.env.OPERATOR_ALLOWED_IPS?.split(',') || [],
      businessHoursOnly: true
    },
    
    viewer: {
      name: 'Viewer',
      description: 'Read-only access to dashboards and reports',
      permissions: [
        'read',
        'dashboards:view',
        'reports:view'
      ],
      level: 25,
      requiresMFA: false,
      maxSessionDuration: 28800000, // 8 hours
      allowedIPs: [],
      businessHoursOnly: false
    },
    
    api: {
      name: 'API Client',
      description: 'Programmatic access for integrations',
      permissions: [
        'api:read',
        'api:write',
        'integrations:access'
      ],
      level: 30,
      requiresMFA: false,
      maxSessionDuration: 86400000, // 24 hours
      allowedIPs: process.env.API_ALLOWED_IPS?.split(',') || [],
      businessHoursOnly: false,
      isSystemRole: true
    }
  },

  // Permission definitions
  permissions: {
    // Data permissions
    'read': {
      name: 'Read Data',
      description: 'View data and content',
      category: 'data',
      level: 'basic'
    },
    'write': {
      name: 'Write Data',
      description: 'Create and modify data',
      category: 'data',
      level: 'intermediate'
    },
    'delete': {
      name: 'Delete Data',
      description: 'Remove data permanently',
      category: 'data',
      level: 'advanced'
    },
    'export': {
      name: 'Export Data',
      description: 'Export data to external formats',
      category: 'data',
      level: 'intermediate'
    },

    // Tool permissions
    'tools:execute': {
      name: 'Execute Tools',
      description: 'Run MCP tools and operations',
      category: 'tools',
      level: 'intermediate'
    },
    'tools:configure': {
      name: 'Configure Tools',
      description: 'Modify tool settings and parameters',
      category: 'tools',
      level: 'advanced'
    },
    'tools:install': {
      name: 'Install Tools',
      description: 'Add new tools to the system',
      category: 'tools',
      level: 'expert'
    },

    // Integration permissions (always require proper auth even in dev)
    'integrations:access': {
      name: 'Access Integrations',
      description: 'Use external integrations',
      category: 'integrations',
      level: 'intermediate',
      requiresApiAuth: true // Always requires proper API authentication
    },
    'integrations:configure': {
      name: 'Configure Integrations',
      description: 'Set up and modify external integrations',
      category: 'integrations',
      level: 'advanced',
      requiresApiAuth: true // Always requires proper API authentication
    }
  }
};

/**
 * Check if development bypass is active
 */
export function isDevelopmentBypassActive() {
  return process.env.VITE_DEVELOPMENT_MODE === 'true';
}

/**
 * Get current user (with development bypass consideration)
 */
export function getCurrentUser(req) {
  if (isDevelopmentBypassActive()) {
    return authPolicies.developmentBypass.mockUser;
  }
  
  return req.user || null;
}

/**
 * Check if authentication is required for endpoint
 */
export function isAuthRequired(endpoint) {
  // In development bypass mode, check if this is an API that still requires auth
  if (isDevelopmentBypassActive()) {
    return authPolicies.developmentBypass.exemptAPIs.some(api => 
      endpoint.startsWith(api)
    );
  }
  
  // In all other environments, authentication is required
  return true;
}

/**
 * Get authentication policy for environment
 */
export function getAuthPolicy(environment = process.env.NODE_ENV) {
  const env = environment || 'development';
  
  return {
    developmentBypass: authPolicies.developmentBypass,
    password: authPolicies.password[env] || authPolicies.password.development,
    lockout: authPolicies.lockout[env] || authPolicies.lockout.development,
    session: authPolicies.session[env] || authPolicies.session.development,
    mfa: authPolicies.mfa[env] || authPolicies.mfa.development
  };
}

/**
 * Get authorization policy
 */
export function getAuthzPolicy() {
  return {
    roles: authzPolicies.roles,
    permissions: authzPolicies.permissions
  };
}

/**
 * Check if user has permission for resource (with development bypass)
 */
export function hasPermission(user, resource, action, context = {}) {
  // In development bypass mode, mock user has all permissions
  if (isDevelopmentBypassActive()) {
    user = authPolicies.developmentBypass.mockUser;
  }

  // Get user role
  const userRole = authzPolicies.roles[user?.role];
  if (!userRole) {
    return false;
  }

  // Check if user has wildcard permission
  if (userRole.permissions.includes('*')) {
    return true;
  }

  // Check specific permission
  const permission = `${resource}:${action}`;
  if (userRole.permissions.includes(permission)) {
    return true;
  }

  return false;
}

/**
 * Validate role assignment
 */
export function validateRoleAssignment(assignerRole, targetRole) {
  const assignerConfig = authzPolicies.roles[assignerRole];
  const targetConfig = authzPolicies.roles[targetRole];

  if (!assignerConfig || !targetConfig) {
    return false;
  }

  // Users can only assign roles with lower or equal levels
  return assignerConfig.level >= targetConfig.level;
}

export default {
  authPolicies,
  authzPolicies,
  isDevelopmentBypassActive,
  getCurrentUser,
  isAuthRequired,
  getAuthPolicy,
  getAuthzPolicy,
  hasPermission,
  validateRoleAssignment
};