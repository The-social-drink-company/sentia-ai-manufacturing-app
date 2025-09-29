import React, { useState, useEffect } from 'react'
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  LayoutDashboardIcon, LineChartIcon, Package2Icon, FactoryIcon,
  FlaskConicalIcon, BrainIcon, DollarSignIcon, LayersIcon,
  DatabaseIcon, ShieldCheckIcon, MenuIcon, XIcon, BellIcon,
  SearchIcon, SettingsIcon, HelpCircleIcon, TrendingUpIcon,
  BarChart3Icon, PieChartIcon, ActivityIcon, CalendarIcon,
  FilterIcon, RefreshCwIcon, DownloadIcon, ShareIcon
} from 'lucide-react'
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ComposedChart, FunnelChart, Funnel, Treemap
} from 'recharts'

import LandingPage from '@/components/LandingPage'

const queryClient = new QueryClient()

// Comprehensive Executive Dashboard Component
const ExecutiveDashboard = () => {
  const [kpiData, setKpiData] = useState({
    revenue: { current: 3170000, change: 15.2, trend: 'up' },
    orders: { current: 1250, change: 8.5, trend: 'up' },
    inventory: { current: 850000, change: -2.1, trend: 'down' },
    customers: { current: 850, change: 12.3, trend: 'up' },
    workingCapital: { current: 170300, change: 8.3, trend: 'up' }
  });

  const [recentOrders, setRecentOrders] = useState([
    { id: '5770', product: 'GABA Bundle', amount: 86.40, currency: 'GBP', country: 'CH', customer: 'Siro Tondi' },
    { id: '5769', product: 'GABA Red + Gold', amount: 79.50, currency: 'USD', country: 'US', customer: 'Douglas Yarborough' },
    { id: '5768', product: 'Nootropic Stack', amount: 124.99, currency: 'GBP', country: 'UK', customer: 'Sarah Mitchell' },
    { id: '5767', product: 'Focus Blend', amount: 89.99, currency: 'USD', country: 'US', customer: 'Michael Chen' }
  ]);

  const [systemStatus, setSystemStatus] = useState({
    shopifyUK: { status: 'connected', lastSync: '2 min ago' },
    shopifyUSA: { status: 'connected', lastSync: '1 min ago' },
    xero: { status: 'token_refresh_needed', lastSync: '2 hours ago' },
    unleashed: { status: 'auth_required', lastSync: 'Never' }
  });

  const formatCurrency = (value, currency = 'GBP') => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Executive Dashboard</h1>
          <p className="text-gray-600">Real-time manufacturing operations overview</p>
        </div>
        <div className="flex items-center space-x-4">
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <RefreshCwIcon className="h-4 w-4" />
            <span>Refresh Data</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            <DownloadIcon className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Total Revenue</p>
              <p className="text-3xl font-bold text-blue-900">{formatCurrency(kpiData.revenue.current)}</p>
              <div className="flex items-center mt-2">
                <TrendingUpIcon className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">+{kpiData.revenue.change}%</span>
              </div>
            </div>
            <DollarSignIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Latest UK Order</p>
              <p className="text-3xl font-bold text-green-900">£{recentOrders[0]?.amount}</p>
              <p className="text-sm text-green-600">{recentOrders[0]?.customer}</p>
            </div>
            <Package2Icon className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Latest USA Order</p>
              <p className="text-3xl font-bold text-purple-900">${recentOrders[1]?.amount}</p>
              <p className="text-sm text-purple-600">{recentOrders[1]?.customer}</p>
            </div>
            <ActivityIcon className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium">Working Capital</p>
              <p className="text-3xl font-bold text-orange-900">{formatCurrency(kpiData.workingCapital.current)}</p>
              <div className="flex items-center mt-2">
                <TrendingUpIcon className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">+{kpiData.workingCapital.change}%</span>
              </div>
            </div>
            <BarChart3Icon className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-6 border border-indigo-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-600 text-sm font-medium">Active Customers</p>
              <p className="text-3xl font-bold text-indigo-900">{kpiData.customers.current}</p>
              <div className="flex items-center mt-2">
                <TrendingUpIcon className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">+{kpiData.customers.change}%</span>
              </div>
            </div>
            <PieChartIcon className="h-8 w-8 text-indigo-600" />
          </div>
        </div>
      </div>

      {/* Live Business Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Shopify Orders</h3>
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-600">{order.country}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Order #{order.id}: {order.product}</p>
                    <p className="text-sm text-gray-600">{order.customer}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {order.currency === 'GBP' ? '£' : '$'}{order.amount}
                  </p>
                  <p className="text-xs text-gray-500">Just now</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-600 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Real-time API integration active
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Integration Status</h3>
          <div className="space-y-4">
            {Object.entries(systemStatus).map(([system, status]) => (
              <div key={system} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    status.status === 'connected' ? 'bg-green-500' : 
                    status.status === 'token_refresh_needed' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  <div>
                    <p className="font-medium text-gray-900 capitalize">
                      {system.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                    <p className="text-sm text-gray-600">Last sync: {status.lastSync}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  status.status === 'connected' ? 'bg-green-100 text-green-600' :
                  status.status === 'token_refresh_needed' ? 'bg-yellow-100 text-yellow-600' :
                  'bg-red-100 text-red-600'
                }`}>
                  {status.status.replace(/_/g, ' ').toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Comprehensive What-If Analysis Component
const WhatIfAnalysis = () => {
  const [scenarios, setScenarios] = useState({
    revenueGrowth: 15,
    marginImprovement: 2.5,
    costReduction: 5,
    productionCapacity: 100,
    marketShare: 18,
    capexInvestment: 500000
  });

  const [results, setResults] = useState(null);

  useEffect(() => {
    // Calculate scenario impact
    const baseRevenue = 3170000;
    const newRevenue = baseRevenue * (1 + scenarios.revenueGrowth / 100);
    const revenueImpact = newRevenue - baseRevenue;
    const roi = ((revenueImpact - scenarios.capexInvestment) / scenarios.capexInvestment) * 100;

    setResults({
      revenueImpact,
      newRevenue,
      roi,
      paybackPeriod: scenarios.capexInvestment / (revenueImpact / 12)
    });
  }, [scenarios]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">What-If Analysis Center</h1>
        <p className="text-gray-600">Advanced scenario modeling and strategic planning</p>
      </div>

      {/* Interactive Sliders */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Interactive Scenario Parameters</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Revenue Growth: {scenarios.revenueGrowth}%
            </label>
            <input
              type="range"
              min="-20"
              max="50"
              value={scenarios.revenueGrowth}
              onChange={(e) => setScenarios(prev => ({ ...prev, revenueGrowth: parseInt(e.target.value) }))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>-20%</span>
              <span>50%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Margin Improvement: {scenarios.marginImprovement}%
            </label>
            <input
              type="range"
              min="-5"
              max="15"
              step="0.5"
              value={scenarios.marginImprovement}
              onChange={(e) => setScenarios(prev => ({ ...prev, marginImprovement: parseFloat(e.target.value) }))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>-5%</span>
              <span>15%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cost Reduction: {scenarios.costReduction}%
            </label>
            <input
              type="range"
              min="0"
              max="25"
              value={scenarios.costReduction}
              onChange={(e) => setScenarios(prev => ({ ...prev, costReduction: parseInt(e.target.value) }))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>25%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Production Capacity: {scenarios.productionCapacity}%
            </label>
            <input
              type="range"
              min="50"
              max="200"
              value={scenarios.productionCapacity}
              onChange={(e) => setScenarios(prev => ({ ...prev, productionCapacity: parseInt(e.target.value) }))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>50%</span>
              <span>200%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Market Share: {scenarios.marketShare}%
            </label>
            <input
              type="range"
              min="5"
              max="40"
              value={scenarios.marketShare}
              onChange={(e) => setScenarios(prev => ({ ...prev, marketShare: parseInt(e.target.value) }))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>5%</span>
              <span>40%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CapEx Investment: £{(scenarios.capexInvestment / 1000).toFixed(0)}K
            </label>
            <input
              type="range"
              min="0"
              max="2000000"
              step="50000"
              value={scenarios.capexInvestment}
              onChange={(e) => setScenarios(prev => ({ ...prev, capexInvestment: parseInt(e.target.value) }))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>£0</span>
              <span>£2M</span>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      {results && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Revenue Impact</p>
                <p className="text-3xl font-bold text-blue-900">{formatCurrency(results.revenueImpact)}</p>
                <p className="text-sm text-blue-600">New Total: {formatCurrency(results.newRevenue)}</p>
              </div>
              <TrendingUpIcon className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">ROI</p>
                <p className="text-3xl font-bold text-green-900">{results.roi.toFixed(1)}%</p>
                <p className="text-sm text-green-600">Return on Investment</p>
              </div>
              <BarChart3Icon className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">Payback Period</p>
                <p className="text-3xl font-bold text-orange-900">{results.paybackPeriod.toFixed(1)}</p>
                <p className="text-sm text-orange-600">Months</p>
              </div>
              <CalendarIcon className="h-8 w-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Investment</p>
                <p className="text-3xl font-bold text-purple-900">{formatCurrency(scenarios.capexInvestment)}</p>
                <p className="text-sm text-purple-600">Capital Expenditure</p>
              </div>
              <DollarSignIcon className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Comprehensive Working Capital Component
const WorkingCapital = () => {
  const [timeframe, setTimeframe] = useState('12months');
  const [analysisType, setAnalysisType] = useState('trend');

  const workingCapitalData = [
    { month: 'Jan', current: 145000, projected: 150000, optimized: 165000 },
    { month: 'Feb', current: 152000, projected: 158000, optimized: 172000 },
    { month: 'Mar', current: 148000, projected: 155000, optimized: 168000 },
    { month: 'Apr', current: 162000, projected: 168000, optimized: 182000 },
    { month: 'May', current: 158000, projected: 165000, optimized: 178000 },
    { month: 'Jun', current: 170300, projected: 175000, optimized: 190000 }
  ];

  const cashFlowData = [
    { week: 'W1', inflow: 85000, outflow: 72000, net: 13000 },
    { week: 'W2', inflow: 92000, outflow: 78000, net: 14000 },
    { week: 'W3', inflow: 88000, outflow: 75000, net: 13000 },
    { week: 'W4', inflow: 95000, outflow: 82000, net: 13000 }
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Working Capital Analysis</h1>
          <p className="text-gray-600">Advanced financial optimization and cash flow management</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="30days">30 Days</option>
            <option value="60days">60 Days</option>
            <option value="90days">90 Days</option>
            <option value="12months">12 Months</option>
          </select>
          <select
            value={analysisType}
            onChange={(e) => setAnalysisType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="trend">Trend Analysis</option>
            <option value="forecast">Forecast</option>
            <option value="optimization">Optimization</option>
          </select>
        </div>
      </div>

      {/* Working Capital Trend Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Working Capital Trend Analysis</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={workingCapitalData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(value) => `£${(value / 1000).toFixed(0)}K`} />
            <Tooltip formatter={(value) => [`£${value.toLocaleString()}`, '']} />
            <Legend />
            <Line type="monotone" dataKey="current" stroke="#3B82F6" strokeWidth={3} name="Current" />
            <Line type="monotone" dataKey="projected" stroke="#10B981" strokeWidth={2} strokeDasharray="5 5" name="Projected" />
            <Line type="monotone" dataKey="optimized" stroke="#F59E0B" strokeWidth={2} name="Optimized" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Cash Flow Analysis */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Cash Flow Analysis</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={cashFlowData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis tickFormatter={(value) => `£${(value / 1000).toFixed(0)}K`} />
            <Tooltip formatter={(value) => [`£${value.toLocaleString()}`, '']} />
            <Legend />
            <Bar dataKey="inflow" fill="#10B981" name="Cash Inflow" />
            <Bar dataKey="outflow" fill="#EF4444" name="Cash Outflow" />
            <Bar dataKey="net" fill="#3B82F6" name="Net Cash Flow" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Current Working Capital</p>
              <p className="text-3xl font-bold text-green-900">£170.3K</p>
              <div className="flex items-center mt-2">
                <TrendingUpIcon className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">+8.3% optimized</span>
              </div>
            </div>
            <DollarSignIcon className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Days Sales Outstanding</p>
              <p className="text-3xl font-bold text-blue-900">28.5</p>
              <p className="text-sm text-blue-600">Days (Target: 30)</p>
            </div>
            <CalendarIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium">Inventory Turnover</p>
              <p className="text-3xl font-bold text-orange-900">8.2x</p>
              <p className="text-sm text-orange-600">Annual (Industry: 6.5x)</p>
            </div>
            <ActivityIcon className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Comprehensive Demand Forecasting Component
const DemandForecasting = () => {
  const [forecastPeriod, setForecastPeriod] = useState('180days');
  const [seasonality, setSeasonality] = useState(true);

  const forecastData = [
    { period: 'Jan', historical: 2850, forecast: 3200, confidence_low: 2900, confidence_high: 3500 },
    { period: 'Feb', historical: 2950, forecast: 3350, confidence_low: 3050, confidence_high: 3650 },
    { period: 'Mar', historical: 3100, forecast: 3500, confidence_low: 3200, confidence_high: 3800 },
    { period: 'Apr', historical: 3250, forecast: 3650, confidence_low: 3350, confidence_high: 3950 },
    { period: 'May', historical: 3400, forecast: 3800, confidence_low: 3500, confidence_high: 4100 },
    { period: 'Jun', historical: 3200, forecast: 3600, confidence_low: 3300, confidence_high: 3900 }
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Demand Forecasting</h1>
          <p className="text-gray-600">AI-powered demand prediction with seasonality analysis</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={forecastPeriod}
            onChange={(e) => setForecastPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="30days">30 Days</option>
            <option value="60days">60 Days</option>
            <option value="90days">90 Days</option>
            <option value="180days">180 Days</option>
          </select>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={seasonality}
              onChange={(e) => setSeasonality(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Include Seasonality</span>
          </label>
        </div>
      </div>

      {/* Forecast Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Demand Forecast with Confidence Intervals</h3>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={forecastData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="confidence_high" 
              stroke="none" 
              fill="#3B82F6" 
              fillOpacity={0.1}
              name="Confidence Range"
            />
            <Area 
              type="monotone" 
              dataKey="confidence_low" 
              stroke="none" 
              fill="#ffffff" 
              fillOpacity={1}
            />
            <Line type="monotone" dataKey="historical" stroke="#6B7280" strokeWidth={2} name="Historical" />
            <Line type="monotone" dataKey="forecast" stroke="#3B82F6" strokeWidth={3} name="Forecast" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Forecast Accuracy */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Forecast Accuracy</p>
              <p className="text-3xl font-bold text-green-900">94.2%</p>
              <p className="text-sm text-green-600">Last 12 months</p>
            </div>
            <BrainIcon className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Next Month Forecast</p>
              <p className="text-3xl font-bold text-blue-900">3,650</p>
              <p className="text-sm text-blue-600">Units (±150)</p>
            </div>
            <TrendingUpIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Seasonal Factor</p>
              <p className="text-3xl font-bold text-purple-900">+12%</p>
              <p className="text-sm text-purple-600">Spring boost</p>
            </div>
            <CalendarIcon className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Dashboard Component with Working Navigation
const ComprehensiveDashboard = () => {
  const [activePageId, setActivePageId] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const NAV_SECTIONS = [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboardIcon, component: ExecutiveDashboard }
      ]
    },
    {
      title: 'PLANNING & ANALYTICS',
      items: [
        { id: 'forecasting', label: 'Demand Forecasting', icon: LineChartIcon, component: DemandForecasting },
        { id: 'inventory', label: 'Inventory Management', icon: Package2Icon, component: () => <div className="p-6"><h1 className="text-3xl font-bold">Inventory Management</h1><p>Coming soon...</p></div> },
        { id: 'production', label: 'Production Tracking', icon: FactoryIcon, component: () => <div className="p-6"><h1 className="text-3xl font-bold">Production Tracking</h1><p>Coming soon...</p></div> },
        { id: 'quality', label: 'Quality Control', icon: FlaskConicalIcon, component: () => <div className="p-6"><h1 className="text-3xl font-bold">Quality Control</h1><p>Coming soon...</p></div> }
      ]
    },
    {
      title: 'FINANCIAL MANAGEMENT',
      items: [
        { id: 'working-capital', label: 'Working Capital', icon: DollarSignIcon, component: WorkingCapital },
        { id: 'what-if', label: 'What-If Analysis', icon: LayersIcon, component: WhatIfAnalysis },
        { id: 'reports', label: 'Financial Reports', icon: BrainIcon, component: () => <div className="p-6"><h1 className="text-3xl font-bold">Financial Reports</h1><p>Coming soon...</p></div> }
      ]
    },
    {
      title: 'OPERATIONS',
      items: [
        { id: 'data-import', label: 'Data Import', icon: DatabaseIcon, component: () => <div className="p-6"><h1 className="text-3xl font-bold">Data Import</h1><p>Coming soon...</p></div> },
        { id: 'admin', label: 'Admin Panel', icon: ShieldCheckIcon, component: () => <div className="p-6"><h1 className="text-3xl font-bold">Admin Panel</h1><p>Coming soon...</p></div> }
      ]
    }
  ];

  // Find the active page component
  const getActiveComponent = () => {
    for (const section of NAV_SECTIONS) {
      const item = section.items.find(item => item.id === activePageId);
      if (item) {
        return item.component;
      }
    }
    return ExecutiveDashboard;
  };

  const ActiveComponent = getActiveComponent();

  const handleNavigation = (pageId) => {
    setActivePageId(pageId);
    console.log(`Navigating to: ${pageId}`);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-slate-900 text-white transition-all duration-300 flex flex-col`}>
        {/* Header */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <div>
                  <h1 className="font-bold text-lg">Sentia</h1>
                  <p className="text-xs text-slate-400">Manufacturing</p>
                  <p className="text-xs text-slate-500">Enterprise Dashboard</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 rounded hover:bg-slate-700"
            >
              {sidebarOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* System Status */}
        {sidebarOpen && (
          <div className="px-4 py-2 border-b border-slate-700">
            <div className="flex items-center space-x-2 text-xs">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-400">All Systems Operational</span>
            </div>
            <div className="flex items-center space-x-2 text-xs mt-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-blue-400">Live Data Connected</span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {NAV_SECTIONS.map((section, sectionIndex) => (
            <div key={section.title} className="mb-6">
              {sidebarOpen && (
                <h3 className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  {section.title}
                </h3>
              )}
              <ul className="space-y-1">
                {section.items.map((item, itemIndex) => {
                  const isActive = activePageId === item.id;
                  const globalIndex = sectionIndex * 10 + itemIndex + 1;
                  
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => handleNavigation(item.id)}
                        className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-lg mx-2 transition-colors ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${
                            isActive ? 'bg-blue-700' : 'bg-slate-600'
                          }`}>
                            {globalIndex}
                          </div>
                          <item.icon className="h-5 w-5" />
                          {sidebarOpen && <span>{item.label}</span>}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {NAV_SECTIONS.flatMap(s => s.items).find(item => item.id === activePageId)?.label || 'Dashboard'}
              </h2>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>Dashboard</span>
                <span>•</span>
                <span>Manufacturing Intelligence</span>
                <span>•</span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>All Systems Operational</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">User • Enterprise</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
                <UserButton 
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8"
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <ActiveComponent />
        </main>
      </div>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SignedOut>
      <LandingPage />
    </SignedOut>
    <SignedIn>
      <ComprehensiveDashboard />
    </SignedIn>
  </QueryClientProvider>
)

export default App
