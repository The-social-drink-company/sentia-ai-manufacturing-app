import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import './index.css';

// Import components
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import WorkingCapital from './components/WorkingCapital';
import LandingPage from './components/LandingPage';
import LoadingSpinner from './components/LoadingSpinner';

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
  if (!clerkPubKey) {
    console.error("Missing VITE_CLERK_PUBLISHABLE_KEY environment variable");
    return <div>Authentication configuration error. Please check environment setup.</div>;
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="min-h-screen bg-gray-50">
            {/* Header */}
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
                    <SignedIn>
                      <UserButton />
                    </SignedIn>
                    <SignedOut>
                      <SignInButton>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                          Sign In
                        </button>
                      </SignInButton>
                    </SignedOut>
                  </div>
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main>
              <SignedOut>
                <LandingPage />
              </SignedOut>
              
              <SignedIn>
                <Suspense fallback={<LoadingSpinner />}>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/admin" element={<AdminPanel />} />
                    <Route path="/working-capital" element={<WorkingCapital />} />
                  </Routes>
                </Suspense>
              </SignedIn>
            </main>
          </div>
        </Router>
        <Toaster position="top-right" />
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default App;