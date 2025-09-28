import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton, useAuth, useUser } from '@clerk/clerk-react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

// Import your Clerk Publishable Key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable Key. Please set VITE_CLERK_PUBLISHABLE_KEY in your .env file')
}

console.log('🔐 Clerk Configuration:', {
  hasKey: !!PUBLISHABLE_KEY,
  keyPrefix: PUBLISHABLE_KEY?.substring(0, 20) + '...',
  environment: PUBLISHABLE_KEY?.includes('_live_') ? 'production' : 'development'
})

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600 dark:text-gray-400">Loading...</p>
    </div>
  </div>
);

// Landing page for signed-out users
const LandingPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
    <div className="max-w-md w-full space-y-8 p-8">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
          <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2M7 7h10M7 11h10M7 15h10" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Sentia Manufacturing Dashboard
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Enterprise Working Capital Intelligence
        </p>
      </div>

      {/* Sign In Button */}
      <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow-xl rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Welcome Back
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Sign in to access your manufacturing dashboard
          </p>
          <SignInButton mode="modal">
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors">
              Sign In to Dashboard
            </button>
          </SignInButton>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="text-2xl mb-2">📊</div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">Analytics</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="text-2xl mb-2">📦</div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">Inventory</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="text-2xl mb-2">🏭</div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">Production</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="text-2xl mb-2">💰</div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">Finance</div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Secure enterprise authentication powered by Clerk
        </p>
      </div>
    </div>
  </div>
);

// Simple Dashboard for authenticated users
const Dashboard = () => {
  const { user } = useUser();
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="h-8 w-8 bg-blue-600 rounded flex items-center justify-center mr-3">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2M7 7h10M7 11h10M7 15h10" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Sentia Manufacturing
              </h1>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Welcome, {user?.firstName || 'User'}
              </span>
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8"
                  }
                }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                🏭 Manufacturing Dashboard
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Welcome to your enterprise manufacturing intelligence platform
              </p>
              
              {/* Feature Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                  <div className="text-3xl mb-4">📊</div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Analytics</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Real-time business intelligence</p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                  <div className="text-3xl mb-4">📦</div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Inventory</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Stock management & optimization</p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                  <div className="text-3xl mb-4">🏭</div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Production</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Manufacturing operations</p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                  <div className="text-3xl mb-4">💰</div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Finance</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Working capital intelligence</p>
                </div>
              </div>
              
              {/* Status */}
              <div className="mt-8 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-green-800 dark:text-green-200 font-medium">
                  ✅ Authentication successful! You are now signed in with Clerk.
                </p>
                <p className="text-green-600 dark:text-green-400 text-sm mt-1">
                  User: {user?.emailAddresses?.[0]?.emailAddress || 'Unknown'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Main App component
function App() {
  const { isLoaded, isSignedIn } = useAuth();

  // Show loading while Clerk is initializing
  if (!isLoaded) {
    return <LoadingSpinner />;
  }

  return (
    <Router>
      <Routes>
        <Route path="*" element={
          <>
            <SignedOut>
              <LandingPage />
            </SignedOut>
            
            <SignedIn>
              <Dashboard />
            </SignedIn>
          </>
        } />
      </Routes>
    </Router>
  );
}

// Root App with ClerkProvider
function RootApp() {
  return (
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY}
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
      appearance={{
        elements: {
          rootBox: "w-full",
          card: "shadow-xl border border-gray-200 dark:border-gray-700",
          headerTitle: "text-2xl font-bold text-gray-900 dark:text-white",
          headerSubtitle: "text-gray-600 dark:text-gray-400",
          socialButtonsBlockButton: "border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800",
          formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors",
          formFieldInput: "border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white",
          footerActionLink: "text-blue-600 hover:text-blue-700 font-medium"
        },
        variables: {
          colorPrimary: "#2563eb",
          colorBackground: "#ffffff",
          colorInputBackground: "#ffffff",
          colorInputText: "#1f2937"
        }
      }}
    >
      <App />
      
      {/* Global Toaster for notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </ClerkProvider>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RootApp />
  </StrictMode>,
)
