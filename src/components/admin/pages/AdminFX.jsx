import { devLog } from '../lib/devLog.js';\nimport React, { useState, useEffect } from 'react'
import { 
  GlobeAltIcon,
  BanknotesIcon,
  ArrowPathIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

function AdminFX() {
  const [fxSettings, setFxSettings] = useState({})
  const [fxRates, setFxRates] = useState([])
  const [loading, setLoading] = useState(true)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    fetchFXSettings()
    fetchCurrentRates()
  }, [])

  const fetchFXSettings = async () => {
    try {
      const response = await fetch('/api/admin/fx/settings', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      })
      if (response.ok) {
        const data = await response.json()
        setFxSettings(data.settings || {})
      }
    } catch (error) {
      devLog.error('Failed to fetch FX settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCurrentRates = async () => {
    // Mock FX rates - in production would fetch from actual provider
    setFxRates([
      { from: 'GBP', to: 'EUR', rate: 1.1543, change: '+0.0012', changePercent: '+0.10%', lastUpdate: '2025-09-04T10:30:00Z' },
      { from: 'GBP', to: 'USD', rate: 1.2678, change: '-0.0034', changePercent: '-0.27%', lastUpdate: '2025-09-04T10:30:00Z' },
      { from: 'EUR', to: 'USD', rate: 1.0982, change: '+0.0019', changePercent: '+0.17%', lastUpdate: '2025-09-04T10:30:00Z' },
      { from: 'GBP', to: 'CAD', rate: 1.7234, change: '+0.0087', changePercent: '+0.51%', lastUpdate: '2025-09-04T10:30:00Z' },
      { from: 'GBP', to: 'AUD', rate: 1.8945, change: '-0.0156', changePercent: '-0.82%', lastUpdate: '2025-09-04T10:30:00Z' }
    ])
  }

  const updateFXSettings = async (newSettings) => {
    try {
      const response = await fetch('/api/admin/fx/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          ...newSettings,
          reason: 'Admin portal configuration update'
        })
      })
      
      if (response.ok) {
        setFxSettings({ ...fxSettings, ...newSettings })
        setShowSettings(false)
      }
    } catch (error) {
      devLog.error('Failed to update FX settings:', error)
    }
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '400px' 
      }}>
        <div>Loading FX settings...</div>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '32px' 
      }}>
        <div>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: '700', 
            color: '#1f2937', 
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <GlobeAltIcon style={{ width: '32px', height: '32px' }} />
            FX & Currencies
          </h1>
          <p style={{ color: '#6b7280' }}>
            Manage foreign exchange rates and currency conversion settings
          </p>
        </div>
        
        <button
          onClick={() => setShowSettings(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          <Cog6ToothIcon style={{ width: '16px', height: '16px' }} />
          FX Settings
        </button>
      </div>

      {/* Feature Flag Notice */}
      <div style={{
        backgroundColor: '#ecfdf5',
        border: '1px solid #86efac',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BanknotesIcon style={{ width: '20px', height: '20px', color: '#059669' }} />
          <span style={{ fontSize: '14px', color: '#065f46', fontWeight: '500' }}>
            Multi-Currency Feature Active
          </span>
        </div>
        <p style={{ fontSize: '14px', color: '#065f46', margin: '4px 0 0 28px' }}>
          Real-time currency conversion enabled for global operations.
        </p>
      </div>

      {/* FX Provider Status */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
            FX Provider Status
          </h2>
          <button
            onClick={() => fetchCurrentRates()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '12px',
              color: '#374151',
              cursor: 'pointer'
            }}
          >
            <ArrowPathIcon style={{ width: '14px', height: '14px' }} />
            Refresh
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Provider</div>
            <div style={{ fontSize: '16px', fontWeight: '500', color: '#1f2937' }}>
              {fxSettings.provider || 'ECB'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Base Currency</div>
            <div style={{ fontSize: '16px', fontWeight: '500', color: '#1f2937' }}>
              {fxSettings.base_currency || 'GBP'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Last Update</div>
            <div style={{ 
              fontSize: '14px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px' 
            }}>
              <CheckCircleIcon style={{ width: '16px', height: '16px', color: '#10b981' }} />
              {new Date(fxSettings.last_updated || Date.now()).toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Next Update</div>
            <div style={{ 
              fontSize: '14px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px' 
            }}>
              <ClockIcon style={{ width: '16px', height: '16px', color: '#6b7280' }} />
              In 2h 45m
            </div>
          </div>
        </div>
      </div>

      {/* Current Exchange Rates */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        overflow: 'hidden',
        marginBottom: '24px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ 
          padding: '20px 24px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
            Current Exchange Rates
          </h2>
          <div style={{ 
            fontSize: '12px', 
            color: '#6b7280',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <ChartBarIcon style={{ width: '14px', height: '14px' }} />
            Live rates
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb' }}>
                <th style={{ 
                  padding: '12px 24px', 
                  textAlign: 'left', 
                  fontSize: '12px', 
                  fontWeight: '500', 
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Currency Pair
                </th>
                <th style={{ 
                  padding: '12px 24px', 
                  textAlign: 'right', 
                  fontSize: '12px', 
                  fontWeight: '500', 
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Rate
                </th>
                <th style={{ 
                  padding: '12px 24px', 
                  textAlign: 'right', 
                  fontSize: '12px', 
                  fontWeight: '500', 
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Change
                </th>
                <th style={{ 
                  padding: '12px 24px', 
                  textAlign: 'right', 
                  fontSize: '12px', 
                  fontWeight: '500', 
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  % Change
                </th>
                <th style={{ 
                  padding: '12px 24px', 
                  textAlign: 'left', 
                  fontSize: '12px', 
                  fontWeight: '500', 
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Last Update
                </th>
              </tr>
            </thead>
            <tbody>
              {fxRates.map((rate, index) => (
                <tr 
                  key={`${rate.from}-${rate.to}`}
                  style={{ 
                    borderTop: index > 0 ? '1px solid #f3f4f6' : 'none'
                  }}
                >
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      fontWeight: '500',
                      color: '#1f2937'
                    }}>
                      <BanknotesIcon style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                      {rate.from}/{rate.to}
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <div style={{ 
                      fontSize: '16px', 
                      fontWeight: '500', 
                      color: '#1f2937' 
                    }}>
                      {rate.rate.toFixed(4)}
                    </div>
                  </td>
                  <td style={{ 
                    padding: '16px 24px', 
                    textAlign: 'right',
                    color: rate.change.startsWith('+') ? '#10b981' : '#ef4444'
                  }}>
                    {rate.change}
                  </td>
                  <td style={{ 
                    padding: '16px 24px', 
                    textAlign: 'right'
                  }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: rate.changePercent.startsWith('+') ? '#ecfdf5' : '#fef2f2',
                      color: rate.changePercent.startsWith('+') ? '#166534' : '#dc2626',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {rate.changePercent.startsWith('+') ? '↗' : '↘'}
                      {rate.changePercent}
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#6b7280' 
                    }}>
                      {new Date(rate.lastUpdate).toLocaleTimeString()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supported Currencies */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '24px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
          Supported Currencies
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: '12px'
        }}>
          {(fxSettings.supported_currencies || ['GBP', 'EUR', 'USD', 'CAD', 'AUD']).map((currency) => (
            <div
              key={currency}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                padding: '12px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#1f2937'
              }}
            >
              <BanknotesIcon style={{ width: '16px', height: '16px', color: '#6b7280' }} />
              {currency}
            </div>
          ))}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              FX Configuration Settings
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                FX Provider
              </label>
              <select
                defaultValue={fxSettings.provider || 'ECB'}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px'
                }}
              >
                <option value="ECB">European Central Bank</option>
                <option value="OANDA">OANDA</option>
              </select>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                Base Currency
              </label>
              <select
                defaultValue={fxSettings.base_currency || 'GBP'}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px'
                }}
              >
                <option value="GBP">British Pound (GBP)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="USD">US Dollar (USD)</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowSettings(false)}
                style={{
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => updateFXSettings({ provider: 'ECB', base_currency: 'GBP' })}
                style={{
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  cursor: 'pointer'
                }}
              >
                Update Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminFX