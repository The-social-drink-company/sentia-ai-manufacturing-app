import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import clerkConfig from './config/clerk.js';
import { logDebug, logInfo, logWarn, logError } from './utils/logger.js';

const LandingPage = lazy(() => import('./pages/LandingPage.jsx'));
const EnterpriseLoader = lazy(() => import('./components/loading/EnterpriseBootstrapLoader.jsx'));

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

const ApplicationOrchestrator = () => {
  const [phase, setPhase] = useState('landing');
  const [loaderAttempts, setLoaderAttempts] = useState(0);
  const [loaderError, setLoaderError] = useState(null);
  const [clerkReady, setClerkReady] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState(null);

  const clerkPublishableKey = useMemo(() => clerkConfig.publishableKey || '', []);
  const canStartSequence = Boolean(clerkPublishableKey);

  useEffect(() => {
    logInfo(`[Orchestrator] Phase changed to ${phase}`);
    if (phase === 'authenticated') {
      logInfo('[Orchestrator] Authenticated dashboard now rendering', {
        userId: authenticatedUser?.id || 'unknown'
      });
    }
  }, [phase, authenticatedUser?.id]);

  const handleGetStarted = useCallback(() => {
    if (!canStartSequence) {
      logWarn('[Orchestrator] Attempted to start loader without Clerk publishable key');
      return;
    }

    setLoaderError(null);
    setClerkReady(false);
    setAuthenticatedUser(null);
    setPhase('loading');
    setLoaderAttempts((attempts) => attempts + 1);
    logInfo('[Orchestrator] Enterprise loader initiated');
  }, [canStartSequence]);

  const handleLoaderComplete = useCallback(() => {
    logInfo('[Orchestrator] Enterprise loader completed successfully');
    setClerkReady(true);
    setPhase('authenticated');
  }, []);

  const handleLoaderError = useCallback((error) => {
    logError('[Orchestrator] Enterprise loader failed', error);
    setLoaderError(error);
    setPhase('landing');
  }, []);

  const handleAuthSuccess = useCallback((user) => {
    if (user) {
      setAuthenticatedUser({ id: user.id, email: user.emailAddresses?.[0]?.emailAddress });
      logDebug('[Orchestrator] Existing Clerk session detected', { userId: user.id });
    }
  }, []);

  const resetApplication = useCallback(() => {
    logWarn('[Orchestrator] Resetting orchestrator after fatal error');
    setPhase('landing');
    setLoaderError(null);
    setClerkReady(false);
    setAuthenticatedUser(null);
  }, []);

  const renderLanding = () => (
    <div className='relative min-h-screen bg-slate-950 text-slate-50'>
      <LandingPage onGetStarted={canStartSequence ? handleGetStarted : undefined} />
      <div className='absolute inset-x-0 bottom-10 flex justify-center px-6'>
        <div className='max-w-xl space-y-3 text-center text-sm'>
          {!canStartSequence ? (
            <p className='rounded-md border border-yellow-600/40 bg-yellow-500/10 px-4 py-3 text-yellow-200'>
              Clerk publishable key is missing. Set VITE_CLERK_PUBLISHABLE_KEY and reload to continue.
            </p>
          ) : null}
          {loaderError ? (
            <p className='rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-200'>
              {loaderError.message || 'Enterprise loader failed unexpectedly. Try again or check network connectivity.'}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );

  const renderLoader = () => (
    <EnterpriseLoader
      key={loaderAttempts}
      onComplete={handleLoaderComplete}
      onAuthReady={handleAuthSuccess}
      onError={handleLoaderError}
      publishableKey={clerkPublishableKey}
    />
  );

  const renderAuthenticatedApp = () => {
    if (!clerkReady) {
      logDebug('[Orchestrator] Awaiting Clerk readiness; showing fallback');
      return <LoadingFallback />;
    }

    return <AuthenticatedApp publishableKey={clerkPublishableKey} />;
  };

  let content;
  switch (phase) {
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
      onError={(error, info) => logError('[Orchestrator] Unhandled runtime error', { error, info })}
    >
      <Suspense fallback={<LoadingFallback />}>{content}</Suspense>
    </ErrorBoundary>
  );
};

export default ApplicationOrchestrator;

