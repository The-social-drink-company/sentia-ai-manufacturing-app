import React, { useEffect, useState } from 'react';
import { useWebSocketStatus, ConnectionState } from '../../hooks/useRealTimeData';
import { WifiIcon, ExclamationCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const ConnectionStatus = () => {
  const { isConnected, isReconnecting, namespaces } = useWebSocketStatus();
  const [showDetails, setShowDetails] = useState(false);
  const [pulseAnimation, setPulseAnimation] = useState(false);

  useEffect(() => {
    // Add pulse animation when connection state changes
    setPulseAnimation(true);
    const timer = setTimeout(() => setPulseAnimation(false), 1000);
    return () => clearTimeout(timer);
  }, [isConnected, isReconnecting]);

  const getStatusColor = () => {
    if (isConnected) return 'text-green-600 bg-green-100';
    if (isReconnecting) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusIcon = () => {
    if (isConnected) {
      return <WifiIcon className="h-4 w-4" />;
    }
    if (isReconnecting) {
      return <ArrowPathIcon className="h-4 w-4 animate-spin" />;
    }
    return <ExclamationCircleIcon className="h-4 w-4" />;
  };

  const getStatusText = () => {
    if (isConnected) return 'Connected';
    if (isReconnecting) return 'Reconnecting...';
    return 'Disconnected';
  };

  const getNamespaceStatus = (status) => {
    switch (status) {
      case ConnectionState.CONNECTED:
        return { color: 'text-green-600', text: 'Connected' };
      case ConnectionState.CONNECTING:
        return { color: 'text-blue-600', text: 'Connecting' };
      case ConnectionState.RECONNECTING:
        return { color: 'text-yellow-600', text: 'Reconnecting' };
      case ConnectionState.DISCONNECTED:
        return { color: 'text-gray-600', text: 'Disconnected' };
      case ConnectionState.ERROR:
        return { color: 'text-red-600', text: 'Error' };
      default:
        return { color: 'text-gray-600', text: 'Unknown' };
    }
  };

  return (
    <div className="relative">
      {/* Main Status Indicator */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`
          flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-all duration-200
          ${getStatusColor()}
          ${pulseAnimation ? 'animate-pulse' : ''}
          hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2
        `}
        aria-label="Connection status"
      >
        {getStatusIcon()}
        <span className="text-sm font-medium">{getStatusText()}</span>
      </button>

      {/* Detailed Connection Status Dropdown */}
      {showDetails && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Real-Time Connection Status
            </h3>
          </div>
          <div className="p-3 space-y-2">
            {Object.entries(namespaces).map(([name, status]) => {
              const { color, text } = getNamespaceStatus(status);
              return (
                <div key={name} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                    {name}
                  </span>
                  <span className={`text-sm font-medium ${color}`}>
                    {text}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Active</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>Reconnecting</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Disconnected</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connection Lost Alert */}
      {!isConnected && !isReconnecting && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 animate-slide-in">
          <div className="flex items-center space-x-3">
            <ExclamationCircleIcon className="h-5 w-5" />
            <div>
              <p className="font-semibold">Connection Lost</p>
              <p className="text-sm opacity-90">Real-time updates unavailable</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;