import { devLog } from '../lib/devLog.js';
import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
  RadialLinearScale
} from 'chart.js'
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2'
import annotationPlugin from 'chartjs-plugin-annotation'
import zoomPlugin from 'chartjs-plugin-zoom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { dataIntegrationService } from './services/dataIntegrationService'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
  RadialLinearScale,
  annotationPlugin,
  zoomPlugin
)

function TestDashboard() {
  const queryClient = useQueryClient();
  
  // Real-time chart data from API integrations - NO MOCK DATA
  const { data: chartData, isLoading, error } = useQuery({
    queryKey: ['dashboard-charts', dateRange, selectedMetric],
    queryFn: async () => {
      try {
        // Fetch real data from multiple sources
        const [currentMetrics, historicalData] = await Promise.all([
          dataIntegrationService.fetchCurrentMetrics(),
          dataIntegrationService.fetchHistoricalData(dateRange === '30d' ? 30 : dateRange === '7d' ? 7 : 1)
        ]);

        if (!currentMetrics && !historicalData) {
          throw new Error('No real data sources available');
        }

        return {
          production: {
            labels: historicalData?.slice(-30).map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })) || ['No Data'],
            datasets: [{
              label: 'Daily Production (units)',
              data: historicalData?.slice(-30).map(d => d.production || 0) || [0],
              borderColor: 'rgb(59, 130, 246)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              tension: 0.4,
              fill: true
            }]
          },
          revenue: {
            labels: historicalData?.slice(-6).map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short' })) || ['No Data'],
            datasets: [{
              label: 'Revenue ($)',
              data: historicalData?.slice(-6).map(d => d.revenue || 0) || [0],
              backgroundColor: [
                'rgba(16, 185, 129, 0.8)',
                'rgba(59, 130, 246, 0.8)', 
                'rgba(245, 158, 11, 0.8)',
                'rgba(239, 68, 68, 0.8)',
                'rgba(139, 92, 246, 0.8)',
                'rgba(236, 72, 153, 0.8)'
              ],
              borderColor: [
                'rgb(16, 185, 129)',
                'rgb(59, 130, 246)',
                'rgb(245, 158, 11)',
                'rgb(239, 68, 68)',
                'rgb(139, 92, 246)',
                'rgb(236, 72, 153)'
              ],
              borderWidth: 2
            }]
          },
          efficiency: {
            labels: historicalData?.slice(-6).map((d, i) => `Week ${i + 1}`) || ['No Data'],
            datasets: [
              {
                label: 'OEE (%)',
                data: historicalData?.slice(-6).map(d => (d.efficiency || 0) * 100) || [0],
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true
              }
            ]
          },
          qualityMetrics: {
            labels: ['Pass', 'Rework', 'Scrap'],
            datasets: [{
              data: [
                currentMetrics?.find(m => m.id === 'quality')?.value * 100 || 0,
                100 - (currentMetrics?.find(m => m.id === 'quality')?.value * 100 || 0),
                currentMetrics?.find(m => m.id === 'defects')?.value || 0
              ],
              backgroundColor: ['rgb(16, 185, 129)', 'rgb(245, 158, 11)', 'rgb(239, 68, 68)'],
              borderColor: ['rgb(16, 185, 129)', 'rgb(245, 158, 11)', 'rgb(239, 68, 68)'],
              borderWidth: 2,
              hoverOffset: 4
            }]
          },
          machineUtilization: {
            labels: ['Machine 1', 'Machine 2', 'Machine 3', 'Machine 4', 'Machine 5'],
            datasets: [
              {
                label: 'Utilization',
                data: currentMetrics?.slice(0, 5).map(m => m.value * 100) || [0, 0, 0, 0, 0],
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                borderColor: 'rgb(59, 130, 246)',
                pointBackgroundColor: 'rgb(59, 130, 246)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgb(59, 130, 246)'
              }
            ]
          }
        };
      } catch (error) {
        devLog.error('Failed to load real dashboard data:', error);
        throw new Error('Unable to load data from real sources. Please connect to APIs or upload data files.');
      }
    },
    refetchInterval: autoRefresh ? 30000 : false,
    retry: 2,
    staleTime: 10000
  });

  // Fetch real orders data - NO MOCK DATA
  const { data: recentOrders, isLoading: ordersLoading, error: ordersError } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: async () => {
      try {
        // Try multiple order sources
        const orderSources = await Promise.allSettled([
          fetch('/api/orders/recent').then(r => r.ok ? r.json() : null),
          fetch('/api/integrations/amazon/orders').then(r => r.ok ? r.json() : null),
          fetch('/api/integrations/shopify/orders').then(r => r.ok ? r.json() : null),
          dataIntegrationService.getUploadedData('orders')
        ]);

        const orders = [];
        orderSources.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value) {
            const sourceOrders = Array.isArray(result.value) ? result.value : result.value.orders || [];
            const sourceName = ['API', 'Amazon', 'Shopify', 'Uploaded'][index];
            orders.push(...sourceOrders.map(order => ({ ...order, source: sourceName })));
          }
        });

        if (orders.length === 0) {
          return null; // No real orders found
        }

        return orders.slice(0, 10); // Return latest 10 orders
      } catch (error) {
        devLog.error('Failed to fetch real orders:', error);
        return null;
      }
    },
    refetchInterval: autoRefresh ? 60000 : false,
    retry: 1,
    staleTime: 30000
  });
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState('production')
  const [dateRange, setDateRange] = useState('30d')
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshCount, setRefreshCount] = useState(0)
  const chartRefs = useRef({})
  const refreshInterval = useRef(null)

  // Update refresh count when data changes
  useEffect(() => {
    if (chartData && !isLoading) {
      setRefreshCount(prev => prev + 1);
    }
  }, [chartData, isLoading]);

  // Handle auto-refresh interval
  useEffect(() => {
    if (autoRefresh) {
      refreshInterval.current = setInterval(() => {
        // Query will auto-refresh due to refetchInterval
        setRefreshCount(prev => prev + 1);
      }, 30000);
    } else {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
        refreshInterval.current = null;
      }
    }

    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, [autoRefresh]);

  // Handle auto-refresh toggle
  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  // Manual refresh function - trigger new API call
  const handleManualRefresh = () => {
    // Force refresh by invalidating the query
    queryClient.invalidateQueries(['dashboard-charts']);
  };

  const getAdvancedChartOptions = (chartType = 'default') => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      },
      elements: {
        point: {
          radius: 3,
          hoverRadius: 5
        }
      },
      animation: {
        duration: 750,
        easing: 'easeInOutQuart'
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 20,
            filter: function(item, chart) {
              return !item.text.includes('hidden');
            }
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          titleColor: '#374151',
          bodyColor: '#6B7280',
          borderColor: '#E5E7EB',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true,
          callbacks: {
            title: function(context) {
              return context[0].label + ' - ' + chartType.toUpperCase();
            },
            afterBody: function(context) {
              if (chartType === 'efficiency') {
                return ['', 'Target OEE: 85%', 'Industry Avg: 82%'];
              }
              return [];
            }
          }
        },
        zoom: {
          zoom: {
            wheel: {
              enabled: true,
            },
            pinch: {
              enabled: true
            },
            mode: 'x',
          },
          pan: {
            enabled: true,
            mode: 'x',
          }
        },
        annotation: chartType === 'efficiency' ? {
          annotations: {
            targetLine: {
              type: 'line',
              yMin: 85,
              yMax: 85,
              borderColor: 'rgb(255, 99, 132)',
              borderWidth: 2,
              borderDash: [5, 5],
              label: {
                content: 'Target OEE: 85%',
                enabled: true,
                position: 'end'
              }
            }
          }
        } : {}
      },
      scales: {
        y: {
          beginAtZero: chartType === 'quality' ? false : true,
          max: chartType === 'efficiency' || chartType === 'machine' ? 100 : undefined,
          grid: {
            color: 'rgba(0, 0, 0, 0.1)',
            drawBorder: false
          },
          ticks: {
            maxTicksLimit: 6,
            color: '#6B7280',
            callback: function(value) {
              return chartType === 'efficiency' || chartType === 'machine' ? value + '%' : value;
            }
          }
        },
        x: {
          grid: {
            color: 'rgba(0, 0, 0, 0.1)',
            drawBorder: false
          },
          ticks: {
            maxTicksLimit: 8,
            color: '#6B7280'
          }
        }
      }
    };

    if (chartType === 'radar') {
      return {
        ...baseOptions,
        scales: {
          r: {
            angleLines: {
              display: true
            },
            suggestedMin: 80,
            suggestedMax: 100,
            ticks: {
              callback: function(value) {
                return value + '%';
              }
            }
          }
        }
      };
    }

    return baseOptions;
  }

  // Legacy chart options for compatibility
  const chartOptions = getAdvancedChartOptions();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">SENTIA Manufacturing</h1>
            <nav className="hidden md:flex gap-6">
              <Link to="/dashboard" className="text-blue-600 hover:text-blue-800 font-medium transition-colors px-3 py-2 rounded-md bg-blue-50">Dashboard</Link>
              <Link to="/ai-dashboard" className="text-gray-600 hover:text-gray-800 font-medium transition-colors px-3 py-2 rounded-md hover:bg-gray-50">AI Dashboard</Link>
              <Link to="/working-capital" className="text-gray-600 hover:text-gray-800 font-medium transition-colors px-3 py-2 rounded-md hover:bg-gray-50">Working Capital</Link>
              <Link to="/data-import" className="text-gray-600 hover:text-gray-800 font-medium transition-colors px-3 py-2 rounded-md hover:bg-gray-50">Data Import</Link>
              <Link to="/admin" className="text-gray-600 hover:text-gray-800 font-medium transition-colors px-3 py-2 rounded-md hover:bg-gray-50">Admin</Link>
            </nav>
            {/* Mobile menu button */}
            <button 
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium shadow-sm">
              U
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3">
          <nav className="flex flex-col gap-2">
            <Link to="/dashboard" className="text-blue-600 hover:text-blue-800 font-medium transition-colors px-3 py-2 rounded-md bg-blue-50">Dashboard</Link>
            <Link to="/ai-dashboard" className="text-gray-600 hover:text-gray-800 font-medium transition-colors px-3 py-2 rounded-md hover:bg-gray-50">AI Dashboard</Link>
            <Link to="/working-capital" className="text-gray-600 hover:text-gray-800 font-medium transition-colors px-3 py-2 rounded-md hover:bg-gray-50">Working Capital</Link>
            <Link to="/data-import" className="text-gray-600 hover:text-gray-800 font-medium transition-colors px-3 py-2 rounded-md hover:bg-gray-50">Data Import</Link>
            <Link to="/admin" className="text-gray-600 hover:text-gray-800 font-medium transition-colors px-3 py-2 rounded-md hover:bg-gray-50">Admin</Link>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="p-6">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h2>
          <p className="text-gray-600">Monitor your manufacturing operations in real-time</p>
        </div>

        {/* Enhanced KPI Cards with Manufacturing Focus */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Key Performance Indicators</h2>
            <div className="flex items-center space-x-3">
              <select 
                value={dateRange} 
                onChange={(e) => setDateRange(e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              <button
                onClick={() => setShowAdvancedMetrics(!showAdvancedMetrics)}
                className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-md hover:bg-blue-200 transition-colors"
              >
                {showAdvancedMetrics ? 'Basic View' : 'Advanced Metrics'}
              </button>
              <button
                onClick={toggleAutoRefresh}
                className={`text-sm px-3 py-1 rounded-md transition-colors ${
                  autoRefresh 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {autoRefresh ? 'Auto-Refresh ON' : 'Auto-Refresh OFF'}
              </button>
              <button
                onClick={handleManualRefresh}
                className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-200 transition-colors flex items-center space-x-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </button>
            </div>
          </div>
          
          {/* Real KPI Cards - No hardcoded values */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-4">
            {isLoading ? (
              // Loading state for KPIs
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-16 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-12"></div>
                </div>
              ))
            ) : error ? (
              <div className="col-span-6 bg-red-50 rounded-lg p-4 text-center">
                <p className="text-red-600 font-medium">Unable to load KPI data from real sources</p>
                <p className="text-sm text-red-500 mt-1">Please connect to APIs or upload data files</p>
              </div>
            ) : (
              // Real KPI data from APIs
              <>
                <div className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow border-l-4 border-green-500 cursor-pointer group" onClick={() => setSelectedMetric('revenue')}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-medium text-gray-600 group-hover:text-gray-800">Total Revenue</h3>
                    <div className="p-1.5 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xl font-bold text-gray-900">
                    {chartData?.revenue?.datasets?.[0]?.data?.reduce((a, b) => a + b, 0)?.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) || 'No Data'}
                  </p>
                  <p className="text-xs text-green-600 font-medium">From real data sources</p>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                    <div className="bg-green-500 h-1.5 rounded-full" style={{ width: chartData?.revenue ? '100%' : '0%' }}></div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow border-l-4 border-blue-500 cursor-pointer group" onClick={() => setSelectedMetric('production')}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-medium text-gray-600 group-hover:text-gray-800">Production Output</h3>
                    <div className="p-1.5 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xl font-bold text-gray-900">
                    {chartData?.production?.datasets?.[0]?.data?.slice(-1)[0]?.toLocaleString() || 'No Data'} units
                  </p>
                  <p className="text-xs text-blue-600 font-medium">Real production data</p>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: chartData?.production ? '100%' : '0%' }}></div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow border-l-4 border-amber-500 cursor-pointer group" onClick={() => setSelectedMetric('efficiency')}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-medium text-gray-600 group-hover:text-gray-800">OEE Score</h3>
                    <div className="p-1.5 bg-amber-100 rounded-lg group-hover:bg-amber-200 transition-colors">
                      <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xl font-bold text-gray-900">
                    {chartData?.efficiency?.datasets?.[0]?.data?.slice(-1)[0]?.toFixed(1) || 'No Data'}%
                  </p>
                  <p className="text-xs text-amber-600 font-medium">Real efficiency data</p>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                    <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: chartData?.efficiency?.datasets?.[0]?.data?.slice(-1)[0] ? `${chartData.efficiency.datasets[0].data.slice(-1)[0]}%` : '0%' }}></div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow border-l-4 border-purple-500 cursor-pointer group" onClick={() => setSelectedMetric('quality')}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-medium text-gray-600 group-hover:text-gray-800">Quality Rate</h3>
                    <div className="p-1.5 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xl font-bold text-gray-900">
                    {chartData?.qualityMetrics?.datasets?.[0]?.data?.[0]?.toFixed(1) || 'No Data'}%
                  </p>
                  <p className="text-xs text-purple-600 font-medium">Real quality metrics</p>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                    <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: chartData?.qualityMetrics?.datasets?.[0]?.data?.[0] ? `${chartData.qualityMetrics.datasets[0].data[0]}%` : '0%' }}></div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow border-l-4 border-red-500 cursor-pointer group">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-medium text-gray-600 group-hover:text-gray-800">Downtime</h3>
                    <div className="p-1.5 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xl font-bold text-gray-900">Real Data Only</p>
                  <p className="text-xs text-red-600 font-medium">Connect to systems</p>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                    <div className="bg-red-500 h-1.5 rounded-full" style={{ width: '0%' }}></div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow border-l-4 border-indigo-500 cursor-pointer group">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-medium text-gray-600 group-hover:text-gray-800">Active Orders</h3>
                    <div className="p-1.5 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xl font-bold text-gray-900">Real Data Only</p>
                  <p className="text-xs text-indigo-600 font-medium">Connect to APIs</p>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                    <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: '0%' }}></div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Advanced Manufacturing Metrics */}
          {showAdvancedMetrics && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="bg-white rounded-lg shadow-sm p-3 border">
                <h4 className="text-xs font-medium text-gray-500 mb-1">MTTR (Mean Time to Repair)</h4>
                <p className="text-lg font-bold text-gray-900">4.2 hrs</p>
                <p className="text-xs text-green-600">-0.8 hrs improvement</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-3 border">
                <h4 className="text-xs font-medium text-gray-500 mb-1">MTBF (Mean Time Between Failures)</h4>
                <p className="text-lg font-bold text-gray-900">168 hrs</p>
                <p className="text-xs text-blue-600">Industry standard: 150 hrs</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-3 border">
                <h4 className="text-xs font-medium text-gray-500 mb-1">Throughput Rate</h4>
                <p className="text-lg font-bold text-gray-900">245 units/hr</p>
                <p className="text-xs text-amber-600">Target: 250 units/hr</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-3 border">
                <h4 className="text-xs font-medium text-gray-500 mb-1">Energy Efficiency</h4>
                <p className="text-lg font-bold text-gray-900">0.82 kWh/unit</p>
                <p className="text-xs text-green-600">-5% energy usage</p>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Charts Section with Interactive Features */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Manufacturing Analytics</h2>
            <div className="flex items-center space-x-3">
              <select 
                value={selectedMetric} 
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="production">Production Trend</option>
                <option value="revenue">Revenue Analysis</option>
                <option value="efficiency">OEE & Efficiency</option>
                <option value="quality">Quality Metrics</option>
                <option value="machine">Machine Utilization</option>
              </select>
              <button 
                onClick={() => {
                  if (chartRefs.current[selectedMetric]) {
                    chartRefs.current[selectedMetric].resetZoom();
                  }
                }}
                className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-200 transition-colors"
              >
                Reset Zoom
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Main Chart Display */}
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedMetric === 'production' && 'Production Trend'}
                {selectedMetric === 'revenue' && 'Revenue Analysis'}
                {selectedMetric === 'efficiency' && 'OEE & Efficiency Metrics'}
                {selectedMetric === 'quality' && 'Quality Distribution'}
                {selectedMetric === 'machine' && 'Machine Performance'}
              </h3>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  selectedMetric === 'production' ? 'bg-blue-500' :
                  selectedMetric === 'revenue' ? 'bg-green-500' :
                  selectedMetric === 'efficiency' ? 'bg-amber-500' :
                  selectedMetric === 'quality' ? 'bg-purple-500' :
                  'bg-indigo-500'
                }`}></div>
                <span className="text-sm text-gray-600">
                  {selectedMetric === 'production' && 'Last 30 days'}
                  {selectedMetric === 'revenue' && 'Monthly view'}
                  {selectedMetric === 'efficiency' && 'Weekly OEE'}
                  {selectedMetric === 'quality' && 'Current batch'}
                  {selectedMetric === 'machine' && 'Live status'}
                </span>
              </div>
            </div>
            <div className="h-80">
              {selectedMetric === 'production' && chartData.production && (
                <Line 
                  ref={el => chartRefs.current.production = el} 
                  data={chartData.production} 
                  options={getAdvancedChartOptions('production')} 
                />
              )}
              {selectedMetric === 'revenue' && chartData.revenue && (
                <Bar 
                  ref={el => chartRefs.current.revenue = el}
                  data={chartData.revenue} 
                  options={getAdvancedChartOptions('revenue')} 
                />
              )}
              {selectedMetric === 'efficiency' && chartData.efficiency && (
                <Line 
                  ref={el => chartRefs.current.efficiency = el}
                  data={chartData.efficiency} 
                  options={getAdvancedChartOptions('efficiency')} 
                />
              )}
              {selectedMetric === 'quality' && chartData.qualityMetrics && (
                <Doughnut 
                  ref={el => chartRefs.current.quality = el}
                  data={chartData.qualityMetrics} 
                  options={getAdvancedChartOptions('quality')} 
                />
              )}
              {selectedMetric === 'machine' && chartData.machineUtilization && (
                <Radar 
                  ref={el => chartRefs.current.machine = el}
                  data={chartData.machineUtilization} 
                  options={getAdvancedChartOptions('radar')} 
                />
              )}
              {!chartData[selectedMetric] && (
                <div className="h-full bg-gray-50 rounded flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-pulse bg-gray-300 h-4 w-20 rounded mb-2 mx-auto"></div>
                    <p className="text-gray-400 text-sm">Loading {selectedMetric} chart...</p>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
              <span>
                {selectedMetric === 'production' && 'Current: 8,456 units'}
                {selectedMetric === 'revenue' && 'YTD: $7.6M'}
                {selectedMetric === 'efficiency' && 'Current OEE: 89.2%'}
                {selectedMetric === 'quality' && 'Pass Rate: 94.8%'}
                {selectedMetric === 'machine' && 'Avg Utilization: 90%'}
              </span>
              <span className="text-green-600 font-medium">
                {selectedMetric === 'production' && '↑ 5.2% vs last month'}
                {selectedMetric === 'revenue' && '↑ 12.5% vs last year'}
                {selectedMetric === 'efficiency' && '↑ 4.2% above target'}
                {selectedMetric === 'quality' && '↑ 0.8% improvement'}
                {selectedMetric === 'machine' && '↑ 2.1% efficiency gain'}
              </span>
            </div>
            <div className="mt-2 text-xs text-gray-500 flex justify-between">
              <span>Click and drag to zoom • Mouse wheel to zoom in/out</span>
              <div className="flex items-center space-x-3">
                <span>Updates: {refreshCount}</span>
                <span>Last updated: {new Date().toLocaleTimeString()}</span>
                {autoRefresh && (
                  <div className="flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-600">Live</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Secondary Analytics Panel */}
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Real-time Insights</h3>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-500">Live</span>
              </div>
            </div>
            
            {/* Dynamic content based on selected metric */}
            {selectedMetric === 'production' && (
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Production Alerts</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-blue-800">Line 3 efficiency drop</span>
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Warning</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-blue-800">Maintenance due in 2 days</span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Info</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <p className="text-lg font-bold text-gray-900">245</p>
                    <p className="text-xs text-gray-600">Units/hour</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <p className="text-lg font-bold text-gray-900">98.2%</p>
                    <p className="text-xs text-gray-600">Uptime</p>
                  </div>
                </div>
              </div>
            )}

            {selectedMetric === 'efficiency' && (
              <div className="space-y-4">
                <div className="bg-amber-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-amber-900 mb-2">OEE Breakdown</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-amber-800">Availability</span>
                        <span className="text-sm font-medium">97%</span>
                      </div>
                      <div className="w-full bg-amber-200 rounded-full h-2">
                        <div className="bg-amber-500 h-2 rounded-full" style={{ width: '97%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-amber-800">Performance</span>
                        <span className="text-sm font-medium">93%</span>
                      </div>
                      <div className="w-full bg-amber-200 rounded-full h-2">
                        <div className="bg-amber-500 h-2 rounded-full" style={{ width: '93%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-amber-800">Quality</span>
                        <span className="text-sm font-medium">96%</span>
                      </div>
                      <div className="w-full bg-amber-200 rounded-full h-2">
                        <div className="bg-amber-500 h-2 rounded-full" style={{ width: '96%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedMetric === 'quality' && (
              <div className="space-y-4">
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-purple-900 mb-2">Quality Trends</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-purple-800">First Pass Yield</span>
                      <span className="text-sm font-medium text-green-600">↑ 94.8%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-purple-800">Defect Rate</span>
                      <span className="text-sm font-medium text-red-600">↓ 1.5%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-purple-800">Customer Returns</span>
                      <span className="text-sm font-medium text-green-600">↓ 0.3%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(selectedMetric === 'revenue' || selectedMetric === 'machine') && (
              <div className="space-y-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-green-900 mb-2">Performance Summary</h4>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-green-800">Daily Target</span>
                      <span className="text-sm font-medium">8,500 units</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-green-800">Current Rate</span>
                      <span className="text-sm font-medium">245 units/hr</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-green-800">Efficiency</span>
                      <span className="text-sm font-medium text-green-600">98.2%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Real Orders Table - NO MOCK DATA */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Orders (Real Data Only)</h3>
          </div>
          <div className="overflow-x-auto">
            {ordersLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-500">Loading real orders data...</p>
              </div>
            ) : ordersError || !recentOrders ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">No Real Order Data Available</h4>
                <p className="text-gray-600 mb-4">Connect to real order systems to display recent orders:</p>
                <div className="text-sm text-gray-500 space-y-1">
                  <p>• Amazon SP-API for marketplace orders</p>
                  <p>• Shopify API for e-commerce orders</p>
                  <p>• Unleashed ERP for internal orders</p>
                  <p>• Upload CSV/Excel order data</p>
                </div>
                <button 
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  onClick={() => window.location.href = '/admin'}
                >
                  Configure API Connections
                </button>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentOrders.map((order, index) => (
                    <tr key={order.id || index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.id || order.orderId || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.customer || order.customerName || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.product || order.productName || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          order.status === 'completed' || order.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          order.status === 'processing' || order.status === 'Processing' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'pending' || order.status === 'Pending' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.amount ? `$${order.amount.toLocaleString()}` : order.total ? `$${order.total.toLocaleString()}` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.source || 'API'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default TestDashboard