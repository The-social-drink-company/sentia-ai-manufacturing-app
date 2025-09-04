import React, { useState, useEffect } from 'react'
import KPIStrip from '../components/widgets/KPIStrip'
import DemandForecastWidget from '../components/widgets/DemandForecastWidget'
import MultiChannelSalesWidget from '../components/widgets/MultiChannelSalesWidget'
import PredictiveMaintenanceWidget from '../components/widgets/PredictiveMaintenanceWidget'
import SmartInventoryWidget from '../components/widgets/SmartInventoryWidget'
import WorkingCapitalChart from '../components/charts/WorkingCapitalChart'
import ManufacturingAnalytics from '../components/analytics/ManufacturingAnalytics'
import CFOKPIStrip from '../components/widgets/CFOKPIStrip'
import ManufacturingPlanningWizard from '../components/ManufacturingPlanningWizard'

// Import all working capital components if they exist
const WorkingCapitalSection = () => {
  return (
    <div style={{
      backgroundColor: 'white',
      padding: '1.5rem',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      marginBottom: '1.5rem'
    }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        Working Capital Management
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        <div style={{ padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '4px' }}>
          <h3 style={{ fontSize: '0.875rem', color: '#6b7280' }}>Accounts Receivable</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>$1.2M</p>
          <p style={{ fontSize: '0.75rem', color: '#10b981' }}>↓ 5% from last month</p>
        </div>
        <div style={{ padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '4px' }}>
          <h3 style={{ fontSize: '0.875rem', color: '#6b7280' }}>Accounts Payable</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>$800K</p>
          <p style={{ fontSize: '0.75rem', color: '#ef4444' }}>↑ 3% from last month</p>
        </div>
        <div style={{ padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '4px' }}>
          <h3 style={{ fontSize: '0.875rem', color: '#6b7280' }}>Cash Conversion Cycle</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>45 days</p>
          <p style={{ fontSize: '0.75rem', color: '#10b981' }}>↓ 2 days improvement</p>
        </div>
      </div>
    </div>
  )
}

// Production metrics component
const ProductionMetrics = () => {
  return (
    <div style={{
      backgroundColor: 'white',
      padding: '1.5rem',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      marginBottom: '1.5rem'
    }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        Production Metrics
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '0.875rem', color: '#6b7280' }}>Units Produced</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>12,345</p>
          <div style={{ width: '100%', height: '4px', backgroundColor: '#e5e7eb', borderRadius: '2px', marginTop: '0.5rem' }}>
            <div style={{ width: '75%', height: '100%', backgroundColor: '#3b82f6', borderRadius: '2px' }}></div>
          </div>
        </div>
        <div>
          <h3 style={{ fontSize: '0.875rem', color: '#6b7280' }}>Efficiency Rate</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>89.2%</p>
          <div style={{ width: '100%', height: '4px', backgroundColor: '#e5e7eb', borderRadius: '2px', marginTop: '0.5rem' }}>
            <div style={{ width: '89%', height: '100%', backgroundColor: '#10b981', borderRadius: '2px' }}></div>
          </div>
        </div>
        <div>
          <h3 style={{ fontSize: '0.875rem', color: '#6b7280' }}>Defect Rate</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>0.8%</p>
          <div style={{ width: '100%', height: '4px', backgroundColor: '#e5e7eb', borderRadius: '2px', marginTop: '0.5rem' }}>
            <div style={{ width: '8%', height: '100%', backgroundColor: '#fbbf24', borderRadius: '2px' }}></div>
          </div>
        </div>
        <div>
          <h3 style={{ fontSize: '0.875rem', color: '#6b7280' }}>On-Time Delivery</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>95.6%</p>
          <div style={{ width: '100%', height: '4px', backgroundColor: '#e5e7eb', borderRadius: '2px', marginTop: '0.5rem' }}>
            <div style={{ width: '95%', height: '100%', backgroundColor: '#8b5cf6', borderRadius: '2px' }}></div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Inventory status component
const InventoryStatus = () => {
  const inventoryItems = [
    { name: 'Raw Materials', value: 450, unit: 'tons', status: 'good' },
    { name: 'Work in Progress', value: 128, unit: 'units', status: 'warning' },
    { name: 'Finished Goods', value: 892, unit: 'units', status: 'good' },
    { name: 'Packaging Materials', value: 3200, unit: 'pcs', status: 'critical' }
  ]

  return (
    <div style={{
      backgroundColor: 'white',
      padding: '1.5rem',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        Inventory Status
      </h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Item</th>
            <th style={{ padding: '0.5rem', textAlign: 'center' }}>Quantity</th>
            <th style={{ padding: '0.5rem', textAlign: 'center' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {inventoryItems.map((item, index) => (
            <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: '0.75rem' }}>{item.name}</td>
              <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                {item.value} {item.unit}
              </td>
              <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  backgroundColor: item.status === 'good' ? '#d1fae5' : item.status === 'warning' ? '#fef3c7' : '#fee2e2',
                  color: item.status === 'good' ? '#065f46' : item.status === 'warning' ? '#92400e' : '#991b1b'
                }}>
                  {item.status.toUpperCase()}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Main Enhanced Dashboard Component
function EnhancedDashboard() {
  const [selectedTab, setSelectedTab] = useState('overview')
  const [timeRange, setTimeRange] = useState('today')
  const [showFeatureFlags, setShowFeatureFlags] = useState(false)
  const [showPlanningWizard, setShowPlanningWizard] = useState(false)

  // Feature flags
  const features = {
    cfoPreset: import.meta.env.VITE_FEATURE_CFO_PRESET === 'true',
    globalTabs: import.meta.env.VITE_FEATURE_GLOBAL_TABS === 'true',
    boardExport: import.meta.env.VITE_FEATURE_BOARD_EXPORT === 'true',
    trustBadges: import.meta.env.VITE_FEATURE_TRUST_BADGES === 'true',
    benchmarks: import.meta.env.VITE_FEATURE_BENCHMARKS === 'true',
    advanced: true, // Enable advanced charts
    analytics: true // Enable manufacturing analytics
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'production', label: 'Production', icon: '🏭' },
    { id: 'finance', label: 'Finance', icon: '💰' },
    { id: 'inventory', label: 'Inventory', icon: '📦' },
    { id: 'analytics', label: 'Analytics', icon: '📈' }
  ]

  return (
    <div style={{ 
      minHeight: 'calc(100vh - 64px)', 
      backgroundColor: '#f3f4f6',
      padding: '1.5rem'
    }}>
      {/* Dashboard Header */}
      <div style={{ 
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827' }}>
              Enhanced Manufacturing Dashboard
            </h1>
            <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>
              Real-time production and financial metrics
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {/* Time range selector */}
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                backgroundColor: 'white'
              }}
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
            
            {/* Export button */}
            {features.boardExport && (
              <button style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer'
              }}>
                Export 📥
              </button>
            )}
            
            {/* Settings */}
            <button 
              onClick={() => setShowFeatureFlags(!showFeatureFlags)}
              style={{
                padding: '0.5rem',
                backgroundColor: '#f3f4f6',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              ⚙️
            </button>
          </div>
        </div>

        {/* Tabs */}
        {features.globalTabs && (
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            marginTop: '1rem',
            borderTop: '1px solid #e5e7eb',
            paddingTop: '1rem'
          }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: selectedTab === tab.id ? '#3b82f6' : 'transparent',
                  color: selectedTab === tab.id ? 'white' : '#6b7280',
                  fontWeight: selectedTab === tab.id ? 'bold' : 'normal'
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Feature Flags Debug Panel */}
      {showFeatureFlags && (
        <div style={{
          backgroundColor: '#fef3c7',
          border: '1px solid #fbbf24',
          padding: '1rem',
          borderRadius: '6px',
          marginBottom: '1rem'
        }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Feature Flags</h3>
          <ul style={{ fontSize: '0.875rem', listStyle: 'none', padding: 0 }}>
            {Object.entries(features).map(([key, value]) => (
              <li key={key}>
                {value ? '✅' : '❌'} {key}: {value ? 'Enabled' : 'Disabled'}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* KPI Strips */}
      {features.cfoPreset ? <CFOKPIStrip /> : <KPIStrip />}

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
        {/* Left Column */}
        <div>
          {/* Demand Forecast */}
          <DemandForecastWidget />
          
          {/* Multi-Channel Sales */}
          <div style={{ marginTop: '1.5rem' }}>
            <MultiChannelSalesWidget timeRange="30d" />
          </div>
          
          {/* Production Metrics */}
          <ProductionMetrics />
          
          {/* Working Capital */}
          <WorkingCapitalSection />

          {/* Advanced Working Capital Chart */}
          {features.advanced && (
            <div style={{ marginTop: '1.5rem' }}>
              <WorkingCapitalChart timeRange="12M" scenario="baseline" />
            </div>
          )}

          {/* Manufacturing Analytics */}
          {features.analytics && (
            <div style={{ marginTop: '1.5rem' }}>
              <ManufacturingAnalytics />
            </div>
          )}
        </div>

        {/* Right Column */}
        <div>
          {/* Smart Inventory Widget */}
          <div style={{ marginBottom: '1.5rem' }}>
            <SmartInventoryWidget />
          </div>
          
          {/* Predictive Maintenance Widget */}
          <div style={{ marginBottom: '1.5rem' }}>
            <PredictiveMaintenanceWidget />
          </div>
          
          {/* Legacy Inventory Status */}
          <InventoryStatus />
          
          {/* Quick Actions */}
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginTop: '1.5rem'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              Quick Actions
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button style={{
                padding: '0.75rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left'
              }}>
                📊 Generate Report
              </button>
              <button style={{
                padding: '0.75rem',
                backgroundColor: '#10b981',
                color: 'white',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left'
              }}>
                📦 Update Inventory
              </button>
              <button style={{
                padding: '0.75rem',
                backgroundColor: '#8b5cf6',
                color: 'white',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left'
              }}>
                💰 Review Financials
              </button>
              <button style={{
                padding: '0.75rem',
                backgroundColor: '#f59e0b',
                color: 'white',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left'
              }}>
                🔔 Set Alerts
              </button>
            </div>
          </div>

          {/* Trust Badges */}
          {features.trustBadges && (
            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              marginTop: '1.5rem'
            }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                Certifications
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>🏆</span>
                  <span>ISO 9001:2015 Certified</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>✅</span>
                  <span>GDPR Compliant</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>🔒</span>
                  <span>SOC 2 Type II</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>🌱</span>
                  <span>Carbon Neutral</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{
        marginTop: '2rem',
        padding: '1.5rem',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          Quick Actions
        </h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowPlanningWizard(true)}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
          >
            🏭 Manufacturing Planning Wizard
          </button>
          <button
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#059669'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#10b981'}
          >
            📊 Generate Report
          </button>
        </div>
      </div>

      {/* Footer Status */}
      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        textAlign: 'center',
        color: '#6b7280',
        fontSize: '0.875rem'
      }}>
        Last updated: {new Date().toLocaleString()} | 
        Data refresh rate: 5 seconds | 
        System status: <span style={{ color: '#10b981', fontWeight: 'bold' }}>Operational</span>
      </div>

      {/* Manufacturing Planning Wizard Modal */}
      {showPlanningWizard && (
        <ManufacturingPlanningWizard 
          onClose={() => setShowPlanningWizard(false)}
        />
      )}
    </div>
  )
}

export default EnhancedDashboard