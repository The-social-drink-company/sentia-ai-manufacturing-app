import React, { useState, useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import axios from 'axios'

function SystemDiagnostics({ dashboardData }) {
  const { getToken } = useAuth()
  const [diagnosticsData, setDiagnosticsData] = useState(dashboardData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const refreshDiagnostics = async () => {
    try {
      setRefreshing(true)
      setError(null)

      const token = await getToken()
      const headers = { Authorization: `Bearer ${token}` }

      const response = await axios.get('/api/working-capital/diagnostics', { headers })
      setDiagnosticsData(response.data.data)
    } catch (err) {
      console.error('Diagnostics refresh error:', err)
      setError(err.response?.data?.error || err.message)
    } finally {
      setRefreshing(false)
    }
  }

  const getHealthScoreColor = (score) => {
    if (score >= 80) return 'sentia-excellent'
    if (score >= 60) return 'sentia-good'
    if (score >= 40) return 'sentia-warning'
    return 'sentia-critical'
  }

  const getStatusColor = (status) => {
    if (status === 'healthy' || status === 'excellent' || status === 'optimal') return 'sentia-status-success'
    if (status === 'good' || status === 'acceptable') return 'sentia-status-warning'
    return 'sentia-status-error'
  }

  if (!diagnosticsData && !loading) {
    return (
      <div className="sentia-card">
        <div className="sentia-card-content">
          <div className="sentia-empty-state">
            <p>No diagnostics data available</p>
            <button onClick={refreshDiagnostics} className="sentia-btn sentia-btn-primary">
              Load Diagnostics
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="sentia-diagnostics-container">
      {/* System Health Overview */}
      <div className="sentia-card">
        <div className="sentia-card-header">
          <h3 className="sentia-card-title">System Health Overview</h3>
          <div className={`sentia-card-badge ${getHealthScoreColor(diagnosticsData?.overallHealthScore || 0)}`}>
            {diagnosticsData?.overallHealthScore || 0}/100
          </div>
        </div>
        <div className="sentia-card-content">
          <div className="sentia-health-grid">
            <div className="sentia-health-item">
              <div className="sentia-health-icon">💾</div>
              <div className="sentia-health-content">
                <div className="sentia-health-label">Database</div>
                <div className={`sentia-status ${getStatusColor(diagnosticsData?.systemHealth?.overallStatus)}`}>
                  {diagnosticsData?.systemHealth?.overallStatus || 'unknown'}
                </div>
                <div className="sentia-health-detail">
                  {diagnosticsData?.systemHealth?.database?.message || 'No status available'}
                </div>
              </div>
            </div>

            <div className="sentia-health-item">
              <div className="sentia-health-icon">🧮</div>
              <div className="sentia-health-content">
                <div className="sentia-health-label">Calculations</div>
                <div className={`sentia-status ${getStatusColor(diagnosticsData?.systemHealth?.calculations?.status)}`}>
                  {diagnosticsData?.systemHealth?.calculations?.status || 'unknown'}
                </div>
                <div className="sentia-health-detail">
                  {diagnosticsData?.systemHealth?.calculations?.message || 'No status available'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Quality Assessment */}
      <div className="sentia-grid sentia-grid-2">
        <div className="sentia-card">
          <div className="sentia-card-header">
            <h3 className="sentia-card-title">Data Quality</h3>
            <div className={`sentia-card-badge ${getHealthScoreColor(diagnosticsData?.dataQuality?.overallScore || 0)}`}>
              {diagnosticsData?.dataQuality?.overallScore || 0}/100
            </div>
          </div>
          <div className="sentia-card-content">
            <div className="sentia-data-quality-grid">
              <div className="sentia-quality-item">
                <div className="sentia-quality-label">Product Coverage</div>
                <div className={`sentia-status ${getStatusColor(diagnosticsData?.dataQuality?.productCoverage?.status)}`}>
                  {diagnosticsData?.dataQuality?.productCoverage?.status || 'unknown'}
                </div>
                <div className="sentia-quality-detail">
                  {diagnosticsData?.dataQuality?.productCoverage?.count || 0} products
                </div>
              </div>

              <div className="sentia-quality-item">
                <div className="sentia-quality-label">Sales Data</div>
                <div className={`sentia-status ${getStatusColor(diagnosticsData?.dataQuality?.salesDataFreshness?.status)}`}>
                  {diagnosticsData?.dataQuality?.salesDataFreshness?.status || 'unknown'}
                </div>
                <div className="sentia-quality-detail">
                  {diagnosticsData?.dataQuality?.salesDataFreshness?.recentSalesCount || 0} recent sales
                </div>
              </div>

              <div className="sentia-quality-item">
                <div className="sentia-quality-label">Forecasts</div>
                <div className={`sentia-status ${getStatusColor(diagnosticsData?.dataQuality?.forecastCoverage?.status)}`}>
                  {diagnosticsData?.dataQuality?.forecastCoverage?.status || 'unknown'}
                </div>
                <div className="sentia-quality-detail">
                  {diagnosticsData?.dataQuality?.forecastCoverage?.count || 0} forecasts
                </div>
              </div>

              <div className="sentia-quality-item">
                <div className="sentia-quality-label">Inventory Data</div>
                <div className={`sentia-status ${getStatusColor(diagnosticsData?.dataQuality?.inventoryDataFreshness?.status)}`}>
                  {diagnosticsData?.dataQuality?.inventoryDataFreshness?.status || 'unknown'}
                </div>
                <div className="sentia-quality-detail">
                  {diagnosticsData?.dataQuality?.inventoryDataFreshness?.recentInventoryCount || 0} recent records
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Model Accuracy */}
        <div className="sentia-card">
          <div className="sentia-card-header">
            <h3 className="sentia-card-title">Model Accuracy</h3>
            <div className={`sentia-card-badge ${getStatusColor(diagnosticsData?.modelAccuracy?.overallAccuracy)}`}>
              {diagnosticsData?.modelAccuracy?.overallAccuracy || 'unknown'}
            </div>
          </div>
          <div className="sentia-card-content">
            <div className="sentia-accuracy-grid">
              <div className="sentia-accuracy-item">
                <div className="sentia-accuracy-label">Forecast Accuracy</div>
                <div className="sentia-accuracy-value">
                  {diagnosticsData?.modelAccuracy?.forecastAccuracy?.mape || 0}% MAPE
                </div>
                <div className={`sentia-status ${getStatusColor(diagnosticsData?.modelAccuracy?.forecastAccuracy?.status)}`}>
                  {diagnosticsData?.modelAccuracy?.forecastAccuracy?.status || 'unknown'}
                </div>
              </div>

              <div className="sentia-accuracy-item">
                <div className="sentia-accuracy-label">Cash Flow Accuracy</div>
                <div className="sentia-accuracy-value">
                  {diagnosticsData?.modelAccuracy?.cashFlowAccuracy?.variance || 0}% variance
                </div>
                <div className={`sentia-status ${getStatusColor(diagnosticsData?.modelAccuracy?.cashFlowAccuracy?.status)}`}>
                  {diagnosticsData?.modelAccuracy?.cashFlowAccuracy?.status || 'unknown'}
                </div>
              </div>

              <div className="sentia-accuracy-detail">
                Last validation: {diagnosticsData?.modelAccuracy?.lastValidation 
                  ? new Date(diagnosticsData.modelAccuracy.lastValidation).toLocaleDateString('en-GB')
                  : 'Never'
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="sentia-card">
        <div className="sentia-card-header">
          <h3 className="sentia-card-title">Performance Metrics</h3>
          <div className={`sentia-card-badge ${getStatusColor(diagnosticsData?.performanceMetrics?.status)}`}>
            {diagnosticsData?.performanceMetrics?.status || 'unknown'}
          </div>
        </div>
        <div className="sentia-card-content">
          <div className="sentia-grid sentia-grid-4">
            <div className="sentia-metric-card">
              <div className="sentia-metric-label">Avg Calculation Time</div>
              <div className="sentia-metric-value">
                {diagnosticsData?.performanceMetrics?.averageCalculationTime || 0}s
              </div>
            </div>
            <div className="sentia-metric-card">
              <div className="sentia-metric-label">Cache Hit Rate</div>
              <div className="sentia-metric-value">
                {((diagnosticsData?.performanceMetrics?.cacheHitRate || 0) * 100).toFixed(1)}%
              </div>
            </div>
            <div className="sentia-metric-card">
              <div className="sentia-metric-label">Memory Usage</div>
              <div className="sentia-metric-value">
                {diagnosticsData?.performanceMetrics?.memoryUsage || 0}MB
              </div>
            </div>
            <div className="sentia-metric-card">
              <div className="sentia-metric-label">Concurrent Users</div>
              <div className="sentia-metric-value">
                {diagnosticsData?.performanceMetrics?.concurrentUsers || 0}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Alerts */}
      <div className="sentia-card">
        <div className="sentia-card-header">
          <h3 className="sentia-card-title">System Alerts</h3>
          <div className="sentia-card-badge">{diagnosticsData?.alerts?.length || 0}</div>
        </div>
        <div className="sentia-card-content">
          {diagnosticsData?.alerts && diagnosticsData.alerts.length > 0 ? (
            <div className="sentia-alerts-list">
              {diagnosticsData.alerts.map((alert, index) => (
                <div key={index} className={`sentia-alert sentia-alert-${alert.level}`}>
                  <div className="sentia-alert-content">
                    <div className="sentia-alert-header">
                      <span className="sentia-alert-type">{alert.type}</span>
                      <span className="sentia-alert-timestamp">
                        {new Date(alert.timestamp).toLocaleString('en-GB')}
                      </span>
                    </div>
                    <div className="sentia-alert-message">{alert.message}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="sentia-empty-state">
              <p>No active alerts</p>
              <small>System is running normally with no issues detected</small>
            </div>
          )}
        </div>
      </div>

      {/* System Recommendations */}
      <div className="sentia-card">
        <div className="sentia-card-header">
          <h3 className="sentia-card-title">System Recommendations</h3>
          <div className="sentia-card-badge">{diagnosticsData?.recommendations?.length || 0}</div>
        </div>
        <div className="sentia-card-content">
          {diagnosticsData?.recommendations && diagnosticsData.recommendations.length > 0 ? (
            <div className="sentia-recommendations-list">
              {diagnosticsData.recommendations.map((rec, index) => (
                <div key={index} className={`sentia-recommendation sentia-priority-${rec.priority}`}>
                  <div className="sentia-recommendation-content">
                    <div className="sentia-recommendation-header">
                      <span className="sentia-recommendation-title">{rec.title}</span>
                      <div className="sentia-recommendation-badges">
                        <span className={`sentia-badge sentia-priority-${rec.priority}`}>
                          {rec.priority}
                        </span>
                        <span className="sentia-badge sentia-effort-{rec.estimatedEffort}">
                          {rec.estimatedEffort} effort
                        </span>
                      </div>
                    </div>
                    <div className="sentia-recommendation-description">
                      {rec.description}
                    </div>
                    <div className="sentia-recommendation-category">
                      Category: {rec.category}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="sentia-empty-state">
              <p>No system recommendations</p>
              <small>System is optimally configured with no immediate actions required</small>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="sentia-error">
          <div className="sentia-error-content">
            <h4>Diagnostics Error</h4>
            <p>{error}</p>
            <button onClick={refreshDiagnostics} className="sentia-btn sentia-btn-secondary">
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="sentia-dashboard-actions">
        <button 
          onClick={refreshDiagnostics} 
          className="sentia-btn sentia-btn-primary"
          disabled={refreshing}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {refreshing ? 'Refreshing...' : 'Refresh Diagnostics'}
        </button>
      </div>
    </div>
  )
}

export default SystemDiagnostics