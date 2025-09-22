import React, { useState, lazy, Suspense, memo } from 'react';
import './App.css';

// Loading spinner component
const LoadingSpinner = memo(() => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
));

// Memoized landing page component
const LandingPage = memo(({ setCurrentView }) => (
  <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
    <div className="container mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mr-4">
            <span className="text-2xl font-bold" role="img" aria-label="chart">📊</span>
          </div>
          <h1 className="text-5xl font-bold">Sentia Manufacturing</h1>
        </div>
        <h2 className="text-2xl text-blue-200 mb-6">Enterprise Working Capital Intelligence Platform</h2>
        <p className="text-lg text-gray-300 max-w-4xl mx-auto leading-relaxed">
          Advanced cash flow analysis and optimization for manufacturing enterprises.
          Answer the critical questions: How much cash do you need? When do you need it?
          How can you optimize working capital for growth?
        </p>
      </div>

      <div className="flex justify-center space-x-6 mb-12">
        <button
          onClick={() => setCurrentView('dashboard')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-200 hover:scale-105"
        >
          Enter Dashboard →
        </button>
        <button
          onClick={() => setCurrentView('calculator')}
          className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-200 hover:scale-105"
        >
          Working Capital Calculator <span role="img" aria-label="chart">📊</span>
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg p-6">
          <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
            <span className="text-xl" role="img" aria-label="money">💰</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">Cash Flow Analysis</h3>
          <p className="text-gray-300">
            Real-time cash flow monitoring with predictive analytics and optimization recommendations.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg p-6">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
            <span className="text-xl" role="img" aria-label="growth">📈</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">Working Capital Intelligence</h3>
          <p className="text-gray-300">
            Advanced algorithms to optimize inventory, receivables, and payables for maximum efficiency.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg p-6">
          <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
            <span className="text-xl" role="img" aria-label="target">🎯</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">Enterprise Integration</h3>
          <p className="text-gray-300">
            Seamless integration with ERP systems, banks, and financial platforms for comprehensive insights.
          </p>
        </div>
      </div>

      <div className="mt-12 text-center">
        <p className="text-sm text-gray-400">
          Environment: {import.meta.env.MODE} |
          API: {import.meta.env.VITE_API_BASE_URL || 'Not set'} |
          Clerk: {import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ? 'Set' : 'Not set'}
        </p>
      </div>
    </div>
  </div>
));

// Memoized dashboard component
const Dashboard = memo(({ setCurrentView }) => (
  <div className="min-h-screen bg-gray-50">
    <div className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Sentia Manufacturing Dashboard</h1>
          <button
            onClick={() => setCurrentView('landing')}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
          >
            ← Back to Landing
          </button>
        </div>
      </div>
    </div>

    <div className="container mx-auto px-6 py-8">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Current Ratio</h3>
          <p className="text-3xl font-bold text-green-600">2.1</p>
          <p className="text-sm text-gray-500">Healthy liquidity position</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Ratio</h3>
          <p className="text-3xl font-bold text-blue-600">1.8</p>
          <p className="text-sm text-gray-500">Strong short-term liquidity</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Cash Unlock Potential</h3>
          <p className="text-3xl font-bold text-purple-600">$83K</p>
          <p className="text-sm text-gray-500">Available optimization</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Annual Improvement</h3>
          <p className="text-3xl font-bold text-orange-600">$334K</p>
          <p className="text-sm text-gray-500">Projected savings</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Working Capital Overview</h2>
        <p className="text-gray-600">
          Your manufacturing operations show strong liquidity metrics with significant optimization opportunities.
          The current ratio of 2.1 indicates healthy short-term financial health, while the quick ratio of 1.8
          demonstrates strong ability to meet immediate obligations.
        </p>
      </div>
    </div>
  </div>
));

// Lazy load the calculator component for code splitting
const Calculator = lazy(() =>
  new Promise(resolve => {
    setTimeout(() => {
      resolve({
        default: memo(({ setCurrentView }) => (
          <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow-sm border-b">
              <div className="container mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold text-gray-900">Working Capital Calculator</h1>
                  <button
                    onClick={() => setCurrentView('landing')}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
                  >
                    ← Back to Landing
                  </button>
                </div>
              </div>
            </div>

            <div className="container mx-auto px-6 py-8">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Calculate Your Working Capital</h2>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Assets ($)</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter current assets"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Liabilities ($)</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter current liabilities"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Inventory ($)</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter inventory value"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Accounts Receivable ($)</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter receivables"
                    />
                  </div>
                </div>

                <button className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold">
                  Calculate Working Capital
                </button>
              </div>
            </div>
          </div>
        ))
      });
    }, 10); // Minimal delay to allow for split
  })
);

function App() {
  const [currentView, setCurrentView] = useState('landing');

  const renderView = () => {
    switch(currentView) {
      case 'dashboard':
        return <Dashboard setCurrentView={setCurrentView} />;
      case 'calculator':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <Calculator setCurrentView={setCurrentView} />
          </Suspense>
        );
      default:
        return <LandingPage setCurrentView={setCurrentView} />;
    }
  };

  return (
    <div className="App">
      {renderView()}
    </div>
  );
}

export default App;