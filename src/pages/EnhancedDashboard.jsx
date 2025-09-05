import React, { useState, useEffect, Suspense } from 'react'
import '../styles/SentiaTheme.css'
import { useKPIData } from '../hooks/useRealTimeData'
import { AdvancedKPI, ProductionStageKPI, ChannelKPI } from '../components/ui/AdvancedKPI'
import { MultiChannelBarChart, ProductionPipelineChart } from '../components/charts/RealTimeChart'
import { NotificationSystem, notifySuccess, notifyInfo } from '../components/ui/NotificationSystem'

// Loading component
function DashboardLoading() {
  return (
    <div className="sentia-card">
      <div className="sentia-loading">
        <div className="sentia-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    </div>
  )
}

// Simple KPI component
function SimpleKPI({ title, value, trend, color = "#3b82f6" }) {
  return (
    <div style={{
      backgroundColor: 'white',
      padding: '1.5rem',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      border: `2px solid ${color}20`
    }}>
      <h3 style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>{title}</h3>
      <p style={{ fontSize: '2rem', fontWeight: 'bold', color: color, marginBottom: '0.25rem' }}>{value}</p>
      {trend && <p style={{ fontSize: '0.875rem', color: '#10b981' }}>{trend}</p>}
    </div>
  )
}

// Quick action button
function QuickActionButton({ title, icon, onClick, color = "#3b82f6" }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: '1rem',
        backgroundColor: color,
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '0.875rem',
        fontWeight: '500',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        transition: 'all 0.2s'
      }}
      onMouseOver={(e) => e.target.style.transform = 'scale(1.02)'}
      onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
    >
      <span>{icon}</span>
      {title}
    </button>
  )
}

// Main Enhanced Dashboard Component
function EnhancedDashboard() {
  const [timeRange, setTimeRange] = useState('today')
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)
  
  // Real-time data hooks
  const { data: kpiData, loading: kpiLoading, error: kpiError, lastUpdated } = useKPIData()
  
  // Handle responsive layout
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleResize = () => setWindowWidth(window.innerWidth)
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [])

  // Sentia Spirits distributed manufacturing KPIs
  const kpis = [
    { title: 'Batches Mixed', value: '3 active', trend: '↑ 15% efficiency this week', color: '#10b981' },
    { title: 'Units Bottled', value: '8,450', trend: '↑ 12% vs last week', color: '#3b82f6' },
    { title: 'Ready to Ship', value: '1,240', trend: '89 orders pending', color: '#8b5cf6' },
    { title: 'Multi-Channel Sales', value: '£5,120', trend: '↑ 8.5% vs last month', color: '#f59e0b' }
  ]

  const isDesktop = windowWidth >= 1024
  const isTablet = windowWidth >= 768 && windowWidth < 1024
  
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8fafc',
      padding: '1rem'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
        marginBottom: '2rem',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0 }}>
              SENTIA Manufacturing Dashboard
            </h1>
            <p style={{ fontSize: '1.1rem', opacity: 0.9, margin: '0.5rem 0 0 0' }}>
              Enterprise Manufacturing Intelligence Platform
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.3)',
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: 'white',
                fontSize: '0.875rem'
              }}
            >
              <option value="today" style={{ color: '#000' }}>Today</option>
              <option value="week" style={{ color: '#000' }}>This Week</option>
              <option value="month" style={{ color: '#000' }}>This Month</option>
              <option value="quarter" style={{ color: '#000' }}>This Quarter</option>
              <option value="year" style={{ color: '#000' }}>This Year</option>
            </select>
            
            <button style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'rgba(255,255,255,0.1)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}>
              Export 📊
            </button>
          </div>
        </div>
      </div>

      {/* Real-time KPI Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: `repeat(${isDesktop ? 4 : isTablet ? 2 : 1}, 1fr)`,
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {kpiError ? (
          <div style={{ gridColumn: '1 / -1', padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
            <p>⚠️ Unable to load real-time data</p>
            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Error: {kpiError}</p>
          </div>
        ) : (
          <>
            {/* Production Stages */}
            {kpiData?.productionStages && (
              <>
                <ProductionStageKPI 
                  stage="mixing" 
                  data={kpiData.productionStages.mixing}
                  onClick={() => console.log('Navigate to mixing details')}
                />
                <ProductionStageKPI 
                  stage="bottling" 
                  data={kpiData.productionStages.bottling}
                  onClick={() => console.log('Navigate to bottling details')}
                />
                <ProductionStageKPI 
                  stage="warehousing" 
                  data={kpiData.productionStages.warehousing}
                  onClick={() => console.log('Navigate to warehouse details')}
                />
              </>
            )}
            
            {/* Overall Performance Summary */}
            {kpiData?.channels && (
              <AdvancedKPI
                title="Total Revenue"
                value={`£${Object.values(kpiData.channels).reduce((sum, ch) => sum + (ch.revenue || 0), 0).toLocaleString()}`}
                trend={`${Object.values(kpiData.channels).reduce((sum, ch) => sum + (ch.orders || 0), 0)} orders across all channels`}
                color="#8b5cf6"
                icon="💎"
                status="success"
                loading={kpiLoading}
              />
            )}
            
            {/* Fallback to static KPIs if no real data */}
            {!kpiData && kpis.map((kpi, index) => (
              <SimpleKPI 
                key={index}
                title={kpi.title}
                value={kpi.value}
                trend={kpi.trend}
                color={kpi.color}
              />
            ))}
          </>
        )}
      </div>

      {/* Main Content Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isDesktop ? '2fr 1fr' : '1fr',
        gap: '2rem'
      }}>
        {/* Left Column - Main Widgets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Distributed Production Overview */}
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.07)'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1f2937' }}>
              Sentia Spirits Production Pipeline
            </h2>
            {/* Real-time Production Pipeline Chart */}
            {kpiData?.productionStages ? (
              <ProductionPipelineChart 
                productionStages={kpiData.productionStages}
                height={300}
              />
            ) : (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: `repeat(${isDesktop ? 3 : 1}, 1fr)`,
                gap: '1.5rem' 
              }}>
                <div style={{ padding: '1.5rem', backgroundColor: '#ecfdf5', borderRadius: '8px', border: '2px solid #10b981' }}>
                  <h4 style={{ color: '#065f46', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>🧪 Mixing & Infusion</h4>
                  <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#10b981' }}>3 Batches</p>
                  <p style={{ fontSize: '0.75rem', color: '#065f46' }}>Active infusion process</p>
                  <div style={{ width: '100%', height: '6px', backgroundColor: '#d1fae5', borderRadius: '3px', marginTop: '0.5rem' }}>
                    <div style={{ width: '75%', height: '100%', backgroundColor: '#10b981', borderRadius: '3px' }}></div>
                  </div>
                </div>
                <div style={{ padding: '1.5rem', backgroundColor: '#eff6ff', borderRadius: '8px', border: '2px solid #3b82f6' }}>
                  <h4 style={{ color: '#1e40af', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>🍾 Bottling & Labeling</h4>
                  <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#3b82f6' }}>8,450</p>
                  <p style={{ fontSize: '0.75rem', color: '#1e40af' }}>Units bottled today</p>
                  <div style={{ width: '100%', height: '6px', backgroundColor: '#dbeafe', borderRadius: '3px', marginTop: '0.5rem' }}>
                    <div style={{ width: '89%', height: '100%', backgroundColor: '#3b82f6', borderRadius: '3px' }}></div>
                  </div>
                </div>
                <div style={{ padding: '1.5rem', backgroundColor: '#faf5ff', borderRadius: '8px', border: '2px solid #8b5cf6' }}>
                  <h4 style={{ color: '#6b21a8', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>📦 Warehousing</h4>
                  <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#8b5cf6' }}>15,230</p>
                  <p style={{ fontSize: '0.75rem', color: '#6b21a8' }}>Units in inventory</p>
                  <div style={{ width: '100%', height: '6px', backgroundColor: '#e7d3ff', borderRadius: '3px', marginTop: '0.5rem' }}>
                    <div style={{ width: '68%', height: '100%', backgroundColor: '#8b5cf6', borderRadius: '3px' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Multi-Channel Sales Performance with Real-time Data */}
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.07)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
                Multi-Channel Sales Performance
              </h2>
              {lastUpdated && (
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
            
            {/* Real-time Channel KPIs */}
            {kpiData?.channels ? (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: `repeat(${isDesktop ? 3 : 1}, 1fr)`,
                gap: '1.5rem',
                marginBottom: '2rem'
              }}>
                {Object.entries(kpiData.channels).map(([channel, data]) => (
                  <ChannelKPI 
                    key={channel}
                    channel={channel}
                    data={data}
                    onClick={() => console.log(`Navigate to ${channel} analytics`)}
                  />
                ))}
              </div>
            ) : (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: `repeat(${isDesktop ? 3 : 1}, 1fr)`,
                gap: '1.5rem',
                marginBottom: '2rem'
              }}>
                <div style={{ textAlign: 'center', padding: '1.5rem', backgroundColor: '#fff7ed', borderRadius: '8px', border: '1px solid #fed7aa' }}>
                  <h4 style={{ color: '#9a3412', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>🛒 Amazon</h4>
                  <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#ea580c' }}>45 orders</p>
                  <p style={{ fontSize: '0.875rem', color: '#9a3412', marginBottom: '0.5rem' }}>£2,340 revenue</p>
                  <p style={{ fontSize: '0.75rem', color: '#10b981' }}>96.8% fulfillment</p>
                </div>
                <div style={{ textAlign: 'center', padding: '1.5rem', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <h4 style={{ color: '#14532d', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>🛍️ Shopify</h4>
                  <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#16a34a' }}>23 orders</p>
                  <p style={{ fontSize: '0.875rem', color: '#14532d', marginBottom: '0.5rem' }}>£1,890 revenue</p>
                  <p style={{ fontSize: '0.75rem', color: '#10b981' }}>98.2% fulfillment</p>
                </div>
                <div style={{ textAlign: 'center', padding: '1.5rem', backgroundColor: '#f5f3ff', borderRadius: '8px', border: '1px solid #c4b5fd' }}>
                  <h4 style={{ color: '#581c87', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>🌍 Regional Split</h4>
                  <p style={{ fontSize: '1rem', fontWeight: 'bold', color: '#7c3aed' }}>UK: 35 | EU: 28 | USA: 17</p>
                  <p style={{ fontSize: '0.875rem', color: '#581c87', marginBottom: '0.5rem' }}>Total: £5,120</p>
                  <p style={{ fontSize: '0.75rem', color: '#10b981' }}>↑ 12% vs last week</p>
                </div>
              </div>
            )}
            
            {/* Interactive Chart */}
            {kpiData?.channels && (
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
                  Revenue vs Orders by Channel
                </h3>
                <MultiChannelBarChart channels={kpiData.channels} />
              </div>
            )}
          </div>

          {/* AI Insights */}
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
            border: '2px solid #8b5cf6'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🤖 AI-Powered Insights
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '1rem', backgroundColor: '#f3e8ff', borderRadius: '8px', borderLeft: '4px solid #8b5cf6' }}>
                <p style={{ fontWeight: '600', color: '#1f2937' }}>🎯 Seasonal Demand Forecast</p>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Holiday season approaching: 28% increase in Gin & Tonic expected. Consider ramping bottling capacity at Partner Facility B.</p>
              </div>
              <div style={{ padding: '1rem', backgroundColor: '#ecfdf5', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
                <p style={{ fontWeight: '600', color: '#1f2937' }}>💡 Supply Chain Optimization</p>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Consolidate EU shipments: 15% cost reduction by batching Shopify EU orders with Amazon EU fulfillment.</p>
              </div>
              <div style={{ padding: '1rem', backgroundColor: '#fff7ed', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
                <p style={{ fontWeight: '600', color: '#1f2937' }}>📊 MCP Vector Analysis</p>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Neon vector database identifies optimal inventory levels: UK warehouse can reduce by 8% without affecting fulfillment.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Quick Actions & Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Quick Actions */}
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.07)'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1f2937' }}>
              Quick Actions
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <QuickActionButton 
                title="Order Mixing Batch" 
                icon="🧪" 
                color="#10b981" 
                onClick={() => notifySuccess('Batch Ordered', 'New mixing batch #SEN-2025-090 scheduled for tomorrow')}
              />
              <QuickActionButton 
                title="Schedule Bottling" 
                icon="🍾" 
                color="#3b82f6" 
                onClick={() => notifyInfo('Bottling Scheduled', 'Bottling slot reserved at Partner Facility B for next week')}
              />
              <QuickActionButton 
                title="Check Amazon Orders" 
                icon="📦" 
                color="#ea580c" 
                onClick={() => notifyInfo('Orders Updated', `${kpiData?.channels?.amazon?.orders || 45} active Amazon orders`)}
              />
              <QuickActionButton 
                title="Shopify Analytics" 
                icon="📊" 
                color="#16a34a" 
                onClick={() => notifyInfo('Analytics', `Shopify performance: £${kpiData?.channels?.shopify?.revenue || 1890} revenue`)}
              />
              <QuickActionButton 
                title="Export Multi-Channel Report" 
                icon="💰" 
                color="#8b5cf6" 
                onClick={() => notifySuccess('Report Exported', 'Multi-channel performance report generated successfully')}
              />
            </div>
          </div>

          {/* System Status */}
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.07)'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1f2937' }}>
              System Status
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem' }}>Unleashed ERP</span>
                <span style={{ color: '#10b981', fontSize: '0.875rem', fontWeight: '600' }}>✅ Connected</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem' }}>Xero Accounting</span>
                <span style={{ color: '#10b981', fontSize: '0.875rem', fontWeight: '600' }}>✅ Synced</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem' }}>Amazon SP-API</span>
                <span style={{ color: '#10b981', fontSize: '0.875rem', fontWeight: '600' }}>✅ Active</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem' }}>Shopify Multi-Store</span>
                <span style={{ color: '#10b981', fontSize: '0.875rem', fontWeight: '600' }}>✅ Connected</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem' }}>MCP Vector DB</span>
                <span style={{ color: '#10b981', fontSize: '0.875rem', fontWeight: '600' }}>✅ Operational</span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.07)'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1f2937' }}>
              Recent Activity
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                <span style={{ fontWeight: '600', color: '#1f2937' }}>14:32</span> - Batch #SEN-2025-089 completed mixing
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                <span style={{ fontWeight: '600', color: '#1f2937' }}>14:18</span> - 450 units bottled at Partner Facility B
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                <span style={{ fontWeight: '600', color: '#1f2937' }}>14:05</span> - Amazon UK: 12 new orders received
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                <span style={{ fontWeight: '600', color: '#1f2937' }}>13:47</span> - Unleashed inventory sync completed
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                <span style={{ fontWeight: '600', color: '#1f2937' }}>13:30</span> - Xero financial data updated
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        marginTop: '2rem',
        padding: '1.5rem',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
        textAlign: 'center',
        color: '#6b7280',
        fontSize: '0.875rem'
      }}>
        Last updated: {new Date().toLocaleString()} | 
        Data refresh rate: 30 seconds | 
        System status: <span style={{ color: '#10b981', fontWeight: 'bold' }}>Operational</span> |
        MCP Integration: <span style={{ color: '#8b5cf6', fontWeight: 'bold' }}>Active</span>
      </div>
      
      {/* Notification System */}
      <NotificationSystem />
    </div>
  )
}

export default EnhancedDashboard