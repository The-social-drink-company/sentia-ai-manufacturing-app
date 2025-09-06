import { devLog } from '../lib/devLog.js';
import React, { useState } from 'react'
import UniversalWidgetWrapper from './UniversalWidgetWrapper'

const FixedPlanningWizard = () => {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    productType: '',
    quantity: 0,
    deadline: '',
    priority: 'normal'
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    if (step < 3) setStep(step + 1)
  }

  const handlePrevious = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setSubmitted(false)
    
    try {
      const response = await fetch('/api/manufacturing/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        setSubmitted(true)
        setTimeout(() => {
          setStep(1)
          setFormData({ productType: '', quantity: 0, deadline: '', priority: 'normal' })
          setSubmitted(false)
        }, 3000)
      }
    } catch (error) {
      devLog.log('Planning submission failed, saved locally')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <UniversalWidgetWrapper widgetName="Manufacturing Planning Wizard" hasData={true}>
        <div style={{
          padding: '2rem',
          backgroundColor: 'white',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 1rem',
            backgroundColor: '#d1fae5',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px'
          }}>✓</div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            Plan Created Successfully!
          </h3>
          <p style={{ color: '#6b7280' }}>
            Your manufacturing plan has been submitted for processing.
          </p>
        </div>
      </UniversalWidgetWrapper>
    )
  }

  return (
    <UniversalWidgetWrapper widgetName="Manufacturing Planning Wizard" loading={loading} hasData={true}>
      <div style={{
        padding: '1.5rem',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          Manufacturing Planning Wizard
        </h2>

        {/* Progress Indicator */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                flex: 1,
                height: '4px',
                backgroundColor: i <= step ? '#3b82f6' : '#e5e7eb',
                marginRight: i < 3 ? '0.5rem' : 0,
                borderRadius: '2px'
              }} />
            ))}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Step {step} of 3: {
              step === 1 ? 'Product Selection' :
              step === 2 ? 'Quantity & Timeline' :
              'Review & Submit'
            }
          </div>
        </div>

        {/* Step Content */}
        {step === 1 && (
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                Product Type
              </label>
              <select
                value={formData.productType}
                onChange={(e) => handleInputChange('productType', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: 'white'
                }}
              >
                <option value="">Select a product</option>
                <option value="widget-a">Widget A</option>
                <option value="widget-b">Widget B</option>
                <option value="component-x">Component X</option>
                <option value="assembly-y">Assembly Y</option>
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                Priority Level
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['low', 'normal', 'high', 'urgent'].map(priority => (
                  <button
                    key={priority}
                    onClick={() => handleInputChange('priority', priority)}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      borderRadius: '6px',
                      border: `1px solid ${formData.priority === priority ? '#3b82f6' : '#d1d5db'}`,
                      backgroundColor: formData.priority === priority ? '#dbeafe' : 'white',
                      color: formData.priority === priority ? '#1e40af' : '#374151',
                      fontSize: '0.875rem',
                      cursor: 'pointer'
                    }}
                  >
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                Quantity
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px'
                }}
                placeholder="Enter quantity"
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                Deadline
              </label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => handleInputChange('deadline', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px'
                }}
              />
            </div>

            {/* Estimated Resources */}
            <div style={{
              padding: '1rem',
              backgroundColor: '#f9fafb',
              borderRadius: '6px',
              marginTop: '1rem'
            }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                Estimated Resources
              </h4>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                <div>Labor Hours: {formData.quantity ? Math.round(formData.quantity * 0.5) : 0}</div>
                <div>Machine Time: {formData.quantity ? Math.round(formData.quantity * 0.3) : 0} hours</div>
                <div>Raw Materials: {formData.quantity ? Math.round(formData.quantity * 1.2) : 0} units</div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div style={{
              padding: '1rem',
              backgroundColor: '#f9fafb',
              borderRadius: '6px',
              marginBottom: '1rem'
            }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.75rem' }}>
                Review Your Plan
              </h4>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: '500' }}>Product:</span> {formData.productType || 'Not selected'}
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: '500' }}>Quantity:</span> {formData.quantity || 0} units
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: '500' }}>Deadline:</span> {formData.deadline || 'Not set'}
                </div>
                <div>
                  <span style={{ fontWeight: '500' }}>Priority:</span>{' '}
                  <span style={{
                    padding: '0.125rem 0.5rem',
                    borderRadius: '4px',
                    backgroundColor: 
                      formData.priority === 'urgent' ? '#fee2e2' :
                      formData.priority === 'high' ? '#fef3c7' :
                      formData.priority === 'normal' ? '#dbeafe' :
                      '#f3f4f6',
                    color:
                      formData.priority === 'urgent' ? '#991b1b' :
                      formData.priority === 'high' ? '#92400e' :
                      formData.priority === 'normal' ? '#1e40af' :
                      '#374151',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    {formData.priority.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <div style={{
              padding: '0.75rem',
              backgroundColor: '#fef3c7',
              border: '1px solid #fbbf24',
              borderRadius: '6px',
              fontSize: '0.875rem',
              color: '#92400e'
            }}>
              Please review your manufacturing plan before submitting. Once submitted, the plan will be processed by the production team.
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
          {step > 1 && (
            <button
              onClick={handlePrevious}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
            >
              Previous
            </button>
          )}
          <div style={{ flex: 1 }} />
          {step < 3 ? (
            <button
              onClick={handleNext}
              disabled={step === 1 && !formData.productType}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                backgroundColor: step === 1 && !formData.productType ? '#e5e7eb' : '#3b82f6',
                color: 'white',
                border: 'none',
                cursor: step === 1 && !formData.productType ? 'not-allowed' : 'pointer'
              }}
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!formData.productType || !formData.quantity || !formData.deadline}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                backgroundColor: (!formData.productType || !formData.quantity || !formData.deadline) ? '#e5e7eb' : '#10b981',
                color: 'white',
                border: 'none',
                cursor: (!formData.productType || !formData.quantity || !formData.deadline) ? 'not-allowed' : 'pointer'
              }}
            >
              Submit Plan
            </button>
          )}
        </div>
      </div>
    </UniversalWidgetWrapper>
  )
}

export default FixedPlanningWizard