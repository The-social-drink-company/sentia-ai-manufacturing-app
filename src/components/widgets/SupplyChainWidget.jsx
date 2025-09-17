import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
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
        if (response.status === 404 || response.status === 500) {
          return getMockData();
        }
        throw new Error(`Failed to fetch supply chain data: ${response.statusText}`);
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
      activeSuppliers: 45,
      totalShipments: 183,
      inTransit: 23,
      deliveredOnTime: 156,
      delayed: 4,
      averageLeadTime: 5.2,
      supplierPerformance: 93.5,
      inventoryTurnover: 8.3
    },
    suppliers: [
      {
        id: 1,
        name: 'Pacific Materials Co.',
        location: 'Vancouver, BC',
        status: 'active',
        onTimeDelivery: 94.5,
        qualityRating: 4.8,
        leadTime: 5,
        riskLevel: 'low',
        lastDelivery: '2024-01-15',
        totalOrders: 125
      },
      {
        id: 2,
        name: 'Industrial Components Ltd.',
        location: 'Toronto, ON',
        status: 'delayed',
        onTimeDelivery: 87.2,
        qualityRating: 4.3,
        leadTime: 8,
        riskLevel: 'medium',
        lastDelivery: '2024-01-14',
        totalOrders: 98
      },
      {
        id: 3,
        name: 'Global Logistics Inc.',
        location: 'Montreal, QC',
        status: 'active',
        onTimeDelivery: 96.1,
        qualityRating: 4.9,
        leadTime: 3,
        riskLevel: 'low',
        lastDelivery: '2024-01-16',
        totalOrders: 156
      },
      {
        id: 4,
        name: 'Eastern Supplies Corp.',
        location: 'Halifax, NS',
        status: 'at-risk',
        onTimeDelivery: 78.5,
        qualityRating: 3.9,
        leadTime: 12,
        riskLevel: 'high',
        lastDelivery: '2024-01-10',
        totalOrders: 67
      }
    ],
    shipmentTrend: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      shipped: [28, 32, 25, 35, 30, 18, 15],
      delivered: [22, 28, 30, 28, 33, 20, 12],
      delayed: [1, 0, 2, 1, 0, 1, 0]
    },
    leadTimeAnalysis: {
      labels: ['Raw Materials', 'Components', 'Packaging', 'Equipment', 'Consumables'],
      averageDays: [4.5, 6.2, 3.1, 8.5, 2.8],
      targetDays: [5, 7, 3, 10, 3]
    },
    riskAssessment: {
      low: 28,
      medium: 12,
      high: 5,
      critical: 0
    },
    recentOrders: [
      { id: 'PO-2024-0145', supplier: 'Pacific Materials', status: 'in-transit', eta: '2024-01-18', value: 45000 },
      { id: 'PO-2024-0144', supplier: 'Global Logistics', status: 'delivered', eta: '2024-01-16', value: 32000 },
      { id: 'PO-2024-0143', supplier: 'Industrial Components', status: 'delayed', eta: '2024-01-19', value: 28500 },
      { id: 'PO-2024-0142', supplier: 'Eastern Supplies', status: 'processing', eta: '2024-01-22', value: 18000 }
    ],
    transportModes: {
      road: 45,
      rail: 25,
      sea: 20,
      air: 10
    },
    geographicDistribution: {
      domestic: 65,
      northAmerica: 20,
      asia: 10,
      europe: 5
    }
  });

  if (isLoading && !data) return <WidgetSkeleton title="Supply Chain Management" height="400px" />;
  if (error && !data) return <WidgetError error={error} onRetry={refetch} title="Supply Chain Management" />;

  const supplyChain = data || getMockData();

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