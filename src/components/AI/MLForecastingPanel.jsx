import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  CpuChipIcon,
  LightBulbIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BeakerIcon,
  SparklesIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

const MLForecastingPanel = ({ forecastData, className = "" }) => {
  const [selectedModel, setSelectedModel] = useState('ensemble');
  const [forecastHorizon, setForecastHorizon] = useState(30);
  const [modelMetrics, setModelMetrics] = useState({
    ensemble: { accuracy: 94.3, mape: 5.7, rmse: 12.1, confidence: 92.8 },
    gpt4: { accuracy: 91.2, mape: 7.2, rmse: 15.3, confidence: 89.1 },
    claude: { accuracy: 92.8, mape: 6.4, rmse: 13.7, confidence: 90.5 },
    arima: { accuracy: 87.5, mape: 9.1, rmse: 18.9, confidence: 85.2 },
    prophet: { accuracy: 89.3, mape: 8.3, rmse: 16.4, confidence: 87.6 }
  });

  // Generate mock forecast data for demonstration
  const generateForecastData = () => {
    const baselineAmount = 100;
    const days = forecastHorizon;
    const data = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      const seasonalFactor = 1 + 0.2 * Math.sin((i / 30) * 2 * Math.PI);
      const trendFactor = 1 + (i * 0.005);
      const noise = 0.9 + 0 /* REAL DATA REQUIRED */ * 0.2;
      
      const baseValue = baselineAmount * seasonalFactor * trendFactor * noise;
      
      data.push({
        date: date.toISOString().split('T')[0],
        day: i + 1,
        actual: i < 7 ? baseValue : null,
        ensemble: baseValue * (0.98 + 0 /* REAL DATA REQUIRED */ * 0.04),
        gpt4: baseValue * (0.96 + 0 /* REAL DATA REQUIRED */ * 0.08),
        claude: baseValue * (0.97 + 0 /* REAL DATA REQUIRED */ * 0.06),
        arima: baseValue * (0.94 + 0 /* REAL DATA REQUIRED */ * 0.12),
        prophet: baseValue * (0.95 + 0 /* REAL DATA REQUIRED */ * 0.10),
        confidence_upper: baseValue * 1.15,
        confidence_lower: baseValue * 0.85
      });
    }
    
    return data;
  };

  const [chartData, setChartData] = useState(generateForecastData());

  useEffect(() => {
    setChartData(generateForecastData());
  }, [forecastHorizon]);

  const modelInfo = {
    ensemble: {
      name: 'AI Ensemble',
      description: 'Combines GPT-4, Claude, and traditional models',
      icon: <SparklesIcon className="h-5 w-5" />,
      color: '#8b5cf6',
      features: ['Multi-model fusion', 'Adaptive weighting', 'Confidence intervals']
    },
    gpt4: {
      name: 'GPT-4 Predictor',
      description: 'OpenAI GPT-4 with manufacturing context',
      icon: <CpuChipIcon className="h-5 w-5" />,
      color: '#10b981',
      features: ['Natural language patterns', 'Context awareness', 'Causal reasoning']
    },
    claude: {
      name: 'Claude Analytics',
      description: 'Anthropic Claude with analytical focus',
      icon: <LightBulbIcon className="h-5 w-5" />,
      color: '#f59e0b',
      features: ['Analytical reasoning', 'Risk assessment', 'Pattern recognition']
    },
    arima: {
      name: 'ARIMA Classic',
      description: 'Traditional time series analysis',
      icon: <ChartBarIcon className="h-5 w-5" />,
      color: '#6366f1',
      features: ['Time series modeling', 'Seasonal decomposition', 'Statistical foundation']
    },
    prophet: {
      name: 'Facebook Prophet',
      description: 'Advanced statistical forecasting',
      icon: <ArrowTrendingUpIcon className="h-5 w-5" />,
      color: '#ef4444',
      features: ['Holiday effects', 'Trend changes', 'Seasonal patterns']
    }
  };

  const getCurrentMetrics = () => modelMetrics[selectedModel] || modelMetrics.ensemble;

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BeakerIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">ML Ensemble Forecasting</h3>
              <p className="text-sm text-gray-500">Multi-model AI demand prediction</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={forecastHorizon}
              onChange={(e) => setForecastHorizon(parseInt(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
            </select>
          </div>
        </div>

        {/* Model Selection */}
        <div className="flex space-x-2 overflow-x-auto">
          {Object.entries(modelInfo).map(([key, model]) => (
            <button
              key={key}
              onClick={() => setSelectedModel(key)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedModel === key
                  ? 'bg-purple-100 text-purple-800 border-2 border-purple-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {model.icon}
              <span>{model.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Model Performance Metrics */}
      <div className="p-6 border-b border-gray-200">
        <h4 className="text-md font-semibold text-gray-900 mb-4">Model Performance</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">Accuracy</p>
                <p className="text-2xl font-bold text-green-900">{getCurrentMetrics().accuracy}%</p>
              </div>
              <ArrowTrendingUpIcon className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">MAPE</p>
                <p className="text-2xl font-bold text-blue-900">{getCurrentMetrics().mape}%</p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600">RMSE</p>
                <p className="text-2xl font-bold text-purple-900">{getCurrentMetrics().rmse}</p>
              </div>
              <SparklesIcon className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600">Confidence</p>
                <p className="text-2xl font-bold text-yellow-900">{getCurrentMetrics().confidence}%</p>
              </div>
              <ClockIcon className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Forecast Chart */}
      <div className="p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">Demand Forecast - GABA Red</h4>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="day" 
              stroke="#666"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              stroke="#666"
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              formatter={(value, name) => [Math.round(value * 100) / 100, name]}
              labelFormatter={(label) => `Day ${label}`}
            />
            <Legend />
            
            {/* Confidence Interval */}
            <Area
              dataKey="confidence_upper"
              fill="rgba(139, 92, 246, 0.1)"
              stroke="none"
              connectNulls={false}
            />
            <Area
              dataKey="confidence_lower"
              fill="rgba(255, 255, 255, 1)"
              stroke="none"
              connectNulls={false}
            />
            
            {/* Actual Data (first 7 days) */}
            <Line
              dataKey="actual"
              stroke="#1f2937"
              strokeWidth={3}
              dot={{ fill: '#1f2937', strokeWidth: 2, r: 4 }}
              connectNulls={false}
              name="Actual"
            />
            
            {/* Selected Model Forecast */}
            <Line
              dataKey={selectedModel}
              stroke={modelInfo[selectedModel].color}
              strokeWidth={2}
              strokeDasharray={selectedModel === 'actual' ? "0" : "5 5"}
              dot={{ fill: modelInfo[selectedModel].color, strokeWidth: 2, r: 3 }}
              name={modelInfo[selectedModel].name}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* AI Insights */}
      <div className="p-6 border-t border-gray-200">
        <h4 className="text-md font-semibold text-gray-900 mb-3">AI-Generated Insights</h4>
        <div className="space-y-2">
          <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
            <SparklesIcon className="h-5 w-5 text-blue-600 mt-0.5" />
            <p className="text-sm text-blue-800">
              <strong>Ensemble Model:</strong> Shows 15% demand increase expected in weeks 3-4 due to seasonal patterns and marketing campaign impact.
            </p>
          </div>
          <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
            <LightBulbIcon className="h-5 w-5 text-green-600 mt-0.5" />
            <p className="text-sm text-green-800">
              <strong>Supply Recommendation:</strong> Increase botanical ingredient orders by 20% to meet forecasted demand without stockouts.
            </p>
          </div>
          <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
            <CpuChipIcon className="h-5 w-5 text-purple-600 mt-0.5" />
            <p className="text-sm text-purple-800">
              <strong>Production Planning:</strong> Schedule additional mixing batches for days 18-25 to optimize capacity utilization.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MLForecastingPanel;