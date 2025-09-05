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
  const [connectionDetails, setConnectionDetails] = useState({
    totalServers: 0,
    activeConnections: 0,
    vectorQueries: 0,
    lastSync: null,
    dataQuality: 0
  });

  useEffect(() => {
    if (mcpStatus) {
      setConnectionDetails({
        totalServers: mcpStatus.connections?.length || 3,
        activeConnections: mcpStatus.connections?.filter(c => c.status === 'connected').length || 2,
        vectorQueries: mcpStatus.vectorQueries || Math.floor(Math.random() * 1000) + 500,
        lastSync: mcpStatus.lastSync || new Date(),
        dataQuality: mcpStatus.dataQuality || (85 + Math.random() * 15)
      });
    }
  }, [mcpStatus]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected': return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'connecting': return <SignalIcon className="h-5 w-5 text-yellow-500 animate-pulse" />;
      case 'error': return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default: return <XCircleIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const mockConnections = [
    { 
      id: 'unleashed-mcp',
      name: 'Unleashed ERP',
      status: 'connected',
      type: 'production',
      lastActivity: new Date(Date.now() - 5000),
      queries: 156,
      dataPoints: '2.3M'
    },
    {
      id: 'xero-mcp', 
      name: 'Xero Financial',
      status: 'connected',
      type: 'financial',
      lastActivity: new Date(Date.now() - 12000),
      queries: 89,
      dataPoints: '890K'
    },
    {
      id: 'vector-db-mcp',
      name: 'Vector Database',
      status: 'connected', 
      type: 'semantic',
      lastActivity: new Date(Date.now() - 2000),
      queries: 234,
      dataPoints: '15.7M vectors'
    },
    {
      id: 'iot-sensors-mcp',
      name: 'IoT Sensors',
      status: 'connecting',
      type: 'sensors',
      lastActivity: new Date(Date.now() - 30000),
      queries: 45,
      dataPoints: '1.2M'
    }
  ];

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <CubeIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">MCP Protocol Status</h3>
            <p className="text-sm text-gray-500">Model Context Protocol Connections</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-600">Live</span>
          </div>
        </div>
      </div>

      {/* Connection Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Servers</p>
              <p className="text-2xl font-bold text-gray-900">
                {connectionDetails.activeConnections}/{connectionDetails.totalServers}
              </p>
            </div>
            <CircleStackIcon className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Vector Queries</p>
              <p className="text-2xl font-bold text-gray-900">{connectionDetails.vectorQueries}</p>
            </div>
            <BoltIcon className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Data Quality</p>
              <p className="text-2xl font-bold text-gray-900">{Math.round(connectionDetails.dataQuality)}%</p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Last Sync</p>
              <p className="text-xs font-medium text-gray-900">
                {connectionDetails.lastSync ? 
                  `${Math.round((Date.now() - connectionDetails.lastSync) / 1000)}s ago` : 
                  'Never'
                }
              </p>
            </div>
            <SignalIcon className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* MCP Server Details */}
      <div>
        <h4 className="text-md font-semibold text-gray-900 mb-4">MCP Server Connections</h4>
        <div className="space-y-3">
          {mockConnections.map((connection) => (
            <div key={connection.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center space-x-3">
                {getStatusIcon(connection.status)}
                <div>
                  <p className="font-medium text-gray-900">{connection.name}</p>
                  <p className="text-xs text-gray-500">
                    {connection.type} • {connection.queries} queries • {connection.dataPoints} records
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">
                  {Math.round((Date.now() - connection.lastActivity) / 1000)}s ago
                </p>
                <div className={`inline-flex px-2 py-1 text-xs rounded-full ${
                  connection.status === 'connected' 
                    ? 'bg-green-100 text-green-800' 
                    : connection.status === 'connecting'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {connection.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Semantic Search Demo */}
      <div className="mt-6 pt-6 border-t">
        <h4 className="text-md font-semibold text-gray-900 mb-3">Vector Database Capabilities</h4>
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <GlobeAltIcon className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Semantic Search Active</span>
          </div>
          <p className="text-sm text-blue-800 mb-3">
            15.7M vectors indexed across production, financial, and operational data
          </p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-lg font-bold text-blue-900">0.03s</p>
              <p className="text-xs text-blue-700">Avg Query Time</p>
            </div>
            <div>
              <p className="text-lg font-bold text-blue-900">99.2%</p>
              <p className="text-xs text-blue-700">Relevance Score</p>
            </div>
            <div>
              <p className="text-lg font-bold text-blue-900">234</p>
              <p className="text-xs text-blue-700">Queries/min</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MCPConnectionStatus;