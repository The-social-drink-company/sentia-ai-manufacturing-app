import React, { useState, useEffect } from 'react';
import {
  CpuChipIcon,
  LightBulbIcon,
  ChartBarIcon,
  EyeIcon,
  BoltIcon,
  CloudIcon,
  BeakerIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CommandLineIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import ChartErrorBoundary from '../charts/ChartErrorBoundary';

export default function AIAnalyticsDashboard() {
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [aiMetrics, setAiMetrics] = useState({
    predictions: 847,
    accuracy: 96.8,
    modelsActive: 12,
    dataProcessed: 2847000,
    anomaliesDetected: 3,
    optimizationSuggestions: 15
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
      setAiMetrics(prev => ({
        ...prev,
        predictions: prev.predictions + Math.floor(Math.random() * 10),
        accuracy: Math.max(90, Math.min(99.9, prev.accuracy + (Math.random() - 0.5) * 0.5)),
        dataProcessed: prev.dataProcessed + Math.floor(Math.random() * 1000),
        anomaliesDetected: prev.anomaliesDetected + (Math.random() > 0.9 ? 1 : 0),
        optimizationSuggestions: prev.optimizationSuggestions + (Math.random() > 0.8 ? 1 : 0)
      }));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const aiModels = [
    {
      name: 'Demand Forecasting Model',
      type: 'Time Series',
      status: 'active',
      accuracy: 97.2,
      lastTrained: '2 hours ago',
      predictions: 234,
      confidence: 'high'
    },
    {
      name: 'Quality Prediction Model',
      type: 'Classification',
      status: 'active',
      accuracy: 98.5,
      lastTrained: '6 hours ago',
      predictions: 156,
      confidence: 'high'
    },
    {
      name: 'Anomaly Detection Model',
      type: 'Unsupervised',
      status: 'training',
      accuracy: 94.7,
      lastTrained: '12 hours ago',
      predictions: 89,
      confidence: 'medium'
    },
    {
      name: 'Inventory Optimization',
      type: 'Reinforcement',
      status: 'active',
      accuracy: 96.1,
      lastTrained: '4 hours ago',
      predictions: 67,
      confidence: 'high'
    },
    {
      name: 'Production Scheduling',
      type: 'Optimization',
      status: 'idle',
      accuracy: 95.3,
      lastTrained: '1 day ago',
      predictions: 23,
      confidence: 'medium'
    }
  ];

  const aiInsights = [
    {
      id: 'INS-001',
      type: 'Optimization',
      priority: 'High',
      title: 'Production Line Efficiency',
      description: 'AI model detected potential 8% efficiency improvement on Line 2 by adjusting timing parameters.',
      impact: '+$45K/month',
      confidence: 94.5,
      timestamp: '15 minutes ago'
    },
    {
      id: 'INS-002',
      type: 'Prediction',
      priority: 'Medium',
      title: 'Demand Surge Forecast',
      description: 'Predicted 15% increase in demand for Product SKU-A847 in next 2 weeks.',
      impact: 'Inventory Alert',
      confidence: 92.1,
      timestamp: '32 minutes ago'
    },
    {
      id: 'INS-003',
      type: 'Anomaly',
      priority: 'High',
      title: 'Quality Pattern Detected',
      description: 'Unusual pattern in quality metrics may indicate equipment calibration needed.',
      impact: 'Maintenance Alert',
      confidence: 87.3,
      timestamp: '1 hour ago'
    },
    {
      id: 'INS-004',
      type: 'Recommendation',
      priority: 'Low',
      title: 'Energy Optimization',
      description: 'AI suggests shifting 12% of production to off-peak hours to reduce energy costs.',
      impact: '+$12K/month',
      confidence: 89.7,
      timestamp: '2 hours ago'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'training': return 'text-blue-600 bg-blue-100';
      case 'idle': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'text-red-600 bg-red-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence === 'high' || confidence > 90) return 'text-green-600';
    if (confidence === 'medium' || confidence > 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <CpuChipIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                AI Analytics Dashboard
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Artificial intelligence insights and model performance
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">Last updated</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {lastUpdate.toLocaleTimeString()}
              </p>
            </div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* AI Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Predictions</p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {aiMetrics.predictions.toLocaleString()}
                </p>
                <p className="text-xs text-purple-600">Today</p>
              </div>
              <SparklesIcon className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Accuracy</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {aiMetrics.accuracy.toFixed(1)}%
                </p>
                <p className="text-xs text-green-600">Average</p>
              </div>
              <CheckCircleIcon className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Active Models</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {aiMetrics.modelsActive}
                </p>
                <p className="text-xs text-blue-600">Running</p>
              </div>
              <BeakerIcon className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Data Processed</p>
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                  {(aiMetrics.dataProcessed / 1000000).toFixed(1)}M
                </p>
                <p className="text-xs text-orange-600">Records</p>
              </div>
              <CloudIcon className="w-8 h-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600 dark:text-red-400">Anomalies</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                  {aiMetrics.anomaliesDetected}
                </p>
                <p className="text-xs text-red-600">Detected</p>
              </div>
              <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-4 border border-teal-200 dark:border-teal-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-teal-600 dark:text-teal-400">Suggestions</p>
                <p className="text-2xl font-bold text-teal-700 dark:text-teal-300">
                  {aiMetrics.optimizationSuggestions}
                </p>
                <p className="text-xs text-teal-600">Active</p>
              </div>
              <LightBulbIcon className="w-8 h-8 text-teal-500" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI Models Status */}
          <div className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              AI Models Performance
            </h3>
            <div className="space-y-3">
              {aiModels.map((model, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`px-3 py-1 rounded-full flex items-center space-x-2 ${getStatusColor(model.status)}`}>
                        <div className={`w-2 h-2 rounded-full ${
                          model.status === 'active' ? 'bg-green-500' :
                          model.status === 'training' ? 'bg-blue-500' : 'bg-yellow-500'
                        }`}></div>
                        <span className="text-sm font-medium capitalize">{model.status}</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{model.name}</h4>
                        <p className="text-sm text-gray-500">{model.type} • Last trained: {model.lastTrained}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <p className={`text-sm font-medium ${getConfidenceColor(model.accuracy)}`}>
                          {model.accuracy.toFixed(1)}%
                        </p>
                        <p className="text-xs text-gray-500">Accuracy</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {model.predictions}
                        </p>
                        <p className="text-xs text-gray-500">Predictions</p>
                      </div>
                      <div className="text-center">
                        <p className={`text-sm font-medium ${getConfidenceColor(model.confidence)}`}>
                          {model.confidence}
                        </p>
                        <p className="text-xs text-gray-500">Confidence</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Insights */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              AI Insights
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {aiInsights.map((insight) => (
                <div key={insight.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {insight.id}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(insight.priority)}`}>
                        {insight.priority}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">{insight.timestamp}</span>
                  </div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">{insight.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{insight.description}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-green-600">{insight.impact}</span>
                    <span className="text-gray-500">Confidence: {insight.confidence}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Performance Chart */}
        <div className="mt-6">
          <ChartErrorBoundary title="AI Performance Chart Error">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  AI Model Performance Trends
                </h3>
                <ChartBarIcon className="w-5 h-5 text-gray-500" />
              </div>
              <div className="h-64 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-600 dark:to-gray-500 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <CpuChipIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">AI performance trends chart would be displayed here</p>
                  <p className="text-sm text-gray-400 mt-1">Model accuracy, prediction volume, and processing time</p>
                </div>
              </div>
            </div>
          </ChartErrorBoundary>
        </div>

        {/* AI Actions */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            AI Operations
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Train Models', icon: BeakerIcon, color: 'blue' },
              { label: 'Generate Insights', icon: LightBulbIcon, color: 'yellow' },
              { label: 'Monitor Performance', icon: EyeIcon, color: 'green' },
              { label: 'System Diagnostics', icon: CommandLineIcon, color: 'purple' }
            ].map((action, index) => (
              <button
                key={index}
                className={`flex items-center justify-center space-x-2 p-3 rounded-lg border-2 border-dashed border-${action.color}-200 hover:border-${action.color}-400 hover:bg-${action.color}-50 dark:hover:bg-${action.color}-900/20 transition-all duration-200`}
              >
                <action.icon className={`w-5 h-5 text-${action.color}-600`} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}