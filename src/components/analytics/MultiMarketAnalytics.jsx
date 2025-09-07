import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Slider } from '../ui/slider';
import { 
  Globe2, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Target,
  AlertTriangle,
  DollarSign,
  Package,
  Clock,
  Zap,
  RefreshCw,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell,
  ComposedChart,
  Area,
  AreaChart,
  ScatterChart,
  Scatter
} from 'recharts';

const MultiMarketAnalytics = ({ data, onRefresh, onAnalyze, loading = false }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('Q4-2024');
  const [comparisonMode, setComparisonMode] = useState('absolute');
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [riskTolerance, setRiskTolerance] = useState([75]);
  const [showPredictions, setShowPredictions] = useState(true);

  // FinanceFlo Multi-Market Analytics Data
  const analyticsData = data || {
    marketOverview: {
      totalRevenue: 3540000,
      totalWorkingCapital: 2840000,
      totalInventoryValue: 1680000,
      crossMarketOptimizationPotential: 520000
    },
    markets: {
      UK: {
        name: 'United Kingdom',
        currency: 'GBP',
        revenue: 1200000,
        revenueGrowth: 0.08,
        workingCapital: 950000,
        workingCapitalEfficiency: 0.79,
        inventoryTurnover: 8.2,
        leadTimeAvg: 21,
        leadTimeVariability: 0.15,
        demandVolatility: 0.12,
        products: {
          SENSIO_RED: { demand: 650, stock: 1250, forecast: 680 },
          SENSIO_BLACK: { demand: 520, stock: 980, forecast: 540 },
          SENSIO_GOLD: { demand: 180, stock: 450, forecast: 195 }
        },
        seasonality: [0.95, 0.88, 1.02, 1.08, 1.12, 1.05, 0.92, 0.87, 0.96, 1.15, 1.25, 1.18],
        riskFactors: [
          { factor: 'Brexit Impact', severity: 'medium', trend: 'improving' },
          { factor: 'Supply Chain', severity: 'low', trend: 'stable' }
        ]
      },
      EU: {
        name: 'European Union',
        currency: 'EUR',
        revenue: 890000,
        revenueGrowth: 0.15,
        workingCapital: 720000,
        workingCapitalEfficiency: 0.81,
        inventoryTurnover: 7.8,
        leadTimeAvg: 28,
        leadTimeVariability: 0.22,
        demandVolatility: 0.18,
        products: {
          SENSIO_RED: { demand: 480, stock: 890, forecast: 520 },
          SENSIO_BLACK: { demand: 390, stock: 720, forecast: 425 },
          SENSIO_GOLD: { demand: 140, stock: 320, forecast: 160 }
        },
        seasonality: [0.92, 0.85, 0.98, 1.05, 1.15, 1.08, 0.95, 0.89, 0.94, 1.12, 1.22, 1.16],
        riskFactors: [
          { factor: 'Regulatory Changes', severity: 'medium', trend: 'stable' },
          { factor: 'Currency Fluctuation', severity: 'high', trend: 'worsening' }
        ]
      },
      US: {
        name: 'United States',
        currency: 'USD',
        revenue: 1450000,
        revenueGrowth: 0.22,
        workingCapital: 1170000,
        workingCapitalEfficiency: 0.81,
        inventoryTurnover: 6.5,
        leadTimeAvg: 42,
        leadTimeVariability: 0.35,
        demandVolatility: 0.25,
        products: {
          SENSIO_RED: { demand: 780, stock: 1450, forecast: 890 },
          SENSIO_BLACK: { demand: 620, stock: 1200, forecast: 720 },
          SENSIO_GOLD: { demand: 220, stock: 580, forecast: 280 }
        },
        seasonality: [0.88, 0.82, 0.94, 1.02, 1.18, 1.12, 0.98, 0.91, 0.89, 1.08, 1.28, 1.22],
        riskFactors: [
          { factor: 'Lead Time Variability', severity: 'high', trend: 'stable' },
          { factor: 'Market Competition', severity: 'medium', trend: 'worsening' },
          { factor: 'Logistics Costs', severity: 'high', trend: 'worsening' }
        ]
      }
    },
    crossMarketInsights: {
      optimalInventoryDistribution: {
        UK: 0.32,
        EU: 0.28,
        US: 0.40
      },
      arbitrageOpportunities: [
        {
          product: 'SENSIO_RED',
          from: 'UK',
          to: 'US',
          potentialSaving: 45000,
          transferCost: 8500,
          netBenefit: 36500
        },
        {
          product: 'SENSIO_BLACK',
          from: 'EU',
          to: 'UK',
          potentialSaving: 28000,
          transferCost: 6200,
          netBenefit: 21800
        }
      ],
      consolidatedForecast: {
        nextQuarter: {
          totalDemand: 8450,
          confidenceLevel: 0.86,
          scenarios: {
            optimistic: 9250,
            baseline: 8450,
            pessimistic: 7680
          }
        }
      }
    }
  };

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const formatCurrency = (amount, currency = 'GBP') => {
    const symbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : '£';
    return `${symbol}${(amount / 1000).toFixed(0)}k`;
  };

  const getGrowthColor = (growth) => {
    if (growth > 0.15) return 'text-green-600';
    if (growth > 0.05) return 'text-blue-600';
    if (growth > 0) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGrowthIcon = (growth) => {
    return growth > 0 ? ArrowUpRight : ArrowDownRight;
  };

  const getRiskColor = (severity) => {
    const colors = {
      'low': 'text-green-600 bg-green-50',
      'medium': 'text-yellow-600 bg-yellow-50',
      'high': 'text-red-600 bg-red-50'
    };
    return colors[severity] || colors.medium;
  };

  const pieChartData = Object.entries(analyticsData.markets).map(([key, market]) => ({
    name: key,
    value: market.revenue,
    color: COLORS[Object.keys(analyticsData.markets).indexOf(key)]
  }));

  const seasonalityData = analyticsData.markets.UK.seasonality.map((value, index) => ({
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][index],
    UK: analyticsData.markets.UK.seasonality[index],
    EU: analyticsData.markets.EU.seasonality[index],
    US: analyticsData.markets.US.seasonality[index]
  }));

  const performanceMetrics = Object.entries(analyticsData.markets).map(([key, market]) => ({
    market: key,
    revenue: market.revenue / 1000,
    workingCapital: market.workingCapital / 1000,
    turnover: market.inventoryTurnover,
    leadTime: market.leadTimeAvg,
    efficiency: market.workingCapitalEfficiency * 100
  }));

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Multi-Market Analytics</h1>
          <p className="text-gray-500">Comprehensive Cross-Market Performance Analysis</p>
        </div>
        <div className="flex space-x-3">
          <select 
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-3 py-2 border rounded-md bg-white"
          >
            <option value="Q4-2024">Q4 2024</option>
            <option value="Q3-2024">Q3 2024</option>
            <option value="YTD-2024">YTD 2024</option>
            <option value="12M">Last 12 Months</option>
          </select>
          <Button 
            onClick={onRefresh}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="default" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(analyticsData.marketOverview.totalRevenue)}
              </p>
              <p className="text-sm text-gray-500">Across all markets</p>
            </div>
            <Globe2 className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Working Capital</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(analyticsData.marketOverview.totalWorkingCapital)}
              </p>
              <p className="text-sm text-gray-500">Optimization potential</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inventory Value</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(analyticsData.marketOverview.totalInventoryValue)}
              </p>
              <p className="text-sm text-gray-500">Total across markets</p>
            </div>
            <Package className="h-8 w-8 text-purple-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Optimization Potential</p>
              <p className="text-2xl font-bold text-yellow-600">
                {formatCurrency(analyticsData.marketOverview.crossMarketOptimizationPotential)}
              </p>
              <p className="text-sm text-gray-500">Cross-market savings</p>
            </div>
            <Target className="h-8 w-8 text-yellow-600" />
          </div>
        </Card>
      </div>

      {/* Market Performance Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Object.entries(analyticsData.markets).map(([key, market]) => {
          const GrowthIcon = getGrowthIcon(market.revenueGrowth);
          return (
            <Card key={key} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-semibold">{market.name}</h3>
                  <Badge variant="outline">{market.currency}</Badge>
                </div>
                <div className="flex items-center space-x-1">
                  <GrowthIcon className={`w-4 h-4 ${getGrowthColor(market.revenueGrowth)}`} />
                  <span className={`text-sm font-semibold ${getGrowthColor(market.revenueGrowth)}`}>
                    {(market.revenueGrowth * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Revenue:</span>
                  <span className="font-semibold">{formatCurrency(market.revenue, market.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Working Capital:</span>
                  <span className="font-semibold">{formatCurrency(market.workingCapital, market.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Inventory Turnover:</span>
                  <span className="font-semibold">{market.inventoryTurnover}x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg Lead Time:</span>
                  <span className="font-semibold">{market.leadTimeAvg} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">WC Efficiency:</span>
                  <Badge variant={market.workingCapitalEfficiency > 0.8 ? 'default' : 'secondary'}>
                    {(market.workingCapitalEfficiency * 100).toFixed(0)}%
                  </Badge>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="font-semibold text-sm mb-2">Risk Factors:</h4>
                <div className="space-y-1">
                  {market.riskFactors.map((risk, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">{risk.factor}:</span>
                      <Badge className={getRiskColor(risk.severity)} size="sm">
                        {risk.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Revenue Distribution Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <PieChart className="w-5 h-5 mr-2" />
            Revenue Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Performance Metrics
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceMetrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="market" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Bar yAxisId="left" dataKey="revenue" fill="#2563eb" name="Revenue (k)" />
                <Bar yAxisId="right" dataKey="turnover" fill="#10b981" name="Turnover" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Seasonality Analysis */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Seasonal Pattern Analysis</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={seasonalityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis domain={[0.7, 1.4]} tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
              <Tooltip formatter={(value) => `${(value * 100).toFixed(1)}%`} />
              <Line type="monotone" dataKey="UK" stroke="#2563eb" strokeWidth={2} />
              <Line type="monotone" dataKey="EU" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="US" stroke="#f59e0b" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center space-x-6 mt-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-600 rounded mr-2"></div>
            <span className="text-sm">UK</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-600 rounded mr-2"></div>
            <span className="text-sm">EU</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-600 rounded mr-2"></div>
            <span className="text-sm">US</span>
          </div>
        </div>
      </Card>

      {/* Cross-Market Optimization */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Zap className="w-5 h-5 mr-2" />
            Cross-Market Optimization Opportunities
          </h3>
          <Badge variant="outline" className="text-green-600">
            Potential Savings: {formatCurrency(analyticsData.marketOverview.crossMarketOptimizationPotential)}
          </Badge>
        </div>

        <div className="space-y-4">
          {analyticsData.crossMarketInsights.arbitrageOpportunities.map((opportunity, index) => (
            <div key={index} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Badge variant="outline">{opportunity.product.replace('_', ' ')}</Badge>
                    <span className="text-sm text-gray-600">
                      Transfer from <strong>{opportunity.from}</strong> to <strong>{opportunity.to}</strong>
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <span className="text-xs text-gray-600">Potential Saving:</span>
                      <p className="font-semibold text-green-600">{formatCurrency(opportunity.potentialSaving)}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-600">Transfer Cost:</span>
                      <p className="font-semibold text-red-600">{formatCurrency(opportunity.transferCost)}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-600">Net Benefit:</span>
                      <p className="font-semibold text-blue-600">{formatCurrency(opportunity.netBenefit)}</p>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Analyze
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Risk Tolerance Slider */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Risk Tolerance Analysis</h3>
          <Badge variant="outline">Current: {riskTolerance[0]}%</Badge>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Service Level Target: {riskTolerance[0]}%
            </label>
            <Slider
              value={riskTolerance}
              onValueChange={setRiskTolerance}
              max={99}
              min={80}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Conservative (80%)</span>
              <span>Aggressive (99%)</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600">Working Capital Impact</p>
              <p className="text-lg font-semibold text-blue-600">
                {riskTolerance[0] > 95 ? '+£180k' : riskTolerance[0] > 90 ? '+£90k' : '£0k'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Stockout Risk</p>
              <p className="text-lg font-semibold text-red-600">
                {(100 - riskTolerance[0]).toFixed(0)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Expected Savings</p>
              <p className="text-lg font-semibold text-green-600">
                {riskTolerance[0] < 90 ? '£420k' : riskTolerance[0] < 95 ? '£280k' : '£150k'}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MultiMarketAnalytics;