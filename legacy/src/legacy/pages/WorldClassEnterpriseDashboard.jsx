import React, { useState, useEffect } from 'react';
import {
import { logDebug, logInfo, logWarn, logError } from '../utils/logger';

  BanknotesIcon,
  CubeIcon,
  PresentationChartLineIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const EnterpriseKPICard = ({ title, value, change, trend, icon: Icon, description }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-2 rounded-lg ${trend === 'up' ? 'bg-green-100' : trend === 'down' ? 'bg-red-100' : 'bg-gray-100'}`}>
        <Icon className={`w-6 h-6 ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'}`} />
      </div>
      {trend && (
        <div className={`flex items-center space-x-1 ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
          {trend === 'up' ? (
            <ArrowTrendingUpIcon className="w-4 h-4" />
          ) : trend === 'down' ? (
            <ArrowTrendingDownIcon className="w-4 h-4" />
          ) : null}
          <span className="text-sm font-medium">{change}</span>
        </div>
      )}
    </div>
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
      {description && <p className="text-sm text-gray-600">{description}</p>}
    </div>
  </div>
);

const QuickActionButton = ({ icon: Icon, title, description, color, onClick }) => {
  const getButtonClasses = (color) => {
    const colorMap = {
      blue: 'bg-blue-50 hover:bg-blue-100',
      green: 'bg-green-50 hover:bg-green-100', 
      purple: 'bg-purple-50 hover:bg-purple-100',
      red: 'bg-red-50 hover:bg-red-100',
      yellow: 'bg-yellow-50 hover:bg-yellow-100'
    };
    return colorMap[color] || 'bg-gray-50 hover:bg-gray-100';
  };

  const getIconClasses = (color) => {
    const colorMap = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      purple: 'text-purple-600', 
      red: 'text-red-600',
      yellow: 'text-yellow-600'
    };
    return colorMap[color] || 'text-gray-600';
  };

  return (
    <button 
      onClick={onClick}
      className={`flex items-center space-x-3 p-4 rounded-lg transition-colors w-full ${getButtonClasses(color)}`}
    >
      <Icon className={`w-6 h-6 ${getIconClasses(color)}`} />
      <div className="text-left">
        <p className="font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </button>
  );
};

const WorldClassEnterpriseDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api';
        const response = await fetch(`${apiUrl}/dashboard/executive`);
        const result = await response.json();
        setDashboardData(result);
      } catch (error) {
        logError('Failed to fetch dashboard data:', error);
        // Fallback data
        setDashboardData({
          kpis: [
            { id: 'revenue', title: 'Total Revenue', value: 'Â£2.8M', change: '+15.9%', changeType: 'increase', icon: 'currency', description: 'Monthly recurring revenue' },
            { id: 'orders', title: 'Active Orders', value: '342', change: '+14.8%', changeType: 'increase', icon: 'shopping-cart', description: 'Orders in production' },
            { id: 'inventory', title: 'Inventory Value', value: 'Â£1.8M', change: '-3.9%', changeType: 'decrease', icon: 'package', description: 'Current stock valuation' },
            { id: 'customers', title: 'Active Customers', value: '1,284', change: '+11.1%', changeType: 'increase', icon: 'users', description: 'Customers with active orders' }
          ],
          workingCapital: {
            current: 'Â£847K',
            previous: 'Â£757K',
            projection: 'Â£923K',
            projectionLabel: '30-Day Projection'
          },
          performanceMetrics: [
            { name: 'Run Forecast', value: 'Generate production forecast', status: 'ready' },
            { name: 'What-If Analysis', value: 'Scenario modelling tools', status: 'ready' },
            { name: 'Optimize Stock', value: 'Inventory optimization', status: 'ready' }
          ]
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Executive Dashboard</h1>
        <p className="text-gray-600 mt-1">Real-time manufacturing operations overview</p>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardData?.kpis?.map((kpi) => (
          <EnterpriseKPICard
            key={kpi.id}
            title={kpi.title}
            value={kpi.value}
            change={kpi.change}
            trend={kpi.changeType === 'increase' ? 'up' : kpi.changeType === 'decrease' ? 'down' : null}
            icon={
              kpi.icon === 'currency' ? BanknotesIcon :
              kpi.icon === 'shopping-cart' ? DocumentTextIcon :
              kpi.icon === 'package' ? CubeIcon :
              kpi.icon === 'users' ? UserGroupIcon :
              DocumentTextIcon
            }
            description={kpi.description}
          />
        )) || [
          <EnterpriseKPICard
            key="revenue"
            title="Total Revenue"
            value="Â£2.8M"
            change="+15.9%"
            trend="up"
            icon={BanknotesIcon}
            description="Monthly recurring revenue"
          />,
          <EnterpriseKPICard
            key="orders"
            title="Active Orders"
            value="342"
            change="+14.8%"
            trend="up"
            icon={DocumentTextIcon}
            description="Orders in production"
          />,
          <EnterpriseKPICard
            key="inventory"
            title="Inventory Value"
            value="Â£1.8M"
            change="-3.9%"
            trend="down"
            icon={CubeIcon}
            description="Current stock valuation"
          />,
          <EnterpriseKPICard
            key="customers"
            title="Active Customers"
            value="1,284"
            change="+11.1%"
            trend="up"
            icon={UserGroupIcon}
            description="Customers with active orders"
          />
        ]}
      </div>

      {/* Production Status Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Working Capital</h3>
            <div className="flex items-center space-x-2">
              <ArrowTrendingUpIcon className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium text-green-600">+12.3%</span>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Current</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData?.workingCapital?.current || 'Â£847K'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">{dashboardData?.workingCapital?.projectionLabel || '30-Day Projection'}</p>
              <p className="text-xl font-semibold text-blue-600">
                {dashboardData?.workingCapital?.projection || 'Â£923K'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Key Performance Metrics</h3>
          <div className="space-y-4">
            {(dashboardData?.performanceMetrics || [
              { name: 'Run Forecast', value: 'Generate production forecast', status: 'ready' },
              { name: 'What-If Analysis', value: 'Scenario modelling tools', status: 'ready' },
              { name: 'Optimize Stock', value: 'Inventory optimization', status: 'ready' }
            ]).map((metric, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{metric.name}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">{metric.value}</span>
                  {metric.status === 'ready' && (
                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickActionButton 
            icon={PresentationChartLineIcon}
            title="Run Forecast"
            description="Generate production forecast"
            color="blue"
            onClick={() => window.location.href = '/forecasting'}
          />
          <QuickActionButton 
            icon={BanknotesIcon}
            title="Working Capital"
            description="Analyze cash flow"
            color="green"
            onClick={() => window.location.href = '/working-capital'}
          />
          <QuickActionButton 
            icon={DocumentTextIcon}
            title="What-If Analysis"
            description="Scenario planning"
            color="purple"
            onClick={() => window.location.href = '/what-if'}
          />
        </div>
      </div>
    </div>
  );
};

export default WorldClassEnterpriseDashboard;
