/**
 * Trial Signup Component
 *
 * Multi-step trial signup form with Clerk integration:
 * Step 1: Account Info (name, email, company, tier selection)
 * Step 2: Email Verification (6-digit code from Clerk)
 * Step 3: Start Trial (organization creation, tenant provisioning)
 *
 * @module src/pages/auth/TrialSignup
 */

import { useState } from 'react'
import { useSignUp } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle,
  Building2,
  Mail,
  User,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
  X,
} from 'lucide-react'

interface TierOption {
  id: string
  name: string
  description: string
  features: string[]
  maxUsers: string
  maxEntities: string
  maxStorage: string
}

const TRIAL_TIERS: TierOption[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for small manufacturing businesses',
    features: [
      'Working Capital Optimization',
      'Demand Forecasting',
      'Inventory Management',
      'Up to 5 users',
      'Up to 100 products',
    ],
    maxUsers: '5',
    maxEntities: '100',
    maxStorage: '1 GB',
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Ideal for growing manufacturing operations',
    features: [
      'All Starter features',
      'AI-Powered Analytics',
      'Advanced Reporting',
      'Up to 20 users',
      'Up to 500 products',
    ],
    maxUsers: '20',
    maxEntities: '500',
    maxStorage: '5 GB',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Complete solution for large manufacturers',
    features: [
      'All Professional features',
      'API Access',
      'Unlimited users',
      'Unlimited products',
      'Dedicated support',
    ],
    maxUsers: 'Unlimited',
    maxEntities: 'Unlimited',
    maxStorage: 'Unlimited',
  },
]

export default function TrialSignup() {
  const { signUp, isLoaded, setActive } = useSignUp()
  const navigate = useNavigate()

  // Form state
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1: Account Info
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    companyName: '',
    tier: 'professional', // Default tier
  })

  // Step 2: Email Verification
  const [verificationCode, setVerificationCode] = useState('')

  // Clerk user context
  const [clerkUserId, setClerkUserId] = useState<string | null>(null)
  const [clerkOrgId, setClerkOrgId] = useState<string | null>(null)

  /**
   * Step 1: Create Clerk user account
   */
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (!isLoaded) {
        throw new Error('Clerk is not loaded')
      }

      // Create Clerk user
      await signUp.create({
        emailAddress: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
      })

      // Send verification email
      await signUp.prepareEmailAddressVerification({
        strategy: 'email_code',
      })

      setStep(2)
    } catch (err: any) {
      console.error('Error creating account:', err)
      setError(err.errors?.[0]?.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Step 2: Verify email with 6-digit code
   */
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (!isLoaded) {
        throw new Error('Clerk is not loaded')
      }

      // Verify the email code
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      })

      if (completeSignUp.status !== 'complete') {
        throw new Error('Verification failed. Please try again.')
      }

      // Set the active session
      await setActive({ session: completeSignUp.createdSessionId })

      // Store Clerk user ID
      setClerkUserId(completeSignUp.createdUserId!)

      setStep(3)
    } catch (err: any) {
      console.error('Error verifying email:', err)
      setError(err.errors?.[0]?.message || 'Invalid verification code')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Step 3: Create organization and provision tenant
   */
  const handleStartTrial = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (!isLoaded || !clerkUserId) {
        throw new Error('User not authenticated')
      }

      // Create Clerk organization
      const org = await signUp.createOrganization({
        name: formData.companyName,
      })

      if (!org || !org.id) {
        throw new Error('Failed to create organization')
      }

      setClerkOrgId(org.id)

      // Create trial tenant via API
      const response = await fetch('/api/trial/create-trial', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerkUserId,
          clerkOrgId: org.id,
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          companyName: formData.companyName,
          tier: formData.tier,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to create trial tenant')
      }

      // Redirect to dashboard
      navigate('/dashboard')
    } catch (err: any) {
      console.error('Error starting trial:', err)
      setError(err.message || 'Failed to start trial')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Start Your Free Trial
          </h1>
          <p className="text-lg text-gray-600">
            14 days of full access. No credit card required.
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step > stepNumber
                      ? 'bg-green-500 text-white'
                      : step === stepNumber
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step > stepNumber ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    stepNumber
                  )}
                </div>
                {stepNumber < 3 && (
                  <div
                    className={`w-16 h-1 ${
                      step > stepNumber ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center space-x-4 mt-2">
            <span
              className={`text-xs ${
                step >= 1 ? 'text-gray-900' : 'text-gray-400'
              }`}
            >
              Account Info
            </span>
            <span className="w-16"></span>
            <span
              className={`text-xs ${
                step >= 2 ? 'text-gray-900' : 'text-gray-400'
              }`}
            >
              Verify Email
            </span>
            <span className="w-16"></span>
            <span
              className={`text-xs ${
                step >= 3 ? 'text-gray-900' : 'text-gray-400'
              }`}
            >
              Start Trial
            </span>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Step 1: Account Info */}
          {step === 1 && (
            <form onSubmit={handleCreateAccount}>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData({ ...formData, firstName: e.target.value })
                        }
                        className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="John"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData({ ...formData, lastName: e.target.value })
                        }
                        className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Doe"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Work Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="john@company.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) =>
                        setFormData({ ...formData, companyName: e.target.value })
                      }
                      className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Acme Manufacturing"
                      required
                    />
                  </div>
                </div>

                {/* Tier Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Choose Your Plan
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {TRIAL_TIERS.map((tier) => (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, tier: tier.id })
                        }
                        className={`p-4 border-2 rounded-lg text-left transition-all ${
                          formData.tier === tier.id
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">
                            {tier.name}
                          </h3>
                          {formData.tier === tier.id && (
                            <CheckCircle className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mb-2">
                          {tier.description}
                        </p>
                        <ul className="space-y-1">
                          {tier.features.map((feature, idx) => (
                            <li
                              key={idx}
                              className="text-xs text-gray-700 flex items-start gap-1"
                            >
                              <Check className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Trial Benefits */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">
                    Your 14-Day Trial Includes:
                  </h4>
                  <ul className="space-y-1">
                    <li className="text-sm text-blue-800 flex items-center gap-2">
                      <Check className="w-4 h-4 text-blue-600" />
                      No credit card required
                    </li>
                    <li className="text-sm text-blue-800 flex items-center gap-2">
                      <Check className="w-4 h-4 text-blue-600" />
                      Full access to all features
                    </li>
                    <li className="text-sm text-blue-800 flex items-center gap-2">
                      <Check className="w-4 h-4 text-blue-600" />
                      Cancel anytime
                    </li>
                    <li className="text-sm text-blue-800 flex items-center gap-2">
                      <Check className="w-4 h-4 text-blue-600" />
                      Upgrade or downgrade during trial
                    </li>
                  </ul>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Step 2: Email Verification */}
          {step === 2 && (
            <form onSubmit={handleVerifyEmail}>
              <div className="space-y-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                    <Mail className="w-8 h-8 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Verify Your Email
                  </h2>
                  <p className="text-gray-600">
                    We sent a 6-digit code to{' '}
                    <span className="font-semibold">{formData.email}</span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                    Enter Verification Code
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
                    placeholder="000000"
                    maxLength={6}
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || verificationCode.length !== 6}
                    className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Step 3: Start Trial */}
          {step === 3 && (
            <form onSubmit={handleStartTrial}>
              <div className="space-y-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Ready to Start Your Trial!
                  </h2>
                  <p className="text-gray-600">
                    Your {formData.tier.charAt(0).toUpperCase() + formData.tier.slice(1)} plan
                    trial will begin immediately
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-6 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Company:</span>
                    <span className="font-semibold text-gray-900">
                      {formData.companyName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-semibold text-gray-900">
                      {formData.email}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Plan:</span>
                    <span className="font-semibold text-gray-900">
                      {formData.tier.charAt(0).toUpperCase() + formData.tier.slice(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trial Duration:</span>
                    <span className="font-semibold text-gray-900">
                      14 days
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Setting Up Your Account...
                    </>
                  ) : (
                    <>
                      Start My Free Trial
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{' '}
          <a href="/sign-in" className="text-blue-600 hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  )
}const handleResendCode = async () => {
    if (!isClerkLoaded || !signUp) {
      setError('Unable to resend code right now. Please try again in a moment.')
      return
    }

    try {
      setError('')
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
    } catch (err: unknown) {
      const message = (err as any)?.errors?.[0]?.message ?? (err as Error)?.message ?? 'Could not resend verification code.'
      setError(message)
    }
  }


