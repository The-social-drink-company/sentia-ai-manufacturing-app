import React, { useState, useEffect } from 'react';
import { 
  SignalIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const MCPConnectionStatus = () => {
  const [status, setStatus] = useState({
    connected: false,
    server: null,
    version: null,
    uptime: 0,
    features: {},
    lastCheck: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkMCPStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/health');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setStatus({
        connected: data.status === 'healthy',
        server: data.server,
        version: data.version,
        uptime: data.uptime,
        features: data.features || {},
        lastCheck: new Date().toISOString()
      });
      setError(null);
    } catch (err) {
      setStatus(prev => ({
        ...prev,
        connected: false,
        lastCheck: new Date().toISOString()
      }));
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkMCPStatus();
    
    // Check status every 30 seconds
    const interval = setInterval(checkMCPStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (loading) return 'text-yellow-600 bg-yellow-100';
    if (status.connected) return 'text-green-600 bg-green-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusIcon = () => {
    if (loading) return <ArrowPathIcon className="w-5 h-5 animate-spin" />;
    if (status.connected) return <CheckCircleIcon className="w-5 h-5" />;
    return <XCircleIcon className="w-5 h-5" />;
  };

  const formatUptime = (seconds) => {
    if (!seconds) return '0s';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <SignalIcon className="w-6 h-6 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">MCP Server Status</h3>
        </div>
        <button
          onClick={checkMCPStatus}
          disabled={loading}
          className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
        >
          <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Status Overview */}
      <div className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${getStatusColor()}`}>
              {getStatusIcon()}
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {loading ? 'Checking...' : status.connected ? 'Connected' : 'Disconnected'}
              </p>
              <p className="text-sm text-gray-600">
                {status.server || 'MCP Server'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">
              {status.version || 'Unknown'}
            </p>
            <p className="text-xs text-gray-500">
              {status.lastCheck ? `Updated ${new Date(status.lastCheck).toLocaleTimeString()}` : ''}
            </p>
          </div>
        </div>

        {/* Server Details */}
        {status.connected && (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-blue-900">Uptime</span>
              </div>
              <p className="text-lg font-semibold text-blue-800">
                {formatUptime(status.uptime)}
              </p>
            </div>
            
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-900">Features</span>
              </div>
              <p className="text-lg font-semibold text-green-800">
                {Object.keys(status.features).length}
              </p>
            </div>
          </div>
        )}

        {/* Features List */}
        {status.connected && Object.keys(status.features).length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900">Active Features</h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(status.features).map(([feature, enabled]) => (
                <div key={feature} className="flex items-center space-x-2">
                  {enabled ? (
                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircleIcon className="w-4 h-4 text-gray-400" />
                  )}
                  <span className={`text-sm capitalize ${enabled ? 'text-gray-900' : 'text-gray-500'}`}>
                    {feature.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && !loading && (
          <div className="flex items-start space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Connection Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Connection Help */}
        {!status.connected && !loading && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-700 mb-2">
              <strong>Troubleshooting:</strong>
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Ensure MCP server is running: <code className="bg-gray-200 px-1 rounded">cd mcp-server && npm start</code></li>
              <li>• Check if port 3001 is available</li>
              <li>• Verify network connectivity</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default MCPConnectionStatus;