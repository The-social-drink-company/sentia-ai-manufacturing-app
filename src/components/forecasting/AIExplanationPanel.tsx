import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  DocumentTextIcon,
  SparklesIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  QuestionMarkCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  LightBulbIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';
import { useMutation } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  color: string;
}

interface Market {
  id: string;
  name: string;
  code: string;
  flagEmoji: string;
  currency: string;
}

interface Scenario {
  id: string;
  name: string;
  description: string;
  parameters: any[];
  financial_impact: {
    revenue_change: number;
    margin_change: number;
    volume_change: number;
    total_impact: number;
  };
  confidence_score: number;
}

interface AIExplanation {
  id: string;
  type: 'prediction_reasoning' | 'confidence_breakdown' | 'factor_analysis' | 'model_uncertainty' | 'historical_accuracy';
  title: string;
  content: string;
  confidence: number;
  timestamp: string;
  key_factors: {
    factor: string;
    impact: number; // -1 to 1
    confidence: number;
    explanation: string;
  }[];
  historical_context: {
    similar_predictions: number;
    accuracy_rate: number;
    time_period: string;
  };
  model_details: {
    primary_model: string;
    ensemble_models: string[];
    data_sources: string[];
    training_period: string;
  };
  uncertainty_sources: {
    source: string;
    contribution: number; // 0 to 1
    mitigation: string;
  }[];
}

interface StreamingExplanation {
  id: string;
  status: 'generating' | 'completed' | 'error';
  progress: number;
  current_section: string;
  partial_content: string;
  tokens_used: number;
}

interface AIExplanationPanelProps {
  products: Product[];
  markets: Market[];
  forecastData: any;
  currentScenario: Scenario | null;
}

export function AIExplanationPanel({
  products,
  markets,
  forecastData,
  currentScenario
}: AIExplanationPanelProps) {
  const [explanations, setExplanations] = useState<AIExplanation[]>([]);
  const [expandedExplanations, setExpandedExplanations] = useState<Set<string>>(new Set());
  const [selectedExplanationType, setSelectedExplanationType] = useState<string>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingExplanation, setStreamingExplanation] = useState<StreamingExplanation | null>(null);
  const [customQuestion, setCustomQuestion] = useState('');
  
  const streamRef = useRef<EventSource | null>(null);

  // Generate AI explanation
  const generateExplanationMutation = useMutation({
    mutationFn: async (params: {
      type: string;
      question?: string;
      context: {
        products: string[];
        markets: string[];
        scenario?: Scenario;
        forecastData: any;
      };
    }) => {
      const response = await fetch('/api/forecasting/ai-explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!response.ok) throw new Error('Failed to generate explanation');
      return response.json();
    },
    onSuccess: (data) => {
      startStreamingExplanation(data.explanation_id);
    },
    onError: () => {
      setIsGenerating(false);
    },
  });

  // Start streaming explanation
  const startStreamingExplanation = useCallback((explanationId: string) => {
    if (streamRef.current) {
      streamRef.current.close();
    }

    const eventSource = new EventSource(`/api/forecasting/ai-explain/stream/${explanationId}`);
    streamRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data: StreamingExplanation = JSON.parse(event.data);
        setStreamingExplanation(data);

        if (data.status === 'completed') {
          setIsGenerating(false);
          eventSource.close();
          // Reload explanations
          loadExplanations();
        } else if (data.status === 'error') {
          setIsGenerating(false);
          eventSource.close();
        }
      } catch (error) {
        console.error('Error parsing streaming explanation:', error);
      }
    };

    eventSource.onerror = () => {
      setIsGenerating(false);
      eventSource.close();
    };
  }, []);

  // Load explanations
  const loadExplanations = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        products: products.map(p => p.id).join(','),
        markets: markets.map(m => m.id).join(','),
        ...(currentScenario && { scenario_id: currentScenario.id }),
      });
      
      const response = await fetch(`/api/forecasting/explanations?${params}`);
      if (response.ok) {
        const data = await response.json();
        setExplanations(data);
      }
    } catch (error) {
      console.error('Failed to load explanations:', error);
    }
  }, [products, markets, currentScenario]);

  // Load explanations on mount and when context changes
  useEffect(() => {
    if (products.length > 0 && markets.length > 0) {
      loadExplanations();
    }
  }, [loadExplanations]);

  // Cleanup streaming on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.close();
      }
    };
  }, []);

  const generateExplanation = useCallback((type: string) => {
    setIsGenerating(true);
    generateExplanationMutation.mutate({
      type,
      context: {
        products: products.map(p => p.id),
        markets: markets.map(m => m.id),
        scenario: currentScenario || undefined,
        forecastData
      }
    });
  }, [products, markets, currentScenario, forecastData, generateExplanationMutation]);

  const askCustomQuestion = useCallback(() => {
    if (!customQuestion.trim()) return;
    
    setIsGenerating(true);
    generateExplanationMutation.mutate({
      type: 'custom_question',
      question: customQuestion.trim(),
      context: {
        products: products.map(p => p.id),
        markets: markets.map(m => m.id),
        scenario: currentScenario || undefined,
        forecastData
      }
    });
    
    setCustomQuestion('');
  }, [customQuestion, products, markets, currentScenario, forecastData, generateExplanationMutation]);

  const toggleExpanded = useCallback((explanationId: string) => {
    setExpandedExplanations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(explanationId)) {
        newSet.delete(explanationId);
      } else {
        newSet.add(explanationId);
      }
      return newSet;
    });
  }, []);

  const getExplanationIcon = useCallback((type: string) => {
    switch (type) {
      case 'prediction_reasoning':
        return <ChartBarIcon className="h-5 w-5 text-blue-600" />;
      case 'confidence_breakdown':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'factor_analysis':
        return <TrendingUpIcon className="h-5 w-5 text-purple-600" />;
      case 'model_uncertainty':
        return <ExclamationTriangleIcon className="h-5 w-5 text-amber-600" />;
      case 'historical_accuracy':
        return <ClockIcon className="h-5 w-5 text-gray-600" />;
      default:
        return <LightBulbIcon className="h-5 w-5 text-indigo-600" />;
    }
  }, []);

  const getConfidenceColor = useCallback((confidence: number) => {
    if (confidence >= 0.85) return 'text-green-600 bg-green-100';
    if (confidence >= 0.7) return 'text-blue-600 bg-blue-100';
    if (confidence >= 0.5) return 'text-amber-600 bg-amber-100';
    return 'text-red-600 bg-red-100';
  }, []);

  const getImpactColor = useCallback((impact: number) => {
    const absImpact = Math.abs(impact);
    if (absImpact >= 0.7) return impact > 0 ? 'text-green-600' : 'text-red-600';
    if (absImpact >= 0.4) return impact > 0 ? 'text-green-500' : 'text-red-500';
    if (absImpact >= 0.2) return impact > 0 ? 'text-green-400' : 'text-red-400';
    return 'text-gray-500';
  }, []);

  const filteredExplanations = explanations.filter(explanation => 
    selectedExplanationType === 'all' || explanation.type === selectedExplanationType
  );

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <DocumentTextIcon className="h-6 w-6 text-indigo-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">AI Explanation Panel</h2>
              <p className="text-sm text-gray-500">
                Natural language insights into forecast predictions and model behavior
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={selectedExplanationType}
              onChange={(e) => setSelectedExplanationType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Explanations</option>
              <option value="prediction_reasoning">Prediction Reasoning</option>
              <option value="confidence_breakdown">Confidence Breakdown</option>
              <option value="factor_analysis">Factor Analysis</option>
              <option value="model_uncertainty">Model Uncertainty</option>
              <option value="historical_accuracy">Historical Accuracy</option>
            </select>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          {[
            { type: 'prediction_reasoning', label: 'Why These Predictions?', icon: '🔍' },
            { type: 'confidence_breakdown', label: 'Confidence Analysis', icon: '📊' },
            { type: 'factor_analysis', label: 'Key Factors', icon: '🎯' },
            { type: 'model_uncertainty', label: 'Model Uncertainty', icon: '⚠️' },
            { type: 'historical_accuracy', label: 'Historical Performance', icon: '📈' },
          ].map((action) => (
            <button
              key={action.type}
              onClick={() => generateExplanation(action.type)}
              disabled={isGenerating}
              className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="text-lg mb-1">{action.icon}</div>
              <div className="text-sm font-medium text-gray-900">{action.label}</div>
            </button>
          ))}
        </div>

        {/* Custom Question */}
        <div className="border-t pt-4">
          <div className="flex items-center space-x-3">
            <QuestionMarkCircleIcon className="h-5 w-5 text-gray-400" />
            <div className="flex-1">
              <input
                type="text"
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                placeholder="Ask the AI about your forecast... (e.g., 'Why is Q4 projected higher than Q3?')"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onKeyDown={(e) => e.key === 'Enter' && askCustomQuestion()}
              />
            </div>
            <button
              onClick={askCustomQuestion}
              disabled={!customQuestion.trim() || isGenerating}
              className={cn(
                'px-4 py-2 rounded-lg transition-colors flex items-center gap-2',
                customQuestion.trim() && !isGenerating
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              )}
            >
              <SparklesIcon className="h-4 w-4" />
              Ask AI
            </button>
          </div>
        </div>

        {/* Streaming Progress */}
        {streamingExplanation && (
          <div className="mt-4 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                <span className="text-sm font-medium text-indigo-900">
                  {streamingExplanation.current_section}
                </span>
              </div>
              <div className="text-xs text-indigo-700">
                {streamingExplanation.tokens_used} tokens used
              </div>
            </div>

            <div className="w-full bg-indigo-200 rounded-full h-2 mb-2">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${streamingExplanation.progress}%` }}
              />
            </div>

            {streamingExplanation.partial_content && (
              <div className="mt-3 p-3 bg-white rounded border">
                <p className="text-sm text-gray-700">
                  {streamingExplanation.partial_content}
                  <span className="inline-block w-2 h-4 bg-indigo-600 ml-1 animate-pulse" />
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Explanations List */}
      <div className="space-y-4">
        {filteredExplanations.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No explanations generated yet</p>
            <p className="text-sm text-gray-500">
              Use the quick actions above or ask a custom question to get AI insights
            </p>
          </div>
        ) : (
          filteredExplanations.map((explanation) => {
            const isExpanded = expandedExplanations.has(explanation.id);
            
            return (
              <div key={explanation.id} className="bg-white rounded-lg border border-gray-200">
                {/* Explanation Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getExplanationIcon(explanation.type)}
                      <div>
                        <h3 className="font-semibold text-gray-900">{explanation.title}</h3>
                        <div className="flex items-center space-x-4 mt-1">
                          <div className={cn(
                            'px-2 py-1 rounded-full text-xs font-medium',
                            getConfidenceColor(explanation.confidence)
                          )}>
                            {(explanation.confidence * 100).toFixed(0)}% confident
                          </div>
                          <span className="text-sm text-gray-500">
                            {format(parseISO(explanation.timestamp), 'MMM d, HH:mm')}
                          </span>
                          <span className="text-sm text-gray-500">
                            by {explanation.model_details.primary_model}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleExpanded(explanation.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUpIcon className="h-5 w-5" />
                      ) : (
                        <ChevronDownIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Explanation Content */}
                <div className="p-6">
                  <div className="prose prose-sm max-w-none mb-6">
                    <p className="text-gray-700 leading-relaxed">{explanation.content}</p>
                  </div>

                  {/* Key Factors */}
                  {explanation.key_factors.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Key Influencing Factors</h4>
                      <div className="space-y-3">
                        {explanation.key_factors.slice(0, isExpanded ? undefined : 3).map((factor, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{factor.factor}</div>
                              <div className="text-sm text-gray-600">{factor.explanation}</div>
                            </div>
                            <div className="flex items-center space-x-3 ml-4">
                              <div className="text-right">
                                <div className={cn('text-sm font-medium', getImpactColor(factor.impact))}>
                                  {factor.impact > 0 ? '+' : ''}{(factor.impact * 100).toFixed(0)}%
                                </div>
                                <div className="text-xs text-gray-500">
                                  {(factor.confidence * 100).toFixed(0)}% sure
                                </div>
                              </div>
                              <div className="w-16 h-2 bg-gray-200 rounded-full">
                                <div 
                                  className={cn(
                                    'h-2 rounded-full transition-all',
                                    factor.impact > 0 ? 'bg-green-500' : 'bg-red-500'
                                  )}
                                  style={{ 
                                    width: `${Math.abs(factor.impact) * 100}%`,
                                    marginLeft: factor.impact < 0 ? `${100 - Math.abs(factor.impact) * 100}%` : '0'
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                        {!isExpanded && explanation.key_factors.length > 3 && (
                          <button
                            onClick={() => toggleExpanded(explanation.id)}
                            className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
                          >
                            Show {explanation.key_factors.length - 3} more factors...
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="space-y-6">
                      {/* Historical Context */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Historical Context</h4>
                        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                          <div className="text-center">
                            <div className="text-lg font-bold text-gray-900">
                              {explanation.historical_context.similar_predictions}
                            </div>
                            <div className="text-xs text-gray-600">Similar Predictions</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-600">
                              {(explanation.historical_context.accuracy_rate * 100).toFixed(0)}%
                            </div>
                            <div className="text-xs text-gray-600">Accuracy Rate</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-600">
                              {explanation.historical_context.time_period}
                            </div>
                            <div className="text-xs text-gray-600">Time Period</div>
                          </div>
                        </div>
                      </div>

                      {/* Model Details */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                          <CpuChipIcon className="h-4 w-4" />
                          Model Information
                        </h4>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="text-sm text-blue-800">
                              <div className="font-medium mb-1">Primary Model</div>
                              <div>{explanation.model_details.primary_model}</div>
                            </div>
                          </div>
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="text-sm text-blue-800">
                              <div className="font-medium mb-1">Training Period</div>
                              <div>{explanation.model_details.training_period}</div>
                            </div>
                          </div>
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg lg:col-span-2">
                            <div className="text-sm text-blue-800">
                              <div className="font-medium mb-1">Data Sources</div>
                              <div className="flex flex-wrap gap-2">
                                {explanation.model_details.data_sources.map((source, index) => (
                                  <span key={index} className="px-2 py-1 bg-blue-100 rounded text-xs">
                                    {source}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Uncertainty Sources */}
                      {explanation.uncertainty_sources.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-3">Uncertainty Sources</h4>
                          <div className="space-y-2">
                            {explanation.uncertainty_sources.map((source, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <div className="flex-1">
                                  <div className="font-medium text-amber-900">{source.source}</div>
                                  <div className="text-sm text-amber-700">{source.mitigation}</div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-amber-900">
                                    {(source.contribution * 100).toFixed(0)}%
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}