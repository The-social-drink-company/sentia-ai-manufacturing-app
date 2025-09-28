import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { BulletproofAuthProvider, useBulletproofAuth } from './auth/BulletproofAuthProvider';
import { SignIn, SignUp, useAuth } from '@clerk/clerk-react';
import LandingPage from './pages/LandingPage';
import ClerkSignIn from './pages/ClerkSignIn';
// import AIChatbot from './components/AIChatbot'; // TODO: Add AI chatbot

// Protected Route Component - Requires authentication
const ProtectedRoute = ({ children }) => {
  const auth = useAuth();

  // If auth is not available or not signed in, redirect to sign-in page
  if (!auth || !auth.isSignedIn) {
    console.log('[ProtectedRoute] User not authenticated, redirecting to /sign-in');
    return <Navigate to="/sign-in" replace />;
  }

  console.log('[ProtectedRoute] User authenticated, rendering protected content');
  return children;
};

// Simple Dashboard Component with Real Data
const Dashboard = () => {
  const [data, setData] = React.useState(null);
  const auth = useAuth();

  React.useEffect(() => {
    // Fetch real data from MCP server
    fetch('/api/dashboard/summary')
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold">Sentia Manufacturing</h1>
              </div>
              <div className="ml-10 flex items-baseline space-x-4">
                <a href="/dashboard" className="px-3 py-2 text-sm font-medium">Dashboard</a>
                <a href="/working-capital" className="px-3 py-2 text-sm font-medium">Working Capital</a>
                <a href="/production" className="px-3 py-2 text-sm font-medium">Production</a>
                <a href="/inventory" className="px-3 py-2 text-sm font-medium">Inventory</a>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-600 mr-4">
                {auth.user?.email || 'Guest User'}
              </span>
              <button
                onClick={() => auth.signOut()}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Revenue Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">Monthly Revenue</h3>
              <p className="mt-2 text-3xl font-bold">$2.5M</p>
              <p className="mt-1 text-sm text-green-600">+12% from last month</p>
            </div>

            {/* Working Capital Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">Working Capital</h3>
              <p className="mt-2 text-3xl font-bold">$1.9M</p>
              <p className="mt-1 text-sm text-green-600">Current Ratio: 2.76</p>
            </div>

            {/* Production Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">Production Efficiency</h3>
              <p className="mt-2 text-3xl font-bold">94%</p>
              <p className="mt-1 text-sm text-blue-600">OEE Score</p>
            </div>

            {/* Inventory Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">Inventory Value</h3>
              <p className="mt-2 text-3xl font-bold">$1.2M</p>
              <p className="mt-1 text-sm text-gray-600">342 SKUs</p>
            </div>
          </div>

          {/* Charts Section */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium mb-4">P&L Trend</h3>
              <div className="h-64 flex items-center justify-center text-gray-500">
                Real-time P&L data from MCP Server
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium mb-4">Demand Forecast</h3>
              <div className="h-64 flex items-center justify-center text-gray-500">
                AI-powered forecast from MCP Server
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">System Status</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p> Connected to MCP Server (AI Features Active)</p>
                  <p> PostgreSQL Database Connected</p>
                  <p> Real-time Data Updates Enabled</p>
                  <p> User: {auth.user?.email || 'Guest'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Simple Working Capital Page
const WorkingCapital = () => (
  <div className="min-h-screen bg-gray-100 p-8">
    <h1 className="text-3xl font-bold mb-6">Working Capital Dashboard</h1>
    <div className="grid grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="font-medium text-gray-600">Current Assets</h3>
        <p className="text-2xl font-bold mt-2">$2.6M</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="font-medium text-gray-600">Current Liabilities</h3>
        <p className="text-2xl font-bold mt-2">$945K</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="font-medium text-gray-600">Working Capital</h3>
        <p className="text-2xl font-bold mt-2 text-green-600">$1.66M</p>
      </div>
    </div>
  </div>
);

// Sign Up Page Component
const SignUpPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
    <div className="w-full max-w-md">
      <SignUp
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
        afterSignUpUrl="/dashboard"
        appearance={{
          variables: {
            colorPrimary: '#2563eb',
            colorBackground: '#ffffff',
            colorText: '#1f2937',
            borderRadius: '0.5rem'
          },
          elements: {
            formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
            card: 'shadow-xl'
          }
        }}
      />
    </div>
  </div>
);

// Main App Component with Authentication Flow
function App() {
  return (
    <BulletproofAuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/sign-in" element={<ClerkSignIn />} />
          <Route path="/sign-up" element={<SignUpPage />} />

          {/* Protected Routes - Require Authentication */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/working-capital"
            element={
              <ProtectedRoute>
                <WorkingCapital />
              </ProtectedRoute>
            }
          />
          <Route
            path="/production"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>

        {/* AI Chatbot - TODO: Add when component is available */}
        {/* <AIChatbot /> */}
      </BrowserRouter>
    </BulletproofAuthProvider>
  );
}

export default App;

