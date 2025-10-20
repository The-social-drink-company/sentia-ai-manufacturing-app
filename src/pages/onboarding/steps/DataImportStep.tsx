/**
 * Data Import Step
 *
 * Final onboarding step - allows users to:
 * 1. Generate sample data for immediate exploration
 * 2. Import from connected integrations (if available)
 * 3. Skip and add data later from settings
 *
 * @module src/pages/onboarding/steps/DataImportStep
 */

import { useState } from 'react'
import {
  ArrowRight,
  Database,
  Upload,
  Sparkles,
  Check,
  FileText,
  TrendingUp,
  Package,
  DollarSign,
} from 'lucide-react'

interface DataImportStepProps {
  data?: {
    method: 'sample' | 'integration' | 'skip'
    integrations?: string[]
  }
  onNext: (data: any) => void
  onSkip?: () => void
  loading?: boolean
  availableIntegrations?: string[]
}

export default function DataImportStep({
  data,
  onNext,
  onSkip,
  loading = false,
  availableIntegrations = [],
}: DataImportStepProps) {
  const [selectedMethod, setSelectedMethod] = useState<
    'sample' | 'integration' | null
  >(data?.method || null)
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)

  const handleGenerateSample = async () => {
    setGenerating(true)
    try {
      // Call API to generate sample data
      const response = await fetch('/api/onboarding/generate-sample', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (response.ok) {
        setGenerated(true)
        setSelectedMethod('sample')
        setTimeout(() => {
          onNext({ method: 'sample' })
        }, 1500)
      }
    } catch (error) {
      console.error('Failed to generate sample data:', error)
    } finally {
      setGenerating(false)
    }
  }

  const handleImportFromIntegrations = () => {
    setSelectedMethod('integration')
    onNext({
      method: 'integration',
      integrations: availableIntegrations,
    })
  }

  const hasIntegrations = availableIntegrations.length > 0

  const SAMPLE_DATA_FEATURES = [
    {
      icon: Package,
      title: '20 Products',
      description: 'Realistic SKUs with pricing and inventory',
    },
    {
      icon: TrendingUp,
      title: '90 Days History',
      description: 'Sales transactions and demand patterns',
    },
    {
      icon: DollarSign,
      title: 'Financial Data',
      description: 'Revenue, COGS, AR/AP, working capital',
    },
    {
      icon: FileText,
      title: 'Production Jobs',
      description: 'Active manufacturing orders and schedules',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Database className="w-6 h-6 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-900">
              Final Step: Import Your Data
            </p>
            <p className="text-sm text-blue-700 mt-1">
              Choose how to populate your workspace. You can always add more
              data later from Settings.
            </p>
          </div>
        </div>
      </div>

      {/* Sample Data Option */}
      <div
        className={`border-2 rounded-xl p-6 transition-all ${
          selectedMethod === 'sample'
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200 hover:border-blue-300'
        }`}
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Generate Sample Data
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Perfect for exploring features immediately. We'll create realistic
              manufacturing data based on your industry.
            </p>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {SAMPLE_DATA_FEATURES.map((feature) => {
                const Icon = feature.icon
                return (
                  <div
                    key={feature.title}
                    className="flex items-start gap-2 p-3 bg-white rounded-lg border border-gray-200"
                  >
                    <Icon className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {feature.title}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {feature.description}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {generated ? (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <Check className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-900">
                  Sample data generated successfully!
                </span>
              </div>
            ) : (
              <button
                onClick={handleGenerateSample}
                disabled={generating || loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
              >
                {generating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Sample Data
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Integration Import Option */}
      {hasIntegrations && (
        <div
          className={`border-2 rounded-xl p-6 transition-all ${
            selectedMethod === 'integration'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-blue-300'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
                <Upload className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Import from Integrations
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Sync real data from your connected systems. This will import
                historical transactions and current inventory.
              </p>

              <div className="bg-white rounded-lg border border-gray-200 p-3 mb-4">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  Connected Integrations:
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableIntegrations.map((integration) => (
                    <span
                      key={integration}
                      className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full"
                    >
                      {integration}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={handleImportFromIntegrations}
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                {loading ? (
                  'Importing...'
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Import from Integrations
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Import Option (Future) */}
      <div className="border-2 border-gray-200 rounded-xl p-6 bg-gray-50">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gray-300 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-gray-600" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Upload CSV/Excel Files
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Import your data from spreadsheets. Available after completing
              onboarding.
            </p>
            <div className="text-sm text-gray-500 italic">
              Coming soon - use Settings → Import/Export after setup
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {!generated && (
        <div className="flex gap-4 pt-4 border-t border-gray-200">
          {onSkip && (
            <button
              onClick={onSkip}
              disabled={loading}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              Skip - Add Data Later
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {/* Info Footer */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
        <p className="text-sm text-gray-600">
          💡 Don't worry - you can always add, modify, or delete data from{' '}
          <span className="font-medium">Settings → Data Management</span>
        </p>
      </div>
    </div>
  )
}
