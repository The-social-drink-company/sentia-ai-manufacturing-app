import React, { useState } from 'react';
import {
  BeakerIcon,
  ExclamationTriangleIcon,
  CpuChipIcon,
  ChartBarIcon,
  BoltIcon,
  EyeIcon,
  CogIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';

const Experimental = () => {
  const [enabledFeatures, setEnabledFeatures] = useState({
    aiPredictiveAnalytics: false,
    realTimeOptimization: false,
    advancedForecasting: false,
    blockchainTracking: false,
    quantumOptimization: false,
    neuromorphicProcessing: false
  });

  const experimentalFeatures = [
    {
      id: 'aiPredictiveAnalytics',
      name: 'AI Predictive Analytics',
      description: 'Advanced machine learning models for predicting production issues, quality defects, and equipment failures before they occur.',
      icon: CpuChipIcon,
      status: 'beta',
      risk: 'medium',
      benefits: ['Reduce downtime by 30%', 'Predict quality issues', 'Optimize maintenance schedules'],
      requirements: ['Minimum 6 months historical data', 'GPU acceleration recommended'],
      enabled: enabledFeatures.aiPredictiveAnalytics
    },
    {
      id: 'realTimeOptimization',
      name: 'Real-Time Production Optimization',
      description: 'Dynamic adjustment of production parameters in real-time based on current conditions, demand, and resource availability.',
      icon: BoltIcon,
      status: 'alpha',
      risk: 'high',
      benefits: ['Increase efficiency by 25%', 'Reduce waste', 'Dynamic resource allocation'],
      requirements: ['IoT sensors integration', 'Real-time data pipeline', 'Production system API'],
      enabled: enabledFeatures.realTimeOptimization
    },
    {
      id: 'advancedForecasting',
      name: 'Multi-Modal Demand Forecasting',
      description: 'Combines traditional forecasting with social media sentiment, weather data, economic indicators, and market trends.',
      icon: ChartBarIcon,
      status: 'beta',
      risk: 'low',
      benefits: ['Improve forecast accuracy by 40%', 'Include external factors', 'Seasonal adjustments'],
      requirements: ['External data API access', 'Advanced analytics license'],
      enabled: enabledFeatures.advancedForecasting
    },
    {
      id: 'blockchainTracking',
      name: 'Blockchain Supply Chain Tracking',
      description: 'Immutable tracking of products through the entire supply chain using blockchain technology for transparency and authenticity.',
      icon: CogIcon,
      status: 'prototype',
      risk: 'medium',
      benefits: ['100% traceability', 'Fraud prevention', 'Regulatory compliance'],
      requirements: ['Blockchain network setup', 'Smart contracts', 'Partner integration'],
      enabled: enabledFeatures.blockchainTracking
    },
    {
      id: 'quantumOptimization',
      name: 'Quantum-Inspired Optimization',
      description: 'Experimental optimization algorithms inspired by quantum computing for solving complex scheduling and resource allocation problems.',
      icon: RocketLaunchIcon,
      status: 'research',
      risk: 'high',
      benefits: ['Solve NP-hard problems', 'Global optimization', 'Exponential speedup'],
      requirements: ['Quantum simulator access', 'Specialized hardware', 'Expert knowledge'],
      enabled: enabledFeatures.quantumOptimization
    },
    {
      id: 'neuromorphicProcessing',
      name: 'Neuromorphic Edge Processing',
      description: 'Brain-inspired computing for ultra-low power, real-time decision making at the edge of manufacturing processes.',
      icon: CpuChipIcon,
      status: 'concept',
      risk: 'experimental',
      benefits: ['Ultra-low latency', 'Energy efficient', 'Adaptive learning'],
      requirements: ['Neuromorphic chips', 'Custom software stack', 'Edge deployment'],
      enabled: enabledFeatures.neuromorphicProcessing
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'beta':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'alpha':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'prototype':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      case 'research':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
      case 'concept':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'low':
        return 'text-green-600 dark:text-green-400';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'high':
        return 'text-red-600 dark:text-red-400';
      case 'experimental':
        return 'text-purple-600 dark:text-purple-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const toggleFeature = (featureId) => {
    setEnabledFeatures(prev => ({
      ...prev,
      [featureId]: !prev[featureId]
    }));
  };

  const enabledCount = Object.values(enabledFeatures).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <BeakerIcon className="h-8 w-8 mr-3 text-purple-600" />
          Experimental Features
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Cutting-edge features and experimental technologies for advanced manufacturing analytics
        </p>
      </div>

      {/* Warning Banner */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex">
          <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Experimental Features Warning
            </h3>
            <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
              <ul className="list-disc pl-5 space-y-1">
                <li>These features are in development and may be unstable</li>
                <li>Data loss or system interruptions may occur</li>
                <li>Not recommended for production environments</li>
                <li>Features may be removed or significantly changed without notice</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Status Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Feature Status
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {enabledCount} of {experimentalFeatures.length} experimental features enabled
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {enabledCount}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Active Features
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {experimentalFeatures.map((feature) => {
          const Icon = feature.icon;
          
          return (
            <div
              key={feature.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700 overflow-hidden"
            >
              <div className="p-6">
                {/* Feature Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                      <Icon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {feature.name}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(feature.status)}`}>
                          {feature.status}
                        </span>
                        <span className={`text-xs font-medium ${getRiskColor(feature.risk)}`}>
                          {feature.risk} risk
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => toggleFeature(feature.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      feature.enabled ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        feature.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  {feature.description}
                </p>

                {/* Benefits */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Potential Benefits:
                  </h4>
                  <ul className="space-y-1">
                    {feature.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Requirements */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Requirements:
                  </h4>
                  <ul className="space-y-1">
                    {feature.requirements.map((requirement, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 flex-shrink-0" />
                        {requirement}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Status Badge */}
                {feature.enabled && (
                  <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center">
                      <EyeIcon className="h-4 w-4 text-purple-600 dark:text-purple-400 mr-2" />
                      <span className="text-sm font-medium text-purple-800 dark:text-purple-300">
                        Feature Active - Monitor Performance
                      </span>
                    </div>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                      This experimental feature is currently enabled. Monitor system performance and disable if issues occur.
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Feedback Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Feature Feedback
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Help us improve these experimental features by providing feedback on your experience.
        </p>
        
        <div className="flex space-x-4">
          <button className="px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg text-sm font-medium">
            Report Issue
          </button>
          <button className="px-4 py-2 bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 rounded-lg text-sm font-medium">
            Share Feedback
          </button>
          <button className="px-4 py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/20 dark:text-purple-400 rounded-lg text-sm font-medium">
            Request Feature
          </button>
        </div>
      </div>
    </div>
  );
};

export default Experimental;