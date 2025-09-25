import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  TruckIcon,
  MapPinIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  GlobeAltIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { Bar, Line } from 'react-chartjs-2';
import {
  WidgetContainer,
  WidgetSkeleton,
  WidgetError,
  MetricCard,
  DataGrid
} from './WidgetComponents';

const SupplyChainWidget = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  // Fetch supply chain data from API
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['supply-chain'],
    queryFn: async () => {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/supply-chain/overview`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        // Fallback to mock data if API fails
        
        throw new Error(`Failed to fetch supply chain data: ${response.statusText}`);
      }

      return response.json();
    },
    refetchInterval: 60000, // Refresh every minute
    retry: 2,
    retryDelay: 1000
  });

    if (isLoading) return <WidgetSkeleton title="Supply Chain Management" height="400px" />;
  if (error) return <WidgetError error={error} onRetry={refetch} title={title} />;
  if (!data) return <WidgetError error={{ message: 'No data available. Please connect to real data source.' }} onRetry={refetch} title={title} />;

  const widgetData = data;

  // Shipment trend chart configuration
  const shipmentTrendData = {
    labels: supplyChain.shipmentTrend?.labels || [],
    datasets: [
      {
        label: 'Shipped',
        data: supplyChain.shipmentTrend?.shipped || [],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1
      },
      {
        label: 'Delivered',
        data: supplyChain.shipmentTrend?.delivered || [],
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1
      },
      {
        label: 'Delayed',
        data: supplyChain.shipmentTrend?.delayed || [],
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 1
      }
    ]
  };

  const shipmentTrendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        stacked: false
      }
    }
  };

  // Lead time analysis chart
  const leadTimeData = {
    labels: supplyChain.leadTimeAnalysis?.labels || [],
    datasets: [
      {
        label: 'Average Lead Time',
        data: supplyChain.leadTimeAnalysis?.averageDays || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      },
      {
        label: 'Target Lead Time',
        data: supplyChain.leadTimeAnalysis?.targetDays || [],
        borderColor: 'rgb(107, 114, 128)',
        backgroundColor: 'rgba(107, 114, 128, 0.1)',
        borderDash: [5, 5],
        tension: 0.4
      }
    ]
  };

  const leadTimeOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return value + ' days';
          }
        }
      }
    }
  };

  // Supplier table columns
  const supplierColumns = [
    { key: 'name', label: 'Supplier' },
    { key: 'location', label: 'Location' },
    {
      key: 'status',
      label: 'Status',
      render: (value) => {
        const statusColors = {
          active: 'text-green-600 bg-green-100 dark:bg-green-900/20',
          delayed: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20',
          'at-risk': 'text-red-600 bg-red-100 dark:bg-red-900/20'
        };
        return (
          <span className={`text-xs px-2 py-1 rounded ${statusColors[value] || 'text-gray-600 bg-gray-100'}`}>
            {value}
          </span>
        );
      }
    },
    {
      key: 'onTimeDelivery',
      label: 'On-Time %',
      render: (value) => `${value}%`
    },
    {
      key: 'leadTime',
      label: 'Lead Time',
      render: (value) => `${value} days`
    },
    {
      key: 'riskLevel',
      label: 'Risk',
      render: (value) => {
        const riskColors = {
          low: 'text-green-600',
          medium: 'text-yellow-600',
          high: 'text-red-600'
        };
        return <span className={riskColors[value] || 'text-gray-600'}>{value}</span>;
      }
    }
  ];

  // Recent orders columns
  const orderColumns = [
    { key: 'id', label: 'Order ID' },
    { key: 'supplier', label: 'Supplier' },
    {
      key: 'status',
      label: 'Status',
      render: (value) => {
        const statusIcons = {
          'in-transit': TruckIcon,
          'delivered': CheckCircleIcon,
          'delayed': ExclamationTriangleIcon,
          'processing': ClockIcon
        };
        const Icon = statusIcons[value] || ClockIcon;
        return (
          <div className="flex items-center space-x-1">
            <Icon className="h-4 w-4" />
            <span className="text-sm">{value}</span>
          </div>
        );
      }
    },
    { key: 'eta', label: 'ETA' },
    {
      key: 'value',
      label: 'Value',
      render: (value) => `$${(value / 1000).toFixed(0)}k`
    }
  ];

  const getRiskColor = (level) => {
    const colors = {
      low: 'bg-green-500',
      medium: 'bg-yellow-500',
      high: 'bg-orange-500',
      critical: 'bg-red-500'
    };
    return colors[level] || 'bg-gray-500';
  };

  return (
    <WidgetContainer
      title="Supply Chain Management"
      onRefresh={() => {
        queryClient.invalidateQueries(['supply-chain']);
        refetch();
      }}
      isRefreshing={isRefetching}
      className="col-span-2"
    >
      {/* Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard
          label="Active Suppliers"
          value={supplyChain.summary?.activeSuppliers || 0}
          icon={BuildingOfficeIcon}
        />
        <MetricCard
          label="In Transit"
          value={supplyChain.summary?.inTransit || 0}
          trend={{ direction: 'neutral', value: 0 }}
          icon={TruckIcon}
        />
        <MetricCard
          label="On-Time Delivery"
          value={supplyChain.summary?.supplierPerformance || 0}
          unit="%"
          trend={{ direction: supplyChain.summary?.supplierPerformance > 90 ? 'up' : 'down', value: 2.1 }}
          icon={CheckCircleIcon}
        />
        <MetricCard
          label="Avg Lead Time"
          value={supplyChain.summary?.averageLeadTime || 0}
          unit="days"
          icon={ClockIcon}
        />
      </div>

      {/* Risk Assessment */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Supplier Risk Assessment</h4>
        <div className="flex items-center space-x-4">
          {Object.entries(supplyChain.riskAssessment || {}).map(([level, count]) => (
            <div key={level} className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getRiskColor(level)}`}></div>
              <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{level}:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Shipment Trend */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Weekly Shipment Activity</h4>
          <div style={{ height: '200px' }}>
            <Bar data={shipmentTrendData} options={shipmentTrendOptions} />
          </div>
        </div>

        {/* Lead Time Analysis */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Lead Time Analysis</h4>
          <div style={{ height: '200px' }}>
            <Line data={leadTimeData} options={leadTimeOptions} />
          </div>
        </div>
      </div>

      {/* Supplier Performance Table */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Top Suppliers</h4>
        <DataGrid columns={supplierColumns} data={supplyChain.suppliers?.slice(0, 5) || []} />
      </div>

      {/* Transport & Geographic Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Transport Modes */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Transport Modes</h4>
          <div className="space-y-2">
            {Object.entries(supplyChain.transportModes || {}).map(([mode, percentage]) => (
              <div key={mode} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{mode}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white w-10 text-right">
                    {percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Geographic Distribution */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Geographic Distribution</h4>
          <div className="space-y-2">
            {Object.entries(supplyChain.geographicDistribution || {}).map(([region, percentage]) => (
              <div key={region} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{region.replace(/([A-Z])/g, ' $1').trim()}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white w-10 text-right">
                    {percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Recent Orders</h4>
        <DataGrid columns={orderColumns} data={supplyChain.recentOrders || []} />
      </div>

      {/* Last Updated */}
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        Last updated: {new Date().toLocaleTimeString()}
      </div>
    </WidgetContainer>
  );
};

export default SupplyChainWidget;
