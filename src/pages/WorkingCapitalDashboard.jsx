import React, { useState, useEffect } from 'react'
// Temporarily remove Clerk imports to fix Application Error
// import { useAuth, useUser } from '@clerk/clerk-react'
import axios from 'axios'
import '../styles/SentiaTheme.css'
import '../styles/SentiaDashboard.css'
import '../styles/WorkingCapital.css'

// Component imports for different dashboard sections
import CashFlowProjections from '../components/WorkingCapital/CashFlowProjections'
import KPIDashboard from '../components/WorkingCapital/KPIDashboard'
import ScenarioAnalysis from '../components/WorkingCapital/ScenarioAnalysis'
import PolicyManagement from '../components/WorkingCapital/PolicyManagement'
import SystemDiagnostics from '../components/WorkingCapital/SystemDiagnostics'

function WorkingCapitalDashboard() {
  // Mock auth for demo mode (no Clerk)
  const isSignedIn = false
  const user = null
  const getToken = async () => null
  
  const [activeTab, setActiveTab] = useState('overview')
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Dashboard tabs configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'projections', label: 'Projections', icon: '💰' },
    { id: 'kpis', label: 'KPIs', icon: '📈' },
    { id: 'scenarios', label: 'Scenarios', icon: '🎯' },
    { id: 'policies', label: 'Policies', icon: '⚙️' },
    { id: 'diagnostics', label: 'Diagnostics', icon: '🔧' }
  ]

  // Check if user has management access
  const hasManagementAccess = () => {
    const userRole = user?.publicMetadata?.role
    return ['admin', 'cfo', 'financial_manager'].includes(userRole)
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = isSignedIn ? await getToken() : null
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      // Fetch working capital overview data
      const response = await axios.get('/api/working-capital/diagnostics', { headers })
      setDashboardData(response.data.data)

    } catch (err) {
      console.error('Dashboard data fetch error:', err)
      setError(`Failed to fetch working capital data: ${err.response?.data?.error || err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab dashboardData={dashboardData} />
      case 'projections':
        return <CashFlowProjections />
      case 'kpis':
        return <KPIDashboard />
      case 'scenarios':
        return <ScenarioAnalysis />
      case 'policies':
        return <PolicyManagement hasManagementAccess={hasManagementAccess()} />
      case 'diagnostics':
        return <SystemDiagnostics dashboardData={dashboardData} />
      default:
        return <OverviewTab dashboardData={dashboardData} />
    }
  }

  if (loading) {
    return (
      <div className="sentia-loading">
        <div className="sentia-spinner"></div>
        <p>Loading working capital data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="sentia-error">
        <div className="sentia-error-content">
          <h2>Working Capital System Error</h2>
          <p>{error}</p>
          <button onClick={fetchDashboardData} className="sentia-btn sentia-btn-primary">
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="sentia-dashboard">
      <div className="sentia-container">
        {/* Dashboard Header */}
        <div className="sentia-dashboard-header">
          <div className="sentia-dashboard-title">
            <h1>Working Capital Management</h1>
            <p>Cash flow projections, AR/AP optimization, and financial analytics</p>
          </div>
          {isSignedIn && user && (
            <div className="sentia-user-info">
              <div className="sentia-user-avatar">
                {user.firstName?.charAt(0) || user.emailAddresses[0]?.emailAddress?.charAt(0) || 'U'}
              </div>
              <div className="sentia-user-details">
                <span className="sentia-user-name">
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user.emailAddresses[0]?.emailAddress
                  }
                </span>
                <span className="sentia-user-role">
                  {user.publicMetadata?.role === 'admin' ? 'Administrator' : 
                   user.publicMetadata?.role === 'cfo' ? 'Chief Financial Officer' :
                   user.publicMetadata?.role === 'financial_manager' ? 'Financial Manager' :
                   user.publicMetadata?.role === 'financial_analyst' ? 'Financial Analyst' : 'Financial User'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="sentia-tabs">
          <div className="sentia-tab-list">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`sentia-tab ${activeTab === tab.id ? 'sentia-tab-active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="sentia-tab-icon">{tab.icon}</span>
                <span className="sentia-tab-label">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="sentia-tab-content">
          {renderTabContent()}
        </div>

        {/* Action Bar */}
        <div className="sentia-dashboard-actions">
          <button 
            onClick={fetchDashboardData} 
            className="sentia-btn sentia-btn-ghost"
            disabled={loading}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  )
}

// Overview Tab Component
function OverviewTab({ dashboardData }) {
  if (!dashboardData) {
    return (
      <div className="sentia-grid sentia-grid-2">
        <div className="sentia-card">
          <div className="sentia-card-content">
            <div className="sentia-empty-state">
              <p>Loading system overview...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="sentia-grid sentia-grid-2">
      {/* System Health */}
      <div className="sentia-card">
        <div className="sentia-card-header">
          <h3 className="sentia-card-title">System Health</h3>
          <div className={`sentia-card-badge ${dashboardData.overallHealthScore >= 80 ? 'sentia-badge-success' : 
                                              dashboardData.overallHealthScore >= 60 ? 'sentia-badge-warning' : 'sentia-badge-error'}`}>
            {dashboardData.overallHealthScore}/100
          </div>
        </div>
        <div className="sentia-card-content">
          <div className="sentia-status-grid">
            <div className="sentia-status-item">
              <div className="sentia-status-label">Data Quality</div>
              <div className={`sentia-status ${dashboardData.dataQuality.overallScore >= 75 ? 'sentia-status-success' : 'sentia-status-warning'}`}>
                {dashboardData.dataQuality.overallScore}/100
              </div>
            </div>
            <div className="sentia-status-item">
              <div className="sentia-status-label">Model Accuracy</div>
              <div className={`sentia-status ${dashboardData.modelAccuracy.overallAccuracy === 'good' ? 'sentia-status-success' : 'sentia-status-warning'}`}>
                {dashboardData.modelAccuracy.overallAccuracy}
              </div>
            </div>
            <div className="sentia-status-item">
              <div className="sentia-status-label">Performance</div>
              <div className={`sentia-status ${dashboardData.performanceMetrics.status === 'optimal' ? 'sentia-status-success' : 'sentia-status-warning'}`}>
                {dashboardData.performanceMetrics.status}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="sentia-card">
        <div className="sentia-card-header">
          <h3 className="sentia-card-title">System Alerts</h3>
          <div className="sentia-card-badge">{dashboardData.alerts.length}</div>
        </div>
        <div className="sentia-card-content">
          {dashboardData.alerts.length > 0 ? (
            <div className="sentia-alerts-list">
              {dashboardData.alerts.map((alert, index) => (
                <div key={index} className={`sentia-alert sentia-alert-${alert.level}`}>
                  <div className="sentia-alert-content">
                    <div className="sentia-alert-type">{alert.type}</div>
                    <div className="sentia-alert-message">{alert.message}</div>
                    <div className="sentia-alert-timestamp">
                      {new Date(alert.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="sentia-empty-state">
              <p>No active alerts</p>
              <small>System is running normally</small>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="sentia-card sentia-card-span-2">
        <div className="sentia-card-header">
          <h3 className="sentia-card-title">Quick Actions</h3>
        </div>
        <div className="sentia-card-content">
          <div className="sentia-quick-actions">
            <button className="sentia-btn sentia-btn-primary">
              Generate Projection
            </button>
            <button className="sentia-btn sentia-btn-secondary">
              Run Scenario Analysis
            </button>
            <button className="sentia-btn sentia-btn-ghost">
              View KPI Trends
            </button>
            <button className="sentia-btn sentia-btn-ghost">
              Export Report
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WorkingCapitalDashboard