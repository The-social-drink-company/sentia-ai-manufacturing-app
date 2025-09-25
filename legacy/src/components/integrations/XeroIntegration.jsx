/**
 * Xero Integration Component
 * Manages Xero OAuth connection and manual sync triggers
 */

import React, { useState, useEffect } from 'react';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  XCircleIcon,
  LinkIcon,
  ArrowTopRightOnSquareIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { BanknotesIcon } from '@heroicons/react/24/solid';
import { logDebug, logInfo, logWarn, logError } from '../../utils/logger';


const XeroIntegration = () => {
  const [connectionStatus, setConnectionStatus] = useState({
    connected: false,
    status: 'checking',
    message: 'Checking connection...',
    lastSync: null,
    tenantName: null
  });
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check Xero connection status on mount
  useEffect(() => {
    checkConnectionStatus();

    // Check for OAuth callback params
    const urlParams = new URLSearchParams(window.location.search);
    const xeroStatus = urlParams.get('xero');

    if (xeroStatus === 'connected') {
      setConnectionStatus(prev => ({
        ...prev,
        message: 'Successfully connected to Xero!'
      }));
      // Remove query params
      window.history.replaceState({}, document.title, window.location.pathname);
      // Refresh status
      checkConnectionStatus();
    } else if (xeroStatus === 'failed' || xeroStatus === 'error') {
      setConnectionStatus(prev => ({
        ...prev,
        status: 'error',
        message: 'Failed to connect to Xero. Please try again.'
      }));
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const checkConnectionStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/xero/status');
      const data = await response.json();
      setConnectionStatus(data);
    } catch (error) {
      logError('Failed to check Xero status:', error);
      setConnectionStatus({
        connected: false,
        status: 'error',
        message: 'Failed to check connection status'
      });
    } finally {
      setLoading(false);
    }
  };

  const initiateXeroAuth = async () => {
    try {
      const response = await fetch('/api/xero/auth');
      const data = await response.json();

      if (data.success && data.url) {
        // Redirect to Xero OAuth consent page
        window.location.href = data.url;
      } else {
        throw new Error('Failed to get authorization URL');
      }
    } catch (error) {
      logError('Failed to initiate Xero auth:', error);
      setConnectionStatus({
        connected: false,
        status: 'error',
        message: 'Failed to connect to Xero. Please check your configuration.'
      });
    }
  };

  const triggerManualSync = async () => {
    setSyncing(true);
    setSyncResult(null);

    try {
      const response = await fetch('/api/xero/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      setSyncResult(data);

      // Refresh connection status
      await checkConnectionStatus();
    } catch (error) {
      logError('Manual sync failed:', error);
      setSyncResult({
        success: false,
        error: error.message
      });
    } finally {
      setSyncing(false);
    }
  };

  const disconnectXero = async () => {
    if (!confirm('Are you sure you want to disconnect Xero? This will stop automatic data synchronization.')) {
      return;
    }

    try {
      const response = await fetch('/api/xero/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setConnectionStatus({
          connected: false,
          status: 'disconnected',
          message: 'Xero disconnected successfully'
        });
        setSyncResult(null);
      }
    } catch (error) {
      logError('Failed to disconnect Xero:', error);
    }
  };

  const formatLastSync = (date) => {
    if (!date) return 'Never';

    const syncDate = new Date(date);
    const now = new Date();
    const diffMs = now - syncDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const getStatusIcon = () => {
    if (loading) {
      return <ClockIcon className="h-6 w-6 text-gray-400 animate-pulse" />;
    }

    switch (connectionStatus.status) {
      case 'connected':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case 'error':
      case 'token_expired':
        return <ExclamationCircleIcon className="h-6 w-6 text-red-500" />;
      case 'not_authenticated':
      case 'disconnected':
        return <XCircleIcon className="h-6 w-6 text-gray-400" />;
      default:
        return <ClockIcon className="h-6 w-6 text-gray-400" />;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <BanknotesIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Xero Integration
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Synchronize financial data from Xero accounting
            </p>
          </div>
        </div>
        {getStatusIcon()}
      </div>

      {/* Connection Status */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Connection Status
          </span>
          {connectionStatus.connected && (
            <button
              onClick={checkConnectionStatus}
              className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400"
              disabled={loading}
            >
              Refresh
            </button>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Status:
            </span>
            <span className={`text-sm font-medium ${
              connectionStatus.connected
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {connectionStatus.message}
            </span>
          </div>

          {connectionStatus.tenantName && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Organization:
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {connectionStatus.tenantName}
              </span>
            </div>
          )}

          {connectionStatus.lastSync && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Last Sync:
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {formatLastSync(connectionStatus.lastSync)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {!connectionStatus.connected ? (
          <button
            onClick={initiateXeroAuth}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <LinkIcon className="h-5 w-5" />
            <span>Connect to Xero</span>
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
          </button>
        ) : (
          <>
            <button
              onClick={triggerManualSync}
              disabled={syncing || loading}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowPathIcon className={`h-5 w-5 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Syncing...' : 'Manual Sync'}</span>
            </button>

            <button
              onClick={disconnectXero}
              disabled={loading || syncing}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <XCircleIcon className="h-5 w-5" />
              <span>Disconnect Xero</span>
            </button>
          </>
        )}
      </div>

      {/* Sync Results */}
      {syncResult && (
        <div className={`mt-6 p-4 rounded-lg ${
          syncResult.success
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
        }`}>
          <h3 className={`text-sm font-medium mb-2 ${
            syncResult.success
              ? 'text-green-800 dark:text-green-200'
              : 'text-red-800 dark:text-red-200'
          }`}>
            {syncResult.success ? 'Sync Completed Successfully' : 'Sync Failed'}
          </h3>

          {syncResult.success && syncResult.results && (
            <div className="space-y-1">
              <div className="text-xs text-green-700 dark:text-green-300">
                â€¢ Invoices synced: {syncResult.results.invoices || 0}
              </div>
              <div className="text-xs text-green-700 dark:text-green-300">
                â€¢ Bank transactions synced: {syncResult.results.bankTransactions || 0}
              </div>
              <div className="text-xs text-green-700 dark:text-green-300">
                â€¢ Accounts synced: {syncResult.results.accounts || 0}
              </div>
              <div className="text-xs text-green-700 dark:text-green-300">
                â€¢ Working capital updated: {syncResult.results.workingCapital ? 'Yes' : 'No'}
              </div>
            </div>
          )}

          {!syncResult.success && syncResult.error && (
            <p className="text-xs text-red-700 dark:text-red-300">
              {syncResult.error}
            </p>
          )}
        </div>
      )}

      {/* Info */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
          Automatic Synchronization
        </h3>
        <p className="text-xs text-blue-700 dark:text-blue-300">
          When connected, Xero data is automatically synchronized every 30 minutes.
          Real-time updates are also received via webhooks for immediate data reflection.
        </p>
      </div>
    </div>
  );
};

export default XeroIntegration;
