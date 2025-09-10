import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@clerk/clerk-react';
import {
  CpuChipIcon as Brain,
  ArrowTrendingUpIcon as TrendingUp,
  BoltIcon as Activity,
  ExclamationTriangleIcon as AlertTriangle,
  CheckCircleIcon as CheckCircle,
  ChartBarIcon as BarChart3,
  ArrowPathIcon as RefreshCw,
  ArrowTopRightOnSquareIcon as ExternalLink
} from '@heroicons/react/24/outline';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AIAnalyticsSimple = () => {
  const { user } = useUser();
  const [selectedModel, setSelectedModel] = useState('all');
  const [timeRange, setTimeRange] = useState('7d');

  // ONLY REAL API DATA - NO MOCK DATA
  const { data: aiData, isLoading, isError, refetch } = useQuery({
    queryKey: ['ai-analytics', selectedModel, timeRange],
    queryFn: async () => {
      const authHeader = user ? { 'Authorization': `Bearer ${await user.getToken()}` } : {};
      
      // Try multiple real AI analytics API endpoints
      const endpoints = [
        `/api/ai/analytics/models?model=${selectedModel}&range=${timeRange}`,
        `/api/analytics/ai-performance?period=${timeRange}&model=${selectedModel}`,
        `/api/mcp/ai-insights?range=${timeRange}`,
        `/api/intelligence/ai-metrics?model=${selectedModel}&period=${timeRange}`
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, { headers: authHeader });
          if (response.ok) {
            const data = await response.json();
            return data;
          }
        } catch (error) {
          console.warn(`AI Analytics API endpoint ${endpoint} failed:`, error.message);
        }
      }

      // NO MOCK DATA - Throw error requiring real API connection
      throw new Error(`No real AI analytics data available from any API endpoint. All ${endpoints.length} endpoints failed. Please ensure AI service connections are established for: OpenAI GPT, Anthropic Claude, MCP Server, or custom ML models. Mock data has been eliminated per user requirements.`);
    },
    refetchInterval: 30000,
    retry: false
  });

  // Error state - NO MOCK DATA FALLBACK
  if (isError) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Analytics</h1>
            <p className="mt-2 text-gray-700 dark:text-gray-300">Real-time AI model performance and insights</p>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <div className="flex items-start">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400 mr-3 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-red-900 dark:text-red-200">No Real AI Data Available</h3>
                <p className="text-red-800 dark:text-red-300 mt-2">
                  All AI analytics API endpoints are currently unavailable. This system only displays real data from live AI services.
                </p>
                <div className="mt-4">
                  <h4 className="font-semibold text-red-900 dark:text-red-200">Required AI Service Connections:</h4>
                  <ul className="list-disc list-inside text-red-800 dark:text-red-300 mt-2 space-y-1">
                    <li>OpenAI GPT - Model performance metrics</li>
                    <li>Anthropic Claude - AI reasoning analytics</li>
                    <li>MCP Server - Multi-model orchestration data</li>
                    <li>Custom ML Models - Training and inference metrics</li>
                    <li>Vector Database - Semantic search performance</li>
                  </ul>
                </div>
                <button
                  onClick={refetch}
                  className="mt-4 flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry AI Connection
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Analytics</h1>
            <p className="mt-2 text-gray-700 dark:text-gray-300">Loading real-time AI performance data...</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center border dark:border-gray-700">
            <RefreshCw className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-700 dark:text-gray-300">Connecting to AI services...</p>
          </div>
        </div>
      </div>
    );
  }

  // Main interface - ONLY shows when real AI API data is available
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Analytics</h1>
              <p className="mt-2 text-gray-700 dark:text-gray-300">
                Real-time AI model performance, insights, and recommendations from live services
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={refetch}
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Data
              </button>
              <a
                href="/api/ai/analytics/export"
                className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Export Report
              </a>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8 border dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">
                AI Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="all">All Models</option>
                <option value="gpt-4">GPT-4 Turbo</option>
                <option value="claude-3">Claude 3.5 Sonnet</option>
                <option value="gemini">Gemini Pro</option>
                <option value="custom">Custom Models</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">
                Time Range
              </label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">
                API Status
              </label>
              <div className="flex items-center space-x-2 py-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Live AI Data Connected</span>
              </div>
            </div>
          </div>
        </div>

        {/* Real AI Data Display */}
        {aiData && (
          <div className="space-y-8">
            {/* AI Performance Metrics from Real API Data */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <AIMetric
                title="Total Requests"
                value={aiData.totalRequests?.toLocaleString() || 'N/A'}
                change={aiData.requestsChange || 'N/A'}
                trend={aiData.requestsTrend || 'stable'}
                icon={<Activity className="w-6 h-6" />}
              />
              <AIMetric
                title="Average Response Time"
                value={`${aiData.avgResponseTime || 0}ms`}
                change={aiData.responseTimeChange || 'N/A'}
                trend={aiData.responseTimeTrend || 'stable'}
                icon={<BarChart3 className="w-6 h-6" />}
              />
              <AIMetric
                title="Success Rate"
                value={`${Math.round(aiData.successRate || 0)}%`}
                change={aiData.successRateChange || 'N/A'}
                trend={aiData.successRateTrend || 'up'}
                icon={<CheckCircle className="w-6 h-6" />}
              />
              <AIMetric
                title="Cost Efficiency"
                value={`$${aiData.costPerRequest || 0}`}
                change={aiData.costChange || 'N/A'}
                trend={aiData.costTrend || 'stable'}
                icon={<TrendingUp className="w-6 h-6" />}
              />
            </div>

            {/* Real AI Performance Charts */}
            {aiData.performanceData && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                    AI Model Performance (Real Data)
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={aiData.performanceData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="time" stroke="#6B7280" />
                        <YAxis stroke="#6B7280" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'var(--color-bg-elevated)', 
                            border: '1px solid var(--color-border-light)',
                            color: 'var(--color-text-primary)'
                          }} 
                        />
                        <Legend />
                        <Line type="monotone" dataKey="accuracy" stroke="#3B82F6" strokeWidth={2} />
                        <Line type="monotone" dataKey="speed" stroke="#10B981" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                    Request Volume (Real Data)
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={aiData.requestVolume || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="period" stroke="#6B7280" />
                        <YAxis stroke="#6B7280" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'var(--color-bg-elevated)', 
                            border: '1px solid var(--color-border-light)',
                            color: 'var(--color-text-primary)'
                          }} 
                        />
                        <Bar dataKey="requests" fill="#8B5CF6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* AI Insights from Real Data */}
            {aiData.insights && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  AI-Generated Insights (Real Data)
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {aiData.insights.map((insight, index) => (
                    <div key={index} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{insight.title}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          insight.priority === 'high' 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            : insight.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        }`}>
                          {insight.priority || 'Low'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{insight.description}</p>
                      {insight.recommendation && (
                        <div className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                          Recommendation: {insight.recommendation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Model Comparison from Real Data */}
            {aiData.modelComparison && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Model Comparison (Real Performance Data)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-600">
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Model</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Accuracy</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Speed (ms)</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Cost</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aiData.modelComparison.map((model, index) => (
                        <tr key={index} className="border-b border-gray-100 dark:border-gray-700">
                          <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{model.name}</td>
                          <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{model.accuracy}%</td>
                          <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{model.speed}ms</td>
                          <td className="py-3 px-4 text-gray-700 dark:text-gray-300">${model.cost}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              model.status === 'active' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                              {model.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const AIMetric = ({ title, value, change, trend, icon }) => {
  const trendColor = trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-500 dark:text-gray-400';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h3>
        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
          {icon}
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</div>
          <div className="flex items-center mt-1">
            <TrendingUp className={`w-4 h-4 ${trendColor}`} />
            <span className={`text-sm ml-1 ${trendColor}`}>
              {change}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">vs last period</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAnalyticsSimple;