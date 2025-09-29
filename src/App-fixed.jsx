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
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Integration Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <div>
                  <p className="font-medium text-gray-900">Shopify UK</p>
                  <p className="text-sm text-gray-600">Last sync: 2 min ago</p>
                </div>
              </div>
              <div className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600">
                CONNECTED
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <div>
                  <p className="font-medium text-gray-900">Shopify USA</p>
                  <p className="text-sm text-gray-600">Last sync: 1 min ago</p>
                </div>
              </div>
              <div className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600">
                CONNECTED
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div>
                  <p className="font-medium text-gray-900">Xero</p>
                  <p className="text-sm text-gray-600">Last sync: 2 hours ago</p>
                </div>
              </div>
              <div className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-600">
                TOKEN REFRESH NEEDED
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div>
                  <p className="font-medium text-gray-900">Unleashed</p>
                  <p className="text-sm text-gray-600">Last sync: Never</p>
                </div>
              </div>
              <div className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600">
                AUTH REQUIRED
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// What-If Analysis Component
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
                <p className="text-sm text-blue-600">Annual increase</p>
              </div>
              <TrendingUpIcon className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">New Revenue</p>
                <p className="text-3xl font-bold text-green-900">{formatCurrency(results.newRevenue)}</p>
                <p className="text-sm text-green-600">Projected total</p>
              </div>
              <DollarSignIcon className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">ROI</p>
                <p className="text-3xl font-bold text-purple-900">{results.roi.toFixed(1)}%</p>
                <p className="text-sm text-purple-600">Return on investment</p>
              </div>
              <BarChart3Icon className="h-8 w-8 text-purple-600" />
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
        </div>
      )}

      {/* Scenario Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Scenario Impact Visualization</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={[
              { month: 'Jan', current: 264167, projected: 264167 * (1 + scenarios.revenueGrowth / 100) },
              { month: 'Feb', current: 264167, projected: 264167 * (1 + scenarios.revenueGrowth / 100) },
              { month: 'Mar', current: 264167, projected: 264167 * (1 + scenarios.revenueGrowth / 100) },
              { month: 'Apr', current: 264167, projected: 264167 * (1 + scenarios.revenueGrowth / 100) },
              { month: 'May', current: 264167, projected: 264167 * (1 + scenarios.revenueGrowth / 100) },
              { month: 'Jun', current: 264167, projected: 264167 * (1 + scenarios.revenueGrowth / 100) }
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Line type="monotone" dataKey="current" stroke="#8884d8" name="Current Revenue" />
              <Line type="monotone" dataKey="projected" stroke="#82ca9d" name="Projected Revenue" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// Working Capital Analysis Component
const WorkingCapitalAnalysis = () => {
  const [timeframe, setTimeframe] = useState('30');
  const [workingCapitalData] = useState({
    current: 170300,
    target: 200000,
    trend: 8.3,
    components: {
      inventory: 85000,
      receivables: 125000,
      payables: -39700
    }
  });

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const chartData = [
    { name: 'Week 1', workingCapital: 165000, cashFlow: 15000 },
    { name: 'Week 2', workingCapital: 168000, cashFlow: 18000 },
    { name: 'Week 3', workingCapital: 170300, cashFlow: 22000 },
    { name: 'Week 4', workingCapital: 172000, cashFlow: 25000 }
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Working Capital Analysis</h1>
          <p className="text-gray-600">Advanced cash flow optimization and forecasting</p>
        </div>
        <div className="flex items-center space-x-4">
          <select 
            value={timeframe} 
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="30">30 Days</option>
            <option value="60">60 Days</option>
            <option value="90">90 Days</option>
            <option value="180">180 Days</option>
          </select>
        </div>
      </div>

      {/* Working Capital KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Current Working Capital</p>
              <p className="text-3xl font-bold text-blue-900">{formatCurrency(workingCapitalData.current)}</p>
              <div className="flex items-center mt-2">
                <TrendingUpIcon className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">+{workingCapitalData.trend}%</span>
              </div>
            </div>
            <DollarSignIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Inventory</p>
              <p className="text-3xl font-bold text-green-900">{formatCurrency(workingCapitalData.components.inventory)}</p>
              <p className="text-sm text-green-600">Current stock value</p>
            </div>
            <Package2Icon className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Receivables</p>
              <p className="text-3xl font-bold text-purple-900">{formatCurrency(workingCapitalData.components.receivables)}</p>
              <p className="text-sm text-purple-600">Outstanding invoices</p>
            </div>
            <ActivityIcon className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium">Payables</p>
              <p className="text-3xl font-bold text-orange-900">{formatCurrency(Math.abs(workingCapitalData.components.payables))}</p>
              <p className="text-sm text-orange-600">Outstanding payments</p>
            </div>
            <BarChart3Icon className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Working Capital Trend Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Working Capital Trend Analysis</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="workingCapital" fill="#8884d8" name="Working Capital" />
              <Line type="monotone" dataKey="cashFlow" stroke="#82ca9d" name="Cash Flow" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cash Flow Optimization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cash Flow Optimization</h3>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900">Recommended Actions</h4>
              <ul className="mt-2 space-y-2 text-sm text-green-700">
                <li>• Reduce inventory levels by 15% to free up £12.75K</li>
                <li>• Accelerate receivables collection by 5 days</li>
                <li>• Extend payables terms by 3 days where possible</li>
                <li>• Implement dynamic pricing for slow-moving inventory</li>
              </ul>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900">Projected Impact</h4>
              <p className="mt-2 text-sm text-blue-700">
                Implementing these changes could improve working capital by £25K-£35K within 60 days.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Working Capital Ratio Analysis</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Inventory', value: workingCapitalData.components.inventory, fill: '#8884d8' },
                    { name: 'Receivables', value: workingCapitalData.components.receivables, fill: '#82ca9d' },
                    { name: 'Cash', value: 25000, fill: '#ffc658' }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

// Demand Forecasting Component
const DemandForecasting = () => {
  const [forecastPeriod, setForecastPeriod] = useState('90');
  const [seasonalityEnabled, setSeasonalityEnabled] = useState(true);
  
  const forecastData = [
    { month: 'Jan', actual: 245000, forecast: 248000, confidence: 95 },
    { month: 'Feb', actual: 238000, forecast: 242000, confidence: 94 },
    { month: 'Mar', actual: 265000, forecast: 261000, confidence: 96 },
    { month: 'Apr', actual: null, forecast: 275000, confidence: 92 },
    { month: 'May', actual: null, forecast: 285000, confidence: 89 },
    { month: 'Jun', actual: null, forecast: 295000, confidence: 87 }
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
          <h1 className="text-3xl font-bold text-gray-900">Demand Forecasting</h1>
          <p className="text-gray-600">AI-powered demand prediction with 94.2% accuracy</p>
        </div>
        <div className="flex items-center space-x-4">
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
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={seasonalityEnabled}
              onChange={(e) => setSeasonalityEnabled(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Include Seasonality</span>
          </label>
        </div>
      </div>

      {/* Forecast Accuracy Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Forecast Accuracy</p>
              <p className="text-3xl font-bold text-blue-900">94.2%</p>
              <p className="text-sm text-blue-600">Last 12 months</p>
            </div>
            <BrainIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Next Month Forecast</p>
              <p className="text-3xl font-bold text-green-900">{formatCurrency(275000)}</p>
              <p className="text-sm text-green-600">92% confidence</p>
            </div>
            <TrendingUpIcon className="h-8 w-8 text-green-600" />
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

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium">Trend Direction</p>
              <p className="text-3xl font-bold text-orange-900">↗ UP</p>
              <p className="text-sm text-orange-600">Growing demand</p>
            </div>
            <LineChartIcon className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Forecast Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Demand Forecast vs Actual</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => value ? formatCurrency(value) : 'N/A'} />
              <Legend />
              <Line type="monotone" dataKey="actual" stroke="#8884d8" name="Actual Demand" strokeWidth={2} />
              <Line type="monotone" dataKey="forecast" stroke="#82ca9d" name="Forecasted Demand" strokeWidth={2} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">AI-Generated Insights</h3>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900">Trend Analysis</h4>
              <p className="mt-2 text-sm text-blue-700">
                Demand is showing a strong upward trend (+8.5% MoM) driven by seasonal factors and market expansion.
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900">Seasonality Detected</h4>
              <p className="mt-2 text-sm text-green-700">
                Spring season typically shows 12-15% increase in demand. Peak expected in May-June.
              </p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h4 className="font-medium text-yellow-900">Risk Factors</h4>
              <p className="mt-2 text-sm text-yellow-700">
                Monitor supply chain constraints that could impact fulfillment during peak demand periods.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Forecast Confidence Intervals</h3>
          <div className="space-y-4">
            {forecastData.filter(d => d.forecast && !d.actual).map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{item.month}</p>
                  <p className="text-sm text-gray-600">{formatCurrency(item.forecast)}</p>
                </div>
                <div className="text-right">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    item.confidence >= 90 ? 'bg-green-100 text-green-600' :
                    item.confidence >= 85 ? 'bg-yellow-100 text-yellow-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    {item.confidence}% Confidence
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Financial Reports Component
const FinancialReports = () => {
  const [reportType, setReportType] = useState('pnl');
  const [period, setPeriod] = useState('monthly');

  const pnlData = {
    revenue: 3170000,
    costOfSales: 1902000,
    grossProfit: 1268000,
    operatingExpenses: 850000,
    ebitda: 418000,
    netProfit: 285000
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value, total) => {
    return ((value / total) * 100).toFixed(1) + '%';
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Reports</h1>
          <p className="text-gray-600">Comprehensive financial analysis and reporting</p>
        </div>
        <div className="flex items-center space-x-4">
          <select 
            value={reportType} 
            onChange={(e) => setReportType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="pnl">P&L Statement</option>
            <option value="balance">Balance Sheet</option>
            <option value="cashflow">Cash Flow</option>
            <option value="ratios">Financial Ratios</option>
          </select>
          <select 
            value={period} 
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      </div>

      {/* P&L Statement */}
      {reportType === 'pnl' && (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Profit & Loss Statement - FY2025</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <span className="font-medium text-gray-900">Total Revenue</span>
                <div className="text-right">
                  <span className="font-semibold text-gray-900">{formatCurrency(pnlData.revenue)}</span>
                  <span className="text-sm text-gray-500 ml-4">100.0%</span>
                </div>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <span className="text-gray-700 ml-4">Cost of Sales</span>
                <div className="text-right">
                  <span className="text-gray-900">({formatCurrency(pnlData.costOfSales)})</span>
                  <span className="text-sm text-gray-500 ml-4">{formatPercentage(pnlData.costOfSales, pnlData.revenue)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-200 bg-green-50">
                <span className="font-medium text-green-900">Gross Profit</span>
                <div className="text-right">
                  <span className="font-semibold text-green-900">{formatCurrency(pnlData.grossProfit)}</span>
                  <span className="text-sm text-green-600 ml-4">{formatPercentage(pnlData.grossProfit, pnlData.revenue)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <span className="text-gray-700 ml-4">Operating Expenses</span>
                <div className="text-right">
                  <span className="text-gray-900">({formatCurrency(pnlData.operatingExpenses)})</span>
                  <span className="text-sm text-gray-500 ml-4">{formatPercentage(pnlData.operatingExpenses, pnlData.revenue)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-200 bg-blue-50">
                <span className="font-medium text-blue-900">EBITDA</span>
                <div className="text-right">
                  <span className="font-semibold text-blue-900">{formatCurrency(pnlData.ebitda)}</span>
                  <span className="text-sm text-blue-600 ml-4">{formatPercentage(pnlData.ebitda, pnlData.revenue)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between py-3 bg-indigo-50 rounded-lg px-4">
                <span className="font-semibold text-indigo-900">Net Profit</span>
                <div className="text-right">
                  <span className="font-bold text-indigo-900 text-lg">{formatCurrency(pnlData.netProfit)}</span>
                  <span className="text-sm text-indigo-600 ml-4">{formatPercentage(pnlData.netProfit, pnlData.revenue)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Financial KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
        </>
      )}
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
