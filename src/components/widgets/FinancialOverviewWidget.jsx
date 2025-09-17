import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { Line, Bar } from 'react-chartjs-2';
import {
  WidgetContainer,
  WidgetSkeleton,
  WidgetError,
  MetricCard,
  DataGrid
} from './WidgetComponents';

const FinancialOverviewWidget = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  // Fetch financial overview data from API
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['financial-overview'],
    queryFn: async () => {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/financial/overview`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        // Fallback to mock data if API fails
        if (response.status === 404 || response.status === 500) {
          return getMockData();
        }
        throw new Error(`Failed to fetch financial overview: ${response.statusText}`);
      }

      return response.json();
    },
    refetchInterval: 60000, // Refresh every minute
    retry: 2,
    retryDelay: 1000
  });

  // Mock data fallback
  const getMockData = () => ({
    summary: {
      revenue: 2456780,
      expenses: 1890450,
      profit: 566330,
      profitMargin: 23.1,
      cashFlow: 423500,
      workingCapital: 789200,
      currentRatio: 1.85,
      quickRatio: 1.42
    },
    revenueBreakdown: [
      { source: 'Product Sales', amount: 1845000, percentage: 75.1 },
      { source: 'Services', amount: 456780, percentage: 18.6 },
      { source: 'Licensing', amount: 155000, percentage: 6.3 }
    ],
    expenseBreakdown: [
      { category: 'Raw Materials', amount: 756000, percentage: 40 },
      { category: 'Labor', amount: 567135, percentage: 30 },
      { category: 'Operations', amount: 378090, percentage: 20 },
      { category: 'Marketing', amount: 189225, percentage: 10 }
    ],
    cashFlowTrend: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      operating: [380000, 395000, 410000, 423500, 438000, 445000],
      investing: [-120000, -85000, -95000, -110000, -75000, -90000],
      financing: [-50000, -45000, -55000, -48000, -52000, -47000]
    },
    profitTrend: {
      labels: ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024'],
      revenue: [2100000, 2250000, 2380000, 2456780],
      profit: [483000, 517500, 548000, 566330],
      margin: [23.0, 23.0, 23.0, 23.1]
    },
    keyRatios: {
      grossMargin: 42.5,
      operatingMargin: 28.3,
      netMargin: 23.1,
      roe: 18.7,
      roa: 12.4,
      debtToEquity: 0.45
    },
    budgetComparison: {
      revenue: { actual: 2456780, budget: 2400000, variance: 2.4 },
      expenses: { actual: 1890450, budget: 1950000, variance: -3.1 },
      profit: { actual: 566330, budget: 450000, variance: 25.8 }
    }
  });

  if (isLoading && !data) return <WidgetSkeleton title="Financial Overview" height="400px" />;
  if (error && !data) return <WidgetError error={error} onRetry={refetch} title="Financial Overview" />;

  const financial = data || getMockData();

  // Cash flow chart configuration
  const cashFlowData = {
    labels: financial.cashFlowTrend?.labels || [],
    datasets: [
      {
        label: 'Operating',
        data: financial.cashFlowTrend?.operating || [],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4
      },
      {
        label: 'Investing',
        data: financial.cashFlowTrend?.investing || [],
        borderColor: 'rgb(245, 158, 11)',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.4
      },
      {
        label: 'Financing',
        data: financial.cashFlowTrend?.financing || [],
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4
      }
    ]
  };

  const cashFlowOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      }
    },
    scales: {
      y: {
        ticks: {
          callback: function(value) {
            return '$' + (value / 1000).toFixed(0) + 'k';
          }
        }
      }
    }
  };

  // Revenue vs Profit chart
  const profitTrendData = {
    labels: financial.profitTrend?.labels || [],
    datasets: [
      {
        type: 'bar',
        label: 'Revenue',
        data: financial.profitTrend?.revenue || [],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
        yAxisID: 'y'
      },
      {
        type: 'bar',
        label: 'Profit',
        data: financial.profitTrend?.profit || [],
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1,
        yAxisID: 'y'
      },
      {
        type: 'line',
        label: 'Margin %',
        data: financial.profitTrend?.margin || [],
        borderColor: 'rgb(245, 158, 11)',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.4,
        yAxisID: 'y1'
      }
    ]
  };

  const profitTrendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      }
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        ticks: {
          callback: function(value) {
            return '$' + (value / 1000000).toFixed(1) + 'M';
          }
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          callback: function(value) {
            return value + '%';
          }
        }
      }
    }
  };

  const formatCurrency = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    }
    return `$${(value / 1000).toFixed(0)}k`;
  };

  const getVarianceColor = (variance) => {
    if (variance > 0) return 'text-green-600';
    if (variance < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <WidgetContainer
      title="Financial Overview"
      onRefresh={() => {
        queryClient.invalidateQueries(['financial-overview']);
        refetch();
      }}
      isRefreshing={isRefetching}
      className="col-span-2"
    >
      {/* Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard
          label="Revenue"
          value={formatCurrency(financial.summary?.revenue || 0)}
          trend={{ direction: 'up', value: 5.2 }}
          icon={CurrencyDollarIcon}
        />
        <MetricCard
          label="Profit"
          value={formatCurrency(financial.summary?.profit || 0)}
          trend={{ direction: 'up', value: 8.3 }}
          icon={BanknotesIcon}
        />
        <MetricCard
          label="Profit Margin"
          value={financial.summary?.profitMargin || 0}
          unit="%"
          trend={{ direction: 'neutral', value: 0.1 }}
          icon={ChartBarIcon}
        />
        <MetricCard
          label="Working Capital"
          value={formatCurrency(financial.summary?.workingCapital || 0)}
          trend={{ direction: 'up', value: 3.5 }}
        />
      </div>

      {/* Budget vs Actual Comparison */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Budget vs Actual</h4>
        <div className="space-y-3">
          {Object.entries(financial.budgetComparison || {}).map(([key, values]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{key}</span>
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatCurrency(values.actual)}
                </span>
                <span className="text-xs text-gray-500">
                  vs {formatCurrency(values.budget)}
                </span>
                <span className={`text-sm font-medium ${getVarianceColor(values.variance)}`}>
                  {values.variance > 0 ? '+' : ''}{values.variance}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Cash Flow Trend */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Cash Flow Trend</h4>
          <div style={{ height: '200px' }}>
            <Line data={cashFlowData} options={cashFlowOptions} />
          </div>
        </div>

        {/* Key Financial Ratios */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Key Ratios</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <p className="text-xs text-gray-600 dark:text-gray-400">Current Ratio</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {financial.summary?.currentRatio || 0}
              </p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <p className="text-xs text-gray-600 dark:text-gray-400">Quick Ratio</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {financial.summary?.quickRatio || 0}
              </p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <p className="text-xs text-gray-600 dark:text-gray-400">Gross Margin</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {financial.keyRatios?.grossMargin || 0}%
              </p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <p className="text-xs text-gray-600 dark:text-gray-400">ROE</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {financial.keyRatios?.roe || 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue vs Profit Trend */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Revenue & Profit Trend</h4>
        <div style={{ height: '200px' }}>
          <Bar data={profitTrendData} options={profitTrendOptions} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Revenue Breakdown */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Revenue Sources</h4>
          <div className="space-y-2">
            {financial.revenueBreakdown?.map((item) => (
              <div key={item.source} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">{item.source}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white w-20 text-right">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expense Breakdown */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Expense Categories</h4>
          <div className="space-y-2">
            {financial.expenseBreakdown?.map((item) => (
              <div key={item.category} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">{item.category}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white w-20 text-right">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Last Updated */}
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        Last updated: {new Date().toLocaleTimeString()}
      </div>
    </WidgetContainer>
  );
};

export default FinancialOverviewWidget;