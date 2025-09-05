import React, { useState, useEffect, Suspense, lazy } from 'react'
import '../styles/SentiaTheme.css'

// Fallback widget for error boundaries - SENTIA BRANDED
const WidgetFallback = ({ name, children }) => (
  <div className="sentia-card">
    {children || (
      <>
        <div className="sentia-card-header">
          <h3 className="sentia-card-title">{name}</h3>
        </div>
        <div className="sentia-loading">
          <div className="sentia-spinner"></div>
          <p>Loading {name}...</p>
        </div>
      </>
    )}
  </div>
)

// Error boundary for widget loading
class WidgetErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true }
  }
  
  render() {
    if (this.state.hasError) {
      return <WidgetFallback name={this.props.name} />
    }
    return this.props.children
  }
}

// Import fixed widgets that always work
import { 
  FixedKPIStrip,
  FixedDemandForecast,
  FixedMultiChannelSales,
  FixedProductionMetrics,
  FixedWorkingCapital,
  FixedCFOKPIStrip
} from '../components/widgets/AllWidgetsFixed'
import FixedPlanningWizard from '../components/widgets/FixedPlanningWizard'

// Import new enterprise integration widgets
import AmazonSPAPIWidget from '../components/widgets/AmazonSPAPIWidget'
import ShopifyMultiStoreWidget from '../components/widgets/ShopifyMultiStoreWidget'
import UnleashedERPWidget from '../components/widgets/UnleashedERPWidget'
import AIForecastingWidget from '../components/widgets/AIForecastingWidget'
import EnterprisePerformanceWidget from '../components/widgets/EnterprisePerformanceWidget'

// Lazy load widgets with fallbacks to fixed versions
const KPIStrip = lazy(() => 
  import('../components/widgets/RealKPIStrip').catch(() => ({
    default: FixedKPIStrip
  }))
)

const DemandForecastWidget = lazy(() => 
  import('../components/widgets/DemandForecastWidget').catch(() => ({
    default: FixedDemandForecast
  }))
)

const MultiChannelSalesWidget = lazy(() => 
  import('../components/widgets/MultiChannelSalesWidget').catch(() => ({
    default: FixedMultiChannelSales
  }))
)

const PredictiveMaintenanceWidget = lazy(() => 
  import('../components/widgets/PredictiveMaintenanceWidget').catch(() => ({
    default: () => <WidgetFallback name="Predictive Maintenance" />
  }))
)

const SmartInventoryWidget = lazy(() => 
  import('../components/widgets/SmartInventoryWidget').catch(() => ({
    default: () => <WidgetFallback name="Smart Inventory" />
  }))
)

// Add production metrics widget
const ProductionMetricsWidget = lazy(() => 
  import('../components/widgets/ProductionMetricsWidget').catch(() => ({
    default: FixedProductionMetrics
  }))
)

// Add CFO KPI widget  
const CFOKPIWidget = lazy(() => 
  import('../components/widgets/CFOKPIWidget').catch(() => ({
    default: FixedCFOKPIStrip
  }))
)

const WorkingCapitalChart = lazy(() => 
  import('../components/charts/WorkingCapitalChart').catch(() => ({
    default: () => <WidgetFallback name="Working Capital Chart" />
  }))
)

const ManufacturingAnalytics = lazy(() => 
  import('../components/analytics/ManufacturingAnalytics').catch(() => ({
    default: () => <WidgetFallback name="Manufacturing Analytics" />
  }))
)

const CFOKPIStrip = lazy(() => 
  import('../components/widgets/CFOKPIStrip').catch(() => ({
    default: FixedCFOKPIStrip
  }))
)

// Add Working Capital widgets
const WorkingCapitalWidget = lazy(() => 
  import('../components/widgets/WorkingCapitalWidget').catch(() => ({
    default: FixedWorkingCapital
  }))
)

const ManufacturingPlanningWizard = lazy(() => 
  import('../components/ManufacturingPlanningWizard').catch(() => ({
    default: FixedPlanningWizard
  }))
)

// Agent Monitoring Widget
const AgentMonitoringWidget = lazy(() => 
  import('../components/widgets/AgentMonitoringWidget').catch(() => ({
    default: () => <WidgetFallback name="Agent Monitoring" />
  }))
)

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
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: `repeat(${windowWidth < 640 ? 1 : windowWidth < 1024 ? 2 : 3}, 1fr)`,
        gap: '1rem' 
      }}>
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
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: `repeat(${windowWidth < 640 ? 1 : windowWidth < 768 ? 2 : windowWidth < 1024 ? 3 : 4}, 1fr)`,
        gap: '1rem' 
      }}>
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
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)

  // Handle responsive layout
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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
    <div className="sentia-dashboard">
      <div className="sentia-container">
        {/* Dashboard Header - SENTIA BRANDED */}
        <div className="sentia-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="sentia-dashboard-header">
              <h1 className="sentia-dashboard-title">
                SENTIA Manufacturing Dashboard
              </h1>
              <p className="sentia-dashboard-subtitle">
                Enterprise Manufacturing Intelligence Platform
              </p>
            </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {/* Time range selector - SENTIA BRANDED */}
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="sentia-select"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
            
            {/* Export button - SENTIA BRANDED */}
            {features.boardExport && (
              <button className="sentia-btn sentia-btn-primary">
                Export 📥
              </button>
            )}
            
            {/* Settings - SENTIA BRANDED */}
            <button 
              onClick={() => setShowFeatureFlags(!showFeatureFlags)}
              className="sentia-btn sentia-btn-ghost"
            >
              ⚙️
            </button>
          </div>
        </div>

        {/* Tabs - SENTIA BRANDED */}
        {features.globalTabs && (
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            marginTop: '1rem',
            borderTop: '1px solid var(--sentia-light-grey)',
            paddingTop: '1rem'
          }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`sentia-btn ${selectedTab === tab.id ? 'sentia-btn-primary' : 'sentia-btn-ghost'}`}
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
      <WidgetErrorBoundary name="KPI Strip">
        <Suspense fallback={<WidgetFallback name="Loading KPIs..." />}>
          {features.cfoPreset ? <CFOKPIStrip /> : <KPIStrip />}
        </Suspense>
      </WidgetErrorBoundary>

      {/* Main Content Grid - SENTIA RESPONSIVE GRID */}
      <div className={`sentia-grid ${windowWidth < 768 ? 'sentia-grid-1' : windowWidth < 1024 ? 'sentia-grid-1' : 'sentia-grid-2'}`}>
        {/* Left Column */}
        <div>
          {/* Demand Forecast */}
          <WidgetErrorBoundary name="Demand Forecast">
            <Suspense fallback={<WidgetFallback name="Demand Forecast" />}>
              <DemandForecastWidget />
            </Suspense>
          </WidgetErrorBoundary>
          
          {/* Multi-Channel Sales */}
          <div style={{ marginTop: '1.5rem' }}>
            <WidgetErrorBoundary name="Multi-Channel Sales">
              <Suspense fallback={<WidgetFallback name="Multi-Channel Sales" />}>
                <MultiChannelSalesWidget timeRange="30d" />
              </Suspense>
            </WidgetErrorBoundary>
          </div>
          
          {/* Production Metrics */}
          <div style={{ marginTop: '1.5rem' }}>
            <WidgetErrorBoundary name="Production Metrics">
              <Suspense fallback={<WidgetFallback name="Production Metrics" />}>
                <ProductionMetricsWidget />
              </Suspense>
            </WidgetErrorBoundary>
          </div>
          
          {/* Working Capital */}
          <div style={{ marginTop: '1.5rem' }}>
            <WidgetErrorBoundary name="Working Capital">
              <Suspense fallback={<WidgetFallback name="Working Capital" />}>
                <WorkingCapitalWidget />
              </Suspense>
            </WidgetErrorBoundary>
          </div>

          {/* ENTERPRISE INTEGRATION WIDGETS */}
          {/* Amazon SP-API Integration */}
          <div style={{ marginTop: '1.5rem' }}>
            <WidgetErrorBoundary name="Amazon SP-API">
              <Suspense fallback={<WidgetFallback name="Amazon SP-API" />}>
                <AmazonSPAPIWidget />
              </Suspense>
            </WidgetErrorBoundary>
          </div>

          {/* Shopify Multi-Store Integration */}
          <div style={{ marginTop: '1.5rem' }}>
            <WidgetErrorBoundary name="Shopify Multi-Store">
              <Suspense fallback={<WidgetFallback name="Shopify Multi-Store" />}>
                <ShopifyMultiStoreWidget />
              </Suspense>
            </WidgetErrorBoundary>
          </div>

          {/* Unleashed ERP Integration */}
          <div style={{ marginTop: '1.5rem' }}>
            <WidgetErrorBoundary name="Unleashed ERP">
              <Suspense fallback={<WidgetFallback name="Unleashed ERP" />}>
                <UnleashedERPWidget />
              </Suspense>
            </WidgetErrorBoundary>
          </div>

          {/* AI Forecasting Widget */}
          <div style={{ marginTop: '1.5rem' }}>
            <WidgetErrorBoundary name="AI Forecasting">
              <Suspense fallback={<WidgetFallback name="AI Forecasting" />}>
                <AIForecastingWidget />
              </Suspense>
            </WidgetErrorBoundary>
          </div>

          {/* Enterprise Performance Monitor */}
          <div style={{ marginTop: '1.5rem' }}>
            <WidgetErrorBoundary name="Enterprise Performance">
              <Suspense fallback={<WidgetFallback name="Enterprise Performance" />}>
                <EnterprisePerformanceWidget />
              </Suspense>
            </WidgetErrorBoundary>
          </div>

          {/* Advanced Working Capital Chart */}
          {features.advanced && (
            <div style={{ marginTop: '1.5rem' }}>
              <WidgetErrorBoundary name="Working Capital Chart">
                <Suspense fallback={<WidgetFallback name="Working Capital Chart" />}>
                  <WorkingCapitalChart timeRange="12M" scenario="baseline" />
                </Suspense>
              </WidgetErrorBoundary>
            </div>
          )}

          {/* Manufacturing Analytics */}
          {features.analytics && (
            <div style={{ marginTop: '1.5rem' }}>
              <WidgetErrorBoundary name="Manufacturing Analytics">
                <Suspense fallback={<WidgetFallback name="Manufacturing Analytics" />}>
                  <ManufacturingAnalytics />
                </Suspense>
              </WidgetErrorBoundary>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div>
          {/* Agent Monitoring Widget */}
          <div style={{ marginBottom: '1.5rem' }}>
            <WidgetErrorBoundary name="Agent Monitoring">
              <Suspense fallback={<WidgetFallback name="Agent Monitoring" />}>
                <AgentMonitoringWidget />
              </Suspense>
            </WidgetErrorBoundary>
          </div>
          
          {/* Smart Inventory Widget */}
          <div style={{ marginBottom: '1.5rem' }}>
            <WidgetErrorBoundary name="Smart Inventory">
              <Suspense fallback={<WidgetFallback name="Smart Inventory" />}>
                <SmartInventoryWidget />
              </Suspense>
            </WidgetErrorBoundary>
          </div>
          
          {/* Predictive Maintenance Widget */}
          <div style={{ marginBottom: '1.5rem' }}>
            <WidgetErrorBoundary name="Predictive Maintenance">
              <Suspense fallback={<WidgetFallback name="Predictive Maintenance" />}>
                <PredictiveMaintenanceWidget />
              </Suspense>
            </WidgetErrorBoundary>
          </div>
          
          {/* Manufacturing Planning Wizard - Always visible */}
          <div style={{ marginBottom: '1.5rem' }}>
            <WidgetErrorBoundary name="Manufacturing Planning">
              <Suspense fallback={<WidgetFallback name="Manufacturing Planning" />}>
                <ManufacturingPlanningWizard />
              </Suspense>
            </WidgetErrorBoundary>
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
        <WidgetErrorBoundary name="Manufacturing Planning Wizard">
          <Suspense fallback={<WidgetFallback name="Manufacturing Planning Wizard" />}>
            <ManufacturingPlanningWizard 
              onClose={() => setShowPlanningWizard(false)}
            />
          </Suspense>
        </WidgetErrorBoundary>
      )}
      </div>
    </div>
  );
}

export default EnhancedDashboard;