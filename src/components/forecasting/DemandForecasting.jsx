import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ChartJS } from '../../lib/chartSetup';
import {
  ArrowTrendingUpIcon as TrendingUp, 
  CalendarIcon as Calendar, 
  FlagIcon as Target, 
  Cog6ToothIcon as Settings,
  PlayIcon as Play, 
  ArrowDownTrayIcon as Download, 
  ArrowPathIcon as RefreshCw, 
  ChartBarIcon as BarChart3,
  ChartBarIcon as LineChart, 
  ChartPieIcon as PieChart, 
  ExclamationCircleIcon as AlertCircle, 
  CheckCircleIcon as CheckCircle
} from '@heroicons/react/24/outline';
import { Line, Bar } from 'react-chartjs-2';
import DateContextEngine from '../../services/DateContextEngine';

const DemandForecasting = () => {
  // const { data: session } = ();
  // const user = session?.user;
  const [forecastPeriod, setForecastPeriod] = useState('30');
  const [selectedProducts, setSelectedProducts] = useState(['all']);
  const [analysisType, setAnalysisType] = useState('demand');
  const [dateEngine] = useState(() => new DateContextEngine());

  const { data: forecastData, isLoading, refetch } = useQuery({
    queryKey: ['demand-forecast', forecastPeriod, selectedProducts, analysisType],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/forecasting/demand?period=${forecastPeriod}&products=${selectedProducts.join(',')}&type=${analysisType}`, {
          headers: {
            'Authorization': `Bearer ${session?.accessToken || null}`
          }
        });
        if (response.ok) {
          return response.json();
        }
      } catch (error) {
        console.warn('Demand forecast API unavailable, generating realistic projections:', error.message);
      }

      // Generate realistic demand forecast using DateContextEngine
      const periodDays = parseInt(forecastPeriod);
      const dateRange = dateEngine.generateDateRange(new Date(), periodDays, true);
      
      // Base demand with seasonal patterns
      const baseDemand = {
        'gaba-red-500': 850,
        'gaba-clear-500': 620,
        'gaba-red-250': 450,
        'gaba-clear-250': 280,
        'all': 2200
      };

      const forecastData = [];
      let cumulativeDemand = 0;
      
      dateRange.forEach((dateInfo, index) => {
        // Apply business seasonality to base demand
        const seasonalMultiplier = dateEngine.seasonalPatterns.getBusinessSeasonality(
          dateInfo.month, 
          dateInfo.quarter
        );
        
        // Weekly pattern (lower demand on Mondays, higher on Wednesday-Thursday)
        const dayOfWeekMultipliers = [0.8, 0.85, 1.1, 1.15, 1.0, 0.9, 0.7]; // Sun-Sat
        const dayMultiplier = dayOfWeekMultipliers[dateInfo.dayOfWeek];
        
        // REMOVED: Fake demand generation - Real forecasting API required
        throw new Error('Real API connection required - Demand forecasting must use actual historical sales data and ML models');
      });

      // REMOVED: All fake forecast data generation
      throw new Error('Real API connection required - Demand forecasting must integrate with actual ERP/CRM systems and historical sales data');
    },
    refetchInterval: 60000,
  });

  // Helper functions for realistic data generation
  const generateProductBreakdown = (selectedProduct, totalDemand) => {
    if (selectedProduct === 'all') {
      return [
        { name: 'GABA Red 500ml', category: 'Premium', forecast: Math.round(totalDemand * 0.40) },
        { name: 'GABA Clear 500ml', category: 'Premium', forecast: Math.round(totalDemand * 0.30) },
        { name: 'GABA Red 250ml', category: 'Standard', forecast: Math.round(totalDemand * 0.20) },
        { name: 'GABA Clear 250ml', category: 'Standard', forecast: Math.round(totalDemand * 0.10) }
      ];
    } else {
      const product = products.find(p => p.id === selectedProduct);
      return [{ name: product?.name || null, category: 'Product', forecast: totalDemand }];
    }
  };

  const generateSeasonalPatterns = () => {
    throw new Error('Real API connection required - Seasonal patterns must be calculated from actual historical sales data');
  };

  const generateRiskFactors = () => {
    throw new Error('Real API connection required - Risk factors must be analyzed from actual supply chain and market data');
  };

  const generateInsights = (totalDemand, periodDays) => {
    throw new Error('Real API connection required - Business insights must be generated from actual performance data and ML analysis');
  };

  const runForecastMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/forecasting/run-model', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user?.getToken()}`
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
      return response.json();
    },
    onSuccess: () => {
      refetch();
    }
  });

  const data = forecastData || { error: 'Real forecasting API required - No fake data allowed' };

  const products = [
    { id: 'all', name: 'All Products' },
    { id: 'gaba-red-500', name: 'GABA Red 500ml' },
    { id: 'gaba-clear-500', name: 'GABA Clear 500ml' },
    { id: 'gaba-red-250', name: 'GABA Red 250ml' },
    { id: 'gaba-clear-250', name: 'GABA Clear 250ml' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Demand Forecasting</h1>
              <p className="mt-2 text-gray-600">
                AI-powered demand predictions and market analysis
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => runForecastMutation.mutate()}
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
              <button className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
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
                Model Status
              </label>
              <div className="flex items-center space-x-2 py-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-600">Model Ready</span>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <ForecastMetric
            title="Predicted Demand"
            value={data.totalDemand?.toLocaleString() || '0'}
            change="+12.5%"
            trend="up"
            icon={<TrendingUp className="w-6 h-6" />}
          />
          <ForecastMetric
            title="Confidence Level"
            value={`${data.confidence 0}%`}
            change="+2.1%"
            trend="up"
            icon={<Target className="w-6 h-6" />}
          />
          <ForecastMetric
            title="Peak Demand Day"
            value={data.peakDay || null}
            change="Fri"
            trend="stable"
            icon={<Calendar className="w-6 h-6" />}
          />
          <ForecastMetric
            title="Model Accuracy"
            value={`${data.accuracy 0}%`}
            change="+1.3%"
            trend="up"
            icon={<BarChart3 className="w-6 h-6" />}
          />
        </div>

        {/* Main Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <ForecastChart data={data.forecastData} />
          <ProductBreakdown data={data.productBreakdown} />
        </div>

        {/* Additional Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <SeasonalPatterns patterns={data.seasonalPatterns} />
          <RiskFactors risks={data.riskFactors} />
          <ActionableInsights insights={data.insights} />
        </div>
      </div>
    </div>
  );
};

const ForecastMetric = ({ title, value, change, trend, icon }) => {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingUp : Calendar;
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

const ForecastChart = ({ data }) => {
  const chartData = {
    labels: data?.map(item => item.date) || [],
    datasets: [
      {
        label: 'Predicted Demand',
        data: data?.map(item => item.predicted) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Historical Demand',
        data: data?.map(item => item.historical) || [],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top'
      },
      title: {
        display: true,
        text: 'Demand Forecast vs Historical Data'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Units'
        }
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-6">Demand Forecast</h3>
      <div className="h-64">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

const ProductBreakdown = ({ data }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-6">Product Breakdown</h3>
      <div className="space-y-4">
        {(data.productBreakdown || []).map((product, index) => (
          <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                index === 0 ? 'bg-blue-500' :
                index === 1 ? 'bg-green-500' :
                index === 2 ? 'bg-yellow-500' :
                'bg-purple-500'
              }`}></div>
              <div>
                <div className="font-medium text-gray-900">{product.name}</div>
                <div className="text-sm text-gray-500">{product.category}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium text-gray-900">{product.forecast.toLocaleString()}</div>
              <div className="text-sm text-gray-500">units</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SeasonalPatterns = ({ patterns }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-6">Seasonal Patterns</h3>
      <div className="space-y-3">
        {(patterns || []).map((pattern, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{pattern.period}</span>
            <div className="flex items-center space-x-2">
              <div className="w-16 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${pattern.intensity}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-900">{pattern.intensity}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const RiskFactors = ({ risks }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-6">Risk Factors</h3>
      <div className="space-y-3">
        {(risks || []).map((risk, index) => (
          <div key={index} className={`p-3 rounded-lg border-l-4 ${
            risk.level === 'high' ? 'border-red-400 bg-red-50' :
            risk.level === 'medium' ? 'border-yellow-400 bg-yellow-50' :
            'border-blue-400 bg-blue-50'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-gray-900">{risk.factor}</span>
              <AlertCircle className={`w-4 h-4 ${
                risk.level === 'high' ? 'text-red-600' :
                risk.level === 'medium' ? 'text-yellow-600' :
                'text-blue-600'
              }`} />
            </div>
            <p className="text-sm text-gray-600">{risk.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const ActionableInsights = ({ insights }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-6">Actionable Insights</h3>
      <div className="space-y-4">
        {(insights || []).map((insight, index) => (
          <div key={index} className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">{insight.title}</h4>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {insight.priority}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
            <div className="text-xs text-green-600 font-medium">
              Expected Impact: {insight.impact}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// REMOVED: All mock data - Real forecasting API required

export default DemandForecasting;