import React, { useState, useMemo, useCallback } from 'react';
import {
  CpuChipIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BeakerIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  AdjustmentsHorizontalIcon,
  EyeIcon,
  BoltIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ScatterChart, Scatter, ReferenceLine } from 'recharts';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO, subDays } from 'date-fns';
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

interface ModelMetric {
  model_name: string;
  metric_type: 'MAE' | 'RMSE' | 'MAPE' | 'accuracy' | 'precision' | 'recall';
  value: number;
  trend: 'improving' | 'stable' | 'degrading';
  benchmark: number;
  last_updated: string;
}

interface ModelComparison {
  date: string;
  actual: number;
  [key: string]: number; // Dynamic model predictions
}

interface ABTest {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'paused';
  model_a: string;
  model_b: string;
  metric: string;
  confidence: number;
  winner: 'a' | 'b' | 'tie' | null;
  start_date: string;
  end_date: string;
  sample_size: number;
  results: {
    model_a_performance: number;
    model_b_performance: number;
    statistical_significance: number;
  };
}

interface DriftAlert {
  id: string;
  model_name: string;
  drift_type: 'data_drift' | 'concept_drift' | 'prediction_drift';
  severity: 'low' | 'medium' | 'high' | 'critical';
  detected_at: string;
  description: string;
  suggested_actions: string[];
  is_acknowledged: boolean;
}

interface ModelPerformanceTrackingProps {
  products: Product[];
  markets: Market[];
  timeRange: string;
  modelMetrics: any;
  onMetricsUpdate: (metrics: any) => void;
}

export function ModelPerformanceTracking({
  products,
  markets,
  timeRange,
  modelMetrics,
  onMetricsUpdate
}: ModelPerformanceTrackingProps) {
  const [selectedMetric, setSelectedMetric] = useState<'MAE' | 'RMSE' | 'MAPE'>('MAPE');
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [showDriftAlerts, setShowDriftAlerts] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'comparison' | 'ab-tests' | 'drift'>('overview');

  const queryClient = useQueryClient();

  // Fetch model performance data
  const { data: performanceData, isLoading } = useQuery({
    queryKey: ['model-performance', products.map(p => p.id), markets.map(m => m.id), timeRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        products: products.map(p => p.id).join(','),
        markets: markets.map(m => m.id).join(','),
        timeRange,
      });
      
      const response = await fetch(`/api/forecasting/model-performance?${params}`);
      if (!response.ok) throw new Error('Failed to fetch model performance data');
      return response.json();
    },
    refetchInterval: 60000, // Refetch every minute
  });

  // Fetch A/B tests
  const { data: abTests = [] } = useQuery({
    queryKey: ['ab-tests'],
    queryFn: async () => {
      const response = await fetch('/api/forecasting/ab-tests');
      if (!response.ok) throw new Error('Failed to fetch A/B tests');
      return response.json() as ABTest[];
    },
  });

  // Fetch drift alerts
  const { data: driftAlerts = [] } = useQuery({
    queryKey: ['drift-alerts'],
    queryFn: async () => {
      const response = await fetch('/api/forecasting/drift-alerts');
      if (!response.ok) throw new Error('Failed to fetch drift alerts');
      return response.json() as DriftAlert[];
    },
  });

  // Acknowledge drift alert
  const acknowledgeDriftMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const response = await fetch(`/api/forecasting/drift-alerts/${alertId}/acknowledge`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to acknowledge alert');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drift-alerts'] });
    },
  });

  // Start A/B test
  const startABTestMutation = useMutation({
    mutationFn: async (params: {
      name: string;
      model_a: string;
      model_b: string;
      metric: string;
      duration_days: number;
    }) => {
      const response = await fetch('/api/forecasting/ab-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!response.ok) throw new Error('Failed to start A/B test');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ab-tests'] });
    },
  });

  const getMetricColor = useCallback((value: number, benchmark: number, metricType: string) => {
    // For error metrics (MAE, RMSE, MAPE), lower is better
    const isErrorMetric = ['MAE', 'RMSE', 'MAPE'].includes(metricType);
    const isGood = isErrorMetric ? value < benchmark : value > benchmark;
    
    const ratio = isErrorMetric ? benchmark / value : value / benchmark;
    
    if (ratio >= 1.1) return 'text-green-600 bg-green-50';
    if (ratio >= 1.05) return 'text-blue-600 bg-blue-50';
    if (ratio >= 0.95) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  }, []);

  const getTrendIcon = useCallback((trend: string) => {
    switch (trend) {
      case 'improving':
        return <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />;
      case 'degrading':
        return <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
    }
  }, []);

  const getDriftSeverityColor = useCallback((severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 border-red-200 text-red-800';
      case 'high': return 'bg-orange-100 border-orange-200 text-orange-800';
      case 'medium': return 'bg-yellow-100 border-yellow-200 text-yellow-800';
      case 'low': return 'bg-blue-100 border-blue-200 text-blue-800';
      default: return 'bg-gray-100 border-gray-200 text-gray-800';
    }
  }, []);

  const activeDriftAlerts = driftAlerts.filter(alert => !alert.is_acknowledged);
  const runningABTests = abTests.filter(test => test.status === 'running');

  // Mock data for demonstration
  const mockMetrics: ModelMetric[] = [
    { model_name: 'GPT-4 Ensemble', metric_type: 'MAPE', value: 8.5, trend: 'improving', benchmark: 12.0, last_updated: new Date().toISOString() },
    { model_name: 'XGBoost Hybrid', metric_type: 'MAPE', value: 11.2, trend: 'stable', benchmark: 12.0, last_updated: new Date().toISOString() },
    { model_name: 'ARIMA Statistical', metric_type: 'MAPE', value: 15.8, trend: 'degrading', benchmark: 12.0, last_updated: new Date().toISOString() },
    { model_name: 'Neural Prophet', metric_type: 'MAPE', value: 9.3, trend: 'improving', benchmark: 12.0, last_updated: new Date().toISOString() },
  ];

  const mockComparisonData: ModelComparison[] = Array.from({ length: 30 }, (_, i) => {
    const date = format(subDays(new Date(), 29 - i), 'yyyy-MM-dd');
    const actual = 800 + Math.sin(i / 5) * 100 + Math.random() * 50;
    
    return {
      date,
      actual,
      'GPT-4 Ensemble': actual + 0.5 * 60,
      'XGBoost Hybrid': actual + 0.5 * 80,
      'ARIMA Statistical': actual + 0.5 * 120,
      'Neural Prophet': actual + 0.5 * 70,
    };
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6" />
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded" />
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Alerts */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <CpuChipIcon className="h-6 w-6 text-green-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Model Performance Tracking</h2>
              <p className="text-sm text-gray-500">
                Real-time monitoring of ML model accuracy and drift detection
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Metric Selector */}
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="MAPE">MAPE (Mean Absolute Percentage Error)</option>
              <option value="MAE">MAE (Mean Absolute Error)</option>
              <option value="RMSE">RMSE (Root Mean Square Error)</option>
            </select>
          </div>
        </div>

        {/* Active Alerts */}
        {activeDriftAlerts.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                <span className="font-medium text-red-900">Active Drift Alerts</span>
                <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                  {activeDriftAlerts.length}
                </span>
              </div>
              <button
                onClick={() => setShowDriftAlerts(!showDriftAlerts)}
                className="text-sm text-red-600 hover:text-red-800 transition-colors"
              >
                {showDriftAlerts ? 'Hide' : 'Show'} Alerts
              </button>
            </div>

            {showDriftAlerts && (
              <div className="space-y-2">
                {activeDriftAlerts.map((alert) => (
                  <div key={alert.id} className={cn('p-4 rounded-lg border', getDriftSeverityColor(alert.severity))}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium">{alert.model_name}</div>
                        <div className="text-sm opacity-90">{alert.description}</div>
                        <div className="text-xs opacity-75 mt-1">
                          Detected {format(parseISO(alert.detected_at), 'MMM d, HH:mm')}
                        </div>
                      </div>
                      <button
                        onClick={() => acknowledgeDriftMutation.mutate(alert.id)}
                        className="px-3 py-1 bg-white bg-opacity-50 hover:bg-opacity-75 rounded text-sm transition-colors"
                      >
                        Acknowledge
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="px-6">
            <div className="flex space-x-8">
              {[
                { id: 'overview' as const, label: 'Overview', icon: ChartBarIcon },
                { id: 'comparison' as const, label: 'Model Comparison', icon: AdjustmentsHorizontalIcon },
                { id: 'ab-tests' as const, label: 'A/B Tests', icon: BeakerIcon },
                { id: 'drift' as const, label: 'Drift Detection', icon: ExclamationTriangleIcon },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors',
                      isActive
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                    {tab.id === 'ab-tests' && runningABTests.length > 0 && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                        {runningABTests.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Model Metrics Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
                {mockMetrics.map((metric) => (
                  <div key={metric.model_name} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{metric.model_name}</h3>
                      {getTrendIcon(metric.trend)}
                    </div>
                    
                    <div className="flex items-baseline space-x-2 mb-2">
                      <div className={cn(
                        'text-2xl font-bold px-2 py-1 rounded',
                        getMetricColor(metric.value, metric.benchmark, metric.metric_type)
                      )}>
                        {metric.value.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-500">vs {metric.benchmark.toFixed(1)}%</div>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      Updated {format(parseISO(metric.last_updated), 'HH:mm')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Performance Over Time */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends</h3>
                <div style={{ width: '100%', height: '300px' }}>
                  <ResponsiveContainer>
                    <LineChart data={mockComparisonData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => format(parseISO(value), 'MMM d')}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => format(parseISO(value as string), 'MMM d, yyyy')}
                        formatter={(value: any, name: string) => [
                          `${value.toFixed(0)} units`,
                          name === 'actual' ? 'Actual' : name
                        ]}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="actual" 
                        stroke="#374151" 
                        strokeWidth={3}
                        name="Actual"
                      />
                      {Object.keys(mockComparisonData[0]).filter(key => key !== 'date' && key !== 'actual').map((model, index) => {
                        const colors = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6'];
                        return (
                          <Line
                            key={model}
                            type="monotone"
                            dataKey={model}
                            stroke={colors[index % colors.length]}
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            name={model}
                          />
                        );
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Model Comparison Tab */}
          {activeTab === 'comparison' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Model Comparison Analysis</h3>
                <div className="text-sm text-gray-500">Last 30 days</div>
              </div>

              {/* Accuracy Comparison Chart */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Prediction Accuracy Comparison</h4>
                <div style={{ width: '100%', height: '400px' }}>
                  <ResponsiveContainer>
                    <ScatterChart data={mockComparisonData.map((item, index) => ({
                      ...item,
                      index
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="actual" name="Actual" />
                      <YAxis name="Predicted" />
                      <Tooltip 
                        cursor={{ strokeDasharray: '3 3' }}
                        formatter={(value: any, name: string) => [`${value.toFixed(0)} units`, name]}
                      />
                      <ReferenceLine y={0} stroke="#000" strokeDasharray="2 2" />
                      <ReferenceLine x={0} stroke="#000" strokeDasharray="2 2" />
                      
                      {Object.keys(mockComparisonData[0]).filter(key => key !== 'date' && key !== 'actual' && key !== 'index').map((model, index) => {
                        const colors = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6'];
                        return (
                          <Scatter
                            key={model}
                            name={model}
                            dataKey={model}
                            fill={colors[index % colors.length]}
                          />
                        );
                      })}
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* A/B Tests Tab */}
          {activeTab === 'ab-tests' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Model A/B Testing</h3>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
                  <BeakerIcon className="h-4 w-4" />
                  Start New Test
                </button>
              </div>

              {/* Running Tests */}
              {runningABTests.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <BoltIcon className="h-4 w-4 text-green-600" />
                    Running Tests ({runningABTests.length})
                  </h4>
                  <div className="space-y-3">
                    {runningABTests.map((test) => (
                      <div key={test.id} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium text-green-900">{test.name}</div>
                            <div className="text-sm text-green-700 mt-1">
                              {test.model_a} vs {test.model_b} • {test.metric}
                            </div>
                            <div className="text-xs text-green-600 mt-1">
                              Sample size: {test.sample_size.toLocaleString()} • 
                              Started {format(parseISO(test.start_date), 'MMM d')}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-green-900">
                              {(test.confidence * 100).toFixed(0)}% confidence
                            </div>
                            <button className="text-xs text-green-600 hover:text-green-800 transition-colors mt-1">
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Tests */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Recent Completed Tests</h4>
                {abTests.filter(test => test.status === 'completed').length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <BeakerIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No completed A/B tests yet</p>
                    <p className="text-sm">Start testing to compare model performance</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {abTests.filter(test => test.status === 'completed').map((test) => (
                      <div key={test.id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium text-gray-900">{test.name}</div>
                            <div className="text-sm text-gray-600 mt-1">
                              {test.model_a} vs {test.model_b}
                            </div>
                          </div>
                          <div className="text-right">
                            {test.winner && (
                              <div className="flex items-center space-x-2">
                                <CheckCircleIcon className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-medium text-gray-900">
                                  {test.winner === 'a' ? test.model_a : test.model_b} Won
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Drift Detection Tab */}
          {activeTab === 'drift' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Model Drift Detection</h3>
                <div className="text-sm text-gray-500">
                  Monitoring data and concept drift across models
                </div>
              </div>

              {/* Drift Alerts */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">All Drift Alerts</h4>
                {driftAlerts.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">No drift detected</p>
                    <p className="text-sm text-gray-500">Your models are performing within expected parameters</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {driftAlerts.map((alert) => (
                      <div key={alert.id} className={cn(
                        'p-4 rounded-lg border',
                        alert.is_acknowledged 
                          ? 'bg-gray-50 border-gray-200 opacity-75' 
                          : getDriftSeverityColor(alert.severity)
                      )}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-medium">{alert.model_name}</span>
                              <span className="px-2 py-1 rounded-full text-xs bg-white bg-opacity-50">
                                {alert.drift_type.replace('_', ' ')}
                              </span>
                              <span className="px-2 py-1 rounded-full text-xs bg-white bg-opacity-50">
                                {alert.severity}
                              </span>
                            </div>
                            <p className="text-sm opacity-90 mb-3">{alert.description}</p>
                            
                            <div>
                              <div className="text-xs font-medium opacity-75 mb-1">Suggested Actions:</div>
                              <ul className="text-xs opacity-75 list-disc list-inside">
                                {alert.suggested_actions.map((action, index) => (
                                  <li key={index}>{action}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          
                          <div className="ml-4 text-right">
                            <div className="text-xs opacity-75 mb-2">
                              {format(parseISO(alert.detected_at), 'MMM d, HH:mm')}
                            </div>
                            {alert.is_acknowledged ? (
                              <span className="text-xs text-gray-500">Acknowledged</span>
                            ) : (
                              <button
                                onClick={() => acknowledgeDriftMutation.mutate(alert.id)}
                                className="px-3 py-1 bg-white bg-opacity-50 hover:bg-opacity-75 rounded text-xs transition-colors"
                              >
                                Acknowledge
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}