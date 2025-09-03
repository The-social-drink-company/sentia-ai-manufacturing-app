import React, { useState, useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import axios from 'axios'

function KPIDashboard() {
  const { getToken } = useAuth()
  const [kpiData, setKpiData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [timeframe, setTimeframe] = useState(12) // months

  const fetchKPITrends = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = await getToken()
      const headers = { Authorization: `Bearer ${token}` }

      const response = await axios.get(`/api/working-capital/kpis/trends?months=${timeframe}`, { headers })
      setKpiData(response.data.data)
    } catch (err) {
      console.error('KPI fetch error:', err)
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKPITrends()
  }, [timeframe])

  // Calculate KPI status based on targets
  const getKPIStatus = (kpiName, value) => {
    const targets = {
      ccc: { excellent: 45, good: 55, threshold: 65 }, // Cash Conversion Cycle - lower is better
      dso: { excellent: 30, good: 35, threshold: 45 }, // Days Sales Outstanding - lower is better  
      dpo: { excellent: 30, good: 25, threshold: 20 }, // Days Payable Outstanding - higher is better
      dio: { excellent: 40, good: 45, threshold: 55 }, // Days Inventory Outstanding - lower is better
      inv_turnover: { excellent: 8, good: 6, threshold: 4 }, // Inventory Turnover - higher is better
      wc_turnover: { excellent: 6.5, good: 5, threshold: 3.5 }, // Working Capital Turnover - higher is better
      facility_utilization: { excellent: 0.3, good: 0.6, threshold: 0.8 } // Facility Utilization - lower is better
    }

    const target = targets[kpiName]
    if (!target || value === null || value === undefined) return 'unknown'

    // Metrics where lower is better
    if (['ccc', 'dso', 'dio', 'facility_utilization'].includes(kpiName)) {
      if (value <= target.excellent) return 'excellent'
      if (value <= target.good) return 'good' 
      if (value <= target.threshold) return 'warning'
      return 'critical'
    }
    
    // Metrics where higher is better  
    if (['dpo', 'inv_turnover', 'wc_turnover'].includes(kpiName)) {
      if (value >= target.excellent) return 'excellent'
      if (value >= target.good) return 'good'
      if (value >= target.threshold) return 'warning'
      return 'critical'
    }

    return 'unknown'
  }

  const formatKPIValue = (kpiName, value) => {
    if (value === null || value === undefined) return 'N/A'
    
    if (kpiName === 'facility_utilization') {
      return `${(value * 100).toFixed(1)}%`
    }
    
    if (['inv_turnover', 'wc_turnover'].includes(kpiName)) {
      return `${value.toFixed(1)}x`
    }
    
    return `${value.toFixed(1)} days`
  }

  const getLatestKPIs = () => {
    if (!kpiData?.trends || kpiData.trends.length === 0) return null
    
    // Return most recent KPI data
    return kpiData.trends[kpiData.trends.length - 1]
  }

  const latestKPIs = getLatestKPIs()

  return (
    <div className="sentia-kpi-container">
      {/* KPI Controls */}
      <div className="sentia-card">
        <div className="sentia-card-header">
          <h3 className="sentia-card-title">KPI Analysis</h3>
        </div>
        <div className="sentia-card-content">
          <div className="sentia-form-grid">
            <div className="sentia-form-group">
              <label className="sentia-label">Time Period</label>
              <select 
                className="sentia-select"
                value={timeframe}
                onChange={(e) => setTimeframe(parseInt(e.target.value))}
              >
                <option value={3}>Last 3 Months</option>
                <option value={6}>Last 6 Months</option>
                <option value={12}>Last 12 Months</option>
                <option value={24}>Last 24 Months</option>
              </select>
            </div>
            <div className="sentia-form-group">
              <button 
                className="sentia-btn sentia-btn-primary"
                onClick={fetchKPITrends}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Refresh KPIs'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="sentia-error">
          <div className="sentia-error-content">
            <h4>KPI Loading Error</h4>
            <p>{error}</p>
            <button onClick={fetchKPITrends} className="sentia-btn sentia-btn-secondary">
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
              <p>Loading KPI trends...</p>
            </div>
          </div>
        </div>
      )}

      {/* Current KPIs */}
      {latestKPIs && !loading && (
        <>
          {/* KPI Summary Cards */}
          <div className="sentia-grid sentia-grid-4">
            {/* Cash Conversion Cycle */}
            <div className="sentia-card">
              <div className="sentia-card-header">
                <h4 className="sentia-card-title">Cash Conversion Cycle</h4>
                <div className={`sentia-kpi-status sentia-status-${getKPIStatus('ccc', latestKPIs.ccc)}`}>
                  {getKPIStatus('ccc', latestKPIs.ccc)}
                </div>
              </div>
              <div className="sentia-card-content">
                <div className="sentia-metric">
                  <span className="sentia-metric-value">
                    {formatKPIValue('ccc', latestKPIs.ccc)}
                  </span>
                  <span className="sentia-metric-label">
                    Target: &lt;55 days
                  </span>
                </div>
              </div>
            </div>

            {/* Days Sales Outstanding */}
            <div className="sentia-card">
              <div className="sentia-card-header">
                <h4 className="sentia-card-title">Days Sales Outstanding</h4>
                <div className={`sentia-kpi-status sentia-status-${getKPIStatus('dso', latestKPIs.dso)}`}>
                  {getKPIStatus('dso', latestKPIs.dso)}
                </div>
              </div>
              <div className="sentia-card-content">
                <div className="sentia-metric">
                  <span className="sentia-metric-value">
                    {formatKPIValue('dso', latestKPIs.dso)}
                  </span>
                  <span className="sentia-metric-label">
                    Target: &lt;35 days
                  </span>
                </div>
              </div>
            </div>

            {/* Days Payable Outstanding */}
            <div className="sentia-card">
              <div className="sentia-card-header">
                <h4 className="sentia-card-title">Days Payable Outstanding</h4>
                <div className={`sentia-kpi-status sentia-status-${getKPIStatus('dpo', latestKPIs.dpo)}`}>
                  {getKPIStatus('dpo', latestKPIs.dpo)}
                </div>
              </div>
              <div className="sentia-card-content">
                <div className="sentia-metric">
                  <span className="sentia-metric-value">
                    {formatKPIValue('dpo', latestKPIs.dpo)}
                  </span>
                  <span className="sentia-metric-label">
                    Target: &gt;25 days
                  </span>
                </div>
              </div>
            </div>

            {/* Days Inventory Outstanding */}
            <div className="sentia-card">
              <div className="sentia-card-header">
                <h4 className="sentia-card-title">Days Inventory Outstanding</h4>
                <div className={`sentia-kpi-status sentia-status-${getKPIStatus('dio', latestKPIs.dio)}`}>
                  {getKPIStatus('dio', latestKPIs.dio)}
                </div>
              </div>
              <div className="sentia-card-content">
                <div className="sentia-metric">
                  <span className="sentia-metric-value">
                    {formatKPIValue('dio', latestKPIs.dio)}
                  </span>
                  <span className="sentia-metric-label">
                    Target: &lt;45 days
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary KPIs */}
          <div className="sentia-grid sentia-grid-3">
            {/* Inventory Turnover */}
            <div className="sentia-card">
              <div className="sentia-card-header">
                <h4 className="sentia-card-title">Inventory Turnover</h4>
                <div className={`sentia-kpi-status sentia-status-${getKPIStatus('inv_turnover', latestKPIs.inv_turnover)}`}>
                  {getKPIStatus('inv_turnover', latestKPIs.inv_turnover)}
                </div>
              </div>
              <div className="sentia-card-content">
                <div className="sentia-metric">
                  <span className="sentia-metric-value">
                    {formatKPIValue('inv_turnover', latestKPIs.inv_turnover)}
                  </span>
                  <span className="sentia-metric-label">
                    Target: &gt;8x annually
                  </span>
                </div>
              </div>
            </div>

            {/* Working Capital Turnover */}
            <div className="sentia-card">
              <div className="sentia-card-header">
                <h4 className="sentia-card-title">WC Turnover</h4>
                <div className={`sentia-kpi-status sentia-status-${getKPIStatus('wc_turnover', latestKPIs.wc_turnover)}`}>
                  {getKPIStatus('wc_turnover', latestKPIs.wc_turnover)}
                </div>
              </div>
              <div className="sentia-card-content">
                <div className="sentia-metric">
                  <span className="sentia-metric-value">
                    {formatKPIValue('wc_turnover', latestKPIs.wc_turnover)}
                  </span>
                  <span className="sentia-metric-label">
                    Target: &gt;6.5x annually
                  </span>
                </div>
              </div>
            </div>

            {/* Credit Facility Utilization */}
            <div className="sentia-card">
              <div className="sentia-card-header">
                <h4 className="sentia-card-title">Credit Utilization</h4>
                <div className={`sentia-kpi-status sentia-status-${getKPIStatus('facility_utilization', latestKPIs.facility_utilization)}`}>
                  {getKPIStatus('facility_utilization', latestKPIs.facility_utilization)}
                </div>
              </div>
              <div className="sentia-card-content">
                <div className="sentia-metric">
                  <span className="sentia-metric-value">
                    {formatKPIValue('facility_utilization', latestKPIs.facility_utilization)}
                  </span>
                  <span className="sentia-metric-label">
                    Target: &lt;60%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* KPI Trends Table */}
          {kpiData.trends.length > 1 && (
            <div className="sentia-card">
              <div className="sentia-card-header">
                <h3 className="sentia-card-title">KPI Trends</h3>
                <div className="sentia-card-badge">{kpiData.trends.length} data points</div>
              </div>
              <div className="sentia-card-content">
                <div className="sentia-table-container">
                  <table className="sentia-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>CCC</th>
                        <th>DSO</th>
                        <th>DPO</th>
                        <th>DIO</th>
                        <th>Inv Turnover</th>
                        <th>WC Turnover</th>
                        <th>Credit Util</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kpiData.trends.slice(-10).reverse().map((trend, index) => (
                        <tr key={index}>
                          <td>{new Date(trend.createdAt).toLocaleDateString('en-GB')}</td>
                          <td className={`sentia-kpi-cell sentia-${getKPIStatus('ccc', trend.ccc)}`}>
                            {formatKPIValue('ccc', trend.ccc)}
                          </td>
                          <td className={`sentia-kpi-cell sentia-${getKPIStatus('dso', trend.dso)}`}>
                            {formatKPIValue('dso', trend.dso)}
                          </td>
                          <td className={`sentia-kpi-cell sentia-${getKPIStatus('dpo', trend.dpo)}`}>
                            {formatKPIValue('dpo', trend.dpo)}
                          </td>
                          <td className={`sentia-kpi-cell sentia-${getKPIStatus('dio', trend.dio)}`}>
                            {formatKPIValue('dio', trend.dio)}
                          </td>
                          <td className={`sentia-kpi-cell sentia-${getKPIStatus('inv_turnover', trend.inv_turnover)}`}>
                            {formatKPIValue('inv_turnover', trend.inv_turnover)}
                          </td>
                          <td className={`sentia-kpi-cell sentia-${getKPIStatus('wc_turnover', trend.wc_turnover)}`}>
                            {formatKPIValue('wc_turnover', trend.wc_turnover)}
                          </td>
                          <td className={`sentia-kpi-cell sentia-${getKPIStatus('facility_utilization', trend.facility_utilization)}`}>
                            {formatKPIValue('facility_utilization', trend.facility_utilization)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!kpiData && !loading && !error && (
        <div className="sentia-card">
          <div className="sentia-card-content">
            <div className="sentia-empty-state">
              <p>No KPI data available</p>
              <small>Historical KPI data will appear here once working capital projections are generated</small>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default KPIDashboard