/**
 * Welcome Step - Onboarding Profile Setup
 *
 * First step of onboarding flow collecting user preferences:
 * - Industry type
 * - Company size
 * - Primary goal
 * - Accounting system
 *
 * @module src/pages/onboarding/WelcomeStep
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2,
  Users,
  Target,
  Briefcase,
  ArrowRight,
  Sparkles,
} from 'lucide-react'

interface WelcomeFormData {
  industry: string
  companySize: string
  primaryGoal: string
  accountingSystem: string
}

const INDUSTRIES = [
  { value: 'beverages', label: 'Beverages & Spirits' },
  { value: 'food', label: 'Food & Ingredients' },
  { value: 'electronics', label: 'Electronics & Tech' },
  { value: 'textiles', label: 'Textiles & Apparel' },
  { value: 'automotive', label: 'Automotive & Parts' },
  { value: 'chemicals', label: 'Chemicals & Pharma' },
  { value: 'other', label: 'Other Manufacturing' },
]

const COMPANY_SIZES = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-1000', label: '201-1,000 employees' },
  { value: '1000+', label: '1,000+ employees' },
]

const PRIMARY_GOALS = [
  {
    value: 'cash_flow',
    label: 'Optimize Cash Flow',
    description: 'Improve working capital and reduce cash conversion cycle',
    icon: '💰',
  },
  {
    value: 'forecasting',
    label: 'Demand Forecasting',
    description: 'Predict future demand and plan production accurately',
    icon: '📈',
  },
  {
    value: 'inventory',
    label: 'Inventory Management',
    description: 'Reduce stock-outs and optimize inventory levels',
    icon: '📦',
  },
  {
    value: 'all',
    label: 'All of the Above',
    description: 'Complete manufacturing intelligence platform',
    icon: '🚀',
  },
]

const ACCOUNTING_SYSTEMS = [
  { value: 'xero', label: 'Xero', logo: '🟦' },
  { value: 'quickbooks', label: 'QuickBooks', logo: '🟩' },
  { value: 'unleashed', label: 'Unleashed ERP', logo: '🟪' },
  { value: 'amazon', label: 'Amazon SP-API', logo: '🟧' },
  { value: 'shopify', label: 'Shopify', logo: '🟫' },
  { value: 'other', label: 'Other / None', logo: '⚪' },
]

export default function WelcomeStep() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<WelcomeFormData>({
    industry: '',
    companySize: '',
    primaryGoal: '',
    accountingSystem: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Save preferences to tenant settings
      await fetch('/api/tenants/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industry: formData.industry,
          companySize: formData.companySize,
          primaryGoal: formData.primaryGoal,
          accountingSystem: formData.accountingSystem,
        }),
      })

      // Mark welcome step as complete
      await fetch('/api/onboarding/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepId: 'welcome',
          completed: true,
        }),
      })

      // Navigate to next step (integration wizard)
      navigate('/onboarding/integration')
    } catch (error) {
      console.error('Failed to save preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    navigate('/dashboard')
  }

  const isFormValid =
    formData.industry &&
    formData.companySize &&
    formData.primaryGoal &&
    formData.accountingSystem

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Sparkles className="w-4 h-4" />
            Step 1 of 6
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to CapLiquify! 👋
          </h1>
          <p className="text-lg text-gray-600">
            Let's get to know your business so we can personalize your
            experience
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Industry Selection */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
                <Building2 className="w-5 h-5 text-blue-600" />
                What industry are you in?
              </label>
              <select
                value={formData.industry}
                onChange={(e) =>
                  setFormData({ ...formData, industry: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select your industry...</option>
                {INDUSTRIES.map((industry) => (
                  <option key={industry.value} value={industry.value}>
                    {industry.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Company Size */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
                <Users className="w-5 h-5 text-blue-600" />
                How many people work at your company?
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {COMPANY_SIZES.map((size) => (
                  <button
                    key={size.value}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, companySize: size.value })
                    }
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.companySize === size.value
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 hover:border-blue-300 text-gray-700'
                    }`}
                  >
                    <span className="font-medium">{size.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Primary Goal */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
                <Target className="w-5 h-5 text-blue-600" />
                What's your primary goal with CapLiquify?
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PRIMARY_GOALS.map((goal) => (
                  <button
                    key={goal.value}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, primaryGoal: goal.value })
                    }
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      formData.primaryGoal === goal.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{goal.icon}</span>
                      <div>
                        <h3
                          className={`font-semibold mb-1 ${
                            formData.primaryGoal === goal.value
                              ? 'text-blue-900'
                              : 'text-gray-900'
                          }`}
                        >
                          {goal.label}
                        </h3>
                        <p
                          className={`text-sm ${
                            formData.primaryGoal === goal.value
                              ? 'text-blue-700'
                              : 'text-gray-600'
                          }`}
                        >
                          {goal.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Accounting System */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
                <Briefcase className="w-5 h-5 text-blue-600" />
                Which accounting system do you use?
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {ACCOUNTING_SYSTEMS.map((system) => (
                  <button
                    key={system.value}
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        accountingSystem: system.value,
                      })
                    }
                    className={`p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
                      formData.accountingSystem === system.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <span className="text-2xl">{system.logo}</span>
                    <span
                      className={`font-medium ${
                        formData.accountingSystem === system.value
                          ? 'text-blue-900'
                          : 'text-gray-700'
                      }`}
                    >
                      {system.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleSkip}
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Skip for now →
              </button>

              <button
                type="submit"
                disabled={!isFormValid || loading}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {loading ? (
                  'Saving...'
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Progress Preview */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Next up: Connect your accounting system for real-time data
          </p>
        </div>
      </div>
    </div>
  )
}
