import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  TruckIcon, 
  MapPinIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { cn } from '../../lib/utils'

// Mock data for supply chain status
const mockSupplyChainData = {
  suppliers: [
    {
      id: 1,
      name: 'Pacific Materials Co.',
      location: 'Vancouver, BC',
      status: 'active',
      onTimeDelivery: 94.5,
      qualityRating: 4.8,
      leadTime: '3-5 days',
      riskLevel: 'low'
    },
    {
      id: 2,
      name: 'Industrial Components Ltd.',
      location: 'Toronto, ON',
      status: 'delayed',
      onTimeDelivery: 87.2,
      qualityRating: 4.3,
      leadTime: '7-10 days',
      riskLevel: 'medium'
    },
    {
      id: 3,
      name: 'Global Logistics Inc.',
      location: 'Montreal, QC',
      status: 'active',
      onTimeDelivery: 96.1,
      qualityRating: 4.9,
      leadTime: '2-4 days',
      riskLevel: 'low'
    }
  ],
  shipments: {
    inTransit: 23,
    delivered: 156,
    delayed: 4,
    pending: 12
  },
  alerts: [
    {
      id: 1,
      type: 'delay',
      message: 'Shipment SCH-2024-001 delayed by 2 days',
      severity: 'warning',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      id: 2,
      type: 'quality',
      message: 'Quality inspection required for batch QC-456',
      severity: 'info',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000)
    }
  ]
}

const SupplyChainWidget = ({ className = "", ...props }) => {
  const [activeTab, setActiveTab] = useState('overview')
  
  // Simulate real-time data
  const { data: supplyChainData, isLoading, refetch } = useQuery({
    queryKey: ['supply-chain-status'],
    queryFn: () => Promise.resolve(mockSupplyChainData),
    refetchInterval: 30000 // Refresh every 30 seconds
  })
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />
      case 'delayed':
        return <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />
      case 'offline':
        return <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
      default:
        return <ClockIcon className="w-4 h-4 text-gray-500" />
    }
  }
  
  const getRiskColor = (risk) => {
    switch (risk) {
      case 'low':
        return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300'
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300'
      case 'high':
        return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300'
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-300'
    }
  }
  
  if (isLoading) {
    return (
      <div className={cn("bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6", className)}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-1/3"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className={cn("bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700", className)} {...props}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <TruckIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Supply Chain
            </h3>
          </div>
          <button
            onClick={() => refetch()}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
          >
            <ArrowPathIcon className="w-4 h-4" />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="mt-4 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {['overview', 'suppliers', 'shipments'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "py-2 px-1 border-b-2 font-medium text-sm capitalize",
                  activeTab === tab
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                )}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {supplyChainData?.shipments.inTransit || 0}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">In Transit</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {supplyChainData?.shipments.delivered || 0}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Delivered</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {supplyChainData?.shipments.delayed || 0}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Delayed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {supplyChainData?.shipments.pending || 0}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Pending</div>
              </div>
            </div>
            
            {/* Recent Alerts */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Recent Alerts</h4>
              <div className="space-y-2">
                {supplyChainData?.alerts.map((alert) => (
                  <div key={alert.id} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <ExclamationTriangleIcon className={cn(
                      "w-5 h-5 mt-0.5",
                      alert.severity === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                    )} />
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 dark:text-white">{alert.message}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {alert.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'suppliers' && (
          <div className="space-y-4">
            {supplyChainData?.suppliers.map((supplier) => (
              <div key={supplier.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(supplier.status)}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {supplier.name}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                        <MapPinIcon className="w-3 h-3 mr-1" />
                        {supplier.location}
                      </p>
                    </div>
                  </div>
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    getRiskColor(supplier.riskLevel)
                  )}>
                    {supplier.riskLevel} risk
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">On-time delivery</span>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {supplier.onTimeDelivery}%
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Quality</span>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {supplier.qualityRating}/5.0
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Lead time</span>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {supplier.leadTime}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {activeTab === 'shipments' && (
          <div className="text-center py-8">
            <TruckIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Shipment Tracking
            </h4>
            <p className="text-gray-500 dark:text-gray-400">
              Detailed shipment tracking coming soon
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default SupplyChainWidget