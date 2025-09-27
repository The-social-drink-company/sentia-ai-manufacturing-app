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
  const [appState, setAppState] = useState('landing'); // Start with landing page for proper UX
  const [clerkLoaded, setClerkLoaded] = useState(false); // Load Clerk when user clicks Get Started
  const [loadingProgress, setLoadingProgress] = useState(0);

  devLog.log('[AppMultiStage] Current state:', { appState, clerkLoaded, loadingProgress });

  const handleGetStarted = () => {
    devLog.log('[AppMultiStage] Get started clicked');
    // Start loading Clerk and show multi-stage loader
    setAppState('loading');
    setLoadingProgress(0);

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

  // Enhanced loading with progress tracking
  React.useEffect(() => {
    if (appState === 'loading') {
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            // Complete loading after reaching 90%
            setTimeout(() => handleLoadingComplete(), 200);
            return 100;
          }
          return prev + Math.random() * 20;
        });
      }, 100);

      return () => clearInterval(progressInterval);
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
    return <MultiStageLoader onComplete={handleLoadingComplete} progress={loadingProgress} />;
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