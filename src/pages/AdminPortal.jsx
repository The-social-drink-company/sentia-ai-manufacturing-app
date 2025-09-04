import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { 
  Cog6ToothIcon, 
  UserGroupIcon, 
  ChartBarIcon,
  ServerIcon,
  WrenchScrewdriverIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  GlobeAltIcon,
  FlagIcon,
  KeyIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline'

// Import admin page components
import AdminOverview from '../components/admin/pages/AdminOverview'
import AdminUsers from '../components/admin/pages/AdminUsers'
import AdminSettings from '../components/admin/pages/AdminSettings'
import AdminIntegrations from '../components/admin/pages/AdminIntegrations'
import AdminAPI from '../components/admin/pages/AdminAPI'
import AdminLogs from '../components/admin/pages/AdminLogs'
import AdminErrors from '../components/admin/pages/AdminErrors'
import AdminMaintenance from '../components/admin/pages/AdminMaintenance'
import AdminFeatureFlags from '../components/admin/pages/AdminFeatureFlags'
import AdminWebhooks from '../components/admin/pages/AdminWebhooks'

// Feature-flagged components
import AdminEntities from '../components/admin/pages/AdminEntities'
import AdminFX from '../components/admin/pages/AdminFX'

function AdminPortal() {
  const navigate = useNavigate()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState('overview')
  const [userRole, setUserRole] = useState('ADMIN') // TODO: Get from auth context
  const [featureFlags, setFeatureFlags] = useState({
    FEATURE_INTL_ENTITIES: false,
    FEATURE_INTL_FX: false,
    FEATURE_BOARD_MODE: false,
  })

  // Environment detection
  const isProduction = import.meta.env.PROD || import.meta.env.NODE_ENV === 'production'
  const hasClerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
  
  // Check for admin permissions
  const hasAdminAccess = userRole === 'ADMIN'
  const hasManagerAccess = ['ADMIN', 'MANAGER'].includes(userRole)

  useEffect(() => {
    // Set active tab based on current route
    const path = location.pathname.split('/').pop()
    if (path && path !== 'admin') {
      setActiveTab(path)
    }
  }, [location])

  const handleTabChange = (tabName) => {
    setActiveTab(tabName)
    navigate(`/admin/${tabName}`)
  }

  // Navigation items with RBAC
  const navigationItems = [
    {
      id: 'overview',
      name: 'Overview',
      icon: ChartBarIcon,
      path: '/admin/overview',
      permissions: ['ADMIN', 'MANAGER'],
      description: 'System health dashboard'
    },
    {
      id: 'users',
      name: 'Users & Roles',
      icon: UserGroupIcon,
      path: '/admin/users',
      permissions: ['ADMIN'],
      description: 'User management and RBAC'
    },
    {
      id: 'settings',
      name: 'Settings',
      icon: Cog6ToothIcon,
      path: '/admin/settings',
      permissions: ['ADMIN', 'MANAGER'],
      description: 'Application configuration'
    },
    {
      id: 'feature-flags',
      name: 'Feature Flags',
      icon: FlagIcon,
      path: '/admin/feature-flags',
      permissions: ['ADMIN'],
      description: 'Feature toggle management'
    },
    {
      id: 'integrations',
      name: 'Integrations',
      icon: ServerIcon,
      path: '/admin/integrations',
      permissions: ['ADMIN', 'MANAGER'],
      description: 'External API management'
    },
    {
      id: 'api',
      name: 'API & Keys',
      icon: KeyIcon,
      path: '/admin/api',
      permissions: ['ADMIN'],
      description: 'API key management'
    },
    {
      id: 'webhooks',
      name: 'Webhooks',
      icon: ServerIcon,
      path: '/admin/webhooks',
      permissions: ['ADMIN', 'MANAGER'],
      description: 'Webhook monitoring'
    },
    {
      id: 'logs',
      name: 'Logs',
      icon: DocumentTextIcon,
      path: '/admin/logs',
      permissions: ['ADMIN', 'MANAGER'],
      description: 'System logging'
    },
    {
      id: 'errors',
      name: 'Errors',
      icon: ExclamationTriangleIcon,
      path: '/admin/errors',
      permissions: ['ADMIN', 'MANAGER'],
      description: 'Error exploration'
    },
    {
      id: 'maintenance',
      name: 'Maintenance',
      icon: WrenchScrewdriverIcon,
      path: '/admin/maintenance',
      permissions: ['ADMIN'],
      description: 'System maintenance tools'
    },
  ]

  // Feature-flagged navigation items
  const globalFeatureItems = [
    {
      id: 'entities',
      name: 'Entities & Regions',
      icon: BuildingOfficeIcon,
      path: '/admin/entities',
      permissions: ['ADMIN'],
      description: 'Multi-entity management',
      featureFlag: 'FEATURE_INTL_ENTITIES'
    },
    {
      id: 'fx',
      name: 'FX & Currencies',
      icon: GlobeAltIcon,
      path: '/admin/fx',
      permissions: ['ADMIN'],
      description: 'Currency management',
      featureFlag: 'FEATURE_INTL_FX'
    },
  ]

  // Filter navigation items based on permissions and feature flags
  const availableItems = [
    ...navigationItems.filter(item => item.permissions.includes(userRole)),
    ...globalFeatureItems.filter(item => 
      item.permissions.includes(userRole) && 
      featureFlags[item.featureFlag]
    )
  ]

  // Access control check
  if (!hasManagerAccess) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        flexDirection: 'column',
        backgroundColor: '#f9fafb'
      }}>
        <ExclamationTriangleIcon style={{ width: '64px', height: '64px', color: '#ef4444', marginBottom: '16px' }} />
        <h1 style={{ color: '#1f2937', marginBottom: '8px' }}>Access Denied</h1>
        <p style={{ color: '#6b7280', textAlign: 'center', maxWidth: '400px' }}>
          You don't have permission to access the Admin Portal. 
          Contact your system administrator for access.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Sidebar */}
      <div style={{
        width: '280px',
        backgroundColor: 'white',
        borderRight: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{ 
          padding: '24px', 
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#1f2937'
        }}>
          <h1 style={{ 
            color: 'white', 
            fontSize: '20px', 
            fontWeight: '600',
            margin: 0,
            marginBottom: '8px'
          }}>
            Admin Portal
          </h1>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ 
              fontSize: '12px', 
              color: '#9ca3af',
              textTransform: 'uppercase',
              fontWeight: '500'
            }}>
              {userRole}
            </span>
            {isProduction && (
              <span style={{
                fontSize: '10px',
                backgroundColor: '#ef4444',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '12px',
                fontWeight: '500'
              }}>
                PROD
              </span>
            )}
            {!hasClerkKey && (
              <span style={{
                fontSize: '10px',
                backgroundColor: '#f59e0b',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '12px',
                fontWeight: '500'
              }}>
                DEMO
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '16px 0' }}>
          {availableItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  padding: '12px 24px',
                  border: 'none',
                  backgroundColor: isActive ? '#eff6ff' : 'transparent',
                  color: isActive ? '#2563eb' : '#374151',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderLeft: isActive ? '3px solid #2563eb' : '3px solid transparent',
                  transition: 'all 0.2s ease-in-out'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.target.style.backgroundColor = '#f3f4f6'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.target.style.backgroundColor = 'transparent'
                  }
                }}
              >
                <Icon style={{ 
                  width: '20px', 
                  height: '20px', 
                  marginRight: '12px',
                  color: isActive ? '#2563eb' : '#6b7280'
                }} />
                <div>
                  <div style={{ 
                    fontWeight: isActive ? '600' : '400',
                    fontSize: '14px'
                  }}>
                    {item.name}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    marginTop: '2px'
                  }}>
                    {item.description}
                  </div>
                </div>
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div style={{ 
          padding: '16px 24px', 
          borderTop: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb'
        }}>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            Environment: {isProduction ? 'Production' : 'Development'}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
            Auth: {hasClerkKey ? 'Enabled' : 'Demo Mode'}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route index element={<Navigate to="/admin/overview" replace />} />
          <Route path="overview" element={<AdminOverview />} />
          {hasAdminAccess && (
            <>
              <Route path="users" element={<AdminUsers />} />
              <Route path="feature-flags" element={<AdminFeatureFlags />} />
              <Route path="api" element={<AdminAPI />} />
              <Route path="maintenance" element={<AdminMaintenance />} />
              {featureFlags.FEATURE_INTL_ENTITIES && (
                <Route path="entities" element={<AdminEntities />} />
              )}
              {featureFlags.FEATURE_INTL_FX && (
                <Route path="fx" element={<AdminFX />} />
              )}
            </>
          )}
          {hasManagerAccess && (
            <>
              <Route path="settings" element={<AdminSettings />} />
              <Route path="integrations" element={<AdminIntegrations />} />
              <Route path="webhooks" element={<AdminWebhooks />} />
              <Route path="logs" element={<AdminLogs />} />
              <Route path="errors" element={<AdminErrors />} />
            </>
          )}
          <Route path="*" element={<Navigate to="/admin/overview" replace />} />
        </Routes>
      </div>
    </div>
  )
}

export default AdminPortal