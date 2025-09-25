/**
 * WorkingCapitalDashboard - Enhanced working capital management dashboard
 * Version: 2.0.0 - September 2025 Enhancement
 * Purpose: Comprehensive working capital analytics with real-time optimization
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, RadarChart,
  RadarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import {
  ArrowUpIcon, ArrowDownIcon, ArrowRightIcon,
  ChartBarIcon, CurrencyDollarIcon, CalendarIcon,
  ExclamationTriangleIcon, CheckCircleIcon, InformationCircleIcon,
  AdjustmentsHorizontalIcon, ArrowDownTrayIcon, ArrowsRightLeftIcon,
  BoltIcon, BeakerIcon, LightBulbIcon, ClockIcon
} from '@heroicons/react/24/outline';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/solid';
import CashRunwayEngine from '../services/CashRunwayEngine';
import { format, subDays, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';
import { debounce } from 'lodash';
import toast from 'react-hot-toast';

// Initialize Cash Runway Engine
const cashEngine = new CashRunwayEngine({
  industry: 'manufacturing',
  companySize: 'medium',
  currency: 'USD',
  enableSeasonality: true
});

// Chart color palette
const COLORS = {
  primary: '#3B82F6',
  secondary: '#8B5CF6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#06B6D4',
  gray: '#6B7280'
};

/**
 * KPI Card Component
 */
const KPICard = ({ title, value, change, trend, icon: Icon, color = 'primary' }) => {
  const isPositive = change >= 0;
  const colorClasses = {
    primary: 'bg-blue-50 text-blue-600 border-blue-200',
    success: 'bg-green-50 text-green-600 border-green-200',
    warning: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    danger: 'bg-red-50 text-red-600 border-red-200'
  };

  return (
    <div className={`rounded-lg border p-6 ${colorClasses[color]} bg-opacity-50`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {Icon && <Icon className="h-5 w-5 opacity-70" />}
          <h3 className="text-sm font-medium opacity-80">{title}</h3>
        </div>
        {trend && (
          <span className={`text-xs font-medium flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? <ArrowUpIcon className="h-3 w-3 mr-1" /> : <ArrowDownIcon className="h-3 w-3 mr-1" />}
            {Math.abs(change).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {trend && <div className="text-xs opacity-60 mt-1">{trend}</div>}
    </div>
  );
};

/**
 * Slider Control Component
 */
const SliderControl = ({ label, value, onChange, min = 0, max = 120, unit = 'days', benchmark, color = 'blue' }) => {
  const percentage = ((value - min) / (max - min)) * 100;
  const isOptimal = benchmark && Math.abs(value - benchmark) < 5;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <div className="flex items-center space-x-2">
          <span className="text-lg font-semibold">{value}</span>
          <span className="text-sm text-gray-500">{unit}</span>
          {benchmark && (
            <span className={`text-xs px-2 py-1 rounded ${isOptimal ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
              Target: {benchmark}
            </span>
          )}
        </div>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${COLORS[color]} 0%, ${COLORS[color]} ${percentage}%, #E5E7EB ${percentage}%, #E5E7EB 100%)`
          }}
        />
        {benchmark && (
          <div
            className="absolute top-0 w-0.5 h-2 bg-green-500"
            style={{ left: `${((benchmark - min) / (max - min)) * 100}%` }}
          />
        )}
      </div>
    </div>
  );
};

/**
 * Alert Item Component
 */
const AlertItem = ({ alert, onDismiss }) => {
  const iconMap = {
    CRITICAL: ExclamationTriangleIcon,
    WARNING: ExclamationTriangleIcon,
    CAUTION: InformationCircleIcon,
    INFO: InformationCircleIcon
  };

  const colorMap = {
    CRITICAL: 'bg-red-50 border-red-200 text-red-800',
    WARNING: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    CAUTION: 'bg-blue-50 border-blue-200 text-blue-800',
    INFO: 'bg-gray-50 border-gray-200 text-gray-800'
  };

  const Icon = iconMap[alert.type];

  return (
    <div className={`p-4 border rounded-lg ${colorMap[alert.type]}`}>
      <div className="flex items-start">
        <Icon className="h-5 w-5 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="text-sm font-medium">{alert.message}</h4>
          <p className="text-xs mt-1 opacity-80">{alert.action}</p>
          {alert.metric && (
            <span className="text-xs font-mono mt-2 inline-block bg-white bg-opacity-50 px-2 py-1 rounded">
              {alert.metric}
            </span>
          )}
        </div>
        <button
          onClick={() => onDismiss(alert)}
          className="ml-3 text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>
    </div>
  );
};

/**
 * Main WorkingCapitalDashboard Component
 */
const WorkingCapitalDashboard = () => {
  const queryClient = useQueryClient();

  // State Management
  const [dateRange, setDateRange] = useState({
    start: startOfMonth(subDays(new Date(), 90)),
    end: endOfMonth(new Date())
  });
  const [activeScenario, setActiveScenario] = useState('current');
  const [dso, setDSO] = useState(45);
  const [dpo, setDPO] = useState(30);
  const [dio, setDIO] = useState(60);
  const [optimizationMode, setOptimizationMode] = useState(false);
  const [comparisonPeriod, setComparisonPeriod] = useState('month');
  const [alertsVisible, setAlertsVisible] = useState(true);
  const [selectedChart, setSelectedChart] = useState('trend');

  // Data Fetching
  const { data: metricsData, isLoading: metricsLoading, error: metricsError } = useQuery({
    queryKey: ['workingCapitalMetrics', dateRange],
    queryFn: async () => {
      // Simulated API call - replace with actual API endpoint
      return {
        workingCapital: 2500000,
        cashConversionCycle: dso + dio - dpo,
        quickRatio: 1.35,
        currentRatio: 2.1,
        accountsReceivable: 1800000,
        inventory: 2200000,
        accountsPayable: 1500000,
        revenue: 5000000,
        cogs: 3000000,
        cashBalance: 1000000,
        monthlyBurnRate: 450000,
        monthlyRevenue: 500000
      };
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const { data: historicalData, isLoading: histLoading } = useQuery({
    queryKey: ['historicalWorkingCapital', dateRange],
    queryFn: async () => {
      // Generate mock historical data
      const days = differenceInDays(dateRange.end, dateRange.start);
      const data = [];
      for (let i = 0; i < days; i += 7) {
        const date = new Date(dateRange.start);
        date.setDate(date.getDate() + i);
        data.push({
          date: format(date, 'MMM dd'),
          workingCapital: 2500000 + Math.random() * 500000,
          dso: 45 + Math.random() * 10,
          dpo: 30 + Math.random() * 10,
          dio: 60 + Math.random() * 15,
          ccc: 75 + Math.random() * 20
        });
      }
      return data;
    }
  });

  const { data: benchmarkData } = useQuery({
    queryKey: ['industryBenchmarks'],
    queryFn: async () => {
      return cashEngine.getIndustryBenchmarks('manufacturing', 'medium');
    }
  });

  // Mutations
  const saveScenarioMutation = useMutation({
    mutationFn: async (scenario) => {
      // Simulated API call
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true }), 1000);
      });
    },
    onSuccess: () => {
      toast.success('Scenario saved successfully');
      queryClient.invalidateQueries(['scenarios']);
    }
  });

  // Memoized Calculations
  const calculations = useMemo(() => {
    if (!metricsData) return null;

    const currentCCC = dso + dio - dpo;
    const optimizedDSO = benchmarkData?.dso || 38;
    const optimizedDPO = benchmarkData?.dpo || 40;
    const optimizedDIO = benchmarkData?.dio || 50;
    const optimizedCCC = optimizedDSO + optimizedDIO - optimizedDPO;

    const cashImpact = cashEngine.optimizeWorkingCapital({
      dso,
      dpo,
      dio,
      revenue: metricsData.revenue,
      cogs: metricsData.cogs
    });

    const runway = cashEngine.calculateRunway(
      metricsData.cashBalance,
      metricsData.monthlyBurnRate,
      metricsData.monthlyRevenue
    );

    const coverage = cashEngine.calculateCoverage(
      metricsData.cashBalance,
      {
        payroll: 200000,
        rent: 50000,
        utilities: 20000,
        inventory: 150000,
        marketing: 30000,
        other: 50000
      },
      90
    );

    return {
      currentCCC,
      optimizedCCC,
      cccImprovement: currentCCC - optimizedCCC,
      cashImpact,
      runway,
      coverage,
      workingCapitalChange: ((dso + dio - dpo) - 75) / 75 * 100
    };
  }, [dso, dpo, dio, metricsData, benchmarkData]);

  // Generate alerts
  const alerts = useMemo(() => {
    if (!metricsData || !calculations) return [];

    return cashEngine.generateAlerts({
      cashBalance: metricsData.cashBalance,
      monthlyBurnRate: metricsData.monthlyBurnRate,
      monthlyRevenue: metricsData.monthlyRevenue,
      dso,
      dio,
      dpo
    });
  }, [metricsData, calculations, dso, dio, dpo]);

  // Event Handlers
  const handleDSOChange = useCallback(
    debounce((value) => {
      setDSO(value);
    }, 100),
    []
  );

  const handleDPOChange = useCallback(
    debounce((value) => {
      setDPO(value);
    }, 100),
    []
  );

  const handleDIOChange = useCallback(
    debounce((value) => {
      setDIO(value);
    }, 100),
    []
  );

  const handleOptimize = () => {
    if (benchmarkData) {
      setDSO(benchmarkData.dso);
      setDPO(benchmarkData.dpo);
      setDIO(benchmarkData.dio);
      setOptimizationMode(true);
      toast.success('Optimized to industry best practices');
    }
  };

  const handleReset = () => {
    setDSO(45);
    setDPO(30);
    setDIO(60);
    setOptimizationMode(false);
  };

  const handleSaveScenario = () => {
    const scenario = {
      name: `Scenario - ${format(new Date(), 'MMM dd, yyyy HH:mm')}`,
      dso,
      dpo,
      dio,
      ccc: dso + dio - dpo,
      cashImpact: calculations?.cashImpact?.totalCashImpact || 0
    };
    saveScenarioMutation.mutate(scenario);
  };

  const handleExport = () => {
    const exportData = {
      date: new Date().toISOString(),
      metrics: metricsData,
      settings: { dso, dpo, dio },
      calculations,
      alerts
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `working-capital-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported successfully');
  };

  // Loading state
  if (metricsLoading || histLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Error state
  if (metricsError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900">Error loading data</p>
          <p className="text-sm text-gray-500 mt-2">{metricsError.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Working Capital Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">
                Real-time optimization and analysis • Updated {format(new Date(), 'MMM dd, yyyy HH:mm')}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 mt-4 lg:mt-0">
              <button
                onClick={handleOptimize}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <BoltIcon className="h-4 w-4" />
                <span>Optimize</span>
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center space-x-2"
              >
                <ArrowsRightLeftIcon className="h-4 w-4" />
                <span>Reset</span>
              </button>
              <button
                onClick={handleSaveScenario}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
                disabled={saveScenarioMutation.isPending}
              >
                <BeakerIcon className="h-4 w-4" />
                <span>{saveScenarioMutation.isPending ? 'Saving...' : 'Save Scenario'}</span>
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center space-x-2"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Working Capital"
            value={`$${((metricsData?.workingCapital || 0) / 1000000).toFixed(2)}M`}
            change={calculations?.workingCapitalChange || 0}
            trend="vs last month"
            icon={CurrencyDollarIcon}
            color="primary"
          />
          <KPICard
            title="Cash Conversion Cycle"
            value={`${calculations?.currentCCC || 0} days`}
            change={calculations?.cccImprovement || 0}
            trend={`Target: ${calculations?.optimizedCCC || 0} days`}
            icon={ClockIcon}
            color={calculations?.currentCCC > 90 ? 'warning' : 'success'}
          />
          <KPICard
            title="Quick Ratio"
            value={(metricsData?.quickRatio || 0).toFixed(2)}
            change={5.2}
            trend="Industry avg: 1.2"
            icon={ChartBarIcon}
            color={metricsData?.quickRatio >= 1 ? 'success' : 'danger'}
          />
          <KPICard
            title="Cash Runway"
            value={`${calculations?.runway?.runwayMonths || 0} months`}
            change={0}
            trend={calculations?.runway?.recommendation || ''}
            icon={CalendarIcon}
            color={calculations?.runway?.runway > 12 ? 'success' : calculations?.runway?.runway > 6 ? 'warning' : 'danger'}
          />
        </div>

        {/* Interactive Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-6 flex items-center">
            <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
            Interactive Working Capital Optimization
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <SliderControl
              label="Days Sales Outstanding (DSO)"
              value={dso}
              onChange={handleDSOChange}
              min={0}
              max={120}
              benchmark={benchmarkData?.dso}
              color="primary"
            />
            <SliderControl
              label="Days Payables Outstanding (DPO)"
              value={dpo}
              onChange={handleDPOChange}
              min={0}
              max={120}
              benchmark={benchmarkData?.dpo}
              color="secondary"
            />
            <SliderControl
              label="Days Inventory Outstanding (DIO)"
              value={dio}
              onChange={handleDIOChange}
              min={0}
              max={180}
              benchmark={benchmarkData?.dio}
              color="warning"
            />
          </div>

          {/* Impact Analysis */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Cash Impact</p>
                <p className="text-xl font-bold text-blue-600">
                  ${((calculations?.cashImpact?.totalCashImpact || 0) / 1000000).toFixed(2)}M
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">CCC Improvement</p>
                <p className="text-xl font-bold text-green-600">
                  {calculations?.cccImprovement || 0} days
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Expected ROI</p>
                <p className="text-xl font-bold text-purple-600">
                  {calculations?.cashImpact?.expectedROI?.toFixed(1) || 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">Analytics & Trends</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedChart('trend')}
                className={`px-3 py-1 rounded ${selectedChart === 'trend' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}
              >
                Trend
              </button>
              <button
                onClick={() => setSelectedChart('breakdown')}
                className={`px-3 py-1 rounded ${selectedChart === 'breakdown' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}
              >
                Breakdown
              </button>
              <button
                onClick={() => setSelectedChart('comparison')}
                className={`px-3 py-1 rounded ${selectedChart === 'comparison' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}
              >
                Comparison
              </button>
            </div>
          </div>

          {selectedChart === 'trend' && historicalData && (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" orientation="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="workingCapital"
                  stroke={COLORS.primary}
                  name="Working Capital ($)"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="ccc"
                  stroke={COLORS.secondary}
                  name="CCC (days)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          )}

          {selectedChart === 'breakdown' && (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[
                  { name: 'Accounts Receivable', value: metricsData?.accountsReceivable / 1000000, color: COLORS.primary },
                  { name: 'Inventory', value: metricsData?.inventory / 1000000, color: COLORS.warning },
                  { name: 'Accounts Payable', value: -(metricsData?.accountsPayable / 1000000), color: COLORS.danger }
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `$${Math.abs(value).toFixed(2)}M`} />
                <Bar dataKey="value" fill={(entry) => entry.color}>
                  {[COLORS.primary, COLORS.warning, COLORS.danger].map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          {selectedChart === 'comparison' && benchmarkData && (
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart
                data={[
                  { metric: 'DSO', current: dso, benchmark: benchmarkData.dso },
                  { metric: 'DPO', current: dpo, benchmark: benchmarkData.dpo },
                  { metric: 'DIO', current: dio, benchmark: benchmarkData.dio },
                  { metric: 'Quick Ratio', current: metricsData?.quickRatio * 40, benchmark: benchmarkData.quickRatio * 40 },
                  { metric: 'Current Ratio', current: metricsData?.currentRatio * 30, benchmark: benchmarkData.currentRatio * 30 }
                ]}
              >
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <PolarRadiusAxis />
                <Radar name="Current" dataKey="current" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.6} />
                <Radar name="Benchmark" dataKey="benchmark" stroke={COLORS.success} fill={COLORS.success} fillOpacity={0.6} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Optimization Scenarios */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold mb-4">Current State</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">DSO</span>
                <span className="font-medium">{dso} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">DPO</span>
                <span className="font-medium">{dpo} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">DIO</span>
                <span className="font-medium">{dio} days</span>
              </div>
              <div className="pt-3 border-t">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">CCC</span>
                  <span className="font-bold">{calculations?.currentCCC} days</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold mb-4">Optimized State</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">DSO</span>
                <span className="font-medium text-green-600">{benchmarkData?.dso} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">DPO</span>
                <span className="font-medium text-green-600">{benchmarkData?.dpo} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">DIO</span>
                <span className="font-medium text-green-600">{benchmarkData?.dio} days</span>
              </div>
              <div className="pt-3 border-t">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">CCC</span>
                  <span className="font-bold text-green-600">{calculations?.optimizedCCC} days</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold mb-4">Action Items</h3>
            <div className="space-y-2">
              {calculations?.cashImpact?.prioritizedActions?.map((action, index) => (
                <div key={index} className="flex items-start">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{action.metric} Optimization</p>
                    <p className="text-xs text-gray-500">Impact: ${(action.impact / 1000000).toFixed(2)}M</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alerts & Recommendations */}
        {alertsVisible && alerts.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-yellow-500" />
                Alerts & Recommendations
              </h2>
              <button
                onClick={() => setAlertsVisible(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Hide
              </button>
            </div>
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <AlertItem
                  key={index}
                  alert={alert}
                  onDismiss={() => {
                    // Handle alert dismissal
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Industry Benchmarks Table */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Industry Benchmarks</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Metric
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Your Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Industry Avg
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Percentile
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    DSO
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {dso} days
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {benchmarkData?.dso} days
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {dso <= benchmarkData?.dso ? 'Top 25%' : 'Bottom 50%'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      dso <= benchmarkData?.dso ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {dso <= benchmarkData?.dso ? 'Good' : 'Needs Improvement'}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    DPO
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {dpo} days
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {benchmarkData?.dpo} days
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {dpo >= benchmarkData?.dpo ? 'Top 25%' : 'Bottom 50%'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      dpo >= benchmarkData?.dpo ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {dpo >= benchmarkData?.dpo ? 'Good' : 'Fair'}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    DIO
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {dio} days
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {benchmarkData?.dio} days
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {dio <= benchmarkData?.dio ? 'Top 25%' : 'Bottom 50%'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      dio <= benchmarkData?.dio ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {dio <= benchmarkData?.dio ? 'Good' : 'Needs Improvement'}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkingCapitalDashboard;