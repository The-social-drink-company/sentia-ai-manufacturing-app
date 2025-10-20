import { useEffect } from 'react'
import useEnvironmentAuth from '@/hooks/useEnvironmentAuth'
import useEnvironmentUser from '@/hooks/useEnvironmentUser'
import useDashboardLoader from '@/hooks/useDashboardLoader'
import { Progress } from '@/components/ui/progress'

const ProgressiveDashboardLoader = ({ children, onLoadingComplete }) => {
  const { isSignedIn, isLoaded: authLoaded } = useEnvironmentAuth()
  const { user: _user, isLoaded: userLoaded } = useEnvironmentUser()
  const {
    isLoading,
    progress,
    phaseMessage,
    currentPhaseIndex,
    totalPhases,
    startLoading,
    canStart,
    isComplete,
  } = useDashboardLoader()

  useEffect(() => {
    if (canStart) {
      startLoading()
    }
  }, [canStart, startLoading])

  useEffect(() => {
    if (isComplete) {
      onLoadingComplete?.()
    }
  }, [isComplete, onLoadingComplete])

  if (!authLoaded || !userLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Initializing Authentication...
          </p>
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return children
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="w-full max-w-md space-y-8 px-6 text-center">
          {/* Logo */}
          <div className="flex items-center justify-center space-x-3">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 p-3">
              <div className="h-full w-full rounded bg-white/30" />
            </div>
            <span className="text-2xl font-bold text-white">CapLiquify</span>
          </div>

          {/* Loading Animation */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-200/20 border-t-blue-400" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-300 opacity-60" />
              </div>
            </div>
          </div>

          {/* Stage Info */}
          <div className="space-y-4">
            <div className="text-lg font-medium text-white">{phaseMessage}</div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <Progress value={progress} className="h-2 bg-slate-700" />
              <div className="flex justify-between text-xs text-slate-400">
                <span>
                  Stage {currentPhaseIndex} of {totalPhases}
                </span>
                <span>{Math.round(progress)}%</span>
              </div>
            </div>

            {/* Stage Indicators */}
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: totalPhases }, (_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-colors duration-300 ${
                    index < currentPhaseIndex - 1
                      ? 'bg-gradient-to-r from-blue-400 to-cyan-300'
                      : index === currentPhaseIndex - 1
                        ? 'bg-blue-400 animate-pulse'
                        : 'bg-slate-600'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Additional Info */}
          <div className="text-xs text-slate-400 space-y-1">
            <p>Manufacturing Intelligence Platform</p>
            <p>Preparing your enterprise dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return children
}

export default ProgressiveDashboardLoader
