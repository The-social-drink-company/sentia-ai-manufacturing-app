import React, { useState, useEffect } from 'react';
import {
  CubeIcon,
  SignalIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  BoltIcon,
  GlobeAltIcon,
  CircleStackIcon
} from '@heroicons/react/24/outline';

const MCPConnectionStatus = ({ mcpStatus, className = "" }) => {
  const [connections, setConnections] = useState([]);
  const [connectionDetails, setConnectionDetails] = useState({
    totalServers: 0,
    activeConnections: 0,
    vectorQueries: 0,
    lastSync: null,
    dataQuality: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMCPStatus = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/mcp/status');
        if (response.ok) {
          const data = await response.json();
          setConnections(data.connections || []);
          setConnectionDetails({
            totalServers: data.totalServers || 0,
            activeConnections: data.activeConnections || 0,
            vectorQueries: data.vectorQueries || 0,
            lastSync: data.lastSync ? new Date(data.lastSync) : null,
            dataQuality: data.dataQuality || 0
          });
        } else {
          console.error('Failed to fetch MCP status');
          setConnections([]);
          setConnectionDetails({
            totalServers: 0,
            activeConnections: 0,
            vectorQueries: 0,
            lastSync: null,
            dataQuality: 0
          });
        }
      } catch (error) {
        console.error('Error fetching MCP status:', error);
        setConnections([]);
        setConnectionDetails({
          totalServers: 0,
          activeConnections: 0,
          vectorQueries: 0,
          lastSync: null,
          dataQuality: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMCPStatus();
    
    // Refresh MCP status every 30 seconds
    const interval = setInterval(fetchMCPStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case 'disconnected':
        return <XCircleIcon className="w-4 h-4 text-red-500" />;
      case 'connecting':
        return <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500 animate-pulse" />;
      default:
        return <XCircleIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'text-green-600';
      case 'disconnected': return 'text-red-600';
      case 'connecting': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const formatLastActivity = (timestamp) => {
    if (!timestamp) return 'Never';
    const now = new Date();
    const diff = now - new Date(timestamp);
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-32"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <CircleStackIcon className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">MCP Protocol Status</h3>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          connectionDetails.activeConnections > 0 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {connectionDetails.activeConnections > 0 ? 'Active' : 'Disconnected'}
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">
            {connectionDetails.activeConnections}/{connectionDetails.totalServers}
          </div>
          <div className="text-sm text-gray-600">Active Connections</div>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">
            {connectionDetails.vectorQueries.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Vector Queries</div>
        </div>
      </div>

      {/* Data Quality Indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Data Quality</span>
          <span className="text-sm font-semibold text-gray-900">
            {connectionDetails.dataQuality.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${
              connectionDetails.dataQuality >= 90 ? 'bg-green-500' :
              connectionDetails.dataQuality >= 70 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${connectionDetails.dataQuality}%` }}
          ></div>
        </div>
      </div>

      {/* Connection List */}
      {connections.length > 0 ? (
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-4">MCP Server Connections</h4>
          <div className="space-y-3">
            {connections.map((connection) => (
              <div 
                key={connection.id} 
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(connection.status)}
                  <div>
                    <p className="font-medium text-gray-900">{connection.name}</p>
                    <p className="text-xs text-gray-500">
                      {connection.type} • {connection.queries || 0} queries • {connection.dataPoints || '0'} records
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-medium ${getStatusColor(connection.status)}`}>
                    {connection.status}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatLastActivity(connection.lastActivity)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-6">
          <CircleStackIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-gray-900 mb-1">No MCP Connections</h3>
          <p className="text-xs text-gray-600">
            MCP servers are not currently connected. Check your configuration.
          </p>
        </div>
      )}

      {/* Last Sync */}
      {connectionDetails.lastSync && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center text-xs text-gray-500">
            <BoltIcon className="w-3 h-3 mr-1" />
            Last sync: {connectionDetails.lastSync.toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
};

export default MCPConnectionStatus;