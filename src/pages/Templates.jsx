import React from 'react'

const Templates = () => {
  const templates = [
    { id: 1, name: 'Monthly Production Report', type: 'Report', category: 'Production', lastModified: '2024-01-15' },
    { id: 2, name: 'Inventory Analysis', type: 'Dashboard', category: 'Inventory', lastModified: '2024-01-12' },
    { id: 3, name: 'Sales Forecast Template', type: 'Forecast', category: 'Sales', lastModified: '2024-01-10' },
    { id: 4, name: 'Quality Control Checklist', type: 'Checklist', category: 'Quality', lastModified: '2024-01-08' },
    { id: 5, name: 'Supplier Performance', type: 'Report', category: 'Procurement', lastModified: '2024-01-05' }
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '2rem' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>
            Templates
          </h1>
          <p style={{ color: '#6b7280' }}>
            Pre-configured templates for reports, dashboards, and workflows
          </p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {templates.map(template => (
            <div key={template.id} style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              padding: '1.5rem',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              ':hover': { transform: 'translateY(-2px)' }
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>{template.name}</h3>
                <span style={{
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.75rem',
                  backgroundColor: '#e0e7ff',
                  color: '#3730a3',
                  borderRadius: '9999px'
                }}>
                  {template.type}
                </span>
              </div>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
                Category: {template.category}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                  Modified: {template.lastModified}
                </span>
                <button style={{
                  padding: '0.25rem 1rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  borderRadius: '0.25rem',
                  border: 'none',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}>
                  Use Template
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          padding: '1.5rem'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            Create New Template
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <button style={{
              padding: '2rem 1rem',
              backgroundColor: '#f3f4f6',
              borderRadius: '0.5rem',
              border: '2px dashed #d1d5db',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.2s'
            }}>
              <svg style={{ width: '2rem', height: '2rem', margin: '0 auto', color: '#6b7280' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v1a3 3 0 003 3h0a3 3 0 003-3v-1m3-12V4a3 3 0 00-3-3h0a3 3 0 00-3 3v1m-6 6h12M9 11l3 3 3-3" />
              </svg>
              <div style={{ marginTop: '1rem', fontWeight: '500' }}>Report Template</div>
            </button>
            <button style={{
              padding: '2rem 1rem',
              backgroundColor: '#f3f4f6',
              borderRadius: '0.5rem',
              border: '2px dashed #d1d5db',
              cursor: 'pointer',
              textAlign: 'center'
            }}>
              <svg style={{ width: '2rem', height: '2rem', margin: '0 auto', color: '#6b7280' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
              <div style={{ marginTop: '1rem', fontWeight: '500' }}>Dashboard Template</div>
            </button>
            <button style={{
              padding: '2rem 1rem',
              backgroundColor: '#f3f4f6',
              borderRadius: '0.5rem',
              border: '2px dashed #d1d5db',
              cursor: 'pointer',
              textAlign: 'center'
            }}>
              <svg style={{ width: '2rem', height: '2rem', margin: '0 auto', color: '#6b7280' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <div style={{ marginTop: '1rem', fontWeight: '500' }}>Workflow Template</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Templates