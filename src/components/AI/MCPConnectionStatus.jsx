import React from 'react';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  CpuChipIcon,
  WifiIcon
} from '@heroicons/react/24/outline';

/**
 * MCP Connection Status Component
 * Displays the status of the Model Context Protocol connection
 */
const MCPConnectionStatus = ({ status = null }) => {
  // Default status if none provided
  const defaultStatus = {
    status: 'disconnected',
    services: [],
    lastUpdate: new Date().toISOString()
  };

  const mcpStatus = status || defaultStatus;
  const isConnected = mcpStatus.status === 'connected';

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <CpuChipIcon className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">MCP Status</h3>
        </div>
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <>
              <CheckCircleIcon className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium text-green-600">Connected</span>
            </>
          ) : (
            <>
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
              <span className="text-sm font-medium text-yellow-600">Disconnected</span>
            </>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Protocol Status</span>
          <span className={`text-sm font-medium ${isConnected ? 'text-green-600' : 'text-yellow-600'}`}>
            {isConnected ? 'Active' : 'Inactive'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Services</span>
          <span className="text-sm font-medium text-gray-900">
            {mcpStatus.services?.length || 0} Available
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Last Update</span>
          <span className="text-sm text-gray-500">
            {new Date(mcpStatus.lastUpdate).toLocaleTimeString()}
          </span>
        </div>
      </div>

      {!isConnected && (
        <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <WifiIcon className="w-4 h-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">
              MCP service is currently unavailable. Some AI features may be limited.
            </span>
          </div>
        </div>
      )}

      {isConnected && mcpStatus.services?.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Active Services</h4>
          <div className="space-y-1">
            {mcpStatus.services.slice(0, 3).map((service, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm text-gray-600">{service.name || `Service ${index + 1}`}</span>
              </div>
            ))}
            {mcpStatus.services.length > 3 && (
              <div className="text-xs text-gray-500 mt-1">
                +{mcpStatus.services.length - 3} more services
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MCPConnectionStatus;