import React, { lazy, Suspense } from 'react';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

// Lazy load the COMPREHENSIVE enterprise app only when needed
// This is the FULL version with ALL features
const ComprehensiveApp = lazy(() => import('./App-comprehensive'));

const AppMultiStage = () => {
  // Directly render the comprehensive app without authentication
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <ComprehensiveApp />
    </Suspense>
  );
};

export default AppMultiStage;