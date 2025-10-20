import { useEffect, useState } from 'react'
import { Progress } from '@/components/ui/progress'

const LOADING_STAGES = [
  { id: 1, message: 'Initializing Authentication...', duration: 800 },
  { id: 2, message: 'Loading User Permissions...', duration: 600 },
  { id: 3, message: 'Connecting to Database...', duration: 900 },
  { id: 4, message: 'Syncing Manufacturing Data...', duration: 1200 },
  { id: 5, message: 'Loading Financial Metrics...', duration: 800 },
  { id: 6, message: 'Preparing Analytics Engine...', duration: 1000 },
  { id: 7, message: 'Initializing Dashboard Widgets...', duration: 700 },
  { id: 8, message: 'Loading Real-time Feeds...', duration: 900 },
  { id: 9, message: 'Optimizing Performance...', duration: 600 },
  { id: 10, message: 'Finalizing Dashboard...', duration: 500 },
]

const MultiStageLoader = ({ onComplete }) => {
  const [currentStage, setCurrentStage] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (currentStage >= LOADING_STAGES.length) {
      onComplete?.()
      return
    }

    const stage = LOADING_STAGES[currentStage]
    const timer = setTimeout(() => {
      setCurrentStage(prev => prev + 1)
      setProgress(((currentStage + 1) / LOADING_STAGES.length) * 100)
    }, stage.duration)

    return () => clearTimeout(timer)
  }, [currentStage, onComplete])

  const currentMessage =
    currentStage < LOADING_STAGES.length ? LOADING_STAGES[currentStage].message : 'Dashboard Ready!'

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
          <div className="text-lg font-medium text-white">{currentMessage}</div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2 bg-slate-700" />
            <div className="flex justify-between text-xs text-slate-400">
              <span>
                Stage {Math.min(currentStage + 1, LOADING_STAGES.length)} of {LOADING_STAGES.length}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>

          {/* Stage Indicators */}
          <div className="grid grid-cols-5 gap-2">
            {LOADING_STAGES.map((stage, index) => (
              <div
                key={stage.id}
                className={`h-2 rounded-full transition-colors duration-300 ${
                  index < currentStage
                    ? 'bg-gradient-to-r from-blue-400 to-cyan-300'
                    : index === currentStage
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

export default MultiStageLoader
