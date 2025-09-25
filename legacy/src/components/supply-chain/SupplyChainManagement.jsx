import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  MapPinIcon,
  TruckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  CogIcon,
  GlobeAltIcon,
  BuildingOfficeIcon,
  ArrowPathIcon,
  ShieldExclamationIcon
} from '@heroicons/react/24/outline';

// Import existing supply chain components
import { RiskAssessmentDashboard } from './RiskAssessmentDashboard';
import InteractiveSupplyChainMap from './InteractiveSupplyChainMap';
import ShipmentTrackingSystem from './ShipmentTrackingSystem';
import SupplierReliabilityScoring from './SupplierReliabilityScoring';
import LeadTimePredictionEngine from './LeadTimePredictionEngine';
import AlternativeSupplierFinder from './AlternativeSupplierFinder';

const SupplyChainManagement = () => {
  const { data: session } = ();
  const user = session?.user;
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [timeRange, setTimeRange] = useState('30d');
  const [liveUpdates, setLiveUpdates] = useState(true);

  // Fetch supply chain data from API
  const { data: supplyChainData, isLoading, refetch, isError, error } = useQuery({
    queryKey: ['supply-chain-data', selectedRegion, timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/supply-chain/overview?region=${selectedRegion}&timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${await user?.getToken()}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch supply chain data');
      }
      return response.json();
    },
    refetchInterval: liveUpdates ? 60000 : false,
    staleTime: liveUpdates ? 50000 : 30000,
    retry: (failureCount, error) => {
      if (error?.status === 401) return false;
      return failureCount < 2;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Mock data for real-world supply chain operations
  const mockSupplyChainData = {
    overview: {
      totalSuppliers: 147,
      activeShipments: 23,
      averageLeadTime: 8.5,
      onTimeDelivery: 94.2,
      supplierScore: 87.3,
      riskLevel: 'Medium'
    },
    suppliers: [
      {
        id: 'SUP001',
        name: 'Pacific Electronics Ltd',
        location: 'Hong Kong',
        category: 'Electronic Components',
        reliabilityScore: 92,
        leadTime: 12,
        riskLevel: 'Low',
        orderValue: 450000,
        lastDelivery: '2024-01-15',
        status: 'Active'
      },
      {
        id: 'SUP002', 
        name: 'European Components GmbH',
        location: 'Hamburg, Germany',
        category: 'Raw Materials',
        reliabilityScore: 88,
        leadTime: 7,
        riskLevel: 'Low',
        orderValue: 320000,
        lastDelivery: '2024-01-14',
        status: 'Active'
      },
      {
        id: 'SUP003',
        name: 'Asia Manufacturing Co',
        location: 'Manila, Philippines', 
        category: 'Packaging',
        reliabilityScore: 76,
        leadTime: 15,
        riskLevel: 'High',
        orderValue: 180000,
        lastDelivery: '2024-01-10',
        status: 'At Risk'
      }
    ],
    shipments: [
      {
        id: 'SHP001',
        supplier: 'Pacific Electronics Ltd',
        origin: 'Hong Kong',
        destination: 'Manchester, UK',
        status: 'In Transit',
        estimatedArrival: '2024-01-20',
        actualArrival: null,
        value: 75000,
        riskFactors: ['Weather Delay']
      },
      {
        id: 'SHP002',
        supplier: 'European Components GmbH', 
        origin: 'Hamburg, Germany',
        destination: 'Manchester, UK',
        status: 'Delivered',
        estimatedArrival: '2024-01-16',
        actualArrival: '2024-01-15',
        value: 42000,
        riskFactors: []
      }
    ],
    riskAlerts: [
      {
        id: 'RISK001',
        type: 'Weather',
        severity: 'Medium',
        message: 'Storm system affecting Asia-Pacific shipping routes',
        affectedSuppliers: ['Pacific Electronics Ltd', 'Asia Manufacturing Co'],
        estimatedDelay: '2-4 days'
      },
      {
        id: 'RISK002',
        type: 'Supplier',
        severity: 'High', 
        message: 'Asia Manufacturing Co experiencing production delays',
        affectedSuppliers: ['Asia Manufacturing Co'],
        estimatedDelay: '5-7 days'
      }
    ],
    performance: {
      deliveryTrends: [
        { month: 'Sep', onTime: 91, late: 9 },
        { month: 'Oct', onTime: 93, late: 7 },
        { month: 'Nov', onTime: 89, late: 11 },
        { month: 'Dec', onTime: 94, late: 6 },
        { month: 'Jan', onTime: 94.2, late: 5.8 }
      ],
      costOptimization: {
        totalSavings: 125000,
        opportunities: [
          { area: 'Consolidation', potential: 45000 },
          { area: 'Route Optimization', potential: 32000 },
          { area: 'Supplier Negotiation', potential: 48000 }
        ]
      }
    }
  };

  const data = supplyChainData || mockSupplyChainData;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ChartBarIcon },
    { id: 'suppliers', label: 'Suppliers', icon: BuildingOfficeIcon },
    { id: 'shipments', label: 'Shipments', icon: TruckIcon },
    { id: 'map', label: 'Supply Chain Map', icon: GlobeAltIcon },
    { id: 'risks', label: 'Risk Assessment', icon: ShieldExclamationIcon },
    { id: 'analytics', label: 'Analytics', icon: ChartBarIcon }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Supply Chain Management</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Comprehensive supply chain visibility and risk management
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Regions</option>
                <option value="asia-pacific">Asia Pacific</option>
                <option value="europe">Europe</option>
                <option value="americas">Americas</option>
              </select>
              
              <button
                onClick={() => setLiveUpdates(!liveUpdates)}
                className={`flex items-center px-4 py-2 border rounded-lg transition-colors ${
                  liveUpdates 
                    ? 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100'
                    : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ArrowPathIcon className={`w-4 h-4 mr-2 ${liveUpdates ? 'animate-spin' : ''}`} />
                Live Updates
              </button>
              
              <button
                onClick={() => refetch()}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <ArrowPathIcon className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
            <ExclamationTriangleIcon className="w-16 h-16 mx-auto text-orange-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Unable to Load Supply Chain Data
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
              Error: {error?.message || 'Failed to fetch supply chain data from server'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.location.href = '/data-import'}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Import Supply Chain Data
              </button>
              <button
                onClick={() => refetch()}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Overview Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
              <MetricCard
                title="Total Suppliers"
                value={data.overview.totalSuppliers}
                icon={<BuildingOfficeIcon className="w-6 h-6" />}
                color="blue"
              />
              <MetricCard
                title="Active Shipments"
                value={data.overview.activeShipments}
                icon={<TruckIcon className="w-6 h-6" />}
                color="green"
              />
              <MetricCard
                title="Avg Lead Time"
                value={`${data.overview.averageLeadTime} days`}
                icon={<ClockIcon className="w-6 h-6" />}
                color="yellow"
              />
              <MetricCard
                title="On-Time Delivery"
                value={`${data.overview.onTimeDelivery}%`}
                icon={<ChartBarIcon className="w-6 h-6" />}
                color="emerald"
              />
              <MetricCard
                title="Supplier Score"
                value={`${data.overview.supplierScore}/100`}
                icon={<CogIcon className="w-6 h-6" />}
                color="purple"
              />
              <MetricCard
                title="Risk Level"
                value={data.overview.riskLevel}
                icon={<ExclamationTriangleIcon className="w-6 h-6" />}
                color={data.overview.riskLevel === 'Low' ? 'green' : data.overview.riskLevel === 'Medium' ? 'yellow' : 'red'}
              />
            </div>

            {/* Risk Alerts */}
            {data.riskAlerts && data.riskAlerts.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Active Risk Alerts</h3>
                <div className="space-y-3">
                  {data.riskAlerts.map((alert) => (
                    <div 
                      key={alert.id}
                      className={`p-4 rounded-lg border-l-4 ${
                        alert.severity === 'High' 
                          ? 'bg-red-50 border-red-400 dark:bg-red-900/20 dark:border-red-600' 
                          : 'bg-yellow-50 border-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-600'
                      }`}
                    >
                      <div className="flex items-start">
                        <ExclamationTriangleIcon className={`w-5 h-5 mr-3 mt-0.5 ${
                          alert.severity === 'High' ? 'text-red-600' : 'text-yellow-600'
                        }`} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className={`font-medium ${
                              alert.severity === 'High' 
                                ? 'text-red-900 dark:text-red-200' 
                                : 'text-yellow-900 dark:text-yellow-200'
                            }`}>
                              {alert.type} Risk - {alert.severity} Severity
                            </h4>
                            <span className="text-sm text-gray-500">
                              Delay: {alert.estimatedDelay}
                            </span>
                          </div>
                          <p className={`text-sm mt-1 ${
                            alert.severity === 'High' 
                              ? 'text-red-700 dark:text-red-300' 
                              : 'text-yellow-700 dark:text-yellow-300'
                          }`}>
                            {alert.message}
                          </p>
                          <div className="mt-2">
                            <span className="text-xs text-gray-600">Affected suppliers: </span>
                            <span className="text-xs font-medium">{alert.affectedSuppliers.join(', ')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
              {activeTab === 'overview' && <OverviewTab data={data} />}
              {activeTab === 'suppliers' && <SuppliersTab suppliers={data.suppliers} />}
              {activeTab === 'shipments' && <ShipmentsTab shipments={data.shipments} />}
              {activeTab === 'map' && <InteractiveSupplyChainMap />}
              {activeTab === 'risks' && <RiskAssessmentDashboard />}
              {activeTab === 'analytics' && <AnalyticsTab data={data} />}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Component for metric cards
const MetricCard = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    yellow: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
    </div>
  );
};

// Overview tab component
const OverviewTab = ({ data }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">Performance Trends</h3>
      <div className="space-y-4">
        {data.performance.deliveryTrends.slice(-3).map((trend, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">{trend.month}</span>
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <span className="text-green-600">{trend.onTime}% on-time</span>
                <span className="text-red-600 ml-2">{trend.late}% late</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">Cost Optimization</h3>
      <div className="mb-4">
        <div className="text-2xl font-bold text-green-600">Â£{data.performance.costOptimization.totalSavings.toLocaleString()}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Total savings this year</div>
      </div>
      <div className="space-y-3">
        {data.performance.costOptimization.opportunities.map((opp, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span className="text-sm font-medium text-gray-900 dark:text-white">{opp.area}</span>
            <span className="text-sm text-green-600">Â£{opp.potential.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Suppliers tab component
const SuppliersTab = ({ suppliers }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Supplier Directory</h3>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Supplier</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Category</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Reliability</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Lead Time</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Risk</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {suppliers.map((supplier) => (
            <tr key={supplier.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{supplier.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{supplier.location}</div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                  {supplier.category}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {supplier.reliabilityScore}/100
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {supplier.leadTime} days
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  supplier.riskLevel === 'Low' ? 'bg-green-100 text-green-800' :
                  supplier.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {supplier.riskLevel}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  supplier.status === 'Active' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {supplier.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// Shipments tab component
const ShipmentsTab = ({ shipments }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Active Shipments</h3>
    </div>
    <div className="p-6 space-y-4">
      {shipments.map((shipment) => (
        <div key={shipment.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                shipment.status === 'Delivered' ? 'bg-green-500' :
                shipment.status === 'In Transit' ? 'bg-blue-500' :
                'bg-yellow-500'
              }`}></div>
              <h4 className="font-medium text-gray-900 dark:text-white">{shipment.id}</h4>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                shipment.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                shipment.status === 'In Transit' ? 'bg-blue-100 text-blue-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {shipment.status}
              </span>
            </div>
            <div className="text-right">
              <div className="font-medium text-gray-900 dark:text-white">Â£{shipment.value.toLocaleString()}</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-500 dark:text-gray-400">Supplier</div>
              <div className="font-medium text-gray-900 dark:text-white">{shipment.supplier}</div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400">Route</div>
              <div className="font-medium text-gray-900 dark:text-white">{shipment.origin} â†’ {shipment.destination}</div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400">ETA</div>
              <div className="font-medium text-gray-900 dark:text-white">{shipment.estimatedArrival}</div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400">Risk Factors</div>
              <div className="font-medium text-gray-900 dark:text-white">
                {shipment.riskFactors.length > 0 ? shipment.riskFactors.join(', ') : 'None'}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Analytics tab component  
const AnalyticsTab = ({ data }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
    <SupplierReliabilityScoring />
    <LeadTimePredictionEngine />
    <div className="lg:col-span-2">
      <AlternativeSupplierFinder />
    </div>
    <div className="lg:col-span-2">
      <ShipmentTrackingSystem />
    </div>
  </div>
);

export default SupplyChainManagement;
