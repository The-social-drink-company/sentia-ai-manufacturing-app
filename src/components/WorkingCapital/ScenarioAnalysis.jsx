import React, { useState } from 'react'
// Removed Clerk import to fix Application Error
import axios from 'axios'
import { logError } from '../../lib/logger'

function ScenarioAnalysis() {
  // Mock auth for demo mode
  const getToken = async () => null
  const [scenarioData, setScenarioData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [baselineParams, setBaselineParams] = useState({
    horizonMonths: 12,
    currency: 'GBP'
  })
  const [scenarios, setScenarios] = useState([
    {
      name: 'Optimistic',
      description: 'Growth acceleration scenario',
      parameters: {
        demandAdjustment: 0.15, // 15% increase
        priceAdjustment: 0.05,  // 5% price increase
        arTermsAdjustment: -0.1 // 10% faster collection
      }
    },
    {
      name: 'Pessimistic', 
      description: 'Economic downturn scenario',
      parameters: {
        demandAdjustment: -0.2, // 20% decrease
        cogsAdjustment: 0.1,    // 10% cost increase
        arTermsAdjustment: 0.15 // 15% slower collection
      }
    }
  ])

  const runScenarioAnalysis = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = await getToken()
      const headers = { Authorization: `Bearer ${token}` }

      const response = await axios.post('/api/working-capital/scenarios', {
        baselineParams: {
          ...baselineParams,
          startMonth: new Date()
        },
        overrides: scenarios
      }, { headers })

      setScenarioData(response.data.data)
    } catch (err) {
      logError('Scenario analysis error', err, { component: 'ScenarioAnalysis' })
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  const addCustomScenario = () => {
    setScenarios([...scenarios, {
      name: `Custom ${scenarios.length + 1}`,
      description: 'Custom scenario',
      parameters: {
        demandAdjustment: 0,
        priceAdjustment: 0,
        cogsAdjustment: 0,
        arTermsAdjustment: 0
      }
    }])
  }

  const updateScenario = (index, field, value) => {
    const updated = [...scenarios]
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      updated[index][parent][child] = parseFloat(value) || 0
    } else {
      updated[index][field] = value
    }
    setScenarios(updated)
  }

  const removeScenario = (index) => {
    setScenarios(scenarios.filter((_, i) => i !== index))
  }

  const formatPercentage = (value) => {
    const percent = (value * 100).toFixed(1)
    return value >= 0 ? `+${percent}%` : `${percent}%`
  }

  const getScenarioVariance = (baselineValue, scenarioValue) => {
    if (!baselineValue || !scenarioValue) return 'N/A'
    const variance = ((scenarioValue - baselineValue) / baselineValue) * 100
    return variance.toFixed(1) + '%'
  }

  return (
    <div className="sentia-scenario-container">
      {/* Scenario Setup */}
      <div className="sentia-card">
        <div className="sentia-card-header">
          <h3 className="sentia-card-title">Scenario Configuration</h3>
        </div>
        <div className="sentia-card-content">
          {/* Baseline Parameters */}
          <div className="sentia-form-section">
            <h4>Baseline Parameters</h4>
            <div className="sentia-form-grid">
              <div className="sentia-form-group">
                <label className="sentia-label">Horizon (Months)</label>
                <select 
                  className="sentia-select"
                  value={baselineParams.horizonMonths}
                  onChange={(e) => setBaselineParams({...baselineParams, horizonMonths: parseInt(e.target.value)})}
                >
                  <option value={6}>6 Months</option>
                  <option value={12}>12 Months</option>
                  <option value={24}>24 Months</option>
                </select>
              </div>
              <div className="sentia-form-group">
                <label className="sentia-label">Currency</label>
                <select 
                  className="sentia-select"
                  value={baselineParams.currency}
                  onChange={(e) => setBaselineParams({...baselineParams, currency: e.target.value})}
                >
                  <option value="GBP">GBP (£)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Scenario Definitions */}
          <div className="sentia-form-section">
            <div className="sentia-section-header">
              <h4>Scenarios</h4>
              <button 
                className="sentia-btn sentia-btn-ghost"
                onClick={addCustomScenario}
              >
                Add Custom Scenario
              </button>
            </div>

            {scenarios.map((scenario, index) => (
              <div key={index} className="sentia-scenario-form">
                <div className="sentia-scenario-header">
                  <input 
                    type="text"
                    className="sentia-input"
                    value={scenario.name}
                    onChange={(e) => updateScenario(index, 'name', e.target.value)}
                    placeholder="Scenario name"
                  />
                  <button 
                    className="sentia-btn sentia-btn-ghost sentia-btn-sm"
                    onClick={() => removeScenario(index)}
                  >
                    Remove
                  </button>
                </div>
                <input 
                  type="text"
                  className="sentia-input"
                  value={scenario.description}
                  onChange={(e) => updateScenario(index, 'description', e.target.value)}
                  placeholder="Scenario description"
                />
                
                <div className="sentia-scenario-params">
                  <div className="sentia-form-group">
                    <label className="sentia-label">Demand Change (%)</label>
                    <input 
                      type="number"
                      className="sentia-input"
                      value={(scenario.parameters.demandAdjustment * 100).toFixed(1)}
                      onChange={(e) => updateScenario(index, 'parameters.demandAdjustment', e.target.value / 100)}
                      step="0.1"
                      placeholder="0.0"
                    />
                  </div>
                  <div className="sentia-form-group">
                    <label className="sentia-label">Price Change (%)</label>
                    <input 
                      type="number"
                      className="sentia-input"
                      value={(scenario.parameters.priceAdjustment * 100).toFixed(1)}
                      onChange={(e) => updateScenario(index, 'parameters.priceAdjustment', e.target.value / 100)}
                      step="0.1"
                      placeholder="0.0"
                    />
                  </div>
                  <div className="sentia-form-group">
                    <label className="sentia-label">COGS Change (%)</label>
                    <input 
                      type="number"
                      className="sentia-input"
                      value={((scenario.parameters.cogsAdjustment || 0) * 100).toFixed(1)}
                      onChange={(e) => updateScenario(index, 'parameters.cogsAdjustment', e.target.value / 100)}
                      step="0.1"
                      placeholder="0.0"
                    />
                  </div>
                  <div className="sentia-form-group">
                    <label className="sentia-label">Collection Terms (%)</label>
                    <input 
                      type="number"
                      className="sentia-input"
                      value={((scenario.parameters.arTermsAdjustment || 0) * 100).toFixed(1)}
                      onChange={(e) => updateScenario(index, 'parameters.arTermsAdjustment', e.target.value / 100)}
                      step="0.1"
                      placeholder="0.0"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="sentia-form-actions">
            <button 
              className="sentia-btn sentia-btn-primary"
              onClick={runScenarioAnalysis}
              disabled={loading || scenarios.length === 0}
            >
              {loading ? 'Analyzing...' : 'Run Scenario Analysis'}
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="sentia-error">
          <div className="sentia-error-content">
            <h4>Scenario Analysis Error</h4>
            <p>{error}</p>
            <button onClick={runScenarioAnalysis} className="sentia-btn sentia-btn-secondary">
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
              <p>Running scenario analysis...</p>
            </div>
          </div>
        </div>
      )}

      {/* Scenario Results */}
      {scenarioData && !loading && (
        <>
          {/* Scenario Comparison Table */}
          <div className="sentia-card">
            <div className="sentia-card-header">
              <h3 className="sentia-card-title">Scenario Comparison</h3>
            </div>
            <div className="sentia-card-content">
              <div className="sentia-table-container">
                <table className="sentia-table">
                  <thead>
                    <tr>
                      <th>Scenario</th>
                      <th>Net Cash Flow</th>
                      <th>Variance</th>
                      <th>Min Cash</th>
                      <th>Risk Score</th>
                      <th>CCC</th>
                      <th>CCC Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Baseline Row */}
                    <tr className="sentia-baseline-row">
                      <td><strong>Baseline</strong></td>
                      <td>£{scenarioData.baseline?.scenarios?.baseline?.summary?.netCashFlow?.toLocaleString() || 'N/A'}</td>
                      <td>-</td>
                      <td>£{scenarioData.baseline?.scenarios?.baseline?.summary?.minCash?.toLocaleString() || 'N/A'}</td>
                      <td>{scenarioData.baseline?.summary?.riskScore || 'N/A'}</td>
                      <td>{scenarioData.baseline?.summary?.ccc?.toFixed(1) || 'N/A'} days</td>
                      <td>-</td>
                    </tr>
                    
                    {/* Scenario Rows */}
                    {scenarioData.scenarios?.map((scenario, index) => {
                      const baselineCashFlow = scenarioData.baseline?.scenarios?.baseline?.summary?.netCashFlow || 0
                      const scenarioCashFlow = scenario.results?.scenarios?.baseline?.summary?.netCashFlow || 0
                      const variance = getScenarioVariance(baselineCashFlow, scenarioCashFlow)
                      const cccChange = scenarioData.baseline?.summary?.ccc && scenario.results?.summary?.ccc 
                        ? (scenario.results.summary.ccc - scenarioData.baseline.summary.ccc).toFixed(1)
                        : 'N/A'
                      
                      return (
                        <tr key={index}>
                          <td>
                            <strong>{scenario.name}</strong>
                            <br />
                            <small>{scenario.description}</small>
                          </td>
                          <td className={scenarioCashFlow >= baselineCashFlow ? 'sentia-positive' : 'sentia-negative'}>
                            £{scenarioCashFlow.toLocaleString()}
                          </td>
                          <td className={variance.startsWith('+') ? 'sentia-positive' : 'sentia-negative'}>
                            {variance}
                          </td>
                          <td>£{scenario.results?.scenarios?.baseline?.summary?.minCash?.toLocaleString() || 'N/A'}</td>
                          <td>{scenario.results?.summary?.riskScore || 'N/A'}</td>
                          <td>{scenario.results?.summary?.ccc?.toFixed(1) || 'N/A'} days</td>
                          <td className={parseFloat(cccChange) <= 0 ? 'sentia-positive' : 'sentia-negative'}>
                            {cccChange !== 'N/A' ? (parseFloat(cccChange) >= 0 ? '+' + cccChange : cccChange) + ' days' : 'N/A'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {scenarioData.comparison?.recommendations && scenarioData.comparison.recommendations.length > 0 && (
            <div className="sentia-card">
              <div className="sentia-card-header">
                <h3 className="sentia-card-title">Scenario Recommendations</h3>
              </div>
              <div className="sentia-card-content">
                <div className="sentia-recommendations">
                  {scenarioData.comparison.recommendations.map((rec, index) => (
                    <div key={index} className={`sentia-alert sentia-alert-${rec.type}`}>
                      <div className="sentia-alert-content">
                        <div className="sentia-alert-header">
                          <strong>{rec.scenario}</strong> - {rec.metric}
                        </div>
                        <div className="sentia-alert-message">
                          {rec.description}
                        </div>
                        <div className="sentia-alert-impact">
                          Impact: £{rec.impact?.toLocaleString() || 'N/A'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Risk Analysis Summary */}
          <div className="sentia-card">
            <div className="sentia-card-header">
              <h3 className="sentia-card-title">Risk Analysis Summary</h3>
            </div>
            <div className="sentia-card-content">
              <div className="sentia-grid sentia-grid-3">
                <div className="sentia-metric-card">
                  <div className="sentia-metric-label">Best Case</div>
                  <div className="sentia-metric-value sentia-positive">
                    {scenarioData.scenarios && scenarioData.scenarios.length > 0
                      ? Math.max(...scenarioData.scenarios.map(s => s.results?.scenarios?.baseline?.summary?.netCashFlow || 0)).toLocaleString()
                      : 'N/A'
                    }
                  </div>
                </div>
                <div className="sentia-metric-card">
                  <div className="sentia-metric-label">Worst Case</div>
                  <div className="sentia-metric-value sentia-negative">
                    {scenarioData.scenarios && scenarioData.scenarios.length > 0
                      ? Math.min(...scenarioData.scenarios.map(s => s.results?.scenarios?.baseline?.summary?.netCashFlow || 0)).toLocaleString()
                      : 'N/A'
                    }
                  </div>
                </div>
                <div className="sentia-metric-card">
                  <div className="sentia-metric-label">Risk Range</div>
                  <div className="sentia-metric-value">
                    {scenarioData.scenarios && scenarioData.scenarios.length > 0
                      ? (Math.max(...scenarioData.scenarios.map(s => s.results?.scenarios?.baseline?.summary?.netCashFlow || 0)) - 
                         Math.min(...scenarioData.scenarios.map(s => s.results?.scenarios?.baseline?.summary?.netCashFlow || 0))).toLocaleString()
                      : 'N/A'
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Empty State */}
      {!scenarioData && !loading && !error && (
        <div className="sentia-card">
          <div className="sentia-card-content">
            <div className="sentia-empty-state">
              <p>No scenario analysis results</p>
              <small>Configure scenarios above and click "Run Scenario Analysis" to compare different business scenarios</small>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ScenarioAnalysis