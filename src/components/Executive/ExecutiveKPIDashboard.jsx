import React, { useState, useEffect } from 'react';
import {
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  ClockIcon,
  CogIcon,
  UserGroupIcon,
  TruckIcon,
  BeakerIcon,
  CalendarDaysIcon,
  PresentationChartLineIcon,
  DocumentChartBarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import ChartErrorBoundary from '../charts/ChartErrorBoundary';

export default function ExecutiveKPIDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const kpiData = {
    financial: {
      revenue: { value: 4250000, change: 12.5, target: 4000000 },
      profit: { value: 890000, change: 8.7, target: 850000 },
      cashFlow: { value: 1240000, change: -2.3, target: 1300000 },
      workingCapital: { value: 2850000, change: 5.4, target: 2700000 }
    },
    operational: {
      production: { value: 2847, change: 6.2, target: 2800, unit: 'units' },
      efficiency: { value: 94.2, change: 1.8, target: 95, unit: '%' },
      quality: { value: 99.2, change: 0.5, target: 99.5, unit: '%' },
      onTimeDelivery: { value: 97.8, change: 2.1, target: 98, unit: '%' }
    },
    workforce: {
      headcount: { value: 187, change: 3.2, target: 185, unit: 'employees' },
      productivity: { value: 15.2, change: 4.7, target: 15, unit: 'units/hr' },
      safety: { value: 0, change: -100, target: 0, unit: 'incidents' },
      retention: { value: 94.5, change: 1.2, target: 95, unit: '%' }
    }
  };

  const executiveSummary = [
    {
      title: 'Revenue Growth',
      status: 'excellent',
      summary: '12.5% above target, driven by increased demand and new product launches.',
      action: 'Maintain momentum with Q4 expansion plans.'
    },
    {
      title: 'Operational Efficiency',
      status: 'good',
      summary: 'Production slightly below target but quality metrics exceeding expectations.',
      action: 'Focus on optimizing Line 3 to meet production targets.'
    },
    {
      title: 'Cash Flow',
      status: 'warning',
      summary: 'Slight decline due to increased inventory investment for Q4 demand.',
      action: 'Monitor AR collection and optimize inventory levels.'
    },
    {
      title: 'Workforce Metrics',
      status: 'excellent',
      summary: 'Strong productivity gains and excellent safety record maintained.',
      action: 'Continue investing in employee development programs.'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'warning': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-100 border-red-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getChangeIcon = (change) => {
    if (change > 0) return <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />;
    if (change < 0) return <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />;
    return <div className="w-4 h-4"></div>;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value, unit = '') => {
    const formatted = new Intl.NumberFormat('en-US').format(value);
    return unit ? `${formatted} ${unit}` : formatted;
  };

  const renderKPICard = (title, data, icon, isCurrency = false) => {
    const isPositive = data.change >= 0;
    const progressPercentage = (data.value / data.target) * 100;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            {icon}
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h3>
          </div>
          <div className="flex items-center space-x-1">
            {getChangeIcon(data.change)}
            <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '+' : ''}{data.change.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="mb-3">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {isCurrency ? formatCurrency(data.value) : formatNumber(data.value, data.unit)}
          </p>
          <p className="text-sm text-gray-500">
            Target: {isCurrency ? formatCurrency(data.target) : formatNumber(data.target, data.unit)}
          </p>
        </div>

        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              progressPercentage >= 100 ? 'bg-green-500' :
              progressPercentage >= 90 ? 'bg-blue-500' :
              progressPercentage >= 75 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(100, progressPercentage)}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {progressPercentage.toFixed(1)}% of target
        </p>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <PresentationChartLineIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Executive KPI Dashboard
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Key performance indicators and business metrics
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
            <div className="text-right">
              <p className="text-sm text-gray-500">Last updated</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {lastUpdate.toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Financial KPIs */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <BanknotesIcon className="w-5 h-5 text-green-600" />
            <span>Financial Performance</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {renderKPICard('Revenue', kpiData.financial.revenue, <BanknotesIcon className="w-5 h-5 text-green-600" />, true)}
            {renderKPICard('Profit', kpiData.financial.profit, <ArrowTrendingUpIcon className="w-5 h-5 text-blue-600" />, true)}
            {renderKPICard('Cash Flow', kpiData.financial.cashFlow, <BanknotesIcon className="w-5 h-5 text-purple-600" />, true)}
            {renderKPICard('Working Capital', kpiData.financial.workingCapital, <ChartBarIcon className="w-5 h-5 text-orange-600" />, true)}
          </div>
        </div>

        {/* Operational KPIs */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <CogIcon className="w-5 h-5 text-blue-600" />
            <span>Operational Excellence</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {renderKPICard('Production Output', kpiData.operational.production, <TruckIcon className="w-5 h-5 text-blue-600" />)}
            {renderKPICard('Efficiency', kpiData.operational.efficiency, <CogIcon className="w-5 h-5 text-green-600" />)}
            {renderKPICard('Quality Rate', kpiData.operational.quality, <BeakerIcon className="w-5 h-5 text-purple-600" />)}
            {renderKPICard('On-Time Delivery', kpiData.operational.onTimeDelivery, <ClockIcon className="w-5 h-5 text-orange-600" />)}
          </div>
        </div>

        {/* Workforce KPIs */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <UserGroupIcon className="w-5 h-5 text-purple-600" />
            <span>Workforce Metrics</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {renderKPICard('Headcount', kpiData.workforce.headcount, <UserGroupIcon className="w-5 h-5 text-purple-600" />)}
            {renderKPICard('Productivity', kpiData.workforce.productivity, <ArrowTrendingUpIcon className="w-5 h-5 text-green-600" />)}
            {renderKPICard('Safety Incidents', kpiData.workforce.safety, <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />)}
            {renderKPICard('Retention Rate', kpiData.workforce.retention, <UserGroupIcon className="w-5 h-5 text-blue-600" />)}
          </div>
        </div>

        {/* Executive Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
              <DocumentChartBarIcon className="w-5 h-5 text-gray-600" />
              <span>Executive Summary</span>
            </h3>
            <div className="space-y-4">
              {executiveSummary.map((item, __index) => (
                <div key={index} className={`border rounded-lg p-4 ${getStatusColor(item.status)}`}>
                  <h4 className="font-semibold mb-2">{item.title}</h4>
                  <p className="text-sm mb-2">{item.summary}</p>
                  <p className="text-sm font-medium">Action: {item.action}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Trends Chart */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
              <ChartBarIcon className="w-5 h-5 text-gray-600" />
              <span>Performance Trends</span>
            </h3>
            <ChartErrorBoundary title="Performance Trends Chart Error">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <div className="h-64 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-600 dark:to-gray-500 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Executive performance trends chart</p>
                    <p className="text-sm text-gray-400 mt-1">Revenue, profit, and operational metrics</p>
                  </div>
                </div>
              </div>
            </ChartErrorBoundary>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Executive Actions
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Financial Report', icon: BanknotesIcon, color: 'green' },
              { label: 'Board Presentation', icon: PresentationChartLineIcon, color: 'blue' },
              { label: 'Quarterly Review', icon: CalendarDaysIcon, color: 'purple' },
              { label: 'Strategic Planning', icon: DocumentChartBarIcon, color: 'orange' }
            ].map((action, __index) => (
              <button
                key={index}
                className={`flex items-center justify-center space-x-2 p-3 rounded-lg border-2 border-dashed border-${action.color}-200 hover:border-${action.color}-400 hover:bg-${action.color}-50 dark:hover:bg-${action.color}-900/20 transition-all duration-200`}
              >
                <action.icon className={`w-5 h-5 text-${action.color}-600`} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}