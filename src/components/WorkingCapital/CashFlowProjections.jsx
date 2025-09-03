import React, { useState, useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import axios from 'axios'

function CashFlowProjections() {
  const { getToken } = useAuth()
  const [projectionData, setProjectionData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [projectionParams, setProjectionParams] = useState({
    horizonMonths: 12,
    currency: 'GBP',
    scenarios: ['baseline']
  })

  const generateProjection = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = await getToken()
      const headers = { Authorization: `Bearer ${token}` }

      const response = await axios.post('/api/working-capital/projections', {
        ...projectionParams,
        startMonth: new Date()
      }, { headers })

      setProjectionData(response.data.data)
    } catch (err) {
      console.error('Projection error:', err)
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    generateProjection()
  }, [])

  const handleParamChange = (param, value) => {
    setProjectionParams(prev => ({ ...prev, [param]: value }))
  }

  return (
    <div className="sentia-projections-container">
      {/* Projection Controls */}
      <div className="sentia-card">
        <div className="sentia-card-header">
          <h3 className="sentia-card-title">Projection Parameters</h3>
        </div>
        <div className="sentia-card-content">
          <div className="sentia-form-grid">
            <div className="sentia-form-group">
              <label className="sentia-label">Horizon (Months)</label>
              <select 
                className="sentia-select"
                value={projectionParams.horizonMonths}
                onChange={(e) => handleParamChange('horizonMonths', parseInt(e.target.value))}
              >
                <option value={3}>3 Months</option>
                <option value={6}>6 Months</option>
                <option value={12}>12 Months</option>
                <option value={24}>24 Months</option>
              </select>
            </div>
            <div className="sentia-form-group">
              <label className="sentia-label">Currency</label>
              <select 
                className="sentia-select"
                value={projectionParams.currency}
                onChange={(e) => handleParamChange('currency', e.target.value)}
              >
                <option value="GBP">GBP (£)</option>
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>
            <div className="sentia-form-group">
              <button 
                className="sentia-btn sentia-btn-primary"
                onClick={generateProjection}
                disabled={loading}
              >
                {loading ? 'Generating...' : 'Generate Projection'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="sentia-error">
          <div className="sentia-error-content">
            <h4>Projection Error</h4>
            <p>{error}</p>
            <button onClick={generateProjection} className="sentia-btn sentia-btn-secondary">
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="sentia-card">
          <div className="sentia-card-content">
            <div className="sentia-loading">
              <div className="sentia-spinner"></div>
              <p>Generating cash flow projections...</p>
            </div>
          </div>
        </div>
      )}

      {/* Projection Results */}
      {projectionData && !loading && (
        <>
          {/* Summary Cards */}
          <div className="sentia-grid sentia-grid-3">
            <div className="sentia-card">
              <div className="sentia-card-header">
                <h4 className="sentia-card-title">Total Cash In</h4>
              </div>
              <div className="sentia-card-content">
                <div className="sentia-metric">
                  <span className="sentia-metric-value">
                    £{projectionData.scenarios.baseline.summary.totalCashIn.toLocaleString()}
                  </span>
                  <span className="sentia-metric-label">
                    Over {projectionParams.horizonMonths} months
                  </span>
                </div>
              </div>
            </div>

            <div className="sentia-card">
              <div className="sentia-card-header">
                <h4 className="sentia-card-title">Total Cash Out</h4>
              </div>
              <div className="sentia-card-content">
                <div className="sentia-metric">
                  <span className="sentia-metric-value">
                    £{projectionData.scenarios.baseline.summary.totalCashOut.toLocaleString()}
                  </span>
                  <span className="sentia-metric-label">
                    Over {projectionParams.horizonMonths} months
                  </span>
                </div>
              </div>
            </div>

            <div className="sentia-card">
              <div className="sentia-card-header">
                <h4 className="sentia-card-title">Net Cash Flow</h4>
              </div>
              <div className="sentia-card-content">
                <div className="sentia-metric">
                  <span className={`sentia-metric-value ${projectionData.scenarios.baseline.summary.netCashFlow >= 0 ? 'sentia-positive' : 'sentia-negative'}`}>
                    £{projectionData.scenarios.baseline.summary.netCashFlow.toLocaleString()}
                  </span>
                  <span className="sentia-metric-label">
                    Net over {projectionParams.horizonMonths} months
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Cash Flow Table */}
          <div className="sentia-card">
            <div className="sentia-card-header">
              <h3 className="sentia-card-title">Monthly Cash Flow Projections</h3>
            </div>
            <div className="sentia-card-content">
              <div className="sentia-table-container">
                <table className="sentia-table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Opening Cash</th>
                      <th>Cash In</th>
                      <th>Cash Out</th>
                      <th>Net Change</th>
                      <th>Ending Cash</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectionData.scenarios.baseline.projections.map((projection, index) => {
                      const monthName = new Date(projection.month).toLocaleDateString('en-GB', { 
                        month: 'short', 
                        year: 'numeric' 
                      })
                      const isLowCash = projection.ending_cash < 50000 // Minimum cash buffer
                      
                      return (
                        <tr key={projection.id}>
                          <td>{monthName}</td>
                          <td>£{projection.openingCash ? projection.openingCash.toLocaleString() : '0'}</td>
                          <td className="sentia-positive">£{projection.cash_in.toLocaleString()}</td>
                          <td className="sentia-negative">£{projection.cash_out.toLocaleString()}</td>
                          <td className={projection.net_change >= 0 ? 'sentia-positive' : 'sentia-negative'}>
                            £{projection.net_change.toLocaleString()}
                          </td>
                          <td className={isLowCash ? 'sentia-negative' : 'sentia-positive'}>
                            £{projection.ending_cash.toLocaleString()}
                          </td>
                          <td>
                            {isLowCash && (
                              <span className="sentia-status sentia-status-error">Low Cash</span>
                            )}
                            {!isLowCash && projection.net_change >= 0 && (
                              <span className="sentia-status sentia-status-success">Healthy</span>
                            )}
                            {!isLowCash && projection.net_change < 0 && (
                              <span className="sentia-status sentia-status-warning">Declining</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Risk Analysis */}
          {projectionData.scenarios.baseline.summary.breachMonths > 0 && (
            <div className="sentia-card">
              <div className="sentia-card-header">
                <h3 className="sentia-card-title">Risk Analysis</h3>
              </div>
              <div className="sentia-card-content">
                <div className="sentia-alert sentia-alert-warning">
                  <div className="sentia-alert-content">
                    <div className="sentia-alert-message">
                      WARNING: Cash falls below minimum buffer in {projectionData.scenarios.baseline.summary.breachMonths} months
                    </div>
                    <div className="sentia-alert-details">
                      Minimum cash level: £{projectionData.scenarios.baseline.summary.minCash.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!projectionData && !loading && !error && (
        <div className="sentia-card">
          <div className="sentia-card-content">
            <div className="sentia-empty-state">
              <p>No projection data available</p>
              <small>Click "Generate Projection" to create cash flow projections</small>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CashFlowProjections