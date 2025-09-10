import React from 'react';
import { useMCPService } from '../../hooks/useMCPService';

/**
 * MCP Connection Status Component
 * Displays the status of the Model Context Protocol service
 */
export default function MCPConnectionStatus() {
  const { 
    health, 
    isConnected, 
    connections, 
    tools, 
    lastUpdated, 
    loading 
  } = useMCPService();

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">MCP Connection Status</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-2">Connection Status</h3>
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
            isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            <span className={`w-2 h-2 rounded-full mr-2 ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}></span>
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-2">Health Status</h3>
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
            health === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
          }`}>
            {health || 'unknown'}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-2">Active Connections</h3>
          <p className="text-2xl font-bold">{connections.length}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-2">Available Tools</h3>
          <p className="text-2xl font-bold">{tools.length}</p>
        </div>
      </div>

      {lastUpdated && (
        <div className="mt-4 text-sm text-gray-500">
          Last updated: {lastUpdated.toLocaleString()}
        </div>
      )}
    </div>
  );
}