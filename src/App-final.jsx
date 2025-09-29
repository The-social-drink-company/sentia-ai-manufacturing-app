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

import LandingPage from './components/LandingPage'

const queryClient = new QueryClient()

// Executive Dashboard Component
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
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Total Revenue FY2025</p>
              <p className="text-3xl font-bold text-blue-900">{formatCurrency(kpiData.revenue.current)}</p>
              <p className="text-sm text-blue-600">+{kpiData.revenue.change}% vs last year</p>
            </div>
            <DollarSignIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Latest UK Order</p>
              <p className="text-3xl font-bold text-green-900">£98.47</p>
              <p className="text-sm text-green-600">GABA Bundle - CH</p>
            </div>
            <Package2Icon className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Latest USA Order</p>
              <p className="text-3xl font-bold text-purple-900">$107.97</p>
              <p className="text-sm text-purple-600">GABA Red + Gold - US</p>
            </div>
            <LineChartIcon className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium">Working Capital</p>
              <p className="text-3xl font-bold text-orange-900">{formatCurrency(kpiData.workingCapital.current)}</p>
              <p className="text-sm text-orange-600">+{kpiData.workingCapital.change}% optimized</p>
            </div>
            <TrendingUpIcon className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Live Business Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Shopify Orders</h3>
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Order #{order.id}: {order.product}</p>
                  <p className="text-sm text-gray-600">{order.customer} • {order.country}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    {order.currency === 'GBP' ? '£' : '$'}{order.amount}
                  </p>
                  <p className="text-xs text-gray-500">{order.currency}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Integration Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium text-gray-900">Shopify UK</span>
              </div>
              <span className="text-sm text-green-600 font-medium">Connected</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium text-gray-900">Shopify USA</span>
              </div>
              <span className="text-sm text-green-600 font-medium">Connected</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="font-medium text-gray-900">Xero</span>
              </div>
              <span className="text-sm text-yellow-600 font-medium">Token refresh needed</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="font-medium text-gray-900">Unleashed</span>
              </div>
              <span className="text-sm text-yellow-600 font-medium">Auth required</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// What-If Analysis Component with Interactive Sliders
const WhatIfAnalysis = () => {
  const [scenarios, setScenarios] = useState({
    revenueGrowth: 15,
    marginImprovement: 5,
    costReduction: 10,
    productionCapacity: 100,
    marketShare: 25,
    capexInvestment: 500000
  });

  const [results, setResults] = useState({
    projectedRevenue: 3645500,
    projectedProfit: 547325,
    roi: 18.5,
    paybackPeriod: 2.3,
    cashFlowImpact: 125000
  });

  const updateScenario = (key, value) => {
    const newScenarios = { ...scenarios, [key]: value };
    setScenarios(newScenarios);
    
    // Calculate new results based on scenarios
    const baseRevenue = 3170000;
    const projectedRevenue = baseRevenue * (1 + newScenarios.revenueGrowth / 100);
    const projectedProfit = projectedRevenue * (0.15 + newScenarios.marginImprovement / 100);
    const roi = (projectedProfit / newScenarios.capexInvestment) * 100;
    const paybackPeriod = newScenarios.capexInvestment / (projectedProfit / 12);
    const cashFlowImpact = projectedRevenue - baseRevenue;

    setResults({
      projectedRevenue,
      projectedProfit,
      roi,
      paybackPeriod,
      cashFlowImpact
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const chartData = [
    { name: 'Current', revenue: 3170000, profit: 475500 },
    { name: 'Projected', revenue: results.projectedRevenue, profit: results.projectedProfit },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">What-If Analysis</h1>
          <p className="text-gray-600">Interactive scenario modeling and financial impact analysis</p>
        </div>
      </div>

      {/* Interactive Sliders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Scenario Variables</h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Revenue Growth: {scenarios.revenueGrowth}%
              </label>
              <input
                type="range"
                min="-20"
                max="50"
                value={scenarios.revenueGrowth}
                onChange={(e) => updateScenario('revenueGrowth', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>-20%</span>
                <span>+50%</span>
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
                value={scenarios.marginImprovement}
                onChange={(e) => updateScenario('marginImprovement', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>-5%</span>
                <span>+15%</span>
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
                onChange={(e) => updateScenario('costReduction', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>+25%</span>
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
                onChange={(e) => updateScenario('productionCapacity', parseInt(e.target.value))}
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
                onChange={(e) => updateScenario('marketShare', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>5%</span>
                <span>40%</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CapEx Investment: {formatCurrency(scenarios.capexInvestment)}
              </label>
              <input
                type="range"
                min="0"
                max="2000000"
                step="50000"
                value={scenarios.capexInvestment}
                onChange={(e) => updateScenario('capexInvestment', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>£0</span>
                <span>£2M</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Financial Impact</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-blue-600 text-sm font-medium">Projected Revenue</p>
              <p className="text-2xl font-bold text-blue-900">{formatCurrency(results.projectedRevenue)}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-green-600 text-sm font-medium">Projected Profit</p>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(results.projectedProfit)}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-purple-600 text-sm font-medium">ROI</p>
              <p className="text-2xl font-bold text-purple-900">{results.roi.toFixed(1)}%</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <p className="text-orange-600 text-sm font-medium">Payback Period</p>
              <p className="text-2xl font-bold text-orange-900">{results.paybackPeriod.toFixed(1)} years</p>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
                <Bar dataKey="profit" fill="#10b981" name="Profit" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

// Working Capital Analysis Component
const WorkingCapitalAnalysis = () => {
  const [timeframe, setTimeframe] = useState('12months');
  
  const workingCapitalData = [
    { month: 'Jan', current: 145000, projected: 152000, optimized: 165000 },
    { month: 'Feb', current: 148000, projected: 155000, optimized: 168000 },
    { month: 'Mar', current: 152000, projected: 158000, optimized: 172000 },
    { month: 'Apr', current: 155000, projected: 162000, optimized: 175000 },
    { month: 'May', current: 158000, projected: 165000, optimized: 178000 },
    { month: 'Jun', current: 162000, projected: 168000, optimized: 182000 },
    { month: 'Jul', current: 165000, projected: 172000, optimized: 185000 },
    { month: 'Aug', current: 168000, projected: 175000, optimized: 188000 },
    { month: 'Sep', current: 170300, projected: 178000, optimized: 192000 },
    { month: 'Oct', current: 172000, projected: 180000, optimized: 195000 },
    { month: 'Nov', current: 175000, projected: 183000, optimized: 198000 },
    { month: 'Dec', current: 178000, projected: 186000, optimized: 202000 }
  ];

  const ratioData = [
    { name: 'Current Ratio', current: 2.1, industry: 1.8, target: 2.5 },
    { name: 'Quick Ratio', current: 1.6, industry: 1.2, target: 1.8 },
    { name: 'Cash Ratio', current: 0.8, industry: 0.5, target: 1.0 },
    { name: 'Working Capital Ratio', current: 0.15, industry: 0.12, target: 0.18 }
  ];

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Working Capital Analysis</h1>
          <p className="text-gray-600">Advanced cash flow optimization and liquidity management</p>
        </div>
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="3months">3 Months</option>
          <option value="6months">6 Months</option>
          <option value="12months">12 Months</option>
          <option value="24months">24 Months</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Current Working Capital</p>
              <p className="text-3xl font-bold text-blue-900">£170.3K</p>
              <p className="text-sm text-blue-600">+8.3% vs last month</p>
            </div>
            <DollarSignIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Cash Conversion Cycle</p>
              <p className="text-3xl font-bold text-green-900">42 days</p>
              <p className="text-sm text-green-600">-5 days improved</p>
            </div>
            <ActivityIcon className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Days Sales Outstanding</p>
              <p className="text-3xl font-bold text-purple-900">28 days</p>
              <p className="text-sm text-purple-600">Industry: 35 days</p>
            </div>
            <CalendarIcon className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium">Inventory Turnover</p>
              <p className="text-3xl font-bold text-orange-900">8.2x</p>
              <p className="text-sm text-orange-600">Industry: 6.5x</p>
            </div>
            <TrendingUpIcon className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Working Capital Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={workingCapitalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Line type="monotone" dataKey="current" stroke="#3b82f6" strokeWidth={2} name="Current" />
                <Line type="monotone" dataKey="projected" stroke="#10b981" strokeWidth={2} name="Projected" />
                <Line type="monotone" dataKey="optimized" stroke="#8b5cf6" strokeWidth={2} name="Optimized" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Liquidity Ratios</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ratioData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} />
                <Tooltip />
                <Legend />
                <Bar dataKey="current" fill="#3b82f6" name="Current" />
                <Bar dataKey="industry" fill="#6b7280" name="Industry Avg" />
                <Bar dataKey="target" fill="#10b981" name="Target" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Optimization Recommendations */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI-Powered Optimization Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <h4 className="font-semibold text-green-900 mb-2">Accounts Receivable</h4>
            <p className="text-sm text-green-700">Implement early payment discounts to reduce DSO by 3-5 days, improving cash flow by £15K monthly.</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">Inventory Management</h4>
            <p className="text-sm text-blue-700">Optimize stock levels using AI forecasting to reduce carrying costs by 12% while maintaining service levels.</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <h4 className="font-semibold text-purple-900 mb-2">Accounts Payable</h4>
            <p className="text-sm text-purple-700">Extend payment terms with key suppliers to improve cash conversion cycle by 7 days.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Demand Forecasting Component
const DemandForecasting = () => {
  const [forecastPeriod, setForecastPeriod] = useState('180');
  const [selectedProduct, setSelectedProduct] = useState('all');

  const forecastData = [
    { period: '30 days', demand: 2450, confidence: 94.2, seasonality: 1.05 },
    { period: '60 days', demand: 4820, confidence: 91.8, seasonality: 1.12 },
    { period: '90 days', demand: 7180, confidence: 89.5, seasonality: 1.18 },
    { period: '180 days', demand: 14200, confidence: 85.3, seasonality: 1.25 }
  ];

  const seasonalityData = [
    { month: 'Jan', historical: 2100, predicted: 2180, seasonal_factor: 0.95 },
    { month: 'Feb', historical: 2200, predicted: 2280, seasonal_factor: 0.98 },
    { month: 'Mar', historical: 2400, predicted: 2450, seasonal_factor: 1.05 },
    { month: 'Apr', historical: 2600, predicted: 2680, seasonal_factor: 1.12 },
    { month: 'May', historical: 2800, predicted: 2850, seasonal_factor: 1.18 },
    { month: 'Jun', historical: 3000, predicted: 3100, seasonal_factor: 1.25 },
    { month: 'Jul', historical: 3200, predicted: 3280, seasonal_factor: 1.30 },
    { month: 'Aug', historical: 3100, predicted: 3180, seasonal_factor: 1.28 },
    { month: 'Sep', historical: 2900, predicted: 2950, seasonal_factor: 1.22 },
    { month: 'Oct', historical: 2700, predicted: 2780, seasonal_factor: 1.15 },
    { month: 'Nov', historical: 2500, predicted: 2580, seasonal_factor: 1.08 },
    { month: 'Dec', historical: 2300, predicted: 2380, seasonal_factor: 1.02 }
  ];

  const productForecasts = [
    { product: 'GABA Bundle', current_demand: 850, forecast_30: 920, forecast_60: 1840, forecast_90: 2760, forecast_180: 5520 },
    { product: 'GABA Red + Gold', current_demand: 720, forecast_30: 780, forecast_60: 1560, forecast_90: 2340, forecast_180: 4680 },
    { product: 'Nootropic Stack', current_demand: 480, forecast_30: 520, forecast_60: 1040, forecast_90: 1560, forecast_180: 3120 },
    { product: 'Focus Blend', current_demand: 400, forecast_30: 430, forecast_60: 860, forecast_90: 1290, forecast_180: 2580 }
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Demand Forecasting</h1>
          <p className="text-gray-600">AI-powered demand prediction with seasonality analysis</p>
        </div>
        <div className="flex space-x-4">
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Products</option>
            <option value="gaba-bundle">GABA Bundle</option>
            <option value="gaba-red-gold">GABA Red + Gold</option>
            <option value="nootropic-stack">Nootropic Stack</option>
            <option value="focus-blend">Focus Blend</option>
          </select>
          <select
            value={forecastPeriod}
            onChange={(e) => setForecastPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="30">30 Days</option>
            <option value="60">60 Days</option>
            <option value="90">90 Days</option>
            <option value="180">180 Days</option>
          </select>
        </div>
      </div>

      {/* Forecast Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {forecastData.map((forecast, index) => (
          <div key={index} className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">{forecast.period} Forecast</p>
                <p className="text-3xl font-bold text-blue-900">{forecast.demand.toLocaleString()}</p>
                <p className="text-sm text-blue-600">{forecast.confidence}% confidence</p>
              </div>
              <LineChartIcon className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Seasonal Demand Pattern</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={seasonalityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="historical" fill="#6b7280" name="Historical" />
                <Bar yAxisId="left" dataKey="predicted" fill="#3b82f6" name="Predicted" />
                <Line yAxisId="right" type="monotone" dataKey="seasonal_factor" stroke="#10b981" strokeWidth={3} name="Seasonal Factor" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Forecast Breakdown</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productForecasts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="product" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="current_demand" fill="#6b7280" name="Current" />
                <Bar dataKey="forecast_30" fill="#3b82f6" name="30 Days" />
                <Bar dataKey="forecast_90" fill="#10b981" name="90 Days" />
                <Bar dataKey="forecast_180" fill="#8b5cf6" name="180 Days" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI-Powered Insights & Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <h4 className="font-semibold text-green-900 mb-2">Seasonal Trends</h4>
            <p className="text-sm text-green-700">Peak demand expected in June-August (25% above baseline). Recommend increasing production capacity by 30% in Q2.</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">Inventory Planning</h4>
            <p className="text-sm text-blue-700">GABA Bundle showing strongest growth trajectory. Secure raw materials for 180-day forecast to avoid stockouts.</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <h4 className="font-semibold text-purple-900 mb-2">Market Opportunities</h4>
            <p className="text-sm text-purple-700">Focus Blend underperforming vs. market potential. Consider marketing campaign to capture 15% additional market share.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Financial Reports Component
const FinancialReports = () => {
  const [reportPeriod, setReportPeriod] = useState('current');
  
  const pnlData = {
    revenue: 3170000,
    costOfSales: 1585000,
    grossProfit: 1585000,
    operatingExpenses: 950000,
    ebitda: 635000,
    depreciation: 85000,
    ebit: 550000,
    interestExpense: 25000,
    taxExpense: 131250,
    netProfit: 393750
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (numerator, denominator) => {
    return ((numerator / denominator) * 100).toFixed(1) + '%';
  };

  const monthlyData = [
    { month: 'Jan', revenue: 245000, profit: 36750 },
    { month: 'Feb', revenue: 252000, profit: 37800 },
    { month: 'Mar', revenue: 268000, profit: 40200 },
    { month: 'Apr', revenue: 275000, profit: 41250 },
    { month: 'May', revenue: 285000, profit: 42750 },
    { month: 'Jun', revenue: 295000, profit: 44250 },
    { month: 'Jul', revenue: 305000, profit: 45750 },
    { month: 'Aug', revenue: 298000, profit: 44700 },
    { month: 'Sep', revenue: 288000, profit: 43200 },
    { month: 'Oct', revenue: 278000, profit: 41700 },
    { month: 'Nov', revenue: 265000, profit: 39750 },
    { month: 'Dec', revenue: 256000, profit: 38400 }
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Reports</h1>
          <p className="text-gray-600">Comprehensive financial analysis and reporting</p>
        </div>
        <select
          value={reportPeriod}
          onChange={(e) => setReportPeriod(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="current">Current Year</option>
          <option value="previous">Previous Year</option>
          <option value="quarterly">Quarterly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      {/* P&L Statement */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Profit & Loss Statement</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b border-gray-200">
            <span className="font-semibold text-gray-900">Revenue</span>
            <span className="font-bold text-gray-900">{formatCurrency(pnlData.revenue)}</span>
          </div>
          <div className="flex justify-between items-center py-2 pl-4">
            <span className="text-gray-700">Cost of Sales</span>
            <span className="text-gray-900">({formatCurrency(pnlData.costOfSales)})</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-200 bg-green-50">
            <span className="font-semibold text-green-900">Gross Profit</span>
            <span className="font-bold text-green-900">{formatCurrency(pnlData.grossProfit)}</span>
          </div>
          <div className="flex justify-between items-center py-2 pl-4">
            <span className="text-gray-700">Operating Expenses</span>
            <span className="text-gray-900">({formatCurrency(pnlData.operatingExpenses)})</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-200 bg-blue-50">
            <span className="font-semibold text-blue-900">EBITDA</span>
            <span className="font-bold text-blue-900">{formatCurrency(pnlData.ebitda)}</span>
          </div>
          <div className="flex justify-between items-center py-2 pl-4">
            <span className="text-gray-700">Depreciation & Amortization</span>
            <span className="text-gray-900">({formatCurrency(pnlData.depreciation)})</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-200">
            <span className="font-semibold text-gray-900">EBIT</span>
            <span className="font-bold text-gray-900">{formatCurrency(pnlData.ebit)}</span>
          </div>
          <div className="flex justify-between items-center py-2 pl-4">
            <span className="text-gray-700">Interest Expense</span>
            <span className="text-gray-900">({formatCurrency(pnlData.interestExpense)})</span>
          </div>
          <div className="flex justify-between items-center py-2 pl-4">
            <span className="text-gray-700">Tax Expense</span>
            <span className="text-gray-900">({formatCurrency(pnlData.taxExpense)})</span>
          </div>
          <div className="flex justify-between items-center py-4 border-t-2 border-gray-300 bg-purple-50">
            <span className="font-bold text-purple-900 text-lg">Net Profit</span>
            <span className="font-bold text-purple-900 text-lg">{formatCurrency(pnlData.netProfit)}</span>
          </div>
        </div>
      </div>

      {/* Charts and KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue & Profit Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
                <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} name="Net Profit" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Financial KPIs */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Gross Margin</p>
                <p className="text-3xl font-bold text-green-900">{formatPercentage(pnlData.grossProfit, pnlData.revenue)}</p>
                <p className="text-sm text-green-600">Industry: 35-45%</p>
              </div>
              <PieChartIcon className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">EBITDA Margin</p>
                <p className="text-3xl font-bold text-blue-900">{formatPercentage(pnlData.ebitda, pnlData.revenue)}</p>
                <p className="text-sm text-blue-600">Industry: 10-15%</p>
              </div>
              <BarChart3Icon className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Net Margin</p>
                <p className="text-3xl font-bold text-purple-900">{formatPercentage(pnlData.netProfit, pnlData.revenue)}</p>
                <p className="text-sm text-purple-600">Industry: 5-10%</p>
              </div>
              <TrendingUpIcon className="h-8 w-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">Revenue Growth</p>
                <p className="text-3xl font-bold text-orange-900">+15.2%</p>
                <p className="text-sm text-orange-600">Year over year</p>
              </div>
              <LineChartIcon className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Dashboard Component with Working Navigation
const ComprehensiveDashboard = () => {
  const [activePageId, setActivePageId] = useState('executive-dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const NAV_SECTIONS = [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'executive-dashboard', label: 'Executive Dashboard', icon: LayoutDashboardIcon, number: 1 }
      ]
    },
    {
      title: 'PLANNING & ANALYTICS',
      items: [
        { id: 'demand-forecasting', label: 'Demand Forecasting', icon: LineChartIcon, number: 2 },
        { id: 'inventory-management', label: 'Inventory Management', icon: Package2Icon, number: 3 },
        { id: 'production-tracking', label: 'Production Tracking', icon: FactoryIcon, number: 4 },
        { id: 'quality-control', label: 'Quality Control', icon: FlaskConicalIcon, number: 5 }
      ]
    },
    {
      title: 'FINANCIAL MANAGEMENT',
      items: [
        { id: 'working-capital', label: 'Working Capital', icon: DollarSignIcon, number: 6 },
        { id: 'what-if-analysis', label: 'What-If Analysis', icon: BrainIcon, number: 7 },
        { id: 'financial-reports', label: 'Financial Reports', icon: LayersIcon, number: 8 }
      ]
    },
    {
      title: 'OPERATIONS',
      items: [
        { id: 'data-import', label: 'Data Import', icon: DatabaseIcon, number: 9 },
        { id: 'admin-panel', label: 'Admin Panel', icon: ShieldCheckIcon, number: 10 }
      ]
    }
  ];

  // Component mapping - THIS IS THE KEY FIX
  const getActiveComponent = () => {
    switch (activePageId) {
      case 'executive-dashboard':
        return <ExecutiveDashboard />;
      case 'what-if-analysis':
        return <WhatIfAnalysis />;
      case 'working-capital':
        return <WorkingCapitalAnalysis />;
      case 'demand-forecasting':
        return <DemandForecasting />;
      case 'financial-reports':
        return <FinancialReports />;
      case 'inventory-management':
        return <div className="p-6"><h1 className="text-3xl font-bold">Inventory Management</h1><p>Advanced inventory optimization and tracking system coming soon...</p></div>;
      case 'production-tracking':
        return <div className="p-6"><h1 className="text-3xl font-bold">Production Tracking</h1><p>Real-time production monitoring and analytics coming soon...</p></div>;
      case 'quality-control':
        return <div className="p-6"><h1 className="text-3xl font-bold">Quality Control</h1><p>Comprehensive quality management system coming soon...</p></div>;
      case 'data-import':
        return <div className="p-6"><h1 className="text-3xl font-bold">Data Import</h1><p>Advanced data integration and import tools coming soon...</p></div>;
      case 'admin-panel':
        return <div className="p-6"><h1 className="text-3xl font-bold">Admin Panel</h1><p>System administration and configuration panel coming soon...</p></div>;
      default:
        return <ExecutiveDashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-slate-800 text-white transition-all duration-300 flex flex-col`}>
        {/* Header */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="font-bold text-lg">Sentia Manufacturing</h1>
                <p className="text-slate-400 text-sm">Enterprise Dashboard</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="mb-6">
              {sidebarOpen && (
                <h3 className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  {section.title}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activePageId === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActivePageId(item.id)}
                      className={`w-full flex items-center px-4 py-3 text-left transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white border-r-2 border-blue-400'
                          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                          isActive ? 'bg-blue-500 text-white' : 'bg-slate-600 text-slate-300'
                        }`}>
                          {item.number}
                        </div>
                        {sidebarOpen && (
                          <div className="flex items-center space-x-2">
                            <Icon className="h-4 w-4" />
                            <span className="font-medium">{item.label}</span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* AI Chatbot */}
        <div className="p-4 border-t border-slate-700">
          <button className="w-full flex items-center justify-center p-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
            <div className="text-2xl">🤖</div>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <MenuIcon className="h-5 w-5" />
              </button>
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

        {/* Page Content - THIS IS THE KEY FIX */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {getActiveComponent()}
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
