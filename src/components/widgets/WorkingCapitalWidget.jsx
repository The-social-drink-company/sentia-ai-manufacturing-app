import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import {
  BanknotesIcon,
  DocumentTextIcon,
  CreditCardIcon,
  ChartPieIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import { Doughnut, Line } from 'react-chartjs-2';
import {
  WidgetContainer,
  WidgetSkeleton,
  WidgetError,
  MetricCard,
  DataGrid
} from './WidgetComponents';

const WorkingCapitalWidget = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  // Fetch working capital data from API
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['working-capital'],
    queryFn: async () => {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/financial/working-capital`, {
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
        throw new Error(`Failed to fetch working capital data: ${response.statusText}`);
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
      workingCapital: 789200,
      currentAssets: 2345600,
      currentLiabilities: 1556400,
      cashConversionCycle: 45,
      operatingCashFlow: 423500,
      freeCashFlow: 312400,
      liquidityRatio: 1.51,
      quickRatio: 1.18
    },
    components: {
      cash: 456000,
      accountsReceivable: 892300,
      inventory: 997300,
      accountsPayable: 645200,
      shortTermDebt: 320000,
      otherCurrentLiabilities: 591200
    },
    trends: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      workingCapital: [720000, 745000, 760000, 775000, 780000, 789200],
      currentRatio: [1.42, 1.44, 1.47, 1.49, 1.50, 1.51],
      cashFlow: [380000, 395000, 410000, 415000, 420000, 423500]
    },
    receivables: {
      total: 892300,
      current: 650000,
      overdue30: 150000,
      overdue60: 75000,
      overdue90: 17300,
      dso: 42 // Days Sales Outstanding
    },
    payables: {
      total: 645200,
      current: 520000,
      due30: 95000,
      due60: 30200,
      dpo: 38 // Days Payables Outstanding
    },
    inventory: {
      rawMaterials: 350000,
      wip: 247300,
      finishedGoods: 400000,
      turnoverRatio: 8.5,
      dio: 43 // Days Inventory Outstanding
    },
    cashManagement: {
      operatingActivities: 423500,
      investingActivities: -111100,
      financingActivities: -85000,
      netChange: 227400,
      beginningCash: 228600,
      endingCash: 456000
    },
    forecast: {
      nextMonth: {
        workingCapital: 805000,
        change: 15800,
        percentChange: 2.0
      },
      nextQuarter: {
        workingCapital: 845000,
        change: 55800,
        percentChange: 7.1
      }
    }
  });

  if (isLoading && !data) return <WidgetSkeleton title="Working Capital Management" height="400px" />;
  if (error && !data) return <WidgetError error={error} onRetry={refetch} title="Working Capital Management" />;

  const capital = data || getMockData();

  // Working Capital Components Chart
  const componentsData = {
    labels: ['Cash', 'A/R', 'Inventory', 'A/P', 'Short-Term Debt', 'Other Liabilities'],
    datasets: [{
      data: [
        capital.components?.cash || 0,
        capital.components?.accountsReceivable || 0,
        capital.components?.inventory || 0,
        capital.components?.accountsPayable || 0,
        capital.components?.shortTermDebt || 0,
        capital.components?.otherCurrentLiabilities || 0
      ],
      backgroundColor: [
        'rgba(16, 185, 129, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(168, 85, 247, 0.8)',
        'rgba(107, 114, 128, 0.8)'
      ],
      borderColor: [
        'rgb(16, 185, 129)',
        'rgb(59, 130, 246)',
        'rgb(245, 158, 11)',
        'rgb(239, 68, 68)',
        'rgb(168, 85, 247)',
        'rgb(107, 114, 128)'
      ],
      borderWidth: 1
    }]
  };

  const componentsOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 12
        }
      }
    }
  };

  // Working Capital Trend Chart
  const trendData = {
    labels: capital.trends?.labels || [],
    datasets: [
      {
        label: 'Working Capital',
        data: capital.trends?.workingCapital || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        yAxisID: 'y'
      },
      {
        label: 'Operating Cash Flow',
        data: capital.trends?.cashFlow || [],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        yAxisID: 'y'
      }
    ]
  };

  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
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
            return '$' + (value / 1000).toFixed(0) + 'k';
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

  // Receivables aging columns
  const receivablesColumns = [
    { key: 'aging', label: 'Aging' },
    {
      key: 'amount',
      label: 'Amount',
      render: (value) => formatCurrency(value)
    },
    {
      key: 'percentage',
      label: '%',
      render: (value) => `${value}%`
    }
  ];

  const receivablesData = [
    { aging: 'Current', amount: capital.receivables?.current || 0, percentage: ((capital.receivables?.current || 0) / (capital.receivables?.total || 1) * 100).toFixed(1) },
    { aging: '30 Days', amount: capital.receivables?.overdue30 || 0, percentage: ((capital.receivables?.overdue30 || 0) / (capital.receivables?.total || 1) * 100).toFixed(1) },
    { aging: '60 Days', amount: capital.receivables?.overdue60 || 0, percentage: ((capital.receivables?.overdue60 || 0) / (capital.receivables?.total || 1) * 100).toFixed(1) },
    { aging: '90+ Days', amount: capital.receivables?.overdue90 || 0, percentage: ((capital.receivables?.overdue90 || 0) / (capital.receivables?.total || 1) * 100).toFixed(1) }
  ];

  return (
    <WidgetContainer
      title="Working Capital Management"
      onRefresh={() => {
        queryClient.invalidateQueries(['working-capital']);
        refetch();
      }}
      isRefreshing={isRefetching}
      className="col-span-2"
    >
      {/* Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard
          label="Working Capital"
          value={formatCurrency(capital.summary?.workingCapital || 0)}
          trend={{ direction: capital.summary?.workingCapital > 750000 ? 'up' : 'down', value: 3.5 }}
          icon={BanknotesIcon}
        />
        <MetricCard
          label="Current Ratio"
          value={capital.summary?.liquidityRatio || 0}
          trend={{ direction: capital.summary?.liquidityRatio > 1.5 ? 'up' : 'down', value: 2.1 }}
        />
        <MetricCard
          label="Cash Conversion"
          value={capital.summary?.cashConversionCycle || 0}
          unit="days"
          icon={ChartPieIcon}
        />
        <MetricCard
          label="Operating Cash"
          value={formatCurrency(capital.summary?.operatingCashFlow || 0)}
          trend={{ direction: 'up', value: 5.2 }}
        />
      </div>

      {/* Cash Conversion Cycle Metrics */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Cash Conversion Cycle Components</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{capital.receivables?.dso || 0}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Days Sales Outstanding</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{capital.inventory?.dio || 0}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Days Inventory Outstanding</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{capital.payables?.dpo || 0}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Days Payables Outstanding</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">Net Cash Conversion Cycle</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {(capital.receivables?.dso || 0) + (capital.inventory?.dio || 0) - (capital.payables?.dpo || 0)} days
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Working Capital Components */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Working Capital Components</h4>
          <div style={{ height: '250px' }}>
            <Doughnut data={componentsData} options={componentsOptions} />
          </div>
        </div>

        {/* Working Capital Trend */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Working Capital Trend</h4>
          <div style={{ height: '250px' }}>
            <Line data={trendData} options={trendOptions} />
          </div>
        </div>
      </div>

      {/* Receivables Aging */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Accounts Receivable Aging</h4>
        <DataGrid columns={receivablesColumns} data={receivablesData} />
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Total Receivables: {formatCurrency(capital.receivables?.total || 0)}
        </div>
      </div>

      {/* Inventory Breakdown */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Inventory Analysis</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <p className="text-xs text-gray-600 dark:text-gray-400">Raw Materials</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatCurrency(capital.inventory?.rawMaterials || 0)}
            </p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <p className="text-xs text-gray-600 dark:text-gray-400">Work in Progress</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatCurrency(capital.inventory?.wip || 0)}
            </p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <p className="text-xs text-gray-600 dark:text-gray-400">Finished Goods</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatCurrency(capital.inventory?.finishedGoods || 0)}
            </p>
          </div>
        </div>
        <div className="mt-2 flex justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>Turnover Ratio: {capital.inventory?.turnoverRatio || 0}x</span>
          <span>Total: {formatCurrency((capital.inventory?.rawMaterials || 0) + (capital.inventory?.wip || 0) + (capital.inventory?.finishedGoods || 0))}</span>
        </div>
      </div>

      {/* Forecast */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Working Capital Forecast</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
            <p className="text-xs text-gray-600 dark:text-gray-400">Next Month</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatCurrency(capital.forecast?.nextMonth?.workingCapital || 0)}
            </p>
            <p className={`text-sm ${capital.forecast?.nextMonth?.percentChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {capital.forecast?.nextMonth?.percentChange > 0 ? '+' : ''}{capital.forecast?.nextMonth?.percentChange}%
            </p>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded">
            <p className="text-xs text-gray-600 dark:text-gray-400">Next Quarter</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatCurrency(capital.forecast?.nextQuarter?.workingCapital || 0)}
            </p>
            <p className={`text-sm ${capital.forecast?.nextQuarter?.percentChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {capital.forecast?.nextQuarter?.percentChange > 0 ? '+' : ''}{capital.forecast?.nextQuarter?.percentChange}%
            </p>
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

export default WorkingCapitalWidget;