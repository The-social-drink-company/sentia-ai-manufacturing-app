import React from 'react'

const SimpleDemandForecast = () => {
  const forecastData = [
    { month: 'Jan', demand: 1200, forecast: 1180 },
    { month: 'Feb', demand: 1350, forecast: 1320 },
    { month: 'Mar', demand: 1400, forecast: 1450 },
    { month: 'Apr', demand: 1500, forecast: 1520 },
    { month: 'May', demand: 1650, forecast: 1700 },
    { month: 'Jun', demand: 1800, forecast: 1850 }
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
        Demand Forecast
      </h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ padding: '0.5rem', textAlign: 'left' }}>Month</th>
              <th style={{ padding: '0.5rem', textAlign: 'right' }}>Actual</th>
              <th style={{ padding: '0.5rem', textAlign: 'right' }}>Forecast</th>
              <th style={{ padding: '0.5rem', textAlign: 'right' }}>Variance</th>
            </tr>
          </thead>
          <tbody>
            {forecastData.map((row, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '0.5rem' }}>{row.month}</td>
                <td style={{ padding: '0.5rem', textAlign: 'right' }}>{row.demand}</td>
                <td style={{ padding: '0.5rem', textAlign: 'right' }}>{row.forecast}</td>
                <td style={{ 
                  padding: '0.5rem', 
                  textAlign: 'right',
                  color: row.forecast > row.demand ? '#10b981' : '#ef4444'
                }}>
                  {row.forecast > row.demand ? '+' : ''}{row.forecast - row.demand}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ 
        marginTop: '1rem', 
        padding: '0.75rem', 
        backgroundColor: '#f0fdf4',
        borderRadius: '6px',
        fontSize: '0.875rem',
        color: '#15803d'
      }}>
        Accuracy: 96.5% | Next Month Forecast: 1,920 units
      </div>
    </div>
  )
}

export default SimpleDemandForecast