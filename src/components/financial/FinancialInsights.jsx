import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  LightBulbIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'
import { cn } from '@/utils/cn'

const InsightIcon = ({ type, className }) => {
  const icons = {
    positive: ArrowTrendingUpIcon,
    negative: ArrowTrendingDownIcon,
    warning: ExclamationTriangleIcon,
    info: InformationCircleIcon,
    recommendation: LightBulbIcon,
    analysis: ChartBarIcon,
  }

  const Icon = icons[type] || InformationCircleIcon
  return <Icon className={className} />
}

const getInsightStyle = type => {
  const styles = {
    positive: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      icon: 'text-green-600 dark:text-green-400',
      title: 'text-green-900 dark:text-green-100',
    },
    negative: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      icon: 'text-red-600 dark:text-red-400',
      title: 'text-red-900 dark:text-red-100',
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      icon: 'text-yellow-600 dark:text-yellow-400',
      title: 'text-yellow-900 dark:text-yellow-100',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      icon: 'text-blue-600 dark:text-blue-400',
      title: 'text-blue-900 dark:text-blue-100',
    },
    recommendation: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-200 dark:border-purple-800',
      icon: 'text-purple-600 dark:text-purple-400',
      title: 'text-purple-900 dark:text-purple-100',
    },
    analysis: {
      bg: 'bg-gray-50 dark:bg-gray-900/20',
      border: 'border-gray-200 dark:border-gray-800',
      icon: 'text-gray-600 dark:text-gray-400',
      title: 'text-gray-900 dark:text-gray-100',
    },
  }

  return styles[type] || styles.info
}

const InsightCard = ({ insight, className }) => {
  const style = getInsightStyle(insight.type)

  return (
    <div className={cn('rounded-lg border p-4 space-y-2', style.bg, style.border, className)}>
      <div className="flex items-start space-x-3">
        <InsightIcon
          type={insight.type}
          className={cn('w-5 h-5 mt-0.5 flex-shrink-0', style.icon)}
        />
        <div className="flex-1 space-y-1">
          <h4 className={cn('font-medium text-sm', style.title)}>{insight.title}</h4>
          <p className="text-sm text-muted-foreground">{insight.description}</p>
          {insight.metrics && (
            <div className="flex flex-wrap gap-2 mt-2">
              {insight.metrics.map((metric, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/60 dark:bg-black/20 text-foreground"
                >
                  {metric}
                </span>
              ))}
            </div>
          )}
          {insight.action && (
            <div className="mt-2">
              <button
                className={cn('text-xs font-medium underline hover:no-underline', style.title)}
              >
                {insight.action}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const generateInsights = data => {
  if (!data) return []

  const insights = []

  // Revenue trend analysis
  if (data.revenue?.growth > 10) {
    insights.push({
      type: 'positive',
      title: 'Strong Revenue Growth',
      description: `Revenue has grown by ${data.revenue.growth.toFixed(1)}% compared to the previous period, indicating strong market performance.`,
      metrics: [`+${data.revenue.growth.toFixed(1)}% Growth`],
      action: 'View detailed revenue analysis',
    })
  } else if (data.revenue?.growth < -5) {
    insights.push({
      type: 'negative',
      title: 'Revenue Decline Detected',
      description: `Revenue has decreased by ${Math.abs(data.revenue.growth).toFixed(1)}% from the previous period. Consider market analysis.`,
      metrics: [`${data.revenue.growth.toFixed(1)}% Decline`],
      action: 'Analyze market factors',
    })
  }

  // Profit margin analysis
  if (data.profitMargin?.current < 10) {
    insights.push({
      type: 'warning',
      title: 'Low Profit Margins',
      description: `Current profit margin of ${data.profitMargin.current.toFixed(1)}% is below industry standards. Cost optimization may be needed.`,
      metrics: [`${data.profitMargin.current.toFixed(1)}% Margin`],
      action: 'Review cost structure',
    })
  } else if (data.profitMargin?.current > 25) {
    insights.push({
      type: 'positive',
      title: 'Excellent Profit Margins',
      description: `Profit margin of ${data.profitMargin.current.toFixed(1)}% exceeds industry benchmarks, indicating efficient operations.`,
      metrics: [`${data.profitMargin.current.toFixed(1)}% Margin`],
      action: 'Maintain operational efficiency',
    })
  }

  // Working capital analysis
  if (data.workingCapital?.ratio < 1.0) {
    insights.push({
      type: 'warning',
      title: 'Working Capital Concern',
      description:
        'Current working capital ratio suggests potential liquidity challenges. Monitor cash flow closely.',
      metrics: [`${data.workingCapital.ratio.toFixed(2)}:1 Ratio`],
      action: 'Review cash flow projections',
    })
  }

  // Product performance insights
  if (data.products) {
    const topPerformer = data.products.reduce((prev, current) =>
      prev.revenue > current.revenue ? prev : current
    )

    if (topPerformer) {
      insights.push({
        type: 'info',
        title: 'Top Product Performance',
        description: `${topPerformer.name} is your leading revenue generator with ${topPerformer.marketShare.toFixed(1)}% market share.`,
        metrics: [
          `£${topPerformer.revenue.toLocaleString()}`,
          `${topPerformer.marketShare.toFixed(1)}% Share`,
        ],
        action: 'Optimize top performer strategy',
      })
    }
  }

  // Seasonal analysis
  if (data.seasonality?.detected) {
    insights.push({
      type: 'analysis',
      title: 'Seasonal Pattern Identified',
      description: `Revenue shows ${data.seasonality.strength} seasonal patterns. Plan inventory and marketing accordingly.`,
      metrics: [`${data.seasonality.strength} Seasonality`],
      action: 'View seasonal forecast',
    })
  }

  // AI recommendations
  if (data.recommendations?.length > 0) {
    // eslint-disable-next-line no-unused-vars
    data.recommendations.slice(0, 2).forEach((rec, index) => {
      insights.push({
        type: 'recommendation',
        title: rec.title,
        description: rec.description,
        metrics: rec.impact ? [rec.impact] : undefined,
        action: rec.action,
      })
    })
  }

  return insights.slice(0, 6) // Limit to 6 insights
}

const FinancialInsights = ({ data, loading = false, error = null, className }) => {
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Financial Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
                <div className="h-3 bg-gray-200 rounded animate-pulse w-full" />
                <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Financial Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">Error loading insights: {error.message}</p>
        </CardContent>
      </Card>
    )
  }

  const insights = generateInsights(data)

  if (insights.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Financial Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <ChartBarIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              No insights available. Data analysis is in progress.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <LightBulbIcon className="w-5 h-5" />
          <span>Financial Insights</span>
          <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
            AI-Powered
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {insights.map((insight, index) => (
            <InsightCard key={index} insight={insight} />
          ))}
        </div>
        {data?.lastUpdated && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Last updated: {new Date(data.lastUpdated).toLocaleString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default FinancialInsights

