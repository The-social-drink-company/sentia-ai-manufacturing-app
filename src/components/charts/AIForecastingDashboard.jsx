/**
 * AI-Powered Forecasting Dashboard Component
 * Advanced visualization for enhanced forecasting system with LSTM-Transformer ensemble
 * 
 * Features:
 * - Real-time forecast visualization with confidence intervals
 * - Ensemble model component breakdown
 * - Interactive time series analysis with zoom and pan
 * - Model performance metrics and accuracy indicators
 * - Seasonal decomposition visualization
 * - What-if scenario modeling interface
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ComposedChart,
  Bar,
  ReferenceLine,
  Brush,
  ScatterChart,
  Scatter,
  Cell
} from 'recharts';
import { format, subDays, parseISO } from 'date-fns';
import { 
  ChartBarIcon, 
  CpuChipIcon, 
  EyeIcon,
  AdjustmentsHorizontalIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const AIForecastingDashboard = ({ 
  forecastData = [],
  historicalData = [],
  modelMetrics = {},
  onScenarioChange = () => {},
  realTimeUpdates = true 
}) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [showConfidenceIntervals, setShowConfidenceIntervals] = useState(true);
  const [selectedModels, setSelectedModels] = useState(['ensemble', 'lstm', 'transformer']);
  const [scenarioParams, setScenarioParams] = useState({
    demandAdjustment: 0,
    marketVolatility: 1,
    seasonalityStrength: 1,
    trendMomentum: 1
  });
  const [viewMode, setViewMode] = useState('forecast'); // 'forecast', 'components', 'accuracy'
  const chartRef = useRef();

  // Process and prepare data for visualization
  const chartData = useMemo(() => {
    if (!forecastData.length && !historicalData.length) return [];

    const combined = [...historicalData, ...forecastData].map((item, index) => ({
      ...item,
      date: item.date || item.timestamp,
      isHistorical: index < historicalData.length,
      forecastType: item.isHistorical ? 'historical' : 'forecast'
    }));

    // Filter by time range
    const days = parseInt(selectedTimeRange);
    const cutoffDate = subDays(new Date(), days);
    
    return combined.filter(item => 
      new Date(item.date) >= cutoffDate
    ).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [forecastData, historicalData, selectedTimeRange]);

  // Calculate model ensemble breakdown
  const ensembleBreakdown = useMemo(() => {
    if (!forecastData.length) return [];
    
    return forecastData.map(item => ({
      date: item.date,
      lstm: item.components?.lstm || 0,
      transformer: item.components?.transformer || 0,
      seasonal: item.components?.seasonal || 0,
      trend: item.components?.trend || 0,
      ensemble: item.value,
      weights: item.weights || { lstm: 0.6, transformer: 0.25, seasonal: 0.15 }
    }));
  }, [forecastData]);

  // Accuracy metrics visualization data
  const accuracyData = useMemo(() => {
    if (!modelMetrics.accuracy) return [];

    return Object.entries(modelMetrics.accuracy).map(([model, metrics]) => ({
      model,
      mape: metrics.mape || 0,
      rmse: metrics.rmse || 0,
      mae: metrics.mae || 0,
      r2: metrics.r2 || 0,
      accuracy: (1 - (metrics.mape / 100)) * 100
    }));
  }, [modelMetrics]);

  // Real-time data updates
  useEffect(() => {
    if (!realTimeUpdates) return;

    const interval = setInterval(() => {
      // Simulate real-time updates - would connect to actual MCP service
      const newDataPoint = {
        date: new Date().toISOString(),
        value: chartData[chartData.length - 1]?.value + 0.5 * 10,
        confidence: 0.85 + Math.random() * 0.1,
        components: {
          lstm: 0,
          transformer: 0,
          seasonal: 0
        }
      };
      // onDataUpdate(newDataPoint); // Would be implemented
    }, 30000); // 30 second updates

    return () => clearInterval(interval);
  }, [realTimeUpdates, chartData]);

  // Handle scenario parameter changes
  const handleScenarioChange = (param, value) => {
    const newParams = { ...scenarioParams, [param]: value };
    setScenarioParams(newParams);
    onScenarioChange(newParams);
  };

  // Custom tooltip for forecast data
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;

    const data = payload[0].payload;
    const isHistorical = data.isHistorical;

    return (
      <div className="bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 dark:text-white">
          {format(parseISO(label), 'MMM dd, yyyy HH:mm')}
        </p>
        <p className={`text-sm ${isHistorical ? 'text-blue-600' : 'text-green-600'}`}>
          {isHistorical ? 'Historical' : 'Forecast'}
        </p>
        
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center space-x-2 mt-1">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
            </span>
          </div>
        ))}
        
        {data.confidence && (
          <p className="text-xs text-gray-500 mt-2">
            Confidence: {(data.confidence * 100).toFixed(1)}%
          </p>
        )}
      </div>
    );
  };

  // Forecast visualization component
  const ForecastView = () => (
    <div className="space-y-6">
      {/* Main forecast chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <ChartBarIcon className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              AI Cash Flow Forecast
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            {modelMetrics.accuracy?.ensemble && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <CheckCircleIcon className="w-3 h-3 mr-1" />
                {((1 - modelMetrics.accuracy.ensemble.mape / 100) * 100).toFixed(1)}% Accurate
              </span>
            )}
            <span className="text-xs text-gray-500">
              Last Updated: {format(new Date(), 'HH:mm:ss')}
            </span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={chartData} ref={chartRef}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(date) => format(parseISO(date), 'MMM dd')}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {/* Historical data */}
            <Line
              type="monotone"
              dataKey="value"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
              name="Historical"
              connectNulls={false}
              strokeDasharray="0"
            />
            
            {/* Forecast data */}
            <Line
              type="monotone"
              dataKey="value"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              name="AI Forecast"
              connectNulls={false}
              strokeDasharray="5 5"
            />

            {/* Confidence intervals */}
            {showConfidenceIntervals && (
              <>
                <Area
                  type="monotone"
                  dataKey="upperBound"
                  stroke="none"
                  fill="#10b981"
                  fillOpacity={0.1}
                  name="Confidence Band"
                />
                <Area
                  type="monotone"
                  dataKey="lowerBound"
                  stroke="none"
                  fill="#10b981"
                  fillOpacity={0.1}
                />
              </>
            )}
            
            {/* Current date reference line */}
            <ReferenceLine x={new Date().toISOString()} stroke="#ef4444" strokeDasharray="2 2" />
            
            {/* Zoom brush */}
            <Brush 
              dataKey="date" 
              height={30} 
              stroke="#8884d8"
              tickFormatter={(date) => format(parseISO(date), 'MMM dd')}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Key metrics cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ChartBarIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Next 30 Days</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                ${(forecastData.slice(0, 30).reduce((sum, item) => sum + item.value, 0) / 1000).toFixed(0)}K
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <CpuChipIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Model Confidence</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {((modelMetrics.averageConfidence || 0.85) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Forecast Error</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                ±{(modelMetrics.accuracy?.ensemble?.mape || 8.5).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <EyeIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Data Points</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {chartData.length.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Model components breakdown view
  const ComponentsView = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Ensemble Model Components
        </h3>
        
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={ensembleBreakdown}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date"
              tickFormatter={(date) => format(parseISO(date), 'MMM dd')}
            />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            <Line type="monotone" dataKey="ensemble" stroke="#1f2937" strokeWidth={3} name="Final Ensemble" />
            <Line type="monotone" dataKey="lstm" stroke="#3b82f6" strokeWidth={2} name="LSTM Component" />
            <Line type="monotone" dataKey="transformer" stroke="#10b981" strokeWidth={2} name="Transformer Component" />
            <Line type="monotone" dataKey="seasonal" stroke="#f59e0b" strokeWidth={2} name="Seasonal Component" />
            <Line type="monotone" dataKey="trend" stroke="#ef4444" strokeWidth={2} name="Trend Component" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Model weights visualization */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
          Current Ensemble Weights
        </h4>
        <div className="grid grid-cols-3 gap-4">
          {ensembleBreakdown[0]?.weights && Object.entries(ensembleBreakdown[0].weights).map(([model, weight]) => (
            <div key={model} className="text-center">
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                      {model.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-blue-600">
                      {(weight * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                  <div 
                    style={{ width: `${weight * 100}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Model accuracy view
  const AccuracyView = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Model Performance Comparison
        </h3>
        
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart data={accuracyData}>
            <CartesianGrid />
            <XAxis 
              type="number" 
              dataKey="mape" 
              name="MAPE" 
              unit="%" 
              domain={[0, 'dataMax']}
            />
            <YAxis 
              type="number" 
              dataKey="r2" 
              name="R²" 
              unit="" 
              domain={[0, 1]}
            />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const data = payload[0].payload;
                return (
                  <div className="bg-white p-3 border rounded shadow">
                    <p className="font-semibold">{data.model.toUpperCase()}</p>
                    <p>MAPE: {data.mape.toFixed(2)}%</p>
                    <p>R²: {data.r2.toFixed(3)}</p>
                    <p>Accuracy: {data.accuracy.toFixed(1)}%</p>
                  </div>
                );
              }}
            />
            <Scatter name="Models" dataKey="r2" fill="#8884d8">
              {accuracyData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={
                  entry.model === 'ensemble' ? '#10b981' : 
                  entry.model === 'lstm' ? '#3b82f6' :
                  entry.model === 'transformer' ? '#f59e0b' : '#8884d8'
                } />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed metrics table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
          Detailed Performance Metrics
        </h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Model
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  MAPE (%)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  RMSE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  MAE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  R²
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Accuracy
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {accuracyData.map((model) => (
                <tr key={model.model}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {model.model.toUpperCase()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {model.mape.toFixed(2)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {model.rmse.toFixed(0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {model.mae.toFixed(0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {model.r2.toFixed(3)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      model.accuracy > 90 ? 'bg-green-100 text-green-800' :
                      model.accuracy > 80 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {model.accuracy.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              AI Forecasting Dashboard
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Enhanced LSTM-Transformer ensemble forecasting with real-time insights
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            {/* View mode selector */}
            <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {[
                { key: 'forecast', label: 'Forecast', icon: ChartBarIcon },
                { key: 'components', label: 'Components', icon: CpuChipIcon },
                { key: 'accuracy', label: 'Accuracy', icon: CheckCircleIcon }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setViewMode(key)}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    viewMode === key
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* Time range selector */}
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="7d">7 Days</option>
              <option value="30d">30 Days</option>
              <option value="90d">90 Days</option>
              <option value="365d">1 Year</option>
            </select>

            {/* Options */}
            <div className="flex items-center space-x-2">
              <label className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                <input
                  type="checkbox"
                  checked={showConfidenceIntervals}
                  onChange={(e) => setShowConfidenceIntervals(e.target.checked)}
                  className="rounded"
                />
                <span>Confidence</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Scenario modeling panel */}
      {viewMode === 'forecast' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <AdjustmentsHorizontalIcon className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              What-If Scenario Modeling
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Object.entries(scenarioParams).map(([param, value]) => (
              <div key={param}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {param.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min={param === 'demandAdjustment' ? -50 : 0.1}
                    max={param === 'demandAdjustment' ? 50 : 2}
                    step={param === 'demandAdjustment' ? 1 : 0.1}
                    value={value}
                    onChange={(e) => handleScenarioChange(param, parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                    {param === 'demandAdjustment' ? `${value > 0 ? '+' : ''}${value}%` : value.toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main content based on view mode */}
      {viewMode === 'forecast' && <ForecastView />}
      {viewMode === 'components' && <ComponentsView />}
      {viewMode === 'accuracy' && <AccuracyView />}
    </div>
  );
};

export default AIForecastingDashboard;