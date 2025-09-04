import React from 'react'

const DataImport = () => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Page Header */}
      <div style={{ backgroundColor: 'white', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '1rem 2rem' }}>
          <div style={{ padding: '1.5rem 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ backgroundColor: '#dbeafe', padding: '0.5rem', borderRadius: '0.5rem' }}>
                  <svg style={{ height: '1.5rem', width: '1.5rem', color: '#2563eb' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                </div>
                <div>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>Data Import System</h1>
                  <p style={{ color: '#4b5563' }}>
                    Upload, validate, and import data into the manufacturing system
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {/* Upload Card */}
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '0.5rem', 
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            padding: '1.5rem'
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>File Upload</h3>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
              Drag and drop files or click to browse
            </p>
            <div style={{
              border: '2px dashed #d1d5db',
              borderRadius: '0.375rem',
              padding: '2rem',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s',
              ':hover': { borderColor: '#3b82f6' }
            }}>
              <svg style={{ height: '3rem', width: '3rem', color: '#9ca3af', margin: '0 auto' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p style={{ marginTop: '0.5rem', color: '#4b5563' }}>Drop files here or click to upload</p>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                CSV, XLS, XLSX up to 10MB
              </p>
            </div>
          </div>

          {/* Validation Status */}
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '0.5rem', 
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            padding: '1.5rem'
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>Validation Status</h3>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
              Real-time data validation results
            </p>
            <div style={{ space: '0.5rem' }}>
              <div style={{ padding: '0.75rem', backgroundColor: '#f0fdf4', borderRadius: '0.375rem', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: '#166534' }}>Format Check</span>
                  <span style={{ color: '#16a34a', fontSize: '0.875rem' }}>✓ Passed</span>
                </div>
              </div>
              <div style={{ padding: '0.75rem', backgroundColor: '#fef3c7', borderRadius: '0.375rem', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: '#92400e' }}>Data Integrity</span>
                  <span style={{ color: '#d97706', fontSize: '0.875rem' }}>⚠ Warnings</span>
                </div>
              </div>
              <div style={{ padding: '0.75rem', backgroundColor: '#f3f4f6', borderRadius: '0.375rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: '#4b5563' }}>Business Rules</span>
                  <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Pending</span>
                </div>
              </div>
            </div>
          </div>

          {/* Import History */}
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '0.5rem', 
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            padding: '1.5rem'
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>Recent Imports</h3>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
              Last 5 import operations
            </p>
            <div style={{ space: '0.25rem' }}>
              {[
                { file: 'inventory_jan2024.csv', status: 'success', date: '2024-01-15', records: 1250 },
                { file: 'sales_data_dec.xlsx', status: 'success', date: '2024-01-10', records: 3421 },
                { file: 'production_batch.csv', status: 'warning', date: '2024-01-08', records: 567 },
                { file: 'suppliers_update.xls', status: 'success', date: '2024-01-05', records: 89 },
                { file: 'forecast_q1.csv', status: 'error', date: '2024-01-03', records: 0 }
              ].map((item, index) => (
                <div key={index} style={{ 
                  padding: '0.75rem', 
                  borderBottom: index < 4 ? '1px solid #e5e7eb' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>{item.file}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{item.date}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      fontSize: '0.75rem',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '9999px',
                      display: 'inline-block',
                      backgroundColor: item.status === 'success' ? '#dcfce7' : item.status === 'warning' ? '#fef3c7' : '#fee2e2',
                      color: item.status === 'success' ? '#166534' : item.status === 'warning' ? '#92400e' : '#991b1b'
                    }}>
                      {item.status}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {item.records > 0 ? `${item.records} records` : 'Failed'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Import Queue */}
        <div style={{ 
          marginTop: '2rem',
          backgroundColor: 'white', 
          borderRadius: '0.5rem', 
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          padding: '1.5rem'
        }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Import Queue</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>File Name</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Type</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Size</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Status</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Progress</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>orders_batch_42.csv</td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>Orders</td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>2.4 MB</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{ 
                      fontSize: '0.75rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      backgroundColor: '#dbeafe',
                      color: '#1e40af'
                    }}>Processing</span>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{ width: '100px', backgroundColor: '#e5e7eb', borderRadius: '9999px', height: '6px' }}>
                      <div style={{ width: '75%', backgroundColor: '#3b82f6', height: '100%', borderRadius: '9999px' }}></div>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>75%</span>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <button style={{ 
                      padding: '0.25rem 0.75rem',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      borderRadius: '0.25rem',
                      border: 'none',
                      fontSize: '0.875rem',
                      cursor: 'pointer'
                    }}>Cancel</button>
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>warehouse_stock.xlsx</td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>Inventory</td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>1.8 MB</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{ 
                      fontSize: '0.75rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      backgroundColor: '#fef3c7',
                      color: '#92400e'
                    }}>Queued</span>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Waiting...</span>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <button style={{ 
                      padding: '0.25rem 0.75rem',
                      backgroundColor: '#6b7280',
                      color: 'white',
                      borderRadius: '0.25rem',
                      border: 'none',
                      fontSize: '0.875rem',
                      cursor: 'pointer'
                    }}>Remove</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DataImport