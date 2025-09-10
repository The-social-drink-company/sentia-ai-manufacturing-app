import React, { useState, useEffect } from 'react';
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

const DemandForecastingSimple = () => {
  const [forecastPeriod, setForecastPeriod] = useState('30');
  const [selectedProducts, setSelectedProducts] = useState(['all']);
  const [analysisType, setAnalysisType] = useState('demand');
  const [forecastData, setForecastData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const products = [
    { id: 'all', name: 'All Products' },
    { id: 'gaba-red-500', name: 'GABA Red 500ml' },
    { id: 'gaba-clear-500', name: 'GABA Clear 500ml' },
    { id: 'gaba-red-250', name: 'GABA Red 250ml' },
    { id: 'gaba-clear-250', name: 'GABA Clear 250ml' }
  ];

  // Generate realistic forecast data based on selections
  const generateForecastData = () => {
    const periodDays = parseInt(forecastPeriod);
    const selectedProduct = selectedProducts[0];
    
    // Base demand values for different products
    const baseDemandValues = {
      'all': 2200,
      'gaba-red-500': 850,
      'gaba-clear-500': 620,
      'gaba-red-250': 450,
      'gaba-clear-250': 280
    };

    // Analysis type multipliers
    const analysisMultipliers = {
      'demand': 1.0,
      'seasonal': 0.8 + (new Date().getMonth() / 12) * 0.4, // Seasonal variation
      'trend': 1.1, // Trending up
      'scenario': 0.9 + Math.random() * 0.3 // Random scenario
    };

    const baseDemand = baseDemandValues[selectedProduct] || baseDemandValues['all'];
    const analysisMultiplier = analysisMultipliers[analysisType] || 1.0;
    
    // Generate date range
    const dates = [];
    const forecastDataPoints = [];
    let totalDemand = 0;
    
    for (let i = 0; i < periodDays; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      // Weekly pattern (lower on weekends, higher mid-week)
      const dayOfWeek = date.getDay();
      const weeklyMultiplier = dayOfWeek === 0 || dayOfWeek === 6 ? 0.7 : 
                             dayOfWeek === 3 || dayOfWeek === 4 ? 1.2 : 1.0;
      
      // Random variation
      const randomVariation = 0.8 + Math.random() * 0.4;
      
      const dailyDemand = Math.round(
        baseDemand * analysisMultiplier * weeklyMultiplier * randomVariation
      );
      
      totalDemand += dailyDemand;
      
      dates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      forecastDataPoints.push({
        date: dates[i],
        predicted: dailyDemand,
        historical: i < 7 ? dailyDemand * (0.9 + Math.random() * 0.2) : null
      });
    }

    // Generate product breakdown
    const productBreakdown = selectedProduct === 'all' ? [
      { name: 'GABA Red 500ml', category: 'Premium', forecast: Math.round(totalDemand * 0.40) },
      { name: 'GABA Clear 500ml', category: 'Premium', forecast: Math.round(totalDemand * 0.30) },
      { name: 'GABA Red 250ml', category: 'Standard', forecast: Math.round(totalDemand * 0.20) },
      { name: 'GABA Clear 250ml', category: 'Standard', forecast: Math.round(totalDemand * 0.10) }
    ] : [
      { name: products.find(p => p.id === selectedProduct)?.name || 'Selected Product', 
        category: 'Product', 
        forecast: totalDemand }
    ];

    return {
      totalDemand,
      confidence: Math.max(80, Math.min(95, 87 + (Math.random() - 0.5) * 10)),
      peakDay: `Day ${Math.floor(Math.random() * periodDays) + 1}`,
      accuracy: Math.max(85, Math.min(95, 89 + (Math.random() - 0.5) * 8)),
      forecastData: forecastDataPoints,
      productBreakdown,
      seasonalPatterns: [
        { period: 'Q1', intensity: 85 + Math.round(Math.random() * 10) },
        { period: 'Q2', intensity: 90 + Math.round(Math.random() * 10) },
        { period: 'Q3', intensity: 75 + Math.round(Math.random() * 10) },
        { period: 'Q4', intensity: 95 + Math.round(Math.random() * 10) }
      ],
      riskFactors: [
        {
          factor: 'Supply Chain Reliability',
          level: Math.random() > 0.7 ? 'medium' : 'low',
          description: 'Current supply chain status and potential disruptions'
        },
        {
          factor: 'Market Demand Volatility', 
          level: Math.random() > 0.8 ? 'high' : 'medium',
          description: 'Market demand patterns and economic indicators'
        }
      ],
      insights: [
        {
          title: 'Production Capacity Planning',
          priority: totalDemand / periodDays > 2500 ? 'High' : 'Medium',
          description: `Forecast shows ${Math.round(totalDemand / periodDays)} daily demand average`,
          impact: '+12% revenue potential'
        },
        {
          title: 'Inventory Optimization',
          priority: 'Medium',
          description: 'Adjust safety stock levels based on seasonal patterns',
          impact: '6% cost reduction'
        }
      ]
    };
  };

  // Generate forecast data when parameters change
  useEffect(() => {
    setIsLoading(true);
    // Simulate API call delay
    const timer = setTimeout(() => {
      const newData = generateForecastData();
      setForecastData(newData);
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [forecastPeriod, selectedProducts, analysisType]);

  const handleRunForecast = () => {
    setIsLoading(true);
    setTimeout(() => {
      const newData = generateForecastData();
      setForecastData(newData);
      setIsLoading(false);
    }, 1000);
  };

  const data = forecastData || {
    totalDemand: 25420,
    confidence: 87.3,
    peakDay: 'Day 15',
    accuracy: 89.2,
    forecastData: [
      { date: 'Jan 1', predicted: 850, historical: 820 },
      { date: 'Jan 2', predicted: 920, historical: 890 },
      { date: 'Jan 3', predicted: 780, historical: 750 },
      { date: 'Jan 4', predicted: 1050, historical: 1020 },
      { date: 'Jan 5', predicted: 1150, historical: null }
    ],
    productBreakdown: [
      { name: 'GABA Red 500ml', category: 'Premium', forecast: 12500 },
      { name: 'GABA Clear 500ml', category: 'Premium', forecast: 8900 },
      { name: 'GABA Red 250ml', category: 'Standard', forecast: 2800 },
      { name: 'GABA Clear 250ml', category: 'Standard', forecast: 1220 }
    ],
    seasonalPatterns: [
      { period: 'Q1', intensity: 85 },
      { period: 'Q2', intensity: 92 },
      { period: 'Q3', intensity: 78 },
      { period: 'Q4', intensity: 96 }
    ],
    riskFactors: [
      {
        factor: 'Supply Chain Disruption',
        level: 'medium',
        description: 'Potential delays from primary supplier'
      },
      {
        factor: 'Market Volatility',
        level: 'low',
        description: 'Economic indicators show stable demand'
      }
    ],
    insights: [
      {
        title: 'Increase Production Capacity',
        priority: 'High',
        description: 'Demand forecast shows 25% increase in Q2',
        impact: '+15% revenue potential'
      },
      {
        title: 'Optimize Inventory Levels',
        priority: 'Medium',
        description: 'Adjust safety stock for seasonal variations',
        impact: '8% cost reduction'
      }
    ]
  };

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
                onClick={handleRunForecast}
                disabled={isLoading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? (
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
            value={`${Math.round(data.confidence || 87)}%`}
            change="+2.1%"
            trend="up"
            icon={<Target className="w-6 h-6" />}
          />
          <ForecastMetric
            title="Peak Demand Day"
            value={data.peakDay || 'Day 15'}
            change="Fri"
            trend="stable"
            icon={<Calendar className="w-6 h-6" />}
          />
          <ForecastMetric
            title="Model Accuracy"
            value={`${Math.round(data.accuracy || 89)}%`}
            change="+1.3%"
            trend="up"
            icon={<BarChart3 className="w-6 h-6" />}
          />
        </div>

        {/* Main Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <ForecastChart data={data.forecastData} isLoading={isLoading} />
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

const ForecastChart = ({ data, isLoading }) => {
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
      <h3 className="text-lg font-semibold mb-6">
        Demand Forecast 
        {isLoading && <span className="ml-2 text-sm text-gray-500">(Updating...)</span>}
      </h3>
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
        {(data || []).map((product, index) => (
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
                  style={{ width: `${Math.min(100, pattern.intensity)}%` }}
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

export default DemandForecastingSimple;