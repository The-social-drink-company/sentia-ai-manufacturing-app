import React from 'react';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const MCPStatusWidget = () => {
  // Mock data for display purposes since MCP service is not available in this build
  const healthData = { status: 'disconnected', environment: 'test', version: '1.0.0', uptime: '0s' };
  const healthLoading = false;
  const healthError = true;
  const providersData = { providers: [] };
  const providersLoading = false;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
      case 'connected':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'error':
      case 'disconnected':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
      case 'connected':
        return 'text-green-600';
      case 'error':
      case 'disconnected':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          MCP Server Status
        </h3>
        <div className="flex items-center space-x-2">
          {healthLoading ? (
            <div className="animate-pulse h-2 w-2 bg-yellow-500 rounded-full" />
          ) : healthError ? (
            <XCircleIcon className="h-5 w-5 text-red-500" />
          ) : (
            getStatusIcon(healthData?.status)
          )}
          <span className={`text-sm font-medium ${
            healthError ? 'text-red-600' : getStatusColor(healthData?.status)
          }`}>
            {healthLoading ? 'Checking...' : healthError ? 'Offline' : healthData?.status || 'Unknown'}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {/* Server Info */}
        {healthData && !healthError && (
          <div className="text-sm text-gray-600 dark:text-gray-300">
            <div className="flex justify-between">
              <span>Environment:</span>
              <span className="font-medium">{healthData.environment || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span>Version:</span>
              <span className="font-medium">{healthData.version || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span>Uptime:</span>
              <span className="font-medium">{healthData.uptime || 'N/A'}</span>
            </div>
          </div>
        )}

        {/* Provider Status */}
        {providersData && !providersLoading && (
          <div className="border-t dark:border-gray-700 pt-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Service Providers
            </h4>
            <div className="space-y-2">
              {providersData.providers?.map((provider) => (
                <div key={provider.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(provider.status)}
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {provider.name}
                    </span>
                  </div>
                  <span className={`text-xs ${getStatusColor(provider.status)}`}>
                    {provider.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Message */}
        {healthError && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded p-3">
            <p className="text-sm text-red-600 dark:text-red-400">
              Unable to connect to MCP Server. Please check your configuration.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MCPStatusWidget;