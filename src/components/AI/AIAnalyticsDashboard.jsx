import { devLog } from '../../lib/devLog.js';
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUser, useAuth } from '@clerk/clerk-react';

import {
  Brain, TrendingUp, AlertTriangle, Target,
  BarChart3, Zap,
  Play, RefreshCw, Download
} from 'lucide-react';

const AIAnalyticsDashboard = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [selectedModel, setSelectedModel] = useState('demand_forecast');
  const [isRunningAnalysis, setIsRunningAnalysis] = useState(false);

  const { data: aiData, refetch } = useQuery({
    queryKey: ['ai-analytics', selectedModel],
    queryFn: async () => {
      const response = await fetch(`/api/ai/analytics?model=${selectedModel}`, {
        headers: {
          'Authorization': `Bearer ${await getToken()}`
        }
      });
      if (!response.ok) {
        return mockAIData;
      }
      return response.json();
    },
    refetchInterval: 30000,
  });

  const data = aiData || mockAIData;

  const aiModels = [
    {
      id: 'demand_forecast',
      name: 'Demand Forecasting',
      description: 'Predict future product demand using historical sales data',
      icon: <TrendingUp className="w-5 h-5" />,
      accuracy: 86.4,
      status: 'active'
    },
    {
      id: 'production_optimization',
      name: 'Production Optimization',
      description: 'Optimize manufacturing schedules and resource allocation',
      icon: <Target className="w-5 h-5" />,
      accuracy: 91.2,
      status: 'active'
    },
    {
      id: 'quality_prediction',
      name: 'Quality Prediction',
      description: 'Predict quality issues before they occur in production',
      icon: <AlertTriangle className="w-5 h-5" />,
      accuracy: 78.9,
      status: 'training'
    },
    {
      id: 'inventory_optimization',
      name: 'Inventory Optimization',
      description: 'Optimize stock levels and reduce carrying costs',
      icon: <BarChart3 className="w-5 h-5" />,
      accuracy: 83.7,
      status: 'active'
    }
  ];

  const runAnalysis = async () => {
    setIsRunningAnalysis(true);
    try {
      const response = await fetch('/api/forecasting/run-model', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getToken()}`
        },
        body: JSON.stringify({
          modelType: selectedModel,
          parameters: {
            horizon: 30,
            seasonality: true,
            confidence: 0.95
          }
        })
      });
      
      if (response.ok) {
        refetch();
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      devLog.error('Analysis failed:', error);
    } finally {
      setIsRunningAnalysis(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Analytics Dashboard</h1>
              <p className="mt-2 text-gray-600">
                Artificial Intelligence powered insights and predictions
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={runAnalysis}
                disabled={isRunningAnalysis}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isRunningAnalysis ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                {isRunningAnalysis ? 'Running Analysis...' : 'Run Analysis'}
              </button>
              <button className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                <Download className="w-4 h-4 mr-2" />
                Export Results
              </button>
            </div>
          </div>
        </div>

        {/* AI Model Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {aiModels.map((model) => (
            <AIModelCard
              key={model.id}
              model={model}
              isSelected={selectedModel === model.id}
              onSelect={setSelectedModel}
            />
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <ModelResults data={data} selectedModel={selectedModel} />
          </div>
          <div>
            <ModelInsights insights={data.insights} />
          </div>
        </div>

        {/* Performance Metrics and Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ModelPerformance performance={data.performance} />
          <AIRecommendations recommendations={data.recommendations} />
        </div>
      </div>
    </div>
  );
};

const AIModelCard = ({ model, isSelected, onSelect }) => {
  const statusColor = {
    active: 'bg-green-100 text-green-800',
    training: 'bg-yellow-100 text-yellow-800',
    inactive: 'bg-red-100 text-red-800'
  };

  return (
    <button
      onClick={() => onSelect(model.id)}
      className={`text-left p-6 rounded-lg border transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50 shadow-md'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg ${
          isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
        }`}>
          {model.icon}
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[model.status]}`}>
          {model.status}
        </span>
      </div>
      
      <h3 className="font-semibold text-gray-900 mb-2">{model.name}</h3>
      <p className="text-sm text-gray-600 mb-3">{model.description}</p>
      
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">Accuracy</span>
        <span className="font-semibold text-gray-900">{model.accuracy}%</span>
      </div>
      
      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full" 
          style={{ width: `${model.accuracy}%` }}
        ></div>
      </div>
    </button>
  );
};

const ModelResults = ({ data, selectedModel }) => {
  const getModelTitle = (modelId) => {
    const titles = {
      demand_forecast: 'Demand Forecast Results',
      production_optimization: 'Production Optimization Results',
      quality_prediction: 'Quality Prediction Results',
      inventory_optimization: 'Inventory Optimization Results'
    };
    return titles[modelId] || 'Analysis Results';
  };

  if (!data || typeof data !== 'object') {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-6">{getModelTitle(selectedModel)}</h3>
        <div className="text-center py-8 text-gray-500">
          <p>Loading analysis results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-6">{getModelTitle(selectedModel)}</h3>
      
      {/* Results Visualization */}
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg mb-6">
        <div className="text-center text-gray-500">
          <Brain className="w-12 h-12 mx-auto mb-2" />
          <p>AI Model Visualization</p>
          <p className="text-sm">Real-time analysis results</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{data.confidence || 0}%</div>
          <div className="text-sm text-gray-600">Confidence Level</div>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{data.predictions || 0}</div>
          <div className="text-sm text-gray-600">Predictions</div>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{data.accuracy || 0}%</div>
          <div className="text-sm text-gray-600">Model Accuracy</div>
        </div>
      </div>
    </div>
  );
};

const ModelInsights = ({ insights }) => {
  if (!insights || !Array.isArray(insights)) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-6">Key Insights</h3>
        <div className="text-center py-8 text-gray-500">
          <p>No insights available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-6">Key Insights</h3>
      <div className="space-y-4">
        {insights.map((insight, index) => (
          <div key={index} className={`p-4 rounded-lg border-l-4 ${
            insight.type === 'positive' ? 'border-green-400 bg-green-50' :
            insight.type === 'warning' ? 'border-yellow-400 bg-yellow-50' :
            'border-blue-400 bg-blue-50'
          }`}>
            <h4 className="font-medium text-gray-900 mb-1">{insight.title}</h4>
            <p className="text-sm text-gray-600">{insight.description}</p>
            {insight.impact && (
              <p className="text-xs text-gray-500 mt-2">Impact: {insight.impact}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const ModelPerformance = ({ performance }) => {
  if (!performance || typeof performance !== 'object') {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-6">Model Performance</h3>
        <div className="text-center py-8 text-gray-500">
          <p>No performance data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-6">Model Performance</h3>
      <div className="space-y-6">
        {Object.entries(performance).map(([metric, value]) => (
          <div key={metric}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 capitalize">
                {metric.replace('_', ' ')}
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {typeof value === 'number' ? `${value.toFixed(1)}%` : value}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${typeof value === 'number' ? value : 50}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AIRecommendations = ({ recommendations }) => {
  if (!recommendations || !Array.isArray(recommendations)) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-6">AI Recommendations</h3>
        <div className="text-center py-8 text-gray-500">
          <p>No recommendations available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-6">AI Recommendations</h3>
      <div className="space-y-4">
        {recommendations.map((rec, index) => (
          <div key={index} className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg">
            <Zap className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 mb-1">{rec.title}</h4>
              <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
              {rec.impact && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Potential Impact:</span>
                  <span className="text-xs font-medium text-green-600">{rec.impact}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Mock data for development
const mockAIData = {
  confidence: 87.3,
  predictions: 42,
  accuracy: 89.1,
  insights: [
    {
      type: 'positive',
      title: 'Strong Seasonal Pattern Detected',
      description: 'Clear seasonal trends identified in demand data, improving forecast accuracy',
      impact: '+12% accuracy improvement'
    },
    {
      type: 'warning',
      title: 'Inventory Bottleneck Risk',
      description: 'Raw material shortages predicted for Q2 based on supplier data',
      impact: 'Risk of 15% production decrease'
    },
    {
      type: 'info',
      title: 'Quality Correlation Found',
      description: 'Strong correlation between temperature and quality metrics identified',
      impact: 'Process optimization opportunity'
    }
  ],
  performance: {
    precision: 89.4,
    recall: 86.2,
    f1_score: 87.8,
    mae: 12.3,
    rmse: 18.7
  },
  recommendations: [
    {
      title: 'Increase Safety Stock',
      description: 'Based on demand volatility analysis, recommend 15% increase in safety stock for top 5 SKUs',
      impact: '8% reduction in stockouts'
    },
    {
      title: 'Optimize Production Schedule',
      description: 'Shift production peak by 2 hours to align with quality window predictions',
      impact: '12% quality improvement'
    },
    {
      title: 'Update Reorder Points',
      description: 'Adjust reorder points for 12 items based on lead time analysis',
      impact: '5% inventory cost reduction'
    }
  ]
};

export default AIAnalyticsDashboard;