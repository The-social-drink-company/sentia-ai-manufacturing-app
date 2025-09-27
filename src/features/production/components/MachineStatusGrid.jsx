import { useState, useMemo, memo, useCallback } from 'react'
import {
  CogIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  WrenchScrewdriverIcon,
  ThermometerIcon,
  BoltIcon
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui'

const MachineStatusGrid = memo(function MachineStatusGrid({ machines = [] }) {
  const [selectedMachine, setSelectedMachine] = useState(null)

  // Mock data fallback - memoized to prevent unnecessary re-calculations
  const machineData = useMemo(() => machines.length > 0 ? machines : [
    {
      id: 'line-1',
      name: 'Production Line 1',
      type: 'filling',
      status: 'running',
      efficiency: 87.5,
      currentSpeed: 850,
      targetSpeed: 1000,
      temperature: 22.5,
      pressure: 2.8,
      vibration: 0.5,
      runtime: 342,
      lastMaintenance: '2024-09-20',
      nextMaintenance: '2024-10-04',
      alerts: []
    },
    {
      id: 'line-2',
      name: 'Production Line 2',
      type: 'bottling',
      status: 'setup',
      efficiency: 0,
      currentSpeed: 0,
      targetSpeed: 800,
      temperature: 21.8,
      pressure: 2.5,
      vibration: 0.1,
      runtime: 0,
      lastMaintenance: '2024-09-18',
      nextMaintenance: '2024-10-02',
      alerts: [
        {
          severity: 'warning',
          message: 'Setup in progress - estimated 15 minutes remaining'
        }
      ]
    }
  ], [machines])

  const getStatusConfig = (status) => {
    const configs = {
      'running': {
        color: 'green',
        bgColor: 'bg-green-100 dark:bg-green-900/20',
        textColor: 'text-green-800 dark:text-green-200',
        icon: CheckCircleIcon,
        label: 'Running'
      },
      'setup': {
        color: 'yellow',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
        textColor: 'text-yellow-800 dark:text-yellow-200',
        icon: WrenchScrewdriverIcon,
        label: 'Setup'
      },
      'idle': {
        color: 'gray',
        bgColor: 'bg-gray-100 dark:bg-gray-700/20',
        textColor: 'text-gray-800 dark:text-gray-200',
        icon: ClockIcon,
        label: 'Idle'
      },
      'down': {
        color: 'red',
        bgColor: 'bg-red-100 dark:bg-red-900/20',
        textColor: 'text-red-800 dark:text-red-200',
        icon: XCircleIcon,
        label: 'Down'
      }
    }
    return configs[status] || configs['idle']
  }

  const getEfficiencyStatus = (efficiency) => {
    if (efficiency >= 85) return 'excellent'
    if (efficiency >= 70) return 'good'
    if (efficiency >= 50) return 'fair'
    return 'poor'
  }

  const formatRuntime = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const formatTemperature = (temp) => `${temp}°C`
  const formatPressure = (pressure) => `${pressure} bar`
  const formatVibration = (vibration) => `${vibration} mm/s`

  const MachineCard = ({ machine }) => {
    const statusConfig = getStatusConfig(machine.status)
    const efficiencyStatus = getEfficiencyStatus(machine.efficiency)
    const StatusIcon = statusConfig.icon

    const hasAlerts = machine.alerts && machine.alerts.length > 0
    const criticalAlerts = machine.alerts?.filter(alert => alert.severity === 'critical').length || 0
    const warningAlerts = machine.alerts?.filter(alert => alert.severity === 'warning').length || 0

    return (
      <div
        className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-lg ${
          selectedMachine?.id === machine.id
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'
        }`}
        onClick={() => setSelectedMachine(selectedMachine?.id === machine.id ? null : machine)}
      >
        {/* Alert Badge */}
        {hasAlerts && (
          <div className="absolute -top-2 -right-2 flex items-center space-x-1">
            {criticalAlerts > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                {criticalAlerts}
              </span>
            )}
            {warningAlerts > 0 && (
              <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                {warningAlerts}
              </span>
            )}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${statusConfig.bgColor}`}>
              <StatusIcon className={`h-5 w-5 text-${statusConfig.color}-600 dark:text-${statusConfig.color}-400`} />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">{machine.name}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{machine.type}</p>
            </div>
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusConfig.bgColor} ${statusConfig.textColor}`}>
            {statusConfig.label}
          </span>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Efficiency</p>
            <div className="flex items-center">
              <p className={`text-lg font-semibold ${
                efficiencyStatus === 'excellent' ? 'text-green-600' :
                efficiencyStatus === 'good' ? 'text-blue-600' :
                efficiencyStatus === 'fair' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {machine.efficiency.toFixed(1)}%
              </p>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Speed</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {machine.currentSpeed}/{machine.targetSpeed}
            </p>
          </div>
        </div>

        {/* Speed Progress Bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
            <span>Speed Utilization</span>
            <span>{Math.round((machine.currentSpeed / machine.targetSpeed) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                machine.currentSpeed / machine.targetSpeed >= 0.9 ? 'bg-green-500' :
                machine.currentSpeed / machine.targetSpeed >= 0.7 ? 'bg-blue-500' :
                machine.currentSpeed / machine.targetSpeed >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min((machine.currentSpeed / machine.targetSpeed) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <ThermometerIcon className="h-4 w-4 mx-auto text-gray-400 mb-1" />
            <p className="text-gray-600 dark:text-gray-400">{formatTemperature(machine.temperature)}</p>
          </div>
          <div className="text-center">
            <BoltIcon className="h-4 w-4 mx-auto text-gray-400 mb-1" />
            <p className="text-gray-600 dark:text-gray-400">{formatPressure(machine.pressure)}</p>
          </div>
          <div className="text-center">
            <CogIcon className="h-4 w-4 mx-auto text-gray-400 mb-1" />
            <p className="text-gray-600 dark:text-gray-400">{formatRuntime(machine.runtime)}</p>
          </div>
        </div>
      </div>
    )
  }

  const MachineDetails = ({ machine }) => {
    if (!machine) return null

    const statusConfig = getStatusConfig(machine.status)
    const nextMaintenanceDate = new Date(machine.nextMaintenance)
    const daysUntilMaintenance = Math.ceil((nextMaintenanceDate - new Date()) / (1000 * 60 * 60 * 24))

    return (
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          {machine.name} - Detailed Status
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Operational Metrics */}
          <div>
            <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
              Operational Metrics
            </h5>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Current Status:</span>
                <span className={`text-sm font-medium ${statusConfig.textColor}`}>
                  {statusConfig.label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Efficiency:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {machine.efficiency.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Current Speed:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {machine.currentSpeed} units/min
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Target Speed:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {machine.targetSpeed} units/min
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Runtime Today:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatRuntime(machine.runtime)}
                </span>
              </div>
            </div>
          </div>

          {/* Sensor Data & Maintenance */}
          <div>
            <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
              Sensor Data & Maintenance
            </h5>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Temperature:</span>
                <span className={`text-sm font-medium ${
                  machine.temperature > 25 ? 'text-yellow-600' :
                  machine.temperature > 30 ? 'text-red-600' : 'text-gray-900 dark:text-white'
                }`}>
                  {formatTemperature(machine.temperature)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Pressure:</span>
                <span className={`text-sm font-medium ${
                  machine.pressure > 3.2 ? 'text-yellow-600' : 'text-gray-900 dark:text-white'
                }`}>
                  {formatPressure(machine.pressure)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Vibration:</span>
                <span className={`text-sm font-medium ${
                  machine.vibration > 1.5 ? 'text-red-600' :
                  machine.vibration > 1.0 ? 'text-yellow-600' : 'text-gray-900 dark:text-white'
                }`}>
                  {formatVibration(machine.vibration)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Next Maintenance:</span>
                <span className={`text-sm font-medium ${
                  daysUntilMaintenance <= 3 ? 'text-red-600' :
                  daysUntilMaintenance <= 7 ? 'text-yellow-600' : 'text-gray-900 dark:text-white'
                }`}>
                  {daysUntilMaintenance} days
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {machine.alerts && machine.alerts.length > 0 && (
          <div className="mt-4">
            <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
              Active Alerts
            </h5>
            <div className="space-y-2">
              {machine.alerts.map((alert, _index) => (
                <div key={index} className={`flex items-start p-2 rounded ${
                  alert.severity === 'critical' ? 'bg-red-50 dark:bg-red-900/20 border border-red-200' :
                  alert.severity === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200' :
                  'bg-blue-50 dark:bg-blue-900/20 border border-blue-200'
                }`}>
                  <ExclamationTriangleIcon className={`h-4 w-4 mt-0.5 mr-2 flex-shrink-0 ${
                    alert.severity === 'critical' ? 'text-red-500' :
                    alert.severity === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                  }`} />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{alert.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CogIcon className="h-6 w-6 mr-2 text-blue-600" />
          Machine Status Overview
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* Machine Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {machineData.map((machine) => (
            <MachineCard key={machine.id} machine={machine} />
          ))}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-2xl font-bold text-green-600">
              {machineData.filter(m => m.status === 'running').length}
            </p>
            <p className="text-xs text-green-700 dark:text-green-400">Running</p>
          </div>
          <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">
              {machineData.filter(m => m.status === 'setup').length}
            </p>
            <p className="text-xs text-yellow-700 dark:text-yellow-400">Setup</p>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/20 rounded-lg">
            <p className="text-2xl font-bold text-gray-600">
              {machineData.filter(m => m.status === 'idle').length}
            </p>
            <p className="text-xs text-gray-700 dark:text-gray-400">Idle</p>
          </div>
          <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-2xl font-bold text-red-600">
              {machineData.filter(m => m.status === 'down').length}
            </p>
            <p className="text-xs text-red-700 dark:text-red-400">Down</p>
          </div>
        </div>

        {/* Selected Machine Details */}
        <MachineDetails machine={selectedMachine} />

        {/* Instructions */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-xs text-blue-700 dark:text-blue-400">
            💡 Click on any machine card to view detailed status information, sensor readings, and maintenance schedules.
          </p>
        </div>
      </CardContent>
    </Card>
  )
})

export default MachineStatusGrid