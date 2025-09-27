import {
  ChartBarIcon,
  ExclamationTriangleIcon,
  TruckIcon,
  CogIcon,
  UsersIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle, Badge } from '../../../components/ui'

export default function CapacityPlanning({ data }) {
  // Mock data fallback
  const capacityData = data || {
    totalCapacity: 38400, // units per day
    currentUtilization: 78.5,
    availableCapacity: 8256,
    bottlenecks: [
      {
        lineId: 'line-2',
        lineName: 'Production Line 2',
        utilizationRate: 96.8,
        impact: 'High',
        recommendation: 'Consider adding parallel capacity or optimizing bottling process'
      }
    ],
    forecast: [
      { date: '2024-09-27', plannedUtilization: 82, forecastDemand: 31488, capacity: 38400 },
      { date: '2024-09-28', plannedUtilization: 75, forecastDemand: 28800, capacity: 38400 },
      { date: '2024-09-29', plannedUtilization: 90, forecastDemand: 34560, capacity: 38400 },
      { date: '2024-09-30', plannedUtilization: 85, forecastDemand: 32640, capacity: 38400 },
      { date: '2024-10-01', plannedUtilization: 88, forecastDemand: 33792, capacity: 38400 },
      { date: '2024-10-02', plannedUtilization: 72, forecastDemand: 27648, capacity: 38400 },
      { date: '2024-10-03', plannedUtilization: 68, forecastDemand: 26112, capacity: 38400 }
    ],
    constraints: [
      { type: 'Equipment', description: 'Line 2 scheduled maintenance', impact: 'Medium', duration: '4 hours' },
      { type: 'Material', description: 'Glass bottle shortage expected', impact: 'High', duration: '2 days' },
      { type: 'Staff', description: 'Reduced crew on night shift', impact: 'Low', duration: '1 week' }
    ]
  }

  const getUtilizationStatus = (utilization) => {
    if (utilization >= 95) return { color: 'red', status: 'Critical', bgColor: 'bg-red-100', textColor: 'text-red-800' }
    if (utilization >= 85) return { color: 'yellow', status: 'High', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' }
    if (utilization >= 70) return { color: 'green', status: 'Optimal', bgColor: 'bg-green-100', textColor: 'text-green-800' }
    return { color: 'blue', status: 'Low', bgColor: 'bg-blue-100', textColor: 'text-blue-800' }
  }

  const getConstraintConfig = (type) => {
    const configs = {
      'Equipment': { color: 'red', icon: CogIcon, variant: 'destructive' },
      'Material': { color: 'yellow', icon: TruckIcon, variant: 'warning' },
      'Staff': { color: 'blue', icon: UsersIcon, variant: 'info' }
    }
    return configs[type] || configs['Equipment']
  }

  const getImpactConfig = (impact) => {
    const configs = {
      'High': { color: 'red', variant: 'destructive' },
      'Medium': { color: 'yellow', variant: 'warning' },
      'Low': { color: 'green', variant: 'success' }
    }
    return configs[impact] || configs['Medium']
  }

  const currentStatus = getUtilizationStatus(capacityData.currentUtilization)
  const utilizationPercentage = (capacityData.currentUtilization / 100) * capacityData.totalCapacity

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <ChartBarIcon className="h-6 w-6 mr-2 text-blue-600" />
          Capacity Planning & Bottleneck Analysis
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Capacity Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">
              {capacityData.totalCapacity.toLocaleString()}
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-400">Total Daily Capacity</p>
            <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">units/day</p>
          </div>

          <div className={`text-center p-4 rounded-lg ${currentStatus.bgColor}`}>
            <p className={`text-2xl font-bold text-${currentStatus.color}-600`}>
              {capacityData.currentUtilization.toFixed(1)}%
            </p>
            <p className={`text-sm ${currentStatus.textColor}`}>Current Utilization</p>
            <p className={`text-xs ${currentStatus.textColor} mt-1`}>{currentStatus.status}</p>
          </div>

          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-2xl font-bold text-green-600">
              {capacityData.availableCapacity.toLocaleString()}
            </p>
            <p className="text-sm text-green-700 dark:text-green-400">Available Capacity</p>
            <p className="text-xs text-green-600 dark:text-green-300 mt-1">units/day</p>
          </div>
        </div>

        {/* Utilization Visual */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Capacity Utilization</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {utilizationPercentage.toLocaleString()} / {capacityData.totalCapacity.toLocaleString()} units
            </span>
          </div>
          <div className="relative">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6">
              <div
                className={`h-6 rounded-full transition-all duration-1000 flex items-center justify-end pr-2 text-white text-xs font-medium ${
                  capacityData.currentUtilization >= 95 ? 'bg-red-500' :
                  capacityData.currentUtilization >= 85 ? 'bg-yellow-500' :
                  capacityData.currentUtilization >= 70 ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${capacityData.currentUtilization}%` }}
              >
                {capacityData.currentUtilization.toFixed(1)}%
              </div>
            </div>
            <div className="absolute top-0 right-0 h-6 w-1 bg-red-400 opacity-75"></div>
            <span className="absolute top-7 right-0 text-xs text-red-600 dark:text-red-400">95% limit</span>
          </div>
        </div>

        {/* Bottlenecks */}
        {capacityData.bottlenecks && capacityData.bottlenecks.length > 0 && (
          <div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3 flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-red-600" />
              Identified Bottlenecks
            </h4>
            <div className="space-y-3">
              {capacityData.bottlenecks.map((bottleneck, index) => {
                const impactConfig = getImpactConfig(bottleneck.impact)
                const bottleneckStatus = getUtilizationStatus(bottleneck.utilizationRate)

                return (
                  <div key={index} className="border border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50 dark:bg-red-900/10">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h5 className="font-medium text-gray-900 dark:text-white">{bottleneck.lineName}</h5>
                          <Badge variant={impactConfig.variant}>{bottleneck.impact} Impact</Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <span>Utilization: <strong className={`${bottleneckStatus.textColor}`}>
                            {bottleneck.utilizationRate.toFixed(1)}%
                          </strong></span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{bottleneck.recommendation}</p>
                      </div>
                      <ExclamationTriangleIcon className="h-6 w-6 text-red-600 flex-shrink-0" />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 7-Day Forecast */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">7-Day Capacity Forecast</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Forecast Demand</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Available Capacity</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Planned Utilization</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {capacityData.forecast.map((day, index) => {
                  const utilizationStatus = getUtilizationStatus(day.plannedUtilization)
                  const isOvercapacity = day.forecastDemand > day.capacity
                  const remainingCapacity = day.capacity - day.forecastDemand

                  return (
                    <tr key={day.date} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(day.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">
                        {day.forecastDemand.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">
                        {day.capacity.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                day.plannedUtilization >= 95 ? 'bg-red-500' :
                                day.plannedUtilization >= 85 ? 'bg-yellow-500' :
                                day.plannedUtilization >= 70 ? 'bg-green-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${Math.min(day.plannedUtilization, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{day.plannedUtilization}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-center">
                        {isOvercapacity ? (
                          <Badge variant="destructive">Overcapacity</Badge>
                        ) : day.plannedUtilization >= 95 ? (
                          <Badge variant="destructive">Critical</Badge>
                        ) : day.plannedUtilization >= 85 ? (
                          <Badge variant="warning">High</Badge>
                        ) : (
                          <Badge variant="success">Available</Badge>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Constraints */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Capacity Constraints</h4>
          <div className="space-y-3">
            {capacityData.constraints.map((constraint, index) => {
              const constraintConfig = getConstraintConfig(constraint.type)
              const impactConfig = getImpactConfig(constraint.impact)
              const ConstraintIcon = constraintConfig.icon

              return (
                <div key={index} className="flex items-start p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className={`p-2 rounded-lg mr-3 bg-${constraintConfig.color}-100 dark:bg-${constraintConfig.color}-900/20`}>
                    <ConstraintIcon className={`h-5 w-5 text-${constraintConfig.color}-600 dark:text-${constraintConfig.color}-400`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-gray-900 dark:text-white">{constraint.type} Constraint</span>
                      <Badge variant={impactConfig.variant}>{constraint.impact} Impact</Badge>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">{constraint.description}</p>
                    <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                      <ClockIcon className="h-3 w-3 mr-1" />
                      Duration: {constraint.duration}
                    </div>
                  </div>
                </div>
              )
            })}

            {capacityData.constraints.length === 0 && (
              <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                <ChartBarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No capacity constraints identified</p>
                <p className="text-sm opacity-75">All systems operating within normal parameters</p>
              </div>
            )}
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-400 mb-2">
            Capacity Optimization Recommendations
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
            {capacityData.currentUtilization > 90 && (
              <li>• Current utilization is high ({capacityData.currentUtilization.toFixed(1)}%) - consider adding capacity or optimizing processes</li>
            )}
            {capacityData.bottlenecks.length > 0 && (
              <li>• {capacityData.bottlenecks.length} bottleneck(s) identified - prioritize optimization efforts on these areas</li>
            )}
            {capacityData.forecast.some(day => day.plannedUtilization > 95) && (
              <li>• Capacity constraints expected in upcoming days - consider production rescheduling or additional shifts</li>
            )}
            {capacityData.constraints.length > 0 && (
              <li>• {capacityData.constraints.length} constraint(s) affecting capacity - develop mitigation plans</li>
            )}
            {capacityData.currentUtilization < 70 && (
              <li>• Underutilized capacity detected - explore opportunities to increase throughput or reduce fixed costs</li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}