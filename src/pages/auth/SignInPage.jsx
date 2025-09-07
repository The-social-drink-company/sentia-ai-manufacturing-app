import React from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SignInPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

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

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn('azure-ad', { 
        callbackUrl: '/dashboard',
        redirect: false 
      });
    } catch (error) {
      console.error('Sign in error:', error);
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
          <div>
            <button
              onClick={handleSignIn}
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
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 21 21" fill="currentColor">
                    <path d="M20.5 10.5h-18a1 1 0 0 0 0 2h18a1 1 0 0 0 0-2z"/>
                    <path d="M14.5 4.5l6 6-6 6"/>
                  </svg>
                  Sign in with Microsoft
                </div>
              )}
            </button>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Secure authentication powered by Microsoft Azure AD
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;