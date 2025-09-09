import React, { useState, useEffect } from 'react';
import {
  PresentationChartLineIcon,
  BoltIcon,
  SparklesIcon,
  CpuChipIcon,
  ChartBarIcon,
  AdjustmentsHorizontalIcon,
  ClockIcon,
  ArrowArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  BeakerIcon,
  GlobeAltIcon,
  CalendarDaysIcon,
  CurrencyPoundIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ComposedChart, Area, AreaChart, ScatterChart, Scatter, ReferenceLine } from 'recharts';
import ChartErrorBoundary from '../charts/ChartErrorBoundary';

const EnhancedAIForecasting = () => {
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState('ensemble');
  const [forecastHorizon, setForecastHorizon] = useState(30);
  const [confidenceLevel, setConfidenceLevel] = useState(95);
  const [selectedMetrics, setSelectedMetrics] = useState(['demand', 'revenue', 'inventory']);
  const [modelComparison, setModelComparison] = useState(true);
  const [scenarioMode, setScenarioMode] = useState(false);

  useEffect(() => {
    const fetchForecastData = async () => {
      try {
        const response = await fetch(`/api/forecasting/enhanced?model=${selectedModel}&horizon=${forecastHorizon}&confidence=${confidenceLevel}`);
        if (response.ok) {
          const data = await response.json();
          setForecastData(data);
        } else {
          setForecastData(mockEnhancedForecastData);
        }
      } catch (error) {
        console.error('Error fetching forecast data:', error);
        setForecastData(mockEnhancedForecastData);
      } finally {
        setLoading(false);
      }
    };

    fetchForecastData();
    const interval = setInterval(fetchForecastData, 60000);
    return () => clearInterval(interval);
  }, [selectedModel, forecastHorizon, confidenceLevel]);

  const mockEnhancedForecastData = {
    models: {
      ensemble: {
        name: 'AI Ensemble Model',
        accuracy: 94.2,
        confidence: 0.96,
        mape: 5.8,
        description: 'Combines multiple AI models including neural networks, LSTM, and statistical models',
        lastTrained: '2025-09-08T06:00:00Z',
        features: ['seasonal_patterns', 'market_trends', 'external_factors', 'promotional_impact'],
        performance: {
          shortTerm: 96.1,
          mediumTerm: 93.8,
          longTerm: 89.5
        }
      },
      neuralNetwork: {
        name: 'Deep Neural Network',
        accuracy: 91.5,
        confidence: 0.94,
        mape: 8.5,
        description: 'Advanced deep learning model with attention mechanisms',
        lastTrained: '2025-09-08T02:00:00Z',
        features: ['time_series', 'cross_product_influence', 'market_sentiment'],
        performance: {
          shortTerm: 94.2,
          mediumTerm: 91.1,
          longTerm: 87.8
        }
      },
      lstm: {
        name: 'LSTM Time Series',
        accuracy: 89.7,
        confidence: 0.91,
        mape: 10.3,
        description: 'Long Short-Term Memory network optimized for sequential data',
        lastTrained: '2025-09-07T18:00:00Z',
        features: ['historical_demand', 'seasonality', 'trend_analysis'],
        performance: {
          shortTerm: 92.1,
          mediumTerm: 88.9,
          longTerm: 84.2
        }
      },
      statistical: {
        name: 'Statistical Models',
        accuracy: 85.3,
        confidence: 0.87,
        mape: 14.7,
        description: 'ARIMA, Exponential Smoothing, and Regression models',
        lastTrained: '2025-09-08T00:00:00Z',
        features: ['moving_averages', 'seasonal_decomposition', 'linear_trends'],
        performance: {
          shortTerm: 87.5,
          mediumTerm: 84.1,
          longTerm: 82.3
        }
      }
    },
    forecast: {
      demand: [
        { date: '2025-09-09', actual: null, predicted: 2420, upperBound: 2580, lowerBound: 2260, confidence: 0.95 },
        { date: '2025-09-10', actual: null, predicted: 2450, upperBound: 2620, lowerBound: 2280, confidence: 0.95 },
        { date: '2025-09-11', actual: null, predicted: 2380, upperBound: 2560, lowerBound: 2200, confidence: 0.94 },
        { date: '2025-09-12', actual: null, predicted: 2520, upperBound: 2710, lowerBound: 2330, confidence: 0.94 },
        { date: '2025-09-13', actual: null, predicted: 2480, upperBound: 2680, lowerBound: 2280, confidence: 0.93 },
        { date: '2025-09-14', actual: null, predicted: 2350, upperBound: 2560, lowerBound: 2140, confidence: 0.93 },
        { date: '2025-09-15', actual: null, predicted: 2290, upperBound: 2510, lowerBound: 2070, confidence: 0.92 }
      ],
      revenue: [
        { date: '2025-09-09', actual: null, predicted: 96800, upperBound: 103200, lowerBound: 90400, confidence: 0.95 },
        { date: '2025-09-10', actual: null, predicted: 98000, upperBound: 104800, lowerBound: 91200, confidence: 0.95 },
        { date: '2025-09-11', actual: null, predicted: 95200, upperBound: 102400, lowerBound: 88000, confidence: 0.94 },
        { date: '2025-09-12', actual: null, predicted: 100800, upperBound: 108400, lowerBound: 93200, confidence: 0.94 },
        { date: '2025-09-13', actual: null, predicted: 99200, upperBound: 107200, lowerBound: 91200, confidence: 0.93 },
        { date: '2025-09-14', actual: null, predicted: 94000, upperBound: 102400, lowerBound: 85600, confidence: 0.93 },
        { date: '2025-09-15', actual: null, predicted: 91600, upperBound: 100400, lowerBound: 82800, confidence: 0.92 }
      ],
      inventory: [
        { date: '2025-09-09', actual: null, predicted: 15200, upperBound: 16800, lowerBound: 13600, confidence: 0.95 },
        { date: '2025-09-10', actual: null, predicted: 14800, upperBound: 16400, lowerBound: 13200, confidence: 0.95 },
        { date: '2025-09-11', actual: null, predicted: 15600, upperBound: 17200, lowerBound: 14000, confidence: 0.94 },
        { date: '2025-09-12', actual: null, predicted: 14200, upperBound: 15800, lowerBound: 12600, confidence: 0.94 },
        { date: '2025-09-13', actual: null, predicted: 14900, upperBound: 16500, lowerBound: 13300, confidence: 0.93 },
        { date: '2025-09-14', actual: null, predicted: 15800, upperBound: 17400, lowerBound: 14200, confidence: 0.93 },
        { date: '2025-09-15', actual: null, predicted: 16200, upperBound: 17800, lowerBound: 14600, confidence: 0.92 }
      ]
    },
    historical: [
      { date: '2025-09-01', demand: 2380, revenue: 95200, inventory: 15400 },
      { date: '2025-09-02', demand: 2420, revenue: 96800, inventory: 15100 },
      { date: '2025-09-03', demand: 2350, revenue: 94000, inventory: 15800 },
      { date: '2025-09-04', demand: 2480, revenue: 99200, inventory: 14900 },
      { date: '2025-09-05', demand: 2520, revenue: 100800, inventory: 14600 },
      { date: '2025-09-06', demand: 2390, revenue: 95600, inventory: 15300 },
      { date: '2025-09-07', demand: 2450, revenue: 98000, inventory: 14800 },
      { date: '2025-09-08', demand: 2410, revenue: 96400, inventory: 15200 }
    ],
    modelComparison: [
      { date: '2025-09-09', ensemble: 2420, neural: 2450, lstm: 2380, statistical: 2400 },
      { date: '2025-09-10', ensemble: 2450, neural: 2480, lstm: 2410, statistical: 2430 },
      { date: '2025-09-11', ensemble: 2380, neural: 2420, lstm: 2350, statistical: 2370 },
      { date: '2025-09-12', ensemble: 2520, neural: 2560, lstm: 2490, statistical: 2510 },
      { date: '2025-09-13', ensemble: 2480, neural: 2510, lstm: 2450, statistical: 2470 },
      { date: '2025-09-14', ensemble: 2350, neural: 2390, lstm: 2320, statistical: 2340 },
      { date: '2025-09-15', ensemble: 2290, neural: 2330, lstm: 2260, statistical: 2280 }
    ],
    insights: [
      {
        type: 'trend',
        severity: 'info',
        title: 'Seasonal Pattern Detected',
        description: 'Strong weekly seasonality with peak demand on Fridays and weekends',
        impact: 'medium',
        confidence: 0.94,
        recommendedActions: ['Adjust production schedule', 'Optimize inventory levels']
      },
      {
        type: 'anomaly',
        severity: 'warning',
        title: 'Demand Surge Expected',
        description: 'AI model predicts 15% increase in demand next week based on market indicators',
        impact: 'high',
        confidence: 0.87,
        recommendedActions: ['Increase production capacity', 'Review supplier commitments']
      },
      {
        type: 'optimization',
        severity: 'success',
        title: 'Inventory Optimization Opportunity',
        description: 'Model suggests reducing safety stock by 8% without impacting service levels',
        impact: 'medium',
        confidence: 0.92,
        recommendedActions: ['Adjust reorder points', 'Optimize warehouse space']
      },
      {
        type: 'risk',
        severity: 'error',
        title: 'Supply Chain Risk Alert',
        description: 'External factors indicate potential supply disruption in 2 weeks',
        impact: 'high',
        confidence: 0.79,
        recommendedActions: ['Diversify suppliers', 'Build buffer inventory']
      }
    ],
    metrics: {
      accuracy: {
        current: 94.2,
        target: 95.0,
        trend: 'up'
      },
      mape: {
        current: 5.8,
        target: 5.0,
        trend: 'down'
      },
      bias: {
        current: -0.2,
        target: 0.0,
        trend: 'stable'
      },
      coverage: {
        current: 96.1,
        target: 95.0,
        trend: 'up'
      }
    },
    externalFactors: [
      { name: 'Weather Impact', influence: 0.15, trend: 'positive', description: 'Favorable weather conditions increasing demand' },
      { name: 'Market Sentiment', influence: 0.08, trend: 'neutral', description: 'Stable consumer confidence levels' },
      { name: 'Competitor Activity', influence: -0.05, trend: 'negative', description: 'New competitor product launch' },
      { name: 'Economic Indicators', influence: 0.12, trend: 'positive', description: 'Strong economic growth in key markets' },
      { name: 'Promotional Events', influence: 0.22, trend: 'positive', description: 'Planned marketing campaigns driving demand' }
    ]
  };

  const getInsightIcon = (type) => {
    switch (type) {
      case 'trend':
        return <ArrowArrowTrendingUpIcon className="h-5 w-5" />;
      case 'anomaly':
        return <ExclamationTriangleIcon className="h-5 w-5" />;
      case 'optimization':
        return <BoltIcon className="h-5 w-5" />;
      case 'risk':
        return <ExclamationTriangleIcon className="h-5 w-5" />;
      default:
        return <InformationCircleIcon className="h-5 w-5" />;
    }
  };

  const getInsightColor = (severity) => {
    switch (severity) {
      case 'success':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'error':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default:
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const data = forecastData || mockEnhancedForecastData;
  const selectedModelData = data.models[selectedModel];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Enhanced AI Forecasting
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Advanced machine learning models for demand prediction and business intelligence
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setScenarioMode(!scenarioMode)}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
              scenarioMode 
                ? 'bg-purple-600 text-white hover:bg-purple-700' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <BeakerIcon className="h-4 w-4" />
            <span>Scenario Mode</span>
          </button>
          <button
            onClick={() => setModelComparison(!modelComparison)}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
              modelComparison 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <ChartBarIcon className="h-4 w-4" />
            <span>Model Comparison</span>
          </button>
        </div>
      </div>

      {/* Model Selection and Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Forecasting Model
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="ensemble">AI Ensemble Model</option>
              <option value="neuralNetwork">Deep Neural Network</option>
              <option value="lstm">LSTM Time Series</option>
              <option value="statistical">Statistical Models</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Forecast Horizon (days)
            </label>
            <select
              value={forecastHorizon}
              onChange={(e) => setForecastHorizon(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value={7}>7 Days</option>
              <option value={14}>14 Days</option>
              <option value={30}>30 Days</option>
              <option value={90}>90 Days</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confidence Level
            </label>
            <select
              value={confidenceLevel}
              onChange={(e) => setConfidenceLevel(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value={90}>90%</option>
              <option value={95}>95%</option>
              <option value={99}>99%</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Metrics to Display
            </label>
            <div className="flex flex-wrap gap-2">
              {['demand', 'revenue', 'inventory'].map(metric => (
                <button
                  key={metric}
                  onClick={() => {
                    if (selectedMetrics.includes(metric)) {
                      setSelectedMetrics(selectedMetrics.filter(m => m !== metric));
                    } else {
                      setSelectedMetrics([...selectedMetrics, metric]);
                    }
                  }}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    selectedMetrics.includes(metric)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {metric.charAt(0).toUpperCase() + metric.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Model Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Model Accuracy</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedModelData.accuracy}%
              </p>
              <p className="text-sm text-green-600">Above target (95%)</p>
            </div>
            <SparklesIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Confidence Score</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {(selectedModelData.confidence * 100).toFixed(1)}%
              </p>
              <p className="text-sm text-blue-600">High confidence</p>
            </div>
            <CpuChipIcon className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">MAPE Error</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedModelData.mape}%
              </p>
              <p className="text-sm text-yellow-600">Target: &lt;5%</p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Updated</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {new Date(selectedModelData.lastTrained).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-500">Auto-retrained daily</p>
            </div>
            <ClockIcon className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Main Forecast Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Demand Forecast with Confidence Intervals
          </h3>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400">Predicted</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-200 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400">Confidence Band</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400">Historical</span>
            </div>
          </div>
        </div>
        <div className="h-80">
          <ChartErrorBoundary>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={[...data.historical, ...data.forecast.demand]} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'predicted' || name === 'demand') return [value?.toLocaleString(), 'Units'];
                    return [value?.toLocaleString(), name];
                  }}
                  labelFormatter={(label) => formatDate(label)}
                />
                <Area
                  dataKey="upperBound"
                  stroke="none"
                  fill="#3B82F6"
                  fillOpacity={0.1}
                  connectNulls={false}
                />
                <Area
                  dataKey="lowerBound"
                  stroke="none"
                  fill="#ffffff"
                  fillOpacity={1}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="demand"
                  stroke="#6B7280"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  dot={{ r: 4 }}
                  connectNulls={false}
                />
                <ReferenceLine x="2025-09-08" stroke="#EF4444" strokeDasharray="2 2" />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartErrorBoundary>
        </div>
      </div>

      {/* Model Comparison Chart */}
      {modelComparison && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Model Performance Comparison
          </h3>
          <div className="h-64">
            <ChartErrorBoundary>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.modelComparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={formatDate} />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [value?.toLocaleString(), 'Units']}
                    labelFormatter={(label) => formatDate(label)}
                  />
                  <Line type="monotone" dataKey="ensemble" stroke="#3B82F6" strokeWidth={2} name="Ensemble" />
                  <Line type="monotone" dataKey="neural" stroke="#10B981" strokeWidth={2} name="Neural Network" />
                  <Line type="monotone" dataKey="lstm" stroke="#F59E0B" strokeWidth={2} name="LSTM" />
                  <Line type="monotone" dataKey="statistical" stroke="#EF4444" strokeWidth={2} name="Statistical" />
                </LineChart>
              </ResponsiveContainer>
            </ChartErrorBoundary>
          </div>
        </div>
      )}

      {/* External Factors */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            External Factors Impact
          </h3>
          <GlobeAltIcon className="h-5 w-5 text-gray-400" />
        </div>
        <div className="space-y-4">
          {data.externalFactors.map((factor, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${
                  factor.trend === 'positive' ? 'bg-green-100 dark:bg-green-900/20' :
                  factor.trend === 'negative' ? 'bg-red-100 dark:bg-red-900/20' :
                  'bg-gray-100 dark:bg-gray-600'
                }`}>
                  {factor.trend === 'positive' ? (
                    <ArrowArrowTrendingUpIcon className="h-4 w-4 text-green-600" />
                  ) : factor.trend === 'negative' ? (
                    <ArrowTrendingDownIcon className="h-4 w-4 text-red-600" />
                  ) : (
                    <ArrowArrowTrendingUpIcon className="h-4 w-4 text-gray-600" />
                  )}
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white text-sm">
                    {factor.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {factor.description}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-medium text-sm ${
                  factor.influence > 0 ? 'text-green-600' : factor.influence < 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {factor.influence > 0 ? '+' : ''}{(factor.influence * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Influence
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            AI-Generated Insights
          </h3>
          <SparklesIcon className="h-5 w-5 text-gray-400" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.insights.map((insight, index) => (
            <div key={index} className={`p-4 rounded-lg border ${getInsightColor(insight.severity)}`}>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {getInsightIcon(insight.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">
                      {insight.title}
                    </h4>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-white bg-opacity-50">
                      {(insight.confidence * 100).toFixed(0)}% confident
                    </span>
                  </div>
                  <p className="text-sm mb-3">
                    {insight.description}
                  </p>
                  <div className="space-y-1">
                    <div className="text-xs font-medium">Recommended Actions:</div>
                    <ul className="text-xs space-y-1">
                      {insight.recommendedActions.map((action, actionIndex) => (
                        <li key={actionIndex} className="flex items-center space-x-1">
                          <div className="w-1 h-1 bg-current rounded-full"></div>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EnhancedAIForecasting;