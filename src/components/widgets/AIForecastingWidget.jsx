import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

const AIForecastingWidget = ({ config = {} }) => {
  const { data: forecastData, isLoading, error } = useQuery({
    queryKey: ['ai-forecasting-data'],
    queryFn: async () => {
      const response = await fetch('/api/ai/forecasting');
      if (!response.ok) throw new Error('Failed to fetch AI forecasting data');
      return response.json();
    },
    refetchInterval: 60000, // Refetch every minute
    staleTime: 50000,
  });

  const [selectedModel, setSelectedModel] = useState('ensemble');
  const [timeHorizon, setTimeHorizon] = useState('30d');
  const [forecasts, setForecasts] = useState({
    demand: { current: 0, predicted: 0, confidence: 0, trend: 'stable' },
    inventory: { current: 0, predicted: 0, confidence: 0, trend: 'stable' },
    production: { current: 0, predicted: 0, confidence: 0, trend: 'stable' },
    revenue: { current: 0, predicted: 0, confidence: 0, trend: 'stable' }
  });

  useEffect(() => {
    if (forecastData) {
      setForecasts({
        demand: forecastData.demand?.[selectedModel]?.[timeHorizon] || forecasts.demand,
        inventory: forecastData.inventory?.[selectedModel]?.[timeHorizon] || forecasts.inventory,
        production: forecastData.production?.[selectedModel]?.[timeHorizon] || forecasts.production,
        revenue: forecastData.revenue?.[selectedModel]?.[timeHorizon] || forecasts.revenue
      });
    }
  }, [forecastData, selectedModel, timeHorizon]);

  const models = [
    { id: 'ensemble', name: '4-Model Ensemble', color: 'bg-purple-500' },
    { id: 'arima', name: 'ARIMA', color: 'bg-blue-500' },
    { id: 'lstm', name: 'LSTM Neural Net', color: 'bg-green-500' },
    { id: 'prophet', name: 'Prophet', color: 'bg-yellow-500' },
    { id: 'random_forest', name: 'Random Forest', color: 'bg-red-500' }
  ];

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      case 'stable': return '➡️';
      default: return '➡️';
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 85) return 'text-green-600';
    if (confidence >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <Card className="sentia-card h-full">
        <CardHeader className="sentia-card-header">
          <CardTitle className="sentia-widget-title">AI Forecasting</CardTitle>
        </CardHeader>
        <CardContent className="sentia-card-content">
          <div className="sentia-loading-state">
            <div className="sentia-spinner"></div>
            <p>Running AI models...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="sentia-card h-full border-red-200">
        <CardHeader className="sentia-card-header">
          <CardTitle className="sentia-widget-title text-red-600">AI Forecasting</CardTitle>
        </CardHeader>
        <CardContent className="sentia-card-content">
          <div className="sentia-error-state">
            <p className="text-red-500">Error: {error.message}</p>
            <p className="text-sm text-gray-500 mt-2">Check AI service status</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="sentia-card h-full">
      <CardHeader className="sentia-card-header">
        <CardTitle className="sentia-widget-title">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
            AI Predictive Analytics
          </div>
        </CardTitle>
        <div className="flex gap-2 mt-2">
          <select 
            value={selectedModel} 
            onChange={(e) => setSelectedModel(e.target.value)}
            className="text-xs px-2 py-1 border rounded"
          >
            {models.map(model => (
              <option key={model.id} value={model.id}>{model.name}</option>
            ))}
          </select>
          <select 
            value={timeHorizon} 
            onChange={(e) => setTimeHorizon(e.target.value)}
            className="text-xs px-2 py-1 border rounded"
          >
            <option value="7d">7 Days</option>
            <option value="30d">30 Days</option>
            <option value="90d">90 Days</option>
          </select>
        </div>
      </CardHeader>
      <CardContent className="sentia-card-content">
        <div className="grid grid-cols-2 gap-4">
          <div className="sentia-metric-card">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">Demand Forecast</div>
              <div className="text-lg">{getTrendIcon(forecasts.demand.trend)}</div>
            </div>
            <div className="sentia-metric-value text-blue-600">
              {forecasts.demand.predicted.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">
              Current: {forecasts.demand.current.toLocaleString()}
            </div>
            <div className={`text-xs ${getConfidenceColor(forecasts.demand.confidence)}`}>
              {forecasts.demand.confidence}% confidence
            </div>
          </div>

          <div className="sentia-metric-card">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">Inventory Needs</div>
              <div className="text-lg">{getTrendIcon(forecasts.inventory.trend)}</div>
            </div>
            <div className="sentia-metric-value text-green-600">
              {forecasts.inventory.predicted.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">
              Current: {forecasts.inventory.current.toLocaleString()}
            </div>
            <div className={`text-xs ${getConfidenceColor(forecasts.inventory.confidence)}`}>
              {forecasts.inventory.confidence}% confidence
            </div>
          </div>

          <div className="sentia-metric-card">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">Production Plan</div>
              <div className="text-lg">{getTrendIcon(forecasts.production.trend)}</div>
            </div>
            <div className="sentia-metric-value text-purple-600">
              {forecasts.production.predicted.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">
              Current: {forecasts.production.current.toLocaleString()}
            </div>
            <div className={`text-xs ${getConfidenceColor(forecasts.production.confidence)}`}>
              {forecasts.production.confidence}% confidence
            </div>
          </div>

          <div className="sentia-metric-card">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">Revenue Forecast</div>
              <div className="text-lg">{getTrendIcon(forecasts.revenue.trend)}</div>
            </div>
            <div className="sentia-metric-value text-emerald-600">
              ${forecasts.revenue.predicted.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">
              Current: ${forecasts.revenue.current.toLocaleString()}
            </div>
            <div className={`text-xs ${getConfidenceColor(forecasts.revenue.confidence)}`}>
              {forecasts.revenue.confidence}% confidence
            </div>
          </div>
        </div>

        {forecastData?.insights && forecastData.insights.length > 0 && (
          <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <h4 className="font-semibold text-purple-800 mb-2">🤖 AI Insights</h4>
            <div className="space-y-1">
              {forecastData.insights.slice(0, 3).map((insight, index) => (
                <div key={index} className="text-sm text-purple-700">
                  {insight.message}
                </div>
              ))}
            </div>
          </div>
        )}

        {forecastData?.modelPerformance && (
          <div className="mt-4 grid grid-cols-5 gap-1">
            {models.map(model => (
              <div key={model.id} className="text-center">
                <div className={`w-2 h-2 ${model.color} rounded-full mx-auto mb-1`}></div>
                <div className="text-xs text-gray-600">
                  {(forecastData.modelPerformance[model.id]?.accuracy || 0).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 text-xs text-gray-500 sentia-data-timestamp">
          Last updated: {forecastData?.lastUpdated ? new Date(forecastData.lastUpdated).toLocaleTimeString() : 'Never'}
        </div>
      </CardContent>
    </Card>
  );
};

export default AIForecastingWidget;