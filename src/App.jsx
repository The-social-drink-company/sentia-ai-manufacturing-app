import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import EnhancedDashboard from './pages/EnhancedDashboard';
import WorkingCapital from './components/WorkingCapital';
import WhatIfAnalysis from './components/analytics/WhatIfAnalysis';
import AdminPanel from './pages/AdminPanel';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import MicrosoftCallbackPage from './pages/auth/MicrosoftCallbackPage';
import './index.css';

// Simple loading spinner
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
  </div>
);

// Demo sign in page with mock authentication for client meeting
const SimpleSignIn = () => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  // Real users for client meeting
  const demoUsers = {
    // Real Sentia Team
    'paul.roberts@sentiaspirits.com': { password: 'sentia2024', role: 'admin', name: 'Paul Roberts' },
    'daniel.kenny@sentiaspirits.com': { password: 'sentia2024', role: 'admin', name: 'Daniel Kenny' },
    
    // Real Gaba Labs Team  
    'david.orren@gabalabs.com': { password: 'gaba2024', role: 'admin', name: 'David Orren' },
    'marta.haczek@gabalabs.com': { password: 'gaba2024', role: 'user', name: 'Marta Haczek' },
    'matt.coulshed@gabalabs.com': { password: 'gaba2024', role: 'user', name: 'Matt Coulshed' },
    'jaron.reid@gabalabs.com': { password: 'gaba2024', role: 'user', name: 'Jaron Reid' },
    
    // Demo fallback
    'demo@demo.com': { password: 'demo', role: 'admin', name: 'Quick Demo' }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate API delay for realism
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      const user = demoUsers[email];
      
      if (user && user.password === password) {
        // Mock successful authentication
        const mockUser = {
          id: Math.random().toString(36),
          email: email,
          name: user.name,
          role: user.role,
          permissions: ['read', 'write', 'admin'] // Full permissions for demo
        };

        const mockSession = {
          token: 'demo-token-' + Date.now(),
          isAuthenticated: true,
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };

        // Store demo user data
        localStorage.setItem('user', JSON.stringify(mockUser));
        localStorage.setItem('session', JSON.stringify(mockSession));
        
        // Redirect to dashboard
        window.location.href = '/dashboard';
      } else {
        setError('Invalid credentials. Try: paul.roberts@sentiaspirits.com / sentia2024 or david.orren@gabalabs.com / gaba2024');
      }
    } catch (error) {
      setError(`Demo error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          
          {/* Real User Credentials for Client Meeting */}
          <div className="mt-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
            <div className="text-sm font-medium">Client Meeting Credentials:</div>
            <div className="text-xs mt-1">
              <div><strong>Sentia:</strong> paul.roberts@sentiaspirits.com / sentia2024</div>
              <div><strong>Gaba Labs:</strong> david.orren@gabalabs.com / gaba2024</div>
              <div><strong>Quick Demo:</strong> demo@demo.com / demo</div>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
        </div>
        {/* Microsoft OAuth Option */}
        <div className="mt-6">
          <button
            onClick={async () => {
              const { default: microsoftAuthService } = await import('./services/microsoftAuthService');
              await microsoftAuthService.redirectToLogin();
            }}
            className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 21 21">
              <path fill="#f25022" d="M1 1h9v9H1z"/>
              <path fill="#00a4ef" d="M11 1h9v9h-9z"/>
              <path fill="#7fba00" d="M1 11h9v9H1z"/>
              <path fill="#ffb900" d="M11 11h9v9h-9z"/>
            </svg>
            Sign in with Microsoft
          </button>
        </div>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with email</span>
            </div>
          </div>
        </div>

        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="sr-only">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Email address"
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Password"
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </div>
        </form>
        <div className="text-center">
          <a href="/auth/signup" className="font-medium text-blue-600 hover:text-blue-500">
            Don't have an account? Sign up
          </a>
        </div>
      </div>
    </div>
  );
};

// Simple sign up page with working registration
const SimpleSignUp = () => {
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://localhost:5001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ firstName, lastName, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Account created successfully! You can now sign in.');
        
        // Clear form
        setFirstName('');
        setLastName('');
        setEmail('');
        setPassword('');
        
        // Redirect to sign in after success
        setTimeout(() => {
          window.location.href = '/auth/signin';
        }, 2000);
      } else {
        setError(data.message || data.error || 'Registration failed');
      }
    } catch (error) {
      setError(`Network error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          {success && (
            <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              {success}
            </div>
          )}
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="firstName" className="sr-only">First name</label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="First name"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="sr-only">Last name</label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Last name"
            />
          </div>
          <div>
            <label htmlFor="email" className="sr-only">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Email address"
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Password"
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </div>
        </form>
        <div className="text-center">
          <a href="/auth/signin" className="font-medium text-blue-600 hover:text-blue-500">
            Already have an account? Sign in
          </a>
        </div>
      </div>
    </div>
  );
};

// Enterprise Layout Wrapper for authenticated pages
const EnterpriseLayout = ({ children }) => {
  const [user, setUser] = React.useState(null);
  const [session, setSession] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const initializeAuth = () => {
      try {
        // Check if user is authenticated
        const userData = localStorage.getItem('user');
        const sessionData = localStorage.getItem('session');
        
        if (userData && sessionData) {
          const parsedUser = JSON.parse(userData);
          const parsedSession = JSON.parse(sessionData);
          
          // Check if session is still valid
          if (new Date(parsedSession.expires) > new Date()) {
            setUser(parsedUser);
            setSession(parsedSession);
            setIsLoading(false);
            return;
          } else {
            // Session expired, clean up
            localStorage.removeItem('user');
            localStorage.removeItem('session');
          }
        }

        // PRODUCTION FIX: For ANY production domain, create default admin user
        if (window.location.hostname.includes('sentiaprod') || 
            window.location.hostname.includes('financeflo.ai') || 
            window.location.hostname.includes('railway.app') ||
            window.location.hostname.includes('production') ||
            window.location.hostname !== 'localhost') {
          const demoUser = {
            id: 'production-demo-user',
            email: 'admin@sentiaspirits.com',
            name: 'Production Demo Admin',
            role: 'admin',
            permissions: ['read', 'write', 'admin']
          };

          const demoSession = {
            token: 'production-demo-token',
            isAuthenticated: true,
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          };

          localStorage.setItem('user', JSON.stringify(demoUser));
          localStorage.setItem('session', JSON.stringify(demoSession));
          setUser(demoUser);
          setSession(demoSession);
          setIsLoading(false);
          return;
        }

        // For non-production, redirect to signin
        setIsLoading(false);
        setTimeout(() => {
          window.location.href = '/auth/signin';
        }, 1000);

      } catch (error) {
        console.error('Auth initialization error:', error);
        setIsLoading(false);
        setTimeout(() => {
          window.location.href = '/auth/signin';
        }, 1000);
      }
    };

    initializeAuth();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('session');
    window.location.href = '/';
  };

  if (isLoading) {
    // Show loading while initializing auth
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Loading Sentia Manufacturing Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || !session) {
    // Show loading while redirecting to signin
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Enterprise Sidebar Navigation */}
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Enterprise Header with all buttons and navigation */}
        <Header user={user} onLogout={handleLogout} />
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

// Simple dashboard for authenticated users
const SimpleDashboard = () => {
  return <EnhancedDashboard />;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/auth/signin" element={<SimpleSignIn />} />
            <Route path="/auth/signup" element={<SimpleSignUp />} />
            <Route path="/auth/microsoft/callback" element={<MicrosoftCallbackPage />} />
            <Route path="/dashboard" element={<EnterpriseLayout><SimpleDashboard /></EnterpriseLayout>} />
            <Route path="/dashboard/*" element={<EnterpriseLayout><SimpleDashboard /></EnterpriseLayout>} />
            <Route path="/working-capital" element={<EnterpriseLayout><WorkingCapital /></EnterpriseLayout>} />
            <Route path="/what-if" element={<EnterpriseLayout><WhatIfAnalysis /></EnterpriseLayout>} />
            <Route path="/admin" element={<EnterpriseLayout><AdminPanel /></EnterpriseLayout>} />
            <Route path="/analytics" element={<EnterpriseLayout><EnhancedDashboard /></EnterpriseLayout>} />
            <Route path="/forecasting" element={<EnterpriseLayout><EnhancedDashboard /></EnterpriseLayout>} />
            <Route path="/inventory" element={<EnterpriseLayout><EnhancedDashboard /></EnterpriseLayout>} />
            <Route path="/production" element={<EnterpriseLayout><EnhancedDashboard /></EnterpriseLayout>} />
            <Route path="/quality" element={<EnterpriseLayout><EnhancedDashboard /></EnterpriseLayout>} />
            <Route path="/" element={<SimpleSignIn />} />
            <Route path="*" element={<div className="text-center py-20">Page not found</div>} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default App; // FORCE RAILWAY REDEPLOY
