import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { ArrowTrendingUpIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'
import { queryKeys, queryConfigs } from '../../services/queryClient'
import { useSSEEvent } from '../../hooks/useSSE'
import { cn } from '../../lib/utils'

const ModelToggle = ({ models, activeModels, onToggle }) => {
  const modelColors = {
    Ensemble: '#3B82F6',
    ARIMA: '#10B981', 
    HoltWinters: '#F59E0B',
    Linear: '#8B5CF6'
  }
  
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {models.map(model => (
        <button
          key={model}
          onClick={() => onToggle(model)}
          className={cn(
            "px-3 py-1 text-sm rounded-full border transition-colors",
            activeModels.includes(model)
              ? "bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900 dark:border-blue-600 dark:text-blue-200"
              : "bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
          )}
        >
          <div className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: modelColors[model] }}
            />
            <span>{model}</span>
          </div>
        </button>
      ))}
    </div>
  )
}

const ScenarioSelector = ({ scenarios, activeScenario, onSelect }) => {
  return (
    <select
      value={activeScenario}
      onChange={(e) => onSelect(e.target.value)}
      className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
    >
      {scenarios.map(scenario => (
        <option key={scenario} value={scenario}>
          {scenario}
        </option>
      ))}
    </select>
  )
}

const AccuracyMetrics = ({ metrics }) => {
  const metricItems = [
    { key: 'mape', label: 'MAPE', value: metrics?.mape, suffix: '%', target: 15 },
    { key: 'smape', label: 'sMAPE', value: metrics?.smape, suffix: '%', target: 20 },
    { key: 'rmse', label: 'RMSE', value: metrics?.rmse, suffix: '', target: 100 },
    { key: 'coverage', label: 'PI Coverage', value: metrics?.coverage, suffix: '%', target: 95 }
  ]
  
  return (
    <div className="grid grid-cols-4 gap-4 mb-4">
      {metricItems.map(item => {
        const isGood = item.value <= item.target || (item.key === 'coverage' && item.value >= item.target)
        
        return (
          <div key={item.key} className="text-center">
            <div className={cn(
              "text-lg font-semibold",
              isGood ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            )}>
              {item.value?.toFixed(1) || '—'}{item.suffix}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {item.label}
            </div>
          </div>
        )
      })}
    </div>
  )
}

const DemandForecastWidget = ({ seriesId = 'UK-AMAZON-SKU123' }) => {
  const [activeModels, setActiveModels] = useState(['Ensemble', 'ARIMA'])
  const [activeScenario, setActiveScenario] = useState('Baseline')
  const [timeHorizon, setTimeHorizon] = useState(30)
  
  // Fetch forecast data
  const { data: forecastData, isLoading, error } = useQuery({
    queryKey: queryKeys.forecastSeries(seriesId, { 
      models: activeModels, 
      scenario: activeScenario,
      horizon: timeHorizon 
    }),
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const baseData = Array.from({ length: timeHorizon }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() + i + 1)
        
        const trend = 100 + Math.sin(i * 0.1) * 20
        const seasonal = Math.sin(i * 0.3) * 15
        const noise = (Math.random() - 0.5) * 10
        
        return {
          date: date.toISOString().split('T')[0],
          actual: i < 7 ? trend + seasonal + noise : null,
          Ensemble: trend + seasonal + noise * 0.5,
          ARIMA: trend + seasonal * 0.8 + noise * 0.3,
          HoltWinters: trend * 0.95 + seasonal * 1.2 + noise * 0.4,
          Linear: trend + i * 2 + noise * 0.2,
          confidence_lower: trend + seasonal - 15,
          confidence_upper: trend + seasonal + 15
        }
      })
      
      return {
        series: baseData,
        accuracy: {
          mape: 12.4,
          smape: 14.2,
          rmse: 87.3,
          coverage: 96.2
        },
        metadata: {
          lastUpdate: new Date().toISOString(),
          modelCount: activeModels.length,
          dataPoints: baseData.length
        }
      }
    },
    ...queryConfigs.operational
  })
  
  // Listen for forecast job completion
  useSSEEvent('job.forecast.completed', (data) => {
    if (data.seriesId === seriesId) {
      // Refresh the forecast data
      queryClient.invalidateQueries({ queryKey: queryKeys.forecastSeries(seriesId) })
    }
  }, [seriesId])
  
  const handleModelToggle = (model) => {
    setActiveModels(prev => 
      prev.includes(model) 
        ? prev.filter(m => m !== model)
        : [...prev, model]
    )
  }
  
  const handleUseInOptimization = () => {
    // Emit event for workflow integration
    window.dispatchEvent(new CustomEvent('dashboard-workflow', {
      detail: {
        type: 'forecast-to-optimization',
        data: {
          seriesId,
          forecastData: forecastData?.series,
          horizon: timeHorizon,
          scenario: activeScenario
        }
      }
    }))
  }
  
  if (error) {
    return (
      <div className="h-full flex items-center justify-center text-center">
        <div className="text-red-600 dark:text-red-400">
          <ArrowTrendingUpIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-lg font-medium">Failed to load forecast</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {error.message}
          </p>
          <button 
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="h-full flex flex-col">
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center space-x-4">
          <h3 className="font-medium text-gray-900 dark:text-white">
            {seriesId}
          </h3>
          <ScenarioSelector
            scenarios={['Baseline', 'Optimistic', 'Pessimistic', 'Holiday']}
            activeScenario={activeScenario}
            onSelect={setActiveScenario}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <select
            value={timeHorizon}
            onChange={(e) => setTimeHorizon(Number(e.target.value))}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value={30}>30 days</option>
            <option value={60}>60 days</option>
            <option value={90}>90 days</option>
          </select>
          
          <button
            onClick={handleUseInOptimization}
            disabled={!forecastData}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Use in Optimization
          </button>
          
          <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <Cog6ToothIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Model toggles */}
      <ModelToggle
        models={['Ensemble', 'ARIMA', 'HoltWinters', 'Linear']}
        activeModels={activeModels}
        onToggle={handleModelToggle}
      />
      
      {/* Accuracy metrics */}
      {forecastData?.accuracy && (
        <AccuracyMetrics metrics={forecastData.accuracy} />
      )}
      
      {/* Chart */}
      <div className="flex-1 min-h-0">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-pulse">
              <div className="h-64 bg-gray-200 dark:bg-gray-600 rounded"></div>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={forecastData?.series || []}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date"
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
                fontSize={12}
              />
              <YAxis fontSize={12} />
              <Tooltip
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px'
                }}
              />
              <Legend />
              
              {/* Confidence bands */}
              <Line
                type="monotone"
                dataKey="confidence_upper"
                stroke="none"
                fill="#3B82F6"
                fillOpacity={0.1}
                strokeWidth={0}
              />
              
              {/* Actual data */}
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#1F2937"
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls={false}
                name="Actual"
              />
              
              {/* Model forecasts */}
              {activeModels.map(model => (
                <Line
                  key={model}
                  type="monotone"
                  dataKey={model}
                  stroke={
                    model === 'Ensemble' ? '#3B82F6' :
                    model === 'ARIMA' ? '#10B981' :
                    model === 'HoltWinters' ? '#F59E0B' : '#8B5CF6'
                  }
                  strokeWidth={2}
                  strokeDasharray={model === 'Ensemble' ? '0' : '5 5'}
                  dot={false}
                  name={model}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
      
      {/* Footer info */}
      <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <span>
          Last updated: {forecastData?.metadata?.lastUpdate ? 
            new Date(forecastData.metadata.lastUpdate).toLocaleTimeString() : '—'
          }
        </span>
        <span>
          {forecastData?.metadata?.dataPoints} data points
        </span>
      </div>
    </div>
  )
}

export default DemandForecastWidget