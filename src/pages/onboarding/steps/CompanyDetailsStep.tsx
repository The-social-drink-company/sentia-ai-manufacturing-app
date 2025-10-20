/**
 * Company Details Step
 *
 * Collects company information:
 * - Industry
 * - Company size
 * - Annual revenue
 * - Currency
 *
 * @module src/pages/onboarding/steps/CompanyDetailsStep
 */

import { useState } from 'react'
import { ArrowRight } from 'lucide-react'

interface CompanyDetailsStepProps {
  data?: any
  onNext: (data: any) => void
  loading?: boolean
}

const INDUSTRIES = [
  { value: '', label: 'Select your industry' },
  { value: 'food-beverage', label: 'Food & Beverage' },
  { value: 'spirits', label: 'Spirits & Alcoholic Beverages' },
  { value: 'consumer-goods', label: 'Consumer Goods' },
  { value: 'industrial', label: 'Industrial Manufacturing' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'electronics', label: 'Electronics & Technology' },
  { value: 'textiles', label: 'Textiles & Apparel' },
  { value: 'chemicals', label: 'Chemicals & Pharmaceuticals' },
  { value: 'other', label: 'Other Manufacturing' },
]

const COMPANY_SIZES = [
  { value: '', label: 'Select company size' },
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '500+', label: '500+ employees' },
]

const ANNUAL_REVENUES = [
  { value: '', label: 'Select annual revenue' },
  { value: '<500K', label: 'Less than $500K' },
  { value: '500K-1M', label: '$500K - $1M' },
  { value: '1M-5M', label: '$1M - $5M' },
  { value: '5M-10M', label: '$5M - $10M' },
  { value: '10M-50M', label: '$10M - $50M' },
  { value: '50M-100M', label: '$50M - $100M' },
  { value: '100M+', label: '$100M+' },
]

const CURRENCIES = [
  { value: 'USD', label: 'USD ($)', symbol: '$' },
  { value: 'EUR', label: 'EUR (€)', symbol: '€' },
  { value: 'GBP', label: 'GBP (£)', symbol: '£' },
  { value: 'AUD', label: 'AUD (A$)', symbol: 'A$' },
  { value: 'CAD', label: 'CAD (C$)', symbol: 'C$' },
]

export default function CompanyDetailsStep({
  data,
  onNext,
  loading = false,
}: CompanyDetailsStepProps) {
  const [formData, setFormData] = useState(
    data || {
      industry: '',
      companySize: '',
      annualRevenue: '',
      currency: 'USD',
    }
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onNext(formData)
  }

  const isValid =
    formData.industry &&
    formData.companySize &&
    formData.annualRevenue &&
    formData.currency

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Industry */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Industry <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.industry}
          onChange={(e) =>
            setFormData({ ...formData, industry: e.target.value })
          }
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          {INDUSTRIES.map((industry) => (
            <option key={industry.value} value={industry.value}>
              {industry.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-sm text-gray-500">
          This helps us personalize your experience
        </p>
      </div>

      {/* Company Size */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Company Size <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.companySize}
          onChange={(e) =>
            setFormData({ ...formData, companySize: e.target.value })
          }
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          {COMPANY_SIZES.map((size) => (
            <option key={size.value} value={size.value}>
              {size.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-sm text-gray-500">
          Number of employees in your organization
        </p>
      </div>

      {/* Annual Revenue */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Annual Revenue <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.annualRevenue}
          onChange={(e) =>
            setFormData({ ...formData, annualRevenue: e.target.value })
          }
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          {ANNUAL_REVENUES.map((revenue) => (
            <option key={revenue.value} value={revenue.value}>
              {revenue.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-sm text-gray-500">
          Approximate annual revenue
        </p>
      </div>

      {/* Currency */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Primary Currency <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {CURRENCIES.map((currency) => (
            <button
              key={currency.value}
              type="button"
              onClick={() =>
                setFormData({ ...formData, currency: currency.value })
              }
              className={`p-3 rounded-lg border-2 transition-all ${
                formData.currency === currency.value
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <div className="text-lg font-semibold">{currency.symbol}</div>
              <div className="text-xs">{currency.value}</div>
            </button>
          ))}
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Currency for financial reports and forecasts
        </p>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!isValid || loading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
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
    </form>
  )
}
