/**
 * Enhanced Forecasting Component
 * Implements 365-day forecasting with dual AI models
 * Target: 88%+ accuracy with advanced business intelligence
 */

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Brain,
  Zap,
  Target,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calendar,
} from 'lucide-react'

const EnhancedForecasting = () => {
  const [forecastData, setForecastData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [forecastHorizon, setForecastHorizon] = useState(90)
  const [selectedScenario, setSelectedScenario] = useState('realistic')
  const [aiModelsStatus, setAiModelsStatus] = useState({ openai: false, claude: false })

  // Forecast configuration options
  const horizonOptions = [
    { value: 30, label: '30 Days', icon: Calendar },
    { value: 90, label: '90 Days', icon: Calendar },
    { value: 180, label: '180 Days', icon: Calendar },
    { value: 365, label: '365 Days', icon: Calendar },
  ]

  const scenarioOptions = [
    { value: 'pessimistic', label: 'Conservative', color: 'orange', probability: '20%' },
    { value: 'realistic', label: 'Realistic', color: 'blue', probability: '60%' },
    { value: 'optimistic', label: 'Optimistic', color: 'green', probability: '20%' },
  ]

  // Generate enhanced forecast using dual AI models
  const generateEnhancedForecast = useCallback(async () => {
    setIsLoading(true)
    try {
      // Check AI models availability
      const aiStatus = await fetch('/api/ai/status').then(r => r.json())
      setAiModelsStatus(aiStatus.models || { openai: false, claude: false })

      // Generate forecast with current parameters
      const response = await fetch('/api/forecasting/enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          horizon: forecastHorizon,
          includeScenarios: true,
          includeTrendAnalysis: true,
          includeSeasonality: true,
          businessContext: {
            currentInventory: 12500,
            productionCapacity: 15000,
            marketConditions: 'stable',
            economicIndicators: 'positive',
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`Forecast generation failed: ${response.statusText}`)
      }

      const data = await response.json()
      setForecastData(data)
    } catch (error) {
      console.error('Enhanced forecast generation failed:', error)
      setForecastData(null) // Set null on error
    } finally {
      setIsLoading(false)
    }
  }, [forecastHorizon])

  // Auto-generate forecast on component mount and horizon change
  useEffect(() => {
    generateEnhancedForecast()
  }, [generateEnhancedForecast])

  // Format chart data based on selected scenario
  const getChartData = () => {
    if (!forecastData?.analytics?.scenarios?.scenarios) return []

    const scenarioData = forecastData.analytics.scenarios.scenarios[selectedScenario]
    return (
      scenarioData?.slice(0, Math.min(90, scenarioData.length)).map(point => ({
        day: point.day,
        date: point.date,
        value: point.value,
        confidence: point.confidence * 100,
      })) || []
    )
  }

  // Get confidence color based on value
  const getConfidenceColor = confidence => {
    if (confidence >= 0.85) return 'text-green-600'
    if (confidence >= 0.75) return 'text-yellow-600'
    return 'text-red-600'
  }

  // Format large numbers
  const formatNumber = num => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num?.toLocaleString() || '0'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Generating enhanced AI forecast...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Enhanced AI Forecasting</h1>
          <p className="text-gray-600 mt-1">Dual AI models with 88%+ accuracy targeting</p>
        </div>

        {/* AI Models Status */}
        <div className="flex gap-2">
          <Badge
            variant={aiModelsStatus.openai ? 'success' : 'secondary'}
            className="flex items-center gap-1"
          >
            <Brain className="w-3 h-3" />
            OpenAI {aiModelsStatus.openai ? 'Online' : 'Offline'}
          </Badge>
          <Badge
            variant={aiModelsStatus.claude ? 'success' : 'secondary'}
            className="flex items-center gap-1"
          >
            <Zap className="w-3 h-3" />
            Claude {aiModelsStatus.claude ? 'Online' : 'Offline'}
          </Badge>
        </div>
      </div>

      {/* Forecast Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Forecast Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            {/* Horizon Selection */}
            <div className="flex gap-2">
              <span className="text-sm font-medium text-gray-700 self-center">Horizon:</span>
              {horizonOptions.map(option => (
                <Button
                  key={option.value}
                  variant={forecastHorizon === option.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setForecastHorizon(option.value)}
                  className="flex items-center gap-1"
                >
                  <option.icon className="w-3 h-3" />
                  {option.label}
                </Button>
              ))}
            </div>

            <div className="border-l h-6"></div>

            {/* Generate Button */}
            <Button
              onClick={generateEnhancedForecast}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Brain className="w-4 h-4" />
              {isLoading ? 'Generating...' : 'Generate Forecast'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {forecastData && (
        <>
          {/* Forecast Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Accuracy</p>
                    <p
                      className={`text-xl font-bold ${getConfidenceColor(forecastData.forecast.confidence)}`}
                    >
                      {forecastData.forecast.accuracy ||
                        Math.round(forecastData.forecast.confidence * 100)}
                      %
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Avg Demand</p>
                    <p className="text-xl font-bold">
                      {formatNumber(forecastData.analytics.summary.averageDemand)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  {forecastData.analytics.trendAnalysis.direction === 'growth' ? (
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  )}
                  <div>
                    <p className="text-sm text-gray-600">Trend</p>
                    <p
                      className={`text-xl font-bold ${
                        forecastData.analytics.trendAnalysis.direction === 'growth'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {forecastData.analytics.trendAnalysis.rate > 0 ? '+' : ''}
                      {forecastData.analytics.trendAnalysis.rate}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Horizon</p>
                    <p className="text-xl font-bold">{forecastHorizon} Days</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Forecast Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Demand Forecast - {forecastHorizon} Days</CardTitle>
                <div className="flex gap-2">
                  {scenarioOptions.map(scenario => (
                    <Button
                      key={scenario.value}
                      variant={selectedScenario === scenario.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedScenario(scenario.value)}
                      className="flex items-center gap-1"
                    >
                      <div className={`w-2 h-2 rounded-full bg-${scenario.color}-500`}></div>
                      {scenario.label} ({scenario.probability})
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={value => formatNumber(value)} />
                  <Tooltip
                    formatter={(value, name) => [formatNumber(value), name]}
                    labelFormatter={label => `Day ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#3B82F6"
                    fill="url(#colorGradient)"
                    strokeWidth={2}
                  />
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Insights and Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {forecastData.analytics.insights?.map((insight, index) => (
                    <div key={index} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                      {insight.type === 'opportunity' && (
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                      )}
                      {insight.type === 'risk' && (
                        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                      )}
                      {insight.type === 'pattern' && (
                        <BarChart3 className="w-5 h-5 text-blue-600 mt-0.5" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{insight.message}</p>
                        <p className="text-xs text-gray-600 mt-1">{insight.action}</p>
                        <Badge
                          size="sm"
                          variant={insight.priority === 'high' ? 'destructive' : 'secondary'}
                          className="mt-1"
                        >
                          {insight.priority} priority
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Actionable Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {forecastData.analytics.recommendations?.map((rec, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">{rec.title}</h4>
                        <Badge
                          variant={rec.priority === 'high' ? 'destructive' : 'secondary'}
                          size="sm"
                        >
                          {rec.impact} impact
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{rec.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="capitalize">{rec.category.replace('_', ' ')}</span>
                        <span>{rec.timeframe}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Model Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>AI Model Performance</CardTitle>
              <CardDescription>
                Dual AI model ensemble delivering enhanced forecast accuracy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900">OpenAI GPT-4</h4>
                  <p className="text-2xl font-bold text-blue-600">
                    {Math.round((forecastData.forecast.modelContributions?.openai || 0.6) * 100)}%
                  </p>
                  <p className="text-sm text-blue-700">Contribution</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-900">Claude 3 Sonnet</h4>
                  <p className="text-2xl font-bold text-purple-600">
                    {Math.round((forecastData.forecast.modelContributions?.claude || 0.4) * 100)}%
                  </p>
                  <p className="text-sm text-purple-700">Contribution</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900">Ensemble Accuracy</h4>
                  <p className="text-2xl font-bold text-green-600">
                    {forecastData.forecast.accuracy ||
                      Math.round(forecastData.forecast.confidence * 100)}
                    %
                  </p>
                  <p className="text-sm text-green-700">Target: 88%+</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

export default EnhancedForecasting
