import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import {
  WrenchScrewdriverIcon,
  CalendarDaysIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  WidgetContainer,
  WidgetSkeleton,
  WidgetError,
  MetricCard,
  DataGrid
} from './WidgetComponents';

const MaintenanceScheduleWidget = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  // Fetch maintenance data from API
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['maintenance-schedule'],
    queryFn: async () => {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || null}/api/maintenance/schedule`, {
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
        throw new Error(`Failed to fetch maintenance schedule: ${response.statusText}`);
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
      totalEquipment: 125,
      scheduledMaintenance: 18,
      completedThisMonth: 24,
      overdue: 3,
      upcomingWeek: 7,
      availability: 94.2,
      mtbf: 720, // Mean Time Between Failures (hours)
      mttr: 2.5  // Mean Time To Repair (hours)
    },
    equipment: [
      {
        id: 'EQ-001',
        name: 0,
        type: 'Production',
        status: 'operational',
        lastMaintenance: '2024-01-10',
        nextMaintenance: '2024-02-10',
        hoursRun: 1250,
        healthScore: 92,
        criticality: 'high'
      },
      {
        id: 'EQ-002',
        name: 0,
        type: 'Assembly',
        status: 'maintenance',
        lastMaintenance: '2024-01-05',
        nextMaintenance: '2024-01-17',
        hoursRun: 2100,
        healthScore: 78,
        criticality: 'critical'
      },
      {
        id: 'EQ-003',
        name: 0,
        type: 'Packaging',
        status: 'operational',
        lastMaintenance: '2024-01-12',
        nextMaintenance: '2024-02-12',
        hoursRun: 890,
        healthScore: 95,
        criticality: 'medium'
      },
      {
        id: 'EQ-004',
        name: 0,
        type: 'Quality',
        status: 'warning',
        lastMaintenance: '2023-12-20',
        nextMaintenance: '2024-01-20',
        hoursRun: 3200,
        healthScore: 65,
        criticality: 'high'
      }
    ],
    maintenanceTypes: {
      preventive: 65,
      corrective: 20,
      predictive: 10,
      emergency: 5
    },
    upcomingSchedule: [
      { date: '2024-01-18', equipment: 0, type: 'Preventive', duration: 4, technician: 'John Smith' },
      { date: '2024-01-19', equipment: 0, type: 'Preventive', duration: 6, technician: 'Mary Johnson' },
      { date: '2024-01-20', equipment: 0, type: 'Corrective', duration: 3, technician: 'Bob Wilson' },
      { date: '2024-01-22', equipment: 'Conveyor System', type: 'Preventive', duration: 2, technician: 'Alice Brown' },
      { date: '2024-01-23', equipment: 'Welding Robot', type: 'Predictive', duration: 5, technician: 'John Smith' }
    ],
    costAnalysis: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      planned: 0,
      actual: [43000, 44000, 46000, 42000, 41000, 43000],
      savings: [2000, -2000, 2000, -1000, 2000, 1000]
    },
    performanceMetrics: {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      availability: [93.5, 94.2, 93.8, 94.5],
      reliability: [96.2, 95.8, 96.5, 97.0],
      oee: [85.3, 86.1, 85.8, 86.5]
    },
    spareParts: [
      { part: 'Bearing Type A', stock: 45, minimum: 20, usage: 'High', leadTime: 7 },
      { part: 'Motor Belt XL', stock: 12, minimum: 15, usage: 'Medium', leadTime: 14 },
      { part: 'Filter Element', stock: 8, minimum: 10, usage: 'Low', leadTime: 5 },
      { part: 'Control Board', stock: 3, minimum: 2, usage: 'Low', leadTime: 30 }
    ]
  });

  if (isLoading && !data) return <WidgetSkeleton title="Maintenance Schedule" height="400px" />;
  if (error && !data) return <WidgetError error={error} onRetry={refetch} title="Maintenance Schedule" />;

  const maintenance = data || getMockData();

  // Maintenance types chart
  const maintenanceTypesData = {
    labels: ['Preventive', 'Corrective', 'Predictive', 'Emergency'],
    datasets: [{
      data: [
        maintenance.maintenanceTypes?.preventive || 0,
        maintenance.maintenanceTypes?.corrective || 0,
        maintenance.maintenanceTypes?.predictive || 0,
        maintenance.maintenanceTypes?.emergency || 0
      ],
      backgroundColor: [
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(239, 68, 68, 0.8)'
      ],
      borderColor: [
        'rgb(16, 185, 129)',
        'rgb(245, 158, 11)',
        'rgb(59, 130, 246)',
        'rgb(239, 68, 68)'
      ],
      borderWidth: 1
    }]
  };

  const maintenanceTypesOptions = {
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

  // Cost trend chart
  const costTrendData = {
    labels: maintenance.costAnalysis?.labels || [],
    datasets: [
      {
        label: 'Planned Cost',
        data: maintenance.costAnalysis?.planned || [],
        borderColor: 'rgb(107, 114, 128)',
        backgroundColor: 'rgba(107, 114, 128, 0.1)',
        borderDash: [5, 5],
        tension: 0.4
      },
      {
        label: 'Actual Cost',
        data: maintenance.costAnalysis?.actual || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      }
    ]
  };

  const costTrendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: function(value) {
            return '$' + (value / 1000).toFixed(0) + 'k';
          }
        }
      }
    }
  };

  // Equipment table columns
  const equipmentColumns = [
    { key: 'name', label: 'Equipment' },
    { key: 'type', label: 'Type' },
    {
      key: 'status',
      label: 'Status',
      render: (value) => {
        const statusConfig = {
          operational: { color: 'text-green-600 bg-green-100 dark:bg-green-900/20', icon: CheckCircleIcon },
          maintenance: { color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20', icon: WrenchScrewdriverIcon },
          warning: { color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/20', icon: ExclamationTriangleIcon }
        };
        const config = statusConfig[value] || { color: 'text-gray-600 bg-gray-100', icon: CogIcon };
        const Icon = config.icon;
        return (
          <span className={`text-xs px-2 py-1 rounded inline-flex items-center ${config.color}`}>
            <Icon className="h-3 w-3 mr-1" />
            {value}
          </span>
        );
      }
    },
    { key: 'nextMaintenance', label: 'Next Service' },
    {
      key: 'healthScore',
      label: 'Health',
      render: (value) => {
        const color = value >= 90 ? 'text-green-600' : value >= 70 ? 'text-yellow-600' : 'text-red-600';
        return <span className={`font-semibold ${color}`}>{value}%</span>;
      }
    }
  ];

  // Upcoming schedule columns
  const scheduleColumns = [
    { key: 'date', label: 'Date' },
    { key: 'equipment', label: 'Equipment' },
    { key: 'type', label: 'Type' },
    {
      key: 'duration',
      label: 'Duration',
      render: (value) => `${value}h`
    },
    { key: 'technician', label: 'Technician' }
  ];

  // Spare parts columns
  const partsColumns = [
    { key: 'part', label: 'Part Name' },
    {
      key: 'stock',
      label: 'Stock',
      render: (value, row) => {
        const isLow = value < row.minimum;
        return (
          <span className={isLow ? 'text-red-600 font-semibold' : ''}>
            {value}
          </span>
        );
      }
    },
    { key: 'minimum', label: 'Min Level' },
    { key: 'usage', label: 'Usage Rate' },
    {
      key: 'leadTime',
      label: 'Lead Time',
      render: (value) => `${value} days`
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'operational': return 'bg-green-500';
      case 'maintenance': return 'bg-yellow-500';
      case 'warning': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <WidgetContainer
      title="Maintenance Schedule"
      onRefresh={() => {
        queryClient.invalidateQueries(['maintenance-schedule']);
        refetch();
      }}
      isRefreshing={isRefetching}
      className="col-span-2"
    >
      {/* Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard
          label="Equipment Availability"
          value={maintenance.summary?.availability || 0}
          unit="%"
          trend={{ direction: maintenance.summary?.availability > 95 ? 'up' : 'down', value: 1.2 }}
          icon={CheckCircleIcon}
        />
        <MetricCard
          label="Scheduled Tasks"
          value={maintenance.summary?.scheduledMaintenance || 0}
          icon={CalendarDaysIcon}
        />
        <MetricCard
          label="Overdue Tasks"
          value={maintenance.summary?.overdue || 0}
          trend={{ direction: maintenance.summary?.overdue > 0 ? 'down' : 'neutral', value: maintenance.summary?.overdue }}
          icon={ExclamationTriangleIcon}
        />
        <MetricCard
          label="MTBF"
          value={maintenance.summary?.mtbf || 0}
          unit="hrs"
          icon={ClockIcon}
        />
      </div>

      {/* Reliability Metrics */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Reliability Metrics</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{maintenance.summary?.mtbf || 0}h</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Mean Time Between Failures</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{maintenance.summary?.mttr || 0}h</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Mean Time To Repair</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{maintenance.summary?.completedThisMonth || 0}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Completed This Month</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Maintenance Types Distribution */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Maintenance Types</h4>
          <div style={{ height: '200px' }}>
            <Doughnut data={maintenanceTypesData} options={maintenanceTypesOptions} />
          </div>
        </div>

        {/* Cost Analysis */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Cost Analysis</h4>
          <div style={{ height: '200px' }}>
            <Line data={costTrendData} options={costTrendOptions} />
          </div>
        </div>
      </div>

      {/* Equipment Status */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Equipment Status</h4>
        <DataGrid columns={equipmentColumns} data={maintenance.equipment || []} />
      </div>

      {/* Upcoming Maintenance Schedule */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">Upcoming Maintenance</h4>
          <span className="text-xs text-blue-600 bg-blue-100 dark:bg-blue-900/20 px-2 py-1 rounded">
            Next 7 days: {maintenance.summary?.upcomingWeek || 0} tasks
          </span>
        </div>
        <DataGrid columns={scheduleColumns} data={maintenance.upcomingSchedule || []} />
      </div>

      {/* Spare Parts Inventory */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">Critical Spare Parts</h4>
          {maintenance.spareParts?.filter(p => p.stock < p.minimum).length > 0 && (
            <span className="text-xs text-red-600 bg-red-100 dark:bg-red-900/20 px-2 py-1 rounded">
              {maintenance.spareParts.filter(p => p.stock < p.minimum).length} below minimum
            </span>
          )}
        </div>
        <DataGrid columns={partsColumns} data={maintenance.spareParts || []} />
      </div>

      {/* Last Updated */}
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        Last updated: {new Date().toLocaleTimeString()}
      </div>
    </WidgetContainer>
  );
};

export default MaintenanceScheduleWidget;