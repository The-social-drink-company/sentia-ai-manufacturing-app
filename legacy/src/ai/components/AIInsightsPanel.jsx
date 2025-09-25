import React, { useState, useEffect } from 'react';
import { 
  LightBulbIcon,
  SparklesIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { useAI } from '../AIProvider';
import { useTheme } from '../../theming';

export const AIInsightsPanel = ({ 
  className = '',
  maxInsights = 10,
  showFilters = true,
  autoRefresh = true,
  ...props 
}) => {
  const { insights, clearInsights, getServiceHealth, isAIEnabled } = useAI();
  const { resolvedTheme } = useTheme();
  const [filteredInsights, setFilteredInsights] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isExpanded, setIsExpanded] = useState(true);

  // Filter insights based on selected filter
  useEffect(() => {
    let filtered = insights;
    
    if (selectedFilter !== 'all') {
      filtered = insights.filter(insight => 
        insight.category === selectedFilter || insight.priority === selectedFilter
      );
    }
    
    setFilteredInsights(filtered.slice(0, maxInsights));
  }, [insights, selectedFilter, maxInsights]);

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'critical':
        return ExclamationTriangleIcon;
      case 'high':
        return ArrowTrendingUpIcon;
      case 'medium':
        return ChartBarIcon;
      case 'low':
        return ArrowTrendingDownIcon;
      default:
        return LightBulbIcon;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'text-red-500';
      case 'high':
        return 'text-orange-500';
      case 'medium':
        return 'text-yellow-500';
      case 'low':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  const getCategoryLabel = (category) => {
    const labels = {
      'production': 'Production',
      'quality': 'Quality',
      'maintenance': 'Maintenance',
      'inventory': 'Inventory',
      'cost': 'Cost Analysis',
      'supply_chain': 'Supply Chain',
      'anomaly': 'Anomaly Detection',
      'forecast': 'Forecasting'
    };
    return labels[category] || category;
  };

  const formatTimeAgo = (timestamp) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const serviceHealth = getServiceHealth();

  const cardClasses = `
    rounded-lg border shadow-sm
    ${resolvedTheme === 'dark'
      ? 'bg-slate-800 border-slate-700'
      : 'bg-white border-gray-200'
    }
  `;

  const textPrimaryClasses = resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900';
  const textSecondaryClasses = resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600';
  const textMutedClasses = resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className={`${cardClasses} ${className}`} {...props}>
      {/* Header */}
      <div className={`
        flex items-center justify-between p-4 border-b
        ${resolvedTheme === 'dark' ? 'border-slate-700' : 'border-gray-200'}
      `}>
        <div className="flex items-center">
          <SparklesIcon className="w-5 h-5 mr-2 text-purple-500" />
          <h3 className={`font-semibold ${textPrimaryClasses}`}>
            AI Insights
          </h3>
          <span className={`ml-2 text-sm ${textMutedClasses}`}>
            ({filteredInsights.length})
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Service health indicator */}
          <div className="flex items-center">
            <div className={`
              w-2 h-2 rounded-full mr-1
              ${serviceHealth.overall === 'healthy' ? 'bg-green-500' : 
                serviceHealth.overall === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'}
            `} />
            <span className={`text-xs ${textMutedClasses}`}>
              {isAIEnabled ? 'AI Active' : 'AI Offline'}
            </span>
          </div>

          {/* Toggle panel */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`
              p-1 rounded hover:bg-opacity-75
              ${resolvedTheme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}
            `}
          >
            <CogIcon className={`w-4 h-4 ${textMutedClasses}`} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Filters */}
          {showFilters && (
            <div className="p-4 border-b border-gray-200 dark:border-slate-700">
              <div className="flex flex-wrap gap-2">
                {['all', 'critical', 'high', 'production', 'quality', 'maintenance'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => setSelectedFilter(filter)}
                    className={`
                      px-3 py-1 rounded-full text-xs font-medium transition-colors
                      ${selectedFilter === filter
                        ? resolvedTheme === 'dark'
                          ? 'bg-blue-900 text-blue-200'
                          : 'bg-blue-100 text-blue-800'
                        : resolvedTheme === 'dark'
                          ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                    {filter === 'all' ? 'All Insights' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Insights List */}
          <div className="max-h-96 overflow-y-auto">
            {filteredInsights.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-slate-700">
                {filteredInsights.map((insight, index) => {
                  const PriorityIcon = getPriorityIcon(insight.priority);
                  const priorityColor = getPriorityColor(insight.priority);

                  return (
                    <div key={index} className="p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                      <div className="flex items-start space-x-3">
                        {/* Priority Icon */}
                        <div className={`
                          flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                          ${resolvedTheme === 'dark' ? 'bg-slate-700' : 'bg-gray-100'}
                        `}>
                          <PriorityIcon className={`w-4 h-4 ${priorityColor}`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className={`text-sm font-medium ${textPrimaryClasses} truncate`}>
                              {insight.title}
                            </h4>
                            <span className={`text-xs ${textMutedClasses} flex-shrink-0 ml-2`}>
                              {formatTimeAgo(insight.timestamp)}
                            </span>
                          </div>

                          <p className={`text-sm ${textSecondaryClasses} mb-2`}>
                            {insight.description}
                          </p>

                          {/* Metadata */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className={`
                                inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                                ${resolvedTheme === 'dark'
                                  ? 'bg-slate-700 text-gray-300'
                                  : 'bg-gray-100 text-gray-700'
                                }
                              `}>
                                {getCategoryLabel(insight.category)}
                              </span>

                              {insight.confidence && (
                                <span className={`text-xs ${textMutedClasses}`}>
                                  {Math.round(insight.confidence * 100)}% confidence
                                </span>
                              )}
                            </div>

                            {/* Action buttons */}
                            {insight.actionable && (
                              <button
                                onClick={() => insight.onAction?.()}
                                className={`
                                  text-xs px-2 py-1 rounded transition-colors
                                  ${resolvedTheme === 'dark'
                                    ? 'text-blue-400 hover:bg-blue-900/30'
                                    : 'text-blue-600 hover:bg-blue-50'
                                  }
                                `}
                              >
                                Take Action
                              </button>
                            )}
                          </div>

                          {/* Impact metrics */}
                          {insight.impact && (
                            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-slate-700">
                              <div className="flex items-center space-x-4 text-xs">
                                {insight.impact.cost && (
                                  <span className={textMutedClasses}>
                                    Impact: {insight.impact.cost}
                                  </span>
                                )}
                                {insight.impact.timeToFix && (
                                  <span className={textMutedClasses}>
                                    ETA: {insight.impact.timeToFix}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center">
                <LightBulbIcon className={`w-12 h-12 mx-auto mb-3 ${textMutedClasses}`} />
                <p className={`${textSecondaryClasses} mb-1`}>
                  No AI insights available
                </p>
                <p className={`text-sm ${textMutedClasses}`}>
                  {isAIEnabled 
                    ? 'Run AI analyses to generate insights and recommendations'
                    : 'AI services are currently offline'
                  }
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          {filteredInsights.length > 0 && (
            <div className={`
              p-3 border-t flex justify-between items-center
              ${resolvedTheme === 'dark' ? 'border-slate-700' : 'border-gray-200'}
            `}>
              <span className={`text-xs ${textMutedClasses}`}>
                Last updated: {formatTimeAgo(Math.max(...insights.map(i => i.timestamp)))}
              </span>

              <div className="flex space-x-2">
                {autoRefresh && (
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-1" />
                    <span className={`text-xs ${textMutedClasses}`}>Auto-refresh</span>
                  </div>
                )}

                <button
                  onClick={clearInsights}
                  className={`
                    text-xs px-2 py-1 rounded transition-colors
                    ${resolvedTheme === 'dark'
                      ? 'text-gray-400 hover:text-gray-300 hover:bg-slate-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  Clear All
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AIInsightsPanel;
