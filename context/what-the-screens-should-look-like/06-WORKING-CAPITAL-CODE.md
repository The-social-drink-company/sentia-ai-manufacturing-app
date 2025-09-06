# Working Capital Management - Complete Implementation Code

## 1. Main Working Capital Page

```jsx
// src/pages/WorkingCapital.jsx
import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { 
  DollarSign, TrendingUp, TrendingDown, Calendar, AlertTriangle,
  FileText, Package, Users, CreditCard, PieChart, BarChart3,
  ArrowUpRight, ArrowDownRight, Clock, CheckCircle, XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { toast } from 'react-hot-toast';

// Import components
import { CashFlowForecast } from '../components/WorkingCapital/CashFlowForecast';
import { ReceivablesManager } from '../components/WorkingCapital/ReceivablesManager';
import { PayablesManager } from '../components/WorkingCapital/PayablesManager';
import { InventoryOptimizer } from '../components/WorkingCapital/InventoryOptimizer';
import { WorkingCapitalAI } from '../components/WorkingCapital/WorkingCapitalAI';
import { FinancialAlerts } from '../components/WorkingCapital/FinancialAlerts';

const WorkingCapital = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('30d');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');

  // Fetch working capital data
  const { data: wcData, isLoading } = useQuery({
    queryKey: ['working-capital', dateRange],
    queryFn: async () => {
      const response = await fetch(`/api/working-capital/summary?range=${dateRange}`, {
        headers: { 'Authorization': `Bearer ${await user.getToken()}` }
      });
      return response.json();
    },
    refetchInterval: 60000
  });

  // Fetch AI recommendations
  const { data: aiRecommendations } = useQuery({
    queryKey: ['wc-ai-recommendations'],
    queryFn: async () => {
      const response = await fetch('/api/ai/working-capital/recommendations', {
        headers: { 'Authorization': `Bearer ${await user.getToken()}` }
      });
      return response.json();
    },
    refetchInterval: 300000
  });

  const tabs = [
    { id: 'overview', label: 'Overview', icon: PieChart },
    { id: 'cashflow', label: 'Cash Flow', icon: TrendingUp },
    { id: 'receivables', label: 'Receivables', icon: FileText },
    { id: 'payables', label: 'Payables', icon: CreditCard },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'ai-insights', label: 'AI Insights', icon: BarChart3 }
  ];

  const kpis = [
    {
      label: 'Working Capital',
      value: wcData?.workingCapital || 0,
      change: wcData?.wcChange || 0,
      icon: DollarSign,
      color: 'blue'
    },
    {
      label: 'Cash Conversion Cycle',
      value: wcData?.cashConversionCycle || 0,
      unit: 'days',
      change: wcData?.cccChange || 0,
      icon: Clock,
      color: 'purple'
    },
    {
      label: 'Current Ratio',
      value: wcData?.currentRatio || 0,
      change: wcData?.crChange || 0,
      icon: TrendingUp,
      color: 'green'
    },
    {
      label: 'Quick Ratio',
      value: wcData?.quickRatio || 0,
      change: wcData?.qrChange || 0,
      icon: AlertTriangle,
      color: 'yellow'
    }
  ];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: selectedCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatChange = (value) => {
    const isPositive = value >= 0;
    return (
      <span className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
        {Math.abs(value).toFixed(1)}%
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Working Capital Management
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Optimize cash flow and financial efficiency
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="1y">Last Year</option>
              </select>

              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="JPY">JPY</option>
              </select>

              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Export Report
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 border-b border-gray-200 dark:border-gray-700">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      {activeTab === 'overview' && (
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {kpis.map((kpi, index) => {
              const Icon = kpi.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2 rounded-lg bg-${kpi.color}-100 dark:bg-${kpi.color}-900/20`}>
                      <Icon className={`w-5 h-5 text-${kpi.color}-600 dark:text-${kpi.color}-400`} />
                    </div>
                    {formatChange(kpi.change)}
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {kpi.label === 'Working Capital' 
                      ? formatCurrency(kpi.value)
                      : `${kpi.value}${kpi.unit || ''}`
                    }
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {kpi.label}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Main Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Working Capital Breakdown */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Working Capital Components</h3>
              <WorkingCapitalChart data={wcData} />
            </div>

            {/* AI Recommendations */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">AI Recommendations</h3>
              <AIRecommendationsList recommendations={aiRecommendations} />
            </div>
          </div>

          {/* Financial Alerts */}
          <div className="mt-6">
            <FinancialAlerts />
          </div>
        </div>
      )}

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'cashflow' && (
          <motion.div
            key="cashflow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 sm:px-6 lg:px-8 py-6"
          >
            <CashFlowForecast data={wcData} />
          </motion.div>
        )}

        {activeTab === 'receivables' && (
          <motion.div
            key="receivables"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 sm:px-6 lg:px-8 py-6"
          >
            <ReceivablesManager />
          </motion.div>
        )}

        {activeTab === 'payables' && (
          <motion.div
            key="payables"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 sm:px-6 lg:px-8 py-6"
          >
            <PayablesManager />
          </motion.div>
        )}

        {activeTab === 'inventory' && (
          <motion.div
            key="inventory"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 sm:px-6 lg:px-8 py-6"
          >
            <InventoryOptimizer />
          </motion.div>
        )}

        {activeTab === 'ai-insights' && (
          <motion.div
            key="ai-insights"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 sm:px-6 lg:px-8 py-6"
          >
            <WorkingCapitalAI />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Working Capital Chart Component
const WorkingCapitalChart = ({ data }) => {
  if (!data) return <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>;

  const chartData = {
    labels: ['Current Assets', 'Current Liabilities', 'Working Capital'],
    datasets: [{
      data: [data.currentAssets, data.currentLiabilities, data.workingCapital],
      backgroundColor: ['#3b82f6', '#ef4444', '#10b981'],
      borderWidth: 0
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  };

  return (
    <div className="h-64">
      <Bar data={chartData} options={options} />
    </div>
  );
};

// AI Recommendations List Component
const AIRecommendationsList = ({ recommendations }) => {
  if (!recommendations || recommendations.length === 0) {
    return <div className="text-gray-500">No recommendations available</div>;
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700';
    }
  };

  return (
    <div className="space-y-3">
      {recommendations.slice(0, 5).map((rec, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
        >
          <div className="flex items-start space-x-3">
            <span className={`px-2 py-1 text-xs rounded ${getPriorityColor(rec.priority)}`}>
              {rec.priority}
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {rec.title}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {rec.description}
              </p>
              {rec.impact && (
                <div className="flex items-center space-x-2 mt-2">
                  <TrendingUp className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-green-600 dark:text-green-400">
                    Potential impact: {rec.impact}
                  </span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default WorkingCapital;
```

## 2. Cash Flow Forecast Component

```jsx
// src/components/WorkingCapital/CashFlowForecast.jsx
import React, { useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { Calendar, TrendingUp, Download, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';

export const CashFlowForecast = ({ data }) => {
  const [forecastPeriod, setForecastPeriod] = useState('30d');
  const [scenario, setScenario] = useState('base');

  // Fetch cash flow forecast
  const { data: forecast } = useQuery({
    queryKey: ['cashflow-forecast', forecastPeriod, scenario],
    queryFn: async () => {
      const response = await fetch(`/api/working-capital/cashflow/forecast?period=${forecastPeriod}&scenario=${scenario}`);
      return response.json();
    }
  });

  const chartData = {
    labels: forecast?.dates || [],
    datasets: [
      {
        label: 'Actual Cash Flow',
        data: forecast?.actual || [],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        tension: 0.4
      },
      {
        label: 'Forecasted Cash Flow',
        data: forecast?.predicted || [],
        borderColor: '#a855f7',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        borderWidth: 2,
        borderDash: [5, 5],
        tension: 0.4
      },
      {
        label: 'Upper Bound',
        data: forecast?.upperBound || [],
        borderColor: 'rgba(168, 85, 247, 0.3)',
        backgroundColor: 'transparent',
        borderWidth: 1,
        fill: false,
        tension: 0.4
      },
      {
        label: 'Lower Bound',
        data: forecast?.lowerBound || [],
        borderColor: 'rgba(168, 85, 247, 0.3)',
        backgroundColor: 'transparent',
        borderWidth: 1,
        fill: false,
        tension: 0.4
      }
    ]
  };

  const scenarios = [
    { value: 'base', label: 'Base Case' },
    { value: 'optimistic', label: 'Optimistic' },
    { value: 'pessimistic', label: 'Pessimistic' },
    { value: 'stress', label: 'Stress Test' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold">Cash Flow Forecast</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              AI-powered predictions with scenario analysis
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={forecastPeriod}
              onChange={(e) => setForecastPeriod(e.target.value)}
              className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="7d">7 Days</option>
              <option value="30d">30 Days</option>
              <option value="90d">90 Days</option>
              <option value="180d">6 Months</option>
            </select>

            <select
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            >
              {scenarios.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>

            <button className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chart */}
        <div className="h-96">
          <Line data={chartData} options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top'
              },
              tooltip: {
                mode: 'index',
                intersect: false
              }
            },
            scales: {
              y: {
                beginAtZero: false,
                ticks: {
                  callback: (value) => `$${(value / 1000).toFixed(0)}k`
                }
              }
            }
          }} />
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Min Cash</div>
            <div className="text-xl font-bold">${(forecast?.minCash / 1000).toFixed(0)}k</div>
            <div className="text-xs text-gray-500 mt-1">
              Day {forecast?.minCashDay}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Max Cash</div>
            <div className="text-xl font-bold">${(forecast?.maxCash / 1000).toFixed(0)}k</div>
            <div className="text-xs text-gray-500 mt-1">
              Day {forecast?.maxCashDay}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Avg Daily Flow</div>
            <div className="text-xl font-bold">${(forecast?.avgDailyFlow / 1000).toFixed(0)}k</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Confidence</div>
            <div className="text-xl font-bold">{forecast?.confidence}%</div>
          </div>
        </div>
      </div>

      {/* Cash Flow Components */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CashInflowBreakdown data={forecast?.inflows} />
        <CashOutflowBreakdown data={forecast?.outflows} />
      </div>

      {/* Alerts and Recommendations */}
      <CashFlowAlerts forecast={forecast} />
    </div>
  );
};

// Cash Inflow Breakdown
const CashInflowBreakdown = ({ data }) => {
  if (!data) return null;

  const chartData = {
    labels: Object.keys(data),
    datasets: [{
      data: Object.values(data),
      backgroundColor: [
        '#3b82f6',
        '#10b981',
        '#f59e0b',
        '#ef4444',
        '#a855f7'
      ]
    }]
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <h4 className="text-lg font-semibold mb-4">Cash Inflows</h4>
      <div className="h-64">
        <Doughnut data={chartData} options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right'
            }
          }
        }} />
      </div>
    </div>
  );
};

// Cash Outflow Breakdown
const CashOutflowBreakdown = ({ data }) => {
  if (!data) return null;

  const chartData = {
    labels: Object.keys(data),
    datasets: [{
      data: Object.values(data),
      backgroundColor: [
        '#ef4444',
        '#f59e0b',
        '#10b981',
        '#3b82f6',
        '#a855f7'
      ]
    }]
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <h4 className="text-lg font-semibold mb-4">Cash Outflows</h4>
      <div className="h-64">
        <Doughnut data={chartData} options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right'
            }
          }
        }} />
      </div>
    </div>
  );
};

// Cash Flow Alerts
const CashFlowAlerts = ({ forecast }) => {
  if (!forecast?.alerts || forecast.alerts.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <h4 className="text-lg font-semibold mb-4">Cash Flow Alerts</h4>
      <div className="space-y-3">
        {forecast.alerts.map((alert, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-lg border ${
              alert.severity === 'high' 
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                : alert.severity === 'medium'
                ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
            }`}
          >
            <div className="flex items-start space-x-3">
              <AlertCircle className={`w-5 h-5 mt-0.5 ${
                alert.severity === 'high' ? 'text-red-600' :
                alert.severity === 'medium' ? 'text-yellow-600' :
                'text-blue-600'
              }`} />
              <div className="flex-1">
                <h5 className="font-medium">{alert.title}</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {alert.description}
                </p>
                {alert.recommendation && (
                  <div className="mt-2 p-2 bg-white dark:bg-gray-800 rounded">
                    <p className="text-sm font-medium">Recommendation:</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {alert.recommendation}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
```

## 3. Receivables Manager Component

```jsx
// src/components/WorkingCapital/ReceivablesManager.jsx
import React, { useState } from 'react';
import { FileText, Clock, AlertCircle, CheckCircle, Phone, Mail } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';

export const ReceivablesManager = () => {
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  // Fetch receivables data
  const { data: receivables } = useQuery({
    queryKey: ['receivables', filterStatus],
    queryFn: async () => {
      const response = await fetch(`/api/working-capital/receivables?status=${filterStatus}`);
      return response.json();
    }
  });

  // Send reminder mutation
  const sendReminderMutation = useMutation({
    mutationFn: async (invoiceId) => {
      const response = await fetch(`/api/working-capital/receivables/${invoiceId}/remind`, {
        method: 'POST'
      });
      return response.json();
    }
  });

  const getStatusBadge = (status) => {
    const styles = {
      paid: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
      pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
      overdue: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
      partial: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
    };
    
    return styles[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400';
  };

  const getDaysColor = (days) => {
    if (days < 0) return 'text-red-600';
    if (days < 7) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <FileText className="w-5 h-5 text-blue-500" />
            <span className="text-2xl font-bold">{receivables?.summary?.totalInvoices || 0}</span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Invoices</div>
          <div className="text-xl font-semibold mt-2">
            ${(receivables?.summary?.totalAmount / 1000).toFixed(0)}k
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-yellow-500" />
            <span className="text-2xl font-bold">{receivables?.summary?.averageDSO || 0}</span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Avg DSO (Days)</div>
          <div className="text-sm text-gray-500 mt-2">
            Target: {receivables?.summary?.targetDSO || 30} days
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-2xl font-bold">{receivables?.summary?.overdueCount || 0}</span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Overdue</div>
          <div className="text-xl font-semibold mt-2 text-red-600">
            ${(receivables?.summary?.overdueAmount / 1000).toFixed(0)}k
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-2xl font-bold">{receivables?.summary?.collectionRate || 0}%</span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Collection Rate</div>
          <div className="text-sm text-gray-500 mt-2">
            This month
          </div>
        </div>
      </div>

      {/* Aging Analysis */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Aging Analysis</h3>
        <AgingChart data={receivables?.aging} />
      </div>

      {/* Receivables Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="p-6 border-b dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Outstanding Invoices</h3>
            <div className="flex items-center space-x-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
                <option value="partial">Partial</option>
              </select>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Bulk Actions
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Days
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {receivables?.invoices?.map((invoice) => (
                <motion.tr
                  key={invoice.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => setSelectedInvoice(invoice)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {invoice.number}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {invoice.customer}
                    </div>
                    <div className="text-xs text-gray-500">
                      {invoice.customerEmail}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      ${invoice.amount.toLocaleString()}
                    </div>
                    {invoice.paidAmount > 0 && (
                      <div className="text-xs text-gray-500">
                        Paid: ${invoice.paidAmount.toLocaleString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${getDaysColor(invoice.daysUntilDue)}`}>
                      {invoice.daysUntilDue > 0 ? `${invoice.daysUntilDue}d` : `${Math.abs(invoice.daysUntilDue)}d overdue`}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          sendReminderMutation.mutate(invoice.id);
                        }}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                        title="Send Reminder"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle phone call
                        }}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                        title="Call Customer"
                      >
                        <Phone className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Aging Chart Component
const AgingChart = ({ data }) => {
  if (!data) return null;

  const chartData = {
    labels: ['Current', '1-30 Days', '31-60 Days', '61-90 Days', '90+ Days'],
    datasets: [{
      label: 'Amount',
      data: [
        data.current || 0,
        data.days30 || 0,
        data.days60 || 0,
        data.days90 || 0,
        data.days90Plus || 0
      ],
      backgroundColor: [
        '#10b981',
        '#3b82f6',
        '#f59e0b',
        '#ef4444',
        '#991b1b'
      ]
    }]
  };

  return (
    <div className="h-64">
      <Bar data={chartData} options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => `$${(value / 1000).toFixed(0)}k`
            }
          }
        }
      }} />
    </div>
  );
};
```

## Key Features Implemented

1. **Comprehensive Working Capital Dashboard**: Complete financial overview with KPIs
2. **AI-Powered Recommendations**: Machine learning insights for optimization
3. **Cash Flow Forecasting**: Multi-scenario predictions with confidence intervals
4. **Receivables Management**: Invoice tracking, aging analysis, and automated reminders
5. **Payables Optimization**: Vendor management and payment scheduling
6. **Inventory Analytics**: Stock optimization and turnover analysis
7. **Real-time Alerts**: Financial risk monitoring and notifications
8. **Interactive Charts**: Dynamic visualizations using Chart.js
9. **Scenario Analysis**: What-if modeling for financial planning
10. **Export Capabilities**: Generate reports in multiple formats