import React, { useState, useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import axios from 'axios'

function PolicyManagement({ hasManagementAccess = false }) {
  const { getToken } = useAuth()
  const [arPolicies, setArPolicies] = useState([])
  const [apPolicies, setApPolicies] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('ar')
  const [editingPolicy, setEditingPolicy] = useState(null)

  useEffect(() => {
    fetchPolicies()
  }, [])

  const fetchPolicies = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = await getToken()
      const headers = { Authorization: `Bearer ${token}` }

      const [arResponse, apResponse] = await Promise.all([
        axios.get('/api/working-capital/policies/ar', { headers }),
        axios.get('/api/working-capital/policies/ap', { headers })
      ])

      setArPolicies(arResponse.data.data || [])
      setApPolicies(apResponse.data.data || [])
    } catch (err) {
      console.error('Policy fetch error:', err)
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  const updateARPolicy = async (policyData) => {
    try {
      setLoading(true)

      const token = await getToken()
      const headers = { Authorization: `Bearer ${token}` }

      const response = await axios.post('/api/working-capital/policies/ar', policyData, { headers })
      
      // Refresh policies after update
      await fetchPolicies()
      setEditingPolicy(null)
      
      // Show success message (you could implement a toast here)
      console.log('AR Policy updated successfully')
    } catch (err) {
      console.error('AR Policy update error:', err)
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatTerms = (termsString) => {
    try {
      const terms = JSON.parse(termsString)
      return terms.map(term => `${term.days} days (${(term.pct * 100).toFixed(0)}%)`).join(', ')
    } catch {
      return 'Invalid terms format'
    }
  }

  const formatPercentage = (value) => {
    return (value * 100).toFixed(2) + '%'
  }

  return (
    <div className="sentia-policy-container">
      {/* Policy Type Tabs */}
      <div className="sentia-tabs">
        <div className="sentia-tab-list">
          <button
            className={`sentia-tab ${activeTab === 'ar' ? 'sentia-tab-active' : ''}`}
            onClick={() => setActiveTab('ar')}
          >
            <span className="sentia-tab-icon">📥</span>
            <span className="sentia-tab-label">AR Policies</span>
          </button>
          <button
            className={`sentia-tab ${activeTab === 'ap' ? 'sentia-tab-active' : ''}`}
            onClick={() => setActiveTab('ap')}
          >
            <span className="sentia-tab-icon">📤</span>
            <span className="sentia-tab-label">AP Policies</span>
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="sentia-error">
          <div className="sentia-error-content">
            <h4>Policy Management Error</h4>
            <p>{error}</p>
            <button onClick={fetchPolicies} className="sentia-btn sentia-btn-secondary">
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && !editingPolicy && (
        <div className="sentia-card">
          <div className="sentia-card-content">
            <div className="sentia-loading">
              <div className="sentia-spinner"></div>
              <p>Loading policies...</p>
            </div>
          </div>
        </div>
      )}

      {/* AR Policies Tab */}
      {activeTab === 'ar' && !loading && (
        <div className="sentia-card">
          <div className="sentia-card-header">
            <h3 className="sentia-card-title">Accounts Receivable Policies</h3>
            <div className="sentia-card-badge">{arPolicies.length}</div>
          </div>
          <div className="sentia-card-content">
            {arPolicies.length > 0 ? (
              <div className="sentia-table-container">
                <table className="sentia-table">
                  <thead>
                    <tr>
                      <th>Sales Channel</th>
                      <th>Channel Type</th>
                      <th>Market</th>
                      <th>Payment Terms</th>
                      <th>Bad Debt %</th>
                      <th>Fees %</th>
                      <th>Active From</th>
                      {hasManagementAccess && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {arPolicies.map((policy, index) => (
                      <tr key={policy.id || index}>
                        <td>{policy.sales_channel?.name || 'N/A'}</td>
                        <td>
                          <span className="sentia-badge">
                            {policy.sales_channel?.channelType || 'Unknown'}
                          </span>
                        </td>
                        <td>{policy.sales_channel?.marketCode || 'N/A'}</td>
                        <td>{formatTerms(policy.terms)}</td>
                        <td>{formatPercentage(policy.bad_debt_pct)}</td>
                        <td>{formatPercentage(policy.fees_pct)}</td>
                        <td>{new Date(policy.active_from).toLocaleDateString('en-GB')}</td>
                        {hasManagementAccess && (
                          <td>
                            <button 
                              className="sentia-btn sentia-btn-ghost sentia-btn-sm"
                              onClick={() => setEditingPolicy({ ...policy, type: 'ar' })}
                            >
                              Edit
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="sentia-empty-state">
                <p>No AR policies configured</p>
                <small>AR policies define payment terms and collection parameters for sales channels</small>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AP Policies Tab */}
      {activeTab === 'ap' && !loading && (
        <div className="sentia-card">
          <div className="sentia-card-header">
            <h3 className="sentia-card-title">Accounts Payable Policies</h3>
            <div className="sentia-card-badge">{apPolicies.length}</div>
          </div>
          <div className="sentia-card-content">
            {apPolicies.length > 0 ? (
              <div className="sentia-table-container">
                <table className="sentia-table">
                  <thead>
                    <tr>
                      <th>Supplier ID</th>
                      <th>Term Days</th>
                      <th>Early Pay Discount</th>
                      <th>Early Pay Days</th>
                      <th>Strategy</th>
                      <th>Active From</th>
                      {hasManagementAccess && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {apPolicies.map((policy, index) => (
                      <tr key={policy.id || index}>
                        <td>{policy.supplier_id || 'N/A'}</td>
                        <td>{policy.term_days} days</td>
                        <td>{formatPercentage(policy.early_pay_discount_pct || 0)}</td>
                        <td>{policy.early_pay_days || 'N/A'} days</td>
                        <td>
                          <span className="sentia-badge">
                            {policy.strategy || 'Standard'}
                          </span>
                        </td>
                        <td>{new Date(policy.active_from).toLocaleDateString('en-GB')}</td>
                        {hasManagementAccess && (
                          <td>
                            <button 
                              className="sentia-btn sentia-btn-ghost sentia-btn-sm"
                              onClick={() => setEditingPolicy({ ...policy, type: 'ap' })}
                            >
                              Edit
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="sentia-empty-state">
                <p>No AP policies configured</p>
                <small>AP policies define payment terms and discount strategies for suppliers</small>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Policy Editor Modal */}
      {editingPolicy && hasManagementAccess && (
        <PolicyEditor
          policy={editingPolicy}
          onSave={editingPolicy.type === 'ar' ? updateARPolicy : null}
          onCancel={() => setEditingPolicy(null)}
          loading={loading}
        />
      )}

      {/* Access Denied Message */}
      {!hasManagementAccess && (
        <div className="sentia-card">
          <div className="sentia-card-content">
            <div className="sentia-alert sentia-alert-info">
              <div className="sentia-alert-content">
                <div className="sentia-alert-message">
                  You have read-only access to policy information. Contact your financial manager to modify policies.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="sentia-dashboard-actions">
        <button 
          onClick={fetchPolicies} 
          className="sentia-btn sentia-btn-ghost"
          disabled={loading}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Refresh Policies
        </button>
      </div>
    </div>
  )
}

// Policy Editor Component
function PolicyEditor({ policy, onSave, onCancel, loading }) {
  const [formData, setFormData] = useState({
    channel_id: policy.channel_id || '',
    terms: policy.terms ? JSON.parse(policy.terms) : [{ days: 30, pct: 1.0 }],
    bad_debt_pct: policy.bad_debt_pct || 0.025,
    fees_pct: policy.fees_pct || 0.029,
    description: policy.description || ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (onSave) {
      onSave(formData)
    }
  }

  const updateTerm = (index, field, value) => {
    const newTerms = [...formData.terms]
    newTerms[index][field] = field === 'days' ? parseInt(value) : parseFloat(value)
    setFormData({ ...formData, terms: newTerms })
  }

  const addTerm = () => {
    setFormData({
      ...formData,
      terms: [...formData.terms, { days: 30, pct: 0 }]
    })
  }

  const removeTerm = (index) => {
    if (formData.terms.length > 1) {
      const newTerms = formData.terms.filter((_, i) => i !== index)
      setFormData({ ...formData, terms: newTerms })
    }
  }

  return (
    <div className="sentia-modal-overlay">
      <div className="sentia-modal">
        <div className="sentia-modal-header">
          <h3>Edit AR Policy</h3>
          <button className="sentia-modal-close" onClick={onCancel}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="sentia-modal-content">
          {/* Payment Terms */}
          <div className="sentia-form-section">
            <h4>Payment Terms</h4>
            {formData.terms.map((term, index) => (
              <div key={index} className="sentia-term-row">
                <div className="sentia-form-group">
                  <label className="sentia-label">Days</label>
                  <input
                    type="number"
                    className="sentia-input"
                    value={term.days}
                    onChange={(e) => updateTerm(index, 'days', e.target.value)}
                    min="0"
                    required
                  />
                </div>
                <div className="sentia-form-group">
                  <label className="sentia-label">Percentage</label>
                  <input
                    type="number"
                    className="sentia-input"
                    value={term.pct}
                    onChange={(e) => updateTerm(index, 'pct', e.target.value)}
                    min="0"
                    max="1"
                    step="0.01"
                    required
                  />
                </div>
                {formData.terms.length > 1 && (
                  <button
                    type="button"
                    className="sentia-btn sentia-btn-ghost sentia-btn-sm"
                    onClick={() => removeTerm(index)}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="sentia-btn sentia-btn-ghost"
              onClick={addTerm}
            >
              Add Term
            </button>
          </div>

          {/* Other Policy Settings */}
          <div className="sentia-form-grid">
            <div className="sentia-form-group">
              <label className="sentia-label">Bad Debt Rate (%)</label>
              <input
                type="number"
                className="sentia-input"
                value={(formData.bad_debt_pct * 100).toFixed(2)}
                onChange={(e) => setFormData({ ...formData, bad_debt_pct: parseFloat(e.target.value) / 100 })}
                min="0"
                max="100"
                step="0.01"
                required
              />
            </div>
            <div className="sentia-form-group">
              <label className="sentia-label">Fees Rate (%)</label>
              <input
                type="number"
                className="sentia-input"
                value={(formData.fees_pct * 100).toFixed(2)}
                onChange={(e) => setFormData({ ...formData, fees_pct: parseFloat(e.target.value) / 100 })}
                min="0"
                max="100"
                step="0.01"
                required
              />
            </div>
          </div>

          <div className="sentia-form-group">
            <label className="sentia-label">Description</label>
            <textarea
              className="sentia-input"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="3"
              placeholder="Policy description or notes"
            />
          </div>
        </form>

        <div className="sentia-modal-actions">
          <button
            type="button"
            className="sentia-btn sentia-btn-ghost"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="sentia-btn sentia-btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Policy'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PolicyManagement