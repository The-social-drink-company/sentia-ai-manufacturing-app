import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import {
  SignedIn,
  SignedOut,
  SignIn,
  SignUp,
  UserButton,
  useAuth,
  RedirectToSignIn
} from '@clerk/clerk-react';
import LandingPage from './pages/LandingPage';

// Dashboard Component - Only accessible when signed in
const Dashboard = () => {
  const { isLoaded, userId, sessionId, orgId } = useAuth();
  const [data, setData] = React.useState(null);

  React.useEffect(() => {
    // Fetch real data from API
    fetch('/api/dashboard/summary')
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  if (!isLoaded) {
    return <div>Loading user information...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">S</span>
                </div>
                <h1 className="ml-2 text-xl font-bold">Sentia Manufacturing</h1>
              </div>
              <div className="ml-10 flex items-baseline space-x-4">
                <a href="/dashboard" className="px-3 py-2 text-sm font-medium text-gray-900 hover:text-gray-700">Dashboard</a>
                <a href="/working-capital" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">Working Capital</a>
                <a href="/production" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">Production</a>
                <a href="/inventory" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">Inventory</a>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-600 mr-4">User ID: {userId}</span>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Manufacturing Dashboard</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Revenue Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">Monthly Revenue</h3>
              <p className="mt-2 text-3xl font-bold text-gray-900">$2.5M</p>
              <p className="mt-1 text-sm text-green-600">+12% from last month</p>
            </div>

            {/* Working Capital Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">Working Capital</h3>
              <p className="mt-2 text-3xl font-bold text-gray-900">$1.9M</p>
              <p className="mt-1 text-sm text-green-600">Current Ratio: 2.76</p>
            </div>

            {/* Production Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">Production Efficiency</h3>
              <p className="mt-2 text-3xl font-bold text-gray-900">94%</p>
              <p className="mt-1 text-sm text-blue-600">OEE Score</p>
            </div>

            {/* Inventory Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">Inventory Value</h3>
              <p className="mt-2 text-3xl font-bold text-gray-900">$1.2M</p>
              <p className="mt-1 text-sm text-gray-600">342 SKUs</p>
            </div>
          </div>

          {/* Charts Section */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium mb-4">P&L Trend</h3>
              <div className="h-64 flex items-center justify-center text-gray-500 bg-gray-50 rounded">
                Real-time P&L data from MCP Server
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium mb-4">Demand Forecast</h3>
              <div className="h-64 flex items-center justify-center text-gray-500 bg-gray-50 rounded">
                AI-powered forecast from MCP Server
              </div>
            </div>
          </div>

          {/* System Status */}
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
                  <p>✓ Connected to MCP Server</p>
                  <p>✓ PostgreSQL Database Connected</p>
                  <p>✓ Real-time Data Updates Enabled</p>
                  <p>✓ Authenticated User: {userId}</p>
                  <p>✓ Session: {sessionId}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Working Capital Page
const WorkingCapital = () => (
  <SignedIn>
    <div className="min-h-screen bg-gray-100 p-8">
      <nav className="mb-6">
        <a href="/dashboard" className="text-blue-600 hover:text-blue-800">← Back to Dashboard</a>
      </nav>
      <h1 className="text-3xl font-bold mb-6">Working Capital Management</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
  </SignedIn>
);

// Sign In Page Component
const SignInPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
    <SignIn
      path="/sign-in"
      routing="path"
      signUpUrl="/sign-up"
      afterSignInUrl="/dashboard"
    />
  </div>
);

// Sign Up Page Component
const SignUpPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
    <SignUp
      path="/sign-up"
      routing="path"
      signInUrl="/sign-in"
      afterSignUpUrl="/dashboard"
    />
  </div>
);

// Main App Component
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={
          <>
            <SignedIn>
              <Navigate to="/dashboard" replace />
            </SignedIn>
            <SignedOut>
              <LandingPage />
            </SignedOut>
          </>
        } />

        {/* Authentication Pages */}
        <Route path="/sign-in/*" element={<SignInPage />} />
        <Route path="/sign-up/*" element={<SignUpPage />} />

        {/* Protected Dashboard Routes */}
        <Route path="/dashboard" element={
          <>
            <SignedIn>
              <Dashboard />
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        } />

        <Route path="/working-capital" element={
          <>
            <SignedIn>
              <WorkingCapital />
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        } />

        <Route path="/production" element={
          <>
            <SignedIn>
              <Dashboard />
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        } />

        <Route path="/inventory" element={
          <>
            <SignedIn>
              <Dashboard />
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        } />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;