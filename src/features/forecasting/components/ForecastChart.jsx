import React, { useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine,
  Legend,
  Brush
} from 'recharts'
import {
  ChartBarIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowsUpDownIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/solid'

const ForecastChart = ({
  data = [],
  scenarios = {},
  title = "Forecast Chart",
  height = 400,
  showConfidenceBands = true,
  showScenarios = true,
  className = "",
  onDataPointClick,
  interactive = true
}) => {
  const [visibleScenarios, setVisibleScenarios] = React.useState({
    realistic: true,
    optimistic: false,
    pessimistic: false,
    stressed: false
  })
  const [showBrush, setShowBrush] = React.useState(false)
  const [chartType, setChartType] = React.useState('line') // line, area

  // Process data for chart display
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []

    const processedData = data.map((point, __index) => ({
      ...point,
      index,
      date: new Date(point.date).toLocaleDateString(),
      shortDate: new Date(point.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }),
      value: typeof point.value === 'number' ? Math.round(point.value) : 0,
      confidence: point.confidence ? Math.round(point.confidence * 100) : null,
      upperBound: point.confidence
        ? Math.round(point.value * (1 + (1 - point.confidence) * 0.5))
        : point.value,
      lowerBound: point.confidence
        ? Math.round(point.value * (1 - (1 - point.confidence) * 0.5))
        : point.value,
      isHistorical: !point.isForecast,
      isForecast: point.isForecast || false
    }))

    // Add scenario data if available
    if (showScenarios && scenarios) {
      Object.entries(scenarios).forEach(([scenarioName, scenarioData]) => {
        if (visibleScenarios[scenarioName] && scenarioData) {
          scenarioData.forEach((scenarioPoint, _index) => {
            const existingPoint = processedData[index]
            if (existingPoint) {
              existingPoint[`${scenarioName}Value`] = typeof scenarioPoint.value === 'number'
                ? Math.round(scenarioPoint.value)
                : 0
            }
          })
        }
      })
    }

    return processedData
  }, [data, scenarios, visibleScenarios, showScenarios])

  const historicalData = chartData.filter(d => d.isHistorical)
  const forecastData = chartData.filter(d => d.isForecast)
  const forecastStartIndex = historicalData.length - 1

  const toggleScenario = (scenario) => {
    setVisibleScenarios(prev => ({
      ...prev,
      [scenario]: !prev[scenario]
    }))
  }

  const formatValue = (value) => {
    if (typeof value !== 'number' || isNaN(value)) return '--'
    return value.toLocaleString()
  }

  const formatTooltipValue = (value, name) => {
    if (typeof value !== 'number' || isNaN(value)) return ['--', name]

    const formattedValue = value.toLocaleString()
    let label = name

    switch (name) {
      case 'value':
        label = 'Actual/Forecast'
        break
      case 'upperBound':
        label = 'Upper Confidence'
        break
      case 'lowerBound':
        label = 'Lower Confidence'
        break
      case 'realisticValue':
        label = 'Realistic Scenario'
        break
      case 'optimisticValue':
        label = 'Optimistic Scenario'
        break
      case 'pessimisticValue':
        label = 'Pessimistic Scenario'
        break
      case 'stressedValue':
        label = 'Stressed Scenario'
        break
      default:
        label = name.charAt(0).toUpperCase() + name.slice(1)
    }

    return [formattedValue, label]
  }

  const customTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length > 0) {
      const dataPoint = payload[0].payload

      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
          <div className="space-y-1">
            {payload.map((entry, __index) => {
              const [value, name] = formatTooltipValue(entry.value, entry.dataKey)
              return (
                <div key={index} className="flex justify-between items-center">
                  <span
                    className="text-sm"
                    style={{ color: entry.color }}
                  >
                    {name}:
                  </span>
                  <span className="font-medium ml-2" style={{ color: entry.color }}>
                    {value}
                  </span>
                </div>
              )
            })}
          </div>
          {dataPoint.confidence && (
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Confidence:
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {dataPoint.confidence}%
                </span>
              </div>
            </div>
          )}
        </div>
      )
    }
    return null
  }

  if (!chartData || chartData.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No forecast data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const ChartComponent = chartType === 'area' ? AreaChart : LineChart
  const DataComponent = chartType === 'area' ? Area : Line

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2 text-blue-600" />
            {title}
          </CardTitle>

          {interactive && (
            <div className="flex items-center space-x-2">
              {/* Chart Type Toggle */}
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
                className="px-2 py-1 text-xs border border-gray-300 rounded"
              >
                <option value="line">Line</option>
                <option value="area">Area</option>
              </select>

              {/* Brush Toggle */}
              <button
                onClick={() => setShowBrush(!showBrush)}
                className={`p-1 rounded ${showBrush ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
                title="Toggle zoom brush"
              >
                <ArrowsUpDownIcon className="h-4 w-4" />
              </button>

              {/* Confidence Bands Toggle */}
              <button
                onClick={() => setShowConfidenceBands(!showConfidenceBands)}
                className={`p-1 rounded ${showConfidenceBands ? 'bg-green-100 text-green-600' : 'text-gray-400'}`}
                title="Toggle confidence bands"
              >
                {showConfidenceBands ? <EyeIcon className="h-4 w-4" /> : <EyeSlashIcon className="h-4 w-4" />}
              </button>

              {/* Settings */}
              <button
                className="p-1 text-gray-400 hover:text-gray-600"
                title="Chart settings"
              >
                <AdjustmentsHorizontalIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Scenario Toggles */}
        {showScenarios && scenarios && Object.keys(scenarios).length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {Object.keys(scenarios).map(scenario => (
              <button
                key={scenario}
                onClick={() => toggleScenario(scenario)}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  visibleScenarios[scenario]
                    ? 'bg-blue-100 text-blue-700 border-blue-300'
                    : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                }`}
              >
                {scenario.charAt(0).toUpperCase() + scenario.slice(1)}
              </button>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <ChartComponent
            data={chartData}
            margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="shortDate"
              stroke="#666"
              fontSize={12}
              tickLine={false}
            />
            <YAxis
              stroke="#666"
              fontSize={12}
              tickLine={false}
              tickFormatter={formatValue}
            />
            <Tooltip content={customTooltip} />
            <Legend />

            {/* Confidence Bands */}
            {showConfidenceBands && (
              <>
                <Area
                  type="monotone"
                  dataKey="upperBound"
                  stroke="none"
                  fill="#e0f2fe"
                  fillOpacity={0.3}
                />
                <Area
                  type="monotone"
                  dataKey="lowerBound"
                  stroke="none"
                  fill="#ffffff"
                  fillOpacity={1}
                />
              </>
            )}

            {/* Main forecast line */}
            <DataComponent
              type="monotone"
              dataKey="value"
              stroke="#2563eb"
              strokeWidth={3}
              fill={chartType === 'area' ? "#3b82f6" : undefined}
              fillOpacity={chartType === 'area' ? 0.1 : undefined}
              dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#2563eb', strokeWidth: 2 }}
            />

            {/* Scenario lines */}
            {visibleScenarios.optimistic && (
              <Line
                type="monotone"
                dataKey="optimisticValue"
                stroke="#16a34a"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            )}

            {visibleScenarios.pessimistic && (
              <Line
                type="monotone"
                dataKey="pessimisticValue"
                stroke="#dc2626"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            )}

            {visibleScenarios.stressed && (
              <Line
                type="monotone"
                dataKey="stressedValue"
                stroke="#9333ea"
                strokeWidth={2}
                strokeDasharray="10 5"
                dot={false}
              />
            )}

            {/* Reference line at forecast start */}
            {forecastStartIndex > 0 && (
              <ReferenceLine
                x={chartData[forecastStartIndex]?.shortDate}
                stroke="#6b7280"
                strokeDasharray="2 2"
                label={{ value: "Forecast Start", position: "top" }}
              />
            )}

            {/* Brush for zooming */}
            {showBrush && (
              <Brush
                dataKey="shortDate"
                height={30}
                stroke="#8884d8"
                fill="#f0f4ff"
              />
            )}
          </ChartComponent>
        </ResponsiveContainer>

        {/* Chart Statistics */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Historical Points:</span>
              <span className="ml-2 font-semibold">{historicalData.length}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Forecast Points:</span>
              <span className="ml-2 font-semibold">{forecastData.length}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Avg Confidence:</span>
              <span className="ml-2 font-semibold">
                {forecastData.length > 0
                  ? Math.round(
                      forecastData.reduce((sum, d) => sum + (d.confidence || 80), 0) / forecastData.length
                    )
                  : '--'
                }%
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Active Scenarios:</span>
              <span className="ml-2 font-semibold">
                {Object.values(visibleScenarios).filter(Boolean).length}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ForecastChart