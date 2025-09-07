import React, { useEffect, useState } from 'react';
import microsoftAuthService from '../../services/microsoftAuthService';

const MicrosoftCallbackPage = () => {
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        if (error) {
          setError(`Microsoft OAuth error: ${error}`);
          setStatus('error');
          return;
        }

        if (!code) {
          setError('No authorization code received from Microsoft');
          setStatus('error');
          return;
        }

        console.log('Processing Microsoft OAuth callback...');
        setStatus('processing');

        const result = await microsoftAuthService.handleCallback(code, state);
        console.log('Microsoft OAuth successful:', result);

        setStatus('success');
        
        // Redirect to dashboard after successful authentication
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);

      } catch (error) {
        console.error('Microsoft OAuth callback error:', error);
        setError(error.message);
        setStatus('error');
      }
    };

    handleCallback();
  }, []);

  if (status === 'processing') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <h2 className="text-xl font-semibold text-gray-900">Signing you in with Microsoft...</h2>
          <p className="text-gray-600">Please wait while we process your authentication</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md text-center">
          <div className="text-green-600 text-6xl">✓</div>
          <h2 className="text-xl font-semibold text-gray-900">Sign in successful!</h2>
          <p className="text-gray-600">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <div className="text-red-600 text-6xl">✗</div>
            <h2 className="text-xl font-semibold text-gray-900 mt-4">Sign in failed</h2>
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          </div>
          <div className="text-center">
            <a
              href="/auth/signin"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Try Again
            </a>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default MicrosoftCallbackPage;