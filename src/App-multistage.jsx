import React, { useState, lazy, Suspense } from 'react';
import LandingPage from './LandingPage';
import MultiStageLoader from './components/MultiStageLoader';
import LoadingSpinner from './components/ui/LoadingSpinner';

// Lazy load the enterprise app only when needed
const EnterpriseApp = lazy(() => import('./App-enterprise'));

// Lazy load Clerk provider
const ClerkProvider = lazy(() =>
  import('@clerk/clerk-react').then(module => ({ default: module.ClerkProvider }))
);

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

  // Authenticated app with Clerk
  if (appState === 'authenticated' && clerkLoaded) {
    const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

    if (!publishableKey) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-500 mb-4">Configuration Error</h1>
            <p className="text-gray-400">Missing Clerk Publishable Key</p>
            <p className="text-gray-500 text-sm mt-2">Please configure VITE_CLERK_PUBLISHABLE_KEY</p>
          </div>
        </div>
      );
    }

    return (
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <LoadingSpinner size="lg" />
        </div>
      }>
        <ClerkProvider publishableKey={publishableKey}>
          <EnterpriseApp />
        </ClerkProvider>
      </Suspense>
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