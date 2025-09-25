import React from 'react';
import { 
  CpuChipIcon,
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

/**
 * MCP Status Widget
 * Compact widget showing MCP (Model Context Protocol) status
 */
const MCPStatusWidget = ({ status = null }) => {
  // Default status if none provided
  const defaultStatus = {
    status: 'disconnected',
    services: [],
    lastUpdate: new Date().toISOString(),
    responseTime: null
  };

  const mcpStatus = status || defaultStatus;
  const isConnected = mcpStatus.status === 'connected';
  const serviceCount = mcpStatus.services?.length || 0;

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <CpuChipIcon className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-900">MCP Protocol</h3>
        </div>
        <div className="flex items-center">
          {isConnected ? (
            <CheckCircleIcon className="w-4 h-4 text-green-500" />
          ) : (
            <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />
          )}
        </div>
      </div>

      {/* Status Indicator */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">Status</span>
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
            <span className={`text-xs font-medium ${isConnected ? 'text-green-600' : 'text-yellow-600'}`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">Services</span>
          <span className="text-xs font-medium text-gray-900">
            {serviceCount}
          </span>
        </div>

        {mcpStatus.responseTime && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Response Time</span>
            <span className="text-xs text-gray-900">
              {mcpStatus.responseTime}ms
            </span>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-gray-50 rounded p-2 text-center">
          <div className="text-lg font-bold text-gray-900">{serviceCount}</div>
          <div className="text-xs text-gray-600">Services</div>
        </div>
        <div className="bg-gray-50 rounded p-2 text-center">
          <div className={`text-lg font-bold ${isConnected ? 'text-green-600' : 'text-yellow-600'}`}>
            {isConnected ? '100%' : '0%'}
          </div>
          <div className="text-xs text-gray-600">Uptime</div>
        </div>
      </div>

      {/* Last Update */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-1">
          <ClockIcon className="w-3 h-3" />
          <span>Updated</span>
        </div>
        <span>
          {new Date(mcpStatus.lastUpdate).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </span>
      </div>

      {/* Status Message */}
      {!isConnected && (
        <div className="mt-2 text-xs text-yellow-700 bg-yellow-50 rounded px-2 py-1">
          AI features may be limited
        </div>
      )}
    </div>
  );
};

export default MCPStatusWidget;
