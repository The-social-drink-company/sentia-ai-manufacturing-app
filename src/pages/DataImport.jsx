import React, { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { dataIntegrationService } from '../services/dataIntegrationService'

const DataImport = () => {
  const [uploadStatus, setUploadStatus] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const fileInputRef = useRef(null)

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (!file.name.match(/\.(csv|xlsx|xls)$/i)) {
      setUploadStatus({
        type: 'error',
        message: 'Please upload a CSV or Excel file'
      })
      return
    }

    setIsUploading(true)
    setUploadStatus({ type: 'info', message: 'Processing file...' })

    try {
      const result = await dataIntegrationService.uploadDataFile(file, 'metrics')
      
      setUploadedFiles(prev => [...prev, {
        name: file.name,
        size: file.size,
        status: 'success',
        date: new Date().toISOString().split('T')[0],
        records: result.length || 0
      }])

      setUploadStatus({
        type: 'success',
        message: `Successfully uploaded ${file.name} with ${result.length || 0} records`
      })
    } catch (error) {
      setUploadStatus({
        type: 'error',
        message: `Failed to upload file: ${error.message}`
      })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* CSS Animations */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">SENTIA Manufacturing</h1>
            <nav className="flex gap-6">
              <Link to="/dashboard" className="text-gray-600 hover:text-gray-800 font-medium transition-colors">Dashboard</Link>
              <Link to="/ai-dashboard" className="text-gray-600 hover:text-gray-800 font-medium transition-colors">AI Dashboard</Link>
              <Link to="/working-capital" className="text-gray-600 hover:text-gray-800 font-medium transition-colors">Working Capital</Link>
              <Link to="/data-import" className="text-blue-600 hover:text-blue-800 font-medium transition-colors">Data Import</Link>
              <Link to="/admin" className="text-gray-600 hover:text-gray-800 font-medium transition-colors">Admin</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
              U
            </div>
          </div>
        </div>
      </header>

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
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".csv,.xlsx,.xls" 
              onChange={handleFileUpload}
              disabled={isUploading}
              style={{ display: 'none' }}
            />
            <div 
              style={{
                border: '2px dashed #d1d5db',
                borderRadius: '0.375rem',
                padding: '2rem',
                textAlign: 'center',
                cursor: isUploading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s',
                opacity: isUploading ? 0.5 : 1
              }}
              onClick={() => !isUploading && fileInputRef.current?.click()}
            >
              {isUploading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ 
                    width: '2rem', 
                    height: '2rem', 
                    border: '2px solid #3b82f6', 
                    borderTop: '2px solid transparent', 
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginBottom: '0.5rem'
                  }}></div>
                  <p style={{ color: '#3b82f6' }}>Processing file...</p>
                </div>
              ) : (
                <>
                  <svg style={{ height: '3rem', width: '3rem', color: '#9ca3af', margin: '0 auto' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p style={{ marginTop: '0.5rem', color: '#4b5563' }}>Drop files here or click to upload</p>
                  <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                    CSV, XLS, XLSX up to 10MB
                  </p>
                </>
              )}
            </div>
            
            {/* Upload Status */}
            {uploadStatus && (
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                borderRadius: '0.375rem',
                backgroundColor: uploadStatus.type === 'success' ? '#f0fdf4' : 
                               uploadStatus.type === 'error' ? '#fef2f2' : '#eff6ff',
                border: `1px solid ${uploadStatus.type === 'success' ? '#bbf7d0' : 
                                    uploadStatus.type === 'error' ? '#fecaca' : '#bfdbfe'}`
              }}>
                <p style={{ 
                  color: uploadStatus.type === 'success' ? '#166534' : 
                         uploadStatus.type === 'error' ? '#991b1b' : '#1e40af',
                  fontSize: '0.875rem'
                }}>
                  {uploadStatus.message}
                </p>
              </div>
            )}
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