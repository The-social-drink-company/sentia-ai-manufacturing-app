/**
 * Xero Connection Banner Component
 *
 * Shows connection prompts and status across all pages that require Xero data.
 * Provides one-click connection flow and real-time status updates.
 */

import { useState } from 'react'
import {
  ExclamationTriangleIcon,
  LinkIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import { useXero } from '../contexts/XeroContext'

const XeroConnectionBanner = ({
  onDismiss = null,
  variant = 'full', // 'full', 'compact', 'minimal'
  showDismiss = true,
  className = '',
}) => {
  const { isConnected, isLoading, lastError, retry } = useXero()

  const [isDismissed, setIsDismissed] = useState(false)

  // Don't show banner if connected or dismissed
  if (isConnected || isDismissed) return null

  const handleDismiss = () => {
    setIsDismissed(true)
    onDismiss?.()
  }

  const handleRetry = () => {
    retry()
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={`bg-blue-50 border-l-4 border-blue-400 p-4 ${className}`}>
        <div className="flex items-center">
          <ArrowPathIcon className="h-5 w-5 text-blue-400 animate-spin mr-3" />
          <div className="flex-1">
            <p className="text-sm text-blue-700">Checking Xero connection...</p>
          </div>
          {showDismiss && (
            <button onClick={handleDismiss} className="ml-3 text-blue-400 hover:text-blue-600">
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    )
  }

  // Error state
  if (lastError) {
    return (
      <div className={`bg-red-50 border-l-4 border-red-400 p-4 ${className}`}>
        <div className="flex">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-red-800">Xero Connection Error</h3>
            <p className="mt-1 text-sm text-red-700">{lastError}</p>
            <div className="mt-3">
              <button
                onClick={handleRetry}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Try Again
              </button>
            </div>
          </div>
          {showDismiss && (
            <button onClick={handleDismiss} className="ml-3 text-red-400 hover:text-red-600">
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    )
  }

  // Compact variant - minimal UI
  if (variant === 'compact') {
    return (
      <div className={`bg-yellow-50 border-l-4 border-yellow-400 p-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-4 w-4 text-yellow-400 mr-2" />
            <span className="text-sm text-yellow-800">
              Xero credentials required for live financial data
            </span>
          </div>
          <button
            onClick={handleRetry}
            className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-yellow-800 bg-yellow-100 hover:bg-yellow-200"
          >
            <ArrowPathIcon className="h-3 w-3 mr-1" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Minimal variant - just a small notice
  if (variant === 'minimal') {
    return (
      <div
        className={`flex items-center justify-center py-2 px-4 bg-yellow-100 text-yellow-800 text-sm ${className}`}
      >
        <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
        <span>Xero credentials required for financial data</span>
        <button onClick={handleRetry} className="ml-2 underline hover:no-underline">
          Check connection
        </button>
      </div>
    )
  }

  // Full variant - detailed information
  return (
    <div className={`bg-yellow-50 border-l-4 border-yellow-400 p-4 ${className}`}>
      <div className="flex">
        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 flex-shrink-0" />
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">Xero Credentials Required</h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>
              To display real-time financial data, invoices, and cash flow information, please
              configure your Xero credentials in the environment settings.
            </p>
          </div>
          <div className="mt-4">
            <div className="flex space-x-3">
              <button
                onClick={handleRetry}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Check Connection
              </button>
              <button
                onClick={() =>
                  window.open(
                    'https://developer.xero.com/documentation/custom-connections/overview',
                    '_blank'
                  )
                }
                className="inline-flex items-center px-4 py-2 border border-yellow-300 text-sm font-medium rounded-md text-yellow-700 bg-yellow-50 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                Learn More
              </button>
            </div>
          </div>
        </div>
        {showDismiss && (
          <button onClick={handleDismiss} className="ml-3 text-yellow-400 hover:text-yellow-600">
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

export default XeroConnectionBanner
