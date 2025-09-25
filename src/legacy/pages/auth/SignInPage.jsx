import { devLog } from '../lib/devLog.js';\nimport React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
const SignInPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    // Check if user is already authenticated
    const checkSession = async () => {
      const session = await getSession();
      if (session) {
        navigate('/dashboard');
      }
    };
    checkSession();
  }, [navigate]);

  const handleMicrosoftSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await ('microsoft', { 
        callbackUrl: '/dashboard',
        redirect: false 
      });
      
      if (result?.error) {
        devLog.error('Microsoft sign in error:', result.error);
        alert('Microsoft sign in failed. Please try again.');
      } else if (result?.ok) {
        navigate('/dashboard');
      }
    } catch (error) {
      devLog.error('Microsoft sign in error:', error);
      alert('Microsoft sign in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCredentialsSignIn = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await ('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl: '/dashboard'
      });
      
      if (result?.error) {
        devLog.error('Sign in error:', result.error);
        alert('Sign in failed. Please check your credentials.');
      } else if (result?.ok) {
        navigate('/dashboard');
      }
    } catch (error) {
      devLog.error('Credentials sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to Sentia Manufacturing
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Access your manufacturing dashboard
          </p>
        </div>
        <div className="mt-8 space-y-6">
          {/* Microsoft OAuth Sign In */}
          <div>
            <button
              onClick={handleMicrosoftSignIn}
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.464 12.054c0-.815-.073-1.594-.21-2.35H12v4.448h6.44c-.277 1.49-1.125 2.751-2.398 3.595v2.967h3.88c2.268-2.089 3.542-5.162 3.542-8.66z"/>
                    <path d="M12 24c3.24 0 5.956-1.075 7.947-2.906l-3.88-2.967c-1.075.72-2.449 1.145-4.067 1.145-3.125 0-5.771-2.108-6.715-4.944H1.273v3.062C3.25 21.245 7.305 24 12 24z"/>
                    <path d="M5.285 14.328c-.242-.72-.381-1.49-.381-2.328s.139-1.608.381-2.328V6.61H1.273C.463 8.228 0 10.062 0 12s.463 3.772 1.273 5.39l4.012-3.062z"/>
                    <path d="M12 4.773c1.762 0 3.344.605 4.587 1.794l3.434-3.434C17.956.99 15.24 0 12 0 7.305 0 3.25 2.755 1.273 6.61l4.012 3.062C6.229 6.881 8.875 4.773 12 4.773z"/>
                  </svg>
                  Sign in with Microsoft
                </div>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">OR</span>
            </div>
          </div>

          {/* Email/Password Sign In */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setShowCredentials(!showCredentials)}
              className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {showCredentials ? 'Hide Email & Password Sign In' : 'Sign in with Email & Password'}
            </button>

            {showCredentials && (
              <form onSubmit={handleCredentialsSignIn} className="space-y-4">
                <div>
                  <label htmlFor="email" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Email address"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="sr-only">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Password"
                  />
                </div>
                <div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Signing in...
                      </div>
                    ) : (
                      'Sign in with Email & Password'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Secure authentication powered by NextAuth.js
            </p>
            {showCredentials && (
              <div className="mt-2 space-y-1">
                <p className="text-xs text-gray-400">
                  Default accounts: admin@sentia.com (password: admin123)
                </p>
                <p className="text-xs text-gray-400">
                  test@sentia.com (password: test123)
                </p>
                <p className="text-xs">
                  <Link 
                    to="/auth/signup" 
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    Create new account
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;