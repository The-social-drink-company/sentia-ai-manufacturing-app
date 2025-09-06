import { devLog } from '../lib/devLog.js';\nimport React, { useState, useEffect } from 'react'
import { fetchRealKPIs } from '../../services/realDataService'

const RealKPIStrip = () => {
  const [kpis, setKpis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadRealData = async () => {
      try {
        setLoading(true)
        const data = await fetchRealKPIs()
        setKpis(data)
        setError(null)
      } catch (err) {
        setError('Failed to load real KPI data')
        devLog.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadRealData()
    // Refresh every 30 seconds for real-time updates
    const interval = setInterval(loadRealData, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              height: '20px',
              backgroundColor: '#f3f4f6',
              borderRadius: '4px',
              marginBottom: '0.5rem',
              animation: 'pulse 2s infinite'
            }}></div>
            <div style={{
              height: '32px',
              backgroundColor: '#f3f4f6',
              borderRadius: '4px',
              animation: 'pulse 2s infinite'
            }}></div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        backgroundColor: '#fee2e2',
        color: '#991b1b',
        padding: '1rem',
        borderRadius: '8px',
        marginBottom: '1.5rem'
      }}>
        {error}
      </div>
    )
  }

  const formatValue = (value, type) => {
    if (type === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value || 0)
    }
    if (type === 'percentage') {
      return `${(value || 0).toFixed(1)}%`
    }
    return new Intl.NumberFormat('en-US').format(value || 0)
  }

  const kpiConfig = [
    { 
      label: 'Revenue', 
      value: kpis?.revenue, 
      type: 'currency',
      color: kpis?.revenue > 0 ? '#10b981' : '#6b7280'
    },
    { 
      label: 'Orders', 
      value: kpis?.orders, 
      type: 'number',
      color: kpis?.orders > 0 ? '#10b981' : '#6b7280'
    },
    { 
      label: 'Efficiency', 
      value: kpis?.efficiency, 
      type: 'percentage',
      color: kpis?.efficiency > 85 ? '#10b981' : kpis?.efficiency > 70 ? '#f59e0b' : '#ef4444'
    },
    { 
      label: 'Quality', 
      value: kpis?.quality, 
      type: 'percentage',
      color: kpis?.quality > 95 ? '#10b981' : kpis?.quality > 90 ? '#f59e0b' : '#ef4444'
    }
  ]

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${window.innerWidth < 768 ? 2 : 4}, 1fr)`,
      gap: '1rem',
      marginBottom: '1.5rem'
    }}>
      {kpiConfig.map((kpi, index) => (
        <div key={index} style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          borderTop: `3px solid ${kpi.color}`
        }}>
          <h3 style={{ 
            fontSize: '0.875rem', 
            color: '#6b7280',
            marginBottom: '0.5rem',
            fontWeight: 'normal',
            textTransform: 'uppercase'
          }}>
            {kpi.label}
          </h3>
          <div style={{ 
            fontSize: '2rem', 
            fontWeight: 'bold', 
            color: '#111827' 
          }}>
            {formatValue(kpi.value, kpi.type)}
          </div>
          <div style={{ 
            fontSize: '0.75rem', 
            color: '#6b7280',
            marginTop: '0.25rem'
          }}>
            Live Data
          </div>
        </div>
      ))}
    </div>
  )
}

export default RealKPIStrip