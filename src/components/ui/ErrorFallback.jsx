import React from 'react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

const ErrorFallback = ({ error, resetErrorBoundary }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900 rounded-full">
          <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>

        <h2 className="mt-4 text-xl font-semibold text-center text-gray-900 dark:text-white">
          Something went wrong
        </h2>

        <p className="mt-2 text-sm text-center text-gray-600 dark:text-gray-400">
          An unexpected error occurred. Please try refreshing the page or contact support if the
          problem persists.
        </p>

        {error?.message && (
          <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
            <p className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">
              {error.message}
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={resetErrorBoundary}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            Try Again
          </button>

          <button
            onClick={() => (window.location.href = '/dashboard')}
            className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200 font-medium"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}

export default ErrorFallback
