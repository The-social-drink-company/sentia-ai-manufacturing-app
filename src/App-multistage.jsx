import React, { useState, lazy, Suspense } from 'react';
import LandingPage from './LandingPage';
import MultiStageLoader from './components/MultiStageLoader';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

// Lazy load the COMPREHENSIVE enterprise app only when needed
// This is the FULL version with ALL features, not the emergency cut-down version
const ComprehensiveApp = lazy(() => import('./App-comprehensive'));

// Import bulletproof auth provider for reliable authentication
import { BulletproofAuthProvider } from './auth/BulletproofAuthProvider';

const AppMultiStage = () => {
  const [appState, setAppState] = useState('landing'); // landing, loading, authenticated
  const [clerkLoaded, setClerkLoaded] = useState(false);

  const handleGetStarted = () => {
    // Start loading Clerk and show multi-stage loader
    setAppState('loading');

    // Simulate Clerk initialization
    if (!clerkLoaded) {
      // This triggers the lazy loading of Clerk
      setClerkLoaded(true);
    }
  };

  const handleLoadingComplete = () => {
    setAppState('authenticated');
  };

  // Landing page - no Clerk loaded yet
  if (appState === 'landing') {
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

  // Multi-stage loading
  if (appState === 'loading') {
    return <MultiStageLoader onComplete={handleLoadingComplete} />;
  }

  // Authenticated app with bulletproof auth
  if (appState === 'authenticated' && clerkLoaded) {
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