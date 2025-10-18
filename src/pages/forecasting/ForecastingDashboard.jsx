import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useSSE } from '@/hooks/useSSE';
import {
  PlayCircle,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  Settings,
} from 'lucide-react';

/**
 * ForecastingDashboard Component
 *
 * Main forecasting interface with:
 * - Model selection (ARIMA, LSTM, Prophet, Random Forest, Ensemble)
 * - Forecast horizon selector (7, 14, 30, 90 days)
 * - Product/SKU selector
 * - Region/channel filters
 * - Job progress tracking via SSE
 * - Navigation to comparison and results
 *
 * Workflow: Select parameters → Run forecast → Track progress → View results → Compare models → Use in optimization
 */
function ForecastingDashboard() {
  const navigate = useNavigate();

  // Form state
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedModels, setSelectedModels] = useState(['ensemble']);
  const [horizon, setHorizon] = useState(30);
  const [region, setRegion] = useState('all');
  const [channel, setChannel] = useState('all');
  const [useEnsemble, setUseEnsemble] = useState(true);

  // Job tracking state
  const [currentJob, setCurrentJob] = useState(null);
  const [jobProgress, setJobProgress] = useState(0);
  const [jobStatus, setJobStatus] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [completedForecasts, setCompletedForecasts] = useState([]); // TODO: Display in completed jobs section

  // Fetch available products
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products', 'list'],
    queryFn: async () => {
      const response = await fetch('/api/v1/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      const result = await response.json();
      return result.data || [];
    },
  });

  // Fetch recent forecasts
  const { data: recentForecasts = [], refetch: refetchForecasts } = useQuery({
    queryKey: ['forecasts', 'recent'],
    queryFn: async () => {
      const response = await fetch('/api/v1/forecasts/recent');
      if (!response.ok) throw new Error('Failed to fetch recent forecasts');
      const result = await response.json();
      return result.data || [];
    },
  });

  // Run forecast mutation
  const runForecastMutation = useMutation({
    mutationFn: async (forecastParams) => {
      const response = await fetch('/api/v1/forecasts/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(forecastParams),
      });
      if (!response.ok) throw new Error('Failed to start forecast job');
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.data.jobId) {
        setCurrentJob(data.data.jobId);
        setJobStatus('running');
        setJobProgress(0);
      }
    },
    onError: (error) => {
      console.error('Forecast job error:', error);
      setJobStatus('error');
    },
  });

  // SSE for job progress
  // eslint-disable-next-line no-unused-vars
  const { lastMessage } = useSSE('forecast', {
    enabled: !!currentJob,
    onMessage: (message) => {
      if (message.type === 'forecast:progress' && message.jobId === currentJob) {
        setJobProgress(message.progress || 0);
        setJobStatus(message.status);

        if (message.status === 'completed') {
          setCompletedForecasts((prev) => [...prev, message.result]);
          refetchForecasts();
          setTimeout(() => {
            setCurrentJob(null);
            setJobStatus(null);
            setJobProgress(0);
          }, 2000);
        }

        if (message.status === 'failed') {
          setTimeout(() => {
            setCurrentJob(null);
            setJobStatus(null);
            setJobProgress(0);
          }, 3000);
        }
      }
    },
  });

  const handleRunForecast = () => {
    if (selectedProducts.length === 0) {
      alert('Please select at least one product');
      return;
    }

    if (selectedModels.length === 0) {
      alert('Please select at least one model');
      return;
    }

    const forecastParams = {
      productIds: selectedProducts,
      models: selectedModels,
      horizon,
      region: region !== 'all' ? region : undefined,
      channel: channel !== 'all' ? channel : undefined,
      useEnsemble,
    };

    runForecastMutation.mutate(forecastParams);
  };

  const isRunning = jobStatus === 'running';
  const canRun = selectedProducts.length > 0 && selectedModels.length > 0 && !isRunning;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Demand Forecasting</h1>
        <p className="text-gray-600 mt-1">
          AI-powered demand prediction with ensemble models • Target accuracy: &gt;85%
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Model Selection */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Model Selection
            </h2>

            <div className="space-y-4">
              {/* Ensemble toggle */}
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                <div>
                  <label className="font-semibold text-gray-900">Ensemble Mode (Recommended)</label>
                  <p className="text-sm text-gray-600">
                    Combines multiple models with weighted averaging for best accuracy
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={useEnsemble}
                  onChange={(e) => setUseEnsemble(e.target.checked)}
                  className="w-6 h-6"
                />
              </div>

              {/* Individual models */}
              <div className="grid md:grid-cols-2 gap-3">
                {MODELS.map((model) => (
                  <ModelCard
                    key={model.id}
                    model={model}
                    selected={selectedModels.includes(model.id)}
                    disabled={useEnsemble}
                    onToggle={() => {
                      if (useEnsemble) return;
                      setSelectedModels((prev) =>
                        prev.includes(model.id)
                          ? prev.filter((m) => m !== model.id)
                          : [...prev, model.id]
                      );
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Forecast Parameters */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600" />
              Forecast Parameters
            </h2>

            <div className="space-y-6">
              {/* Product Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Products / SKUs *
                </label>
                <select
                  multiple
                  value={selectedProducts}
                  onChange={(e) =>
                    setSelectedProducts(Array.from(e.target.selectedOptions, (opt) => opt.value))
                  }
                  className="w-full border border-gray-300 rounded-lg p-2 h-32"
                  disabled={productsLoading}
                >
                  {productsLoading ? (
                    <option>Loading products...</option>
                  ) : (
                    products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.sku} - {product.name}
                      </option>
                    ))
                  )}
                </select>
                <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
              </div>

              {/* Horizon Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Forecast Horizon
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[7, 14, 30, 90].map((days) => (
                    <button
                      key={days}
                      onClick={() => setHorizon(days)}
                      className={`py-2 px-4 rounded-lg border-2 font-medium transition-colors ${
                        horizon === days
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {days} days
                    </button>
                  ))}
                </div>
              </div>

              {/* Region Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2"
                >
                  <option value="all">All Regions</option>
                  <option value="uk">United Kingdom</option>
                  <option value="eu">European Union</option>
                  <option value="us">United States</option>
                </select>
              </div>

              {/* Channel Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Channel</label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2"
                >
                  <option value="all">All Channels</option>
                  <option value="amazon-fba">Amazon FBA</option>
                  <option value="shopify-dtc">Shopify DTC</option>
                </select>
              </div>
            </div>
          </div>

          {/* Run Forecast Button */}
          <button
            onClick={handleRunForecast}
            disabled={!canRun}
            className={`w-full py-4 rounded-lg font-semibold text-lg flex items-center justify-center gap-3 transition-colors ${
              canRun
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-6 h-6 animate-spin" />
                Running Forecast...
              </>
            ) : (
              <>
                <PlayCircle className="w-6 h-6" />
                Run Forecast
              </>
            )}
          </button>
        </div>

        {/* Status Panel */}
        <div className="space-y-6">
          {/* Job Progress */}
          {currentJob && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Progress</h2>
              <JobProgressCard
                jobId={currentJob}
                status={jobStatus}
                progress={jobProgress}
              />
            </div>
          )}

          {/* Recent Forecasts */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Forecasts</h2>
            {recentForecasts.length === 0 ? (
              <p className="text-sm text-gray-500">No recent forecasts</p>
            ) : (
              <div className="space-y-3">
                {recentForecasts.slice(0, 5).map((forecast) => (
                  <RecentForecastCard
                    key={forecast.id}
                    forecast={forecast}
                    onClick={() => navigate(`/forecasting/results/${forecast.id}`)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/forecasting/comparison')}
                className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg text-left font-medium transition-colors"
              >
                Compare Models
              </button>
              <button
                onClick={() => navigate('/analytics/what-if')}
                className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg text-left font-medium transition-colors"
              >
                What-If Analysis
              </button>
              <button
                onClick={() => navigate('/inventory/optimization')}
                className="w-full py-2 px-4 bg-green-100 hover:bg-green-200 text-green-800 rounded-lg text-left font-medium transition-colors"
              >
                Use in Optimization
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ModelCard Component
 */
function ModelCard({ model, selected, disabled, onToggle }) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`p-4 rounded-lg border-2 text-left transition-all ${
        disabled
          ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
          : selected
          ? 'border-blue-600 bg-blue-50'
          : 'border-gray-200 bg-white hover:bg-gray-50'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-gray-900">{model.name}</h3>
        {!disabled && (
          <input
            type="checkbox"
            checked={selected}
            onChange={() => {}}
            className="w-5 h-5"
            disabled={disabled}
          />
        )}
      </div>
      <p className="text-sm text-gray-600 mb-2">{model.description}</p>
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Clock className="w-3 h-3" />
        {model.trainingTime}
      </div>
    </button>
  );
}

/**
 * JobProgressCard Component
 */
function JobProgressCard({ jobId, status, progress }) {
  const statusConfig = {
    running: {
      icon: RefreshCw,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      label: 'Running',
    },
    completed: {
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      label: 'Completed',
    },
    failed: {
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      label: 'Failed',
    },
  };

  const config = statusConfig[status] || statusConfig.running;
  const Icon = config.icon;

  return (
    <div className={`p-4 rounded-lg ${config.bgColor}`}>
      <div className="flex items-center gap-3 mb-3">
        <Icon className={`w-5 h-5 ${config.color} ${status === 'running' ? 'animate-spin' : ''}`} />
        <div>
          <p className={`font-semibold ${config.color}`}>{config.label}</p>
          <p className="text-xs text-gray-600">Job ID: {jobId.slice(0, 8)}</p>
        </div>
      </div>

      {status === 'running' && (
        <>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600">{progress}% complete</p>
        </>
      )}
    </div>
  );
}

/**
 * RecentForecastCard Component
 */
function RecentForecastCard({ forecast, onClick }) {
  const accuracy = forecast.accuracy || forecast.mape ? 100 - forecast.mape : null;
  const isGood = accuracy && accuracy >= 85;

  return (
    <button
      onClick={onClick}
      className="w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors border border-gray-200"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium text-sm">{forecast.productName || forecast.productId}</span>
        {accuracy && (
          <span
            className={`text-xs font-semibold px-2 py-1 rounded ${
              isGood ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {accuracy.toFixed(1)}%
          </span>
        )}
      </div>
      <p className="text-xs text-gray-600">
        {forecast.model} • {forecast.horizon}d • {new Date(forecast.createdAt).toLocaleDateString()}
      </p>
    </button>
  );
}

/**
 * Model Definitions
 */
const MODELS = [
  {
    id: 'arima',
    name: 'ARIMA',
    description: 'Auto-Regressive Integrated Moving Average for trend and seasonality',
    trainingTime: '~2 min',
  },
  {
    id: 'lstm',
    name: 'LSTM',
    description: 'Long Short-Term Memory neural network for complex patterns',
    trainingTime: '~5 min',
  },
  {
    id: 'prophet',
    name: 'Prophet',
    description: "Facebook's additive regression model with seasonal components",
    trainingTime: '~3 min',
  },
  {
    id: 'randomforest',
    name: 'Random Forest',
    description: 'Ensemble decision trees with bootstrap aggregating',
    trainingTime: '~4 min',
  },
];

export default ForecastingDashboard;
