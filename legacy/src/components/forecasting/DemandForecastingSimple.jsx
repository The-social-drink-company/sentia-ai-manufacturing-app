import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  ArrowTrendingUpIcon as TrendingUp, 
  CalendarIcon as Calendar, 
  FlagIcon as Target, 
  PlayIcon as Play, 
  ArrowDownTrayIcon as Download, 
  ArrowPathIcon as RefreshCw, 
  ChartBarIcon as BarChart3,
  ExclamationCircleIcon as AlertCircle, 
  CheckCircleIcon as CheckCircle
} from '@heroicons/react/24/outline';
import { Line } from 'react-chartjs-2';
import { logDebug, logInfo, logWarn, logError } from '../../utils/logger';


const DemandForecastingSimple = () => {
  // Authentication removed
  const user = { name: "User" };
  const isSignedIn = true;
  const isLoaded = true;
  const [forecastPeriod, setForecastPeriod] = useState('30');
  const [selectedProducts, setSelectedProducts] = useState(['all']);
  const [analysisType, setAnalysisType] = useState('demand');

  const products = [
    { id: 'all', name: 'All Products' },
    { id: 'gaba-red-500', name: 'GABA Red 500ml' },
    { id: 'gaba-clear-500', name: 'GABA Clear 500ml' },
    { id: 'gaba-red-250', name: 'GABA Red 250ml' },
    { id: 'gaba-clear-250', name: 'GABA Clear 250ml' }
  ];

  // ONLY REAL API DATA - NO MOCK DATA
  const { data: forecastData, isLoading, isError, refetch } = useQuery({
    queryKey: ['demand-forecast', forecastPeriod, selectedProducts, analysisType],
    queryFn: async () => {
      const authHeader = user ? { 'Authorization': `Bearer ${await user.getToken()}` } : {};
      
      // Try multiple real API endpoints - NO FALLBACK TO MOCK DATA
      const endpoints = [
        `/api/forecasting/demand?period=${forecastPeriod}&products=${selectedProducts.join(',')}&type=${analysisType}`,
        `/api/forecasting/enhanced?model=ensemble&horizon=${forecastPeriod}&confidence=95`,
        `/api/manufacturing/demand-forecast?period=${forecastPeriod}&analysis=${analysisType}`,
        `/api/ai/forecasting?period=${forecastPeriod}&products=${selectedProducts.join(',')}`
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, { headers: authHeader });
          if (response.ok) {
            const data = await response.json();
            return data;
          }
        } catch (error) {
          logWarn(`API endpoint ${endpoint} failed:`, error.message);
        }
      }

      // NO MOCK DATA - Throw error requiring real API connection
      throw new Error(`No real demand forecast data available from any API endpoint. All ${endpoints.length} endpoints failed. Please ensure API connections are established for: Unleashed ERP, Xero Accounting, Amazon SP-API, Shopify, or OpenAI/Claude forecasting services. Mock data has been eliminated per user requirements.`);
    },
    refetchInterval: 60000,
    retry: false // Don't retry failed API calls
  });

  const runForecastMutation = useMutation({
    mutationFn: async () => {
      const authHeader = user ? { 'Authorization': `Bearer ${await user.getToken()}` } : {};
      
      const response = await fetch('/api/forecasting/run-model', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader
        },
        body: JSON.stringify({
          modelType: 'demand_forecast',
          parameters: {
            horizon: parseInt(forecastPeriod),
            products: selectedProducts,
            seasonality: true,
            confidence: 0.95
          }
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to run forecast model - API connection required');
      }
      
      return response.json();
    },
    onSuccess: () => {
      refetch();
    }
  });

  const handleRunForecast = () => {
    runForecastMutation.mutate();
  };

  const handleExport = () => {
    if (!forecastData) {
      alert('No real data available to export. Please ensure API connections are working.');
      return;
    }
    
    const dataStr = JSON.stringify(forecastData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `demand-forecast-${forecastPeriod}d-${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Error state - NO MOCK DATA FALLBACK
  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Demand Forecasting</h1>
            <p className="mt-2 text-gray-600">Real-time demand predictions from live API data</p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <AlertCircle className="w-8 h-8 text-red-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-red-900">No Real API Data Available</h3>
                <p className="text-red-700 mt-2">
                  All forecasting API endpoints are currently unavailable. This system only uses real data from live APIs.
                </p>
                <div className="mt-4">
                  <h4 className="font-semibold text-red-900">Required API Connections:</h4>
                  <ul className="list-disc list-inside text-red-700 mt-2">
                    <li>Unleashed ERP - Inventory and sales data</li>
                    <li>Xero Accounting - Financial forecasting data</li>
                    <li>Amazon SP-API - Sales velocity data</li>
                    <li>Shopify - E-commerce demand data</li>
                    <li>OpenAI/Claude - AI-powered forecasting models</li>
                  </ul>
                </div>
                <button
                  onClick={refetch}
                  className="mt-4 flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry API Connection
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Demand Forecasting</h1>
            <p className="mt-2 text-gray-600">Loading real-time forecast data from APIs...</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Connecting to forecasting APIs...</p>
          </div>
        </div>
      </div>
    );
  }

  // Main interface - ONLY shows when real API data is available
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Demand Forecasting</h1>
              <p className="mt-2 text-gray-600">
                Real-time AI-powered demand predictions from live API data
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRunForecast}
                disabled={runForecastMutation.isLoading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {runForecastMutation.isLoading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                Generate Forecast
              </button>
              <button 
                onClick={handleExport}
                className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </button>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Forecast Period (Days)
              </label>
              <select
                value={forecastPeriod}
                onChange={(e) => setForecastPeriod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="7">7 Days</option>
                <option value="14">14 Days</option>
                <option value="30">30 Days</option>
                <option value="60">60 Days</option>
                <option value="90">90 Days</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Products
              </label>
              <select
                value={selectedProducts[0]}
                onChange={(e) => setSelectedProducts([e.target.value])}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Analysis Type
              </label>
              <select
                value={analysisType}
                onChange={(e) => setAnalysisType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="demand">Demand Forecast</option>
                <option value="seasonal">Seasonal Analysis</option>
                <option value="trend">Trend Analysis</option>
                <option value="scenario">Scenario Planning</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Status
              </label>
              <div className="flex items-center space-x-2 py-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-600">Real API Data Connected</span>
              </div>
            </div>
          </div>
        </div>

        {/* Real API Data Display */}
        {forecastData && (
          <div className="space-y-8">
            {/* Key Metrics from Real API Data */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <ForecastMetric
                title="Total Demand"
                value={forecastData.totalDemand?.toLocaleString() || 'N/A'}
                change={forecastData.demandChange || 'N/A'}
                trend={forecastData.trend || 'stable'}
                icon={<TrendingUp className="w-6 h-6" />}
              />
              <ForecastMetric
                title="Confidence Level"
                value={`${Math.round(forecastData.confidence || 0)}%`}
                change={forecastData.confidenceChange || 'N/A'}
                trend="up"
                icon={<Target className="w-6 h-6" />}
              />
              <ForecastMetric
                title="Peak Demand Period"
                value={forecastData.peakPeriod || 'N/A'}
                change={forecastData.peakDay || 'N/A'}
                trend="stable"
                icon={<Calendar className="w-6 h-6" />}
              />
              <ForecastMetric
                title="Model Accuracy"
                value={`${Math.round(forecastData.accuracy || 0)}%`}
                change={forecastData.accuracyChange || 'N/A'}
                trend="up"
                icon={<BarChart3 className="w-6 h-6" />}
              />
            </div>

            {/* Real API Charts */}
            {forecastData.chartData && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-6">Demand Forecast (Real API Data)</h3>
                <div className="h-64">
                  <Line 
                    data={forecastData.chartData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'top' },
                        title: {
                          display: true,
                          text: 'Real-time Demand Forecast from Live APIs'
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: { display: true, text: 'Units' }
                        }
                      }
                    }} 
                  />
                </div>
              </div>
            )}

            {/* Additional Real Data Sections */}
            {forecastData.insights && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">AI-Generated Insights (Real Data)</h3>
                <div className="space-y-3">
                  {forecastData.insights.map((insight, index) => (
                    <div key={index} className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">{insight.title}</h4>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {insight.priority || 'Medium'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                      {insight.impact && (
                        <div className="text-xs text-green-600 font-medium mt-2">
                          Impact: {insight.impact}
                        </div>
                      )}
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
};

const ForecastMetric = ({ title, value, change, trend, icon }) => {
  const TrendIcon = TrendingUp;
  const trendColor = trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-500';

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
          {icon}
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <div className="flex items-center mt-1">
            <TrendIcon className={`w-4 h-4 ${trendColor}`} />
            <span className={`text-sm ml-1 ${trendColor}`}>
              {change}
            </span>
            <span className="text-sm text-gray-500 ml-1">vs last period</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemandForecastingSimple;
