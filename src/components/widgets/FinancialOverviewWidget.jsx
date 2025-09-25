import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || null}/api/financial/overview`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch financial overview: ${response.statusText}`);
      }

      return response.json();
    },
    refetchInterval: 60000, // Refresh every minute
    retry: 2,
    retryDelay: 1000
  });


  if (isLoading) return <WidgetSkeleton title="Financial Overview" height="400px" />;
  if (error) return <WidgetError error={error} onRetry={refetch} title="Financial Overview" />;
  if (!data) return <WidgetError error={{ message: 'No data available. Please connect to real data source.' }} onRetry={refetch} title="Financial Overview" />;

  const financial = data;

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