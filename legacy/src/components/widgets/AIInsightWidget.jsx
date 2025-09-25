import React, { useState, useEffect } from 'react';
import { 
  LightBulbIcon, 
  ChartBarIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import { logDebug, logInfo, logWarn, logError } from '../../utils/logger';


const AIInsightWidget = ({ className = '' }) => {
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [insightFilter, setInsightFilter] = useState('all');

  // Fetch AI insights from MCP server
  const { data: insights, isLoading, refetch } = useQuery({
    queryKey: ['ai-insights', insightFilter],
    queryFn: async () => {
      try {
        const response = await fetch('/api/mcp/ai/insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filter: insightFilter,
            include_predictions: true,
            include_recommendations: true
          })
        });
        
        if (!response.ok) throw new Error('Failed to fetch AI insights');
        return await response.json();
      } catch (error) {
        logError('AI Insights fetch error:', error);
        return { insights: [], predictions: [] };
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000
  });

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'critical':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
      case 'high':
        return <ExclamationTriangleIcon className="h-4 w-4 text-orange-500" />;
      case 'medium':
        return <LightBulbIcon className="h-4 w-4 text-yellow-500" />;
      default:
        return <CheckCircleIcon className="h-4 w-4 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'high': return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'medium': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      default: return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
    }
  };

  const formatImpact = (impact) => {
    if (typeof impact === 'number') {
      return impact > 0 ? `+$${impact.toLocaleString()}` : `-$${Math.abs(impact).toLocaleString()}`;
    }
    return impact;
  };

  const getTrendIcon = (trend) => {
    if (trend === 'up' || trend > 0) return <TrendingUpIcon className="h-3 w-3 text-green-500" />;
    if (trend === 'down' || trend < 0) return <TrendingDownIcon className="h-3 w-3 text-red-500" />;
    return null;
  };

  const filteredInsights = insights?.insights?.filter(insight => {
    if (insightFilter === 'all') return true;
    return insight.category === insightFilter || insight.priority === insightFilter;
  }) || [];

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <LightBulbIcon className="h-5 w-5 mr-2 text-yellow-500" />
            AI Insights & Recommendations
          </h3>
          <ArrowPathIcon className="h-4 w-4 text-gray-400 animate-spin" />
        </div>
        
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <LightBulbIcon className="h-5 w-5 mr-2 text-yellow-500" />
            AI Insights & Recommendations
          </h3>
          
          <div className="flex items-center space-x-2">
            <button 
              onClick={refetch}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1">
          {['all', 'critical', 'financial', 'inventory', 'production'].map(filter => (
            <button
              key={filter}
              onClick={() => setInsightFilter(filter)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                insightFilter === filter
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Insights List */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {filteredInsights.length === 0 ? (
          <div className="text-center py-8">
            <LightBulbIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No AI insights available</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              The AI is analyzing your data to generate insights
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredInsights.slice(0, 5).map((insight, index) => (
              <div
                key={index}
                className={`border-l-4 p-4 rounded-r-lg cursor-pointer transition-all ${
                  getPriorityColor(insight.priority)
                } ${
                  selectedInsight === index ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedInsight(selectedInsight === index ? null : index)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getPriorityIcon(insight.priority)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {insight.title || 'AI Recommendation'}
                        </h4>
                        {insight.trend && getTrendIcon(insight.trend)}
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        {insight.description || insight.content}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs">
                        <span className="flex items-center text-gray-500 dark:text-gray-400">
                          <ChartBarIcon className="h-3 w-3 mr-1" />
                          {insight.category || 'General'}
                        </span>
                        
                        {insight.confidence && (
                          <span className="flex items-center text-gray-500 dark:text-gray-400">
                            Confidence: {Math.round(insight.confidence * 100)}%
                          </span>
                        )}
                        
                        {insight.estimatedImpact && (
                          <span className="flex items-center font-medium text-green-600 dark:text-green-400">
                            {formatImpact(insight.estimatedImpact)}
                          </span>
                        )}
                        
                        {insight.timeframe && (
                          <span className="flex items-center text-gray-500 dark:text-gray-400">
                            <ClockIcon className="h-3 w-3 mr-1" />
                            {insight.timeframe}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Expanded Details */}
                {selectedInsight === index && (
                  <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                    {insight.recommendations && (
                      <div className="mb-3">
                        <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Recommended Actions:
                        </h5>
                        <ul className="space-y-1">
                          {insight.recommendations.slice(0, 3).map((rec, recIndex) => (
                            <li key={recIndex} className="text-xs text-gray-600 dark:text-gray-400 flex items-start">
                              <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                              {typeof rec === 'string' ? rec : rec.action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {insight.metrics && (
                      <div className="mb-3">
                        <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Key Metrics:
                        </h5>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(insight.metrics).slice(0, 4).map(([key, value]) => (
                            <div key={key} className="text-xs">
                              <span className="text-gray-500 dark:text-gray-400">
                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                              </span>
                              <span className="ml-1 font-mono text-gray-700 dark:text-gray-300">
                                {typeof value === 'number' ? value.toLocaleString() : value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {insight.dataSource && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Based on: {insight.dataSource}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Predictions Section */}
      {insights?.predictions && insights.predictions.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
            <TrendingUpIcon className="h-4 w-4 mr-2 text-blue-500" />
            AI Predictions
          </h4>
          
          <div className="space-y-2">
            {insights.predictions.slice(0, 3).map((prediction, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {prediction.description}
                </span>
                <div className="flex items-center space-x-2">
                  {prediction.probability && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {Math.round(prediction.probability * 100)}%
                    </span>
                  )}
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    prediction.outlook === 'positive' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                    prediction.outlook === 'negative' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                  }`}>
                    {prediction.outlook || 'Neutral'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-b-lg">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center">
            ðŸ§  Powered by AI Central Nervous System
          </span>
          
          <span>
            Updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AIInsightWidget;
