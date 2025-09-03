import { useUser } from '@clerk/clerk-react'
import { useMemo } from 'react'

// Role hierarchy for permission checking
const ROLE_HIERARCHY = {
  admin: 4,
  manager: 3, 
  operator: 2,
  viewer: 1
}

// Permission definitions by role
const ROLE_PERMISSIONS = {
  admin: [
    'dashboard.view',
    'dashboard.edit',
    'dashboard.export',
    'forecast.view', 
    'forecast.run',
    'forecast.configure',
    'stock.view',
    'stock.optimize', 
    'stock.approve',
    'workingcapital.view',
    'workingcapital.analyze',
    'workingcapital.configure',
    'capacity.view',
    'capacity.configure',
    'import.view',
    'import.upload',
    'import.configure',
    'users.manage',
    'system.configure',
    'reports.generate',
    'alerts.configure'
  ],
  manager: [
    'dashboard.view',
    'dashboard.edit',
    'dashboard.export', 
    'forecast.view',
    'forecast.run',
    'stock.view',
    'stock.optimize',
    'stock.approve',
    'workingcapital.view',
    'workingcapital.analyze',
    'capacity.view',
    'import.view',
    'import.upload',
    'reports.generate'
  ],
  operator: [
    'dashboard.view',
    'dashboard.edit',
    'dashboard.export',
    'forecast.view',
    'forecast.run',
    'stock.view',
    'stock.optimize',
    'capacity.view',
    'import.view',
    'import.upload'
  ],
  viewer: [
    'dashboard.view',
    'dashboard.export',
    'forecast.view',
    'stock.view',
    'capacity.view'
  ]
}

// Feature flags by role (can be overridden by system configuration)
const ROLE_FEATURES = {
  admin: {
    advancedAnalytics: true,
    systemDiagnostics: true,
    userManagement: true,
    apiAccess: true,
    experimentalFeatures: true,
    debugMode: true
  },
  manager: {
    advancedAnalytics: true,
    systemDiagnostics: false,
    userManagement: false,
    apiAccess: true,
    experimentalFeatures: false,
    debugMode: false
  },
  operator: {
    advancedAnalytics: false,
    systemDiagnostics: false,
    userManagement: false,
    apiAccess: false,
    experimentalFeatures: false,
    debugMode: false
  },
  viewer: {
    advancedAnalytics: false,
    systemDiagnostics: false,
    userManagement: false,
    apiAccess: false,
    experimentalFeatures: false,
    debugMode: false
  }
}

export const useAuthRole = () => {
  const { user, isLoaded, isSignedIn } = useUser()
  
  const authData = useMemo(() => {
    if (!isLoaded || !isSignedIn || !user) {
      return {
        isLoading: !isLoaded,
        isAuthenticated: false,
        user: null,
        role: null,
        permissions: [],
        features: {},
        hasRole: () => false,
        hasPermission: () => false,
        hasFeature: () => false,
        isRoleAtLeast: () => false,
        getUserDisplayName: () => 'Unknown User'
      }
    }

    // Get role from user metadata, default to viewer
    const role = user.publicMetadata?.role || 'viewer'
    
    // Normalize role to lowercase
    const normalizedRole = role.toLowerCase()
    
    // Get permissions and features for the role
    const permissions = ROLE_PERMISSIONS[normalizedRole] || ROLE_PERMISSIONS.viewer
    const features = ROLE_FEATURES[normalizedRole] || ROLE_FEATURES.viewer
    
    return {
      isLoading: false,
      isAuthenticated: true,
      user,
      role: normalizedRole,
      permissions,
      features,
      
      // Check if user has specific role
      hasRole: (requiredRole) => {
        if (Array.isArray(requiredRole)) {
          return requiredRole.includes(normalizedRole)
        }
        return normalizedRole === requiredRole.toLowerCase()
      },
      
      // Check if user has specific permission
      hasPermission: (permission) => {
        if (Array.isArray(permission)) {
          return permission.some(p => permissions.includes(p))
        }
        return permissions.includes(permission)
      },
      
      // Check if user has feature flag enabled
      hasFeature: (feature) => {
        return features[feature] === true
      },
      
      // Check if user role is at least the specified level
      isRoleAtLeast: (requiredRole) => {
        const userLevel = ROLE_HIERARCHY[normalizedRole] || 0
        const requiredLevel = ROLE_HIERARCHY[requiredRole.toLowerCase()] || 0
        return userLevel >= requiredLevel
      },
      
      // Get display name for user
      getUserDisplayName: () => {
        return user.fullName || 
               user.firstName || 
               user.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 
               'Unknown User'
      },
      
      // Get user initials for avatar
      getUserInitials: () => {
        const fullName = user.fullName || user.firstName || 'U'
        return fullName
          .split(' ')
          .map(name => name.charAt(0).toUpperCase())
          .slice(0, 2)
          .join('')
      },
      
      // Check if user can access specific route/component
      canAccess: (resource, action = 'view') => {
        const permission = `${resource}.${action}`
        return permissions.includes(permission)
      }
    }
  }, [user, isLoaded, isSignedIn])

  return authData
}

// Higher-order component for role-based access control
export const withRoleAccess = (WrappedComponent, requiredRole, fallbackComponent = null) => {
  return function RoleProtectedComponent(props) {
    const { hasRole, isLoading } = useAuthRole()
    
    if (isLoading) {
      return <div className="animate-pulse">Loading...</div>
    }
    
    if (!hasRole(requiredRole)) {
      return fallbackComponent || (
        <div className="text-center p-8">
          <p className="text-gray-500">You don't have permission to access this feature.</p>
        </div>
      )
    }
    
    return <WrappedComponent {...props} />
  }
}

// Hook for permission-based rendering
export const usePermissionGuard = () => {
  const { hasPermission, hasRole, hasFeature, isRoleAtLeast } = useAuthRole()
  
  return {
    // Render component only if user has permission
    renderIfPermission: (permission, component) => {
      return hasPermission(permission) ? component : null
    },
    
    // Render component only if user has role
    renderIfRole: (role, component) => {
      return hasRole(role) ? component : null
    },
    
    // Render component only if user has feature
    renderIfFeature: (feature, component) => {
      return hasFeature(feature) ? component : null
    },
    
    // Render component only if user role is at least specified level
    renderIfRoleAtLeast: (role, component) => {
      return isRoleAtLeast(role) ? component : null
    },
    
    // Conditional rendering with multiple conditions
    renderIf: (conditions, component) => {
      const {
        permission,
        role, 
        feature,
        roleAtLeast,
        custom
      } = conditions
      
      let hasAccess = true
      
      if (permission && !hasPermission(permission)) hasAccess = false
      if (role && !hasRole(role)) hasAccess = false
      if (feature && !hasFeature(feature)) hasAccess = false
      if (roleAtLeast && !isRoleAtLeast(roleAtLeast)) hasAccess = false
      if (custom && !custom()) hasAccess = false
      
      return hasAccess ? component : null
    }
  }
}

// Constants for easy import
export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager', 
  OPERATOR: 'operator',
  VIEWER: 'viewer'
}

export const PERMISSIONS = {
  // Dashboard permissions
  DASHBOARD_VIEW: 'dashboard.view',
  DASHBOARD_EDIT: 'dashboard.edit',
  DASHBOARD_EXPORT: 'dashboard.export',
  
  // Forecast permissions
  FORECAST_VIEW: 'forecast.view',
  FORECAST_RUN: 'forecast.run',
  FORECAST_CONFIGURE: 'forecast.configure',
  
  // Stock permissions
  STOCK_VIEW: 'stock.view',
  STOCK_OPTIMIZE: 'stock.optimize',
  STOCK_APPROVE: 'stock.approve',
  
  // Working capital permissions
  WC_VIEW: 'workingcapital.view',
  WC_ANALYZE: 'workingcapital.analyze',
  WC_CONFIGURE: 'workingcapital.configure',
  
  // System permissions
  SYSTEM_CONFIGURE: 'system.configure',
  USERS_MANAGE: 'users.manage',
  REPORTS_GENERATE: 'reports.generate'
}

export const FEATURES = {
  ADVANCED_ANALYTICS: 'advancedAnalytics',
  SYSTEM_DIAGNOSTICS: 'systemDiagnostics',
  USER_MANAGEMENT: 'userManagement',
  API_ACCESS: 'apiAccess',
  EXPERIMENTAL_FEATURES: 'experimentalFeatures',
  DEBUG_MODE: 'debugMode'
}