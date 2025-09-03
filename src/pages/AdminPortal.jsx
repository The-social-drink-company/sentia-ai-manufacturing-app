import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'

// Mock authentication hook - replace with real auth later
const useAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // Simulate authentication check
    setTimeout(() => {
      setUser({
        id: 1,
        username: 'admin@sentia.com',
        roles: ['admin'],
        permissions: [
          'view_admin_portal',
          'manage_users',
          'manage_system_settings',
          'manage_feature_flags',
          'view_system_health',
          'manage_integrations',
          'view_logs',
          'manage_maintenance'
        ]
      })
      setLoading(false)
    }, 100)
  }, [])
  
  return { user, loading }
}

// RBAC component for protecting routes
const ProtectedRoute = ({ children, requiredPermission }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    )
  }
  
  if (!user) {
    return (
      <div style={{ padding: '20px', backgroundColor: '#ffebee', color: '#c62828' }}>
        <h2>Access Denied</h2>
        <p>You must be logged in to access the admin portal.</p>
      </div>
    )
  }
  
  if (requiredPermission && !user.permissions.includes(requiredPermission)) {
    return (
      <div style={{ padding: '20px', backgroundColor: '#fff3e0', color: '#ef6c00' }}>
        <h2>Insufficient Permissions</h2>
        <p>You don't have permission to access this section.</p>
        <p>Required: {requiredPermission}</p>
      </div>
    )
  }
  
  return children
}

// Admin navigation component
const AdminNav = () => {
  const location = useLocation()
  const { user } = useAuth()
  
  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', permission: 'view_admin_portal' },
    { path: '/admin/users', label: 'User Management', permission: 'manage_users' },
    { path: '/admin/settings', label: 'System Settings', permission: 'manage_system_settings' },
    { path: '/admin/feature-flags', label: 'Feature Flags', permission: 'manage_feature_flags' },
    { path: '/admin/health', label: 'System Health', permission: 'view_system_health' },
    { path: '/admin/integrations', label: 'Integrations', permission: 'manage_integrations' },
    { path: '/admin/logs', label: 'Logs & Errors', permission: 'view_logs' },
    { path: '/admin/maintenance', label: 'Maintenance', permission: 'manage_maintenance' }
  ]
  
  const visibleItems = navItems.filter(item => 
    !item.permission || user?.permissions.includes(item.permission)
  )
  
  return (
    <nav style={{
      backgroundColor: '#2c3e50',
      padding: '1.5rem',
      marginBottom: '0',
      borderBottom: '3px solid #34495e',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div style={{ 
        display: 'flex', 
        gap: '1.5rem', 
        flexWrap: 'wrap',
        alignItems: 'center',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <h2 style={{ 
          color: '#ecf0f1', 
          margin: '0 2rem 0 0', 
          fontSize: '1.8rem',
          fontWeight: '600'
        }}>Admin Portal</h2>
        {visibleItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              color: location.pathname === item.path ? '#ffffff' : '#bdc3c7',
              backgroundColor: location.pathname === item.path ? '#3498db' : 'transparent',
              textDecoration: 'none',
              padding: '0.75rem 1.25rem',
              border: location.pathname === item.path ? '2px solid #2980b9' : '2px solid transparent',
              borderRadius: '6px',
              fontSize: '15px',
              fontWeight: location.pathname === item.path ? '600' : '500',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              if (location.pathname !== item.path) {
                e.target.style.backgroundColor = '#34495e';
                e.target.style.color = '#ecf0f1';
              }
            }}
            onMouseLeave={(e) => {
              if (location.pathname !== item.path) {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#bdc3c7';
              }
            }}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}

// Admin page components with API integration
const AdminDashboard = () => {
  const [healthData, setHealthData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHealthData()
  }, [])

  const fetchHealthData = async () => {
    try {
      const response = await fetch('/api/admin/health')
      const data = await response.json()
      if (data.success) {
        setHealthData(data.health)
      }
    } catch (error) {
      console.error('Failed to fetch health data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading dashboard...</div>
  }

  const formatUptime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  const formatMemory = (bytes) => {
    return `${Math.round(bytes / 1024 / 1024)}MB`
  }

  return (
    <div style={{ 
      padding: '2rem',
      backgroundColor: '#f8f9fa',
      minHeight: 'calc(100vh - 120px)',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ 
          color: '#2c3e50',
          fontSize: '2.5rem',
          marginBottom: '2rem',
          fontWeight: '700'
        }}>System Dashboard</h1>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
          gap: '1.5rem', 
          marginTop: '1rem' 
        }}>
          <div style={{ 
            padding: '1.5rem', 
            backgroundColor: '#ffffff', 
            border: '2px solid #3498db', 
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ color: '#2c3e50', fontSize: '1.3rem', marginBottom: '1rem', fontWeight: '600' }}>Server Health</h3>
            <p style={{ color: '#34495e', fontSize: '1rem', margin: '0.5rem 0' }}>
              <strong>Status:</strong> <span style={{ color: '#27ae60' }}>{healthData?.server?.status || 'Unknown'}</span>
            </p>
            <p style={{ color: '#34495e', fontSize: '1rem', margin: '0.5rem 0' }}>
              <strong>Uptime:</strong> {healthData?.server?.uptime ? formatUptime(healthData.server.uptime) : 'N/A'}
            </p>
            <p style={{ color: '#34495e', fontSize: '1rem', margin: '0.5rem 0' }}>
              <strong>Memory:</strong> {healthData?.server?.memory ? formatMemory(healthData.server.memory.used) : 'N/A'}
            </p>
          </div>
          
          <div style={{ 
            padding: '1.5rem', 
            backgroundColor: '#ffffff', 
            border: `2px solid ${healthData?.database?.connected ? '#27ae60' : '#e74c3c'}`, 
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ color: '#2c3e50', fontSize: '1.3rem', marginBottom: '1rem', fontWeight: '600' }}>Database</h3>
            <p style={{ color: '#34495e', fontSize: '1rem', margin: '0.5rem 0' }}>
              <strong>Status:</strong> <span style={{ color: healthData?.database?.connected ? '#27ae60' : '#e74c3c' }}>
                {healthData?.database?.status || 'Unknown'}
              </span>
            </p>
            <p style={{ color: '#34495e', fontSize: '1rem', margin: '0.5rem 0' }}>
              <strong>Connected:</strong> <span style={{ color: healthData?.database?.connected ? '#27ae60' : '#e74c3c' }}>
                {healthData?.database?.connected ? 'Yes' : 'No'}
              </span>
            </p>
          </div>
          
          <div style={{ 
            padding: '1.5rem', 
            backgroundColor: '#ffffff', 
            border: '2px solid #9b59b6', 
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ color: '#2c3e50', fontSize: '1.3rem', marginBottom: '1rem', fontWeight: '600' }}>Services</h3>
            <p style={{ color: '#34495e', fontSize: '1rem', margin: '0.5rem 0' }}>
              <strong>Clerk:</strong> <span style={{ color: healthData?.services?.clerk ? '#27ae60' : '#e74c3c' }}>
                {healthData?.services?.clerk ? 'Connected' : 'Disconnected'}
              </span>
            </p>
            <p style={{ color: '#34495e', fontSize: '1rem', margin: '0.5rem 0' }}>
              <strong>Unleashed:</strong> <span style={{ color: healthData?.services?.unleashed ? '#27ae60' : '#e74c3c' }}>
                {healthData?.services?.unleashed ? 'Connected' : 'Disconnected'}
              </span>
            </p>
            <p style={{ color: '#34495e', fontSize: '1rem', margin: '0.5rem 0' }}>
              <strong>Queue:</strong> <span style={{ color: healthData?.services?.queue ? '#27ae60' : '#e74c3c' }}>
                {healthData?.services?.queue ? 'Active' : 'Inactive'}
              </span>
            </p>
          </div>
          
          <div style={{ 
            padding: '1.5rem', 
            backgroundColor: '#ffffff', 
            border: '2px solid #f39c12', 
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ color: '#2c3e50', fontSize: '1.3rem', marginBottom: '1rem', fontWeight: '600' }}>Quick Actions</h3>
            <button 
              onClick={fetchHealthData}
              style={{ 
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '6px',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                marginRight: '1rem',
                marginBottom: '0.5rem',
                transition: 'background-color 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#2980b9'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#3498db'}
            >
              Refresh Health
            </button>
            <button 
              style={{ 
                backgroundColor: '#95a5a6',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '6px',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                marginBottom: '0.5rem',
                transition: 'background-color 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#7f8c8d'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#95a5a6'}
            >
              View Logs
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const AdminUsers = () => (
  <div style={{ padding: '20px' }}>
    <h1>User Management</h1>
    <p>Manage system users, roles, and permissions.</p>
    <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f5f5f5', border: '1px solid #ddd', borderRadius: '4px' }}>
      <strong>Users:</strong> This would show the full user management interface.
    </div>
  </div>
)

const AdminSettings = () => {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings')
      const data = await response.json()
      if (data.success) {
        setSettings(data.settings)
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading settings...</div>
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>System Settings</h1>
      <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
        <div style={{ padding: '1rem', backgroundColor: '#f5f5f5', border: '1px solid #ddd', borderRadius: '4px' }}>
          <h3>System Configuration</h3>
          <p><strong>Environment:</strong> {settings?.system?.environment}</p>
          <p><strong>Port:</strong> {settings?.system?.port}</p>
          <p><strong>CORS Origins:</strong> {settings?.system?.corsOrigins?.join(', ')}</p>
        </div>
        <div style={{ padding: '1rem', backgroundColor: '#f5f5f5', border: '1px solid #ddd', borderRadius: '4px' }}>
          <h3>Database</h3>
          <p><strong>URL:</strong> {settings?.database?.url}</p>
          <p><strong>SSL:</strong> {settings?.database?.ssl ? 'Enabled' : 'Disabled'}</p>
        </div>
        <div style={{ padding: '1rem', backgroundColor: '#f5f5f5', border: '1px solid #ddd', borderRadius: '4px' }}>
          <h3>External Services</h3>
          <p><strong>Clerk Auth:</strong> {settings?.clerk?.configured ? 'Configured' : 'Not Configured'}</p>
          <p><strong>Unleashed API:</strong> {settings?.unleashed?.configured ? 'Configured' : 'Not Configured'}</p>
        </div>
      </div>
    </div>
  )
}

const AdminFeatureFlags = () => {
  const [featureFlags, setFeatureFlags] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeatureFlags()
  }, [])

  const fetchFeatureFlags = async () => {
    try {
      const response = await fetch('/api/admin/feature-flags')
      const data = await response.json()
      if (data.success) {
        setFeatureFlags(data.featureFlags)
      }
    } catch (error) {
      console.error('Failed to fetch feature flags:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleFeatureFlag = async (flagId, currentEnabled) => {
    try {
      const response = await fetch(`/api/admin/feature-flags/${flagId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !currentEnabled })
      })
      const data = await response.json()
      if (data.success) {
        // Update local state
        setFeatureFlags(prev => 
          prev.map(flag => 
            flag.id === flagId ? { ...flag, enabled: !currentEnabled } : flag
          )
        )
      }
    } catch (error) {
      console.error('Failed to toggle feature flag:', error)
    }
  }

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading feature flags...</div>
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Feature Flags</h1>
      <p>Manage feature flags and rollouts.</p>
      <div style={{ marginTop: '1rem' }}>
        {featureFlags.map(flag => (
          <div key={flag.id} style={{ 
            padding: '1rem', 
            backgroundColor: '#f5f5f5', 
            border: '1px solid #ddd', 
            borderRadius: '4px',
            marginBottom: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0' }}>{flag.name}</h3>
              <p style={{ margin: '0', color: '#666' }}>{flag.description}</p>
              <small style={{ color: '#888' }}>Environment: {flag.environment}</small>
            </div>
            <button
              onClick={() => toggleFeatureFlag(flag.id, flag.enabled)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: flag.enabled ? '#4caf50' : '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {flag.enabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

const AdminHealth = () => (
  <div style={{ padding: '20px' }}>
    <h1>System Health</h1>
    <p>Monitor system health and performance metrics.</p>
    <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f5f5f5', border: '1px solid #ddd', borderRadius: '4px' }}>
      <strong>Health Metrics:</strong> This would show real-time system monitoring.
    </div>
  </div>
)

const AdminIntegrations = () => {
  const [integrations, setIntegrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState({})

  useEffect(() => {
    fetchIntegrations()
  }, [])

  const fetchIntegrations = async () => {
    try {
      const response = await fetch('/api/admin/integrations')
      const data = await response.json()
      if (data.success) {
        setIntegrations(data.integrations)
      }
    } catch (error) {
      console.error('Failed to fetch integrations:', error)
    } finally {
      setLoading(false)
    }
  }

  const testIntegration = async (integrationId) => {
    setTesting(prev => ({ ...prev, [integrationId]: true }))
    try {
      const response = await fetch(`/api/admin/integrations/${integrationId}/test`, {
        method: 'POST'
      })
      const data = await response.json()
      alert(`Test Result: ${data.testResult?.message || 'Test completed'}`)
    } catch (error) {
      alert(`Test failed: ${error.message}`)
    } finally {
      setTesting(prev => ({ ...prev, [integrationId]: false }))
    }
  }

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading integrations...</div>
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Integrations</h1>
      <p>Manage API integrations and webhooks.</p>
      <div style={{ marginTop: '1rem' }}>
        {integrations.map(integration => (
          <div key={integration.id} style={{ 
            padding: '1rem', 
            backgroundColor: '#f5f5f5', 
            border: '1px solid #ddd', 
            borderRadius: '4px',
            marginBottom: '1rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0' }}>{integration.name}</h3>
                <p style={{ margin: '0', color: '#666' }}>Type: {integration.type}</p>
              </div>
              <div style={{ 
                padding: '0.25rem 0.5rem', 
                borderRadius: '4px',
                backgroundColor: integration.status === 'connected' ? '#e8f5e8' : '#ffebee',
                color: integration.status === 'connected' ? '#2e7d32' : '#c62828',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {integration.status}
              </div>
            </div>
            <p><strong>Configured:</strong> {integration.config.configured ? 'Yes' : 'No'}</p>
            {integration.config.baseUrl && <p><strong>URL:</strong> {integration.config.baseUrl}</p>}
            <button
              onClick={() => testIntegration(integration.id)}
              disabled={testing[integration.id]}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#2196f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {testing[integration.id] ? 'Testing...' : 'Test Connection'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

const AdminLogs = () => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/admin/logs?limit=20')
      const data = await response.json()
      if (data.success) {
        setLogs(data.logs)
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getLogLevelColor = (level) => {
    switch (level) {
      case 'error': return '#f44336'
      case 'warn': return '#ff9800'
      case 'info': return '#2196f3'
      default: return '#666'
    }
  }

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading logs...</div>
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Logs & Errors</h1>
      <p>View system logs and error reports.</p>
      <button onClick={fetchLogs} style={{ marginBottom: '1rem', padding: '0.5rem 1rem' }}>
        Refresh Logs
      </button>
      <div style={{ marginTop: '1rem' }}>
        {logs.map(log => (
          <div key={log.id} style={{ 
            padding: '1rem', 
            backgroundColor: '#f5f5f5', 
            border: '1px solid #ddd', 
            borderRadius: '4px',
            marginBottom: '0.5rem',
            fontSize: '14px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <div>
                <span style={{ 
                  padding: '0.25rem 0.5rem', 
                  borderRadius: '4px',
                  backgroundColor: getLogLevelColor(log.level),
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  marginRight: '0.5rem'
                }}>
                  {log.level.toUpperCase()}
                </span>
                <span style={{ color: '#666', fontSize: '12px' }}>{log.service}</span>
              </div>
              <span style={{ color: '#888', fontSize: '12px' }}>
                {new Date(log.timestamp).toLocaleString()}
              </span>
            </div>
            <div style={{ marginBottom: '0.5rem', fontWeight: '500' }}>
              {log.message}
            </div>
            {log.metadata && (
              <div style={{ 
                backgroundColor: '#e0e0e0', 
                padding: '0.5rem', 
                borderRadius: '4px', 
                fontSize: '12px',
                fontFamily: 'monospace'
              }}>
                {JSON.stringify(log.metadata, null, 2)}
              </div>
            )}
          </div>
        ))}
        {logs.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
            No logs available
          </div>
        )}
      </div>
    </div>
  )
}

const AdminMaintenance = () => {
  const [maintenanceStatus, setMaintenanceStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [operations, setOperations] = useState({})

  useEffect(() => {
    fetchMaintenanceStatus()
  }, [])

  const fetchMaintenanceStatus = async () => {
    try {
      const response = await fetch('/api/admin/maintenance/status')
      const data = await response.json()
      if (data.success) {
        setMaintenanceStatus(data.maintenance)
      }
    } catch (error) {
      console.error('Failed to fetch maintenance status:', error)
    } finally {
      setLoading(false)
    }
  }

  const runBackup = async () => {
    setOperations(prev => ({ ...prev, backup: true }))
    try {
      const response = await fetch('/api/admin/maintenance/database/backup', {
        method: 'POST'
      })
      const data = await response.json()
      if (data.success) {
        alert(`Backup initiated: ${data.backupId}`)
        fetchMaintenanceStatus()
      }
    } catch (error) {
      alert(`Backup failed: ${error.message}`)
    } finally {
      setOperations(prev => ({ ...prev, backup: false }))
    }
  }

  const runCleanup = async () => {
    setOperations(prev => ({ ...prev, cleanup: true }))
    try {
      const response = await fetch('/api/admin/maintenance/cleanup', {
        method: 'POST'
      })
      const data = await response.json()
      if (data.success) {
        alert(`Cleanup completed: ${JSON.stringify(data.results)}`)
        fetchMaintenanceStatus()
      }
    } catch (error) {
      alert(`Cleanup failed: ${error.message}`)
    } finally {
      setOperations(prev => ({ ...prev, cleanup: false }))
    }
  }

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading maintenance status...</div>
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Maintenance Tools</h1>
      <p>Database maintenance, backups, and system tools.</p>
      
      <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fff3e0', border: '1px solid #ff9800', borderRadius: '4px' }}>
        <strong>Warning:</strong> Maintenance operations can affect system availability.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
        <div style={{ padding: '1rem', backgroundColor: '#f5f5f5', border: '1px solid #ddd', borderRadius: '4px' }}>
          <h3>Database</h3>
          <p><strong>Size:</strong> {maintenanceStatus?.database?.size}</p>
          <p><strong>Last Backup:</strong> {maintenanceStatus?.database?.lastBackup || 'Never'}</p>
          <p><strong>Maintenance Mode:</strong> {maintenanceStatus?.database?.maintenanceMode ? 'Enabled' : 'Disabled'}</p>
          <button
            onClick={runBackup}
            disabled={operations.backup}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '0.5rem'
            }}
          >
            {operations.backup ? 'Creating Backup...' : 'Create Backup'}
          </button>
        </div>

        <div style={{ padding: '1rem', backgroundColor: '#f5f5f5', border: '1px solid #ddd', borderRadius: '4px' }}>
          <h3>Cache</h3>
          <p><strong>Enabled:</strong> {maintenanceStatus?.cache?.enabled ? 'Yes' : 'No'}</p>
          <p><strong>Size:</strong> {maintenanceStatus?.cache?.size} MB</p>
          <button
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#ff9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '0.5rem'
            }}
          >
            Clear Cache
          </button>
        </div>

        <div style={{ padding: '1rem', backgroundColor: '#f5f5f5', border: '1px solid #ddd', borderRadius: '4px' }}>
          <h3>System Cleanup</h3>
          <p><strong>Last Run:</strong> {maintenanceStatus?.cleanup?.lastRun || 'Never'}</p>
          <p><strong>Next Scheduled:</strong> {maintenanceStatus?.cleanup?.nextScheduled || 'Not scheduled'}</p>
          <button
            onClick={runCleanup}
            disabled={operations.cleanup}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '0.5rem'
            }}
          >
            {operations.cleanup ? 'Running Cleanup...' : 'Run Cleanup'}
          </button>
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <button onClick={fetchMaintenanceStatus} style={{ padding: '0.5rem 1rem' }}>
          Refresh Status
        </button>
      </div>
    </div>
  )
}

const AdminPortal = () => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Loading Admin Portal...</h1>
      </div>
    )
  }
  
  return (
    <ProtectedRoute requiredPermission="view_admin_portal">
      <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
        <AdminNav />
        <Routes>
          <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/dashboard" element={
            <ProtectedRoute requiredPermission="view_admin_portal">
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute requiredPermission="manage_users">
              <AdminUsers />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute requiredPermission="manage_system_settings">
              <AdminSettings />
            </ProtectedRoute>
          } />
          <Route path="/feature-flags" element={
            <ProtectedRoute requiredPermission="manage_feature_flags">
              <AdminFeatureFlags />
            </ProtectedRoute>
          } />
          <Route path="/health" element={
            <ProtectedRoute requiredPermission="view_system_health">
              <AdminHealth />
            </ProtectedRoute>
          } />
          <Route path="/integrations" element={
            <ProtectedRoute requiredPermission="manage_integrations">
              <AdminIntegrations />
            </ProtectedRoute>
          } />
          <Route path="/logs" element={
            <ProtectedRoute requiredPermission="view_logs">
              <AdminLogs />
            </ProtectedRoute>
          } />
          <Route path="/maintenance" element={
            <ProtectedRoute requiredPermission="manage_maintenance">
              <AdminMaintenance />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </ProtectedRoute>
  )
}

export default AdminPortal