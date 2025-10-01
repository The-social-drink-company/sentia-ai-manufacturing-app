import { useState, useEffect, useCallback } from 'react'
import useEnvironmentAuth from '@/hooks/useEnvironmentAuth'
import useEnvironmentUser from '@/hooks/useEnvironmentUser'

const LOADING_PHASES = {
  INITIAL: 'initial',
  AUTHENTICATING: 'authenticating',
  LOADING_USER: 'loading_user',
  LOADING_PERMISSIONS: 'loading_permissions',
  CONNECTING_DATABASE: 'connecting_database',
  SYNCING_DATA: 'syncing_data',
  LOADING_FINANCIAL: 'loading_financial',
  PREPARING_ANALYTICS: 'preparing_analytics',
  INITIALIZING_WIDGETS: 'initializing_widgets',
  LOADING_REALTIME: 'loading_realtime',
  OPTIMIZING: 'optimizing',
  FINALIZING: 'finalizing',
  COMPLETE: 'complete'
}

const PHASE_DURATIONS = {
  [LOADING_PHASES.AUTHENTICATING]: 800,
  [LOADING_PHASES.LOADING_USER]: 600,
  [LOADING_PHASES.LOADING_PERMISSIONS]: 700,
  [LOADING_PHASES.CONNECTING_DATABASE]: 900,
  [LOADING_PHASES.SYNCING_DATA]: 1200,
  [LOADING_PHASES.LOADING_FINANCIAL]: 800,
  [LOADING_PHASES.PREPARING_ANALYTICS]: 1000,
  [LOADING_PHASES.INITIALIZING_WIDGETS]: 700,
  [LOADING_PHASES.LOADING_REALTIME]: 900,
  [LOADING_PHASES.OPTIMIZING]: 600,
  [LOADING_PHASES.FINALIZING]: 500
}

const useDashboardLoader = () => {
  const [loadingPhase, setLoadingPhase] = useState(LOADING_PHASES.INITIAL)
  const [progress, setProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const { isSignedIn, isLoaded: authLoaded } = useEnvironmentAuth()
  const { user: _user, isLoaded: userLoaded } = useEnvironmentUser()

  const phases = Object.values(LOADING_PHASES).filter(phase =>
    phase !== LOADING_PHASES.INITIAL && phase !== LOADING_PHASES.COMPLETE
  )

  const getCurrentPhaseIndex = useCallback(() => {
    return phases.indexOf(loadingPhase)
  }, [loadingPhase, phases])

  const advanceToNextPhase = useCallback(() => {
    const currentIndex = getCurrentPhaseIndex()
    if (currentIndex < phases.length - 1) {
      const nextPhase = phases[currentIndex + 1]
      setLoadingPhase(nextPhase)
      setProgress(((currentIndex + 2) / phases.length) * 100)
    } else {
      setLoadingPhase(LOADING_PHASES.COMPLETE)
      setProgress(100)
      setIsComplete(true)
    }
  }, [getCurrentPhaseIndex, phases])

  const startLoading = useCallback(() => {
    if (!authLoaded || !userLoaded || !isSignedIn) return

    setLoadingPhase(LOADING_PHASES.AUTHENTICATING)
    setProgress(0)
    setIsComplete(false)
  }, [authLoaded, userLoaded, isSignedIn])

  useEffect(() => {
    if (loadingPhase === LOADING_PHASES.INITIAL) return
    if (loadingPhase === LOADING_PHASES.COMPLETE) return

    const duration = PHASE_DURATIONS[loadingPhase] || 800
    const timer = setTimeout(advanceToNextPhase, duration)

    return () => clearTimeout(timer)
  }, [loadingPhase, advanceToNextPhase])

  const reset = useCallback(() => {
    setLoadingPhase(LOADING_PHASES.INITIAL)
    setProgress(0)
    setIsComplete(false)
  }, [])

  const getPhaseMessage = useCallback(() => {
    const messages = {
      [LOADING_PHASES.AUTHENTICATING]: 'Initializing Authentication...',
      [LOADING_PHASES.LOADING_USER]: 'Loading User Profile...',
      [LOADING_PHASES.LOADING_PERMISSIONS]: 'Loading User Permissions...',
      [LOADING_PHASES.CONNECTING_DATABASE]: 'Connecting to Database...',
      [LOADING_PHASES.SYNCING_DATA]: 'Syncing Manufacturing Data...',
      [LOADING_PHASES.LOADING_FINANCIAL]: 'Loading Financial Metrics...',
      [LOADING_PHASES.PREPARING_ANALYTICS]: 'Preparing Analytics Engine...',
      [LOADING_PHASES.INITIALIZING_WIDGETS]: 'Initializing Dashboard Widgets...',
      [LOADING_PHASES.LOADING_REALTIME]: 'Loading Real-time Feeds...',
      [LOADING_PHASES.OPTIMIZING]: 'Optimizing Performance...',
      [LOADING_PHASES.FINALIZING]: 'Finalizing Dashboard...',
      [LOADING_PHASES.COMPLETE]: 'Dashboard Ready!'
    }
    return messages[loadingPhase] || 'Loading...'
  }, [loadingPhase])

  return {
    loadingPhase,
    progress,
    isComplete,
    isLoading: loadingPhase !== LOADING_PHASES.INITIAL && !isComplete,
    phaseMessage: getPhaseMessage(),
    currentPhaseIndex: getCurrentPhaseIndex() + 1,
    totalPhases: phases.length,
    startLoading,
    reset,
    canStart: authLoaded && userLoaded && isSignedIn
  }
}

export default useDashboardLoader