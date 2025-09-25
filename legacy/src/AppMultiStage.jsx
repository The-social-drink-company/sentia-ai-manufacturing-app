import React, { useState, useEffect, useMemo, useCallback, useRef, lazy, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import clerkConfig from './config/clerk.js';
import { logDebug, logInfo, logWarn, logError } from './utils/logger.js';

const LandingPage = lazy(() => import('./pages/LandingPage.jsx'));
const Enterprise10StageLoader = lazy(() => import('./components/Enterprise10StageLoaderWithRealAuth.jsx'));
const AuthenticatedApp = lazy(() => import('./App-authenticated.jsx'));

const LoadingFallback = () => (
  <div className='min-h-screen bg-gray-900 flex items-center justify-center'>
    <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500' />
  </div>
);

const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <div className='min-h-screen bg-gray-900 flex items-center justify-center px-6 text-center text-white'>
    <div className='max-w-md space-y-4 rounded-lg border border-red-500/40 bg-red-500/10 px-6 py-6'>
      <h2 className='text-2xl font-bold'>System Error</h2>
      <p className='text-sm text-red-200'>{error?.message || 'An unrecoverable error occurred.'}</p>
      <button
        type='button'
        onClick={resetErrorBoundary}
        className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
      >
        Restart Application
      </button>
    </div>
  </div>
);

const INITIAL_PROGRESS = { stage: 0, message: '', error: null, percent: 0 };
const INITIAL_METRICS = { landingLoadTime: 0, authInitTime: 0, dashboardLoadTime: 0, totalLoadTime: 0 };

export default function AppMultiStage() {
  const [appState, setAppState] = useState('landing');
  const [loadingProgress, setLoadingProgress] = useState(INITIAL_PROGRESS);
  const [userAuthenticated, setUserAuthenticated] = useState(false);
  const [clerkInitialized, setClerkInitialized] = useState(false);
  const [clerkReady, setClerkReady] = useState(false);
  const [loaderAttempts, setLoaderAttempts] = useState(0);
  const [performanceMetrics, setPerformanceMetrics] = useState(INITIAL_METRICS);

  const appStartRef = useRef(performance.now());
  const loaderStartRef = useRef(null);
  const authCompleteRef = useRef(null);

  const clerkPublishableKey = useMemo(() => clerkConfig.publishableKey || '', []);
  const canStartSequence = Boolean(clerkPublishableKey);

  useEffect(() => {
    logInfo(`[MultiStage] Phase changed to ${appState}`);
    if (appState === 'landing') {
      const now = performance.now();
      setPerformanceMetrics(prev => ({
        ...prev,
        landingLoadTime: now - appStartRef.current
      }));
      appStartRef.current = now;
      loaderStartRef.current = null;
      authCompleteRef.current = null;
      setClerkReady(false);
      setClerkInitialized(false);
      setUserAuthenticated(false);
    }
  }, [appState]);

  const handleGetStarted = useCallback(() => {
    logInfo('[MultiStage] User clicked Get Started');

    if (!canStartSequence) {
      logWarn('[MultiStage] Cannot start loader - missing Clerk publishable key');
      setLoadingProgress({
        stage: -1,
        message: 'Clerk configuration missing',
        error: 'Set VITE_CLERK_PUBLISHABLE_KEY to proceed',
        percent: 0
      });
      return;
    }

    const clickTime = performance.now();
    loaderStartRef.current = clickTime;
    authCompleteRef.current = null;

    setPerformanceMetrics(prev => ({
      ...prev,
      authInitTime: 0,
      dashboardLoadTime: 0,
      totalLoadTime: 0
    }));

    setLoadingProgress(INITIAL_PROGRESS);
    setClerkInitialized(false);
    setUserAuthenticated(false);
    setClerkReady(false);
    setLoaderAttempts(value => value + 1);
    setAppState('loading');
    logInfo('[MultiStage] Enterprise loader initiated');
  }, [canStartSequence]);

  const handleStageChange = useCallback((stageNumber, stage, context = {}) => {
    const nextMessage = stage?.details || stage?.name || '';
    setLoadingProgress(prev => ({
      ...prev,
      stage: stageNumber,
      message: nextMessage,
      error: context.status === 'error' ? context.error?.message || prev.error : null,
      percent: context.status === 'completed' ? 100 : prev.percent
    }));

    if (stageNumber === 2 && context.status === 'started') {
      logInfo('[MultiStage] Initializing Clerk authentication (Stage 2)');
    }

    if (stageNumber === 2 && context.status === 'completed') {
      logInfo('[MultiStage] Clerk authentication stage completed');
      setClerkInitialized(true);
      setClerkReady(true);
    }

    if (stageNumber === 10 && context.status === 'completed') {
      logInfo('[MultiStage] Loading sequence reached final stage');
    }
  }, []);

  const handleStageProgress = useCallback((stageNumber, percent) => {
    setLoadingProgress(prev => ({
      ...prev,
      stage: stageNumber,
      percent
    }));
  }, []);

  const handleAuthenticationSuccess = useCallback((user) => {
    if (user) {
      logDebug('[MultiStage] Clerk session detected', { userId: user.id });
      setUserAuthenticated(true);
      setClerkInitialized(true);
      setClerkReady(true);

      if (loaderStartRef.current !== null) {
        const authInitTime = performance.now() - loaderStartRef.current;
        setPerformanceMetrics(prev => ({
          ...prev,
          authInitTime
        }));
      }

      authCompleteRef.current = performance.now();
    }
  }, []);

  const handleLoadingComplete = useCallback(() => {
    logInfo('[MultiStage] All systems loaded successfully');

    if (!clerkInitialized) {
      logError('[MultiStage] Clerk initialization flag false at completion');
      setLoadingProgress({
        stage: -1,
        message: 'Authentication required to continue',
        error: 'Unable to verify Clerk initialization. Please retry.',
        percent: 0
      });
      setAppState('landing');
      return;
    }

    const now = performance.now();
    const totalLoadTime = loaderStartRef.current ? now - loaderStartRef.current : 0;
    const dashboardLoadTime = authCompleteRef.current ? now - authCompleteRef.current : totalLoadTime;

    setPerformanceMetrics(prev => ({
      ...prev,
      dashboardLoadTime,
      totalLoadTime
    }));

    setLoadingProgress(prev => ({
      ...prev,
      stage: 10,
      message: 'Enterprise systems online',
      error: null,
      percent: 100
    }));

    if (!userAuthenticated) {
      logWarn('[MultiStage] Clerk initialized without active session; user may need to sign in');
    }

    setAppState('authenticated');
  }, [clerkInitialized, userAuthenticated]);

  const handleLoadingError = useCallback((error) => {
    logError('[MultiStage] Loading error', error);

    setLoadingProgress({
      stage: -1,
      message: 'Loading failed',
      error: error?.message || 'Enterprise loader failed unexpectedly',
      percent: 0
    });

    if (error?.code === 'AUTH_FAILED' || error?.code === 'CLERK_INIT_FAILED') {
      logWarn('[MultiStage] Auth failure detected, returning to landing state');
      setTimeout(() => {
        setAppState('landing');
        setClerkInitialized(false);
        setUserAuthenticated(false);
        setClerkReady(false);
      }, 3000);
    }
  }, []);

  const resetApplication = useCallback(() => {
    logWarn('[MultiStage] Resetting orchestrator after fatal error');
    setAppState('landing');
    setLoadingProgress(INITIAL_PROGRESS);
    setClerkInitialized(false);
    setClerkReady(false);
    setUserAuthenticated(false);
  }, []);

  const renderLanding = () => (
    <div className='relative min-h-screen bg-slate-950 text-slate-50'>
      <LandingPage
        onGetStarted={canStartSequence ? handleGetStarted : undefined}
        performanceMetrics={performanceMetrics}
      />
      <div className='absolute inset-x-0 bottom-10 flex justify-center px-6'>
        <div className='max-w-xl space-y-3 text-center text-sm'>
          {!canStartSequence ? (
            <p className='rounded-md border border-yellow-600/40 bg-yellow-500/10 px-4 py-3 text-yellow-200'>
              Clerk publishable key is missing. Set VITE_CLERK_PUBLISHABLE_KEY and reload to continue.
            </p>
          ) : null}
          {loadingProgress.error ? (
            <p className='rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-200'>
              {loadingProgress.error}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );

  const renderLoader = () => (
    <Enterprise10StageLoader
      key={loaderAttempts}
      onComplete={handleLoadingComplete}
      onAuthSuccess={handleAuthenticationSuccess}
      onError={handleLoadingError}
      onStageChange={handleStageChange}
      onStageProgress={handleStageProgress}
      clerkPublishableKey={clerkPublishableKey}
    />
  );

  const renderAuthenticatedApp = () => {
    if (!clerkReady) {
      logDebug('[MultiStage] Awaiting Clerk readiness; showing fallback');
      return <LoadingFallback />;
    }

    return <AuthenticatedApp clerkPublishableKey={clerkPublishableKey} />;
  };

  let content;
  switch (appState) {
    case 'landing':
      content = renderLanding();
      break;
    case 'loading':
      content = renderLoader();
      break;
    case 'authenticated':
      content = renderAuthenticatedApp();
      break;
    default:
      content = renderLanding();
  }

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={resetApplication}
      onError={(error, info) => logError('[MultiStage] Unhandled runtime error', { error, info })}
    >
      <Suspense fallback={<LoadingFallback />}>{content}</Suspense>
    </ErrorBoundary>
  );
}

