import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ExclamationTriangleIcon, ArrowLeftIcon, HomeIcon } from '@heroicons/react/24/outline'

/**
 * AuthError Component
 *
 * Displays authentication-related errors with contextual actions.
 * Provides user-friendly error messages and navigation options.
 *
 * @param {Object} props - Component props
 * @param {string} props.type - Error type ('unauthorized', 'session-expired', 'invalid-credentials', 'network', 'unknown')
 * @param {string} props.message - Custom error message (overrides default)
 * @param {Function} props.onRetry - Optional retry callback function
 * @param {boolean} props.showBackButton - Whether to show back navigation button (default: true)
 * @param {boolean} props.showHomeButton - Whether to show home navigation button (default: true)
 *
 * @example
 * // Unauthorized access
 * <AuthError type="unauthorized" />
 *
 * @example
 * // Session expired with retry
 * <AuthError
 *   type="session-expired"
 *   onRetry={() => window.location.reload()}
 * />
 *
 * @example
 * // Custom error message
 * <AuthError
 *   type="unknown"
 *   message="An unexpected error occurred. Please contact support."
 * />
 */
const AuthError = ({
  type = 'unknown',
  message,
  onRetry,
  showBackButton = true,
  showHomeButton = true,
}) => {
  const navigate = useNavigate()

  // Error type configurations
  const errorConfig = {
    unauthorized: {
      title: 'Access Denied',
      defaultMessage:
        'You do not have permission to access this resource. Please contact your administrator if you believe this is an error.',
      icon: ExclamationTriangleIcon,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
    },
    'session-expired': {
      title: 'Session Expired',
      defaultMessage:
        'Your session has expired for security reasons. Please sign in again to continue.',
      icon: ExclamationTriangleIcon,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
    },
    'invalid-credentials': {
      title: 'Invalid Credentials',
      defaultMessage:
        'The credentials you provided are invalid. Please check your email and password and try again.',
      icon: ExclamationTriangleIcon,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
    },
    network: {
      title: 'Network Error',
      defaultMessage:
        'Unable to connect to the authentication server. Please check your internet connection and try again.',
      icon: ExclamationTriangleIcon,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    unknown: {
      title: 'Authentication Error',
      defaultMessage:
        'An unexpected error occurred during authentication. Please try again or contact support if the problem persists.',
      icon: ExclamationTriangleIcon,
      color: 'text-gray-500',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
    },
  }

  const config = errorConfig[type] || errorConfig.unknown
  const ErrorIcon = config.icon

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Error Card */}
        <div
          className={`rounded-lg border ${config.borderColor} ${config.bgColor} bg-white p-8 shadow-lg`}
        >
          {/* Icon */}
          <div className="mb-4 flex justify-center">
            <div className={`rounded-full ${config.bgColor} p-3`}>
              <ErrorIcon className={`h-12 w-12 ${config.color}`} />
            </div>
          </div>

          {/* Title */}
          <h2 className="mb-3 text-center text-2xl font-bold text-gray-900">
            {config.title}
          </h2>

          {/* Message */}
          <p className="mb-6 text-center text-sm text-gray-600">
            {message || config.defaultMessage}
          </p>

          {/* Actions */}
          <div className="space-y-3">
            {/* Retry Button */}
            {onRetry && (
              <button
                onClick={onRetry}
                className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Try Again
              </button>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3">
              {showBackButton && (
                <button
                  onClick={() => navigate(-1)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  Go Back
                </button>
              )}

              {showHomeButton && (
                <button
                  onClick={() => navigate('/')}
                  className="flex flex-1 items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <HomeIcon className="h-4 w-4" />
                  Home
                </button>
              )}
            </div>

            {/* Sign In Link (for unauthorized/session-expired) */}
            {(type === 'unauthorized' || type === 'session-expired') && (
              <button
                onClick={() => navigate('/sign-in')}
                className="w-full rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Footer Help Text */}
        <p className="mt-6 text-center text-xs text-slate-400">
          Need help?{' '}
          <a
            href="mailto:support@sentia.com"
            className="font-medium text-blue-400 hover:text-blue-300"
          >
            Contact Support
          </a>
        </p>
      </div>
    </div>
  )
}

export default AuthError
