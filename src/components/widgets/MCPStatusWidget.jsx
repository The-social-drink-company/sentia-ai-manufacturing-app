import React from 'react';
import { useMCPService } from '../../hooks/useMCPService';

/**
 * MCP Status Widget Component
 * Compact widget showing MCP service status for dashboards
 */
export default function MCPStatusWidget() {
  const { 
    health, 
    isConnected, 
    connections, 
    tools, 
    loading 
  } = useMCPService();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900">MCP Service</h3>
        <div className={`w-3 h-3 rounded-full ${
          isConnected ? 'bg-green-500' : 'bg-red-500'
        }`}></div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Status:</span>
          <span className={`font-medium ${
            health === 'healthy' ? 'text-green-600' : 'text-yellow-600'
          }`}>
            {health || 'unknown'}
          </span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Connections:</span>
          <span className="font-medium">{connections.length}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Tools:</span>
          <span className="font-medium">{tools.length}</span>
        </div>
      </div>
    </div>
  );
}