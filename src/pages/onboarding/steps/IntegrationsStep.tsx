/**
 * Integrations Step
 *
 * Allows users to select which integrations to connect.
 * Shows available integrations (Xero, QuickBooks, Shopify, etc.)
 *
 * @module src/pages/onboarding/steps/IntegrationsStep
 */

import { useState } from 'react'
import { ArrowRight, Check } from 'lucide-react'

interface IntegrationsStepProps {
  data?: string[]
  onNext: (data: string[]) => void
  onSkip?: () => void
  loading?: boolean
}

const INTEGRATIONS = [
  {
    id: 'xero',
    name: 'Xero',
    category: 'Accounting',
    description: 'Sync financial data and working capital metrics',
    logo: '🟦',
    popular: true,
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    category: 'Accounting',
    description: 'Import transactions and financial reports',
    logo: '🟩',
    popular: true,
  },
  {
    id: 'unleashed',
    name: 'Unleashed ERP',
    category: 'ERP',
    description: 'Connect inventory and production data',
    logo: '🟪',
    popular: true,
  },
  {
    id: 'shopify',
    name: 'Shopify',
    category: 'E-commerce',
    description: 'Sync orders and sales data',
    logo: '🟫',
    popular: false,
  },
  {
    id: 'amazon',
    name: 'Amazon SP-API',
    category: 'E-commerce',
    description: 'Connect FBA inventory and sales',
    logo: '🟧',
    popular: false,
  },
]

export default function IntegrationsStep({
  data,
  onNext,
  onSkip,
  loading = false,
}: IntegrationsStepProps) {
  const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>(
    data || []
  )

  const toggleIntegration = (id: string) => {
    if (selectedIntegrations.includes(id)) {
      setSelectedIntegrations(selectedIntegrations.filter((i) => i !== id))
    } else {
      setSelectedIntegrations([...selectedIntegrations, id])
    }
  }

  const handleContinue = () => {
    onNext(selectedIntegrations)
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 <strong>Tip:</strong> You can connect these later from Settings.
          Select the ones you use most.
        </p>
      </div>

      {/* Popular Integrations */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Popular Integrations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {INTEGRATIONS.filter((i) => i.popular).map((integration) => {
            const isSelected = selectedIntegrations.includes(integration.id)
            return (
              <button
                key={integration.id}
                onClick={() => toggleIntegration(integration.id)}
                className={`p-4 border-2 rounded-lg transition-all text-left ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{integration.logo}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-gray-900">
                        {integration.name}
                      </h4>
                      {isSelected && (
                        <div className="bg-blue-600 rounded-full p-1">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mb-1">
                      {integration.category}
                    </p>
                    <p className="text-sm text-gray-600">
                      {integration.description}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Other Integrations */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          E-commerce Platforms
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {INTEGRATIONS.filter((i) => !i.popular).map((integration) => {
            const isSelected = selectedIntegrations.includes(integration.id)
            return (
              <button
                key={integration.id}
                onClick={() => toggleIntegration(integration.id)}
                className={`p-4 border-2 rounded-lg transition-all text-left ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{integration.logo}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-gray-900">
                        {integration.name}
                      </h4>
                      {isSelected && (
                        <div className="bg-blue-600 rounded-full p-1">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mb-1">
                      {integration.category}
                    </p>
                    <p className="text-sm text-gray-600">
                      {integration.description}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={handleContinue}
          disabled={selectedIntegrations.length === 0 || loading}
          className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
        >
          {loading ? (
            'Connecting...'
          ) : (
            <>
              Connect {selectedIntegrations.length} Integration
              {selectedIntegrations.length !== 1 ? 's' : ''}
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        {onSkip && (
          <button
            onClick={onSkip}
            disabled={loading}
            className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Skip for now
          </button>
        )}
      </div>

      {selectedIntegrations.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">
            ✓ You'll be guided through OAuth setup for each integration after
            completing onboarding.
          </p>
        </div>
      )}
    </div>
  )
}
