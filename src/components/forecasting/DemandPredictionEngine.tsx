import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  SparklesIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  AdjustmentsHorizontalIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CpuChipIcon,
  CalendarDaysIcon,
  MegaphoneIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from '@/hooks/useWebSocket';
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

interface ExternalFactor {
  id: string;
  type: 'holiday' | 'event' | 'promotion' | 'competition' | 'economic';
  name: string;
  date: string;
  impact: number; // -1 to 1
  confidence: number; // 0 to 1
  description: string;
}

interface PredictionScenario {
  id: string;
  name: string;
  type: 'optimistic' | 'realistic' | 'pessimistic';
  confidence: number;
  predictions: {
    product_id: string;
    market_id: string;
    timeline: {
      date: string;
      value: number;
      confidence_lower: number;
      confidence_upper: number;
    }[];
  }[];
  key_factors: string[];
  external_factors: string[];
}

interface StreamingPrediction {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'error';
  progress: number;
  current_step: string;
  scenarios: PredictionScenario[];
  estimated_completion: string;
  tokens_used: number;
  model_used: string;
}

interface DemandPredictionEngineProps {
  products: Product[];
  markets: Market[];
  timeRange: string;
  forecastData: any;
  onForecastUpdate: () => void;
}

export function DemandPredictionEngine({
  products,
  markets,
  timeRange,
  forecastData,
  onForecastUpdate
}: DemandPredictionEngineProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingPrediction, setStreamingPrediction] = useState<StreamingPrediction | null>(null);
  const [externalFactors, setExternalFactors] = useState<ExternalFactor[]>([]);
  const [manualAdjustments, setManualAdjustments] = useState<Map<string, number>>(new Map());
  const [selectedScenario, setSelectedScenario] = useState<'optimistic' | 'realistic' | 'pessimistic'>('realistic');
  const [customPrompt, setCustomPrompt] = useState('');
  
  const streamRef = useRef<EventSource | null>(null);
  const queryClient = useQueryClient();

  // Generate prediction mutation
  const generatePredictionMutation = useMutation({
    mutationFn: async (params: {
      products: string[];
      markets: string[];
      timeRange: string;
      externalFactors: ExternalFactor[];
      customPrompt?: string;
    }) => {
      const response = await fetch('/api/forecasting/ai-predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!response.ok) throw new Error('Failed to start prediction generation');
      return response.json();
    },
    onSuccess: (data) => {
      startStreamingPrediction(data.prediction_id);
    },
    onError: () => {
      setIsGenerating(false);
    },
  });

  // Start streaming prediction updates
  const startStreamingPrediction = useCallback((predictionId: string) => {
    if (streamRef.current) {
      streamRef.current.close();
    }

    const eventSource = new EventSource(`/api/forecasting/ai-predict/stream/${predictionId}`);
    streamRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data: StreamingPrediction = JSON.parse(event.data);
        setStreamingPrediction(data);

        if (data.status === 'completed') {
          setIsGenerating(false);
          onForecastUpdate();
          queryClient.invalidateQueries({ queryKey: ['forecasting-data'] });
          eventSource.close();
        } else if (data.status === 'error') {
          setIsGenerating(false);
          eventSource.close();
        }
      } catch (error) {
        console.error('Error parsing streaming data:', error);
      }
    };

    eventSource.onerror = () => {
      setIsGenerating(false);
      eventSource.close();
    };
  }, [onForecastUpdate, queryClient]);

  // Stop prediction generation
  const stopPrediction = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.close();
      streamRef.current = null;
    }
    setIsGenerating(false);
    setStreamingPrediction(null);
  }, []);

  // Start prediction generation
  const startPrediction = useCallback(() => {
    setIsGenerating(true);
    generatePredictionMutation.mutate({
      products: products.map(p => p.id),
      markets: markets.map(m => m.id),
      timeRange,
      externalFactors,
      customPrompt: customPrompt.trim() || undefined,
    });
  }, [products, markets, timeRange, externalFactors, customPrompt, generatePredictionMutation]);

  // Add external factor
  const addExternalFactor = useCallback((factor: Omit<ExternalFactor, 'id'>) => {
    const newFactor: ExternalFactor = {
      ...factor,
      id: Date.now().toString(),
    };
    setExternalFactors(prev => [...prev, newFactor]);
  }, []);

  // Remove external factor
  const removeExternalFactor = useCallback((id: string) => {
    setExternalFactors(prev => prev.filter(f => f.id !== id));
  }, []);

  // Update manual adjustment
  const updateManualAdjustment = useCallback((key: string, adjustment: number) => {
    setManualAdjustments(prev => {
      const newMap = new Map(prev);
      if (adjustment === 0) {
        newMap.delete(key);
      } else {
        newMap.set(key, adjustment);
      }
      return newMap;
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.close();
      }
    };
  }, []);

  const getScenarioIcon = useCallback((type: string) => {
    switch (type) {
      case 'optimistic':
        return <TrophyIcon className="h-4 w-4 text-green-600" />;
      case 'pessimistic':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />;
      default:
        return <CheckCircleIcon className="h-4 w-4 text-blue-600" />;
    }
  }, []);

  const getFactorIcon = useCallback((type: string) => {
    switch (type) {
      case 'holiday':
        return <CalendarDaysIcon className="h-4 w-4 text-purple-600" />;
      case 'promotion':
        return <MegaphoneIcon className="h-4 w-4 text-orange-600" />;
      case 'event':
        return <CalendarDaysIcon className="h-4 w-4 text-blue-600" />;
      case 'competition':
        return <TrophyIcon className="h-4 w-4 text-red-600" />;
      case 'economic':
        return <CpuChipIcon className="h-4 w-4 text-gray-600" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-500" />;
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* AI Prediction Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <SparklesIcon className="h-6 w-6 text-purple-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">AI Demand Prediction Engine</h2>
              <p className="text-sm text-gray-500">
                GPT-4 powered forecasting with real-time streaming predictions
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {isGenerating ? (
              <button
                onClick={stopPrediction}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <StopIcon className="h-4 w-4" />
                Stop Generation
              </button>
            ) : (
              <button
                onClick={startPrediction}
                disabled={products.length === 0 || markets.length === 0}
                className={cn(
                  'px-4 py-2 rounded-lg transition-colors flex items-center gap-2',
                  products.length > 0 && markets.length > 0
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                )}
              >
                <PlayIcon className="h-4 w-4" />
                Generate Predictions
              </button>
            )}
          </div>
        </div>

        {/* Custom Prompt */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Context (Optional)
          </label>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Add any additional context, market conditions, or specific requirements for the AI model..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            rows={3}
          />
          <p className="text-xs text-gray-500 mt-1">
            This context will be provided to the AI model to improve prediction accuracy
          </p>
        </div>

        {/* External Factors */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">External Factors</h3>
            <button
              onClick={() => {
                const factor: Omit<ExternalFactor, 'id'> = {
                  type: 'promotion',
                  name: 'New Factor',
                  date: new Date().toISOString().split('T')[0],
                  impact: 0.1,
                  confidence: 0.8,
                  description: 'Custom external factor',
                };
                addExternalFactor(factor);
              }}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
            >
              Add Factor
            </button>
          </div>

          {externalFactors.length === 0 ? (
            <div className="text-center py-4 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
              <CalendarDaysIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No external factors configured</p>
              <p className="text-xs">Add holidays, promotions, or events that might impact demand</p>
            </div>
          ) : (
            <div className="space-y-2">
              {externalFactors.map((factor) => (
                <div key={factor.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getFactorIcon(factor.type)}
                    <div>
                      <div className="font-medium text-gray-900">{factor.name}</div>
                      <div className="text-sm text-gray-500">
                        {factor.date} • Impact: {(factor.impact * 100).toFixed(0)}% • 
                        Confidence: {(factor.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeExternalFactor(factor.id)}
                    className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Streaming Progress */}
        {streamingPrediction && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                <span className="text-sm font-medium text-purple-900">
                  {streamingPrediction.current_step}
                </span>
              </div>
              <div className="text-xs text-purple-700">
                {streamingPrediction.model_used} • {streamingPrediction.tokens_used} tokens
              </div>
            </div>

            <div className="w-full bg-purple-200 rounded-full h-2 mb-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${streamingPrediction.progress}%` }}
              />
            </div>

            <div className="flex justify-between text-xs text-purple-700">
              <span>{streamingPrediction.progress.toFixed(0)}% complete</span>
              <span>ETA: {new Date(streamingPrediction.estimated_completion).toLocaleTimeString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Scenario Selection */}
      {streamingPrediction?.scenarios && streamingPrediction.scenarios.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Generated Scenarios</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {streamingPrediction.scenarios.map((scenario) => (
              <div
                key={scenario.id}
                className={cn(
                  'p-4 border-2 rounded-lg cursor-pointer transition-colors',
                  selectedScenario === scenario.type
                    ? 'border-purple-300 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
                onClick={() => setSelectedScenario(scenario.type)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getScenarioIcon(scenario.type)}
                    <span className="font-medium text-gray-900 capitalize">{scenario.type}</span>
                  </div>
                  <div className="text-sm text-gray-600">{(scenario.confidence * 100).toFixed(0)}%</div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-gray-700">Key Factors:</h4>
                  <div className="space-y-1">
                    {scenario.key_factors.slice(0, 3).map((factor, index) => (
                      <div key={index} className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {factor}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Adjustments */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Manual Adjustments</h3>
          </div>
          <button
            onClick={() => setManualAdjustments(new Map())}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Clear All
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {products.map((product) => (
            <div key={product.id} className="space-y-3">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: product.color }}
                />
                <span className="font-medium text-gray-900">{product.name}</span>
              </div>
              
              {markets.map((market) => {
                const key = `${product.id}-${market.id}`;
                const adjustment = manualAdjustments.get(key) || 0;
                
                return (
                  <div key={market.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{market.flagEmoji}</span>
                      <span className="text-sm text-gray-600">{market.code}</span>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        step="1"
                        value={adjustment * 100}
                        onChange={(e) => updateManualAdjustment(key, parseInt(e.target.value) / 100)}
                        className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className={cn(
                        'text-sm font-medium w-12 text-right',
                        adjustment > 0 ? 'text-green-600' : adjustment < 0 ? 'text-red-600' : 'text-gray-600'
                      )}>
                        {adjustment > 0 ? '+' : ''}{(adjustment * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {manualAdjustments.size > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-800">
              <strong>Impact Preview:</strong> Manual adjustments will be applied to the selected scenario predictions.
              These adjustments reflect your domain expertise and market insights.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}