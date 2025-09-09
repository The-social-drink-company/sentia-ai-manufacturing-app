import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  ShoppingCartIcon, 
  ArrowArrowTrendingUpIcon, 
  ArrowTrendingDownIcon,
  EyeIcon,
  ChartBarIcon,
  GlobeAltIcon,
  CurrencyPoundIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { queryKeys, queryConfigs } from '../../services/queryClient'
import liveDataService from '../../services/liveDataService'

const CHANNEL_COLORS = {
  amazon: '#FF9500',
  shopify_uk: '#95BF47', 
  shopify_eu: '#3B82F6',
  shopify_usa: '#EF4444'
}

const CHANNEL_NAMES = {
  amazon: 'Amazon UK',
  shopify_uk: 'Shopify UK',
  shopify_eu: 'Shopify EU', 
  shopify_usa: 'Shopify USA'
}

const MultiChannelSalesWidget = ({ timeRange = '30d', className = '' }) => {
  const [selectedView, setSelectedView] = useState('overview')
  const [selectedChannel, setSelectedChannel] = useState('all')

  // Fetch multi-channel sales data from LIVE DATA SERVICE ONLY - NO MOCK DATA
  const { data: salesData, isLoading, error, refetch } = useQuery({
    queryKey: ['live-multi-channel-sales', timeRange],
    queryFn: async () => {
      // Use live data service that connects to real external APIs
      const [salesAnalytics, unleashed, amazon, shopify] = await Promise.all([
        liveDataService.getSalesAnalytics(),
        liveDataService.getUnleashedData(),
        liveDataService.getAmazonData(),
        liveDataService.getShopifyData()
      ]);

      // Structure the data according to the expected format
      return {
        data: {
          amazon: {
            orders: amazon?.sales || [],
            revenue: amazon?.totalRevenue || 0,
            trend: 0,
            status: amazon?.status === 'API_NOT_CONFIGURED' ? 'disconnected' : 'connected'
          },
          shopify: {
            uk: {
              orders: shopify?.orders || [],
              revenue: shopify?.totalRevenue || 0,
              trend: 0,
              status: shopify ? 'connected' : 'disconnected'
            },
            eu: {
              orders: [],
              revenue: 0,
              trend: 0,
              status: 'disconnected'
            },
            usa: {
              orders: [],
              revenue: 0,
              trend: 0,
              status: 'disconnected'
            }
          },
          dailyTrends: salesAnalytics?.channels?.map((channel, index) => ({
            date: new Date(Date.now() - (index * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
            amazon: amazon?.totalRevenue || 0,
            shopify_uk: shopify?.totalRevenue || 0,
            shopify_eu: 0,
            shopify_usa: 0
          })) || []
        },
        timestamp: new Date().toISOString(),
        status: 'LIVE_DATA_ONLY',
        lastUpdated: new Date().toISOString()
      };
    },
    refetchInterval: 30000, // Refetch every 30 seconds for live data
    staleTime: 10000, // Consider data stale after 10 seconds
    cacheTime: 30000 // Keep in cache for 30 seconds
  })

  // Process and aggregate data
  const processedData = useMemo(() => {
    if (!salesData?.data) return null

    const { amazon, shopify } = salesData.data

    // Calculate totals and trends
    const channels = {
      amazon: {
        name: 'Amazon UK',
        orders: amazon?.orders?.length || 0,
        revenue: amazon?.revenue || 0,
        trend: amazon?.trend || 0,
        color: CHANNEL_COLORS.amazon,
        status: amazon?.status || 'disconnected'
      },
      shopify_uk: {
        name: 'Shopify UK', 
        orders: shopify?.uk?.orders?.length || 0,
        revenue: shopify?.uk?.revenue || 0,
        trend: shopify?.uk?.trend || 0,
        color: CHANNEL_COLORS.shopify_uk,
        status: shopify?.uk?.status || 'disconnected'
      },
      shopify_eu: {
        name: 'Shopify EU',
        orders: shopify?.eu?.orders?.length || 0,
        revenue: shopify?.eu?.revenue || 0,
        trend: shopify?.eu?.trend || 0,
        color: CHANNEL_COLORS.shopify_eu,
        status: shopify?.eu?.status || 'disconnected'
      },
      shopify_usa: {
        name: 'Shopify USA',
        orders: shopify?.usa?.orders?.length || 0,
        revenue: shopify?.usa?.revenue || 0,
        trend: shopify?.usa?.trend || 0,
        color: CHANNEL_COLORS.shopify_usa,
        status: shopify?.usa?.status || 'disconnected'
      }
    }

    // Calculate aggregated metrics
    const totalOrders = Object.values(channels).reduce((sum, ch) => sum + ch.orders, 0)
    const totalRevenue = Object.values(channels).reduce((sum, ch) => sum + ch.revenue, 0)
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Daily sales trend data
    const dailyData = salesData.data.dailyTrends || []

    return {
      channels,
      totals: {
        orders: totalOrders,
        revenue: totalRevenue,
        avgOrderValue,
        activeChannels: Object.values(channels).filter(ch => ch.status === 'connected').length
      },
      dailyData,
      timestamp: salesData.timestamp
    }
  }, [salesData])

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-GB', { 
      style: 'currency', 
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    }).format(value)
  }

  const formatTooltipValue = (value, name) => {
    if (name.includes('Revenue')) {
      return [formatCurrency(value), name]
    }
    return [value.toLocaleString(), name]
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="flex items-center justify-center h-48 text-center">
          <div className="text-red-600 dark:text-red-400">
            <ShoppingCartIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Unable to load sales data</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{error.message}</p>
            <button 
              onClick={() => refetch()}
              className="mt-3 px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ShoppingCartIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Multi-Channel Sales</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Last {timeRange} • {processedData?.totals.activeChannels || 0} channels active
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <select
              value={selectedView}
              onChange={(e) => setSelectedView(e.target.value)}
              className="px-2 py-1 text-xs border border-gray-300 rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="overview">Overview</option>
              <option value="trends">Trends</option>
              <option value="channels">By Channel</option>
            </select>
            
            <button
              onClick={() => refetch()}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title="Refresh data"
            >
              <ArrowPathIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-pulse flex space-x-4 w-full">
              <div className="flex-1 space-y-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-20 bg-gray-200 dark:bg-gray-600 rounded"></div>
                  <div className="h-20 bg-gray-200 dark:bg-gray-600 rounded"></div>
                </div>
                <div className="h-32 bg-gray-200 dark:bg-gray-600 rounded"></div>
              </div>
            </div>
          </div>
        ) : selectedView === 'overview' ? (
          <div className="space-y-4">
            {/* Summary Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {processedData?.totals.orders.toLocaleString() || '0'}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Total Orders</div>
              </div>
              
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(processedData?.totals.revenue || 0)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Total Revenue</div>
              </div>
              
              <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {formatCurrency(processedData?.totals.avgOrderValue || 0)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Avg Order Value</div>
              </div>
              
              <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {processedData?.totals.activeChannels || 0}/4
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Active Channels</div>
              </div>
            </div>

            {/* Channel Status */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">Channel Performance</h4>
              {Object.entries(processedData?.channels || {}).map(([key, channel]) => (
                <div key={key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: channel.color }}
                    />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{channel.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {channel.orders} orders • {formatCurrency(channel.revenue)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {channel.trend !== 0 && (
                      <div className={`flex items-center text-xs ${
                        channel.trend > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {channel.trend > 0 ? (
                          <ArrowArrowTrendingUpIcon className="w-3 h-3 mr-1" />
                        ) : (
                          <ArrowTrendingDownIcon className="w-3 h-3 mr-1" />
                        )}
                        {Math.abs(channel.trend).toFixed(1)}%
                      </div>
                    )}
                    
                    <div className={`px-2 py-1 rounded-full text-xs ${
                      channel.status === 'connected' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {channel.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : selectedView === 'trends' ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={processedData?.dailyData || []}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  fontSize={11}
                  tick={{ fill: 'currentColor' }}
                />
                <YAxis 
                  fontSize={11}
                  tick={{ fill: 'currentColor' }}
                  tickFormatter={(value) => `£${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip formatter={formatTooltipValue} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="amazon" 
                  stroke={CHANNEL_COLORS.amazon}
                  strokeWidth={2}
                  name="Amazon UK"
                  connectNulls={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="shopify_uk" 
                  stroke={CHANNEL_COLORS.shopify_uk}
                  strokeWidth={2}
                  name="Shopify UK"
                  connectNulls={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="shopify_eu" 
                  stroke={CHANNEL_COLORS.shopify_eu}
                  strokeWidth={2}
                  name="Shopify EU"
                  connectNulls={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="shopify_usa" 
                  stroke={CHANNEL_COLORS.shopify_usa}
                  strokeWidth={2}
                  name="Shopify USA"
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={Object.entries(processedData?.channels || {}).map(([key, channel]) => ({
                    name: channel.name,
                    value: channel.revenue,
                    color: channel.color
                  }))}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                >
                  {Object.entries(processedData?.channels || {}).map(([key, channel]) => (
                    <Cell key={key} fill={channel.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center justify-between">
          <span>
            Last updated: {processedData ? new Date(processedData.timestamp).toLocaleTimeString() : '—'}
          </span>
          <div className="flex items-center space-x-1">
            <GlobeAltIcon className="w-3 h-3" />
            <span>Multi-region data</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MultiChannelSalesWidget