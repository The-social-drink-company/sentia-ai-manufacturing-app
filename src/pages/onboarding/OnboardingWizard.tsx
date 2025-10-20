/**
 * Onboarding Wizard - Main Orchestrator
 *
 * Multi-step onboarding wizard with progressive disclosure.
 * Guides users through 4 key setup steps:
 * 1. Company Details
 * 2. Connect Integrations (optional)
 * 3. Invite Team (optional)
 * 4. Import Data (optional)
 *
 * @module src/pages/onboarding/OnboardingWizard
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2,
  Users,
  Link as LinkIcon,
  Database,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from 'lucide-react'
import onboardingService from '@/services/onboardingService'

// Import step components
import CompanyDetailsStep from './steps/CompanyDetailsStep'
import IntegrationsStep from './steps/IntegrationsStep'
import TeamInviteStep from './steps/TeamInviteStep'
import DataImportStep from './steps/DataImportStep'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ElementType
  component: React.ComponentType<any>
  optional?: boolean
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'company',
    title: 'Company Details',
    description: 'Tell us about your business',
    icon: Building2,
    component: CompanyDetailsStep,
  },
  {
    id: 'integrations',
    title: 'Connect Your Data',
    description: 'Link your ERP and e-commerce platforms',
    icon: LinkIcon,
    component: IntegrationsStep,
    optional: true,
  },
  {
    id: 'team',
    title: 'Invite Your Team',
    description: 'Collaborate with your colleagues',
    icon: Users,
    component: TeamInviteStep,
    optional: true,
  },
  {
    id: 'import',
    title: 'Import Data',
    description: 'Bring in your historical data',
    icon: Database,
    component: DataImportStep,
    optional: true,
  },
]

export default function OnboardingWizard() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const [onboardingData, setOnboardingData] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const step = ONBOARDING_STEPS[currentStep]
  const StepComponent = step.component

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const response = await onboardingService.fetchProgress()
        if (response.success) {
          if (response.isComplete) {
            navigate('/dashboard?onboarding=complete&tour=auto')
            return
          }
          if (response.currentStep !== undefined) {
            setCurrentStep(Math.min(response.currentStep, ONBOARDING_STEPS.length - 1))
          }
          if (response.completedSteps) {
            setCompletedSteps(response.completedSteps)
          }
          if (response.data) {
            setOnboardingData(response.data)
          }
        }
      } catch (error) {
        console.error('Failed to load onboarding progress:', error)
      }
    }

    fetchProgress()
  }, [navigate])

  const handleNext = async (data: any) => {
    // Save step data
    const updatedCompletedSteps = Array.from(new Set([...completedSteps, step.id]))
    const newData = { ...onboardingData, [step.id]: data }

    setErrorMessage(null)
    setOnboardingData(newData)
    setCompletedSteps(updatedCompletedSteps)

    const nextStepIndex = currentStep + 1

    if (nextStepIndex < ONBOARDING_STEPS.length) {
      await saveProgress(nextStepIndex, updatedCompletedSteps, newData)
      setCurrentStep(nextStepIndex)
      return
    }

    await completeOnboarding(newData)
  }

  const handleSkip = async () => {
    // Mark step as skipped but not completed
    const newData = { ...onboardingData, [step.id]: { skipped: true } }
    setOnboardingData(newData)

    // Save progress
    const nextStepIndex = currentStep + 1

    if (nextStepIndex < ONBOARDING_STEPS.length) {
      await saveProgress(nextStepIndex, completedSteps, newData)
      setCurrentStep(nextStepIndex)
      return
    }

    await completeOnboarding(newData)
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const saveProgress = async (
    nextStep: number,
    completed: string[],
    data: any
  ) => {
    try {
      const safeStep = Math.min(nextStep, ONBOARDING_STEPS.length - 1)
      await onboardingService.saveProgress(safeStep, completed, data)
    } catch (error) {
      console.error('Failed to save progress:', error)
    }
  }

  const completeOnboarding = async (data: any) => {
    setLoading(true)
    setErrorMessage(null)

    try {
      // Mark onboarding as complete
      const response = await onboardingService.completeOnboarding(data)

      if (response.success) {
        // Navigate to dashboard with celebration and auto-tour
        navigate('/dashboard?onboarding=complete&tour=auto')
      } else {
        throw new Error('Failed to complete onboarding')
      }
    } catch (error) {
      console.error('Error completing onboarding:', error)
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to complete onboarding. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleSkipOnboarding = async () => {
    setLoading(true)
    setErrorMessage(null)

    try {
      await onboardingService.skipOnboarding()
      navigate('/dashboard')
    } catch (error) {
      console.error('Failed to skip onboarding:', error)
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to skip onboarding right now. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  const progressPercentage = Math.round(
    ((currentStep + 1) / ONBOARDING_STEPS.length) * 100
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {ONBOARDING_STEPS.map((s, index) => {
              const Icon = s.icon
              const isCompleted = completedSteps.includes(s.id)
              const isCurrent = index === currentStep
              const isPast = index < currentStep

              return (
                <div key={s.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isCurrent
                          ? 'bg-blue-600 text-white'
                          : isPast
                          ? 'bg-blue-300 text-white'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <Icon className="w-6 h-6" />
                      )}
                    </div>
                    <span
                      className={`text-xs mt-2 text-center hidden md:block ${
                        isCurrent
                          ? 'text-blue-600 font-semibold'
                          : 'text-gray-600'
                      }`}
                    >
                      {s.title}
                    </span>
                  </div>
                  {index < ONBOARDING_STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-2 transition-colors ${
                        isCompleted || isPast ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>

          {/* Overall Progress Bar */}
          <div className="mb-2">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              {currentStep + 1} of {ONBOARDING_STEPS.length} steps
            </span>
            <span>{progressPercentage}% complete</span>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {step.title}
                </h2>
                <p className="text-gray-600">
                  {step.description}
                  {step.optional && (
                    <span className="ml-2 text-sm text-blue-600 font-medium">
                      (Optional - you can skip this)
                    </span>
                  )}
                </p>
              </div>

              <StepComponent
                data={onboardingData[step.id]}
                onNext={handleNext}
                onSkip={step.optional ? handleSkip : undefined}
                loading={loading}
                availableIntegrations={
                  step.id === 'import' && Array.isArray(onboardingData.integrations)
                    ? onboardingData.integrations
                    : []
                }
              />
            </motion.div>
          </AnimatePresence>

          {errorMessage && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
            <button
              onClick={handleBack}
              disabled={currentStep === 0 || loading}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <span className="text-sm text-gray-500">
              Step {currentStep + 1} of {ONBOARDING_STEPS.length}
            </span>
          </div>
        </div>

        {/* Help */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-gray-600">
            Need help getting started?{' '}
            <button className="text-blue-600 hover:text-blue-700 font-medium">
              Chat with us
            </button>
          </p>
          <button
            onClick={handleSkipOnboarding}
            disabled={loading}
            className="text-sm text-gray-500 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Skip onboarding and explore on your own →
          </button>
        </div>
      </div>
    </div>
  )
}
