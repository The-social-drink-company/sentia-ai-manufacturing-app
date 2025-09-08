import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChartBarIcon, 
  BanknotesIcon, 
  CubeIcon, 
  TruckIcon, 
  BeakerIcon, 
  PresentationChartLineIcon,
  CogIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

const WorkingEnterpriseDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sentia Manufacturing Dashboard</h1>
              <p className="text-gray-600 mt-1">Enterprise Manufacturing Analytics & Control Center</p>
            </div>
            <div className="flex space-x-3">
              <Link 
                to="/working-capital"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <BanknotesIcon className="w-4 h-4 mr-2" />
                Working Capital
              </Link>
              <Link 
                to="/what-if"
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
              >
                <ChartBarIcon className="w-4 h-4 mr-2" />
                What-If Analysis
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ChartBarIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Production Output</h3>
                <p className="text-2xl font-bold text-gray-900">1,234</p>
                <p className="text-sm text-green-600 flex items-center">
                  <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
                  +12% from yesterday
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CubeIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Efficiency Rate</h3>
                <p className="text-2xl font-bold text-gray-900">94.2%</p>
                <p className="text-sm text-green-600 flex items-center">
                  <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
                  +2.1% from last week
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <BeakerIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Quality Score</h3>
                <p className="text-2xl font-bold text-gray-900">98.7%</p>
                <p className="text-sm text-gray-500">Stable</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TruckIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Active Orders</h3>
                <p className="text-2xl font-bold text-gray-900">87</p>
                <p className="text-sm text-blue-600">24 urgent priority</p>
              </div>
            </div>
          </div>
        </div>

        {/* Enterprise Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Enterprise Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link 
              to="/forecasting"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center">
                <PresentationChartLineIcon className="w-8 h-8 text-blue-600 group-hover:text-blue-700" />
                <div className="ml-3">
                  <h3 className="font-medium text-gray-900">Demand Forecasting</h3>
                  <p className="text-sm text-gray-500">Predictive analytics</p>
                </div>
              </div>
            </Link>

            <Link 
              to="/inventory"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center">
                <CubeIcon className="w-8 h-8 text-green-600 group-hover:text-green-700" />
                <div className="ml-3">
                  <h3 className="font-medium text-gray-900">Inventory Management</h3>
                  <p className="text-sm text-gray-500">Stock optimization</p>
                </div>
              </div>
            </Link>

            <Link 
              to="/production"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center">
                <TruckIcon className="w-8 h-8 text-purple-600 group-hover:text-purple-700" />
                <div className="ml-3">
                  <h3 className="font-medium text-gray-900">Production Tracking</h3>
                  <p className="text-sm text-gray-500">Real-time monitoring</p>
                </div>
              </div>
            </Link>

            <Link 
              to="/quality"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center">
                <BeakerIcon className="w-8 h-8 text-yellow-600 group-hover:text-yellow-700" />
                <div className="ml-3">
                  <h3 className="font-medium text-gray-900">Quality Control</h3>
                  <p className="text-sm text-gray-500">Quality assurance</p>
                </div>
              </div>
            </Link>

            <Link 
              to="/analytics"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center">
                <ChartBarIcon className="w-8 h-8 text-indigo-600 group-hover:text-indigo-700" />
                <div className="ml-3">
                  <h3 className="font-medium text-gray-900">Analytics</h3>
                  <p className="text-sm text-gray-500">Business insights</p>
                </div>
              </div>
            </Link>

            <Link 
              to="/data-import"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center">
                <CogIcon className="w-8 h-8 text-gray-600 group-hover:text-gray-700" />
                <div className="ml-3">
                  <h3 className="font-medium text-gray-900">Data Import</h3>
                  <p className="text-sm text-gray-500">Data management</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium">Authentication</span>
              <span className="text-green-600 text-sm font-medium">✅ Active</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium">Database</span>
              <span className="text-green-600 text-sm font-medium">✅ Connected</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium">API Services</span>
              <span className="text-green-600 text-sm font-medium">✅ Running</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium">Monitoring</span>
              <span className="text-green-600 text-sm font-medium">✅ Online</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkingEnterpriseDashboard;