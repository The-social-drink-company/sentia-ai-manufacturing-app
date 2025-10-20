/**
 * Onboarding Progress Checklist Component
 *
 * Visual progress tracker showing 6 core onboarding steps.
 * Tracks completion state, shows percentage progress, and provides
 * navigation to incomplete steps.
 *
 * @module src/components/onboarding/OnboardingChecklist
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  User,
  Link,
  Database,
  TrendingUp,
  LayoutDashboard,
  Users,
} from 'lucide-react'
import Confetti from 'react-confetti'
import { useWindowSize } from '@/hooks/useWindowSize'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ElementType
  route: string
  completed: boolean
  order: number
}

interface OnboardingChecklistProps {
  tenantId?: string
  compact?: boolean
}

export default function OnboardingChecklist({
  tenantId,
  compact = false,
}: OnboardingChecklistProps) {
  const navigate = useNavigate()
  const { width, height } = useWindowSize()

  const [collapsed, setCollapsed] = useState(compact)
  const [showConfetti, setShowConfetti] = useState(false)
  const [steps, setSteps] = useState<OnboardingStep[]>([
    {
      id: 'welcome',
      title: 'Welcome & Profile',
      description: 'Tell us about your business',
      icon: User,
      route: '/onboarding/welcome',
      completed: false,
      order: 1,
    },
    {
      id: 'integration',
      title: 'Connect Integration',
      description: 'Link your accounting or ERP system',
      icon: Link,
      route: '/onboarding/integration',
      completed: false,
      order: 2,
    },
    {
      id: 'data',
      title: 'Import Data',
      description: 'Sync or generate sample data',
      icon: Database,
      route: '/onboarding/data',
      completed: false,
      order: 3,
    },
    {
      id: 'forecast',
      title: 'View First Forecast',
      description: 'See demand predictions in action',
      icon: TrendingUp,
      route: '/onboarding/forecast',
      completed: false,
      order: 4,
    },
    {
      id: 'dashboard',
      title: 'Explore Dashboard',
      description: 'Take a guided tour of features',
      icon: LayoutDashboard,
      route: '/onboarding/tour',
      completed: false,
      order: 5,
    },
    {
      id: 'team',
      title: 'Invite Team',
      description: 'Add colleagues to your workspace',
      icon: Users,
      route: '/onboarding/invite',
      completed: false,
      order: 6,
    },
  ])

  // Load progress from API
  useEffect(() => {
    loadProgress()
  }, [tenantId])

  // Check for completion and trigger confetti
  useEffect(() => {
    const allComplete = steps.every((step) => step.completed)
    if (allComplete && steps.length > 0) {
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 5000)
    }
  }, [steps])

  const loadProgress = async () => {
    try {
      const response = await fetch('/api/onboarding/progress')
      if (response.ok) {
        const data = await response.json()
        if (data.progress) {
          setSteps((prev) =>
            prev.map((step) => ({
              ...step,
              completed: data.progress[step.id] || false,
            }))
          )
        }
      }
    } catch (error) {
      console.error('Failed to load onboarding progress:', error)
    }
  }

  const updateProgress = async (stepId: string, completed: boolean) => {
    try {
      await fetch('/api/onboarding/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepId, completed }),
      })

      // Update local state
      setSteps((prev) =>
        prev.map((step) =>
          step.id === stepId ? { ...step, completed } : step
        )
      )
    } catch (error) {
      console.error('Failed to update progress:', error)
    }
  }

  const handleStepClick = (step: OnboardingStep) => {
    if (!step.completed) {
      navigate(step.route)
    }
  }

  const completedCount = steps.filter((s) => s.completed).length
  const totalSteps = steps.length
  const progressPercentage = Math.round((completedCount / totalSteps) * 100)

  const allComplete = completedCount === totalSteps

  return (
    <>
      {showConfetti && <Confetti width={width} height={height} />}

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div
          className={`p-4 ${
            allComplete
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200'
              : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {allComplete ? (
                <div className="bg-green-100 p-2 rounded-lg">
                  <Sparkles className="w-5 h-5 text-green-600" />
                </div>
              ) : (
                <div className="bg-blue-100 p-2 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                </div>
              )}
              <div>
                <h3
                  className={`font-semibold ${
                    allComplete ? 'text-green-900' : 'text-blue-900'
                  }`}
                >
                  {allComplete ? 'Setup Complete! 🎉' : 'Getting Started'}
                </h3>
                <p
                  className={`text-sm ${
                    allComplete ? 'text-green-700' : 'text-blue-700'
                  }`}
                >
                  {completedCount} of {totalSteps} steps completed
                </p>
              </div>
            </div>

            <button
              onClick={() => setCollapsed(!collapsed)}
              className={`p-2 rounded-lg hover:bg-white/50 transition-colors ${
                allComplete ? 'text-green-600' : 'text-blue-600'
              }`}
            >
              {collapsed ? (
                <ChevronDown className="w-5 h-5" />
              ) : (
                <ChevronUp className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-3">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  allComplete
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                }`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p
              className={`text-xs text-right mt-1 ${
                allComplete ? 'text-green-700' : 'text-blue-700'
              }`}
            >
              {progressPercentage}%
            </p>
          </div>
        </div>

        {/* Steps List */}
        {!collapsed && (
          <div className="p-4 space-y-2">
            {steps.map((step) => {
              const Icon = step.icon
              return (
                <button
                  key={step.id}
                  onClick={() => handleStepClick(step)}
                  disabled={step.completed}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                    step.completed
                      ? 'bg-green-50 border border-green-200 cursor-default'
                      : 'bg-gray-50 border border-gray-200 hover:bg-blue-50 hover:border-blue-300 cursor-pointer'
                  }`}
                >
                  <div
                    className={`flex-shrink-0 ${
                      step.completed ? 'text-green-600' : 'text-gray-400'
                    }`}
                  >
                    {step.completed ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </div>

                  <div
                    className={`flex-shrink-0 p-2 rounded-lg ${
                      step.completed
                        ? 'bg-green-100 text-green-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 text-left">
                    <h4
                      className={`font-medium ${
                        step.completed ? 'text-green-900' : 'text-gray-900'
                      }`}
                    >
                      {step.title}
                    </h4>
                    <p
                      className={`text-sm ${
                        step.completed ? 'text-green-700' : 'text-gray-600'
                      }`}
                    >
                      {step.description}
                    </p>
                  </div>

                  {!step.completed && (
                    <div className="flex-shrink-0">
                      <span className="text-sm font-medium text-blue-600">
                        Start →
                      </span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Completion Message */}
        {allComplete && !collapsed && (
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-t border-green-200">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-semibold text-green-900">
                  You're all set! 🚀
                </p>
                <p className="text-sm text-green-700">
                  Your CapLiquify workspace is ready. Start optimizing your
                  working capital!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Skip Onboarding */}
        {!allComplete && !collapsed && (
          <div className="p-4 bg-gray-50 border-t border-gray-200 text-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              Skip onboarding and explore on your own →
            </button>
          </div>
        )}
      </div>
    </>
  )
}
