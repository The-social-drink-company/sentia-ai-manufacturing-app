import React from 'react'

const SimpleMultiChannelSales = () => {
  const channels = [
    { name: 'Online Store', sales: '$842K', orders: 3241, growth: '+15%', color: '#3b82f6' },
    { name: 'Amazon', sales: '$621K', orders: 2184, growth: '+22%', color: '#f59e0b' },
    { name: 'Retail Partners', sales: '$534K', orders: 892, growth: '+8%', color: '#10b981' },
    { name: 'Direct Sales', sales: '$403K', orders: 248, growth: '+12%', color: '#8b5cf6' }
  ]

  return (
    <div style={{
      backgroundColor: 'white',
      padding: '1.5rem',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      marginBottom: '1.5rem'
    }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        Multi-Channel Sales
      </h2>
      <div style={{ display: 'grid', gap: '1rem' }}>
        {channels.map((channel, index) => (
          <div key={index} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            backgroundColor: '#f9fafb',
            borderRadius: '6px',
            borderLeft: `4px solid ${channel.color}`
          }}>
            <div>
              <h3 style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{channel.name}</h3>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                {channel.orders} orders
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{channel.sales}</div>
              <div style={{ fontSize: '0.875rem', color: '#10b981' }}>{channel.growth}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{
        marginTop: '1rem',
        padding: '1rem',
        backgroundColor: '#eff6ff',
        borderRadius: '6px',
        textAlign: 'center'
      }}>
        <strong>Total Sales: $2.4M</strong> | Total Orders: 6,565 | Avg Growth: +14%
      </div>
    </div>
  )
}

export default SimpleMultiChannelSales