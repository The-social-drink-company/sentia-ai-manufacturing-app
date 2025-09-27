import React, { useState, lazy, Suspense } from 'react';
import LandingPage from './LandingPage';
import MultiStageLoader from './components/MultiStageLoader';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { devLog } from './utils/structuredLogger';

// Lazy load the COMPREHENSIVE enterprise app only when needed
// This is the FULL version with ALL features, not the emergency cut-down version
const ComprehensiveApp = lazy(() => import('./App-comprehensive'));

// Import bulletproof auth provider for reliable authentication
import { BulletproofAuthProvider } from './auth/BulletproofAuthProvider';

const AppMultiStage = () => {
  const [appState, setAppState] = useState('loading'); // Skip landing page, go straight to loading
  const [clerkLoaded, setClerkLoaded] = useState(true); // Start with Clerk loaded

  devLog.log('[AppMultiStage] Current state:', { appState, clerkLoaded });

  const handleGetStarted = () => {
    devLog.log('[AppMultiStage] Get started clicked');
    // Start loading Clerk and show multi-stage loader
    setAppState('loading');

    // Simulate Clerk initialization
    if (!clerkLoaded) {
      // This triggers the lazy loading of Clerk
      setClerkLoaded(true);
    }
  };

  const handleLoadingComplete = () => {
    devLog.log('[AppMultiStage] Loading complete, moving to authenticated');
    setAppState('authenticated');
  };

  // Auto-complete loading after a short delay
  React.useEffect(() => {
    if (appState === 'loading') {
      const timer = setTimeout(() => {
        handleLoadingComplete();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [appState]);

  // Landing page - no Clerk loaded yet
  if (appState === 'landing') {
    devLog.log('[AppMultiStage] Rendering landing page');
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

  // Multi-stage loading
  if (appState === 'loading') {
    devLog.log('[AppMultiStage] Rendering loading stage');
    return <MultiStageLoader onComplete={handleLoadingComplete} />;
  }

  // Authenticated app with bulletproof auth
  if (appState === 'authenticated' && clerkLoaded) {
    devLog.log('[AppMultiStage] Rendering authenticated app');
    return (
      <BulletproofAuthProvider>
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <LoadingSpinner size="lg" />
          </div>
        }>
          <ComprehensiveApp />
        </Suspense>
      </BulletproofAuthProvider>
    );
  }

  // Fallback
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <LoadingSpinner size="lg" />
    </div>
  );
};

export default AppMultiStage;