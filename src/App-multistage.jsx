import React, { useState, lazy, Suspense, useEffect } from 'react';
import LandingPage from './LandingPage';
import MultiStageLoader from './components/MultiStageLoader';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

// Lazy load the COMPREHENSIVE enterprise app only when needed
// This is the FULL version with ALL features, not the emergency cut-down version
const ComprehensiveApp = lazy(() => import('./App-comprehensive'));

// Import Clerk provider directly to avoid module resolution issues
import { ClerkProvider, useAuth } from '@clerk/clerk-react';

// ClerkWrapper ensures Clerk is fully loaded before rendering ComprehensiveApp
const ClerkWrapper = () => {
  const { isLoaded, isSignedIn } = useAuth();
  const [chunkLoadingError, setChunkLoadingError] = useState(false);
  
  // Handle chunk loading errors gracefully
  useEffect(() => {
    const handleChunkError = (event) => {
      // Check if it's a chunk loading error
      if (event.message && event.message.includes('Loading chunk')) {
        console.warn('Chunk loading error detected, attempting recovery...', event);
        setChunkLoadingError(true);
        
        // Attempt to reload the page after a brief delay
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    };
    
    window.addEventListener('error', handleChunkError);
    return () => window.removeEventListener('error', handleChunkError);
  }, []);
  
  // Show chunk loading error message
  if (chunkLoadingError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-400">Updating application chunks...</p>
          <p className="text-gray-500 text-sm mt-2">Page will reload automatically</p>
        </div>
      </div>
    );
  }
  
  // Wait for Clerk to be fully loaded
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-400">Initializing authentication...</p>
        </div>
      </div>
    );
  }
  
  // Now it's safe to render ComprehensiveApp with all its Clerk-dependent components
  return <ComprehensiveApp />;
};

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
      <ClerkProvider publishableKey={publishableKey}>
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <LoadingSpinner size="lg" />
          </div>
        }>
          <ClerkWrapper />
        </Suspense>
      </ClerkProvider>
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