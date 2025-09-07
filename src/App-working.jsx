import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import { SessionProvider } from 'next-auth/react'; // Temporarily disabled - causing blank screen
// import { AuthProvider } from './components/AuthProvider'; // Temporarily disabled
// import { SignInButton } from './components/SignInButton'; // Temporarily disabled
import './index.css';

// Import components
import SimpleDashboard from './components/SimpleDashboard';
import EnhancedDashboardSimple from './pages/EnhancedDashboardSimple';

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}

function App() {
  console.log('App rendering - Working Dashboard Mode');
  
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  🚀 SENTIA Manufacturing Dashboard
                </h1>
                <span className="text-sm text-gray-500">Manufacturing Intelligence Platform</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-green-600 font-medium">Dudley @ FinanceFlo.ai</span>
                  <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">Master Admin</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation */}
        <nav className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex space-x-8 py-2">
              <a href="/" className="text-blue-600 hover:text-blue-800 py-2 px-3 text-sm font-medium">
                Dashboard
              </a>
              <a href="/working-capital" className="text-gray-500 hover:text-gray-700 py-2 px-3 text-sm font-medium">
                Working Capital
              </a>
              <a href="/what-if" className="text-gray-500 hover:text-gray-700 py-2 px-3 text-sm font-medium">
                What-If Analysis
              </a>
              <a href="/simple" className="text-gray-500 hover:text-gray-700 py-2 px-3 text-sm font-medium">
                Simple View
              </a>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 px-4">
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<SimpleDashboard />} />
              <Route path="/dashboard" element={<SimpleDashboard />} />
              <Route path="/simple" element={<EnhancedDashboardSimple />} />
              <Route path="*" element={<SimpleDashboard />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </Router>
  );
}

export default App;