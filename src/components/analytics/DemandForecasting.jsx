import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

const DemandForecasting = () => {
  const [forecastData, setForecastData] = useState({
    nextMonth: 125000,
    nextQuarter: 385000,
    nextYear: 1650000,
    confidence: 87,
    trend: 'increasing'
  });

  const [products, setProducts] = useState([
    { id: 1, name: 'Product Alpha', currentDemand: 5000, forecast: 5500, growth: 10, confidence: 92 },
    { id: 2, name: 'Product Beta', currentDemand: 3200, forecast: 3800, growth: 18.75, confidence: 88 },
    { id: 3, name: 'Product Gamma', currentDemand: 2100, forecast: 2000, growth: -4.76, confidence: 85 },
    { id: 4, name: 'Product Delta', currentDemand: 4500, forecast: 5200, growth: 15.56, confidence: 90 },
    { id: 5, name: 'Product Epsilon', currentDemand: 1800, forecast: 2100, growth: 16.67, confidence: 83 }
  ]);

  const [seasonalFactors] = useState([
    { month: 'Jan', factor: 0.85, predicted: 106250 },
    { month: 'Feb', factor: 0.90, predicted: 112500 },
    { month: 'Mar', factor: 0.95, predicted: 118750 },
    { month: 'Apr', factor: 1.00, predicted: 125000 },
    { month: 'May', factor: 1.05, predicted: 131250 },
    { month: 'Jun', factor: 1.10, predicted: 137500 },
    { month: 'Jul', factor: 1.15, predicted: 143750 },
    { month: 'Aug', factor: 1.12, predicted: 140000 },
    { month: 'Sep', factor: 1.08, predicted: 135000 },
    { month: 'Oct', factor: 1.05, predicted: 131250 },
    { month: 'Nov', factor: 1.20, predicted: 150000 },
    { month: 'Dec', factor: 1.25, predicted: 156250 }
  ]);

  const [aiInsights, setAiInsights] = useState([
    { type: 'opportunity', message: 'Market trend analysis shows 23% growth potential in Q2' },
    { type: 'warning', message: 'Supply chain disruption risk detected for Product Gamma' },
    { type: 'info', message: 'Competitor pricing changes may affect demand by 5-8%' },
    { type: 'success', message: 'AI model accuracy improved to 87% confidence level' }
  ]);

  const [isRunningForecast, setIsRunningForecast] = useState(false);

  const runForecast = async () => {
    setIsRunningForecast(true);

    // Simulate API call to MCP server
    setTimeout(() => {
      // Update with "new" forecast data
      setForecastData({
        nextMonth: 128000 + Math.random() * 10000,
        nextQuarter: 395000 + Math.random() * 20000,
        nextYear: 1680000 + Math.random() * 50000,
        confidence: 85 + Math.random() * 10,
        trend: Math.random() > 0.5 ? 'increasing' : 'stable'
      });

      // Update product forecasts
      setProducts(prev => prev.map(product => ({
        ...product,
        forecast: product.currentDemand * (1 + (Math.random() * 0.3 - 0.1)),
        growth: (Math.random() * 30 - 5),
        confidence: 80 + Math.random() * 15
      })));

      setIsRunningForecast(false);
    }, 2000);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(Math.round(num));
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Demand Forecasting</h1>
          <p className="text-gray-600 mt-1">AI-powered demand predictions and insights</p>
        </div>
        <button
          onClick={runForecast}
          disabled={isRunningForecast}
          className={`px-6 py-3 text-white font-medium rounded-lg transition-all ${
            isRunningForecast
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
          }`}
        >
          {isRunningForecast ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Running AI Forecast...
            </span>
          ) : (
            'Run New Forecast'
          )}
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Next Month</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(forecastData.nextMonth)}</p>
                <p className="text-sm text-green-600 mt-1">+12% vs last month</p>
              </div>
              <div className="text-3xl">📈</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Next Quarter</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(forecastData.nextQuarter)}</p>
                <p className="text-sm text-green-600 mt-1">+18% vs last quarter</p>
              </div>
              <div className="text-3xl">📊</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Annual Forecast</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(forecastData.nextYear)}</p>
                <p className="text-sm text-blue-600 mt-1">Trend: {forecastData.trend}</p>
              </div>
              <div className="text-3xl">📅</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">AI Confidence</p>
                <p className="text-2xl font-bold text-gray-900">{forecastData.confidence.toFixed(1)}%</p>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full"
                    style={{ width: `${forecastData.confidence}%` }}
                  ></div>
                </div>
              </div>
              <div className="text-3xl">🤖</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Demand Forecast */}
        <Card>
          <CardHeader>
            <CardTitle>Product-Level Forecasts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {products.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{product.name}</h4>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-sm text-gray-600">
                        Current: {formatNumber(product.currentDemand)}
                      </span>
                      <span className="text-sm font-medium text-blue-600">
                        Forecast: {formatNumber(product.forecast)}
                      </span>
                      <span className={`text-sm font-bold ${
                        product.growth > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {product.growth > 0 ? '+' : ''}{product.growth.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Confidence</div>
                    <div className="text-lg font-bold text-purple-600">{product.confidence.toFixed(0)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Seasonal Patterns */}
        <Card>
          <CardHeader>
            <CardTitle>Seasonal Demand Pattern</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {seasonalFactors.slice(0, 6).map((month) => (
                <div key={month.month} className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-600 w-12">{month.month}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                    <div
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                      style={{ width: `${month.factor * 80}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-20 text-right">
                    {formatNumber(month.predicted)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View Full Year Pattern →
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle>AI-Generated Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {aiInsights.map((insight, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  insight.type === 'opportunity' ? 'bg-green-50 border-green-200' :
                  insight.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                  insight.type === 'success' ? 'bg-blue-50 border-blue-200' :
                  'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">
                    {insight.type === 'opportunity' ? '💡' :
                     insight.type === 'warning' ? '⚠️' :
                     insight.type === 'success' ? '✅' : 'ℹ️'}
                  </div>
                  <p className="text-sm text-gray-700 flex-1">{insight.message}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Forecast Accuracy */}
      <Card>
        <CardHeader>
          <CardTitle>Model Performance & Accuracy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600">Mean Absolute Error</p>
              <p className="text-2xl font-bold text-gray-900">3.2%</p>
              <p className="text-xs text-green-600 mt-1">↓ 0.5% from last month</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Prediction Accuracy</p>
              <p className="text-2xl font-bold text-gray-900">96.8%</p>
              <p className="text-xs text-green-600 mt-1">↑ 1.2% improvement</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Data Points Analyzed</p>
              <p className="text-2xl font-bold text-gray-900">1.2M</p>
              <p className="text-xs text-gray-600 mt-1">Last 24 months</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DemandForecasting;