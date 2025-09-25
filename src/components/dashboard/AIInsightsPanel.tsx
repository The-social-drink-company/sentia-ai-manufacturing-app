import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  ChartBarIcon, 
  ExclamationTriangleIcon, 
  LightBulbIcon, 
  CheckCircleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';

interface AIInsight {
  id: string;
  type: 'prediction' | 'risk_alert' | 'recommendation' | 'opportunity' | 'analysis';
  title: string;
  content: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact_estimate: {
    financial: number;
    operational: string;
    timeline: string;
  };
  created_at: string;
  updated_at: string;
  source: string;
  tags: string[];
  explanation?: string;
  data_points?: {
    label: string;
    value: string | number;
    change?: number;
  }[];
  actions?: {
    id: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    estimated_effort: string;
  }[];
  streaming?: boolean;
}

interface AIInsightsPanelProps {
  className?: string;
}

const AI_INSIGHTS_ENDPOINT = '/api/ai/insights';
const STREAMING_ENDPOINT = '/api/ai/insights/stream';

export function AIInsightsPanel({ className = '' }: AIInsightsPanelProps) {
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set());
  const [streamingInsights, setStreamingInsights] = useState<Map<string, AIInsight>>(new Map());
  const [isStreaming, setIsStreaming] = useState(false);
  const streamRef = useRef<EventSource | null>(null);

  // Fetch existing insights
  const { data: insights = [], isLoading, error, refetch } = useQuery({
    queryKey: ['ai-insights'],
    queryFn: async () => {
      const response = await fetch(AI_INSIGHTS_ENDPOINT);
      if (!response.ok) throw new Error('Failed to fetch AI insights');
      return response.json() as AIInsight[];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // WebSocket connection for real-time updates
  const { lastMessage, connectionStatus } = useWebSocket('/ws/ai-insights', {
    onMessage: (message) => {
      try {
        const data = JSON.parse(message.data);
        if (data.type === 'insight_update' || data.type === 'new_insight') {
          refetch();
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    },
  });

  // Start streaming insights
  const startStreaming = useCallback(() => {
    if (streamRef.current || isStreaming) return;

    setIsStreaming(true);
    streamRef.current = new EventSource(STREAMING_ENDPOINT);

    streamRef.current.onmessage = (event) => {
      try {
        const insight: AIInsight = JSON.parse(event.data);
        setStreamingInsights(prev => new Map(prev.set(insight.id, {
          ...insight,
          streaming: true
        })));
      } catch (error) {
        console.error('Error parsing streaming insight:', error);
      }
    };

    streamRef.current.onerror = (error) => {
      console.error('Streaming error:', error);
      stopStreaming();
    };

    streamRef.current.onopen = () => {
      console.log('AI insights streaming started');
    };
  }, [isStreaming]);

  // Stop streaming insights
  const stopStreaming = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.close();
      streamRef.current = null;
    }
    setIsStreaming(false);
    setStreamingInsights(new Map());
  }, []);

  // Cleanup streaming on unmount
  useEffect(() => {
    return () => {
      stopStreaming();
    };
  }, [stopStreaming]);

  // Combine regular and streaming insights
  const allInsights = useMemo(() => {
    const combined = [...insights];
    streamingInsights.forEach(insight => {
      const existingIndex = combined.findIndex(i => i.id === insight.id);
      if (existingIndex >= 0) {
        combined[existingIndex] = insight;
      } else {
        combined.unshift(insight);
      }
    });
    return combined.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }, [insights, streamingInsights]);

  const toggleExpanded = (insightId: string) => {
    setExpandedInsights(prev => {
      const newSet = new Set(prev);
      if (newSet.has(insightId)) {
        newSet.delete(insightId);
      } else {
        newSet.add(insightId);
      }
      return newSet;
    });
  };

  const getInsightIcon = (type: AIInsight['type'], severity: AIInsight['severity']) => {
    const iconClass = "h-5 w-5";
    
    switch (type) {
      case 'risk_alert':
        return severity === 'critical' 
          ? <ExclamationTriangleIcon className={`${iconClass} text-red-500`} />
          : <ExclamationTriangleIcon className={`${iconClass} text-amber-500`} />;
      case 'recommendation':
        return <LightBulbIcon className={`${iconClass} text-blue-500`} />;
      case 'opportunity':
        return <ArrowTrendingUpIcon className={`${iconClass} text-green-500`} />;
      case 'prediction':
        return <ChartBarIcon className={`${iconClass} text-purple-500`} />;
      case 'analysis':
        return <InformationCircleIcon className={`${iconClass} text-gray-500`} />;
      default:
        return <SparklesIcon className={`${iconClass} text-indigo-500`} />;
    }
  };

  const getSeverityColor = (severity: AIInsight['severity']) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'high': return 'border-amber-500 bg-amber-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-green-500 bg-green-50';
      default: return 'border-gray-300 bg-white';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return 'text-green-600 bg-green-100';
    if (confidence >= 70) return 'text-blue-600 bg-blue-100';
    if (confidence >= 50) return 'text-amber-600 bg-amber-100';
    return 'text-red-600 bg-red-100';
  };

  const formatFinancialImpact = (amount: number) => {
    if (Math.abs(amount) >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (Math.abs(amount) >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-gray-300 rounded-full animate-pulse" />
            <span className="text-sm text-gray-500">Loading insights...</span>
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
              <div className="flex items-start gap-3">
                <div className="h-5 w-5 bg-gray-200 rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-red-500 rounded-full" />
            <span className="text-sm text-red-600">Connection Error</span>
          </div>
        </div>
        <div className="text-center py-8">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Failed to load AI insights</p>
          <button 
            onClick={() => refetch()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span className="text-sm text-gray-500">
              {connectionStatus === 'connected' ? 'Live' : 'Offline'}
            </span>
          </div>
          <button
            onClick={isStreaming ? stopStreaming : startStreaming}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              isStreaming 
                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {isStreaming ? 'Stop Streaming' : 'Start Streaming'}
          </button>
        </div>
      </div>

      {allInsights.length === 0 ? (
        <div className="text-center py-8">
          <SparklesIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">No AI insights available</p>
          <p className="text-sm text-gray-500">Insights will appear here as they're generated</p>
        </div>
      ) : (
        <div className="space-y-4">
          {allInsights.map((insight) => {
            const isExpanded = expandedInsights.has(insight.id);
            
            return (
              <div 
                key={insight.id}
                className={`border-l-4 rounded-lg p-4 transition-all duration-200 ${getSeverityColor(insight.severity)} ${
                  insight.streaming ? 'animate-pulse' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getInsightIcon(insight.type, insight.severity)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-gray-900">{insight.title}</h4>
                        {insight.streaming && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                            Streaming
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 mb-3">{insight.content}</p>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">Confidence:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(insight.confidence)}`}>
                            {insight.confidence}%
                          </span>
                        </div>
                        
                        {insight.impact_estimate.financial !== 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500">Impact:</span>
                            <span className={`font-medium ${insight.impact_estimate.financial > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {insight.impact_estimate.financial > 0 ? '+' : ''}
                              {formatFinancialImpact(insight.impact_estimate.financial)}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1 text-gray-500">
                          <ClockIcon className="h-3 w-3" />
                          <span>{formatDistanceToNow(new Date(insight.updated_at), { addSuffix: true })}</span>
                        </div>
                      </div>

                      {insight.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {insight.tags.map((tag) => (
                            <span 
                              key={tag}
                              className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => toggleExpanded(insight.id)}
                    className="ml-4 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title={isExpanded ? "Show less" : "Show more details"}
                  >
                    {isExpanded ? (
                      <ChevronUpIcon className="h-5 w-5" />
                    ) : (
                      <ChevronDownIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                    {insight.explanation && (
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Explanation</h5>
                        <p className="text-gray-700 text-sm">{insight.explanation}</p>
                      </div>
                    )}

                    {insight.data_points && insight.data_points.length > 0 && (
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Supporting Data</h5>
                        <div className="grid grid-cols-2 gap-3">
                          {insight.data_points.map((point, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-3">
                              <div className="text-sm text-gray-600">{point.label}</div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">{point.value}</span>
                                {point.change !== undefined && (
                                  <span className={`text-xs flex items-center ${
                                    point.change > 0 ? 'text-green-600' : point.change < 0 ? 'text-red-600' : 'text-gray-600'
                                  }`}>
                                    {point.change > 0 ? (
                                      <ArrowTrendingUpIcon className="h-3 w-3 mr-1" />
                                    ) : point.change < 0 ? (
                                      <ArrowTrendingDownIcon className="h-3 w-3 mr-1" />
                                    ) : null}
                                    {Math.abs(point.change)}%
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {insight.actions && insight.actions.length > 0 && (
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Recommended Actions</h5>
                        <div className="space-y-2">
                          {insight.actions.map((action) => (
                            <div key={action.id} className="bg-blue-50 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-blue-900">{action.title}</span>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  action.priority === 'high' ? 'bg-red-100 text-red-700' :
                                  action.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                                  'bg-green-100 text-green-700'
                                }`}>
                                  {action.priority} priority
                                </span>
                              </div>
                              <p className="text-sm text-blue-800 mb-2">{action.description}</p>
                              <div className="text-xs text-blue-600">
                                Estimated effort: {action.estimated_effort}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>Source: {insight.source}</span>
                      <span>
                        Impact timeline: {insight.impact_estimate.timeline} • 
                        {insight.impact_estimate.operational}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}