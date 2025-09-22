import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { AnimatePresence } from 'framer-motion';
import LandingPage from './components/LandingPage';
import EnhancedLoadingManager from './components/EnhancedLoadingManager';
import AuthGuard from './components/auth/AuthGuard';
import EnhancedEnterpriseDashboard from './components/EnhancedEnterpriseDashboard';
import './App.css';

function App() {
  const { isSignedIn } = useUser();
  const [appState, setAppState] = useState('landing'); // 'landing', 'auth', 'loading', 'dashboard', 'calculator'
  const [authMode, setAuthMode] = useState('sign-in');

  // Handle navigation from landing page
  const handleStartNow = () => {
    setAuthMode('sign-up');
    setAppState('auth');
  };

  const handleLogin = () => {
    setAuthMode('sign-in');
    setAppState('auth');
  };

  const handleCalculator = () => {
    setAuthMode('sign-in');
    setAppState('auth');
    // After auth, will redirect to calculator
  };

  // Handle post-authentication flow
  const handleAuthComplete = () => {
    setAppState('loading');
  };

  // Handle loading completion
  const handleLoadingComplete = () => {
    setAppState('dashboard');
  };

  // Temporary dashboard component until we create the full one
  const TemporaryDashboard = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mr-4">
              <span className="text-2xl font-bold">📊</span>
            </div>
            <h1 className="text-4xl font-bold">Sentia Manufacturing Dashboard</h1>
          </div>
          <p className="text-xl text-blue-200">Enterprise Working Capital Intelligence Platform</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-4">Working Capital Analysis</h3>
            <div className="text-3xl font-bold text-green-400 mb-2">£83,000</div>
            <p className="text-gray-300">90-day cash unlock potential</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-4">Annual Improvement</h3>
            <div className="text-3xl font-bold text-blue-400 mb-2">£334,000</div>
            <p className="text-gray-300">Projected annual benefit</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-4">Cash Conversion</h3>
            <div className="text-3xl font-bold text-purple-400 mb-2">46 Days</div>
            <p className="text-gray-300">Cycle improvement target</p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-300 mb-4">Full enterprise dashboard loading...</p>
          <div className="inline-flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );

  // Check if user is signed in and should trigger loading
  React.useEffect(() => {
    if (isSignedIn && appState === 'auth') {
      handleAuthComplete();
    }
  }, [isSignedIn, appState]);

  return (
    <div className="App">
      <AnimatePresence mode="wait">
        {appState === 'landing' && (
          <LandingPage
            key="landing"
            onStartNow={handleStartNow}
            onLogin={handleLogin}
            onCalculator={handleCalculator}
          />
        )}

        {appState === 'auth' && (
          <AuthGuard
            key="auth"
            authMode={authMode}
          >
            {/* This will only render if user is signed in */}
            <div style={{ display: 'none' }}>
              {handleAuthComplete()}
            </div>
          </AuthGuard>
        )}

        {appState === 'loading' && (
          <EnhancedLoadingManager
            key="loading"
            onComplete={handleLoadingComplete}
          />
        )}

        {appState === 'dashboard' && (
          <EnhancedEnterpriseDashboard key="dashboard" />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
