import React, { useState, useEffect } from 'react';
import { 
import { logDebug, logInfo, logWarn, logError } from '../../utils/logger';

  CpuChipIcon, 
  CloudIcon, 
  ChartBarIcon, 
  CogIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ExclamationTriangleIcon,
  WrenchScrewdriverIcon,
  BoltIcon
} from '@heroicons/react/24/outline';

const AIStatusDashboard = () => {
  const [aiStatus, setAIStatus] = useState({
    mcpServer: { status: 'loading', details: null },
    aiCentralNervousSystem: { status: 'loading', details: null },
    unifiedAPI: { status: 'loading', details: null },
    llmProviders: { status: 'loading', details: [] },
    manufacturingIntelligence: { status: 'loading', details: null }
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAISystemStatus();
    const interval = setInterval(checkAISystemStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const checkAISystemStatus = async () => {
    try {
      // Check main MCP server status
      const mcpResponse = await fetch('/api/mcp/status').catch(() => null);
      const mcpStatus = mcpResponse ? await mcpResponse.json() : null;

      // Check AI Central Nervous System
      const aiResponse = await fetch('/api/ai/system/status').catch(() => null);
      const aiSystemStatus = aiResponse ? await aiResponse.json() : null;

      // Check API integrations
      const apiResponse = await fetch('/api/integrations/status').catch(() => null);
      const apiStatus = apiResponse ? await apiResponse.json() : null;

      setAIStatus({
        mcpServer: {
          status: mcpStatus ? 'connected' : 'disconnected',
          details: mcpStatus
        },
        aiCentralNervousSystem: {
          status: aiSystemStatus ? 'active' : 'inactive',
          details: aiSystemStatus
        },
        unifiedAPI: {
          status: apiStatus ? 'connected' : 'disconnected',
          details: apiStatus
        },
        llmProviders: {
          status: aiSystemStatus?.llmProviders?.length > 0 ? 'active' : 'inactive',
          details: aiSystemStatus?.llmProviders || []
        },
        manufacturingIntelligence: {
          status: aiSystemStatus?.manufacturingIntelligence ? 'active' : 'inactive',
          details: aiSystemStatus?.manufacturingIntelligence
        }
      });

      setIsLoading(false);
    } catch (error) {
      logError('Failed to check AI system status:', error);
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected':
      case 'active':
        return <CheckCircleIcon className="w-6 h-6 text-green-500" />;
      case 'disconnected':
      case 'inactive':
        return <XCircleIcon className="w-6 h-6 text-red-500" />;
      case 'loading':
        return <CogIcon className="w-6 h-6 text-yellow-500 animate-spin" />;
      default:
        return <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected':
      case 'active':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'disconnected':
      case 'inactive':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'loading':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center space-x-3">
          <CogIcon className="w-8 h-8 text-blue-500 animate-spin" />
          <span className="text-lg text-gray-600">Loading AI System Status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI System Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <CpuChipIcon className="w-8 h-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">AI Central Nervous System Status</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* MCP Server Status */}
          <div className={`p-4 rounded-lg border-2 ${getStatusColor(aiStatus.mcpServer.status)}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">MCP Server</span>
              {getStatusIcon(aiStatus.mcpServer.status)}
            </div>
            <p className="text-sm">Model Context Protocol server for AI orchestration</p>
            {aiStatus.mcpServer.details && (
              <div className="mt-2 text-xs">
                <p>Version: {aiStatus.mcpServer.details.version}</p>
                <p>Uptime: {aiStatus.mcpServer.details.uptime}s</p>
              </div>
            )}
          </div>

          {/* AI Central Nervous System */}
          <div className={`p-4 rounded-lg border-2 ${getStatusColor(aiStatus.aiCentralNervousSystem.status)}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">AI Orchestration</span>
              {getStatusIcon(aiStatus.aiCentralNervousSystem.status)}
            </div>
            <p className="text-sm">Multi-LLM orchestration and decision engine</p>
            {aiStatus.aiCentralNervousSystem.details && (
              <div className="mt-2 text-xs">
                <p>Active Agents: {aiStatus.aiCentralNervousSystem.details.activeAgents || 0}</p>
                <p>Decisions Made: {aiStatus.aiCentralNervousSystem.details.decisionsCount || 0}</p>
              </div>
            )}
          </div>

          {/* Unified API Interface */}
          <div className={`p-4 rounded-lg border-2 ${getStatusColor(aiStatus.unifiedAPI.status)}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">API Integration</span>
              {getStatusIcon(aiStatus.unifiedAPI.status)}
            </div>
            <p className="text-sm">Unified interface to external services</p>
            {aiStatus.unifiedAPI.details && (
              <div className="mt-2 text-xs">
                <p>Services: {aiStatus.unifiedAPI.details.connectedServices || 0}</p>
                <p>Last Sync: {aiStatus.unifiedAPI.details.lastSync || 'Never'}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* LLM Providers Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <CloudIcon className="w-8 h-8 text-purple-600" />
          <h3 className="text-xl font-bold text-gray-900">LLM Providers</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {['Claude 3.5 Sonnet', 'GPT-4 Turbo', 'Gemini Pro', 'Local LLM'].map((provider, index) => (
            <div key={provider} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 border">
              <div className={`w-3 h-3 rounded-full ${
                aiStatus.llmProviders.details[index]?.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
              }`} />
              <span className="text-sm font-medium">{provider}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Manufacturing Intelligence */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <WrenchScrewdriverIcon className="w-8 h-8 text-orange-600" />
          <h3 className="text-xl font-bold text-gray-900">Manufacturing Intelligence</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
            <span className="text-sm font-medium">Demand Forecasting</span>
            <BoltIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
            <span className="text-sm font-medium">Inventory Optimization</span>
            <BoltIcon className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 border border-purple-200">
            <span className="text-sm font-medium">Quality Analysis</span>
            <BoltIcon className="w-5 h-5 text-purple-600" />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50 border border-orange-200">
            <span className="text-sm font-medium">Production Optimization</span>
            <BoltIcon className="w-5 h-5 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Available AI Tools */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <ChartBarIcon className="w-8 h-8 text-indigo-600" />
          <h3 className="text-xl font-bold text-gray-900">Available AI Tools</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            'AI Manufacturing Request',
            'Unified API Call',
            'Inventory Optimize',
            'Demand Forecast',
            'Quality Analysis',
            'Production Optimization',
            'Cost Analysis',
            'Risk Assessment',
            'Performance Monitoring'
          ].map((tool) => (
            <div key={tool} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm font-medium">{tool}</span>
            </div>
          ))}
        </div>
      </div>

      {/* System Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">System Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={checkAISystemStatus}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh Status
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            Run Health Check
          </button>
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            View Logs
          </button>
          <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
            Performance Metrics
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIStatusDashboard;