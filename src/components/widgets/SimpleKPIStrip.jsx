import React from 'react'

const SimpleKPIStrip = () => {
  const kpis = [
    { label: 'Revenue', value: '$2.4M', change: '+12%', color: 'green' },
    { label: 'Orders', value: '1,248', change: '+8%', color: 'green' },
    { label: 'Efficiency', value: '94%', change: '+3%', color: 'green' },
    { label: 'Quality', value: '99.2%', change: '+0.5%', color: 'green' }
  ]

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${window.innerWidth < 768 ? 2 : 4}, 1fr)`,
      gap: '1rem',
      marginBottom: '1.5rem'
    }}>
      {kpis.map((kpi, index) => (
        <div key={index} style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ 
            fontSize: '0.875rem', 
            color: '#6b7280',
            marginBottom: '0.5rem',
            fontWeight: 'normal'
          }}>
            {kpi.label}
          </h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>
            {kpi.value}
          </div>
          <div style={{ 
            fontSize: '0.875rem', 
            color: kpi.color === 'green' ? '#10b981' : '#ef4444',
            marginTop: '0.25rem'
          }}>
            {kpi.change}
          </div>
        </div>
      ))}
    </div>
  )
}

export default SimpleKPIStrip