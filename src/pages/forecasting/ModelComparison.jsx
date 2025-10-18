import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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
} from 'recharts';
import {
  ArrowRight,
  CheckCircle,
  TrendingUp,
  Award,
  AlertTriangle,
  Download,
} from 'lucide-react';

/**
 * ModelComparison Component
 *
 * Side-by-side model comparison interface with:
 * - Accuracy metrics table (MAPE, RMSE, MAE, R²)
 * - Confidence interval visualization
 * - Historical performance charts
 * - Model selection for optimization
 * - "Use in Optimization" workflow trigger
 *
 * Workflow: Compare models → Select best model → Push to inventory optimization
 */
function ModelComparison() {
  const navigate = useNavigate();

  const [selectedProduct, setSelectedProduct] = useState('PROD-001');
  const [selectedModelForOptimization, setSelectedModelForOptimization] = useState(null);
  const [comparisonView, setComparisonView] = useState('metrics'); // metrics, charts, history

  // Fetch forecast comparison data
  const { data: comparisonData, isLoading } = useQuery({
    queryKey: ['forecasts', 'comparison', selectedProduct],
    queryFn: async () => {
      const response = await fetch(`/api/v1/forecasts/comparison?productId=${selectedProduct}`);
      if (!response.ok) throw new Error('Failed to fetch comparison data');
      const result = await response.json();
      return result.data;
    },
  });

  // Fetch available products
  const { data: products = [] } = useQuery({
    queryKey: ['products', 'with-forecasts'],
    queryFn: async () => {
      const response = await fetch('/api/v1/products?hasForecasts=true');
      if (!response.ok) throw new Error('Failed to fetch products');
      const result = await response.json();
      return result.data || [];
    },
  });

  const handleUseInOptimization = () => {
    if (!selectedModelForOptimization) {
      alert('Please select a model first');
      return;
    }

    // Navigate to inventory optimization with selected forecast
    navigate('/inventory/optimization', {
      state: {
        forecastModel: selectedModelForOptimization,
        productId: selectedProduct,
        comparisonData,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading model comparison...</p>
        </div>
      </div>
    );
  }

  const models = comparisonData?.models || [];
  const bestModel = models.find((m) => m.isBest);
  const hasSelection = selectedModelForOptimization !== null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Model Comparison</h1>
            <p className="text-gray-600 mt-1">
              Compare forecast models and select the best performer for optimization
            </p>
          </div>
          <button
            onClick={handleUseInOptimization}
            disabled={!hasSelection}
            className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors ${
              hasSelection
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Use in Optimization
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Product Selector */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Product</label>
        <select
          value={selectedProduct}
          onChange={(e) => {
            setSelectedProduct(e.target.value);
            setSelectedModelForOptimization(null);
          }}
          className="w-full md:w-96 border border-gray-300 rounded-lg p-2"
        >
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.sku} - {product.name}
            </option>
          ))}
        </select>
      </div>

      {/* View Tabs */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setComparisonView('metrics')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            comparisonView === 'metrics'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Accuracy Metrics
        </button>
        <button
          onClick={() => setComparisonView('charts')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            comparisonView === 'charts'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Forecast Charts
        </button>
        <button
          onClick={() => setComparisonView('history')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            comparisonView === 'history'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Historical Performance
        </button>
      </div>

      {/* Metrics View */}
      {comparisonView === 'metrics' && (
        <div className="space-y-6">
          {/* Best Model Recommendation */}
          {bestModel && (
            <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <Award className="w-8 h-8 text-green-600 flex-shrink-0" />
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-green-900 mb-2">
                    Recommended Model: {bestModel.name}
                  </h2>
                  <p className="text-green-800 mb-3">{bestModel.description}</p>
                  <div className="grid md:grid-cols-4 gap-4">
                    <MetricBadge label="MAPE" value={`${bestModel.metrics.mape.toFixed(2)}%`} />
                    <MetricBadge label="RMSE" value={bestModel.metrics.rmse.toFixed(2)} />
                    <MetricBadge label="MAE" value={bestModel.metrics.mae.toFixed(2)} />
                    <MetricBadge label="R²" value={bestModel.metrics.r2.toFixed(3)} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Accuracy Metrics Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Accuracy Metrics Comparison</h2>
              <p className="text-sm text-gray-600 mt-1">
                Lower is better for MAPE, RMSE, MAE • Higher is better for R²
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Model
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      MAPE (%)
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      RMSE
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      MAE
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      R²
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Training Time
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Select
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {models.map((model) => (
                    <tr
                      key={model.id}
                      className={`hover:bg-gray-50 ${
                        selectedModelForOptimization === model.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {model.isBest && <Award className="w-4 h-4 text-yellow-500" />}
                          <span className="font-medium text-gray-900">{model.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <AccuracyBadge value={model.metrics.mape} type="mape" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-gray-900">
                        {model.metrics.rmse.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-gray-900">
                        {model.metrics.mae.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-gray-900">
                        {model.metrics.r2.toFixed(3)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                        {model.trainingTime}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <input
                          type="radio"
                          name="selected-model"
                          checked={selectedModelForOptimization === model.id}
                          onChange={() => setSelectedModelForOptimization(model.id)}
                          className="w-5 h-5 cursor-pointer"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Charts View */}
      {comparisonView === 'charts' && (
        <div className="space-y-6">
          {models.map((model) => (
            <div key={model.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {model.isBest && <Award className="w-6 h-6 text-yellow-500" />}
                  <h2 className="text-lg font-semibold text-gray-900">{model.name}</h2>
                  <AccuracyBadge value={model.metrics.mape} type="mape" />
                </div>
                <input
                  type="radio"
                  name="selected-model-chart"
                  checked={selectedModelForOptimization === model.id}
                  onChange={() => setSelectedModelForOptimization(model.id)}
                  className="w-5 h-5 cursor-pointer"
                />
              </div>

              {/* Forecast Chart with Confidence Intervals */}
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={model.forecastData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`confidence-${model.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis style={{ fontSize: '12px' }} />
                  <Tooltip content={<ForecastTooltip />} />
                  <Legend />
                  {/* Confidence interval */}
                  <Area
                    type="monotone"
                    dataKey="upperBound"
                    stroke="none"
                    fill={`url(#confidence-${model.id})`}
                    name="Confidence Interval"
                  />
                  <Area
                    type="monotone"
                    dataKey="lowerBound"
                    stroke="none"
                    fill="white"
                  />
                  {/* Actual values */}
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="Actual"
                  />
                  {/* Predicted values */}
                  <Line
                    type="monotone"
                    dataKey="predicted"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 3 }}
                    name="Predicted"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      )}

      {/* Historical Performance View */}
      {comparisonView === 'history' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Historical Accuracy Trends
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={comparisonData?.historicalPerformance || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => new Date(date).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })}
                style={{ fontSize: '12px' }}
              />
              <YAxis
                label={{ value: 'MAPE (%)', angle: -90, position: 'insideLeft' }}
                style={{ fontSize: '12px' }}
              />
              <Tooltip />
              <Legend />
              {models.map((model, index) => (
                <Line
                  key={model.id}
                  type="monotone"
                  dataKey={model.id}
                  name={model.name}
                  stroke={MODEL_COLORS[index % MODEL_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              ))}
              {/* Target line at 15% MAPE (85% accuracy) */}
              <Line
                type="monotone"
                dataKey="target"
                name="Target (15% MAPE)"
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

/**
 * MetricBadge Component
 */
function MetricBadge({ label, value }) {
  return (
    <div className="bg-white rounded-lg p-3 border border-green-200">
      <p className="text-xs text-gray-600 mb-1">{label}</p>
      <p className="text-lg font-bold text-gray-900">{value}</p>
    </div>
  );
}

/**
 * AccuracyBadge Component
 */
function AccuracyBadge({ value, type }) {
  let status = 'good';
  let className = 'bg-green-100 text-green-800';

  if (type === 'mape') {
    if (value > 20) {
      status = 'poor';
      className = 'bg-red-100 text-red-800';
    } else if (value > 15) {
      status = 'fair';
      className = 'bg-yellow-100 text-yellow-800';
    } else if (value > 10) {
      status = 'good';
      className = 'bg-green-100 text-green-800';
    } else {
      status = 'excellent';
      className = 'bg-blue-100 text-blue-800';
    }
  }

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${className}`}>
      {value.toFixed(2)}%
    </span>
  );
}

/**
 * ForecastTooltip Component
 */
function ForecastTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded shadow-lg p-3">
      <p className="font-medium text-gray-900 mb-2">
        {new Date(label).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
      </p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center justify-between gap-4 text-sm">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded" style={{ backgroundColor: entry.color }} />
            {entry.name}
          </span>
          <span className="font-semibold">{entry.value?.toFixed(0)}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Constants
 */
const MODEL_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

export default ModelComparison;
