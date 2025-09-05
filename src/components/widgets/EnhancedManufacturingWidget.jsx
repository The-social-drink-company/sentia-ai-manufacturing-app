import React, { useState, useEffect, memo } from 'react'
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
  ArcElement
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'

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
  ArcElement
)

const EnhancedManufacturingWidget = memo(() => {
  const [activeTab, setActiveTab] = useState('overview')
  const [refreshInterval, setRefreshInterval] = useState(30) // seconds
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [manufacturingData, setManufacturingData] = useState(null)
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    // Simulate real-time manufacturing data
    const generateManufacturingData = () => {
      const currentTime = new Date()
      
      // Production line data
      const productionLines = [
        {
          id: 'LINE-001',
          name: 'Assembly Line A',
          status: 'running',
          efficiency: 94.2 + (Math.random() - 0.5) * 2,
          throughput: 245 + Math.floor(Math.random() * 20 - 10),
          temperature: 68 + (Math.random() - 0.5) * 4,
          lastMaintenance: '2024-09-03',
          nextMaintenance: '2024-09-17'
        },
        {
          id: 'LINE-002', 
          name: 'Assembly Line B',
          status: 'running',
          efficiency: 89.1 + (Math.random() - 0.5) * 2,
          throughput: 238 + Math.floor(Math.random() * 15 - 7),
          temperature: 71 + (Math.random() - 0.5) * 3,
          lastMaintenance: '2024-09-01',
          nextMaintenance: '2024-09-15'
        },
        {
          id: 'LINE-003',
          name: 'Packaging Line',
          status: 'warning',
          efficiency: 78.5 + (Math.random() - 0.5) * 3,
          throughput: 180 + Math.floor(Math.random() * 25 - 12),
          temperature: 73 + (Math.random() - 0.5) * 2,
          lastMaintenance: '2024-08-28',
          nextMaintenance: '2024-09-12'
        }
      ]

      // Quality metrics
      const qualityData = {
        firstPassYield: 94.8,
        defectRate: 1.2,
        reworkRate: 3.0,
        customerReturns: 0.3
      }

      // Energy consumption data
      const energyData = {
        labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
        datasets: [{
          label: 'Energy Usage (kWh)',
          data: [180, 165, 220, 245, 235, 190],
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        }]
      }

      // Generate alerts based on current conditions
      const currentAlerts = []
      productionLines.forEach(line => {
        if (line.efficiency < 85) {
          currentAlerts.push({
            id: `alert-${line.id}-efficiency`,
            type: 'warning',
            message: `${line.name} efficiency below target (${line.efficiency.toFixed(1)}%)`,
            timestamp: currentTime,
            line: line.name
          })
        }
        
        if (line.temperature > 72) {
          currentAlerts.push({
            id: `alert-${line.id}-temp`,
            type: 'info',
            message: `${line.name} temperature elevated (${line.temperature.toFixed(1)}°F)`,
            timestamp: currentTime,
            line: line.name
          })
        }

        // Maintenance alerts
        const nextMaintenance = new Date(line.nextMaintenance)
        const daysUntilMaintenance = Math.ceil((nextMaintenance - currentTime) / (1000 * 60 * 60 * 24))
        
        if (daysUntilMaintenance <= 3) {
          currentAlerts.push({
            id: `alert-${line.id}-maintenance`,
            type: 'warning',
            message: `${line.name} maintenance due in ${daysUntilMaintenance} days`,
            timestamp: currentTime,
            line: line.name
          })
        }
      })

      return {
        productionLines,
        qualityData,
        energyData,
        alerts: currentAlerts,
        oee: {
          overall: 89.2,
          availability: 96.8,
          performance: 92.4,
          quality: 99.6
        }
      }
    }

    const updateData = () => {
      const data = generateManufacturingData()
      setManufacturingData(data)
      setAlerts(data.alerts)
      setLastUpdate(new Date())
    }

    // Initial load
    updateData()

    // Set up refresh interval
    const interval = setInterval(updateData, refreshInterval * 1000)

    return () => clearInterval(interval)
  }, [refreshInterval])

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#374151',
        bodyColor: '#6B7280',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        cornerRadius: 8
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return 'text-green-600 bg-green-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      case 'stopped': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getAlertColor = (type) => {
    switch (type) {
      case 'critical': return 'text-red-600 bg-red-100 border-red-200'
      case 'warning': return 'text-yellow-600 bg-yellow-100 border-yellow-200'
      case 'info': return 'text-blue-600 bg-blue-100 border-blue-200'
      default: return 'text-gray-600 bg-gray-100 border-gray-200'
    }
  }

  if (!manufacturingData) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
      {/* Widget Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Manufacturing Operations Center</h3>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live • Updated {lastUpdate.toLocaleTimeString()}</span>
            </div>
            <select 
              value={refreshInterval} 
              onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
              className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>10s refresh</option>
              <option value={30}>30s refresh</option>
              <option value={60}>1min refresh</option>
            </select>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="mt-4">
          <nav className="flex space-x-4">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'lines', label: 'Production Lines' },
              { id: 'quality', label: 'Quality' },
              { id: 'energy', label: 'Energy' },
              { id: 'alerts', label: `Alerts (${alerts.length})` }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-1">Overall OEE</h4>
              <p className="text-2xl font-bold text-blue-700">{manufacturingData.oee.overall}%</p>
              <p className="text-xs text-blue-600">Above target (85%)</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-green-900 mb-1">Availability</h4>
              <p className="text-2xl font-bold text-green-700">{manufacturingData.oee.availability}%</p>
              <p className="text-xs text-green-600">Excellent uptime</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-yellow-900 mb-1">Performance</h4>
              <p className="text-2xl font-bold text-yellow-700">{manufacturingData.oee.performance}%</p>
              <p className="text-xs text-yellow-600">Good throughput</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-purple-900 mb-1">Quality</h4>
              <p className="text-2xl font-bold text-purple-700">{manufacturingData.oee.quality}%</p>
              <p className="text-xs text-purple-600">Outstanding quality</p>
            </div>
          </div>
        )}

        {activeTab === 'lines' && (
          <div className="space-y-4">
            {manufacturingData.productionLines.map((line) => (
              <div key={line.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <h4 className="font-medium text-gray-900">{line.name}</h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(line.status)}`}>
                      {line.status.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">ID: {line.id}</span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Efficiency</p>
                    <p className="text-lg font-semibold">{line.efficiency.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Throughput</p>
                    <p className="text-lg font-semibold">{line.throughput} units/hr</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Temperature</p>
                    <p className="text-lg font-semibold">{line.temperature.toFixed(1)}°F</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Next Maintenance</p>
                    <p className="text-lg font-semibold">{line.nextMaintenance}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'quality' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Quality Metrics</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">First Pass Yield</span>
                    <span className="text-sm font-medium">{manufacturingData.qualityData.firstPassYield}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${manufacturingData.qualityData.firstPassYield}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">Defect Rate</span>
                    <span className="text-sm font-medium">{manufacturingData.qualityData.defectRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: `${manufacturingData.qualityData.defectRate * 10}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">Rework Rate</span>
                    <span className="text-sm font-medium">{manufacturingData.qualityData.reworkRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${manufacturingData.qualityData.reworkRate * 10}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'energy' && (
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Energy Consumption (Today)</h4>
            <div className="h-64">
              <Line data={manufacturingData.energyData} options={chartOptions} />
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded">
                <p className="text-lg font-bold text-gray-900">1,435 kWh</p>
                <p className="text-xs text-gray-600">Total Today</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded">
                <p className="text-lg font-bold text-gray-900">0.85 kWh/unit</p>
                <p className="text-xs text-gray-600">Energy Intensity</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded">
                <p className="text-lg font-bold text-green-700">-5.2%</p>
                <p className="text-xs text-gray-600">vs. Yesterday</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-gray-500">No active alerts - All systems operating normally</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className={`p-4 border rounded-lg ${getAlertColor(alert.type)}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{alert.message}</p>
                      <p className="text-sm opacity-75">{alert.line} • {alert.timestamp.toLocaleTimeString()}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getAlertColor(alert.type)}`}>
                      {alert.type.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
})

export default EnhancedManufacturingWidget