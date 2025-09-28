/**
 * CLEAN MAIN APPLICATION COMPONENT
 * 
 * Professional implementation with Clerk authentication.
 * No fallbacks, no mock auth, no guest mode.
 */

import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { Toaster } from 'react-hot-toast';

// Authentication
import { ClerkAuthProvider, SignedIn, SignedOut, useAuthContext } from './providers/ClerkAuthProvider';

// Components
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import ErrorFallback from './components/ui/ErrorFallback';

// Lazy-loaded pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const WorkingCapital = lazy(() => import('./pages/WorkingCapital'));
const Production = lazy(() => import('./pages/Production'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Quality = lazy(() => import('./pages/Quality'));
const Forecasting = lazy(() => import('./pages/Forecasting'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const Settings = lazy(() => import('./pages/Settings'));

// AI Chatbot
const AIChatbot = lazy(() => import('./components/AIChatbot-simple'));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-gray-600">Loading Sentia Manufacturing Dashboard...</p>
    </div>
  </div>
);

// Main authenticated application
const AuthenticatedApp = () => {
  const { isLoaded, isSignedIn } = useAuthContext();

  // Show loading while Clerk is initializing
  if (!isLoaded) {
    return <PageLoader />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            
            {/* Protected routes - only accessible when signed in */}
            <Route path="/dashboard" element={
              <SignedIn>
                <Dashboard />
              </SignedIn>
            } />
            
            <Route path="/working-capital" element={
              <SignedIn>
                <WorkingCapital />
              </SignedIn>
            } />
            
            <Route path="/production" element={
              <SignedIn>
                <Production />
              </SignedIn>
            } />
            
            <Route path="/inventory" element={
              <SignedIn>
                <Inventory />
              </SignedIn>
            } />
            
            <Route path="/analytics" element={
              <SignedIn>
                <Analytics />
              </SignedIn>
            } />
            
            <Route path="/quality" element={
              <SignedIn>
                <Quality />
              </SignedIn>
            } />
            
            <Route path="/forecasting" element={
              <SignedIn>
                <Forecasting />
              </SignedIn>
            } />
            
            <Route path="/admin" element={
              <SignedIn>
                <AdminPanel />
              </SignedIn>
            } />
            
            <Route path="/settings" element={
              <SignedIn>
                <Settings />
              </SignedIn>
            } />

            {/* Redirect all other routes to landing page */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>

        {/* AI Chatbot - only show when signed in */}
        <SignedIn>
          <Suspense fallback={null}>
            <AIChatbot />
          </Suspense>
        </SignedIn>

        {/* Global notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </div>
    </Router>
  );
};

// Main App component with providers
const App = () => {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error('Application error:', error, errorInfo);
      }}
    >
      <ClerkAuthProvider>
        <AuthenticatedApp />
      </ClerkAuthProvider>
    </ErrorBoundary>
  );
};

export default App;
