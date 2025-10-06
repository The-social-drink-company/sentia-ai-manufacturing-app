import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

const SystemConfig = () => {
  const [config, setConfig] = useState({
    mcpServer: 'https://sentia-mcp-production.onrender.com',
    apiTimeout: 30000,
    refreshInterval: 60000,
    enableAI: true,
    enableSSE: true,
    dataRetention: 90,
  });

  const handleSave = () => {
    localStorage.setItem('systemConfig', JSON.stringify(config));
    alert('Configuration saved successfully!');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">System Configuration</h1>

      <Card>
        <CardHeader>
          <CardTitle>Server Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                MCP Server URL
              </label>
              <input
                type="text"
                value={config.mcpServer}
                onChange={(e) => setConfig({...config, mcpServer: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Timeout (ms)
                </label>
                <input
                  type="number"
                  value={config.apiTimeout}
                  onChange={(e) => setConfig({...config, apiTimeout: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Refresh Interval (ms)
                </label>
                <input
                  type="number"
                  value={config.refreshInterval}
                  onChange={(e) => setConfig({...config, refreshInterval: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Retention (days)
              </label>
              <input
                type="number"
                value={config.dataRetention}
                onChange={(e) => setConfig({...config, dataRetention: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Feature Toggles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={config.enableAI}
                onChange={(e) => setConfig({...config, enableAI: e.target.checked})}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Enable AI Features</span>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={config.enableSSE}
                onChange={(e) => setConfig({...config, enableSSE: e.target.checked})}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Enable Real-time Updates (SSE)</span>
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-600">Database</p>
              <p className="font-medium text-green-600">Connected</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">MCP Server</p>
              <p className="font-medium text-green-600">Active</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Cache</p>
              <p className="font-medium text-blue-600">87% Used</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Version</p>
              <p className="font-medium">v1.0.10</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-3">
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          Restart System
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Save Configuration
        </button>
      </div>
    </div>
  );
};

export default SystemConfig;