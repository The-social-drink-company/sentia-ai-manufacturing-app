/**
 * Onboarding Page Component
 *
 * Handles new tenant onboarding flow with organization creation
 *
 * @module src/pages/Onboarding
 */

import { useState, useEffect } from 'react'
import { useOrganization, useUser } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { CheckCircleIcon } from '@heroicons/react/24/outline'

const OnboardingPage = () => {
  const { organization } = useOrganization()
  const { user } = useUser()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    organizationName: '',
    slug: '',
    subscriptionTier: 'professional' as 'starter' | 'professional' | 'enterprise'
  })
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [slugChecking, setSlugChecking] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Auto-generate slug from organization name
  useEffect(() => {
    if (formData.organizationName && !formData.slug) {
      const generatedSlug = formData.organizationName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      setFormData(prev => ({ ...prev, slug: generatedSlug }))
    }
  }, [formData.organizationName, formData.slug])

  // Check slug availability
  useEffect(() => {
    if (formData.slug.length >= 3) {
      const checkSlug = async () => {
        setSlugChecking(true)
        try {
          const response = await fetch(`/api/onboarding/check-slug/${formData.slug}`)
          const data = await response.json()
          setSlugAvailable(data.data.available)
        } catch (error) {
          console.error('Error checking slug:', error)
          setSlugAvailable(null)
        } finally {
          setSlugChecking(false)
        }
      }

      const debounce = setTimeout(checkSlug, 500)
      return () => clearTimeout(debounce)
    } else {
      setSlugAvailable(null)
    }
  }, [formData.slug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!organization || !user) {
      setError('Organization or user not found')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/onboarding/create-tenant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clerkOrganizationId: organization.id,
          clerkUserId: user.id,
          organizationName: formData.organizationName,
          slug: formData.slug,
          subscriptionTier: formData.subscriptionTier
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || data.message || 'Failed to create tenant')
      }

      const data = await response.json()

      // Redirect to dashboard
      navigate(`/dashboard?tenant=${data.data.tenant.slug}`)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create tenant')
    } finally {
      setLoading(false)
    }
  }

  const tiers = [
    {
      id: 'starter',
      name: 'Starter',
      price: 149,
      features: [
        'Up to 5 users',
        'Basic forecasting',
        '2 ERP integrations',
        'Email support'
      ]
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 295,
      recommended: true,
      features: [
        'Unlimited users',
        'AI forecasting',
        'Unlimited integrations',
        'What-If analysis',
        'Priority support'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 595,
      features: [
        'Everything in Pro',
        'Multi-entity (10)',
        'API access',
        'White-label',
        'Dedicated support'
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-purple-700 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to CapLiquify
          </h1>
          <p className="text-gray-600">
            Let's set up your working capital management platform
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8 flex items-center justify-between">
          <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
              step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}>
              {step > 1 ? <CheckCircleIcon className="w-6 h-6" /> : '1'}
            </div>
            <span className="ml-2 font-medium hidden sm:block">Organization</span>
          </div>

          <div className={`flex-1 h-1 mx-4 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />

          <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
              step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}>
              {step > 2 ? <CheckCircleIcon className="w-6 h-6" /> : '2'}
            </div>
            <span className="ml-2 font-medium hidden sm:block">Subscription</span>
          </div>

          <div className={`flex-1 h-1 mx-4 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`} />

          <div className={`flex items-center ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
              step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}>
              3
            </div>
            <span className="ml-2 font-medium hidden sm:block">Complete</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Organization Details */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={formData.organizationName}
                  onChange={(e) => setFormData(prev => ({ ...prev, organizationName: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Acme Manufacturing"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL Slug
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-sm">app.capliquify.com/</span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="acme-manufacturing"
                    pattern="[a-z0-9-]+"
                    required
                  />
                </div>
                {slugChecking && (
                  <p className="mt-2 text-sm text-gray-500">Checking availability...</p>
                )}
                {!slugChecking && slugAvailable === false && (
                  <p className="mt-2 text-sm text-red-600">This slug is already taken</p>
                )}
                {!slugChecking && slugAvailable === true && (
                  <p className="mt-2 text-sm text-green-600">This slug is available ✓</p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!formData.organizationName || !formData.slug || slugAvailable === false || slugChecking}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 2: Subscription Tier */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {tiers.map((tier) => (
                  <div
                    key={tier.id}
                    onClick={() => setFormData(prev => ({ ...prev, subscriptionTier: tier.id as any }))}
                    className={`border-2 rounded-lg p-6 cursor-pointer transition-all relative ${
                      formData.subscriptionTier === tier.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    {tier.recommended && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        RECOMMENDED
                      </div>
                    )}
                    <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
                    <p className="text-3xl font-bold mb-4">
                      ${tier.price}
                      <span className="text-lg text-gray-600">/mo</span>
                    </p>
                    <ul className="space-y-2 text-sm">
                      {tier.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-600 mr-2">✓</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                >
                  {loading ? 'Creating...' : 'Start 14-Day Free Trial'}
                </button>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

export default OnboardingPage
