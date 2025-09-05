import React from 'react'
import SimpleKPIStrip from '../components/widgets/SimpleKPIStrip'
import SimpleDemandForecast from '../components/widgets/SimpleDemandForecast'
import SimpleMultiChannelSales from '../components/widgets/SimpleMultiChannelSales'

const SimpleDashboard = () => {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f3f4f6',
      padding: '2rem'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '2rem'
      }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>
          SENTIA Manufacturing Dashboard
        </h1>
        <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
          Real-time monitoring and analytics
        </p>
      </div>

      {/* KPI Strip */}
      <SimpleKPIStrip />

      {/* Main Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: window.innerWidth < 1024 ? '1fr' : '2fr 1fr',
        gap: '1.5rem'
      }}>
        {/* Left Column */}
        <div>
          <SimpleDemandForecast />
          <SimpleMultiChannelSales />
          
          {/* Production Metrics */}
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <div style={{ padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Units Produced</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>12,345</div>
              </div>
              <div style={{ padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Efficiency</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>89.2%</div>
              </div>
              <div style={{ padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Defect Rate</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>0.8%</div>
              </div>
              <div style={{ padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>OEE Score</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>76.5%</div>
              </div>
            </div>
          </div>

          {/* Working Capital */}
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '1.5rem'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              Working Capital
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>AR Days</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>42</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>AP Days</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>38</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Cash Cycle</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>45</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div>
          {/* Smart Inventory */}
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '1.5rem'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              Smart Inventory
            </h2>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
                <span>Raw Materials</span>
                <span style={{ fontWeight: 'bold', color: '#10b981' }}>Optimal</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
                <span>Work in Progress</span>
                <span style={{ fontWeight: 'bold', color: '#f59e0b' }}>Low</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
                <span>Finished Goods</span>
                <span style={{ fontWeight: 'bold', color: '#10b981' }}>Adequate</span>
              </div>
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                backgroundColor: '#eff6ff',
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                AI Recommendation: Reorder steel sheets in 3 days
              </div>
            </div>
          </div>

          {/* Predictive Maintenance */}
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '1.5rem'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              Predictive Maintenance
            </h2>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div style={{
                padding: '1rem',
                backgroundColor: '#fef2f2',
                borderRadius: '6px',
                borderLeft: '4px solid #ef4444'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>CNC Machine #3</div>
                <div style={{ fontSize: '0.875rem', color: '#991b1b' }}>Maintenance in 2 days</div>
              </div>
              <div style={{
                padding: '1rem',
                backgroundColor: '#fefce8',
                borderRadius: '6px',
                borderLeft: '4px solid #fbbf24'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Assembly Line A</div>
                <div style={{ fontSize: '0.875rem', color: '#854d0e' }}>Check in 1 week</div>
              </div>
              <div style={{
                padding: '1rem',
                backgroundColor: '#f0fdf4',
                borderRadius: '6px',
                borderLeft: '4px solid #10b981'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Packaging Unit</div>
                <div style={{ fontSize: '0.875rem', color: '#166534' }}>All systems normal</div>
              </div>
            </div>
          </div>

          {/* CFO KPI Strip */}
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              Financial KPIs
            </h2>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>EBITDA</span>
                <span style={{ fontWeight: 'bold' }}>$425K</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Gross Margin</span>
                <span style={{ fontWeight: 'bold' }}>34.2%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Operating Cash Flow</span>
                <span style={{ fontWeight: 'bold' }}>$312K</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>ROI</span>
                <span style={{ fontWeight: 'bold' }}>18.5%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SimpleDashboard