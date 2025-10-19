/**
 * Xero Connection Component
 * Handles Xero OAuth authentication and connection status
 */

import { useState, useEffect } from 'react'
import {
  LinkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import { useXeroIntegration } from '../hooks/useXeroIntegration'
import { logError } from '../../../utils/structuredLogger.js'

export default function XeroConnection({ onConnectionChange }) {
  const {
    connectionStatus,
    isConnected,
    isAuthenticating,
    isLoading,
    authenticate,
    disconnect,
    startAuthFlow,
  } = useXeroIntegration()

  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    if (onConnectionChange) {
      onConnectionChange(Boolean(isConnected), connectionStatus)
    }
  }, [isConnected, connectionStatus, onConnectionChange])

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const state = urlParams.get('state')
    const oauthError = urlParams.get('error')

    if (oauthError) {
      logError('Xero OAuth error', oauthError)
      return
    }

    if (code && state && !isConnected && !isAuthenticating) {
      authenticate({ code, state })
      const newUrl = window.location.pathname
      window.history.replaceState({}, document.title, newUrl)
    }
  }, [authenticate, isConnected, isAuthenticating])

  const handleConnect = () => {
    startAuthFlow()
  }

  const handleDisconnect = () => {
    if (
      window.confirm('Disconnecting will switch the dashboard back to internal data. Continue?')
    ) {
      disconnect()
    }
  }

  const formatTokenExpiry = expiry => {
    if (!expiry) return 'Unknown'
    const date = new Date(expiry)
    const now = new Date()
    const diffHours = Math.round((date - now) / (1000 * 60 * 60))
    if (diffHours <= 0) return 'Expired'
    if (diffHours < 24) return `Expires in ${diffHours} hours`
    return `Expires in ${Math.round(diffHours / 24)} days`
  }

  if (isLoading || isAuthenticating) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-center">
          <ArrowPathIcon className="h-6 w-6 text-blue-600 animate-spin mr-3" />
          <span className="text-gray-700 dark:text-gray-300">
            {isAuthenticating ? 'Connecting to Xero...' : 'Checking connection status...'}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {isConnected ? (
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              ) : (
                <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
              )}
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Xero Integration
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isConnected
                  ? `Connected to ${connectionStatus?.tenantName || 'Xero'}`
                  : 'Connect to Xero to sync invoices, payments, and cash flow'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {isConnected ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowDetails(!showDetails)}
                  className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-md hover:border-gray-400 dark:hover:border-gray-500 transition"
                >
                  {showDetails ? 'Hide details' : 'Show details'}
                </button>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="px-4 py-2 text-sm text-red-600 hover:text-red-700 border border-red-300 rounded-md hover:border-red-400 transition"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleConnect}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                <LinkIcon className="h-4 w-4 mr-2" />
                Connect to Xero
              </button>
            )}
          </div>
        </div>

        {showDetails && isConnected && (
          <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Connection details
                </h4>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>Organisation:</span>
                    <span className="font-medium">{connectionStatus?.tenantName || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tenant ID:</span>
                    <span className="font-mono text-xs">
                      {connectionStatus?.tenantId?.slice(0, 8) || 'Unknown'}...
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="font-medium">{connectionStatus?.status || 'Connected'}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Token health
                </h4>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>Expires:</span>
                    <span>{formatTokenExpiry(connectionStatus?.expiresAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Scope:</span>
                    <span>{connectionStatus?.scopes?.join(', ') || 'accounting.read'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {!isConnected && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
          <p className="mb-2 font-medium text-gray-700 dark:text-gray-300">Why connect?</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Sync live invoices and outstanding balances</li>
            <li>Automatically calculate DSO/DPO from ledger data</li>
            <li>Feed MCP-driven recommendations with historical trends</li>
          </ul>
        </div>
      )}
    </div>
  )
}
