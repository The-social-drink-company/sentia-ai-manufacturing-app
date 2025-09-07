import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { SSEProvider } from './context/SSEProvider';
import { MicrosoftAuthProvider } from './contexts/MicrosoftAuthContext';
import { setupGlobalErrorHandling } from './utils/errorHandling';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

// Import components
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import WorkingCapital from './components/WorkingCapital';
import LandingPage from './components/LandingPage';
import LoadingSpinner from './components/LoadingSpinner';

// Manufacturing components
import ProductionTracking from './components/Manufacturing/ProductionTracking';
import QualityControl from './components/Manufacturing/QualityControl';
import InventoryManagement from './components/Manufacturing/InventoryManagement';

// Advanced components
import FileImportSystem from './components/DataImport/FileImportSystem';
import AIAnalyticsDashboard from './components/AI/AIAnalyticsDashboard';
import DemandForecasting from './components/forecasting/DemandForecasting';

// Layout components
import EnterpriseLayout from './components/layout/EnterpriseLayout';

// Clerk configuration
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  // Setup global error handling
  useEffect(() => {
    setupGlobalErrorHandling();
  }, []);

  if (!clerkPubKey) {
    // eslint-disable-next-line no-console
    console.error("Missing VITE_CLERK_PUBLISHABLE_KEY environment variable");
    return <div>Authentication configuration error. Please check environment setup.</div>;
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <QueryClientProvider client={queryClient}>
        <MicrosoftAuthProvider>
        <SSEProvider>
        <ErrorBoundary>
        <Router>
          <div className="min-h-screen bg-gray-50">
            {/* Signed Out - Landing Page */}
            <SignedOut>
              {/* Simple header for signed out users */}
              <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex justify-between items-center py-4">
                    <div className="flex items-center space-x-4">
                      <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        🚀 SENTIA Dashboard
                      </h1>
                      <span className="text-sm text-gray-500">Manufacturing Intelligence Platform</span>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <SignInButton>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                          Sign In
                        </button>
                      </SignInButton>
                    </div>
                  </div>
                </div>
              </header>
              <LandingPage />
            </SignedOut>
            
            {/* Signed In - Enterprise Layout with Navigation */}
            <SignedIn>
              <EnterpriseLayout>
                <Suspense fallback={<LoadingSpinner />}>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/admin" element={<AdminPanel />} />
                    <Route path="/working-capital" element={<WorkingCapital />} />
                    <Route path="/production" element={<ProductionTracking />} />
                    <Route path="/quality" element={<QualityControl />} />
                    <Route path="/inventory" element={<InventoryManagement />} />
                    <Route path="/data-import" element={<FileImportSystem />} />
                    <Route path="/ai-analytics" element={<AIAnalyticsDashboard />} />
                    <Route path="/forecasting" element={<DemandForecasting />} />
                    <Route path="/analytics" element={<AIAnalyticsDashboard />} />
                  </Routes>
                </Suspense>
              </EnterpriseLayout>
            </SignedIn>
          </div>
        </Router>
        <Toaster position="top-right" />
        </ErrorBoundary>
        </SSEProvider>
        </MicrosoftAuthProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default App;