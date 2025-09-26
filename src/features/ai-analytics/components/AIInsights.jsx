import {
  SparklesIcon,
  LightBulbIcon,
  TrendingUpIcon,
  CpuChipIcon,
  ChartBarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { useState } from 'react'

import { Card, CardContent, CardHeader, CardTitle , Badge , Alert, AlertDescription, AlertTitle } from '../../../components/ui'
import { cn } from '../../../utils/cn'

const generateMockInsights = () => {
  return {
    predictions: [
      {
        id: 1,
        type: 'demand',
        title: 'Demand Surge Expected',
        description: 'AI predicts 35% increase in demand for SNTG-001 in the next 2 weeks based on seasonal patterns and social media sentiment.',
        confidence: 87,
        impact: 'high',
        actionable: true,
        suggestedAction: 'Increase production capacity by 40% and pre-order raw materials'
      },
      {
        id: 2,
        type: 'inventory',
        title: 'Inventory Optimization Opportunity',
        description: 'Reduce UK warehouse stock by 20% and redistribute to EU locations for 15% reduction in holding costs.',
        confidence: 92,
        impact: 'medium',
        actionable: true,
        suggestedAction: 'Transfer 5,000 units from UK to Amsterdam warehouse'
      },
      {
        id: 3,
        type: 'quality',
        title: 'Quality Issue Pattern Detected',
        description: 'Machine Line 3 showing 2.3% higher defect rate during night shifts. Correlation with temperature variations identified.',
        confidence: 78,
        impact: 'medium',
        actionable: true,
        suggestedAction: 'Adjust temperature controls and schedule maintenance'
      },
      {
        id: 4,
        type: 'financial',
        title: 'Cash Flow Optimization',
        description: 'Adjusting payment terms with top 3 suppliers could improve cash conversion cycle by 8 days.',
        confidence: 85,
        impact: 'high',
        actionable: true,
        suggestedAction: 'Negotiate 45-day payment terms with suppliers A, C, and F'
      }
    ],
    anomalies: [
      {
        id: 1,
        severity: 'warning',
        area: 'Production',
        description: 'Unusual spike in energy consumption on Line 2',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        status: 'investigating'
      },
      {
        id: 2,
        severity: 'info',
        area: 'Sales',
        description: 'Higher than expected conversion rate on Amazon US',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        status: 'monitoring'
      }
    ],
    recommendations: [
      {
        id: 1,
        category: 'Cost Reduction',
        title: 'Optimize Shipping Routes',
        savings: 45000,
        effort: 'low',
        timeframe: '2 weeks'
      },
      {
        id: 2,
        category: 'Revenue Growth',
        title: 'Dynamic Pricing Implementation',
        revenue: 125000,
        effort: 'medium',
        timeframe: '1 month'
      },
      {
        id: 3,
        category: 'Efficiency',
        title: 'Automate Quality Checks',
        savings: 35000,
        effort: 'high',
        timeframe: '3 months'
      }
    ],
    performance: {
      accuracy: 94,
      responsiveness: 98,
      dataQuality: 91,
      modelConfidence: 88
    }
  }
}

export function AIInsights({ onInsightClick, onActionClick }) {
  const [insights] = useState(generateMockInsights())
  const [selectedInsight, setSelectedInsight] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'high':
        return 'text-red-600 bg-red-50'
      case 'medium':
        return 'text-amber-600 bg-amber-50'
      case 'low':
        return 'text-green-600 bg-green-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getConfidenceColor = (confidence) => {
    if (confidence >= 90) return 'text-green-600'
    if (confidence >= 70) return 'text-blue-600'
    return 'text-amber-600'
  }

  const handleAction = async (insight) => {
    setIsProcessing(true)
    setSelectedInsight(insight)

    // Simulate AI processing
    setTimeout(() => {
      setIsProcessing(false)
      onActionClick && onActionClick(insight)
    }, 2000)
  }

  const renderPredictions = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-purple-600" />
            AI Predictions & Insights
          </CardTitle>
          <Badge variant="info">Real-time Analysis</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.predictions.map(prediction => (
            <div
              key={prediction.id}
              className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onInsightClick && onInsightClick(prediction)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <LightBulbIcon className="h-5 w-5 text-yellow-500" />
                  <h4 className="font-semibold">{prediction.title}</h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'px-2 py-1 rounded text-xs font-medium',
                    getImpactColor(prediction.impact)
                  )}>
                    {prediction.impact} impact
                  </span>
                  <span className={cn(
                    'text-sm font-medium',
                    getConfidenceColor(prediction.confidence)
                  )}>
                    {prediction.confidence}% confidence
                  </span>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-3">
                {prediction.description}
              </p>

              {prediction.actionable && (
                <div className="flex items-center justify-between pt-3 border-t">
                  <p className="text-sm font-medium text-gray-700">
                    Suggested Action: {prediction.suggestedAction}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAction(prediction)
                    }}
                    disabled={isProcessing && selectedInsight?.id === prediction.id}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isProcessing && selectedInsight?.id === prediction.id
                      ? 'Processing...'
                      : 'Take Action'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  const renderAnomalies = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExclamationTriangleIcon className="h-5 w-5 text-amber-600" />
          Anomaly Detection
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {insights.anomalies.map(anomaly => (
            <Alert key={anomaly.id} variant={anomaly.severity}>
              <AlertTitle className="flex items-center justify-between">
                <span>{anomaly.area}</span>
                <Badge variant={anomaly.severity === 'warning' ? 'warning' : 'info'}>
                  {anomaly.status}
                </Badge>
              </AlertTitle>
              <AlertDescription>
                <p className="text-sm">{anomaly.description}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Detected {new Date(anomaly.timestamp).toLocaleTimeString()}
                </p>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  const renderRecommendations = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUpIcon className="h-5 w-5 text-green-600" />
          AI Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {insights.recommendations.map(rec => (
            <div
              key={rec.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="default">{rec.category}</Badge>
                  <h4 className="font-medium">{rec.title}</h4>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>
                    Potential: ${((rec.savings || 0) + (rec.revenue || 0)).toLocaleString()}
                  </span>
                  <span>Effort: {rec.effort}</span>
                  <span>Timeline: {rec.timeframe}</span>
                </div>
              </div>
              <button className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded">
                View Details
              </button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  const renderPerformanceMetrics = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CpuChipIcon className="h-5 w-5 text-blue-600" />
          AI System Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(insights.performance).map(([key, value]) => (
            <div key={key} className="text-center">
              <div className="text-2xl font-bold text-blue-600">{value}%</div>
              <div className="text-xs text-gray-600 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className={cn(
                    "h-2 rounded-full",
                    value >= 90 ? 'bg-green-600' :
                    value >= 70 ? 'bg-blue-600' :
                    'bg-amber-600'
                  )}
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Insights</p>
                <p className="text-2xl font-bold">{insights.predictions.length}</p>
              </div>
              <SparklesIcon className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Anomalies</p>
                <p className="text-2xl font-bold">{insights.anomalies.length}</p>
              </div>
              <ExclamationTriangleIcon className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Recommendations</p>
                <p className="text-2xl font-bold">{insights.recommendations.length}</p>
              </div>
              <TrendingUpIcon className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">AI Accuracy</p>
                <p className="text-2xl font-bold">{insights.performance.accuracy}%</p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {renderPredictions()}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderAnomalies()}
        {renderRecommendations()}
      </div>

      {renderPerformanceMetrics()}
    </div>
  )
}